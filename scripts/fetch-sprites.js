#!/usr/bin/env node

/**
 * fetch-sprites.js
 *
 * Downloads Pokemon GO sprites from PokeMiners/pogo_assets GitHub repository.
 * Reads data/species-map.json and downloads regular + shiny variants.
 */

const fs = require('fs/promises');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const SPRITES_DIR = path.join(ROOT, 'sprites', 'go');

const BASE_URL = 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon%20-%20256x256/Addressable%20Assets';
const CONCURRENCY = 10;

async function main() {
  console.log('=== Fetch Sprites ===\n');

  const speciesMap = JSON.parse(
    await fs.readFile(path.join(DATA_DIR, 'species-map.json'), 'utf8')
  );

  await fs.mkdir(path.join(SPRITES_DIR, 'regular'), { recursive: true });
  await fs.mkdir(path.join(SPRITES_DIR, 'shiny'), { recursive: true });

  // Build download tasks
  const tasks = [];
  for (const entry of speciesMap) {
    tasks.push({
      url: `${BASE_URL}/${entry.spriteFile}`,
      dest: path.join(SPRITES_DIR, 'regular', entry.spriteFile),
      label: `${entry.name}${entry.form ? ` (${entry.form})` : ''}`,
      type: 'regular',
      className: entry.className,
    });
    tasks.push({
      url: `${BASE_URL}/${entry.shinySpriteFile}`,
      dest: path.join(SPRITES_DIR, 'shiny', entry.shinySpriteFile),
      label: `${entry.name}${entry.form ? ` (${entry.form})` : ''} [shiny]`,
      type: 'shiny',
      className: entry.className,
    });
  }

  console.log(`Total download tasks: ${tasks.length}`);
  console.log(`Checking for existing files...\n`);

  // Filter out already-downloaded
  const toDownload = [];
  for (const task of tasks) {
    try {
      await fs.access(task.dest);
      // File exists, skip
    } catch {
      toDownload.push(task);
    }
  }

  console.log(`Already downloaded: ${tasks.length - toDownload.length}`);
  console.log(`To download:        ${toDownload.length}\n`);

  if (toDownload.length === 0) {
    console.log('Nothing to download.\n');
    return;
  }

  // Download with concurrency limit
  const missing = [];
  let completed = 0;
  let failed = 0;

  async function download(task) {
    try {
      const res = await fetch(task.url);
      if (!res.ok) {
        if (res.status === 404) {
          missing.push({ className: task.className, type: task.type, file: path.basename(task.dest) });
          failed++;
        } else {
          console.log(`  WARN: ${res.status} for ${task.label}`);
          failed++;
        }
        return;
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      await fs.writeFile(task.dest, buffer);
      completed++;
    } catch (err) {
      console.log(`  ERR: ${task.label} — ${err.message}`);
      failed++;
    }
  }

  // Process in batches
  const total = toDownload.length;
  for (let i = 0; i < total; i += CONCURRENCY) {
    const batch = toDownload.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(download));

    const progress = Math.min(i + CONCURRENCY, total);
    process.stdout.write(`\r  [${progress}/${total}] Downloaded: ${completed}, Missing: ${failed}`);
  }

  console.log('\n');
  console.log(`Downloaded: ${completed}`);
  console.log(`Missing:    ${failed}`);

  // Write missing sprites list
  if (missing.length > 0) {
    const missingPath = path.join(DATA_DIR, 'missing-sprites.json');
    await fs.writeFile(missingPath, JSON.stringify(missing, null, 2));
    console.log(`\nMissing sprites written to: ${missingPath}`);
    console.log(`First 10 missing:`);
    for (const m of missing.slice(0, 10)) {
      console.log(`  ${m.className} (${m.type}): ${m.file}`);
    }
  }

  console.log('');
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
