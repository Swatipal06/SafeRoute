const KEY = import.meta.env.VITE_CARTO_API_KEY;
const withKey = (url) => (KEY ? `${url}?key=${KEY}` : url);

export const DARK_TILES = withKey('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png');
export const VOYAGER_TILES = withKey('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png');
