// Staged scenes for the screenshots (?shot=heist|plan|vault|getaway).
// Each one is a real world state rendered by the real renderer — the same
// simulation, the same paint code, a frozen moment instead of a played
// one. The getaway tally is even computed by the real scoring code: the
// world is set up mid-win and stepped once through the exit.

import { LEVELS } from './levels.js';
import { createWorld, stepWorld } from './world.js';

function stageHeist() {
  const world = createWorld(LEVELS[0], ['coin', 'smoke']);
  world.thief.x = 500;
  world.thief.y = 420;
  world.thief.angle = -Math.PI / 2;
  world.guards[0].x = 200;
  world.guards[0].y = 110;
  world.guards[0].angle = 0;
  world.guards[1].x = 1000;
  world.guards[1].y = 640;
  world.guards[1].angle = Math.PI;
  world.cameras[0].angle = Math.PI / 2 + 0.3;
  world.alarm = 34;
  world.peakAlarm = 34;
  return { screen: 'play', world, selected: ['coin', 'smoke'], levelIndex: 0 };
}

function stagePlan() {
  return { screen: 'plan', world: null, selected: ['intel', 'picks'], levelIndex: 0 };
}

function stageVault() {
  const world = createWorld(LEVELS[0], ['picks', 'intel']);
  const v = world.level.vault;
  world.thief.x = 1120;
  world.thief.y = 212;
  world.thief.angle = -Math.PI / 2;
  world.thief.channel = {
    kind: 'vault',
    target: v,
    need: 6,
    t: 4.2,
    x: v.x + v.w / 2,
    y: v.y + v.h / 2,
  };
  world.guards[0].x = 200;
  world.guards[0].y = 280;
  world.guards[0].angle = Math.PI / 2;
  world.guards[1].x = 860;
  world.guards[1].y = 480;
  world.guards[1].angle = -Math.PI / 2;
  world.cameras[0].angle = Math.PI / 2 + 0.4;
  world.alarm = 41;
  world.peakAlarm = 41;
  return { screen: 'play', world, selected: ['picks', 'intel'], levelIndex: 0 };
}

function stageGetaway() {
  const world = createWorld(LEVELS[0], ['coin', 'soles']);
  // A night already won in every way but the walk out: three loot items
  // pocketed, the vault cracked, never seen, alarm kept low.
  for (const l of world.loot.slice(0, 3)) {
    l.taken = true;
    world.thief.bag.push(l);
    world.thief.lootValue += l.value;
  }
  world.vaultOpen = true;
  world.prizeTaken = true;
  world.thief.lootValue += world.level.prize;
  world.seen = false;
  world.peakAlarm = 34;
  world.time = 96;
  world.thief.x = 640;
  world.thief.y = 686;
  // One real step through the exit: the tally below is the game's own.
  stepWorld(world, { mx: 0, my: 0, sneak: false, interact: false, smoke: false, coin: null }, 1 / 60);
  return { screen: 'tally', world, selected: ['coin', 'soles'], levelIndex: 0 };
}

export const SHOTS = {
  heist: stageHeist,
  plan: stagePlan,
  vault: stageVault,
  getaway: stageGetaway,
};

export function setupShot(name) {
  const fn = SHOTS[name];
  if (!fn) return null;
  return fn();
}
