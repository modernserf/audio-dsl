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

function Osc (params) {
    const node = audioCtx.createOscillator();
    node.type = params.type;
    // TODO: handle streams
    node.frequency.value = params.frequency;
    node.detune.value = params.detune || 0;
    node.start();

    return new NodeWrapper(node);
}

function VCF (params) {
    const node = audioCtx.createBiquadFilter();
    node.frequency.value = params.cutoff;
    node.Q.value = params.resonance;
    node.type = params.type;

    return new NodeWrapper(node);
}

function VCA (params) {
    const node = audioCtx.createGain();
    node.gain.value  = params.gain;

    return new NodeWrapper(node);
}

function Mixer (params) {
    const channels = params.channels;
    const out = audioCtx.createGain();

    channels.forEach((ch)=> {
        const [audio, level] = ch;
        const gain = audioCtx.createGain();
        gain.gain.value = level;

        audio.rawNode.connect(gain);
        gain.connect(out);
    });

    return new NodeWrapper(out);
}

getOutput(()=> {
    const osc1 = Osc({type: "sawtooth",frequency: 220});
    const osc2 = Osc({type: "sawtooth",frequency: 220, detune: 5});

    Mixer({channels: [[osc1, 1],[osc2, 1]]})
        .connect(VCF({type: "lowpass", cutoff: 2000, resonance: 0.5}))
        .connect(VCA({gain: 0.5}));
});










