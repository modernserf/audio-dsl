"use strict";
// create web audio api context
var audioCtx = new window.AudioContext();

function getOutput (fn) {
    const out = fn && fn();

    if (out){
        out.rawNode.connect(audioCtx.destination);
    }
}

class NodeWrapper {
    constructor (node) {
        this.rawNode = node;
    }
    connect (nodeWrapper) {
        this.rawNode.connect(nodeWrapper.rawNode);
        return nodeWrapper;
    }
}

class ValueState {
    constructor (params) {
        this.value = params.value;
        this.listeners = params.listeners;
    }
    onUpdate (fn) {
        this.listeners.push(fn);
    }
    map (fn) {
        let mapper = new ValueState({
            value: this.value,
            listeners: []
        });

        this.onUpdate((v) => mapper.set(fn(v)));
        return mapper;
    }
    set (value) {
        this.value = value;
        this.publish();
    }
    publish () {
        this.listeners.forEach((l) => {
            l(this.value);
        });
    }
}

ValueState.create = (value) => {
    const newState = new ValueState({
        value: value,
        listeners: []
    });
    return newState;
};

const link = (src, dest) => {
    if (src instanceof ValueState) {
        dest.value = src.value;
        src.onUpdate((v) => {
            dest.value = v;
        });
    } else {
        dest.value = src;
    }
};

function Osc (params) {
    const node = audioCtx.createOscillator();
    node.type = params.type;

    link(params.frequency, node.frequency);
    link(params.detune || 0, node.detune);

    node.start();

    return new NodeWrapper(node);
}

function VCF (params) {
    const node = audioCtx.createBiquadFilter();

    node.type = params.type;
    link(params.cutoff, node.frequency);
    link(params.resonance, node.Q);

    return new NodeWrapper(node);
}

function VCA (params) {
    const node = audioCtx.createGain();
    link(params.gain, node.gain);

    return new NodeWrapper(node);
}

function Mixer (params) {
    const channels = params.channels;
    const out = audioCtx.createGain();

    channels.forEach((ch)=> {
        const [audio, level] = ch;
        const gain = audioCtx.createGain();
        link(level, gain.gain);

        audio.rawNode.connect(gain);
        gain.connect(out);
    });

    return new NodeWrapper(out);
}

const toNote = (low, octaves) => (value) => {
    return low * Math.pow(2, octaves * value);
};

const notes = (()=> {
    let _notes = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']
        .map((n,i) => {
            return {
                id: n,
                freq: toNote(32.7032, 1)(i/12)
            };
        }).reduce((coll,x) => {
            coll[x.id] = x.freq;
            return coll;
        },{});

    _notes['A#'] = _notes.Bb;
    _notes['C#'] = _notes.Db;
    _notes['D#'] = _notes.Eb;
    _notes['F#'] = _notes.Gb;
    _notes['G#'] = _notes.Ab;
    return _notes;
})();

const noteNameToPitch = (x) => {
    const n = x.match(/\D+/)[0];
    const o = Number(x.match(/\d+/)[0]);

    return notes[n] * Math.pow(2, o);
};

function Clock (params) {
    // BPM: beats per minute
    // division: clock division, e.g. 1 - whole note; 16 - sixteenth note
    const { bpm, division } = params;

    const ms = 60000 / (division * bpm/4);

    let outs = {
        trig: ValueState.create()
    };

    const updateLoop = () => {
        outs.trig.set(null);
        window.setTimeout(updateLoop,ms);
    };

    updateLoop();

    return outs;
}

function Sequencer (params) {
    const { sequence, trig } = params;

    // todo: sequence type
    const freqs = sequence.map(noteNameToPitch);

    let i = 0;

    let outs = {
        freq: ValueState.create()
    };

    trig.onUpdate(() => {
        outs.freq.set(freqs[i]);
        i = (i + 1) % freqs.length;
    });

    return outs;
}

function XYPad (pad) {
    let outs = {
        x: ValueState.create(0),
        y: ValueState.create(0)
    };

    const range = 300;
    pad.addEventListener('scroll', (e)=> {
        const { scrollTop, scrollLeft } = e.target;
        outs.x.set(scrollLeft/range);
        outs.y.set(scrollTop/range);
    });
    return outs;
}

function Keyboard (el) {
    let outs = {
        freq: ValueState.create(),
        gate: ValueState.create(0)
    };

    const keyMap = new Map([
        ['A','C4'],
        ['S','D4'],
        ['D','E4'],
        ['F','F4'],
        ['G','G4'],
        ['H','A4'],
        ['J','B4'],
        ['K','C5'],
        ['L','D5']
    ]);

    const noteOn = (key) => {
        const noteName = keyMap.get(key);
        if (!noteName){ return; }
        outs.freq.set(noteNameToPitch(noteName));
        outs.gate.set(1);
    };

    const noteOff = () => {
        outs.gate.set(0);
    };

    let noteStack = [];

    el.addEventListener('keydown', (e) => {
        if (!~noteStack.indexOf(e.keyCode)) {
            noteStack.push(e.keyCode);            
        }
        noteOn(String.fromCharCode(e.keyCode));
    });

    el.addEventListener('keyup', (e) => {
        const i = noteStack.indexOf(e.keyCode);
        if (~!i){
            noteStack.splice(i,1);
        }
        if (noteStack.length) {
            noteOn(String.fromCharCode(noteStack[noteStack.length - 1]));
        } else {
            noteOff();
        }        
    });

    return outs;
}

document.addEventListener('DOMContentLoaded', () => {
    const _keyboard = document.getElementById('keyboard');
    _keyboard.focus();
    const pad = XYPad(document.getElementById('xy-pad'));

    const key = Keyboard(_keyboard);

    const clock = Clock({bpm: 120, division: 16});
    // const seq = Sequencer({sequence: ['A4','C4','D4','E4'], trig: clock.trig});

    // const seqOctave = seq.freq.map(x => x / 2);

    const cutoff =  pad.y.map(toNote(100, 10));
    cutoff.set(100);
    const gain = pad.x;

    getOutput(() => {
        return Osc({type: "sawtooth",frequency: key.freq.map(x => x/2)})
            .connect(VCF({type: "lowpass", cutoff: cutoff, resonance: 0.5}))
            .connect(VCA({gain: key.gate}));
    });

});


