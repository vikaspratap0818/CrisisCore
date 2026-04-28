/**
 * Run once: copies logos.png from assets/ into client/public/assets/
 * Usage:  node setup-assets.js
 */
const fs   = require('fs');
const path = require('path');

const SRC  = path.join(__dirname, 'assets', 'logos.png');
const DEST = path.join(__dirname, 'client', 'public', 'assets', 'logos.png');

fs.mkdirSync(path.dirname(DEST), { recursive: true });

if (fs.existsSync(SRC)) {
  fs.copyFileSync(SRC, DEST);
  console.log('✅  logos.png copied to client/public/assets/logos.png');
} else {
  console.error('❌  Source not found:', SRC);
}
