#!/usr/bin/env node
/*
 * Globe Stacks static site builder.
 * No dependencies: only Node's built-in modules.
 * Run:  node build.js   (output goes to ./dist)
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.json'), 'utf8'));
const BUILD_ID = String(Date.now());

/* ---------- small helpers ---------- */
const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function writeFile(rel, content) {
  const full = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function formatDate(iso) {
  if (!iso) return '';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return String(iso);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${parseInt(m[3], 10)} ${months[parseInt(m[2], 10) - 1]} ${m[1]}`;
}

/* ---------- front matter (small YAML subset) ---------- */
function unquote(v) {
  v = v.trim();
  if (v.length >= 2 && v[0] === '"' && v[v.length - 1] === '"') {
    try { return JSON.parse(v); } catch (e) { return v.slice(1, -1); }
  }
  if (v.length >= 2 && v[0] === "'" && v[v.length - 1] === "'") {
    return v.slice(1, -1).replace(/''/g, "'");
  }
  return v;
}

function parseFront(src) {
  src = src.replace(/\r\n/g, '\n');
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: src };
  const lines = m[1].split('\n');
  const data = {};
  for (let i = 0; i < lines.length; i++) {
    const km = lines[i].match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!km) continue;
    const key = km[1];
    let val = km[2];
    const cont = [];
    while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) {
      cont.push(lines[i + 1].trim());
      i++;
    }
    if (/^[>|][+-]?$/.test(val.trim())) {
      val = cont.join(val.trim()[0] === '|' ? '\n' : ' ');
    } else {
      val = unquote([val].concat(cont).join(' '));
    }
    if (val === 'true') val = true;
    else if (val === 'false') val = false;
    data[key] = val;
  }
  return { data, body: m[2] };
}

/* ---------- markdown (small, safe subset) ---------- */
function inline(text) {
  const tokens = [];
  const put = (html) => {
    tokens.push(html);
    return '\u0000' + (tokens.length - 1) + '\u0000';
  };
  // code spans
  text = text.replace(/`([^`]+)`/g, (_, c) => put('<code>' + esc(c) + '</code>'));
  text = esc(text);
  // images
  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) =>
    put(`<img src="${src}" alt="${alt}" loading="lazy">`)
  );
  // links
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const ext = /^https?:\/\//.test(href);
    return put(`<a href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`);
  });
  // <https://...> and bare URLs
  text = text.replace(/&lt;(https?:\/\/[^\s&]+)&gt;/g, (_, u) =>
    put(`<a href="${u}" target="_blank" rel="noopener">${u}</a>`)
  );
  text = text.replace(/(^|[\s(])(https?:\/\/[^\s<)]+[^\s<).,;:!?])/g, (_, pre, u) =>
    pre + put(`<a href="${u}" target="_blank" rel="noopener">${u}</a>`)
  );
  // emphasis
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(^|[^*\w])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  text = text.replace(/(^|[^\w])_([^_\s][^_]*)_(?!\w)/g, '$1<em>$2</em>');
  // restore tokens (may be nested once)
  for (let pass = 0; pass < 2; pass++) {
    text = text.replace(/\u0000(\d+)\u0000/g, (_, n) => tokens[Number(n)]);
  }
  return text;
}

function renderList(items) {
  // items: [{indent, ordered, text}] -> nested html
  let html = '';
  let i = 0;
  function build(baseIndent) {
    const ordered = items[i].ordered;
    let out = ordered ? '<ol>' : '<ul>';
    while (i < items.length && items[i].indent >= baseIndent) {
      if (items[i].indent > baseIndent) {
        // nested list belongs to previous li; handled by recursion below
        break;
      }
      let li = '<li>' + inline(items[i].text.replace(/^\[ \]\s+/, '\u2610 ').replace(/^\[[xX]\]\s+/, '\u2611 '));
      i++;
      if (i < items.length && items[i].indent > baseIndent) {
        li += build(items[i].indent);
      }
      li += '</li>';
      out += li;
    }
    out += ordered ? '</ol>' : '</ul>';
    return out;
  }
  while (i < items.length) html += build(items[i].indent);
  return html;
}

function md(src) {
  src = src.replace(/\r\n/g, '\n');
  const lines = src.split('\n');
  const out = [];
  let i = 0;
  const isBlank = (l) => /^\s*$/.test(l);
  const listRe = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;

  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) { i++; continue; }

    // fenced code
    if (/^```/.test(line)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push('<pre><code>' + esc(buf.join('\n')) + '</code></pre>');
      continue;
    }
    // heading
    let hm = line.match(/^(#{1,4})\s+(.*?)\s*#*\s*$/);
    if (hm) {
      const level = Math.min(hm[1].length + 1, 5);
      const text = hm[2];
      out.push(`<h${level} id="${slugify(text)}">${inline(text)}</h${level}>`);
      i++;
      continue;
    }
    // hr
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { out.push('<hr>'); i++; continue; }
    // blockquote
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      out.push('<blockquote class="note">' + md(buf.join('\n')) + '</blockquote>');
      continue;
    }
    // table
    if (/^\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(lines[i + 1])) {
      const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) rows.push(cells(lines[i++]));
      out.push(
        '<div class="table-wrap"><table><thead><tr>' +
          head.map((c) => `<th>${inline(c)}</th>`).join('') +
          '</tr></thead><tbody>' +
          rows.map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') +
          '</tbody></table></div>'
      );
      continue;
    }
    // list
    if (listRe.test(line)) {
      const items = [];
      while (i < lines.length) {
        const lm = lines[i].match(listRe);
        if (lm) {
          items.push({ indent: Math.floor(lm[1].replace(/\t/g, '  ').length / 2), ordered: /\d/.test(lm[2]), text: lm[3] });
          i++;
        } else if (!isBlank(lines[i]) && /^\s{2,}\S/.test(lines[i]) && items.length) {
          items[items.length - 1].text += ' ' + lines[i].trim();
          i++;
        } else if (isBlank(lines[i]) && i + 1 < lines.length && listRe.test(lines[i + 1])) {
          i++;
        } else break;
      }
      out.push(renderList(items));
      continue;
    }
    // paragraph
    const buf = [];
    while (
      i < lines.length &&
      !isBlank(lines[i]) &&
      !/^(#{1,4}\s|```|>\s?|(-{3,}|\*{3,}|_{3,})\s*$)/.test(lines[i]) &&
      !listRe.test(lines[i])
    ) {
      buf.push(lines[i++]);
    }
    out.push('<p>' + inline(buf.join(' ')) + '</p>');
  }
  return out.join('\n');
}

/* ---------- content loading ---------- */
function loadCollection(dir) {
  const full = path.join(ROOT, 'content', dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const { data, body } = parseFront(fs.readFileSync(path.join(full, f), 'utf8'));
      const slug = slugify(data.slug || f.replace(/\.md$/, ''));
      return { ...data, slug, body, html: md(body), words: body.split(/\s+/).filter(Boolean).length };
    });
}

const FUNDING = {
  Full: { label: 'Fully funded', level: 3 },
  Partial: { label: 'Partly funded', level: 2 },
  Loan: { label: 'Student loan', level: 1 },
};
const STATUS = {
  open: ['Open now', 'ok'],
  upcoming: ['Opens soon', 'soon'],
  closed: ['Closed for now', 'closed'],
  check: ['Check dates', 'check'],
};
const fundingInfo = (f) => FUNDING[f] || { label: f || 'Funding varies', level: 1 };
const statusInfo = (s) => STATUS[s] || STATUS.check;

/* ---------- shared fragments ---------- */
function meter(level) {
  const slab = (c, i) =>
    `<path class="${i < level ? 'on' : 'off'}" d="M12 ${c - 4} L22 ${c} L12 ${c + 4} L2 ${c} Z"/>`;
  return `<svg class="meter" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">${slab(19, 0)}${slab(13, 1)}${slab(7, 2)}</svg>`;
}

function markSvg(cls = 'mark', size = 36) {
  return `<svg class="${cls}" viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true" focusable="false">
<path class="s1" d="M32 46 L58 54 L32 62 L6 54 Z"/>
<path class="s2" d="M32 38 L58 46 L32 54 L6 46 Z"/>
<path class="s3" d="M32 30 L58 38 L32 46 L6 38 Z"/>
<circle class="g" cx="32" cy="20" r="16"/>
<ellipse class="gl" cx="32" cy="20" rx="7" ry="16" fill="none"/>
<path class="gl" d="M17.2 14 H46.8 M16 20 H48 M17.2 26 H46.8" fill="none"/>
</svg>`;
}

function waLink(text) {
  return `https://wa.me/${site.whatsapp}${text ? '?text=' + encodeURIComponent(text) : ''}`;
}

function shareLink(title, urlPath) {
  return `https://wa.me/?text=${encodeURIComponent(title + ' ' + site.url + urlPath)}`;
}

function scholarshipItem(s) {
  const f = fundingInfo(s.funding);
  const [stLabel, stCls] = statusInfo(s.status);
  const hay = [s.title, s.country, s.level, s.summary, f.label].join(' ').toLowerCase();
  return `<article class="row" data-item data-country="${esc(s.country)}" data-funding="${esc(s.funding)}" data-status="${esc(s.status)}" data-hay="${esc(hay)}">
  <div class="row-meter" title="${esc(f.label)}">${meter(f.level)}<span>${esc(f.label)}</span></div>
  <div class="row-main">
    <h3><a href="/scholarships/${s.slug}/">${esc(s.title)}</a></h3>
    <p class="row-meta"><span>${esc(s.country)}</span><span>${esc(s.level)}</span><span class="badge ${stCls}">${stLabel}</span></p>
    <p>${esc(s.summary)}</p>
    ${s.deadline ? `<p class="row-deadline"><strong>Dates:</strong> ${esc(s.deadline)}</p>` : ''}
  </div>
</article>`;
}

function layout({ title, desc, urlPath, body, noindex, active }) {
  const fullTitle = urlPath === '/' ? `${site.name}: ${site.tagline}` : `${title} | ${site.name}`;
  const nav = [
    ['/scholarships/', 'Scholarships'],
    ['/guides/', 'Guides'],
    ['/about/', 'About'],
  ];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc || site.description)}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<link rel="canonical" href="${site.url}${urlPath}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc || site.description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${site.url}${urlPath}">
<meta property="og:image" content="${site.url}/icons/icon-512.png">
<meta name="theme-color" content="#0A2540">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<script>try{var t=localStorage.getItem('gs-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>
<link rel="stylesheet" href="/css/style.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap header-in">
    <a class="brand" href="/" aria-label="${esc(site.name)} home">${markSvg('mark', 34)}<span>${esc(site.name)}</span></a>
    <div class="tools">
      <button class="btn-quiet" id="install" type="button" hidden>Install app</button>
      <button class="btn-quiet" id="theme" type="button" aria-label="Switch colour theme">Dark mode</button>
    </div>
    <nav class="nav" aria-label="Main">
      ${nav.map(([h, l]) => `<a href="${h}"${active === h ? ' aria-current="page"' : ''}>${l}</a>`).join('')}
    </nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="wrap foot-grid">
    <div>
      <a class="brand brand-foot" href="/">${markSvg('mark', 30)}<span>${esc(site.name)}</span></a>
      <p>${esc(site.tagline)}. We share information. We are not a scholarship agency and we never ask for money. Always confirm details on the official website before you apply.</p>
    </div>
    <div>
      <h2 class="foot-h">Explore</h2>
      <ul class="plain">
        <li><a href="/scholarships/">Scholarships</a></li>
        <li><a href="/guides/">Guides</a></li>
        <li><a href="/about/">About</a></li>
        <li><a href="/contact/">Contact</a></li>
      </ul>
    </div>
    <div>
      <h2 class="foot-h">Get in touch</h2>
      <ul class="plain">
        <li><a href="mailto:${site.email}">${esc(site.email)}</a></li>
        <li><a href="${waLink('')}" target="_blank" rel="noopener">WhatsApp ${esc(site.whatsappDisplay)}</a></li>
        <li><a href="/privacy/">Privacy</a></li>
        <li><a href="/disclaimer/">Disclaimer</a></li>
      </ul>
    </div>
  </div>
  <div class="wrap foot-base"><p>&copy; ${new Date().getFullYear()} ${esc(site.name)}</p></div>
</footer>
<script src="/js/app.js" defer></script>
</body>
</html>`;
}

/* ---------- build ---------- */
const pages = []; // { url, priority }
function addPage(urlPath, html, priority = 0.6) {
  const rel = urlPath === '/' ? 'index.html' : path.join(urlPath.replace(/^\//, ''), 'index.html');
  writeFile(rel, html);
  pages.push({ url: urlPath, priority });
}

function build() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  copyDir(path.join(ROOT, 'static'), DIST);

  const guides = loadCollection('guides').sort((a, b) => Number(a.order || 99) - Number(b.order || 99));
  const scholarships = loadCollection('scholarships').sort((a, b) => {
    const rank = { open: 0, upcoming: 1, check: 2, closed: 3 };
    return (rank[a.status] ?? 2) - (rank[b.status] ?? 2) || String(a.title).localeCompare(String(b.title));
  });
  const staticPages = loadCollection('pages');

  /* Home */
  const featured = scholarships.filter((s) => s.featured).slice(0, 4);
  const homeBody = `
<section class="hero">
  <div class="wrap hero-in">
    <div class="hero-copy">
      <h1>Win a scholarship without paying an agent.</h1>
      <p class="lead">Free, step-by-step guides on scholarships, personal statements, passports and visas, written for African students who are finishing school.</p>
      <form class="hero-search" action="/scholarships/" method="get" role="search">
        <label for="hq" class="vh">Search scholarships by name or country</label>
        <input id="hq" name="q" type="search" placeholder="Try &ldquo;Japan&rdquo; or &ldquo;fully funded&rdquo;" autocomplete="off">
        <button class="btn" type="submit">Search</button>
      </form>
      <p class="hero-links"><a class="btn btn-ghost" href="/guides/">Start with the guides</a><a class="btn btn-ghost" href="/scholarships/">Browse all scholarships</a></p>
    </div>
    <div class="hero-art" aria-hidden="true">
      <svg viewBox="0 0 420 390" role="img" focusable="false">
        <g class="slab sl-loan"><path class="face-l" d="M60 330 L210 370 L210 386 L60 346 Z"/><path class="face-r" d="M360 330 L210 370 L210 386 L360 346 Z"/><path class="top" d="M210 290 L360 330 L210 370 L60 330 Z"/></g>
        <g class="slab sl-part"><path class="face-l" d="M60 290 L210 330 L210 346 L60 306 Z"/><path class="face-r" d="M360 290 L210 330 L210 346 L360 306 Z"/><path class="top" d="M210 250 L360 290 L210 330 L60 290 Z"/></g>
        <g class="slab sl-full"><path class="face-l" d="M60 250 L210 290 L210 306 L60 266 Z"/><path class="face-r" d="M360 250 L210 290 L210 306 L360 266 Z"/><path class="top" d="M210 210 L360 250 L210 290 L60 250 Z"/></g>
        <g class="globe"><circle cx="210" cy="140" r="84"/><ellipse cx="210" cy="140" rx="36" ry="84"/><path d="M210 56 V224 M126 140 H294 M137 98 H283 M137 182 H283"/></g>
      </svg>
    </div>
  </div>
</section>
<section class="legend-strip" aria-label="How to read the stacks">
  <div class="wrap legend">
    <span class="legend-title">Reading the stacks</span>
    <span class="legend-item">${meter(3)} Fully funded</span>
    <span class="legend-item">${meter(2)} Partly funded</span>
    <span class="legend-item">${meter(1)} Student loan</span>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <h2>Your path, step by step</h2>
    <p class="section-lead">New to scholarships? Read these in order. Each guide is short and plain.</p>
    <ol class="path">
      ${guides
        .map(
          (g) => `<li><a href="/guides/${g.slug}/"><span class="path-title">${esc(g.title)}</span><span class="path-sum">${esc(g.summary)}</span></a></li>`
        )
        .join('\n')}
    </ol>
  </div>
</section>

<section class="section section-tint">
  <div class="wrap">
    <h2>Scholarships to look at now</h2>
    <p class="section-lead">Each one links to the official page and shows the date we last checked it.</p>
    <div class="rows">
      ${featured.map(scholarshipItem).join('\n')}
    </div>
    <p class="more"><a class="btn" href="/scholarships/">See all scholarships</a></p>
  </div>
</section>

<section class="section">
  <div class="wrap promise">
    <h2>What you can expect from us</h2>
    <dl>
      <dt>It is free.</dt><dd>No sign-up, no fees. If anyone asks you to pay to &ldquo;secure&rdquo; a scholarship, walk away.</dd>
      <dt>It is checked.</dt><dd>We read the official pages ourselves and show the date each page was last checked.</dd>
      <dt>It is honest.</dt><dd>Fully funded places are competitive. We tell you the odds, and we list partly funded options and loans too.</dd>
    </dl>
  </div>
</section>

<section class="section cta">
  <div class="wrap cta-in">
    <div>
      <h2>Questions, or a scholarship to suggest?</h2>
      <p>Message us on WhatsApp and we will reply as soon as we can.</p>
    </div>
    <a class="btn btn-wa" href="${waLink('Hello Globe Stacks, ')}" target="_blank" rel="noopener">Message us on WhatsApp</a>
  </div>
  ${
    site.newsletterUrl
      ? `<div class="wrap cta-in cta-news"><div><h2>Get new scholarships by email</h2><p>One short email when something important opens.</p></div><a class="btn" href="${esc(site.newsletterUrl)}" target="_blank" rel="noopener">Join the email list</a></div>`
      : ''
  }
</section>`;
  addPage('/', layout({ title: site.name, desc: site.description, urlPath: '/', body: homeBody }), 1.0);

  /* Scholarships index */
  const countries = [...new Set(scholarships.map((s) => s.country))].sort();
  const fundingsPresent = ['Full', 'Partial', 'Loan'].filter((f) => scholarships.some((s) => s.funding === f));
  const statusesPresent = ['open', 'upcoming', 'check', 'closed'].filter((s) => scholarships.some((x) => x.status === s));
  const schBody = `
<section class="page-head"><div class="wrap">
  <h1>Scholarships</h1>
  <p class="lead">Undergraduate funding for African students. Always open the official link and read the rules yourself before you apply.</p>
</div></section>
<section class="section"><div class="wrap">
  <form id="filters" class="filters" role="search" autocomplete="off">
    <div class="field field-wide"><label for="q">Search</label><input id="q" name="q" type="search" placeholder="Name, country or keyword"></div>
    <div class="field"><label for="country">Country</label><select id="country" name="country"><option value="">All countries</option>${countries.map((c) => `<option>${esc(c)}</option>`).join('')}</select></div>
    <div class="field"><label for="funding">Funding</label><select id="funding" name="funding"><option value="">All types</option>${fundingsPresent.map((f) => `<option value="${f}">${fundingInfo(f).label}</option>`).join('')}</select></div>
    <div class="field"><label for="status">Status</label><select id="status" name="status"><option value="">Any status</option>${statusesPresent.map((s) => `<option value="${s}">${statusInfo(s)[0]}</option>`).join('')}</select></div>
    <div class="field field-btn"><button class="btn btn-ghost" type="reset" id="clear">Clear</button></div>
  </form>
  <p id="count" class="count" aria-live="polite"></p>
  <div class="rows" id="list">
    ${scholarships.map(scholarshipItem).join('\n')}
  </div>
  <p id="none" class="empty" hidden>No scholarships match. Clear the filters, or <a href="${waLink('Hello Globe Stacks, please add this scholarship: ')}" target="_blank" rel="noopener">tell us on WhatsApp</a> which one you are looking for.</p>
</div></section>`;
  addPage('/scholarships/', layout({ title: 'Scholarships', desc: 'Verified undergraduate scholarships and funding for African students, with deadlines, eligibility and official links.', urlPath: '/scholarships/', body: schBody, active: '/scholarships/' }), 0.9);

  /* Scholarship pages */
  for (const s of scholarships) {
    const f = fundingInfo(s.funding);
    const [stLabel, stCls] = statusInfo(s.status);
    const urlPath = `/scholarships/${s.slug}/`;
    const facts = [
      ['Country', s.country],
      ['Funding', `<span class="inline-meter">${meter(f.level)} ${esc(f.label)}</span>`, true],
      ['Level', s.level],
      ['Status', `<span class="badge ${stCls}">${stLabel}</span>`, true],
      ['Dates', s.deadline],
      ['Who can apply', s.who],
      ['What it covers', s.covers],
    ].filter((r) => r[1]);
    const body = `
<article>
<section class="page-head"><div class="wrap narrow">
  <p class="crumbs"><a href="/scholarships/">Scholarships</a></p>
  <h1>${esc(s.title)}</h1>
  <p class="lead">${esc(s.summary)}</p>
</div></section>
<section class="section"><div class="wrap narrow">
  <dl class="facts">
    ${facts.map(([k, v, raw]) => `<div><dt>${k}</dt><dd>${raw ? v : esc(v)}</dd></div>`).join('\n')}
  </dl>
  <p class="actions">
    ${s.official_link ? `<a class="btn" href="${esc(s.official_link)}" target="_blank" rel="noopener">Open the official page</a>` : ''}
    <a class="btn btn-ghost" href="${shareLink(s.title + ' (scholarship)', urlPath)}" target="_blank" rel="noopener">Share on WhatsApp</a>
  </p>
  ${s.verified ? `<p class="verified">Last checked against official sources on ${formatDate(s.verified)}. Dates and rules change, so confirm on the official page.</p>` : ''}
  <div class="prose">${s.html}</div>
  <p class="back"><a href="/scholarships/">All scholarships</a> &middot; <a href="/guides/how-scholarships-work-and-how-to-spot-scams/">How to spot scams</a></p>
</div></section>
</article>`;
    addPage(urlPath, layout({ title: s.title, desc: s.summary, urlPath, body, active: '/scholarships/' }), 0.8);
  }

  /* Guides index */
  const cats = site.guideCategories.concat(
    [...new Set(guides.map((g) => g.category))].filter((c) => c && !site.guideCategories.includes(c))
  );
  const guideBody = `
<section class="page-head"><div class="wrap">
  <h1>Guides</h1>
  <p class="lead">Everything you need to prepare, in plain language. Do them in order the first time.</p>
</div></section>
<section class="section"><div class="wrap">
  ${cats
    .map((c) => {
      const list = guides.filter((g) => g.category === c);
      if (!list.length) return '';
      return `<h2 class="cat">${esc(c)}</h2>
    <ol class="path path-wide" start="${guides.indexOf(list[0]) + 1}">
      ${list
        .map(
          (g) => `<li><a href="/guides/${g.slug}/"><span class="path-title">${esc(g.title)}</span><span class="path-sum">${esc(g.summary)}</span><span class="path-meta">${Math.max(1, Math.round(g.words / 200))} min read</span></a></li>`
        )
        .join('\n')}
    </ol>`;
    })
    .join('\n')}
</div></section>`;
  addPage('/guides/', layout({ title: 'Guides', desc: 'Free step-by-step guides on scholarships, personal statements, recommendation letters, passports and student visas.', urlPath: '/guides/', body: guideBody, active: '/guides/' }), 0.9);

  /* Guide pages */
  guides.forEach((g, idx) => {
    const urlPath = `/guides/${g.slug}/`;
    const next = guides[idx + 1];
    const prev = guides[idx - 1];
    const body = `
<article>
<section class="page-head"><div class="wrap narrow">
  <p class="crumbs"><a href="/guides/">Guides</a> &middot; ${esc(g.category || '')}</p>
  <h1>${esc(g.title)}</h1>
  <p class="lead">${esc(g.summary)}</p>
  <p class="byline">${Math.max(1, Math.round(g.words / 200))} min read${g.verified ? ` &middot; Last checked ${formatDate(g.verified)}` : ''}</p>
</div></section>
<section class="section"><div class="wrap narrow">
  <div class="prose">${g.html}</div>
  <p class="actions"><a class="btn btn-ghost" href="${shareLink(g.title, urlPath)}" target="_blank" rel="noopener">Share on WhatsApp</a></p>
  <nav class="pager" aria-label="More guides">
    ${prev ? `<a href="/guides/${prev.slug}/"><span class="pager-dir">Previous</span><span>${esc(prev.title)}</span></a>` : '<span></span>'}
    ${next ? `<a class="pager-next" href="/guides/${next.slug}/"><span class="pager-dir">Next</span><span>${esc(next.title)}</span></a>` : '<span></span>'}
  </nav>
</div></section>
</article>`;
    addPage(urlPath, layout({ title: g.title, desc: g.summary, urlPath, body, active: '/guides/' }), 0.8);
  });

  /* Static pages (about, contact, privacy, disclaimer) */
  for (const p of staticPages) {
    const urlPath = `/${p.slug}/`;
    let extra = '';
    if (p.slug === 'contact') {
      extra = `<p class="actions"><a class="btn" href="mailto:${site.email}">Email ${esc(site.email)}</a><a class="btn btn-wa" href="${waLink('Hello Globe Stacks, ')}" target="_blank" rel="noopener">WhatsApp ${esc(site.whatsappDisplay)}</a></p>`;
    }
    const body = `
<section class="page-head"><div class="wrap narrow"><h1>${esc(p.title)}</h1>${p.summary ? `<p class="lead">${esc(p.summary)}</p>` : ''}</div></section>
<section class="section"><div class="wrap narrow">${extra}<div class="prose">${p.html}</div></div></section>`;
    addPage(urlPath, layout({ title: p.title, desc: p.summary, urlPath, body }), 0.4);
  }

  /* Offline + 404 */
  writeFile(
    'offline/index.html',
    layout({
      title: 'You are offline',
      urlPath: '/offline/',
      noindex: true,
      body: `<section class="page-head"><div class="wrap narrow"><h1>You are offline</h1><p class="lead">This page has not been saved on your phone yet. Pages you have already opened still work. Reconnect to load new ones.</p><p class="actions"><a class="btn" href="/guides/">Open the guides</a><a class="btn btn-ghost" href="/scholarships/">Open scholarships</a></p></div></section>`,
    })
  );
  writeFile(
    '404.html',
    layout({
      title: 'Page not found',
      urlPath: '/404.html',
      noindex: true,
      body: `<section class="page-head"><div class="wrap narrow"><h1>Page not found</h1><p class="lead">That link does not lead anywhere. Try the guides or the scholarship list.</p><p class="actions"><a class="btn" href="/guides/">Open the guides</a><a class="btn btn-ghost" href="/scholarships/">Open scholarships</a></p></div></section>`,
    })
  );

  /* SEO files */
  const today = new Date().toISOString().slice(0, 10);
  writeFile(
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      pages.map((p) => `  <url><loc>${site.url}${p.url}</loc><lastmod>${today}</lastmod><priority>${p.priority}</priority></url>`).join('\n') +
      `\n</urlset>\n`
  );
  writeFile('robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${site.url}/sitemap.xml\n`);

  /* PWA */
  writeFile(
    'manifest.webmanifest',
    JSON.stringify(
      {
        name: site.name,
        short_name: site.name,
        description: site.description,
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0A2540',
        theme_color: '#0A2540',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      null,
      2
    )
  );
  const precache = ['/', '/offline/', '/css/style.css', '/js/app.js', '/favicon.svg', '/manifest.webmanifest'].concat(
    pages.map((p) => p.url)
  );
  writeFile(
    'sw.js',
    `// Generated by build.js. Do not edit by hand.
const VERSION = 'gs-${BUILD_ID}';
const PRECACHE = ${JSON.stringify([...new Set(precache)])};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/admin')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/offline/')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
    )
  );
});
`
  );

  console.log(`Built ${pages.length} pages, ${guides.length} guides, ${scholarships.length} scholarships -> dist/`);
}

build();
