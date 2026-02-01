ZK-Camera: Zero-Knowledge Proof of Image Authenticity
Overview

ZK-Camera is a proof-of-concept system that demonstrates how zero-knowledge proofs (ZKPs) can be used to prove the authenticity of an image at capture time without revealing the image or its metadata.

The core idea is to generate a cryptographic commitment to an image and its metadata, and later allow a verifier to check—via a Groth16 zero-knowledge proof—that the commitment was correctly formed, without learning any private information.

This project focuses on correct ZK lifecycle design, witness privacy, and end-to-end system integration.

Problem Statement

Digital images are easy to copy, modify, and redistribute.
In many applications (journalism, surveillance, forensics, research), it is important to answer:

“Can we prove that an image is authentic, without revealing the image itself?”

Traditional solutions require revealing:

the image

metadata (timestamp, device info)

or trusting a centralized authority

This project explores a privacy-preserving alternative using zero-knowledge proofs.

Core Claim

A prover can convince a verifier that an image hash and its metadata were committed correctly at capture time, without revealing the image or metadata.

This project does not attempt deepfake detection.
It focuses purely on cryptographic provenance.

High-Level Architecture
<img width="1024" height="1536" alt="image" src="https://github.com/user-attachments/assets/1c933f64-0595-455c-852b-dfaa5de201eb" />

Cryptographic Design
Commitment Scheme

Hash function: Poseidon (ZK-friendly)

Inputs (private):

SHA-256(image)

SHA-256(metadata)

Random nonce

Output (public):

Poseidon(imageHash, metadataHash, nonce)

Zero-Knowledge Proof

Circuit language: Circom

Proof system: Groth16

Curve: BN128

Public input: commitment

Private inputs: image hash, metadata hash, nonce

The proof asserts:

“I know private values that hash to this public commitment.”

Circuit (commitment.circom)
pragma circom 2.1.8;

include "circomlib/poseidon.circom";

template CommitmentProof() {
    signal input imageHash;
    signal input metadataHash;
    signal input nonce;
    signal input commitment;

    component poseidon = Poseidon(3);

    poseidon.inputs[0] <== imageHash;
    poseidon.inputs[1] <== metadataHash;
    poseidon.inputs[2] <== nonce;

    commitment === poseidon.out;
}

component main { public [commitment] } = CommitmentProof();


How the System Works (Step-by-Step)
1. Image Upload

User uploads an image via the frontend.

Image never leaves the backend after processing.

2. Commitment Generation (Backend)

Extract EXIF metadata.

Compute:

imageHash = SHA256(image)

metadataHash = SHA256(metadata)

nonce = random

Compute Poseidon commitment.

3. Proof Generation (Backend)

Witness is created immediately.

Groth16 proof is generated using snarkjs.

Proof and public commitment are returned.

4. Verification

Verifier checks the proof against the public commitment.

No private data is revealed.

How to Run the Project
Prerequisites

Node.js ≥ 18

npm

circom 2.1.8

snarkjs

1️ Compile the Circuit
cd zk
mkdir -p build

circom circuits/commitment.circom \
  --r1cs \
  --wasm \
  --sym \
  -o build

2️  Groth16 Setup
snarkjs groth16 setup \
  build/commitment.r1cs \
  pot12_final.ptau \
  commitment_0000.zkey

snarkjs zkc commitment_0000.zkey commitment_final.zkey
snarkjs zkev commitment_final.zkey verification_key.json

3️  Run Backend
cd ZK-Camera-backend
npm install
node server.js


Backend runs at:

http://localhost:4000

4️  Run Frontend
cd frontend
npm install
npm run dev


Open browser at:

http://localhost:5173

Security & Design Notes

Private inputs (witness) never leave the backend.

Frontend never imports snarkjs or runs cryptography.

Groth16 trusted setup is acknowledged.

This is a demonstration system, not production-hardened.

Limitations

Trusted setup required (Groth16).

No timestamp oracle integration.

No on-chain verification.

No protection against camera-side compromise.

Future Work

Timestamp commitments

On-chain verification (Ethereum / Starknet)

PLONK or transparent proof systems

Recursive proofs for media chains

Adversarial metadata models

Motivation

This project was built to explore:

privacy-preserving provenance

zero-knowledge system design

cryptographic correctness beyond tutorials

It is intended as a research-oriented learning project.

Author

Sunny
B.Tech CSE
Interests: Cryptography, Zero-Knowledge Proofs, Secure Systems
