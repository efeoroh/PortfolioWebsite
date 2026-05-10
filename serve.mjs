import { createServer } from 'http';
import { readFile, readdir, access } from 'fs/promises';
import { extname, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const PROJECTS_BASE = join(__dirname, 'brand_assets', 'Projects');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.pdf': 'application/pdf', '.mp4': 'video/mp4',
  '.mov': 'video/mp4', '.webp': 'image/webp', '.txt': 'text/plain', '.avif': 'image/avif',
};

const CATEGORIES = {
  'labor-economics':       { folder: 'labor_economics',      title: 'Labor Economics',         num: '01', desc: 'Research and analysis on labor market dynamics, workforce supply and demand, participation rates, and employment patterns across industries and regions.' },
  'energy-analytics':      { folder: 'Energy_Analytics',     title: 'Energy Analytics',         num: '02', desc: 'Quantitative analysis of Canadian crude oil markets, electricity generation, energy infrastructure, and the policy forces shaping the sector\'s energy transition.' },
  'automation':            { folder: 'Automation',           title: 'Automation',               num: '03', desc: 'Python pipelines, data extraction tools, and automated reporting workflows that make data collection scalable and analysis fully reproducible.' },
  'emergency-analytics':   { folder: 'Emergency_Analytics',  title: 'Emergency Analytics',      num: '04', desc: 'Data analysis and visualization supporting emergency preparedness planning, road safety intelligence, and public safety resource allocation decisions.' },
  'game-analytics':        { folder: 'Game_Analytics',       title: 'Game Analytics',           num: '05', desc: 'Data-driven exploration of player performance, game mechanics, and market dynamics in gaming and sports datasets.' },
  'real-estate-analytics': { folder: 'RealEstate_Analytics', title: 'Real Estate Analytics',    num: '06', desc: 'Market analysis of housing prices, Airbnb economics, and property portfolio performance across Canadian cities.' },
  'other':                 { folder: 'other',                title: 'Other',                    num: '07', desc: 'Miscellaneous analytical and visualization work spanning music, consumer data, and other domains.' },
};

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function encPath(raw) {
  return raw.split('/').map(s => encodeURIComponent(s)).join('/');
}
function demoLabel(demoPath, isExt) {
  if (!demoPath) return null;
  if (isExt) return 'View Live';
  const ext = demoPath.split('.').pop().toLowerCase().split('?')[0];
  if (ext === 'mp4' || ext === 'mov') return 'Watch Demo';
  if (ext === 'pdf') return 'View Report';
  if (ext === 'html') return 'View Project';
  if (['jpg','jpeg','png','gif','avif'].includes(ext)) return 'View Image';
  return 'View Demo';
}

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function readProject(projPath, dirName, catFolder) {
  let desc = '', thumb = null, demo = null, demoExt = false;

  try { desc = (await readFile(join(projPath, 'description', 'description.txt'), 'utf8')).trim(); } catch {}

  try {
    const ref = (await readFile(join(projPath, 'thumbnail', 'ref.txt'), 'utf8')).trim();
    thumb = '/' + encPath(ref);
  } catch {
    try {
      const files = await readdir(join(projPath, 'thumbnail'));
      const img = files.find(f => /\.(png|jpg|jpeg|gif|webp|avif)$/i.test(f));
      if (img) thumb = '/' + encPath(`brand_assets/Projects/${catFolder}/${dirName}/thumbnail/${img}`);
    } catch {}
  }

  try {
    const url = (await readFile(join(projPath, 'demo', 'url.txt'), 'utf8')).trim();
    demo = url; demoExt = true;
  } catch {
    try {
      const ref = (await readFile(join(projPath, 'demo', 'ref.txt'), 'utf8')).trim();
      demo = '/' + encPath(ref);
    } catch {}
  }

  let title = dirName
    .replace(/^\d+_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\bCrm\b/g, 'CRM')
    .replace(/\bFc(\d)/g, 'FC$1')
    .replace(/\bFc\b/g, 'FC')
    .replace(/\bVs\b/g, 'vs')
    .replace(/\bDota(\d)/g, 'Dota $1');
  try { title = (await readFile(join(projPath, 'title.txt'), 'utf8')).trim(); } catch {}

  let keyword = '';
  try { keyword = (await readFile(join(projPath, 'keyword.txt'), 'utf8')).trim(); } catch {}

  return { title, desc, thumb, demo, demoExt, keyword };
}

async function loadProjects(catFolder) {
  try {
    const catDir = join(PROJECTS_BASE, catFolder);
    const entries = await readdir(catDir, { withFileTypes: true });
    const dirs = [];
    for (const e of entries) {
      if (!e.isDirectory() || e.name.startsWith('.')) continue;
      // Only include dirs that have the description/ subfolder (our structured format)
      if (e.name.match(/^\d/) && await exists(join(catDir, e.name, 'description'))) {
        dirs.push(e);
      }
    }
    dirs.sort((a, b) => {
      const na = parseInt(a.name.match(/^(\d+)/)?.[1] ?? '999');
      const nb = parseInt(b.name.match(/^(\d+)/)?.[1] ?? '999');
      return na - nb || a.name.localeCompare(b.name);
    });
    return await Promise.all(dirs.map(e => readProject(join(catDir, e.name), e.name, catFolder)));
  } catch { return []; }
}

const NAV = (active) => `<nav class="site-nav" role="navigation">
  <div class="nav-inner">
    <a href="/" class="nav-brand">Efe Peter Oroh</a>
    <div class="nav-links" id="navLinks">
      <a href="/"${active==='home'?' class="active"':''}>Home</a>
      <a href="/#projects"${active==='projects'?' class="active"':''}>Projects</a>
      <a href="/about.html"${active==='about'?' class="active"':''}>About</a>
      <a href="/about.html#resume" class="nav-cta">Resume</a>
    </div>
    <button class="nav-mobile-toggle" aria-label="Toggle menu" aria-expanded="false"
      onclick="const m=document.getElementById('navLinks');const o=m.classList.toggle('open');this.setAttribute('aria-expanded',o);">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    </button>
  </div>
</nav>`;

const FOOTER = `<footer class="site-footer" role="contentinfo">
  <div class="footer-inner">
    <div><div class="footer-name">Efe Peter Oroh</div><div class="footer-tagline">Economist · Data Scientist</div></div>
    <nav class="footer-links">
      <a href="mailto:efeogheneoroh@gmail.com"><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1 3.5l6 4 6-4M2 12h11a1 1 0 001-1V4a1 1 0 00-1-1H2a1 1 0 00-1 1v7a1 1 0 001 1z" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>Email</a>
      <a href="https://www.linkedin.com/in/efe-oroh/" target="_blank" rel="noopener noreferrer"><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor" stroke-width="1.1"/><path d="M4 6.5V11M4 4v.01M7 6.5V11M7 8.5C7 7.5 7.75 6.5 9 6.5S11 7.5 11 8.5V11" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>LinkedIn</a>
      <a href="https://efeoroh.github.io/" target="_blank" rel="noopener noreferrer"><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1a6.5 6.5 0 00-2.055 12.668c.325.06.443-.14.443-.312v-1.094c-1.803.392-2.183-.87-2.183-.87-.295-.748-.72-.948-.72-.948-.588-.402.045-.394.045-.394.65.046.992.668.992.668.577.99 1.514.703 1.882.537.059-.417.226-.703.411-.864-1.44-.163-2.952-.72-2.952-3.204 0-.708.252-1.286.668-1.739-.067-.163-.29-.823.063-1.715 0 0 .545-.174 1.783.664a6.2 6.2 0 013.248 0c1.238-.838 1.782-.664 1.782-.664.354.892.13 1.552.064 1.715.416.453.667 1.031.667 1.739 0 2.49-1.515 3.04-2.958 3.2.233.2.44.598.44 1.205v1.787c0 .173.118.375.447.311A6.501 6.501 0 007.5 1z" stroke="currentColor" stroke-width="1.1"/></svg>GitHub</a>
    </nav>
  </div>
  <hr class="footer-divider">
  <p class="footer-copy">© 2026 Efe Peter Oroh. All rights reserved.</p>
</footer>`;

function renderCard(proj) {
  const thumb = proj.thumb || 'https://placehold.co/640x360/F0EDE6/8A827C?text=Preview';
  const label = demoLabel(proj.demo, proj.demoExt);
  const target = ' target="_blank" rel="noopener noreferrer"';
  return `<div class="project-item-card">
  <div style="overflow:hidden;width:100%;aspect-ratio:16/9;position:relative;">
    <img style="width:100%;height:100%;object-fit:cover;object-position:top;display:block;" src="${esc(thumb)}" alt="${esc(proj.title)}" loading="lazy" onerror="this.src='https://placehold.co/640x360/F0EDE6/8A827C?text=Preview+Unavailable'">
  </div>
  <div class="pic-body">
    <h2 class="pic-title">${esc(proj.title)}</h2>
    <p class="pic-desc">${esc(proj.desc || 'Description coming soon.')}</p>
    ${proj.keyword ? `<p style="font-size:0.6875rem;font-weight:700;color:#C19A3E;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:0.75rem;">${esc(proj.keyword)}</p>` : ''}
    ${proj.demo && label ? `<a href="${esc(proj.demo)}" class="pic-link"${target}>${esc(label)} →</a>` : '<span class="pic-link coming-soon">Coming Soon</span>'}
  </div>
</div>`;
}

function renderPage(cat, projects) {
  const cards = projects.length
    ? projects.map(renderCard).join('\n')
    : '<p style="color:#6B6460;padding:1rem 0;font-size:1rem;">No projects yet — check back soon.</p>';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(cat.title)} — Efe Peter Oroh</title>
<meta name="description" content="${esc(cat.desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<script src="https://cdn.tailwindcss.com"><\/script>
<link rel="stylesheet" href="/css/styles.css">
</head>
<body>
${NAV('projects')}
<div class="page-header">
  <div class="page-header-inner">
    <a href="/" class="page-header-back"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8.5 2L3.5 7l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> All Projects</a>
    <span class="section-label">${esc(cat.num)} · ${esc(cat.title)}</span>
    <h1 class="page-header-title">${esc(cat.title)}</h1>
    <p class="page-header-desc">${esc(cat.desc)}</p>
  </div>
</div>
<section class="section">
  <div class="section-inner">
    <div class="project-items-grid">${cards}</div>
  </div>
</section>
${FOOTER}
</body></html>`;
}

createServer(async (req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);

  const catMatch = url.match(/^\/projects\/([a-z0-9-]+)(?:\.html)?$/);
  if (catMatch && CATEGORIES[catMatch[1]]) {
    const cat = CATEGORIES[catMatch[1]];
    try {
      const projects = await loadProjects(cat.folder);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(renderPage(cat, projects));
    } catch(e) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error: ' + e.message);
    }
    return;
  }

  if (url === '/') url = '/index.html';
  if (!extname(url)) url += '.html';
  const filePath = join(__dirname, url);
  const ext = extname(filePath).toLowerCase();
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 – Not Found');
  }
}).listen(PORT, () => console.log(`\n  Portfolio → http://localhost:${PORT}\n`));
