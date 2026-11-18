// Draws a graph spec { n, edges, nodes?, layout?, labels? } into an <svg>.
// Coordinates follow the Scilab scripts: vertices 1..n-1 on a circle of
// diameter 70 around (50, 50), counter-clockwise from angle 0, and the last
// vertex in the centre. The "circle" layout puts every vertex on that circle;
// "ring" is a smaller circle for the condensation graph.

const NS = 'http://www.w3.org/2000/svg';
const R = 4.3; // vertex radius
const el = (tag, attrs = {}, text) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== '') e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  return e;
};

export function layout(n, kind = 'main') {
  const pts = [];
  if (kind === 'circle') {
    for (let i = 0; i < n; i++) {
      const a = (2 * Math.PI * i) / n;
      pts.push([50 + 35 * Math.cos(a), 50 - 35 * Math.sin(a)]);
    }
    return pts;
  }
  if (kind === 'ring') {
    if (n === 1) return [[50, 50]];
    for (let i = 0; i < n; i++) {
      const a = (2 * Math.PI * i) / n;
      pts.push([50 + 24 * Math.cos(a), 50 - 24 * Math.sin(a)]);
    }
    return pts;
  }
  for (let i = 0; i < n - 1; i++) {
    const a = (2 * Math.PI * i) / (n - 1);
    pts.push([50 + 35 * Math.cos(a), 50 - 35 * Math.sin(a)]); // SVG y grows downwards
  }
  pts.push([50, 50]);
  return pts;
}

const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const len = (v) => Math.hypot(v[0], v[1]) || 1;
const unit = (v) => { const l = len(v); return [v[0] / l, v[1] / l]; };
const along = (p, dir, d) => [p[0] + dir[0] * d, p[1] + dir[1] * d];
const f = (v) => v.toFixed(2);

function distToSegment(p, a, b) {
  const ab = sub(b, a), ap = sub(p, a);
  const t = Math.max(0, Math.min(1, (ap[0] * ab[0] + ap[1] * ab[1]) / (ab[0] ** 2 + ab[1] ** 2)));
  return Math.hypot(ap[0] - ab[0] * t, ap[1] - ab[1] * t);
}

export function renderGraph(svg, graph) {
  const { n, edges, nodes = [], labels } = graph;
  const pos = layout(n, graph.layout);
  svg.replaceChildren();
  svg.setAttribute('viewBox', graph.layout === 'ring' ? '-4 -4 108 108' : '1 1 98 98');

  const defs = el('defs');
  for (const cls of ['', 'tree', 'active', 'dim', 'path']) {
    const m = el('marker', {
      id: `arrow-${cls || 'base'}`, viewBox: '0 0 10 10', refX: 9, refY: 5,
      markerWidth: 4.2, markerHeight: 4.2, orient: 'auto-start-reverse', markerUnits: 'strokeWidth',
    });
    m.append(el('path', { d: 'M0,1 L10,5 L0,9 z', class: `arrowhead ${cls}` }));
    defs.append(m);
  }
  svg.append(defs);

  const edgeLayer = el('g', { class: 'edges' });
  const labelLayer = el('g', { class: 'weights' });
  const nodeLayer = el('g', { class: 'nodes' });
  svg.append(edgeLayer, labelLayer, nodeLayer);

  const has = new Set(edges.filter((e) => e.directed).map((e) => `${e.a},${e.b}`));
  const onCircle = graph.layout === 'ring' || graph.layout === 'circle';
  const centre = onCircle ? null : pos[n - 1];
  // Draw highlighted edges last so they sit on top.
  const rank = { dim: 0, '': 1, undefined: 1, tree: 2, path: 2, active: 3 };
  const ordered = [...edges].sort((x, y) => rank[x.cls] - rank[y.cls]);

  for (const e of ordered) {
    const cls = e.cls || '';
    const name = labels ? `${labels[e.a]} → ${labels[e.b]}` : `${e.a + 1} ${e.directed ? '→' : '–'} ${e.b + 1}`;
    const tip = el('title', {}, e.w !== undefined ? `${name}  (weight ${e.w})` : name);
    const marker = e.directed ? `url(#arrow-${cls || 'base'})` : undefined;
    let d, mid;

    if (e.a === e.b) {
      // Self-loop, pointing away from the centre.
      const p = pos[e.a];
      const from = centre || (onCircle && n > 1 ? [50, 50] : null);
      const out = from && (p[0] !== from[0] || p[1] !== from[1]) ? unit(sub(p, from)) : [0, -1];
      const ang = Math.atan2(out[1], out[0]);
      const s = [p[0] + R * Math.cos(ang - 0.55), p[1] + R * Math.sin(ang - 0.55)];
      const t = [p[0] + R * Math.cos(ang + 0.55), p[1] + R * Math.sin(ang + 0.55)];
      const c1 = [p[0] + 3.4 * R * Math.cos(ang - 0.7), p[1] + 3.4 * R * Math.sin(ang - 0.7)];
      const c2 = [p[0] + 3.4 * R * Math.cos(ang + 0.7), p[1] + 3.4 * R * Math.sin(ang + 0.7)];
      d = `M${f(s[0])},${f(s[1])} C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(t[0])},${f(t[1])}`;
      mid = along(p, out, 2.9 * R);
    } else {
      const A = pos[e.a], B = pos[e.b];
      const dir = unit(sub(B, A));
      const normal = [-dir[1], dir[0]];
      let bend = 0;
      if (e.directed && has.has(`${e.b},${e.a}`)) bend = 3.2; // two-way pair: split the arrows
      if (centre && e.a !== n - 1 && e.b !== n - 1 && distToSegment(centre, A, B) < R + 2) bend = bend || 9; // avoid the centre vertex
      if (bend) {
        const m = [(A[0] + B[0]) / 2 + normal[0] * bend, (A[1] + B[1]) / 2 + normal[1] * bend];
        const s = along(A, unit(sub(m, A)), R);
        const t = along(B, unit(sub(m, B)), R + (e.directed ? 0.6 : 0));
        d = `M${f(s[0])},${f(s[1])} Q${f(m[0])},${f(m[1])} ${f(t[0])},${f(t[1])}`;
        mid = [0.25 * s[0] + 0.5 * m[0] + 0.25 * t[0], 0.25 * s[1] + 0.5 * m[1] + 0.25 * t[1]];
      } else {
        const s = along(A, dir, R);
        const t = along(B, dir, -(R + (e.directed ? 0.6 : 0)));
        d = `M${f(s[0])},${f(s[1])} L${f(t[0])},${f(t[1])}`;
        mid = [(s[0] + t[0]) / 2, (s[1] + t[1]) / 2];
      }
    }
    const path = el('path', { d, class: `edge ${cls}`, 'marker-end': marker });
    path.append(tip);
    edgeLayer.append(path);
    if (e.w !== undefined && e.a !== e.b) { // loop weights are always 0 in these labs
      labelLayer.append(el('text', { x: f(mid[0]), y: f(mid[1]), class: `weight ${cls}`, dy: '0.35em' }, String(e.w)));
    }
  }

  pos.forEach((p, i) => {
    const info = nodes[i] || {};
    const g = el('g', { class: `node ${info.cls || ''}`, 'data-group': info.group });
    if (info.group !== undefined) g.style.setProperty('--group', `var(--g${info.group % 8})`);
    g.append(el('title', {}, labels ? labels[i] : `Vertex ${i + 1}`));
    g.append(el('circle', { cx: f(p[0]), cy: f(p[1]), r: R }));
    g.append(el('text', { x: f(p[0]), y: f(p[1]), dy: '0.36em', class: 'label' }, labels ? labels[i] : String(i + 1)));
    if (info.badge) {
      const out = centre && i !== n - 1 ? unit(sub(p, centre)) : onCircle && n > 1 ? unit(sub(p, [50, 50])) : [0.75, 0.66];
      // Long badges grow away from the vertex instead of covering it.
      const anchor = out[0] > 0.35 ? 'start' : out[0] < -0.35 ? 'end' : 'middle';
      const b = along(p, out, R + (anchor === 'middle' ? 3.6 : 1.6));
      g.append(el('text', { x: f(b[0]), y: f(b[1]), dy: '0.35em', class: 'badge', 'text-anchor': anchor }, info.badge));
    }
    nodeLayer.append(g);
  });
}
