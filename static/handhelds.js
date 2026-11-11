(function () {
  var dataEl = document.getElementById('hh-data');
  if (!dataEl) return;
  var CFG = JSON.parse(dataEl.textContent);
  var D = CFG.devices, TAG = CFG.tag;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function relText(d) { if (d.upcoming) return 'Upcoming *'; var p = d.released.split('-'); return MONTHS[+p[1] - 1] + '. ' + p[0]; }
  function bucket(v, edges, labels) { if (v == null) return []; for (var i = 0; i < edges.length; i++) if (v < edges[i]) return [labels[i]]; return [labels[labels.length - 1]]; }
  var chipBrand = function (c) { var m = (c || '').match(/^(Qualcomm|MediaTek|Rockchip|RockChip|Allwinner|AMD|Intel|UNISOC|Unisoc|SigmaStar|Nvidia|Actions|Ingenic|Samsung|Apple)/i); return m ? m[1].replace('RockChip', 'Rockchip').replace('Unisoc', 'UNISOC') : (c ? 'Other' : null); };
  var CONTROL_KEYS = [['Rear / back buttons', /rear|back button|2x programmable|four rear/i], ['Fingerprint power button', /fingerprint/i], ['Touchpads', /touchpad/i], ['Stylus', /stylus/i], ['Menu / function button', /menu|function|launcher/i], ['Volume buttons', /volume/i], ['Reset button', /reset/i]];

  // facet definitions: key, label, group, values(d) -> array, optional order
  var FACETS = [
    { k: 'price', l: 'Price', g: 'General', v: function (d) { return bucket(d.price, [50, 100, 200, 400], ['Under $50', '$50 to $100', '$100 to $200', '$200 to $400', '$400 and up']); }, order: ['Under $50', '$50 to $100', '$100 to $200', '$200 to $400', '$400 and up'] },
    { k: 'size', l: 'Size', g: 'General', v: function (d) { return d.size.length ? d.size : ['Standard']; }, order: ['Micro', 'Small', 'Standard', 'Big'] },
    { k: 'form', l: 'Form Factor', g: 'General', v: function (d) { return d.form; } },
    { k: 'os', l: 'Operating System', g: 'General', v: function (d) { return d.os; } },
    { k: 'fw', l: 'Custom Firmware', g: 'General', na: true },
    { k: 'brand', l: 'Brand', g: 'General', v: function (d) { return [d.brand]; } },
    { k: 'cat', l: 'Category', g: 'General', v: function (d) { return d.cat; } },
    { k: 'best', l: 'Consoles - Emulation Performance', g: 'Specifications', v: function (d) { return d.best; }, note: 'Systems each handheld is listed as best for.' },
    { k: 'screen', l: 'Screen', g: 'Specifications', sub: [
      { k: 'aspect', l: 'Aspect ratio', v: function (d) { return d.aspect ? d.aspect.split(/,\s*/) : []; } },
      { k: 'panel', l: 'Screen type', v: function (d) { return d.panel ? [d.panel] : []; } },
      { k: 'hz', l: 'Refresh rate', v: function (d) { return d.hz ? [d.hz >= 120 ? '120 Hz or more' : d.hz >= 90 ? '90 Hz' : '60 Hz or less'] : []; }, order: ['60 Hz or less', '90 Hz', '120 Hz or more'] },
      { k: 'inch', l: 'Screen size', v: function (d) { return bucket(d.screenIn, [3.5, 4.5, 6, 8], ['Under 3.5"', '3.5" to 4.5"', '4.5" to 6"', '6" to 8"', '8" and up']); }, order: ['Under 3.5"', '3.5" to 4.5"', '4.5" to 6"', '6" to 8"', '8" and up'] }
    ] },
    { k: 'build', l: 'Build and Ergonomics', g: 'Specifications', sub: [
      { k: 'material', l: 'Material', v: function (d) { return d.material ? [d.material.replace(/\s*\(.*\)/, '')] : []; } },
      { k: 'weight', l: 'Weight', v: function (d) { return bucket(d.weight, [150, 250, 400, 700], ['Under 150 g', '150 to 250 g', '250 to 400 g', '400 to 700 g', '700 g and up']); }, order: ['Under 150 g', '150 to 250 g', '250 to 400 g', '400 to 700 g', '700 g and up'] },
      { k: 'speaker', l: 'Speaker placement', v: function (d) { return d.speaker && d.speaker !== '?' ? [d.speaker] : []; } },
      { k: 'charge', l: 'Charge port', v: function (d) { return d.charge && d.charge !== '?' ? [d.charge] : []; } }
    ] },
    { k: 'ports', l: 'Ports and Connectivity', g: 'Specifications', na: true },
    { k: 'controls', l: 'Controls', g: 'Specifications', sub: [
      { k: 'shoulder', l: 'Shoulder button layout', v: function (d) { return d.shoulder ? [d.shoulder] : []; } },
      { k: 'extra', l: 'Extra controls', v: function (d) { var o = []; CONTROL_KEYS.forEach(function (c) { if (c[1].test(d.controls || '')) o.push(c[0]); }); return o; } }
    ] },
    { k: 'tech', l: 'Technical Specs', g: 'Specifications', sub: [
      { k: 'arch', l: 'Architecture', v: function (d) { return d.arch ? [d.arch] : []; } },
      { k: 'chipb', l: 'Chip maker', v: function (d) { var c = chipBrand(d.chip); return c ? [c] : []; } },
      { k: 'ramb', l: 'RAM', v: function (d) { return bucket(d.ramGB, [2, 4, 8, 16], ['Under 2 GB', '2 to 4 GB', '4 to 8 GB', '8 to 16 GB', '16 GB and up']); }, order: ['Under 2 GB', '2 to 4 GB', '4 to 8 GB', '8 to 16 GB', '16 GB and up'] },
      { k: 'batb', l: 'Battery', v: function (d) { return d.battery && d.battery < 20000 ? bucket(d.battery, [3000, 5000, 7000], ['Under 3,000 mAh', '3,000 to 5,000 mAh', '5,000 to 7,000 mAh', '7,000 mAh and up']) : (d.battery ? ['Large (laptop-class)'] : []); }, order: ['Under 3,000 mAh', '3,000 to 5,000 mAh', '5,000 to 7,000 mAh', '7,000 mAh and up', 'Large (laptop-class)'] }
    ] }
  ];
  var LEAF = []; FACETS.forEach(function (f) { if (f.sub) f.sub.forEach(function (s) { s.g = f.g; LEAF.push(s); }); else if (!f.na) LEAF.push(f); });
  // precompute values and options
  D.forEach(function (d) { d._v = {}; LEAF.forEach(function (f) { d._v[f.k] = f.v(d); }); d._s = (d.name + ' ' + d.brand + ' ' + d.chip + ' ' + d.cpu + ' ' + d.gpu + ' ' + d.best.join(' ') + ' ' + d.os.join(' ') + ' ' + d.form.join(' ') + ' ' + d.cat.join(' ') + ' ' + d.osText + ' ' + d.panel).toLowerCase(); });
  LEAF.forEach(function (f) {
    var c = {}; D.forEach(function (d) { f_vals(d, f).forEach(function (x) { c[x] = (c[x] || 0) + 1; }); });
    var keys = Object.keys(c);
    f.opts = f.order ? f.order.filter(function (x) { return c[x]; }) : keys.sort(function (a, b) { return c[b] - c[a] || a.localeCompare(b); });
    f.counts = c;
  });
  function f_vals(d, f) { return d._v[f.k] || []; }

  var state = { q: '', view: 'full', sort: 'new', sel: {}, limit: 12 };
  try { var sv = localStorage.getItem('hh-view'); if (sv) state.view = sv; } catch (e) {}
  LEAF.forEach(function (f) { state.sel[f.k] = {}; });

  var SORTS = { new: 'Release - Latest first', old: 'Release - Oldest first', phi: 'Price - Highest first', plo: 'Price - Lowest first', pick: 'Staff Picks first' };
  function sortFn(a, b) {
    var s = state.sort;
    if (s === 'new') return b.released.localeCompare(a.released) || a.name.localeCompare(b.name);
    if (s === 'old') return a.released.localeCompare(b.released) || a.name.localeCompare(b.name);
    if (s === 'phi') return (b.price || 0) - (a.price || 0);
    if (s === 'plo') return (a.price || 1e9) - (b.price || 1e9);
    var pa = a.cat.indexOf('Staff Pick') > -1 ? 1 : 0, pb = b.cat.indexOf('Staff Pick') > -1 ? 1 : 0;
    return pb - pa || b.released.localeCompare(a.released);
  }
  function filtered() {
    var q = state.q.trim().toLowerCase(), words = q ? q.split(/\s+/) : [];
    return D.filter(function (d) {
      for (var i = 0; i < words.length; i++) if (d._s.indexOf(words[i]) < 0) return false;
      for (var j = 0; j < LEAF.length; j++) {
        var f = LEAF[j], sel = Object.keys(state.sel[f.k]);
        if (!sel.length) continue;
        var vals = f_vals(d, f), ok = false;
        for (var k = 0; k < sel.length; k++) if (vals.indexOf(sel[k]) > -1) { ok = true; break; }
        if (!ok) return false;
      }
      return true;
    }).sort(sortFn);
  }

  // ---- icon ----
  function icon(d) {
    if (d.img) return '<img src="/img/d/' + d.slug + '/icon.webp" alt="' + esc(d.name) + ' handheld" width="480" height="360" loading="lazy" decoding="async">';
    var f = d.form[0] || 'Horizontal', big = d.size.indexOf('Big') > -1;
    var s = '#0d0f1f', c = '#e9ecff';
    if (f === 'Vertical' || f === 'Micro') return '<svg viewBox="0 0 80 110" aria-hidden="true"><rect x="14" y="4" width="52" height="102" rx="10" fill="' + c + '"/><rect x="22" y="12" width="36" height="40" rx="3" fill="' + s + '"/><rect x="27" y="68" width="14" height="4" fill="' + s + '"/><rect x="32" y="63" width="4" height="14" fill="' + s + '"/><circle cx="52" cy="66" r="3.5" fill="' + s + '"/><circle cx="58" cy="74" r="3.5" fill="' + s + '"/></svg>';
    if (f === 'Clamshell') return '<svg viewBox="0 0 120 90" aria-hidden="true"><rect x="14" y="4" width="92" height="40" rx="8" fill="' + c + '"/><rect x="26" y="10" width="68" height="28" rx="2" fill="' + s + '"/><rect x="14" y="48" width="92" height="38" rx="8" fill="' + c + '" opacity=".85"/><rect x="26" y="62" width="14" height="4" fill="' + s + '"/><rect x="31" y="57" width="4" height="14" fill="' + s + '"/><circle cx="84" cy="62" r="3.5" fill="' + s + '"/><circle cx="92" cy="68" r="3.5" fill="' + s + '"/></svg>';
    if (f === 'Dual-Screen') return '<svg viewBox="0 0 100 120" aria-hidden="true"><rect x="12" y="4" width="76" height="52" rx="8" fill="' + c + '"/><rect x="22" y="10" width="56" height="40" rx="2" fill="' + s + '"/><rect x="12" y="62" width="76" height="52" rx="8" fill="' + c + '"/><rect x="22" y="68" width="56" height="40" rx="2" fill="' + s + '"/></svg>';
    return '<svg viewBox="0 0 160 90" aria-hidden="true"><rect x="' + (big ? 4 : 10) + '" y="12" width="' + (big ? 152 : 140) + '" height="66" rx="22" fill="' + c + '"/><rect x="' + (big ? 36 : 40) + '" y="18" width="' + (big ? 88 : 80) + '" height="54" rx="3" fill="' + s + '"/><rect x="' + (big ? 15 : 20) + '" y="42" width="14" height="4" fill="' + s + '"/><rect x="' + (big ? 20 : 25) + '" y="37" width="4" height="14" fill="' + s + '"/><circle cx="136" cy="40" r="3.5" fill="' + s + '"/><circle cx="143" cy="47" r="3.5" fill="' + s + '"/></svg>';
  }
  function amazon(d) { return d.asin ? 'https://www.amazon.com/dp/' + d.asin + '?tag=' + TAG : 'https://www.amazon.com/s?k=' + encodeURIComponent(d.name + ' handheld') + '&tag=' + TAG; }
  function ali(d) { return d.ali || 'https://www.aliexpress.com/wholesale?SearchText=' + encodeURIComponent(d.name + ' handheld'); }
  var BC = {}; D.forEach(function (d) { BC[d.brand] = (BC[d.brand] || 0) + 1; });
  function slugify(s) { return s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function brandHref(b) { return BC[b] > 1 ? '/handhelds/brand/' + slugify(b) + '/' : '/handhelds/?brand=' + encodeURIComponent(b); }
  function fq(k, v) { return '/handhelds/?' + k + '=' + encodeURIComponent(v); }
  function tagLink(k, v) { return '<a class="hh-tag" data-k="' + k + '" data-v="' + esc(v) + '" href="' + esc(fq(k, v)) + '" title="Show all ' + esc(v) + ' handhelds">' + esc(v) + '</a>'; }
  function nameHtml(d) {
    var b = d.brand, u = href(d);
    if (d.name.indexOf(b) !== 0) return '<a class="hh-nm" href="' + u + '">' + esc(d.name) + '</a>';
    var rest = d.name.slice(b.length).trim();
    return '<a class="hh-brand" href="' + esc(brandHref(b)) + '" title="See all ' + esc(b) + ' handhelds">' + esc(b) + '</a> <a class="hh-nm" href="' + u + '">' + esc(rest) + '</a>';
  }
  function tagsHtml(d) { return d.form.map(function (x) { return tagLink('form', x); }).concat(d.size.map(function (x) { return tagLink('size', x); }), d.os.map(function (x) { return tagLink('os', x); }), d.cat.map(function (x) { return tagLink('cat', x); })).join(''); }
  function kv(rows) { return '<dl class="hh-kv">' + rows.filter(function (r) { return r[1] && r[1] !== '?'; }).map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>'; }
  function top(d) { return [['Released', d.upcoming ? '<b class="hh-up">Upcoming *</b>' : esc(relText(d))], ['OS', esc(d.osText)], ['Screen', esc(d.screen)], ['Best for', esc(d.best.join(', '))], ['Price', '<b class="hh-price">' + esc(d.priceText) + '</b>']]; }
  function href(d) { return '/handhelds/' + d.slug + '/'; }
  function buy(d) { return '<a class="btn hh-buy" href="' + esc(amazon(d)) + '" target="_blank" rel="sponsored nofollow noopener">' + (d.asin ? 'View on Amazon' : 'Search on Amazon') + ' <small>\u2192</small></a> <a class="btn btn2 hh-buy" href="' + esc(ali(d)) + '" target="_blank" rel="nofollow noopener">' + (d.ali ? 'View on AliExpress' : 'Search AliExpress') + ' <small>\u2192</small></a>'; }

  function cardFull(d) {
    return '<article class="hh-card"><h2 class="hh-title">' + nameHtml(d) + '</h2><div class="hh-top"><a class="hh-img" href="' + href(d) + '">' + icon(d) + '</a><div>' + kv(top(d)) + '</div></div><div class="hh-tags">' + tagsHtml(d) + '</div>' +
      '<h3>Screen</h3>' + kv([['Aspect ratio', esc(d.aspect)], ['Screen size', d.screenIn ? d.screenIn + '"' : ''], ['Resolution', esc(d.res)], ['Refresh rate', d.hz ? d.hz + ' Hz' : ''], ['Screen type', esc(d.panel)], ['Pixel density', esc(d.ppi)]]) +
      '<h3>Build and Ergonomics</h3>' + kv([['Material', esc(d.material)], ['Weight', d.weight ? d.weight + ' g' : ''], ['Speaker placement', esc(d.speaker)], ['Charge port', esc(d.charge)]]) +
      '<h3>Controls</h3>' + kv([['Shoulder button layout', esc(d.shoulder)], ['Additional controls', esc(d.controls)]]) +
      '<h3>Technical Specs</h3>' + kv([['Storage', esc(d.storage)], ['Battery', d.battery ? d.battery.toLocaleString('en-US') + ' mAh' : ''], ['RAM', esc(d.ram)], ['RAM type', esc(d.ramType)], ['Architecture', esc(d.arch)], ['Chipset', esc(d.chip)], ['CPU', esc(d.cpu)], ['GPU', esc(d.gpu)]]) +
      '<p><a class="more" href="' + href(d) + '">View full specs →</a></p><p>' + buy(d) + '</p></article>';
  }
  function cardRecap(d) {
    return '<article class="hh-card hh-recap"><h2 class="hh-title">' + nameHtml(d) + '</h2><div class="hh-top"><a class="hh-img" href="' + href(d) + '">' + icon(d) + '</a><div>' + kv(top(d)) + '</div></div><div class="hh-tags">' + tagsHtml(d) + '</div><p>' + buy(d) + '</p></article>';
  }
  function rowPrev(d) {
    return '<div class="hh-row"><a class="hh-rimg" href="' + href(d) + '" tabindex="-1" aria-hidden="true">' + icon(d) + '</a><span class="hh-rmain"><b>' + nameHtml(d) + '</b><span class="hh-rtags">' + tagsHtml(d) + '</span></span><a class="hh-rside" href="' + href(d) + '"><b class="hh-price">' + esc(d.priceText) + '</b><span>' + esc((d.aspect || '').split(',')[0]) + (d.screenIn ? ' \u2022 ' + d.screenIn + '"' : '') + '</span></a></div>';
  }

  var listEl = $('#hh-list'), countEl = $('#hh-count'), moreEl = $('#hh-more');
  function render() {
    var items = filtered(), shown = items.slice(0, state.limit);
    var fn = state.view === 'full' ? cardFull : state.view === 'recap' ? cardRecap : rowPrev;
    listEl.className = 'hh-list hh-' + state.view;
    listEl.innerHTML = shown.length ? shown.map(fn).join('') : '<p class="hh-empty">No handhelds match. Try removing a filter or changing your search.</p>';
    countEl.textContent = items.length + ' of ' + D.length + ' handhelds';
    moreEl.style.display = items.length > shown.length ? '' : 'none';
    moreEl.textContent = 'Show more (' + (items.length - shown.length) + ' left)';
    document.querySelectorAll('[data-view]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-view') === state.view ? 'true' : 'false'); });
    var n = 0; LEAF.forEach(function (f) { n += Object.keys(state.sel[f.k]).length; });
    $('#hh-filter-btn').textContent = 'Filter' + (n ? ' (' + n + ')' : '');
    var chips = []; LEAF.forEach(function (f) { Object.keys(state.sel[f.k]).forEach(function (v) { chips.push('<button type="button" class="hh-chip" data-k="' + f.k + '" data-v="' + esc(v) + '">' + esc(v) + ' ×</button>'); }); });
    syncUrl();
    $('#hh-active').innerHTML = chips.join('') + (chips.length ? '<button type="button" class="hh-clear" id="hh-clear-all">Clear all</button>' : '');
  }
  function syncUrl() {
    try {
      var q = []; LEAF.forEach(function (f) { Object.keys(state.sel[f.k]).forEach(function (v) { q.push(encodeURIComponent(f.k) + '=' + encodeURIComponent(v)); }); });
      history.replaceState(null, '', location.pathname + (q.length ? '?' + q.join('&') : ''));
    } catch (e) {}
  }
  function fromUrl() {
    try {
      new URLSearchParams(location.search).forEach(function (v, k) { var f = LEAF.filter(function (x) { return x.k === k; })[0]; if (f && f.counts[v]) state.sel[k][v] = 1; });
    } catch (e) {}
  }
  function reset() { state.limit = 12; render(); }

  // ---- filter panel ----
  function opts(f) {
    return '<div class="hh-opts">' + f.opts.map(function (o) {
      var id = 'f-' + f.k + '-' + o.replace(/[^a-z0-9]/gi, '');
      return '<label for="' + id + '"><input type="checkbox" id="' + id + '" data-k="' + f.k + '" data-v="' + esc(o) + '"' + (state.sel[f.k][o] ? ' checked' : '') + '> ' + esc(o) + ' <span>' + f.counts[o] + '</span></label>';
    }).join('') + '</div>';
  }
  function buildPanel() {
    var html = '', curG = '';
    FACETS.forEach(function (f) {
      if (f.g !== curG) { curG = f.g; html += '<h3 class="hh-g">' + esc(curG) + '</h3>'; }
      var body;
      if (f.na) body = '<p class="hh-na">We do not have this data yet. It is coming soon.</p>';
      else if (f.sub) body = f.sub.map(function (s) { return '<h4>' + esc(s.l) + '</h4>' + opts(s); }).join('');
      else body = (f.note ? '<p class="hh-na">' + esc(f.note) + '</p>' : '') + opts(f);
      html += '<details class="hh-fg"' + (f.na ? ' data-na="1"' : '') + '><summary>' + esc(f.l) + '</summary>' + body + '</details>';
    });
    $('#hh-panel-body').innerHTML = html;
  }
  function setSel(k, v, on) { if (on) state.sel[k][v] = 1; else delete state.sel[k][v]; }

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches && t.matches('input[data-k]')) { setSel(t.getAttribute('data-k'), t.getAttribute('data-v'), t.checked); reset(); }
    if (t.id === 'hh-sort') { state.sort = t.value; reset(); }
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[data-k]') : null;
    if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
      e.preventDefault();
      LEAF.forEach(function (f) { state.sel[f.k] = {}; }); state.q = ''; $('#hh-q').value = '';
      setSel(a.getAttribute('data-k'), a.getAttribute('data-v'), true);
      buildPanel(); state.limit = state.view === 'preview' ? 40 : 12; render();
      var top = $('#hh-count'); if (top && top.scrollIntoView) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    var t = e.target.closest ? e.target.closest('button,[data-view]') : null;
    if (!t) return;
    if (t.hasAttribute('data-view')) { state.view = t.getAttribute('data-view'); try { localStorage.setItem('hh-view', state.view); } catch (x) {} state.limit = state.view === 'preview' ? 40 : 12; render(); }
    else if (t.id === 'hh-filter-btn') { document.body.classList.toggle('hh-open'); }
    else if (t.id === 'hh-close' || t.id === 'hh-scrim') { document.body.classList.remove('hh-open'); }
    else if (t.id === 'hh-more') { state.limit += state.view === 'preview' ? 60 : 12; render(); }
    else if (t.classList.contains('hh-chip')) { setSel(t.getAttribute('data-k'), t.getAttribute('data-v'), false); var cb = document.querySelector('input[data-k="' + t.getAttribute('data-k') + '"][data-v="' + t.getAttribute('data-v').replace(/"/g, '\\"') + '"]'); if (cb) cb.checked = false; reset(); }
    else if (t.id === 'hh-clear-all' || t.id === 'hh-reset') { LEAF.forEach(function (f) { state.sel[f.k] = {}; }); state.q = ''; $('#hh-q').value = ''; document.querySelectorAll('input[data-k]').forEach(function (c) { c.checked = false; }); reset(); }
  });
  var timer;
  $('#hh-q').addEventListener('input', function (e) { clearTimeout(timer); var v = e.target.value; timer = setTimeout(function () { state.q = v; reset(); }, 120); });
  $('#hh-sort').innerHTML = Object.keys(SORTS).map(function (k) { return '<option value="' + k + '">' + SORTS[k] + '</option>'; }).join('');
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') document.body.classList.remove('hh-open'); });
  fromUrl(); buildPanel(); render();
})();
