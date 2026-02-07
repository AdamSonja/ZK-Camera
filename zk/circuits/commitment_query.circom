// Commitment + Queryable Metadata Circuit
// Prover private inputs: imageHash, timestamp, stateCode, nonce
// Verifier-controlled public inputs: commitment, minTimestamp, maxTimestamp, expectedState
// Public output: valid (1 if timestamp in range AND state matches, 0 otherwise)
// The circuit enforces that Poseidon([imageHash, timestamp, stateCode, nonce]) == commitment.

pragma circom 2.0.0;

include "./circomlib/poseidon.circom";
include "./circomlib/comparators.circom";

// NOTE: choose bit widths large enough for expected ranges.
// UNIX timestamps (seconds) fit in 64 bits safely. State codes are small (e.g., <256) but
// we compare equality so bit width is not critical.

template CommitmentWithQueries() {
    // Public inputs (verifier controlled or provided alongside the proof)
    signal input commitment;      // Poseidon commitment (field element)
    signal input minTimestamp;    // verifier: lower bound (inclusive)
    signal input maxTimestamp;    // verifier: upper bound (inclusive)
    signal input expectedState;   // verifier: integer code for an Indian state

    // Private witness inputs (prover only)
    signal input imageHash;       // integer representation of image hash (e.g., SHA256 mod F)
    signal input timestamp;       // UNIX epoch seconds
    signal input stateCode;       // integer mapping of Indian state
    signal input nonce;           // random nonce used when committing

    // Recompute commitment using Poseidon(imageHash, timestamp, stateCode, nonce)
    component pose = Poseidon(4);
    pose.inputs[0] <== imageHash;
    pose.inputs[1] <== timestamp;
    pose.inputs[2] <== stateCode;
    pose.inputs[3] <== nonce;

    // Enforce commitment correctness (strict). If this fails, the proof is unsatisfiable.
    pose.out === commitment;

    // Timestamp range checks (use 64 bits for timestamps)
    component geMin = GreaterEqThan(64);
    component leMax = LessEqThan(64);

    geMin.in[0] <== timestamp;
    geMin.in[1] <== minTimestamp;

    leMax.in[0] <== timestamp;
    leMax.in[1] <== maxTimestamp;

    // state equality: produce 1 when equal
    component isz = IsZero();
    isz.in <== stateCode - expectedState;

    // Combine booleans: each comparator produces 0/1
    signal timestamp_in_range;
    timestamp_in_range <== geMin.out * leMax.out;

    signal state_matches;
    state_matches <== isz.out;

    // Final public boolean: 1 if both checks hold, 0 otherwise.
    signal output valid;
    valid <== timestamp_in_range * state_matches;

    // Optionally: add a constraint that valid is boolean (0 or 1)
    valid*(valid-1) === 0;
}

component main = CommitmentWithQueries();
