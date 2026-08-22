import sharp from 'sharp';
import fs from 'fs';

async function generateIcons() {
  const svgBuffer = fs.readFileSync('public/favicon.svg');

  await sharp(svgBuffer).resize(192, 192).toFile('public/icon-192.png');
  await sharp(svgBuffer).resize(512, 512).toFile('public/icon-512.png');
  await sharp(svgBuffer).resize(512, 512).toFile('public/icon-maskable-512.png');
  await sharp(svgBuffer).resize(180, 180).toFile('public/apple-touch-icon.png');
  await sharp(svgBuffer).resize(180, 180).toFile('public/apple-touch-icon-180x180.png');

  console.log('Icons generated successfully!');
}

generateIcons().catch(console.error);
