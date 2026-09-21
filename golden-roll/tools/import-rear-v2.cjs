// Production import only: resize generated originals, preserving their alpha channel.
const fs = require('fs');
const path = require('path');
const sharp = require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async () => {
  const root = path.resolve(__dirname, '../..');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/runner-rear-v2-manifest.json'), 'utf8'));
  const out = path.join(root, 'golden-roll/assets/runner-art/rear-v2');
  fs.mkdirSync(out, { recursive: true });
  for (const asset of manifest.assets) {
    await sharp(asset.source).resize(1024, 1024).png().toFile(path.join(out, asset.id + '.png'));
    console.log(asset.id + ': 1024 x 1024');
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
