const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const exifr = require("exifr");
const snarkjs = require("snarkjs");

const { commitAndSign } = require("./commit-and-sign");

const app = express();
const upload = multer({ dest: "uploads/" });
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ---------- ZK PATHS (ABSOLUTE) ----------

const WASM_PATH = path.resolve(
  __dirname,
  "../zk/build/commitment_js/commitment.wasm"
);

const ZKEY_PATH = path.resolve(
  __dirname,
  "../zk/commitment_final.zkey"
);

const VK_PATH = path.resolve(
  __dirname,
  "../zk/verification_key.json"
);

// ---------- STARTUP CHECK ----------

console.log("WASM exists:", fs.existsSync(WASM_PATH));
console.log("ZKEY exists:", fs.existsSync(ZKEY_PATH));
console.log("VK exists:", fs.existsSync(VK_PATH));

// ---------- 1. UPLOAD & COMMIT ----------

app.post("/upload", upload.single("photo"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "No image uploaded",
    });
  }

  try {
    const metadata = await exifr.parse(req.file.path);
    const result = await commitAndSign(req.file.path, metadata);

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      commitment: result.commitmentHex,
      publicKey: result.publicKeyHex,
      signature: result.signatureHex,
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({
      success: false,
      error: "Upload failed",
    });
  }
});

// ---------- 2. GENERATE PROOF (CLI-EQUIVALENT FLOW) ----------

app.post("/generate-proof", async (req, res) => {
  try {
    const { imageHash, metadataHash, nonce, commitment } = req.body;

    if (!imageHash || !metadataHash || !nonce || !commitment) {
      return res.status(400).json({
        success: false,
        error: "Missing ZK inputs",
      });
    }

    const input = {
      imageHash,
      metadataHash,
      nonce,
      commitment,
    };

    // 🔑 THIS IS THE MOST STABLE METHOD (same as CLI fullprove)
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      WASM_PATH,
      ZKEY_PATH
    );

    res.json({
      success: true,
      proof,
      publicSignals,
    });
  } catch (err) {
    console.error("========== ZK PROOF ERROR ==========");
    console.error(err);
    console.error(err.message);
    console.error(err.stack);
    console.error("===================================");

    res.status(500).json({
      success: false,
      error: err.message || "ZK proof generation failed",
    });
  }
});

// ---------- 3. VERIFY PROOF ----------

app.post("/verify", async (req, res) => {
  try {
    const { proof, publicSignals } = req.body;

    if (!proof || !publicSignals) {
      return res.status(400).json({
        success: false,
        error: "Missing proof or public signals",
      });
    }

    const verificationKey = JSON.parse(
      fs.readFileSync(VK_PATH, "utf-8")
    );

    const verified = await snarkjs.groth16.verify(
      verificationKey,
      publicSignals,
      proof
    );

    res.json({
      success: true,
      verified,
    });
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json({
      success: false,
      error: "Verification failed",
    });
  }
});

app.listen(PORT, () => {
});
console.log(` ZK-Camera backend running on port ${PORT}`);
