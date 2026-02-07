ZK-Camera: Zero-Knowledge Proof of Image Authenticity
Overview

ZK-Camera is a research-oriented proof-of-concept system that demonstrates how Zero-Knowledge Proofs (ZKPs) can be used to verify the cryptographic integrity and provenance of an image without revealing the image itself or its sensitive metadata.

The system allows a prover to commit to an image and normalized metadata, and later answer verifier-controlled queries (such as time range or location match) using a Groth16 zero-knowledge proof, revealing only a boolean result.

This project focuses on:

Correct zero-knowledge lifecycle design

Witness privacy and trust boundaries

End-to-end prover / verifier system architecture

⚠️ This is not a deepfake detection system and does not claim real-world capture-time truth.

Problem Statement

Digital images are trivial to copy, edit, and redistribute.

In domains such as journalism, surveillance, forensics, and research, a common requirement is to answer:

“Can we verify that an image is authentic and bound to some metadata,
without revealing the image or the metadata itself?”

Traditional approaches require at least one of the following:

Revealing the image

Revealing EXIF metadata

Trusting a centralized authority

This project explores a privacy-preserving alternative using zero-knowledge proofs.

Core Claim

A prover can convince a verifier that:

“An image and some hidden metadata were cryptographically committed together,
and the answer to a verifier’s query over that metadata is true or false,
without revealing the image or the metadata.”

The system proves consistency and non-tampering after commitment,
not real-world truth or capture-time authenticity.

High-Level Architecture

Cryptographic Design
Commitment Scheme

Hash function: Poseidon (ZK-friendly)

Private inputs (witness):

imageHash = SHA-256(image bytes)

timestamp = normalized UNIX epoch seconds

stateCode = integer mapping of Indian states

nonce = cryptographically secure random value

Public output:

commitment = Poseidon(imageHash, timestamp, stateCode, nonce)

The commitment binds the image and metadata together in a tamper-evident way.

Zero-Knowledge Proof

Circuit language: Circom

Proof system: Groth16

Curve: BN128

Public Inputs

commitment

Verifier-controlled query parameters:

minTimestamp

maxTimestamp

expectedState

Private Inputs (Witness)

imageHash

timestamp

stateCode

nonce

Public Output

valid ∈ {0, 1}

Circuit Logic
valid =
  (minTimestamp ≤ timestamp ≤ maxTimestamp)
  AND
  (stateCode == expectedState)


The proof always verifies if the witness is valid.
The truth value of the query is revealed only through valid, preventing metadata leakage via proof failure.

System Workflow
1. Image Upload (/upload)

User uploads an image

Backend:

Hashes image bytes

Extracts and normalizes metadata

Generates a random nonce

Computes Poseidon commitment

Private witness is stored in MongoDB

Only the commitment is returned

2. Query-Driven Proof Generation (/prove/query)

Verifier specifies a query (time range, state)

Backend:

Loads private witness using the commitment

Generates a Groth16 proof for that query

Returns:

proof

publicSignals (contains valid)

3. Verification (/verify/query)

Verifier submits:

proof

publicSignals

Cryptographic verification is performed

Result:

{ valid: true }

{ valid: false }

or "Invalid proof / proof not authentic"

Verification Path

The authoritative end-to-end verification flow is implemented entirely in the backend:

/upload → /prove/query → /verify/query


This flow is fully testable via Postman.

<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/01d6803d-71e9-45aa-8c72-a6140c1d4f6b" />


The frontend acts as a visualization layer and does not affect cryptographic correctness.

Security & Design Notes

Private witness data never leaves the backend

Frontend never performs cryptographic operations

Proof generation is strictly server-side

Groth16 trusted setup is explicitly acknowledged

Proof generation succeeds regardless of query outcome to preserve privacy

Limitations

Does not prove real-world capture-time truth

EXIF metadata can be forged before upload

Groth16 requires trusted setup

No on-chain verification

No protection against adaptive probing without rate-limits

Future Work

Capture-time attestations (camera-signed metadata)

Query rate-limiting and anti-probing defenses

On-chain verification (Ethereum / Starknet)

Transparent proof systems (PLONK)

Recursive proofs for media provenance chains

Motivation

This project was built to explore:

Privacy-preserving provenance

Correct zero-knowledge system design

End-to-end ZK integration beyond tutorials

It is intended as a research and learning project, not a production-ready system.

Author

Sunny
B.Tech CSE
Interests: Cryptography, Zero-Knowledge Proofs, Secure Systems
