// Shared building blocks: a port of Scilab's default uniform generator,
// small matrix helpers and the graph setup every lab script starts with.

// Scilab's rand() (law "uniform") uses urand: a linear congruential
// generator  iy = (843314861 * iy + 453816693) mod 2^31,  value = iy / 2^31.
export function scilabRand(seed) {
  let iy = seed >>> 0;
  const next = () => {
    iy = (Math.imul(iy, 843314861) + 453816693) & 0x7fffffff;
    return iy / 2147483648;
  };
  // rand(rows, cols): Scilab fills matrices column by column.
  return (rows, cols) => {
    const m = zeros(rows, cols);
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) m[r][c] = next();
    return m;
  };
}

export const zeros = (r, c = r) => Array.from({ length: r }, () => new Array(c).fill(0));
export const eye = (n) => zeros(n).map((row, i) => (row[i] = 1, row));
export const clone = (m) => m.map((row) => row.slice());
export const map = (m, f) => m.map((row, i) => row.map((v, j) => f(v, i, j)));
export const add = (a, b) => map(a, (v, i, j) => v + b[i][j]);
export const transpose = (m) => m[0].map((_, j) => m.map((row) => row[j]));

export function mul(a, b) {
  const n = a.length, k = b.length, p = b[0].length;
  const out = zeros(n, p);
  for (let i = 0; i < n; i++)
    for (let t = 0; t < k; t++) {
      const v = a[i][t];
      if (v) for (let j = 0; j < p; j++) out[i][j] += v * b[t][j];
    }
  return out;
}

export function pow(m, k) {
  let out = m;
  for (let i = 1; i < k; i++) out = mul(out, m);
  return out;
}

// The scripts use num = 10 + n3; the page can override it with variant.num.
export const vertexCount = (v) => v.num ?? 10 + v.n3;

export const variantSeed = ({ n1, n2, n3, n4 }) => n1 * 1000 + n2 * 100 + n3 * 10 + n4;

// The "[PART 1 (lab 1)]" block shared by all scripts.
//   coef = [a, b, c] in  A = floor((1.0 - n3*a - n4*b - c) * T)
// Returns the raw matrix A3 (directed), A2 (symmetrised) and the rand()
// closure, so labs 5-6 can keep drawing from the same stream for weights.
export function buildGraph(variant, coef) {
  const { n3, n4 } = variant;
  const num = vertexCount(variant);
  const rand = scilabRand(variantSeed(variant));
  const T = add(rand(num, num), rand(num, num));
  const k = 1.0 - n3 * coef[0] - n4 * coef[1] - coef[2];
  const A3 = map(T, (v) => Math.floor(k * v));
  const A2 = map(A3, (v, i, j) => (v || A3[j][i] ? 1 : 0));
  return { num, A3, A2, rand };
}

// Labs 5-6: random weights, kept on one direction of each edge, then mirrored.
//   Wt = round(rand(num,num)*100 .* A)
//   B  = Wt & ones(num,num)
//   Wt = (bool2s(B & ~B') + bool2s(B & B') .* tril(ones(num,num),-1)) .* Wt
//   W  = Wt + Wt'
export function buildWeights(A, rand) {
  const n = A.length;
  const R = rand(n, n);
  let Wt = map(R, (v, i, j) => scilabRound(v * 100 * A[i][j]));
  const B = map(Wt, (v) => (v !== 0 ? 1 : 0));
  Wt = map(Wt, (v, i, j) => {
    const one = B[i][j] && !B[j][i] ? 1 : 0;
    const both = B[i][j] && B[j][i] && i > j ? 1 : 0;
    return (one + both) * v;
  });
  return add(Wt, transpose(Wt));
}

// Scilab rounds halves away from zero.
const scilabRound = (v) => Math.sign(v) * Math.round(Math.abs(v));

// Edge lists for drawing.
export function directedEdges(A3) {
  const out = [];
  A3.forEach((row, i) => row.forEach((v, j) => v && out.push({ a: i, b: j, directed: true })));
  return out;
}
export function undirectedEdges(A2) {
  const out = [];
  A2.forEach((row, i) => row.forEach((v, j) => v && j >= i && out.push({ a: i, b: j, directed: false })));
  return out;
}

// Scilab's string() for the numbers these scripts print.
export const str = (v) => (v === Infinity ? 'Inf' : String(v));

// Collects what the script would print with disp(), in display order.
// Messages come as [ukrainian, english]: the page shows English, and the
// Scilab comparison uses the original Ukrainian text.
export class Log {
  constructor(lang = 'en') { this.items = []; this.k = lang === 'uk' ? 0 : 1; }
  pick(s) { return Array.isArray(s) ? s[this.k] : s; }
  text(s) { this.items.push({ t: 'text', s: this.pick(s) }); }
  matrix(title, m) { this.items.push({ t: 'matrix', title: this.pick(title), m: clone(m) }); }
  get length() { return this.items.length; }
}
