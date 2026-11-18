// Ports of Scilab/*.sce. Each lab returns { log, stages }:
//   log    - what the script prints, in order (see core.Log)
//   stages - frames for the viewer; each one remembers how much of the
//            log had been printed when it was reached (logLen).
// The algorithms follow the original scripts step for step, including their
// quirks, so the output matches what Scilab prints for the same variant.
import {
  buildGraph, buildWeights, clone, directedEdges, eye, add, map, mul, pow,
  undirectedEdges, zeros, str, Log,
} from './core.js';

const graphEdges = (g, directed) => (directed ? directedEdges(g.A3) : undirectedEdges(g.A2));

function stageList(log) {
  const stages = [];
  stages.add = (s) => stages.push({ logLen: log.length, ...s });
  return stages;
}

const weighted = (edges, W) => edges.map((e) => ({ ...e, w: W[e.a][e.b] }));

// ---------------------------------------------------------------- lab 1
function lab1(variant, { directed, lang }) {
  const log = new Log(lang);
  const g = buildGraph(variant, [0.02, 0.005, 0.25]);
  const stages = stageList(log);
  log.matrix(['Матриця суміжності орієнтованого графа', 'Adjacency matrix of the directed graph'], g.A3);
  log.matrix(['Матриця суміжності неорієнтованого графа', 'Adjacency matrix of the undirected graph'], g.A2);
  stages.add({
    title: directed ? 'Directed graph' : 'Undirected graph',
    caption: `${g.num} vertices, ${graphEdges(g, directed).length} edges.`,
    graph: { n: g.num, edges: graphEdges(g, directed) },
  });
  return { log, stages };
}

// Part 2 of labs 2-3: vertex degrees and semi-degrees.
function degrees(g, log, printDegrees) {
  const { num, A2, A3 } = g;
  const deg = [], isolated = [], pendulous = [];
  if (printDegrees) log.text(['Степені вершин неорієнтованого графа:', 'Vertex degrees of the undirected graph:']);
  for (let i = 0; i < num; i++) {
    const c = A2[i].filter(Boolean).length;
    if (c === 0) isolated.push(i + 1);
    else if (c === 1) pendulous.push(i + 1);
    if (printDegrees) log.text([`Степінь вершини δ(${i + 1}) = ${c}`, `Degree of vertex δ(${i + 1}) = ${c}`]);
    deg.push(c);
  }
  const out = new Array(num).fill(0), inn = new Array(num).fill(0);
  for (let i = 0; i < num; i++)
    for (let u = 0; u < num; u++)
      if (A3[i][u]) { out[i]++; inn[u]++; }
  log.text(['Напівстепені виходу та заходу напрямленого графа:', 'Out- and in-degrees of the directed graph:']);
  for (let i = 0; i < num; i++) {
    log.text([`Вершина ${i + 1}:`, `Vertex ${i + 1}:`]);
    log.text(`δ(+) = ${out[i]}`);
    log.text(`δ(-) = ${inn[i]}`);
  }
  return { deg, isolated, pendulous, out, inn };
}

// ---------------------------------------------------------------- lab 2
function lab2(variant, { directed, lang }) {
  const log = new Log(lang);
  const g = buildGraph(variant, [0.01, 0.01, 0.3]);
  const stages = stageList(log);
  log.matrix(['Матриця суміжності орієнтованого графа', 'Adjacency matrix of the directed graph'], g.A3);
  log.matrix(['Матриця суміжності неорієнтованого графа', 'Adjacency matrix of the undirected graph'], g.A2);
  const edges = graphEdges(g, directed);
  stages.add({
    title: directed ? 'Directed graph' : 'Undirected graph',
    caption: `${g.num} vertices, ${edges.length} edges.`,
    graph: { n: g.num, edges },
  });

  const d = degrees(g, log, true);
  const list = (arr) => (arr.length ? arr.join(', ') + ' ' : '0');
  log.text([`Ізольовані вершини: ${list(d.isolated)}`, `Isolated vertices: ${list(d.isolated)}`]);
  log.text([`Висячі вершини: ${list(d.pendulous)}`, `Pendant vertices: ${list(d.pendulous)}`]);
  const regular = d.deg.every((v) => v === d.deg[0]);
  log.text(regular
    ? [`Неорієнтований граф однорідний - степінь рівна ${d.deg[0]}`, `The undirected graph is regular - every degree is ${d.deg[0]}`]
    : ['Неорієнтований граф неоднорідний', 'The undirected graph is not regular']);

  stages.add({
    title: 'Vertex degrees',
    caption: directed
      ? 'Badges show δ(+) / δ(-) of the directed graph.'
      : 'Badges show the degree in the undirected graph. Isolated vertices are dashed, pendant ones are marked.',
    graph: {
      n: g.num, edges,
      nodes: d.deg.map((v, i) => ({
        badge: directed ? `${d.out[i]}/${d.inn[i]}` : String(v),
        cls: d.isolated.includes(i + 1) ? 'isolated' : d.pendulous.includes(i + 1) ? 'pendant' : '',
      })),
    },
  });
  return { log, stages };
}

// ---------------------------------------------------------------- lab 3
function lab3(variant, { directed, lang }) {
  const log = new Log(lang);
  const g = buildGraph(variant, [0.005, 0.005, 0.27]);
  const { num } = g;
  const stages = stageList(log);
  const edges = graphEdges(g, directed);
  log.matrix(['Матриця суміжності орієнтованого графа:', 'Adjacency matrix of the directed graph:'], g.A3);
  stages.add({
    title: directed ? 'Directed graph' : 'Undirected graph',
    caption: `${num} vertices, ${edges.length} edges.`,
    graph: { n: num, edges },
  });
  degrees(g, log, false);

  const E = g.A3, E2 = pow(E, 2), E3 = pow(E, 3);
  log.matrix('[E^2]:', E2);
  log.text(['Шляхи довжиною 2:', 'Paths of length 2:']);
  const ways3 = [];
  for (let i = 0; i < num; i++)
    for (let u = 0; u < num; u++) if (E[i][u])
      for (let t = 0; t < num; t++) if (E[u][t]) {
        log.text(`${i + 1} -> ${u + 1} -> ${t + 1}`);
        for (let z = 0; z < num; z++) if (E[t][z]) ways3.push([i, u, t, z]);
      }
  log.matrix('[E^3]:', E3);
  log.text(['Шляхи довжиною 3:', 'Paths of length 3:']);
  ways3.forEach((w) => log.text(w.map((v) => v + 1).join(' -> ')));

  let R = eye(num), Ek = E;
  for (let i = 1; i <= num - 1; i++) { R = add(R, Ek); Ek = mul(Ek, E); }
  R = map(R, (v) => (v ? 1 : 0));
  log.matrix(['Матриця досяжності R(bool):', 'Reachability matrix R (bool):'], R);
  const S = map(R, (v, i, j) => v * R[j][i]);
  log.matrix(['Матриця зв`язності S:', 'Strong connectivity matrix S:'], S);

  // Strongly connected components: vertices with identical rows of S.
  const comp = [[0]];
  for (let i = 1; i < num; i++) {
    const c = comp.find((cc) => S[i].every((v, u) => v === S[cc[0]][u]));
    if (c) c.push(i); else comp.push([i]);
  }
  comp.forEach((c, k) => {
    const set = `{${c.map((v) => v + 1).join(', ')}}`;
    log.text([`Компонента ${k + 1}: ${set}`, `Component ${k + 1}: ${set}`]);
  });

  const compOf = new Array(num);
  comp.forEach((c, k) => c.forEach((v) => (compOf[v] = k)));
  stages.add({
    title: 'Strongly connected components',
    caption: `${comp.length} component${comp.length === 1 ? '' : 's'}: ` +
      comp.map((c, k) => `K${k + 1} = {${c.map((v) => v + 1).join(', ')}}`).join(', '),
    graph: { n: num, edges, nodes: compOf.map((k) => ({ group: k, badge: `K${k + 1}` })) },
  });

  const C = zeros(comp.length);
  for (let i = 0; i < comp.length; i++)
    for (const u of comp[i])
      for (let t = 0; t < comp.length; t++)
        if (t !== i && comp[t].some((z) => E[u][z])) C[i][t] = 1;
  log.matrix(['Матриця суміжності графа конденсації:', 'Adjacency matrix of the condensation graph:'], C);
  stages.add({
    title: 'Condensation graph',
    caption: 'Each vertex is one strongly connected component.',
    graph: {
      n: comp.length, layout: 'ring', labels: comp.map((_, k) => `K${k + 1}`),
      edges: directedEdges(C),
      nodes: comp.map((c, k) => ({ group: k, badge: `{${c.map((v) => v + 1).join(',')}}` })),
    },
  });
  return { log, stages };
}

// ---------------------------------------------------------------- lab 4
function lab4(variant, { directed, lang }) {
  const log = new Log(lang);
  const g = buildGraph(variant, [0.01, 0.005, 0.15]);
  const { num, A3 } = g;
  const stages = stageList(log);
  const edges = graphEdges(g, directed);
  log.matrix(['Матриця суміжності орієнтованого графа:', 'Adjacency matrix of the directed graph:'], A3);
  stages.add({
    title: directed ? 'Directed graph' : 'Undirected graph',
    caption: 'Depth-first search follows the directed edges, using an explicit stack.',
    graph: { n: num, edges },
  });

  const order = new Array(num).fill(0); // v_num: position in the traversal
  const W = zeros(num);
  const stack = [], checked = new Set(), tree = [];
  let counter = 1, i = 0, stopped = false;

  // Start from the first vertex that has an outgoing edge (not a loop).
  i = num - 1;
  for (let q = 0; q < num; q++) if (A3[q].some((v, h) => v && h !== q)) { i = q; break; }

  while (counter <= num) {
    if (counter === 1) {
      stack.unshift(i);
    } else {
      let g2 = 0;
      for (; g2 < num; g2++) if (A3[i][g2] === 1 && g2 !== i && !checked.has(g2)) break;
      if (g2 === num) {
        stack.shift();
        if (!stack.length) { stopped = true; break; }
        i = stack[0];
        continue;
      }
      tree.push([i, g2]);
      i = g2;
      stack.unshift(i);
    }
    checked.add(i);
    order[i] = counter;
    W[i][counter - 1] = 1;
    counter++;
    log.text([`Вершина ${i + 1} є ${order[i]}-ю в обході.`, `Vertex ${i + 1} is #${order[i]} in the traversal.`]);
    stages.add({
      title: `Step ${counter - 1}: visit ${i + 1}`,
      caption: `Stack (top first): ${stack.map((v) => v + 1).join(', ')}`,
      graph: {
        n: num,
        edges: edges.map((e) => ({ ...e, cls: tree.some(([a, b]) => (a === e.a && b === e.b) || (!e.directed && a === e.b && b === e.a)) ? 'tree' : 'dim' })),
        nodes: order.map((o, v) => ({ cls: v === i ? 'current' : o ? 'visited' : '', badge: o ? `#${o}` : '' })),
      },
    });
  }
  if (stopped) log.text(['(Стек порожній: решта вершин недосяжні з початкової. Scilab тут зупиняється з помилкою.)', '(Stack is empty: the remaining vertices are unreachable from the start. Scilab stops here with an error.)']);

  const M = zeros(num);
  tree.forEach(([a, b]) => (M[a][b] = 1));
  log.matrix(['Матриця відповідності вершин (рядки - вершини, стовпчики - номери обходу):', 'Vertex/order matrix (rows - vertices, columns - traversal position):'], W);
  log.matrix(['Матриця дерева обходу:', 'Adjacency matrix of the traversal tree:'], M);
  stages.add({
    title: 'DFS tree',
    caption: `Tree edges: ${tree.map(([a, b]) => `${a + 1}→${b + 1}`).join(', ')}`,
    graph: {
      n: num,
      edges: tree.map(([a, b]) => ({ a, b, directed, cls: 'tree' })),
      nodes: order.map((o) => ({ cls: o ? 'visited' : '', badge: o ? `#${o}` : '' })),
    },
  });
  return { log, stages };
}

// Shared opening of labs 5-6.
function weightedGraph(variant, log, directed) {
  const g = buildGraph(variant, [0.01, 0.005, 0.05]);
  log.matrix(['Матриця суміжності орієнтованого графа:', 'Adjacency matrix of the directed graph:'], g.A3);
  g.W = buildWeights(g.A3, g.rand);
  log.matrix(['Матриця суміжності неорієнтованого графа:', 'Adjacency matrix of the undirected graph:'], directed ? g.A3 : g.A2);
  // "matrix for avoiding redo": keep one direction of each two-way edge.
  g.A = clone(g.A3);
  for (let i = 0; i < g.num; i++)
    for (let u = 0; u < g.num; u++)
      if (g.A[i][u] === g.A[u][i] && g.A[i][u] === 1) g.A[u][i] = 0;
  return g;
}

// ---------------------------------------------------------------- lab 5
function lab5(variant, { directed, fix, lang }) {
  const log = new Log(lang);
  const g = weightedGraph(variant, log, directed);
  const { num, A, W } = g;
  const stages = stageList(log);
  const all = weighted(graphEdges(g, directed), W);
  stages.add({
    title: 'Weighted graph',
    caption: 'Kruskal: repeatedly take the lightest remaining edge that does not close a cycle.',
    graph: { n: num, edges: all },
  });

  // Candidate edges in row order, as in the script.
  const E = [];
  for (let i = 0; i < num; i++)
    for (let u = 0; u < num; u++) if (A[i][u] && i !== u) E.push({ e: [i, u], w: W[i][u] });

  const M = zeros(num), picked = [];
  const parent = [...Array(num).keys()];
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const sameEdge = (e, [a, b]) => (e.a === a && e.b === b) || (e.a === b && e.b === a);
  let rejected = [];
  while (true) {
    if (!E.length) { log.text(['(Ребра закінчились раніше, ніж кістяк охопив усі вершини.)', '(Ran out of edges before the tree covered every vertex.)']); break; }
    let n = 0;
    for (let z = 1; z < E.length; z++) if (E[n].w > E[z].w) n = z;
    const { e: [a, b], w } = E.splice(n, 1)[0];
    // The script's cycle test: is b already reachable from a along the
    // (directed) tree edges, i.e. is any M^k(a, b) non-zero?
    let ok = true;
    if (fix) {
      ok = find(a) !== find(b);
    } else if (picked.length >= 2) {
      let P = M;
      for (let k = 1; k <= picked.length && ok; k++) {
        if (P[a][b]) ok = false;
        P = mul(P, M);
      }
    }
    if (!ok) { rejected.push(`${a + 1}–${b + 1} (${w})`); continue; }
    picked.push([a, b]);
    parent[find(a)] = find(b);
    M[a][b] = 1;
    const done = picked.length === num - 1;
    if (!done) log.text([`До кістяка додано ребро E(${a + 1}, ${b + 1})`, `Added edge E(${a + 1}, ${b + 1}) to the tree`]);
    const total = picked.reduce((s, [x, y]) => s + W[x][y], 0);
    stages.add({
      title: `Edge ${picked.length}: ${a + 1}–${b + 1} (weight ${w})`,
      caption: (rejected.length ? `Skipped (would close a cycle): ${rejected.join(', ')}. ` : '') + `Tree weight so far: ${total}.`,
      graph: {
        n: num,
        edges: all.map((e) => ({ ...e, cls: sameEdge(e, [a, b]) ? 'active' : picked.some((p) => sameEdge(e, p)) ? 'tree' : 'dim' })),
        nodes: Array.from({ length: num }, (_, v) => ({ cls: picked.some((p) => p.includes(v)) ? 'visited' : '' })),
      },
    });
    rejected = [];
    if (done) break;
  }

  log.text(['Знайдений кістяк', 'Spanning tree found']);
  const T2 = map(M, (v, i, j) => (v || M[j][i] ? 1 : 0));
  log.matrix(['Матриця суміжності кістяка гарфу:', 'Adjacency matrix of the spanning tree:'], directed ? M : T2);
  const total = picked.reduce((s, [x, y]) => s + W[x][y], 0);
  const cycle = findCycle(num, picked);
  const warning = cycle
    ? `Not a tree: the script's cycle test follows edge direction only (M^k), so it accepted edges that close the cycle ${cycle.map((v) => v + 1).join('–')}. Turn on "Correct cycle check" for a real MST.`
    : '';
  stages.add({
    title: cycle ? 'Result (contains a cycle)' : 'Minimum spanning tree',
    caption: `${picked.length} edges, total weight ${total}.`,
    warning,
    graph: { n: num, edges: picked.map(([a, b]) => ({ a, b, directed, w: W[a][b], cls: 'tree' })) },
  });
  return { log, stages };
}

// A cycle in an undirected edge list, as a closed vertex sequence, or null.
function findCycle(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  edges.forEach(([a, b], k) => { adj[a].push([b, k]); adj[b].push([a, k]); });
  const seen = new Array(n).fill(false), path = [];
  const dfs = (v, viaEdge) => {
    seen[v] = true; path.push(v);
    for (const [u, k] of adj[v]) {
      if (k === viaEdge) continue;
      if (seen[u]) {
        const at = path.indexOf(u);
        if (at >= 0) return [...path.slice(at), u];
        continue;
      }
      const c = dfs(u, k);
      if (c) return c;
    }
    path.pop();
    return null;
  };
  for (let v = 0; v < n; v++) if (!seen[v]) { const c = dfs(v, -1); if (c) return c; }
  return null;
}

// ---------------------------------------------------------------- lab 6
function lab6(variant, { directed, fix, lang }) {
  const log = new Log(lang);
  const g = weightedGraph(variant, log, directed);
  const { num, A2, W } = g;
  const stages = stageList(log);
  const all = weighted(graphEdges(g, directed), W);
  stages.add({
    title: 'Weighted graph',
    caption: 'Dijkstra from the first vertex that has an edge.',
    graph: { n: num, edges: all },
  });

  const We = new Array(num).fill(Infinity);
  const P = [], ways = [];
  const pred = new Array(num).fill(-1);
  let i = A2.findIndex((row) => row.some(Boolean));
  if (i < 0) i = num - 1; else We[i] = 0;
  const FIRST = i;
  log.text([`Початкова активна вершина: ${i + 1}`, `Start vertex: ${i + 1}`]);

  const dist = (v) => (We[v] === Infinity ? '∞' : String(We[v]));
  while (true) {
    for (let t = 0; t < num; t++) {
      if (t === i || !A2[i][t] || P.includes(t)) continue;
      const w = We[i] + W[i][t];
      if (w < We[t]) { We[t] = w; pred[t] = i; }
      // Route bookkeeping, as in the script: every recorded route that ends
      // at i is extended to t and tagged with the weight just computed.
      if (i === FIRST) ways.push({ path: [FIRST, t], w });
      else for (let b = 0, len = ways.length; b < len; b++)
        if (ways[b].path.at(-1) === i) ways.push({ path: [...ways[b].path, t], w });
    }
    P.push(i);
    stages.add({
      title: `Step ${P.length}: vertex ${i + 1} becomes permanent`,
      caption: `Badges show the current distance from ${FIRST + 1}. Permanent: ${P.map((v) => v + 1).join(', ')}.`,
      graph: {
        n: num,
        edges: all.map((e) => ({ ...e, cls: e.a === i || e.b === i ? '' : 'dim' })),
        nodes: Array.from({ length: num }, (_, v) => ({
          cls: v === i ? 'current' : P.includes(v) ? 'visited' : '', badge: dist(v),
        })),
      },
    });
    if (P.length === num) break;
    let best = -1;
    for (let p = 0; p < num; p++) {
      if (P.includes(p)) continue;
      if (best < 0 || We[p] < We[best]) best = p;
    }
    i = best;
    log.text([`Чергова активна вершина: ${i + 1}`, `Next active vertex: ${i + 1}`]);
  }

  const routeWeight = (p) => p.reduce((s, x, k) => s + (k ? W[p[k - 1]][x] : 0), 0);
  let route = null;
  for (let v = 0; v < num; v++) {
    if (v === FIRST) continue;
    let hit;
    if (fix) {
      if (We[v] !== Infinity) {
        const path = [v];
        while (path[0] !== FIRST) path.unshift(pred[path[0]]);
        hit = { path };
      }
    } else {
      hit = ways.find((r) => r.path.at(-1) === v && r.w === We[v]);
    }
    if (hit) route = hit.path; // otherwise the script reuses the previous route string
    const real = hit ? routeWeight(hit.path) : Infinity;
    const off = hit && real !== We[v];
    log.text([`Найкоротший шлях від ${FIRST + 1} до ${v + 1} рівний ${str(We[v])}; його повний маршрут:`, `Shortest path from ${FIRST + 1} to ${v + 1} is ${str(We[v])}; full route:`]);
    log.text(route ? route.map((x) => x + 1).join(' -> ') : '');
    log.text('');
    const onRoute = (e) => hit && hit.path.some((x, k) => k && ((hit.path[k - 1] === e.a && x === e.b) || (!e.directed && hit.path[k - 1] === e.b && x === e.a)));
    stages.add({
      title: `Shortest path ${FIRST + 1} → ${v + 1}: ${str(We[v]).replace('Inf', '∞')}`,
      caption: hit ? `Route: ${hit.path.map((x) => x + 1).join(' → ')} (edge weights add up to ${real}).` : 'Unreachable.',
      warning: off
        ? `The printed route weighs ${real}, not ${We[v]}. The distance is right, but the script tags every recorded route ending at a vertex with that vertex's best weight, so it can pick a longer route. Turn on "Correct routes" to rebuild routes from predecessors.`
        : '',
      graph: {
        n: num,
        edges: all.map((e) => ({ ...e, cls: onRoute(e) ? 'tree' : 'dim' })),
        nodes: Array.from({ length: num }, (_, x) => ({
          cls: x === FIRST ? 'current' : hit && hit.path.includes(x) ? 'visited' : '', badge: dist(x),
        })),
      },
    });
  }
  return { log, stages };
}

export const LABS = [
  { id: 1, file: '1-lab_3.1.1.sce', name: 'Graph construction', directed: true, run: lab1,
    about: 'Builds the pseudo-random graph for the variant and prints its directed and undirected adjacency matrices.' },
  { id: 2, file: '2-lab.sce', name: 'Vertex degrees', directed: false, run: lab2,
    about: 'Degrees of the undirected graph, out/in semi-degrees of the directed one, isolated and pendant vertices, and a regularity check.' },
  { id: 3, file: '3-lab.sce', name: 'Paths & condensation', directed: true, run: lab3,
    about: 'Paths of length 2 and 3 from powers of the adjacency matrix, reachability and connectivity matrices, strongly connected components and the condensation graph.' },
  { id: 4, file: '4-lab.sce', name: 'Depth-first search', directed: true, run: lab4,
    about: 'Depth-first traversal with an explicit stack, the vertex/order correspondence matrix and the traversal tree.' },
  { id: 5, file: '5-lab_1.1.sce', name: 'Kruskal MST', directed: false, run: lab5, fixLabel: 'Correct cycle check (union-find)',
    about: 'Random edge weights, then a minimum spanning tree with Kruskal’s algorithm, one edge per step.' },
  { id: 6, file: '6-lab.sce', name: 'Dijkstra', directed: false, run: lab6, fixLabel: 'Correct routes (from predecessors)',
    about: 'Random edge weights, then Dijkstra’s algorithm from the first vertex with an edge, with the shortest route to every other vertex.' },
];

