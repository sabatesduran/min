import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from 'puppeteer-core';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(webRoot, 'public/images/share/min-og.png');
const chromePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const asDataURL = async (filePath, mimeType) => {
  const source = await fs.readFile(filePath);
  return `data:${mimeType};base64,${source.toString('base64')}`;
};

const [font, logo, phone] = await Promise.all([
  asDataURL(path.join(webRoot, 'public/fonts/Fredoka-Variable.ttf'), 'font/ttf'),
  asDataURL(path.join(webRoot, 'public/images/brand/min-logo.png'), 'image/png'),
  asDataURL(path.join(webRoot, 'public/images/product/now.png'), 'image/png'),
]);

await fs.mkdir(path.dirname(outputPath), { recursive: true });

const browser = await launch({ headless: true, executablePath: chromePath });

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.setContent(`
    <!doctype html>
    <html lang="ca">
      <head>
        <meta charset="utf-8" />
        <style>
          @font-face {
            font-family: "Fredoka";
            src: url("${font}") format("truetype");
            font-weight: 300 700;
          }

          * { box-sizing: border-box; }

          html, body {
            width: 1200px;
            height: 630px;
            margin: 0;
            overflow: hidden;
          }

          body {
            background: #f5f2e8;
            color: #272824;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }

          .card {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }

          .blue-field {
            position: absolute;
            inset: 0 0 0 auto;
            width: 40%;
            background: #403cf5;
          }

          .blue-field::before {
            position: absolute;
            width: 440px;
            height: 440px;
            top: -230px;
            left: -170px;
            border: 2px solid rgb(255 255 255 / 0.2);
            border-radius: 50%;
            content: "";
          }

          .copy {
            position: relative;
            z-index: 3;
            width: 710px;
            height: 100%;
            padding: 54px 56px 48px 72px;
          }

          .logo {
            width: 178px;
            height: auto;
          }

          .kicker {
            margin: 54px 0 14px;
            color: #403cf5;
            font-size: 17px;
            font-weight: 750;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }

          h1 {
            max-width: 620px;
            margin: 0;
            font-family: "Fredoka", sans-serif;
            font-size: 76px;
            font-weight: 600;
            letter-spacing: -0.03em;
            line-height: 0.92;
          }

          .lede {
            max-width: 520px;
            margin: 24px 0 0;
            color: #666960;
            font-size: 25px;
            line-height: 1.35;
          }

          .url {
            position: absolute;
            left: 72px;
            bottom: 48px;
            margin: 0;
            color: #403cf5;
            font-size: 18px;
            font-weight: 750;
          }

          .phone {
            position: absolute;
            z-index: 4;
            width: 350px;
            height: auto;
            top: 24px;
            right: 78px;
            filter: drop-shadow(0 24px 32px rgb(20 18 79 / 0.28));
          }
        </style>
      </head>
      <body>
        <main class="card" aria-label="min, el minut a minut de la colla">
          <div class="blue-field"></div>
          <section class="copy">
            <img class="logo" src="${logo}" alt="min" />
            <p class="kicker">El minut a minut de la colla</p>
            <h1>Tot al seu<br />moment.</h1>
            <p class="lede">L’horari, les tasques i la colla, sempre a mà.</p>
            <p class="url">min.didac.dev</p>
          </section>
          <img class="phone" src="${phone}" alt="Pantalla Ara de min" />
        </main>
      </body>
    </html>
  `, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: outputPath, type: 'png' });
} finally {
  await browser.close();
}

console.log(`Generated ${outputPath}`);
