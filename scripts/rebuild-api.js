/**
 * Read site-data.json (current content), map images to Cloudinary URLs,
 * then rewrite api/index.js DEFAULT_DATA with clean data.
 */
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'site-data.json');
const MAP_FILE = path.join(__dirname, '..', 'cloudinary-map.json');
const API_FILE = path.join(__dirname, '..', 'api', 'index.js');

const current = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const imgMap = JSON.parse(fs.readFileSync(MAP_FILE, 'utf-8'));

// Map local images/ paths to Cloudinary
function mapImg(src) {
  if (!src || typeof src !== 'string') return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('data:')) {
    // base64 — try to find a local file match from the data folder
    // We can't map base64 to Cloudinary; use empty string as placeholder
    return '';
  }
  const n = src.replace(/\\/g, '/');
  return imgMap[n] || imgMap[n.replace(/^images\//, '')] || src;
}

// Build clean projects with Cloudinary URLs
const projects = (current.projects || []).map((p, i) => {
  const imgs = (p.images || []).map(s => mapImg(s)).filter(Boolean);
  const labels = (p.labels || []).map(l => l || '');
  // Trim images without labels to match
  while (imgs.length > labels.length) labels.push('');
  return {
    id: i + 1,
    name: p.name || '',
    sub: p.sub || '',
    cat: p.cat || '',
    type: p.type || '',
    loc: p.loc || '',
    year: String(p.year || ''),
    scale: p.scale || '',
    desc: p.desc || '',
    images: imgs,
    labels: labels.slice(0, imgs.length)
  };
});

// Count mapped vs unmapped
let mapped = 0, unmapped = 0;
current.projects.forEach((p, i) => {
  (p.images || []).forEach((src, j) => {
    const img = projects[i].images[j];
    if (img && img.startsWith('http')) mapped++;
    else if (src && src.startsWith('data:')) unmapped++;
  });
});
console.log(`项目: ${projects.length}`);
console.log(`图片: ${mapped} 张已映射到 Cloudinary, ${unmapped} 张未匹配 (base64)`);

const cleanData = {
  pw: current.pw || 'liujun2025',
  email: current.email || '',
  ht: current.ht || 'MORPH',
  startYear: current.startYear || 2016,
  ab: current.ab || '',
  svcs: current.svcs || '',
  ig: current.ig || '',
  be: current.be || '',
  li: current.li || '',
  jobs: (current.jobs || []).map(j => ({
    id: j.id,
    company: j.company || '',
    role: j.role || '',
    year: j.year || '',
    desc: j.desc || ''
  })),
  projects
};

// Generate JSON string with 2-space indent
const jsonStr = JSON.stringify(cleanData, null, 2);

// Read current api/index.js
let apiSrc = fs.readFileSync(API_FILE, 'utf-8');

// Replace DEFAULT_DATA in api/index.js
// Find the DEFAULT_DATA = { ... } block and replace it
const startMarker = 'const DEFAULT_DATA = {';
const startIdx = apiSrc.indexOf(startMarker);
if (startIdx === -1) {
  console.error('找不到 DEFAULT_DATA 起始位置');
  process.exit(1);
}

// Find the closing }; of DEFAULT_DATA
// Count brace depth from startIdx
let depth = 0;
let endIdx = startIdx;
for (let i = startIdx; i < apiSrc.length; i++) {
  if (apiSrc[i] === '{') depth++;
  else if (apiSrc[i] === '}') depth--;
  if (depth === 0) { endIdx = i + 1; break; }
}

const before = apiSrc.substring(0, startIdx);
const after = apiSrc.substring(endIdx);
const newApiSrc = before + 'const DEFAULT_DATA = ' + jsonStr + ';' + after;

fs.writeFileSync(API_FILE, newApiSrc, 'utf-8');
console.log('api/index.js 已更新');

// Show projects with 0 images
projects.forEach(p => {
  if (p.images.length === 0) console.log(`  ⚠ ${p.name}: 无可用图片`);
});
