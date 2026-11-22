// Keyboard + mouse, kept in one place so the screens and the simulation
// share a single view of what the player is doing. Edges (a fresh key
// press, a fresh click) are consumed once, so holding a key never fires
// the same action twice.

export function createInput(canvas) {
  const keys = new Set();
  const queue = { enter: 0, clicks: [], smoke: 0 };
  let mouse = { x: 0, y: 0 };
  let onFirstGesture = null;

  function toCanvas(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * canvas.width,
      y: ((e.clientY - r.top) / r.height) * canvas.height,
    };
  }

  function gesture() {
    if (onFirstGesture) {
      const fn = onFirstGesture;
      onFirstGesture = null;
      fn();
    }
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (!e.repeat) {
      if (e.code === 'Enter' || e.code === 'NumpadEnter') queue.enter++;
      if (e.code === 'KeyQ') queue.smoke++;
    }
    keys.add(e.code);
    gesture();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  canvas.addEventListener('mousemove', (e) => {
    mouse = toCanvas(e);
  });
  canvas.addEventListener('mousedown', (e) => {
    queue.clicks.push(toCanvas(e));
    gesture();
  });
  window.addEventListener('blur', () => keys.clear());

  return {
    setFirstGesture(fn) {
      onFirstGesture = fn;
    },
    get mouse() {
      return mouse;
    },
    consumeEnter() {
      if (queue.enter > 0) {
        queue.enter = 0;
        return true;
      }
      return false;
    },
    consumeClick() {
      return queue.clicks.shift() ?? null;
    },
    consumeSmoke() {
      if (queue.smoke > 0) {
        queue.smoke = 0;
        return true;
      }
      return false;
    },
    moveVector() {
      let mx = 0;
      let my = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) my -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) my += 1;
      return { mx, my };
    },
    get sneak() {
      return keys.has('ShiftLeft') || keys.has('ShiftRight');
    },
    get interact() {
      return keys.has('KeyE');
    },
    consumeMute() {
      if (keys.has('KeyM')) {
        keys.delete('KeyM');
        return true;
      }
      return false;
    },
  };
}
