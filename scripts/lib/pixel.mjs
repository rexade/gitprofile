// Tiny pixel-art toolkit: a 5x7 bitmap font and a sprite renderer.
// Everything is drawn as crisp <rect>s, so it looks identical everywhere
// and needs no web fonts.

const G = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
  J: ['..###', '...#.', '...#.', '...#.', '#..#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
  7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  9: ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
  ' ': ['...', '...', '...', '...', '...', '...', '...'],
  '!': ['#', '#', '#', '#', '#', '.', '#'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  '.': ['.', '.', '.', '.', '.', '.', '#'],
  ',': ['..', '..', '..', '..', '.#', '.#', '#.'],
  "'": ['#', '#', '.', '.', '.', '.', '.'],
  ':': ['.', '#', '.', '.', '.', '#', '.'],
  '-': ['...', '...', '...', '###', '...', '...', '...'],
  '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
  '&': ['.##..', '#..#.', '#.#..', '.#...', '#.#.#', '#..#.', '.##.#'],
  '>': ['#...', '.#..', '..#.', '...#', '..#.', '.#..', '#...'],
  '<': ['...#', '..#.', '.#..', '#...', '.#..', '..#.', '...#'],
  '+': ['.....', '.....', '..#..', '.###.', '..#..', '.....', '.....'],
  '#': ['.#.#.', '.#.#.', '#####', '.#.#.', '#####', '.#.#.', '.#.#.'],
  '_': ['.....', '.....', '.....', '.....', '.....', '.....', '#####'],
};

export const GLYPH_HEIGHT = 7;

function glyph(ch) {
  return G[ch] ?? G[ch.toUpperCase()] ?? G['?'];
}

/** Width in px of `text` drawn with the pixel font. */
export function measurePixelText(text, cell, spacing = 1) {
  const chars = [...text];
  const cols = chars.reduce((sum, ch) => sum + glyph(ch)[0].length, 0);
  return (cols + spacing * Math.max(0, chars.length - 1)) * cell;
}

/**
 * Lay out `text` as a list of lit cells: [{ x, y, col, row }].
 * `col` is the global column index, handy for staggered animations.
 */
export function pixelCells(text, { x = 0, y = 0, cell = 4, spacing = 1, align = 'start' } = {}) {
  const width = measurePixelText(text, cell, spacing);
  let cursor = align === 'middle' ? x - width / 2 : align === 'end' ? x - width : x;
  const cells = [];
  let colBase = 0;
  for (const ch of text) {
    const rows = glyph(ch);
    rows.forEach((line, r) => {
      [...line].forEach((px, c) => {
        if (px === '#') cells.push({ x: cursor + c * cell, y: y + r * cell, col: colBase + c, row: r });
      });
    });
    const w = rows[0].length;
    cursor += (w + spacing) * cell;
    colBase += w + spacing;
  }
  return { cells, width, height: GLYPH_HEIGHT * cell };
}

/** Pixel text as a single <path> (one element, fast to render). */
export function pixelText(text, { fill = '#fff', className, ...opts } = {}) {
  const { cells, width, height } = pixelCells(text, opts);
  const cell = opts.cell ?? 4;
  const d = cells.map((c) => `M${n(c.x)} ${n(c.y)}h${cell}v${cell}h-${cell}z`).join('');
  const cls = className ? ` class="${className}"` : '';
  return { svg: `<path${cls} fill="${fill}" d="${d}"/>`, width, height };
}

/**
 * Render a sprite given as rows of characters. Each character maps to a
 * colour in `palette`; '.' (or any unmapped char) is transparent.
 * Horizontal runs of the same colour are merged into one rect.
 */
export function sprite(rows, palette, { x = 0, y = 0, cell = 4 } = {}) {
  const byColor = new Map();
  rows.forEach((line, r) => {
    let c = 0;
    while (c < line.length) {
      const ch = line[c];
      const color = palette[ch];
      if (!color) { c++; continue; }
      let end = c + 1;
      while (end < line.length && line[end] === ch) end++;
      const d = `M${n(x + c * cell)} ${n(y + r * cell)}h${n((end - c) * cell)}v${cell}h-${n((end - c) * cell)}z`;
      if (!byColor.has(color)) byColor.set(color, []);
      byColor.get(color).push(d);
      c = end;
    }
  });
  return [...byColor].map(([color, ds]) => `<path fill="${color}" d="${ds.join('')}"/>`).join('');
}

export function spriteSize(rows, cell) {
  return { width: Math.max(...rows.map((r) => r.length)) * cell, height: rows.length * cell };
}

function n(v) {
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/\.?0+$/, '');
}
