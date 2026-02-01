const snarkjs = require("snarkjs");
const path = require("path");

// Absolute paths
const WASM_PATH = path.join(
  __dirname,
  "../../zk/build/commitment_js/commitment.wasm"
);

const ZKEY_PATH = path.join(
  __dirname,
  "../../zk/commitment_final.zkey"
);

/**
 * Generate Groth16 proof (snarkjs v0.7.5 compatible)
 */
async function generateProof(input) {
  // 1. Generate witness (CORRECT ORDER)
  const witness = await snarkjs.wtns.calculate(
    WASM_PATH,
    input
  );

  // 2. Generate proof
  const { proof, publicSignals } = await snarkjs.groth16.prove(
    ZKEY_PATH,
    witness
  );

  return { proof, publicSignals };
}

module.exports = { generateProof };
