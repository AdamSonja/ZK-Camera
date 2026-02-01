const { commitAndSign } = require("./commit-and-sign");

const photoPath = "./photo.jpg";

const metadata = {
  timestamp: "2025-10-05T10:00:00Z",
  deviceId: "ZKCam-01",
  cameraModel: "Pixel 7",
};

(async () => {
  const result = await commitAndSign(photoPath, metadata);
  console.log(" Commitment Result:\n", result);
})();
