// 64-entry palette: Victorian parlor at night (west) and a sunlit Chilean village plaza (east).
export const P = {
  white: '#ffffff', ink: '#14121a', black: '#0c0b10', night0: '#0d1030', night1: '#1a2050', night2: '#2c3472',
  cyan: '#4cc4e6', cyan2: '#9be0f2', ice: '#d8f2ff', blue: '#2c63c9', navy: '#23367a', purple: '#7b3fb0', purple2: '#a572d6',
  mtn0: '#8d78a8', mtn1: '#6a5a86', mtn2: '#b59cb0',
  wine: '#7a1f35', wine2: '#561324', rose: '#c46a7a', pink: '#f28bb3',
  gold: '#d8a824', brass: '#a47a1a', lamp: '#ffe9a8', lamp2: '#f7b25a', fire: '#e8602a', red: '#d93a2b',
  wood0: '#d3b88a', wood1: '#b8955f', wood2: '#9a7345', wood3: '#7b5834', wood4: '#5e4227', wood5: '#43301d',
  stone0: '#cfc3ad', stone1: '#a99a82', stone2: '#7d705c', adobe0: '#f0e8d4', adobe1: '#dccaa6', tile0: '#c4713f', tile1: '#a2542b',
  lime: '#8fc93a', green: '#2f9e4f', green2: '#1d6e3a', leaf: '#5d8a3a', teal: '#1fa3a0',
  cream: '#f2e8d0', cloth: '#26232b', grey0: '#9a9aa6', grey1: '#6c6c78', hairG: '#bdb9b2', mustard: '#d9a52a', orange: '#f08a24', yellow: '#f5cf2f', sky0: '#7fd0f0', earth: '#8a6a48', sand: '#d9b98a', lilac: '#a89ac0',
  skin0: '#f1d0b0', skin1: '#d9a17a', skin2: '#a8714c', skin3: '#7a4a2e',
  steel0: '#b6bec3', steel1: '#8e979c', steel2: '#636d73', steel3: '#3c4348',
};
export const PALETTE_HEX = Object.values(P);
if (PALETTE_HEX.length !== 64) throw new Error('palette must have 64 entries, has ' + PALETTE_HEX.length);
export const PALETTE_RGB = PALETTE_HEX.map((hex) => { const n = parseInt(hex.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; });
