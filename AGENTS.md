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

## Homepage carousel

Edit `data/homepage.json` (`carousel` array order = slide order).  
To put a slide image on S3: `content:upload -- --home-slot N --file …` then `--execute` when confirmed.

## Rules for agents

- Content changes = JSON + upload CLI. Do **not** change CSS/layout templates unless asked.
- **Never** run `--execute` or `content:gc -- --confirm` unless the user explicitly confirms S3 changes.
- Do **not** put photo binaries in git.
- Bad/missing JSON fields must fail `npm run build` (do not invent schema fields).
