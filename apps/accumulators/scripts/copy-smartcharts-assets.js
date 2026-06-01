/**
 * Copies SmartCharts runtime assets from `node_modules/@deriv-com/smartcharts-champion/dist`
 * into the calling template's `public/` directory.
 *
 * Why: SmartCharts lazy-loads chunks, the Flutter chart engine, fonts, and sprite sheets
 * via `setSmartChartsPublicPath()`. Those files must be served at known URL paths, but
 * Next.js's `public/` only serves files physically located there — it can't reach into
 * `node_modules`. Copying keeps the package as the single source of truth (version-bump
 * the npm dep → rerun, no stale committed binaries).
 *
 * Usage: Called from template package.json scripts with the template directory as CWD.
 * E.g. "copy-smartcharts-assets": "node ../../scripts/copy-smartcharts-assets.js" yeah
 */
const fs = require('node:fs');
const path = require('node:path');

const TEMPLATE_ROOT = process.cwd();
const PKG = '@deriv-com/smartcharts-champion/dist';

// npm workspaces hoists to repo root; fallback for local installs inside the app
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

fs.mkdirSync(DEST, { recursive: true });
// recursive copy, preserving existing files like `logo.png` in public/
fs.cpSync(SOURCE, DEST, { recursive: true, force: true });

console.log(`[copy-smartcharts-assets] copied ${SOURCE} → ${DEST}`);
