// Runs every Scilab/*.sce in real Scilab (graphics stubbed out) for several
// variants and checks that the JS port prints exactly the same thing.
//
//   node web/test/compare.mjs                      # needs scilab-cli on PATH
//   SCILAB_DOCKER=scilab-cli-local node web/test/compare.mjs
//
// Scilab >= 6.1 shows disp(a, b) arguments in order (a, then b); the scripts
// were written for the older reverse order, which the web page uses. The
// comparison accounts for that.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LABS } from '../js/labs.js';

const here = dirname(fileURLToPath(import.meta.url));
const scilabDir = resolve(here, '../../Scilab');
const stubs = join(here, 'scilab-stubs.sce');
const work = mkdtempSync(join(tmpdir(), 'labs-'));

const VARIANTS = [
  { n1: 8, n2: 5, n3: 0, n4: 6 },  // the variant in the scripts
  { n1: 1, n2: 2, n3: 0, n4: 3 },
  { n1: 4, n2: 0, n3: 1, n4: 7 },  // 11 vertices
  { n1: 9, n2: 9, n3: 2, n4: 9 },  // 12 vertices
  { n1: 0, n2: 7, n3: 0, n4: 0 },
  { n1: 3, n2: 1, n3: 0, n4: 5 },
  { n1: 8, n2: 5, n3: 0, n4: 6, num: 6 },   // custom vertex counts
  { n1: 2, n2: 4, n3: 1, n4: 8, num: 16 },
];

function runScilab(file) {
  const code = `exec("${stubs}", -1); exec("${file}", -1);`;
  const args = ['-nb', '-quit', '-e', code];
  const image = process.env.SCILAB_DOCKER;
  const [cmd, full] = image
    ? ['docker', ['run', '--rm', '-e', 'LANG=C.UTF-8', '-v', `${here}:${here}:ro`, '-v', `${work}:${work}:ro`, image, 'scilab-cli', ...args]]
    : ['scilab-cli', args];
  try {
    return execFileSync(cmd, full, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    return (e.stdout || '') + '\n!! scilab error: ' + (e.stderr || e.message);
  }
}

const isNumRow = (l) => /^[-+\d.eEDInf\s]+$/.test(l) && /\d|Inf/.test(l);
function normScilab(text) {
  return text.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    if (isNumRow(l)) return l.split(/\s+/).map((v) => String(Number(v.replace('D', 'e')))).join(' ');
    return l.replace(/^"(.*)"$/, '$1');
  }).filter(Boolean);
}

function normJs(log) {
  const out = [];
  for (const it of log.items) {
    if (it.t === 'matrix') { it.m.forEach((r) => out.push(r.join(' '))); out.push(it.title); }
    else if (it.s && !it.s.startsWith('(')) out.push(it.s); // skip the port's own notes
  }
  // disp("δ(-) ...", "δ(+) ...") -> Scilab 6.1 prints δ(-) first.
  for (let i = 0; i + 1 < out.length; i++)
    if (out[i].startsWith('δ(+)') && out[i + 1].startsWith('δ(-)')) [out[i], out[i + 1]] = [out[i + 1], out[i]];
  return out;
}

let failed = 0;
for (const v of VARIANTS) {
  for (const lab of LABS) {
    const src = readFileSync(join(scilabDir, lab.file), 'utf8')
      .replace(/^n1 = \d+/m, `n1 = ${v.n1}`).replace(/^n2 = \d+/m, `n2 = ${v.n2}`)
      .replace(/^n3 = \d+/m, `n3 = ${v.n3}`).replace(/^n4 = \d+/m, `n4 = ${v.n4}`)
      .replace(/^num = 10 \+ n3/m, v.num ? `num = ${v.num}` : '$&');
    const tag = `${v.n1}${v.n2}${v.n3}${v.n4}${v.num ? `-n${v.num}` : ''}`;
    const file = join(work, `v${tag}-${lab.file}`);
    writeFileSync(file, src);
    const expected = normScilab(runScilab(file));
    const { log } = lab.run(v, { directed: lab.directed, lang: 'uk' });
    const actual = normJs(log);
    const label = `variant ${tag}  lab ${lab.id}`;
    const at = expected.findIndex((l, i) => l !== actual[i]);
    // Where the script crashes (e.g. lab 4 when DFS cannot reach every
    // vertex), the port prints a note and stops cleanly instead.
    const crash = expected.findIndex((l) => l.startsWith('!! scilab error'));
    const notes = log.items.some((it) => it.t === 'text' && it.s.startsWith('('));
    if (at < 0 && expected.length === actual.length) {
      console.log(`ok    ${label}  (${expected.length} lines)`);
    } else if (crash >= 0 && notes && at === crash) {
      console.log(`ok    ${label}  (${crash} lines; Scilab then fails with "${expected[crash + 1]}", the port stops with a note)`);
    } else {
      failed++;
      const i = at < 0 ? Math.min(expected.length, actual.length) : at;
      console.log(`FAIL  ${label}  first difference at line ${i + 1}`);
      console.log(`      scilab: ${JSON.stringify(expected.slice(i, i + 3))}`);
      console.log(`      js:     ${JSON.stringify(actual.slice(i, i + 3))}`);
    }
  }
}
console.log(failed ? `\n${failed} mismatches` : '\nall outputs match');
process.exit(failed ? 1 : 0);
