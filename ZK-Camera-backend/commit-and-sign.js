const fs = require("fs");
const crypto = require("crypto");
const { buildPoseidon } = require("circomlibjs");

// ---- Helpers ----
function sha256Hex(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function hexToBigInt(hex) {
  if (hex.startsWith("0x")) hex = hex.slice(2);
  return BigInt("0x" + hex);
}

// ---- Core Function ----
// Produce Poseidon commitment over (imageHash, timestamp, stateCode, nonce)
// All returned big integers are decimal-encoded strings to be JSON-safe.
async function commitAndSign(photoPath, timestamp, stateCode) {
  // 1. Read image bytes
  const imageBytes = fs.readFileSync(photoPath);

  // 2. Image hash (SHA-256) -> hex
  const imageHashHex = sha256Hex(imageBytes);
  const imageHashBigInt = hexToBigInt(imageHashHex);

  // 3. Nonce (32 bytes) -> BigInt
  const nonceBuf = crypto.randomBytes(32);
  const nonceHex = nonceBuf.toString("hex");
  const nonceBigInt = hexToBigInt(nonceHex);

  // 4. Poseidon commitment
  const poseidon = await buildPoseidon();
  const F = poseidon.F;

  // Ensure timestamp and stateCode are BigInt
  const ts = BigInt(timestamp);
  const sc = BigInt(stateCode);

  const commitmentField = poseidon([
    imageHashBigInt,
    ts,
    sc,
    nonceBigInt,
  ]);

  const commitmentBigInt = F.toObject(commitmentField);

  // 5. Return human-friendly decimal string representations
  return {
    commitment: commitmentBigInt.toString(),
    _private: {
      imageHash: imageHashBigInt.toString(),
      timestamp: ts.toString(),
      stateCode: sc.toString(),
      nonce: nonceBigInt.toString(),
    },
  };
}

module.exports = { commitAndSign };
