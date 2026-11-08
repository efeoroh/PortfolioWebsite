// Builds the whole site: index.html, about.html and one page per project in work/.
// Project content lives in content/projects.mjs; diagrams are drawn by lib/diagrams.mjs.
// Run: node build.mjs
import { readFile, readdir, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PROJECTS, ARCHIVE_ORDER } from './content/projects.mjs';
import { slider, MARKER, esc } from './lib/diagrams.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = join(__dirname, 'brand_assets', 'Projects');
const encPath = raw => raw.split('/').map(s => encodeURIComponent(s)).join('/');
const read = async p => { try { return (await readFile(p, 'utf8')).trim(); } catch { return null; } };
const toUrl = ref => (/^https?:\/\//.test(ref) || ref.startsWith('/')) ? ref : '/' + encPath(ref);
const kind = url => {
  const ext = url.split('?')[0].split('.').pop().toLowerCase();
  if (['mp4', 'mov', 'webm'].includes(ext)) return 'video';
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return 'image';
  if (/tableau\.com/.test(url)) return 'tableau';
  return 'page';
};

// Thumbnail, demo file or link, and optional extra video, from the project's folder.
async function assets(p) {
  const dir = join(BASE, ...p.ref);
  let thumb = await read(join(dir, 'thumbnail', 'ref.txt'));
  if (thumb) thumb = toUrl(thumb);
  else {
    try {
      const img = (await readdir(join(dir, 'thumbnail'))).find(f => /\.(png|jpe?g|webp)$/i.test(f));
      if (img) thumb = '/' + encPath(`brand_assets/Projects/${p.ref.join('/')}/thumbnail/${img}`);
    } catch {}
  }
  const url = await read(join(dir, 'demo', 'url.txt'));
  const ref = await read(join(dir, 'demo', 'ref.txt'));
  let video = await read(join(dir, 'video.txt'));
  const demoUrl = url ? toUrl(url) : ref ? toUrl(ref) : null;
  let demo = p.demo || null;
  if (!demo && demoUrl) {
    const k = kind(demoUrl);
    demo = k === 'video' ? { type: 'video', href: demoUrl }
      : k === 'pdf' ? { type: 'report', href: demoUrl, label: 'Read the report (PDF)' }
      : k === 'tableau' ? { type: 'link', href: demoUrl, label: 'Open on Tableau Public' }
      : k === 'image' ? { type: 'link', href: demoUrl, label: 'View the dashboard' }
      : { type: 'report', href: demoUrl, label: 'Read the report' };
  }
  if (!demo) demo = { type: 'none', label: 'Demo available on request.' };
  if (video) video = toUrl(video);
  if (demo.type === 'video') video = demo.href;
  return { thumb, demo, video };
}

const PLAY = '<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1v8l7-4z" fill="currentColor"/></svg>';
const ARROW = '<svg width="13" height="13" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6h8M6.5 2.5L10 6l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const demoBtn = (href, title, label = 'Watch demo') => `<button type="button" class="demo-btn" data-video="${esc(href)}" data-title="${esc(title)}"><span class="pl">${PLAY}</span>${label}</button>`;

const HEAD = (title, desc, extra = '') => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="/brand_assets/Headshot/headshot_about.jpg">
<meta name="theme-color" content="#fbf7ef">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="/css/styles.css">${extra}
</head>
<body>`;

const NAV = active => `<header class="nav">
  <div class="wrap">
    <a href="/" class="brand"><span class="brand-mark">EO</span>Efe Peter Oroh</a>
    <nav class="nav-links" id="navLinks" aria-label="Main">
      <a href="/#work"${active === 'work' ? ' aria-current="page"' : ''}>Work</a>
      <a href="/#approach">Approach</a>
      <a href="/about.html"${active === 'about' ? ' aria-current="page"' : ''}>About</a>
      <a href="/brand_assets/resume/EfeOroh_Resume.pdf" class="btn btn-solid" target="_blank" rel="noopener">Resume</a>
    </nav>
    <button class="nav-toggle" aria-label="Menu" aria-expanded="false" aria-controls="navLinks">
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
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

const WAVE = (cls, fill) => `<svg class="${cls}" viewBox="0 0 1440 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40 V22 C 120 4, 240 4, 360 20 S 600 38, 720 22 S 960 2, 1080 18 S 1320 38, 1440 20 V40 Z" fill="${fill}"/></svg>`;

// ---------------------------------------------------------------- homepage
function blob(cx, cy, rx, ry, w) {
  const k = 0.5523;
  const p = [[cx, cy - ry * w[0]], [cx + rx * w[1], cy], [cx, cy + ry * w[2]], [cx - rx * w[3], cy]];
  return `M${p[0][0]} ${p[0][1]} C ${cx + rx * k * w[1]} ${p[0][1]}, ${p[1][0]} ${cy - ry * k * w[0]}, ${p[1][0]} ${p[1][1]} C ${p[1][0]} ${cy + ry * k * w[2]}, ${cx + rx * k * w[1]} ${p[2][1]}, ${p[2][0]} ${p[2][1]} C ${cx - rx * k * w[3]} ${p[2][1]}, ${p[3][0]} ${cy + ry * k * w[2]}, ${p[3][0]} ${p[3][1]} C ${p[3][0]} ${cy - ry * k * w[0]}, ${cx - rx * k * w[3]} ${p[0][1]}, ${p[0][0]} ${p[0][1]} Z`;
}
const HERO_ART = (() => {
  const trail = 'M150 300 C 190 284, 170 236, 214 218 S 300 150, 318 120';
  const peb = (cx, cy, fill, stroke, k, t, s, w) => `<g>
      <text class="pk" x="${cx}" y="${cy - 66}" text-anchor="middle">${k}</text>
      <path d="${blob(cx, cy, 82, 50, w)}" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
      <text class="pt" x="${cx}" y="${cy + 2}" text-anchor="middle">${t}</text>
      <text class="ps" x="${cx}" y="${cy + 22}" text-anchor="middle">${s}</text>
    </g>`;
  const dots = [0, -1.3, -2.6].map(b => `<circle r="5" fill="#ef6f57"><animateMotion dur="3.9s" begin="${b}s" repeatCount="indefinite" path="${trail}"/></circle>`).join('');
  return `<svg class="hero-art" viewBox="0 0 440 400" role="img" aria-label="Pipeline: ingest with Databricks, model with SQL, serve in Power BI">
    <path class="trail" d="${trail}"/>
    ${peb(92, 322, '#e2f3f2', '#0a7d8c', '01 INGEST', 'Databricks', 'pipelines', [1, 1.04, .94, 1])}
    ${peb(232, 204, '#e4f2e7', '#2e8a57', '02 MODEL', 'SQL', 'star schemas', [.95, 1, 1.05, .97])}
    ${peb(356, 94, '#fff2d4', '#f3b33d', '03 SERVE', 'Power BI', 'dashboards', [1.03, .96, 1, 1.04])}
    ${dots}
  </svg>`;
})();

function featureCard(p, i) {
  const href = `/work/${p.slug}.html`;
  return `        <article class="card t-${p.tone}">
          <a class="mat" href="${href}" aria-label="${esc(p.title)}"><span class="idx">0${i + 1}</span><img src="${esc(p.thumb)}" alt="" loading="${i < 2 ? 'eager' : 'lazy'}"></a>
          <div class="card-body">
            <span class="tag">${esc(p.tag)}</span>
            <h3><a href="${href}">${esc(p.title)}</a></h3>
            <p>${esc(p.short)}</p>
            <div class="actions"><a class="link-arrow" href="${href}">View project ${ARROW}</a>${p.video ? demoBtn(p.video, p.title) : ''}</div>
          </div>
        </article>`;
}
function miniTile(p) {
  const img = p.thumb ? `<img src="${esc(p.thumb)}" alt="" loading="lazy">` : `<span class="mini-ph">${esc(p.title.split(' ').map(w => w[0]).slice(0, 2).join(''))}</span>`;
  return `        <a class="mini t-${p.tone}" href="/work/${p.slug}.html"><span class="mini-thumb">${img}</span><span class="mini-text"><b>${esc(p.title)}</b><span>${esc(p.tag)}</span></span></a>`;
}

const APPROACH = [
  { label: 'Ingest', title: 'Every source, one landing zone.', dia: { type: 'sources', items: ['Statistics Canada API', 'Bank of Canada API', 'Web scraping', 'Excel and CSV drops'], target: 'Landing zone', targetSub: 'raw files, as delivered' } },
  { label: 'Govern', title: 'Delta tables. Every read and write is tracked.', dia: { type: 'delta', rows: [['analyst', 'read', '09:02'], ['pipeline', 'write', '06:00'], ['viewer', 'denied', '11:40']] } },
  { label: 'Refine', title: 'Bronze to silver to gold.', dia: { type: 'stages', stages: [{ name: 'Bronze', cap: 'raw, as landed', tone: 'bronze' }, { name: 'Silver', cap: 'cleaned and joined', tone: 'silver' }, { name: 'Gold', cap: 'analytics-ready', tone: 'gold' }] } },
  { label: 'Model', title: 'Gold is a star schema, built for fast loads.', dia: { type: 'star', fact: 'fact_labour_force', factSub: 'measures', dims: ['dim_date', 'dim_geography', 'dim_industry', 'dim_occupation'] } },
  { label: 'Automate', title: 'One scheduled job, with change data capture.', dia: { type: 'job', schedule: 'daily 06:00', tasks: ['ingest', 'bronze', 'silver', 'gold'], note: { label: 'CDC', text: 'only new and changed rows run', foot: ' ' } } },
  { label: 'Serve', title: 'Connect, model, publish.', dia: { type: 'serve' } },
];

function renderHome(featured, archive) {
  return `${HEAD('Efe Peter Oroh | Analytics Engineer', 'Analytics engineer building Databricks pipelines, modelled in SQL and served in Power BI.')}
${MARKER}
${NAV('home')}
<main>
  <section class="hero">
    <div class="wrap">
      <div>
        <span class="hello"><span class="dot"></span>Efe Peter Oroh · Edmonton, AB</span>
        <h1>Analytics<br><span class="under">Engineer<svg viewBox="0 0 300 30" preserveAspectRatio="none" aria-hidden="true"><path d="M4 18 C 50 4, 90 30, 140 16 S 230 4, 296 14" fill="none" stroke="#f3b33d" stroke-width="7" stroke-linecap="round"/></svg></span></h1>
        <p class="sub">I build Databricks pipelines, model the data in SQL and serve it in Power BI. I do this every day as a data analyst working with economic data.</p>
        <div class="ctas">
          <a href="#work" class="btn btn-solid">See the work</a>
          <a href="#approach" class="btn btn-line">How I build</a>
        </div>
      </div>
      ${HERO_ART}
    </div>
    <svg class="waves" viewBox="0 0 1440 70" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 40 C 160 10, 320 10, 480 36 S 800 64, 960 38 S 1280 10, 1440 34" fill="none" stroke="#5cc8cf" stroke-width="2.5" opacity=".7"/>
      <path d="M0 54 C 180 30, 360 30, 540 50 S 900 72, 1080 52 S 1340 34, 1440 48" fill="none" stroke="#0a7d8c" stroke-width="2.5" opacity=".5"/>
    </svg>
  </section>

  <section class="section" id="work" style="padding-top:24px">
    <div class="wrap">
      <div class="section-head"><div><div class="kicker">Selected work</div><h2>Featured projects</h2></div><p>Pick any project to see the context, the question it answered and how I built it.</p></div>
      <div class="feature-grid">
${featured.map(featureCard).join('\n')}
      </div>
    </div>
  </section>

  <div class="band-sea" id="approach">
    ${WAVE('wave-top', '#e2f3f2')}
    <section class="section">
      <div class="wrap">
    ${slider(APPROACH, { id: 'approach', title: 'My approach', kicker: 'How I build' })}
      </div>
    </section>
    ${WAVE('wave-bottom', '#e2f3f2')}
  </div>

  <section class="section" id="more" style="padding-top:80px">
    <div class="wrap">
      <div class="section-head"><div><div class="kicker">Archive</div><h2>Other economic reports and research</h2></div></div>
      <div class="mini-grid">
${archive.map(miniTile).join('\n')}
      </div>
    </div>
  </section>
</main>
${FOOTER}`;
}

// ---------------------------------------------------------------- project pages
function demoSection(p) {
  const d = p.demo;
  let ctas = '', title = 'See it for yourself', text = '';
  if (d.type === 'video') { text = 'A short screen recording of the finished work. It only plays when you press the button.'; ctas = `<button type="button" class="btn btn-solid" data-video="${esc(d.href)}" data-title="${esc(p.title)}">${PLAY} Watch the demo</button>`; }
  else if (d.type === 'report') { text = 'The full report, with every chart and the written analysis.'; ctas = `<a class="btn btn-solid" href="${esc(d.href)}" target="_blank" rel="noopener">${esc(d.label)} ${ARROW}</a>`; }
  else if (d.type === 'link') { text = 'The interactive version, hosted online.'; ctas = `<a class="btn btn-solid" href="${esc(d.href)}" target="_blank" rel="noopener">${esc(d.label)} ${ARROW}</a>`; }
  else if (d.type === 'live') { text = 'The live page runs in your browser, and a short recording walks through it.'; ctas = `<a class="btn btn-solid" href="${esc(d.href)}" target="_blank" rel="noopener">${esc(d.label)} ${ARROW}</a>${p.video ? `<button type="button" class="btn btn-line" data-video="${esc(p.video)}" data-title="${esc(p.title)}">${PLAY} Watch the demo</button>` : ''}`; }
  else { title = 'Demo'; text = d.label; }
  return `<div class="demo-card">
        <div><div class="kicker">Demo</div><h2>${esc(title)}</h2><p>${esc(text)}</p>${ctas ? `<div class="ctas">${ctas}</div>` : ''}</div>
        ${p.thumb ? `<img src="${esc(p.thumb)}" alt="${esc(p.title)} preview" loading="lazy">` : ''}
      </div>`;
}

function renderProject(p, prev, next) {
  const meta = p.meta.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
  const subq = p.subq && p.subq.length ? `<ul>${p.subq.map(q => `<li>${esc(q)}</li>`).join('')}</ul>` : '';
  const outcome = p.outcome.map(([k, v]) => `<div class="out"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join('');
  return `${HEAD(`${p.title} | Efe Peter Oroh`, p.short)}
${MARKER}
${NAV('work')}
<main class="t-${p.tone}">
  <header class="p-head">
    <div class="wrap">
      <div>
        <a class="back" href="/#work">← All work</a>
        <h1>${esc(p.title)}</h1>
        <p class="lede">${esc(p.short)}</p>
        <span class="tag">${esc(p.tag)}</span>
      </div>
      ${p.thumb ? `<div class="mat"><img src="${esc(p.thumb)}" alt="${esc(p.title)}"></div>` : ''}
    </div>
  </header>

  <section class="section" style="padding-block:0 24px">
    <div class="wrap"><dl class="meta">${meta}</dl></div>
  </section>

  <section class="section">
    <div class="wrap two-col">
      <div><div class="kicker">Context</div><h2>Why it mattered</h2></div>
      <div class="prose">${p.context.map(c => `<p>${esc(c)}</p>`).join('')}</div>
    </div>
  </section>

  <section class="section" style="padding-top:8px">
    <div class="wrap">
      <div class="ask"><div class="kicker">The question</div><blockquote>${esc(p.question)}</blockquote>${subq}</div>
    </div>
  </section>

  <div class="band-sea" id="approach">
    ${WAVE('wave-top', '#e2f3f2')}
    <section class="section">
      <div class="wrap">
    ${slider(p.steps, { id: 'solution', title: 'How I solved it', kicker: 'Approach' })}
      </div>
    </section>
    ${WAVE('wave-bottom', '#e2f3f2')}
  </div>

  <section class="section" style="padding-top:88px">
    <div class="wrap">
      <div class="section-head"><div><div class="kicker">Outcome</div><h2>What it delivers</h2></div></div>
      <div class="outcome">${outcome}</div>
    </div>
  </section>

  <section class="section" style="padding-top:8px">
    <div class="wrap">
      ${demoSection(p)}
    </div>
  </section>

  <section class="section" style="padding-top:8px">
    <div class="wrap next">
      <a href="/work/${prev.slug}.html"><span class="nl">← Previous</span><b>${esc(prev.title)}</b></a>
      <a href="/work/${next.slug}.html" style="text-align:right"><span class="nl">Next →</span><b>${esc(next.title)}</b></a>
    </div>
  </section>
</main>
${FOOTER}`;
}

// ---------------------------------------------------------------- about
function renderAbout() {
  return `${HEAD('About me | Efe Peter Oroh', 'Efe Peter Oroh builds governed data pipelines and Power BI solutions, applied as a data analyst in economics.')}
${NAV('about')}
<main>
  <section class="section about-hero" style="padding-top:48px">
    <div class="wrap split">
      <div>
        <div class="kicker">About</div>
        <h1>About me</h1>
        <div class="prose" style="margin-top:22px">
          <p>I build data pipelines and data infrastructure that bring data from multiple sources together into scalable, efficient formats, ready for semantic modelling and fast-refreshing visualizations.</p>
          <p>I apply these skills as a Data Analyst: pulling data from public and internal APIs, modelling and governing it in Databricks or BigQuery, and serving it through Power BI dashboards and automated reports.</p>
        </div>
      </div>
      <figure class="headshot"><img src="/brand_assets/Headshot/headshot_about.jpg" alt="Efe Peter Oroh" width="560" height="700"></figure>
    </div>
    <div class="wrap">
      <div class="pillars">
        <div class="pillar t-ocean"><i></i><h3>Data engineering</h3><p>API ingestion, scheduled pipelines and dimensional models built to scale.</p></div>
        <div class="pillar t-jungle"><i></i><h3>Data governance</h3><p>Governed, documented tables in Databricks and BigQuery that teams can trust.</p></div>
        <div class="pillar t-sun"><i></i><h3>Power BI solutioning</h3><p>Semantic models, DAX and dashboards that refresh fast and read clearly.</p></div>
      </div>
    </div>
  </section>

  <section class="section" id="experience">
    <div class="wrap">
      <div class="section-head"><div><div class="kicker">Career</div><h2>Experience</h2></div></div>
      <div class="timeline">
        <div class="job">
          <div class="when">May 2024 to Present</div>
          <div>
            <h3>Data Analyst (Statistician)</h3>
            <div class="org">Government of Alberta · Edmonton, AB <span class="tags"><span>Databricks</span><span>Power BI</span><span>Python/SQL</span></span></div>
            <ul>
              <li>Migrated the Youth Labour Market Information Power BI dashboard from local Excel files to an automated Databricks pipeline, synthesising data from multiple sources including REST APIs into a medallion architecture with star schema gold tables hosted in Power BI, cutting each monthly refresh from roughly two days of manual updates to a scheduled run of under 10 minutes.</li>
              <li>Automated the monthly reporting pipeline for several economic reports using advanced R and agentic coding, reducing reporting time from one month to a single execution.</li>
            </ul>
          </div>
        </div>
        <div class="job">
          <div class="when">Jan 2024 to May 2024</div>
          <div>
            <h3>Junior Economist</h3>
            <div class="org">Government of Canada · Edmonton, AB <span class="tags"><span>Power BI</span><span>R</span><span>Python</span></span></div>
            <ul>
              <li>Built a Power BI dashboard offering real-time, web-scraped emission source mapping, ensuring 3 years of analytical value for the team.</li>
              <li>Spearheaded one of seven segments on a Prairie economy analysis with R for the CIIT binder to the Prime Minister.</li>
            </ul>
          </div>
        </div>
        <div class="job">
          <div class="when">May 2023 to Aug 2023</div>
          <div>
            <h3>Enterprise Sales Intern</h3>
            <div class="org">Microsoft · Lagos, Nigeria <span class="tags"><span>Python</span></span></div>
            <ul>
              <li>Analyzed Nigeria's top 4 banks, creating market trend visualizations used to support cybersecurity solution positioning for the sales team.</li>
              <li>Organized and hosted a high-impact 400+ attendee technology event addressing AI bias and ethical AI adoption, coordinating speakers and program delivery.</li>
            </ul>
          </div>
        </div>
        <div class="job">
          <div class="when">May 2022 to Aug 2022</div>
          <div>
            <h3>Data Science Intern</h3>
            <div class="org">Deloitte Consulting · Lagos, Nigeria <span class="tags"><span>R</span><span>Tableau</span><span>SQL</span></span></div>
            <ul>
              <li>Performed customer churn analysis for a $12.41 billion telecommunications company; automated data pipeline for 400k+ rows, reducing manual reporting time by 94%.</li>
              <li>Developed a machine learning churn forecasting model that exceeded churn risk identification goals by 10%.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="section-head"><div><div class="kicker">Beyond the work</div><h2>Outside the office</h2></div></div>
      <div class="personal">
        <div class="prose">
          <video autoplay loop muted playsinline preload="metadata" aria-label="Playing football">
            <source src="/brand_assets/Aboutme/football2.mov" type="video/mp4">
          </video>
          <p>Outside of work, I enjoy creating music, developing iOS applications and playing football.</p>
          <p>Playing the piano from an early age put creativity at the centre of how I see everything. I prioritize that creativity in the problems I solve at work, and outside of work I still find time to make a song here and there.</p>
          <p>Alongside music, I enjoy developing iOS applications, and Claude Code has been really helpful here, using agentic coding to build apps. It started with me trying to solve problems I face in my daily life, and it turned into a passion once I learned I was providing solutions that others found really valuable. It has also been a great way to learn agentic coding, which I now use in my workflows as a data analyst.</p>
          <p>Finally, alongside the things that stimulate my mind, I make sure I stay active. Football keeps me in shape and feeds my competitive spirit. It has also been great for building confidence in my ability: taking on a player on the wing requires you to believe you can beat your opponent, and I love that about the game.</p>
          <p>Overall, these three areas take up most of my time outside of work, and they have even shaped some of my perspectives as a data analyst.</p>
        </div>
        <div class="photo-col">
          <img src="/brand_assets/Aboutme/Ace.JPG" alt="Ace, my dog" loading="lazy">
          <div class="pair">
            <img src="/brand_assets/Aboutme/book.JPG" alt="Reading" loading="lazy">
            <img src="/brand_assets/Aboutme/piano.JPG" alt="Piano" loading="lazy">
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="resume" style="padding-top:8px">
    <div class="wrap">
      <div class="resume-card">
        <div><h3>Resume</h3><p>Education, experience and skills in one page.</p></div>
        <a href="/brand_assets/resume/EfeOroh_Resume.pdf" class="btn btn-solid" target="_blank" rel="noopener">Open resume</a>
      </div>
    </div>
  </section>
</main>
${FOOTER}`;
}

// ---------------------------------------------------------------- build
const all = [];
for (const p of PROJECTS) all.push({ ...p, ...(await assets(p)) });
const bySlug = Object.fromEntries(all.map(p => [p.slug, p]));
const featured = all.filter(p => p.featured);
const archive = ARCHIVE_ORDER.map(s => bySlug[s]);
const order = [...featured, ...archive];

await writeFile(join(__dirname, 'index.html'), renderHome(featured, archive), 'utf8');
await writeFile(join(__dirname, 'about.html'), renderAbout(), 'utf8');
await mkdir(join(__dirname, 'work'), { recursive: true });
for (let i = 0; i < order.length; i++) {
  const p = order[i];
  await writeFile(join(__dirname, 'work', `${p.slug}.html`), renderProject(p, order[(i - 1 + order.length) % order.length], order[(i + 1) % order.length]), 'utf8');
}
// Old category links point to the work section.
await mkdir(join(__dirname, 'projects'), { recursive: true });
for (const slug of ['dashboards', 'reports', 'research', 'automation', 'interactive', 'other']) {
  await writeFile(join(__dirname, 'projects', `${slug}.html`), `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0; url=/#work"><link rel="canonical" href="/"><title>Efe Peter Oroh</title></head><body><a href="/#work">Go to work</a></body></html>\n`, 'utf8');
}
console.log(`Built index.html, about.html and ${order.length} project pages.`);
