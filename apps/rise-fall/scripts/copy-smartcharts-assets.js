/**
 * Copies SmartCharts runtime assets from `node_modules/@deriv/deriv-charts/dist`
 * into the calling template's `public/` directory.
 *
 * Why: SmartCharts lazy-loads chunks, the Flutter chart engine, fonts, and sprite sheets
 * via `setSmartChartsPublicPath()`. Those files must be served at known URL paths, but
 * Next.js's `public/` only serves files physically located there — it can't reach into
 * `node_modules`. Copying keeps the package as the single source of truth (version-bump
 * the npm dep → rerun, no stale committed binaries).
 *
 * Usage: Called from template package.json scripts with the template directory as CWD.
 * E.g. "copy-smartcharts-assets": "node ../../scripts/copy-smartcharts-assets.js"
 */
const fs = require('node:fs');
const path = require('node:path');

const TEMPLATE_ROOT = process.cwd();
const PKG = '@deriv/deriv-charts/dist';

const CANDIDATES = [
  path.resolve(TEMPLATE_ROOT, 'node_modules', PKG),
  path.resolve(TEMPLATE_ROOT, '../../node_modules', PKG),
];

const SOURCE = CANDIDATES.find(fs.existsSync) ?? null;
const DEST = path.join(TEMPLATE_ROOT, 'public');

if (!SOURCE) {
  console.warn(
    `[copy-smartcharts-assets] skip: source not found at:\n` +
      CANDIDATES.map(c => `  ${c}`).join('\n') +
      `\nRun \`npm install\` at the repo root first.`
  );
  process.exit(0);
}

// Mirror Deriv's own template asset layout (the only proven-working one):
//   - SmartCharts JS chunks + the `chart/` Flutter app  → `public/js/smartcharts/`
//     (loaded via setSmartChartsPublicPath('/js/smartcharts/'))
//   - the Flutter asset bundle (FontManifest/AssetManifest/fonts/shaders), which
//     the engine fetches from the ROOT `/assets/` path → `public/assets/`
fs.mkdirSync(DEST, { recursive: true });

const CODE_DEST = path.join(DEST, 'js', 'smartcharts');
fs.mkdirSync(CODE_DEST, { recursive: true });
fs.cpSync(SOURCE, CODE_DEST, { recursive: true, force: true });

const CHART_ASSETS = path.join(SOURCE, 'chart', 'assets');
if (fs.existsSync(CHART_ASSETS)) {
  fs.cpSync(CHART_ASSETS, path.join(DEST, 'assets'), { recursive: true, force: true });
}

console.log(
  `[copy-smartcharts-assets] copied ${SOURCE} → ${CODE_DEST} (+ chart/assets → ${path.join(DEST, 'assets')})`
);
