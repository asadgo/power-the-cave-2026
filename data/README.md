# data/ — the single source of truth

Every number the pages show comes from these CSVs (seeded once from the 2026 workbook, which is
not committed). Edit here → both pages read the change on next load / ⟳.

## settings.csv — `key,value,note`
Policy dials, machine specs and model constants. Notables: `event_start`, `event_days`,
`playa_derate` × `load_ceiling` set the red lines; `kwh_per_gallon` converts energy to fuel;
`gen_bob_watts` / `gen_alice_watts` are the two nameplates (Westinghouse iGen12000DFc, 9000 W);
`gen_overhead_gal_each` = gal per running generator per day on top of device fuel;
`fuel_floor_gal` / `fuel_warn_margin_gal` colour the fuel chip.

## devices.csv — one row per device type (the baseline every day starts from)
`device,area,category,product,qty,running_w_each,surge_w_each,volts,bus,priority,notes,scaling[,gen]`
- `bus`: `Battery` (never-cut core → “Critical” group) or `Pool` (generator pool).
- `priority`: `Never cut` / `Cut if needed` / `Cut first`.
- `scaling`: `people` = the row scales with headcount (Coffee maker, Fans); blank = full load.
- `gen` (optional, `1`|`2`): default generator assignment. Absent → auto (AC / fans / e-bikes → 2,
  everything else → 1). “Make this the official plan” writes both `scaling` and `gen`.
- Derived columns (total W, start kick) are not stored; the console recomputes them.
- Names `Air Conditioning Units`, `Fans`, `E-bike charging station` are pattern-matched by the
  console; keep them. The e-bike row is 1 circuit × 1440 W and is auto-split into per-bike watts.

## schedule.csv — 24-hour duty grid (baseline)
`device,h_5a … h_4a` — duty fraction per hour (0, .25, .5, .75, 1) for a simulated heavy day.
Every row must name a device present in devices.csv. Hourly kW = Σ qty × running_w_each × duty.

## device_days.csv — per-day differences from the baseline
`date,device,field,value` — one row per single cell that a given day changes.
- `field`: `qty`, `watts`, `gen` (`1`|`2`) or one hour's duty `h_5a … h_4a` (0, .25, .5, .75, 1).
- How a day is built: copy of devices.csv + schedule.csv → Off days set every qty to 0 →
  device_days.csv rows for that date overwrite single cells → the calendar's ACs / E-bikes columns
  set those two quantities. (AC and e-bike quantities are therefore never taken from this file.)
- A `device` named here that is not in devices.csv is a custom item that exists on that day only
  (Custom / Pool / Cut if needed; qty, watts, gen and hours from its rows).
- Header-only file = every day equals the baseline. “Make this the official plan” writes it from
  the screen: the selected day becomes the baseline, every other day's differences land here, so all
  14 days round-trip exactly. Both pages apply it (console and Reality).

## calendar_plan.csv — the 14-day plan
`date,day_type,people,acs,ebikes,sound_on,generators,delivered_gal`
`day_type` ∈ Off / Build / Burn / Strike (Off zeroes every device that day unless device_days.csv
says otherwise). `acs` and `ebikes` set the AC and e-bike quantities per day; `generators` (1|2) sets
the red line and gen overhead. “Make this the official plan” exports this exact file.

## personal_items.csv — per-camper items
`item,watts,h_5a … h_4a` (1 = on that hour). Their kWh/camper × people feeds the
“Personal items” category.

## log.csv — version history
`version,date,change`. Append-only. The last row's version is what both page headers display.

## reality.csv — the on-playa fuel log (written by the Worker, append-only)
`date,time,logged_by,gen1_hours,gen2_hours,gal_gen1,gal_gen2,gal_delivered,drum1_gal,drum2_gal,notes`
- One row per phone entry. Blank cells are fine; drums are logged together or not at all.
- **Retraction** = a row whose `notes` read `RETRACT#<n>: reason`, where `n` is the 1-based
  data-row number of the row it cancels (header not counted). Retracted rows stay in the file,
  render struck through, and drop out of all math.
- **Never delete or reorder rows** — the pointers are positional. Fix typos in place with the
  GitHub pencil; cancel entries with a retraction.
- Every row is mirrored to the backup Google Sheet's `raw` tab (see `ops/ops-README.md`).

## calendar_reality.csv — retired
Empty per-day template from the workbook's REALITY table. Nothing reads it (reality.csv replaced
it). Safe to delete.
