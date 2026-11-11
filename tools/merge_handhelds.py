"""Merge a raw Retro Catalog text export (parsed by parse_handhelds.py) into data/handhelds.json.
Usage: python3 tools/merge_handhelds.py raw.json  (existing devices are kept; new ones are added)"""
import json, re, sys
raw = json.load(open(sys.argv[1], encoding='utf-8'))
path = 'data/handhelds.json'
old = json.load(open(path, encoding='utf-8'))
have = {x['name'].lower() for x in old}
MON = {m: i + 1 for i, m in enumerate('Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split())}
BRANDS = ['Sony Ericsson', 'One Netbook', 'Game Console', 'Game Kiddy', 'KT Pocket', 'Game Pad Digital', 'GamePad Digital','Data Frog','Serious Play','Experimental Pi','Funny Playing'] + sorted({x['brand'] for x in old}, key=len, reverse=True)
FORM = {'Horizontal', 'Vertical', 'Dual-Screen', 'Clamshell', 'Micro'}
SIZE = {'Big', 'Small', 'Micro'}
OS = {'Linux', 'Android', 'Windows'}
CAT = {'Budget', 'Mid-Range', 'Powerful', 'High-End', 'Ultra Budget', 'Staff Pick', 'Original Hardware'}
num = lambda s: (lambda m: float(m.group(0).replace(',', '')) if m else None)(re.search(r'[\d,]*\.?\d+', s or ''))
added = 0
for r in raw:
    if r['name'].lower() in have: continue
    m = re.match(r'([A-Za-z]{3})\.? (\d{4})', r['released'])
    rel = f"{m.group(2)}-{MON[m.group(1)]:02d}" if m else ''
    brand = next((b for b in BRANDS if r['name'].lower().startswith(b.lower())), r['name'].split()[0])
    tags = [t for t in r['tags'] if t in FORM | SIZE | OS | CAT]
    osraw = r['OS'].rstrip(',')
    os_ = [o for o in OS if osraw.startswith(o)] or ([] if osraw != 'Proprietary' else ['Proprietary'])
    os_ += [t for t in tags if t in OS and t not in os_]
    price = num(r['Price']) if '?' not in r['Price'] else None
    ramv = num(r['RAM']); ramGB = None
    if ramv is not None:
        ramGB = ramv / 1024 if re.search(r'\bMB\b|MB ', r['RAM'] + ' ') and 'GB' not in r['RAM'] else ramv
    hz = int(num(r['Refresh Rate'])) if re.search(r'\d+ ?Hz', r['Refresh Rate']) else None
    scr = r['Screen']; sc = re.match(r'(.*?),\s*([\d:]+|Top:.*)$', scr)
    d = {
        'name': r['name'], 'brand': brand, 'released': rel, 'upcoming': rel > '2026-11',
        'price': int(price) if price else None, 'priceText': f"~${int(price)}" if price else 'Price varies',
        'form': [t for t in tags if t in FORM], 'size': [t for t in tags if t in SIZE], 'os': os_,
        'osText': r['OS'].rstrip(','), 'cat': [t for t in tags if t in CAT],
        'best': [b.strip() for b in r['Best For'].split(',') if b.strip()],
        'screen': scr, 'aspect': r['Aspect Ratio'], 'screenIn': num(r['Screen Size']), 'res': r['Resolution'],
        'hz': hz, 'panel': r['Screen Type'], 'ppi': r['Pixel Density'], 'material': r['Material'] or '?',
        'weight': int(num(r['Weight'])) if num(r['Weight']) else None, 'speaker': r['Speaker Placement'], 'charge': r['Charge Port'],
        'shoulder': r['Shoulder Button Layout'], 'controls': r['Additional Controls'], 'storage': r['Storage'],
        'battery': int(num(r['Battery'])) if num(r['Battery']) else None, 'ram': r['RAM'], 'ramGB': ramGB,
        'ramType': r['RAM Type'], 'arch': r['Architecture'], 'chip': r['Chipset'], 'cpu': r['CPU'], 'gpu': r['GPU'],
    }
    old.append(d); have.add(r['name'].lower()); added += 1
json.dump(old, open(path, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print('added', added, 'total', len(old))
