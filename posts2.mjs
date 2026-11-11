// Scheduled posts about 2025 and 2026 handhelds. Specs and prices come from data/handhelds.json.
import fs from 'node:fs';
import path from 'node:path';

export function slugMap(root) {
  const db = JSON.parse(fs.readFileSync(path.join(root, 'data', 'handhelds.json'), 'utf8'));
  const slugify = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const seen = {}, out = {};
  for (const d of db) { let s = slugify(d.name), n = 2; while (seen[s]) s = `${slugify(d.name)}-${n++}`; seen[s] = 1; out[d.name] = s; }
  return out;
}

export function makePosts({ root, cfg, esc, disclosureBox }) {
  const db = JSON.parse(fs.readFileSync(path.join(root, 'data', 'handhelds.json'), 'utf8'));
  const slugify = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const seen = {};
  for (const d of db) { let s = slugify(d.name), n = 2; while (seen[s]) s = `${slugify(d.name)}-${n++}`; seen[s] = 1; d.slug = s; }
  const by = Object.fromEntries(db.map((d) => [d.name, d]));
  const dev = (n) => { if (!by[n]) throw new Error('Unknown device: ' + n); return by[n]; };
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const rel = (d) => { const [y, m] = d.released.split('-'); return `${MON[+m - 1]} ${y}`; };
  const amz = (d) => (d.asin ? `https://www.amazon.com/dp/${d.asin}?tag=${cfg.amazonTag}` : `https://www.amazon.com/s?k=${encodeURIComponent(d.name)}&tag=${cfg.amazonTag}`);
  const ok = (v) => v && v !== '?' && v !== 'None';
  const screenTxt = (d) => [d.screen.replace(/”/g, '"'), ok(d.res) && d.res, d.hz && `${d.hz}Hz`, ok(d.panel) && d.panel].filter(Boolean).join(', ');
  const specs = (d) => [['Released', rel(d)], ['Price', d.priceText], ['Screen', screenTxt(d)], ['Chip / RAM', [d.chip, d.ram].filter(ok).join(' / ')], ['Battery', d.battery ? (d.battery > 1000 ? `${d.battery.toLocaleString('en-US')}mAh` : `${d.battery}Wh`) : ''], ['Weight', d.weight ? `${d.weight}g` : ''], ['OS', d.osText.replace(/,\s*$/, '')]].filter(([, v]) => ok(v));
  const card = (name, rank, badge, verdict) => {
    const d = dev(name);
    return `<section class="product" id="${d.slug}">
  <div class="thumb">${d.img ? '' : ''}<img src="/img/d/${d.slug}/icon.webp" alt="${esc(d.name)} handheld" loading="lazy" width="200" height="150"></div>
  <div>
    ${rank ? `<div class="rank">#${rank}</div>` : ''}
    <h3>${esc(d.name)}<span class="badge">${esc(badge)}</span></h3>
    <div class="price">${esc(d.priceText)}${d.upcoming ? ' · upcoming' : ''}</div>
    <p>${esc(verdict)}</p>
    <ul class="specs">${specs(d).map(([k, v]) => `<li><b>${esc(k)}:</b> ${esc(v)}</li>`).join('')}</ul>
    <a class="btn" href="${esc(amz(d))}" target="_blank" rel="sponsored nofollow noopener">${d.asin ? 'View on Amazon' : 'Check price on Amazon'} <small>→</small></a> <a class="more" href="/handhelds/${d.slug}/">Full specs →</a>
  </div>
</section>`;
  };
  const glance = (items) => `<ul>${items.map(([n]) => `<li><a href="#${dev(n).slug}">${esc(n)}</a> (${esc(dev(n).priceText)})</li>`).join('')}</ul>`;
  const table = (names, rows) => `<div class="tbl"><table class="cmp-table"><thead><tr><th></th>${names.map((n) => `<th>${esc(n)}</th>`).join('')}</tr></thead><tbody>${rows.map(([l, f]) => `<tr><th scope="row">${esc(l)}</th>${names.map((n) => `<td>${esc(f(dev(n))) || '?'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const R = { price: ['Price', (d) => d.priceText], rel: ['Released', rel], screen: ['Screen', screenTxt], chip: ['Chip', (d) => d.chip], ram: ['RAM', (d) => d.ram], bat: ['Battery', (d) => (d.battery > 1000 ? `${d.battery.toLocaleString('en-US')}mAh` : `${d.battery}Wh`)], wt: ['Weight', (d) => (d.weight ? `${d.weight}g` : '')], os: ['OS', (d) => d.osText.replace(/,\s*$/, '')], sto: ['Storage', (d) => d.storage] };
  const faq = (items) => `<h2>Frequently asked questions</h2>\n${items.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${a}</p></details>`).join('\n')}`;
  const SRC = `<h2>About these specs</h2><p>We have not tested these handhelds ourselves. Specs and prices come from our <a href="/handhelds/">handheld database</a>, which collects published specifications, so they can differ from the current listing. Buttons open the Amazon listing, or an Amazon search when we do not have a direct link. Some devices are sold by third-party sellers, so check the seller and the return policy before you order.</p>`;
  const MORE = `<p>More guides: <a href="/best-retro-handhelds-holiday-2026/">Top 10 Retro Handhelds</a>, <a href="/retro-handheld-buying-guide-by-price-2026/">Buying Guide by Price</a>, <a href="/best-microsd-cards-for-retro-handhelds-2026/">Best microSD Cards</a>, <a href="/handhelds/">Handheld Database</a> and the <a href="/compare/">Compare Tool</a>.</p>`;
  const date = () => cfg.updated;
  const build = (o) => {
    const items = o.picks;
    const body = `<article>
<span class="pill">${esc(o.pill)}</span>
<h1>${esc(o.title)}</h1>
<p class="meta">Updated ${esc(date())}</p>
<p class="lead">${o.lead}</p>
${o.ranked === false ? '' : `<h2>At a glance</h2>\n${glance(items)}`}
${o.intro ? `<h2>${esc(o.intro[0])}</h2>\n<p>${o.intro[1]}</p>` : ''}
${o.table || ''}
<h2>${o.ranked === false ? 'The models' : 'Our ranked picks'}</h2>
${items.map(([n, badge, v], i) => card(n, o.ranked === false ? 0 : i + 1, badge, v)).join('\n')}
${o.extra || ''}
${faq(o.faq)}
${MORE}
${SRC}
${disclosureBox}
</article>`;
    return { slug: o.slug, title: o.title, desc: o.desc, body, blurb: o.blurb, kicker: o.kicker, sched: o.n };
  };

  const P = [];
  // 1 ---------------------------------------------------------------- dual screen
  {
    const picks = [
      ['AYN Thor', 'Best Overall', 'A Snapdragon 8 Gen 2 with 8GB of RAM, a 6" 120Hz AMOLED top screen and a 3.92" bottom screen. On paper it is the strongest all-round dual-screen handheld here, and it sits in the middle of the price range at about $290.'],
      ['Retroid Pocket Duo', 'Best Newer Mid-Range', 'The newest of the group, with a 5.5" 120Hz AMOLED top screen, a 4.5" 4:3 bottom screen, 8GB of RAM and Android 16 with Linux. It weighs 350g, a little less than the Thor.'],
      ['AYANEO Pocket DS', 'Premium Pick', 'The biggest screens and battery here: a 7" 165Hz OLED on top, a 5" screen below and an 8,000mAh battery. It is also the heaviest at 540g and the most expensive at about $399.'],
      ['Retroid Pocket Duo Lite', 'Best Value Dual-Screen', 'About $135 for a 5.5" top screen and a 4.2" bottom screen. The trade-offs are a 60Hz TFT panel, 4GB of RAM and 64GB of storage, so it is a step down from the Duo.'],
      ['Anbernic RG DS', 'Best Budget', 'Around $94 for two 4" 640×480 IPS screens, 3GB of RAM and Android 14. It is the cheapest way into a dual-screen handheld, and your link opens the Amazon page directly.']
    ];
    P.push(build({ n: 0, slug: 'best-dual-screen-android-handhelds-2026', title: 'Best Dual-Screen Android Handhelds in 2026', desc: 'Five dual-screen Android handhelds from 2025 and 2026, from about $94 to $399: AYN Thor, Retroid Pocket Duo, AYANEO Pocket DS and more.', pill: 'DUAL-SCREEN HANDHELDS', kicker: 'DUAL-SCREEN', blurb: 'Five dual-screen Android handhelds from 2025 and 2026, from the $94 Anbernic RG DS to the 7-inch AYANEO Pocket DS.',
      lead: 'Dual-screen handhelds bring back the two-screen layout of the Nintendo DS and 3DS, and 2025 and 2026 gave us the best selection yet. Here are five, from about $94 to about $399.', picks,
      intro: ['What to look for in a dual-screen handheld', 'Check the size and shape of both screens, because the bottom screen is usually smaller and 4:3. Then look at the chip and RAM, which set how demanding a game you can run. Our database lists 3DS and NDS as the best-for systems for the Thor, the Duo and the Pocket DS. Weight matters too, since the range here runs from 321g to 540g.'],
      table: table(picks.map((p) => p[0]), [R.price, R.screen, R.chip, R.ram, R.bat, R.wt]),
      faq: [['Which dual-screen handheld has the biggest screens?', 'The AYANEO Pocket DS, with a 7" top screen and a 5" bottom screen.'], ['What is the cheapest dual-screen handheld here?', 'The Anbernic RG DS at about $94. The Anbernic RG DS Plus is similar at about $95 and runs Linux.'], ['Do these run Android?', 'Yes, all five run Android. The Retroid Pocket Duo also lists Linux.']] }));
  }
  // 2 ---------------------------------------------------------------- gifts under $100
  {
    const picks = [
      ['Anbernic RG SP', 'Best Gift Under $100', 'A flip-style handheld with a 3.4" 3:2 IPS screen, Linux and a 3,300mAh battery for about $65. It folds shut at 168g, which makes it easy to wrap and easy to carry.'],
      ['Anbernic RG-35XX Pro', 'Best Value', 'About $50 for a 3.5" 640×480 IPS screen, an Allwinner H700 and dual microSD slots. It is a simple vertical handheld that is easy to set up.'],
      ['TRIMUI Smart Pro S', 'Biggest Screen', 'A 4.96" 720p IPS screen and a 5,000mAh battery for about $90, in a horizontal layout. It has only 1GB of RAM and 8GB of storage, so plan to add a microSD card.'],
      ['MagicX One 35', 'Best Android Pick', 'A 3.5" 960×640 IPS screen, a MediaTek Helio G85 with 4GB of RAM, a 4,300mAh battery and 64GB of storage for about $85. It is the Android option on this list.'],
      ['Anbernic RG 35', 'Best Stocking Stuffer', 'The lowest price here at about $38. It has a 3.5" 640×480 IPS screen and 1GB of RAM, which is enough for older consoles. Your link opens the Amazon page directly.']
    ];
    P.push(build({ n: 1, slug: 'best-retro-handheld-gifts-under-100-2026', title: 'Best Retro Handheld Gifts Under $100 (Holiday 2026)', desc: 'Five retro handhelds from 2025 and 2026 that make good gifts under $100, from the $38 Anbernic RG 35 to the $90 TRIMUI Smart Pro S.', pill: 'GIFT GUIDE', kicker: 'UNDER $100', blurb: 'Five gift-friendly retro handhelds from about $38 to $90, plus what else to buy with them.',
      lead: 'A retro handheld makes an easy gift, and you do not have to spend much. These five were all released in 2025 or 2026 and cost under about $100.', picks,
      intro: ['Before you wrap one', 'Pick up a microSD card at the same time, because most of these use one for games. Our <a href="/best-microsd-cards-for-retro-handhelds-2026/">microSD card guide</a> has the sizes we suggest. These handhelds do not come with licensed games, so the person you are buying for will need games they already own.'],
      table: table(picks.map((p) => p[0]), [R.price, R.screen, R.chip, R.bat, R.wt, R.os]),
      faq: [['What is the cheapest handheld here?', 'The Anbernic RG 35 at about $38.'], ['Which one has the biggest screen?', 'The TRIMUI Smart Pro S, with a 4.96" 720p screen.'], ['Do I need a microSD card?', 'Usually yes. The Anbernic models use dual microSD slots, and the TRIMUI Smart Pro S has only 8GB of built-in storage.']] }));
  }
  // 3 ---------------------------------------------------------------- Anbernic lineup
  {
    const picks = [
      ['Anbernic RG 35', 'Cheapest', 'The entry point at about $38: a vertical 3.5" 640×480 handheld with a Rockchip RK3326, 1GB of RAM and Linux.'],
      ['Anbernic RG SP', 'Flip Style', 'A clamshell with a 3.4" 3:2 screen, Allwinner H700 and 3,300mAh battery at about $65.'],
      ['Anbernic RG Rotate', 'Square Screen', 'A 3.5" 1:1 720×720 square screen, running Android 12 on a UNISOC Tiger T618 for about $85. It has a 2,000mAh battery, the smallest in this list.'],
      ['Anbernic RG DS', 'Dual-Screen Android', 'Two 4" 4:3 screens, Android 14 and 3GB of RAM for about $94.'],
      ['Anbernic RG DS Plus', 'Dual-Screen Linux', 'Two 4.3" 1024×768 screens, Linux, dual microSD slots and a 4,000mAh battery for about $95.'],
      ['Anbernic RG Vita', 'Vita-Style Value', 'A horizontal 5.46" 720p IPS handheld with a UNISOC Tiger T618 and Android 12 for about $110.'],
      ['Anbernic RG Vita Pro', 'Vita-Style Step Up', 'A 5.5" 1080p IPS screen, Rockchip RK3576, 4GB of RAM and Android 14 or Linux for about $150.'],
      ['Anbernic RG-477V', 'Most Powerful', 'A vertical 4.7" 120Hz screen with a MediaTek Dimensity 8300 and 8GB of RAM for about $220. It is the only model here we link by search instead of a direct page.']
    ];
    P.push(build({ n: 2, ranked: false, slug: 'anbernic-retro-handheld-lineup-2026', title: 'Anbernic’s 2026 Handheld Lineup, Explained', desc: 'Every 2025 and 2026 Anbernic handheld we track in one guide: RG 35, RG SP, RG Rotate, RG DS, RG Vita and RG-477V, with prices and specs.', pill: 'BRAND GUIDE', kicker: 'ANBERNIC', blurb: 'Eight Anbernic handhelds from $38 to $220 compared in one place, with a quick guide to which fits you.',
      lead: 'Anbernic releases a lot of handhelds, and the names are hard to keep apart. Here are eight of its 2025 and 2026 models in order of price, with what makes each one different.', picks,
      intro: ['Which Anbernic should you buy?', 'Start with the shape you like. Vertical handhelds are the RG 35 and RG-477V, the flip is the RG SP, the square-screen one is the RG Rotate, the dual-screen ones are the RG DS and RG DS Plus, and the Vita-style horizontal ones are the RG Vita and RG Vita Pro. Then match your budget. You can see every model on our <a href="/handhelds/brand/anbernic/">Anbernic brand page</a>.'],
      table: table(picks.map((p) => p[0]), [R.price, R.screen, R.chip, R.bat, R.os]),
      faq: [['What is the cheapest Anbernic here?', 'The RG 35 at about $38.'], ['Which Anbernic is the most powerful?', 'The RG-477V, with a MediaTek Dimensity 8300 and 8GB of RAM.'], ['Which ones run Android?', 'The RG Rotate, RG DS, RG Vita, RG Vita Pro and RG-477V. The RG 35, RG SP and RG DS Plus run Linux.']] }));
  }
  // 5 ---------------------------------------------------------------- Switch 2 vs Xbox Ally X vs Legion Go 2
  {
    const picks = [
      ['Nintendo Switch 2', 'Best For Nintendo Games', 'A console, not a PC. It has an 8" 1080p LCD, a Tegra T239 with 12GB of RAM and a 5,220mAh battery, and it is the cheapest of the three at about $460.'],
      ['Asus ROG Xbox Ally X', 'Lighter Windows Option', 'A 7" 120Hz IPS screen, Ryzen AI Z2 Extreme, 24GB of RAM and a 1TB SSD, running Windows 11 for about $999.'],
      ['Lenovo Legion Go Gen 2', 'Biggest Screen', 'An 8.8" 144Hz OLED, Ryzen Z2 Extreme, 32GB of RAM and a 2TB SSD for about $1,000. It is also the heaviest at 938g.']
    ];
    P.push(build({ n: 3, ranked: false, slug: 'nintendo-switch-2-vs-rog-xbox-ally-x-vs-legion-go-2', title: 'Nintendo Switch 2 vs ROG Xbox Ally X vs Lenovo Legion Go 2', desc: 'Three big 2025 handhelds compared on screen, chip, RAM, battery, weight and price: Nintendo Switch 2, ROG Xbox Ally X and Lenovo Legion Go Gen 2.', pill: 'COMPARISON', kicker: 'BIG HANDHELDS', blurb: 'The Switch 2, ROG Xbox Ally X and Legion Go 2 compared side by side, with who each one suits.',
      lead: 'The Nintendo Switch 2 and two Windows handhelds all arrived in 2025, and they cost very different amounts. Here is how they compare on paper.', picks,
      intro: ['Console or Windows handheld?', 'The Switch 2 is a console that plays Nintendo’s own games, and it costs less than half as much as the other two. The ROG Xbox Ally X and Legion Go 2 are Windows 11 PCs, so they can run PC game stores, emulators and other software. That freedom comes with a much higher price.'],
      table: table(picks.map((p) => p[0]), [R.price, R.rel, R.screen, R.chip, R.ram, R.bat, R.wt, R.os, R.sto]),
      extra: '<h2>Who should buy which?</h2><ul><li><b>Switch 2:</b> you mainly want Nintendo games and a lower price.</li><li><b>ROG Xbox Ally X:</b> you want a Windows handheld that is lighter (715g) than the Legion Go 2.</li><li><b>Legion Go 2:</b> you want the biggest and sharpest screen and have the budget for it.</li></ul><p>Want a different pairing? The <a href="/compare/">Compare Tool</a> can set any two handhelds side by side.</p>',
      faq: [['Can the Switch 2 run Windows or PC games?', 'No. It is a console with its own system software, not a Windows PC.'], ['Which is the lightest?', 'The Switch 2 at 401g, then the ROG Xbox Ally X at 715g and the Legion Go 2 at 938g.'], ['Which has the best screen?', 'The Legion Go 2, with an 8.8" 144Hz OLED panel.']] }));
  }
  // 6 ---------------------------------------------------------------- Android under $250
  {
    const picks = [
      ['Retroid Pocket 6', 'Best Overall', 'A Snapdragon 8 Gen 2 with 8GB of RAM, a 5.5" 120Hz AMOLED and a 6,000mAh battery for about $240. It runs Android 13 and Linux.'],
      ['Anbernic RG-557', 'Best Big AMOLED', 'A 5.48" 1080p AMOLED with a MediaTek Dimensity 8300 and 8GB of RAM for about $249, right at the top of the budget.'],
      ['Anbernic RG-477M', 'Best 4:3 Screen', 'A 4.7" 4:3 120Hz screen with the same Dimensity 8300 chip and 8GB of RAM for about $220.'],
      ['Retroid Pocket G2', 'Best Newer Android', 'A 5.5" AMOLED with a Snapdragon G2 Gen 2, 8GB of RAM and Android 15 for about $219. It is the newest software here, with a 60Hz screen.'],
      ['Retroid Pocket Flip 2 D1100', 'Best Flip Under $250', 'A clamshell with a 5.5" AMOLED and a Dimensity 1100 for about $190. The Snapdragon 865 version costs about $30 more.']
    ];
    P.push(build({ n: 4, slug: 'best-android-handhelds-under-250-2026', title: 'Best Android Handhelds Under $250 in 2026', desc: 'Five Android handhelds from 2025 and 2026 under about $250: Retroid Pocket 6, Anbernic RG-557, RG-477M, Retroid Pocket G2 and Flip 2.', pill: 'ANDROID HANDHELDS', kicker: 'UNDER $250', blurb: 'The best Android handhelds from about $190 to $249, including the Retroid Pocket 6 and Anbernic RG-557.',
      lead: 'The $190 to $250 range is where most Android handheld shoppers end up, and it has plenty of choice. These five were all released in 2025 or 2026.', picks,
      intro: ['What this price buys', 'At this price you get an AMOLED or fast LTPS screen, 8GB of RAM and a Snapdragon or Dimensity chip. Our database lists PS2 and GameCube as the best-for systems for all five. The main differences are screen size and shape, battery size and whether it folds.'],
      table: table(picks.map((p) => p[0]), [R.price, R.screen, R.chip, R.bat, R.wt, R.os]),
      faq: [['Which one is the cheapest?', 'The Retroid Pocket Flip 2 D1100, at about $190.'], ['Which has the newest Android version?', 'The Retroid Pocket G2, which lists Android 15.'], ['Which is the lightest?', 'The Retroid Pocket G2 at 280g.']] }));
  }
  // 7 ---------------------------------------------------------------- RP6 vs Odin 3
  {
    const picks = [
      ['Retroid Pocket 6', 'Smaller and Cheaper', 'A 5.5" 120Hz AMOLED, Snapdragon 8 Gen 2, 8GB of RAM and a 6,000mAh battery. At 304g and about $240, it is the lighter and cheaper of the two.'],
      ['AYN Odin 3', 'Bigger Screen and Battery', 'A 6" 120Hz AMOLED, Qualcomm Dragonwing Q8, 8GB of RAM and an 8,000mAh battery with Android 15. It weighs 390g and costs about $330.']
    ];
    P.push(build({ n: 5, ranked: false, slug: 'retroid-pocket-6-vs-ayn-odin-3', title: 'Retroid Pocket 6 vs AYN Odin 3: Which Should You Buy?', desc: 'Retroid Pocket 6 vs AYN Odin 3 compared on screen, chip, battery, weight and price. The Odin 3 has a bigger screen and battery; the Pocket 6 costs about $90 less.', pill: 'COMPARISON', kicker: 'COMPARISON', blurb: 'Two popular Android handhelds compared: a smaller $240 Pocket 6 against a bigger $330 Odin 3.',
      lead: 'These two Android handhelds both have 120Hz AMOLED screens and 8GB of RAM, but they differ in size, battery and price. Here is how they compare.', picks,
      table: table(picks.map((p) => p[0]), [R.price, R.rel, R.screen, R.chip, R.ram, R.bat, R.wt, R.os, R.sto]),
      extra: '<h2>The short version</h2><ul><li>The Odin 3 has a <b>9% bigger screen</b> (6.0" vs 5.5") and a <b>33% bigger battery</b> (8,000mAh vs 6,000mAh).</li><li>The Pocket 6 is <b>86g lighter</b> (304g vs 390g) and costs about <b>$90 less</b>.</li><li>The Odin 3 runs Android 15, while the Pocket 6 lists Android 13 and Linux.</li></ul><p>Choose the Pocket 6 if you want something compact and cheaper. Choose the Odin 3 if you want the larger screen and longer battery capacity. You can also see them side by side in our <a href="/compare/retroid-pocket-6-vs-ayn-odin-3/">comparison tool</a>.</p>',
      faq: [['Which has the bigger battery?', 'The AYN Odin 3, with an 8,000mAh battery against 6,000mAh. Real battery life also depends on the screen and the games you play.'], ['Which is lighter?', 'The Retroid Pocket 6, at 304g against 390g.'], ['Which costs less?', 'The Retroid Pocket 6, at about $240 against about $330.']] }));
  }
  // 8 ---------------------------------------------------------------- large screens
  {
    const picks = [
      ['AYN Odin 2 Portal', 'Best Overall', 'A 7" 120Hz AMOLED, Snapdragon 8 Gen 2, 8GB of RAM and an 8,000mAh battery for about $320. It weighs 430g.'],
      ['Mangmi Pocket Max', 'Best Value', 'A 7" AMOLED that refreshes at 144Hz, with a Snapdragon 865, 8GB of RAM and an 8,000mAh battery for about $220. It is the heaviest here at 450g.'],
      ['AYN Odin 3', 'Newest Android', 'A 6" 120Hz AMOLED with the Dragonwing Q8, Android 15 and an 8,000mAh battery for about $330.'],
      ['AYANEO Pocket S2', 'Sharpest Screen', 'A 6.3" 2560×1440 IPS screen, Snapdragon G3 Gen 3 and 8GB of RAM for about $439. It is the most expensive and the sharpest.'],
      ['Abxylute One Pro', 'Amazon Direct Link', 'A 7" 1080p IPS screen with a MediaTek Genio 510, 4GB of RAM and a 5,200mAh battery for about $240. It has less RAM than the others, and your link opens the Amazon page directly.']
    ];
    P.push(build({ n: 6, slug: 'best-large-screen-android-handhelds-2026', title: 'Best Large-Screen Android Handhelds (6 Inches and Up)', desc: 'Five big-screen Android handhelds from 2025 and 2026: AYN Odin 2 Portal, Mangmi Pocket Max, AYN Odin 3, AYANEO Pocket S2 and Abxylute One Pro.', pill: 'BIG-SCREEN HANDHELDS', kicker: 'LARGE SCREEN', blurb: 'Five Android handhelds with 6-inch to 7-inch screens, from about $220 to $439.',
      lead: 'A bigger screen makes a handheld easier on the eyes for 3D games and menus. These five Android handhelds all have screens of 6 inches or more and were released in 2025 or 2026.', picks,
      intro: ['Bigger is heavier', 'The trade-off with a big screen is weight. These five range from 390g to 450g. The AYN Odin 3 Portal, a 7" model, is listed in our database for December 2026, so it is not ranked yet.'],
      table: table(picks.map((p) => p[0]), [R.price, R.screen, R.chip, R.ram, R.bat, R.wt]),
      faq: [['Which has the largest screen?', 'The AYN Odin 2 Portal, Mangmi Pocket Max and Abxylute One Pro all have 7" screens.'], ['Which is the cheapest?', 'The Mangmi Pocket Max, at about $220.'], ['Which has the sharpest screen?', 'The AYANEO Pocket S2, at 2560×1440.']] }));
  }
  // 9 ---------------------------------------------------------------- battery
  {
    const cand = db.filter((d) => !d.upcoming && d.released >= '2025-01' && d.os.includes('Android') && d.battery >= 6000).sort((a, b) => b.battery - a.battery || (a.price || 9e9) - (b.price || 9e9));
    const top = cand.slice(0, 8).map((d) => d.name);
    const picks = [
      ['Mangmi Pocket Max', 'Cheapest 8,000mAh', 'A 7" 144Hz AMOLED with an 8,000mAh battery for about $220, the lowest price of the large-battery group.'],
      ['AYN Odin 2 Portal', 'Large Battery, Big Screen', 'An 8,000mAh battery behind a 7" 120Hz AMOLED and a Snapdragon 8 Gen 2 for about $320.'],
      ['AYN Odin 3', 'Newest Chip', 'An 8,000mAh battery with a 6" 120Hz AMOLED and Android 15 for about $330.'],
      ['AYANEO Pocket S2', 'Sharpest Screen', 'An 8,000mAh battery behind a 6.3" 1440p IPS screen for about $439.'],
      ['AYANEO Pocket DS', 'Dual-Screen Pick', 'An 8,000mAh battery for a dual-screen design, with a 7" OLED and a 5" bottom screen for about $399.']
    ];
    P.push(build({ n: 7, slug: 'handhelds-with-the-biggest-batteries-2026', title: 'Handhelds With the Biggest Batteries in 2026', desc: 'The Android handhelds from 2025 and 2026 with the largest listed batteries, up to 8,000mAh, with weight and price for each.', pill: 'BATTERY GUIDE', kicker: 'BATTERY', blurb: 'The biggest listed batteries among 2025 and 2026 Android handhelds, ranked with weight and price.',
      lead: 'Battery size is one of the easiest numbers to compare. This guide ranks the 2025 and 2026 Android handhelds in our database by listed battery capacity.', picks,
      intro: ['Capacity is not battery life', 'A bigger number in mAh means a bigger battery, but how long it lasts depends on the screen, brightness, chip and the games you play. Use this as a starting point, and check reviews for real runtime. Seven of the devices below share an 8,000mAh rating, so we sorted ties by price. The AYN Odin 3 Portal lists 9,000mAh in our database, but it is upcoming.'],
      table: table(top, [R.bat, R.price, R.wt, R.screen]),
      faq: [['Which handheld has the biggest battery?', 'Several share 8,000mAh, including the AYN Odin 2 Portal, AYN Odin 3, AYANEO Pocket S2, AYANEO Pocket DS and Mangmi Pocket Max.'], ['Does a bigger battery always last longer?', 'No. Screen size, refresh rate and chip all change how fast it drains.'], ['What does the Retroid Pocket 6 have?', 'A 6,000mAh battery in a lighter 304g body.']] }));
  }
  // 10 --------------------------------------------------------------- vertical
  {
    const picks = [
      ['Anbernic RG-477V', 'Most Powerful', 'A 4.7" 4:3 120Hz screen with a MediaTek Dimensity 8300 and 8GB of RAM for about $220. It is the strongest vertical handheld here.'],
      ['Retroid Pocket Classic', 'Best Screen', 'A 3.92" AMOLED with a Snapdragon G1 Gen 2, 4GB of RAM and a 5,000mAh battery for about $120. It is light at 223g.'],
      ['Mangmi Air Y', 'Budget Android', 'A 4.2" 1280×960 IPS screen, Snapdragon 662 and Android 14 for about $95.'],
      ['TRIMUI Brick Pro', 'Budget Linux', 'A 3.95" 1024×768 IPS screen, Linux and a 5,000mAh battery for about $95. It has 1GB of RAM and 8GB of storage.'],
      ['Anbernic RG Rotate', 'Square Screen', 'A 3.5" 720×720 square screen on Android 12 for about $85. It has a 2,000mAh battery, the smallest here, and your link opens the Amazon page directly.']
    ];
    P.push(build({ n: 8, slug: 'best-new-vertical-handhelds-2026', title: 'Five Newer Vertical Handhelds Worth Buying in 2026', desc: 'Five 2025 and 2026 vertical (Game Boy-shaped) handhelds: Anbernic RG-477V, Retroid Pocket Classic, Mangmi Air Y, TRIMUI Brick Pro and RG Rotate.', pill: 'VERTICAL HANDHELDS', kicker: 'NEW VERTICAL', blurb: 'Five newer Game Boy-shaped handhelds from about $85 to $220.',
      lead: 'Vertical handhelds are small, light and easy to pocket. This list covers newer models from 2025 and 2026. If you want older favorites too, see our <a href="/best-vertical-retro-handhelds-2026/">Top 5 Vertical list</a>.', picks,
      intro: ['Vertical handhelds', 'These have a tall screen above the controls, like a Game Boy. The range here covers 3.5" to 4.7" screens and weights from 167g to 334g, so check what you want to play before you decide.'],
      table: table(picks.map((p) => p[0]), [R.price, R.screen, R.chip, R.bat, R.wt, R.os]),
      faq: [['Which is the most powerful?', 'The Anbernic RG-477V, with a Dimensity 8300 chip and 8GB of RAM.'], ['Which is the lightest?', 'The Anbernic RG Rotate at 167g.'], ['Which have a Linux operating system?', 'The TRIMUI Brick Pro runs Linux. The others run Android.']] }));
  }
  return P;
}
