# Handoff — finish this remake

Read this first in a new session. Design rules and the wave-1–40 table live in [`requirements.md`](requirements.md). This file is **what the repo actually is right now** and how to extend it without undoing prior work.

## Snapshot

- **Playable:** waves **1–6**, then `SECTOR CLEAR`.
- **Stack:** static HTML/CSS/JS. No bundler. `python3 -m http.server 8765` then open `http://localhost:8765`.
- **Entry:** `index.html` → `src/input.js`, `audio.js`, `fx.js`, `game.js`, `main.js`.
- **Repo:** https://github.com/gjmoyer/robotron2084
- **Constraint:** original work only. Do not import Williams ROM binaries, MAME samples, or ripped sprites.

`MAX_WAVE` in `src/game.js` is `6`. Raising it without adding a `WAVES[n]` entry will break the intermission (`WAVES[this.waveNum + 1]`).

## File map

| Path | Role |
|------|------|
| `src/game.js` | Entire sim + render. `WAVES[]` is the per-wave table. `STATE`: title, intro, play, dead, trans, clear, over, pause. |
| `src/input.js` | Keyboard, mouse aim, Gamepad API (1 dual-stick or 2 sticks). `Input.consumeStart` / `consumePause`. Latch on keydown so short taps count. |
| `src/audio.js` | Loads `assets/sounds/*.wav`. `fire()` preempts the one-shot voice. `_play()` layers (use for Enforcer ticks / hatches). `setTension` loops `bg0`–`bg3`. |
| `src/fx.js` | Particles, rings, score pops, shake, flash, hitstop. |
| `src/main.js` | Resize, rAF loop, `?autostart`, `window.__game` for debug. |
| `assets/sprites/` | Keyed PNGs. Foot-anchored when drawn. |
| `assets/sounds/` | Pre-rendered Williams-style WAVs at 22050 Hz. |
| `tools/process_sprites.py` | Dark-bg key + crop. Call `key_and_crop` / `save` for new stills. |
| `tools/gen_williams_sounds.py` | VARI/Sound1 (Lomont), GWAVE, FNOISE, LFSR, SCREAM, organ 9th. |

## How a wave is defined

`WAVES` is 1-indexed (`WAVES[0] === null`). Each entry:

```
grunts, electrodes, mommy, daddy, mikey, hulks, spheroids
electrodeStyle: "plus" | "diamond" | "square" | "x"
electrodeHue: 0–360
gruntMul                 // 1.0 on wave 1; ~1.28 / 1.42 / 1.48 on 2–4
humans                   // mommy+daddy+mikey (HUD denominator)
hatchFirst, hatchNext    // seconds
quotaMin, quotaMax       // Enforcers per Spheroid, then Spheroid vanishes
fireMin, fireMax         // Enforcer shot interval
enforcerCap              // live Enforcers
enforcerMul, sparkMul    // chase / spark speed vs minDim
subtitle                 // intro + intermission
```

**Wave-end:** `hostilesLeft()` = living Grunts + Spheroids + Enforcers + Brains. When 0: if `waveNum < MAX_WAVE` → `beginTransition()` else `STATE.CLEAR`.

When you add Tank / Quark, **add them to `hostilesLeft()`** or waves will end too early. Progs and missiles do not block wave-end.

## Adding wave N (checklist)

1. Confirm counts from `requirements.md` §3 (they match `WVCNT` in `RRG23.ASM`).
2. Append a `WAVES` object. Pick a new electrode style/hue if it is a “normal” wave. Tank / swarm waves use `electrodes: 0`.
3. Set `MAX_WAVE = N`.
4. If the wave introduces a **new entity**, implement spawn in `buildWave`, update, collide, draw, and `hostilesLeft`.
5. Update title (`WAVES 1–N`), end card (`SECTOR CLEAR` copy), and `README.md` wave table.
6. Keep Enforcer/Spheroid rates **gentler than late arcade** until you are past wave ~10. Early-wave aggression was already reverted once.

## Art pipeline

Style: stylized 2D arcade, cel-shade, neon rim, isolated on flat `#0B0B14`, no ground shadow.

Existing: player (N/E/S/W + S walk), Grunt (S walk + N), Hulk (S walk), Mommy/Daddy/Mikey (S walk + E/W flip), Brain (S walk), Prog (S walk).

**Still needed (generate new, do not rip):**

- Quark (or code-render like Spheroid)
- Tank (4-dir or top-down)
- Cruise missile / tank shell can stay code-rendered

After generation: key with `tools/process_sprites.py`, add paths to `SPRITE_URLS`, extend `spriteFor()`.

Spheroid, Enforcer, sparks, electrodes are **code-drawn** in `renderSpheroid` / `renderEnforcer` / `renderSparks` / `renderElectrode`.

## Sound pipeline

`python3 tools/gen_williams_sounds.py` writes `assets/sounds/`. VARI parameters are Lomont’s five in-game sets (SAW / FOSHIT / QUASAR / CABSHK / CSCALE) — mathematically generated, not ripped.

| `AudioFX` | File | Notes |
|-----------|------|--------|
| `shot` | `laser.wav` | Exclusive; retriggered every shot |
| `gruntDie` | `turbo` then `cannon` @192 ms | Sequence |
| `electrodeHit` | `cannon` | |
| `rescue` | `rescue.wav` | |
| `humanDie` | `scream.wav` | |
| `playerDie` | `lite` then `cannon` @256 ms | |
| `waveStart` | `start.wav` | |
| `waveClear` | `waveend.wav` | ~2.4 s SP1 walk |
| `waveFanfare` | `ninth.wav` | Layered during `TRANS` |
| `extraLife` | `extralife.wav` | Full FOSHIT (~5 s) |
| `enforcerShot` | `ui.wav` via `_play` | Must stay layered |
| `hatchPop` | `appear.wav` via `_play` | Must stay layered |
| `setTension` | `bg0`–`bg3` | Loop; stop on trans/over |

New enemy sounds: add a generator + WAV + `FILES` + method. Do not use `fire()` for high-rate SFX.

## Scoring / persist (as coded)

| Event | Points |
|-------|--------|
| Grunt | 100 |
| Enforcer | 150 |
| Spark | 25 |
| Spheroid | 1000 (only if shot; quota-vanish = 0) |
| Electrode | 0 |
| Human | 1000…5000 chain |
| Extra life | 25,000 once (`extraAwarded`) |

High score: `localStorage.robotron2084_hs` (falls back to `robotron2084_wave1_hs`).

Human chain **persists across waves**, resets on player death. `rescued` is per-wave (HUD); `totalRescued` is campaign.

## Feel / numbers already tuned

Do not “fix” these without playing:

- Player speed `0.64 * minDim` / s. Fire period `0.055` s. Max 8 bullets.
- Grunt base `0.115 * minDim * gruntMul` plus `waveTime * 0.011` accel, cap `0.42`.
- Hulk `0.085 * minDim`.
- Invuln `2.05` s. Intro `1.35` s. Death wait `1.55` s. Trans `3.35` s.
- Spheroid/Enforcer early-wave rates live on each `WAVES` row (see wave 2–4). A previous pass made Enforcers machine-gun; that was rolled back on purpose.

`minDim = min(arena.w, arena.h)`. Arena is the full window minus HUD.

## Debug

- `?autostart` starts wave 1 after load.
- `window.__game` — set `waveNum`, `buildWave()`, or `g.alive = false` on arrays to skip.
- Headless Chrome + puppeteer-core was used against `localhost:8765` (server binds IPv6; use `localhost` not `127.0.0.1`).

## Next concrete task

**Wave 7 — first Tank wave.** Quarks + Tanks + bouncing shells, 0 Grunts, 0 electrodes, 12 Hulks, 4 of each family. After that, data-drive waves 8–40 from the table in `requirements.md` §3.

## Original references (behavior only)

- Wave counts: `WVCNT` in Williams `RRG23.ASM` (historicalsource/robotron). Matches `requirements.md` §3.
- Sound tables: `LASSND`, `RBSND`, `SAVSND`, `PDSND`, `WVSND`, … in `RRG23.ASM` / `RRH11.ASM` / `RRP8.ASM` / `RRC11.ASM`.
- VARI algorithm write-up: https://www.lomont.org/software/misc/robotron/ (reimplement; do not vendor ROM).
- Wave-type overview: Sean Riddle `robowaves.html`.

Use those as **spec**. Do not check their binaries into this repo.
