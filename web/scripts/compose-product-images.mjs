import { Buffer } from 'node:buffer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const framePath = path.join(webRoot, 'assets/frames/iphone-17-pro-deep-blue.png');
const sourceDirectory = path.join(webRoot, 'assets/screens');
const outputDirectory = path.join(webRoot, 'public/images/product');

const frameWidth = 1350;
const frameHeight = 2760;
const screenWidth = 1206;
const screenHeight = 2622;
const screenLeft = 72;
const screenTop = 69;
const screenRadius = 156;

const screenMask = Buffer.from(`
  <svg width="${screenWidth}" height="${screenHeight}" viewBox="0 0 ${screenWidth} ${screenHeight}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${screenWidth}" height="${screenHeight}" rx="${screenRadius}" fill="#fff" />
  </svg>
`);

for (const name of ['now', 'agenda', 'detail', 'team']) {
  const screen = await sharp(path.join(sourceDirectory, `${name}.png`))
    .resize(screenWidth, screenHeight, { fit: 'fill' })
    .ensureAlpha()
    .composite([{ input: screenMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: frameWidth,
      height: frameHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: screen, left: screenLeft, top: screenTop },
      { input: framePath, left: 0, top: 0 },
    ])
    .png()
    .toFile(path.join(outputDirectory, `${name}.png`));
}

console.log('Composed iPhone product images with rounded screen masks.');
