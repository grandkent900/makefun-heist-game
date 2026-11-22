// The three nights of The Gilded Hour.
// Each night is data: walls and furniture (rectangles the thief and the
// guards collide with), loot, the vault and its prize, the exit, and the
// patrol loops, cameras and lasers that guard them. Patrol routes were
// laid out inside open corridors — no route crosses a wall.
// Play area: x 40..1240, y 80..700 (the HUD owns the top 64 pixels).

export const LEVELS = [
  {
    name: 'Night One',
    place: 'Meridian Trust Bank',
    prize: 60000,
    prizeName: 'The Meridian Star',
    par: 150,
    briefing:
      'Moth here. The Star sits in the vault, top right. One camera watches the approach and two guards walk the floor. Take your time — the night is young.',
    entry: { x: 90, y: 650 },
    exit: { x: 596, y: 678, w: 88, h: 22 },
    vault: { x: 1050, y: 100, w: 140, h: 96, prize: 60000, name: 'The Meridian Star' },
    walls: [
      { x: 420, y: 80, w: 24, h: 240 },
      { x: 420, y: 480, w: 24, h: 220 },
      { x: 780, y: 80, w: 24, h: 200 },
      { x: 780, y: 460, w: 24, h: 240 },
      { x: 560, y: 560, w: 220, h: 24 },
    ],
    furniture: [
      { x: 120, y: 140, w: 120, h: 56, label: 'desks' },
      { x: 120, y: 320, w: 120, h: 56, label: 'desks' },
      { x: 920, y: 560, w: 130, h: 56, label: 'desks' },
      { x: 1000, y: 240, w: 90, h: 50, label: 'counter' },
    ],
    loot: [
      { x: 170, y: 620, kind: 'cash', value: 4000 },
      { x: 500, y: 150, kind: 'gold', value: 7000 },
      { x: 640, y: 130, kind: 'painting', value: 9000 },
      { x: 1100, y: 460, kind: 'jewel', value: 12000 },
    ],
    guards: [
      { path: [[90, 110], [380, 110], [380, 280], [90, 280]], wait: 0.8 },
      { path: [[860, 320], [1180, 320], [1180, 640], [860, 640]], wait: 0.8 },
    ],
    cameras: [{ x: 960, y: 92, base: Math.PI / 2, sweep: 0.55, speed: 0.5, range: 260 }],
    lasers: [],
  },
  {
    name: 'Night Two',
    place: 'Pemberton Gallery',
    prize: 85000,
    prizeName: 'The Pemberton Vermeer',
    par: 180,
    briefing:
      'The gallery hangs the Vermeer behind glass, top right. Three guards now, two cameras, and a laser across the east gap — slip above it, under it, or cut it. Mind the paintings: they are worth carrying.',
    entry: { x: 90, y: 650 },
    exit: { x: 596, y: 678, w: 88, h: 22 },
    vault: { x: 1050, y: 100, w: 140, h: 96, prize: 85000, name: 'The Pemberton Vermeer' },
    walls: [
      { x: 400, y: 80, w: 24, h: 220 },
      { x: 400, y: 460, w: 24, h: 240 },
      { x: 760, y: 80, w: 24, h: 180 },
      { x: 760, y: 420, w: 24, h: 280 },
      { x: 560, y: 300, w: 200, h: 24 },
    ],
    furniture: [
      { x: 110, y: 140, w: 110, h: 50, label: 'plinth' },
      { x: 110, y: 480, w: 110, h: 50, label: 'plinth' },
      { x: 900, y: 560, w: 130, h: 56, label: 'bench' },
      { x: 900, y: 140, w: 110, h: 50, label: 'plinth' },
    ],
    loot: [
      { x: 180, y: 620, kind: 'cash', value: 5000 },
      { x: 250, y: 380, kind: 'painting', value: 11000 },
      { x: 620, y: 140, kind: 'gold', value: 9000 },
      { x: 1120, y: 380, kind: 'jewel', value: 15000 },
      { x: 960, y: 645, kind: 'bonds', value: 8000 },
    ],
    guards: [
      { path: [[90, 110], [360, 110], [360, 260], [90, 260]], wait: 0.7 },
      { path: [[460, 120], [720, 120], [720, 260], [460, 260]], wait: 0.7 },
      { path: [[820, 480], [1180, 480], [1180, 650], [820, 650]], wait: 0.7 },
    ],
    cameras: [
      { x: 560, y: 92, base: Math.PI / 2, sweep: 0.6, speed: 0.55, range: 250 },
      { x: 1150, y: 92, base: 2.2, sweep: 0.5, speed: 0.45, range: 250 },
    ],
    lasers: [{ x1: 780, y1: 310, x2: 780, y2: 420 }],
  },
  {
    name: 'Night Three',
    place: 'Crown Reserve Depository',
    prize: 120000,
    prizeName: 'The Crown Reserve',
    par: 210,
    briefing:
      'The big one. Four guards, three cameras, two laser lines, and the Reserve itself behind six seconds of steel. Ghost it — never seen, alarm under half — and the take is legendary.',
    entry: { x: 90, y: 650 },
    exit: { x: 596, y: 678, w: 88, h: 22 },
    vault: { x: 1050, y: 100, w: 140, h: 96, prize: 120000, name: 'The Crown Reserve' },
    walls: [
      { x: 360, y: 80, w: 24, h: 200 },
      { x: 360, y: 440, w: 24, h: 260 },
      { x: 680, y: 80, w: 24, h: 160 },
      { x: 680, y: 400, w: 24, h: 300 },
      { x: 980, y: 80, w: 24, h: 180 },
      { x: 980, y: 420, w: 24, h: 280 },
      { x: 480, y: 520, w: 200, h: 24 },
    ],
    furniture: [
      { x: 100, y: 140, w: 100, h: 48, label: 'crates' },
      { x: 100, y: 480, w: 100, h: 48, label: 'crates' },
      { x: 1080, y: 560, w: 120, h: 52, label: 'crates' },
      { x: 1080, y: 300, w: 100, h: 48, label: 'crates' },
    ],
    loot: [
      { x: 170, y: 620, kind: 'cash', value: 6000 },
      { x: 240, y: 360, kind: 'painting', value: 13000 },
      { x: 540, y: 150, kind: 'gold', value: 10000 },
      { x: 860, y: 140, kind: 'jewel', value: 16000 },
      { x: 1140, y: 650, kind: 'bonds', value: 10000 },
      { x: 760, y: 640, kind: 'relic', value: 9000 },
    ],
    guards: [
      { path: [[80, 110], [320, 110], [320, 240], [80, 240]], wait: 0.6 },
      { path: [[420, 120], [640, 120], [640, 220], [420, 220]], wait: 0.6 },
      { path: [[720, 300], [940, 300], [940, 380], [720, 380]], wait: 0.6 },
      { path: [[820, 480], [1180, 480], [1180, 650], [820, 650]], wait: 0.6 },
    ],
    cameras: [
      { x: 480, y: 92, base: Math.PI / 2, sweep: 0.6, speed: 0.6, range: 250 },
      { x: 820, y: 92, base: Math.PI / 2, sweep: 0.5, speed: 0.5, range: 250 },
      { x: 1150, y: 92, base: 2.4, sweep: 0.5, speed: 0.55, range: 250 },
    ],
    lasers: [
      { x1: 690, y1: 280, x2: 690, y2: 380 },
      { x1: 990, y1: 300, x2: 990, y2: 400 },
    ],
  },
];

export const LOOT_LABELS = {
  cash: 'Cash',
  gold: 'Gold bars',
  painting: 'Painting',
  jewel: 'Jewels',
  bonds: 'Bonds',
  relic: 'Relic',
};

export function money(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}
