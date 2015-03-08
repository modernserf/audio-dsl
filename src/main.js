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
            dest.setValueAtTime(v, audioCtx.currentTime + 1);
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
    let _notes = ['A','Bb','B','C','Db','D','Eb','E','F','Gb','G','Ab']
        .map((n,i) => {
            return {
                id: n,
                freq: toNote(27.5, 1)(i/12)
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
console.log(notes);

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
    const freqs = sequence.map((x) => {
        const n = x.match(/\D+/)[0];
        const o = Number(x.match(/\d+/)[0]);

        console.log(x,n,o);

        return notes[n] * o;
    });

    console.log(freqs);

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

document.addEventListener('DOMContentLoaded', () => {
    const pad = XYPad(document.getElementById('xy-pad'));

    const clock = Clock({bpm: 120, division: 16});
    const seq = Sequencer({sequence: ['A4','C4','D4','E4'], trig: clock.trig});

    const seqOctave = seq.freq.map(x => x / 2);

    // seq.freq.onUpdate(x => console.log('seq',x));

    const cutoff =  pad.y.map(toNote(100, 10));
    const gain = pad.x;

    getOutput(() => {
        const osc1 = Osc({type: "sawtooth",frequency: seq.freq});
        const osc2 = Osc({type: "sawtooth",frequency: seqOctave , detune: 20});

        return Mixer({channels: [[osc1, 1],[osc2, 1]]})
            .connect(VCF({type: "lowpass", cutoff: cutoff, resonance: 0.5}))
            .connect(VCA({gain: gain}));
    });

});


