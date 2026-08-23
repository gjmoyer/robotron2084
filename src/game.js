(() => {
  const STATE = {
    TITLE: "title",
    INTRO: "intro",
    PLAY: "play",
    DEAD: "dead",
    CLEAR: "clear",
    OVER: "over",
    PAUSE: "pause",
    TRANS: "trans",
  };

  const HS_KEY = "robotron2084_hs";
  const HS_KEY_OLD = "robotron2084_wave1_hs";
  const MAX_WAVE = 3;

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
      hatchFirst: 1.4,
      hatchNext: 0.55,
      quotaMin: 4,
      quotaMax: 6,
      fireMin: 0.18,
      fireMax: 0.34,
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
      hatchFirst: 1.15,
      hatchNext: 0.42,
      quotaMin: 5,
      quotaMax: 8,
      fireMin: 0.14,
      fireMax: 0.28,
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
      hatchFirst: 0.85,
      hatchNext: 0.28,
      quotaMin: 6,
      quotaMax: 8,
      fireMin: 0.1,
      fireMax: 0.2,
      subtitle: "SPHEROID STORM",
    },
  ];

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
      this.player = null;
      this.grunts = [];
      this.humans = [];
      this.hulks = [];
      this.spheroids = [];
      this.enforcers = [];
      this.sparks = [];
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

    startGame() {
      this.score = 0;
      this.lives = 3;
      this.humanChain = 0;
      this.rescued = 0;
      this.totalRescued = 0;
      this.waveNum = 1;
      this.extraAwarded = 0;
      this.waveTime = 0;
      FX.reset();
      this.buildWave();
      this.setState(STATE.INTRO);
      AudioFX.waveStart();
    }

    waveSpec() {
      return WAVES[this.waveNum] || WAVES[1];
    }

    hostilesLeft() {
      const n = (arr) => arr.filter((e) => e.alive).length;
      return n(this.grunts) + n(this.spheroids) + n(this.enforcers);
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
        alive: true,
      };
    }

    spawnPlayer(center) {
      const { x, y, w, h } = this.arena;
      this.player = {
        x: x + w * 0.5,
        y: y + h * 0.5,
        vx: 0,
        vy: 0,
        r: this.minDim * 0.022,
        face: "s",
        aimX: 0,
        aimY: -1,
        anim: 0,
        invuln: 2.05,
        alive: true,
        spawn: center ? 0 : 1,
      };
    }

    addScore(n, x, y, label) {
      this.score += n;
      if (this.score > this.high) {
        this.high = this.score;
        localStorage.setItem(HS_KEY, String(this.high));
      }
      if (this.score >= 25000 && this.extraAwarded < 1) {
        this.extraAwarded = 1;
        this.lives += 1;
        AudioFX.extraLife();
        FX.scorePop(this.player.x, this.player.y - 70, "EXTRA LIFE", "#7ef6ff");
      }
      if (label) FX.scorePop(x, y - 24, label);
    }

    update(dt) {
      this.time += dt;
      this.stateTime += dt;
      this.titlePulse += dt;
      Input.update();

      if (this.state === STATE.TITLE) {
        if (Input.consumeStart()) {
          AudioFX.resume();
          AudioFX.ui();
          this.startGame();
        }
        return;
      }

      if (this.state === STATE.PAUSE) {
        if (Input.consumePause() || Input.consumeStart()) {
          this.setState(this.pausedFrom);
        }
        return;
      }

      if (this.state === STATE.CLEAR || this.state === STATE.OVER) {
        if (Input.consumeStart()) {
          AudioFX.ui();
          this.startGame();
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
        if (this.stateTime >= 1.35) this.setState(STATE.PLAY);
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
        this.waveNum += 1;
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
      this.transBeat = 0;
      this.setState(STATE.TRANS);
    }

    updatePlay(dt) {
      Input.startLatch = false;
      this.updateSpawns(dt);
      this.updatePlayer(dt);
      this.updateHumans(dt);
      this.updateGrunts(dt);
      this.updateHulks(dt);
      this.updateSpheroids(dt);
      this.updateEnforcers(dt);
      this.updateBullets(dt);
      this.updateSparks(dt);
      this.collide();

      const live = this.hostilesLeft();
      const spec = this.waveSpec();
      const denom = Math.max(1, spec.grunts);
      AudioFX.setTension(clamp(this.waveTime / 38, 0, 1) * 0.55 + (1 - live / denom) * 0.2);
      if (live === 0) {
        if (this.waveNum < MAX_WAVE) this.beginTransition();
        else {
          this.setState(STATE.CLEAR);
          AudioFX.setTension(0);
          AudioFX.waveClear();
          FX.addFlash(0.55, "rgba(80,255,180,0.22)");
          FX.addShake(8);
        }
      }
    }

    updateDead(dt) {
      this.updateHumans(dt * 0.35);
      this.updateGrunts(dt * 0.15);
      this.updateHulks(dt * 0.2);
      this.updateSpheroids(dt * 0.2);
      this.updateEnforcers(dt * 0.15);
      this.updateSparks(dt);
      if (this.stateTime > 1.55) {
        if (this.lives > 0) {
          this.spawnPlayer(true);
          this.player.spawn = 0;
          AudioFX.spawn();
          this.setState(STATE.PLAY);
        } else {
          this.setState(STATE.OVER);
          AudioFX.setTension(0);
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
      p.vx = ix * speed;
      p.vy = iy * speed;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      this.clampEntity(p);

      let ax = Input.shootX;
      let ay = Input.shootY;
      if (Input.mouseAim) {
        const [wx, wy] = this.screenToWorld(Input.mouseX, Input.mouseY);
        const [nx, ny] = norm(wx - p.x, wy - p.y);
        ax = nx;
        ay = ny;
      }
      if (Math.hypot(ax, ay) > 0.2) {
        p.aimX = ax;
        p.aimY = ay;
        p.face = facingFrom(ax, ay);
      } else if (Math.hypot(ix, iy) > 0.15) {
        p.face = facingFrom(ix, iy);
      }

      const moving = Math.hypot(ix, iy) > 0.12;
      p.anim += dt * (moving ? 8.5 : 0);

      this.fireCd -= dt;
      const shooting = Math.hypot(ax, ay) > 0.22;
      if (shooting && this.fireCd <= 0 && this.bullets.length < 8) {
        this.fireCd = 0.055;
        const [nx, ny] = norm(ax, ay);
        const muzzle = m * 0.045;
        this.bullets.push({
          x: p.x + nx * muzzle,
          y: p.y - m * 0.045 + ny * muzzle,
          vx: nx * m * 1.4,
          vy: ny * m * 1.4,
          r: m * 0.011,
          life: 1.1,
          trail: [],
        });
        const pan = ((p.x - this.arena.x) / this.arena.w) * 2 - 1;
        AudioFX.shot(pan);
        Input.rumble(18, 0.08, 0.18);
        FX.burst(p.x + nx * muzzle, p.y - m * 0.045 + ny * muzzle, "#9ffff6", 6, 180, 2.1, 0.18);
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
      for (const h of this.humans) {
        if (!h.alive) continue;
        h.think -= dt;
        if (h.think <= 0) {
          const a = Math.random() * Math.PI * 2;
          h.vx = Math.cos(a);
          h.vy = Math.sin(a);
          h.think = rand(0.4, 1.25);
        }
        h.x += h.vx * speed * dt;
        h.y += h.vy * speed * dt;
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
        h.face = facingFrom(h.vx, h.vy);
        h.anim += dt * 7;
      }
    }

    updateGrunts(dt) {
      const p = this.player;
      const t = this.waveTime;
      const mul = this.waveSpec().gruntMul || 1;
      const base = this.minDim * (0.115 + Math.min(0.42, t * 0.011)) * mul;
      const live = this.grunts.filter((g) => g.alive);
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
        fire: rand(0.12, 0.35),
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
      const cap = 8;
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
        if (s.hatch <= 0.22) s.pulse = Math.max(s.pulse, 0.22);
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
      const speed = this.minDim * 0.24;
      const m = this.minDim;
      for (const e of this.enforcers) {
        if (!e.alive) continue;
        e.weave += dt * 7;
        if (p && p.alive) {
          const [nx, ny] = norm(p.x - e.x, p.y - e.y);
          const wx = -ny * Math.sin(e.weave) * 0.45;
          const wy = nx * Math.sin(e.weave) * 0.45;
          e.vx = nx + wx;
          e.vy = ny + wy;
          const [ux, uy] = norm(e.vx, e.vy);
          e.x += ux * speed * dt;
          e.y += uy * speed * dt;
          this.clampEntity(e);
          e.fire -= dt;
          if (e.fire <= 0 && this.sparks.length < 20) {
            e.fire = rand(spec.fireMin, spec.fireMax);
            const jitter = m * 0.045;
            const tx = p.x + (Math.random() - 0.5) * jitter * 2;
            const ty = p.y + (Math.random() - 0.5) * jitter * 2;
            const [ax, ay] = norm(tx - e.x, ty - e.y);
            const dist = Math.hypot(p.x - e.x, p.y - e.y);
            const close = clamp(dist / (m * 0.22), 0.55, 1);
            const spd = m * (0.92 * close);
            this.sparks.push({
              x: e.x,
              y: e.y - m * 0.018,
              vx: ax * spd,
              vy: ay * spd,
              r: m * 0.011,
              life: 2.8,
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
        if (s.x < x + pad) {
          s.x = x + pad;
          s.vx = Math.abs(s.vx) * 0.85;
        } else if (s.x > x + w - pad) {
          s.x = x + w - pad;
          s.vx = -Math.abs(s.vx) * 0.85;
        }
        if (s.y < y + pad) {
          s.y = y + pad;
          s.vy = Math.abs(s.vy) * 0.85;
        } else if (s.y > y + h - pad) {
          s.y = y + h - pad;
          s.vy = -Math.abs(s.vy) * 0.85;
        }
        if (s.life <= 0) this.sparks.splice(i, 1);
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
              FX.burst(s.x, s.y, "#ff7ae0", 28, 320, 3.6, 0.45);
              FX.ring(s.x, s.y, "#ffa0e8", 0.35);
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
              FX.burst(sp.x, sp.y, "#ff9adf", 8, 160, 2, 0.2);
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

      if (!p || !p.alive) return;

      // rescue
      for (const h of this.humans) {
        if (!h.alive) continue;
        if (Math.hypot(p.x - h.x, p.y - h.y) < p.r + h.r + 6) {
          h.alive = false;
          const pts = [1000, 2000, 3000, 4000, 5000][this.humanChain % 5];
          this.humanChain += 1;
          this.rescued += 1;
          this.addScore(pts, h.x, h.y, String(pts));
          this.totalRescued += 1;
          AudioFX.rescue(panOf(h));
          Input.rumble(80, 0.2, 0.45);
          FX.burst(h.x, h.y, "#fff", 20, 200, 2.8, 0.4);
          const ring = h.kind === "mommy" ? "#ff7ae0" : h.kind === "mikey" ? "#ffe56a" : "#7eb6ff";
          FX.ring(h.x, h.y, ring, 0.4);
          FX.addFlash(0.18, "rgba(255,255,180,0.16)");
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
    }

    killGrunt(g, scored = true) {
      if (scored) this.addScore(100, g.x, g.y, "100");
      const pan = ((g.x - this.arena.x) / this.arena.w) * 2 - 1;
      AudioFX.gruntDie(pan);
      FX.burst(g.x, g.y - 10, "#ff4a3a", 26, 300, 3.4, 0.42);
      FX.burst(g.x, g.y - 10, "#ffd36a", 10, 180, 2.2, 0.28);
      FX.ring(g.x, g.y, "#ff6a3a", 0.26);
      FX.addShake(2.4);
      FX.hitstop = 0.03;
      Input.rumble(30, 0.12, 0.3);
    }

    killPlayer() {
      const p = this.player;
      if (!p || !p.alive) return;
      p.alive = false;
      this.lives -= 1;
      this.humanChain = 0;
      this.bullets = [];
      this.sparks = [];
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
      const base = kind;
      if (face === "e") return s[base + "_e"];
      if (face === "w") return s[base + "_w"];
      if (walking) return frame % 2 === 0 ? s[base + "_s_w0"] : s[base + "_s_w1"];
      return s[base + "_s"];
    }

    drawSprite(ctx, img, x, footY, height, spawn = 1, flicker = 1, bob = 0) {
      if (!img || flicker <= 0) return;
      const aspect = img.width / img.height;
      const w = height * aspect;
      footY -= bob;
      ctx.save();
      ctx.globalAlpha *= flicker;
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

      this.renderScanlines(ctx);
      this.renderHUD(ctx);

      if (this.state === STATE.INTRO) {
        this.renderBanner(ctx, "WAVE " + this.waveNum, this.waveSpec().subtitle);
      }
      if (this.state === STATE.DEAD && this.lives > 0) this.renderBanner(ctx, "DESTROYED", "GET READY");
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

      this.renderScanlines(ctx);

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
      ctx.fillText("WAVES 1–3", w / 2, h * 0.18 + Math.min(118, w * 0.095));

      ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.font = "16px 'Share Tech Mono', monospace";
      ctx.fillText("SAVE THE LAST HUMAN FAMILY  ·  DESTROY THE GRUNTS  ·  AVOID THE HULKS", w / 2, h * 0.78);

      const pulse = 0.65 + 0.35 * Math.sin(this.titlePulse * 3.2);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = "#fff";
      ctx.font = "700 22px Orbitron, sans-serif";
      ctx.fillText("PRESS START  /  SPACE  /  CLICK", w / 2, h * 0.84);
      ctx.globalAlpha = 1;

      ctx.font = "14px 'Share Tech Mono', monospace";
      ctx.fillStyle = "#9fd";
      const padLine = Input.padCount
        ? Input.dualPad
          ? `TWO JOYSTICKS  ·  STICK 1 MOVE   STICK 2 FIRE   ·  ${Input.padName}`
          : `GAMEPAD  ·  LEFT STICK MOVE   RIGHT STICK FIRE 360°   ·  ${Input.padName}`
        : "NO GAMEPAD  ·  WASD MOVE   ARROWS FIRE   ·  MOUSE AIM + CLICK";
      ctx.fillText(padLine, w / 2, h * 0.89);
      ctx.fillStyle = "#889";
      ctx.fillText("HIGH SCORE  " + String(this.high).padStart(6, "0") + "    ·    F  FULLSCREEN", w / 2, h * 0.935);
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
        ctx.globalAlpha = 0.38;
        const tile = Math.max(280, this.minDim * 0.38);
        for (let ty = y - 20; ty < y + h; ty += tile) {
          for (let tx = x - 20; tx < x + w; tx += tile) {
            ctx.drawImage(floor, tx, ty, tile, tile);
          }
        }
        ctx.globalAlpha = 1;
      }

      const step = Math.max(48, this.minDim * 0.055);
      ctx.strokeStyle = "rgba(40, 220, 255, 0.07)";
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

      // energy walls
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
      if (this.player && this.player.alive) {
        drawables.push({ z: this.player.y, kind: "player", e: this.player });
      }
      drawables.sort((a, b) => a.z - b.z);

      this.renderBullets(ctx);
      this.renderSparks(ctx);

      for (const d of drawables) {
        if (d.kind === "electrode") this.renderElectrode(ctx, d.e);
        if (d.kind === "grunt") {
          const g = d.e;
          this.drawShadow(ctx, g.x, g.y, m * 0.028, m * 0.01);
          const img = this.spriteFor("grunt", g.face, true, Math.floor(g.anim));
          const bob = Math.abs(Math.sin(g.anim * Math.PI)) * m * 0.006;
          this.drawSprite(ctx, img, g.x, g.y, m * 0.105, g.spawn, 1, bob);
        }
        if (d.kind === "human") {
          const h = d.e;
          const hh = h.kind === "mikey" ? m * 0.086 : m * 0.118;
          this.drawShadow(ctx, h.x, h.y, m * 0.018, m * 0.007);
          const img = this.spriteFor(h.kind, h.face, true, Math.floor(h.anim));
          const bob = Math.abs(Math.sin(h.anim * Math.PI)) * m * 0.005;
          this.drawSprite(ctx, img, h.x, h.y, hh, h.spawn, 1, bob);
        }
        if (d.kind === "hulk") {
          const h = d.e;
          this.drawShadow(ctx, h.x, h.y, m * 0.036, m * 0.012);
          const img = this.spriteFor("hulk", h.face, true, Math.floor(h.anim));
          const bob = Math.abs(Math.sin(h.anim * Math.PI)) * m * 0.004;
          const flick = h.flash > 0 ? 0.55 + 0.45 * Math.sin(this.time * 40) : 1;
          this.drawSprite(ctx, img, h.x, h.y, m * 0.155, h.spawn, flick, bob);
        }
        if (d.kind === "spheroid") this.renderSpheroid(ctx, d.e);
        if (d.kind === "enforcer") this.renderEnforcer(ctx, d.e);
        if (d.kind === "player") {
          const p = d.e;
          ctx.save();
          ctx.strokeStyle = "rgba(126,246,255,0.55)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y + 3, m * 0.028, m * 0.01, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          this.drawShadow(ctx, p.x, p.y, m * 0.024, m * 0.009);
          const moving = Math.hypot(p.vx, p.vy) > 8;
          const img = this.spriteFor("player", p.face, moving, Math.floor(p.anim));
          let flick = 1;
          if (p.invuln > 0) flick = Math.sin(this.time * 28) > 0 ? 1 : 0.25;
          const bob = moving ? Math.abs(Math.sin(p.anim * Math.PI)) * m * 0.007 : 0;
          this.drawSprite(ctx, img, p.x, p.y, m * 0.13, p.spawn, flick, bob);
          if (Math.hypot(Input.shootX, Input.shootY) > 0.22 || Input.mouseAim) {
            this.renderAim(ctx, p);
          }
        }
      }
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
      const windup = s.hatch < 0.25 && s.alive ? 1 + (0.25 - s.hatch) * 2.4 : 1;
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

    renderSparks(ctx) {
      for (const s of this.sparks) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.spin || 0);
        ctx.strokeStyle = "#ff7ae0";
        ctx.fillStyle = "#ffd0f0";
        ctx.shadowColor = "#ff4ab0";
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
      const next = WAVES[this.waveNum + 1];
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
        const nextNum = this.waveNum + 1;
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
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      for (let y = 0; y < this.viewH; y += 3) ctx.fillRect(0, y, this.viewW, 1);
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
      ctx.fillStyle = "#6a7";
      ctx.fillText("SCORE", 28, 24);
      ctx.fillStyle = "#fff";
      ctx.font = "700 30px 'Share Tech Mono', monospace";
      ctx.fillText(String(this.score).padStart(6, "0"), 28, 54);

      ctx.textAlign = "center";
      ctx.font = "700 13px Orbitron, sans-serif";
      ctx.fillStyle = "#6a7";
      ctx.fillText("HIGH", w / 2, 24);
      ctx.fillStyle = "#ffe56a";
      ctx.font = "700 28px 'Share Tech Mono', monospace";
      ctx.fillText(String(this.high).padStart(6, "0"), w / 2, 54);

      ctx.textAlign = "right";
      ctx.font = "700 15px Orbitron, sans-serif";
      ctx.fillStyle = "#6a7";
      ctx.fillText("WAVE " + this.waveNum, w - 28, 26);

      const lifeImg = this.sprites.player_s;
      const lh = 28;
      for (let i = 0; i < this.lives; i++) {
        if (!lifeImg) continue;
        const aspect = lifeImg.width / lifeImg.height;
        const lw = lh * aspect;
        ctx.drawImage(lifeImg, w - 36 - lw - i * (lw + 8), 32, lw, lh);
      }

      const left = this.hostilesLeft();
      const need = this.waveSpec().humans;
      ctx.textAlign = "left";
      ctx.font = "13px 'Share Tech Mono', monospace";
      ctx.fillStyle = "#f66";
      ctx.fillText(`HOSTILES ${String(left).padStart(2, "0")}`, 200, 54);
      ctx.fillStyle = "#f7a";
      ctx.fillText(`SAVED ${this.rescued}/${need}`, 318, 54);
      const sph = this.spheroids.filter((s) => s.alive).length;
      const enf = this.enforcerCount();
      if (sph || enf) {
        ctx.fillStyle = "#ff7ae0";
        ctx.fillText(`SPH ${sph}  ENF ${enf}`, 430, 54);
      }

      if (Input.padCount) {
        ctx.fillStyle = "#7ef6ff";
        const px = sph || enf ? 580 : 430;
        ctx.fillText(Input.dualPad ? "DUAL JOY" : "PAD", px, 54);
        this.drawStickGizmo(ctx, px + 70, 44, Input.moveX, Input.moveY, "#7ef6ff");
        this.drawStickGizmo(ctx, px + 108, 44, Input.shootX, Input.shootY, "#ff2bd6");
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
      ctx.fillStyle = "rgba(4,6,12,0.55)";
      ctx.fillRect(0, 0, w, h);
      ctx.textAlign = "center";
      ctx.shadowColor = win ? "#3fffb0" : "#ff4466";
      ctx.shadowBlur = 22;
      ctx.fillStyle = win ? "#7effc4" : "#ff6a7a";
      ctx.font = `900 ${Math.round(Math.min(60, w * 0.048))}px Orbitron, sans-serif`;
      ctx.fillText(win ? "SECTOR CLEAR" : "GAME OVER", w / 2, h * 0.36);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff";
      ctx.font = "700 22px Orbitron, sans-serif";
      ctx.fillText("SCORE  " + String(this.score).padStart(6, "0"), w / 2, h * 0.58);
      ctx.fillStyle = "#ffe56a";
      ctx.font = "16px 'Share Tech Mono', monospace";
      ctx.fillText(
        win
          ? `WAVES 1–3 COMPLETE    FAMILY SAVED  ${this.totalRescued}`
          : "THE ROBOTS STILL HOLD 2084",
        w / 2,
        h * 0.64
      );
      ctx.fillStyle = "#fff";
      ctx.font = "700 18px Orbitron, sans-serif";
      ctx.fillText("PRESS START TO PLAY AGAIN", w / 2, h * 0.72);
    }

    renderPause(ctx) {
      const w = this.viewW;
      const h = this.viewH;
      ctx.fillStyle = "rgba(4,6,12,0.55)";
      ctx.fillRect(0, 0, w, h);
      ctx.textAlign = "center";
      ctx.fillStyle = "#7ef6ff";
      ctx.font = "900 48px Orbitron, sans-serif";
      ctx.fillText("PAUSED", w / 2, h * 0.48);
      ctx.fillStyle = "#ccc";
      ctx.font = "16px 'Share Tech Mono', monospace";
      ctx.fillText("START / SPACE / ESC TO RESUME", w / 2, h * 0.54);
    }
  }

  window.Game = Game;
})();
