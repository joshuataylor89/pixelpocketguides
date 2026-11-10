# Pixel Pocket Guides

Static site for PixelPocketGuides.com: retro handheld buying guides with Amazon affiliate links.

## Edit and build

```
node build.mjs
```

This regenerates everything in `public/` (no dependencies needed, Node 18+).

| File | What it controls |
|---|---|
| `config.json` | Site name, domain, **your Amazon Associates tag** (`amazonTag`) |
| `data/products.json` | Every product: specs, pros/cons, verdict, Amazon link, image |
| `build.mjs` | Page templates and the two guide posts |
| `static/` | CSS and favicon, copied into `public/` |

## Before you publish

1. **Set your affiliate tag.** Replace `YOURTAG-20` in `config.json` with your Amazon Associates tracking ID, then run `node build.mjs`.
2. **Use direct product links (recommended).** Each product has an empty `"asin": ""`. Find the product on Amazon, copy the 10-character ASIN from the URL (`/dp/XXXXXXXXXX`), and paste it in. With no ASIN the button links to an Amazon search for that product, which still earns commission but is less direct.
3. **Add product images the Amazon-approved way.** In Associates Central, open the product page and use the SiteStripe bar to get an image link, then paste the image URL into `"image"`. Do not download Amazon or other review sites' photos and re-host them. Amazon's Associates terms restrict it, and the review sites own their photos. Until you add one, a placeholder illustration is shown.
4. **Prices.** Prices on the page are rough figures reported by reviewers. Amazon's terms limit showing Amazon prices that are not fetched live from their API, so the pages tell readers to check Amazon for the current price. Keep it that way unless you set up the Product Advertising API.
5. **Associates account.** Amazon requires qualifying sales within the first 180 days of approval. Keep the disclosure in the footer and on each post.

## Deploy on Cloudflare Pages (via GitHub)

1. Push this folder to your GitHub repo (`public/` is committed, so it works either way).
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**, pick the repo.
3. Build settings: **Build command** `node build.mjs`, **Build output directory** `public`.
4. After the first deploy, open the project → **Custom domains → Set up a domain** → `pixelpocketguides.com` (and `www`).
5. Optional: enable Web Analytics in Cloudflare for privacy-friendly traffic stats, then mention it on the privacy page.
