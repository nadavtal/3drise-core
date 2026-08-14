// Post-build: append .js to relative import/export specifiers in dist/**/*.js
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.js')) out.push(p);
  }
  return out;
}

const RE = /(from\s+|import\s*\(\s*|import\s+)(['"])(\.\.?\/[^'"]+)\2/g;

for (const file of walk(resolve('dist'))) {
  const src = readFileSync(file, 'utf8');
  const next = src.split('\n').map((line) => {
    if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) return line;
    return line.replace(RE, (m, pre, q, spec) => {
    if (spec.endsWith('.js') || spec.endsWith('.json')) return m;
    const base = resolve(dirname(file), spec);
    const fixed = existsSync(base + '.js') ? spec + '.js'
      : existsSync(join(base, 'index.js')) ? spec + '/index.js'
      : spec + '.js';
    return `${pre}${q}${fixed}${q}`;
    });
  }).join('\n');
  if (next !== src) writeFileSync(file, next);
}
console.log('add-js-extensions: done');
