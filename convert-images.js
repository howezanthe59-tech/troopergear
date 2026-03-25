const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = './frontend/src/assets/media';
const outputDir = './frontend/src/assets/media';

fs.readdirSync(inputDir).forEach(file => {
  if (file.match(/\.(jpg|jpeg|png)$/i)) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
    
    sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath, (err, info) => {
        if (err) console.error(`Error converting ${file}:`, err);
        else console.log(`✅ ${file} → ${info.size} bytes`);
      });
  }
});