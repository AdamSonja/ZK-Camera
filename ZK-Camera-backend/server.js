const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const exifr = require("exifr");
const snarkjs = require("snarkjs");
const { MongoClient } = require("mongodb");

const { commitAndSign } = require("./commit-and-sign");

const app = express();
const upload = multer({ dest: "uploads/" });
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ---------- ZK PATHS (defaults, override with env) ----------
const WASM_PATH = process.env.WASM_PATH || path.resolve(__dirname, "../zk/build/commitment_query_js/commitment_query.wasm");
const ZKEY_PATH = process.env.ZKEY_PATH || path.resolve(__dirname, "../zk/commitment_query_final.zkey");
let VK_PATH = process.env.VK_PATH || path.resolve(__dirname, "../zk/verification_key_commitment_query.json");

// fallback: if that verification key doesn't exist, use existing verification_key.json
if (!fs.existsSync(VK_PATH)) {
  const fallback = path.resolve(__dirname, "../zk/verification_key.json");
  if (fs.existsSync(fallback)) VK_PATH = fallback;
}

// sanity
console.log("WASM exists:", fs.existsSync(WASM_PATH));
console.log("ZKEY exists:", fs.existsSync(ZKEY_PATH));
console.log("VK exists:", fs.existsSync(VK_PATH));

// ---------- State codes (canonical mapping) ----------
const STATE_CODES_PATH = path.resolve(__dirname, "../zk/state_codes.json");
let STATE_CODES = {};
if (fs.existsSync(STATE_CODES_PATH)) {
  STATE_CODES = JSON.parse(fs.readFileSync(STATE_CODES_PATH, "utf8"));
}

function lookupStateCode(name) {
  if (!name) return null;
  // try direct match, then case-insensitive
  if (STATE_CODES[name]) return STATE_CODES[name];
  const key = Object.keys(STATE_CODES).find(k => k.toLowerCase() === name.toLowerCase());
  return key ? STATE_CODES[key] : null;
}

// ---------- MongoDB (store private witness values) ----------
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const MONGO_DB = process.env.MONGO_DB || "zk_camera";
const MONGO_COLLECTION = process.env.MONGO_COLLECTION || "witnesses";

let dbClient;
let witnessesCol;

async function connectMongo() {
  dbClient = new MongoClient(MONGO_URI, { useUnifiedTopology: true });
  await dbClient.connect();
  const db = dbClient.db(MONGO_DB);
  witnessesCol = db.collection(MONGO_COLLECTION);
  // index on commitment for fast lookup
  await witnessesCol.createIndex({ commitment: 1 }, { unique: true });
  console.log("Connected to MongoDB", MONGO_URI, "DB:", MONGO_DB);
}

connectMongo().catch(err => {
  console.error("MongoDB connection failed:", err);
  process.exit(1);
});

// Helper: normalize timestamp from EXIF Date objects or strings
function normalizeTimestamp(metadata, body) {
  // Allow override from form field body.timestamp (seconds or ISO)
  if (body && body.timestamp) {
    const asNum = Number(body.timestamp);
    if (!Number.isNaN(asNum)) return Math.floor(asNum);
    const d = new Date(body.timestamp);
    if (!Number.isNaN(d.getTime())) return Math.floor(d.getTime() / 1000);
  }

  // Try EXIF fields (exifr commonly returns Date objects on DateTimeOriginal)
  const candidates = [metadata && (metadata.DateTimeOriginal || metadata.CreateDate || metadata.ModifyDate || metadata.DateTime)];
  for (const c of candidates) {
    if (!c) continue;
    const d = (c instanceof Date) ? c : new Date(c);
    if (!Number.isNaN(d.getTime())) return Math.floor(d.getTime() / 1000);
  }
  return null;
}

// Helper: determine state code from EXIF or request body
function determineStateCode(metadata, body) {
  // Override from form field
  if (body && body.state) {
    const code = lookupStateCode(body.state);
    if (code) return code;
  }

  // Try common EXIF fields (may not exist in typical camera EXIF)
  const possible = [metadata && metadata.State, metadata && metadata.Province, metadata && metadata.City, metadata && metadata.Location];
  for (const p of possible) {
    if (!p) continue;
    const code = lookupStateCode(p);
    if (code) return code;
  }

  // If GPS coords are available, server cannot reliably map to state without geodata.
  // We explicitly do NOT perform online reverse geocoding here for privacy and reproducibility.
  return null;
}

// ---------- UPLOAD: accept photo, normalize metadata, compute commitment, store witness ----------
app.post("/upload", upload.single("photo"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "No image uploaded" });
  }

  try {
    const metadata = await exifr.parse(req.file.path).catch(() => null);

    const timestamp = normalizeTimestamp(metadata, req.body);
    if (timestamp === null) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: "Could not determine timestamp from EXIF; please provide 'timestamp' in the upload form (ISO or seconds)." });
    }

    const stateCode = determineStateCode(metadata, req.body);
    if (!stateCode) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: "Could not determine state from EXIF; please provide 'state' (state name) in the upload form." });
    }

    // Compute commitment and private witness values
    const result = await commitAndSign(req.file.path, timestamp, stateCode);

    // Store private witness in DB: NEVER expose these values in responses
    const witnessDoc = {
      commitment: result.commitment.toString(), // decimal string
      imageHash: result._private.imageHash.toString(),
      timestamp: Number(result._private.timestamp),
      stateCode: Number(result._private.stateCode),
      nonce: result._private.nonce.toString(),
      createdAt: new Date(),
    };

    await witnessesCol.insertOne(witnessDoc);

    // Remove uploaded file bytes from server storage
    fs.unlinkSync(req.file.path);

    // Return only the commitment to the client (decimal string)
    return res.json({ success: true, commitment: result.commitment.toString() });
  } catch (err) {
    console.error(err);
    try { if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch(e){}
    return res.status(500).json({ success: false, error: "Upload failed" });
  }
});

// ---------- PROVE: server-side witness generation & proving ----------
app.post("/prove/query", async (req, res) => {
  try {
    const { commitment, minTimestamp, maxTimestamp, expectedState } = req.body;
    if (!commitment || minTimestamp === undefined || maxTimestamp === undefined || expectedState === undefined) {
      return res.status(400).json({ success: false, error: "Missing required fields: commitment, minTimestamp, maxTimestamp, expectedState" });
    }

    // Lookup private witness by commitment
    const witness = await witnessesCol.findOne({ commitment: commitment.toString() });
    if (!witness) {
      return res.status(404).json({ success: false, error: "Commitment not found" });
    }

    // Build circuit input, using decimal strings for BigInt values
    const input = {
      commitment: commitment.toString(),
      minTimestamp: minTimestamp.toString(),
      maxTimestamp: maxTimestamp.toString(),
      expectedState: expectedState.toString(),
      imageHash: witness.imageHash.toString(),
      timestamp: witness.timestamp.toString(),
      stateCode: witness.stateCode.toString(),
      nonce: witness.nonce.toString(),
    };

    // Run the full prove flow (witness + groth16 prove) server-side
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, WASM_PATH, ZKEY_PATH);

    return res.json({ success: true, proof, publicSignals });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Proof generation failed" });
  }
});

// ---------- VERIFY: accept proof + publicSignals, verify, return boolean validity ----------
app.post("/verify/query", async (req, res) => {
  try {
    const { proof, publicSignals } = req.body;
    if (!proof || !publicSignals) return res.status(400).json({ success: false, error: "Missing proof or publicSignals" });

    const verificationKey = JSON.parse(fs.readFileSync(VK_PATH, "utf-8"));

    const ok = await snarkjs.groth16.verify(verificationKey, publicSignals, proof);
    if (!ok) {
      return res.status(400).json({ success: false, error: "Invalid proof / proof not authentic" });
    }

    // Extract the public boolean 'valid' from publicSignals.
    // publicSignals ordering depends on the compiled circuit; for this circuit the first public is 'valid'.
    const validSignal = publicSignals && publicSignals.length > 0 ? publicSignals[0] : undefined;
    const valid = validSignal && (validSignal.toString() === '1' || validSignal === 1);

    return res.json({ success: true, valid: !!valid });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Verification failed" });
  }
});

// legacy verify endpoint (kept for compatibility)
app.post("/verify", async (req, res) => {
  try {
    const { proof, publicSignals } = req.body;
    const verificationKey = JSON.parse(fs.readFileSync(VK_PATH, "utf-8"));
    const verified = await snarkjs.groth16.verify(verificationKey, publicSignals, proof);
    res.json({ success: true, verified });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Verification failed" });
  }
});

app.listen(PORT, () => console.log(`ZK-Camera backend running on port ${PORT}`));
