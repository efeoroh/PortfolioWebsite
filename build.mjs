// Builds index.html from the folders in brand_assets/Projects.
// Each project folder can hold: title.txt, keyword.txt, description/description.txt,
// thumbnail/ref.txt (or an image in thumbnail/), demo/ref.txt (file in the repo) or demo/url.txt (link),
// and video.txt (an extra demo video shown next to a live link).
// To change what is featured or listed, edit FEATURED and MORE below, then run: node build.mjs
import { readFile, readdir, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECTS_BASE = join(__dirname, 'brand_assets', 'Projects');

// The four headline projects, in order.
const FEATURED = [
  ['Dashboards',       '02_youth_labour_market_information'],
  ['labor_economics',  '01_skilled_trades_dashboard'],
  ['labor_economics',  '02_migration_participation_rates'],
  ['Energy_Analytics', '00_energy_market_intelligence_dashboard'],
];

// Everything else, shown as a compact list.
const MORE = [
  ['labor_economics',      '03_hiring_demand_bulletins'],
  ['labor_economics',      '04_industry_profiles_report'],
  ['Energy_Analytics',     '01_canadian_crude_price_outlook'],
  ['Energy_Analytics',     '02_canadian_energy_infrastructure'],
  ['Energy_Analytics',     '03_canadian_electricity_emissions'],
  ['RealEstate_Analytics', '02_impact_of_covid_edmonton'],
  ['Dashboards',           '01_financial-assurance'],
  ['Automation',           '02_lfs_indigenous_pipeline'],
  ['Automation',           '03_ghg_data_pull'],
  ['Interactive_Viz',      '01_gift_trade_ledger'],
  ['RealEstate_Analytics', '01_property_management_dashboard'],
  ['RealEstate_Analytics', '03_airbnb_market_analysis'],
];

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const encPath = raw => raw.split('/').map(s => encodeURIComponent(s)).join('/');
const read = async p => { try { return (await readFile(p, 'utf8')).trim(); } catch { return null; } };
const toUrl = ref => (/^https?:\/\//.test(ref) || ref.startsWith('/')) ? ref : '/' + encPath(ref);

function kind(url) {
  const ext = url.split('?')[0].split('.').pop().toLowerCase();
  if (['mp4', 'mov', 'webm'].includes(ext)) return 'video';
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'avif', 'webp'].includes(ext)) return 'image';
  return 'page';
}

async function readProject(catFolder, dirName) {
  const p = join(PROJECTS_BASE, catFolder, dirName);
  const desc = await read(join(p, 'description', 'description.txt'));
  const keyword = await read(join(p, 'keyword.txt'));
  let title = await read(join(p, 'title.txt'));
  let thumb = await read(join(p, 'thumbnail', 'ref.txt'));
  if (thumb) thumb = toUrl(thumb);
  else {
    try {
      const img = (await readdir(join(p, 'thumbnail'))).find(f => /\.(png|jpe?g|gif|webp|avif)$/i.test(f));
      if (img) thumb = '/' + encPath(`brand_assets/Projects/${catFolder}/${dirName}/thumbnail/${img}`);
    } catch {}
  }
  const url = await read(join(p, 'demo', 'url.txt'));
  const ref = await read(join(p, 'demo', 'ref.txt'));
  const demo = url ? toUrl(url) : ref ? toUrl(ref) : null;
  const external = !!url && /^https?:\/\//.test(url);
  let video = await read(join(p, 'video.txt'));
  if (video) video = toUrl(video);
  if (!title) {
    title = dirName.replace(/^\d+_/, '').replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      .replace(/\bCovid\b/g, 'COVID').replace(/\bLfs\b/g, 'LFS').replace(/\bGhg\b/g, 'GHG');
  }
  return { title, desc, keyword, thumb, demo, external, video };
}

const ICON_PLAY = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M4 2.5v9l7.5-4.5z" fill="currentColor"/></svg>';
const ARROW = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9l6-6M4.5 3H9v4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const BLANK = ' target="_blank" rel="noopener"';

function primary(proj) {
  const k = proj.demo ? kind(proj.demo) : null;
  if (k === 'video') return { type: 'video', href: proj.demo, label: 'Watch demo' };
  if (proj.demo) {
    const label = proj.external || proj.video ? 'Open live' : k === 'image' ? 'View dashboard' : 'Read report';
    return { type: 'link', href: proj.demo, label };
  }
  return null;
}

function renderFeature(proj, i) {
  const t = esc(proj.title);
  const p = primary(proj);
  const img = proj.thumb ? `<img src="${esc(proj.thumb)}" alt="" loading="${i < 2 ? 'eager' : 'lazy'}">` : '';
  const play = p && p.type === 'video' ? `<span class="play">${ICON_PLAY}</span>` : '';
  const thumb = !p ? `<div class="thumb">${img}</div>`
    : p.type === 'video'
      ? `<button type="button" class="thumb" data-video="${esc(p.href)}" data-title="${t}" aria-label="Watch ${t} demo">${img}${play}</button>`
      : `<a class="thumb" href="${esc(p.href)}"${BLANK} aria-label="${t}">${img}</a>`;
  const act = !p ? '' : p.type === 'video'
    ? `<button type="button" class="act" data-video="${esc(p.href)}" data-title="${t}">${p.label}</button>`
    : `<a class="act" href="${esc(p.href)}"${BLANK}>${p.label} ${ARROW}</a>`;
  const tag = proj.keyword ? proj.keyword.split('|').map(s => s.trim()).join(' · ') : '';
  return `<article class="card feature">
  ${thumb}
  <div class="card-body">
    <div class="card-top"><span class="idx mono">0${i + 1}</span>${tag ? `<span class="tag">${esc(tag)}</span>` : ''}</div>
    <h3>${t}</h3>
    ${proj.desc ? `<p class="desc">${esc(proj.desc)}</p>` : ''}
    <div class="actions">${act}</div>
  </div>
</article>`;
}

function renderMini(proj) {
  const t = esc(proj.title);
  const p = primary(proj);
  const img = proj.thumb ? `<img src="${esc(proj.thumb)}" alt="" loading="lazy">` : '<span class="mini-ph"></span>';
  const what = !p ? 'On request' : p.type === 'video' ? 'Demo video' : p.label.replace('Read ', '').replace('Open ', '').replace(/^\w/, c => c.toUpperCase());
  const inner = `<span class="mini-thumb">${img}</span><span class="mini-text"><b>${t}</b><span class="mono">${esc(what)}</span></span>`;
  if (!p) return `<div class="mini">${inner}</div>`;
  if (p.type === 'video') return `<button type="button" class="mini" data-video="${esc(p.href)}" data-title="${t}">${inner}</button>`;
  return `<a class="mini" href="${esc(p.href)}"${BLANK}>${inner}</a>`;
}

const HEAD = (title, desc) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="/brand_assets/Headshot/headshot_2026.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="/css/styles.css">
</head>
<body>`;

const NAV = `<header class="nav">
  <div class="wrap">
    <a href="/" class="brand"><span class="brand-mark">EO</span>Efe Peter Oroh</a>
    <nav class="nav-links" id="navLinks" aria-label="Main">
      <a href="/#work">Work</a>
      <a href="/#approach">Approach</a>
      <a href="/about.html">About</a>
      <a href="/brand_assets/resume/EfeOroh_Resume.pdf" class="btn btn-solid" target="_blank" rel="noopener">Resume</a>
    </nav>
    <button class="nav-toggle" aria-label="Menu" aria-expanded="false" aria-controls="navLinks">
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>
  </div>
</header>`;

const FOOTER = `<footer class="footer">
  <div class="wrap">
    <div class="who"><b>Efe Peter Oroh</b><span>Analytics Engineer · Edmonton, Alberta</span></div>
    <nav aria-label="Contact">
      <a href="mailto:efeogheneoroh@gmail.com">efeogheneoroh@gmail.com</a>
      <a href="https://www.linkedin.com/in/efe-oroh/" target="_blank" rel="noopener">LinkedIn</a>
      <a href="https://github.com/efeoroh" target="_blank" rel="noopener">GitHub</a>
    </nav>
  </div>
</footer>
<dialog class="player" id="player" aria-label="Project demo">
  <video controls playsinline preload="none"></video>
  <div class="bar"><span></span><button type="button">Close</button></div>
</dialog>
<script src="/js/site.js" defer></script>
</body>
</html>
`;

async function load(list) {
  const out = [];
  for (const [folder, dir] of list) {
    try { out.push(await readProject(folder, dir)); } catch (e) { console.warn('skipped', folder, dir, e.message); }
  }
  return out;
}

const featured = await load(FEATURED);
const more = await load(MORE);
const approach = await readFile(join(__dirname, 'partials', 'approach.html'), 'utf8');

const html = `${HEAD('Efe Peter Oroh | Analytics Engineer', 'Analytics engineer building Databricks pipelines, modelled in SQL and served in Power BI.')}
${NAV}
<main>
  <section class="hero">
    <div class="wrap">
      <div class="hero-text">
        <div class="eyebrow label"><span class="dot"></span>Efe Peter Oroh · Edmonton, AB</div>
        <h1>Analytics<br>Engineer</h1>
        <p class="sub">I build Databricks pipelines, modelled in SQL and served in Power BI. Applied every day as an economic statistician.</p>
        <div class="ctas">
          <a href="#work" class="btn btn-solid">See the work</a>
          <a href="#approach" class="btn btn-line">How I build</a>
        </div>
      </div>
      <figure class="portrait">
        <img src="/brand_assets/Headshot/headshot_2026.jpg" alt="Efe Peter Oroh" width="900" height="900">
      </figure>
    </div>
  </section>

  <section class="work" id="work">
    <div class="wrap">
      <div class="section-head"><div class="label">Selected work</div><h2>Featured projects</h2></div>
      <div class="grid two">
${featured.map(renderFeature).join('\n')}
      </div>
    </div>
  </section>

${approach}
  <section class="more" id="more">
    <div class="wrap">
      <div class="section-head"><div class="label">Archive</div><h2>Other economic reports and research</h2></div>
      <div class="mini-grid">
${more.map(renderMini).join('\n')}
      </div>
    </div>
  </section>
</main>
${FOOTER}`;

await writeFile(join(__dirname, 'index.html'), html, 'utf8');

// Old category links now point to the homepage.
await mkdir(join(__dirname, 'projects'), { recursive: true });
for (const slug of ['dashboards', 'reports', 'research', 'automation', 'interactive', 'other']) {
  await writeFile(join(__dirname, 'projects', `${slug}.html`),
    `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0; url=/#work"><link rel="canonical" href="/"><title>Efe Peter Oroh</title></head><body><a href="/#work">Go to work</a></body></html>\n`, 'utf8');
}
console.log(`index.html: ${featured.length} featured, ${more.length} more. Build complete.`);
