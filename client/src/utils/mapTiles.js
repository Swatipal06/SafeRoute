const KEY = import.meta.env.VITE_CARTO_API_KEY;

// If a CARTO API key is provided, use CARTO tiles.
// Otherwise, fall back to free OpenStreetMap tiles (never requires a key and has no watermark).
export const DARK_TILES = KEY
  ? `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${KEY}`
  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export const VOYAGER_TILES = KEY
  ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${KEY}`
  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
