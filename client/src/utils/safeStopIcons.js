import L from 'leaflet';

export const CATEGORY_CONFIG = {
  cafe: {
    label: 'Cafe',
    icon: '☕',
    color: '#f59e0b', // amber
    glow: 'rgba(245, 158, 11, 0.6)',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/50',
    text: 'text-amber-400'
  },
  restaurant: {
    label: 'Restaurant',
    icon: '🍴',
    color: '#f97316', // orange
    glow: 'rgba(249, 115, 22, 0.6)',
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/50',
    text: 'text-orange-400'
  },
  hotel: {
    label: 'Hotel',
    icon: '🏨',
    color: '#8b5cf6', // purple
    glow: 'rgba(139, 92, 246, 0.6)',
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/50',
    text: 'text-purple-400'
  },
  hospital: {
    label: 'Hospital',
    icon: '🏥',
    color: '#ef4444', // red
    glow: 'rgba(239, 68, 68, 0.6)',
    bg: 'bg-red-500/20',
    border: 'border-red-500/50',
    text: 'text-red-400'
  },
  police: {
    label: 'Police',
    icon: '👮',
    color: '#3b82f6', // blue
    glow: 'rgba(59, 130, 246, 0.6)',
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/50',
    text: 'text-blue-400'
  },
  pharmacy: {
    label: 'Pharmacy',
    icon: '💊',
    color: '#10b981', // emerald
    glow: 'rgba(16, 185, 129, 0.6)',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/50',
    text: 'text-emerald-400'
  },
  fuel: {
    label: 'Fuel',
    icon: '⛽',
    color: '#eab308', // yellow
    glow: 'rgba(234, 179, 8, 0.6)',
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/50',
    text: 'text-yellow-400'
  },
  atm: {
    label: 'ATM',
    icon: '🏧',
    color: '#06b6d4', // cyan
    glow: 'rgba(6, 182, 212, 0.6)',
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-500/50',
    text: 'text-cyan-400'
  },
  shop: {
    label: 'Shop',
    icon: '🛒',
    color: '#ec4899', // pink
    glow: 'rgba(236, 72, 153, 0.6)',
    bg: 'bg-pink-500/20',
    border: 'border-pink-500/50',
    text: 'text-pink-400'
  }
};

/**
 * Creates a custom HTML Leaflet icon for a given category
 */
export function createSafeStopIcon(category, isSelected = false) {
  const cfg = CATEGORY_CONFIG[category] || {
    icon: '📍',
    color: '#2ecc71',
    glow: 'rgba(46, 204, 113, 0.6)'
  };

  const size = isSelected ? 36 : 28;
  const fontSize = isSelected ? '18px' : '14px';
  const border = isSelected ? '3px solid #ffffff' : `2px solid ${cfg.color}`;
  const transform = isSelected ? 'scale(1.2)' : 'scale(1)';

  return L.divIcon({
    className: 'custom-safe-stop-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: #0f1424;
        border: ${border};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 12px ${cfg.glow}, 0 4px 8px rgba(0,0,0,0.6);
        transform: ${transform};
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        cursor: pointer;
        user-select: none;
      ">
        <span style="font-size: ${fontSize}; line-height: 1;">${cfg.icon}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4]
  });
}
