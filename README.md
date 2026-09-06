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

Hulks cannot be killed. Spheroids hatch Enforcers; Quarks hatch Tanks. Kill the spawners first.

Clearing wave 10 is the end of the **mapped** campaign for now — you get an *end of transmission* card, not a fake victory. More waves are still to be built.

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
