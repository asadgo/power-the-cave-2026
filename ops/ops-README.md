# ops — how the Reality fuel log is wired (and how to rebuild it)

Everything campers touch is `reality.html` on GitHub Pages (powerthecave.com/reality). Writes go through one tiny Cloudflare Worker.
Nothing here holds a secret; secrets live only in Cloudflare (encrypted). The repo copies of `worker.js` / `sheet-mirror.gs` are
documentation of what is deployed — changing them means paste + Deploy in Cloudflare / Apps Script too.

## The chain
phone form → `reality-writer` Worker (Cloudflare) → commit to `data/reality.csv` (GitHub) → page reads CSV
                                            ↘ mirror row → backup Google Sheet (independent store)

## Accounts (any mix is fine)
- GitHub repo `asadgo/power-the-cave-2026` — token: fine-grained, this repo only, Contents read/write, expires 2026-11-13.
- Cloudflare Worker `reality-writer` (agoodjbx) — secrets: `GITHUB_TOKEN`, `SHEET_URL`.
- Google Sheet "Cave Fuel Log — BACKUP" (agoodjbx) + bound Apps Script (`sheet-mirror.gs`), deployed as Web app, execute as Me, access Anyone.
- Rule: the Sheet and its Apps Script must be the same Google account. Nothing else needs to match.

## Rebuild from scratch (~20 min, browser only)
1. Cloudflare → Workers & Pages → Create → Hello World → name `reality-writer` → Edit code → paste `ops/worker.js` → Deploy.
2. GitHub → Settings → Developer settings → Fine-grained token → repo only, Contents R/W → copy.
3. Worker → Settings → Variables and Secrets → Secret `GITHUB_TOKEN` = token.
4. Google Sheet → Extensions → Apps Script → paste `ops/sheet-mirror.gs` → Deploy → New deployment → Web app · Me · Anyone → copy `/exec` URL.
5. Worker → Secret `SHEET_URL` = that URL → Edit code → Deploy (secrets bind on deploy — always redeploy after adding one).
6. `reality.html`: `const WORKER_URL='https://reality-writer.<sub>.workers.dev';` (search WORKER_URL; already set in the committed file).
7. Test the chain: log a row whose notes contain a smart quote or accent (José, don’t) → it appears in the ledger and the Sheet;
   log a second row → the first must still read correctly (Worker ≥ v22.2 is UTF-8-safe; older builds mangled it). Retract both.

## Bad day (page / Worker / GitHub dead)
Leads open the backup Sheet link (bookmark + QR on the depot lid) and keep typing rows in the same columns:
`date,time,logged_by,gen1_hours,gen2_hours,gal_gen1,gal_gen2,gal_delivered,drum1_gal,drum2_gal,notes`
A retraction is a row whose notes read `RETRACT#<row>: reason`. When the system revives, paste the Sheet rows into
`data/reality.csv` via the GitHub pencil (5 min) — the page picks them up.

## Guardrails in the Worker
Name required · numbers ≥ 0 with sanity caps (gen pour ≤ 9 gal = tank, drums ≤ 50, delivery ≤ 200) · both drums or neither ·
8 entries/min/IP · retries on commit collision · mirror never blocks the commit · CORS: only https://powerthecave.com and
https://asadgo.github.io may POST (edit `ORIGINS` in worker.js AND the live Worker) · reads/writes the CSV as UTF-8 (v22.2).

## Row numbers are pointers — append only
A retraction cancels row *n* of `data/reality.csv` (1-based data rows, header not counted). The Sheet's human tab uses the same
numbering against its `raw` tab. So: never delete, insert or reorder rows in either store; fix typos in place; if the Sheet ever
misses a mirrored row, `data/reality.csv` is the truth for the pointers.

## Clean start before the event (optional, do both halves together)
The log holds only retracted test rows from 8/15. To start empty on 8/24: GitHub pencil → `data/reality.csv` → keep the header
line only → commit; Sheet → `raw` tab → delete rows 2+ (keep the header). Doing one without the other misaligns RETRACT# pointers.
