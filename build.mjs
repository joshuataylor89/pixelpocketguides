// Static site generator for PixelPocketGuides.com
// Usage: node build.mjs   -> writes the finished site to ./public
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makePosts, slugMap } from './posts2.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'config.json'), 'utf8'));
const products = JSON.parse(fs.readFileSync(path.join(root, 'data/products.json'), 'utf8'));
const P = Object.fromEntries(products.map((p) => [p.id, p]));
const out = path.join(root, 'public');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const DISCLOSURE = 'As an Amazon Associate I earn from qualifying purchases.';
const disclosureBox = `<div class="disclosure"><b>Affiliate disclosure:</b> ${DISCLOSURE} Links to Amazon on this page may earn us a commission at no extra cost to you. <a href="/affiliate-disclosure/">Details</a>.</div>`;

// ---------- Amazon links ----------
// If a product has an "asin", link straight to the product page. Otherwise link to an
// Amazon search for that product. Either way the affiliate tag from config.json is added.
const amazonLink = (p) =>
  p.link
    ? p.link
    : p.asin
    ? `https://www.amazon.com/dp/${p.asin}?tag=${cfg.amazonTag}`
    : `https://www.amazon.com/s?k=${encodeURIComponent(p.amazonQuery)}&tag=${cfg.amazonTag}`;
const buyBtn = (p) =>
  `<a class="btn" href="${esc(amazonLink(p))}" target="_blank" rel="sponsored nofollow noopener">Check price on Amazon <small>→</small></a>`;

// ---------- Placeholder product art (used until an Amazon SiteStripe image URL is added) ----------
function icon(form) {
  const s = '#0d0f1f';
  const dpad = (x, y) => `<rect x="${x - 9}" y="${y - 3}" width="18" height="6" fill="${s}"/><rect x="${x - 3}" y="${y - 9}" width="6" height="18" fill="${s}"/>`;
  const btns = (x, y) => `<circle cx="${x}" cy="${y}" r="4" fill="${s}"/><circle cx="${x + 11}" cy="${y - 9}" r="4" fill="${s}"/>`;
  const shapes = {
    horizontal: `<rect x="10" y="28" width="180" height="84" rx="26" fill="currentColor"/><rect x="58" y="40" width="84" height="60" rx="4" fill="${s}"/>${dpad(34, 68)}${btns(160, 78)}`,
    square: `<rect x="10" y="28" width="180" height="84" rx="26" fill="currentColor"/><rect x="76" y="42" width="48" height="48" rx="3" fill="${s}"/>${dpad(40, 68)}${btns(154, 78)}`,
    vertical: `<rect x="62" y="6" width="76" height="128" rx="18" fill="currentColor"/><rect x="72" y="16" width="56" height="44" rx="3" fill="${s}"/>${dpad(86, 92)}${btns(110, 98)}`,
    micro: `<rect x="72" y="14" width="56" height="112" rx="14" fill="currentColor"/><rect x="80" y="22" width="40" height="34" rx="3" fill="${s}"/>${dpad(90, 86)}${btns(108, 92)}`,
    clamshell: `<rect x="40" y="6" width="120" height="62" rx="12" fill="currentColor"/><rect x="52" y="14" width="96" height="46" rx="3" fill="${s}"/><rect x="40" y="74" width="120" height="60" rx="12" fill="currentColor"/>${dpad(66, 104)}${btns(132, 112)}`
  };
  return `<svg viewBox="0 0 200 140" role="img" aria-hidden="true">${shapes[form] || shapes.horizontal}</svg>`;
}
const thumb = (p) =>
  `<div class="thumb">${p.image ? `<img referrerpolicy="no-referrer" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" width="200" height="170">` : icon(p.form)}</div>`;

// ---------- Components ----------
const list = (items) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;

function productCard(p, rank) {
  return `<section class="product" id="${p.id}">
  ${thumb(p)}
  <div>
    ${rank ? `<div class="rank">#${rank}</div>` : ''}
    <h3>${esc(p.name)}<span class="badge">${esc(p.badge)}</span></h3>
    <div class="price">${esc(p.price)} · ${esc(p.tier)} tier</div>
    <p>${esc(p.verdict)}</p>
    <ul class="specs">${p.specs.map(([k, v]) => `<li><b>${esc(k)}:</b> ${esc(v)}</li>`).join('')}</ul>
    <div class="proscons">
      <div class="pro"><div class="h">Pros</div>${list(p.pros)}</div>
      <div class="con"><div class="h">Cons</div>${list(p.cons)}</div>
    </div>
    <p><b>Best for:</b> ${esc(p.bestFor)}</p>
    ${buyBtn(p)}
  </div>
</section>`;
}

function compactPick(p, label) {
  return `<div class="pickbox"><b>${esc(label)}: ${esc(p.name)}</b> <span class="price">· ${esc(p.price)}</span>
  <p style="margin:6px 0">${esc(p.bestFor)}. ${esc(p.pros[0])}; ${esc(p.cons[0].charAt(0).toLowerCase() + p.cons[0].slice(1))}.</p>
  ${buyBtn(p)}</div>`;
}

function compareTable(ids) {
  return `<div class="tablewrap"><table>
<tr><th>Handheld</th><th>Price</th><th>Screen</th><th>Best for</th></tr>
${ids
  .map((id) => {
    const p = P[id];
    const screen = (p.specs.find(([k]) => k === 'Screen') || ['', '—'])[1];
    return `<tr><td><a href="#${p.id}">${esc(p.name)}</a></td><td>${esc(p.price)}</td><td>${esc(screen)}</td><td>${esc(p.bestFor)}</td></tr>`;
  })
  .join('\n')}
</table></div>`;
}

const SOURCES = [
  ['Retro Catalog: best budget handhelds', 'https://retrocatalog.com/best-gaming-handhelds/budget-under-70-dollars'],
  ['Retro Handhelds reviews', 'https://retrohandhelds.gg/reviews/'],
  ['GamesRadar: best retro handheld', 'https://www.gamesradar.com/hardware/retro/best-retro-handheld/'],
  ['Retro Dodo: best retro handhelds', 'https://retrododo.com/best-retro-handhelds/'],
  ["Joey's Retro Handhelds: best for every price point", 'https://www.joeysretrohandhelds.com/recommendations/best-retro-handhelds-for-every-price-point/']
];
const sourcesBlock = () => `<h2>Where this guide comes from</h2>
<p>We have not hands-on tested every device here. These picks are based on published reviews and buying guides from the sites below, and we only include handhelds that we found listed on Amazon. Specs and prices are as reported by those reviewers in November 2026 and move around, so always check the current Amazon listing.</p>
<ul>${SOURCES.map(([t, u]) => `<li><a href="${u}" rel="noopener" target="_blank">${esc(t)}</a></li>`).join('')}</ul>`;

const faqBlock = (items) => `<h2>Quick answers</h2><div class="faq">${items
  .map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${a}</p></details>`)
  .join('')}</div>`;

const microSD = `https://www.amazon.com/s?k=${encodeURIComponent('microSD card 256GB')}&tag=${cfg.amazonTag}`;

// ---------- Page shell ----------
function page({ title, desc, url, body, type = 'website', datePublished, canonical, wide = false, scripts = '', crumbs = null, product = null, image = null }) {
  const full = cfg.domain + url;
  const graph = [];
  if (type === 'article') {
    graph.push({ '@context': 'https://schema.org', '@type': 'Article', headline: title, description: desc, image: `${cfg.domain}${image || '/og-image.png'}`, datePublished, dateModified: datePublished, mainEntityOfPage: full, author: { '@type': 'Organization', name: cfg.siteName, url: cfg.domain }, publisher: { '@type': 'Organization', name: cfg.siteName, url: cfg.domain } });
    const faqs = [...String(body).matchAll(/<details><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/g)].map((m) => ({ '@type': 'Question', name: m[1].replace(/<[^>]+>/g, ''), acceptedAnswer: { '@type': 'Answer', text: m[2].replace(/<[^>]+>/g, '') } }));
    if (faqs.length) graph.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs });
  }
  if (url === '/') graph.push({ '@context': 'https://schema.org', '@type': 'WebSite', name: cfg.siteName, url: cfg.domain + '/' });
  if (crumbs) graph.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map(([n, u], k) => ({ '@type': 'ListItem', position: k + 1, name: n, item: cfg.domain + u })) });
  if (product) graph.push({ '@context': 'https://schema.org', '@type': 'Product', ...product, url: full });
  const ld = graph.map((g) => `<script type="application/ld+json">${JSON.stringify(g)}</script>`).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="theme-color" content="#0d0f1f">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical || full}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="${type}">
<meta property="og:url" content="${full}">
<meta property="og:site_name" content="${esc(cfg.siteName)}">
<meta property="og:image" content="${image ? cfg.domain + image : cfg.domain + '/og-image.png'}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(cfg.siteName)} logo">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${image ? cfg.domain + image : cfg.domain + '/og-image.png'}">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
${ld}
</head>
<body>
<header class="site"><div class="wrap">
  <a class="logo" href="/">PIXEL<span>POCKET</span><br>GUIDES</a>
  <nav aria-label="Main">${[['/', 'Home'], ['/handhelds/', 'Handhelds<span class="nm"> Database</span>'], ['/compare/', 'Compare'], ['/guides/', 'Guides'], ['/about/', 'About']].map(([h, t]) => `<a href="${h}"${(h === '/' ? url === '/' : url.startsWith(h)) ? ' class="active" aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
</div></header>
<main class="wrap${wide ? ' wide' : ''}">
${body}
</main>
<footer class="site"><div class="wrap">
  <p>${DISCLOSURE}</p>
  <p><a href="/affiliate-disclosure/">Affiliate Disclosure</a> · <a href="/privacy/">Privacy</a> · <a href="/about/">About</a> · © ${new Date().getFullYear()} ${esc(cfg.siteName)}</p>
  <p>Product names and trademarks belong to their owners. Prices and availability change; check Amazon for current details.</p>
</div></footer>
${scripts}
</body>
</html>
`;
}

// ---------- Posts ----------
const posts = [];

// POST 1: ranked Top 10
{
  const ids = ['rg-cube', 'pocket-air-mini', 'trimui-brick', 'rg35xxsp', 'odin-2', 'analogue-pocket', 'magicx-zero40', 'rg477m', 'super-pocket', 'rg28xx'];
  const slug = 'best-retro-handhelds-holiday-2026';
  const title = 'Top 10 Retro Handhelds to Buy This Holiday Season (2026)';
  const desc = 'Our ranked top 10 retro gaming handhelds for holiday 2026, from sub-$50 stocking stuffers to PS2-capable powerhouses, all available on Amazon.';
  const body = `<article>
<span class="pill">HOLIDAY 2026 · BUYING GUIDE</span>
<h1>${esc(title)}</h1>
<p class="meta">Updated ${esc(cfg.updated)}</p>
<p class="lead">A retro handheld is one of the easiest gadget gifts to get right and one of the easiest to get wrong. Prices run from about $40 to well over $300, and the right pick depends on which games the person actually plays. Here are ten that make good gifts this year, ranked, with a clear "best for" on each.</p>
<p>Short on time? <a href="#rg-cube">The Anbernic RG Cube</a> is the best all-rounder, <a href="#rg28xx">the RG28XX</a> is the cheap stocking stuffer, and <a href="#odin-2">the AYN Odin 2</a> is the splurge for PS2 and GameCube fans.</p>

<h2>The 10 at a glance</h2>
${compareTable(ids)}

<h2>Ranked: the top 10</h2>
${ids.map((id, i) => productCard(P[id], i + 1)).join('\n')}

<h2>Before you buy: gift-giving tips</h2>
<ul>
<li><b>Bring your own games.</b> Most emulation handhelds ship without games. Players use backups of games they own. The Evercade Super Pocket and the Analogue Pocket are the exceptions, since they use licensed built-in games or real cartridges.</li>
<li><b>Add a microSD card.</b> Most of these use one for storage, and it is the one accessory that makes the gift usable on day one. <a href="${esc(microSD)}" target="_blank" rel="sponsored nofollow noopener">Browse microSD cards on Amazon</a> or read our <a href="/best-microsd-cards-for-retro-handhelds-2026/">microSD card guide</a>.</li>
<li><b>Check who sells it.</b> Buy from the brand's own storefront or a seller with solid reviews. Rebranded clones with big markups are common in this category.</li>
<li><b>Linux or Android?</b> Linux handhelds (TRIMUI Brick, RG35XXSP, RG28XX) are simple and fast to set up. Android handhelds (RG Cube, Odin 2, RG477M) need more setup but run PS2, GameCube and mobile games.</li>
</ul>

${faqBlock([
  ['What is the best retro handheld for a beginner?', 'The <a href="#trimui-brick">TRIMUI Brick</a> or the <a href="#rg35xxsp">RG35XXSP</a>. Both run simple Linux software and play Game Boy through PS1 without fuss. For zero setup at all, the <a href="#super-pocket">Evercade Super Pocket</a> comes with its games built in.'],
  ['Which handheld plays PS2 games?', 'The <a href="#odin-2">AYN Odin 2</a> and <a href="#rg477m">Anbernic RG477M</a> are the strongest picks here. The <a href="#rg-cube">RG Cube</a> can run many PS2 games with some stutter.'],
  ['What is the best retro handheld under $100?', 'The <a href="#trimui-brick">TRIMUI Brick</a> for pocketability, the <a href="#rg35xxsp">RG35XXSP</a> for a clamshell, and the <a href="#magicx-zero40">MagicX Zero 40</a> for DS games. Our <a href="/retro-handheld-buying-guide-by-price-2026/">buying guide by price</a> goes deeper.'],
  ['Are prices on this page current?', 'They are rough figures reported by reviewers in November 2026. Amazon prices change often, so use the button on each pick for the live price.']
])}
${sourcesBlock()}
${disclosureBox}
</article>`;
  posts.push({ slug, title, desc, body, blurb: 'Ten ranked picks from stocking stuffers to PS2 powerhouses, each with specs, pros, cons and who it suits.', kicker: 'TOP 10' });
}

// POST 2: by price
{
  const slug = 'retro-handheld-buying-guide-by-price-2026';
  const title = 'Retro Handheld Buying Guide by Price: Under $50 to $300+ (Holiday 2026)';
  const desc = 'Pick the right retro gaming handheld for your budget this holiday: best picks under $50, $50–$100, $100–$200 and $200+, all on Amazon.';
  const tier = (heading, intro, picks) => `<h2 class="tier">${esc(heading)}</h2><p>${intro}</p>${picks}`;
  const body = `<article>
<span class="pill">HOLIDAY 2026 · BY BUDGET</span>
<h1>${esc(title)}</h1>
<p class="meta">Updated ${esc(cfg.updated)}</p>
<p class="lead">Spending more does not always get you a better gift. A $60 pocket handheld can be a better match than a $400 powerhouse, depending on the games. Find your budget below and you will get one best pick, a runner-up or two, and a note on who should skip it.</p>

<h2>Quick chooser</h2>
<div class="tablewrap"><table>
<tr><th>If you want…</th><th>Get</th></tr>
<tr><td>The cheapest decent option</td><td><a href="#rg28xx">Anbernic RG28XX</a></td></tr>
<tr><td>Something that fits any pocket</td><td><a href="#trimui-brick">TRIMUI Brick</a></td></tr>
<tr><td>A fold-up Game Boy Advance SP feel</td><td><a href="#rg35xxsp">Anbernic RG35XXSP</a></td></tr>
<tr><td>Zero setup, licensed games</td><td><a href="#super-pocket">Evercade Super Pocket</a></td></tr>
<tr><td>DS games and arcade shooters</td><td><a href="#magicx-zero40">MagicX Zero 40</a></td></tr>
<tr><td>One device for nearly everything</td><td><a href="#rg-cube">Anbernic RG Cube</a></td></tr>
<tr><td>PS2 and GameCube without compromise</td><td><a href="#odin-2">AYN Odin 2</a></td></tr>
<tr><td>Original Game Boy cartridges</td><td><a href="#analogue-pocket">Analogue Pocket</a></td></tr>
</table></div>

${tier(
  'Under $50: stocking-stuffer territory',
  'At this price you are buying a small, simple handheld for 8-bit, 16-bit and PlayStation 1 games. Expect compromises, and keep expectations modest.',
  `<div id="rg28xx">${compactPick(P['rg28xx'], 'Best pick')}</div>
<p><b>Skip it if</b> you have big hands or want PS2. The shoulder buttons rattle and the layout is cramped. See the <a href="/best-retro-handhelds-holiday-2026/#rg28xx">full write-up</a>.</p>`
)}

${tier(
  '$50–$100: the sweet spot',
  'Retro Catalog notes that this bracket gives the most for your money. Light, cheap hardware is more than enough for classic consoles, and it opens up Dreamcast, N64 and PSP on some models.',
  `<div id="trimui-brick">${compactPick(P['trimui-brick'], 'Best pick')}</div>
<div id="rg35xxsp">${compactPick(P['rg35xxsp'], 'Best clamshell')}</div>
<div id="magicx-zero40">${compactPick(P['magicx-zero40'], 'Best for DS and arcade')}</div>
<div id="super-pocket">${compactPick(P['super-pocket'], 'Best no-setup gift')}</div>
<div id="rg35xx-plus">${compactPick(P['rg35xx-plus'], 'Budget classic')}</div>
<p><b>Skip them if</b> you want PS2 or GameCube. Nothing in this bracket does those well.</p>`
)}

${tier(
  '$100–$200: where Android gets interesting',
  'Here you start to see Android handhelds with real sticks, bigger screens and enough power for some PS2 and GameCube games. Setup takes longer than on Linux devices, but the flexibility is worth it for the right person.',
  `<div id="rg-cube">${compactPick(P['rg-cube'], 'Best pick')}</div>
<div id="pocket-air-mini">${compactPick(P['pocket-air-mini'], 'Best value')}</div>
<p><b>Skip them if</b> the gift is for someone who wants to switch on and play. A Linux handheld in the $50–$100 bracket will frustrate them less.</p>`
)}

${tier(
  '$200 and up: the enthusiast picks',
  'These cost more and make sense when the person already knows what they want. Two are about raw power, and one is about playing original cartridges.',
  `<div id="odin-2">${compactPick(P['odin-2'], 'Best power')}</div>
<div id="rg477m">${compactPick(P['rg477m'], 'Best metal build')}</div>
<div id="analogue-pocket">${compactPick(P['analogue-pocket'], 'Best for real cartridges')}</div>
<p><b>Skip them if</b> the person mostly plays NES, SNES and Game Boy games. A cheaper handheld plays those just as well.</p>`
)}

<h2>Before you check out</h2>
<ul>
<li><b>Games are not included.</b> Emulation handhelds need game files, which you should only make from games you own. The Super Pocket (built-in licensed games) and the Analogue Pocket (real cartridges) avoid this.</li>
<li><b>Get a microSD card.</b> It is what the games live on. <a href="${esc(microSD)}" target="_blank" rel="sponsored nofollow noopener">Browse microSD cards on Amazon</a> or read our <a href="/best-microsd-cards-for-retro-handhelds-2026/">microSD card guide</a>.</li>
<li><b>Check the seller and return window.</b> Buy from the brand or a well-reviewed seller, and keep the return window in mind when giving a gift.</li>
<li><b>Prices move.</b> The figures here are reviewer-reported, so check Amazon for the live price.</li>
</ul>
<p>Want the full ranked list with specs and pros and cons? See our <a href="/best-retro-handhelds-holiday-2026/">Top 10 Retro Handhelds for the Holidays</a>.</p>
${sourcesBlock()}
${disclosureBox}
</article>`;
  posts.push({ slug, title, desc, body, blurb: 'Best pick and runners-up for each budget, with a quick chooser and a pre-checkout checklist.', kicker: 'BY PRICE' });
}

// POST 3: Top 5 vertical handhelds
{
  const ids = ['trimui-brick', 'magicx-zero40', 'rg35xx-plus', 'super-pocket', 'rg28xx'];
  const slug = 'best-vertical-retro-handhelds-2026';
  const title = 'Top 5 Best Vertical Retro Handhelds for Holiday 2026 (Game Boy-Style Gift Guide)';
  const desc = 'The best vertical retro handhelds to buy for the 2026 holidays: pocket-sized, Game Boy-style emulation handhelds for GBA, SNES, PS1 and more, all on Amazon.';
  const body = `<article>
<span class="pill">HOLIDAY 2026 · VERTICAL HANDHELDS</span>
<h1>${esc(title)}</h1>
<p class="meta">Updated ${esc(cfg.updated)}</p>
<p class="lead">Looking for the best vertical retro handheld this holiday season? A vertical handheld is the classic Game Boy-style shape: a portrait screen on top, controls underneath, small enough to slide into a pocket. They are cheap, easy to carry and a great fit for Game Boy, Game Boy Color, Game Boy Advance, NES, SNES, Sega Genesis and PlayStation 1 games. Here are our top 5 vertical retro handhelds on Amazon, from stocking stuffers to the best all-round pocket emulator.</p>
<p>Short on time? <a href="#trimui-brick">The TRIMUI Brick</a> is the best vertical retro handheld overall, <a href="#magicx-zero40">the MagicX Zero 40</a> is best for Nintendo DS and arcade shooters, and <a href="#super-pocket">the Evercade Super Pocket</a> is the best no-setup gift.</p>

<h2>Top 5 vertical handhelds at a glance</h2>
${compareTable(ids)}

<h2>What is a vertical retro handheld?</h2>
<p>A vertical handheld (also called a portrait or Game Boy-style handheld) holds the screen above the buttons instead of between them. That keeps the device narrow and pocketable, and it is the shape most people picture when they think of a retro gaming handheld. Most vertical emulation handhelds run Linux with a simple menu, so you can pick it up and play with little setup, while a few, like the MagicX Zero 40, run Android.</p>

<h2>Ranked: the 5 best vertical retro handhelds for the holidays</h2>
${ids.map((id, i) => productCard(P[id], i + 1)).join('\n')}

<h2>Vertical vs horizontal handhelds: which should you buy?</h2>
<ul>
<li><b>Choose vertical</b> if you want a pocket-sized, lightweight handheld for 8-bit, 16-bit, Game Boy Advance and PlayStation 1 games, or if you are shopping for a kid or a nostalgic gift.</li>
<li><b>Choose horizontal</b> if you want analog sticks, a bigger screen, or PS2, GameCube and PSP performance. See our <a href="/best-retro-handhelds-holiday-2026/">Top 10 Retro Handhelds for the Holidays</a>.</li>
<li><b>Choose a clamshell</b> if you want a fold-up screen protector. The <a href="/retro-handheld-buying-guide-by-price-2026/">buying guide by price</a> covers the best option.</li>
</ul>

<h2>How to choose a vertical handheld</h2>
<ul>
<li><b>Screen size and shape.</b> Smaller screens (around 2.8 to 3.5 inches) suit Game Boy and SNES games and fit any pocket. Larger ones suit DS games and arcade shooters.</li>
<li><b>Operating system.</b> Linux handhelds are simple to start with, and Android handhelds can run more apps.</li>
<li><b>Games.</b> Most emulation handhelds ship without games. You supply backups of games you own. The Evercade Super Pocket comes with licensed games built in.</li>
<li><b>Battery and storage.</b> Check the battery size, and buy a microSD card for your games. <a href="${esc(microSD)}" target="_blank" rel="sponsored nofollow noopener">Browse microSD cards on Amazon</a> or read our <a href="/best-microsd-cards-for-retro-handhelds-2026/">microSD card guide</a>.</li>
<li><b>Budget.</b> Prices here run from about $40 to under $90. Always check Amazon for the current price, since sales around Black Friday and Cyber Monday can change it.</li>
</ul>

${faqBlock([
  ['What is the best vertical retro handheld?', 'For most people, the <a href="#trimui-brick">TRIMUI Brick</a>. It has a sharp screen, a simple operating system and a pocket-friendly size.'],
  ['What is the best vertical handheld for Game Boy Advance games?', 'The <a href="#trimui-brick">TRIMUI Brick</a> and the <a href="#rg35xx-plus">Anbernic RG35XX Plus</a> both handle Game Boy Advance well. The RG35XX Plus costs less.'],
  ['What is the best vertical handheld for Nintendo DS?', 'The <a href="#magicx-zero40">MagicX Zero 40</a>. Its tall screen suits DS games and vertical arcade shooters.'],
  ['What is the best cheap vertical handheld?', 'The <a href="#rg28xx">Anbernic RG28XX</a> is the cheapest pick here, often under $40, and the <a href="#rg35xx-plus">RG35XX Plus</a> is a step up.'],
  ['What is the best retro handheld for kids?', 'The <a href="#super-pocket">Evercade Super Pocket</a>. It comes with licensed games built in and needs no setup.'],
  ['Are these good holiday gifts?', 'Yes. They are small, affordable and easy to wrap, and most work as a stocking stuffer or a main gift. Add a microSD card for the emulation models.']
])}
${sourcesBlock()}
${disclosureBox}
</article>`;
  posts.push({ slug, title, desc, body, blurb: 'Five pocket-sized, Game Boy-style handhelds ranked, from stocking stuffers to the best overall.', kicker: 'TOP 5 VERTICAL' });
}

// POST 4: Top 5 horizontal handhelds
{
  const ids = ['rg-cube', 'pocket-air-mini', 'rg477m', 'odin-2', 'analogue-pocket'];
  const slug = 'best-horizontal-retro-handhelds-2026';
  const title = 'Top 5 Best Horizontal Retro Handhelds for Holiday 2026 (Gift Guide)';
  const desc = 'The best horizontal retro gaming handhelds for the 2026 holidays: Android emulation handhelds with sticks and big screens for PS2, GameCube, Dreamcast, DS and more, all on Amazon.';
  const body = `<article>
<span class="pill">HOLIDAY 2026 · HORIZONTAL HANDHELDS</span>
<h1>${esc(title)}</h1>
<p class="meta">Updated ${esc(cfg.updated)}</p>
<p class="lead">Want the best horizontal retro handheld this holiday season? A horizontal handheld has the screen in the middle with controls on both sides, the same layout as a Nintendo Switch or Steam Deck. That gives room for analog sticks, a bigger screen and more power, so these are the models to look at for Dreamcast, PSP, GameCube, DS and PS2 games as well as classic 8-bit and 16-bit favorites. Here are our top 5 horizontal retro handhelds on Amazon, from a budget-friendly Android handheld to a flagship PS2 machine.</p>
<p>Short on time? <a href="#rg-cube">The Anbernic RG Cube</a> is the best horizontal retro handheld overall, <a href="#pocket-air-mini">the AYANEO Pocket Air Mini</a> is the best value, and <a href="#odin-2">the AYN Odin 2</a> is the best for PS2 and GameCube.</p>

<h2>Top 5 horizontal handhelds at a glance</h2>
${compareTable(ids)}

<h2>What is a horizontal retro handheld?</h2>
<p>A horizontal (or landscape) handheld is the wide, controller-style shape. Because the buttons sit beside the screen, there is space for analog sticks, triggers and a larger battery, which is why most Android retro handhelds use this layout. They run emulators for systems like the Sega Dreamcast, Sony PSP, Nintendo GameCube and PlayStation 2, and many can also play Android games and stream games from the cloud.</p>

<h2>Ranked: the 5 best horizontal retro handhelds for the holidays</h2>
${ids.map((id, i) => productCard(P[id], i + 1)).join('\n')}

<h2>Horizontal vs vertical handhelds: which should you buy?</h2>
<ul>
<li><b>Choose horizontal</b> if you want analog sticks, a bigger screen, and the power for Dreamcast, PSP, GameCube or PS2 games.</li>
<li><b>Choose vertical</b> if you want a cheap, pocket-sized Game Boy-style handheld for 8-bit, 16-bit and PS1 games. See our <a href="/best-vertical-retro-handhelds-2026/">Top 5 Vertical Retro Handhelds</a>.</li>
<li><b>Want all the options?</b> Our <a href="/best-retro-handhelds-holiday-2026/">Top 10 Retro Handhelds for the Holidays</a> and the <a href="/retro-handheld-buying-guide-by-price-2026/">buying guide by price</a> cover every shape and budget.</li>
</ul>

<h2>How to choose a horizontal retro handheld</h2>
<ul>
<li><b>Power.</b> Stronger chips run PS2 and GameCube games at higher resolutions. If you mostly play older systems, a cheaper model is enough.</li>
<li><b>Screen shape and size.</b> A 4:3 screen suits classic games, a square screen suits Game Boy and DS games, and a large 16:9 screen suits PSP and modern games.</li>
<li><b>Operating system.</b> These run Android, which needs more setup than a Linux handheld but runs more emulators and apps.</li>
<li><b>Games.</b> Most emulation handhelds ship without games. You supply backups of games you own. The Analogue Pocket plays your real cartridges.</li>
<li><b>Storage and budget.</b> Prices here run from about $110 to over $400, so check Amazon for the current price. Many models take a microSD card. <a href="${esc(microSD)}" target="_blank" rel="sponsored nofollow noopener">Browse microSD cards on Amazon</a> or read our <a href="/best-microsd-cards-for-retro-handhelds-2026/">microSD card guide</a>.</li>
</ul>

${faqBlock([
  ['What is the best horizontal retro handheld?', 'For most people, the <a href="#rg-cube">Anbernic RG Cube</a>. It handles everything from Game Boy games to many PS2 games and has a big battery.'],
  ['What is the best horizontal handheld for PS2 games?', 'The <a href="#odin-2">AYN Odin 2</a> is the strongest pick here, and the <a href="#rg477m">Anbernic RG477M</a> is a premium metal alternative.'],
  ['What is the best cheap horizontal retro handheld?', 'The <a href="#pocket-air-mini">AYANEO Pocket Air Mini</a>, from about $110, gives you an Android handheld with analog sticks and triggers.'],
  ['What is the best horizontal handheld for Game Boy cartridges?', 'The <a href="#analogue-pocket">Analogue Pocket</a>. It plays original Game Boy, Game Boy Color and Game Boy Advance cartridges.'],
  ['What is the best horizontal handheld for Nintendo DS?', 'The <a href="#rg-cube">Anbernic RG Cube</a>. Its square screen leaves room to show both DS screens.'],
  ['Are these good holiday gifts?', 'Yes, for gamers who already know what they want. They cost more than a pocket handheld, so check the return window on Amazon, and add a microSD card for the emulation models.']
])}
${sourcesBlock()}
${disclosureBox}
</article>`;
  posts.push({ slug, title, desc, body, blurb: 'Five horizontal Android and cartridge handhelds ranked, from the best-value pick to the PS2 powerhouse.', kicker: 'TOP 5 HORIZONTAL' });
}

// POST 5: microSD cards
{
  const slug = 'best-microsd-cards-for-retro-handhelds-2026';
  const title = 'microSD Cards for Retro Handhelds Guide';
  const desc = 'Upgrade the cheap microSD card in your retro handheld: Samsung, SanDisk, Lexar, Kingston and six more brands in 128GB, 256GB, 512GB and 1TB, with size, speed and fake-card tips.';
  const link = (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}&tag=${cfg.amazonTag}`;
  const btn = (q) => `<a class="btn" href="${esc(link(q))}" target="_blank" rel="sponsored nofollow noopener">Check price on Amazon <small>→</small></a>`;
  const cards = [
    ['Samsung', 'Samsung EVO Select / PRO Plus', 'Best Overall', 'Samsung microSD card 256GB', 'A trusted name with a long record for reliable cards. The EVO Select is the easy value pick, and the PRO Plus is the step up if you want faster loading for bigger games. This is the safe default for almost any handheld.', 'Reliable, widely sold, easy to find in 128GB, 256GB and 512GB', 'Costs a little more than budget brands', null, 'https://m.media-amazon.com/images/I/618XGviQ6+L._AC_SL1500_.jpg'],
    ['SanDisk', 'SanDisk Extreme / Ultra', 'Best Alternative', 'SanDisk Extreme microSD card 256GB', 'The other default choice. SanDisk is the brand most retro handheld guides name first. The Ultra suits older and cheaper handhelds, and the Extreme is the pick for Android handhelds that load large PS2 and GameCube games.', 'Great reputation, many sizes, often discounted', 'Heavily copied, so only buy from Amazon or an authorized seller', null, 'https://m.media-amazon.com/images/I/61vHiN25OOL._AC_SL1500_.jpg'],
    ['Lexar', 'Lexar Play 1TB (205MB/s read, V30, A2)', 'Best Value', 'Lexar Play microSD card 1TB', 'Often cheaper than Samsung and SanDisk for similar rated speeds. The Lexar Play 1TB is rated for up to 205MB/s reads with V30 and A2 ratings, which makes it a strong pick if you want room for a huge library. Check that your handheld supports a card this large before buying.', 'Fast rated speeds (205MB/s read, A2) and huge 1TB capacity for the price', 'Less well known, and many handhelds cap card size, so confirm yours takes 1TB', 'https://link.amazon/B0gY93KXh', 'https://m.media-amazon.com/images/I/71xksnOBo1L._AC_SL1500_.jpg', {'256GB': 'https://link.amazon/B0iuSSCBm', '512GB': 'https://link.amazon/B03DFxfd9', '1TB': 'https://link.amazon/B087ovTw2'}],
    ['Kingston', 'Kingston Canvas Select Plus / Canvas Go! Plus', 'Reliable Budget Pick', 'Kingston Canvas Select Plus microSD 256GB', 'Kingston makes dependable cards at fair prices and is a common recommendation for handhelds and tablets.', 'Fair price, widely available', 'Entry models are slower for loading big games', null, 'https://m.media-amazon.com/images/I/71clX0TqIKL._AC_SL1500_.jpg'],
    ['PNY', 'PNY Elite-X / PRO Elite', 'Budget Pick', 'PNY microSD card 256GB', 'A low-cost name that often undercuts the big two. Fine for 8-bit and 16-bit libraries, where speed matters less.', 'Low price per gigabyte', 'Not the fastest for large Android games', 'https://link.amazon/B01CHdlCv', 'https://m.media-amazon.com/images/I/51UNFQiGbTL._AC_SL1000_.jpg'],
    ['Amazon Basics', 'Amazon Basics microSDXC', 'Cheapest Option', 'Amazon Basics microSD card 256GB', 'Sold and fulfilled by Amazon, which lowers the risk of getting a fake. A good pick for a stocking-stuffer handheld where you just need storage.', 'Low price, sold by Amazon', 'Speeds trail the premium cards', 'https://link.amazon/B0hYDcYB5', 'https://m.media-amazon.com/images/I/61kwyhCbyUL._AC_SL1500_.jpg'],
    ['Silicon Power', 'Silicon Power Superior / Elite', 'Budget Large Capacity', 'Silicon Power microSD card 512GB', 'A frequent choice when you want a lot of space for little money. Check the listing for the A1 or A2 and U3 labels.', 'Strong price on larger sizes', 'Quality can vary by model, so read reviews', null, 'https://m.media-amazon.com/images/I/51Fdyf-HG1L._AC_SL1500_.jpg'],
    ['Transcend', 'Transcend 300S / 340S', 'Dependable Everyday', 'Transcend microSD card 128GB', 'A long-running memory brand that focuses on steady performance. Good for older retro systems and Linux handhelds.', 'Steady, well-built cards', 'Fewer high-capacity options', null, 'https://m.media-amazon.com/images/I/617imhZ7nTL._AC_SL1500_.jpg'],
    ['Team Group', 'TEAMGROUP Elite / A1 Card', 'Good Spare Card', 'TEAMGROUP microSD card 256GB', 'A budget brand that makes useful spare cards for swapping libraries between handhelds.', 'Affordable, A1-rated models', 'Check capacity and speed on the exact listing', null, 'https://m.media-amazon.com/images/I/8145BsYmKDL._AC_SL1500_.jpg'],
    ['Patriot', 'Patriot LX / EP Series', 'Budget Backup', 'Patriot microSD card 128GB', 'Another low-cost option for the second slot or a backup copy of your library.', 'Cheap, good for backups', 'Not a first choice for demanding Android games', null, 'https://m.media-amazon.com/images/I/61hHqdM7VpL._AC_SL1500_.jpg']
  ];
  const brandCard = (c, i) => `<section class="product" id="${esc(c[0].toLowerCase().replace(/[^a-z0-9]+/g, '-'))}">
<div class="thumb">${c[8] ? `<img referrerpolicy="no-referrer" src="${esc(c[8])}" alt="${esc(c[1])} microSD card" loading="lazy">` : ''}${c[8] ? '<!--' : ''}<svg viewBox="0 0 120 150" role="img" aria-label="microSD card"><path d="M22 6h62l22 22v116H22z" fill="currentColor" opacity=".9"/><rect x="34" y="14" width="8" height="18" fill="#0d0f1f"/><rect x="48" y="14" width="8" height="18" fill="#0d0f1f"/><rect x="62" y="14" width="8" height="18" fill="#0d0f1f"/><text x="64" y="104" text-anchor="middle" font-size="18" font-family="monospace" fill="#0d0f1f">microSD</text></svg>${c[8] ? '-->' : ''}</div>
<div>
<div class="rank">#${i + 1}</div>
<h3 id="${esc(c[0].toLowerCase().replace(/[^a-z0-9]+/g, '-'))}-card">${esc(c[0])} <span class="badge">${esc(c[2])}</span></h3>
<p>${esc(c[4])}</p>
${c[7] ? `<a class="btn" href="${esc(c[7])}" target="_blank" rel="sponsored nofollow noopener">Check price on Amazon <small>→</small></a>` : btn(c[3])}
<p class="sizes"><b>Pick a size:</b> ${(c[9] ? Object.keys(c[9]) : ['128GB', '256GB', '512GB', '1TB']).map((z) => `<a href="${esc((c[9] && c[9][z]) || link(c[0] + ' microSD card ' + z))}" target="_blank" rel="sponsored nofollow noopener">${z}</a>`).join(' · ')}</p>
</div></section>`;
  const body = `<article>
<span class="pill">ACCESSORIES · STORAGE</span>
<h1>${esc(title)}</h1>
<p class="meta">Updated ${esc(cfg.updated)}</p>
<p class="lead">The first thing you will want to do with a retro handheld is remove the cheap, unbranded microSD card it ships with and upgrade. Almost every retro handheld needs a microSD card for games, saves and emulator files, and the card you pick affects how fast games load and how safe your saves are. Here are 10 microSD card brands that work well in retro handhelds, from the trusted favorites to budget picks, all sold on Amazon.</p>
<p>Short on time? For most handhelds, buy a <b>256GB Samsung or SanDisk card</b>. They are the safest, easiest choices.</p>

<h2>How much storage do you need?</h2>
<ul>
<li><b>128GB:</b> plenty for 8-bit, 16-bit, Game Boy Advance and most PS1 libraries.</li>
<li><b>256GB:</b> the sweet spot for most people. Covers big PS1 collections, PSP and DS plus extras.</li>
<li><b>512GB:</b> for PS2, GameCube and Dreamcast libraries, which take much more space. Some handhelds list a maximum card size, so check yours before buying.</li>
<li><b>1TB:</b> room for a huge library of everything, with space left over. Confirm your handheld supports a card this large first, since many cap card size.</li>
</ul>

<h2>Speed labels in plain English</h2>
<ul>
<li><b>U1 / U3:</b> minimum write speed. U3 is a safe choice for anything.</li>
<li><b>A1 / A2:</b> better at running apps. Useful for Android handhelds that load games from the card.</li>
<li><b>Class 10:</b> fine for Linux handhelds that mostly run small retro games.</li>
</ul>
<p>Cards advertise their top speed, but a handheld may not use all of it. A mid-priced card is usually enough.</p>

<h2>The 10 best microSD card brands for retro handhelds</h2>
${cards.map(brandCard).join('\n')}

<h2>How to avoid fake microSD cards</h2>
<ul>
<li>Buy cards that are sold and shipped by Amazon, or by the brand's official store.</li>
<li>Be suspicious of an unusually low price on a large card, especially 512GB and above.</li>
<li>Check the card as soon as it arrives with a free tool such as H2testw (Windows) or F3 (Mac and Linux), and return it quickly if it fails.</li>
<li>Keep a backup of your saves. Any card can fail.</li>
</ul>

<h2>Setting up your card</h2>
<ul>
<li>Most handhelds work with FAT32 or exFAT. If your handheld asks for one, follow its manual.</li>
<li>Large cards sometimes arrive in exFAT. Check what your handheld supports before copying games over.</li>
<li>Handhelds with two slots let you use one card for the system and one for games.</li>
</ul>

<p>Looking for a handheld to put it in? See our <a href="/best-retro-handhelds-holiday-2026/">Top 10 Retro Handhelds</a>, the <a href="/retro-handheld-buying-guide-by-price-2026/">buying guide by price</a>, or the Top 5 <a href="/best-vertical-retro-handhelds-2026/">vertical</a> and <a href="/best-horizontal-retro-handhelds-2026/">horizontal</a> picks.</p>

${disclosureBox}
</article>`;
  posts.push({ slug, title, desc, body, blurb: 'Upgrade the cheap card in your handheld: Samsung, SanDisk and eight more brands, with size and speed advice and how to avoid fake cards.', kicker: 'MICROSD' });
}

// POST 6: Steam Deck feature
{
  const slug = 'steam-deck-still-a-beast-2026';
  const title = 'Why the Steam Deck OLED Is Still a Beast in 2026';
  const desc = 'The Steam Deck OLED is still one of the best handhelds to buy in 2026: a huge Steam library, class-leading real-world battery life, a comfortable build and a gorgeous HDR OLED screen. See the 2TB bundle on Amazon.';
  const deck = 'https://link.amazon/B0cevdy0G';
  const img = 'https://m.media-amazon.com/images/I/61XBCgb6nnL._SL1500_.jpg';
  const dbtn = `<a class="btn" href="${esc(deck)}" target="_blank" rel="sponsored nofollow noopener">Check price on Amazon <small>→</small></a>`;
  const body = `<article>
<span class="pill">FEATURE · STEAM DECK</span>
<h1>${esc(title)}</h1>
<p class="meta">Updated ${esc(cfg.updated)}</p>
<p class="lead">Newer handhelds keep arriving, and the Steam Deck keeps winning people over. In 2026 the Steam Deck OLED is still a great little machine: it plays your Steam library on the go, it lasts longer in real use than rivals with bigger batteries, it is comfortable for long sessions, and its OLED screen looks fantastic. Here is why this Valve handheld is still a beast.</p>

<section class="product">
<div class="thumb"><img referrerpolicy="no-referrer" src="${esc(img)}" alt="Valve Steam Deck OLED 2TB handheld gaming console bundle" loading="lazy"></div>
<div>
<div class="rank">FEATURED</div>
<h3>Valve Steam Deck OLED 2TB bundle <span class="badge">Still a Beast</span></h3>
<p>7.4" HDR OLED display at 90Hz, Wi-Fi 6E and 2TB of storage for PC gaming on the go. This Amazon bundle is a 7-in-1 kit that adds a carrying case, a hub, a controller, two protective cases, a screen protector and a 32GB USB drive, so you are ready to play out of the box.</p>
${dbtn}
</div></section>

<h2>1. Your Steam library, anywhere</h2>
<p>The biggest reason to love the Steam Deck is simple: it plays Steam games. If you want to play your Steam library and you are not chasing bleeding-edge graphics, reviewer Jessica Conditt of Engadget says the Steam Deck is "still a great little machine." For everyone who enjoys the huge catalog of PC games on Steam, that is exactly what you want in a handheld.</p>

<h2>2. Battery life that keeps going</h2>
<p>Battery life is where the Steam Deck stands out. Rival handhelds such as the Xbox Ally and the Legion Go line have larger batteries on paper, but in real-world play Valve's handheld often comes out on top, because rivals tend to drain faster once they leave low-power modes and run at full strength. If you want to play for hours on end, the Steam Deck gives you the best shot at a handheld that lasts.</p>

<h2>3. Comfortable for long sessions</h2>
<p>Besides the Nintendo Switch 2, the Steam Deck is the lightest handheld in its class, which makes it one of the most comfortable for long gaming sessions. That matters on a long trip, a couch session or a late night with a big game.</p>

<h2>4. A gorgeous HDR OLED screen</h2>
<p>The Steam Deck OLED is the model Valve sells today, and it has a 7.4-inch HDR OLED display with a 90Hz refresh rate. Among the big handhelds, only the Steam Deck and the Switch 2 support HDR, so games look rich and bright whether you play in handheld mode or on the go.</p>

<h2>5. SteamOS: simple and made for gaming</h2>
<p>The Steam Deck runs SteamOS, a console-style system built for games, so you pick up the Deck and play. The Xbox Ally line is often criticized for Windows, and the Steam Deck skips all that.</p>

<h2>6. Strong value against the competition</h2>
<p>Next to the Steam Deck's main competitors, the Asus ROG Xbox Ally X and the Lenovo Legion Go line, the Steam Deck OLED costs less when you buy it straight from the source. That makes it one of the better ways into PC handheld gaming. Check Amazon for the current price on the bundle below.</p>

<h2>Why the 2TB bundle is a great way to buy</h2>
<ul>
<li><b>2TB of storage:</b> room for a huge Steam library with no need to uninstall games.</li>
<li><b>7.4" HDR OLED, 90Hz:</b> the screen is a big part of why this Deck feels premium.</li>
<li><b>Wi-Fi 6E:</b> fast wireless for downloads and streaming.</li>
<li><b>7-in-1 kit:</b> carrying case, hub, controller, two protective cases, screen protector and a 32GB USB drive.</li>
</ul>
<p>${dbtn}</p>

<h2>Want to see more handhelds?</h2>
<p>The Steam Deck is a PC handheld. If you want emulation machines for classic games, see our <a href="/best-retro-handhelds-holiday-2026/">Top 10 Retro Handhelds</a>, the <a href="/best-horizontal-retro-handhelds-2026/">Top 5 Horizontal picks</a> and our <a href="/best-microsd-cards-for-retro-handhelds-2026/">microSD card guide</a>.</p>

<h2>Source</h2>
<p>Based on reporting by Deven McClure at <a href="https://www.engadget.com/2248094/is-steam-deck-still-worth-it/" rel="noopener" target="_blank">Engadget: Is the Steam Deck still worth it in 2026?</a> (September 2026). Product details come from the Amazon listing. Prices and availability change, so check the current Amazon listing.</p>
${disclosureBox}
</article>`;
  posts.push({ slug, title, desc, body, blurb: 'Why the Steam Deck OLED still wins in 2026: its Steam library, real-world battery life, comfort and HDR OLED screen, plus a 2TB bundle on Amazon.', kicker: 'STEAM DECK' });
}

// POSTS 7-10: stick and flip lists
{
  const D = {
    'retroid-pocket-6': { name: 'Retroid Pocket 6', form: 'horizontal', badge: 'Premium Dual Sticks', price: '~$240', q: 'Retroid Pocket 6', specs: [['Screen', '5.5" 16:9 AMOLED, 1920×1080, 120Hz'], ['Chip / RAM', 'Snapdragon 8 Gen 2 / 8GB'], ['Battery', '6,000mAh'], ['Weight', '304g'], ['OS', 'Android 13 and Linux'], ['Sticks', 'Two Hall-effect sticks (per Retro Dodo)']], verdict: 'A big, bright AMOLED screen, a Snapdragon 8 Gen 2 chip and two Hall-effect sticks make this a strong all-rounder. Retro Catalog lists it as best for PS2 and GameCube.' },
    'retroid-nova': { name: 'Retroid Pocket Nova', form: 'horizontal', badge: 'Compact Dual Sticks', price: '~$229', q: 'Retroid Pocket Nova', specs: [['Screen', '4.5" 4:3 AMOLED, 1280×960, 120Hz'], ['Chip / RAM', 'Snapdragon 8 Gen 2 / 8GB'], ['Battery', '5,000mAh'], ['Weight', '255g'], ['OS', 'Android 13 and Linux'], ['Sticks', 'Two Hall-effect sticks (per Retro Dodo)']], verdict: 'The same Snapdragon 8 Gen 2 chip in a lighter, more compact 4:3 body with a 120Hz AMOLED screen. A good fit if you mostly play classic systems and still want proper sticks.' },
    'rg-ds-plus': { name: 'Anbernic RG DS Plus', form: 'horizontal', badge: 'Dual-Screen Budget', price: '~$95', q: 'Anbernic RG DS Plus', specs: [['Screens', 'Two 4.3" 4:3 IPS, 1024×768'], ['Chip / RAM', 'Rockchip RK3568 / 1GB'], ['Battery', '4,000mAh'], ['Weight', '345g'], ['OS', 'Linux'], ['Storage', 'Dual microSD slots'], ['Stick', 'One analog stick (per Retro Dodo)']], verdict: 'A budget dual-screen handheld for Nintendo DS games, with one analog stick. Retro Catalog lists it as best for NDS and Dreamcast. Retro Dodo notes the stick is not high quality.' },
    'sf2000': { name: 'DATA FROG SF2000', form: 'horizontal', badge: 'Ultra-Budget', price: 'Check Amazon', q: 'DATA FROG SF2000', specs: [['Stick', 'One analog stick (per Tech Tactician)']], verdict: 'An ultra-cheap handheld that Tech Tactician describes as having a single analog stick. Check the current Amazon listing for the exact model, price and controls before you buy.' },
    'rg-rotate': { name: 'Anbernic RG Rotate', form: 'square', badge: 'Square Screen', price: '~$85', q: 'Anbernic RG Rotate', specs: [['Screen', '3.5" 1:1 IPS, 720×720'], ['Chip / RAM', 'UNISOC Tiger T618 / 3GB'], ['Battery', '2,000mAh'], ['Weight', '167g'], ['OS', 'Android 12'], ['Controls', 'No analog sticks (per Retro Dodo)'], ['Best for', 'Arcade and Game Boy']], verdict: 'A small, light handheld with a square screen that suits arcade and Game Boy games, with a D-pad and no sticks.' },
    'rg34xxsp': { name: 'Anbernic RG-34XXSP', form: 'clamshell', badge: 'Best Flip Overall', price: '~$67', q: 'Anbernic RG34XXSP', specs: [['Screen', '3.4" 3:2 IPS, 720×480, 110Hz'], ['Chip / RAM', 'Allwinner H700 / 2GB'], ['Battery', '3,300mAh'], ['Weight', '178g'], ['OS', 'Linux'], ['Best for', 'GBA and Game Gear']], verdict: 'A fold-up handheld with a sharp 3:2 screen and a 2GB chip, which Retro Catalog tags as a Staff Pick. Retro Dodo lists it with two Hall-effect sticks.' },
    'miyoo-flip': { name: 'Miyoo Flip', form: 'clamshell', badge: 'Best Flip for Dreamcast & N64', price: '~$78', q: 'Miyoo Flip', specs: [['Screen', '3.5" 4:3 IPS, 640×480'], ['Chip / RAM', 'Rockchip RK3566 / 1GB'], ['Battery', '3,000mAh'], ['Weight', '165g'], ['OS', 'Linux'], ['Best for', 'Dreamcast and N64']], verdict: 'A pocketable clamshell with a 4:3 screen that Retro Catalog tags as a Staff Pick and lists as best for Dreamcast and N64.' },
    'rp-flip2': { name: 'Retroid Pocket Flip 2', form: 'clamshell', badge: 'Most Powerful Flip', price: '~$190 to ~$220', q: 'Retroid Pocket Flip 2', specs: [['Screen', '5.5" 16:9 AMOLED, 1920×1080, 60Hz'], ['Chip', 'Dimensity 1100 (~$190) or Snapdragon 865 (~$220)'], ['RAM', '8GB'], ['Battery', '5,000mAh'], ['Weight', '300g'], ['OS', 'Android 13 (Snapdragon 865 also lists Linux)']], verdict: 'A flip-style Android handheld with a big 1080p AMOLED screen and 8GB of RAM, in two chip options. Retro Catalog lists both as best for PS2 and GameCube.' },
    'rg-sp': { name: 'Anbernic RG SP', form: 'clamshell', badge: 'Budget Flip', price: '~$65', q: 'Anbernic RG SP', specs: [['Screen', '3.4" 3:2 IPS, 720×480'], ['Chip / RAM', 'Allwinner H700 / 1GB'], ['Battery', '3,300mAh'], ['Weight', '168g'], ['OS', 'Linux'], ['Best for', 'GBA and Game Gear']], verdict: 'A light, affordable clamshell with a 3:2 screen, tagged a Staff Pick by Retro Catalog.' },
    'miyoo-mini-flip': { name: 'Miyoo Mini Flip', form: 'clamshell', badge: 'Smallest Flip', price: '~$60', q: 'Miyoo Mini Flip', specs: [['Screen', '2.8" 4:3 IPS, 750×560'], ['Chip / RAM', 'SigmaStar SSD202D / 128MB'], ['Battery', '2,500mAh'], ['Weight', '116g'], ['OS', 'Linux'], ['Best for', 'PS1 and SNES']], verdict: 'The lightest and smallest flip here at 116g, a simple pick for PS1 and SNES games.' }
  };
  const dcard = (d, id, rank) => `<section class="product" id="${id}">
  ${thumb(d)}
  <div>
    <div class="rank">#${rank}</div>
    <h3>${esc(d.name)}<span class="badge">${esc(d.badge)}</span></h3>
    <div class="price">${esc(d.price)}</div>
    <p>${esc(d.verdict)}</p>
    <ul class="specs">${d.specs.map(([k, v]) => `<li><b>${esc(k)}:</b> ${esc(v)}</li>`).join('')}</ul>
    ${buyBtn({ amazonQuery: d.q, asin: '', link: d.link })}
  </div>
</section>`;
  const entry = (id, rank) => (P[id] ? productCard(P[id], rank) : dcard(D[id], id, rank));
  const nm = (id) => (P[id] ? P[id].name : D[id].name);
  const pr = (id) => (P[id] ? P[id].price : D[id].price);
  const glance = (ids) => `<ul>${ids.map((id) => `<li><a href="#${id}">${esc(nm(id))}</a> (${esc(pr(id))})</li>`).join('')}</ul>`;
  const more = `<p>More handheld guides: <a href="/best-retro-handhelds-holiday-2026/">Top 10 Retro Handhelds</a>, <a href="/best-horizontal-retro-handhelds-2026/">Top 5 Horizontal</a>, <a href="/best-vertical-retro-handhelds-2026/">Top 5 Vertical</a>, <a href="/best-dual-joystick-retro-handhelds-2026/">Top 5 Dual-Joystick</a>, <a href="/best-single-joystick-retro-handhelds-2026/">Top 3 Single-Joystick</a>, <a href="/best-joystick-free-retro-handhelds-2026/">Top 5 Joystick-Free</a> and <a href="/best-flip-clamshell-retro-handhelds-2026/">Top 5 Flip Handhelds</a>. Add a card from our <a href="/best-microsd-cards-for-retro-handhelds-2026/">microSD card guide</a>.</p>`;
  const srcs = `<h2>Where this guide comes from</h2><p>We have not hands-on tested these devices. Specs and prices come from Retro Catalog's handheld database and published reviews, including <a href="https://retrododo.com/best-retro-handhelds/" rel="noopener" target="_blank">Retro Dodo</a> and <a href="https://retrocatalog.com/best-gaming-handhelds" rel="noopener" target="_blank">Retro Catalog</a>. Prices are approximate and change often, so check the current Amazon listing before you buy.</p>`;
  const mk = ({ slug, title, desc, pill, lead, ids, intro, kicker, blurb, extra }) => {
    const body = `<article>
<span class="pill">${esc(pill)}</span>
<h1>${esc(title)}</h1>
<p class="meta">Updated ${esc(cfg.updated)}</p>
<p class="lead">${lead}</p>
<h2>At a glance</h2>
${glance(ids)}
<h2>${esc(intro[0])}</h2>
<p>${intro[1]}</p>
<h2>Our ranked picks</h2>
${ids.map((id, i) => entry(id, i + 1)).join('\n')}
${extra}
${more}
${srcs}
${disclosureBox}
</article>`;
    posts.push({ slug, title, desc, body, blurb, kicker });
  };
  mk({
    slug: 'best-dual-joystick-retro-handhelds-2026',
    title: 'Top 5 Retro Handhelds with Dual Joysticks for Holiday 2026',
    desc: 'The best retro handhelds with two analog sticks for 2026: Android handhelds for PS2, GameCube, PSP and Dreamcast, with Hall-effect sticks. All on Amazon.',
    pill: 'DUAL JOYSTICK HANDHELDS',
    lead: 'If you want to play PSP, Dreamcast, GameCube, PS2 or Nintendo 64 games, you want two analog sticks. These are our top 5 retro handhelds with dual joysticks, from a budget Android pick to a Snapdragon 8 Gen 2 powerhouse, all sold on Amazon.',
    ids: ['pocket-air-mini', 'retroid-nova', 'retroid-pocket-6', 'rg477m', 'odin-2'],
    intro: ['Why dual joysticks matter', 'Many 3D games, from N64 to PS2 and GameCube, expect two analog sticks, one to move and one to aim the camera. A handheld with two sticks lets you play them the way they were designed. All five picks use Hall-effect sticks, which are designed to resist drift.'],
    kicker: 'TOP 5 DUAL-STICK', blurb: 'Five retro handhelds with two analog sticks, from the budget AYANEO Pocket Air Mini to the AYN Odin 2.',
    extra: '<h2>How to choose</h2><ul><li><b>Budget:</b> the Pocket Air Mini is the cheapest way in.</li><li><b>Power:</b> the Retroid Pocket Nova, Retroid Pocket 6 and AYN Odin 2 use a Snapdragon 8 Gen 2 chip for PS2 and GameCube.</li><li><b>Screen:</b> pick 4:3 for classic games or a large 16:9 screen for PSP and modern titles.</li></ul>'
  });
  mk({
    slug: 'best-single-joystick-retro-handhelds-2026',
    title: 'Top 3 Retro Handhelds with a Single Joystick for Holiday 2026',
    desc: 'The best retro handhelds with one analog stick for 2026: affordable picks for DS, arcade and classic games. All on Amazon.',
    pill: 'SINGLE JOYSTICK HANDHELDS',
    lead: 'A single analog stick is enough for DS games, arcade titles and 3D games that do not need a second stick, and it keeps the handheld small and cheap. Here are three retro handhelds with one joystick, all on Amazon.',
    ids: ['magicx-zero40', 'rg-ds-plus', 'sf2000'],
    intro: ['Single-stick handhelds', 'These devices have one analog stick instead of two. That suits Nintendo DS, PS1 and arcade games, but you will want a dual-stick handheld for games that need a second stick for the camera. See our <a href="/best-dual-joystick-retro-handhelds-2026/">dual-joystick picks</a>.'],
    kicker: 'TOP 3 SINGLE-STICK', blurb: 'Three retro handhelds with one analog stick, including the MagicX Zero 40 and Anbernic RG DS Plus.',
    extra: '<h2>Before you buy</h2><p>Stick counts and models vary by listing. Confirm the number of sticks on the Amazon product page before you order.</p>'
  });
  mk({
    slug: 'best-joystick-free-retro-handhelds-2026',
    title: 'Top 5 Joystick-Free Retro Handhelds for Holiday 2026',
    desc: 'The best retro handhelds with no analog sticks for 2026: D-pad-only handhelds for Game Boy, GBA, SNES, PS1 and arcade games. All on Amazon.',
    pill: 'JOYSTICK-FREE HANDHELDS',
    lead: 'No joystick, no problem. Classic 8-bit, 16-bit and Game Boy games were built for a D-pad, and handhelds without sticks stay small, light and cheap. Here are our top 5 joystick-free retro handhelds, all sold on Amazon.',
    ids: ['trimui-brick', 'rg35xx-plus', 'rg35xxsp', 'analogue-pocket', 'rg-rotate'],
    intro: ['Why choose a handheld without sticks', 'A D-pad-only handheld is smaller, lighter and usually cheaper. It is the best fit for Game Boy, GBA, NES, SNES and arcade games. If you also want N64, PSP or Dreamcast, see our <a href="/best-dual-joystick-retro-handhelds-2026/">dual-joystick picks</a>.'],
    kicker: 'TOP 5 NO-STICK', blurb: 'Five D-pad-only retro handhelds, from the TRIMUI Brick to the Analogue Pocket.',
    extra: ''
  });
  mk({
    slug: 'best-flip-clamshell-retro-handhelds-2026',
    title: 'Top 5 Flip (Clamshell) Retro Handhelds for Holiday 2026',
    desc: 'The best flip and clamshell retro handhelds for 2026: fold-up handhelds for GBA, SNES, PS1, Dreamcast, PS2 and more. All on Amazon.',
    pill: 'FLIP HANDHELDS',
    lead: 'A flip handheld folds shut to protect the screen and slips into a pocket, the same idea as the Game Boy Advance SP. Here are our top 5 flip (clamshell) retro handhelds on Amazon, from tiny budget pocket pals to a big-screen Android flip.',
    ids: ['rg34xxsp', 'miyoo-flip', 'rp-flip2', 'rg-sp', 'miyoo-mini-flip'],
    intro: ['Why choose a flip handheld', 'The hinged lid protects the screen in a bag or pocket, and the shape feels like the classic Game Boy Advance SP. Most flip handhelds are small and affordable. The Retroid Pocket Flip 2 adds a big AMOLED screen and Android power.'],
    kicker: 'TOP 5 FLIP', blurb: 'Five fold-up handhelds, from the budget Anbernic RG SP to the Android-powered Retroid Pocket Flip 2.',
    extra: ''
  });
}

// POSTS 11-12: Miyoo Flip vs RG35XXSP, best Game Boy-style handheld
{
  const q = (s) => `https://www.amazon.com/s?k=${encodeURIComponent(s)}&tag=${cfg.amazonTag}`;
  const abtn = (s) => `<a class="btn" href="${esc(q(s))}" target="_blank" rel="sponsored nofollow noopener">Check price on Amazon <small>→</small></a>`;
  const SP = P['rg35xxsp'];
  const links = `<p>More guides: <a href="/best-flip-clamshell-retro-handhelds-2026/">Top 5 Flip Handhelds</a>, <a href="/best-vertical-retro-handhelds-2026/">Top 5 Vertical Handhelds</a>, <a href="/best-joystick-free-retro-handhelds-2026/">Top 5 Joystick-Free Handhelds</a>, the <a href="/handhelds/">handheld database</a> and our <a href="/best-microsd-cards-for-retro-handhelds-2026/">microSD card guide</a>.</p>`;
  // Post: Miyoo Flip vs RG35XXSP
  {
    const slug = 'miyoo-flip-vs-anbernic-rg35xxsp';
    const title = 'Miyoo Flip vs Anbernic RG35XXSP: Which Flip Handheld Should You Buy?';
    const desc = 'Miyoo Flip vs Anbernic RG35XXSP compared: price, screen, chip, battery, which systems each plays best and who should buy which GBA SP-style flip handheld.';
    const body = `<article>
<span class="pill">COMPARISON</span>
<h1>${esc(title)}</h1>
<p class="meta">Updated ${esc(cfg.updated)}</p>
<p class="lead">The Miyoo Flip and the Anbernic RG35XXSP are two of the most popular flip handhelds, both shaped like the Game Boy Advance SP and priced under $100. They look alike, but they are better at different things. Here is how they compare, and which one to buy.</p>
<p><b>Short answer:</b> buy the <a href="#rg35xxsp">Anbernic RG35XXSP</a> if you want the safe, well-reviewed pick for GBA, SNES and PS1 games with HDMI out, and the <a href="#miyoo-flip">Miyoo Flip</a> if you want the extra power for N64 and Dreamcast games.</p>

<h2>Miyoo Flip vs RG35XXSP at a glance</h2>
<div class="tablewrap"><table>
<tr><th></th><th>Miyoo Flip</th><th>Anbernic RG35XXSP</th></tr>
<tr><td>Price</td><td>About $78</td><td>About $65</td></tr>
<tr><td>Screen</td><td>3.5" 4:3 IPS, 640×480</td><td>3.5" IPS, 640×480</td></tr>
<tr><td>Chip / RAM</td><td>Rockchip RK3566 / 1GB</td><td>Allwinner H700 / 1GB</td></tr>
<tr><td>Battery</td><td>3,000mAh</td><td>3,300mAh</td></tr>
<tr><td>Weight</td><td>165g</td><td>Check the listing</td></tr>
<tr><td>Operating system</td><td>Linux</td><td>Linux</td></tr>
<tr><td>Listed as best for</td><td>Dreamcast and N64</td><td>GBA, SNES, PS1, some Dreamcast</td></tr>
<tr><td>Extras</td><td>Tagged a Staff Pick by Retro Catalog</td><td>HDMI out, Wi-Fi, Bluetooth, microSD up to 512GB</td></tr>
</table></div>

<section class="product" id="miyoo-flip"><div class="thumb">${icon('clamshell')}</div><div>
<h3>Miyoo Flip <span class="badge">More Power</span></h3>
<p class="price">About $78</p>
<p>The Miyoo Flip uses a Rockchip RK3566 chip, which Retro Catalog lists as best for Dreamcast and N64 games. It weighs about 165g, so it fits easily in a pocket, and Retro Catalog tags it as a Staff Pick.</p>
<ul class="specs"><li><b>Screen:</b> 3.5" 4:3 IPS, 640×480</li><li><b>Chip / RAM:</b> Rockchip RK3566 / 1GB</li><li><b>Battery:</b> 3,000mAh</li><li><b>Weight:</b> 165g</li></ul>
<p><b>Choose it if:</b> you want a flip handheld that is a step up for N64 and Dreamcast.</p>
${abtn('Miyoo Flip')}</div></section>

<section class="product" id="rg35xxsp">${thumb(SP)}<div>
<h3>Anbernic RG35XXSP <span class="badge">Safe Pick</span></h3>
<p class="price">${esc(SP.price)}</p>
<p>${esc(SP.verdict)}</p>
<ul class="specs">${SP.specs.map(([k, v]) => `<li><b>${esc(k)}:</b> ${esc(v)}</li>`).join('')}</ul>
<p><b>Choose it if:</b> you want a proven, well-reviewed SP-style handheld at the lower price, with HDMI out for the TV.</p>
${buyBtn(SP)}</div></section>

<h2>Which should you buy?</h2>
<ul>
<li><b>Buy the RG35XXSP</b> for GBA, SNES and PS1 games, HDMI out, a slightly bigger battery and the lower price.</li>
<li><b>Buy the Miyoo Flip</b> if you want more headroom for N64 and Dreamcast.</li>
<li><b>Either way,</b> add a microSD card. See our <a href="/best-microsd-cards-for-retro-handhelds-2026/">microSD card guide</a>.</li>
</ul>

${faqBlock([
  ['Is the Miyoo Flip better than the RG35XXSP?', 'It depends on the games. The Miyoo Flip is listed as best for Dreamcast and N64, and the RG35XXSP is the safer pick for GBA, SNES and PS1.'],
  ['Which is cheaper, the Miyoo Flip or the RG35XXSP?', 'The RG35XXSP, at about $65 compared with about $78 for the Miyoo Flip. Prices change, so check Amazon.'],
  ['Do both fold shut like the Game Boy Advance SP?', 'Yes. Both are flip (clamshell) handhelds with a hinged lid that protects the screen.'],
  ['Do I need a microSD card?', 'Yes. Both use microSD cards for games and saves.']
])}
${links}
<h2>Where this comparison comes from</h2>
<p>We have not hands-on tested these devices. This comparison uses published specs and reviews, including <a href="https://retrocatalog.com" rel="noopener" target="_blank">Retro Catalog</a> and <a href="https://www.gamesradar.com/hardware/retro/best-retro-handheld/" rel="noopener" target="_blank">GamesRadar</a>. Prices and availability change, so check the current Amazon listing.</p>
${disclosureBox}
</article>`;
    posts.push({ slug, title, desc, body, blurb: 'Two popular GBA SP-style flip handhelds compared on price, power and the games each plays best.', kicker: 'COMPARISON' });
  }
  // Post: best Game Boy-style handheld
  {
    const slug = 'best-game-boy-style-handhelds-2026';
    const title = 'Best Game Boy-Style Handhelds to Buy in 2026';
    const desc = 'The best Game Boy-style retro handhelds in 2026: pocket-sized vertical and flip handhelds for Game Boy, GBA, SNES and PS1 games, plus one that plays real cartridges.';
    const ids = ['trimui-brick', 'rg35xx-plus', 'rg35xxsp', 'analogue-pocket'];
    const body = `<article>
<span class="pill">GAME BOY-STYLE HANDHELDS</span>
<h1>${esc(title)}</h1>
<p class="meta">Updated ${esc(cfg.updated)}</p>
<p class="lead">Want the Game Boy feel, with a backlit screen and a battery that lasts? Game Boy-style handhelds are small, light and affordable, and they play Game Boy, Game Boy Color, Game Boy Advance, SNES and PS1 games. Here are the best Game Boy-style handhelds you can buy on Amazon, from a tiny pocket pick to one that plays your real cartridges.</p>
<p>Short on time? <a href="#trimui-brick">The TRIMUI Brick</a> is the best pocket pick, <a href="#rg35xx-plus">the Anbernic RG35XX Plus</a> is the budget classic, <a href="#rg35xxsp">the RG35XXSP</a> is the best GBA SP-style flip, and <a href="#analogue-pocket">the Analogue Pocket</a> is the one for real cartridges.</p>

<h2>Game Boy-style handhelds at a glance</h2>
${compareTable(ids)}

<h2>What makes a handheld Game Boy-style?</h2>
<p>These devices copy the classic shapes: a tall pocket-sized body with a D-pad and buttons below the screen (like the original Game Boy), or a fold-up flip design (like the Game Boy Advance SP). They are cheap, easy to carry, and built for 8-bit, 16-bit and handheld classics. They do not have analog sticks, so for N64, PSP or PS2 games look at our <a href="/best-dual-joystick-retro-handhelds-2026/">dual-joystick handhelds</a>.</p>

<h2>Ranked: the best Game Boy-style handhelds</h2>
${ids.map((id, i) => productCard(P[id], i + 1)).join('\n')}

<h2>How to choose</h2>
<ul>
<li><b>Original Game Boy shape:</b> the TRIMUI Brick and the RG35XX Plus.</li>
<li><b>Game Boy Advance SP shape:</b> the RG35XXSP. For a faster flip, see <a href="/miyoo-flip-vs-anbernic-rg35xxsp/">Miyoo Flip vs RG35XXSP</a>.</li>
<li><b>Real cartridges:</b> the Analogue Pocket plays original Game Boy, Game Boy Color and Game Boy Advance cartridges.</li>
<li><b>Games and storage:</b> most emulation handhelds ship without games, so you supply backups of games you own. Add a microSD card from our <a href="/best-microsd-cards-for-retro-handhelds-2026/">microSD card guide</a>.</li>
</ul>

${faqBlock([
  ['What is the best Game Boy-style handheld?', 'For most people, the <a href="#trimui-brick">TRIMUI Brick</a>. It has a sharp screen, a simple operating system and a pocket-friendly size.'],
  ['What is the best Game Boy-style handheld for real cartridges?', 'The <a href="#analogue-pocket">Analogue Pocket</a>. It plays original Game Boy, Game Boy Color and Game Boy Advance cartridges.'],
  ['What is the cheapest Game Boy-style handheld?', 'The <a href="#rg35xx-plus">Anbernic RG35XX Plus</a> is one of the cheapest solid options, often around $50 to $70.'],
  ['Is there a Game Boy Advance SP-style handheld?', 'Yes, the <a href="#rg35xxsp">Anbernic RG35XXSP</a> folds shut like the GBA SP.']
])}
${links}
${sourcesBlock()}
${disclosureBox}
</article>`;
    posts.push({ slug, title, desc, body, blurb: 'Pocket-sized Game Boy and GBA SP-style handhelds ranked, plus one that plays real cartridges.', kicker: 'GAME BOY-STYLE' });
  }
}

// ---------- Static pages ----------
const aboutBody = `<article><h1>About ${esc(cfg.siteName)}</h1>
<p class="lead">Pixel Pocket Guides helps you pick the right retro gaming handheld without wading through hundreds of near-identical devices.</p>
<p>We write buying guides based on published reviews and testing from established handheld review sites, and we only recommend products you can buy on Amazon. We say clearly when a pick is based on others' testing rather than our own.</p>
<p>The site is supported by Amazon affiliate commissions. See our <a href="/affiliate-disclosure/">affiliate disclosure</a>. Questions or corrections: <a href="mailto:${esc(cfg.contactEmail)}">${esc(cfg.contactEmail)}</a>.</p></article>`;

const disclosureBody = `<article><h1>Affiliate Disclosure</h1>
<p><b>${DISCLOSURE}</b></p>
<p>${esc(cfg.siteName)} is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. When you click a link to Amazon on this site and make a qualifying purchase, we may earn a commission at no extra cost to you.</p>
<p>Some links on this site go to AliExpress. If you buy through one of those links, we may also earn a commission from AliExpress at no extra cost to you. These links are marked as sponsored.</p>
<p>Commissions do not change what we recommend or how we rank products. Prices and availability on Amazon change at any time, so please check the Amazon listing for current information.</p></article>`;

const privacyBody = `<article><h1>Privacy Policy</h1>
<p>Last updated ${esc(cfg.updated)}.</p>
<p>${esc(cfg.siteName)} is a static website. We do not ask you to create an account, and we do not collect personal information through forms.</p>
<p><b>Hosting and analytics.</b> The site is delivered through Cloudflare, which may process technical data such as IP addresses to deliver pages and protect the site. If we add privacy-friendly analytics, we will list it here.</p>
<p><b>Third-party links.</b> Links to Amazon and other sites are governed by those sites' own privacy policies. Amazon may use cookies to attribute purchases to our affiliate account.</p>
<p><b>Fonts.</b> We load a font from Google Fonts, which may receive your IP address when it serves the font file.</p>
<p>Contact: <a href="mailto:${esc(cfg.contactEmail)}">${esc(cfg.contactEmail)}</a>.</p></article>`;

const homeBody = `<section class="hero">
<span class="pill">HOLIDAY 2026 GUIDES</span>
<h1>Find the right retro handheld.</h1>
<p>Honest buying guides for retro gaming handhelds, at every price point. Every pick is available on Amazon.</p>
</section>
<div class="cards">
${posts.map((p) => `<a class="postcard" href="/${p.slug}/"><span class="pill">${esc(p.kicker)}</span><h2>${esc(p.title)}</h2><p>${esc(p.blurb)}</p></a>`).join('\n')}
</div>
<div class="disclosure">${DISCLOSURE} <a href="/affiliate-disclosure/">Learn more</a>.</div>`;

// ---------- How-to guides (Guides tab) ----------
const guides = [
  {
    slug: 'gen1recomp-on-handhelds',
    title: 'Getting Started with Gen1Recomp on a Handheld',
    desc: 'What Gen1Recomp is, what you need to run it, and which platforms it supports, with a link to the project’s own FAQ.',
    blurb: 'What Gen1Recomp is, what you need to run it, and where to find the official setup details.',
    kicker: 'SETUP GUIDE',
    source: 'https://gen1recomp.com/faq/',
    sourceName: 'the Gen1Recomp FAQ',
    body: `<p class="lead">Gen1Recomp is an unofficial fan project that recreates classic Pokémon games to run natively, rather than as a standard Game Boy emulator. It is not affiliated with Nintendo, Game Freak or The Pokémon Company.</p>
<h2>Quick overview</h2>
<ul>
<li><b>You need your own game file.</b> The project does not include or link to game files. You import a compatible US copy that you made from a cartridge you own, and the app only accepts specific versions.</li>
<li><b>Platforms:</b> the project's FAQ lists guides and builds for Windows, Mac, Android and Linux, plus homebrew builds for Nintendo Switch and PlayStation 4.</li>
<li><b>Anbernic RG34XX SP:</b> reportedly the only dedicated retro handheld with an official build, and only on the stock OS using PortMaster.</li>
<li><b>Android handhelds:</b> install the app and play with touch or a controller.</li>
<li><b>Steam Deck and Windows handhelds:</b> the best choice if you want the optional 3D, first-person or VR mods.</li>
<li><b>Custom firmware:</b> reportedly not supported on muOS, KNULLI, ArkOS and ROCKNIX, or on most other cheap Linux handhelds.</li>
<li><b>Check before you install.</b> The device notes above come from community reports and the project's own FAQ does not list them, so confirm your exact device before you buy or install anything.</li>
<li><b>Availability is not a guarantee.</b> The project notes that a download existing does not mean every OS version, GPU, controller or firmware is supported.</li>
</ul>
<h2>Read the official details</h2>
<p>Install steps, supported games and platform guides change as the project updates, so go to the source before you install.</p>
<p><a class="btn" href="__SOURCE__" target="_blank" rel="noopener">Open __SOURCENAME__ <small>→</small></a></p>
<p class="meta">Looking for a handheld to run it on? See our <a href="/best-retro-handhelds-holiday-2026/">Top 10 Retro Handhelds</a>.</p>`
  }
];

const guidesIndexBody = `<section class="hero">
<span class="pill">GUIDES</span>
<h1>Setup guides</h1>
<p>Practical how-tos for getting the most out of your retro handheld.</p>
</section>
<div class="cards">
${posts.filter((p) => p.slug === 'best-microsd-cards-for-retro-handhelds-2026').map((p) => `<a class="postcard" href="/${p.slug}/"><span class="pill">GUIDE</span><h2>${esc(p.title)}</h2><p>${esc(p.blurb)}</p></a>`).join('\n')}
${guides.map((g) => `<a class="postcard" href="/guides/${g.slug}/"><span class="pill">${esc(g.kicker)}</span><h2>${esc(g.title)}</h2><p>${esc(g.blurb)}</p></a>`).join('\n')}
</div>
<div class="disclosure">${DISCLOSURE} <a href="/affiliate-disclosure/">Learn more</a>.</div>`;

// Blog-style home page: the newest post opens in full, with the other posts and guides listed below.
// Newest first: sort by each post's optional "date" (YYYY-MM-DD); posts with the same date go newest-added first.
// Scheduled posts: each appears once its time in data/schedule.json has passed.
{
  const sp = path.join(root, 'data', 'schedule.json');
  const schedule = fs.existsSync(sp) ? JSON.parse(fs.readFileSync(sp, 'utf8')) : {};
  for (const p of makePosts({ root, cfg, esc, disclosureBox })) {
    const at = schedule[p.slug];
    if (!at || Date.parse(at) > Date.now()) continue;
    p.at = at; p.date = new Date(at).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    posts.push(p);
  }
}
const ordered = posts.map((p, i) => ({ ...p, _i: i })).sort((a, b) => (b.at || b.date || '2026-11-10').localeCompare(a.at || a.date || '2026-11-10') || b._i - a._i);
const fmtDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const SM = slugMap(root);
const PV = {
  'best-retro-handhelds-holiday-2026': ['Anbernic RG Cube', 3],
  'retro-handheld-buying-guide-by-price-2026': ['Retroid Pocket Classic', 2],
  'best-vertical-retro-handhelds-2026': ['TRIMUI Brick', 3],
  'best-horizontal-retro-handhelds-2026': ['AYANEO Pocket Air Mini', 1],
  'best-microsd-cards-for-retro-handhelds-2026': ['Anbernic RG 35', 4],
  'steam-deck-still-a-beast-2026': ['Valve Steam Deck OLED', 2],
  'best-dual-joystick-retro-handhelds-2026': ['Retroid Pocket Nova', 1],
  'best-single-joystick-retro-handhelds-2026': ['Anbernic RG DS', 4],
  'best-joystick-free-retro-handhelds-2026': ['Anbernic RG-35XX Plus', 4],
  'best-flip-clamshell-retro-handhelds-2026': ['Retroid Pocket Flip 2 SD865', 2],
  'miyoo-flip-vs-anbernic-rg35xxsp': ['Miyoo Flip', 1],
  'best-game-boy-style-handhelds-2026': ['TRIMUI Brick Hammer', 4],
  'best-dual-screen-android-handhelds-2026': ['AYN Thor', 4],
  'best-retro-handheld-gifts-under-100-2026': ['Anbernic RG SP', 2],
  'anbernic-retro-handheld-lineup-2026': ['Anbernic RG Vita', 2],
  'nintendo-switch-2-vs-rog-xbox-ally-x-vs-legion-go-2': ['Nintendo Switch 2', 1],
  'best-android-handhelds-under-250-2026': ['Retroid Pocket G2', 1],
  'retroid-pocket-6-vs-ayn-odin-3': ['Retroid Pocket 6', 1],
  'best-large-screen-android-handhelds-2026': ['AYN Odin 2 Portal', 5],
  'handhelds-with-the-biggest-batteries-2026': ['AYANEO Pocket S2', 1],
  'best-new-vertical-handhelds-2026': ['Anbernic RG Rotate', 4]
};
const previews = {};
for (const [slug, [name, n]] of Object.entries(PV)) {
  const rel = `/img/d/${SM[name]}/${n}.webp`;
  if (!fs.existsSync(path.join(root, 'static', rel))) throw new Error('Missing preview image ' + rel);
  previews[slug] = rel;
}
{ const used = Object.values(previews); if (new Set(used).size !== used.length) throw new Error('Duplicate preview image'); }
const entryCard = (p, i) => `<article class="entry${i === 0 ? ' lead-entry' : ''}"><a class="entry-img" href="/${p.slug}/" aria-label="${esc(p.title)}">${previews[p.slug] ? `<img src="${esc(previews[p.slug])}" alt="${esc(p.title)}" width="640" height="640" loading="${i < 2 ? 'eager' : 'lazy'}">` : '<span class="entry-ph">PIXEL POCKET</span>'}</a><div class="entry-body"><span class="pill">${esc(p.kicker)}</span><h2><a href="/${p.slug}/">${esc(p.title)}</a></h2><p class="meta">${fmtDate(p.date || '2026-11-10')}</p><p>${esc(p.blurb || p.desc)}</p><p><a class="more" href="/${p.slug}/">Read the full guide →</a></p></div></article>`;
const blogHome = `<section class="hero hero-modern">
<h1>Retro handheld buying guides</h1>
<p class="tagline">Find the right handheld faster with ranked picks, clear specs and side-by-side comparisons.</p>
</section>
<div class="sec-head"><span class="pill">LATEST</span><span class="sec-line"></span></div>
<div class="feed">
${ordered.map(entryCard).join('\n')}
</div>
<div class="disclosure">${DISCLOSURE} <a href="/affiliate-disclosure/">Learn more</a>.</div>`;

// ---------- Write everything ----------
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.cpSync(path.join(root, 'static'), out, { recursive: true });

const write = (rel, html) => {
  const dir = path.join(out, rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
};
const published = '2026-11-10';
write('', page({ title: `${cfg.siteName}: Retro Handheld Buying Guides`, desc: 'Honest buying guides for retro gaming handhelds at every price point, all available on Amazon.', url: '/', body: blogHome }));
for (const p of posts) write(p.slug, page({ title: `${p.title} | ${cfg.siteName}`, desc: p.desc, url: `/${p.slug}/`, body: p.body, type: 'article', datePublished: p.date || published, image: previews[p.slug] || null }));
write('guides', page({ title: `Setup Guides | ${cfg.siteName}`, desc: 'Practical setup guides for retro gaming handhelds.', url: '/guides/', body: guidesIndexBody }));
for (const g of guides) {
  const gbody = `<article><span class="pill">${esc(g.kicker)}</span><h1>${esc(g.title)}</h1><p class="meta">Updated ${esc(cfg.updated)}</p>${g.body.replace('__SOURCE__', esc(g.source)).replace('__SOURCENAME__', esc(g.sourceName))}</article>`;
  write(`guides/${g.slug}`, page({ title: `${g.title} | ${cfg.siteName}`, desc: g.desc, url: `/guides/${g.slug}/`, body: gbody, type: 'article', datePublished: published }));
}
const hhData = JSON.parse(fs.readFileSync(path.join(root, 'data', 'handhelds.json'), 'utf8'));
const slugify = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
{ const seen = {}; for (const d of hhData) { let s = slugify(d.name), n = 2; while (seen[s]) s = `${slugify(d.name)}-${n++}`; seen[s] = 1; d.slug = s; } }
for (const d of hhData) { const dir = path.join(root, 'static', 'img', 'd', d.slug); if (fs.existsSync(path.join(dir, 'icon.webp'))) d.img = 1; if (fs.existsSync(dir)) d.n = fs.readdirSync(dir).filter((f) => /^\d+\.webp$/.test(f)).length; }
const hhBody = `<div class="hh-head"><div><span class="pill">DATABASE</span><h1>Retro Handheld Database</h1></div></div>
<p class="meta" style="margin:0 0 8px">Search ${hhData.length} handhelds, filter by specs and compare prices. Buttons search Amazon, and not every device is sold there, so check the listing.</p>
<div class="hh-bar">
<input type="search" id="hh-q" placeholder="Search handhelds, brands, chips…" aria-label="Search handhelds" autocomplete="off">
<div class="hh-views" role="group" aria-label="Layout"><button type="button" class="hh-btn" data-view="full" aria-pressed="true">Full</button><button type="button" class="hh-btn" data-view="recap" aria-pressed="false">Recap</button><button type="button" class="hh-btn" data-view="preview" aria-pressed="false">Preview</button></div>
<select id="hh-sort" aria-label="Sort"></select>
<button type="button" class="hh-btn" id="hh-filter-btn">Filter</button>
</div>
<div class="hh-meta"><span id="hh-count"></span><span id="hh-active"></span><button type="button" class="hh-clear" id="hh-reset">Reset</button></div>
<div id="hh-list" class="hh-list hh-full"></div>
<button type="button" class="hh-more" id="hh-more">Show more</button>
<p class="hh-note">* Upcoming or recently announced. Specs and prices are approximate and come from Retro Catalog's handheld database (<a href="https://retrocatalog.com" rel="noopener" target="_blank">retrocatalog.com</a>). Pictures are placeholders. Check the current Amazon listing before you buy.</p>
${disclosureBox}
<button type="button" id="hh-scrim" aria-label="Close filters"></button>
<aside id="hh-panel" aria-label="Filters"><div class="hh-ph"><b>Filters</b><button type="button" id="hh-close" aria-label="Close">×</button></div><div id="hh-panel-body"></div></aside>`;
const hhScripts = `<script id="hh-data" type="application/json">${JSON.stringify({ tag: cfg.amazonTag, devices: hhData }).replace(/</g, '\\u003c')}</script><script src="/handhelds.js" defer></script>`;
// ---- device detail pages ----
const devIcon = (d, eager) => {
  if (d.img) return `<img src="/img/d/${d.slug}/icon.webp" alt="${esc(d.name)} handheld" width="480" height="360"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
  const f = d.form[0] || 'Horizontal', big = d.size.includes('Big'), s = '#0d0f1f', c = '#e9ecff';
  if (f === 'Vertical' || f === 'Micro') return `<svg viewBox="0 0 80 110" role="img" aria-label="${esc(d.name)}"><rect x="14" y="4" width="52" height="102" rx="10" fill="${c}"/><rect x="22" y="12" width="36" height="40" rx="3" fill="${s}"/><rect x="27" y="68" width="14" height="4" fill="${s}"/><rect x="32" y="63" width="4" height="14" fill="${s}"/><circle cx="52" cy="66" r="3.5" fill="${s}"/><circle cx="58" cy="74" r="3.5" fill="${s}"/></svg>`;
  if (f === 'Clamshell') return `<svg viewBox="0 0 120 90" role="img" aria-label="${esc(d.name)}"><rect x="14" y="4" width="92" height="40" rx="8" fill="${c}"/><rect x="26" y="10" width="68" height="28" rx="2" fill="${s}"/><rect x="14" y="48" width="92" height="38" rx="8" fill="${c}" opacity=".85"/><rect x="26" y="62" width="14" height="4" fill="${s}"/><rect x="31" y="57" width="4" height="14" fill="${s}"/><circle cx="84" cy="62" r="3.5" fill="${s}"/><circle cx="92" cy="68" r="3.5" fill="${s}"/></svg>`;
  if (f === 'Dual-Screen') return `<svg viewBox="0 0 100 120" role="img" aria-label="${esc(d.name)}"><rect x="12" y="4" width="76" height="52" rx="8" fill="${c}"/><rect x="22" y="10" width="56" height="40" rx="2" fill="${s}"/><rect x="12" y="62" width="76" height="52" rx="8" fill="${c}"/><rect x="22" y="68" width="56" height="40" rx="2" fill="${s}"/></svg>`;
  return `<svg viewBox="0 0 160 90" role="img" aria-label="${esc(d.name)}"><rect x="${big ? 4 : 10}" y="12" width="${big ? 152 : 140}" height="66" rx="22" fill="${c}"/><rect x="${big ? 36 : 40}" y="18" width="${big ? 88 : 80}" height="54" rx="3" fill="${s}"/><rect x="${big ? 15 : 20}" y="42" width="14" height="4" fill="${s}"/><rect x="${big ? 20 : 25}" y="37" width="4" height="14" fill="${s}"/><circle cx="136" cy="40" r="3.5" fill="${s}"/><circle cx="143" cy="47" r="3.5" fill="${s}"/></svg>`;
};
const carousel = (d) => {
  if (!d.n) return `<div class="hh-img dv-img">${devIcon(d, true)}</div>`;
  const slides = [`<div class="car-s on">${devIcon(d, true)}</div>`, ...Array.from({ length: d.n }, (_, i) => `<div class="car-s"><img src="/img/d/${d.slug}/${i + 1}.webp" alt="${esc(d.name)} photo ${i + 1}" width="640" height="640" loading="lazy" decoding="async"></div>`)];
  return `<div class="hh-img dv-img car" data-car role="region" aria-roledescription="carousel" aria-label="${esc(d.name)} photos">
  <div class="car-view">${slides.join('')}</div>
  <button type="button" class="car-b car-prev" aria-label="Previous photo">&#8249;</button><button type="button" class="car-b car-next" aria-label="Next photo">&#8250;</button>
  <div class="car-dots">${slides.map((_, i) => `<button type="button" class="car-d${i ? '' : ' on'}" aria-label="Show photo ${i + 1}"></button>`).join('')}</div></div>`;
};
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const relText = (d) => (d.upcoming ? 'Upcoming *' : `${MON[+d.released.split('-')[1] - 1]}. ${d.released.split('-')[0]}`);
const dvKv = (rows) => `<dl class="hh-kv">${rows.filter((r) => r[1] && r[1] !== '?').map((r) => `<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl>`;
const brandCount = {}; for (const d of hhData) brandCount[d.brand] = (brandCount[d.brand] || 0) + 1;
const brandHref = (b) => (brandCount[b] > 1 ? `/handhelds/brand/${slugify(b)}/` : `/handhelds/?brand=${encodeURIComponent(b)}`);
const fq = (k, v) => `/handhelds/?${k}=${encodeURIComponent(v)}`;
const tagA = (k, v) => `<a class="hh-tag" href="${esc(fq(k, v))}" title="Show all ${esc(v)} handhelds">${esc(v)}</a>`;
const dvNameLink = (d) => (d.name.startsWith(d.brand) ? `<a class="hh-brand" href="${esc(brandHref(d.brand))}" title="See all ${esc(d.brand)} handhelds">${esc(d.brand)}</a> ${esc(d.name.slice(d.brand.length).trim())}` : esc(d.name));
const dvName = (d) => (d.name.startsWith(d.brand) ? `<span class="hh-brand">${esc(d.brand)}</span> ${esc(d.name.slice(d.brand.length).trim())}` : esc(d.name));
const dvAmazon = (d) => (d.asin ? `https://www.amazon.com/dp/${d.asin}?tag=${cfg.amazonTag}` : `https://www.amazon.com/s?k=${encodeURIComponent(d.name + ' handheld')}&tag=${cfg.amazonTag}`);
const dvAli = (d) => d.ali || `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(d.name + ' handheld')}`;
const similar = (d) => hhData.filter((x) => x !== d).map((x) => {
  let sc = 0;
  if (x.form[0] === d.form[0]) sc += 3;
  if (x.os[0] === d.os[0]) sc += 2;
  if (x.brand === d.brand) sc += 1;
  if (x.cat.some((c) => d.cat.includes(c))) sc += 1;
  sc -= Math.abs(Math.log((x.price || 100) / (d.price || 100))) * 3;
  return [sc, x];
}).sort((a, b) => b[0] - a[0]).slice(0, 6).map((p) => p[1]);
for (const d of hhData) {
  const sim = similar(d);
  const tags = [...d.form.map((t) => tagA('form', t)), ...d.size.map((t) => tagA('size', t)), ...d.os.map((t) => tagA('os', t)), ...d.cat.map((t) => tagA('cat', t))];
  const sameBrand = hhData.filter((x) => x.brand === d.brand).length;
  const body = `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/handhelds/">Handhelds</a> / <a href="${esc(brandHref(d.brand))}">${esc(d.brand)}</a> / ${esc(d.name)} Specs</nav>
<div class="dv">
<aside class="dv-side">
  <h1 class="hh-title">${dvNameLink(d)}</h1>
  ${carousel(d)}
  <a class="btn hh-buy dv-buy" href="${esc(dvAmazon(d))}" target="_blank" rel="sponsored nofollow noopener">${d.asin ? 'View on Amazon' : 'Check price on Amazon'} <small>→</small></a>
  <a class="btn btn2 dv-buy dv-ali" href="${esc(dvAli(d))}" target="_blank" rel="nofollow noopener">${d.ali ? 'View on AliExpress' : 'Search on AliExpress'} <small>→</small></a>
  <a class="btn dv-cmp" href="/compare/?a=${d.slug}">Compare with another handheld</a>
  <div class="dv-box">${dvKv([['Released', relText(d)], ['OS', d.osText], ['Screen', d.screen], ['Best for', d.best.join(', ')], ['Price', d.priceText]])}</div>
  <h2 class="dv-sim">Similar Handhelds</h2>
  ${sim.map((x) => `<a class="hh-row" href="/handhelds/${x.slug}/"><span class="hh-rimg">${devIcon(x)}</span><span class="hh-rmain"><b>${dvName(x)}</b><span class="hh-rtags">${x.os.concat(x.form).slice(0, 2).map((t) => `<span class="hh-tag">${esc(t)}</span>`).join('')}</span></span><span class="hh-rside"><b class="hh-price">${esc(x.priceText)}</b></span></a>`).join('\n')}
</aside>
<div class="dv-main">
  ${d.accessories ? `<section class="dv-panel"><h2>Accessories</h2><ul class="acc">${d.accessories.map((a) => `<li><a href="${esc(a.url)}" target="_blank" rel="sponsored nofollow noopener">${esc(a.title)}</a><span>${esc(a.store)}${a.price ? ` · ${esc(a.price)}` : ''}</span></li>`).join('')}</ul><p class="hh-note">Sponsored link. Prices change, so check the listing.</p></section>` : ''}
  <section class="dv-panel"><h2>Best for</h2><div class="hh-tags">${d.best.map((t) => tagA('best', t)).join('')}</div></section>
  <section class="dv-panel"><h2>Screen</h2>${dvKv([['Aspect ratio', d.aspect], ['Screen size', d.screenIn ? `${d.screenIn}"` : ''], ['Resolution', d.res], ['Refresh rate', d.hz ? `${d.hz} Hz` : ''], ['Screen type', d.panel], ['Pixel density', d.ppi]])}</section>
  <section class="dv-panel"><h2>Build and Ergonomics</h2>${dvKv([['Material', d.material], ['Weight', d.weight ? `${d.weight} g` : ''], ['Speaker placement', d.speaker], ['Charge port', d.charge]])}</section>
  <section class="dv-panel"><h2>Controls</h2>${dvKv([['Shoulder button layout', d.shoulder], ['Additional controls', d.controls]])}</section>
  <section class="dv-panel"><h2>Technical Specs</h2>${dvKv([['Storage', d.storage], ['Battery', d.battery ? `${d.battery.toLocaleString('en-US')} mAh` : ''], ['RAM', d.ram], ['RAM type', d.ramType], ['Architecture', d.arch], ['Chipset', d.chip], ['CPU', d.cpu], ['GPU', d.gpu]])}<div class="hh-tags dv-tags">${tags.join('')}</div>${sameBrand > 1 ? `<p class="dv-brandlink"><a class="more" href="${esc(brandHref(d.brand))}">See all ${sameBrand} ${esc(d.brand)} handhelds →</a></p>` : ''}</section>
  <p class="hh-note">* Upcoming or recently announced. Specs and prices are approximate and come from Retro Catalog's handheld database (<a href="https://retrocatalog.com" rel="noopener" target="_blank">retrocatalog.com</a>). Not every device is sold on Amazon, so the button searches Amazon for it. Check the current listing before you buy.</p>
  ${disclosureBox}
</div>
</div>`;
  write(`handhelds/${d.slug}`, page({ title: `${d.name} Specs, Price and Release Date | ${cfg.siteName}`, desc: `${d.name} specs: ${d.screen} screen, ${d.chip || d.osText}, ${d.battery ? d.battery.toLocaleString('en-US') + ' mAh battery, ' : ''}${d.priceText}. Best for ${d.best.join(', ') || 'retro games'}.`, url: `/handhelds/${d.slug}/`, body, wide: true, image: d.img ? `/img/d/${d.slug}/icon.webp` : null, scripts: d.n ? '<script src="/car.js" defer></script>' : '', crumbs: [['Home', '/'], ['Handhelds', '/handhelds/'], [d.name, `/handhelds/${d.slug}/`]], product: { '@type': 'Product', ...(d.img ? { image: [`${cfg.domain}/img/d/${d.slug}/icon.webp`] } : {}), name: d.name, brand: { '@type': 'Brand', name: d.brand }, category: 'Retro gaming handheld', description: `${d.name}: ${d.screen} screen, ${d.chip || d.osText}. Best for ${d.best.join(', ') || 'retro games'}.` } }));
}

// ---- brand pages ----
const brandRow = (x) => `<a class="hh-row" href="/handhelds/${x.slug}/"><span class="hh-rimg">${devIcon(x)}</span><span class="hh-rmain"><b>${dvName(x)}</b><span class="hh-rtags">${x.form.concat(x.os, x.cat).map((t) => `<span class="hh-tag">${esc(t)}</span>`).join('')}</span></span><span class="hh-rside"><b class="hh-price">${esc(x.priceText)}</b><span>${esc(relText(x))}</span></span></a>`;
const brands = Object.keys(brandCount).filter((b) => brandCount[b] > 1).sort((a, b) => brandCount[b] - brandCount[a] || a.localeCompare(b));
for (const b of brands) {
  const list = hhData.filter((d) => d.brand === b).sort((x, y) => y.released.localeCompare(x.released) || x.name.localeCompare(y.name));
  const prices = list.map((d) => d.price).filter(Boolean);
  const osList = [...new Set(list.flatMap((d) => d.os))];
  const forms = [...new Set(list.flatMap((d) => d.form))];
  const cats = [...new Set(list.flatMap((d) => d.cat))];
  const latest = list.find((d) => !d.upcoming) || list[0];
  const intro = `${b} has ${list.length} handhelds in our database${prices.length ? `, priced from about $${Math.min(...prices)} to $${Math.max(...prices)}` : ''}. They run ${osList.join(', ')} and come in ${forms.join(', ').toLowerCase()} designs. The newest release is the ${latest.name} (${relText(latest).replace(' *', '')}).`;
  const body = `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/handhelds/">Handhelds</a> / <a href="/handhelds/brand/">Brands</a> / ${esc(b)}</nav>
<span class="pill">BRAND</span><h1>${esc(b)} Handhelds</h1>
<p class="lead">${esc(intro)}</p>
<p><a class="btn" href="/handhelds/?brand=${encodeURIComponent(b)}">Filter ${esc(b)} in the database</a> <a class="btn dv-cmp" href="/compare/?a=${list[0].slug}">Compare a ${esc(b)} handheld</a></p>
<div class="hh-list hh-preview brand-list">${list.map(brandRow).join('\n')}</div>
${cats.length ? `<p class="meta">Tags across ${esc(b)} devices: ${cats.map((c) => `<a class="hh-tag" href="${esc(fq('cat', c))}">${esc(c)}</a>`).join(' ')}</p>` : ''}
<p class="hh-note">Specs and prices are approximate. Buttons on device pages search Amazon, and not every device is sold there.</p>`;
  write(`handhelds/brand/${slugify(b)}`, page({ title: `${b} Handhelds: All ${list.length} Models, Specs and Prices | ${cfg.siteName}`, desc: `Every ${b} retro handheld in one place: ${list.length} models with specs, release dates and prices. ${intro.split('. ').slice(-1)[0]}`.slice(0, 300), url: `/handhelds/brand/${slugify(b)}/`, body, wide: true, crumbs: [['Home', '/'], ['Handhelds', '/handhelds/'], ['Brands', '/handhelds/brand/'], [b, `/handhelds/brand/${slugify(b)}/`]] }));
}
write('handhelds/brand', page({ title: `Handheld Brands: Anbernic, Retroid, AYANEO and More | ${cfg.siteName}`, desc: `Browse ${brands.length} retro handheld brands and see every model each one makes.`, url: '/handhelds/brand/', wide: true, crumbs: [['Home', '/'], ['Handhelds', '/handhelds/'], ['Brands', '/handhelds/brand/']], body: `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/handhelds/">Handhelds</a> / Brands</nav>
<span class="pill">BRANDS</span><h1>Handheld Brands</h1><p class="lead">Pick a brand to see every model it makes, newest first.</p>
<div class="brand-grid">${brands.map((b) => `<a href="/handhelds/brand/${slugify(b)}/"><b>${esc(b)}</b><span>${brandCount[b]} handhelds</span></a>`).join('')}</div>` }));

// ---- compare pages ----
const PAIRS = [['Retroid Pocket 6', 'AYN Odin 3'], ['Retroid Pocket 6', 'Retroid Pocket G2'], ['Miyoo Mini Plus', 'Game Console R33S'], ['AYN Thor', 'Retroid Pocket Duo'], ['Valve Steam Deck OLED', 'Asus ROG Xbox Ally'], ['Asus ROG Ally X', 'Asus ROG Ally'], ['TRIMUI Brick', 'TRIMUI Brick Pro'], ['Nintendo Switch OLED', 'Valve Steam Deck OLED'], ['AYN Odin 2', 'Retroid Pocket 5'], ['Nintendo Switch Lite', 'Retroid Pocket 5']]
  .map(([a, b]) => [hhData.find((d) => d.name === a), hhData.find((d) => d.name === b)]).filter(([a, b]) => a && b);
const pairSlug = (a, b) => `${a.slug}-vs-${b.slug}`;
const pairIcon = (d) => `<span class="cmp-sicon">${devIcon(d)}</span>`;
const cmpSuggest = `<section id="cmp-sugg"><h2 class="cmp-sh">Suggestions<span></span></h2><div class="cmp-sgrid">${PAIRS.map(([a, b]) => `<a href="/compare/${pairSlug(a, b)}/" data-pair="${a.slug},${b.slug}">${pairIcon(a)}<b>${esc(a.name)} <i>vs.</i> ${esc(b.name)}</b>${pairIcon(b)}</a>`).join('')}</div></section>`;
const cmpScripts = (init) => `<script id="hh-data" type="application/json">${JSON.stringify({ tag: cfg.amazonTag, devices: hhData }).replace(/</g, '\\u003c')}</script><script id="cmp-init" type="application/json">${JSON.stringify(init)}</script><script src="/compare.js" defer></script>`;
const staticTable = (a, b) => `<div id="cmp-static"><table class="cmp-table"><caption>${esc(a.name)} vs ${esc(b.name)} key specs</caption><thead><tr><th></th><th>${esc(a.name)}</th><th>${esc(b.name)}</th></tr></thead><tbody>${[['Price', (d) => d.priceText], ['Released', relText], ['OS', (d) => d.osText.replace(/,\s*$/, '')], ['Screen', (d) => d.screen], ['Resolution', (d) => d.res], ['Refresh rate', (d) => (d.hz ? `${d.hz} Hz` : '')], ['Panel', (d) => d.panel], ['Weight', (d) => (d.weight ? `${d.weight} g` : '')], ['Battery', (d) => (d.battery ? `${d.battery.toLocaleString('en-US')} mAh` : '')], ['RAM', (d) => d.ram], ['Chipset', (d) => d.chip]].map(([l, f]) => `<tr><th scope="row">${l}</th><td>${esc(f(a)) || '?'}</td><td>${esc(f(b)) || '?'}</td></tr>`).join('')}</tbody></table></div>`;
const cmpShell = (h1, extra) => `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/handhelds/">Handhelds</a> / Comparison Tool</nav>
<h1 id="cmp-h1" class="cmp-h1">${esc(h1)}</h1>
<div class="cmp-pickers">
<div class="cmp-pk"><label for="cmp-a">Compare</label><div class="cmp-sb"><input id="cmp-a" type="search" placeholder="Search" autocomplete="off" role="combobox" aria-expanded="true" aria-controls="cmp-a-list"><ul id="cmp-a-list" class="cmp-list" role="listbox" hidden></ul></div></div>
<button type="button" id="cmp-swap" class="cmp-swap" aria-label="Swap devices">&#8646;</button>
<div class="cmp-pk"><label for="cmp-b">With</label><div class="cmp-sb"><input id="cmp-b" type="search" placeholder="Search" autocomplete="off" role="combobox" aria-expanded="true" aria-controls="cmp-b-list"><ul id="cmp-b-list" class="cmp-list" role="listbox" hidden></ul></div></div>
</div>
${extra || ''}
<div id="cmp-out"></div>
${cmpSuggest}
<p class="hh-note">Specs and prices are approximate and come from the same database as our <a href="/handhelds/">handheld list</a>. Green, red and yellow icons show which device ranks higher, lower or equal in each category.</p>`;
write('compare', page({ title: `Compare Retro Handhelds Side by Side | ${cfg.siteName}`, desc: `Pick any two of ${hhData.length} retro handhelds and compare screen, weight, battery, RAM, chipset and price side by side.`, url: '/compare/', wide: true, scripts: cmpScripts({}), crumbs: [['Home', '/'], ['Compare', '/compare/']], body: cmpShell('Compare Gaming Handhelds') }));
for (const [a, b] of PAIRS) {
  write(`compare/${pairSlug(a, b)}`, page({ title: `${a.name} vs ${b.name}: Specs Comparison | ${cfg.siteName}`, desc: `${a.name} vs ${b.name} compared side by side: screen, weight, battery, RAM, chipset and price (${a.priceText} vs ${b.priceText}).`, url: `/compare/${pairSlug(a, b)}/`, wide: true, scripts: cmpScripts({ a: a.slug, b: b.slug }), crumbs: [['Home', '/'], ['Compare', '/compare/'], [`${a.name} vs ${b.name}`, `/compare/${pairSlug(a, b)}/`]], body: cmpShell(`${a.name} vs. ${b.name} Comparison`, staticTable(a, b)) }));
}
write('handhelds', page({ title: `Retro Handheld Database: Specs, Prices and Filters | ${cfg.siteName}`, desc: `Search and filter ${hhData.length} retro gaming handhelds by price, size, form factor, operating system, brand and specs. Compare screens, chips, batteries and more.`, url: '/handhelds/', body: hhBody, wide: true, scripts: hhScripts }));
write('about', page({ title: `About | ${cfg.siteName}`, desc: 'About Pixel Pocket Guides.', url: '/about/', body: aboutBody }));
write('affiliate-disclosure', page({ title: `Affiliate Disclosure | ${cfg.siteName}`, desc: 'Amazon Associates affiliate disclosure.', url: '/affiliate-disclosure/', body: disclosureBody }));
write('privacy', page({ title: `Privacy Policy | ${cfg.siteName}`, desc: 'Privacy policy for Pixel Pocket Guides.', url: '/privacy/', body: privacyBody }));

const urls = ['/', ...posts.map((p) => `/${p.slug}/`), '/handhelds/', '/handhelds/brand/', ...brands.map((b) => `/handhelds/brand/${slugify(b)}/`), '/compare/', ...PAIRS.map(([a, b]) => `/compare/${pairSlug(a, b)}/`), ...hhData.map((d) => `/handhelds/${d.slug}/`), '/guides/', ...guides.map((g) => `/guides/${g.slug}/`), '/about/', '/affiliate-disclosure/', '/privacy/'];
fs.writeFileSync(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${cfg.domain}${u}</loc><lastmod>${published}</lastmod></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${cfg.domain}/sitemap.xml\n`);
fs.writeFileSync(path.join(out, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n`);

console.log(`Built ${urls.length} pages into ${out} (affiliate tag: ${cfg.amazonTag})`);
