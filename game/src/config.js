// The Gilded Hour — all tuning in one place.
// A top-down stealth heist: three nights, each harder than the last.
// Numbers here are the game's balance; the simulation in world.js reads them.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HUD_H = 64;

// The thief — Wren.
export const THIEF_R = 12;
export const WALK_SPEED = 170; // px per second, empty-handed
export const SNEAK_SPEED = 95; // Shift: slow, quiet, half as visible
export const SNEAK_SOLES_SPEED = 130; // Soft Soles make sneaking quicker
export const BAG_SLOW_PER_ITEM = 0.05; // each loot item weighs the bag down
export const BAG_SLOW_MIN = 0.6; // never slower than 60%

// Guards.
export const GUARD_R = 13;
export const GUARD_PATROL_SPEED = 72;
export const GUARD_INVESTIGATE_SPEED = 125;
export const GUARD_SEARCH_SPEED = 100; // sweeping the last-seen spot
export const GUARD_CHASE_SPEED = 205; // faster than a walk, slower than a sprint
export const CATCH_DIST = 27; // a touch ends the night
export const SEARCH_SECONDS = 3.0; // how long a guard scans the last-seen spot
export const CHASE_MEMORY_SECONDS = 2.0; // sight lost this long -> fall back to search

// Eyes.
export const VISION_RANGE = 230;
export const VISION_HALF_ANGLE = 0.56; // ~32 degrees each side
export const SNEAK_VISION_FACTOR = 0.5; // sneaking halves how far a guard sees
export const SUSPICION_NEAR = 1.5; // per second, thief close and in the open
export const SUSPICION_FAR = 0.55; // per second, thief at the edge of the cone
export const SNEAK_SUSPICION_FACTOR = 0.5;
export const SMOKE_VISION_BLOCK = true; // smoke clouds block every cone

// Cameras sweep and trip the alarm.
export const CAMERA_RANGE = 260;
export const CAMERA_HALF_ANGLE = 0.44;
export const CAMERA_TRIP = 26;
export const CAMERA_COOLDOWN = 6; // seconds before the same camera can trip again

// Lasers: cross the beam and it trips.
export const LASER_TRIP = 30;
export const LASER_COOLDOWN = 8;

// The alarm.
export const SEEN_ALARM = 34; // a guard getting a good look shouts
export const ALARM_DECAY = 2.5; // per second, while nobody is onto you
export const ALARM_GRACE_AFTER_TRIP = 3; // seconds before decay resumes
export const LOCKDOWN_SECONDS = 25; // at 100 the building seals; get out in time

// Hands: hold E to work a lock or a loot channel.
export const LOOT_CHANNEL = 1.2; // seconds to pocket one loot item
export const VAULT_CHANNEL = 6.0; // seconds to crack the vault
export const PICKS_FACTOR = 0.5; // Feather Picks: channels twice as fast
export const INTEL_VAULT_FACTOR = 0.5; // Inside Intel: the vault code is known
export const INTERACT_DIST = 40; // how close you must stand to work something

// Tools (pick two each night).
export const TOOLS = [
  { id: 'coin', name: 'Coin Pouch', desc: 'Click to toss a coin (3). Guards walk over to the clink.' },
  { id: 'cutters', name: 'Wire Cutters', desc: 'Press E by a camera or laser to cut it dead for the night.' },
  { id: 'smoke', name: 'Smoke Vials', desc: 'Press Q to drop smoke (2). No cone sees through it.' },
  { id: 'picks', name: 'Feather Picks', desc: 'Locks and loot open twice as fast in your hands.' },
  { id: 'soles', name: 'Soft Soles', desc: 'Sneak faster, and your steps are heard half as far.' },
  { id: 'intel', name: 'Inside Intel', desc: 'Planning shows patrols, cameras and loot. Vault opens twice as fast.' },
];
export const COIN_USES = 3;
export const COIN_HEAR_RADIUS = 260;
export const COIN_THROW_RANGE = 340;
export const SMOKE_USES = 2;
export const SMOKE_SECONDS = 5;
export const SMOKE_R = 92;
export const HEAR_WALK = 100; // a guard this close hears plain footsteps
export const HEAR_WALK_SOLES = 45;

// Scoring.
export const GHOST_BONUS = 25000; // never truly seen all night
export const COOLHEAD_BONUS = 8000; // peak alarm under 50
export const COOLHEAD_PEAK = 50;
export const TIME_BONUS_RATE = 50; // dollars per second under par

// Palette — safe cover reads cool, danger reads warm, loot reads gold.
export const COLORS = {
  floorA: '#1c2438',
  floorB: '#202941',
  wall: '#0d1220',
  wallTop: '#39456b',
  furniture: '#2c3550',
  furnitureTop: '#4a5878',
  gold: '#f5c542',
  exit: '#37c978',
  danger: '#ff5a4e',
  warn: '#ffb02e',
  ink: '#e8ecf7',
  dim: '#9aa5c4',
  vault: '#8a6d2f',
};
