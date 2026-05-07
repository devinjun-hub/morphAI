/**
 * Fix cloudinary-map.json encoding and add images/ prefix for matching.
 */
const fs = require('fs');
const path = require('path');

const MAP_FILE = path.join(__dirname, '..', 'data', 'cloudinary-map.json');
const API_FILE = path.join(__dirname, '..', 'api', 'index.js');

// Read the garbled map
const rawMap = JSON.parse(fs.readFileSync(MAP_FILE, 'utf-8'));

// Build reverse index: public ID suffix → URL
// Cloudinary public IDs are like: morphai/2025HRC%E8%BD%A6%E5%B1%95_01_PhysCamera001
const urlBySuffix = {};
Object.entries(rawMap).forEach(([localPath, url]) => {
  // Extract the filename part from the URL (after last /)
  const urlPath = url.replace(/\/v\d+\//, '/'); // remove version
  const fileName = urlPath.substring(urlPath.lastIndexOf('/') + 1);
  const nameWithoutExt = fileName.replace(/\.[^.]+$/, '');
  urlBySuffix[nameWithoutExt] = url;
});

// Extract image paths from DEFAULT_DATA in api/index.js
const apiSrc = fs.readFileSync(API_FILE, 'utf-8');
const imgRegex = /'images\/[^']+'/g;
const matches = apiSrc.match(imgRegex) || [];

const fixedMap = {};
let found = 0, notFound = 0;

matches.forEach(m => {
  const localPath = m.replace(/'/g, '');
  const relPath = localPath.replace(/^images\//, '');

  // Generate the expected public ID suffix
  const nameWithoutExt = relPath.replace(/\.[^.]+$/, '').replace(/\//g, '_');

  const url = urlBySuffix[nameWithoutExt];
  if (url) {
    fixedMap[localPath] = url;
    found++;
  } else {
    // Try fuzzy match
    const fileName = nameWithoutExt.split('_').pop();
    const fuzzy = Object.keys(urlBySuffix).find(k => k.endsWith(fileName));
    if (fuzzy) {
      fixedMap[localPath] = urlBySuffix[fuzzy];
      found++;
    } else {
      console.log('NOT FOUND:', localPath, '→', nameWithoutExt);
      notFound++;
    }
  }
});

// Also add the relPath (without images/) as fallback
Object.entries(rawMap).forEach(([oldKey, url]) => {
  const localKey = 'images/' + oldKey.replace(/\\/g, '/');
  if (!fixedMap[localKey]) {
    fixedMap[localKey] = url;
  }
});

fs.writeFileSync(MAP_FILE, JSON.stringify(fixedMap, null, 2), 'utf-8');
console.log(`Fixed map: ${found} matched, ${notFound} not found, ${Object.keys(fixedMap).length} total entries`);
