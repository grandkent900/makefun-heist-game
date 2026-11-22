// The Gilded Hour — boot, the fixed-step loop, and the screen state
// machine: title -> planning -> play -> tally / busted -> career.
// ?shot=heist|plan|vault|getaway freezes one staged scene for a
// screenshot instead, and sets window.__shotReady once it has painted.

import * as C from './config.js';
import { LEVELS, money } from './levels.js';
import { createWorld, stepWorld } from './world.js';
import {
  buildStatic,
  drawGame,
  drawTitleScreen,
  drawPlanScreen,
  drawTallyScreen,
  drawBustedScreen,
  drawCareerScreen,
  PLAN,
} from './render.js';
import { createInput } from './input.js';
import { ensureAudio, toggleMute, sfx } from './audio.js';
import { setupShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
input.setFirstGesture(ensureAudio);

let screen = 'title';
let levelIndex = 0;
let world = null;
let stat = null;
let selected = [];
let totals = [];
let best = 0;
try {
  best = Number(window.localStorage.getItem('gilded-hour-best') || 0) || 0;
} catch {
  best = 0;
}
let flash = 0;
let message = '';
let messageT = 0;
let endTimer = 0;
let shotMode = false;

function saveBest() {
  try {
    window.localStorage.setItem('gilded-hour-best', String(best));
  } catch {
    // A browser that refuses storage still plays fine.
  }
}

function startNight() {
  world = createWorld(LEVELS[levelIndex], selected);
  stat = buildStatic(LEVELS[levelIndex]);
  screen = 'play';
  flash = 0;
  message = '';
  endTimer = 0;
}

function showMessage(text, seconds = 2.5) {
  message = text;
  messageT = seconds;
}

function handleEvents(events) {
  for (const e of events) {
    if (e.type === 'loot') {
      sfx.loot();
      showMessage(`Pocketed ${money(e.value)}`);
    } else if (e.type === 'vault') {
      sfx.vault();
      showMessage(`The vault is open — ${money(e.value)} inside!`);
      flash = Math.max(flash, 0.4);
    } else if (e.type === 'spotted') {
      sfx.spotted();
      flash = 1;
    } else if (e.type === 'alarm') {
      if (e.kind !== 'seen') sfx.alarm();
    } else if (e.type === 'coin') {
      sfx.coin();
    } else if (e.type === 'smoke') {
      sfx.smoke();
    } else if (e.type === 'cut') {
      sfx.cut();
      showMessage(e.what === 'camera' ? 'Camera cut — it is blind now.' : 'Laser cut — the beam is dead.');
    } else if (e.type === 'lockdown') {
      sfx.lockdown();
      flash = 1;
    } else if (e.type === 'busted') {
      sfx.lose();
    } else if (e.type === 'won') {
      sfx.win();
    } else if (e.type === 'fled') {
      sfx.win();
    }
  }
}

function pointIn(r, x, y) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function planClick(x, y) {
  for (let i = 0; i < C.TOOLS.length; i++) {
    if (pointIn(PLAN.cards[i], x, y)) {
      const id = C.TOOLS[i].id;
      if (selected.includes(id)) {
        selected = selected.filter((t) => t !== id);
      } else if (selected.length < 2) {
        selected = [...selected, id];
      }
      sfx.click();
      return;
    }
  }
  if (pointIn(PLAN.begin, x, y) && selected.length === 2) {
    sfx.click();
    startNight();
  }
}

function step(dt) {
  if (input.consumeMute()) {
    const m = toggleMute();
    showMessage(m ? 'Sound off' : 'Sound on', 1.2);
  }
  if (flash > 0) flash = Math.max(0, flash - dt * 1.4);
  if (messageT > 0) {
    messageT -= dt;
    if (messageT <= 0) message = '';
  }

  if (screen === 'title') {
    if (input.consumeEnter() || input.consumeClick()) {
      sfx.click();
      screen = 'plan';
      selected = [];
    }
    return;
  }
  if (screen === 'plan') {
    const click = input.consumeClick();
    if (click) planClick(click.x, click.y);
    if (input.consumeEnter() && selected.length === 2) startNight();
    return;
  }
  if (screen === 'play') {
    if (!world) return;
    if (!world.outcome) {
      const { mx, my } = input.moveVector();
      const coin = input.consumeClick();
      const events = stepWorld(
        world,
        {
          mx,
          my,
          sneak: input.sneak,
          interact: input.interact,
          smoke: input.consumeSmoke(),
          coin,
        },
        dt,
      );
      handleEvents(events);
    } else {
      endTimer += dt;
      if (endTimer > 1.1) {
        if (world.outcome === 'busted') {
          screen = 'busted';
        } else {
          totals.push({
            name: `${world.level.name} · ${world.level.place}`,
            outcome: world.outcome,
            total: world.tally.total,
          });
          screen = 'tally';
        }
      }
    }
    return;
  }
  if (screen === 'tally') {
    if (input.consumeEnter() || input.consumeClick()) {
      if (levelIndex < LEVELS.length - 1) {
        levelIndex++;
        screen = 'plan';
        selected = [];
      } else {
        const sum = totals.reduce((a, r) => a + (r.outcome === 'busted' ? 0 : r.total), 0);
        if (sum > best) {
          best = sum;
          saveBest();
        }
        screen = 'career';
      }
    }
    return;
  }
  if (screen === 'busted') {
    if (input.consumeEnter() || input.consumeClick()) {
      screen = 'plan';
      selected = [];
    }
    return;
  }
  if (screen === 'career') {
    if (input.consumeEnter() || input.consumeClick()) {
      levelIndex = 0;
      totals = [];
      screen = 'title';
    }
  }
}

function render() {
  ctx.clearRect(0, 0, C.VIEW_W, C.VIEW_H);
  if (screen === 'title') {
    drawTitleScreen(ctx, best);
  } else if (screen === 'plan') {
    drawPlanScreen(ctx, LEVELS[levelIndex], selected, best);
  } else if (screen === 'play' || screen === 'tally' || screen === 'busted') {
    if (world && stat) {
      drawGame(ctx, world, stat, { flash, message });
      if (screen === 'tally' && world.tally) {
        drawTallyScreen(ctx, world.level, world.tally, world.outcome, world.endReason);
      } else if (screen === 'busted') {
        drawBustedScreen(ctx, world.level, world.tally, world.endReason);
      }
    }
  } else if (screen === 'career') {
    drawCareerScreen(ctx, totals, best);
  }
}

// A staged screenshot: freeze one real scene and say so.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  const setup = setupShot(shot);
  if (setup) {
    shotMode = true;
    levelIndex = setup.levelIndex;
    selected = setup.selected;
    screen = setup.screen;
    if (setup.world) {
      world = setup.world;
      stat = buildStatic(world.level);
      if (setup.screen === 'tally' && world.tally) {
        totals = [
          {
            name: `${world.level.name} · ${world.level.place}`,
            outcome: world.outcome,
            total: world.tally.total,
          },
        ];
      }
    }
  }
}

let last = performance.now();
let acc = 0;
let painted = false;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!shotMode) {
    acc += dt;
    let n = 0;
    while (acc >= 1 / 60 && n < 5) {
      step(1 / 60);
      acc -= 1 / 60;
      n++;
    }
    if (n === 5) acc = 0;
  }
  render();
  if (!painted) {
    painted = true;
    window.__shotReady = true;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// For the curious, and for the headless tests: the live game.
window.__game = {
  get screen() {
    return screen;
  },
  get world() {
    return world;
  },
};
