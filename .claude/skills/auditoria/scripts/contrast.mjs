// WCAG contrast of the Soraq theme tokens (frontend/src/design-system/styles/theme.css), dark and light.
// Parses `--token: oklch(L C H [/ a])` and `var(--token)` references. Exit 1 if any pair fails.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const css = fs.readFileSync(path.join(root, 'frontend/src/design-system/styles/theme.css'), 'utf8');

function block(selectorStart) {
  const i = css.indexOf(selectorStart);
  if (i === -1) throw new Error(`Theme block not found: ${selectorStart}`);
  const open = css.indexOf('{', i);
  let depth = 0;
  for (let j = open; j < css.length; j++) {
    if (css[j] === '{') depth++;
    if (css[j] === '}' && --depth === 0) return css.slice(open + 1, j);
  }
  throw new Error('Unbalanced block');
}

function parseVars(text) {
  const vars = {};
  for (const m of text.matchAll(/--([\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].replace(/\/\*.*?\*\//g, '').trim();
  return vars;
}

function resolve(vars, name, depth = 0) {
  const value = vars[name];
  if (!value || depth > 5) return null;
  const ref = value.match(/^var\(--([\w-]+)\)$/);
  if (ref) return resolve(vars, ref[1], depth + 1);
  const m = value.match(/^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)/);
  if (!m) return null;
  const L = m[1].endsWith('%') ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
  return [L, parseFloat(m[2]), parseFloat(m[3])];
}

function toLinear([L, C, h]) {
  const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((v) => Math.min(1, Math.max(0, v)));
}
const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const ratio = (x, y) => {
  const [hi, lo] = [lum(toLinear(x)), lum(toLinear(y))].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
};

// [foreground, background, minimum ratio, description]
const PAIRS = [
  ['foreground', 'background', 4.5, 'Texto principal'],
  ['foreground', 'surface', 4.5, 'Texto sobre cards/sidebars'],
  ['foreground', 'overlay', 4.5, 'Texto en modales/menús'],
  ['muted', 'background', 4.5, 'Texto secundario'],
  ['muted', 'surface', 4.5, 'Texto secundario en cards'],
  ['muted', 'surface-secondary', 4.5, 'Texto secundario en superficies secundarias'],
  ['muted', 'default', 4.5, 'Texto sobre ítem activo'],
  ['muted', 'overlay', 4.5, 'Texto secundario en modales'],
  ['accent-foreground', 'accent', 4.5, 'Botón primario'],
  ['danger-foreground', 'danger', 4.5, 'Botón destructivo'],
  ['link', 'background', 4.5, 'Links'],
  ['focus', 'background', 3, 'Anillo de foco (no-texto)'],
  ['focus', 'surface', 3, 'Anillo de foco sobre surface'],
  ['field-border', 'field-background', 3, 'Borde de campos (no-texto)'],
  ['background', 'foreground', 4.5, 'Botón contrast (pill)'],
];

const themes = {
  oscuro: parseVars(block(":root:not([data-theme='light'])")),
  claro: parseVars(block("[data-theme='light']")),
};

let fails = 0;
let checks = 0;
for (const [theme, vars] of Object.entries(themes)) {
  console.log(`\n## Tema ${theme}`);
  console.log('| Par | Ratio | Mínimo | Resultado |\n|---|---|---|---|');
  for (const [fg, bg, min, label] of PAIRS) {
    const a = resolve(vars, fg), b = resolve(vars, bg);
    if (!a || !b) {
      console.log(`| ${label} (${fg}/${bg}) | — | ${min} | SKIP (token no definido en el tema) |`);
      continue;
    }
    checks++;
    const r = ratio(a, b);
    const ok = r >= min;
    if (!ok) fails++;
    console.log(`| ${label} (${fg}/${bg}) | ${r.toFixed(2)}:1 | ${min}:1 | ${ok ? (r >= 7 && min === 4.5 ? 'PASS (AAA)' : 'PASS') : 'FAIL'} |`);
  }
}
console.log(`\nResumen: ${checks} pares · ${fails} fallas`);
process.exit(fails ? 1 : 0);
