// i18n audit for Soraq.
//  - Unused catalog keys (considering dynamic prefixes like t(`workspace.roles.${role}`))
//  - Literal keys used in code that do not exist in the catalog
//  - Heuristic: hardcoded visible text in JSX / accessibility attributes
//  - Backend: HttpException/Validator keys missing in backend/lang/es
// Exit: 0 clean · 2 warnings · 1 error
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const src = path.join(root, 'frontend/src');
const catalogDir = path.join(src, 'i18n/locales/es');

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });

// ── Load catalog (plain object literals exported as consts) ─────────────────
const out = {};
for (const file of fs.readdirSync(catalogDir).filter((f) => f.endsWith('.ts') && f !== 'index.ts')) {
  let code = fs.readFileSync(path.join(catalogDir, file), 'utf8');
  code = code.replace(/^import .*$/gm, '').replace(/export const (\w+)\s*(:\s*[\w<>]+)?\s*=/g, 'out.$1 =');
  new Function('out', code)(out);
}
const leaves = [];
const walkKeys = (obj, prefix) => {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string' || (v && typeof v === 'object' && 'one' in v && 'other' in v)) leaves.push(key);
    else if (v && typeof v === 'object') walkKeys(v, key);
  }
};
walkKeys(out, '');
const leafSet = new Set(leaves);

// ── Scan code ────────────────────────────────────────────────────────────────
const codeFiles = walk(src).filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes(`${path.sep}locales${path.sep}`));
const used = new Set();
const dynamicPrefixes = new Set();
const missing = [];
const hardcoded = [];

// Namespaces come from the catalog itself, so new feature catalogs are audited automatically.
const ns = Object.keys(out).join('|');
const keyRe = new RegExp(String.raw`['"\x60]((?:${ns})\.[A-Za-z0-9_.]+)['"\x60]`, 'g');
const dynRe = new RegExp(String.raw`\x60((?:${ns})\.[A-Za-z0-9_.]*)\$\{`, 'g');

for (const file of codeFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file).replace(/\\/g, '/');
  for (const m of text.matchAll(keyRe)) {
    used.add(m[1]);
    const isPrefix = leaves.some((k) => k.startsWith(m[1] + '.'));
    if (!leafSet.has(m[1]) && !isPrefix) missing.push(`${rel}: ${m[1]}`);
  }
  for (const m of text.matchAll(dynRe)) dynamicPrefixes.add(m[1]);

  if (file.endsWith('.tsx') && !rel.includes('src/i18n/')) {
    text.split('\n').forEach((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('{/*')) return;
      // JSX text node with 2+ letters (ignores {expressions}, single symbols, brand name).
      const jsxText = [...line.matchAll(/>([^<>{}]*[A-Za-zÁÉÍÓÚáéíóúñÑ¿¡]{2,}[^<>{}]*)</g)]
        .map((m) => m[1].trim())
        // Skip brand/initials, function calls and JS expressions that leak into the match (&&, ||, =>, ternaries).
        .filter((t) => t && !/^(Soraq|[A-Z]{1,3})$/.test(t) && !/^[\w.]+\(/.test(t) && !/=>|&&|\|\||^[:?]/.test(t));
      const attrs = [...line.matchAll(/\b(aria-label|title|placeholder|alt)="([^"{]*[A-Za-zÁÉÍÓÚáéíóúñÑ]{2,}[^"]*)"/g)].map((m) => `${m[1]}="${m[2]}"`);
      for (const t of [...jsxText, ...attrs]) hardcoded.push(`${rel}:${i + 1}  ${t}`);
    });
  }
}

const unused = leaves.filter((k) => !used.has(k) && ![...dynamicPrefixes].some((p) => k.startsWith(p)));

// ── Backend lang keys ────────────────────────────────────────────────────────
const langDir = path.join(root, 'backend/lang/es');
const backendMissing = [];
if (fs.existsSync(langDir)) {
  const langKeys = new Set();
  for (const file of fs.readdirSync(langDir)) {
    const text = fs.readFileSync(path.join(langDir, file), 'utf8');
    for (const m of text.matchAll(/'([a-z_]+)'\s*=>/g)) langKeys.add(`${path.basename(file, '.php')}.${m[1]}`);
  }
  for (const file of walk(path.join(root, 'backend/src')).filter((f) => f.endsWith('.php'))) {
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(/'((?:errors|validation)\.[a-z_]+)'/g)) {
      if (!langKeys.has(m[1])) backendMissing.push(`${path.relative(root, file).replace(/\\/g, '/')}: ${m[1]}`);
    }
  }
}

const section = (title, items) => {
  console.log(`\n## ${title} (${items.length})`);
  items.slice(0, 60).forEach((i) => console.log(`- ${i}`));
  if (items.length > 60) console.log(`- … ${items.length - 60} más`);
};
section('Claves usadas que no existen en el catálogo (ERROR)', missing);
section('Claves del backend sin traducción en backend/lang/es (ERROR)', backendMissing);
section('Claves del catálogo sin uso (revisar)', unused);
section('Posibles textos hardcodeados en JSX (revisar)', hardcoded);

console.log(
  `\nResumen: ${leaves.length} claves · faltantes ${missing.length} · backend faltantes ${backendMissing.length} · sin uso ${unused.length} · posibles hardcodeados ${hardcoded.length}`,
);
process.exit(missing.length || backendMissing.length ? 1 : unused.length || hardcoded.length ? 2 : 0);
