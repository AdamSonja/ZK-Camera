const fs = require("fs");
const path = require("path");
const { commitAndSign } = require("../commit-and-sign");

// Same test image + metadata you used before
const IMAGE_PATH = "./photo.jpg";

const METADATA = {
  timestamp: "2025-10-05T10:00:00Z",
  deviceId: "ZKCam-01",
  cameraModel: "Pixel 7",
};

// hex → decimal string (Circom expects decimal)
function hexToDecimal(hex) {
  return BigInt("0x" + hex).toString(10);
}

(async () => {
  const result = await commitAndSign(IMAGE_PATH, METADATA);

  const inputJson = {
    imageHash: hexToDecimal(result._private.imageHashHex),
    metadataHash: hexToDecimal(result._private.metadataHashHex),
    nonce: hexToDecimal(result._private.nonceHex),
    commitment: hexToDecimal(result.commitmentHex),
  };

  const outputPath = path.join(__dirname, "../../zk/input.json");

  fs.writeFileSync(outputPath, JSON.stringify(inputJson, null, 2));
  console.log("input.json generated at zk/input.json");
  console.log("input.json generated at zk/input.json");
  console.log("input.json generated at zk/input.json");
})();
