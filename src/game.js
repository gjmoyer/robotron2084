(() => {
  // Compat: if a stale cached input.js lacks prefs/stickyAim, backfill defaults so render never crashes.
  try {
    if (window.Input && !window.Input.prefs) {
      window.Input.prefs = { autofire: false, muted: false, lowfx: false, scanlines: true, difficulty: "arcade" };
    }
    if (window.Input) {
      if (window.Input.stickyAim === undefined) window.Input.stickyAim = false;
      if (window.Input.mouseSeen === undefined) window.Input.mouseSeen = false;
      if (window.Input.lastAimX === undefined) window.Input.lastAimX = 0;
      if (window.Input.lastAimY === undefined) window.Input.lastAimY = -1;
      if (window.Input.dashEdge === undefined) window.Input.dashEdge = false;
      if (typeof window.Input.consumeDash !== "function") {
        window.Input.consumeDash = function () { return false; };
      }
    }
  } catch (_) {}
  const STATE = {
    TITLE: "title",
    INTRO: "intro",
    PLAY: "play",
    DEAD: "dead",
    CLEAR: "clear",
    OVER: "over",
    PAUSE: "pause",
    TRANS: "trans",
    ATTRACT: "attract",
    OPERATOR: "operator",
    ENTRY: "entry",
  };

  const HS_KEY = "robotron2084_hs";
  const HS_KEY_OLD = "robotron2084_wave1_hs";
  const HISTAB_KEY = "robotron2084_hiscores_v1";
  const CRED_KEY = "robotron2084_credits_v1";
  const MAX_WAVE = 255;
  // Waves 1-40 are unique. Past 40, the 21-40 block repeats (41->21, …)
  // with a per-cycle intensity ramp, through 255, then wraps to 1.
  const UNIQUE_WAVES = 40;
  const LOOP_BASE = 21;
  const LOOP_LEN = 20;

  const WAVES = [
    null,
    {
      grunts: 15,
      electrodes: 5,
      mommy: 1,
      daddy: 1,
      mikey: 0,
      hulks: 0,
      spheroids: 0,
      electrodeStyle: "plus",
      electrodeHue: 48,
      gruntMul: 1,
      humans: 2,
      hatchFirst: 2.4,
      hatchNext: 1.4,
      quotaMin: 3,
      quotaMax: 4,
      fireMin: 0.7,
      fireMax: 1.15,
      enforcerCap: 4,
      enforcerMul: 0.72,
      sparkMul: 0.48,
      subtitle: "THE LAST HUMAN FAMILY",
    },
    {
      grunts: 17,
      electrodes: 15,
      mommy: 1,
      daddy: 1,
      mikey: 1,
      hulks: 5,
      spheroids: 1,
      electrodeStyle: "diamond",
      electrodeHue: 188,
      gruntMul: 1.28,
      humans: 3,
      hatchFirst: 2.2,
      hatchNext: 1.25,
      quotaMin: 3,
      quotaMax: 5,
      fireMin: 0.62,
      fireMax: 1.05,
      enforcerCap: 4,
      enforcerMul: 0.78,
      sparkMul: 0.52,
      subtitle: "HULKS ATTACK",
    },
    {
      grunts: 22,
      electrodes: 25,
      mommy: 2,
      daddy: 2,
      mikey: 2,
      hulks: 6,
      spheroids: 3,
      electrodeStyle: "square",
      electrodeHue: 312,
      gruntMul: 1.42,
      humans: 6,
      hatchFirst: 1.8,
      hatchNext: 0.95,
      quotaMin: 4,
      quotaMax: 6,
      fireMin: 0.48,
      fireMax: 0.82,
      enforcerCap: 6,
      enforcerMul: 0.86,
      sparkMul: 0.58,
      subtitle: "SPHEROID STORM",
    },
    {
      grunts: 34,
      electrodes: 25,
      mommy: 2,
      daddy: 2,
      mikey: 2,
      hulks: 7,
      spheroids: 4,
      electrodeStyle: "x",
      electrodeHue: 28,
      gruntMul: 1.48,
      humans: 6,
      hatchFirst: 1.7,
      hatchNext: 0.9,
      quotaMin: 4,
      quotaMax: 6,
      fireMin: 0.45,
      fireMax: 0.78,
      enforcerCap: 6,
      enforcerMul: 0.9,
      sparkMul: 0.6,
      subtitle: "GRUNT SWARM",
    },
    {
      grunts: 20,
      electrodes: 20,
      mommy: 15,
      daddy: 0,
      mikey: 1,
      hulks: 0,
      spheroids: 1,
      brains: 15,
      electrodeStyle: "plus",
      electrodeHue: 280,
      gruntMul: 1.35,
      humans: 16,
      hatchFirst: 2.0,
      hatchNext: 1.15,
      quotaMin: 3,
      quotaMax: 5,
      fireMin: 0.55,
      fireMax: 0.95,
      enforcerCap: 4,
      enforcerMul: 0.8,
      sparkMul: 0.52,
      brainMul: 0.72,
      missileMul: 0.4,
      subtitle: "BRAIN WAVE — SAVE THE MOMMIES",
    },
    {
      grunts: 32,
      electrodes: 25,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 7,
      spheroids: 4,
      brains: 0,
      electrodeStyle: "diamond",
      electrodeHue: 132,
      gruntMul: 1.52,
      humans: 9,
      hatchFirst: 1.75,
      hatchNext: 0.95,
      quotaMin: 4,
      quotaMax: 6,
      fireMin: 0.48,
      fireMax: 0.82,
      enforcerCap: 6,
      enforcerMul: 0.88,
      sparkMul: 0.58,
      subtitle: "FAMILY IN THE CROSSFIRE",
    },
    {
      grunts: 0,
      electrodes: 0,
      mommy: 4,
      daddy: 4,
      mikey: 4,
      hulks: 12,
      spheroids: 0,
      brains: 0,
      quarks: 10,
      electrodeStyle: "square",
      electrodeHue: 28,
      gruntMul: 1,
      humans: 12,
      hatchFirst: 2.2,
      hatchNext: 1.35,
      quotaMin: 2,
      quotaMax: 3,
      fireMin: 0.7,
      fireMax: 1.15,
      enforcerCap: 4,
      enforcerMul: 0.75,
      sparkMul: 0.5,
      tankCap: 6,
      tankFireMin: 1.35,
      tankFireMax: 2.15,
      tankMul: 0.55,
      shellMul: 0.4,
      subtitle: "TANK WAVE — CLEAR THE QUARKS",
    },
    {
      grunts: 35,
      electrodes: 25,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 8,
      spheroids: 5,
      brains: 0,
      electrodeStyle: "x",
      electrodeHue: 20,
      gruntMul: 1.58,
      humans: 9,
      hatchFirst: 1.65,
      hatchNext: 0.88,
      quotaMin: 4,
      quotaMax: 6,
      fireMin: 0.44,
      fireMax: 0.78,
      enforcerCap: 6,
      enforcerMul: 0.92,
      sparkMul: 0.6,
      subtitle: "NO RESPITE",
    },
    {
      grunts: 60,
      electrodes: 0,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 4,
      spheroids: 5,
      brains: 0,
      electrodeStyle: "plus",
      electrodeHue: 150,
      gruntMul: 1.62,
      humans: 9,
      hatchFirst: 1.65,
      hatchNext: 0.88,
      quotaMin: 4,
      quotaMax: 6,
      fireMin: 0.44,
      fireMax: 0.78,
      enforcerCap: 6,
      enforcerMul: 0.92,
      sparkMul: 0.6,
      subtitle: "THE SWARM",
    },
    {
      grunts: 25,
      electrodes: 20,
      mommy: 0,
      daddy: 22,
      mikey: 0,
      hulks: 0,
      spheroids: 1,
      brains: 20,
      electrodeStyle: "diamond",
      electrodeHue: 240,
      gruntMul: 1.45,
      humans: 22,
      hatchFirst: 1.9,
      hatchNext: 1.05,
      quotaMin: 3,
      quotaMax: 5,
      fireMin: 0.52,
      fireMax: 0.9,
      enforcerCap: 4,
      enforcerMul: 0.82,
      sparkMul: 0.54,
      brainMul: 0.78,
      missileMul: 0.42,
      subtitle: "BRAIN WAVE — SAVE THE DADDIES",
    },
    {
      grunts: 35,
      electrodes: 25,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 8,
      spheroids: 5,
      electrodeStyle: "square",
      electrodeHue: 305,
      gruntMul: 1.64,
      humans: 9,
      hatchFirst: 1.6,
      hatchNext: 0.85,
      quotaMin: 4,
      quotaMax: 6,
      fireMin: 0.42,
      fireMax: 0.75,
      enforcerCap: 7,
      enforcerMul: 0.94,
      sparkMul: 0.62,
      subtitle: "RELENTLESS",
    },
    {
      grunts: 0,
      electrodes: 0,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 13,
      spheroids: 0,
      quarks: 12,
      electrodeStyle: "x",
      electrodeHue: 30,
      gruntMul: 1,
      humans: 9,
      hatchFirst: 2.0,
      hatchNext: 1.15,
      quotaMin: 2,
      quotaMax: 4,
      fireMin: 0.7,
      fireMax: 1.15,
      enforcerCap: 4,
      enforcerMul: 0.75,
      sparkMul: 0.5,
      tankCap: 7,
      tankFireMin: 1.2,
      tankFireMax: 2.0,
      tankMul: 0.6,
      shellMul: 0.44,
      subtitle: "TANK WAVE — IRON TIDE",
    },
    {
      grunts: 35,
      electrodes: 25,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 8,
      spheroids: 5,
      electrodeStyle: "plus",
      electrodeHue: 185,
      gruntMul: 1.66,
      humans: 9,
      hatchFirst: 1.55,
      hatchNext: 0.82,
      quotaMin: 4,
      quotaMax: 6,
      fireMin: 0.4,
      fireMax: 0.72,
      enforcerCap: 7,
      enforcerMul: 0.96,
      sparkMul: 0.64,
      subtitle: "THE GRINDER",
    },
    {
      grunts: 27,
      electrodes: 5,
      mommy: 5,
      daddy: 5,
      mikey: 5,
      hulks: 20,
      spheroids: 2,
      electrodeStyle: "diamond",
      electrodeHue: 115,
      gruntMul: 1.68,
      humans: 15,
      hatchFirst: 1.6,
      hatchNext: 0.85,
      quotaMin: 4,
      quotaMax: 6,
      fireMin: 0.42,
      fireMax: 0.75,
      enforcerCap: 5,
      enforcerMul: 0.96,
      sparkMul: 0.64,
      subtitle: "HULK WAVE — GREEN WALL",
    },
    {
      grunts: 25,
      electrodes: 20,
      mommy: 0,
      daddy: 0,
      mikey: 22,
      hulks: 2,
      spheroids: 1,
      brains: 20,
      electrodeStyle: "square",
      electrodeHue: 285,
      gruntMul: 1.55,
      humans: 22,
      hatchFirst: 1.85,
      hatchNext: 1.0,
      quotaMin: 3,
      quotaMax: 5,
      fireMin: 0.5,
      fireMax: 0.88,
      enforcerCap: 4,
      enforcerMul: 0.84,
      sparkMul: 0.56,
      brainMul: 0.84,
      missileMul: 0.44,
      subtitle: "BRAIN WAVE — SAVE THE MIKEYS",
    },
    {
      grunts: 35,
      electrodes: 25,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 3,
      spheroids: 5,
      electrodeStyle: "x",
      electrodeHue: 15,
      gruntMul: 1.68,
      humans: 9,
      hatchFirst: 1.5,
      hatchNext: 0.8,
      quotaMin: 4,
      quotaMax: 6,
      fireMin: 0.4,
      fireMax: 0.7,
      enforcerCap: 7,
      enforcerMul: 0.98,
      sparkMul: 0.66,
      subtitle: "ENCIRCLEMENT",
    },
    {
      grunts: 0,
      electrodes: 0,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 14,
      spheroids: 0,
      quarks: 12,
      electrodeStyle: "plus",
      electrodeHue: 35,
      gruntMul: 1,
      humans: 9,
      hatchFirst: 1.9,
      hatchNext: 1.1,
      quotaMin: 2,
      quotaMax: 4,
      fireMin: 0.7,
      fireMax: 1.15,
      enforcerCap: 4,
      enforcerMul: 0.75,
      sparkMul: 0.5,
      tankCap: 8,
      tankFireMin: 1.15,
      tankFireMax: 1.95,
      tankMul: 0.62,
      shellMul: 0.46,
      subtitle: "TANK WAVE — STEEL CAGE",
    },
    {
      grunts: 35,
      electrodes: 25,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 8,
      spheroids: 5,
      electrodeStyle: "diamond",
      electrodeHue: 195,
      gruntMul: 1.7,
      humans: 9,
      hatchFirst: 1.45,
      hatchNext: 0.78,
      quotaMin: 4,
      quotaMax: 6,
      fireMin: 0.38,
      fireMax: 0.68,
      enforcerCap: 7,
      enforcerMul: 1.0,
      sparkMul: 0.68,
      subtitle: "OVERDRIVE",
    },
    {
      grunts: 70,
      electrodes: 0,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 3,
      spheroids: 5,
      electrodeStyle: "square",
      electrodeHue: 140,
      gruntMul: 1.75,
      humans: 9,
      hatchFirst: 1.45,
      hatchNext: 0.78,
      quotaMin: 4,
      quotaMax: 6,
      fireMin: 0.38,
      fireMax: 0.68,
      enforcerCap: 7,
      enforcerMul: 1.02,
      sparkMul: 0.7,
      subtitle: "THE SWARM RETURNS",
    },
    {
      grunts: 25,
      electrodes: 20,
      mommy: 8,
      daddy: 8,
      mikey: 8,
      hulks: 2,
      spheroids: 2,
      brains: 20,
      electrodeStyle: "x",
      electrodeHue: 265,
      gruntMul: 1.6,
      humans: 24,
      hatchFirst: 1.8,
      hatchNext: 0.95,
      quotaMin: 3,
      quotaMax: 5,
      fireMin: 0.48,
      fireMax: 0.85,
      enforcerCap: 5,
      enforcerMul: 0.86,
      sparkMul: 0.58,
      brainMul: 0.9,
      missileMul: 0.46,
      subtitle: "BRAIN WAVE — SAVE THE FAMILY",
    },
    {
      grunts: 35,
      electrodes: 25,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 8,
      spheroids: 5,
      electrodeStyle: "plus",
      electrodeHue: 55,
      gruntMul: 1.72,
      humans: 9,
      hatchFirst: 1.45,
      hatchNext: 0.78,
      quotaMin: 4,
      quotaMax: 6,
      fireMin: 0.38,
      fireMax: 0.68,
      enforcerCap: 7,
      enforcerMul: 1.02,
      sparkMul: 0.7,
      subtitle: "NO MERCY",
    },
    {
      grunts: 0,
      electrodes: 0,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 15,
      spheroids: 0,
      quarks: 12,
      electrodeStyle: "diamond",
      electrodeHue: 200,
      gruntMul: 1,
      humans: 9,
      hatchFirst: 1.85,
      hatchNext: 1.05,
      quotaMin: 2,
      quotaMax: 4,
      fireMin: 0.7,
      fireMax: 1.15,
      enforcerCap: 4,
      enforcerMul: 0.75,
      sparkMul: 0.5,
      tankCap: 8,
      tankFireMin: 1.1,
      tankFireMax: 1.9,
      tankMul: 0.64,
      shellMul: 0.48,
      subtitle: "TANK WAVE — IRON MAW",
    },
    {
      grunts: 35,
      electrodes: 25,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 8,
      spheroids: 5,
      electrodeStyle: "square",
      electrodeHue: 320,
      gruntMul: 1.74,
      humans: 9,
      hatchFirst: 1.42,
      hatchNext: 0.76,
      quotaMin: 4,
      quotaMax: 6,
      fireMin: 0.37,
      fireMax: 0.66,
      enforcerCap: 7,
      enforcerMul: 1.04,
      sparkMul: 0.72,
      subtitle: "CRUSHING WEIGHT",
    },
    {
      grunts: 0,
      electrodes: 0,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 13,
      spheroids: 6,
      quarks: 7,
      electrodeStyle: "x",
      electrodeHue: 25,
      gruntMul: 1,
      humans: 9,
      hatchFirst: 1.5,
      hatchNext: 0.85,
      quotaMin: 3,
      quotaMax: 5,
      fireMin: 0.38,
      fireMax: 0.68,
      enforcerCap: 8,
      enforcerMul: 1.0,
      sparkMul: 0.68,
      tankCap: 8,
      tankFireMin: 1.1,
      tankFireMax: 1.9,
      tankMul: 0.64,
      shellMul: 0.48,
      subtitle: "DOUBLE TROUBLE",
    },
    {
      grunts: 25,
      electrodes: 20,
      mommy: 25,
      daddy: 0,
      mikey: 1,
      hulks: 1,
      spheroids: 1,
      brains: 21,
      electrodeStyle: "plus",
      electrodeHue: 275,
      gruntMul: 1.65,
      humans: 26,
      hatchFirst: 1.75,
      hatchNext: 0.92,
      quotaMin: 3,
      quotaMax: 5,
      fireMin: 0.46,
      fireMax: 0.82,
      enforcerCap: 5,
      enforcerMul: 0.88,
      sparkMul: 0.6,
      brainMul: 0.94,
      missileMul: 0.48,
      subtitle: "BRAIN WAVE — SAVE THE MOMMIES",
    },
    {
      grunts: 35,
      electrodes: 25,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 8,
      spheroids: 5,
      electrodeStyle: "diamond",
      electrodeHue: 135,
      gruntMul: 1.76,
      humans: 9,
      hatchFirst: 1.4,
      hatchNext: 0.75,
      quotaMin: 4,
      quotaMax: 6,
      fireMin: 0.37,
      fireMax: 0.66,
      enforcerCap: 7,
      enforcerMul: 1.04,
      sparkMul: 0.72,
      subtitle: "KILL BOX",
    },
    {
      grunts: 0,
      electrodes: 0,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 16,
      spheroids: 0,
      quarks: 12,
      electrodeStyle: "square",
      electrodeHue: 40,
      gruntMul: 1,
      humans: 9,
      hatchFirst: 1.8,
      hatchNext: 1.02,
      quotaMin: 2,
      quotaMax: 4,
      fireMin: 0.7,
      fireMax: 1.15,
      enforcerCap: 4,
      enforcerMul: 0.75,
      sparkMul: 0.5,
      tankCap: 8,
      tankFireMin: 1.05,
      tankFireMax: 1.85,
      tankMul: 0.66,
      shellMul: 0.5,
      subtitle: "TANK WAVE — STEEL RAIN",
    },
    {
      grunts: 35,
      electrodes: 25,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 8,
      spheroids: 5,
      quarks: 1,
      electrodeStyle: "x",
      electrodeHue: 210,
      gruntMul: 1.78,
      humans: 9,
      hatchFirst: 1.4,
      hatchNext: 0.75,
      quotaMin: 4,
      quotaMax: 6,
      fireMin: 0.36,
      fireMax: 0.65,
      enforcerCap: 7,
      enforcerMul: 1.06,
      sparkMul: 0.74,
      tankCap: 7,
      tankFireMin: 1.05,
      tankFireMax: 1.85,
      tankMul: 0.66,
      shellMul: 0.5,
      subtitle: "MIXED COMPANY",
    },
    {
      grunts: 75,
      electrodes: 0,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 4,
      spheroids: 5,
      quarks: 1,
      electrodeStyle: "plus",
      electrodeHue: 155,
      gruntMul: 1.82,
      humans: 9,
      hatchFirst: 1.4,
      hatchNext: 0.75,
      quotaMin: 4,
      quotaMax: 6,
      fireMin: 0.36,
      fireMax: 0.65,
      enforcerCap: 7,
      enforcerMul: 1.06,
      sparkMul: 0.74,
      tankCap: 7,
      tankFireMin: 1.05,
      tankFireMax: 1.85,
      tankMul: 0.66,
      shellMul: 0.5,
      subtitle: "THE GREAT SWARM",
    },
    {
      grunts: 25,
      electrodes: 20,
      mommy: 0,
      daddy: 25,
      mikey: 0,
      hulks: 1,
      spheroids: 1,
      brains: 22,
      quarks: 1,
      electrodeStyle: "diamond",
      electrodeHue: 245,
      gruntMul: 1.68,
      humans: 25,
      hatchFirst: 1.72,
      hatchNext: 0.9,
      quotaMin: 3,
      quotaMax: 5,
      fireMin: 0.46,
      fireMax: 0.8,
      enforcerCap: 5,
      enforcerMul: 0.9,
      sparkMul: 0.62,
      brainMul: 0.96,
      missileMul: 0.5,
      tankCap: 7,
      tankFireMin: 1.05,
      tankFireMax: 1.85,
      tankMul: 0.66,
      shellMul: 0.5,
      subtitle: "BRAIN WAVE — SAVE THE DADDIES",
    },
    {
      grunts: 35,
      electrodes: 25,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 8,
      spheroids: 5,
      quarks: 1,
      electrodeStyle: "square",
      electrodeHue: 315,
      gruntMul: 1.8,
      humans: 9,
      hatchFirst: 1.38,
      hatchNext: 0.74,
      quotaMin: 4,
      quotaMax: 6,
      fireMin: 0.36,
      fireMax: 0.64,
      enforcerCap: 7,
      enforcerMul: 1.08,
      sparkMul: 0.75,
      tankCap: 7,
      tankFireMin: 1.0,
      tankFireMax: 1.8,
      tankMul: 0.68,
      shellMul: 0.52,
      subtitle: "REDLINE",
    },
    {
      grunts: 0,
      electrodes: 0,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 16,
      spheroids: 0,
      quarks: 13,
      electrodeStyle: "x",
      electrodeHue: 20,
      gruntMul: 1,
      humans: 9,
      hatchFirst: 1.75,
      hatchNext: 1.0,
      quotaMin: 2,
      quotaMax: 4,
      fireMin: 0.7,
      fireMax: 1.15,
      enforcerCap: 4,
      enforcerMul: 0.75,
      sparkMul: 0.5,
      tankCap: 8,
      tankFireMin: 1.0,
      tankFireMax: 1.8,
      tankMul: 0.68,
      shellMul: 0.52,
      subtitle: "TANK WAVE — ARMOR COLUMN",
    },
    {
      grunts: 35,
      electrodes: 25,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 8,
      spheroids: 5,
      quarks: 1,
      electrodeStyle: "plus",
      electrodeHue: 190,
      gruntMul: 1.82,
      humans: 9,
      hatchFirst: 1.38,
      hatchNext: 0.74,
      quotaMin: 4,
      quotaMax: 6,
      fireMin: 0.35,
      fireMax: 0.64,
      enforcerCap: 7,
      enforcerMul: 1.08,
      sparkMul: 0.75,
      tankCap: 7,
      tankFireMin: 1.0,
      tankFireMax: 1.8,
      tankMul: 0.68,
      shellMul: 0.52,
      subtitle: "VISE GRIP",
    },
    {
      grunts: 30,
      electrodes: 0,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 25,
      spheroids: 2,
      quarks: 2,
      electrodeStyle: "diamond",
      electrodeHue: 120,
      gruntMul: 1.84,
      humans: 9,
      hatchFirst: 1.5,
      hatchNext: 0.82,
      quotaMin: 3,
      quotaMax: 5,
      fireMin: 0.38,
      fireMax: 0.68,
      enforcerCap: 5,
      enforcerMul: 1.05,
      sparkMul: 0.72,
      tankCap: 7,
      tankFireMin: 1.0,
      tankFireMax: 1.8,
      tankMul: 0.68,
      shellMul: 0.52,
      subtitle: "HULK WAVE — GREEN TIDE",
    },
    {
      grunts: 27,
      electrodes: 15,
      mommy: 0,
      daddy: 0,
      mikey: 25,
      hulks: 2,
      spheroids: 1,
      brains: 23,
      quarks: 2,
      electrodeStyle: "square",
      electrodeHue: 290,
      gruntMul: 1.72,
      humans: 25,
      hatchFirst: 1.7,
      hatchNext: 0.9,
      quotaMin: 3,
      quotaMax: 5,
      fireMin: 0.44,
      fireMax: 0.78,
      enforcerCap: 5,
      enforcerMul: 0.92,
      sparkMul: 0.64,
      brainMul: 1.0,
      missileMul: 0.52,
      tankCap: 7,
      tankFireMin: 1.0,
      tankFireMax: 1.8,
      tankMul: 0.68,
      shellMul: 0.52,
      subtitle: "BRAIN WAVE — SAVE THE MIKEYS",
    },
    {
      grunts: 35,
      electrodes: 25,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 8,
      spheroids: 5,
      quarks: 2,
      electrodeStyle: "x",
      electrodeHue: 10,
      gruntMul: 1.84,
      humans: 9,
      hatchFirst: 1.36,
      hatchNext: 0.73,
      quotaMin: 4,
      quotaMax: 6,
      fireMin: 0.35,
      fireMax: 0.63,
      enforcerCap: 7,
      enforcerMul: 1.1,
      sparkMul: 0.76,
      tankCap: 8,
      tankFireMin: 0.98,
      tankFireMax: 1.78,
      tankMul: 0.7,
      shellMul: 0.53,
      subtitle: "COMBINED ARMS",
    },
    {
      grunts: 0,
      electrodes: 0,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 16,
      spheroids: 0,
      quarks: 14,
      electrodeStyle: "plus",
      electrodeHue: 45,
      gruntMul: 1,
      humans: 9,
      hatchFirst: 1.7,
      hatchNext: 0.98,
      quotaMin: 2,
      quotaMax: 4,
      fireMin: 0.7,
      fireMax: 1.15,
      enforcerCap: 4,
      enforcerMul: 0.75,
      sparkMul: 0.5,
      tankCap: 9,
      tankFireMin: 0.95,
      tankFireMax: 1.75,
      tankMul: 0.7,
      shellMul: 0.54,
      subtitle: "TANK WAVE — STEEL FLOOD",
    },
    {
      grunts: 35,
      electrodes: 25,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 8,
      spheroids: 5,
      quarks: 2,
      electrodeStyle: "diamond",
      electrodeHue: 205,
      gruntMul: 1.86,
      humans: 9,
      hatchFirst: 1.36,
      hatchNext: 0.73,
      quotaMin: 4,
      quotaMax: 6,
      fireMin: 0.34,
      fireMax: 0.63,
      enforcerCap: 7,
      enforcerMul: 1.1,
      sparkMul: 0.76,
      tankCap: 8,
      tankFireMin: 0.98,
      tankFireMax: 1.78,
      tankMul: 0.7,
      shellMul: 0.53,
      subtitle: "CRITICAL MASS",
    },
    {
      grunts: 80,
      electrodes: 0,
      mommy: 3,
      daddy: 3,
      mikey: 3,
      hulks: 6,
      spheroids: 5,
      quarks: 1,
      electrodeStyle: "square",
      electrodeHue: 145,
      gruntMul: 1.9,
      humans: 9,
      hatchFirst: 1.36,
      hatchNext: 0.73,
      quotaMin: 4,
      quotaMax: 6,
      fireMin: 0.34,
      fireMax: 0.62,
      enforcerCap: 8,
      enforcerMul: 1.12,
      sparkMul: 0.78,
      tankCap: 7,
      tankFireMin: 0.98,
      tankFireMax: 1.78,
      tankMul: 0.7,
      shellMul: 0.53,
      subtitle: "THE SWARM APEX",
    },
    {
      grunts: 30,
      electrodes: 15,
      mommy: 10,
      daddy: 10,
      mikey: 10,
      hulks: 2,
      spheroids: 1,
      brains: 25,
      quarks: 1,
      electrodeStyle: "x",
      electrodeHue: 270,
      gruntMul: 1.75,
      humans: 30,
      hatchFirst: 1.68,
      hatchNext: 0.88,
      quotaMin: 3,
      quotaMax: 5,
      fireMin: 0.44,
      fireMax: 0.78,
      enforcerCap: 5,
      enforcerMul: 0.94,
      sparkMul: 0.66,
      brainMul: 1.05,
      missileMul: 0.54,
      tankCap: 7,
      tankFireMin: 0.98,
      tankFireMax: 1.78,
      tankMul: 0.7,
      shellMul: 0.53,
      subtitle: "BRAIN WAVE — SAVE THE FAMILY",
    },
  ];

  // Arcade-authentic open borders: Grunt swarms (9/19/29/39) + Double Trouble
  // (24) shipped without energy walls. Gameplay clamp stays (screen edge still
  // blocks) — only the wall rendering + electrode-border feel goes away.
  try {
    for (const n of [9, 19, 24, 29, 39]) {
      if (WAVES[n]) WAVES[n].openBorder = true;
    }
  } catch (_) {}

  const SPRITE_URLS = {
    player_s: "assets/sprites/player_s.png",
    player_s_w0: "assets/sprites/player_s_w0.png",
    player_s_w1: "assets/sprites/player_s_w1.png",
    player_e: "assets/sprites/player_e.png",
    player_w: "assets/sprites/player_w.png",
    player_n: "assets/sprites/player_n.png",
    grunt_s: "assets/sprites/grunt_s.png",
    grunt_s_w0: "assets/sprites/grunt_s_w0.png",
    grunt_s_w1: "assets/sprites/grunt_s_w1.png",
    grunt_n: "assets/sprites/grunt_n.png",
    mommy_s: "assets/sprites/mommy_s.png",
    mommy_s_w0: "assets/sprites/mommy_s_w0.png",
    mommy_s_w1: "assets/sprites/mommy_s_w1.png",
    mommy_e: "assets/sprites/mommy_e.png",
    mommy_w: "assets/sprites/mommy_w.png",
    daddy_s: "assets/sprites/daddy_s.png",
    daddy_s_w0: "assets/sprites/daddy_s_w0.png",
    daddy_s_w1: "assets/sprites/daddy_s_w1.png",
    daddy_e: "assets/sprites/daddy_e.png",
    daddy_w: "assets/sprites/daddy_w.png",
    hulk_s: "assets/sprites/hulk_s.png",
    hulk_s_w0: "assets/sprites/hulk_s_w0.png",
    hulk_s_w1: "assets/sprites/hulk_s_w1.png",
    mikey_s: "assets/sprites/mikey_s.png",
    mikey_s_w0: "assets/sprites/mikey_s_w0.png",
    mikey_s_w1: "assets/sprites/mikey_s_w1.png",
    mikey_e: "assets/sprites/mikey_e.png",
    mikey_w: "assets/sprites/mikey_w.png",
    brain_s: "assets/sprites/brain_s.png",
    brain_s_w0: "assets/sprites/brain_s_w0.png",
    brain_s_w1: "assets/sprites/brain_s_w1.png",
    prog_s: "assets/sprites/prog_s.png",
    prog_s_w0: "assets/sprites/prog_s_w0.png",
    prog_s_w1: "assets/sprites/prog_s_w1.png",
    tank_s: "assets/sprites/tank_s.png",
    tank_e: "assets/sprites/tank_e.png",
    tank_w: "assets/sprites/tank_w.png",
    quark: "assets/sprites/quark.png",
    title: "assets/title.jpg",
    floor: "assets/floor.jpg",
  };

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load " + src));
      img.src = src;
    });
  }

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }

  function len(x, y) {
    return Math.hypot(x, y);
  }

  function norm(x, y) {
    const m = Math.hypot(x, y);
    if (m < 1e-6) return [0, 0];
    return [x / m, y / m];
  }

  function facingFrom(x, y) {
    if (Math.abs(x) < 0.01 && Math.abs(y) < 0.01) return "s";
    const a = Math.atan2(y, x);
    const deg = (a * 180) / Math.PI;
    if (deg >= -45 && deg < 45) return "e";
    if (deg >= 45 && deg < 135) return "s";
    if (deg >= -135 && deg < -45) return "n";
    return "w";
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  class Game {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: false });
      this.sprites = {};
      this.state = STATE.TITLE;
      this.prevState = STATE.TITLE;
      this.time = 0;
      this.waveTime = 0;
      this.stateTime = 0;
      this.score = 0;
      this.high = Number(localStorage.getItem(HS_KEY) || localStorage.getItem(HS_KEY_OLD) || 0);
      this.lives = 3;
      this.humanChain = 0;
      this.rescued = 0;
      this.totalRescued = 0;
      this.waveNum = 1;
      this.extraAwarded = 0;
      this.nextExtraAt = 25000;
      this.isNewBest = false;
      this.hadBest = Number(localStorage.getItem(HS_KEY) || localStorage.getItem(HS_KEY_OLD) || 0) > 0;
      // --- arcade systems: credits / 2P / hiscores / operator / attract / bozo
      this.credits = Number(localStorage.getItem(CRED_KEY) || 0) || 0;
      this.numPlayers = 1;
      this.activePlayer = 0;
      this.players = null; // 2P slots [{score,lives,waveNum,humanChain,totalRescued,nextExtraAt,rescued}]
      this.deaths = 0; // session deaths (Bozo mercy input)
      this.hiscores = this.loadHiscores();
      if (this.hiscores.length && this.hiscores[0].score > this.high) {
        this.high = this.hiscores[0].score;
      }
      this.titleIdle = 0;
      this.attractDemo = null;
      this.operatorRow = 0;
      this.entryInitials = ["A", "A", "A"];
      this.entryPos = 0;
      this.entryScore = 0;
      this.entryWave = 1;
      this.entryQueue = []; // pending 2P entries [{score,wave,player}]
      this.entryPlayerIdx = 0;
      this.demoMode = false;
      this.player = null;
      this.grunts = [];
      this.humans = [];
      this.hulks = [];
      this.spheroids = [];
      this.enforcers = [];
      this.sparks = [];
      this.brains = [];
      this.progs = [];
      this.missiles = [];
      this.quarks = [];
      this.tanks = [];
      this.shells = [];
      this.electrodes = [];
      this.bullets = [];
      this.fireCd = 0;
      this.arena = { x: 0, y: 0, w: 0, h: 0 };
      this.minDim = 800;
      this.hudH = 72;
      this.pausedFrom = STATE.PLAY;
      this.titlePulse = 0;
      this.floorPat = null;
    }

    async load() {
      const entries = Object.entries(SPRITE_URLS);
      await Promise.all(
        entries.map(async ([k, url]) => {
          this.sprites[k] = await loadImage(url);
        })
      );
    }

    resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.canvas.width = Math.floor(w * dpr);
      this.canvas.height = Math.floor(h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.viewW = w;
      this.viewH = h;
      this.hudH = Math.max(58, Math.min(88, h * 0.075));
      const pad = Math.max(18, Math.min(36, w * 0.016));
      this.arena = {
        x: pad,
        y: this.hudH + pad * 0.4,
        w: w - pad * 2,
        h: h - this.hudH - pad * 1.4,
      };
      this.minDim = Math.min(this.arena.w, this.arena.h);
      this.floorPat = null;
    }

    startGame(numPlayers = 1) {
      const prefs = (window.Input && window.Input.prefs) || {};
      // credits: free-play skips, otherwise consume one
      if (!prefs.freePlay) {
        if (this.credits <= 0) {
          AudioFX.ui();
          return false;
        }
        this.credits -= 1;
        try {
          localStorage.setItem(CRED_KEY, String(this.credits));
        } catch (_) {}
      }
      try {
        if (window.Input) {
          window.Input.startEdge = false;
          window.Input.onePEdge = false;
          window.Input.twoPEdge = false;
          window.Input._clickStart = false;
          window.Input.startLatch = false;
        }
      } catch (_) {}
      this.numPlayers = numPlayers === 2 ? 2 : 1;
      this.activePlayer = 0;
      const startLives = prefs.startLives === 5 ? 5 : 3;
      const firstExtra = prefs.extraLifeEvery === undefined ? 25000 : prefs.extraLifeEvery;
      if (this.numPlayers === 2) {
        this.players = [
          { score: 0, lives: startLives, waveNum: 1, humanChain: 0, totalRescued: 0, rescued: 0, nextExtraAt: firstExtra || 0, extraAwarded: 0 },
          { score: 0, lives: startLives, waveNum: 1, humanChain: 0, totalRescued: 0, rescued: 0, nextExtraAt: firstExtra || 0, extraAwarded: 0 },
        ];
        this.loadPlayerSlot(0);
      } else {
        this.players = null;
        this.score = 0;
        this.lives = startLives;
        this.humanChain = 0;
        this.rescued = 0;
        this.totalRescued = 0;
        this.waveNum = 1;
        this.nextExtraAt = firstExtra || 0;
        this.extraAwarded = 0;
      }
      this.deaths = 0;
      this.isNewBest = false;
      this.waveTime = 0;
      this.demoMode = false;
      FX.reset();
      this.buildWave();
      this.setState(STATE.INTRO);
      AudioFX.waveStart();
      return true;
    }

    // --- per-player slots (2P alternate) ---
    savePlayerSlot(i) {
      if (!this.players || !this.players[i]) return;
      const s = this.players[i];
      s.score = this.score;
      s.lives = this.lives;
      s.waveNum = this.waveNum;
      s.humanChain = this.humanChain;
      s.totalRescued = this.totalRescued;
      s.rescued = this.rescued;
      s.nextExtraAt = this.nextExtraAt;
      s.extraAwarded = this.extraAwarded;
    }

    loadPlayerSlot(i) {
      const s = this.players[i];
      if (!s) return;
      this.activePlayer = i;
      this.score = s.score;
      this.lives = s.lives;
      this.waveNum = s.waveNum;
      this.humanChain = s.humanChain;
      this.totalRescued = s.totalRescued;
      this.rescued = s.rescued || 0;
      this.nextExtraAt = s.nextExtraAt;
      this.extraAwarded = s.extraAwarded || 0;
      this.isNewBest = this.score > 0 && this.score >= this.high;
    }

    otherPlayerAlive() {
      if (this.numPlayers !== 2 || !this.players) return false;
      const o = this.activePlayer === 0 ? 1 : 0;
      return this.players[o].lives > 0;
    }

    // --- credits ---
    addCredit() {
      this.credits = Math.min(99, this.credits + 1);
      try {
        localStorage.setItem(CRED_KEY, String(this.credits));
      } catch (_) {}
      AudioFX.coin();
    }

    // --- high-score table (10 entries, 3-letter initials) ---
    loadHiscores() {
      try {
        const raw = localStorage.getItem(HISTAB_KEY);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) return arr.filter((e) => e && typeof e.score === "number").slice(0, 10);
        }
      } catch (_) {}
      // migrate legacy single high
      const legacy = Number(localStorage.getItem(HS_KEY) || localStorage.getItem(HS_KEY_OLD) || 0);
      if (legacy > 0) return [{ name: "AAA", score: legacy, wave: 1 }];
      return [];
    }

    saveHiscores() {
      try {
        localStorage.setItem(HISTAB_KEY, JSON.stringify(this.hiscores.slice(0, 10)));
      } catch (_) {}
      if (this.hiscores.length && this.hiscores[0].score > this.high) {
        this.high = this.hiscores[0].score;
        try {
          localStorage.setItem(HS_KEY, String(this.high));
        } catch (_) {}
      }
    }

    qualifiesForHiscore(score) {
      if (!(score > 0)) return false;
      if (this.hiscores.length < 10) return true;
      return score > this.hiscores[this.hiscores.length - 1].score;
    }

    insertHiscore(name, score, wave) {
      this.hiscores.push({ name: (name || "AAA").toUpperCase().slice(0, 3), score, wave });
      this.hiscores.sort((a, b) => b.score - a.score);
      this.hiscores = this.hiscores.slice(0, 10);
      this.saveHiscores();
    }

    // --- Bozo early-wave mercy (waves 1-4, after 2+ deaths with ships left) ---
    bozoActive() {
      if (this.demoMode) return false;
      if (this.waveNum < 1 || this.waveNum > 4) return false;
      if (this.deaths < 2) return false;
      if (this.lives < 1) return false;
      return true;
    }

    bozoGruntFactor() {
      // ROM table: W1 ROBSPD 30 vs 20, W2 25 vs 15, W3 20 vs 15, W4 15 vs 15
      if (this.waveNum === 1) return 20 / 30;
      if (this.waveNum === 2) return 15 / 25;
      if (this.waveNum === 3) return 15 / 20;
      return 1;
    }

    bozoFireMul() {
      // ENSTIM bozo vs normal: W1 96/30, W2 96/28, W3 48/26, W4 30/24
      if (this.waveNum === 1) return 96 / 30;
      if (this.waveNum === 2) return 96 / 28;
      if (this.waveNum === 3) return 48 / 26;
      if (this.waveNum === 4) return 30 / 24;
      return 1;
    }

    difficultyMul() {
      try {
        return window.Input && window.Input.prefs && window.Input.prefs.difficulty === "easy" ? 0.8 : 1;
      } catch (_) {
        return 1;
      }
    }

    chainNext() {
      return [1000, 2000, 3000, 4000, 5000][this.humanChain % 5];
    }

    baseWaveNum(n) {
      const num = n === undefined ? this.waveNum : n;
      if (num <= UNIQUE_WAVES) return num;
      return LOOP_BASE + ((num - LOOP_BASE) % LOOP_LEN);
    }

    loopCycle(n) {
      const num = n === undefined ? this.waveNum : n;
      if (num <= UNIQUE_WAVES) return 0;
      return Math.floor((num - LOOP_BASE) / LOOP_LEN);
    }

    // Per-cycle intensity ramp for looped waves (41+): faster enemies,
    // faster hatch/fire timers, roomier spawner caps. Counts stay per table.
    scaledSpec(base, cycle) {
      if (cycle <= 0) return base;
      const speed = 1 + 0.05 * cycle;
      const rate = Math.max(0.5, 1 - 0.04 * cycle);
      const capBump = Math.min(6, Math.floor(cycle / 2));
      const s = { ...base };
      for (const k of ["gruntMul", "enforcerMul", "sparkMul", "brainMul", "missileMul", "tankMul", "shellMul"]) {
        if (s[k] !== undefined) s[k] = s[k] * speed;
      }
      for (const k of ["hatchFirst", "hatchNext", "fireMin", "fireMax", "tankFireMin", "tankFireMax"]) {
        if (s[k] !== undefined) s[k] = s[k] * rate;
      }
      if (s.fireMin !== undefined) s.fireMin = Math.max(0.16, s.fireMin);
      if (s.hatchNext !== undefined) s.hatchNext = Math.max(0.35, s.hatchNext);
      if (s.enforcerCap !== undefined) s.enforcerCap = s.enforcerCap + capBump;
      if (s.tankCap !== undefined) s.tankCap = s.tankCap + capBump;
      s.subtitle = base.subtitle + ` · CYCLE ${cycle + 1}`;
      return s;
    }

    waveSpec() {
      const cycle = this.loopCycle();
      if (cycle <= 0) return WAVES[this.waveNum] || WAVES[1];
      if (this._specNum === this.waveNum && this._specCache) return this._specCache;
      const base = WAVES[this.baseWaveNum()] || WAVES[1];
      this._specCache = this.scaledSpec(base, cycle);
      this._specNum = this.waveNum;
      return this._specCache;
    }

    waveSpecFor(n) {
      return this.scaledSpec(WAVES[this.baseWaveNum(n)] || WAVES[1], this.loopCycle(n));
    }

    hostilesLeft() {
      const n = (arr) => arr.filter((e) => e.alive).length;
      return n(this.grunts) + n(this.spheroids) + n(this.enforcers) + n(this.brains) + n(this.quarks) + n(this.tanks);
    }

    setState(s) {
      this.prevState = this.state;
      this.state = s;
      this.stateTime = 0;
    }

    buildWave() {
      const spec = this.waveSpec();
      const { x, y, w, h } = this.arena;
      const m = this.minDim;
      this.grunts = [];
      this.humans = [];
      this.hulks = [];
      this.spheroids = [];
      this.enforcers = [];
      this.sparks = [];
      this.brains = [];
      this.progs = [];
      this.missiles = [];
      this.quarks = [];
      this.tanks = [];
      this.shells = [];
      this.electrodes = [];
      this.bullets = [];
      this.fireCd = 0;
      this.rescued = 0;
      this.waveTime = 0;

      const cx = x + w * 0.5;
      const cy = y + h * 0.5;
      this.spawnPlayer(true);

      const placed = [{ x: cx, y: cy, r: m * 0.2 }];

      const place = (r, tries = 90) => {
        for (let i = 0; i < tries; i++) {
          const px = x + m * 0.08 + Math.random() * (w - m * 0.16);
          const py = y + m * 0.08 + Math.random() * (h - m * 0.16);
          let ok = true;
          for (const p of placed) {
            if (Math.hypot(px - p.x, py - p.y) < p.r + r) {
              ok = false;
              break;
            }
          }
          if (ok) {
            placed.push({ x: px, y: py, r });
            return [px, py];
          }
        }
        return [x + rand(0.12, 0.88) * w, y + rand(0.12, 0.88) * h];
      };

      for (let i = 0; i < spec.grunts; i++) {
        const [gx, gy] = place(m * 0.05);
        this.grunts.push({
          x: gx,
          y: gy,
          vx: 0,
          vy: 0,
          r: m * 0.026,
          face: "s",
          anim: Math.random() * 4,
          spawn: 0,
          phase: Math.random() * 6,
          alive: true,
        });
      }

      for (let i = 0; i < spec.mommy; i++) this.humans.push(this.makeHuman("mommy", ...place(m * 0.048)));
      for (let i = 0; i < spec.daddy; i++) this.humans.push(this.makeHuman("daddy", ...place(m * 0.048)));
      for (let i = 0; i < spec.mikey; i++) this.humans.push(this.makeHuman("mikey", ...place(m * 0.04)));

      for (let i = 0; i < spec.hulks; i++) {
        const [hx, hy] = place(m * 0.07);
        const a = Math.random() * Math.PI * 2;
        this.hulks.push({
          x: hx,
          y: hy,
          vx: Math.cos(a),
          vy: Math.sin(a),
          r: m * 0.038,
          face: "s",
          anim: Math.random() * 4,
          think: rand(0.4, 1.1),
          spawn: 0,
          flash: 0,
          alive: true,
        });
      }

      for (let i = 0; i < (spec.brains || 0); i++) {
        const [bx, by] = place(m * 0.055);
        this.brains.push({
          x: bx,
          y: by,
          vx: 0,
          vy: 0,
          r: m * 0.028,
          face: "s",
          anim: Math.random() * 4,
          think: rand(0.3, 0.9),
          fire: rand(2.2, 4.4),
          converting: null,
          spawn: 0,
          alive: true,
        });
      }

      for (let i = 0; i < spec.spheroids; i++) {
        const [sx, sy] = place(m * 0.06);
        const a = rand(0.3, Math.PI * 2);
        this.spheroids.push({
          x: sx,
          y: sy,
          vx: Math.cos(a),
          vy: Math.sin(a),
          r: m * 0.028,
          hatch: rand(spec.hatchFirst * 0.7, spec.hatchFirst * 1.15),
          quota: Math.floor(rand(spec.quotaMin, spec.quotaMax + 0.99)),
          hatched: 0,
          spawn: 0,
          phase: Math.random() * 6,
          pulse: 0,
          alive: true,
        });
      }

      for (let i = 0; i < (spec.quarks || 0); i++) {
        const [qx, qy] = place(m * 0.06);
        const a = rand(0.2, Math.PI * 2);
        this.quarks.push({
          x: qx,
          y: qy,
          vx: Math.cos(a),
          vy: Math.sin(a),
          r: m * 0.03,
          hatch: rand(spec.hatchFirst * 0.75, spec.hatchFirst * 1.2),
          quota: Math.floor(rand(spec.quotaMin, spec.quotaMax + 0.99)),
          hatched: 0,
          spawn: 0,
          phase: Math.random() * 6,
          pulse: 0,
          alive: true,
        });
      }

      const eR = spec.electrodes > 18 ? m * 0.022 : m * 0.028;
      for (let i = 0; i < spec.electrodes; i++) {
        const [ex, ey] = place(eR * 1.6);
        this.electrodes.push({
          x: ex,
          y: ey,
          r: eR,
          phase: Math.random() * 6,
          hue: spec.electrodeHue + Math.random() * 18,
          style: spec.electrodeStyle,
          spawn: 0,
          alive: true,
        });
      }
      // distinct materialize voices (arcade SPHEROID/QUARK spawn)
      try {
        if (spec.spheroids > 0 && !this.demoMode) AudioFX.spheroidSpawn(0);
        if ((spec.quarks || 0) > 0 && !this.demoMode) AudioFX.quarkSpawn(0);
      } catch (_) {}
    }

    makeHuman(kind, x, y) {
      const dir = Math.random() * Math.PI * 2;
      return {
        kind,
        x,
        y,
        vx: Math.cos(dir),
        vy: Math.sin(dir),
        r: this.minDim * 0.02,
        face: facingFrom(Math.cos(dir), Math.sin(dir)),
        anim: Math.random() * 3,
        think: rand(0.35, 1.1),
        spawn: 0,
        converting: false,
        convertT: 0,
        claimed: false,
        alive: true,
      };
    }

    findSafeSpawn() {
      const { x, y, w, h } = this.arena;
      const threats = [];
      for (const a of [this.grunts, this.hulks, this.brains, this.enforcers, this.tanks, this.progs]) {
        for (const e of a) if (e.alive) threats.push(e);
      }
      let best = { x: x + w * 0.5, y: y + h * 0.5 };
      let bestScore = -Infinity;
      const cands = [{ x: best.x, y: best.y }];
      for (let i = 0; i < 14; i++) {
        cands.push({ x: x + w * (0.15 + Math.random() * 0.7), y: y + h * (0.15 + Math.random() * 0.7) });
      }
      for (const c of cands) {
        let minD = Infinity;
        for (const t of threats) {
          const d = Math.hypot(c.x - t.x, c.y - t.y);
          if (d < minD) minD = d;
        }
        if (threats.length === 0) minD = 9999;
        // prefer near-center but safe: balance distance + centrality
        const centerD = Math.hypot(c.x - best.x, c.y - best.y);
        const score = minD - centerD * 0.35;
        if (score > bestScore) {
          bestScore = score;
          best = c;
        }
      }
      return best;
    }

    spawnPlayer(center) {
      // Arcade-authentic: exact center. Easy mode (or arcadeSpawn OFF) keeps
      // the friendlier safe-spawn search.
      const prefs = (window.Input && window.Input.prefs) || {};
      const wantSafe = !prefs.arcadeSpawn || this.difficultyMul() < 1;
      const pos =
        center && wantSafe && this.hostilesLeft && (this.grunts.length || this.hulks.length)
          ? this.findSafeSpawn()
          : { x: this.arena.x + this.arena.w * 0.5, y: this.arena.y + this.arena.h * 0.5 };
      const easy = this.difficultyMul() < 1 ? 0.6 : 0;
      this.player = {
        x: pos.x,
        y: pos.y,
        vx: 0,
        vy: 0,
        r: this.minDim * 0.022,
        face: "s",
        aimX: Input.lastAimX || 0,
        aimY: Input.lastAimY || -1,
        anim: 0,
        invuln: 2.05 + easy,
        alive: true,
        spawn: 1,
        dashCd: 0,
        dashT: 0,
        dashDX: 0,
        dashDY: -1,
      };
      // keep materialize effect on wave build, instant-ish on respawn handled by caller
      if (center && this.stateTime < 0.1 && this.waveTime === 0) this.player.spawn = 0;
    }

    addScore(n, x, y, label) {
      this.score += n;
      if (this.demoMode) {
        if (label) FX.scorePop(x, y - 24, label);
        return;
      }
      if (this.score > this.high) {
        this.high = this.score;
        try {
          localStorage.setItem(HS_KEY, String(this.high));
        } catch (_) {}
        if (!this.isNewBest && this.score > 0) {
          this.isNewBest = true;
          FX.scorePop(this.viewW / 2, this.arena.y + 60, "NEW BEST!", "#ffe56a");
          AudioFX.extraLife();
        }
      }
      // operator repeat: every extraLifeEvery (0 = OFF), not once
      const every = (window.Input && window.Input.prefs && window.Input.prefs.extraLifeEvery) || 0;
      if (every > 0) {
        if (!this.nextExtraAt || this.nextExtraAt <= 0) this.nextExtraAt = every;
        while (this.score >= this.nextExtraAt) {
          this.extraAwarded = (this.extraAwarded || 0) + 1;
          this.lives += 1;
          if (this.numPlayers === 2 && this.players) this.savePlayerSlot(this.activePlayer);
          AudioFX.extraLife();
          if (this.player) FX.scorePop(this.player.x, this.player.y - 70, "EXTRA LIFE", "#7ef6ff");
          this.nextExtraAt += every;
        }
      }
      if (label) FX.scorePop(x, y - 24, label);
    }

    update(dt) {
      this.time += dt;
      this.stateTime += dt;
      this.titlePulse += dt;
      Input.update();

      if (this.state === STATE.TITLE) {
        this.titleIdle += dt;
        if (Input.consumeCoin()) this.addCredit();
        if (Input.consumeOperator()) {
          this.operatorRow = 0;
          this.setState(STATE.OPERATOR);
          AudioFX.ui();
          return;
        }
        // 2P takes priority over 1P (Digit2 / pad Y)
        if (Input.consume2P()) {
          AudioFX.resume();
          if (this.startGame(2)) return;
        }
        if (Input.consumeStart() || Input.consume1P()) {
          AudioFX.resume();
          if (this.startGame(1)) return;
        }
        // click during title = 1P start (consumeStart already covers _clickStart,
        // but clear the latch so it doesn't leak into play)
        Input._clickStart = false;
        Input.startLatch = false;
        if (this.titleIdle > 12) {
          this.startAttract();
          return;
        }
        return;
      }

      if (this.state === STATE.ATTRACT) {
        if (Input.consumeCoin()) this.addCredit();
        const want2P = Input.twoPEdge;
        if (want2P) {
          Input.consume2P();
          Input._clickStart = false;
          Input.startLatch = false;
          Input.startEdge = false;
          Input.onePEdge = false;
          this.stopAttract();
          AudioFX.resume();
          AudioFX.ui();
          this.startGame(2);
          return;
        }
        if (Input.consumeStart() || Input.consume1P() || Input._clickStart) {
          Input._clickStart = false;
          Input.startLatch = false;
          this.stopAttract();
          AudioFX.resume();
          AudioFX.ui();
          this.startGame(1);
          return;
        }
        Input._clickStart = false;
        Input.startLatch = false;
        if (Input.consumeOperator()) {
          this.stopAttract();
          this.operatorRow = 0;
          this.setState(STATE.OPERATOR);
          return;
        }
        this.updateAttract(dt);
        FX.update(dt);
        return;
      }

      if (this.state === STATE.OPERATOR) {
        this.updateOperator();
        return;
      }

      if (this.state === STATE.ENTRY) {
        this.updateEntry();
        FX.update(dt);
        return;
      }

      if (this.state === STATE.PAUSE) {
        if (Input.consumeOperator()) {
          this.operatorRow = 0;
          this.pausedFromOperator = this.pausedFrom;
          this.setState(STATE.OPERATOR);
          return;
        }
        if (Input.consumePause() || Input.consumeStart()) {
          this.setState(this.pausedFrom);
        }
        return;
      }

      if (this.state === STATE.CLEAR || this.state === STATE.OVER) {
        if (Input.consumeCoin()) this.addCredit();
        if (Input.consumeOperator()) {
          this.operatorRow = 0;
          this.setState(STATE.OPERATOR);
          return;
        }
        if (Input.consumeStart() || Input.consume1P() || Input.consume2P()) {
          AudioFX.ui();
          this.setState(STATE.TITLE);
          this.titleIdle = 0;
        } else if (this.stateTime > 12) {
          // arcade: game-over card holds briefly, then back to title/attract
          this.setState(STATE.TITLE);
          this.titleIdle = 0;
        }
        FX.update(dt);
        return;
      }

      if (this.state === STATE.TRANS) {
        this.updateTrans(dt);
        FX.update(dt);
        return;
      }

      if (Input.consumePause() && (this.state === STATE.PLAY || this.state === STATE.INTRO)) {
        this.pausedFrom = this.state;
        this.setState(STATE.PAUSE);
        return;
      }

      if (FX.hitstop > 0) {
        FX.update(dt);
        return;
      }

      if (this.state === STATE.INTRO) {
        this.updateIntro(dt);
        // Wave 1 teaches: give time to read the how-to card
        const need = this.waveNum === 1 ? 4.2 : 1.35;
        if (this.stateTime >= need) this.setState(STATE.PLAY);
      } else if (this.state === STATE.PLAY) {
        this.waveTime += dt;
        this.updatePlay(dt);
      } else if (this.state === STATE.DEAD) {
        this.updateDead(dt);
      }

      FX.update(dt);
    }

    updateIntro(dt) {
      this.updateSpawns(dt);
      const p = this.player;
      if (p) p.spawn = Math.min(1, p.spawn + dt * 1.6);
    }

    updateSpawns(dt) {
      for (const g of this.grunts) g.spawn = Math.min(1, g.spawn + dt * 1.35);
      for (const h of this.humans) h.spawn = Math.min(1, h.spawn + dt * 1.2);
      for (const e of this.electrodes) e.spawn = Math.min(1, e.spawn + dt * 1.5);
      for (const h of this.hulks) h.spawn = Math.min(1, h.spawn + dt * 1.1);
      for (const s of this.spheroids) s.spawn = Math.min(1, s.spawn + dt * 1.4);
      for (const e of this.enforcers) e.spawn = Math.min(1, e.spawn + dt * 2.2);
      for (const b of this.brains) b.spawn = Math.min(1, b.spawn + dt * 1.15);
      for (const p of this.progs) p.spawn = Math.min(1, p.spawn + dt * 2);
      for (const q of this.quarks) q.spawn = Math.min(1, q.spawn + dt * 1.3);
      for (const t of this.tanks) t.spawn = Math.min(1, t.spawn + dt * 1.8);
    }

    updateTrans(dt) {
      const t = this.stateTime;
      const { x, y, w, h } = this.arena;
      const cx = x + w * 0.5;
      const cy = y + h * 0.5;
      if (t > 0.18 && this.transBeat < 1) {
        this.transBeat = 1;
        FX.ring(cx, cy, "#7ef6ff", 0.7);
        FX.ring(cx, cy, "#ffe56a", 0.55);
        FX.addShake(6);
      }
      if (t > 0.55 && this.transBeat < 2) {
        this.transBeat = 2;
        for (const e of this.electrodes) {
          if (!e.alive) continue;
          FX.burst(e.x, e.y, `hsl(${e.hue},100%,65%)`, 14, 240, 2.6, 0.4);
        }
      }
      if (t > 1.65 && this.transBeat < 3) {
        this.transBeat = 3;
        AudioFX.waveFanfare();
        FX.addFlash(0.4, "rgba(255,80,220,0.18)");
        FX.addShake(8);
        FX.ring(cx, cy, "#ff2bd6", 0.65);
      }
      if (t > 2.35 && this.transBeat < 4) {
        this.transBeat = 4;
        FX.burst(cx, cy, "#7ef6ff", 40, 420, 3.4, 0.55);
        FX.burst(cx, cy, "#ffe56a", 24, 300, 2.8, 0.45);
      }
      if (t >= 3.35) {
        if (this.demoMode) {
          this.waveNum = this.waveNum >= 3 ? 1 : this.waveNum + 1;
          this.buildWave();
          this.player.invuln = 9999;
          this.setState(STATE.PLAY);
          return;
        }
        this.waveNum += 1;
        if (this.waveNum > MAX_WAVE) this.waveNum = 1;
        if (this.numPlayers === 2 && this.players) this.savePlayerSlot(this.activePlayer);
        // ^ wave progress is per-player; saved so turn-switch restores correctly
        this.buildWave();
        this.setState(STATE.INTRO);
        AudioFX.waveStart();
      }
    }

    beginTransition() {
      AudioFX.setTension(0);
      AudioFX.waveClear();
      FX.addFlash(0.7, "rgba(180,255,255,0.35)");
      FX.addShake(14);
      const { x, y, w, h } = this.arena;
      const cx = x + w * 0.5;
      const cy = y + h * 0.5;
      FX.ring(cx, cy, "#ffffff", 0.55);
      FX.ring(cx, cy, "#7ef6ff", 0.8);
      FX.burst(cx, cy, "#7ef6ff", 48, 520, 4, 0.7);
      FX.burst(cx, cy, "#ffe56a", 28, 380, 3.2, 0.55);
      FX.burst(cx, cy, "#ff2bd6", 18, 280, 2.8, 0.5);
      this.bullets = [];
      this.sparks = [];
      this.missiles = [];
      this.shells = [];
      this.transBeat = 0;
      this.setState(STATE.TRANS);
    }

    updatePlay(dt) {
      Input.startLatch = false;
      // clicks during play are sticky-aim toggles, not start requests
      Input._clickStart = false;
      this.updateSpawns(dt);
      this.updatePlayer(dt);
      this.updateHumans(dt);
      this.updateGrunts(dt);
      this.updateHulks(dt);
      this.updateSpheroids(dt);
      this.updateEnforcers(dt);
      this.updateBrains(dt);
      this.updateProgs(dt);
      this.updateMissiles(dt);
      this.updateQuarks(dt);
      this.updateTanks(dt);
      this.updateShells(dt);
      this.updateBullets(dt);
      this.updateSparks(dt);
      this.collide();

      const live = this.hostilesLeft();
      const spec = this.waveSpec();
      const denom = Math.max(1, spec.grunts + (spec.quarks || 0) + spec.spheroids + (spec.brains || 0));
      AudioFX.setTension(clamp(this.waveTime / 38, 0, 1) * 0.55 + (1 - live / denom) * 0.2);
      if (live === 0) {
        this.beginTransition();
      }
    }

    updateDead(dt) {
      this.updateHumans(dt * 0.35);
      this.updateGrunts(dt * 0.15);
      this.updateHulks(dt * 0.2);
      this.updateSpheroids(dt * 0.2);
      this.updateEnforcers(dt * 0.15);
      this.updateBrains(dt * 0.2);
      this.updateProgs(dt * 0.2);
      this.updateMissiles(dt);
      this.updateQuarks(dt * 0.25);
      this.updateTanks(dt * 0.2);
      this.updateShells(dt);
      this.updateSparks(dt);
      if (this.stateTime > 1.55) {
        if (this.demoMode) {
          // attract demo: endless lives, rebuild same wave
          this.spawnPlayer(true);
          this.player.spawn = 0;
          this.setState(STATE.PLAY);
          return;
        }
        if (this.numPlayers === 2 && this.players) {
          this.savePlayerSlot(this.activePlayer);
          const other = this.activePlayer === 0 ? 1 : 0;
          if (this.players[other].lives > 0 && this.lives <= 0) {
            // current player eliminated — pass turn, keep their wave for return
          }
          if (this.players[other].lives > 0) {
            // alternate turn on every death (Williams rule)
            this.loadPlayerSlot(other);
            this.buildWave();
            this.setState(STATE.INTRO);
            AudioFX.spawn();
            return;
          }
          // other also dead — fall through to game over if current dead too
          this.loadPlayerSlot(this.activePlayer); // restore current for gameOver scores
          if (this.lives > 0) {
            this.spawnPlayer(true);
            this.player.spawn = 0;
            AudioFX.spawn();
            this.setState(STATE.PLAY);
          } else {
            this.gameOver();
          }
          return;
        }
        if (this.lives > 0) {
          this.spawnPlayer(true);
          this.player.spawn = 0;
          AudioFX.spawn();
          this.setState(STATE.PLAY);
        } else {
          this.gameOver();
        }
      }
    }

    gameOver() {
      AudioFX.setTension(0);
      // build hiscore entry queue (1P: one slot, 2P: each qualifying player)
      this.entryQueue = [];
      if (this.numPlayers === 2 && this.players) {
        this.savePlayerSlot(this.activePlayer);
        for (let i = 0; i < 2; i++) {
          const s = this.players[i];
          if (this.qualifiesForHiscore(s.score)) {
            this.entryQueue.push({ score: s.score, wave: s.waveNum, player: i });
          }
        }
        // highest first so table order feels natural
        this.entryQueue.sort((a, b) => b.score - a.score);
      } else {
        if (this.qualifiesForHiscore(this.score)) {
          this.entryQueue.push({ score: this.score, wave: this.waveNum, player: 0 });
        }
      }
      if (this.entryQueue.length) {
        const first = this.entryQueue.shift();
        this.entryScore = first.score;
        this.entryWave = first.wave;
        this.entryPlayerIdx = first.player;
        this.entryInitials = ["A", "A", "A"];
        this.entryPos = 0;
        this.setState(STATE.ENTRY);
        AudioFX.hiscore();
      } else {
        this.setState(STATE.OVER);
      }
    }

    // --- attract demo (CPU plays wave 1-3 loop, no score pollution) ---
    startAttract() {
      this.attractDemo = {
        score: this.score,
        lives: this.lives,
        waveNum: this.waveNum,
        humanChain: this.humanChain,
        totalRescued: this.totalRescued,
        numPlayers: this.numPlayers,
        players: this.players,
      };
      this.demoMode = true;
      this.numPlayers = 1;
      this.players = null;
      this.score = 0;
      this.lives = 3;
      this.humanChain = 0;
      this.totalRescued = 0;
      this.waveNum = 1;
      this.nextExtraAt = 0;
      this.extraAwarded = 0;
      this.isNewBest = false;
      FX.reset();
      this.buildWave();
      this.setState(STATE.ATTRACT);
      // ATTRACT behaves like PLAY once built; give it a live player
      this.player.invuln = 9999; // demo never dies visibly — respawns instantly
    }

    stopAttract() {
      if (this.attractDemo) {
        this.score = this.attractDemo.score;
        this.lives = this.attractDemo.lives;
        this.waveNum = this.attractDemo.waveNum;
        this.humanChain = this.attractDemo.humanChain;
        this.totalRescued = this.attractDemo.totalRescued;
        this.numPlayers = this.attractDemo.numPlayers;
        this.players = this.attractDemo.players;
      }
      this.attractDemo = null;
      this.demoMode = false;
      this.titleIdle = 0;
      this.setState(STATE.TITLE);
      FX.reset();
    }

    updateAttract(dt) {
      // simple CPU: drift toward nearest human, shoot at nearest hostile
      const p = this.player;
      if (!p || !p.alive) {
        this.waveTime += dt;
        this.updateSpawns(dt);
        if (this.stateTime > 1.2) {
          this.spawnPlayer(true);
          this.player.invuln = 9999;
        }
        return;
      }
      // pick rescue target
      let hx = null,
        hy = null,
        best = Infinity;
      for (const h of this.humans) {
        if (!h.alive || h.converting) continue;
        const d = Math.hypot(h.x - p.x, h.y - p.y);
        if (d < best) {
          best = d;
          hx = h.x;
          hy = h.y;
        }
      }
      // pick shoot target
      let tx = null,
        ty = null;
      let bestE = Infinity;
      const foes = [...this.grunts, ...this.enforcers, ...this.brains, ...this.tanks, ...this.spheroids, ...this.quarks, ...this.progs];
      for (const e of foes) {
        if (!e.alive) continue;
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d < bestE) {
          bestE = d;
          tx = e.x;
          ty = e.y;
        }
      }
      // drive synthetic input via direct player steering (don't touch real Input)
      // seek nearest human, flee close grunts, always keep moving + firing
      const m = this.minDim;
      let mx = 0,
        my = 0;
      if (hx != null) {
        const [nx, ny] = norm(hx - p.x, hy - p.y);
        mx += nx;
        my += ny;
      }
      // flee nearest grunts blended in so demo never parks inside the mob
      for (const gr of this.grunts) {
        if (!gr.alive) continue;
        const dx = p.x - gr.x;
        const dy = p.y - gr.y;
        const d = Math.hypot(dx, dy);
        const fleeR = m * 0.3;
        if (d > 1 && d < fleeR) {
          const wgt = (1 - d / fleeR) * 2.2;
          mx += (dx / d) * wgt;
          my += (dy / d) * wgt;
        }
      }
      // wander so it never stalls once humans are gone
      mx += Math.cos(this.time * 1.7) * 0.45;
      my += Math.sin(this.time * 2.3) * 0.45;
      // gentle centering when pushed to a wall
      const { x: ax, y: ay, w: aw, h: ah } = this.arena;
      const cx = ax + aw * 0.5;
      const cyy = ay + ah * 0.5;
      mx += ((cx - p.x) / aw) * 0.8;
      my += ((cyy - p.y) / ah) * 0.8;
      {
        const [nx, ny] = norm(mx, my);
        if (Math.hypot(nx, ny) > 0.01) {
          p.x += nx * m * 0.45 * dt;
          p.y += ny * m * 0.45 * dt;
          this.clampEntity(p);
          p.face = facingFrom(nx, ny);
          p.anim += dt * 8;
        }
      }
      if (tx != null) {
        const [nx, ny] = norm(tx - p.x, ty - p.y);
        p.aimX = nx;
        p.aimY = ny;
        this.fireCd -= dt;
        if (this.fireCd <= 0 && this.bullets.length < 8) {
          this.fireCd = 0.12;
          this.bullets.push({ x: p.x + nx * m * 0.045, y: p.y - m * 0.045 + ny * m * 0.045, vx: nx * m * 1.4, vy: ny * m * 1.4, r: m * 0.011, life: 1.1, trail: [] });
        }
      }
      p.spawn = Math.min(1, p.spawn + dt * 2);
      this.waveTime += dt;
      this.updateSpawns(dt);
      this.updateHumans(dt);
      this.updateGrunts(dt);
      this.updateHulks(dt);
      this.updateSpheroids(dt);
      this.updateEnforcers(dt);
      this.updateBrains(dt);
      this.updateProgs(dt);
      this.updateMissiles(dt);
      this.updateQuarks(dt);
      this.updateTanks(dt);
      this.updateShells(dt);
      this.updateBullets(dt);
      this.updateSparks(dt);
      // bullets vs enemies + rescue via shared collide(); player death is
      // skipped inside collide() while demo invuln holds, so no state change.
      this.collide();
      // demo never takes damage (invuln); cycle waves 1-3
      if (this.hostilesLeft() === 0) {
        this.waveNum = this.waveNum >= 3 ? 1 : this.waveNum + 1;
        this.buildWave();
        this.player.invuln = 9999;
      }
      if (this.stateTime > 25) {
        // arcade cycle: demo -> title/high-scores -> demo ...
        this.stopAttract();
      }
    }

    // --- operator menu ---
    updateOperator() {
      const prefs = (window.Input && window.Input.prefs) || {};
      const rows = ["extraLifeEvery", "startLives", "freePlay", "arcadeSpawn"];
      if (Input.consumeMenu("up")) {
        this.operatorRow = (this.operatorRow + rows.length - 1) % rows.length;
        AudioFX.tick(0);
      }
      if (Input.consumeMenu("down")) {
        this.operatorRow = (this.operatorRow + 1) % rows.length;
        AudioFX.tick(0);
      }
      const row = rows[this.operatorRow];
      const cycle = (dir) => {
        if (row === "extraLifeEvery") {
          const opts = [20000, 25000, 30000, 50000, 0];
          let i = opts.indexOf(prefs.extraLifeEvery);
          if (i < 0) i = 1;
          i = (i + dir + opts.length) % opts.length;
          prefs.extraLifeEvery = opts[i];
        } else if (row === "startLives") {
          prefs.startLives = prefs.startLives === 3 ? 5 : 3;
        } else if (row === "freePlay") {
          prefs.freePlay = !prefs.freePlay;
        } else if (row === "arcadeSpawn") {
          prefs.arcadeSpawn = !prefs.arcadeSpawn;
        }
        try {
          localStorage.setItem("robotron2084_prefs_v1", JSON.stringify(prefs));
        } catch (_) {}
        AudioFX.ui();
      };
      if (Input.consumeMenu("left")) cycle(-1);
      if (Input.consumeMenu("right")) cycle(1);
      // H clears hiscores, C adds credit for testing
      if (window.Input.keys && window.Input.keys.KeyH) {
        window.Input.keys.KeyH = false;
        this.hiscores = [];
        this.saveHiscores();
        AudioFX.ui();
      }
      if (Input.consumeCoin()) this.addCredit();
      if (Input.consumeOperator() || Input.consumePause() || Input.consumeStart()) {
        AudioFX.ui();
        if (this.pausedFromOperator) {
          const dst = this.pausedFromOperator;
          this.pausedFromOperator = null;
          this.setState(STATE.PAUSE);
          this.pausedFrom = dst;
        } else {
          this.setState(STATE.TITLE);
          this.titleIdle = 0;
        }
      }
    }

    // --- hiscore initials entry ---
    updateEntry() {
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!?.-";
      // up/down cycle current slot, left/right move
      if (Input.consumeMenu("up")) {
        const i = letters.indexOf(this.entryInitials[this.entryPos]);
        this.entryInitials[this.entryPos] = letters[(i + 1 + letters.length) % letters.length];
        AudioFX.tick(0);
      }
      if (Input.consumeMenu("down")) {
        const i = letters.indexOf(this.entryInitials[this.entryPos]);
        this.entryInitials[this.entryPos] = letters[(i - 1 + letters.length) % letters.length];
        AudioFX.tick(0);
      }
      if (Input.consumeMenu("left")) {
        this.entryPos = (this.entryPos + 2) % 3;
        AudioFX.tick(0);
      }
      if (Input.consumeMenu("right")) {
        this.entryPos = (this.entryPos + 1) % 3;
        AudioFX.tick(0);
      }
      // typing A-Z directly also works (WASD reserved for menu nav — cycle to get those)
      for (const code of Object.keys(Input.keys)) {
        if (!Input.keys[code]) continue;
        if (/^Key[A-Z]$/.test(code)) {
          if (code === "KeyW" || code === "KeyA" || code === "KeyS" || code === "KeyD") continue;
          this.entryInitials[this.entryPos] = code.slice(3);
          this.entryPos = Math.min(2, this.entryPos + 1);
          Input.keys[code] = false;
          AudioFX.tick(0);
        }
      }
      if (Input.consumeStart()) {
        const name = this.entryInitials.join("");
        this.insertHiscore(name, this.entryScore, this.entryWave);
        AudioFX.waveClear();
        if (this.entryQueue.length) {
          const nxt = this.entryQueue.shift();
          this.entryScore = nxt.score;
          this.entryWave = nxt.wave;
          this.entryPlayerIdx = nxt.player;
          this.entryInitials = ["A", "A", "A"];
          this.entryPos = 0;
          AudioFX.hiscore();
        } else {
          this.setState(STATE.OVER);
        }
      }
    }

    updatePlayer(dt) {
      const p = this.player;
      if (!p || !p.alive) return;
      p.spawn = Math.min(1, p.spawn + dt * 2);
      p.invuln = Math.max(0, p.invuln - dt);

      const m = this.minDim;
      const speed = m * 0.64;
      const ix = Input.moveX;
      const iy = Input.moveY;
      // dash: 0.18s burst at 2.3x + i-frames, 2.5s cooldown. Direction falls
      // back from move stick to aim to current velocity so it never whiffs.
      p.dashCd = Math.max(0, (p.dashCd || 0) - dt);
      p.dashT = Math.max(0, (p.dashT || 0) - dt);
      if (Input.consumeDash() && p.dashCd <= 0) {
        let dx = ix;
        let dy = iy;
        if (Math.hypot(dx, dy) < 0.15) {
          dx = p.aimX;
          dy = p.aimY;
        }
        if (Math.hypot(dx, dy) < 0.15) {
          dx = p.vx;
          dy = p.vy;
        }
        const [ddx, ddy] = norm(dx, dy);
        if (Math.hypot(ddx, ddy) > 0.01) {
          p.dashDX = ddx;
          p.dashDY = ddy;
          p.dashT = 0.18;
          p.dashCd = 2.5;
          p.invuln = Math.max(p.invuln, 0.28);
          p.face = facingFrom(ddx, ddy);
          const pan = ((p.x - this.arena.x) / this.arena.w) * 2 - 1;
          AudioFX.dash(pan);
          Input.rumble(60, 0.25, 0.5);
          FX.ring(p.x, p.y, "#7ef6ff", 0.3);
          FX.burst(p.x, p.y, "#7ef6ff", 14, 320, 2.6, 0.3);
          FX.light(p.x, p.y, "rgba(126,246,255,0.9)", m * 0.14, 0.25);
        }
      }
      if (p.dashT > 0) {
        const dspeed = speed * 2.3;
        p.vx = p.dashDX * dspeed;
        p.vy = p.dashDY * dspeed;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        FX.burst(p.x, p.y, "#7ef6ff", 2, 120, 2.4, 0.25);
      } else {
        p.vx = ix * speed;
        p.vy = iy * speed;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      this.clampEntity(p);

      let ax = Input.shootX;
      let ay = Input.shootY;
      if (Input.mouseAim || Input.stickyAim) {
        if (Input.mouseSeen) {
          const [wx, wy] = this.screenToWorld(Input.mouseX, Input.mouseY);
          const [nx, ny] = norm(wx - p.x, wy - p.y);
          if (Math.hypot(nx, ny) > 0.01) {
            ax = nx;
            ay = ny;
          }
        }
      }
      if (Math.hypot(ax, ay) > 0.2) {
        p.aimX = ax;
        p.aimY = ay;
        p.face = facingFrom(ax, ay);
      } else if (Math.hypot(ix, iy) > 0.15) {
        p.face = facingFrom(ix, iy);
      }

      const moving = Math.hypot(ix, iy) > 0.12 || p.dashT > 0;
      p.anim += dt * (moving ? 8.5 : 0);

      this.fireCd -= dt;
      const hasAim = Math.hypot(ax, ay) > 0.22;
      const wantFire = hasAim || (Input.prefs?.autofire && Math.hypot(p.aimX, p.aimY) > 0.2);
      const dirX = hasAim ? ax : p.aimX;
      const dirY = hasAim ? ay : p.aimY;
      if (wantFire && this.fireCd <= 0 && this.bullets.length < 8) {
        this.fireCd = 0.055;
        const [nx, ny] = norm(dirX, dirY);
        const muzzle = m * 0.045;
        const mx = p.x + nx * muzzle;
        const my = p.y - m * 0.045 + ny * muzzle;
        this.bullets.push({
          x: mx,
          y: my,
          vx: nx * m * 1.4,
          vy: ny * m * 1.4,
          r: m * 0.011,
          life: 1.1,
          trail: [],
        });
        const pan = ((p.x - this.arena.x) / this.arena.w) * 2 - 1;
        AudioFX.shot(pan);
        Input.rumble(18, 0.08, 0.18);
        FX.burst(mx, my, "#9ffff6", 4, 180, 2.1, 0.15);
        FX.light(mx, my, "rgba(126,246,255,0.9)", m * 0.09, 0.14);
      }
    }

    screenToWorld(sx, sy) {
      return [sx, sy];
    }

    clampEntity(e) {
      const { x, y, w, h } = this.arena;
      const pad = 14;
      const head = this.minDim * 0.1;
      e.x = clamp(e.x, x + pad + e.r, x + w - pad - e.r);
      e.y = clamp(e.y, y + pad + e.r + head, y + h - pad - e.r);
    }

    updateHumans(dt) {
      const speed = this.minDim * 0.13;
      const m = this.minDim;
      for (const h of this.humans) {
        if (!h.alive) continue;
        if (h.converting) {
          h.convertT -= dt;
          h.anim += dt * 14;
          continue;
        }
        h.think -= dt;
        if (h.think <= 0) {
          const a = Math.random() * Math.PI * 2;
          h.vx = Math.cos(a);
          h.vy = Math.sin(a);
          h.think = rand(0.4, 1.25);
        }
        // flee nearest Hulk a little — fewer cheap unavoidable deaths
        let fx = 0;
        let fy = 0;
        for (const k of this.hulks) {
          if (!k.alive) continue;
          const dx = h.x - k.x;
          const dy = h.y - k.y;
          const d = Math.hypot(dx, dy);
          if (d > 0 && d < m * 0.22) {
            const wgt = 1 - d / (m * 0.22);
            fx += (dx / d) * wgt * 1.4;
            fy += (dy / d) * wgt * 1.4;
          }
        }
        // gentle magnet toward player when close — rescue feels fair at speed
        if (this.player && this.player.alive) {
          const dx = this.player.x - h.x;
          const dy = this.player.y - h.y;
          const d = Math.hypot(dx, dy);
          if (d > 1 && d < m * 0.12) {
            fx += (dx / d) * 0.9;
            fy += (dy / d) * 0.9;
          }
        }
        const mx = h.vx + fx;
        const my = h.vy + fy;
        const [ux, uy] = norm(mx, my);
        h.x += ux * speed * dt;
        h.y += uy * speed * dt;
        const { x, y, w, ht } = {
          x: this.arena.x,
          y: this.arena.y,
          w: this.arena.w,
          ht: this.arena.h,
        };
        if (h.x < x + 16) {
          h.x = x + 16;
          h.vx *= -1;
        }
        if (h.x > x + w - 16) {
          h.x = x + w - 16;
          h.vx *= -1;
        }
        if (h.y < y + 16 + this.minDim * 0.1) {
          h.y = y + 16 + this.minDim * 0.1;
          h.vy *= -1;
        }
        if (h.y > y + ht - 16) {
          h.y = y + ht - 16;
          h.vy *= -1;
        }
        h.face = facingFrom(ux, uy);
        h.anim += dt * 7;
      }
    }

    updateGrunts(dt) {
      const p = this.player;
      const t = this.waveTime;
      let mul = (this.waveSpec().gruntMul || 1) * this.difficultyMul();
      if (this.bozoActive()) mul *= this.bozoGruntFactor();
      const base = this.minDim * (0.115 + Math.min(0.42, t * 0.011)) * mul;
      const live = this.grunts.filter((g) => g.alive);
      // arcade GRUNT footstep tick — throttled game-side, panned to mob center
      if (live.length && p && p.alive && this.state === STATE.PLAY && !this.demoMode) {
        this._stepT = (this._stepT || 0) - dt;
        if (this._stepT <= 0) {
          this._stepT = 0.34;
          let sx = 0,
            sy = 0;
          for (const g of live) {
            sx += g.x;
            sy += g.y;
          }
          sx /= live.length;
          AudioFX.gruntStep(((sx - this.arena.x) / this.arena.w) * 2 - 1);
        }
      }
      for (const g of live) {
        if (!p || !p.alive) break;
        let dx = p.x - g.x;
        let dy = p.y - g.y;
        // light separation so they don't become one blob
        for (const o of live) {
          if (o === g) continue;
          const ox = g.x - o.x;
          const oy = g.y - o.y;
          const d2 = ox * ox + oy * oy;
          const min = (g.r + o.r) * 1.35;
          if (d2 > 0 && d2 < min * min) {
            dx += ox * 0.55;
            dy += oy * 0.55;
          }
        }
        const [nx, ny] = norm(dx, dy);
        g.x += nx * base * dt;
        g.y += ny * base * dt;
        this.clampEntity(g);
        g.face = facingFrom(nx, ny);
        g.anim += dt * (6 + t * 0.12);
      }
    }

    updateBullets(dt) {
      const { x, y, w, h } = this.arena;
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > 7) b.trail.shift();
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;
        if (
          b.life <= 0 ||
          b.x < x ||
          b.x > x + w ||
          b.y < y ||
          b.y > y + h
        ) {
          this.bullets.splice(i, 1);
        }
      }
    }

    updateHulks(dt) {
      const speed = this.minDim * 0.085;
      for (const h of this.hulks) {
        if (!h.alive) continue;
        h.flash = Math.max(0, h.flash - dt);
        h.think -= dt;
        if (h.think <= 0) {
          let tx = h.x + (Math.random() - 0.5) * 200;
          let ty = h.y + (Math.random() - 0.5) * 200;
          let best = Infinity;
          for (const hum of this.humans) {
            if (!hum.alive) continue;
            const d = Math.hypot(hum.x - h.x, hum.y - h.y);
            if (d < best) {
              best = d;
              tx = hum.x;
              ty = hum.y;
            }
          }
          const [nx, ny] = norm(tx - h.x, ty - h.y);
          h.vx = nx;
          h.vy = ny;
          h.think = rand(0.55, 1.25);
        }
        h.x += h.vx * speed * dt;
        h.y += h.vy * speed * dt;
        this.clampEntity(h);
        h.face = facingFrom(h.vx, h.vy);
        h.anim += dt * 4.2;
      }
    }

    enforcerCount() {
      return this.enforcers.filter((e) => e.alive).length;
    }

    spawnEnforcer(x, y) {
      const spec = this.waveSpec();
      const kick = rand(0, Math.PI * 2);
      this.enforcers.push({
        x,
        y,
        vx: Math.cos(kick),
        vy: Math.sin(kick),
        r: this.minDim * 0.02,
        fire: rand(spec.fireMin * 1.15, spec.fireMax * 1.25),
        spawn: 0,
        phase: Math.random() * 6,
        weave: rand(0, Math.PI * 2),
        alive: true,
      });
      AudioFX.hatchPop();
      FX.ring(x, y, "#ff7ae0", 0.32);
      FX.burst(x, y, "#ff9adf", 12, 180, 2.4, 0.28);
    }

    updateSpheroids(dt) {
      const spec = this.waveSpec();
      const speed = this.minDim * 0.2;
      const { x, y, w, h } = this.arena;
      const head = this.minDim * 0.1;
      const cap = spec.enforcerCap || 4;
      for (const s of this.spheroids) {
        if (!s.alive) continue;
        // wavy drift, tend toward edges
        const wave = Math.sin(this.time * 3.2 + s.phase) * 0.55;
        const px = -s.vy;
        const py = s.vx;
        s.x += (s.vx + px * wave) * speed * dt;
        s.y += (s.vy + py * wave) * speed * dt;
        if (s.x < x + 22) {
          s.x = x + 22;
          s.vx = Math.abs(s.vx);
        }
        if (s.x > x + w - 22) {
          s.x = x + w - 22;
          s.vx = -Math.abs(s.vx);
        }
        if (s.y < y + 22 + head) {
          s.y = y + 22 + head;
          s.vy = Math.abs(s.vy);
        }
        if (s.y > y + h - 22) {
          s.y = y + h - 22;
          s.vy = -Math.abs(s.vy);
        }
        s.pulse = Math.max(0, s.pulse - dt);
        if (s.spawn < 1 || this.state !== STATE.PLAY) continue;
        s.hatch -= dt;
        // wind-up: bigger pulse + audible tick so hatch never surprises
        if (s.hatch <= 0.55) {
          s.pulse = Math.max(s.pulse, 0.22);
          s.tickT = (s.tickT || 0) - dt;
          if (s.tickT <= 0 && s.hatch > 0) {
            s.tickT = 0.18;
            AudioFX.tick(((s.x - this.arena.x) / this.arena.w) * 2 - 1);
          }
        }
        if (s.hatch <= 0) {
          if (this.enforcerCount() >= cap) {
            s.hatch = 0.12;
            continue;
          }
          this.spawnEnforcer(s.x, s.y);
          s.hatched += 1;
          s.pulse = 0.18;
          if (s.hatched >= s.quota) {
            s.alive = false;
            FX.burst(s.x, s.y, "#ff7ae0", 16, 200, 2.6, 0.3);
            FX.ring(s.x, s.y, "#fff", 0.22);
          } else {
            s.hatch = rand(spec.hatchNext * 0.75, spec.hatchNext * 1.2);
          }
        }
      }
    }

    updateEnforcers(dt) {
      const p = this.player;
      const spec = this.waveSpec();
      const diff = this.difficultyMul();
      const speed = this.minDim * 0.17 * (spec.enforcerMul || 1) * diff;
      const m = this.minDim;
      for (const e of this.enforcers) {
        if (!e.alive) continue;
        e.weave += dt * 5;
        if (p && p.alive) {
          const [nx, ny] = norm(p.x - e.x, p.y - e.y);
          const wx = -ny * Math.sin(e.weave) * 0.35;
          const wy = nx * Math.sin(e.weave) * 0.35;
          e.vx = nx + wx;
          e.vy = ny + wy;
          const [ux, uy] = norm(e.vx, e.vy);
          e.x += ux * speed * dt;
          e.y += uy * speed * dt;
          this.clampEntity(e);
          e.fire -= dt;
          if (e.fire <= 0 && this.sparks.length < 12) {
            const dMul = this.difficultyMul() < 1 ? 1.35 : 1;
            const bMul = this.bozoActive() ? this.bozoFireMul() : 1;
            e.fire = rand(spec.fireMin * dMul * bMul, spec.fireMax * dMul * bMul);
            const jitter = m * 0.07;
            const tx = p.x + (Math.random() - 0.5) * jitter * 2;
            const ty = p.y + (Math.random() - 0.5) * jitter * 2;
            const [ax, ay] = norm(tx - e.x, ty - e.y);
            const dist = Math.hypot(p.x - e.x, p.y - e.y);
            const close = clamp(dist / (m * 0.28), 0.5, 1);
            const spd = m * ((spec.sparkMul || 0.5) * close) * diff;
            this.sparks.push({
              x: e.x,
              y: e.y - m * 0.018,
              vx: ax * spd,
              vy: ay * spd,
              r: m * 0.011,
              life: 1.7,
              spin: Math.random() * Math.PI * 2,
            });
            AudioFX.enforcerShot(((e.x - this.arena.x) / this.arena.w) * 2 - 1);
          }
        }
      }
    }

    updateSparks(dt) {
      const { x, y, w, h } = this.arena;
      const pad = 8;
      for (let i = this.sparks.length - 1; i >= 0; i--) {
        const s = this.sparks[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.spin += dt * 14;
        s.life -= dt;
        let bounced = false;
        if (s.x < x + pad) {
          s.x = x + pad;
          s.vx = Math.abs(s.vx) * 0.85;
          bounced = true;
        } else if (s.x > x + w - pad) {
          s.x = x + w - pad;
          s.vx = -Math.abs(s.vx) * 0.85;
          bounced = true;
        }
        if (s.y < y + pad) {
          s.y = y + pad;
          s.vy = Math.abs(s.vy) * 0.85;
          bounced = true;
        } else if (s.y > y + h - pad) {
          s.y = y + h - pad;
          s.vy = -Math.abs(s.vy) * 0.85;
          bounced = true;
        }
        if (bounced) FX.wallRipple(s.x, s.y, "rgba(255,110,40,0.8)");
        if (s.life <= 0) this.sparks.splice(i, 1);
      }
    }

    updateBrains(dt) {
      if (this.state !== STATE.PLAY) return;
      const spec = this.waveSpec();
      const diff = this.difficultyMul();
      const speed = this.minDim * 0.068 * (spec.brainMul || 1) * diff;
      const m = this.minDim;
      for (const b of this.brains) {
        if (!b.alive) continue;
        if (b.converting) {
          const h = b.converting;
          if (!h.alive) {
            b.converting = null;
            continue;
          }
          if (h.convertT <= 0) {
            this.finishConvert(b, h);
          }
          continue;
        }
        let tx = null;
        let ty = null;
        let best = Infinity;
        for (const h of this.humans) {
          if (!h.alive || h.converting || h.claimed) continue;
          const d = Math.hypot(h.x - b.x, h.y - b.y);
          if (d < best) {
            best = d;
            tx = h.x;
            ty = h.y;
          }
        }
        if (tx == null && this.player && this.player.alive) {
          tx = this.player.x;
          ty = this.player.y;
        }
        if (tx != null) {
          const [nx, ny] = norm(tx - b.x, ty - b.y);
          b.vx = nx;
          b.vy = ny;
          b.x += nx * speed * dt;
          b.y += ny * speed * dt;
          this.clampEntity(b);
          b.face = facingFrom(nx, ny);
        }
        b.anim += dt * 5;
        b.fire -= dt;
        if (b.fire <= 0 && this.missiles.length < 6 && this.player && this.player.alive) {
          const dMul = diff < 1 ? 1.4 : 1;
          const bMul = this.bozoActive() ? this.bozoFireMul() : 1;
          b.fire = rand(2.8 * dMul * bMul, 4.6 * dMul * bMul);
          const [nx, ny] = norm(this.player.x - b.x, this.player.y - b.y);
          const spd = m * (spec.missileMul || 0.4) * diff;
          this.missiles.push({
            x: b.x,
            y: b.y - m * 0.04,
            vx: nx * spd,
            vy: ny * spd,
            r: m * 0.014,
            life: 4.2,
            wobble: Math.random() * 6,
          });
          AudioFX.brainFire(((b.x - this.arena.x) / this.arena.w) * 2 - 1);
        }
        for (const h of this.humans) {
          if (!h.alive || h.converting || h.claimed) continue;
          if (Math.hypot(h.x - b.x, h.y - b.y) < h.r + b.r + 6) {
            this.startConvert(b, h);
            break;
          }
        }
      }
    }

    startConvert(brain, human) {
      human.converting = true;
      human.claimed = true;
      human.convertT = 1.65;
      human.vx = 0;
      human.vy = 0;
      brain.converting = human;
      AudioFX.convertStart();
      FX.ring(human.x, human.y, "#ff4a6a", 0.5);
      FX.light(human.x, human.y, "rgba(255,60,90,0.9)", this.minDim * 0.12, 0.5);
      FX.scorePop(human.x, human.y - 34, "HELP!", "#ff6a7a");
    }

    finishConvert(brain, human) {
      human.alive = false;
      brain.converting = null;
      this.humanChain = 0;
      this.progs.push({
        x: human.x,
        y: human.y,
        r: human.kind === "mikey" ? this.minDim * 0.016 : this.minDim * 0.02,
        face: "s",
        anim: 0,
        spawn: 0.35,
        small: human.kind === "mikey",
        alive: true,
      });
      AudioFX.convertDone();
      FX.burst(human.x, human.y, "#c77bff", 18, 220, 2.8, 0.35);
      FX.ring(human.x, human.y, "#fff", 0.25);
    }

    updateProgs(dt) {
      const p = this.player;
      const speed = this.minDim * 0.15;
      for (const g of this.progs) {
        if (!g.alive) continue;
        if (p && p.alive) {
          const [nx, ny] = norm(p.x - g.x, p.y - g.y);
          g.x += nx * speed * dt;
          g.y += ny * speed * dt;
          this.clampEntity(g);
          g.face = facingFrom(nx, ny);
        }
        g.anim += dt * 7;
      }
    }

    updateMissiles(dt) {
      const p = this.player;
      const turn = 3.4;
      for (let i = this.missiles.length - 1; i >= 0; i--) {
        const m = this.missiles[i];
        if (p && p.alive) {
          const [tx, ty] = norm(p.x - m.x, p.y - m.y);
          const [cx, cy] = norm(m.vx, m.vy);
          const nx = cx + tx * turn * dt;
          const ny = cy + ty * turn * dt;
          const spd = Math.hypot(m.vx, m.vy) || this.minDim * 0.4;
          const [ux, uy] = norm(nx, ny);
          m.vx = ux * spd;
          m.vy = uy * spd;
        }
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.life -= dt;
        m.wobble += dt * 10;
        if (m.life <= 0) this.missiles.splice(i, 1);
      }
    }

    tankCount() {
      return this.tanks.filter((t) => t.alive).length;
    }

    spawnTank(x, y) {
      const spec = this.waveSpec();
      const a = rand(0, Math.PI * 2);
      this.tanks.push({
        x,
        y,
        vx: Math.cos(a),
        vy: Math.sin(a),
        r: this.minDim * 0.032,
        face: facingFrom(Math.cos(a), Math.sin(a)),
        think: rand(0.6, 1.4),
        fire: rand(spec.tankFireMin || 1.4, spec.tankFireMax || 2.2),
        spawn: 0,
        alive: true,
      });
      AudioFX.hatchPop();
      FX.ring(x, y, "#ffe56a", 0.3);
      FX.burst(x, y, "#ffb040", 10, 160, 2.2, 0.25);
    }

    updateQuarks(dt) {
      const spec = this.waveSpec();
      const speed = this.minDim * 0.17;
      const { x, y, w, h } = this.arena;
      const head = this.minDim * 0.1;
      const cap = spec.tankCap || 6;
      for (const q of this.quarks) {
        if (!q.alive) continue;
        const wave = Math.sin(this.time * 2.6 + q.phase) * 0.4;
        const px = -q.vy;
        const py = q.vx;
        q.x += (q.vx + px * wave) * speed * dt;
        q.y += (q.vy + py * wave) * speed * dt;
        if (q.x < x + 24) {
          q.x = x + 24;
          q.vx = Math.abs(q.vx);
        }
        if (q.x > x + w - 24) {
          q.x = x + w - 24;
          q.vx = -Math.abs(q.vx);
        }
        if (q.y < y + 24 + head) {
          q.y = y + 24 + head;
          q.vy = Math.abs(q.vy);
        }
        if (q.y > y + h - 24) {
          q.y = y + h - 24;
          q.vy = -Math.abs(q.vy);
        }
        q.pulse = Math.max(0, q.pulse - dt);
        if (q.spawn < 1 || this.state !== STATE.PLAY) continue;
        q.hatch -= dt;
        if (q.hatch <= 0.55) {
          q.pulse = Math.max(q.pulse, 0.22);
          q.tickT = (q.tickT || 0) - dt;
          if (q.tickT <= 0 && q.hatch > 0) {
            q.tickT = 0.2;
            AudioFX.tick(((q.x - this.arena.x) / this.arena.w) * 2 - 1);
          }
        }
        if (q.hatch <= 0) {
          if (this.tankCount() >= cap) {
            q.hatch = 0.2;
            continue;
          }
          this.spawnTank(q.x, q.y);
          q.hatched += 1;
          q.pulse = 0.18;
          if (q.hatched >= q.quota) {
            q.alive = false;
            FX.burst(q.x, q.y, "#b6ff40", 16, 200, 2.6, 0.3);
          } else {
            q.hatch = rand(spec.hatchNext * 0.8, spec.hatchNext * 1.25);
          }
        }
      }
    }

    updateTanks(dt) {
      const spec = this.waveSpec();
      const diff = this.difficultyMul();
      const speed = this.minDim * 0.11 * (spec.tankMul || 0.55) * diff;
      const m = this.minDim;
      for (const t of this.tanks) {
        if (!t.alive) continue;
        t.think -= dt;
        if (t.think <= 0) {
          if (this.player && this.player.alive && Math.random() < 0.55) {
            const [nx, ny] = norm(this.player.x - t.x, this.player.y - t.y);
            t.vx = nx;
            t.vy = ny;
          } else {
            const a = Math.random() * Math.PI * 2;
            t.vx = Math.cos(a);
            t.vy = Math.sin(a);
          }
          t.think = rand(0.7, 1.6);
        }
        t.x += t.vx * speed * dt;
        t.y += t.vy * speed * dt;
        this.clampEntity(t);
        t.face = facingFrom(t.vx, t.vy);
        t.fire -= dt;
        if (this.state === STATE.PLAY && t.fire <= 0 && this.shells.length < 10 && this.player && this.player.alive) {
          const dMul = diff < 1 ? 1.35 : 1;
          const bMul = this.bozoActive() ? this.bozoFireMul() : 1;
          t.fire = rand((spec.tankFireMin || 1.4) * dMul * bMul, (spec.tankFireMax || 2.2) * dMul * bMul);
          const jitter = m * 0.06;
          const tx = this.player.x + (Math.random() - 0.5) * jitter;
          const ty = this.player.y + (Math.random() - 0.5) * jitter;
          const [ax, ay] = norm(tx - t.x, ty - t.y);
          const spd = m * (spec.shellMul || 0.4) * diff;
          this.shells.push({
            x: t.x + ax * m * 0.04,
            y: t.y - m * 0.02 + ay * m * 0.03,
            vx: ax * spd,
            vy: ay * spd,
            r: m * 0.012,
            life: 3.4,
            bounces: 0,
          });
          AudioFX.tankFire(((t.x - this.arena.x) / this.arena.w) * 2 - 1);
        }
      }
    }

    updateShells(dt) {
      const { x, y, w, h } = this.arena;
      const pad = 10;
      for (let i = this.shells.length - 1; i >= 0; i--) {
        const s = this.shells[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt;
        let bounced = false;
        if (s.x < x + pad) {
          s.x = x + pad;
          s.vx = Math.abs(s.vx);
          bounced = true;
        } else if (s.x > x + w - pad) {
          s.x = x + w - pad;
          s.vx = -Math.abs(s.vx);
          bounced = true;
        }
        if (s.y < y + pad) {
          s.y = y + pad;
          s.vy = Math.abs(s.vy);
          bounced = true;
        } else if (s.y > y + h - pad) {
          s.y = y + h - pad;
          s.vy = -Math.abs(s.vy);
          bounced = true;
        }
        if (bounced) {
          s.bounces += 1;
          AudioFX.tankBounce();
          FX.wallRipple(s.x, s.y, "rgba(255,176,64,0.85)");
        }
        if (s.life <= 0 || s.bounces >= 4) this.shells.splice(i, 1);
      }
    }

    collide() {
      const p = this.player;
      const panOf = (e) => ((e.x - this.arena.x) / this.arena.w) * 2 - 1;

      // bullets vs grunts / spheroids / enforcers / electrodes / hulks
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        let hit = false;
        for (const g of this.grunts) {
          if (!g.alive) continue;
          if (Math.hypot(b.x - g.x, b.y - (g.y - g.r * 0.6)) < g.r + b.r) {
            g.alive = false;
            hit = true;
            this.killGrunt(g);
            break;
          }
        }
        if (!hit) {
          for (const s of this.spheroids) {
            if (!s.alive) continue;
            if (Math.hypot(b.x - s.x, b.y - s.y) < s.r + b.r) {
              s.alive = false;
              hit = true;
              this.addScore(1000, s.x, s.y, "1000");
              AudioFX.spheroidDie(panOf(s));
              FX.burst(s.x, s.y, "#ff7ae0", 20, 320, 3.4, 0.4);
              FX.debris(s.x, s.y, ["#ff7ae0", "#7a0858", "#ffffff"], 12, 300, 0.5);
              FX.ring(s.x, s.y, "#ffa0e8", 0.35);
              FX.light(s.x, s.y, "rgba(255,60,180,0.9)", this.minDim * 0.15, 0.3);
              FX.addShake(5);
              break;
            }
          }
        }
        if (!hit) {
          for (const e of this.enforcers) {
            if (!e.alive) continue;
            if (Math.hypot(b.x - e.x, b.y - e.y) < e.r + b.r) {
              e.alive = false;
              hit = true;
              this.addScore(150, e.x, e.y, "150");
              AudioFX.gruntDie(panOf(e));
              FX.burst(e.x, e.y, "#c77bff", 20, 260, 3, 0.35);
              FX.ring(e.x, e.y, "#e0a0ff", 0.25);
              break;
            }
          }
        }
        if (!hit) {
          for (let si = this.sparks.length - 1; si >= 0; si--) {
            const sp = this.sparks[si];
            if (Math.hypot(b.x - sp.x, b.y - sp.y) < sp.r + b.r + 4) {
              this.sparks.splice(si, 1);
              hit = true;
              this.addScore(25, sp.x, sp.y, "25");
              FX.burst(sp.x, sp.y, "#ff7a2a", 8, 160, 2, 0.2);
              break;
            }
          }
        }
        if (!hit) {
          for (const e of this.electrodes) {
            if (!e.alive) continue;
            if (Math.hypot(b.x - e.x, b.y - e.y) < e.r + b.r) {
              e.alive = false;
              hit = true;
              AudioFX.electrodeHit(panOf(e));
              FX.burst(e.x, e.y, "#ffe56a", 22, 260, 3.2, 0.4);
              FX.ring(e.x, e.y, "#fff3a0", 0.28);
              FX.addShake(3);
              break;
            }
          }
        }
        if (!hit) {
          for (const h of this.hulks) {
            if (!h.alive) continue;
            if (Math.hypot(b.x - h.x, b.y - (h.y - h.r * 0.5)) < h.r + b.r) {
              hit = true;
              h.flash = 0.12;
              AudioFX.hulkHit(panOf(h));
              FX.burst(b.x, b.y, "#7dff6a", 8, 140, 2.2, 0.18);
              Input.rumble(22, 0.15, 0.25);
              break;
            }
          }
        }
        if (!hit) {
          for (const br of this.brains) {
            if (!br.alive) continue;
            if (Math.hypot(b.x - br.x, b.y - (br.y - br.r * 0.5)) < br.r + b.r) {
              this.killBrain(br);
              hit = true;
              break;
            }
          }
        }
        if (!hit) {
          for (const g of this.progs) {
            if (!g.alive) continue;
            if (Math.hypot(b.x - g.x, b.y - (g.y - g.r * 0.5)) < g.r + b.r) {
              g.alive = false;
              hit = true;
              this.addScore(100, g.x, g.y, "100");
              AudioFX.gruntDie(panOf(g));
              FX.burst(g.x, g.y, "#c77bff", 16, 220, 2.6, 0.3);
              break;
            }
          }
        }
        if (!hit) {
          for (let mi = this.missiles.length - 1; mi >= 0; mi--) {
            const ms = this.missiles[mi];
            if (Math.hypot(b.x - ms.x, b.y - ms.y) < ms.r + b.r + 3) {
              this.missiles.splice(mi, 1);
              hit = true;
              this.addScore(25, ms.x, ms.y, "25");
              FX.burst(ms.x, ms.y, "#ff6a2a", 10, 180, 2.2, 0.22);
              break;
            }
          }
        }
        if (!hit) {
          for (const q of this.quarks) {
            if (!q.alive) continue;
            if (Math.hypot(b.x - q.x, b.y - q.y) < q.r + b.r) {
              q.alive = false;
              hit = true;
              this.addScore(1000, q.x, q.y, "1000");
              AudioFX.quarkDie(panOf(q));
              FX.burst(q.x, q.y, "#b6ff40", 20, 320, 3.4, 0.4);
              FX.debris(q.x, q.y, ["#b6ff40", "#4a6a10", "#ffffff"], 12, 300, 0.5);
              FX.ring(q.x, q.y, "#e8ff80", 0.35);
              FX.light(q.x, q.y, "rgba(180,255,60,0.9)", this.minDim * 0.15, 0.3);
              FX.addShake(5);
              break;
            }
          }
        }
        if (!hit) {
          for (const tk of this.tanks) {
            if (!tk.alive) continue;
            if (Math.hypot(b.x - tk.x, b.y - (tk.y - tk.r * 0.4)) < tk.r + b.r) {
              tk.alive = false;
              hit = true;
              this.addScore(200, tk.x, tk.y, "200");
              AudioFX.tankDie(panOf(tk));
              FX.burst(tk.x, tk.y, "#ff9a3a", 18, 280, 3, 0.35);
              FX.debris(tk.x, tk.y, ["#ff9a3a", "#5a5a5a", "#ffe56a"], 14, 300, 0.55);
              FX.ring(tk.x, tk.y, "#ffe56a", 0.28);
              FX.light(tk.x, tk.y, "rgba(255,150,50,0.9)", this.minDim * 0.16, 0.32);
              break;
            }
          }
        }
        if (!hit) {
          for (let si = this.shells.length - 1; si >= 0; si--) {
            const sh = this.shells[si];
            if (Math.hypot(b.x - sh.x, b.y - sh.y) < sh.r + b.r + 3) {
              this.shells.splice(si, 1);
              hit = true;
              this.addScore(50, sh.x, sh.y, "50");
              FX.burst(sh.x, sh.y, "#ffb040", 8, 150, 2, 0.2);
              break;
            }
          }
        }
        if (hit) this.bullets.splice(i, 1);
      }

      // grunts vs electrodes
      for (const g of this.grunts) {
        if (!g.alive) continue;
        for (const e of this.electrodes) {
          if (!e.alive) continue;
          if (Math.hypot(g.x - e.x, g.y - e.y) < g.r + e.r * 0.85) {
            g.alive = false;
            this.killGrunt(g, false);
          }
        }
      }

      // humans vs electrodes / hulks
      for (const h of this.humans) {
        if (!h.alive) continue;
        let dead = false;
        for (const e of this.electrodes) {
          if (!e.alive) continue;
          if (Math.hypot(h.x - e.x, h.y - e.y) < h.r + e.r * 0.8) {
            dead = true;
            break;
          }
        }
        if (!dead) {
          for (const k of this.hulks) {
            if (!k.alive) continue;
            if (Math.hypot(h.x - k.x, h.y - k.y) < h.r + k.r * 0.75) {
              dead = true;
              break;
            }
          }
        }
        if (dead) {
          h.alive = false;
          for (const br of this.brains) {
            if (br.converting === h) this.cancelConvert(br);
          }
          AudioFX.humanDie(((h.x - this.arena.x) / this.arena.w) * 2 - 1);
          const col = h.kind === "mommy" ? "#ff6ad6" : h.kind === "mikey" ? "#ffe56a" : "#6aa8ff";
          FX.burst(h.x, h.y, col, 16, 180, 2.6, 0.35);
          this.humanChain = 0;
        }
      }

      // spheroids / enforcers vs electrodes
      for (const s of this.spheroids) {
        if (!s.alive) continue;
        for (const e of this.electrodes) {
          if (!e.alive) continue;
          if (Math.hypot(s.x - e.x, s.y - e.y) < s.r + e.r * 0.8) {
            s.alive = false;
            FX.burst(s.x, s.y, "#ff7ae0", 16, 200, 2.8, 0.3);
          }
        }
      }
      for (const en of this.enforcers) {
        if (!en.alive) continue;
        for (const e of this.electrodes) {
          if (!e.alive) continue;
          if (Math.hypot(en.x - e.x, en.y - e.y) < en.r + e.r * 0.8) {
            en.alive = false;
            FX.burst(en.x, en.y, "#c77bff", 12, 180, 2.4, 0.25);
          }
        }
      }
      for (const br of this.brains) {
        if (!br.alive) continue;
        for (const e of this.electrodes) {
          if (!e.alive) continue;
          if (Math.hypot(br.x - e.x, br.y - e.y) < br.r + e.r * 0.8) {
            this.killBrain(br);
            break;
          }
        }
      }
      for (const g of this.progs) {
        if (!g.alive) continue;
        for (const e of this.electrodes) {
          if (!e.alive) continue;
          if (Math.hypot(g.x - e.x, g.y - e.y) < g.r + e.r * 0.8) {
            g.alive = false;
            FX.burst(g.x, g.y, "#c77bff", 12, 180, 2.4, 0.25);
          }
        }
      }

      if (!p || !p.alive) return;

      // rescue — generous radius + magnet assist so fast fly-bys count
      for (const h of this.humans) {
        if (!h.alive) continue;
        if (Math.hypot(p.x - h.x, p.y - h.y) < p.r + h.r + 20) {
          for (const br of this.brains) {
            if (br.converting === h) this.cancelConvert(br);
          }
          h.alive = false;
          const pts = [1000, 2000, 3000, 4000, 5000][this.humanChain % 5];
          this.humanChain += 1;
          this.rescued += 1;
          this.addScore(pts, h.x, h.y, String(pts));
          this.totalRescued += 1;
          AudioFX.rescue(panOf(h));
          Input.rumble(80, 0.2, 0.45);
          FX.burst(h.x, h.y, "#fff", 16, 200, 2.8, 0.35);
          FX.debris(h.x, h.y, ["#ffffff", "#ffe56a"], 6, 160, 0.35);
          const ring = h.kind === "mommy" ? "#ff7ae0" : h.kind === "mikey" ? "#ffe56a" : "#7eb6ff";
          FX.ring(h.x, h.y, ring, 0.4);
          FX.light(h.x, h.y, "rgba(255,255,190,0.9)", this.minDim * 0.14, 0.3);
        }
      }

      if (p.invuln > 0) return;

      const bodyY = p.y - p.r * 0.4;
      for (const g of this.grunts) {
        if (!g.alive) continue;
        if (Math.hypot(p.x - g.x, bodyY - (g.y - g.r * 0.5)) < p.r + g.r * 0.78) {
          this.killPlayer();
          return;
        }
      }
      for (const e of this.electrodes) {
        if (!e.alive) continue;
        if (Math.hypot(p.x - e.x, bodyY - e.y) < p.r + e.r * 0.75) {
          this.killPlayer();
          return;
        }
      }
      for (const h of this.hulks) {
        if (!h.alive) continue;
        if (Math.hypot(p.x - h.x, bodyY - (h.y - h.r * 0.4)) < p.r + h.r * 0.72) {
          this.killPlayer();
          return;
        }
      }
      for (const s of this.spheroids) {
        if (!s.alive) continue;
        if (Math.hypot(p.x - s.x, bodyY - s.y) < p.r + s.r) {
          this.killPlayer();
          return;
        }
      }
      for (const e of this.enforcers) {
        if (!e.alive) continue;
        if (Math.hypot(p.x - e.x, bodyY - e.y) < p.r + e.r) {
          this.killPlayer();
          return;
        }
      }
      for (const s of this.sparks) {
        if (Math.hypot(p.x - s.x, bodyY - s.y) < p.r + s.r) {
          this.killPlayer();
          return;
        }
      }
      for (const br of this.brains) {
        if (!br.alive) continue;
        if (Math.hypot(p.x - br.x, bodyY - (br.y - br.r * 0.4)) < p.r + br.r * 0.75) {
          this.killPlayer();
          return;
        }
      }
      for (const g of this.progs) {
        if (!g.alive) continue;
        if (Math.hypot(p.x - g.x, bodyY - (g.y - g.r * 0.4)) < p.r + g.r) {
          this.killPlayer();
          return;
        }
      }
      for (const ms of this.missiles) {
        if (Math.hypot(p.x - ms.x, bodyY - ms.y) < p.r + ms.r) {
          this.killPlayer();
          return;
        }
      }
      for (const q of this.quarks) {
        if (!q.alive) continue;
        if (Math.hypot(p.x - q.x, bodyY - q.y) < p.r + q.r) {
          this.killPlayer();
          return;
        }
      }
      for (const tk of this.tanks) {
        if (!tk.alive) continue;
        if (Math.hypot(p.x - tk.x, bodyY - (tk.y - tk.r * 0.3)) < p.r + tk.r * 0.8) {
          this.killPlayer();
          return;
        }
      }
      for (const sh of this.shells) {
        if (Math.hypot(p.x - sh.x, bodyY - sh.y) < p.r + sh.r) {
          this.killPlayer();
          return;
        }
      }
    }

    cancelConvert(brain) {
      const h = brain.converting;
      if (h && h.alive) {
        h.converting = false;
        h.claimed = false;
        h.convertT = 0;
      }
      brain.converting = null;
    }

    killBrain(br) {
      if (!br.alive) return;
      br.alive = false;
      this.cancelConvert(br);
      this.addScore(500, br.x, br.y, "500");
      AudioFX.brainDie(((br.x - this.arena.x) / this.arena.w) * 2 - 1);
      FX.burst(br.x, br.y - 12, "#c77bff", 20, 300, 3.4, 0.4);
      FX.debris(br.x, br.y - 12, ["#c77bff", "#5a2a8a", "#ffe56a"], 12, 260, 0.5);
      FX.ring(br.x, br.y, "#ff80ff", 0.32);
      FX.light(br.x, br.y, "rgba(200,120,255,0.9)", this.minDim * 0.13, 0.28);
      FX.addShake(4);
    }

    killGrunt(g, scored = true) {
      if (scored) this.addScore(100, g.x, g.y, "100");
      const pan = ((g.x - this.arena.x) / this.arena.w) * 2 - 1;
      AudioFX.gruntDie(pan);
      FX.burst(g.x, g.y - 10, "#ff4a3a", 18, 300, 3.2, 0.38);
      FX.debris(g.x, g.y - 10, ["#ff4a3a", "#7a1a12", "#ffd36a"], 10, 280, 0.45);
      FX.ring(g.x, g.y, "#ff6a3a", 0.26);
      FX.light(g.x, g.y, "rgba(255,90,50,0.85)", this.minDim * 0.11, 0.22);
      FX.addShake(2.4);
      FX.hitstop = 0.03;
      Input.rumble(30, 0.12, 0.3);
    }

    killPlayer() {
      const p = this.player;
      if (!p || !p.alive) return;
      if (p.invuln > 9000) return; // attract demo never dies
      p.alive = false;
      this.lives -= 1;
      if (!this.demoMode) this.deaths += 1;
      this.humanChain = 0;
      if (this.numPlayers === 2 && this.players) this.savePlayerSlot(this.activePlayer);
      this.bullets = [];
      this.sparks = [];
      this.missiles = [];
      this.shells = [];
      for (const e of this.enforcers) e.alive = false;
      AudioFX.playerDie();
      Input.rumble(220, 0.6, 1);
      FX.burst(p.x, p.y - 16, "#7ef6ff", 40, 360, 3.8, 0.55);
      FX.burst(p.x, p.y - 16, "#ffffff", 18, 220, 2.6, 0.4);
      FX.ring(p.x, p.y, "#7ef6ff", 0.5);
      FX.addShake(14);
      FX.addFlash(0.55, "rgba(255,50,40,0.32)");
      this.setState(STATE.DEAD);
    }

    spriteFor(kind, face, walking, frame) {
      const s = this.sprites;
      if (kind === "player") {
        if (walking && face === "s") return frame % 2 === 0 ? s.player_s_w0 : s.player_s_w1;
        if (face === "e") return s.player_e;
        if (face === "w") return s.player_w;
        if (face === "n") return s.player_n;
        return s.player_s;
      }
      if (kind === "grunt") {
        if (face === "n") return s.grunt_n;
        if (walking) return frame % 2 === 0 ? s.grunt_s_w0 : s.grunt_s_w1;
        return s.grunt_s;
      }
      if (kind === "hulk") {
        if (walking) return frame % 2 === 0 ? s.hulk_s_w0 : s.hulk_s_w1;
        return s.hulk_s;
      }
      if (kind === "brain") {
        if (walking) return frame % 2 === 0 ? s.brain_s_w0 : s.brain_s_w1;
        return s.brain_s;
      }
      if (kind === "prog") {
        if (walking) return frame % 2 === 0 ? s.prog_s_w0 : s.prog_s_w1;
        return s.prog_s;
      }
      if (kind === "tank") {
        if (face === "e") return s.tank_e;
        if (face === "w") return s.tank_w;
        return s.tank_s;
      }
      const base = kind;
      if (face === "e") return s[base + "_e"];
      if (face === "w") return s[base + "_w"];
      if (walking) return frame % 2 === 0 ? s[base + "_s_w0"] : s[base + "_s_w1"];
      return s[base + "_s"];
    }

    drawSprite(ctx, img, x, footY, height, spawn = 1, flicker = 1, bob = 0, flipH = false, tilt = 0, flipV = false) {
      if (!img || flicker <= 0) return;
      const aspect = img.width / img.height;
      const w = height * aspect;
      footY -= bob;
      ctx.save();
      ctx.globalAlpha *= flicker;
      // lean/flip so S-only sprites don't pop when facing E/W — cheap 2.5D
      if (flipH || tilt || flipV) {
        ctx.translate(x, footY - height / 2);
        if (tilt) ctx.rotate(tilt);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        ctx.translate(-x, -(footY - height / 2));
      }
      if (spawn < 0.999) {
        const strips = 16;
        const sh = img.height / strips;
        const dh = height / strips;
        for (let i = 0; i < strips; i++) {
          const appear = i / strips;
          if (spawn < appear) continue;
          const local = Math.min(1, (spawn - appear) / 0.18);
          const ox = (1 - local) * (i % 2 ? 48 : -48);
          ctx.globalAlpha = flicker * local;
          ctx.drawImage(
            img,
            0,
            i * sh,
            img.width,
            sh,
            x - w / 2 + ox,
            footY - height + i * dh,
            w,
            dh + 0.6
          );
        }
      } else {
        ctx.drawImage(img, x - w / 2, footY - height, w, height);
      }
      ctx.restore();
    }

    drawShadow(ctx, x, y, rx, ry) {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.beginPath();
      ctx.ellipse(x, y + 4, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    render() {
      const ctx = this.ctx;
      const w = this.viewW;
      const h = this.viewH;
      ctx.setTransform((window.devicePixelRatio || 1) > 0 ? Math.min(2, window.devicePixelRatio || 1) : 1, 0, 0, Math.min(2, window.devicePixelRatio || 1), 0, 0);
      ctx.fillStyle = "#05060c";
      ctx.fillRect(0, 0, w, h);

      if (this.state === STATE.TITLE) {
        this.renderTitle(ctx);
        return;
      }

      if (this.state === STATE.OPERATOR) {
        this.renderArena(ctx);
        this.renderOperator(ctx);
        return;
      }

      if (this.state === STATE.ENTRY) {
        this.renderArena(ctx);
        this.renderEntry(ctx);
        return;
      }

      const [ox, oy] = FX.offset();
      ctx.save();
      ctx.translate(ox, oy);
      this.renderArena(ctx);
      ctx.save();
      ctx.beginPath();
      ctx.rect(this.arena.x, this.arena.y, this.arena.w, this.arena.h);
      ctx.clip();
      this.renderWorld(ctx);
      FX.render(ctx);
      ctx.restore();
      ctx.restore();

      if (FX.flash > 0) {
        ctx.fillStyle = FX.flashColor;
        ctx.globalAlpha = Math.min(1, FX.flash);
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
      }

      this.renderDanger(ctx);
      const wantScan = !Input.prefs || Input.prefs.scanlines !== false;
      if (wantScan) this.renderScanlines(ctx);
      this.renderHUD(ctx);

      if (this.state === STATE.INTRO) {
        if (this.waveNum === 1) {
          if (this.numPlayers === 2) this.renderBanner(ctx, (this.activePlayer === 0 ? "P1 " : "P2 ") + "WAVE 1", this.waveSpec().subtitle);
          else this.renderHowTo(ctx);
        } else {
          const tag = this.numPlayers === 2 ? (this.activePlayer === 0 ? "P1 " : "P2 ") : "";
          this.renderBanner(ctx, tag + "WAVE " + this.waveNum, this.waveSpec().subtitle);
        }
      }
      if (this.state === STATE.DEAD && this.lives > 0) {
        const tag = this.numPlayers === 2 ? (this.activePlayer === 0 ? "P1 " : "P2 ") : "";
        this.renderBanner(ctx, tag + "DESTROYED", this.numPlayers === 2 ? "CHANGEOVER — GET READY" : "GET READY");
      }
      if (this.state === STATE.ATTRACT) {
        this.renderAttractOverlay(ctx);
      }
      if (this.state === STATE.TRANS) this.renderWipe(ctx);
      if (this.state === STATE.CLEAR) this.renderEnd(ctx, true);
      if (this.state === STATE.OVER) this.renderEnd(ctx, false);
      if (this.state === STATE.PAUSE) this.renderPause(ctx);
    }

    renderTitle(ctx) {
      const w = this.viewW;
      const h = this.viewH;
      const img = this.sprites.title;
      if (img) {
        const scale = Math.max(w / img.width, h / img.height);
        const iw = img.width * scale;
        const ih = img.height * scale;
        ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
      }
      ctx.fillStyle = "rgba(4,6,12,0.55)";
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "rgba(4,6,12,0.15)");
      g.addColorStop(0.55, "rgba(4,6,12,0.2)");
      g.addColorStop(1, "rgba(4,6,12,0.78)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const wantScanTitle = !Input.prefs || Input.prefs.scanlines !== false;
      if (wantScanTitle) this.renderScanlines(ctx);

      ctx.textAlign = "center";
      ctx.fillStyle = "#7ef6ff";
      ctx.shadowColor = "#18e8ff";
      ctx.shadowBlur = 24;
      ctx.font = `900 ${Math.round(Math.min(86, w * 0.07))}px Orbitron, sans-serif`;
      ctx.fillText("ROBOTRON", w / 2, h * 0.18);
      ctx.fillStyle = "#ff2bd6";
      ctx.shadowColor = "#ff2bd6";
      ctx.font = `900 ${Math.round(Math.min(72, w * 0.056))}px Orbitron, sans-serif`;
      ctx.fillText("2084", w / 2, h * 0.18 + Math.min(78, w * 0.062));
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#ffe56a";
      ctx.font = "700 20px Orbitron, sans-serif";
      ctx.fillText("WAVES 1–255", w / 2, h * 0.18 + Math.min(118, w * 0.095));

      // onboarding: what to do in 3 beats + controls by device
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.font = "16px 'Share Tech Mono', monospace";
      ctx.fillText("TOUCH HUMANS TO SAVE  ·  GREEN HULKS CAN'T DIE  ·  SHOOT PINK SPHEROIDS FIRST", w / 2, h * 0.335);
      // controls card
      const cy = h * 0.44;
      ctx.save();
      ctx.fillStyle = "rgba(6,10,18,0.72)";
      const cw = Math.min(720, w * 0.86);
      const ch = 118;
      const cx0 = w / 2 - cw / 2;
      // rounded card
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(cx0, cy, cw, ch, 12);
      else ctx.rect(cx0, cy, cw, ch);
      ctx.fill();
      ctx.strokeStyle = "rgba(126,246,255,0.35)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.fillStyle = "#7ef6ff";
      ctx.font = "700 13px Orbitron, sans-serif";
      const cols = [
        ["MOVE", "WASD / LEFT STICK", "#7ef6ff"],
        ["FIRE", "ARROWS / IJKL / R-STICK", "#ff7ae0"],
        ["DASH", "SHIFT / LB / 2x TAP", "#7dff9a"],
        ["MOUSE", "CLICK TOGGLES FIRE", "#ffe56a"],
      ];
      cols.forEach((c, i) => {
        const px = w / 2 + (i - 1.5) * (cw / 4);
        ctx.fillStyle = "#8a95a5";
        ctx.fillText(c[0], px, cy + 26);
        ctx.fillStyle = c[2];
        ctx.font = "13px 'Share Tech Mono', monospace";
        const parts = c[1].split(" / ");
        parts.forEach((p, j) => ctx.fillText(p, px, cy + 50 + j * 18));
        ctx.font = "700 13px Orbitron, sans-serif";
      });
      ctx.fillStyle = "#8a95a5";
      ctx.font = "12px 'Share Tech Mono', monospace";
      const p = Input.prefs || {};
      const mode = (p.difficulty === "easy" ? "EASY" : "ARCADE") + (p.autofire ? " · AUTOFIRE ON (T)" : "") + (p.muted ? " · MUTED (M)" : "") + (p.lowfx ? " · LOW-FX (V)" : "");
      ctx.fillText(`T AUTOFIRE · E DIFFICULTY · M MUTE · V LOW-FX · N SCANLINES      —      ${mode}`, w / 2, cy + ch + 20);
      ctx.restore();

      ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.font = "16px 'Share Tech Mono', monospace";
      ctx.fillText("SAVE THE LAST HUMAN FAMILY  ·  DESTROY THE GRUNTS  ·  AVOID THE HULKS", w / 2, h * 0.72);

      // hiscore table (top 5) + credits + 1P/2P prompts
      ctx.font = "14px 'Share Tech Mono', monospace";
      if (this.hiscores.length) {
        ctx.fillStyle = "#ffe56a";
        ctx.fillText("— HALL OF FAME —", w / 2, h * 0.76);
        ctx.font = "13px 'Share Tech Mono', monospace";
        const rows = this.hiscores.slice(0, 5);
        rows.forEach((e, i) => {
          ctx.fillStyle = i === 0 ? "#ffe56a" : "rgba(255,255,255,0.8)";
          ctx.fillText(`${i + 1}. ${e.name}  ${String(e.score).padStart(6, "0")}  W${e.wave}`, w / 2, h * 0.76 + 18 + i * 16);
        });
      }

      const prefs = Input.prefs || {};
      const credLine = prefs.freePlay ? "FREE PLAY" : `CREDITS ${this.credits}  ·  C/5 COIN`;
      const pulse = 0.65 + 0.35 * Math.sin(this.titlePulse * 3.2);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = "#fff";
      ctx.font = "700 20px Orbitron, sans-serif";
      const needCoin = !prefs.freePlay && this.credits <= 0;
      ctx.fillText(needCoin ? "INSERT COIN  (C)" : "1: 1 PLAYER   ·   2: 2 PLAYERS   ·   SPACE: 1P", w / 2, h * 0.875);
      ctx.globalAlpha = 1;

      ctx.font = "14px 'Share Tech Mono', monospace";
      ctx.fillStyle = "#9fd";
      const padLine = Input.padCount
        ? Input.dualPad
          ? `TWO JOYSTICKS  ·  STICK 1 MOVE   STICK 2 FIRE   ·  ${Input.padName}`
          : `GAMEPAD  ·  LEFT STICK MOVE   RIGHT STICK FIRE 360°   ·  ${Input.padName}`
        : "NO GAMEPAD  ·  WASD MOVE   ARROWS FIRE   ·  MOUSE AIM + CLICK";
      ctx.fillText(padLine, w / 2, h * 0.91);
      ctx.fillStyle = "#889";
      ctx.fillText(`${credLine}  ·  HIGH ${String(this.high).padStart(6, "0")}  ·  O OPERATOR  ·  F FULLSCREEN`, w / 2, h * 0.945);
    }

    renderArena(ctx) {
      const { x, y, w, h } = this.arena;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();

      ctx.fillStyle = "#0a0c14";
      ctx.fillRect(x, y, w, h);

      const floor = this.sprites.floor;
      if (floor) {
        ctx.globalAlpha = 0.52;
        const tile = Math.max(280, this.minDim * 0.38);
        for (let ty = y - 20; ty < y + h; ty += tile) {
          for (let tx = x - 20; tx < x + w; tx += tile) {
            ctx.drawImage(floor, tx, ty, tile, tile);
          }
        }
        ctx.globalAlpha = 1;
        // per-wave hue wash so electrodes / floor / walls feel like one sector
        try {
          const hue = this.waveSpec ? this.waveSpec().electrodeHue : 190;
          if (typeof hue === "number") {
            ctx.fillStyle = `hsla(${hue}, 90%, 55%, 0.06)`;
            ctx.fillRect(x, y, w, h);
          }
  } catch (_) {}
  // Compat: if a stale cached fx.js predates debris/light/wallRipple, polyfill
  // them so kill effects degrade instead of throwing. Bump ?v= in index.html
  // forces a refetch going forward.
  try {
    if (window.FX) {
      if (typeof window.FX.lowfx !== "function") {
        window.FX.lowfx = function () { return false; };
      }
      if (typeof window.FX.light !== "function") {
        window.FX.light = function () {};
      }
      if (typeof window.FX.wallRipple !== "function") {
        window.FX.wallRipple = function (x, y, color) {
          if (typeof this.ring === "function") this.ring(x, y, color || "#7ef6ff", 0.28);
        };
      }
      if (typeof window.FX.debris !== "function") {
        window.FX.debris = function (x, y, colors, n, speed, life) {
          const list = Array.isArray(colors) ? colors : [colors];
          if (typeof this.burst === "function") {
            this.burst(x, y, list[0] || "#ffffff", n || 10, speed || 260, 3.2, life || 0.5);
          }
        };
      }
      if (typeof window.FX.cone !== "function") {
        window.FX.cone = function (x, y, ang, color, n, speed, spread, life) {
          if (typeof this.burst === "function") {
            this.burst(x, y, color, n || 10, speed || 340, 2.5, life || 0.32);
          }
        };
      }
    }
  } catch (_) {}
      }

      const step = Math.max(48, this.minDim * 0.055);
      ctx.strokeStyle = "rgba(40, 220, 255, 0.04)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let gx = x; gx <= x + w; gx += step) {
        ctx.moveTo(gx, y);
        ctx.lineTo(gx, y + h);
      }
      for (let gy = y; gy <= y + h; gy += step) {
        ctx.moveTo(x, gy);
        ctx.lineTo(x + w, gy);
      }
      ctx.stroke();

      const vg = ctx.createRadialGradient(
        x + w / 2,
        y + h / 2,
        this.minDim * 0.15,
        x + w / 2,
        y + h / 2,
        this.minDim * 0.72
      );
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.45)");
      ctx.fillStyle = vg;
      ctx.fillRect(x, y, w, h);
      ctx.restore();

      // energy walls (open-border waves: faint dotted edge only)
      const open = (() => {
        try {
          return !!(this.waveSpec && this.waveSpec().openBorder);
        } catch (_) {
          return false;
        }
      })();
      if (open) {
        ctx.save();
        ctx.strokeStyle = "rgba(120,140,160,0.28)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 10]);
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);
        ctx.restore();
      } else {
        const pulse = 0.45 + 0.25 * Math.sin(this.time * 3.4);
        ctx.save();
        ctx.strokeStyle = `rgba(40, 230, 255, ${0.35 + pulse * 0.25})`;
        ctx.shadowColor = "#18e8ff";
        ctx.shadowBlur = 18;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(255, 43, 214, ${0.18 + pulse * 0.12})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);
        ctx.restore();
      }
    }

    renderWorld(ctx) {
      const m = this.minDim;
      const drawables = [];

      for (const e of this.electrodes) {
        if (e.alive) drawables.push({ z: e.y, kind: "electrode", e });
      }
      for (const g of this.grunts) {
        if (g.alive) drawables.push({ z: g.y, kind: "grunt", e: g });
      }
      for (const h of this.humans) {
        if (h.alive) drawables.push({ z: h.y, kind: "human", e: h });
      }
      for (const h of this.hulks) {
        if (h.alive) drawables.push({ z: h.y, kind: "hulk", e: h });
      }
      for (const s of this.spheroids) {
        if (s.alive) drawables.push({ z: s.y, kind: "spheroid", e: s });
      }
      for (const e of this.enforcers) {
        if (e.alive) drawables.push({ z: e.y, kind: "enforcer", e });
      }
      for (const b of this.brains) {
        if (b.alive) drawables.push({ z: b.y, kind: "brain", e: b });
      }
      for (const g of this.progs) {
        if (g.alive) drawables.push({ z: g.y, kind: "prog", e: g });
      }
      for (const q of this.quarks) {
        if (q.alive) drawables.push({ z: q.y, kind: "quark", e: q });
      }
      for (const t of this.tanks) {
        if (t.alive) drawables.push({ z: t.y, kind: "tank", e: t });
      }
      if (this.player && this.player.alive) {
        drawables.push({ z: this.player.y, kind: "player", e: this.player });
      }
      drawables.sort((a, b) => a.z - b.z);

      this.renderBullets(ctx);
      this.renderSparks(ctx);
      this.renderMissiles(ctx);
      this.renderShells(ctx);

      for (const d of drawables) {
        if (d.kind === "electrode") this.renderElectrode(ctx, d.e);
        if (d.kind === "grunt") {
          const g = d.e;
          this.drawShadow(ctx, g.x, g.y, m * 0.028, m * 0.01);
          const img = this.spriteFor("grunt", g.face, true, Math.floor(g.anim));
          const bob = Math.abs(Math.sin(g.anim * Math.PI)) * m * 0.006;
          // S-only art: flip + lean sells E/W without new PNGs
          const flipH = g.face === "w";
          const tilt = g.face === "e" ? 0.1 : g.face === "w" ? -0.1 : 0;
          this.drawSprite(ctx, img, g.x, g.y, m * 0.105, g.spawn, 1, bob, flipH, tilt);
        }
        if (d.kind === "human") {
          const h = d.e;
          const hh = h.kind === "mikey" ? m * 0.086 : m * 0.118;
          this.drawShadow(ctx, h.x, h.y, m * 0.018, m * 0.007);
          const img = this.spriteFor(h.kind, h.face, !h.converting, Math.floor(h.anim));
          const bob = h.converting ? 0 : Math.abs(Math.sin(h.anim * Math.PI)) * m * 0.005;
          const flick = h.converting ? (Math.sin(this.time * 22) > 0 ? 1 : 0.35) : 1;
          this.drawSprite(ctx, img, h.x, h.y, hh, h.spawn, flick, bob);
          this.renderHumanBeacon(ctx, h, m);
        }
        if (d.kind === "hulk") {
          const h = d.e;
          this.drawShadow(ctx, h.x, h.y, m * 0.036, m * 0.012);
          const img = this.spriteFor("hulk", h.face, true, Math.floor(h.anim));
          const bob = Math.abs(Math.sin(h.anim * Math.PI)) * m * 0.004;
          const flick = h.flash > 0 ? 0.55 + 0.45 * Math.sin(this.time * 40) : 1;
          const flipH = h.face === "w";
          const tilt = h.face === "e" ? 0.08 : h.face === "w" ? -0.08 : 0;
          this.drawSprite(ctx, img, h.x, h.y, m * 0.155, h.spawn, flick, bob, flipH, tilt);
          // immune readability: shield tick when recently shot
          if (h.flash > 0) {
            ctx.save();
            ctx.strokeStyle = "rgba(125,255,106,0.8)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(h.x, h.y - m * 0.07, m * 0.045, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        }
        if (d.kind === "spheroid") this.renderSpheroid(ctx, d.e);
        if (d.kind === "enforcer") this.renderEnforcer(ctx, d.e);
        if (d.kind === "brain") {
          const b = d.e;
          this.drawShadow(ctx, b.x, b.y, m * 0.03, m * 0.01);
          const img = this.spriteFor("brain", b.face, !b.converting, Math.floor(b.anim));
          const bob = b.converting ? 0 : Math.abs(Math.sin(b.anim * Math.PI)) * m * 0.004;
          const flipH = b.face === "w";
          this.drawSprite(ctx, img, b.x, b.y, m * 0.12, b.spawn, 1, bob, flipH, 0);
          if (b.converting) {
            ctx.save();
            ctx.strokeStyle = "rgba(255,80,110,0.85)";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(b.x, b.y - m * 0.05, m * 0.045, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        }
        if (d.kind === "quark") this.renderQuark(ctx, d.e);
        if (d.kind === "tank") {
          const t = d.e;
          this.drawShadow(ctx, t.x, t.y, m * 0.034, m * 0.012);
          const img = this.spriteFor("tank", t.face, true, 0);
          // north uses flipped hull so N/S read differently without new art
          this.drawSprite(ctx, img, t.x, t.y, m * 0.1, t.spawn, 1, 0, false, 0, t.face === "n");
        }
        if (d.kind === "prog") {
          const g = d.e;
          const hh = g.small ? m * 0.086 : m * 0.112;
          this.drawShadow(ctx, g.x, g.y, m * 0.018, m * 0.007);
          const img = this.spriteFor("prog", g.face, true, Math.floor(g.anim));
          const bob = Math.abs(Math.sin(g.anim * Math.PI)) * m * 0.005;
          this.drawSprite(ctx, img, g.x, g.y, hh, g.spawn, 1, bob, g.face === "w", 0);
        }
        if (d.kind === "player") {
          const p = d.e;
          this.drawShadow(ctx, p.x, p.y, m * 0.024, m * 0.009);
          const moving = Math.hypot(p.vx, p.vy) > 8;
          const img = this.spriteFor("player", p.face, moving, Math.floor(p.anim));
          let flick = 1;
          // dash stays solid so the burst reads; spawn invuln still flickers
          if (p.invuln > 0 && !(p.dashT > 0)) flick = Math.sin(this.time * 28) > 0 ? 1 : 0.25;
          const bob = moving ? Math.abs(Math.sin(p.anim * Math.PI)) * m * 0.007 : 0;
          this.drawSprite(ctx, img, p.x, p.y, m * 0.13, p.spawn, flick, bob);
          const aiming = Math.hypot(p.aimX, p.aimY) > 0.2 && (Math.hypot(Input.shootX, Input.shootY) > 0.22 || Input.mouseAim || Input.stickyAim || Input.prefs?.autofire);
          if (aiming) {
            this.renderAim(ctx, p);
          }
        }
      }
    }

    renderHumanBeacon(ctx, h, m) {
      // always-visible rescue signal: diamond + HELP when converting
      const y0 = h.y - (h.kind === "mikey" ? m * 0.1 : m * 0.135);
      const pulse = 0.6 + 0.4 * Math.sin(this.time * 5 + h.x * 0.05);
      ctx.save();
      if (h.converting) {
        // urgent red beacon
        const flash = Math.sin(this.time * 14) > 0;
        ctx.fillStyle = flash ? "#ff4a6a" : "#fff";
        ctx.shadowColor = "#ff2a4a";
        ctx.shadowBlur = 14;
        ctx.font = `700 ${Math.round(m * 0.022)}px Orbitron, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("HELP!", h.x, y0 - m * 0.02);
        ctx.beginPath();
        ctx.moveTo(h.x, y0 - 2);
        ctx.lineTo(h.x - 6, y0 - 12);
        ctx.lineTo(h.x + 6, y0 - 12);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        return;
      }
      ctx.globalAlpha = 0.55 + 0.3 * pulse;
      ctx.fillStyle = h.kind === "mommy" ? "#ff7ae0" : h.kind === "mikey" ? "#ffe56a" : "#7eb6ff";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      const s = Math.max(4, m * 0.008) * (1 + 0.15 * pulse);
      ctx.beginPath();
      ctx.moveTo(h.x, y0 - s);
      ctx.lineTo(h.x + s * 0.7, y0);
      ctx.lineTo(h.x, y0 + s);
      ctx.lineTo(h.x - s * 0.7, y0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    renderAim(ctx, p) {
      const a = Math.atan2(p.aimY, p.aimX);
      ctx.save();
      ctx.translate(p.x, p.y - this.minDim * 0.05);
      ctx.rotate(a);
      ctx.strokeStyle = "rgba(126,246,255,0.35)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(this.minDim * 0.12, 0);
      ctx.stroke();
      ctx.restore();
    }

    renderBullets(ctx) {
      for (const b of this.bullets) {
        const a = Math.atan2(b.vy, b.vx);
        ctx.save();
        if (b.trail.length) {
          ctx.beginPath();
          ctx.moveTo(b.trail[0].x, b.trail[0].y);
          for (const t of b.trail) ctx.lineTo(t.x, t.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = "rgba(180,255,255,0.35)";
          ctx.lineWidth = 5;
          ctx.lineCap = "round";
          ctx.stroke();
        }
        ctx.translate(b.x, b.y);
        ctx.rotate(a);
        const grd = ctx.createLinearGradient(-16, 0, 10, 0);
        grd.addColorStop(0, "rgba(40,220,255,0)");
        grd.addColorStop(0.5, "#7ef6ff");
        grd.addColorStop(1, "#fff");
        ctx.fillStyle = grd;
        ctx.shadowColor = "#7ef6ff";
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 4.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    renderElectrode(ctx, e) {
      const t = this.time;
      const pulse = 0.82 + 0.18 * Math.sin(t * 7 + e.phase);
      const rot = t * (e.style === "diamond" ? 1.35 : 0.9) + e.phase;
      const s = e.r * 1.15 * pulse * (0.35 + 0.65 * e.spawn);
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(rot);
      ctx.globalAlpha = 0.25 + 0.75 * e.spawn;
      ctx.shadowColor = `hsl(${e.hue}, 100%, 60%)`;
      ctx.shadowBlur = 22;
      ctx.fillStyle = `hsla(${e.hue}, 100%, 62%, 0.95)`;
      if (e.style === "diamond") {
        ctx.beginPath();
        ctx.moveTo(0, -s * 1.25);
        ctx.lineTo(s * 0.95, 0);
        ctx.lineTo(0, s * 1.25);
        ctx.lineTo(-s * 0.95, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (e.style === "square") {
        const half = s * 0.92;
        ctx.fillRect(-half, -half, half * 2, half * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth = 2;
        ctx.strokeRect(-half, -half, half * 2, half * 2);
        ctx.strokeRect(-half * 0.45, -half * 0.45, half * 0.9, half * 0.9);
      } else if (e.style === "x") {
        const arm = s * 0.32;
        const lenA = s * 1.2;
        ctx.save();
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-lenA, -arm, lenA * 2, arm * 2);
        ctx.fillRect(-arm, -lenA, arm * 2, lenA * 2);
        ctx.restore();
      } else {
        const arm = s * 0.38;
        const lenA = s * 1.15;
        ctx.fillRect(-lenA, -arm, lenA * 2, arm * 2);
        ctx.fillRect(-arm, -lenA, arm * 2, lenA * 2);
      }
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff8d0";
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    renderSpheroid(ctx, s) {
      const m = this.minDim;
      const windup = s.hatch < 0.55 && s.alive ? 1 + (0.55 - s.hatch) * 1.6 : 1;
      const r = s.r * (1.05 + 0.18 * Math.sin(this.time * 10 + s.phase) + s.pulse * 1.4) * windup;
      const bob = Math.sin(this.time * 5 + s.phase) * m * 0.007;
      const cy = s.y - r * 0.2 - bob;
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.75 * s.spawn;
      this.drawShadow(ctx, s.x, s.y, r * 1.2, r * 0.42);
      ctx.strokeStyle = "rgba(255,120,210,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, cy, r * 1.85, 0, Math.PI * 2);
      ctx.stroke();
      const g = ctx.createRadialGradient(s.x - r * 0.35, cy - r * 0.45, r * 0.08, s.x, cy, r * 1.15);
      g.addColorStop(0, "#fff");
      g.addColorStop(0.22, "#ffb0ea");
      g.addColorStop(0.65, "#ff2bd6");
      g.addColorStop(1, "#7a0858");
      ctx.fillStyle = g;
      ctx.shadowColor = "#ff4ab0";
      ctx.shadowBlur = 26;
      ctx.beginPath();
      ctx.arc(s.x, cy, r * 1.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    renderEnforcer(ctx, e) {
      const m = this.minDim;
      const s = m * 0.03 * (0.4 + 0.6 * e.spawn);
      const bob = Math.sin(this.time * 9 + e.phase) * m * 0.006;
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.75 * e.spawn;
      this.drawShadow(ctx, e.x, e.y, s * 1.3, s * 0.42);
      ctx.translate(e.x, e.y - s * 0.35 - bob);
      ctx.rotate(this.time * 4 + e.phase);
      ctx.fillStyle = "#d060ff";
      ctx.shadowColor = "#ff80ff";
      ctx.shadowBlur = 16;
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-s * 1.35, -s * 0.22, s * 2.7, s * 0.44);
      }
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    renderQuark(ctx, q) {
      const img = this.sprites.quark;
      const m = this.minDim;
      const windup = q.hatch < 0.55 && q.alive ? 1 + (0.55 - q.hatch) * 1.2 : 1;
      const h = m * 0.07 * (1 + q.pulse * 0.35) * windup;
      this.drawShadow(ctx, q.x, q.y, h * 0.45, h * 0.16);
      this.drawSprite(ctx, img, q.x, q.y + h * 0.15, h, q.spawn, 1, Math.sin(this.time * 4 + q.phase) * m * 0.006);
    }

    renderShells(ctx) {
      for (const s of this.shells) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.fillStyle = "#ffb040";
        ctx.shadowColor = "#ff8020";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.rect(-s.r * 1.2, -s.r * 1.2, s.r * 2.4, s.r * 2.4);
        ctx.fill();
        ctx.fillStyle = "#fff3c0";
        ctx.beginPath();
        ctx.arc(0, 0, s.r * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    renderMissiles(ctx) {
      for (const m of this.missiles) {
        const a = Math.atan2(m.vy, m.vx);
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(a);
        // hostile palette: hot orange/red only (never cyan/purple) so danger reads instantly
        ctx.shadowColor = "#ff5a1a";
        ctx.shadowBlur = 14;
        const grd = ctx.createLinearGradient(-18, 0, 10, 0);
        grd.addColorStop(0, "rgba(255,90,20,0)");
        grd.addColorStop(0.5, "#ff6a2a");
        grd.addColorStop(1, "#fff3c0");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.ellipse(0, Math.sin(m.wobble) * 2, 16, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // dark spine so it reads on bright floor
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(90,20,0,0.85)";
        ctx.fillRect(-2, -1.5, 8, 3);
        ctx.restore();
      }
    }

    renderSparks(ctx) {
      for (const s of this.sparks) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.spin || 0);
        // hostile orange-red cross — distinct from pink spheroids + cyan bullets
        ctx.strokeStyle = "#ff6a2a";
        ctx.fillStyle = "#ffd9a0";
        ctx.shadowColor = "#ff4a00";
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2.2;
        const arm = s.r * 2.4;
        ctx.beginPath();
        ctx.moveTo(-arm, 0);
        ctx.lineTo(arm, 0);
        ctx.moveTo(0, -arm);
        ctx.lineTo(0, arm);
        ctx.moveTo(-arm * 0.7, -arm * 0.7);
        ctx.lineTo(arm * 0.7, arm * 0.7);
        ctx.moveTo(-arm * 0.7, arm * 0.7);
        ctx.lineTo(arm * 0.7, -arm * 0.7);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, s.r * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    renderWipe(ctx) {
      const w = this.viewW;
      const h = this.viewH;
      const { x, y, w: aw, h: ah } = this.arena;
      const t = this.stateTime;
      const nextNum = this.waveNum >= MAX_WAVE ? 1 : this.waveNum + 1;
      const next = this.waveSpecFor(nextNum);
      const cx = x + aw * 0.5;
      const cy = y + ah * 0.5;

      ctx.save();
      // rotating rays
      if (t < 2.2) {
        const rays = 14;
        const spin = t * 1.8;
        const rayA = 0.07 * (1 - clamp((t - 1.4) / 0.8, 0, 1));
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(spin);
        for (let i = 0; i < rays; i++) {
          ctx.rotate((Math.PI * 2) / rays);
          const rg = ctx.createLinearGradient(0, 0, 0, -ah);
          rg.addColorStop(0, `rgba(126,246,255,${rayA})`);
          rg.addColorStop(1, "rgba(126,246,255,0)");
          ctx.fillStyle = rg;
          ctx.beginPath();
          ctx.moveTo(-18, 0);
          ctx.lineTo(18, 0);
          ctx.lineTo(90, -ah);
          ctx.lineTo(-90, -ah);
          ctx.fill();
        }
        ctx.restore();
      }

      // expanding shock discs
      for (let i = 0; i < 4; i++) {
        const age = t - i * 0.16;
        if (age < 0 || age > 1.1) continue;
        const r = 40 + age * Math.max(aw, ah) * 0.85;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = i % 2 ? `rgba(255,43,214,${0.45 * (1 - age)})` : `rgba(126,246,255,${0.5 * (1 - age)})`;
        ctx.lineWidth = 6 * (1 - age);
        ctx.stroke();
      }

      // shutter wipe after the slam
      const wipe = clamp((t - 1.15) / 1.05, 0, 1);
      if (wipe > 0) {
        const bands = 22;
        for (let i = 0; i < bands; i++) {
          const by = y + (i / bands) * ah;
          const bh = ah / bands + 1;
          const local = clamp((wipe - i * 0.022) * 2.6, 0, 1);
          ctx.fillStyle = `rgba(4, 6, 14, ${local})`;
          ctx.fillRect(x, by, aw, bh);
          if (local > 0.12 && local < 0.95) {
            ctx.fillStyle = `rgba(255, 43, 214, ${0.45 * (1 - local)})`;
            ctx.fillRect(x, by + bh - 2, aw, 2);
            ctx.fillStyle = `rgba(40, 230, 255, ${0.55 * (1 - local)})`;
            ctx.fillRect(x, by, aw, 2);
          }
        }
        // scanning bar
        if (wipe < 1) {
          const sy = y + wipe * ah;
          const lg = ctx.createLinearGradient(0, sy - 18, 0, sy + 18);
          lg.addColorStop(0, "rgba(126,246,255,0)");
          lg.addColorStop(0.5, "rgba(255,255,255,0.85)");
          lg.addColorStop(1, "rgba(255,43,214,0)");
          ctx.fillStyle = lg;
          ctx.fillRect(x, sy - 18, aw, 36);
        }
      }

      // title slam
      ctx.textAlign = "center";
      if (t < 2.05) {
        const slam = clamp(t / 0.28, 0, 1);
        const back = 1 + 0.7 * (1 - slam) * (1 - slam);
        const fade = t < 1.55 ? 1 : 1 - clamp((t - 1.55) / 0.45, 0, 1);
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(w / 2, h * 0.42);
        ctx.scale(back, back);
        ctx.shadowColor = "#18e8ff";
        ctx.shadowBlur = 28;
        ctx.fillStyle = "#7ef6ff";
        ctx.font = `900 ${Math.round(Math.min(78, w * 0.062))}px Orbitron, sans-serif`;
        ctx.fillText("WAVE COMPLETE", 0, 0);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffe56a";
        ctx.font = "700 20px Orbitron, sans-serif";
        ctx.fillText("ALL HOSTILES DESTROYED", 0, 36);
        ctx.restore();
      } else {
        const slam = clamp((t - 2.05) / 0.32, 0, 1);
        const pop = 1 + 0.85 * (1 - slam) * (1 - slam);
        ctx.save();
        ctx.translate(w / 2, h * 0.42);
        ctx.scale(pop, pop);
        ctx.shadowColor = "#ff2bd6";
        ctx.shadowBlur = 32;
        ctx.fillStyle = "#ff7ae0";
        ctx.font = `900 ${Math.round(Math.min(92, w * 0.08))}px Orbitron, sans-serif`;
        ctx.fillText("WAVE " + nextNum, 0, 0);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#7ef6ff";
        ctx.font = "700 22px Orbitron, sans-serif";
        ctx.fillText(next ? next.subtitle : "", 0, 42);
        ctx.restore();
      }
      ctx.restore();
    }

    renderScanlines(ctx) {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      for (let y = 0; y < this.viewH; y += 4) ctx.fillRect(0, y, this.viewW, 1);
      ctx.restore();
    }

    renderDanger(ctx) {
      // red edge pulse when homing/orange danger is close — no extra HUD needed
      if (!this.player || !this.player.alive) return;
      if (this.state !== STATE.PLAY && this.state !== STATE.INTRO) return;
      const m = this.minDim;
      const p = this.player;
      let danger = 0;
      const check = (x, y, radius) => {
        const d = Math.hypot(x - p.x, y - p.y);
        if (d < radius) danger = Math.max(danger, 1 - d / radius);
      };
      for (const s of this.sparks) check(s.x, s.y, m * 0.22);
      for (const ms of this.missiles) check(ms.x, ms.y, m * 0.26);
      for (const sh of this.shells) check(sh.x, sh.y, m * 0.22);
      for (const b of this.brains) if (b.converting) check(b.converting.x, b.converting.y, m * 0.3);
      if (danger <= 0.02) return;
      const low = Input.prefs && Input.prefs.lowfx ? 0.4 : 1;
      const a = Math.min(0.5, danger * 0.5) * low * (0.7 + 0.3 * Math.sin(this.time * 8));
      const w = this.viewW;
      const h = this.viewH;
      const { x, y, w: aw, h: ah } = this.arena;
      const g = ctx.createRadialGradient(x + aw / 2, y + ah / 2, Math.min(aw, ah) * 0.35, x + aw / 2, y + ah / 2, Math.max(aw, ah) * 0.72);
      g.addColorStop(0, "rgba(255,30,40,0)");
      g.addColorStop(1, `rgba(255,30,40,${a})`);
      ctx.save();
      ctx.fillStyle = g;
      ctx.fillRect(x, y, aw, ah);
      ctx.restore();
    }

    renderHowTo(ctx) {
      const w = this.viewW;
      const h = this.viewH;
      const fade = clamp(1.4 - Math.max(0, this.stateTime - 2.8) / 1.2, 0, 1);
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.fillStyle = "rgba(4,6,12,0.55)";
      ctx.fillRect(0, this.hudH + 8, w, h * 0.22);
      ctx.textAlign = "center";
      ctx.shadowColor = "#18e8ff";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#7ef6ff";
      ctx.font = `900 ${Math.round(Math.min(48, w * 0.04))}px Orbitron, sans-serif`;
      ctx.fillText("WAVE 1 — SAVE THE FAMILY", w / 2, this.hudH + h * 0.075);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff";
      ctx.font = "15px 'Share Tech Mono', monospace";
      ctx.fillText("MOVE: WASD / LEFT STICK      FIRE: ARROWS / IJKL / RIGHT STICK      CLICK = STICKY AIM", w / 2, this.hudH + h * 0.115);
      ctx.fillStyle = "#ffe56a";
      ctx.font = "15px 'Share Tech Mono', monospace";
      ctx.fillText("WALK INTO HUMANS TO SAVE (CHAIN 1000→5000)  ·  GREEN HULKS ARE IMMUNE  ·  KILL GRUNTS FIRST", w / 2, this.hudH + h * 0.15);
      ctx.fillStyle = "#8a95a5";
      ctx.font = "13px 'Share Tech Mono', monospace";
      ctx.fillText("T AUTOFIRE · E EASY/ARCADE · M MUTE · V LOW-FX — change anytime, even paused", w / 2, this.hudH + h * 0.185);
      ctx.restore();
    }

    renderHUD(ctx) {
      const w = this.viewW;
      ctx.fillStyle = "rgba(4,6,12,0.88)";
      ctx.fillRect(0, 0, w, this.hudH);
      ctx.fillStyle = "rgba(24,232,255,0.18)";
      ctx.fillRect(0, this.hudH - 2, w, 2);

      ctx.textAlign = "left";
      ctx.font = "700 13px Orbitron, sans-serif";
      ctx.fillStyle = "#7fd6a5";
      const pTag = this.numPlayers === 2 ? (this.activePlayer === 0 ? "P1 " : "P2 ") : this.demoMode ? "DEMO " : "";
      ctx.fillText(pTag + "SCORE", 28, 24);
      ctx.fillStyle = "#fff";
      ctx.font = "700 30px 'Share Tech Mono', monospace";
      ctx.fillText(String(this.score).padStart(6, "0"), 28, 54);

      ctx.textAlign = "center";
      ctx.font = "700 13px Orbitron, sans-serif";
      ctx.fillStyle = "#7fd6a5";
      const bestLabel = this.isNewBest ? "NEW BEST!" : "HIGH";
      ctx.fillStyle = this.isNewBest ? "#ffe56a" : "#7fd6a5";
      ctx.fillText(bestLabel, w / 2, 24);
      ctx.fillStyle = this.isNewBest ? "#ffe56a" : "#ffe56a";
      if (this.isNewBest) {
        ctx.shadowColor = "#ffe56a";
        ctx.shadowBlur = 10 + 6 * Math.sin(this.time * 6);
      }
      ctx.font = "700 28px 'Share Tech Mono', monospace";
      ctx.fillText(String(this.high).padStart(6, "0"), w / 2, 54);
      ctx.shadowBlur = 0;

      ctx.textAlign = "right";
      ctx.font = "700 15px Orbitron, sans-serif";
      ctx.fillStyle = "#7fd6a5";
      const diffTag = Input.prefs && Input.prefs.difficulty === "easy" ? " · EASY" : "";
      const bozoTag = this.bozoActive() ? " · BOZO" : "";
      const pWave = this.numPlayers === 2 ? (this.activePlayer === 0 ? "P1 " : "P2 ") : "";
      const credTag = !(Input.prefs && Input.prefs.freePlay) ? ` · CR ${this.credits}` : "";
      ctx.fillText(pWave + "WAVE " + this.waveNum + diffTag + bozoTag + credTag, w - 28, 26);

      const lifeImg = this.sprites.player_s;
      const lh = 24;
      const livesToShow = Math.min(6, this.lives);
      for (let i = 0; i < livesToShow; i++) {
        if (!lifeImg) continue;
        const aspect = lifeImg.width / lifeImg.height;
        const lw = lh * aspect;
        ctx.drawImage(lifeImg, w - 36 - lw - i * (lw + 8), 32, lw, lh);
      }

      const left = this.hostilesLeft();
      const need = this.waveSpec().humans;
      ctx.textAlign = "left";
      ctx.font = "13px 'Share Tech Mono', monospace";
      // high-contrast chips instead of tiny overlapping strings
      let hx = 200;
      const chip = (text, color) => {
        ctx.fillStyle = "rgba(10,14,22,0.85)";
        const tw = ctx.measureText(text).width + 14;
        // wrap on narrow screens
        if (hx + tw > w - 140) return hx; // skip extras rather than overlap lives
        ctx.fillRect(hx - 7, 38, tw, 20);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(hx - 7, 38, tw, 20);
        ctx.fillStyle = color;
        ctx.fillText(text, hx, 53);
        hx += tw + 8;
        return hx;
      };
      chip(`HOSTILES ${String(left).padStart(2, "0")}`, left === 0 ? "#7dff9a" : "#ff6a6a");
      chip(`SAVED ${this.rescued}/${need}`, "#ff9ac6");
      chip(`CHAIN ${this.humanChain}x NEXT ${this.chainNext()}`, "#ffe56a");
      const dashCd = this.player ? this.player.dashCd || 0 : 0;
      chip(dashCd <= 0 ? "DASH READY" : `DASH ${dashCd.toFixed(1)}`, dashCd <= 0 ? "#7ef6ff" : "#5a6a7a");
      const sph = this.spheroids.filter((s) => s.alive).length;
      const enf = this.enforcerCount();
      const brn = this.brains.filter((b) => b.alive).length;
      if (sph || enf) {
        chip(`SPH ${sph} ENF ${enf}`, "#ff7ae0");
      }
      if (brn) {
        chip(`BRAINS ${String(brn).padStart(2, "0")}`, "#d0a0ff");
      }
      const qrk = this.quarks.filter((q) => q.alive).length;
      const tnk = this.tankCount();
      if (qrk || tnk) {
        chip(`QRK ${qrk} TNK ${tnk}`, "#ffb040");
      }
      if (this.numPlayers === 2 && this.players) {
        const a = this.players[0],
          b = this.players[1];
        chip(`P1 ${String(a.score).padStart(6, "0")} L${a.lives}`, this.activePlayer === 0 ? "#7ef6ff" : "#5a6a7a");
        chip(`P2 ${String(b.score).padStart(6, "0")} L${b.lives}`, this.activePlayer === 1 ? "#ff7ae0" : "#5a6a7a");
      }
      // prefs status, bottom-right of HUD so it never collides
      ctx.textAlign = "right";
      ctx.font = "11px 'Share Tech Mono', monospace";
      ctx.fillStyle = "rgba(140,160,180,0.9)";
      const flags = [];
      if (Input.prefs) {
        if (Input.prefs.autofire) flags.push("AUTO");
        if (Input.prefs.difficulty === "easy") flags.push("EASY");
        if (Input.prefs.muted) flags.push("MUTE");
        if (Input.prefs.lowfx) flags.push("LOWFX");
        if (Input.prefs.scanlines === false) flags.push("NOSCAN");
        if (Input.stickyAim) flags.push("STICKY-AIM");
      }
      if (flags.length) ctx.fillText(flags.join(" · "), w - 28, 54);

      if (Input.padCount && w > 1100) {
        ctx.fillStyle = "#7ef6ff";
        ctx.font = "11px 'Share Tech Mono', monospace";
        const px = w - 320;
        ctx.fillText(Input.dualPad ? "DUAL JOY" : "PAD", px, 54);
        this.drawStickGizmo(ctx, px + 62, 46, Input.moveX, Input.moveY, "#7ef6ff");
        this.drawStickGizmo(ctx, px + 96, 46, Input.shootX, Input.shootY, "#ff2bd6");
      }
    }

    drawStickGizmo(ctx, x, y, sx, sy, color) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + sx * 7, y + sy * 7, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    }

    renderBanner(ctx, title, sub) {
      const w = this.viewW;
      const h = this.viewH;
      ctx.save();
      const fade = this.state === STATE.INTRO ? clamp(1.15 - this.stateTime, 0, 1) : 1;
      ctx.globalAlpha = fade;
      ctx.fillStyle = "rgba(4,6,12,0.35)";
      ctx.fillRect(0, this.hudH + 8, w, h * 0.13);
      ctx.textAlign = "center";
      ctx.shadowColor = "#18e8ff";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#7ef6ff";
      ctx.font = `900 ${Math.round(Math.min(56, w * 0.044))}px Orbitron, sans-serif`;
      ctx.fillText(title, w / 2, this.hudH + h * 0.08);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ffe56a";
      ctx.font = "700 16px Orbitron, sans-serif";
      ctx.fillText(sub, w / 2, this.hudH + h * 0.115);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    renderEnd(ctx, win) {
      const w = this.viewW;
      const h = this.viewH;
      const t = this.stateTime;
      ctx.fillStyle = "rgba(4,6,12,0.62)";
      ctx.fillRect(0, 0, w, h);

      if (win) {
        ctx.save();
        ctx.translate(w / 2, h * 0.42);
        const rays = 12;
        ctx.rotate(t * 0.25);
        for (let i = 0; i < rays; i++) {
          ctx.rotate((Math.PI * 2) / rays);
          const g = ctx.createLinearGradient(0, 0, 0, -h * 0.45);
          g.addColorStop(0, "rgba(126,246,255,0.08)");
          g.addColorStop(1, "rgba(126,246,255,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(-14, 0);
          ctx.lineTo(14, 0);
          ctx.lineTo(70, -h * 0.45);
          ctx.lineTo(-70, -h * 0.45);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.textAlign = "center";
      if (win) {
        const pulse = 0.75 + 0.25 * Math.sin(t * 3.2);
        ctx.save();
        ctx.shadowColor = "#18e8ff";
        ctx.shadowBlur = 28;
        ctx.fillStyle = "#7ef6ff";
        ctx.font = `900 ${Math.round(Math.min(56, w * 0.046))}px Orbitron, sans-serif`;
        ctx.fillText("END OF TRANSMISSION", w / 2, h * 0.28);
        ctx.shadowColor = "#ff2bd6";
        ctx.fillStyle = "#ff7ae0";
        ctx.font = `900 ${Math.round(Math.min(42, w * 0.034))}px Orbitron, sans-serif`;
        ctx.fillText("2084 IS NOT SAVED — YET", w / 2, h * 0.36);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = "#ffe56a";
        ctx.font = "700 16px Orbitron, sans-serif";
        ctx.fillText("MAPPED SECTORS  1–" + MAX_WAVE + "  CLEARED", w / 2, h * 0.44);
        ctx.globalAlpha = 1;
        if (this.isNewBest) {
          ctx.fillStyle = "#ffe56a";
          ctx.shadowColor = "#ffe56a";
          ctx.shadowBlur = 16;
          ctx.font = "900 24px Orbitron, sans-serif";
          ctx.fillText("★ NEW BEST ★", w / 2, h * 0.485);
          ctx.shadowBlur = 0;
        }
        ctx.fillStyle = "rgba(220,230,255,0.88)";
        ctx.font = "15px 'Share Tech Mono', monospace";
        ctx.fillText("THE LAST HUMAN FAMILY LIVES.  THE NEXT WAVES ARE STILL BEING BUILT.", w / 2, h * 0.51);
        ctx.fillText("BRAINS, TANKS, AND WORSE ARE OUT THERE.  COME BACK FOR THE REST OF THE WAR.", w / 2, h * 0.555);
        ctx.fillStyle = "#fff";
        ctx.font = "700 22px Orbitron, sans-serif";
        ctx.fillText("SCORE  " + String(this.score).padStart(6, "0"), w / 2, h * 0.64);
        ctx.fillStyle = "#f7a";
        ctx.font = "16px 'Share Tech Mono', monospace";
        ctx.fillText("FAMILY SAVED  " + this.totalRescued, w / 2, h * 0.69);
        ctx.globalAlpha = 0.65 + 0.35 * Math.sin(t * 3.2);
        ctx.fillStyle = "#fff";
        ctx.font = "700 18px Orbitron, sans-serif";
        ctx.fillText("PRESS START TO HOLD THE LINE AGAIN", w / 2, h * 0.78);
        ctx.restore();
      } else {
        ctx.shadowColor = "#ff4466";
        ctx.shadowBlur = 22;
        ctx.fillStyle = "#ff6a7a";
        ctx.font = `900 ${Math.round(Math.min(60, w * 0.048))}px Orbitron, sans-serif`;
        ctx.fillText("GAME OVER", w / 2, h * 0.3);
        ctx.shadowBlur = 0;
        if (this.isNewBest) {
          ctx.fillStyle = "#ffe56a";
          ctx.font = "900 22px Orbitron, sans-serif";
          ctx.fillText("★ NEW BEST ★", w / 2, h * 0.37);
        }
        if (this.numPlayers === 2 && this.players) {
          ctx.fillStyle = "#fff";
          ctx.font = "700 20px Orbitron, sans-serif";
          ctx.fillText(`P1  ${String(this.players[0].score).padStart(6, "0")}  W${this.players[0].waveNum}      P2  ${String(this.players[1].score).padStart(6, "0")}  W${this.players[1].waveNum}`, w / 2, h * 0.45);
        } else {
          ctx.fillStyle = "#fff";
          ctx.font = "700 22px Orbitron, sans-serif";
          ctx.fillText("SCORE  " + String(this.score).padStart(6, "0"), w / 2, h * 0.45);
          ctx.fillStyle = "#ffe56a";
          ctx.font = "16px 'Share Tech Mono', monospace";
          ctx.fillText("WAVE " + this.waveNum + "  ·  FAMILY SAVED " + this.totalRescued, w / 2, h * 0.5);
        }
        // hall of fame
        if (this.hiscores.length) {
          ctx.fillStyle = "#ffe56a";
          ctx.font = "700 15px Orbitron, sans-serif";
          ctx.fillText("— HALL OF FAME —", w / 2, h * 0.57);
          ctx.font = "14px 'Share Tech Mono', monospace";
          this.hiscores.slice(0, 5).forEach((e, i) => {
            ctx.fillStyle = i === 0 ? "#ffe56a" : "rgba(255,255,255,0.85)";
            ctx.fillText(`${i + 1}. ${e.name}  ${String(e.score).padStart(6, "0")}  W${e.wave}`, w / 2, h * 0.57 + 20 + i * 18);
          });
        }
        ctx.fillStyle = "#fff";
        ctx.font = "700 18px Orbitron, sans-serif";
        ctx.globalAlpha = 0.65 + 0.35 * Math.sin(t * 3.2);
        ctx.fillText("PRESS START FOR TITLE", w / 2, h * 0.85);
        ctx.globalAlpha = 1;
      }
    }

    renderPause(ctx) {
      const w = this.viewW;
      const h = this.viewH;
      ctx.fillStyle = "rgba(4,6,12,0.72)";
      ctx.fillRect(0, 0, w, h);
      ctx.textAlign = "center";
      ctx.fillStyle = "#7ef6ff";
      ctx.shadowColor = "#18e8ff";
      ctx.shadowBlur = 18;
      ctx.font = "900 48px Orbitron, sans-serif";
      ctx.fillText("PAUSED", w / 2, h * 0.32);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff";
      ctx.font = "15px 'Share Tech Mono', monospace";
      ctx.fillText("MOVE WASD / LEFT STICK      FIRE ARROWS / IJKL / RIGHT STICK", w / 2, h * 0.40);
      ctx.fillText("DASH SHIFT / LB-RB / DOUBLE-TAP WASD  ·  CLICK TOGGLES STICKY-AIM  ·  F FULLSCREEN", w / 2, h * 0.44);
      const p = Input.prefs || {};
      ctx.fillStyle = "#ffe56a";
      ctx.font = "14px 'Share Tech Mono', monospace";
      ctx.fillText(`T AUTOFIRE [${p.autofire ? "ON" : "OFF"}]   E MODE [${(p.difficulty || "arcade").toUpperCase()}]   M ${p.muted ? "UNMUTE" : "MUTE"}   V LOW-FX [${p.lowfx ? "ON" : "OFF"}]   N SCANLINES [${p.scanlines === false ? "OFF" : "ON"}]`, w / 2, h * 0.52);
      ctx.fillStyle = "#8a95a5";
      ctx.font = "13px 'Share Tech Mono', monospace";
      ctx.fillText("TOUCH HUMANS TO SAVE  ·  GREEN HULKS ARE IMMUNE  ·  ORANGE SHOTS ARE ENEMY", w / 2, h * 0.58);
      ctx.fillStyle = "#ccc";
      ctx.font = "16px 'Share Tech Mono', monospace";
      const blink = 0.6 + 0.4 * Math.sin(this.time * 4);
      ctx.globalAlpha = blink;
      ctx.fillText("START / SPACE / ESC TO RESUME   ·   O OPERATOR", w / 2, h * 0.66);
      ctx.globalAlpha = 1;
    }

    renderAttractOverlay(ctx) {
      const w = this.viewW;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(4,6,12,0.35)";
      ctx.fillRect(0, this.hudH + 8, w, 52);
      ctx.fillStyle = "#ffe56a";
      ctx.shadowColor = "#ffe56a";
      ctx.shadowBlur = 14;
      ctx.font = "900 26px Orbitron, sans-serif";
      ctx.fillText("DEMO — INSERT COIN / PRESS START", w / 2, this.hudH + 42);
      ctx.shadowBlur = 0;
    }

    renderOperator(ctx) {
      const w = this.viewW;
      const h = this.viewH;
      const prefs = (window.Input && window.Input.prefs) || {};
      ctx.fillStyle = "rgba(4,6,12,0.85)";
      ctx.fillRect(0, 0, w, h);
      ctx.textAlign = "center";
      ctx.fillStyle = "#7ef6ff";
      ctx.shadowColor = "#18e8ff";
      ctx.shadowBlur = 18;
      ctx.font = "900 42px Orbitron, sans-serif";
      ctx.fillText("OPERATOR", w / 2, h * 0.24);
      ctx.shadowBlur = 0;
      const exLabel = prefs.extraLifeEvery === 0 ? "OFF" : String(prefs.extraLifeEvery);
      const rows = [
        ["EXTRA LIFE EVERY", exLabel],
        ["STARTING LIVES", String(prefs.startLives === 5 ? 5 : 3)],
        ["FREE PLAY", prefs.freePlay ? "ON" : "OFF"],
        ["ARCADE SPAWN (EXACT CENTER)", prefs.arcadeSpawn ? "ON" : "OFF"],
      ];
      ctx.font = "16px 'Share Tech Mono', monospace";
      rows.forEach((r, i) => {
        const y = h * 0.36 + i * 34;
        ctx.fillStyle = i === this.operatorRow ? "#ffe56a" : "rgba(255,255,255,0.85)";
        if (i === this.operatorRow) {
          ctx.shadowColor = "#ffe56a";
          ctx.shadowBlur = 10;
        } else ctx.shadowBlur = 0;
        ctx.fillText(`${i === this.operatorRow ? "> " : "  "}${r[0]}: ${r[1]}`, w / 2, y);
        ctx.shadowBlur = 0;
      });
      ctx.fillStyle = "#8a95a5";
      ctx.font = "13px 'Share Tech Mono', monospace";
      ctx.fillText("UP/DOWN SELECT · LEFT/RIGHT CHANGE · H WIPE HISCORES · C COIN", w / 2, h * 0.36 + 4 * 34 + 10);
      ctx.fillText(`CREDITS ${this.credits} · HISCORES ${this.hiscores.length}/10`, w / 2, h * 0.36 + 4 * 34 + 32);
      ctx.fillStyle = "#fff";
      ctx.font = "700 18px Orbitron, sans-serif";
      ctx.globalAlpha = 0.65 + 0.35 * Math.sin(this.time * 4);
      ctx.fillText("O / ESC TO EXIT", w / 2, h * 0.82);
      ctx.globalAlpha = 1;
    }

    renderEntry(ctx) {
      const w = this.viewW;
      const h = this.viewH;
      ctx.fillStyle = "rgba(4,6,12,0.85)";
      ctx.fillRect(0, 0, w, h);
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffe56a";
      ctx.shadowColor = "#ffe56a";
      ctx.shadowBlur = 20;
      ctx.font = "900 40px Orbitron, sans-serif";
      const who = this.numPlayers === 2 ? (this.entryPlayerIdx === 0 ? "P1 " : "P2 ") : "";
      ctx.fillText(who + "NEW HIGH SCORE!", w / 2, h * 0.3);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff";
      ctx.font = "700 24px 'Share Tech Mono', monospace";
      ctx.fillText(`${String(this.entryScore).padStart(6, "0")}  WAVE ${this.entryWave}`, w / 2, h * 0.38);
      ctx.font = "700 18px Orbitron, sans-serif";
      ctx.fillStyle = "#7ef6ff";
      ctx.fillText("ENTER INITIALS", w / 2, h * 0.46);
      // letters
      ctx.font = "900 64px Orbitron, sans-serif";
      this.entryInitials.forEach((ch, i) => {
        const x = w / 2 + (i - 1) * 64;
        const sel = i === this.entryPos;
        ctx.fillStyle = sel ? "#ffe56a" : "#fff";
        ctx.shadowColor = sel ? "#ffe56a" : "transparent";
        ctx.shadowBlur = sel ? 18 : 0;
        ctx.fillText(ch, x, h * 0.6);
        if (sel) {
          ctx.shadowBlur = 0;
          ctx.fillStyle = "#ffe56a";
          ctx.fillRect(x - 22, h * 0.6 + 12, 44, 3);
        }
      });
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#8a95a5";
      ctx.font = "14px 'Share Tech Mono', monospace";
      ctx.fillText("UP/DOWN OR TYPE A-Z · LEFT/RIGHT MOVE · START CONFIRM", w / 2, h * 0.7);
      if (this.entryQueue.length) {
        ctx.fillText(`${this.entryQueue.length} MORE TO ENTER`, w / 2, h * 0.74);
      }
    }
  }

  window.Game = Game;
})();
