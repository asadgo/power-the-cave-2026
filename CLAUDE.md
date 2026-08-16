# CLAUDE.md — power-the-cave-2026

Camp power plan + on-playa fuel log for The Cave, Burning Man 2026 (Aug 25 – Sep 7).
Live at https://powerthecave.com (GitHub Pages, custom domain via `CNAME`; the old
asadgo.github.io URL redirects). Pages: `/` = PROJECTED console, `/reality` = fuel log,
`/projected` = alias of `/`.

## The rules

1. **`data/*.csv` is the single source of truth.** Every plan number lives there and only
   there. Column docs: `data/README.md`.
2. **No xlsx is ever committed** (`.gitignore` blocks it). The 2026 workbook was a one-time seed.
3. **Every change to a page or a CSV gets a new row in `data/log.csv`** (`version,date,change`).
   Both pages show the last row's version in their header — that is how an upload is confirmed
   (press ⟳ on the console, reload on Reality).
4. **Browser-only workflow.** Asad has no terminal or local git. Files reach GitHub via the web
   uploader (repo page → Add file → Upload files) or the pencil editor. Claude sessions clone
   read-only, edit, verify with headless Playwright at desktop and 390 px, and hand back files
   with their destination folder (root vs `data/` vs `ops/`).
5. **Pages must work offline.** Chart.js is inlined; no CDN. Console edits are browser-local
   (localStorage) until “Make this the official plan” produces CSVs to upload; ⟳ resets to the
   committed CSVs.

## Layout

- `index.html` — PROJECTED console. Reads `settings, devices, schedule, calendar_plan,
  personal_items` (+ optional `device_days` = per-day differences, + `log` for the version).
  “Make this the official plan” writes all six data CSVs from the screen (calendar + all 14 days).
- `reality.html` — REALITY fuel log. Carries a ported copy of the console model (block marked
  “MODEL ported from index.html” — re-port if the console model changes). Reads
  `data/reality.csv` from raw.githubusercontent.com first (fresh), Pages copy as fallback.
  Writes go through the Cloudflare Worker documented in `ops/`.
- `projected.html` — 242-byte redirect to `/`. Never edited.
- `data/` — the CSVs + `data/README.md`.
- `ops/` — `worker.js` (Cloudflare Worker `reality-writer`), `sheet-mirror.gs` (Apps Script for
  the backup Google Sheet), `ops-README.md` (accounts, rebuild, bad day). The repo copies are
  documentation: a Worker change also needs paste + Deploy in Cloudflare.
- `SHOPPING.md` — power shopping / load-in verification list.
- `assets/camp_layout.png` — reference image only; nothing links to it.
- `CNAME` — `powerthecave.com`. Never delete it.

## When editing

- Change a number → edit the CSV, keep the schema, update `data/README.md` if columns change,
  log it.
- Change a page → keep it one self-contained file (no external requests except Reality's Worker
  and raw-GitHub reads), verify both viewports, log it.
- Device names `Air Conditioning Units`, `Fans`, `E-bike charging station` are pattern-matched
  by the console (comfort scaling, calendar sync); renaming them breaks that. `bus=Battery`
  rows are the never-cut Critical group; the four Source rows are matched by name.
- `data/reality.csv` is append-only; retractions point at row numbers (see `data/README.md`).
