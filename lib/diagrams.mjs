// Small SVG diagram renderer used by the homepage "My approach" slides and every project page.
// Each diagram is drawn at build time from a plain spec object, so pages stay static and fast.
// Animated pieces: .flow (moving dashes), .draw (lines that draw in), .grow (bars that rise), .pop (items that fade up).
// Styling lives in css/styles.css under "Diagrams".

const W = 560, H = 280;
export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const f = n => Math.round(n * 10) / 10;

function wrap(inner, label) {
  return `<svg class="dia" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${inner}</svg>`;
}
const T = (x, y, s, cls = '', anchor = 'start', extra = '') =>
  `<text${cls ? ` class="${cls}"` : ''} x="${f(x)}" y="${f(y)}"${anchor !== 'start' ? ` text-anchor="${anchor}"` : ''}${extra}>${esc(s)}</text>`;
// Multi-line text: lines split on \n, centred block around y.
function TT(x, y, s, cls = '', anchor = 'middle', lh = 16) {
  const lines = String(s).split('\n');
  const y0 = y - ((lines.length - 1) * lh) / 2;
  return lines.map((l, i) => T(x, y0 + i * lh, l, cls, anchor)).join('');
}
const R = (x, y, w, h, rx, cls) => `<rect class="${cls}" x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${rx}"/>`;
const pop = (i, inner, cls = '') => `<g class="pop${cls ? ' ' + cls : ''}" style="--i:${i}">${inner}</g>`;
const arrow = (d, cls = 'flow') => `<path class="${cls}" d="${d}" marker-end="url(#ah)"/>`;
const wrapWords = (str, n) => { const out = []; let line = ''; String(str).split(' ').forEach(w => { if ((line + ' ' + w).trim().length > n && line) { out.push(line.trim()); line = w; } else line += ' ' + w; }); if (line.trim()) out.push(line.trim()); return out.join('\n'); };
function node(x, y, w, h, label, sub, tone = '', i = 0, rx = 10) {
  const n = Math.floor(w / 7.2);
  const lab = String(label).split('\n');
  const sb = sub ? (String(sub).length > n ? wrapWords(sub, n) : String(sub)).split('\n') : [];
  const lhL = 17, lhS = 15, gap = sb.length ? 5 : 0;
  const total = lab.length * lhL + gap + sb.length * lhS;
  let yy = y + h / 2 - total / 2 + 12;
  let out = R(x, y, w, h, rx, `bx${tone ? ' ' + tone : ''}`);
  lab.forEach((l, k) => { out += T(x + w / 2, yy + k * lhL, l, 'tl', 'middle'); });
  yy += lab.length * lhL + gap - 1;
  sb.forEach((l, k) => { out += T(x + w / 2, yy + k * lhS, l, 'ts', 'middle'); });
  return pop(i, out);
}

// ---------- 1. sources: several inputs flowing into one landing box ----------
function sources({ items, target, targetSub = '', tone = 'ocean' }) {
  const n = items.length, top = 22, bottom = 258, bh = 34;
  const gap = (bottom - top - n * bh) / Math.max(1, n - 1);
  const ty = 140;
  let s = '';
  items.forEach((it, i) => {
    const y = top + i * (bh + gap);
    s += pop(i, R(14, y, 226, bh, 9, 'bx') + T(28, y + bh / 2 + 5, it, it.length > 24 ? 'tl small' : 'tl'));
    s += `<path class="flow" d="M240 ${f(y + bh / 2)} C 300 ${f(y + bh / 2)}, 300 ${ty}, 344 ${ty}"${i === n - 1 ? ' marker-end="url(#ah)"' : ''}/>`;
  });
  s += pop(n, R(350, ty - 50, 196, 100, 14, `bx ${tone} hot`) + T(448, ty - 6, target, 'tb', 'middle') + (targetSub ? TT(448, ty + 18, targetSub, 'ts', 'middle', 14) : ''));
  return s;
}

// ---------- 2. delta: versioned table plus access log ----------
function delta({ table = 'DELTA TABLE', versions = ['version 3 · today', 'version 2', 'version 1'], logTitle = 'Unity Catalog access log', rows }) {
  let s = T(104, 34, table, 'tc', 'middle');
  versions.forEach((v, i) => { s += pop(i, R(20, 48 + i * 54, 168, 42, 9, i === 0 ? 'bx ocean hot' : 'bx') + T(38, 74 + i * 54, v, 'tl')); });
  s += arrow('M188 123 L 226 123');
  s += R(232, 26, 314, 214, 12, 'panel') + T(252, 56, logTitle, 'tb');
  s += T(252, 86, 'WHO', 'tc') + T(372, 86, 'ACTION', 'tc') + T(470, 86, 'WHEN', 'tc') + `<line class="rule" x1="252" y1="96" x2="526" y2="96"/>`;
  rows.forEach((r, i) => {
    const y = 124 + i * 34;
    s += pop(i + 3, T(252, y, r[0], 'tl') + T(372, y, r[1], r[1] === 'denied' ? 'tl deny' : 'tl') + T(470, y, r[2], 'ts'));
  });
  return s;
}

// ---------- 3. catalog: Unity Catalog tree ----------
function catalog({ name, schemas, badges = [] }) {
  let s = pop(0, R(14, 112, 132, 52, 12, 'bx ocean hot') + T(80, 134, 'catalog', 'tc', 'middle') + T(80, 152, name, 'tm', 'middle'));
  const ys = [50, 138, 226];
  schemas.forEach((sc, i) => {
    const y = ys[i];
    s += `<path class="link" d="M146 138 C 170 138, 170 ${y}, 194 ${y}"/>`;
    s += pop(i + 1, R(196, y - 20, 104, 40, 9, `bx ${sc.tone}`) + T(248, y + 5, sc.name, 'tm', 'middle'));
    s += pop(i + 4, sc.tables.map((t, k) => T(318, y - 6 + k * 17 - (sc.tables.length - 2) * 8, t, 'tm small')).join(''));
  });
  if (badges.length) {
    s += badges.map((b, i) => pop(i + 7, R(440 + 0, 30 + i * 40, 106, 28, 14, 'chip') + T(493, 49 + i * 40, b, 'ts', 'middle'))).join('');
  }
  return s;
}

// ---------- 4. stages: bronze, silver, gold (or any tones) ----------
function stages({ stages: st, foot = ['raw', 'ready for analytics'] }) {
  const n = st.length, gap = 26, w = (532 - gap * (n - 1)) / n;
  let s = '';
  st.forEach((x, i) => {
    const X = 14 + i * (w + gap);
    s += pop(i, R(X, 56, w, 128, 14, `bx medal ${x.tone}`) + T(X + w / 2, 104, x.name, `tmed ${x.tone}`, 'middle') + TT(X + w / 2, 140, x.cap, 'ts', 'middle', 15));
    if (i < n - 1) s += arrow(`M${f(X + w + 2)} 120 L ${f(X + w + gap - 4)} 120`);
  });
  s += `<rect class="ramp" x="14" y="214" width="532" height="5" rx="2.5"/>`;
  s += T(14, 244, foot[0], 'ts') + T(546, 244, foot[1], 'ts', 'end');
  return s;
}

// ---------- 5. star schema ----------
function star({ fact, factSub = 'measures', dims }) {
  const cx = 280, cy = 140;
  const slots = {
    3: [[94, 50], [466, 50], [280, 244]],
    4: [[94, 50], [466, 50], [94, 230], [466, 230]],
    5: [[94, 50], [466, 50], [94, 230], [466, 230], [280, 30]],
    6: [[94, 44], [466, 44], [94, 236], [466, 236], [94, 140], [466, 140]],
  }[dims.length];
  let s = '';
  slots.forEach(([x, y]) => { s += `<line class="link" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`; });
  dims.forEach((d, i) => { const [x, y] = slots[i]; s += pop(i + 1, R(x - 78, y - 20, 156, 40, 9, 'bx') + T(x, y + 5, d, 'tm', 'middle')); });
  s += pop(0, R(cx - 92, cy - 38, 184, 76, 14, 'bx coral hot') + T(cx, cy - 4, fact, 'tm b', 'middle') + TT(cx, cy + 18, factSub, 'ts', 'middle', 14));
  return s;
}

// ---------- 6. job: chained tasks on a schedule ----------
function job({ title = 'DATABRICKS JOB', name = '', schedule, tasks, note }) {
  const n = tasks.length, gap = 18, x0 = 34, wAll = 492, w = (wAll - gap * (n - 1)) / n;
  let s = `<rect class="frame" x="16" y="22" width="528" height="206" rx="14"/>`;
  s += T(34, 50, title, 'tc acc') + (name ? T(34 + title.length * 8 + 14, 50, name, 'tm small') : '');
  s += `<g class="ts"><circle cx="${f(526 - schedule.length * 6.6 - 14)}" cy="46" r="7" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M${f(526 - schedule.length * 6.6 - 14)} 42v4l3 2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></g>`;
  s += T(526, 50, schedule, 'ts', 'end');
  tasks.forEach((t, i) => {
    const x = x0 + i * (w + gap);
    s += pop(i, R(x, 76, w, 58, 10, `bx${i === n - 1 ? ' ocean hot' : ''}`) + TT(x + w / 2, 109, t, 'tm small', 'middle', 14));
    if (i < n - 1) s += arrow(`M${f(x + w + 1)} 105 L ${f(x + w + gap - 3)} 105`);
  });
  if (note) {
    s += T(34, 178, note.label, 'tc acc') + T(34 + note.label.length * 8.4 + 10, 178, note.text, 'ts');
    if (note.cells !== false) {
      for (let k = 0; k < 10; k++) s += R(306 + k * 22, 192, 16, 16, 3, [2, 5, 9].includes(k) ? 'cell on' : 'cell');
      s += T(34, 204, note.foot || 'only new and changed rows are processed', 'ts');
    } else if (note.foot) s += T(34, 204, note.foot, 'tm small');
  }
  return s;
}

// ---------- 7. serve: gold, connector, semantic model, report ----------
function serve({ from = 'Gold', fromSub = 'tables', via = 'Databricks', viaSub = 'connector', model = 'semantic model', to = 'Power BI Service', fromTone = 'gold' }) {
  let s = pop(0, R(12, 98, 108, 76, 12, `bx medal ${fromTone}`) + T(66, 132, from, 'tb', 'middle') + T(66, 152, fromSub, 'ts', 'middle'));
  s += arrow('M120 136 L 146 136');
  s += pop(1, R(150, 112, 124, 48, 24, 'bx') + T(212, 132, via, 'tm', 'middle') + T(212, 149, viaSub, 'ts', 'middle'));
  s += arrow('M274 136 L 300 136');
  s += pop(2, R(304, 92, 106, 88, 12, 'bx jungle') + `<path class="cube" d="M357 108 l16 9 v18 l-16 9 l-16 -9 v-18 z"/><path class="cube" d="M341 117 l16 9 l16 -9 M357 126 v18"/>` + TT(357, 166, model, 'ts', 'middle', 13));
  s += arrow('M410 136 L 436 136');
  s += pop(3, R(440, 68, 108, 136, 12, 'bx ocean hot') +
    [28, 44, 58, 74].map((h, k) => `<rect class="bar grow" style="--i:${k + 4}" x="${458 + k * 18}" y="${170 - h}" width="12" height="${h}" rx="2"/>`).join('') +
    TT(494, 192, to, 'ts', 'middle', 13));
  return s;
}

// ---------- 8. chain: generic left-to-right steps ----------
function chain({ nodes, hot = nodes.length - 1, tones = [] }) {
  const n = nodes.length, gap = 30, w = (532 - gap * (n - 1)) / n, y = 96, h = 92;
  let s = '';
  nodes.forEach((nd, i) => {
    const x = 14 + i * (w + gap);
    const tone = tones[i] || (i === hot ? 'ocean hot' : '');
    s += node(x, y, w, h, nd.t, nd.s, tone, i, 12);
    if (i < n - 1) s += arrow(`M${f(x + w + 2)} ${y + h / 2} L ${f(x + w + gap - 4)} ${y + h / 2}`);
  });
  return s;
}

// ---------- 9. lines: small time-series chart ----------
function lines({ x: [x0, x1], y: [y0, y1], xt = [], yt = [], yfmt = v => v, series, band, marker, hlines = [], labelW = 120, note }) {
  const L = 46, Rr = W - 14 - labelW, Tt = 18, B = note ? 228 : 244;
  const sx = v => L + ((v - x0) / (x1 - x0)) * (Rr - L), sy = v => B - ((v - y0) / (y1 - y0)) * (B - Tt);
  let s = '';
  yt.forEach(v => { s += `<line class="grid" x1="${L}" x2="${f(Rr)}" y1="${f(sy(v))}" y2="${f(sy(v))}"/>` + T(L - 8, sy(v) + 4, yfmt(v), 'ts', 'end'); });
  xt.forEach(v => { s += T(sx(v), B + 20, String(v), 'ts', 'middle'); });
  s += `<line class="axis" x1="${L}" x2="${f(Rr)}" y1="${B}" y2="${B}"/>`;
  if (band) s += `<rect class="band" x="${f(sx(band[0]))}" y="${Tt}" width="${f(sx(band[1]) - sx(band[0]))}" height="${B - Tt}"/>` + (band[2] ? T((sx(band[0]) + sx(band[1])) / 2, Tt + 14, band[2], 'ts', 'middle') : '');
  if (marker) s += `<line class="mark" x1="${f(sx(marker[0]))}" x2="${f(sx(marker[0]))}" y1="${Tt}" y2="${B}"/>` + T(sx(marker[0]) + 6, Tt + 14, marker[1], 'ts');
  hlines.forEach(h => { s += `<line class="hline ${h.tone || ''}" x1="${f(sx(h.x0))}" x2="${f(sx(h.x1))}" y1="${f(sy(h.y))}" y2="${f(sy(h.y))}"/>` + (h.label ? T(sx(h.lx ?? h.x0) + 4, sy(h.y) + (h.below ? 19 : -7), h.label, `ts b ${h.tone || ''}`) : ''); });
  const used = [];
  series.forEach((se, i) => {
    const d = se.pts.map((p, k) => `${k ? 'L' : 'M'}${f(sx(p[0]))} ${f(sy(p[1]))}`).join(' ');
    s += `<path class="ln draw ${se.tone || 'ocean'}${se.dash ? ' dash' : ''}" pathLength="1" style="--i:${i}" d="${d}"/>`;
    const last = se.pts[se.pts.length - 1];
    if (se.dot !== false) s += `<circle class="dot ${se.tone || 'ocean'} pop" style="--i:${i + 3}" cx="${f(sx(last[0]))}" cy="${f(sy(last[1]))}" r="4"/>`;
    if (se.label) {
      let ly = sy(last[1]) + 4;
      used.forEach(u => { if (Math.abs(u - ly) < 15) ly = u + (ly >= u ? 15 : -15); });
      used.push(ly);
      s += pop(i + 4, T(Rr + 10, ly, se.label, `ts b ${se.tone || 'ocean'}`));
    }
  });
  if (note) s += T(L, 276, note, 'ts');
  return s;
}

// ---------- 10. bars: grouped, stacked, or signed bars ----------
function bars({ cats, series, stacked = false, max, min = 0, yt = [], yfmt = v => v, legend = true, valueLabels = false, labelFmt = v => v, labels, note, catW }) {
  const L = 46, Rr = 546, Tt = legend ? 34 : 16, B = note ? (cats.some(c => c.includes('\n')) ? 210 : 224) : 236;
  const sy = v => B - ((v - min) / (max - min)) * (B - Tt);
  const n = cats.length, slot = (Rr - L) / n, bw = catW || Math.min(64, slot * (stacked ? 0.56 : 0.72));
  let s = '';
  yt.forEach(v => { s += `<line class="grid" x1="${L}" x2="${Rr}" y1="${f(sy(v))}" y2="${f(sy(v))}"/>` + T(L - 8, sy(v) + 4, yfmt(v), 'ts', 'end'); });
  s += `<line class="axis" x1="${L}" x2="${Rr}" y1="${f(sy(0))}" y2="${f(sy(0))}"/>`;
  cats.forEach((c, i) => {
    const cx = L + slot * (i + 0.5);
    s += TT(cx, B + 20, c, n > 6 ? 'ts tiny' : 'ts', 'middle', 13);
    let base = 0;
    series.forEach((se, k) => {
      const v = se.vals[i];
      if (v == null) return;
      let x, w, ya, yb;
      if (stacked) { w = bw; x = cx - w / 2; ya = sy(base + v); yb = sy(base); base += v; }
      else { w = bw / series.length; x = cx - bw / 2 + k * w; ya = sy(Math.max(v, 0)); yb = sy(Math.min(v, 0)); }
      s += `<rect class="bar ${se.tone} grow${v < 0 ? ' neg' : ''}" style="--i:${i}" x="${f(x + 1)}" y="${f(ya)}" width="${f(w - 2)}" height="${f(Math.max(1, yb - ya))}" rx="2"/>`;
      if (valueLabels && !stacked) s += pop(i + 2, T(x + w / 2, v >= 0 ? ya - 6 : yb + 14, labels ? labels[i] : labelFmt(v), 'ts b', 'middle'));
      if (valueLabels && stacked && v >= 8) s += pop(i + 2, T(cx, (ya + yb) / 2 + 4, labelFmt(v), 'ts inv', 'middle'));
    });
  });
  if (legend) {
    let x = L;
    series.forEach(se => { s += `<rect class="bar ${se.tone}" x="${x}" y="10" width="11" height="11" rx="2"/>` + T(x + 16, 20, se.name, 'ts'); x += 26 + se.name.length * 6.6; });
  }
  if (note) s += T(L, 276, note, 'ts');
  return s;
}

// ---------- 11. kpi: dashboard mock with KPI cards and an insight line ----------
function kpi({ kpis, title = '', insight, tabs }) {
  let s = R(10, 8, 540, 264, 12, 'panel');
  let y0 = 24;
  if (tabs) {
    const tw = 520 / tabs.length;
    tabs.forEach((t, i) => { s += pop(i, R(20 + i * tw, 20, tw - 4, 28, 6, i === 0 ? 'tab on' : 'tab') + T(20 + i * tw + (tw - 4) / 2, 38, t, 'ts', 'middle')); });
    y0 = 60;
  } else if (title) { s += T(24, 36, title, 'tb'); y0 = 50; }
  const n = kpis.length, w = (512 - 10 * (n - 1)) / n;
  kpis.forEach((k, i) => {
    const x = 24 + i * (w + 10);
    s += pop(i + 1, R(x, y0, w, 66, 9, `bx ${k[3] || ''}`) + T(x + 10, y0 + 19, k[0], 'tc small') + T(x + 10, y0 + 46, k[1], 'tkpi') + (k[2] ? T(x + 10, y0 + 60, k[2], 'ts tiny') : ''));
  });
  const yb = y0 + 80;
  if (insight) {
    s += pop(n + 1, R(24, yb, 236, 252 - yb, 9, 'bx sand') + T(36, yb + 20, 'EXECUTIVE INSIGHT', 'tc acc') +
      wrapText(insight, 36, yb + 40, 34, 'ts dark', 15));
  }
  const cx = insight ? 272 : 24, cw = insight ? 264 : 512;
  const pts = [0.42, 0.55, 0.5, 0.62, 0.58, 0.7, 0.66, 0.78, 0.74, 0.86];
  const ph = 252 - yb - 16;
  const d = pts.map((v, i) => `${i ? 'L' : 'M'}${f(cx + 10 + i * (cw - 20) / (pts.length - 1))} ${f(yb + 8 + ph * (1 - v))}`).join(' ');
  s += R(cx, yb, cw, 252 - yb, 9, 'bx') + `<path class="ln draw ocean" pathLength="1" d="${d}"/>`;
  return s;
}
function wrapText(str, x, y, chars, cls, lh) {
  const words = String(str).split(' '); const out = []; let line = '';
  words.forEach(w => { if ((line + ' ' + w).trim().length > chars) { out.push(line.trim()); line = w; } else line += ' ' + w; });
  if (line.trim()) out.push(line.trim());
  return out.map((l, i) => T(x, y + i * lh, l, cls)).join('');
}

// ---------- 12. insight: numbers in, sentence out ----------
function insight({ inputs, rule, output, lenses }) {
  let s = '';
  inputs.forEach((p, i) => { s += pop(i, R(14, 30 + i * 52, 150, 42, 9, 'bx') + T(26, 47 + i * 52, p[0], 'tc small') + T(26, 64 + i * 52, p[1], 'tm b')); });
  const midY = 30 + (inputs.length * 52 - 10) / 2;
  inputs.forEach((p, i) => { s += `<path class="flow" d="M164 ${51 + i * 52} C 186 ${51 + i * 52}, 186 ${f(midY)}, 204 ${f(midY)}"${i === inputs.length - 1 ? ' marker-end="url(#ah)"' : ''}/>`; });
  s += pop(inputs.length, R(208, midY - 46, 132, 92, 12, 'bx jungle') + T(274, midY - 22, 'RULES', 'tc acc', 'middle') + TT(274, midY + 10, rule, 'ts dark', 'middle', 15));
  s += arrow(`M340 ${f(midY)} L 360 ${f(midY)}`);
  s += pop(inputs.length + 1, R(364, 28, 182, 224, 12, 'bx ocean hot') + T(378, 52, 'GENERATED TEXT', 'tc acc') + wrapText(output, 378, 78, 22, 'ts dark', 17));
  if (lenses) s += lenses.map((l, i) => pop(i + 6, R(378 + (i % 2) * 82, 196 + Math.floor(i / 2) * 26, 76, 20, 10, 'chip') + T(416 + (i % 2) * 82, 210 + Math.floor(i / 2) * 26, l, 'ts tiny', 'middle'))).join('');
  return s;
}

// ---------- 13. mapping: many codes to fewer targets ----------
function mapping({ left, right, links, leftCap = '', rightCap = '' }) {
  let s = T(100, 24, leftCap, 'tc', 'middle') + T(452, 24, rightCap, 'tc', 'middle');
  const ly = i => 46 + i * (220 / Math.max(1, left.length - 1 || 1));
  const ry = i => 56 + i * (200 / Math.max(1, right.length - 1 || 1));
  links.forEach(([a, b], k) => { s += `<path class="flow slow" d="M188 ${f(ly(a))} C 270 ${f(ly(a))}, 290 ${f(ry(b))}, 362 ${f(ry(b))}"/>`; });
  left.forEach((t, i) => { s += pop(i, R(14, ly(i) - 15, 174, 30, 8, 'bx') + T(28, ly(i) + 5, t, 'tm small')); });
  right.forEach((t, i) => { s += pop(i + left.length, R(364, ry(i) - 17, 182, 34, 9, 'bx ocean') + T(376, ry(i) + 5, t, 'ts dark')); });
  return s;
}

// ---------- 14. map: Alberta outline with sized bubbles ----------
const AB = [[-120, 60], [-110, 60], [-110, 49], [-114.06, 49], [-114.6, 49.5], [-114.7, 50.3], [-115.6, 50.8], [-116.2, 51.6], [-117.3, 52.2], [-118.3, 52.9], [-119.1, 53.4], [-120, 53.8]];
const CITY = { Calgary: [-114.07, 51.05], Edmonton: [-113.49, 53.55], 'Red Deer': [-113.81, 52.27], Lethbridge: [-112.84, 49.69], 'Medicine Hat': [-110.68, 50.04], 'Grande Prairie': [-118.8, 55.17], 'Fort McMurray': [-111.38, 56.73], Banff: [-115.57, 51.18], Camrose: [-112.82, 53.02], 'Cold Lake': [-110.2, 54.46] };
function map({ points, unit = '', caption = '' }) {
  const px = lo => 40 + ((lo + 120) / 10) * 190, py = la => 262 - ((la - 49) / 11) * 244;
  const d = AB.map((p, i) => `${i ? 'L' : 'M'}${f(px(p[0]))} ${f(py(p[1]))}`).join(' ') + 'Z';
  let s = `<path class="land" d="${d}"/>`;
  const mx = Math.max(...points.map(p => p[1]));
  points.forEach(([name, v], i) => {
    const [lo, la] = CITY[name];
    const r = 4 + Math.sqrt(v / mx) * 17;
    s += pop(i, `<circle class="bub" cx="${f(px(lo))}" cy="${f(py(la))}" r="${f(r)}"/>`);
  });
  points.forEach(([name, v], i) => {
    s += pop(i + 1, R(290, 28 + i * 38, 256, 30, 8, 'bx') + T(302, 48 + i * 38, name, 'tl') + T(536, 48 + i * 38, typeof v === 'number' && unit !== 'none' ? v.toLocaleString('en-CA') + unit : '', 'tm b', 'end'));
  });
  if (caption) s += T(290, 28 + points.length * 38 + 16, caption, 'ts');
  return s;
}

// ---------- 15. scrape: browser pages, loop, table ----------
function scrape({ url, count, loop, fields }) {
  let s = R(14, 20, 250, 236, 12, 'panel') + R(14, 20, 250, 30, 12, 'bar-top') + `<circle class="dotc" cx="30" cy="35" r="4"/><circle class="dotc" cx="44" cy="35" r="4"/><circle class="dotc" cx="58" cy="35" r="4"/>` + T(72, 39, url, 'tm tiny');
  s += T(28, 74, count, 'tb');
  for (let i = 0; i < 6; i++) s += pop(i, R(28, 88 + i * 24, 222, 18, 4, i % 2 ? 'row' : 'row alt'));
  s += pop(7, R(130, 234, 120, 14, 7, 'chip') + T(190, 245, loop, 'ts tiny', 'middle'));
  s += `<path class="flow" d="M264 140 C 300 140, 300 140, 330 140" marker-end="url(#ah)"/>`;
  s += pop(8, R(336, 30, 210, 216, 12, 'bx ocean hot') + T(350, 54, 'DATAFRAME', 'tc acc'));
  fields.forEach((fld, i) => { s += pop(9 + i, T(350, 80 + i * 20, fld, 'tm small')); });
  return s;
}

// ---------- 16. loop: one template applied to many outputs ----------
function loop({ template, n, each, total, cols = 6 }) {
  let s = pop(0, R(14, 70, 140, 140, 12, 'bx jungle') + TT(84, 128, template, 'tb', 'middle', 18) + T(84, 176, 'one template', 'ts', 'middle'));
  s += arrow('M154 140 L 188 140');
  const rows = Math.ceil(n / cols), cw = 52, ch = 42, gx = 8, gy = 10;
  for (let i = 0; i < n; i++) {
    const x = 196 + (i % cols) * (cw + gx), y = 34 + Math.floor(i / cols) * (ch + gy);
    s += pop(Math.floor(i / 2), R(x, y, cw, ch, 6, 'bx mini') + [0, 1, 2].map(k => `<rect class="tick" x="${x + 8}" y="${y + 9 + k * 9}" width="${[34, 26, 30][k]}" height="4" rx="2"/>`).join(''));
  }
  const by = 34 + rows * (ch + gy) + 6;
  s += T(196, by + 8, each, 'ts') + pop(12, R(386, by - 8, 160, 30, 15, 'chip hotchip') + T(466, by + 12, total, 'tm b', 'middle'));
  return s;
}

// ---------- 17. doc: a report page with section callouts ----------
function doc({ title, sections, pages }) {
  let s = pop(0, R(40, 16, 190, 248, 8, 'paper') + R(56, 34, 60, 6, 3, 'tick acc') + wrapText(title, 56, 62, 22, 'tl b', 17));
  [0, 1, 2, 3].forEach(k => { s += `<rect class="tick" x="56" y="${120 + k * 12}" width="${[150, 140, 156, 110][k]}" height="5" rx="2.5"/>`; });
  [18, 30, 24, 40, 34].forEach((h, k) => { s += `<rect class="bar ocean grow" style="--i:${k}" x="${62 + k * 26}" y="${236 - h}" width="16" height="${h}" rx="2"/>`; });
  if (pages) s += T(135, 256, pages, 'ts', 'middle');
  sections.forEach((t, i) => {
    const y = 34 + i * (220 / Math.max(1, sections.length));
    s += pop(i + 1, `<circle class="dot jungle" cx="270" cy="${f(y + 10)}" r="5"/>` + T(286, y + 15, t, 'tl'));
  });
  return s;
}

// ---------- 18. coef: dot and whisker estimates ----------
function coef({ rows, min, max, zeroLabel = '0' }) {
  const L = 210, Rr = 530, sx = v => L + ((v - min) / (max - min)) * (Rr - L);
  let s = `<line class="mark" x1="${f(sx(0))}" x2="${f(sx(0))}" y1="26" y2="236"/>` + T(sx(0), 256, zeroLabel, 'ts', 'middle');
  rows.forEach((r, i) => {
    const y = 60 + i * 64;
    s += T(20, y + 5, r.name, 'tl');
    s += pop(i, `<line class="whisk ${r.tone}" x1="${f(sx(r.lo))}" x2="${f(sx(r.hi))}" y1="${y}" y2="${y}"/><circle class="dot ${r.tone}" cx="${f(sx(r.est))}" cy="${y}" r="7"/>` + T(sx(r.est), y - 14, r.lab, `ts b ${r.tone}`, 'middle'));
  });
  return s;
}

// ---------- 19. rings: core to edge shift (donut effect) ----------
function rings({ labels, note }) {
  const cx = 150, cy = 140;
  let s = '';
  [112, 82, 52, 24].forEach((r, i) => { s += pop(i, `<circle class="ring r${3 - i}" cx="${cx}" cy="${cy}" r="${r}"/>`); });
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b], i) => {
    s += `<path class="flow" d="M${cx + a * 20} ${cy + b * 20} L ${f(cx + a * 74)} ${f(cy + b * 74)}" marker-end="url(#ah)"/>`;
  });
  labels.forEach((l, i) => { s += pop(i + 4, `<circle class="dot r${i}" cx="300" cy="${54 + i * 46}" r="7"/>` + T(318, 59 + i * 46, l, 'tl')); });
  if (note) s += T(300, 250, note, 'ts');
  return s;
}

// ---------- 20. merit: supply stack against demand ----------
function merit({ blocks, demand, price, legend = [] }) {
  const L = 50, B = 236, Tt = 30;
  let x = L, s = `<line class="axis" x1="${L}" x2="520" y1="${B}" y2="${B}"/><line class="axis" x1="${L}" x2="${L}" y1="${Tt}" y2="${B}"/>`;
  s += T(L, Tt - 10, 'price ($/MWh)', 'ts') + T(520, B + 22, 'offered generation (GW)', 'ts', 'end');
  blocks.forEach((b, i) => { s += `<rect class="bar ${b.tone} grow" style="--i:${i}" x="${x}" y="${B - b.h}" width="${b.w}" height="${b.h}"/>`; x += b.w; });
  s += `<line class="mark dem" x1="${demand}" x2="${demand}" y1="${Tt}" y2="${B}"/>` + pop(8, TT(Math.max(demand, x) + 8, Tt + 66, 'hourly\ndemand', 'ts b coral', 'start', 15));
  s += `<line class="hline coral" x1="${L}" x2="520" y1="${price}" y2="${price}"/>` + pop(9, T(200, price - 7, 'pool price set here', 'ts b coral'));
  let lx = L + 10;
  legend.forEach(([tone, name], i) => { s += pop(i + 10, `<rect class="bar ${tone}" x="${lx}" y="${B - 120}" width="11" height="11" rx="2"/>` + T(lx + 16, B - 110, name, 'ts')); lx += 28 + name.length * 6.6; });
  return s;
}

// ---------- 21. story: scroll narrative with a sticky chart ----------
function story() {
  let s = R(20, 14, 520, 252, 14, 'panel');
  [0, 1, 2].forEach(i => { s += pop(i, R(40, 40 + i * 70, 170, 56, 9, i === 1 ? 'bx ocean hot' : 'bx') + `<rect class="tick" x="54" y="${56 + i * 70}" width="120" height="6" rx="3"/><rect class="tick" x="54" y="${70 + i * 70}" width="90" height="6" rx="3"/>`); });
  s += `<path class="flow" d="M222 138 L 248 138" marker-end="url(#ah)"/>`;
  s += R(256, 36, 264, 206, 10, 'bx');
  [40, 34, 26, 36, 30, 34, 32, 34, 54, 66, 90, 120].forEach((h, k) => { s += `<rect class="bar ${k >= 9 ? 'coral' : 'ocean'} grow" style="--i:${k}" x="${272 + k * 20}" y="${222 - h}" width="13" height="${h}" rx="2"/>`; });
  s += T(272, 58, 'sticky chart changes per step', 'ts');
  s += `<rect class="scroll" x="528" y="60" width="4" height="60" rx="2"/>`;
  return s;
}

// ---------- 22. ui: an app run screen ----------
function ui({ title, field, button, steps }) {
  let s = R(14, 14, 532, 252, 12, 'panel') + R(14, 14, 532, 34, 12, 'bar-top') + T(30, 37, title, 'tl b');
  s += T(34, 76, 'REPORTING YEAR', 'tc') + pop(0, R(34, 86, 120, 40, 8, 'bx') + T(94, 112, field, 'tb', 'middle'));
  s += pop(1, R(34, 138, 120, 34, 8, 'btnr') + T(94, 160, button, 'tl inv', 'middle'));
  steps.forEach((t, i) => { s += pop(i + 2, `<circle class="dot jungle" cx="194" cy="${78 + i * 24}" r="6"/><path class="chk" d="M190.5 ${78 + i * 24} l2.5 2.5 l4.5 -5"/>` + T(208, 83 + i * 24, t, 'ts dark')); });
  return s;
}

const RENDER = { sources, delta, catalog, stages, star, job, serve, chain, lines, bars, kpi, insight, mapping, map, scrape, loop, doc, coef, rings, merit, story, ui };

export function diagram(spec, label = '') {
  const fn = RENDER[spec.type];
  if (!fn) throw new Error('Unknown diagram type: ' + spec.type);
  return wrap(fn(spec), label || spec.type);
}

// Shared arrow marker, included once per page.
export const MARKER = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="ah" d="M1 1L9 5L1 9" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></marker><linearGradient id="ramp" x1="0" x2="1"><stop offset="0" stop-color="#b9763e"/><stop offset=".5" stop-color="#8b9aab"/><stop offset="1" stop-color="#cfa22a"/></linearGradient></defs></svg>`;

// A slider of approach steps. steps: [{label, title, text, dia}]
export function slider(steps, { id = 'approach', title = 'My approach', kicker = 'How I build', headingLevel = 2 } = {}) {
  const tabs = steps.map((s, i) => `<li><button type="button" data-go="${i}"${i === 0 ? ' aria-current="step"' : ''}><span>${String(i + 1).padStart(2, '0')}</span>${esc(s.label)}</button></li>`).join('');
  const slides = steps.map((s, i) => `
        <article class="slide${i === 0 ? ' on' : ''}" aria-label="Step ${i + 1}: ${esc(s.label)}">
          <div class="slide-text"><span class="step-k">${String(i + 1).padStart(2, '0')} · ${esc(s.label)}</span><h3>${esc(s.title)}</h3>${s.text ? `<p>${esc(s.text)}</p>` : ''}</div>
          ${diagram(s.dia, s.title)}
        </article>`).join('');
  const H = `h${headingLevel}`;
  return `<div class="slider" id="${id}-slider">
      <div class="slider-head">
        <div>${kicker ? `<div class="kicker">${esc(kicker)}</div>` : ''}<${H} id="${id}-title">${esc(title)}</${H}></div>
        <div class="slide-ctrl">
          <button type="button" class="nav-btn" data-dir="-1" aria-label="Previous step"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <button type="button" class="nav-btn" data-dir="1" aria-label="Next step"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
      </div>
      <ol class="steps-nav" aria-label="Steps">${tabs}</ol>
      <div class="progress" aria-hidden="true"><span></span></div>
      <div class="track" tabindex="0" aria-label="${esc(title)}, ${steps.length} steps">${slides}
      </div>
    </div>`;
}
