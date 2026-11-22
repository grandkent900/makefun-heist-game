// The Gilded Hour — all painting. The static room (floor, walls,
// furniture, the safe, the exit) is prerendered once per night onto an
// offscreen canvas; every frame draws that, then the living things:
// loot, cones, guards, cameras, lasers, smoke, the thief, the HUD.

import * as C from './config.js';
import { conePolygon } from './world.js';
import { LOOT_LABELS, money } from './levels.js';

const { floorA, floorB, wall, wallTop, furniture, furnitureTop, gold, exit, danger, warn, ink, dim, vault } = C.COLORS;

function text(ctx, s, x, y, font, color, align = 'left') {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---------- static layer ----------

export function buildStatic(level) {
  const cv = document.createElement('canvas');
  cv.width = C.VIEW_W;
  cv.height = C.VIEW_H;
  const ctx = cv.getContext('2d');

  // Floor: quiet checker so movement reads at a glance.
  for (let y = 0; y < C.VIEW_H; y += 40) {
    for (let x = 0; x < C.VIEW_W; x += 40) {
      ctx.fillStyle = ((x + y) / 40) % 2 === 0 ? floorA : floorB;
      ctx.fillRect(x, y, 40, 40);
    }
  }
  // The building's shell.
  ctx.fillStyle = wall;
  ctx.fillRect(40, 80, 1200, 10);
  ctx.fillRect(40, 690, 1200, 10);
  ctx.fillRect(40, 80, 10, 620);
  ctx.fillRect(1230, 80, 10, 620);
  ctx.fillStyle = wallTop;
  ctx.fillRect(40, 80, 1200, 3);
  ctx.fillRect(40, 80, 3, 620);

  // Interior walls.
  for (const r of level.walls) {
    ctx.fillStyle = wall;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = wallTop;
    if (r.w >= r.h) ctx.fillRect(r.x, r.y, r.w, 3);
    else ctx.fillRect(r.x, r.y, 3, r.h);
  }
  // Furniture.
  for (const f of level.furniture) {
    ctx.fillStyle = furniture;
    ctx.fillRect(f.x, f.y, f.w, f.h);
    ctx.fillStyle = furnitureTop;
    ctx.fillRect(f.x, f.y, f.w, 3);
    text(ctx, f.label, f.x + f.w / 2, f.y + f.h / 2, '11px system-ui, sans-serif', dim, 'center');
  }
  // The vault: a steel safe with the prize winking through its window.
  const v = level.vault;
  ctx.fillStyle = vault;
  ctx.fillRect(v.x, v.y, v.w, v.h);
  ctx.strokeStyle = '#d9b45a';
  ctx.lineWidth = 3;
  ctx.strokeRect(v.x + 5, v.y + 5, v.w - 10, v.h - 10);
  ctx.fillStyle = '#3a2f14';
  ctx.beginPath();
  ctx.arc(v.x + v.w / 2, v.y + v.h / 2, 16, 0, Math.PI * 2);
  ctx.fill();
  drawStar(ctx, v.x + v.w / 2, v.y + v.h / 2, 11, gold);
  text(ctx, 'VAULT', v.x + v.w / 2, v.y + v.h - 12, 'bold 11px system-ui, sans-serif', '#e8d9a0', 'center');

  // The exit: a green door in the bottom wall.
  const e = level.exit;
  ctx.fillStyle = exit;
  ctx.fillRect(e.x, e.y - 8, e.w, e.h + 8);
  text(ctx, 'EXIT', e.x + e.w / 2, e.y + e.h / 2 + 2, 'bold 13px system-ui, sans-serif', '#062b16', 'center');
  return cv;
}

function drawStar(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

// ---------- loot icons ----------

function drawLootIcon(ctx, kind, x, y) {
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'cash') {
    ctx.fillStyle = '#3fae5a';
    ctx.fillRect(-11, -7, 22, 14);
    text(ctx, '$', 0, 1, 'bold 12px system-ui, sans-serif', '#eaffef', 'center');
  } else if (kind === 'gold') {
    ctx.fillStyle = gold;
    ctx.fillRect(-12, -4, 24, 8);
    ctx.fillRect(-8, -10, 16, 7);
  } else if (kind === 'painting') {
    ctx.fillStyle = '#7a5a34';
    ctx.fillRect(-12, -9, 24, 18);
    ctx.fillStyle = '#c98f4e';
    ctx.fillRect(-9, -6, 18, 12);
    ctx.fillStyle = '#5a7a9e';
    ctx.fillRect(-9, -6, 18, 6);
  } else if (kind === 'jewel') {
    ctx.fillStyle = '#5ad1e6';
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(9, 0);
    ctx.lineTo(0, 11);
    ctx.lineTo(-9, 0);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'bonds') {
    ctx.fillStyle = '#e8ecf7';
    ctx.fillRect(-10, -7, 20, 14);
    ctx.strokeStyle = '#39456b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-6, -2);
    ctx.lineTo(6, -2);
    ctx.moveTo(-6, 3);
    ctx.lineTo(6, 3);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#b07fe6';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#efe6ff';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- play frame ----------

export function drawGame(ctx, w, stat, ui) {
  ctx.drawImage(stat, 0, 0);
  const t = w.thief;
  const level = w.level;

  // Loot on the floor.
  for (const l of w.loot) {
    if (l.taken) continue;
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.45 * Math.sin(w.time * 3 + l.x);
    ctx.strokeStyle = gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(l.x, l.y, 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    drawLootIcon(ctx, l.kind, l.x, l.y);
  }
  // The vault, open or shut.
  if (w.vaultOpen) {
    const v = level.vault;
    ctx.fillStyle = '#0d1220';
    ctx.fillRect(v.x + v.w - 18, v.y + 8, 12, v.h - 16);
    text(ctx, 'OPEN', v.x + v.w / 2, v.y + v.h / 2 + 26, 'bold 12px system-ui, sans-serif', gold, 'center');
  }
  // Lasers.
  for (const l of w.lasers) {
    if (l.disabled) {
      ctx.strokeStyle = 'rgba(120,130,150,0.5)';
      ctx.setLineDash([4, 6]);
    } else {
      const hot = l.cooldown > 0;
      ctx.strokeStyle = hot ? 'rgba(255,90,78,0.35)' : danger;
      ctx.setLineDash([]);
    }
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ff5a4e';
    ctx.beginPath();
    ctx.arc(l.x1, l.y1, 4, 0, Math.PI * 2);
    ctx.arc(l.x2, l.y2, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Thrown coins.
  for (const c of w.coins) {
    ctx.strokeStyle = gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 6 + (4 - c.t) * 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Smoke.
  for (const s of w.smokes) {
    const a = Math.min(0.55, (s.t / C.SMOKE_SECONDS) * 0.55);
    ctx.fillStyle = `rgba(170,180,200,${a})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, C.SMOKE_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(200,210,225,${a * 0.7})`;
    ctx.beginPath();
    ctx.arc(s.x - 24, s.y + 12, C.SMOKE_R * 0.55, 0, Math.PI * 2);
    ctx.arc(s.x + 26, s.y - 10, C.SMOKE_R * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Vision cones: cameras first, then guards.
  for (const c of w.cameras) {
    if (c.disabled) continue;
    const poly = conePolygon(c.x, c.y, c.angle, C.CAMERA_HALF_ANGLE, c.range, w.obstacles);
    ctx.fillStyle = c.cooldown > 0 ? 'rgba(255,90,78,0.16)' : 'rgba(120,180,255,0.16)';
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath();
    ctx.fill();
  }
  for (const g of w.guards) {
    const chasing = g.state === 'chase';
    const suspicious = g.suspicion > 0.25;
    const poly = conePolygon(g.x, g.y, g.angle, C.VISION_HALF_ANGLE, C.VISION_RANGE, w.obstacles);
    ctx.fillStyle = chasing
      ? 'rgba(255,90,78,0.30)'
      : suspicious
        ? 'rgba(255,176,46,0.26)'
        : 'rgba(255,176,46,0.18)';
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath();
    ctx.fill();
  }
  // Cameras on the wall.
  for (const c of w.cameras) {
    ctx.fillStyle = c.disabled ? '#5a6478' : '#c8d2e8';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = c.disabled ? '#5a6478' : danger;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x + Math.cos(c.angle) * 18, c.y + Math.sin(c.angle) * 18);
    ctx.stroke();
  }
  // Guards.
  for (const g of w.guards) {
    const chasing = g.state === 'chase';
    ctx.fillStyle = chasing ? danger : '#e8b23a';
    ctx.beginPath();
    ctx.arc(g.x, g.y, C.GUARD_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#10131f';
    ctx.lineWidth = 2;
    ctx.stroke();
    // facing tick + suspicion arc
    ctx.strokeStyle = '#10131f';
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * 16, g.y + Math.sin(g.angle) * 16);
    ctx.stroke();
    if (g.suspicion > 0.05 && !chasing) {
      ctx.strokeStyle = warn;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(g.x, g.y, C.GUARD_R + 5, -Math.PI / 2, -Math.PI / 2 + g.suspicion * Math.PI * 2);
      ctx.stroke();
    }
    if (chasing) text(ctx, '!', g.x, g.y - 24, 'bold 18px system-ui, sans-serif', danger, 'center');
    else if (g.state === 'investigate' || g.state === 'search') {
      text(ctx, '?', g.x, g.y - 24, 'bold 16px system-ui, sans-serif', warn, 'center');
    }
  }
  // The thief.
  ctx.fillStyle = '#22283d';
  ctx.beginPath();
  ctx.arc(t.x, t.y, C.THIEF_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(t.x, t.y);
  ctx.lineTo(t.x + Math.cos(t.angle) * 15, t.y + Math.sin(t.angle) * 15);
  ctx.stroke();
  if (t.sneaking) {
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = 'rgba(232,236,247,0.6)';
    ctx.beginPath();
    ctx.arc(t.x, t.y, C.THIEF_R + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // Work channel ring.
  if (t.channel) {
    const p = t.channel.t / t.channel.need;
    ctx.strokeStyle = gold;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(t.x, t.y, C.THIEF_R + 9, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
    ctx.stroke();
    text(ctx, t.channel.kind === 'vault' ? 'CRACKING…' : 'WORKING…', t.x, t.y + 32, 'bold 12px system-ui, sans-serif', gold, 'center');
  }
  if (ui.flash > 0) {
    ctx.fillStyle = `rgba(255,90,78,${Math.min(0.35, ui.flash * 0.12)})`;
    ctx.fillRect(0, 0, C.VIEW_W, C.VIEW_H);
  }
  drawHUD(ctx, w);
  if (w.lockdownActive) {
    ctx.fillStyle = 'rgba(13,18,32,0.82)';
    ctx.fillRect(0, 0, C.VIEW_W, 64);
    text(ctx, `LOCKDOWN — ${Math.ceil(w.lockdown)}s — GET OUT`, C.VIEW_W / 2, 32, 'bold 26px system-ui, sans-serif', danger, 'center');
  }
  if (ui.message) {
    text(ctx, ui.message, C.VIEW_W / 2, C.VIEW_H - 24, 'bold 15px system-ui, sans-serif', ink, 'center');
  }
}

function drawHUD(ctx, w) {
  ctx.fillStyle = 'rgba(10,14,26,0.92)';
  ctx.fillRect(0, 0, C.VIEW_W, C.HUD_H);
  const level = w.level;
  text(ctx, `${level.name} · ${level.place}`, 20, 24, 'bold 17px system-ui, sans-serif', ink);
  text(ctx, `Prize ${money(level.prize)}  ·  Par ${level.par}s  ·  ${Math.floor(w.time)}s`, 20, 46, '13px system-ui, sans-serif', dim);

  // Segmented alarm meter.
  const mx = 480;
  const my = 32;
  text(ctx, 'ALARM', mx - 8, my, 'bold 13px system-ui, sans-serif', w.alarm >= 75 ? danger : dim, 'right');
  for (let i = 0; i < 10; i++) {
    const on = w.alarm > i * 10;
    ctx.fillStyle = on ? (w.alarm >= 75 ? danger : warn) : '#2c3550';
    ctx.fillRect(mx + i * 22, my - 9, 18, 18);
  }
  text(ctx, `${Math.round(w.alarm)}%`, mx + 228, my, 'bold 14px system-ui, sans-serif', w.alarm >= 75 ? danger : ink);

  // Loot and tools, right side.
  text(ctx, money(w.thief.lootValue), C.VIEW_W - 20, 24, 'bold 18px system-ui, sans-serif', gold, 'right');
  const tools = [];
  if (w.tools.has('coin')) tools.push(`Coins ${w.coinsLeft}`);
  if (w.tools.has('smoke')) tools.push(`Smoke ${w.smokesLeft}`);
  if (w.tools.has('cutters')) tools.push('Cutters');
  if (w.tools.has('picks')) tools.push('Picks');
  if (w.tools.has('soles')) tools.push('Soles');
  if (w.tools.has('intel')) tools.push('Intel');
  text(ctx, tools.join('  ·  ') || 'No tools', C.VIEW_W - 20, 46, '12px system-ui, sans-serif', dim, 'right');

  text(
    ctx,
    'WASD move · Shift sneak · E hold to work · Click toss a coin · Q smoke · M mute',
    C.VIEW_W / 2,
    C.VIEW_H - 8,
    '12px system-ui, sans-serif',
    'rgba(154,165,196,0.75)',
    'center',
  );
}

// ---------- screens ----------

export function drawTitleScreen(ctx, best) {
  ctx.fillStyle = '#0d1220';
  ctx.fillRect(0, 0, C.VIEW_W, C.VIEW_H);
  // A little skyline of the city you are about to rob.
  ctx.fillStyle = '#161d33';
  const rngHeights = [120, 200, 150, 240, 180, 210, 130, 190];
  rngHeights.forEach((h, i) => {
    ctx.fillRect(60 + i * 150, C.VIEW_H - 180 - h, 110, h + 180);
  });
  ctx.fillStyle = gold;
  for (let i = 0; i < 40; i++) {
    const x = 80 + ((i * 173) % 1120);
    const y = C.VIEW_H - 160 - ((i * 97) % 260);
    ctx.fillRect(x, y, 5, 7);
  }
  drawStar(ctx, 640, 150, 26, gold);
  text(ctx, 'THE GILDED HOUR', C.VIEW_W / 2, 250, 'bold 64px Georgia, serif', ink, 'center');
  text(ctx, 'a three-night stealth heist', C.VIEW_W / 2, 300, 'italic 22px Georgia, serif', gold, 'center');
  text(
    ctx,
    'Plan each night. Pack two tools. Read the cones, crack the vault, and be gone before the alarm peaks.',
    C.VIEW_W / 2,
    350,
    '17px system-ui, sans-serif',
    dim,
    'center',
  );
  text(ctx, 'Press ENTER or click to begin', C.VIEW_W / 2, 430, 'bold 20px system-ui, sans-serif', ink, 'center');
  text(
    ctx,
    'WASD / arrows move · Shift sneak · E hold to work · Click toss a coin · Q smoke · M mute',
    C.VIEW_W / 2,
    480,
    '15px system-ui, sans-serif',
    dim,
    'center',
  );
  if (best > 0) {
    text(ctx, `Best career take so far: ${money(best)}`, C.VIEW_W / 2, 540, '16px system-ui, sans-serif', gold, 'center');
  }
  text(ctx, 'Wren is waiting. Moth is on the radio.', C.VIEW_W / 2, 620, 'italic 15px Georgia, serif', dim, 'center');
}

// Planning screen layout (exported so main.js can hit-test clicks).
export const PLAN = {
  blueprint: { x: 40, y: 90, w: 720, h: 540 },
  begin: { x: 790, y: 606, w: 450, h: 56 },
  cards: [
    { x: 790, y: 268, w: 219, h: 96 },
    { x: 1021, y: 268, w: 219, h: 96 },
    { x: 790, y: 374, w: 219, h: 96 },
    { x: 1021, y: 374, w: 219, h: 96 },
    { x: 790, y: 480, w: 219, h: 96 },
    { x: 1021, y: 480, w: 219, h: 96 },
  ],
};

export function drawPlanScreen(ctx, level, selected, best) {
  ctx.fillStyle = '#0d1220';
  ctx.fillRect(0, 0, C.VIEW_W, C.VIEW_H);
  text(ctx, `${level.name} — ${level.place}`, 40, 40, 'bold 26px system-ui, sans-serif', ink);
  text(ctx, `Prize ${money(level.prize)} · ${level.prizeName} · Par ${level.par}s`, 40, 66, '15px system-ui, sans-serif', gold);

  // Blueprint, scaled to the panel.
  const bp = PLAN.blueprint;
  const s = Math.min(bp.w / 1240, bp.h / 640);
  const ox = bp.x + (bp.w - 1240 * s) / 2;
  const oy = bp.y + 40 + (bp.h - 40 - 640 * s) / 2;
  const X = (x) => ox + x * s;
  const Y = (y) => oy + (y - 80) * s;
  ctx.strokeStyle = '#39456b';
  ctx.lineWidth = 2;
  ctx.strokeRect(X(40), Y(80), 1200 * s, 620 * s);
  ctx.fillStyle = '#161d33';
  ctx.fillRect(X(40), Y(80), 1200 * s, 620 * s);
  ctx.fillStyle = '#39456b';
  for (const r of level.walls) ctx.fillRect(X(r.x), Y(r.y), r.w * s, r.h * s);
  for (const f of level.furniture) {
    ctx.fillStyle = '#2c3550';
    ctx.fillRect(X(f.x), Y(f.y), f.w * s, f.h * s);
  }
  // Patrol routes (only with Inside Intel picked) and cameras.
  const intel = selected.includes('intel');
  ctx.setLineDash([6, 5]);
  for (const g of level.guards) {
    ctx.strokeStyle = intel ? '#ffb02e' : 'rgba(154,165,196,0.35)';
    ctx.lineWidth = intel ? 2 : 1;
    ctx.beginPath();
    g.path.forEach((p, i) => {
      if (i === 0) ctx.moveTo(X(p[0]), Y(p[1]));
      else ctx.lineTo(X(p[0]), Y(p[1]));
    });
    ctx.closePath();
    ctx.stroke();
    if (intel) {
      ctx.fillStyle = '#ffb02e';
      ctx.beginPath();
      ctx.arc(X(g.path[0][0]), Y(g.path[0][1]), 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.setLineDash([]);
  for (const c of level.cameras) {
    ctx.fillStyle = intel ? '#7fb4ff' : '#5a6478';
    ctx.beginPath();
    ctx.arc(X(c.x), Y(c.y), 5, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const l of level.lasers) {
    ctx.strokeStyle = danger;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(X(l.x1), Y(l.y1));
    ctx.lineTo(X(l.x2), Y(l.y2));
    ctx.stroke();
  }
  for (const l of level.loot) {
    drawLootIcon(ctx, l.kind, X(l.x), Y(l.y));
    if (intel) text(ctx, money(l.value), X(l.x), Y(l.y) - 16, '11px system-ui, sans-serif', gold, 'center');
  }
  const v = level.vault;
  drawStar(ctx, X(v.x + v.w / 2), Y(v.y + v.h / 2), 9, gold);
  ctx.fillStyle = exit;
  ctx.fillRect(X(level.exit.x), Y(678), level.exit.w * s, 8);
  text(ctx, intel ? 'Routes, cameras and loot shown — Inside Intel' : 'Pick Inside Intel to see patrols and loot values', bp.x + bp.w / 2, bp.y + bp.h - 8, '13px system-ui, sans-serif', dim, 'center');

  // Right column: briefing, then the six tool cards.
  text(ctx, 'MOTH ON THE RADIO', 790, 112, 'bold 13px system-ui, sans-serif', warn);
  wrapText(ctx, level.briefing, 790, 135, 450, 20, '15px system-ui, sans-serif', ink);
  text(ctx, 'PACK TWO TOOLS', 790, 246, 'bold 13px system-ui, sans-serif', warn);
  C.TOOLS.forEach((tool, i) => {
    const r = PLAN.cards[i];
    const on = selected.includes(tool.id);
    ctx.fillStyle = on ? '#3a2f14' : '#161d33';
    rr(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.fill();
    ctx.strokeStyle = on ? gold : '#39456b';
    ctx.lineWidth = on ? 2.5 : 1.5;
    ctx.stroke();
    text(ctx, (on ? '✓ ' : '') + tool.name, r.x + 12, r.y + 22, 'bold 15px system-ui, sans-serif', on ? gold : ink);
    wrapText(ctx, tool.desc, r.x + 12, r.y + 44, r.w - 24, 15, '12px system-ui, sans-serif', dim);
  });
  const begin = PLAN.begin;
  const ready = selected.length === 2;
  ctx.fillStyle = ready ? gold : '#2c3550';
  rr(ctx, begin.x, begin.y, begin.w, begin.h, 8);
  ctx.fill();
  text(ctx, ready ? 'BEGIN THE HEIST' : 'PICK TWO TOOLS', begin.x + begin.w / 2, begin.y + begin.h / 2, 'bold 19px system-ui, sans-serif', ready ? '#1c1405' : dim, 'center');
  if (best > 0) text(ctx, `Career best: ${money(best)}`, 790, 690, '13px system-ui, sans-serif', dim);
}

function wrapText(ctx, str, x, y, maxW, lineH, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const words = str.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}

export function drawTallyScreen(ctx, level, tally, outcome, endReason) {
  ctx.fillStyle = 'rgba(10,14,26,0.94)';
  ctx.fillRect(0, 0, C.VIEW_W, C.VIEW_H);
  const cx = C.VIEW_W / 2;
  const won = outcome === 'won';
  text(ctx, won ? 'CLEAN GETAWAY' : 'YOU SLIPPED OUT', cx, 150, 'bold 44px Georgia, serif', won ? gold : ink, 'center');
  text(ctx, endReason, cx, 195, 'italic 18px Georgia, serif', dim, 'center');
  text(ctx, `${level.name} · ${level.place}`, cx, 235, '16px system-ui, sans-serif', ink, 'center');
  const rows = [
    ['Loot carried', money(tally.loot)],
    ['Time bonus', money(tally.timeBonus)],
    ['Ghost bonus — never truly seen', tally.ghost ? money(tally.ghost) : '—'],
    ['Cool head — peak alarm under 50%', tally.cool ? money(tally.cool) : '—'],
  ];
  let y = 300;
  for (const [label, value] of rows) {
    text(ctx, label, cx - 220, y, '17px system-ui, sans-serif', dim);
    text(ctx, value, cx + 220, y, 'bold 17px system-ui, sans-serif', ink, 'right');
    y += 40;
  }
  ctx.strokeStyle = '#39456b';
  ctx.beginPath();
  ctx.moveTo(cx - 220, y - 8);
  ctx.lineTo(cx + 220, y - 8);
  ctx.stroke();
  text(ctx, 'Night take', cx - 220, y + 22, 'bold 20px system-ui, sans-serif', ink);
  text(ctx, money(tally.total), cx + 220, y + 22, 'bold 24px system-ui, sans-serif', gold, 'right');
  text(ctx, `Peak alarm ${tally.peakAlarm}% · ${Math.round(tally.time)}s on the floor`, cx, y + 70, '14px system-ui, sans-serif', dim, 'center');
  text(ctx, 'Press ENTER for the next night', cx, y + 120, 'bold 18px system-ui, sans-serif', ink, 'center');
}

export function drawBustedScreen(ctx, level, tally, endReason) {
  ctx.fillStyle = 'rgba(20,8,10,0.94)';
  ctx.fillRect(0, 0, C.VIEW_W, C.VIEW_H);
  const cx = C.VIEW_W / 2;
  text(ctx, 'BUSTED', cx, 220, 'bold 64px Georgia, serif', danger, 'center');
  text(ctx, endReason, cx, 280, 'italic 20px Georgia, serif', ink, 'center');
  text(ctx, `${level.name} · ${level.place} — the crew walks away empty-handed tonight.`, cx, 330, '16px system-ui, sans-serif', dim, 'center');
  if (tally) text(ctx, `Loot dropped: ${money(tally.loot)}`, cx, 380, '16px system-ui, sans-serif', dim, 'center');
  text(ctx, 'Press ENTER to try the night again', cx, 460, 'bold 18px system-ui, sans-serif', ink, 'center');
}

export function drawCareerScreen(ctx, totals, best) {
  ctx.fillStyle = '#0d1220';
  ctx.fillRect(0, 0, C.VIEW_W, C.VIEW_H);
  const cx = C.VIEW_W / 2;
  text(ctx, 'THE CAREER TALLY', cx, 140, 'bold 44px Georgia, serif', gold, 'center');
  text(ctx, 'Three nights. One crew. Moth is already planning the next city.', cx, 185, 'italic 18px Georgia, serif', dim, 'center');
  let y = 270;
  totals.forEach((row, i) => {
    text(ctx, row.name, cx - 220, y, '18px system-ui, sans-serif', ink);
    text(ctx, row.outcome === 'won' ? money(row.total) : row.outcome === 'fled' ? money(row.total) + ' (fled)' : '— busted', cx + 220, y, 'bold 18px system-ui, sans-serif', row.outcome === 'won' ? gold : dim, 'right');
    y += 44;
  });
  const sum = totals.reduce((a, r) => a + (r.outcome === 'busted' ? 0 : r.total), 0);
  ctx.strokeStyle = '#39456b';
  ctx.beginPath();
  ctx.moveTo(cx - 220, y - 8);
  ctx.lineTo(cx + 220, y - 8);
  ctx.stroke();
  text(ctx, 'Career take', cx - 220, y + 24, 'bold 22px system-ui, sans-serif', ink);
  text(ctx, money(sum), cx + 220, y + 24, 'bold 26px system-ui, sans-serif', gold, 'right');
  if (sum >= best && sum > 0) text(ctx, 'A new career best.', cx, y + 70, '16px system-ui, sans-serif', gold, 'center');
  text(ctx, 'Press ENTER to run it back', cx, y + 130, 'bold 18px system-ui, sans-serif', ink, 'center');
}
