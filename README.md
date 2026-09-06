# ROBOTRON 2084

```
  ██████╗  ██████╗ ██████╗  ██████╗ ████████╗██████╗  ██████╗ ███╗   ██╗
  ██╔══██╗██╔═══██╗██╔══██╗██╔═══██╗╚══██╔══╝██╔══██╗██╔═══██╗████╗  ██║
  ██████╔╝██║   ██║██████╔╝██║   ██║   ██║   ██████╔╝██║   ██║██╔██╗ ██║
  ██╔══██╗██║   ██║██╔══██╗██║   ██║   ██║   ██╔══██╗██║   ██║██║╚██╗██║
  ██║  ██║╚██████╔╝██████╔╝╚██████╔╝   ██║   ██║  ██║╚██████╔╝██║ ╚████║
  ╚═╝  ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝    ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
                              2  0  8  4
```

**A from-scratch browser remake of the last stand in 2084.**  
Dual-stick chaos. Save the last human family. Destroy the Grunts. Do not let the Spheroids cook.

This is an unofficial fan remake. It is not affiliated with, endorsed by, or licensed by Williams Electronics, Vid Kidz, Midway, Warner Bros., or any rights holder of the original arcade game.

---

## Inspired by

**Robotron: 2084** (arcade, 1982) — published by **Williams Electronics, Inc.**

The original game was designed and programmed by **Eugene Jarvis** and **Larry DeMar** of **Vid Kidz**. Character graphics were created by **Eugene Jarvis**, **John Sheldrake**, **Larry DeMar**, and **Ken Roberts**. Cabinet art was by **Constantino Mitchell**.

Everything that is fun about this remake exists because they built one of the greatest action games ever made. This project is a love letter to that cabinet: two sticks, one screen, no mercy.

---

## Original work

**Every asset in this repository was created from scratch for this remake.**

| What | How it was made |
|---|---|
| Sprites, title art, floor texture | Original illustrations generated and edited for this project |
| Sound effects | Original audio synthesized for this project |
| Game code, UI, particles, arena | Written from scratch in HTML, CSS, and JavaScript |

**Nothing was copied from the original game.**

- No ROM dumps
- No ripped arcade sprites or tiles
- No sampled or extracted Williams cabinet audio
- No original 6809 / 6808 source copied into this tree

The look and the feel are an homage. The files in this repo are new.

---

## Play

Serve the folder and open it in a desktop browser (fullscreen recommended):

```bash
python3 -m http.server 8765
```

Then go to [http://localhost:8765](http://localhost:8765) and press **F** for fullscreen.

### Controls

| | Move | Fire |
|---|---|---|
| **Gamepad** | Left stick | Right stick (360°) |
| **Two joysticks** | Stick 1 | Stick 2 |
| **Keyboard** | WASD | Arrow keys or IJKL |
| **Mouse** | — | Click toggles sticky aim, move to steer, right-click clears |

**Start** — Space, Enter, click, or gamepad A / Start  
**Dash** — Shift, gamepad LB / RB (or stick-click), or double-tap WASD — 0.18s burst + i-frames, 2.5s cooldown  
**Pause** — Esc (shows controls + options)  
**Fullscreen** — F  
**T** — Autofire (keeps firing last direction) · **E** — Easy / Arcade · **M** — Mute · **V** — Low-FX (less shake/flash) · **N** — Scanlines on/off

Touch a human to save — chain 1000 → 2000 → 3000 → 4000 → 5000. Green Hulks can't be killed. Orange shots are always enemy. `HELP!` means a Brain is converting someone.

### Waves in this build

| Wave | What walks in |
|---|---|
| **1** | 15 Grunts, 5 electrodes, Mommy & Daddy |
| **2** | 17 Grunts, 15 electrodes, 5 Hulks, Mikey, 1 Spheroid |
| **3** | 22 Grunts, 25 electrodes, 6 Hulks, the full family, 3 Spheroids |
| **4** | 34 Grunts, 25 electrodes, 7 Hulks, the full family, 4 Spheroids |
| **5** | 20 Grunts, 20 electrodes, 15 Brains, 15 Mommies, 1 Mikey, 1 Spheroid |
| **6** | 32 Grunts, 25 electrodes, 7 Hulks, 3 of each family, 4 Spheroids |
| **7** | 10 Quarks, Tanks, 12 Hulks, 4 of each family, no Grunts or electrodes |
| **8** | 35 Grunts, 25 electrodes, 8 Hulks, 3 of each family, 5 Spheroids |
| **9** | 60 Grunts, no electrodes, 4 Hulks, 3 of each family, 5 Spheroids |
| **10** | 25 Grunts, 20 electrodes, 20 Brains, 22 Daddies, 1 Spheroid |
| **11** | 35 Grunts, 25 electrodes, 8 Hulks, 3 of each family, 5 Spheroids |
| **12** | 12 Quarks, Tanks, 13 Hulks, 3 of each family, no Grunts or electrodes |
| **13** | 35 Grunts, 25 electrodes, 8 Hulks, 3 of each family, 5 Spheroids |
| **14** | 27 Grunts, 5 electrodes, 20 Hulks, 5 of each family, 2 Spheroids |
| **15** | 25 Grunts, 20 electrodes, 20 Brains, 22 Mikeys, 2 Hulks, 1 Spheroid |
| **16** | 35 Grunts, 25 electrodes, 3 Hulks, 3 of each family, 5 Spheroids |
| **17** | 12 Quarks, Tanks, 14 Hulks, 3 of each family, no Grunts or electrodes |
| **18** | 35 Grunts, 25 electrodes, 8 Hulks, 3 of each family, 5 Spheroids |
| **19** | 70 Grunts, no electrodes, 3 Hulks, 3 of each family, 5 Spheroids |
| **20** | 25 Grunts, 20 electrodes, 20 Brains, 8 of each family, 2 Hulks, 2 Spheroids |
| **21** | 35 Grunts, 25 electrodes, 8 Hulks, 3 of each family, 5 Spheroids |
| **22** | 12 Quarks, Tanks, 15 Hulks, 3 of each family, no Grunts or electrodes |
| **23** | 35 Grunts, 25 electrodes, 8 Hulks, 3 of each family, 5 Spheroids |
| **24** | 6 Spheroids + 7 Quarks (Double Trouble), 13 Hulks, 3 of each family, no Grunts or electrodes |
| **25** | 25 Grunts, 20 electrodes, 21 Brains, 25 Mommies + Mikey, 1 Hulk, 1 Spheroid |
| **26** | 35 Grunts, 25 electrodes, 8 Hulks, 3 of each family, 5 Spheroids |
| **27** | 12 Quarks, Tanks, 16 Hulks, 3 of each family, no Grunts or electrodes |
| **28** | 35 Grunts, 25 electrodes, 8 Hulks, 3 of each family, 5 Spheroids + 1 Quark |
| **29** | 75 Grunts, no electrodes, 4 Hulks, 3 of each family, 5 Spheroids + 1 Quark |
| **30** | 25 Grunts, 20 electrodes, 22 Brains, 25 Daddies, 1 Hulk, 1 Spheroid + 1 Quark |
| **31** | 35 Grunts, 25 electrodes, 8 Hulks, 3 of each family, 5 Spheroids + 1 Quark |
| **32** | 13 Quarks, Tanks, 16 Hulks, 3 of each family, no Grunts or electrodes |
| **33** | 35 Grunts, 25 electrodes, 8 Hulks, 3 of each family, 5 Spheroids + 1 Quark |
| **34** | 30 Grunts, no electrodes, 25 Hulks, 3 of each family, 2 Spheroids + 2 Quarks |
| **35** | 27 Grunts, 15 electrodes, 23 Brains, 25 Mikeys, 2 Hulks, 1 Spheroid + 2 Quarks |
| **36** | 35 Grunts, 25 electrodes, 8 Hulks, 3 of each family, 5 Spheroids + 2 Quarks |
| **37** | 14 Quarks, Tanks, 16 Hulks, 3 of each family, no Grunts or electrodes |
| **38** | 35 Grunts, 25 electrodes, 8 Hulks, 3 of each family, 5 Spheroids + 2 Quarks |
| **39** | 80 Grunts, no electrodes, 6 Hulks, 3 of each family, 5 Spheroids + 1 Quark |
| **40** | 30 Grunts, 15 electrodes, 25 Brains, 10 of each family, 2 Hulks, 1 Spheroid + 1 Quark |

Hulks cannot be killed. Spheroids hatch Enforcers; Quarks hatch Tanks. Kill the spawners first.

Clearing wave 40 doesn't end the war — waves 21–40 repeat with rising intensity through wave 255, then wrap to 1. Game over only when your lives run out.

---

## Stack

Plain files. No build step.

```
index.html
src/          game loop, input, audio, FX
assets/       original sprites and synthesized sounds
tools/        sprite keying and sound generation helpers
docs/         full clone spec + handoff for continuing the build
```

- [`docs/requirements.md`](docs/requirements.md) — waves 1–40, scoring, entity rules, sound commands
- [`docs/handoff.md`](docs/handoff.md) — what is implemented, file map, how to add the next wave

---

## Credit, again

Robotron: 2084 © 1982 Williams Electronics, Inc.  
Created by **Eugene Jarvis** and **Larry DeMar** (Vid Kidz).

This remake is an independent tribute. Play the original if you can find a cabinet. Then come back and try to save Mommy, Daddy, and Mikey one more time.
