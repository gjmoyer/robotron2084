(() => {
  const canvas = document.getElementById("game");
  const boot = document.getElementById("boot");
  const game = new Game(canvas);
  window.__game = game;

  function resize() {
    game.resize();
  }

  async function bootGame() {
    Input.attach(canvas);
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", (e) => {
      if (e.code === "KeyF") {
        if (!document.fullscreenElement) canvas.requestFullscreen?.();
        else document.exitFullscreen?.();
      }
    });
    try {
      await game.load();
    } catch (err) {
      console.error(err);
      boot.querySelector(".boot-sub").textContent = "FAILED TO LOAD ASSETS";
      return;
    }
    try {
      await AudioFX.load();
    } catch (err) {
      console.warn("Audio failed to load", err);
    }
    boot.classList.add("hide");
    canvas.focus();
    if (new URLSearchParams(location.search).has("autostart")) {
      AudioFX.resume();
      game.startGame();
    }
    let last = performance.now();
    function frame(now) {
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;
      game.update(dt);
      game.render();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  bootGame();
})();
