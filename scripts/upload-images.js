/**
 * Upload all images from /images to Cloudinary and generate a path mapping.
 *
 * Usage:
 *   1. Create a free Cloudinary account at https://cloudinary.com
 *   2. Get your CLOUDINARY_URL from Dashboard > Account Details
 *   3. Run:
 *       set CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
 *       node scripts/upload-images.js
 *
 *   Or pass inline:
 *       node scripts/upload-images.js cloudinary://api_key:api_secret@cloud_name
 *
 * Output: data/cloudinary-map.json  (local path → Cloudinary URL)
 */

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const IMAGES_DIR = path.join(__dirname, '..', 'images');
const MAP_FILE = path.join(__dirname, '..', 'cloudinary-map.json');

// Get CLOUDINARY_URL from arg or env
const cloudinaryUrl = process.argv[2] || process.env.CLOUDINARY_URL;
if (!cloudinaryUrl) {
  console.error('请提供 Cloudinary URL:');
  console.error('  node scripts/upload-images.js cloudinary://api_key:api_secret@cloud_name');
  process.exit(1);
}

cloudinary.config({ cloudinary_url: cloudinaryUrl });

// Walk directory recursively, return relative paths
function walkDir(dir, base = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(full, rel));
    } else if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff?)$/i.test(entry.name)) {
      files.push(rel);
    }
  }
  return files;
}

// Normalize path separators to forward slashes
function normalize(p) {
  return p.replace(/\\/g, '/');
}

async function main() {
  const allFiles = walkDir(IMAGES_DIR);
  console.log(`找到 ${allFiles.length} 个图片文件`);

  // Resume: skip already-mapped files
  let existingMap = {};
  if (fs.existsSync(MAP_FILE)) {
    try {
      existingMap = JSON.parse(fs.readFileSync(MAP_FILE, 'utf-8'));
      console.log(`已有映射条目: ${Object.keys(existingMap).length}`);
    } catch (_) {}
  }

  const map = { ...existingMap };
  const toUpload = allFiles.filter(f => !map[normalize(f)]);

  if (toUpload.length === 0) {
    console.log('所有图片已上传，无需操作');
    fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 2), 'utf-8');
    console.log(`映射文件已写入: ${MAP_FILE}`);
    return;
  }

  console.log(`待上传: ${toUpload.length} 个文件`);

  let success = 0, fail = 0;
  const batchSize = 5; // concurrent uploads

  for (let i = 0; i < toUpload.length; i += batchSize) {
    const batch = toUpload.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (relPath) => {
        const fullPath = path.join(IMAGES_DIR, relPath);
        const normalizedRel = normalize(relPath);

        // Use folder from the path structure: images/ProjectName/file.jpg
        const folder = 'morphai';
        const publicId = `${folder}/${normalizedRel.replace(/\.\w+$/, '').replace(/\//g, '_')}`;

        console.log(`[${i + success + 1}/${allFiles.length}] 上传: ${normalizedRel}`);
        const result = await cloudinary.uploader.upload(fullPath, {
          public_id: publicId,
          use_filename: true,
          unique_filename: false,
          overwrite: true,
          resource_type: 'image',
        });

        map[normalizedRel] = result.secure_url;
        return result;
      })
    );

    for (const r of results) {
      if (r.status === 'fulfilled') {
        success++;
      } else {
        console.error(`上传失败:`, r.reason?.message || r.reason);
        fail++;
      }
    }

    // Save progress after each batch
    fs.writeFileSync(MAP_FILE + '.tmp', JSON.stringify(map, null, 2), 'utf-8');
  }

  // Rename tmp to final
  if (fs.existsSync(MAP_FILE + '.tmp')) {
    fs.renameSync(MAP_FILE + '.tmp', MAP_FILE);
  }

  console.log(`\n完成: 成功 ${success}, 失败 ${fail}`);
  console.log(`映射文件已写入: ${MAP_FILE}`);

  if (fail > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('脚本错误:', err);
  process.exit(1);
});
