const express = require('express');
const cors = require('cors');
const exifr = require('exifr');
const multer = require('multer');
const fs = require('fs');
const {commitAndSign} =require('./commit-and-sign');

const app = express();
const upload = multer({ dest: 'uploads/' });

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


const extractMetadataHandler = async (req, res) => {
    if (!req.file) {
        res.status(400).json({ success: false, error: 'No image file provided' });
        return;
    }

    try {
        const metadata = await exifr.parse(req.file.path);
        //Call commitAndSign
        const result =await commitAndSign(req.file.path,metadata);
        res.json({ success: true, metadata,...result});
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to read metadata' });
    }
};

//Extract metadata from uploaded image
app.post('/upload', upload.single('photo'), extractMetadataHandler);
app.post('/extract-metadata', upload.single('image'), extractMetadataHandler);


// Endpoint to generate zero-knowledge proof (dummy implementation)
app.post('/generate-proof', async (req, res) => {
      // Later, plug in Circom + snarkjs logic here
  res.json({ success: true, proof: 'fake-proof-placeholder' })
});

app.post('/verify', async (req, res) => {
    //Later Verify proof here 
    res.json({ success: true, verified: true })
});



if (require.main === module) {
    app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}

module.exports = app;