#!/usr/bin/env node

/**
 * build-mapping.js
 *
 * Fetches PvPoke pokemon.json and maps each species to a PokeMiners sprite filename.
 * Outputs data/species-map.json.
 */

const fs = require('fs/promises');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const PVPOKE_URL = 'https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/gamemaster/pokemon.json';

async function main() {
  console.log('=== Build Mapping ===\n');

  // Load form codes
  const formCodesRaw = await fs.readFile(path.join(DATA_DIR, 'form-codes.json'), 'utf8');
  const formCodes = JSON.parse(formCodesRaw);
  const formMap = formCodes.formMap;
  const defaultForms = formCodes.defaultForms;

  // Fetch PvPoke data
  console.log('Fetching PvPoke pokemon.json...');
  const res = await fetch(PVPOKE_URL);
  if (!res.ok) throw new Error(`Failed to fetch PvPoke data: ${res.status}`);
  const pokemonData = await res.json();
  console.log(`  Loaded ${pokemonData.length} entries.\n`);

  const speciesMap = [];
  let skipped = 0;

  for (const pokemon of pokemonData) {
    const tags = pokemon.tags || [];

    // Skip shadows (CSS effect, not separate species)
    if (tags.includes('shadow')) { skipped++; continue; }
    // Skip duplicates and teambuilder excludes
    if (tags.includes('duplicate') || tags.includes('duplicate1500') || tags.includes('teambuilderexclude')) {
      skipped++;
      continue;
    }

    // Parse name and form
    const { name, form } = parseNameAndForm(pokemon.speciesName);
    const dex = pokemon.dex;

    // Build CSS class name
    const className = generateClassName(name, form);

    // Map form to PokeMiners form code
    const formCode = resolveFormCode(dex, form, formMap, defaultForms);

    // Construct sprite filenames
    // Costume codes start with 'c' (e.g., "cLIBRE"), form codes use '.f' prefix
    let spriteFile, shinySpriteFile;
    if (!formCode) {
      spriteFile = `pm${dex}.icon.png`;
      shinySpriteFile = `pm${dex}.s.icon.png`;
    } else if (formCode.startsWith('c')) {
      // Costume variant: pm25.cLIBRE.icon.png
      spriteFile = `pm${dex}.${formCode}.icon.png`;
      shinySpriteFile = `pm${dex}.${formCode}.s.icon.png`;
    } else {
      // Form variant: pm6.fMEGA_X.icon.png
      spriteFile = `pm${dex}.f${formCode}.icon.png`;
      shinySpriteFile = `pm${dex}.f${formCode}.s.icon.png`;
    }

    speciesMap.push({
      name,
      form,
      dex,
      className,
      pvpokeId: pokemon.speciesId,
      spriteFile,
      shinySpriteFile,
      tags: tags.filter(t => ['legendary', 'mythical', 'mega', 'ultrabeast'].includes(t)),
    });
  }

  // Sort by dex number, then form
  speciesMap.sort((a, b) => a.dex - b.dex || a.form.localeCompare(b.form));

  // Check for duplicate classNames
  const seen = new Set();
  const dupes = [];
  for (const entry of speciesMap) {
    if (seen.has(entry.className)) {
      dupes.push(entry.className);
    }
    seen.add(entry.className);
  }
  if (dupes.length > 0) {
    console.log(`  WARNING: ${dupes.length} duplicate class names: ${dupes.slice(0, 5).join(', ')}...`);
  }

  // Write output
  const outPath = path.join(DATA_DIR, 'species-map.json');
  await fs.writeFile(outPath, JSON.stringify(speciesMap, null, 2));

  console.log(`Species mapped: ${speciesMap.length}`);
  console.log(`Skipped:        ${skipped}`);
  console.log(`Output:         ${outPath}\n`);

  // Count unmapped forms (form in PvPoke but not in form-codes.json)
  const unmapped = speciesMap.filter(e =>
    e.form && !(e.form in formMap) && !Object.values(defaultForms).includes(e.form)
  );
  if (unmapped.length > 0) {
    console.log(`Unmapped forms (${unmapped.length}):`);
    for (const u of unmapped.slice(0, 20)) {
      console.log(`  ${u.name} (${u.form}) → ${u.spriteFile}`);
    }
    if (unmapped.length > 20) console.log(`  ... and ${unmapped.length - 20} more`);
  }
}

function parseNameAndForm(speciesName) {
  const match = speciesName.match(/^(.+?)\s*\((.+)\)$/);
  if (match) {
    return { name: match[1].trim(), form: match[2].trim() };
  }
  return { name: speciesName, form: '' };
}

function generateClassName(name, form) {
  let cls = name.toLowerCase()
    .replace(/['']/g, '')           // Farfetch'd → farfetchd
    .replace(/[.:]/g, '')            // Mr. Mime → mr mime, Type: Null → type null
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  if (form) {
    const formSlug = form.toLowerCase()
      .replace(/['']/g, '')
      .replace(/[.:]/g, '')
      .replace(/[^a-z0-9\s%-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    cls += '-' + formSlug;
  }

  return cls;
}

function resolveFormCode(dex, form, formMap, defaultForms) {
  // Base form — no suffix
  if (!form) return null;

  // Check if this form is the default for this dex number
  const dexStr = String(dex);
  if (defaultForms[dexStr] && defaultForms[dexStr] === form) {
    return null;
  }

  // Look up in form map
  if (form in formMap) {
    return formMap[form]; // may be null (meaning default form)
  }

  // Try uppercased form name as fallback
  const fallback = form.toUpperCase().replace(/[\s-]+/g, '_').replace(/[^A-Z0-9_]/g, '');
  console.log(`  INFO: No mapping for "${form}" (dex ${dex}), using fallback: ${fallback}`);
  return fallback;
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
