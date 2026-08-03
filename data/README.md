# data/ — the single source of truth

Every number the console (`/index.html`) shows comes from these CSVs. They were
seeded once from `2026 Power The Cave v7.2.xlsx` (sheet named in each section);
from now on **the CSVs are authoritative** — the workbook is not committed.

## settings.csv — `key,value,note`
Policy dials and machine specs (workbook *Setup* sheet), plus the console's own
model constants (marked `[console model constant, from console v44]` — these
existed only in the old console HTML, not in the workbook).

## devices.csv — one row per device type (workbook *Devices* sheet)
`device,area,category,product,qty,running_w_each,surge_w_each,volts,bus,priority,notes`
- `bus`: `Battery` (never-cut core) or `Pool` (generator pool).
- `priority`: `Never cut` / `Cut if needed` / `Cut first`.
- Derived columns from the workbook (total W = qty × running_w_each, start kick
  = surge − running) are **not** stored; the console recomputes them.
- Three device names are special to the console's AC/comfort scaling:
  `Air Conditioning Units`, `Fans`, `E-bike charging station`. Rename them and
  the console's ALICE (comfort) curve loses that load.

## schedule.csv — 24-hour duty grid (workbook *Device Duty* sheet)
`device,h_5a … h_4a` — duty fraction (0, 0.25, 0.5, 0.75, 1) for a simulated
heavy day. Every row must name a device present in devices.csv.
Hourly kW = Σ qty × running_w_each × duty. Reproduces the workbook exactly:
pool peak 9.713 kW, whole-camp peak 10.345 kW, heavy day 153.492 kWh.

## calendar_plan.csv — the 14-day plan (workbook *Calendar*, SIMULATED table)
`date,day_type,people,acs,ebikes,sound_on,generators,delivered_gal`
- `date,day_type,people,delivered_gal` come from the workbook.
- `acs,ebikes,sound_on,generators` come from console v44 seeds (the workbook
  drove these from day_type instead).
- The console's ⬇ button exports this exact file from the current on-screen plan.

## calendar_reality.csv — the on-playa diary (workbook *Calendar*, REALITY table)
`date,bob_meter_kwh,alice_meter_kwh,fuel_left_gal,delivered_gal,notes`
Empty until the event; fill it in as readings happen.

## log.csv — version history (workbook *Log* sheet): `version,date,change`

## draw_items.csv / personal_items.csv — calculator seed rows (console v44)
Starting rows for the two simulation calculators in the console.
`personal_items.csv` hour columns mirror schedule.csv (1 = device on that hour).
