# ops — how the Reality fuel log is wired (and how to rebuild it)

Everything campers touch is `reality.html` on GitHub Pages. Writes go through one tiny Cloudflare Worker.
Nothing here holds a secret; secrets live only in Cloudflare (encrypted).

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
6. `reality.html` line ~3: `const WORKER_URL='https://reality-writer.<sub>.workers.dev';` (already set in the committed file).

## Bad day (page / Worker / GitHub dead)
Leads open the backup Sheet link (bookmark + QR on the depot lid) and keep typing rows in the same columns:
`date,time,logged_by,gen1_hours,gen2_hours,gal_gen1,gal_gen2,gal_delivered,drum1_gal,drum2_gal,notes`
A retraction is a row whose notes read `RETRACT#<row>: reason`. When the system revives, paste the Sheet rows into
`data/reality.csv` via the GitHub pencil (5 min) — the page picks them up.

## Guardrails in the Worker
Name required · numbers ≥ 0 with sanity caps (gen pour ≤ 9 gal = tank, drums ≤ 50, delivery ≤ 200) · both drums or neither ·
8 entries/min/IP · retries on commit collision · mirror never blocks the commit.
