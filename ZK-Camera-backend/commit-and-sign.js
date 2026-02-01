const fs = require("fs");
const crypto = require("crypto");
const nacl = require("tweetnacl");
const { buildPoseidon } = require("circomlibjs");

// ------Helpers ----------

// SHA-256 hash
function sha256Hash(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

// Canonical JSON (VERY IMPORTANT)
function canonicalJSON(obj) {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

// Hex → BigInt
function hexToBigInt(hex) {
  if (hex.startsWith("0x")) hex = hex.slice(2);
  return BigInt("0x" + hex);
}

// BigInt → hex (no 0x)
function bigIntToHexNoPrefix(bn) {
  let hex = bn.toString(16);
  if (hex.length % 2) hex = "0" + hex;
  return hex;
}

// ---- Core Function ----------

async function commitAndSign(photoPath, metadata) {
  // 1. Read image
  const imageBytes = fs.readFileSync(photoPath);

  // 2. Hash image + metadata (OFF-CIRCUIT)
  const imageHashHex = sha256Hash(imageBytes);
  const metadataHashHex = sha256Hash(canonicalJSON(metadata));

  // 3. Generate nonce (CRITICAL)
  const nonce = crypto.randomBytes(32);
  const nonceHex = nonce.toString("hex");

  // 4. Poseidon commitment
  const poseidon = await buildPoseidon();
  const F = poseidon.F;

  const commitmentField = poseidon([
    hexToBigInt(imageHashHex),
    hexToBigInt(metadataHashHex),
    hexToBigInt(nonceHex),
  ]);

  const commitmentBigInt = F.toObject(commitmentField);
  const commitmentHex = bigIntToHexNoPrefix(commitmentBigInt);

  // 5. Optional authenticity signature (NOT ZK)
  const seed = crypto.randomBytes(32);
  const keypair = nacl.sign.keyPair.fromSeed(seed);
  const signature = nacl.sign.detached(
    Buffer.from(commitmentHex, "hex"),
    keypair.secretKey
  );

  //  PRIVATE DATA (store securely, NOT returned publicly)
  const privateData = {
    imageHashHex,
    metadataHashHex,
    nonceHex,
  };

  //  PUBLIC DATA (safe to share)
  return {
    commitmentHex,
    signatureHex: Buffer.from(signature).toString("hex"),
    publicKeyHex: Buffer.from(keypair.publicKey).toString("hex"),
    _private: privateData, // REMOVE THIS IN PROD (for now debugging only)
  };
}

module.exports = { commitAndSign };
