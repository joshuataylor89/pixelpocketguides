(function () {
  var dataEl = document.getElementById('hh-data'); if (!dataEl) return;
  var CFG = JSON.parse(dataEl.textContent), D = CFG.devices, TAG = CFG.tag;
  var init = {}; try { init = JSON.parse(document.getElementById('cmp-init').textContent) || {}; } catch (e) {}
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var BY = {}; D.forEach(function (d) { BY[d.slug] = d; });
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function relText(d) { if (d.upcoming) return 'Upcoming *'; var p = d.released.split('-'); return MONTHS[+p[1] - 1] + '. ' + p[0]; }
  function icon(d) {
    if (d.img) return '<img src="/img/d/' + d.slug + '/icon.webp" alt="' + esc(d.name) + ' handheld" width="480" height="360" loading="lazy" decoding="async">';
    var f = d.form[0] || 'Horizontal', big = d.size.indexOf('Big') > -1;
    var s = '#0d0f1f', c = '#e9ecff';
    if (f === 'Vertical' || f === 'Micro') return '<svg viewBox="0 0 80 110" aria-hidden="true"><rect x="14" y="4" width="52" height="102" rx="10" fill="' + c + '"/><rect x="22" y="12" width="36" height="40" rx="3" fill="' + s + '"/><rect x="27" y="68" width="14" height="4" fill="' + s + '"/><rect x="32" y="63" width="4" height="14" fill="' + s + '"/><circle cx="52" cy="66" r="3.5" fill="' + s + '"/><circle cx="58" cy="74" r="3.5" fill="' + s + '"/></svg>';
    if (f === 'Clamshell') return '<svg viewBox="0 0 120 90" aria-hidden="true"><rect x="14" y="4" width="92" height="40" rx="8" fill="' + c + '"/><rect x="26" y="10" width="68" height="28" rx="2" fill="' + s + '"/><rect x="14" y="48" width="92" height="38" rx="8" fill="' + c + '" opacity=".85"/><rect x="26" y="62" width="14" height="4" fill="' + s + '"/><rect x="31" y="57" width="4" height="14" fill="' + s + '"/><circle cx="84" cy="62" r="3.5" fill="' + s + '"/><circle cx="92" cy="68" r="3.5" fill="' + s + '"/></svg>';
    if (f === 'Dual-Screen') return '<svg viewBox="0 0 100 120" aria-hidden="true"><rect x="12" y="4" width="76" height="52" rx="8" fill="' + c + '"/><rect x="22" y="10" width="56" height="40" rx="2" fill="' + s + '"/><rect x="12" y="62" width="76" height="52" rx="8" fill="' + c + '"/><rect x="22" y="68" width="56" height="40" rx="2" fill="' + s + '"/></svg>';
    return '<svg viewBox="0 0 160 90" aria-hidden="true"><rect x="' + (big ? 4 : 10) + '" y="12" width="' + (big ? 152 : 140) + '" height="66" rx="22" fill="' + c + '"/><rect x="' + (big ? 36 : 40) + '" y="18" width="' + (big ? 88 : 80) + '" height="54" rx="3" fill="' + s + '"/><rect x="' + (big ? 15 : 20) + '" y="42" width="14" height="4" fill="' + s + '"/><rect x="' + (big ? 20 : 25) + '" y="37" width="4" height="14" fill="' + s + '"/><circle cx="136" cy="40" r="3.5" fill="' + s + '"/><circle cx="143" cy="47" r="3.5" fill="' + s + '"/></svg>';
  }

  var UP = '<svg class="ci ci-up" viewBox="0 0 24 24" role="img" aria-label="Ranks higher"><circle cx="12" cy="12" r="12" fill="#3fb950"/><path d="M6.5 14.5 12 9l5.5 5.5" fill="none" stroke="#0d1a10" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var DN = '<svg class="ci ci-dn" viewBox="0 0 24 24" role="img" aria-label="Ranks lower"><circle cx="12" cy="12" r="12" fill="#e5534b"/><path d="M6.5 9.5 12 15l5.5-5.5" fill="none" stroke="#2a0d0b" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var EQ = '<svg class="ci ci-eq" viewBox="0 0 24 24" role="img" aria-label="Equal"><circle cx="12" cy="12" r="12" fill="#f0c64a"/><path d="M7 9.5h10M7 14.5h10" stroke="#2b2206" stroke-width="2.6" stroke-linecap="round"/></svg>';
  var PANEL = { 'AMOLED': 3, 'OLED': 3, 'IPS': 2, 'LTPS': 1.5, 'TFT': 1, 'LCD': 1 };
  var pix = function (d) { var m = (d.res || '').match(/(\d+)\s*[x×]\s*(\d+)/i); return m ? +m[1] * +m[2] : null; };
  var ppi = function (d) { var m = (d.ppi || '').match(/\d+/); return m ? +m[0] : null; };
  // [section, label, display(d), rank(d) -> number|null, higherIsBetter]
  var ROWS = [
    ['Screen', 'Aspect Ratio', function (d) { return d.aspect; }],
    ['Screen', 'Screen Size', function (d) { return d.screenIn ? d.screenIn + '"' : ''; }, function (d) { return d.screenIn; }, 1],
    ['Screen', 'Resolution', function (d) { return d.res; }, pix, 1],
    ['Screen', 'Refresh Rate', function (d) { return d.hz ? d.hz + ' Hz' : ''; }, function (d) { return d.hz; }, 1],
    ['Screen', 'Screen Type', function (d) { return d.panel; }, function (d) { return PANEL[d.panel] || null; }, 1],
    ['Screen', 'Pixel Density', function (d) { return d.ppi; }, ppi, 1],
    ['Build and Ergonomics', 'Material', function (d) { return d.material; }],
    ['Build and Ergonomics', 'Weight', function (d) { return d.weight ? d.weight + ' g' : ''; }, function (d) { return d.weight; }, -1],
    ['Build and Ergonomics', 'Speaker Placement', function (d) { return d.speaker; }],
    ['Build and Ergonomics', 'Charge Port', function (d) { return d.charge; }],
    ['Controls', 'Shoulder Button Layout', function (d) { return d.shoulder; }],
    ['Controls', 'Additional Controls', function (d) { return d.controls; }],
    ['Technical Specs', 'Storage', function (d) { return d.storage; }],
    ['Technical Specs', 'Battery', function (d) { return d.battery ? d.battery.toLocaleString('en-US') + ' mAh' : ''; }, function (d) { return d.battery; }, 1],
    ['Technical Specs', 'RAM', function (d) { return d.ram; }, function (d) { return d.ramGB; }, 1],
    ['Technical Specs', 'RAM Type', function (d) { return d.ramType; }],
    ['Technical Specs', 'Architecture', function (d) { return d.arch; }],
    ['Technical Specs', 'Chipset', function (d) { return d.chip; }],
    ['Technical Specs', 'CPU', function (d) { return d.cpu; }],
    ['Technical Specs', 'GPU', function (d) { return d.gpu; }]
  ];
  var PRICE = [function (d) { return d.price; }, -1];
  function cmp(r, a, b) { // returns [ia, ib] indicator html or ['','']
    if (!r[3]) return ['', ''];
    var x = r[3](a), y = r[3](b);
    if (x == null || y == null) return ['', ''];
    var dir = r[4];
    if (x === y) return [EQ, EQ];
    return (x - y) * dir > 0 ? [UP, DN] : [DN, UP];
  }
  var good = function (v) { return v && v !== '?'; };

  var sel = { a: null, b: null };
  function setSel(side, d) { sel[side] = d; sync(); render(); }
  function sync() {
    try {
      var q = []; if (sel.a) q.push('a=' + sel.a.slug); if (sel.b) q.push('b=' + sel.b.slug);
      history.replaceState(null, '', '/compare/' + (q.length ? '?' + q.join('&') : ''));
    } catch (e) {}
    ['a', 'b'].forEach(function (k) { $('#cmp-' + k).value = sel[k] ? sel[k].name : ''; });
  }
  function pct(x, y) { return Math.round((x > y ? x / y - 1 : 1 - x / y) * 100); }
  function diffs(a, b) {
    var out = [], A = a.name, B = b.name;
    var f = function (ico, txt) { out.push('<li>' + ico.replace('<svg class="ci', '<svg class="ci sm') + '<span>' + txt + '</span></li>'); };
    if (a.price && b.price && a.price !== b.price) { var p = pct(a.price, b.price); f(a.price < b.price ? UP : DN, 'It costs about <b>' + p + '% ' + (a.price < b.price ? 'less' : 'more') + '</b> (' + esc(a.priceText) + ' vs ' + esc(b.priceText) + ')'); }
    var oa = a.osText.replace(/,\s*$/, ''), ob = b.osText.replace(/,\s*$/, '');
    if (oa !== ob) f(EQ, 'It runs on <b>' + esc(oa) + '</b>, versus <b>' + esc(ob) + '</b>');
    if (a.weight && b.weight && pct(a.weight, b.weight) >= 3) f(a.weight < b.weight ? UP : DN, 'It is <b>' + pct(a.weight, b.weight) + '% ' + (a.weight < b.weight ? 'lighter' : 'heavier') + '</b> (' + a.weight + ' g vs ' + b.weight + ' g)');
    if (a.screenIn && b.screenIn && pct(a.screenIn, b.screenIn) >= 3) {
      var t = 'It has a <b>' + pct(a.screenIn, b.screenIn) + '% ' + (a.screenIn > b.screenIn ? 'bigger' : 'smaller') + '</b> screen';
      var pa = pix(a), pb = pix(b); if (pa && pb && pct(pa, pb) >= 5) t += ', and a <b>' + pct(pa, pb) + '% ' + (pa > pb ? 'higher' : 'lower') + '</b> resolution';
      f(a.screenIn > b.screenIn ? UP : DN, t);
    }
    if (a.panel && b.panel && (a.panel !== b.panel || a.hz !== b.hz)) { var sa = (PANEL[a.panel] || 0) * 1000 + (a.hz || 0), sb = (PANEL[b.panel] || 0) * 1000 + (b.hz || 0); f(sa === sb ? EQ : sa > sb ? UP : DN, 'It has a <b>' + (a.hz ? a.hz + 'Hz ' : '') + esc(a.panel) + '</b> screen, versus <b>' + (b.hz ? b.hz + 'Hz ' : '') + esc(b.panel) + '</b>'); }
    if (a.battery && b.battery && pct(a.battery, b.battery) >= 5) f(a.battery > b.battery ? UP : DN, 'It has a <b>' + pct(a.battery, b.battery) + '% ' + (a.battery > b.battery ? 'bigger' : 'smaller') + '</b> battery (' + a.battery.toLocaleString('en-US') + ' vs ' + b.battery.toLocaleString('en-US') + ' mAh)');
    if (a.ramGB && b.ramGB && a.ramGB !== b.ramGB) f(a.ramGB > b.ramGB ? UP : DN, 'It has <b>' + esc(a.ram) + '</b> of RAM, versus <b>' + esc(b.ram) + '</b>');
    if (a.chip && b.chip && a.chip !== b.chip) f(EQ, 'It uses the <b>' + esc(a.chip) + '</b> chipset, versus <b>' + esc(b.chip) + '</b>');
    if (!out.length) out.push('<li>' + EQ + '<span>These two are very close on the specs we track.</span></li>');
    return '<ul class="cmp-diff">' + out.join('') + '</ul>';
  }
  function score(a, b) {
    var s = 0; ROWS.concat([['', '', null, PRICE[0], PRICE[1]]]).forEach(function (r) { var c = cmp(r, a, b); if (c[0] === UP) s++; else if (c[0] === DN) s--; });
    return s;
  }
  function nameHtml(d) { var br = d.name.indexOf(d.brand) === 0; return br ? '<span class="hh-brand">' + esc(d.brand) + '</span> ' + esc(d.name.slice(d.brand.length).trim()) : esc(d.name); }
  function amazonLink(d) { return d.asin ? 'https://www.amazon.com/dp/' + d.asin + '?tag=' + TAG : 'https://www.amazon.com/s?k=' + encodeURIComponent(d.name + ' handheld') + '&tag=' + TAG; }
  function aliLink(d) { return d.ali || 'https://www.aliexpress.com/wholesale?SearchText=' + encodeURIComponent(d.name + ' handheld'); }
  function btns(d) { return '<a class="btn hh-buy" href="' + esc(amazonLink(d)) + '" target="_blank" rel="sponsored nofollow noopener">Amazon <small>\u2192</small></a><a class="btn btn2 hh-buy" href="' + esc(aliLink(d)) + '" target="_blank" rel="nofollow noopener">AliExpress <small>\u2192</small></a>'; }
  function sizeBox(a, b) {
    var m = Math.max(a.screenIn || 4, b.screenIn || 4);
    var w = function (d) { return Math.max(26, Math.round((d.screenIn || 4) / m * 100)); };
    return '<div class="cmp-size"><div style="width:' + w(a) + '%">' + icon(a) + '</div><div style="width:' + w(b) + '%">' + icon(b) + '</div></div><p class="cmp-note">Drawn in proportion to screen size. Dimensions are not in our data yet.</p>';
  }
  function render() {
    var out = $('#cmp-out'), a = sel.a, b = sel.b;
    $('#cmp-sugg').style.display = a && b ? 'none' : '';
    var st = $('#cmp-static'); if (st) st.style.display = 'none';
    if (!a || !b) { out.innerHTML = '<p class="cmp-empty">' + (a || b ? 'Now pick a second handheld to compare.' : 'Pick two handhelds to see them side by side.') + '</p>'; $('#cmp-h1').textContent = 'Compare Gaming Handhelds'; document.title = 'Compare Retro Handhelds Side by Side | Pixel Pocket Guides'; return; }
    $('#cmp-h1').textContent = a.name + ' vs. ' + b.name + ' Comparison';
    document.title = a.name + ' vs ' + b.name + ': Specs Comparison | Pixel Pocket Guides';
    var sc = score(a, b), ca = sc > 0 ? 'win' : sc < 0 ? 'lose' : 'tie', cb = sc > 0 ? 'lose' : sc < 0 ? 'win' : 'tie';
    var head = function (d, c, x) { return '<h2 class="cmp-ttl ' + c + '">' + nameHtml(d) + (x ? '<button type="button" class="cmp-x" data-clear="b" aria-label="Remove ' + esc(d.name) + '">×</button>' : '') + '</h2>'; };
    var pc = cmp(['', '', null, PRICE[0], PRICE[1]], a, b);
    var info = function (d, ind) { return '<div class="cmp-info"><div class="cmp-img">' + icon(d) + '</div><dl class="hh-kv"><div><dt>Released</dt><dd>' + esc(relText(d)) + '</dd></div><div><dt>OS</dt><dd>' + esc(d.osText.replace(/,\s*$/, '')) + '</dd></div><div><dt>Screen</dt><dd>' + esc(d.screen) + '</dd></div>' + (d.best.length ? '<div><dt>Best For</dt><dd>' + esc(d.best.join(', ')) + '</dd></div>' : '') + '<div><dt>Price</dt><dd><b class="hh-price">' + esc(d.priceText) + '</b> ' + ind + '</dd></div></dl></div>'; };
    var h = '<section class="cmp-panel"><h2>Size Difference</h2>' + sizeBox(a, b) + '</section>';
    h += '<section class="cmp-panel"><h2>Main Differences</h2>' + diffs(a, b) + '</section>';
    h += '<div class="cmp-legend"><span>' + UP + ' Device ranks higher in this category.</span><span>' + DN + ' Device ranks lower in this category</span><span>' + EQ + ' Devices are equal in this category</span></div>';
    h += '<div class="cmp-pair">' + head(a, ca) + head(b, cb, 1) + '</div>';
    h += '<div class="cmp-pair">' + info(a, pc[0]) + info(b, pc[1]) + '</div>';
    var cur = '';
    ROWS.forEach(function (r) {
      var va = r[2](a), vb = r[2](b); if (!good(va) && !good(vb)) return;
      if (r[0] !== cur) { cur = r[0]; h += '<h3 class="cmp-sec">' + esc(cur) + '</h3>'; }
      var c = cmp(r, a, b);
      var cell = function (v, i) { return '<div class="cmp-cell">' + (i ? '<span class="cmp-ind">' + i + '</span>' : '') + '<span class="cmp-l">' + esc(r[1]) + '</span><span class="cmp-v">' + (good(v) ? esc(v) : '?') + '</span></div>'; };
      h += '<div class="cmp-pair cmp-rowp">' + cell(va, c[0]) + cell(vb, c[1]) + '</div>';
    });
    h += '<div class="cmp-pair cmp-foot"><div><a class="more" href="/handhelds/' + a.slug + '/">Full specs →</a>' + btns(a) + '</div><div><a class="more" href="/handhelds/' + b.slug + '/">Full specs →</a><a class="btn hh-buy" href="' + esc(amazonLink(b)) + '" target="_blank" rel="sponsored nofollow noopener">Check price on Amazon <small>→</small></a></div></div>';
    out.innerHTML = h;
  }
  // ---- search boxes ----
  function box(side) {
    var inp = $('#cmp-' + side), list = $('#cmp-' + side + '-list'), idx = -1, cur = [];
    function show() {
      var q = inp.value.trim().toLowerCase(), words = q ? q.split(/\s+/) : [];
      if (sel[side] && inp.value === sel[side].name) words = [];
      cur = D.filter(function (d) { if (sel[side === 'a' ? 'b' : 'a'] === d) return false; var s = (d.name + ' ' + d.brand).toLowerCase(); return words.every(function (w) { return s.indexOf(w) > -1; }); }).sort(function (x, y) { var n = q.replace(/\s+/g, ' '), rx = x.name.toLowerCase() === n ? 0 : 1, ry = y.name.toLowerCase() === n ? 0 : 1; return rx - ry || x.name.length - y.name.length; }).slice(0, 8);
      idx = -1; list.innerHTML = cur.map(function (d, i) { return '<li role="option" data-i="' + i + '"><b>' + esc(d.name) + '</b><span>' + esc(d.priceText) + '</span></li>'; }).join('') || '<li class="none">No match</li>';
      list.hidden = false;
    }
    function pick(i) { if (cur[i]) { list.hidden = true; inp.blur(); setSel(side, cur[i]); } }
    inp.addEventListener('focus', function () { inp.select(); show(); });
    inp.addEventListener('input', show);
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); idx = Math.max(0, Math.min(cur.length - 1, idx + (e.key === 'ArrowDown' ? 1 : -1))); Array.prototype.forEach.call(list.children, function (li, i) { li.classList.toggle('on', i === idx); }); }
      else if (e.key === 'Enter') { e.preventDefault(); pick(idx < 0 ? 0 : idx); }
      else if (e.key === 'Escape') { list.hidden = true; }
    });
    list.addEventListener('mousedown', function (e) { var li = e.target.closest('li[data-i]'); if (li) { e.preventDefault(); pick(+li.getAttribute('data-i')); } });
    inp.addEventListener('blur', function () { setTimeout(function () { list.hidden = true; inp.value = sel[side] ? sel[side].name : ''; }, 120); });
  }
  box('a'); box('b');
  $('#cmp-swap').addEventListener('click', function () { var t = sel.a; sel.a = sel.b; sel.b = t; sync(); render(); });
  document.addEventListener('click', function (e) {
    var x = e.target.closest('[data-clear]'); if (x) { sel[x.getAttribute('data-clear')] = null; sync(); render(); return; }
    var s = e.target.closest('a[data-pair]'); if (s) { e.preventDefault(); var p = s.getAttribute('data-pair').split(','); sel.a = BY[p[0]]; sel.b = BY[p[1]]; sync(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });
  var qs = {}; try { new URLSearchParams(location.search).forEach(function (v, k) { qs[k] = v; }); } catch (e) {}
  sel.a = BY[qs.a || init.a] || null; sel.b = BY[qs.b || init.b] || null;
  if (init.a && !qs.a && !qs.b) { /* keep static path */ $('#cmp-a').value = sel.a ? sel.a.name : ''; $('#cmp-b').value = sel.b ? sel.b.name : ''; } else sync();
  render();
})();
