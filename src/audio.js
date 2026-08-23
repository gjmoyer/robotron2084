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
    bg: null,
    bgGain: null,
    bgIndex: -1,
    timers: [],

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
          const res = await fetch(url);
          const raw = await res.arrayBuffer();
          this.buffers[key] = await this.ctx.decodeAudioData(raw.slice(0));
        })
      );
      this.ready = true;
    },

    resume() {
      if (this.ctx && this.ctx.state !== "running") this.ctx.resume();
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

    _play(name, pan = 0, when = 0) {
      if (!this.ready || !this.buffers[name]) return;
      const src = this.ctx.createBufferSource();
      src.buffer = this.buffers[name];
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = Math.max(-0.8, Math.min(0.8, pan));
      src.connect(panner);
      panner.connect(this.master);
      const t = this.ctx.currentTime + when;
      src.start(t);
      return src;
    },

    fire(name, pan = 0) {
      if (!this.ready) return;
      this._stopVoice();
      this.voice = this._play(name, pan);
    },

    sequence(steps, pan = 0) {
      if (!this.ready) return;
      this._stopVoice();
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
      this.fire("laser", pan);
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
    },

    ui() {
      this.fire("ui");
    },

    spawn() {
      this.fire("appear");
    },

    hatchPop() {
      this._play("appear");
    },

    brainFire(pan = 0) {
      this._play("lite", pan);
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
      this._play("appear");
    },

    convertDone() {
      this._play("ui");
    },

    hulkHit(pan = 0) {
      this.fire("ui", pan);
    },

    enforcerShot(pan = 0) {
      this._play("ui", pan);
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
