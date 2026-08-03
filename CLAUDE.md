# CLAUDE.md — power-the-cave-2026

Camp power planning for The Cave, Burning Man 2026 (Aug 25 – Sep 7).

## The rules

1. **`data/*.csv` is the single source of truth.** Every number — devices,
   schedule, calendar plan, settings — lives there and only there. Column
   docs: `data/README.md`.
2. **No xlsx is ever committed.** The old workbook
   (`2026 Power The Cave v7.2.xlsx`) was a one-time seed and stays local;
   `.gitignore` blocks it. Need a spreadsheet? Generate it from the CSVs.
3. **Always `git pull` before working. Commit and push when done.** The repo
   is the only sync channel between machines and people.

## Layout

- `index.html` — the power console. One self-contained file at root: Chart.js
  is inlined, no CDN or network needed (it must keep working offline on playa).
  It reads `data/*.csv` when served (GitHub Pages or `python3 -m http.server`)
  and offers a folder picker when opened via file://. Console edits live in
  the browser only until exported (⇩ button writes a fresh
  `calendar_plan.csv` to commit).
- `data/` — the CSVs (see rule 1) plus `data/README.md` documenting them.
- `assets/` — images and other static files (`camp_layout.png`).

## When editing

- Change a number → edit the CSV, keep the schema, update `data/README.md` if
  columns change, commit, push.
- Change the console → keep `index.html` a single self-contained file with no
  external requests.
