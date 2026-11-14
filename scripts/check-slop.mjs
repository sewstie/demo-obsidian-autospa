import fs from 'node:fs';
import path from 'node:path';

const MAX_LINES = 120;
const TARGET_DIR = 'src';
let hasError = false;

function scanDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (/\.(astro|tsx|ts)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      const lines = fs.readFileSync(fullPath, 'utf-8').split('\n').length;
      if (lines > MAX_LINES) {
        console.error(`❌ SLOP DETECTED: ${fullPath} has ${lines} lines (Max allowed: ${MAX_LINES}). Split this component!`);
        hasError = true;
      }
    }
  }
}

scanDir(TARGET_DIR);
if (hasError) process.exit(1);
console.log('✅ Anti-slop check passed: All files are modular and under 120 lines.');