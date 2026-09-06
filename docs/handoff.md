# Handoff — finish this remake

Read this first in a new session. Design rules and the wave-1–40 table live in [`requirements.md`](requirements.md). This file is **what the repo actually is right now**.

## Snapshot (end of 2026-08-23 session)

- **Playable:** full game — waves **1–40** unique, then 21–40 repeats with a per-cycle ramp through **255**, then wraps to 1. Game ends only on lives-out (`GAME OVER`); the `CLEAR`/`END OF TRANSMISSION` card is unreachable in normal play.
- **Systems in:** Grunt, electrode, Hulk, family, Spheroid, Enforcer, spark, Brain, Prog, cruise missile, Quark, Tank, bouncing shell, splashy wave wipe.
- **Stack:** static HTML/CSS/JS. `python3 -m http.server 8765` → http://localhost:8765
- **Repo:** https://github.com/gjmoyer/robotron2084
- **Constraint:** original work only. No Williams ROM binaries, MAME samples, or ripped sprites.

`MAX_WAVE` in `src/game.js` is `255` (`UNIQUE_WAVES 40`, `LOOP_BASE 21`, `LOOP_LEN 20`). `waveSpec()` resolves the loop and applies the cycle ramp; `waveSpecFor(n)` previews any wave (used by the TRANS wipe). Raising `MAX_WAVE` without a `WAVES[n]` object breaks the intermission — for n > 40 the object comes from the loop base.

## File map

| Path | Role |
|------|------|
| `src/game.js` | Sim + render. `WAVES[]`, `STATE`, all entities. |
| `src/input.js` | Keyboard, mouse aim, Gamepad (dual-stick or two pads). |
| `src/audio.js` | `fire()` preempts; `_play()` layers. |
| `src/fx.js` | Particles, rings, pops, shake, flash, hitstop. |
| `src/main.js` | Resize, rAF, `?autostart`, `window.__game`. |
| `assets/sprites/` | Keyed PNGs, foot-anchored. |
| `assets/sounds/` | Synthesized WAVs @ 22050 Hz. |
| `tools/process_sprites.py` | Dark-bg key + crop. |
| `tools/gen_williams_sounds.py` | VARI / GWAVE / FNOISE / LFSR / SCREAM / organ. |

## `WAVES[]` fields

1-indexed (`WAVES[0] === null`).

```
grunts, electrodes, mommy, daddy, mikey, hulks, spheroids
brains, quarks                 // optional; default 0
electrodeStyle                 // "plus" | "diamond" | "square" | "x"
electrodeHue                   // 0–360
gruntMul, humans
hatchFirst, hatchNext          // Spheroid and Quark hatch (seconds)
quotaMin, quotaMax             // children per Spheroid/Quark
fireMin, fireMax, enforcerCap, enforcerMul, sparkMul
tankCap, tankFireMin, tankFireMax, tankMul, shellMul
brainMul, missileMul
subtitle
```

**Wave-end:** `hostilesLeft()` = Grunts + Spheroids + Enforcers + Brains + Quarks + Tanks.  
Progs, missiles, shells, Hulks, family, electrodes do **not** block.

## Adding wave N

1. Counts from `requirements.md` §3.
2. Append a `WAVES` object. Tank/swarm waves: `electrodes: 0` (and often `grunts: 0`).
3. `MAX_WAVE = N`.
4. New entity? Spawn, update, collide, draw, `hostilesLeft`.
5. Title `WAVES 1–N` is only on the attract screen; the end card uses `MAX_WAVE` automatically.
6. Keep early-wave Enforcer/Tank fire **mild**. Machine-gun rates were reverted once.

## Art

Style: 2D arcade cel-shade, neon rim, isolated on `#0B0B14`.

**Have:** player N/E/S/W + S walk; Grunt S walk + N; Hulk S walk; Mommy/Daddy/Mikey S walk + E/W; Brain S walk; Prog S walk; Tank S/E/W; Quark orb.

**Still generate if needed:** Tank north (currently uses front), Brain/Prog side views. Cruise missiles and shells are code-drawn.

Spheroid, Enforcer, spark, electrode, missile, shell = code in `render*`.

## Sound

`AudioFX.fire` = exclusive DAC voice. High-rate SFX must use `_play`.

| Method | File / notes |
|--------|----------------|
| `shot` | `laser.wav` exclusive, retrigger |
| `gruntDie` | turbo → cannon @192 ms |
| `electrodeHit` | cannon |
| `rescue` | rescue.wav |
| `humanDie` | scream.wav |
| `playerDie` | lite → cannon @256 ms |
| `waveStart` | start.wav |
| `waveClear` | waveend.wav (~2.4 s) |
| `waveFanfare` | ninth.wav layered in TRANS |
| `extraLife` | extralife.wav (long FOSHIT) |
| `enforcerShot` / `hatchPop` / `brainFire` / `tankFire` / `tankBounce` / `convert*` | `_play` layered |
| `brainDie` | scream → cannon |
| `quarkDie` | same as spheroidDie |
| `tankDie` | cannon |
| `setTension` | bg0–bg3 loop |

## Scoring (as coded)

| Event | Pts |
|-------|-----|
| Grunt / Prog | 100 |
| Enforcer | 150 |
| Tank | 200 |
| Brain | 500 |
| Spheroid / Quark | 1000 if shot; 0 if quota-vanish |
| Spark / missile / shell | 25 |
| Electrode | 0 |
| Human | 1000…5000 chain |
| Extra life | 25,000 once |

High score: `localStorage.robotron2084_hs`. Chain persists across waves; resets on death.

## Tuned numbers — do not “fix” cold

- Player `0.64 * minDim`/s, fire `0.055` s, max 8 bullets, invuln `2.05` s.
- Grunt `0.115 * minDim * gruntMul` + time accel.
- Hulk `0.085`, Brain ~`0.068 * brainMul`, Tank ~`0.11 * tankMul`.
- Intro `1.35` s, death `1.55` s, trans `3.35` s.
- Enforcer/Spheroid/Tank rates are per-row on `WAVES` and were deliberately eased for waves 2–7.

## Debug

- `?autostart` — start wave 1 after load.
- `window.__game` — `waveNum = 10; buildWave(); setState("intro")`.
- Local server often binds IPv6; use `localhost` not `127.0.0.1`.

## Next session

All 40 unique waves + the 255 loop are done. Remaining from `requirements.md` §12: attract mode, 2-player alternate, initials on high score, operator extra-life options, optional Bozo mercy on waves 1–4.

## References (spec only — do not vendor binaries)

- `WVCNT` in Williams `RRG23.ASM` (historicalsource/robotron)
- Sound tables in `RRG23.ASM` / `RRH11.ASM` / `RRP8.ASM` / `RRC11.ASM`
- Lomont VARI: https://www.lomont.org/software/misc/robotron/
- Sean Riddle wave notes: `robowaves.html`
