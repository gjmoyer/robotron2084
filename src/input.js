(() => {
  const DEAD = 0.18;
  const KEY_MOVE = {
    KeyW: [0, -1], KeyS: [0, 1], KeyA: [-1, 0], KeyD: [1, 0],
    KeyZ: [-1, 0], KeyQ: [-1, 0],
  };
  const KEY_SHOOT = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    KeyI: [0, -1], KeyK: [0, 1], KeyJ: [-1, 0], KeyL: [1, 0],
  };

  function applyDead(x, y, dead = DEAD) {
    const m = Math.hypot(x, y);
    if (m < dead) return [0, 0, 0];
    const n = (m - dead) / (1 - dead);
    const s = Math.min(1, n) / m;
    return [x * s, y * s, Math.min(1, n)];
  }

  function stick(pad, ax, ay) {
    if (!pad || pad.axes.length <= Math.max(ax, ay)) return [0, 0, 0];
    return applyDead(pad.axes[ax] || 0, pad.axes[ay] || 0);
  }

  function hatToVec(pad) {
    if (!pad) return [0, 0];
    let x = 0, y = 0;
    if (pad.buttons[12]?.pressed) y -= 1;
    if (pad.buttons[13]?.pressed) y += 1;
    if (pad.buttons[14]?.pressed) x -= 1;
    if (pad.buttons[15]?.pressed) x += 1;
    return [x, y];
  }

  const Prefs = {
    key: "robotron2084_prefs_v1",
    data: { autofire: false, muted: false, lowfx: false, scanlines: true, difficulty: "arcade" },
    load() {
      try {
        const raw = localStorage.getItem(this.key);
        if (raw) Object.assign(this.data, JSON.parse(raw));
      } catch (_) {}
      // migrate old scanline pref if lowfx on
      if (this.data.lowfx) this.data.scanlines = false;
      return this.data;
    },
    save() {
      try {
        localStorage.setItem(this.key, JSON.stringify(this.data));
      } catch (_) {}
    },
    toggle(name) {
      if (name === "difficulty") {
        this.data.difficulty = this.data.difficulty === "easy" ? "arcade" : "easy";
      } else {
        this.data[name] = !this.data[name];
        if (name === "lowfx" && this.data.lowfx) this.data.scanlines = false;
      }
      this.save();
      return this.data[name] !== undefined ? this.data[name] : this.data.difficulty;
    },
  };
  Prefs.load();

  const Input = {
    keys: Object.create(null),
    moveX: 0,
    moveY: 0,
    shootX: 0,
    shootY: 0,
    shooting: false,
    mouseX: 0,
    mouseY: 0,
    mouseAim: false,
    stickyAim: false,
    mouseSeen: false,
    lastAimX: 0,
    lastAimY: -1,
    prefs: Prefs.data,
    togglePref(name) {
      const v = Prefs.toggle(name);
      if (name === "muted" && window.AudioFX) window.AudioFX.applyMute();
      return v;
    },
    padName: "",
    padCount: 0,
    dualPad: false,
    startEdge: false,
    pauseEdge: false,
    dashEdge: false,
    _startWas: false,
    _pauseWas: false,
    _dashWas: false,
    _lastTapT: 0,
    _lastTapX: 0,
    _lastTapY: 0,
    _doubleTapDash: false,
    _clickStart: false,
    startLatch: false,
    pauseLatch: false,

    attach(canvas) {
      this.canvas = canvas;
      window.addEventListener("keydown", (e) => {
        if (e.repeat) return;
        this.keys[e.code] = true;
        if (e.code === "Space" || e.code === "Enter") this.startLatch = true;
        if (e.code === "Escape" || e.code === "KeyP") this.pauseLatch = true;
        // playability toggles (work anywhere, no repeat)
        if (e.code === "KeyM") this.togglePref("muted");
        if (e.code === "KeyT") this.togglePref("autofire");
        if (e.code === "KeyE") this.togglePref("difficulty");
        if (e.code === "KeyV") this.togglePref("lowfx");
        if (e.code === "KeyN") this.togglePref("scanlines");
        // double-tap a move key = dash (same direction twice within 300ms)
        if (KEY_MOVE[e.code]) {
          const now = performance.now();
          const v = KEY_MOVE[e.code];
          const dtTap = now - (this._lastTapT || 0);
          if (dtTap < 300 && v[0] * this._lastTapX + v[1] * this._lastTapY > 0.5) {
            this._doubleTapDash = true;
          }
          this._lastTapT = now;
          this._lastTapX = v[0];
          this._lastTapY = v[1];
        }
        if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
          e.preventDefault();
        }
      });
      window.addEventListener("keyup", (e) => {
        this.keys[e.code] = false;
      });
      window.addEventListener("blur", () => {
        this.keys = Object.create(null);
      });
      canvas.addEventListener("mousemove", (e) => {
        const r = canvas.getBoundingClientRect();
        this.mouseX = e.clientX - r.left;
        this.mouseY = e.clientY - r.top;
        this.mouseSeen = true;
      });
      canvas.addEventListener("mousedown", (e) => {
        if (e.button === 0) {
          this.mouseAim = true;
          this._clickStart = true;
          // click toggles sticky aim during play so holding is not required
          const g = window.__game;
          if (g && (g.state === "play" || g.state === "intro")) {
            this.stickyAim = !this.stickyAim;
            // if turning sticky on without prior mouse move, aim where clicked
            const r = canvas.getBoundingClientRect();
            this.mouseX = e.clientX - r.left;
            this.mouseY = e.clientY - r.top;
            this.mouseSeen = true;
          }
        }
        if (e.button === 2) {
          this.stickyAim = false;
          this.mouseAim = false;
        }
      });
      canvas.addEventListener("contextmenu", (e) => e.preventDefault());
      window.addEventListener("mouseup", (e) => {
        if (e.button === 0) this.mouseAim = false;
      });
      window.addEventListener("gamepadconnected", () => this.update());
      window.addEventListener("gamepaddisconnected", () => this.update());
    },

    pads() {
      const raw = navigator.getGamepads ? navigator.getGamepads() : [];
      const list = [];
      for (let i = 0; i < raw.length; i++) if (raw[i]) list.push(raw[i]);
      return list;
    },

    rumble(ms = 40, weak = 0.2, strong = 0.35) {
      for (const pad of this.pads()) {
        const act = pad.vibrationActuator;
        if (act && act.playEffect) {
          act.playEffect("dual-rumble", {
            startDelay: 0,
            duration: ms,
            weakMagnitude: weak,
            strongMagnitude: strong,
          }).catch(() => {});
        }
      }
    },

    consumeStart() {
      if (this.startEdge || this._clickStart || this.startLatch) {
        this.startEdge = false;
        this._clickStart = false;
        this.startLatch = false;
        return true;
      }
      return false;
    },

    consumePause() {
      if (this.pauseEdge || this.pauseLatch) {
        this.pauseEdge = false;
        this.pauseLatch = false;
        return true;
      }
      return false;
    },

    consumeDash() {
      if (this.dashEdge) {
        this.dashEdge = false;
        return true;
      }
      return false;
    },

    update() {
      let mx = 0, my = 0, sx = 0, sy = 0;

      for (const code of Object.keys(this.keys)) {
        if (!this.keys[code]) continue;
        if (KEY_MOVE[code]) {
          mx += KEY_MOVE[code][0];
          my += KEY_MOVE[code][1];
        }
        if (KEY_SHOOT[code]) {
          sx += KEY_SHOOT[code][0];
          sy += KEY_SHOOT[code][1];
        }
      }

      const pads = this.pads();
      this.padCount = pads.length;
      this.dualPad = pads.length >= 2;
      this.padName = pads[0] ? (pads[0].id || "Gamepad").split("(")[0].trim() : "";

      if (pads.length >= 2) {
        const a = stick(pads[0], 0, 1);
        const hat = hatToVec(pads[0]);
        mx += a[0] || hat[0];
        my += a[1] || hat[1];
        const b = stick(pads[1], 0, 1);
        const b2 = stick(pads[1], 2, 3);
        const hat2 = hatToVec(pads[1]);
        const use = b[2] >= b2[2] ? b : b2;
        sx += use[0] || hat2[0];
        sy += use[1] || hat2[1];
      } else if (pads[0]) {
        const pad = pads[0];
        const left = stick(pad, 0, 1);
        const right = stick(pad, 2, 3);
        const hat = hatToVec(pad);
        mx += left[0] || hat[0];
        my += left[1] || hat[1];
        sx += right[0];
        sy += right[1];
      }

      const km = Math.hypot(mx, my);
      if (km > 1) {
        mx /= km;
        my /= km;
      }
      const ks = Math.hypot(sx, sy);
      if (ks > 1) {
        sx /= ks;
        sy /= ks;
      }

      this.moveX = mx;
      this.moveY = my;
      // autofire fallback: keep firing last direction when enabled
      if (this.prefs?.autofire && Math.hypot(sx, sy) < 0.22) {
        if (Math.hypot(this.lastAimX, this.lastAimY) > 0.2) {
          sx = this.lastAimX;
          sy = this.lastAimY;
        }
      }
      if (Math.hypot(sx, sy) > 0.22) {
        const m = Math.hypot(sx, sy);
        this.lastAimX = sx / m;
        this.lastAimY = sy / m;
      }
      this.shootX = sx;
      this.shootY = sy;
      this.shooting = ks > 0.25 || this.mouseAim || this.stickyAim || (this.prefs?.autofire && Math.hypot(sx, sy) > 0.2);

      let start = !!(this.keys.Space || this.keys.Enter || this.keys.KeyF);
      let pause = !!(this.keys.Escape || this.keys.KeyP);
      let dash = !!(this.keys.ShiftLeft || this.keys.ShiftRight);
      for (const pad of pads) {
        if (pad.buttons[0]?.pressed || pad.buttons[9]?.pressed) start = true;
        if (pad.buttons[8]?.pressed) pause = true;
        // LB / RB / stick-clicks = dash; left/right triggers stay analog-free
        if (pad.buttons[4]?.pressed || pad.buttons[5]?.pressed || pad.buttons[10]?.pressed || pad.buttons[11]?.pressed) dash = true;
      }
      if (this._doubleTapDash) {
        dash = true;
        this._doubleTapDash = false;
      }
      this.startEdge = start && !this._startWas;
      this.pauseEdge = pause && !this._pauseWas;
      this.dashEdge = dash && !this._dashWas;
      this._startWas = start;
      this._pauseWas = pause;
      this._dashWas = dash;
    },
  };

  window.Input = Input;
})();
