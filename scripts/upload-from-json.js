/**
 * Upload base64 images from site-data.json to Cloudinary.
 * Run this in your terminal (not through Claude):
 *   $env:CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"; node scripts/upload-from-json.js
 */
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'site-data.json');
const url = process.env.CLOUDINARY_URL;
if (!url) { console.error('请设置 CLOUDINARY_URL'); process.exit(1); }
const m = url.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
cloudinary.config({ cloud_name: m[3], api_key: m[1], api_secret: m[2] });

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
let total = 0, ok = 0, fail = 0;

async function main() {
  for (let pi = 0; pi < data.projects.length; pi++) {
    const p = data.projects[pi];
    if (!Array.isArray(p.images)) continue;
    for (let ii = 0; ii < p.images.length; ii++) {
      const src = p.images[ii];
      if (!src || typeof src !== 'string') continue;
      if (src.startsWith('http://') || src.startsWith('https://')) continue;
      if (!src.startsWith('data:')) continue;

      total++;
      process.stdout.write(`[${total}] ${p.name} #${ii+1}... `);
      try {
        const r = await cloudinary.uploader.upload(src, {
          public_id: `morphai_db/${p.name.replace(/[^a-zA-Z0-9一-鿿]/g,'_')}_${ii}`,
          overwrite: true
        });
        p.images[ii] = r.secure_url;
        ok++;
        console.log('OK');
      } catch (e) {
        fail++;
        console.log('FAIL:', e.message);
      }
    }
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n完成: ${total} 张, 成功 ${ok}, 失败 ${fail}`);
  console.log(`新文件大小: ${(fs.statSync(DATA_FILE).size/1024/1024).toFixed(2)} MB`);
}
main().catch(e => { console.error(e); process.exit(1); });
