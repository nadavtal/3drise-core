// check-pure — @3driseai/3drise-core must stay React-free (it is the engine every renderer shares:
// the React viewer today, a vanilla / web-component renderer later). Runs first in `npm run build`.
// Fails on any import of react / react-dom / @react-three/* / @gsap/react, and on any .tsx file.
// React-only code belongs in @3driseai/3drise-viewer; a material's JSX registration goes in
// packages/viewer/src/registerMaterials.ts.
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';

const SRC = fileURLToPath(new URL('./src', import.meta.url));
const BANNED = /(?:from\s*|import\s*\(\s*|import\s+)['"](react|react-dom|react\/[^'"]*|@react-three\/[^'"]+|@gsap\/react)['"]/;
const walk = (d, out = []) => { for (const e of readdirSync(d)) { const p = join(d, e); statSync(p).isDirectory() ? walk(p, out) : out.push(p); } return out; };
const bad = [];
for (const f of walk(SRC)) {
    if (f.endsWith('.tsx')) { bad.push(`${relative(SRC, f)}  (a .tsx file — React components belong in the viewer)`); continue; }
    if (!/\.(ts|js|mjs)$/.test(f)) continue;
    readFileSync(f, 'utf8').split(/\r?\n/).forEach((line, i) => {
        const t = line.trimStart();
        if (t.startsWith('//') || t.startsWith('*')) return;
        const m = line.match(BANNED);
        if (m) bad.push(`${relative(SRC, f)}:${i + 1}  imports ${m[1]}`);
    });
}
if (bad.length) { console.error(`\n✖ check-pure: core must not depend on React:\n  ${bad.join('\n  ')}\n`); process.exit(1); }
console.log('✔ check-pure: core is React-free');
