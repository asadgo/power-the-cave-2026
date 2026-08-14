# Power the Cave 2026 · Shopping & Verification List
Maintained by the power-audit sessions. Lives at repo root; edit via GitHub pencil or ask Claude to reissue. Updated 2026-08-13 (audit through v17.0).

## Buy
| # | Item | Qty | Spec | Why |
|---|------|-----|------|-----|
| 1 | AC→DC power supply ("brick") for pumps | 2 | 12 V output, ≥15 A each, one per pump | Pentair Aqua King II datasheet fuses each pump at 15 A. An undersized brick browns out mid-dishes. (log 15.7) |
| 2 | AC→DC brick for object motor | 1 | 12 V, ≥60 W (covers start kick) | The Source's motor is 12 V bare-lead; 60 W surge field. |
| 3 | Inline fuse for object motor | 1 | Sized to motor rating (~3–5 A @ 12 V) | A jammed motor draws max continuously and cooks. Cheap insurance. |
| 4 | Kill-A-Watt plug-through power meter | 1 | ~$25, any brand | Converts padded estimates into measured facts at generator break-in / Source integration test: amps (billed 900 W ea), Mac Mini (140 W, chip unknown), projector (400 W nameplate). |
| 5 | Mechanical outlet timer (optional) | 1–2 | 24 h dial type | Automates the 7 PM–7 AM lights rule (kitchen floods, Source projectors) instead of manual flips. |

## Verify / inventory at load-in (buy only what's missing)
| # | Item | Check |
|---|------|-------|
| 6 | Original AC adapters for every 24 V light string | Kitchen floods (6), Structure floods (19), Orbs (8): strings normally ship with their own wall adapters — those ARE the bricks. Confirm each string's adapter is in the bin; buy replacements only for gaps. |
| 7 | 12 V supply for Perimeter Lights | One string, 12 V (different voltage from the 24 V strings — do not mix adapters). |
| 8 | Speaker back panels | Tops + subs: thick-cable (speakON) sockets only, no power inlet = confirms the sound remodel (log 16.6). |
| 9 | Pump stickers | Real model + amps vs the "(est.) Aqua King II" assumption (log 15.7). |
| 10 | Mac Mini chip | Apple silicon (M1/M2/M4) vs Intel — underside label. M-series → row is ~4× over-billed, retune after metering. (log 16.9) |
| 11 | Midea AC nameplates | Confirm inverter-compressor type + photograph LRA. The single biggest surge unknown in camp (cold-load pickup scenario). |

## Conditional / decision-pending
| # | Item | Trigger |
|---|------|---------|
| 12 | Generator parallel cables | Only if any single feeder must draw >6.3 kW — unresolved; check devices/distro assignment. (workflow doc) |
| 13 | Generator spares (2 air filters + plugs per unit, break-in oil) | Already tracked in power-workflow.md generator section; listed here so one document covers all power shopping. |
