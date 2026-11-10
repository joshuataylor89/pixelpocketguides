// Static site generator for PixelPocketGuides.com
// Usage: node build.mjs   -> writes the finished site to ./public
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
  p.asin
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
  `<div class="thumb">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" width="200" height="170">` : icon(p.form)}</div>`;

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
function page({ title, desc, url, body, type = 'website', datePublished, canonical }) {
  const full = cfg.domain + url;
  const ld =
    type === 'article'
      ? `<script type="application/ld+json">${JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: title,
          description: desc,
          datePublished,
          dateModified: datePublished,
          mainEntityOfPage: full,
          author: { '@type': 'Organization', name: cfg.siteName },
          publisher: { '@type': 'Organization', name: cfg.siteName }
        })}</script>`
      : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical || full}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="${type}">
<meta property="og:url" content="${full}">
<meta name="twitter:card" content="summary">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
${ld}
</head>
<body>
<header class="site"><div class="wrap">
  <a class="logo" href="/">PIXEL<span>POCKET</span><br>GUIDES</a>
  <nav><a href="/">Home</a><a href="/best-retro-handhelds-holiday-2026/">Top 10</a><a href="/retro-handheld-buying-guide-by-price-2026/">By Price</a><a href="/guides/">Guides</a><a href="/about/">About</a></nav>
</div></header>
<main class="wrap">
${body}
</main>
<footer class="site"><div class="wrap">
  <p>${DISCLOSURE}</p>
  <p><a href="/affiliate-disclosure/">Affiliate Disclosure</a> · <a href="/privacy/">Privacy</a> · <a href="/about/">About</a> · © ${new Date().getFullYear()} ${esc(cfg.siteName)}</p>
  <p>Product names and trademarks belong to their owners. Prices and availability change; check Amazon for current details.</p>
</div></footer>
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
<li><b>Add a microSD card.</b> Most of these use one for storage, and it is the one accessory that makes the gift usable on day one. <a href="${esc(microSD)}" target="_blank" rel="sponsored nofollow noopener">Browse microSD cards on Amazon</a>.</li>
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
<li><b>Get a microSD card.</b> It is what the games live on. <a href="${esc(microSD)}" target="_blank" rel="sponsored nofollow noopener">Browse microSD cards on Amazon</a>.</li>
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
<li><b>Battery and storage.</b> Check the battery size, and buy a microSD card for your games. <a href="${esc(microSD)}" target="_blank" rel="sponsored nofollow noopener">Browse microSD cards on Amazon</a>.</li>
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

// ---------- Static pages ----------
const aboutBody = `<article><h1>About ${esc(cfg.siteName)}</h1>
<p class="lead">Pixel Pocket Guides helps you pick the right retro gaming handheld without wading through hundreds of near-identical devices.</p>
<p>We write buying guides based on published reviews and testing from established handheld review sites, and we only recommend products you can buy on Amazon. We say clearly when a pick is based on others' testing rather than our own.</p>
<p>The site is supported by Amazon affiliate commissions. See our <a href="/affiliate-disclosure/">affiliate disclosure</a>. Questions or corrections: <a href="mailto:${esc(cfg.contactEmail)}">${esc(cfg.contactEmail)}</a>.</p></article>`;

const disclosureBody = `<article><h1>Affiliate Disclosure</h1>
<p><b>${DISCLOSURE}</b></p>
<p>${esc(cfg.siteName)} is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. When you click a link to Amazon on this site and make a qualifying purchase, we may earn a commission at no extra cost to you.</p>
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
${guides.map((g) => `<a class="postcard" href="/guides/${g.slug}/"><span class="pill">${esc(g.kicker)}</span><h2>${esc(g.title)}</h2><p>${esc(g.blurb)}</p></a>`).join('\n')}
</div>
<div class="disclosure">${DISCLOSURE} <a href="/affiliate-disclosure/">Learn more</a>.</div>`;

// Blog-style home page: the newest post opens in full, with the other posts and guides listed below.
// Newest first: sort by each post's optional "date" (YYYY-MM-DD); posts with the same date go newest-added first.
const ordered = posts.map((p, i) => ({ ...p, _i: i })).sort((a, b) => (b.date || '2026-11-10').localeCompare(a.date || '2026-11-10') || b._i - a._i);
const fmtDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const blogHome = `<section class="hero">
<span class="pill">THE BLOG</span>
<h1>Retro handheld buying guides</h1>
<p>Honest picks for every budget. Every product is on Amazon.</p>
</section>
<div class="feed">
${ordered.map((p) => `<article class="entry"><span class="pill">${esc(p.kicker)}</span><h2><a href="/${p.slug}/">${esc(p.title)}</a></h2><p class="meta">${fmtDate(p.date || '2026-11-10')}</p><p>${esc(p.desc)}</p><p><a class="more" href="/${p.slug}/">Read the full guide →</a></p></article>`).join('\n')}
</div>
<div class="disclosure">${DISCLOSURE} <a href="/affiliate-disclosure/">Learn more</a>.</div>`;

// ---------- Write everything ----------
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(path.join(root, 'static'))) fs.copyFileSync(path.join(root, 'static', f), path.join(out, f));

const write = (rel, html) => {
  const dir = path.join(out, rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
};
const published = '2026-11-10';
write('', page({ title: `${cfg.siteName}: Retro Handheld Buying Guides`, desc: 'Honest buying guides for retro gaming handhelds at every price point, all available on Amazon.', url: '/', body: blogHome }));
for (const p of posts) write(p.slug, page({ title: `${p.title} | ${cfg.siteName}`, desc: p.desc, url: `/${p.slug}/`, body: p.body, type: 'article', datePublished: published }));
write('guides', page({ title: `Setup Guides | ${cfg.siteName}`, desc: 'Practical setup guides for retro gaming handhelds.', url: '/guides/', body: guidesIndexBody }));
for (const g of guides) {
  const gbody = `<article><span class="pill">${esc(g.kicker)}</span><h1>${esc(g.title)}</h1><p class="meta">Updated ${esc(cfg.updated)}</p>${g.body.replace('__SOURCE__', esc(g.source)).replace('__SOURCENAME__', esc(g.sourceName))}</article>`;
  write(`guides/${g.slug}`, page({ title: `${g.title} | ${cfg.siteName}`, desc: g.desc, url: `/guides/${g.slug}/`, body: gbody, type: 'article', datePublished: published }));
}
write('about', page({ title: `About | ${cfg.siteName}`, desc: 'About Pixel Pocket Guides.', url: '/about/', body: aboutBody }));
write('affiliate-disclosure', page({ title: `Affiliate Disclosure | ${cfg.siteName}`, desc: 'Amazon Associates affiliate disclosure.', url: '/affiliate-disclosure/', body: disclosureBody }));
write('privacy', page({ title: `Privacy Policy | ${cfg.siteName}`, desc: 'Privacy policy for Pixel Pocket Guides.', url: '/privacy/', body: privacyBody }));

const urls = ['/', ...posts.map((p) => `/${p.slug}/`), '/guides/', ...guides.map((g) => `/guides/${g.slug}/`), '/about/', '/affiliate-disclosure/', '/privacy/'];
fs.writeFileSync(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${cfg.domain}${u}</loc><lastmod>${published}</lastmod></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${cfg.domain}/sitemap.xml\n`);
fs.writeFileSync(path.join(out, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n`);

console.log(`Built ${urls.length} pages into ${out} (affiliate tag: ${cfg.amazonTag})`);
