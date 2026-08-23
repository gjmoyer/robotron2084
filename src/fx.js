(() => {
  const FX = {
    particles: [],
    floats: [],
    waves: [],
    shake: 0,
    flash: 0,
    flashColor: "rgba(255,80,40,0.28)",
    hitstop: 0,

    reset() {
      this.particles.length = 0;
      this.floats.length = 0;
      this.waves.length = 0;
      this.shake = 0;
      this.flash = 0;
      this.hitstop = 0;
    },

    addShake(n) {
      this.shake = Math.min(22, this.shake + n);
    },

    addFlash(n, color) {
      this.flash = Math.max(this.flash, n);
      if (color) this.flashColor = color;
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
        if (p.life <= 0) this.particles.splice(i, 1);
      }
      for (let i = this.waves.length - 1; i >= 0; i--) {
        const w = this.waves[i];
        w.life -= dt;
        w.r += w.vr * dt;
        w.vr *= 0.92;
        if (w.life <= 0) this.waves.splice(i, 1);
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
