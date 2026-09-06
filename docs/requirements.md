# Robotron: 2084 – Complete Reference Document
*(Waves + Sound Effects for clone development)*

Companion file: [`handoff.md`](handoff.md) — current repo status, file map, and how to continue. Do not copy original ROMs, sprites, or cabinet audio. All art and sound in this project are made from scratch.

## 1. Sound Effects (Complete List)

The original arcade uses a small set of procedurally generated sounds on the Williams sound board. Modern rips typically extract these **23 distinct effects**. These cover every action, enemy, human interaction, and transition across **all waves**:

### Player / System
- `player-lazer` – Player shooting
- `player-death`
- `extra-life`
- `game-start`
- `startup`
- `level-transition`
- `high-score-top`

### Humans
- `human-save` – Rescuing a human
- `human-die` – Human killed (usually by Hulk)
- `human-to-prog` – Brain starts reprogramming a human
- `prog-transformation` – Human fully becomes a Prog

### Enemies & Objects
- `grunt-walk` – GRUNT movement
- `robot-explode` – General robot / GRUNT destruction
- `electrode-explode`
- `enforcer-fire` – Enforcer projectile
- `spheroid-spawn`
- `spheroid-pop`
- `quark-spawn`
- `tank-fire`
- `tank-projectile-bounce`
- `tank-explode`
- `brain-wave-start` – Brain attack / cruise missile launch
- `brain-explode`

**Notes on sounds**  
These cover every wave type (Normal, Brain, Tank, Grunt swarm, Hulk, Double Trouble). There are no unique per-wave sound effects beyond the ones listed. Many sounds are generated mathematically from parameters rather than stored samples, so recreating them via the known Williams GWAVE algorithms produces the most authentic results.

---

## 2. Wave System Overview

- A wave ends when **all destructible enemies** are destroyed (Hulks are invincible and do **not** need to be cleared).
- Electrodes are lethal on contact and must be avoided or destroyed.
- Humans appear on almost every wave and award escalating points when rescued (resets on death or new wave):  
  1st = 1,000 → 2nd = 2,000 → 3rd = 3,000 → 4th = 4,000 → 5th+ = 5,000 each.
- The game has 255 waves. After wave 255 it loops (wave number is an 8-bit value).  
  Waves 1–40 are unique. After wave 40 the pattern of waves 21–40 repeats with increasing difficulty (speed, aggression, spawn rates).

### Special Wave Types

| Type              | Waves                          | Key Features |
|-------------------|--------------------------------|--------------|
| **Normal**        | Most waves                     | Grunts + Hulks + Spheroids (spawn Enforcers) + Electrodes + Humans |
| **Brain**         | Every 5th (5, 10, 15, 20…)     | Brains + many humans + some Grunts/Spheroids. Cycle: Mommy → Daddy → Mikey → Family |
| **Tank**          | Starting 7, then every 5th (7, 12, 17, 22…) | Quarks (spawn Tanks) + Tanks + Hulks |
| **Grunt Swarm**   | Ending in 9 (9, 19, 29…)       | Massive Grunt group (player starts in center), fewer Hulks, borders often removed |
| **Hulk**          | 14, then every 20 (14, 34, 54…) | Large number of Hulks surrounding player |
| **Double Trouble**| 24, then every 20 (24, 44…)    | Many Spheroids + Quarks (player starts in center) → rapid Enforcers + Tanks |

---

## 3. Exact Enemy Counts – Waves 1–40

Data sourced from reverse-engineering of the original code (starting counts; actual placement has some randomness).

| Wave | Grunts | Electrodes | Mommies | Daddies | Mikeys | Hulks | Brains | Spheroids | Quarks | Notes |
|------|--------|------------|---------|---------|--------|-------|--------|-----------|--------|-------|
| 1    | 15     | 5          | 1       | 1       | 0      | 0     | 0      | 0         | 0      | Intro |
| 2    | 17     | 15         | 1       | 1       | 1      | 5     | 0      | 1         | 0      | First Spheroids/Hulks |
| 3    | 22     | 25         | 2       | 2       | 2      | 6     | 0      | 3         | 0      | |
| 4    | 34     | 25         | 2       | 2       | 2      | 7     | 0      | 4         | 0      | |
| 5    | 20     | 20         | 15      | 0       | 1      | 0     | 15     | 1         | 0      | **Brain (Mommy)** |
| 6    | 32     | 25         | 3       | 3       | 3      | 7     | 0      | 4         | 0      | |
| 7    | 0      | 0          | 4       | 4       | 4      | 12    | 0      | 0         | 10     | **Tank** |
| 8    | 35     | 25         | 3       | 3       | 3      | 8     | 0      | 5         | 0      | |
| 9    | 60     | 0          | 3       | 3       | 3      | 4     | 0      | 5         | 0      | **Grunt Swarm** |
| 10   | 25     | 20         | 0       | 22      | 0      | 0     | 20     | 1         | 0      | **Brain (Daddy)** |
| 11   | 35     | 25         | 3       | 3       | 3      | 8     | 0      | 5         | 0      | |
| 12   | 0      | 0          | 3       | 3       | 3      | 13    | 0      | 0         | 12     | **Tank** |
| 13   | 35     | 25         | 3       | 3       | 3      | 8     | 0      | 5         | 0      | |
| 14   | 27     | 5          | 5       | 5       | 5      | 20    | 0      | 2         | 0      | **Hulk** |
| 15   | 25     | 20         | 0       | 0       | 22     | 2     | 20     | 1         | 0      | **Brain (Mikey)** |
| 16   | 35     | 25         | 3       | 3       | 3      | 3     | 0      | 5         | 0      | |
| 17   | 0      | 0          | 3       | 3       | 3      | 14    | 0      | 0         | 12     | **Tank** |
| 18   | 35     | 25         | 3       | 3       | 3      | 8     | 0      | 5         | 0      | |
| 19   | 70     | 0          | 3       | 3       | 3      | 3     | 0      | 5         | 0      | **Grunt Swarm** |
| 20   | 25     | 20         | 8       | 8       | 8      | 2     | 20     | 2         | 0      | **Brain (Family)** |
| 21   | 35     | 25         | 3       | 3       | 3      | 8     | 0      | 5         | 0      | |
| 22   | 0      | 0          | 3       | 3       | 3      | 15    | 0      | 0         | 12     | **Tank** |
| 23   | 35     | 25         | 3       | 3       | 3      | 8     | 0      | 5         | 0      | |
| 24   | 0      | 0          | 3       | 3       | 3      | 13    | 0      | 6         | 7      | **Double Trouble** |
| 25   | 25     | 20         | 25      | 0       | 1      | 1     | 21     | 1         | 0      | **Brain (Mommy)** |
| 26   | 35     | 25         | 3       | 3       | 3      | 8     | 0      | 5         | 0      | |
| 27   | 0      | 0          | 3       | 3       | 3      | 16    | 0      | 0         | 12     | **Tank** |
| 28   | 35     | 25         | 3       | 3       | 3      | 8     | 0      | 5         | 1      | Spheroids + Quarks begin mixing more |
| 29   | 75     | 0          | 3       | 3       | 3      | 4     | 0      | 5         | 1      | **Grunt Swarm** |
| 30   | 25     | 20         | 0       | 25      | 0      | 1     | 22     | 1         | 1      | **Brain (Daddy)** |
| 31   | 35     | 25         | 3       | 3       | 3      | 8     | 0      | 5         | 1      | |
| 32   | 0      | 0          | 3       | 3       | 3      | 16    | 0      | 0         | 13     | **Tank** |
| 33   | 35     | 25         | 3       | 3       | 3      | 8     | 0      | 5         | 1      | |
| 34   | 30     | 0          | 3       | 3       | 3      | 25    | 0      | 2         | 2      | **Hulk** |
| 35   | 27     | 15         | 0       | 0       | 25     | 2     | 23     | 1         | 2      | **Brain (Mikey)** |
| 36   | 35     | 25         | 3       | 3       | 3      | 8     | 0      | 5         | 2      | |
| 37   | 0      | 0          | 3       | 3       | 3      | 16    | 0      | 0         | 14     | **Tank** |
| 38   | 35     | 25         | 3       | 3       | 3      | 8     | 0      | 5         | 2      | |
| 39   | 80     | 0          | 3       | 3       | 3      | 6     | 0      | 5         | 1      | **Grunt Swarm** |
| 40   | 30     | 15         | 10      | 10      | 10     | 2     | 25     | 1         | 1      | **Brain (Family)** |

**After Wave 40**  
The pattern of waves 21–40 repeats with higher intensity parameters (faster enemies, denser spawns, more aggressive AI). Difficulty continues to ramp until the 255 → 1 loop.

---

## 4. Scoring Reference (for completeness)

| Target              | Points |
|---------------------|--------|
| Grunt               | 100    |
| Prog                | 100    |
| Enforcer            | 150    |
| Tank                | 200    |
| Brain               | 500    |
| Spheroid / Quark    | 1,000  |
| Cruise Missile / Enforcer Spark / Tank Shell | 25–50 |
| Human (1st / 2nd / 3rd / 4th / 5th+) | 1,000 / 2,000 / 3,000 / 4,000 / 5,000 |

Extra life every 20,000 / 25,000 / 30,000 / 50,000 points (operator setting; most common is 25,000). This remake uses **25,000**, once per game.

---

## 5. Wave-clear rule (authoritative)

Original `WVCHEK` sums these counters. The wave ends when the sum is **zero**:

| Counter | Entity | Must clear? |
|---------|--------|-------------|
| `ROBCNT` | Grunts | yes |
| `CIRCNT` | Spheroids | yes |
| `ENFCNT` | Enforcers | yes |
| `BRNCNT` | Brains | yes |
| `TNKCNT` | Tanks | yes |
| `SQCNT` | Quarks | yes |

**Do not require** Hulks, humans, electrodes, or Progs. Hulks are invincible. Electrodes are optional to shoot. Humans are bonus. Progs are converted humans and are **not** in `WVCHEK` — verify in play if a leftover Prog should linger after the wave ends (original lets the wave end without them).

On wave complete the original: increments wave number, plays `WVSND` (command `$0E` SP1 ×29), kills processes, clears the screen, runs the marquee wipe (`RMST`), respawns the player in the center, materializes the next wave.

---

## 6. Player and family rules

- **Lives:** 3 to start. Extra man at 25,000 (this remake).
- **Spawn:** exact center. ~2 s invulnerability with flicker. Player can move/shoot during invuln.
- **Death:** contact with Grunt, Hulk, Brain, Prog, Enforcer, Spheroid, Quark, Tank, electrode, Enforcer spark, Tank shell, or cruise missile. Remaining *destructible* enemies stay. Original also **clears live Enforcers and sparks** on player death; Spheroids keep their remaining hatch quota.
- **Shots:** independent aim (original 8-way; this remake uses analog 360°). Auto-fire while the fire stick is held. Cap ~4–8 bullets on screen. New shot does not wait for old ones if under the cap.
- **Human rescue chain:** 1000 → 2000 → 3000 → 4000 → 5000, then wraps. `SAVCNT` is cleared on **player init / player death**, not on wave change. (Section 2 above said “resets on new wave” — that is **wrong**; keep the chain across waves.)
- **Humans:** wander, bounce off walls. Die on electrodes and Hulks (and Brains start conversion instead of an instant kill). Rescue by touching. They do not shoot and do not hurt the player.

---

## 7. Entity behavior (what to implement)

### Implemented (waves 1–10)

| Entity | Touch player | Shot | Electrode | Notes |
|--------|--------------|------|-----------|--------|
| **Grunt** | kill | 100, dies | dies, no score | Chases player. Speed = base × `gruntMul` + time accel. |
| **Electrode** | kill | 0, destroyed | — | Static. Styles: plus / diamond / square / x. |
| **Hulk** | kill | immune (flash + thud) | immune | Slow. Prefers nearest living human. |
| **Mommy / Daddy / Mikey** | rescue | immune | dies | Wander. Mikey is smaller. Snatch mid-Brain-convert still counts as rescue. |
| **Spheroid** | kill | 1000 | dies | Hatches Enforcers; quota then vanishes (0 pts). |
| **Enforcer** | kill | 150 | dies | Weaves; pinwheel sparks. Early-wave fire is **mild** on purpose. |
| **Spark** | kill | 25 | n/a | Slides on walls. |
| **Brain** | kill | 500 | dies | Seeks humans, converts (~1.65 s), fires homing cruise missiles (max 6). |
| **Prog** | kill | 100 | dies | Converted human. Does **not** block wave-end. |
| **Cruise missile** | kill | 25 | n/a | Homing, limited turn. |
| **Quark** | kill | 1000 | n/a (none on tank waves) | Hatches Tanks; quota then vanishes. |
| **Tank** | kill | 200 | n/a | Slow; fires bouncing square shells. Cap `tankCap`. |
| **Tank shell** | kill | 25 | n/a | Ricochets up to 4 times. |

Spheroid / Enforcer / Tank fire rates for waves 2–7 are **intentionally milder** than late arcade. Do not restore machine-gun values.

### Not implemented (wave 10+)

Special layouts still to data-drive from §3:

- **Grunt Swarm** (19, 29…) — 70–80 Grunts, 0 electrodes (9 done).
- **Hulk wave** (14, 34…) — 20–25 Hulks around the player.
- **Double Trouble** (24, 44…) — Spheroids **and** Quarks together, 0 Grunts, 0 electrodes.
- Later Brain / Tank waves reuse existing Brain and Tank systems with bigger counts.
- Attract mode, 2-player alternate, high-score initials, Bozo mercy.

---

## 8. Original speed / timing tables (ROM `WVTAB`)

Source: Williams assembly `RRG23.ASM` (`WVTAB` / `WVCNT`). Lower delay = faster. Values are **per wave 1–40** (two rows of 20).

Useful ones when tuning later waves:

| Symbol | Meaning | Wave 1 → 2 → 3 → 4 |
|--------|---------|---------------------|
| `ROBSPD` | Grunt step delay | 20, 15, 15, 15 |
| `RMXSPD` | Grunt max-speed floor | 9, 7, 6, 5 |
| `HLKSPD` | Hulk delay | 8, 8, 7, 7 |
| `ENSTIM` | Enforcer-related timer | 30, 28, 26, 24 |
| `ENFNUM` | Enforcer-related count | 10, 10, 10, 10 |

Stall rule (original `GEXEC`): if the player is not scoring, Grunt speed is forced toward `RMXSPD` faster. This remake approximates that with `waveTime` accel on Grunts.

**Bozo table** (early-wave mercy if the player is dying with ships left, waves 1–4 only):

```
WAVE 1: CDPTIM=38 ENSTIM=96 ROBSPD=30 RMXSPD=15
WAVE 2: 38, 96, 25, 12
WAVE 3: 36, 48, 20, 10
WAVE 4: 30, 30, 15, 7
```

Not implemented. Optional later.

---

## 9. Original sound command map (game CPU → board)

Do **not** extract cabinet WAVs. Recreate. Game tables use `SND#` which, after PIA invert, **is** the sound-board command.

| Event | Table | SND# | Engine (board) | Remake hook |
|-------|--------|------|----------------|-------------|
| Laser | `LASSND` | `$01` | GWAVE HBDV | `AudioFX.shot` → `laser.wav` |
| Robot / Enforcer hit | `RBSND` / `ENKSND` | `$14` then `$17` | TURBO + CANNON | `gruntDie` |
| Electrode | `PSKSND` | `$17` | CANNON | `electrodeHit` |
| Rescue | `SAVSND` | `$0D` | GWAVE ED17 | `rescue` |
| Human death | `HKSND` | `$1A` | SCREAM | `humanDie` |
| Player death | `PDSND` | `$11` then `$17` | LITE + CANNON | `playerDie` |
| Start | `ST1SND` | `$28` | GWAVE GDYUKV | `waveStart` |
| Wave end | `WVSND` | `$0E` ×29 | VARI SP1 | `waveClear` → `waveend.wav` |
| Extra life | `RPSND` | `$1E` | VARI FOSHIT | `extraLife` |
| Hulk hit | `HKHSND` | `$06` | GWAVE HBEV | `hulkHit` (currently `ui.wav`) |
| Enforcer fire | `ENFSND` | `$1D` | VARI SAW | `enforcerShot` (layered, not exclusive) |
| Coin / UI | `CNSND` | `$0C` | GWAVE ED12 | `ui` |

Still needed for later waves: Brain start / Brain die / human-to-prog / prog transform / quark spawn / tank fire / tank bounce / tank explode. Generate new WAVs in `tools/gen_williams_sounds.py` — never rip MAME samples.

Williams board: **one DAC voice**; a new IRQ preempts the current one, except we keep a separate BG drone and layered Enforcer ticks so the laser is not silenced.

---

## 10. Controls and presentation (this remake)

- Full viewport canvas. **F** = fullscreen. Do not lock to a tiny 4:3 box.
- Gamepad: left stick move, right stick fire 360°. Two physical pads = stick1 move, stick2 fire.
- Keyboard: WASD move, arrows or IJKL fire. Mouse-click aim also works.
- Start: Space / Enter / click / A or Start. Pause: Esc.
- Title, intro banner, splashy `TRANS` intermission (~3.35 s), then next-wave intro.
- HUD: score, high, wave, lives, hostiles left, saved this wave, SPH/ENF when present.

---

## 11. Legal / asset policy

Unofficial fan remake. Not affiliated with Williams, Vid Kidz, Midway, or Warner Bros.

**All sprites, title art, floor texture, and sounds in this repo were created from scratch.** No ROM dumps, no ripped arcade graphics, no extracted cabinet audio, no 6809/6808 source in the tree. Keep it that way. Homage in behavior and palette is fine; copying files from MAME is not.

---

## 12. Suggested build order from here

Waves **1–10** and all of their unique systems (Brain, Prog, missile, Quark, Tank, shell) are in. Next:

1. **Wave 11** — normal (35 Grunts, 25 electrodes, 8 Hulks, 5 Spheroids, 3 of each family). No new entities.
2. Data-drive **waves 12–40** from the §3 table (Tank 12, Hulk wave 14, Double Trouble 24).
3. After wave 40, wrap 21–40 with a difficulty multiplier through 255.
4. Attract mode, 2-player alternate, initials on high score, operator extra-life options.
5. Optional Bozo mercy on waves 1–4.

---

*Wave counts in §3 match `WVCNT` in the released Williams assembly. Behavior in §5–§8 is what a clone needs beyond those counts.*
