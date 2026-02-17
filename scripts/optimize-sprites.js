#!/usr/bin/env node

/**
 * optimize-sprites.js
 *
 * Resizes 256x256 source sprites to 128x128 optimized PNGs for distribution.
 */

const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const SPRITES_SRC = path.join(ROOT, 'sprites', 'go');
const SPRITES_DIST = path.join(ROOT, 'dist', 'sprites', 'go');

// Keep original 256x256 — no resize, just compress
const BATCH_SIZE = 20;

async function main() {
  console.log('=== Optimize Sprites ===\n');

  await fs.mkdir(path.join(SPRITES_DIST, 'regular'), { recursive: true });
  await fs.mkdir(path.join(SPRITES_DIST, 'shiny'), { recursive: true });

  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalSrcBytes = 0;
  let totalDstBytes = 0;

  for (const subdir of ['regular', 'shiny']) {
    const srcDir = path.join(SPRITES_SRC, subdir);
    const dstDir = path.join(SPRITES_DIST, subdir);

    let files;
    try {
      files = (await fs.readdir(srcDir)).filter(f => f.endsWith('.png'));
    } catch {
      console.log(`  No ${subdir} sprites found, skipping.`);
      continue;
    }

    console.log(`Processing ${subdir}: ${files.length} files...`);

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);

      await Promise.all(batch.map(async (file) => {
        const srcPath = path.join(srcDir, file);
        const dstPath = path.join(dstDir, file);

        // Skip if dest already exists and is newer than source
        try {
          const [srcStat, dstStat] = await Promise.all([
            fs.stat(srcPath),
            fs.stat(dstPath),
          ]);
          if (dstStat.mtimeMs >= srcStat.mtimeMs) {
            totalSkipped++;
            return;
          }
        } catch {
          // dest doesn't exist, process it
        }

        const srcStat = await fs.stat(srcPath);
        totalSrcBytes += srcStat.size;

        await sharp(srcPath)
          .png({ compressionLevel: 9 })
          .toFile(dstPath);

        const dstStat = await fs.stat(dstPath);
        totalDstBytes += dstStat.size;
        totalProcessed++;
      }));

      const progress = Math.min(i + BATCH_SIZE, files.length);
      process.stdout.write(`\r  [${progress}/${files.length}]`);
    }
    console.log('');
  }

  const savedMB = ((totalSrcBytes - totalDstBytes) / 1024 / 1024).toFixed(1);
  const dstMB = (totalDstBytes / 1024 / 1024).toFixed(1);

  console.log(`\nProcessed:  ${totalProcessed} files`);
  console.log(`Skipped:    ${totalSkipped} files (already up to date)`);
  console.log(`Output size: ${dstMB} MB (saved ${savedMB} MB)`);
  console.log('');
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
