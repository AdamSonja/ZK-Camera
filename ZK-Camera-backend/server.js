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

// ---------- ZK PATHS ----------
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

// ---------- SANITY ----------
console.log("WASM exists:", fs.existsSync(WASM_PATH));
console.log("ZKEY exists:", fs.existsSync(ZKEY_PATH));
console.log("VK exists:", fs.existsSync(VK_PATH));

// ---------- UPLOAD + PROVE ----------
app.post("/upload", upload.single("photo"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "No image uploaded" });
  }

  try {
    const metadata = await exifr.parse(req.file.path);
    const result = await commitAndSign(req.file.path, metadata);

    const input = {
      imageHash: BigInt("0x" + result._private.imageHashHex).toString(),
      metadataHash: BigInt("0x" + result._private.metadataHashHex).toString(),
      nonce: BigInt("0x" + result._private.nonceHex).toString(),
      commitment: BigInt("0x" + result.commitmentHex).toString(),
    };

    const { proof, publicSignals } =
      await snarkjs.groth16.fullProve(input, WASM_PATH, ZKEY_PATH);

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      commitment: result.commitmentHex,
      proof,
      publicSignals,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Upload + proof generation failed",
    });
  }
});

// ---------- VERIFY ----------
app.post("/verify", async (req, res) => {
  try {
    const { proof, publicSignals } = req.body;

    const verificationKey = JSON.parse(
      fs.readFileSync(VK_PATH, "utf-8")
    );

    const verified = await snarkjs.groth16.verify(
      verificationKey,
      publicSignals,
      proof
    );

    res.json({ success: true, verified });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Verification failed",
    });
  }
});

app.listen(PORT, () =>
  console.log(` ZK-Camera backend running on port ${PORT}`)
);
