# Robotron: 2084 – Complete Reference Document
*(Waves + Sound Effects for clone development)*

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

Extra life every 20,000 / 25,000 / 30,000 / 50,000 points (operator setting; most common is 25,000).

---

*This document contains everything needed for a faithful clone: the complete sound set and the full wave progression with exact starting counts.*