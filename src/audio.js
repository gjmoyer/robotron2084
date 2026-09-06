(() => {
  const FILES = {
    laser: "assets/sounds/laser.wav",
    turbo: "assets/sounds/turbo.wav",
    cannon: "assets/sounds/cannon.wav",
    rescue: "assets/sounds/rescue.wav",
    lite: "assets/sounds/lite.wav",
    start: "assets/sounds/start.wav",
    waveend: "assets/sounds/waveend.wav",
    extralife: "assets/sounds/extralife.wav",
    ui: "assets/sounds/ui.wav",
    scream: "assets/sounds/scream.wav",
    appear: "assets/sounds/appear.wav",
    ninth: "assets/sounds/ninth.wav",
    saw: "assets/sounds/vari_saw.wav",
    quasar: "assets/sounds/vari_quasar.wav",
    cscale: "assets/sounds/vari_cscale.wav",
    hulk: "assets/sounds/hulk.wav",
    gruntstep: "assets/sounds/gruntstep.wav",
    spheroidspawn: "assets/sounds/spheroidspawn.wav",
    quarkspawn: "assets/sounds/quarkspawn.wav",
    tankfire: "assets/sounds/tankfire.wav",
    bounce: "assets/sounds/bounce.wav",
    tankboom: "assets/sounds/tankboom.wav",
    brainstart: "assets/sounds/brainstart.wav",
    progstart: "assets/sounds/progstart.wav",
    progdone: "assets/sounds/progdone.wav",
    startup: "assets/sounds/startup.wav",
    hiscore: "assets/sounds/hiscore.wav",
    bg0: "assets/sounds/bg0.wav",
    bg1: "assets/sounds/bg1.wav",
    bg2: "assets/sounds/bg2.wav",
    bg3: "assets/sounds/bg3.wav",
  };

  const AudioFX = {
    ctx: null,
    master: null,
    ready: false,
    buffers: {},
    voice: null,
    laserVoice: null,
    bg: null,
    bgGain: null,
    bgIndex: -1,
    timers: [],
    _lastTick: -1000,
    // Bump when a wav is regenerated or game.js ?v= is bumped, so the
    // browser refetches sounds instead of decoding stale cached copies.
    assetV: "?v=7",

    async load() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!this.ctx) {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.42;
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -16;
        comp.knee.value = 12;
        comp.ratio.value = 4;
        comp.attack.value = 0.002;
        comp.release.value = 0.08;
        this.master.connect(comp);
        comp.connect(this.ctx.destination);
      }
      const entries = Object.entries(FILES);
      await Promise.all(
        entries.map(async ([key, url]) => {
          const res = await fetch(url + this.assetV);
          const raw = await res.arrayBuffer();
          this.buffers[key] = await this.ctx.decodeAudioData(raw.slice(0));
        })
      );
      this.ready = true;
    },

    resume() {
      if (this.ctx && this.ctx.state !== "running") this.ctx.resume();
      this.applyMute();
    },

    applyMute() {
      try {
        const muted = !!(window.Input && window.Input.prefs && window.Input.prefs.muted);
        if (this.master && this.ctx) {
          this.master.gain.setTargetAtTime(muted ? 0 : 0.42, this.ctx.currentTime, 0.05);
        }
      } catch (_) {}
    },

    _stopVoice() {
      if (this.voice) {
        try {
          this.voice.stop();
        } catch (_) {}
        try {
          this.voice.disconnect();
        } catch (_) {}
        this.voice = null;
      }
      for (const id of this.timers) clearTimeout(id);
      this.timers.length = 0;
    },

    _stopLaser() {
      if (this.laserVoice) {
        try {
          this.laserVoice.stop();
        } catch (_) {}
        try {
          this.laserVoice.disconnect();
        } catch (_) {}
        this.laserVoice = null;
      }
    },

    _play(name, pan = 0, when = 0, dur = 0) {
      if (!this.ready || !this.buffers[name]) return;
      const src = this.ctx.createBufferSource();
      src.buffer = this.buffers[name];
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = Math.max(-0.8, Math.min(0.8, pan));
      const t = this.ctx.currentTime + when;
      // dur caps long renders (e.g. VARI sweeps) on frequent events — the
      // original board preempted tails via IRQ; here we fade instead of click.
      if (dur > 0 && dur < src.buffer.duration) {
        const g = this.ctx.createGain();
        const fade = Math.min(0.05, dur * 0.25);
        g.gain.setValueAtTime(1, t);
        g.gain.setValueAtTime(1, Math.max(t, t + dur - fade));
        g.gain.linearRampToValueAtTime(0, t + dur);
        src.connect(g);
        g.connect(panner);
        panner.connect(this.master);
        src.start(t);
        try {
          src.stop(t + dur + 0.02);
        } catch (_) {}
        return src;
      }
      src.connect(panner);
      panner.connect(this.master);
      src.start(t);
      return src;
    },

    fire(name, pan = 0) {
      if (!this.ready) return;
      this._stopVoice();
      this._stopLaser();
      this.voice = this._play(name, pan);
    },

    sequence(steps, pan = 0) {
      if (!this.ready) return;
      this._stopVoice();
      this._stopLaser();
      this.voice = this._play(steps[0].name, pan);
      for (let i = 1; i < steps.length; i++) {
        const step = steps[i];
        const id = setTimeout(() => {
          if (this.voice) {
            try {
              this.voice.stop();
            } catch (_) {}
          }
          this.voice = this._play(step.name, pan);
        }, step.ms);
        this.timers.push(id);
      }
    },

    shot(pan = 0) {
      // Own exclusive slot: retriggers like the original DAC so rapid fire
      // stays crisp (one laser tail max) and never cuts rescue/death on voice.
      if (!this.ready) return;
      this._stopLaser();
      this.laserVoice = this._play("laser", pan);
    },

    tick(pan = 0) {
      // hatch wind-up warning — quiet layered blip, throttled so 5 spheroids can't stack
      const now = performance.now();
      if (now - this._lastTick < 90) return;
      this._lastTick = now;
      this._play("ui", pan);
    },

    gruntStep(pan = 0) {
      const now = performance.now();
      if (now - (this._lastStep || 0) < 140) return;
      this._lastStep = now;
      this._play("gruntstep", pan, 0, 0.09);
    },

    spheroidSpawn(pan = 0) {
      this._play("spheroidspawn", pan, 0, 0.3);
    },

    quarkSpawn(pan = 0) {
      this._play("quarkspawn", pan, 0, 0.3);
    },

    startup() {
      this.fire("startup");
    },

    hiscore() {
      this.fire("hiscore");
    },

    coin() {
      this.fire("ui");
    },

    gruntDie(pan = 0) {
      // RBSND: $14 TURBO for 12*16ms, then $17 CANNON
      this.sequence(
        [
          { name: "turbo", ms: 0 },
          { name: "cannon", ms: 192 },
        ],
        pan
      );
    },

    electrodeHit(pan = 0) {
      // PSKSND: $17 CANNON
      this.fire("cannon", pan);
    },

    rescue(pan = 0) {
      // SAVSND: $0D ED17
      this.fire("rescue", pan);
    },

    humanDie(pan = 0) {
      // HKSND: $1A SCREAM
      this.fire("scream", pan);
    },

    playerDie() {
      // PDSND: $11 LITE ×2, then $17 CANNON
      this.sequence([
        { name: "lite", ms: 0 },
        { name: "cannon", ms: 256 },
      ]);
    },

    extraLife() {
      this.fire("extralife");
    },

    waveStart() {
      this.fire("start");
    },

    waveClear() {
      this.fire("waveend");
    },

    waveFanfare() {
      this._play("ninth");
      // CSCALE ascending layer, cut to fit the 1.7s fanfare window before waveStart
      this._play("cscale", 0, 0, 1.5);
    },

    ui() {
      this.fire("ui");
    },

    spawn() {
      this.fire("appear");
    },

    dash(pan = 0) {
      // evasive burst whoosh — layered voice so it never cuts rescue/death
      this._play("turbo", pan);
    },

    hatchPop() {
      // VARI QUASAR attack cut — alien wobble for Enforcer/Tank hatches
      this._play("quasar", 0, 0, 0.5);
    },

    brainFire(pan = 0) {
      this._play("brainstart", pan);
    },

    brainDie(pan = 0) {
      this.sequence(
        [
          { name: "scream", ms: 0 },
          { name: "cannon", ms: 180 },
        ],
        pan
      );
    },

    convertStart() {
      this._play("progstart");
    },

    convertDone() {
      this._play("progdone");
    },

    tankFire(pan = 0) {
      this._play("tankfire", pan);
    },

    tankBounce() {
      this._play("bounce");
    },

    tankDie(pan = 0) {
      this.fire("tankboom", pan);
    },

    quarkDie(pan = 0) {
      this.spheroidDie(pan);
    },

    hulkHit(pan = 0) {
      this.fire("hulk", pan);
    },

    enforcerShot(pan = 0) {
      // ENFSND $1D VARI SAW, attack cut: the full 1.9s sweep would stack
      // across volleys on the layered slot, so play the opening snarl only.
      this._play("saw", pan, 0, 0.32);
    },

    spheroidDie(pan = 0) {
      this.sequence(
        [
          { name: "turbo", ms: 0 },
          { name: "cannon", ms: 120 },
        ],
        pan
      );
    },

    setTension(t) {
      if (!this.ready) return;
      const k = Math.max(0, Math.min(1, t));
      const idx = k < 0.05 ? -1 : k < 0.35 ? 0 : k < 0.6 ? 1 : k < 0.85 ? 2 : 3;
      if (idx !== this.bgIndex) {
        this.bgIndex = idx;
        if (this.bg) {
          try {
            this.bg.stop();
          } catch (_) {}
          this.bg = null;
        }
        if (idx < 0) {
          if (this.bgGain) this.bgGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
          return;
        }
        const g = this.bgGain || this.ctx.createGain();
        this.bgGain = g;
        g.gain.value = 0.0;
        g.connect(this.master);
        const src = this.ctx.createBufferSource();
        src.buffer = this.buffers["bg" + idx];
        src.loop = true;
        src.connect(g);
        src.start();
        this.bg = src;
      }
      if (this.bgGain) {
        this.bgGain.gain.setTargetAtTime(idx < 0 ? 0 : 0.07 + k * 0.1, this.ctx.currentTime, 0.2);
      }
    },
  };

  window.AudioFX = AudioFX;
})();
