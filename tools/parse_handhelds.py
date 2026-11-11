import re, json, sys
src = sys.argv[1]
t = [x.strip() for x in open(src, encoding='utf-8').read().split("\n")]
starts = [i for i, l in enumerate(t) if l.startswith("Released") and i > 0 and t[i-1] and not t[i-1].startswith("Released")]
LABELS = ["OS","Screen","Up To","Best For","Price","Aspect Ratio","Screen Size","Resolution","Refresh Rate","Screen Type","Pixel Density","Material","Weight","Speaker Placement","Charge Port","Shoulder Button Layout","Additional Controls","Storage","Battery","RAM","RAM Type","Architecture","Chipset","CPU","GPU"]
devs = []
for n, i in enumerate(starts):
    end = starts[n+1] - 1 if n + 1 < len(starts) else len(t)
    blk = t[i:end]
    d = {"name": t[i-1]}
    rel = blk[0][len("Released"):].strip()
    if not rel:
        rel = next((x for x in blk[1:4] if x), "")
    d["released"] = rel
    # field lookup: label then value on next non-empty line
    def val(lab):
        for k, x in enumerate(blk):
            if x == lab:
                for y in blk[k+1:k+4]:
                    if y and y not in LABELS: return y
                return ""
            if lab in ("Screen","Best For") and x.startswith(lab) and len(x) > len(lab) and x != lab:
                return x[len(lab):].strip()
        return ""
    for lab in LABELS:
        d[lab] = val(lab)
    # multi-line additional controls
    for k, x in enumerate(blk):
        if x == "Additional Controls":
            parts = []
            for y in blk[k+1:k+6]:
                if y in LABELS or y in ("Technical Specs","Technical Specs *","*"): break
                parts.append(y)
            d["Additional Controls"] = " ".join(p for p in parts if p)
    # tags: line(s) before 'More details'
    j = next((k for k, x in enumerate(blk) if x == "More details"), len(blk))
    tags = []
    k = j - 1
    while k >= 0 and (blk[k].endswith(",") or (not tags and blk[k] and blk[k] not in LABELS and not re.match(r'^[\d.,/ ]+$', blk[k]))):
        tags.insert(0, blk[k].rstrip(","))
        if not blk[k].endswith(","): 
            k -= 1
            continue
        k -= 1
    d["tags"] = [x for x in tags if x]
    devs.append(d)
json.dump(devs, open(sys.argv[2], "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print(len(devs))
