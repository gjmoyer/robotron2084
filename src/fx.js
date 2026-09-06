(() => {
  const FX = {
    particles: [],
    floats: [],
    waves: [],
    lights: [],
    shake: 0,
    flash: 0,
    flashColor: "rgba(255,80,40,0.28)",
    hitstop: 0,

    reset() {
      this.particles.length = 0;
      this.floats.length = 0;
      this.waves.length = 0;
      this.lights.length = 0;
      this.shake = 0;
      this.flash = 0;
      this.hitstop = 0;
    },

    lowfx() {
      try {
        return !!(window.Input && window.Input.prefs && window.Input.prefs.lowfx);
      } catch (_) {
        return false;
      }
    },

    addShake(n) {
      const v = this.lowfx() ? n * 0.2 : n;
      this.shake = Math.min(22, this.shake + v);
    },

    addFlash(n, color) {
      const v = this.lowfx() ? n * 0.2 : n;
      this.flash = Math.max(this.flash, v);
      if (color) this.flashColor = color;
    },

    // localized bloom instead of full-screen wash
    light(x, y, color, radius = 90, life = 0.25) {
      if (this.lowfx() && this.lights.length > 6) return;
      this.lights.push({ x, y, color, radius, life, max: life });
    },

    burst(x, y, color, n = 18, speed = 220, size = 3.2, life = 0.45) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = speed * (0.35 + Math.random() * 0.75);
        this.particles.push({
          x, y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life,
          max: life,
          size: size * (0.5 + Math.random()),
          color,
          drag: 0.86 + Math.random() * 0.08,
          kind: "spark",
        });
      }
    },

    ring(x, y, color, life = 0.35) {
      this.waves.push({ x, y, r: 4, vr: 380, life, max: life, color, w: 4 });
    },

    wallRipple(x, y, color = "#7ef6ff") {
      this.waves.push({ x, y, r: 3, vr: 220, life: 0.28, max: 0.28, color, w: 3 });
    },

    // angular metal shards — reads as debris, not just glow dots
    debris(x, y, colors, n = 10, speed = 260, life = 0.5) {
      const list = Array.isArray(colors) ? colors : [colors];
      const cap = this.lowfx() ? Math.ceil(n * 0.5) : n;
      for (let i = 0; i < cap; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = speed * (0.4 + Math.random() * 0.8);
        this.particles.push({
          x, y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: life * (0.6 + Math.random() * 0.6),
          max: life,
          size: 2.5 + Math.random() * 4,
          color: list[(Math.random() * list.length) | 0],
          drag: 0.88 + Math.random() * 0.06,
          kind: "shard",
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 14,
        });
      }
    },

    // directional kill cone — sells firing direction
    cone(x, y, ang, color, n = 10, speed = 340, spread = 0.5, life = 0.32) {
      for (let i = 0; i < n; i++) {
        const a = ang + (Math.random() - 0.5) * spread * 2;
        const s = speed * (0.5 + Math.random() * 0.7);
        this.particles.push({
          x, y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life,
          max: life,
          size: 2 + Math.random() * 2.5,
          color,
          drag: 0.9,
          kind: "spark",
        });
      }
    },

    scorePop(x, y, text, color = "#fff36a") {
      this.floats.push({ x, y, text, color, life: 0.85, max: 0.85 });
    },

    ember(x, y, color) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 40,
        vy: -40 - Math.random() * 70,
        life: 0.5 + Math.random() * 0.4,
        max: 0.8,
        size: 2 + Math.random() * 2,
        color,
        drag: 0.94,
        kind: "ember",
      });
    },

    update(dt) {
      if (this.hitstop > 0) {
        this.hitstop -= dt;
        return;
      }
      this.shake *= Math.pow(0.04, dt);
      if (this.shake < 0.15) this.shake = 0;
      this.flash = Math.max(0, this.flash - dt * 2.6);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= p.drag;
        p.vy *= p.drag;
        if (p.kind === "ember") p.vy += 80 * dt;
        if (p.kind === "shard") p.rot += p.vr * dt;
        if (p.life <= 0) this.particles.splice(i, 1);
      }
      for (let i = this.waves.length - 1; i >= 0; i--) {
        const w = this.waves[i];
        w.life -= dt;
        w.r += w.vr * dt;
        w.vr *= 0.92;
        if (w.life <= 0) this.waves.splice(i, 1);
      }
      for (let i = this.lights.length - 1; i >= 0; i--) {
        const l = this.lights[i];
        l.life -= dt;
        if (l.life <= 0) this.lights.splice(i, 1);
      }
      for (let i = this.floats.length - 1; i >= 0; i--) {
        const f = this.floats[i];
        f.life -= dt;
        f.y -= 46 * dt;
        if (f.life <= 0) this.floats.splice(i, 1);
      }
    },

    offset() {
      if (this.shake <= 0) return [0, 0];
      const a = Math.random() * Math.PI * 2;
      return [Math.cos(a) * this.shake, Math.sin(a) * this.shake];
    },

    render(ctx) {
      // localized lights first (additive bloom spots)
      for (const l of this.lights) {
        const a = Math.max(0, l.life / l.max);
        const g = ctx.createRadialGradient(l.x, l.y, 2, l.x, l.y, l.radius);
        g.addColorStop(0, l.color);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.save();
        ctx.globalAlpha = a * 0.35;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(l.x, l.y, l.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      for (const w of this.waves) {
        const a = Math.max(0, w.life / w.max);
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
        ctx.strokeStyle = w.color;
        ctx.globalAlpha = a * 0.85;
        ctx.lineWidth = w.w * a;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      for (const p of this.particles) {
        const a = Math.max(0, p.life / p.max);
        ctx.globalAlpha = a;
        if (p.kind === "shard") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot || 0);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size, -p.size * 0.35, p.size * 2, p.size * 0.7);
          ctx.restore();
          continue;
        }
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.6 + a * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.font = "700 18px Orbitron, sans-serif";
      ctx.textAlign = "center";
      for (const f of this.floats) {
        const a = Math.max(0, f.life / f.max);
        ctx.globalAlpha = a;
        ctx.fillStyle = f.color;
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 12;
        ctx.fillText(f.text, f.x, f.y);
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
    },
  };

  window.FX = FX;
})();
