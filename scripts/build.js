#!/usr/bin/env node

/**
 * build.js — Orchestrator
 *
 * Runs all build steps in sequence.
 *
 * Usage:
 *   node scripts/build.js              # Full build
 *   node scripts/build.js --css-only   # Only regenerate CSS (skip fetch/optimize)
 *   node scripts/build.js --skip-fetch # Skip download, rebuild from existing sprites
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const cssOnly = args.includes('--css-only');
const skipFetch = args.includes('--skip-fetch');

const steps = [];

if (!cssOnly) {
  steps.push({ name: 'Build Mapping', cmd: 'node scripts/build-mapping.js' });

  if (!skipFetch) {
    steps.push({ name: 'Fetch Sprites', cmd: 'node scripts/fetch-sprites.js' });
  }

  steps.push({ name: 'Optimize Sprites', cmd: 'node scripts/optimize-sprites.js' });
}

steps.push({ name: 'Generate CSS', cmd: 'node scripts/generate-css.js' });

console.log('╔══════════════════════════════════╗');
console.log('║      pogo-icons build            ║');
console.log('╚══════════════════════════════════╝\n');

if (cssOnly) console.log('Mode: CSS only\n');
else if (skipFetch) console.log('Mode: Skip fetch\n');

const startTime = Date.now();

for (const step of steps) {
  console.log(`── ${step.name} ${'─'.repeat(30 - step.name.length)}\n`);
  try {
    execSync(step.cmd, { stdio: 'inherit', cwd: ROOT });
  } catch (err) {
    console.error(`\nBuild failed at step: ${step.name}`);
    process.exit(1);
  }
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\n${'═'.repeat(36)}`);
console.log(`Build complete in ${elapsed}s`);
console.log(`Output: dist/pogo-icons.css`);
console.log(`${'═'.repeat(36)}`);
