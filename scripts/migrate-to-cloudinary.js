/**
 * Migrate base64 images from site-data.json to Cloudinary.
 *
 * Usage:
 *   set CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
 *   node scripts/migrate-to-cloudinary.js
 */
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'site-data.json');
const MAP_FILE = path.join(__dirname, '..', 'cloudinary-map.json');

const cloudinaryUrl = process.env.CLOUDINARY_URL;
if (!cloudinaryUrl) {
  console.error('请设置 CLOUDINARY_URL 环境变量');
  process.exit(1);
}
cloudinary.config({ cloudinary_url: cloudinaryUrl });

async function uploadBase64(base64Str, projectName, index) {
  // Strip data:image/xxx;base64, prefix
  const m = base64Str.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!m) return null;
  const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
  const base64Data = m[2];
  const buf = Buffer.from(base64Data, 'base64');

  // Small files only — skip if > 10MB
  if (buf.length > 10 * 1024 * 1024) {
    console.log(`  跳过超大图片 (${(buf.length/1024/1024).toFixed(1)}MB)`);
    return null;
  }

  const publicId = `morphai_db/${projectName}_${index}`;
  try {
    // Upload as base64 string
    const result = await cloudinary.uploader.upload(`data:image/${ext};base64,${base64Data}`, {
      public_id: publicId,
      overwrite: true,
    });
    return result.secure_url;
  } catch (e) {
    console.log(`  上传失败: ${e.message}`);
    return null;
  }
}

async function main() {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  const data = JSON.parse(raw);

  let totalImages = 0;
  let uploaded = 0;
  let failed = 0;

  for (let pi = 0; pi < data.projects.length; pi++) {
    const p = data.projects[pi];
    if (!Array.isArray(p.images)) continue;

    for (let ii = 0; ii < p.images.length; ii++) {
      const src = p.images[ii];
      if (typeof src !== 'string') continue;

      // Already a URL
      if (src.startsWith('http://') || src.startsWith('https://')) continue;

      // Skip local file paths
      if (!src.startsWith('data:')) continue;

      totalImages++;
      process.stdout.write(`[${totalImages}] ${p.name} 图片 ${ii + 1}... `);

      const url = await uploadBase64(src, p.name.replace(/[^a-zA-Z0-9一-鿿]/g, '_'), ii);
      if (url) {
        p.images[ii] = url;
        uploaded++;
        console.log('✓');
      } else {
        failed++;
        console.log('✗');
      }
    }
  }

  // Save updated data
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  const newSize = fs.statSync(DATA_FILE).size;

  console.log(`\n完成: 共 ${totalImages} 张 base64 图片`);
  console.log(`  ✓ 上传成功: ${uploaded}`);
  console.log(`  ✗ 上传失败: ${failed}`);
  console.log(`  新文件大小: ${(newSize / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(err => {
  console.error('脚本错误:', err);
  process.exit(1);
});
