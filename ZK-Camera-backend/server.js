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

// ---------- ZK PATHS ----------
const WASM_PATH =
  process.env.WASM_PATH ||
  path.resolve(__dirname, "../zk/build/commitment_query_js/commitment_query.wasm");

const ZKEY_PATH =
  process.env.ZKEY_PATH ||
  path.resolve(__dirname, "../zk/commitment_query_final.zkey");

let VK_PATH =
  process.env.VK_PATH ||
  path.resolve(__dirname, "../zk/verification_key_commitment_query.json");

if (!fs.existsSync(VK_PATH)) {
  const fallback = path.resolve(__dirname, "../zk/verification_key.json");
  if (fs.existsSync(fallback)) VK_PATH = fallback;
}

console.log("WASM exists:", fs.existsSync(WASM_PATH));
console.log("ZKEY exists:", fs.existsSync(ZKEY_PATH));
console.log("VK exists:", fs.existsSync(VK_PATH));

// ---------- MongoDB ----------
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const MONGO_DB = process.env.MONGO_DB || "zk_camera";
const MONGO_COLLECTION = process.env.MONGO_COLLECTION || "witnesses";

let dbClient;
let witnessesCol;

async function connectMongo() {
  dbClient = new MongoClient(MONGO_URI);
  await dbClient.connect();
  const db = dbClient.db(MONGO_DB);
  witnessesCol = db.collection(MONGO_COLLECTION);
  await witnessesCol.createIndex({ commitment: 1 }, { unique: true });
  console.log("Connected to MongoDB");
}

connectMongo().catch((err) => {
  console.error("MongoDB connection failed:", err);
  process.exit(1);
});

// ---------- STRICT TIMESTAMP EXTRACTION ----------
function extractTimestamp(metadata) {
  if (!metadata) return null;

  const candidate =
    metadata.DateTimeOriginal ||
    metadata.CreateDate ||
    metadata.ModifyDate ||
    metadata.DateTime;

  if (!candidate) return null;

  const d = candidate instanceof Date ? candidate : new Date(candidate);
  if (Number.isNaN(d.getTime())) return null;

  return Math.floor(d.getTime() / 1000);
}

// ---------- GPS → STATE MAPPING (ALL 28 STATES) ----------
function mapGPSToState(metadata) {
  if (!metadata || metadata.latitude == null || metadata.longitude == null) {
    return null;
  }

  const lat = metadata.latitude;
  const lon = metadata.longitude;

  if (lat >= 12.6 && lat <= 19.9 && lon >= 76.7 && lon <= 84.8) return 1;  // Andhra Pradesh
  if (lat >= 26.6 && lat <= 29.4 && lon >= 91.2 && lon <= 97.4) return 2;  // Arunachal Pradesh
  if (lat >= 24.0 && lat <= 27.9 && lon >= 89.7 && lon <= 96.0) return 3;  // Assam
  if (lat >= 24.0 && lat <= 27.5 && lon >= 83.3 && lon <= 88.1) return 4;  // Bihar
  if (lat >= 17.8 && lat <= 24.1 && lon >= 80.2 && lon <= 84.4) return 5;  // Chhattisgarh
  if (lat >= 14.9 && lat <= 15.8 && lon >= 73.6 && lon <= 74.2) return 6;  // Goa
  if (lat >= 20.1 && lat <= 24.7 && lon >= 68.1 && lon <= 74.5) return 7;  // Gujarat
  if (lat >= 27.6 && lat <= 30.9 && lon >= 74.5 && lon <= 77.6) return 8;  // Haryana
  if (lat >= 30.3 && lat <= 33.2 && lon >= 75.6 && lon <= 79.1) return 9;  // Himachal Pradesh
  if (lat >= 21.9 && lat <= 25.3 && lon >= 83.3 && lon <= 87.9) return 10; // Jharkhand
  if (lat >= 8.4  && lat <= 18.9 && lon >= 74.0 && lon <= 78.6) return 11; // Karnataka
  if (lat >= 8.1  && lat <= 12.8 && lon >= 74.8 && lon <= 77.4) return 12; // Kerala
  if (lat >= 21.0 && lat <= 26.9 && lon >= 74.0 && lon <= 82.8) return 13; // Madhya Pradesh
  if (lat >= 15.6 && lat <= 22.1 && lon >= 72.6 && lon <= 80.9) return 14; // Maharashtra
  if (lat >= 23.8 && lat <= 25.7 && lon >= 93.0 && lon <= 94.8) return 15; // Manipur
  if (lat >= 25.0 && lat <= 26.1 && lon >= 89.8 && lon <= 92.8) return 16; // Meghalaya
  if (lat >= 21.9 && lat <= 24.5 && lon >= 92.2 && lon <= 93.5) return 17; // Mizoram
  if (lat >= 25.2 && lat <= 27.0 && lon >= 93.5 && lon <= 95.3) return 18; // Nagaland
  if (lat >= 17.8 && lat <= 22.6 && lon >= 81.4 && lon <= 87.5) return 19; // Odisha
  if (lat >= 29.5 && lat <= 32.5 && lon >= 73.8 && lon <= 76.9) return 20; // Punjab
  if (lat >= 23.0 && lat <= 30.2 && lon >= 69.3 && lon <= 78.3) return 21; // Rajasthan
  if (lat >= 27.0 && lat <= 28.1 && lon >= 88.0 && lon <= 88.9) return 22; // Sikkim
  if (lat >= 8.0  && lat <= 13.5 && lon >= 76.0 && lon <= 80.3) return 23; // Tamil Nadu
  if (lat >= 15.8 && lat <= 19.9 && lon >= 77.2 && lon <= 81.0) return 24; // Telangana
  if (lat >= 22.9 && lat <= 24.6 && lon >= 91.1 && lon <= 92.3) return 25; // Tripura
  if (lat >= 23.8 && lat <= 30.4 && lon >= 77.1 && lon <= 84.6) return 26; // Uttar Pradesh
  if (lat >= 28.7 && lat <= 31.5 && lon >= 77.6 && lon <= 81.0) return 27; // Uttarakhand
  if (lat >= 21.5 && lat <= 27.2 && lon >= 85.8 && lon <= 89.9) return 28; // West Bengal

  return null;
}

// ---------- UPLOAD ----------
app.post("/upload", upload.single("photo"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "No image uploaded" });
  }

  try {
    const metadata = await exifr.parse(req.file.path).catch(() => null);

    const timestamp = extractTimestamp(metadata);
    if (timestamp === null) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        error: "EXIF timestamp missing. Upload raw camera image."
      });
    }

    const stateCode = mapGPSToState(metadata);
    if (!stateCode) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        error: "GPS metadata missing or unsupported region."
      });
    }

    const result = await commitAndSign(req.file.path, timestamp, stateCode);

    const witnessDoc = {
      commitment: result.commitment,
      imageHash: result._private.imageHash,
      timestamp: Number(result._private.timestamp),
      stateCode: Number(result._private.stateCode),
      nonce: result._private.nonce,
      createdAt: new Date(),
    };

    await witnessesCol.insertOne(witnessDoc);
    fs.unlinkSync(req.file.path);

    return res.json({
      success: true,
      commitment: result.commitment
    });

  } catch (err) {
    console.error(err);
    try {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch {}
    return res.status(500).json({ success: false, error: "Upload failed" });
  }
});

// ---------- PROVE ----------
app.post("/prove/query", async (req, res) => {
  try {
    const { commitment, minTimestamp, maxTimestamp, expectedState } = req.body;

    const witness = await witnessesCol.findOne({ commitment: commitment.toString() });
    if (!witness) {
      return res.status(404).json({ success: false, error: "Commitment not found" });
    }

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

    const { proof, publicSignals } =
      await snarkjs.groth16.fullProve(input, WASM_PATH, ZKEY_PATH);

    return res.json({ success: true, proof, publicSignals });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Proof generation failed" });
  }
});

// ---------- VERIFY ----------
app.post("/verify/query", async (req, res) => {
  try {
    const { proof, publicSignals } = req.body;

    const verificationKey = JSON.parse(fs.readFileSync(VK_PATH, "utf-8"));
    const ok = await snarkjs.groth16.verify(verificationKey, publicSignals, proof);

    if (!ok) {
      return res.status(400).json({ success: false, error: "Invalid proof" });
    }

    const validSignal = publicSignals?.[0];
    const valid = validSignal?.toString() === "1";

    return res.json({ success: true, valid });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Verification failed" });
  }
});

app.listen(PORT, () => {
  console.log(`ZK-Camera backend running on port ${PORT}`);
});