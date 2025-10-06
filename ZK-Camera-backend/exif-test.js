const exifr = require('exifr');
const fs = require('fs');

async function readMeta() {
        const filePath ='./photo.jpg'
        if (!fs.existsSync(filePath)) {
            console.log('File does not exist:', filePath);
        }
        try {
            const data = await exifr.parse(filePath);
            console.log("MediaMetadata",data);
        } catch (error) {
            console.error('Error reading metadata:', error);
        }
}
readMeta();