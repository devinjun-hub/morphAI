/**
 * Smart migration: match base64 images to local files, then upload remaining.
 *
 * Matching strategy: compare decoded base64 size against local file sizes.
 * If unique match, use cloudinary URL. If ambiguous, do full MD5.
 * Then upload any remaining unmatched images.
 *
 * Usage:
 *   set CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
 *   node scripts/smart-migrate.js
 */
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'site-data.json');
const IMAGES_DIR = path.join(__dirname, '..', 'images');
const MAP_FILE = path.join(__dirname, '..', 'cloudinary-map.json');

const cloudinaryUrl = process.env.CLOUDINARY_URL;
if (!cloudinaryUrl) { console.error('请设置 CLOUDINARY_URL'); process.exit(1); }
// Parse cloudinary://api_key:api_secret@cloud_name
const parsed = cloudinaryUrl.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
if (!parsed) { console.error('无效的 CLOUDINARY_URL'); process.exit(1); }
cloudinary.config({
  cloud_name: parsed[3],
  api_key: parsed[1],
  api_secret: parsed[2]
});

// Build local file index: size → [paths]
const sizeIndex = new Map();
function walkDir(dir, base = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full, rel);
    else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(entry.name)) {
      const stat = fs.statSync(full);
      const key = stat.size;
      if (!sizeIndex.has(key)) sizeIndex.set(key, []);
      sizeIndex.get(key).push({ path: rel, full });
    }
  }
}
walkDir(IMAGES_DIR);
console.log(`索引了 ${Array.from(sizeIndex.values()).reduce((a,b) => a + b.length, 0)} 个本地文件`);

// Load Cloudinary map
const imgMap = JSON.parse(fs.readFileSync(MAP_FILE, 'utf-8'));

// Load site data
const raw = fs.readFileSync(DATA_FILE, 'utf-8');
const data = JSON.parse(raw);

function computeMd5(fullPath) {
  return crypto.createHash('md5').update(fs.readFileSync(fullPath)).digest('hex');
}

function base64DecodedSize(b64) {
  const m = b64.match(/^data:image\/\w+;base64,(.+)$/);
  if (!m) return null;
  // Base64 is ~4/3 of the decoded size
  return Math.floor(m[1].length * 3 / 4);
}

function decodeBase64(b64) {
  const m = b64.match(/^data:image\/\w+;base64,(.+)$/);
  if (!m) return null;
  return Buffer.from(m[1], 'base64');
}

async function uploadBase64(base64Str, projectName, idx) {
  // base64Str is already a full data URI like data:image/jpeg;base64,/9j/...
  const buf = Buffer.from(base64Str.split(',')[1] || base64Str, 'base64');
  if (!buf.length) return null;
  if (buf.length > 10 * 1024 * 1024) {
    console.log(`  跳过超大图片 (${(buf.length/1024/1024).toFixed(1)}MB)`);
    return null;
  }
  const publicId = `morphai_db/${projectName.replace(/[^a-zA-Z0-9一-鿿]/g, '_')}_${idx}`;
  try {
    // Cloudinary accepts data URIs directly
    const r = await cloudinary.uploader.upload(base64Str, {
      public_id: publicId, overwrite: true,
    });
    return r.secure_url;
  } catch (e) {
    console.log(`  上传失败:`, e.message || e.error || JSON.stringify(e).slice(0,200));
    return null;
  }
}

async function main() {
  let matched = 0, uploaded = 0, skipped = 0;
  const md5Cache = new Map(); // size -> md5 -> path

  for (let pi = 0; pi < data.projects.length; pi++) {
    const p = data.projects[pi];
    if (!Array.isArray(p.images)) continue;

    for (let ii = 0; ii < p.images.length; ii++) {
      const src = p.images[ii];
      if (typeof src !== 'string') continue;
      if (src.startsWith('http://') || src.startsWith('https://')) { skipped++; continue; }
      if (!src.startsWith('data:')) { skipped++; continue; }

      const decodedSize = base64DecodedSize(src);
      if (!decodedSize) { skipped++; continue; }

      // Find matching local files by size
      const candidates = sizeIndex.get(decodedSize) || [];
      let found = false;

      if (candidates.length === 1) {
        // Unique match by size
        const localPath = candidates[0].path;
        const mapKey = `images/${localPath}`;
        const url = imgMap[mapKey] || imgMap[localPath];
        if (url) {
          p.images[ii] = url;
          matched++;
          process.stdout.write(`\r匹配: ${p.name} #${ii+1} (by size) → ✓`);
          found = true;
        }
      } else if (candidates.length > 1) {
        // Multiple candidates — use MD5
        const b64Buf = decodeBase64(src);
        if (b64Buf) {
          const b64Md5 = crypto.createHash('md5').update(b64Buf).digest('hex');
          for (const c of candidates) {
            // Lazy MD5 cache
            if (!md5Cache.has(c.full)) {
              md5Cache.set(c.full, computeMd5(c.full));
            }
            if (md5Cache.get(c.full) === b64Md5) {
              const localPath = c.path;
              const mapKey = `images/${localPath}`;
              const url = imgMap[mapKey] || imgMap[localPath];
              if (url) {
                p.images[ii] = url;
                matched++;
                found = true;
                break;
              }
            }
          }
        }
      }

      if (!found) {
        // Need to upload
        process.stdout.write(`\r上传: ${p.name} #${ii+1}... `);
        const url = await uploadBase64(src, p.name, ii);
        if (url) {
          p.images[ii] = url;
          uploaded++;
          console.log('✓');
        } else {
          console.log('✗');
        }
      }
    }
  }

  // Save
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  const newSizeMB = (fs.statSync(DATA_FILE).size / 1024 / 1024).toFixed(2);

  console.log(`\n完成:`);
  console.log(`  ✓ 已有匹配 (Cloudinary): ${matched}`);
  console.log(`  ↑ 新上传: ${uploaded}`);
  console.log(`  - 跳过 (已处理): ${skipped}`);
  console.log(`  新文件大小: ${newSizeMB} MB`);
}

main().catch(e => { console.error('错误:', e); process.exit(1); });
