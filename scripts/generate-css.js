#!/usr/bin/env node

/**
 * generate-css.js
 *
 * Assembles the final pogo-icons.css from hand-written source CSS
 * and auto-generated per-species classes.
 */

const fs = require('fs/promises');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const DATA_DIR = path.join(ROOT, 'data');
const DIST_DIR = path.join(ROOT, 'dist');

const THEME = 'go';

async function main() {
  console.log('=== Generate CSS ===\n');

  // Read hand-written CSS
  const baseCss = await fs.readFile(path.join(SRC_DIR, 'base.css'), 'utf8');
  const sizesCss = await fs.readFile(path.join(SRC_DIR, 'sizes.css'), 'utf8');
  const effectsCss = await fs.readFile(path.join(SRC_DIR, 'effects.css'), 'utf8');

  // Read species map
  const speciesMap = JSON.parse(
    await fs.readFile(path.join(DATA_DIR, 'species-map.json'), 'utf8')
  );

  // Check which sprites actually exist in dist
  const distRegularDir = path.join(DIST_DIR, 'sprites', THEME, 'regular');
  let existingSprites = new Set();
  try {
    const files = await fs.readdir(distRegularDir);
    existingSprites = new Set(files);
  } catch {
    // dist sprites not built yet — generate CSS for all entries anyway
    console.log('  NOTE: dist sprites not found, generating CSS for all mapped species.\n');
  }

  // Generate per-species CSS
  const speciesRules = [];
  const dexAliases = [];
  let generated = 0;
  let skippedNoSprite = 0;

  // Track dex numbers we've already aliased (base forms only)
  const dexAliased = new Set();

  for (const entry of speciesMap) {
    const spritePath = `sprites/${THEME}/regular/${entry.spriteFile}`;
    const shinyPath = `sprites/${THEME}/shiny/${entry.shinySpriteFile}`;

    // Generate name-based class
    speciesRules.push(
      `.pogo-${entry.className} {\n` +
      `  --pogo-sprite: url('${spritePath}');\n` +
      `  --pogo-sprite-shiny: url('${shinyPath}');\n` +
      `}`
    );
    generated++;

    // Generate dex-number alias for base forms only (avoid ambiguity)
    if (!entry.form && !dexAliased.has(entry.dex)) {
      dexAliases.push(
        `.pogo-${entry.dex} {\n` +
        `  --pogo-sprite: url('${spritePath}');\n` +
        `  --pogo-sprite-shiny: url('${shinyPath}');\n` +
        `}`
      );
      dexAliased.add(entry.dex);
    }
  }

  // Assemble full CSS
  const header = `/*!\n * pogo-icons v1.0.0\n * FontAwesome-style Pokemon GO sprite icons\n * Theme: ${THEME}\n * Generated: ${new Date().toISOString()}\n * Species: ${generated}\n */\n`;

  const fullCss = [
    header,
    '/* === Base === */',
    baseCss.trim(),
    '',
    '/* === Sizes === */',
    sizesCss.trim(),
    '',
    '/* === Effects === */',
    effectsCss.trim(),
    '',
    `/* === Species (${generated} entries) === */`,
    speciesRules.join('\n'),
    '',
    `/* === Dex Number Aliases (${dexAliases.length} base forms) === */`,
    dexAliases.join('\n'),
    '',
  ].join('\n');

  // Write unminified
  await fs.mkdir(DIST_DIR, { recursive: true });
  const cssPath = path.join(DIST_DIR, 'pogo-icons.css');
  await fs.writeFile(cssPath, fullCss);

  // Write minified
  const minCss = minifyCSS(fullCss);
  const minPath = path.join(DIST_DIR, 'pogo-icons.min.css');
  await fs.writeFile(minPath, minCss);

  const cssKB = (Buffer.byteLength(fullCss) / 1024).toFixed(1);
  const minKB = (Buffer.byteLength(minCss) / 1024).toFixed(1);

  console.log(`Species classes: ${generated}`);
  console.log(`Dex aliases:     ${dexAliases.length}`);
  console.log(`Output:          ${cssPath} (${cssKB} KB)`);
  console.log(`Minified:        ${minPath} (${minKB} KB)`);
  console.log('');
}

function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')       // Remove comments (including /*! */ header)
    .replace(/\s+/g, ' ')                    // Collapse whitespace
    .replace(/\s*([{}:;,>~+])\s*/g, '$1')   // Remove space around punctuation
    .replace(/;}/g, '}')                     // Remove trailing semicolons before }
    .replace(/^\s+/, '')                     // Trim leading
    .replace(/\s+$/, '');                    // Trim trailing
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
