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
    newState.publish();
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

document.addEventListener('DOMContentLoaded', ()=> {
    let pad = document.getElementById('xy-pad');

    let freq = ValueState.create(220);
    let gain = ValueState.create(0);

    getOutput(()=> {
        const osc1 = Osc({type: "sawtooth",frequency: freq});
        const osc2 = Osc({type: "sawtooth",frequency: freq, detune: 20});

        return Mixer({channels: [[osc1, 1],[osc2, 1]]})
            .connect(VCF({type: "lowpass", cutoff: 2000, resonance: 0.5}))
            .connect(VCA({gain: gain}));
    });

    pad.addEventListener('scroll', (e)=> {
        const { scrollTop, scrollLeft } = e.target;

        console.log(scrollTop,scrollLeft);

        freq.set(220 +  220 * scrollTop/300);
        gain.set(scrollLeft/300);
    });
});








