import sharp from 'sharp';
import fs from 'fs';

// Solid SVG for Apple Touch Icon and full-bleed icons (No transparency on borders for iOS!)
const solidSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" fill="#2563eb" />
  <g transform="translate(100, 100) scale(13)">
    <path d="M3 22h18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 18v-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 18v-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14 18v-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18 18v-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 2l8 5H4z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

// Maskable icon with safe zone padding
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" fill="#2563eb" />
  <g transform="translate(136, 136) scale(10)">
    <path d="M3 22h18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 18v-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 18v-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14 18v-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18 18v-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 2l8 5H4z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

// Favicon SVG with subtle rounded corners
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="128" fill="#2563eb" />
  <g transform="translate(100, 100) scale(13)">
    <path d="M3 22h18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 18v-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 18v-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14 18v-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18 18v-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 2l8 5H4z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

async function generateAllIcons() {
  fs.writeFileSync('public/favicon.svg', faviconSvg);
  console.log('Updated public/favicon.svg');

  const solidBuffer = Buffer.from(solidSvg);
  const maskableBuffer = Buffer.from(maskableSvg);

  const icons = [
    { file: 'public/apple-touch-icon.png', size: 180, buffer: solidBuffer },
    { file: 'public/apple-touch-icon-precomposed.png', size: 180, buffer: solidBuffer },
    { file: 'public/apple-touch-icon-180x180.png', size: 180, buffer: solidBuffer },
    { file: 'public/apple-touch-icon-180x180-precomposed.png', size: 180, buffer: solidBuffer },
    { file: 'public/apple-touch-icon-167x167.png', size: 167, buffer: solidBuffer },
    { file: 'public/apple-touch-icon-152x152.png', size: 152, buffer: solidBuffer },
    { file: 'public/apple-touch-icon-120x120.png', size: 120, buffer: solidBuffer },
    { file: 'public/icon-192.png', size: 192, buffer: solidBuffer },
    { file: 'public/icon-512.png', size: 512, buffer: solidBuffer },
    { file: 'public/icon-maskable-512.png', size: 512, buffer: maskableBuffer },
    { file: 'public/favicon-32x32.png', size: 32, buffer: solidBuffer },
    { file: 'public/favicon-16x16.png', size: 16, buffer: solidBuffer },
  ];

  for (const item of icons) {
    await sharp(item.buffer)
      .resize(item.size, item.size)
      .png()
      .toFile(item.file);
    console.log(`Generated ${item.file} (${item.size}x${item.size})`);
  }

  console.log('All iOS and PWA icons generated successfully!');
}

generateAllIcons().catch(console.error);
