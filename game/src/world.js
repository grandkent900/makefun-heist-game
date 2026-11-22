// The Gilded Hour — the simulation. No DOM here on purpose: Node can
// import this file and drive it headless, which is how the soak and rule
// tests run. Rendering lives in render.js, input in input.js.
//
// Guards think in four states: patrol -> investigate (a sound or a coin)
// -> chase (a good look) -> search (lost you: they sweep the last place
// they saw you, then give up and walk their beat again). The search state
// is the improvement over a plain patrol/chase loop: a guard that loses
// you does not just snap back to its route — it comes looking.

import * as C from './config.js';
import { mulberry32 } from './random.js';

// ---------- geometry ----------

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function turnToward(angle, target, maxStep) {
  const d = angleDiff(target, angle);
  if (Math.abs(d) <= maxStep) return target;
  return angle + Math.sign(d) * maxStep;
}

function segHitsRect(x1, y1, x2, y2, r) {
  // Liang–Barsky clip: true when the segment touches the rectangle.
  let t0 = 0;
  let t1 = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - r.x, r.x + r.w - x1, y1 - r.y, r.y + r.h - y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

export function losClear(x1, y1, x2, y2, obstacles) {
  for (const r of obstacles) {
    if (segHitsRect(x1, y1, x2, y2, r)) return false;
  }
  return true;
}

export function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function raycast(x, y, angle, maxDist, obstacles) {
  const step = 6;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  for (let d = step; d <= maxDist; d += step) {
    const px = x + dx * d;
    const py = y + dy * d;
    for (const r of obstacles) {
      if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
        return { x: px, y: py };
      }
    }
  }
  return { x: x + dx * maxDist, y: y + dy * maxDist };
}

// A vision cone clipped by walls, as a polygon the renderer can fill.
export function conePolygon(x, y, angle, halfAngle, range, obstacles) {
  const rays = 11;
  const pts = [{ x, y }];
  for (let i = 0; i <= rays; i++) {
    const a = angle - halfAngle + (2 * halfAngle * i) / rays;
    pts.push(raycast(x, y, a, range, obstacles));
  }
  return pts;
}

function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

function pushOutOfRect(pos, r, rect) {
  const nx = Math.max(rect.x, Math.min(pos.x, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(pos.y, rect.y + rect.h));
  let dx = pos.x - nx;
  let dy = pos.y - ny;
  let d = Math.hypot(dx, dy);
  if (d === 0) {
    // Centre inside the rectangle: push out along the shallowest side.
    const left = pos.x - rect.x;
    const right = rect.x + rect.w - pos.x;
    const top = pos.y - rect.y;
    const bottom = rect.y + rect.h - pos.y;
    const m = Math.min(left, right, top, bottom);
    if (m === left) pos.x = rect.x - r;
    else if (m === right) pos.x = rect.x + rect.w + r;
    else if (m === top) pos.y = rect.y - r;
    else pos.y = rect.y + rect.h + r;
    return;
  }
  dx /= d;
  dy /= d;
  pos.x = nx + dx * r;
  pos.y = ny + dy * r;
}

// ---------- world ----------

export function createWorld(level, toolIds, seed = 20261122) {
  const rng = mulberry32(seed);
  const obstacles = [
    ...level.walls,
    ...level.furniture.map((f) => ({ x: f.x, y: f.y, w: f.w, h: f.h })),
    { x: level.vault.x, y: level.vault.y, w: level.vault.w, h: level.vault.h },
  ];
  return {
    level,
    rng,
    obstacles,
    tools: new Set(toolIds),
    time: 0,
    alarm: 0,
    peakAlarm: 0,
    lastTripAt: -99,
    lockdown: 0,
    lockdownActive: false,
    thief: {
      x: level.entry.x,
      y: level.entry.y,
      angle: -Math.PI / 2,
      moving: false,
      sneaking: false,
      bag: [],
      lootValue: 0,
      channel: null,
    },
    guards: level.guards.map((g) => ({
      path: g.path,
      wait: g.wait,
      x: g.path[0][0],
      y: g.path[0][1],
      angle: 0,
      state: 'patrol',
      wp: 1,
      waitT: 0,
      scanT: 0,
      suspicion: 0,
      lastSeen: null,
      loseT: 0,
      hearT: 0,
      chaseCount: 0,
    })),
    cameras: level.cameras.map((c) => ({ ...c, angle: c.base, cooldown: 0, disabled: false })),
    lasers: level.lasers.map((l) => ({ ...l, cooldown: 0, disabled: false })),
    loot: level.loot.map((l) => ({ ...l, taken: false })),
    vaultOpen: false,
    prizeTaken: false,
    coins: [],
    smokes: [],
    coinsLeft: toolIds.includes('coin') ? C.COIN_USES : 0,
    smokesLeft: toolIds.includes('smoke') ? C.SMOKE_USES : 0,
    seen: false,
    outcome: null,
    endReason: '',
    tally: null,
  };
}

function inSmoke(x, y, smokes) {
  return smokes.some((s) => Math.hypot(x - s.x, y - s.y) < C.SMOKE_R);
}

function smokeBlocks(x1, y1, x2, y2, smokes) {
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    if (inSmoke(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, smokes)) return true;
  }
  return false;
}

function canSee(wx, wy, angle, halfAngle, range, tx, ty, w) {
  const dx = tx - wx;
  const dy = ty - wy;
  const d = Math.hypot(dx, dy);
  if (d > range || d < 1) return 0;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), angle)) > halfAngle) return 0;
  if (!losClear(wx, wy, tx, ty, w.obstacles)) return 0;
  if (inSmoke(tx, ty, w.smokes) || inSmoke(wx, wy, w.smokes)) return 0;
  if (smokeBlocks(wx, wy, tx, ty, w.smokes)) return 0;
  return 1 - d / range; // 1 up close, 0 at the edge
}

function tripAlarm(w, amount, events, kind) {
  w.alarm = Math.min(100, w.alarm + amount);
  w.peakAlarm = Math.max(w.peakAlarm, w.alarm);
  w.lastTripAt = w.time;
  events.push({ type: 'alarm', kind, amount, value: w.alarm });
}

function guardInvestigate(g, x, y, suspicion = 0.35) {
  if (g.state === 'chase') return;
  g.state = 'investigate';
  g.lastSeen = { x, y };
  g.suspicion = Math.max(g.suspicion, suspicion);
}

function nearestGuard(w, x, y) {
  let best = null;
  let bd = Infinity;
  for (const g of w.guards) {
    const d = Math.hypot(g.x - x, g.y - y);
    if (d < bd) {
      bd = d;
      best = g;
    }
  }
  return best;
}

function computeTally(w) {
  const t = w.thief;
  const won = w.outcome === 'won';
  const fled = w.outcome === 'fled';
  const timeBonus = won
    ? Math.max(0, Math.round((w.level.par - w.time) * C.TIME_BONUS_RATE))
    : fled
      ? Math.max(0, Math.round((w.level.par - w.time) * C.TIME_BONUS_RATE * 0.5))
      : 0;
  const ghost = won && !w.seen ? C.GHOST_BONUS : 0;
  const cool = won && w.peakAlarm < C.COOLHEAD_PEAK ? C.COOLHEAD_BONUS : 0;
  return {
    loot: t.lootValue,
    prize: w.prizeTaken ? w.level.prize : 0,
    timeBonus,
    ghost,
    cool,
    total: t.lootValue + timeBonus + ghost + cool,
    seen: w.seen,
    peakAlarm: Math.round(w.peakAlarm),
    time: w.time,
  };
}

function moveCircle(w, pos, r, dx, dy) {
  pos.x += dx;
  for (const o of w.obstacles) {
    if (circleHitsRect(pos.x, pos.y, r, o)) pushOutOfRect(pos, r, o);
  }
  pos.x = Math.max(40 + r, Math.min(1240 - r, pos.x));
  pos.y += dy;
  for (const o of w.obstacles) {
    if (circleHitsRect(pos.x, pos.y, r, o)) pushOutOfRect(pos, r, o);
  }
  pos.y = Math.max(80 + r, Math.min(700 - r, pos.y));
}

// One fixed step. `input`: {mx, my, sneak, interact, smoke, coin:{x,y}|null}
export function stepWorld(w, input, dt) {
  const events = [];
  if (w.outcome) return events;
  w.time += dt;
  const t = w.thief;
  const has = (id) => w.tools.has(id);

  // --- one-shot actions ---
  if (input.coin && has('coin') && w.coinsLeft > 0) {
    const d = Math.hypot(input.coin.x - t.x, input.coin.y - t.y);
    if (d <= C.COIN_THROW_RANGE) {
      w.coins.push({ x: input.coin.x, y: input.coin.y, t: 4 });
      w.coinsLeft--;
      events.push({ type: 'coin', x: input.coin.x, y: input.coin.y });
      for (const g of w.guards) {
        if (Math.hypot(g.x - input.coin.x, g.y - input.coin.y) < C.COIN_HEAR_RADIUS) {
          guardInvestigate(g, input.coin.x, input.coin.y, 0.5);
        }
      }
    }
  }
  if (input.smoke && has('smoke') && w.smokesLeft > 0) {
    w.smokes.push({ x: t.x, y: t.y, t: C.SMOKE_SECONDS });
    w.smokesLeft--;
    events.push({ type: 'smoke' });
  }
  for (const c of w.coins) c.t -= dt;
  w.coins = w.coins.filter((c) => c.t > 0);
  for (const s of w.smokes) s.t -= dt;
  w.smokes = w.smokes.filter((s) => s.t > 0);

  // --- interact channel (hold E): nearest thing in reach wins ---
  const speedFactor = Math.max(C.BAG_SLOW_MIN, 1 - C.BAG_SLOW_PER_ITEM * t.bag.length);
  if (input.interact && !t.channel) {
    let best = null;
    let bd = Infinity;
    const consider = (x, y, kind, target, need) => {
      const d = Math.hypot(x - t.x, y - t.y);
      if (d < bd) {
        bd = d;
        best = { kind, target, need, x, y };
      }
    };
    for (const l of w.loot) {
      if (!l.taken) consider(l.x, l.y, 'loot', l, C.LOOT_CHANNEL * (has('picks') ? C.PICKS_FACTOR : 1));
    }
    if (!w.vaultOpen) {
      const v = w.level.vault;
      let need = C.VAULT_CHANNEL;
      if (has('picks')) need *= C.PICKS_FACTOR;
      if (has('intel')) need *= C.INTEL_VAULT_FACTOR;
      consider(v.x + v.w / 2, v.y + v.h / 2, 'vault', v, need);
    }
    if (has('cutters')) {
      for (const c of w.cameras) if (!c.disabled) consider(c.x, c.y, 'camera', c, 1.0);
      for (const l of w.lasers) {
        if (!l.disabled) consider((l.x1 + l.x2) / 2, (l.y1 + l.y2) / 2, 'laser', l, 1.0);
      }
    }
    if (best && bd <= C.INTERACT_DIST + 30) {
      t.channel = { ...best, t: 0 };
    }
  }
  if (t.channel) {
    if (!input.interact) {
      t.channel = null; // let go: the work is lost
    } else {
      t.channel.t += dt;
      if (t.channel.t >= t.channel.need) {
        const ch = t.channel;
        t.channel = null;
        if (ch.kind === 'loot') {
          ch.target.taken = true;
          t.bag.push(ch.target);
          t.lootValue += ch.target.value;
          events.push({ type: 'loot', value: ch.target.value, kind: ch.target.kind });
        } else if (ch.kind === 'vault') {
          w.vaultOpen = true;
          w.prizeTaken = true;
          t.lootValue += w.level.prize;
          events.push({ type: 'vault', value: w.level.prize });
        } else if (ch.kind === 'camera') {
          ch.target.disabled = true;
          events.push({ type: 'cut', what: 'camera' });
        } else if (ch.kind === 'laser') {
          ch.target.disabled = true;
          events.push({ type: 'cut', what: 'laser' });
        }
      }
    }
  }

  // --- thief movement (rooted while working a channel) ---
  const moving = (input.mx !== 0 || input.my !== 0) && !t.channel;
  t.moving = moving;
  t.sneaking = !!input.sneak;
  if (moving) {
    const len = Math.hypot(input.mx, input.my) || 1;
    const base = t.sneaking ? (has('soles') ? C.SNEAK_SOLES_SPEED : C.SNEAK_SPEED) : C.WALK_SPEED;
    const sp = base * speedFactor;
    const dx = (input.mx / len) * sp * dt;
    const dy = (input.my / len) * sp * dt;
    t.angle = Math.atan2(dy, dx);
    moveCircle(w, t, C.THIEF_R, dx, dy);
    // Footsteps: a guard close by hears plain walking.
    if (!t.sneaking) {
      const hear = has('soles') ? C.HEAR_WALK_SOLES : C.HEAR_WALK;
      for (const g of w.guards) {
        if (g.hearT > 0) continue;
        if (Math.hypot(g.x - t.x, g.y - t.y) < hear && losClear(g.x, g.y, t.x, t.y, w.obstacles)) {
          guardInvestigate(g, t.x, t.y, 0.35);
          g.hearT = 1.5;
          events.push({ type: 'heard', x: t.x, y: t.y });
        }
      }
    }
  }

  // --- cameras ---
  for (const c of w.cameras) {
    if (c.cooldown > 0) c.cooldown -= dt;
    c.angle = c.base + Math.sin(w.time * c.speed) * c.sweep;
    if (c.disabled || c.cooldown > 0) continue;
    const vis = canSee(c.x, c.y, c.angle, C.CAMERA_HALF_ANGLE, c.range, t.x, t.y, w);
    if (vis > 0.25) {
      tripAlarm(w, C.CAMERA_TRIP, events, 'camera');
      c.cooldown = C.CAMERA_COOLDOWN;
      events.push({ type: 'spotted', by: 'camera' });
      const g = nearestGuard(w, t.x, t.y);
      if (g) guardInvestigate(g, t.x, t.y, 0.6);
    }
  }

  // --- lasers ---
  for (const l of w.lasers) {
    if (l.cooldown > 0) l.cooldown -= dt;
    if (l.disabled || l.cooldown > 0) continue;
    if (distToSegment(t.x, t.y, l.x1, l.y1, l.x2, l.y2) < 9) {
      tripAlarm(w, C.LASER_TRIP, events, 'laser');
      l.cooldown = C.LASER_COOLDOWN;
      events.push({ type: 'spotted', by: 'laser' });
      const g = nearestGuard(w, t.x, t.y);
      if (g) guardInvestigate(g, t.x, t.y, 0.6);
    }
  }

  // --- guards ---
  for (const g of w.guards) {
    if (g.hearT > 0) g.hearT -= dt;
    const range = C.VISION_RANGE * (t.sneaking ? C.SNEAK_VISION_FACTOR : 1);
    const vis = canSee(g.x, g.y, g.angle, C.VISION_HALF_ANGLE, range, t.x, t.y, w);
    if (vis > 0) {
      const rate = (C.SUSPICION_FAR + (C.SUSPICION_NEAR - C.SUSPICION_FAR) * vis) *
        (t.sneaking ? C.SNEAK_SUSPICION_FACTOR : 1);
      g.suspicion = Math.min(1, g.suspicion + rate * dt);
      g.lastSeen = { x: t.x, y: t.y };
      g.loseT = 0;
      if (g.suspicion >= 1 && g.state !== 'chase') {
        g.state = 'chase';
        g.chaseCount++;
        w.seen = true;
        tripAlarm(w, C.SEEN_ALARM, events, 'seen');
        events.push({ type: 'spotted', by: 'guard' });
      }
    } else {
      g.suspicion = Math.max(0, g.suspicion - 0.8 * dt);
    }

    const faceMove = (nx, ny, speed) => {
      const dx = nx - g.x;
      const dy = ny - g.y;
      const d = Math.hypot(dx, dy);
      if (d < 1) return true;
      const step = Math.min(d, speed * dt);
      const before = { x: g.x, y: g.y };
      moveCircle(w, g, C.GUARD_R, (dx / d) * step, (dy / d) * step);
      if (Math.hypot(g.x - before.x, g.y - before.y) > 0.01) {
        g.angle = turnToward(g.angle, Math.atan2(dy, dx), 8 * dt);
      }
      return d <= 6;
    };

    if (g.state === 'patrol') {
      const wp = g.path[g.wp];
      if (g.waitT > 0) {
        g.waitT -= dt;
        g.angle += 0.9 * dt; // a slow look around while waiting
      } else if (faceMove(wp[0], wp[1], C.GUARD_PATROL_SPEED)) {
        g.waitT = g.wait;
        g.wp = (g.wp + 1) % g.path.length;
      }
    } else if (g.state === 'investigate') {
      if (!g.lastSeen) {
        g.state = 'patrol';
      } else if (faceMove(g.lastSeen.x, g.lastSeen.y, C.GUARD_INVESTIGATE_SPEED)) {
        g.scanT += dt;
        g.angle += 1.6 * dt;
        if (g.scanT > 2.5) {
          g.scanT = 0;
          g.state = 'patrol';
          // resume from the nearest waypoint
          let bi = 0;
          let bd = Infinity;
          g.path.forEach((p, i) => {
            const d = Math.hypot(p[0] - g.x, p[1] - g.y);
            if (d < bd) {
              bd = d;
              bi = i;
            }
          });
          g.wp = bi;
        }
      }
    } else if (g.state === 'chase') {
      if (vis > 0) {
        faceMove(t.x, t.y, C.GUARD_CHASE_SPEED);
      } else {
        g.loseT += dt;
        if (g.loseT > C.CHASE_MEMORY_SECONDS) {
          g.state = 'search';
          g.scanT = 0;
        } else if (g.lastSeen) {
          faceMove(g.lastSeen.x, g.lastSeen.y, C.GUARD_CHASE_SPEED);
        }
      }
      if (Math.hypot(g.x - t.x, g.y - t.y) < C.CATCH_DIST) {
        w.outcome = 'busted';
        w.endReason = 'A guard caught you.';
        events.push({ type: 'busted' });
      }
    } else if (g.state === 'search') {
      if (!g.lastSeen) {
        g.state = 'patrol';
      } else if (faceMove(g.lastSeen.x, g.lastSeen.y, C.GUARD_SEARCH_SPEED)) {
        g.scanT += dt;
        g.angle += 2.2 * dt; // sweeping the spot where you were last seen
        if (g.scanT > C.SEARCH_SECONDS) {
          g.scanT = 0;
          g.suspicion = 0;
          g.state = 'patrol';
          let bi = 0;
          let bd = Infinity;
          g.path.forEach((p, i) => {
            const d = Math.hypot(p[0] - g.x, p[1] - g.y);
            if (d < bd) {
              bd = d;
              bi = i;
            }
          });
          g.wp = bi;
        }
      }
    }
  }

  // --- alarm decay / lockdown ---
  if (!w.lockdownActive) {
    if (w.alarm >= 100) {
      w.lockdownActive = true;
      w.lockdown = C.LOCKDOWN_SECONDS;
      events.push({ type: 'lockdown' });
    } else if (w.time - w.lastTripAt > C.ALARM_GRACE_AFTER_TRIP) {
      const chasing = w.guards.some((g) => g.state === 'chase');
      if (!chasing) w.alarm = Math.max(0, w.alarm - C.ALARM_DECAY * dt);
    }
  } else {
    w.lockdown -= dt;
    if (w.lockdown <= 0) {
      w.outcome = 'busted';
      w.endReason = 'Lockdown sealed the building with you inside.';
      events.push({ type: 'busted' });
    }
  }

  // --- exit ---
  const e = w.level.exit;
  if (t.x > e.x && t.x < e.x + e.w && t.y > e.y - 6 && t.y < e.y + e.h + 14) {
    if (w.prizeTaken) {
      w.outcome = 'won';
      w.endReason = 'Clean getaway — the prize is yours.';
    } else {
      w.outcome = 'fled';
      w.endReason = 'You slipped out — but the vault stays shut.';
    }
    w.tally = computeTally(w);
    events.push({ type: w.outcome, tally: w.tally });
  }
  if (w.outcome === 'busted') {
    w.tally = computeTally(w);
  }
  return events;
}

export { computeTally };
