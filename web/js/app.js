import { LABS } from './labs.js';
import { renderGraph } from './render.js';
import { variantSeed, vertexCount } from './core.js';
import { downloadBlob, graphToPng } from './export.js';

const DEFAULT = { n1: 8, n2: 5, n3: 0, n4: 6 };
const REPO = 'https://github.com/Andrew1407/DiscreteStructures/blob/main/Scilab/';
const $ = (id) => document.getElementById(id);

const state = {
  lab: 0,
  variant: { ...DEFAULT },
  directed: LABS.map((l) => l.directed),
  fix: LABS.map(() => false),
  centre: true,
  stage: 0,
  showAll: false,
  result: null,
  timer: null,
};

// ---------------------------------------------------------------- URL state
function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  const lab = Number(p.get('lab'));
  if (lab >= 1 && lab <= LABS.length) state.lab = lab - 1;
  const v = p.get('v');
  if (v && /^\d{4}$/.test(v)) {
    const [n1, n2, n3, n4] = [...v].map(Number);
    state.variant = { n1, n2, n3, n4 };
  }
  const num = Number(p.get('n'));
  if (num >= 3 && num <= 20) state.variant.num = num; else delete state.variant.num;
  state.centre = p.get('c') !== '0';
  if (p.has('dir')) state.directed[state.lab] = p.get('dir') === '1';
  if (p.has('fix')) state.fix[state.lab] = p.get('fix') === '1';
}
function writeHash() {
  const { n1, n2, n3, n4 } = state.variant;
  const p = new URLSearchParams({ lab: state.lab + 1, v: `${n1}${n2}${n3}${n4}` });
  const lab = LABS[state.lab];
  if (state.directed[state.lab] !== lab.directed) p.set('dir', state.directed[state.lab] ? '1' : '0');
  if (state.fix[state.lab]) p.set('fix', '1');
  if (state.variant.num !== undefined) p.set('n', state.variant.num);
  if (!state.centre) p.set('c', '0');
  history.replaceState(null, '', `#${p}`);
}

// ---------------------------------------------------------------- UI
function buildTabs() {
  const tabs = $('tabs');
  LABS.forEach((lab, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.innerHTML = `<span class="lang" title="Scilab, ported to JavaScript">SCI</span>Lab ${lab.id}<span class="long">· ${lab.name}</span>`;
    b.addEventListener('click', () => { state.lab = i; run(); });
    tabs.append(b);
  });
}

function run() {
  stop();
  const lab = LABS[state.lab];
  state.result = lab.run(state.variant, { directed: state.directed[state.lab], fix: state.fix[state.lab] });
  state.stage = 0;

  [...$('tabs').children].forEach((b, i) => b.setAttribute('aria-selected', String(i === state.lab)));
  $('lab-title').textContent = `Lab ${lab.id}. ${lab.name}`;
  $('lab-about').textContent = lab.about;
  $('lab-source').href = REPO + lab.file;
  $('lab-source').textContent = `View ${lab.file}`;

  const form = $('controls');
  for (const k of ['n1', 'n2', 'n3', 'n4']) form.elements[k].value = state.variant[k];
  form.elements.directed.checked = state.directed[state.lab];
  $('fix-wrap').hidden = !lab.fixLabel;
  $('fix-label').textContent = lab.fixLabel || '';
  form.elements.fix.checked = state.fix[state.lab];
  form.elements.centre.checked = state.centre;
  form.elements.num.value = state.variant.num ?? '';
  form.elements.num.placeholder = 10 + state.variant.n3;
  const custom = state.variant.num !== undefined;
  $('variant-meta').textContent = `seed ${variantSeed(state.variant)} · ${vertexCount(state.variant)} vertices` +
    (custom ? ' (custom; scripts use 10 + n3)' : '');

  const { stages } = state.result;
  $('slider').max = stages.length - 1;
  $('stepper').classList.toggle('single', stages.length < 2);
  writeHash();
  show();
}

function show() {
  const { stages, log } = state.result;
  const st = stages[state.stage];
  $('stage-title').textContent = st.title;
  $('stage-caption').textContent = st.caption || '';
  $('stage-warning').hidden = !st.warning;
  $('stage-warning').textContent = st.warning || '';
  renderGraph($('graph'), { ...st.graph, layout: st.graph.layout || (state.centre ? 'main' : 'circle') });

  $('slider').value = state.stage;
  $('counter').textContent = `step ${state.stage + 1} / ${stages.length}`;
  const atEnd = state.stage === stages.length - 1;
  for (const b of $('stepper').querySelectorAll('button[data-step]')) {
    const s = b.dataset.step;
    if (s === 'first' || s === 'prev') b.disabled = state.stage === 0;
    if (s === 'next' || s === 'last') b.disabled = atEnd;
  }
  $('play').textContent = state.timer ? '❚❚ Pause' : '▶ Play';

  const prev = state.stage > 0 ? stages[state.stage - 1].logLen : 0;
  const upto = state.showAll ? log.length : st.logLen;
  renderLog(log.items.slice(0, upto), state.showAll ? -1 : prev, !state.showAll && atEnd);
}

function renderLog(items, newFrom, finished) {
  const box = $('log');
  box.replaceChildren();
  items.forEach((it, idx) => {
    const fresh = newFrom >= 0 && idx >= newFrom && state.stage > 0;
    if (it.t === 'text') {
      const d = document.createElement('div');
      if (!it.s) { d.className = 'blank'; box.append(d); return; }
      d.className = 'line' + (it.s.startsWith('(') ? ' note' : '') + (fresh ? ' new' : '');
      d.textContent = it.s;
      box.append(d);
    } else {
      const t = document.createElement('div');
      t.className = 'line mtitle' + (fresh ? ' new' : '');
      t.textContent = it.title;
      box.append(t);
      box.append(matrixTable(it.m));
    }
  });
  if (finished && state.result.stages.length > 1) {
    const end = document.createElement('div');
    end.className = 'end';
    end.textContent = '— end of script —';
    box.append(end);
  }
  box.scrollTop = box.scrollHeight;
}

function matrixTable(m) {
  const table = document.createElement('table');
  const head = document.createElement('tr');
  head.append(document.createElement('th'));
  m[0].forEach((_, j) => { const th = document.createElement('th'); th.textContent = j + 1; head.append(th); });
  table.append(head);
  m.forEach((row, i) => {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.textContent = i + 1;
    tr.append(th);
    row.forEach((v) => {
      const td = document.createElement('td');
      td.textContent = v;
      if (!v) td.className = 'z';
      tr.append(td);
    });
    table.append(tr);
  });
  return table;
}

// ---------------------------------------------------------------- stepping
function go(to) {
  const last = state.result.stages.length - 1;
  state.stage = Math.max(0, Math.min(last, to));
  if (state.stage === last) stop();
  show();
}
function stop() {
  clearInterval(state.timer);
  state.timer = null;
}
function togglePlay() {
  if (state.timer) { stop(); show(); return; }
  if (state.stage === state.result.stages.length - 1) state.stage = 0;
  state.timer = setInterval(() => go(state.stage + 1), 1100);
  show();
}

function wire() {
  $('stepper').addEventListener('click', (e) => {
    const s = e.target.closest('button')?.dataset.step;
    if (s === 'first') go(0);
    else if (s === 'prev') { stop(); go(state.stage - 1); }
    else if (s === 'next') { stop(); go(state.stage + 1); }
    else if (s === 'last') go(Infinity);
    else if (s === 'play') togglePlay();
  });
  $('slider').addEventListener('input', (e) => { stop(); go(Number(e.target.value)); });

  const form = $('controls');
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('change', (e) => {
    const t = e.target;
    if (/^n[1-4]$/.test(t.name)) {
      let v = Math.round(Number(t.value));
      if (!Number.isFinite(v)) v = DEFAULT[t.name];
      state.variant[t.name] = Math.max(0, Math.min(9, v));
    } else if (t.name === 'num') {
      const v = Math.round(Number(t.value));
      if (t.value === '' || !Number.isFinite(v)) delete state.variant.num;
      else state.variant.num = Math.max(3, Math.min(20, v));
    } else if (t.name === 'centre') { state.centre = t.checked; writeHash(); show(); return; }
    else if (t.name === 'directed') state.directed[state.lab] = t.checked;
    else if (t.name === 'fix') state.fix[state.lab] = t.checked;
    else return;
    run();
  });
  $('random').addEventListener('click', () => {
    const d = () => Math.floor(Math.random() * 10);
    state.variant = { ...state.variant, n1: d(), n2: d(), n3: Math.floor(Math.random() * 3), n4: d() };
    run();
  });
  $('reset').addEventListener('click', () => { state.variant = { ...DEFAULT }; run(); });
  $('show-all').addEventListener('change', (e) => { state.showAll = e.target.checked; show(); });

  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select') && e.target.type !== 'range' && e.target.type !== 'checkbox') return;
    if (e.key === 'ArrowRight') { stop(); go(state.stage + 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { stop(); go(state.stage - 1); e.preventDefault(); }
    else if (e.key === ' ' && !e.target.closest('button')) { togglePlay(); e.preventDefault(); }
  });
  window.addEventListener('hashchange', () => { readHash(); run(); });

  $('copy-img').addEventListener('click', () => exportImage('copy'));
  $('save-img').addEventListener('click', () => exportImage('save'));
}

// ---------------------------------------------------------------- image export
function imageInfo() {
  const lab = LABS[state.lab];
  const { n1, n2, n3, n4 } = state.variant;
  const st = state.result.stages[state.stage];
  return {
    title: `Lab ${lab.id}. ${lab.name} — ${st.title}`,
    subtitle: `Variant ${n1}${n2}${n3}${n4} · ${vertexCount(state.variant)} vertices · ${st.caption || ''}`,
    file: `lab${lab.id}-${n1}${n2}${n3}${n4}-step${state.stage + 1}.png`,
  };
}

let statusTimer;
function status(msg) {
  $('export-status').textContent = msg;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => ($('export-status').textContent = ''), 2500);
}

async function exportImage(kind) {
  const info = imageInfo();
  try {
    if (kind === 'copy') {
      // Hand the clipboard a promise so the copy stays tied to the click.
      const blob = graphToPng($('graph'), info);
      if (!navigator.clipboard || !window.ClipboardItem) throw new Error('Clipboard images are not supported here');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      status('Copied to clipboard');
    } else {
      downloadBlob(await graphToPng($('graph'), info), info.file);
      status('Saved ' + info.file);
    }
  } catch (err) {
    // Fall back to a download when the clipboard is unavailable or blocked.
    if (kind === 'copy') {
      downloadBlob(await graphToPng($('graph'), info), info.file);
      status(`Couldn't copy (${err.message}), downloaded instead`);
    } else status(err.message);
  }
}

readHash();
buildTabs();
wire();
run();
