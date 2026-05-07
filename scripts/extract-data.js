/**
 * Extract current data from site-data.json, replace base64 images
 * with Cloudinary URLs, and update DEFAULT_DATA in api/index.js
 */
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'site-data.json');
const MAP_FILE = path.join(__dirname, '..', 'cloudinary-map.json');
const API_FILE = path.join(__dirname, '..', 'api', 'index.js');

// Read current data
const currentData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const imgMap = JSON.parse(fs.readFileSync(MAP_FILE, 'utf-8'));

// Helper: find Cloudinary URL for a base64 or local path
function resolveImage(src) {
  if (!src || typeof src !== 'string') return src;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  // Try local path lookup
  const normalized = src.replace(/\\/g, '/');
  return imgMap[normalized] || imgMap[normalized.replace(/^images\//, '')] || src;
}

// Build clean output (without base64 data, using Cloudinary URLs)
const output = {
  pw: currentData.pw,
  email: currentData.email,
  ht: currentData.ht,
  startYear: currentData.startYear,
  ab: currentData.ab,
  svcs: currentData.svcs,
  ig: currentData.ig || '',
  be: currentData.be || '',
  li: currentData.li || '',
  jobs: (currentData.jobs || []).map(j => ({
    id: j.id,
    company: j.company,
    role: j.role,
    year: j.year,
    desc: j.desc || ''
  })),
  projects: (currentData.projects || []).map((p, pi) => {
    const images = (p.images || []).map(src => {
      // If it's base64, try to find the Cloudinary URL
      if (typeof src === 'string' && src.startsWith('data:')) {
        // Can't match base64 to Cloudinary — use a placeholder lookup
        // by checking if the filename parts match local files
        return src; // keep as-is (will be served from API response)
      }
      return resolveImage(src);
    });
    return {
      id: p.id,
      name: p.name,
      sub: p.sub || '',
      cat: p.cat || '',
      type: p.type || '',
      loc: p.loc || '',
      year: p.year || '',
      scale: p.scale || '',
      desc: p.desc || '',
      images,
      labels: (p.labels || []).map(l => l || '')
    };
  })
};

// Write as JSON for inspection
const CLEAN_FILE = path.join(__dirname, '..', 'data', 'clean-data.json');
fs.writeFileSync(CLEAN_FILE, JSON.stringify(output, null, 2), 'utf-8');
console.log('Clean data written to:', CLEAN_FILE);
console.log('Projects:', output.projects.length);
console.log('Jobs:', output.jobs.length);

// Check which projects have base64 image data
output.projects.forEach((p, i) => {
  const b64Count = p.images.filter(s => typeof s === 'string' && s.startsWith('data:')).length;
  const cloudCount = p.images.filter(s => typeof s === 'string' && s.startsWith('http')).length;
  const localCount = p.images.length - b64Count - cloudCount;
  console.log(`  ${p.name}: ${p.images.length} images (${cloudCount} Cloudinary, ${localCount} local, ${b64Count} base64)`);
});
