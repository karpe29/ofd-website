# OFD content workflow (Cursor / Claude)

Git is the source of truth. Photos live on shared S3 `weddings/media/`. The live site serves prerendered HTML only (no runtime JSON).

## Commands

| Command | What it does |
|---------|----------------|
| `npm run build` | `json2html` → SSI → rest of Grunt → `build/` |
| `npm run content:upload -- --slug <slug>` | Dry-run: staging → would upload to S3 + write JSON |
| `npm run content:upload -- --slug <slug> --execute` | **Actually uploads to S3** (only when confirmed) |
| `npm run content:upload -- --home-slot 0 --file ./pic.png` | Dry-run home carousel image |
| `npm run content:gc` | List unused S3 `weddings/media/` objects (dry-run) |
| `npm run content:gc -- --confirm` | Delete orphans (manual only — never in CI) |

## Add / update a blog gallery

1. Put images in `content/staging/<slug>/` (sorted by filename = order).
2. Dry-run: `npm run content:upload -- --slug <slug>`
3. After human confirms S3 upload: add `--execute`
4. Edit `data/blogs/<slug>.json` title if needed; reorder `images` array to change display order.
5. Add/update card in `data/blog-landing.json` (`type: post|film|hashtags`).
6. Ensure a page shell exists (e.g. `monisha-monish1.shtml`) that includes `view/generated/blog-<slug>-gallery.html`.
7. Commit **JSON + shtml** only — never staging photos or `.env`.
8. Push `dev` for Pages preview, `main` for S3 site.

## Image delivery (consistent)

All content images on S3 under `weddings/media/**` are **WebP**:

| Role | Max long edge | WebP quality | Path pattern |
|------|---------------|--------------|--------------|
| Thumb / grid | 800px | 82 | `.../thumnail/*.webp` |
| Full / popup / portfolio | 1800px | 85 | `.../popup/*.webp` or portfolio paths |
| Home / films / landing tiles | 1200px | 85 | flat or section folders |

Re-optimize everything: `npm run content:optimize -- --execute`  
New uploads via `content:upload` use the same presets.


| Area | File(s) |
|------|---------|
| Homepage (carousel, collage, letter, album, films, artists, insta) | `data/homepage.json` |
| Blog landing cards | `data/blog-landing.json` |
| Masonry galleries (couples + nandi/sumit) | `data/blogs/<slug>.json` |
| Stack portfolios (Chinmayee, wedding-portfolio, photo-projects) | `data/portfolios/<slug>.json` |
| Films landing | `data/films-landing.json` |
| Films listing | `data/films-listing.json` |

Image **order** in galleries = array order in JSON.


## Rules for agents

- Content changes = JSON + upload CLI. Do **not** change CSS/layout templates unless asked.
- **Never** run `--execute` or `content:gc -- --confirm` unless the user explicitly confirms S3 changes.
- Do **not** put photo binaries in git.
- Bad/missing JSON fields must fail `npm run build` (do not invent schema fields).
