# pogo-icons

FontAwesome-style Pokemon GO sprite icons. One CSS file, simple class names, composable effects.

## Quick Start

```html
<!-- Include the CSS -->
<link rel="stylesheet" href="dist/pogo-icons.css">

<!-- Use it -->
<i class="pogo pogo-pikachu"></i>
<i class="pogo pogo-charizard pogo-shadow"></i>
<i class="pogo pogo-mewtwo pogo-shiny pogo-xl"></i>
```

## Usage

### By Name

```html
<i class="pogo pogo-bulbasaur"></i>
<i class="pogo pogo-charizard"></i>
<i class="pogo pogo-mewtwo"></i>
```

### By Dex Number

```html
<i class="pogo pogo-1"></i>    <!-- Bulbasaur -->
<i class="pogo pogo-25"></i>   <!-- Pikachu -->
<i class="pogo pogo-150"></i>  <!-- Mewtwo -->
```

### Forms

```html
<i class="pogo pogo-charizard-mega-x"></i>
<i class="pogo pogo-charizard-mega-y"></i>
<i class="pogo pogo-raticate-alolan"></i>
<i class="pogo pogo-giratina-origin"></i>
<i class="pogo pogo-deoxys-attack"></i>
```

### Effects

Effects are composable — combine any of them together.

```html
<i class="pogo pogo-mewtwo pogo-shadow"></i>           <!-- Purple shadow aura -->
<i class="pogo pogo-charizard pogo-shiny"></i>          <!-- Shiny sprite + sparkles -->
<i class="pogo pogo-dragonite pogo-purified"></i>       <!-- White/blue purified glow -->
<i class="pogo pogo-mewtwo pogo-shadow pogo-shiny"></i> <!-- Shadow + Shiny combo -->
```

Add `pogo-static` to disable animations:

```html
<i class="pogo pogo-mewtwo pogo-shadow pogo-static"></i>
```

### Fixed Sizes (px)

| Class | Size |
|-------|------|
| `pogo-xs` | 16px |
| `pogo-sm` | 24px |
| `pogo-md` | 32px |
| `pogo-lg` | 48px |
| `pogo-xl` | 64px |
| `pogo-2xl` | 96px |
| `pogo-3xl` | 128px |
| `pogo-4xl` | 192px |
| `pogo-5xl` | 256px |

```html
<i class="pogo pogo-pikachu pogo-xs"></i>
<i class="pogo pogo-pikachu pogo-xl"></i>
<i class="pogo pogo-pikachu pogo-5xl"></i>
```

### Relative Sizes (em)

Scale with parent font-size. `1x` = default size (1.8em).

| Class | Size |
|-------|------|
| `pogo-1x` | 1.8em |
| `pogo-2x` | 3.6em |
| `pogo-3x` | 5.4em |
| `pogo-4x` | 7.2em |
| `pogo-5x` | 9em |
| `pogo-6x` | 10.8em |
| `pogo-7x` | 12.6em |
| `pogo-8x` | 14.4em |

### Utility Classes

```html
<i class="pogo pogo-pikachu pogo-inline"></i>      <!-- Fits to line height -->
<i class="pogo pogo-pikachu pogo-fw"></i>           <!-- Fixed width for list alignment -->
<i class="pogo pogo-pikachu pogo-drop-shadow"></i>  <!-- Drop shadow for visibility -->
```

## Inline with Text

Icons scale naturally with surrounding text:

```html
<p>Catch <i class="pogo pogo-pikachu"></i> Pikachu today!</p>
```

## Build from Source

Requires Node.js 18+ and npm.

```bash
# Install dependencies
npm install

# Full build (fetches sprites from PokeMiners, optimizes, generates CSS)
npm run build

# CSS only (skip sprite download)
npm run build -- --css-only

# Skip fetch, rebuild from existing sprites
npm run build -- --skip-fetch
```

### Build Steps

1. **build-mapping** — Fetches PvPoke species data, maps to PokeMiners sprite filenames
2. **fetch-sprites** — Downloads GO sprites from PokeMiners/pogo_assets (256x256 PNG)
3. **optimize-sprites** — Compresses PNGs with sharp
4. **generate-css** — Assembles final CSS from source + species map

## Species Coverage

- 1,249 species classes (all released Pokemon GO species + forms)
- 996 dex-number aliases (base forms)
- Forms: Mega, Alolan, Galarian, Hisuian, Paldean, Origin, Therian, and more
- Costumes: Libre, Rock Star, Pop Star, etc.

## Sprite Sources

- **Pokemon GO** sprites via [PokeMiners/pogo_assets](https://github.com/PokeMiners/pogo_assets) (256x256 PNG)
- Species data via [PvPoke](https://github.com/pvpoke/pvpoke)

## License

Sprites are property of Niantic/The Pokemon Company. This project is for personal and community use.
