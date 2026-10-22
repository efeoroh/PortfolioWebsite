// Builds index.html and projects/<category>.html from the folders in brand_assets/Projects.
// Each project folder can hold: title.txt, keyword.txt, description/description.txt,
// thumbnail/ref.txt (or an image in thumbnail/), demo/ref.txt (file in the repo) or demo/url.txt (link),
// and video.txt (an extra demo video shown next to a live link).
// To add, remove or reorder projects, edit CATEGORIES below and run: node build.mjs
import { readFile, readdir, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECTS_BASE = join(__dirname, 'brand_assets', 'Projects');

const CATEGORIES = {
  dashboards: {
    title: 'Dashboards',
    desc: 'Self-serve Power BI and Tableau tools built on modelled data from BigQuery, Databricks and public APIs.',
    projects: [
      ['Dashboards',           '02_youth_labour_market_information', 'New'],
      ['Energy_Analytics',     '00_energy_market_intelligence_dashboard'],
      ['Dashboards',           '01_financial-assurance'],
      ['labor_economics',      '01_skilled_trades_dashboard'],
      ['RealEstate_Analytics', '01_property_management_dashboard'],
      ['RealEstate_Analytics', '03_airbnb_market_analysis'],
    ],
  },
  interactive: {
    title: 'Interactive',
    desc: 'Web-based data stories with scroll-driven narrative, animated charts and maps.',
    projects: [
      ['Interactive_Viz', '01_gift_trade_ledger', 'New'],
    ],
  },
  reports: {
    title: 'Reports',
    desc: 'Analytical reports and briefing notes that turn large datasets into executive-ready findings.',
    projects: [
      ['labor_economics',  '03_hiring_demand_bulletins'],
      ['labor_economics',  '04_industry_profiles_report'],
      ['Energy_Analytics', '01_canadian_crude_price_outlook'],
      ['Energy_Analytics', '02_canadian_energy_infrastructure'],
      ['Energy_Analytics', '03_canadian_electricity_emissions'],
    ],
  },
  research: {
    title: 'Research',
    desc: 'Statistical and economic modelling on labour and housing data.',
    projects: [
      ['labor_economics',      '02_migration_participation_rates'],
      ['RealEstate_Analytics', '02_impact_of_covid_edmonton'],
    ],
  },
  automation: {
    title: 'Automation',
    desc: 'Pipelines that replace recurring manual reporting with a single run.',
    projects: [
      ['Automation', '01_industry_profiles_report'],
      ['Automation', '02_lfs_indigenous_pipeline'],
      ['Automation', '03_ghg_data_pull'],
    ],
  },
};

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

function renderCard(proj, cat, badge) {
  const t = esc(proj.title);
  const k = proj.demo ? kind(proj.demo) : null;
  const blank = ' target="_blank" rel="noopener"';
  const img = proj.thumb
    ? `<img src="${esc(proj.thumb)}" alt="" loading="lazy">`
    : `<div class="ph"><span>${esc(CATEGORIES[cat].title)}</span><b>${t}</b></div>`;
  const play = (k === 'video' || proj.video) ? `<span class="play">${ICON_PLAY}</span>` : '';
  const badgeHtml = badge ? `<span class="badge">${esc(badge)}</span>` : '';
  let thumb, actions = [];
  if (k === 'video') {
    thumb = `<button type="button" class="thumb" data-video="${esc(proj.demo)}" data-title="${t}" aria-label="Watch ${t} demo">${img}${play}${badgeHtml}</button>`;
    actions.push(`<button type="button" class="act" data-video="${esc(proj.demo)}" data-title="${t}">Watch demo</button>`);
  } else if (proj.demo) {
    const label = proj.external ? 'Open live' : k === 'pdf' ? 'Read report' : k === 'image' ? 'View dashboard' : proj.video ? 'Open live' : 'Read report';
    thumb = `<a class="thumb" href="${esc(proj.demo)}"${blank} aria-label="${t}">${img}${play}${badgeHtml}</a>`;
    actions.push(`<a class="act" href="${esc(proj.demo)}"${blank}>${label} ${ARROW}</a>`);
  } else {
    thumb = `<div class="thumb">${img}${badgeHtml}</div>`;
    actions.push('<span class="act soon">Demo on request</span>');
  }
  if (proj.video && k !== 'video') {
    actions.push(`<button type="button" class="act soft" data-video="${esc(proj.video)}" data-title="${t}">Watch demo</button>`);
  }
  const tag = proj.keyword ? proj.keyword.split('|').map(s => s.trim()).join(' · ') : CATEGORIES[cat].title;
  return `<article class="card" data-cat="${cat}">
  ${thumb}
  <div class="card-body">
    <span class="tag">${esc(tag)}</span>
    <h3>${t}</h3>
    ${proj.desc ? `<p class="desc">${esc(proj.desc)}</p>` : ''}
    <div class="actions">${actions.join('')}</div>
  </div>
</article>`;
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

export const NAV = active => `<header class="nav">
  <div class="wrap">
    <a href="/" class="brand"><span class="brand-mark">EO</span>Efe Peter Oroh</a>
    <nav class="nav-links" id="navLinks" aria-label="Main">
      <a href="/#work"${active === 'work' ? ' aria-current="page"' : ''}>Work</a>
      <a href="/about.html"${active === 'about' ? ' aria-current="page"' : ''}>About</a>
      <a href="mailto:efeogheneoroh@gmail.com">Contact</a>
      <a href="/brand_assets/resume/EfeOroh_Resume.pdf" class="btn btn-solid" target="_blank" rel="noopener">Resume</a>
    </nav>
    <button class="nav-toggle" aria-label="Menu" aria-expanded="false" aria-controls="navLinks">
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>
  </div>
</header>`;

export const FOOTER = `<footer class="footer">
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

function renderHome(all) {
  const total = all.length;
  const counts = Object.fromEntries(Object.keys(CATEGORIES).map(k => [k, all.filter(c => c.cat === k).length]));
  const filters = [`<button type="button" class="filter" data-cat="all" aria-pressed="true">All <span class="n">${total}</span></button>`]
    .concat(Object.entries(CATEGORIES).map(([k, c]) =>
      `<button type="button" class="filter" data-cat="${k}" aria-pressed="false">${esc(c.title)} <span class="n">${counts[k]}</span></button>`)).join('\n        ');
  return `${HEAD('Efe Peter Oroh | Analytics Engineer', 'Analytics engineer building Databricks and BigQuery pipelines and Power BI dashboards, applied as an economic statistician.')}
${NAV('home')}
<main>
  <section class="hero">
    <div class="wrap">
      <div>
        <div class="eyebrow label"><span class="dot"></span>Analytics Engineer · Edmonton, AB</div>
        <h1>I build the data pipelines and dashboards <span>behind better decisions.</span></h1>
        <p class="sub">Databricks and BigQuery pipelines, modelled in SQL and served in Power BI. Applied every day as an economic statistician.</p>
        <div class="ctas">
          <a href="#work" class="btn btn-solid">See the work</a>
          <a href="/brand_assets/resume/EfeOroh_Resume.pdf" class="btn btn-line" target="_blank" rel="noopener">Resume</a>
        </div>
      </div>
      <figure class="portrait" style="margin:0">
        <img src="/brand_assets/Headshot/headshot_2026.jpg" alt="Efe Peter Oroh" width="900" height="900">
      </figure>
    </div>
  </section>

  <section class="flow" aria-label="How I build">
    <div class="wrap">
      <div class="flow-grid">
        <div class="flow-step"><h3><span class="mono">01</span>Ingest</h3><p>APIs, web scraping and scheduled Python and R jobs.</p></div>
        <div class="flow-step"><h3><span class="mono">02</span>Model</h3><p>Databricks and BigQuery, SQL and dimensional models.</p></div>
        <div class="flow-step"><h3><span class="mono">03</span>Serve</h3><p>Power BI dashboards, D3.js stories and automated reports.</p></div>
      </div>
    </div>
  </section>

  <section class="work" id="work">
    <div class="wrap">
      <div class="work-head">
        <div><div class="label">Portfolio</div><h2>Selected work</h2></div>
        <div class="filters" role="group" aria-label="Filter projects">
        ${filters}
        </div>
      </div>
      <div class="grid">
${all.map(c => c.html).join('\n')}
      </div>
    </div>
  </section>
</main>
${FOOTER}`;
}

function renderCategory(slug, cat, cards) {
  return `${HEAD(`${cat.title} | Efe Peter Oroh`, cat.desc)}
${NAV('work')}
<main>
  <section class="page-head">
    <div class="wrap">
      <a class="back" href="/#work">← All work</a>
      <div class="label">${esc(cat.title)}</div>
      <h1>${esc(cat.title)}</h1>
      <p>${esc(cat.desc)}</p>
    </div>
  </section>
  <section class="section">
    <div class="wrap"><div class="grid">
${cards.join('\n')}
    </div></div>
  </section>
</main>
${FOOTER}`;
}

const all = [];
await mkdir(join(__dirname, 'projects'), { recursive: true });
for (const [slug, cat] of Object.entries(CATEGORIES)) {
  const cards = [];
  for (const [folder, dir, badge] of cat.projects) {
    try {
      const proj = await readProject(folder, dir);
      const html = renderCard(proj, slug, badge);
      cards.push(html); all.push({ cat: slug, html });
    } catch (e) { console.warn('skipped', folder, dir, e.message); }
  }
  await writeFile(join(__dirname, 'projects', `${slug}.html`), renderCategory(slug, cat, cards), 'utf8');
  console.log(`  projects/${slug}.html (${cards.length})`);
}
await writeFile(join(__dirname, 'index.html'), renderHome(all), 'utf8');
console.log(`  index.html (${all.length} projects)\nBuild complete.`);
