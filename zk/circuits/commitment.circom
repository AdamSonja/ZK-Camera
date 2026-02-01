pragma circom 2.1.8;

include "../node_modules/circomlib/circuits/poseidon.circom";

template CommitmentProof() {
    signal input imageHash;
    signal input metadataHash;
    signal input nonce;

    signal input commitment;   // public input
    signal output pubCommitment;

    component poseidon = Poseidon(3);

    poseidon.inputs[0] <== imageHash;
    poseidon.inputs[1] <== metadataHash;
    poseidon.inputs[2] <== nonce;

    commitment === poseidon.out;
    pubCommitment <== commitment;
}

component main = CommitmentProof();
