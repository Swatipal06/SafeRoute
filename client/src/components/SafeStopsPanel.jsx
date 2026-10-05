import React, { useState } from 'react';
import { CATEGORY_CONFIG } from '../utils/safeStopIcons';

function SafeStopsPanel({
  safeStopsData,
  isLoading,
  error,
  selectedCategory,
  setSelectedCategory,
  radius,
  setRadius,
  onSelectStop,
  activeRouteMode,
  isOpen,
  onToggleOpen,
  comparisonData
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showComparison, setShowComparison] = useState(false);

  const stops = safeStopsData?.stops || [];
  const summary = safeStopsData?.summary || {
    total: 0,
    cafe: 0,
    restaurant: 0,
    hotel: 0,
    hospital: 0,
    police: 0,
    pharmacy: 0,
    fuel: 0,
    atm: 0,
    shop: 0
  };
  const highlights = safeStopsData?.highlights || {};

  // Filter stops by selected category and search query
  const filteredStops = stops.filter((stop) => {
    const matchesCategory =
      selectedCategory === 'all' || stop.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      stop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (stop.tags.brand && stop.tags.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categoriesList = [
    { id: 'all', label: 'All', icon: '🌐', count: summary.total || 0 },
    { id: 'cafe', label: 'Cafes', icon: '☕', count: summary.cafe || 0 },
    { id: 'restaurant', label: 'Restaurants', icon: '🍴', count: summary.restaurant || 0 },
    { id: 'hotel', label: 'Hotels', icon: '🏨', count: summary.hotel || 0 },
    { id: 'hospital', label: 'Hospitals', icon: '🏥', count: summary.hospital || 0 },
    { id: 'police', label: 'Police', icon: '👮', count: summary.police || 0 },
    { id: 'pharmacy', label: 'Pharmacies', icon: '💊', count: summary.pharmacy || 0 },
    { id: 'fuel', label: 'Fuel', icon: '⛽', count: summary.fuel || 0 },
    { id: 'atm', label: 'ATMs', icon: '🏧', count: summary.atm || 0 },
    { id: 'shop', label: 'Shops', icon: '🛒', count: summary.shop || 0 }
  ];

  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="pointer-events-auto bg-[#0f1424]/90 backdrop-blur-xl border border-neonGreen/40 hover:border-neonGreen px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-white transition-all hover:scale-105 group"
      >
        <div className="w-8 h-8 rounded-xl bg-neonGreen/20 flex items-center justify-center text-neonGreen group-hover:bg-neonGreen group-hover:text-black transition-colors font-bold text-sm">
          🛡️
        </div>
        <div className="flex flex-col items-start text-left">
          <span className="text-xs font-black uppercase tracking-wider text-neonGreen">Safe Stops</span>
          <span className="text-xs text-gray-300 font-medium">
            {isLoading ? 'Scanning...' : `${summary.total || 0} facilities near route`}
          </span>
        </div>
      </button>
    );
  }

  return (
    <div className="pointer-events-auto bg-[#0f1424]/95 backdrop-blur-2xl border border-gray-700/80 rounded-3xl shadow-2xl w-80 sm:w-96 max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 transition-all">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-[#1a1f35] to-[#0f1424]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-neonGreen/20 border border-neonGreen/30 flex items-center justify-center text-base">
            🛡️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-white text-base tracking-wide">Safe Stops</h3>
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${activeRouteMode === 'safest' ? 'bg-neonGreen/20 text-neonGreen border border-neonGreen/40' : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'}`}>
                {activeRouteMode} Route
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">
              Useful facilities within {radius}m of route
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {comparisonData && (
            <button
              onClick={() => setShowComparison(!showComparison)}
              title="Compare Route Facilities"
              className={`p-1.5 rounded-xl border text-xs font-bold transition-colors ${showComparison ? 'bg-accentPurple text-white border-accentPurple' : 'bg-[#1a1f35] text-gray-400 border-gray-700 hover:text-white'}`}
            >
              ⚖️
            </button>
          )}
          <button
            onClick={onToggleOpen}
            className="p-1.5 rounded-xl bg-[#1a1f35] text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Corridor Radius Selector */}
      <div className="px-4 py-2 bg-[#141829] border-b border-gray-800/80 flex items-center justify-between text-xs">
        <span className="text-gray-400 font-semibold flex items-center gap-1">
          <span>📏</span> Route Corridor:
        </span>
        <div className="flex gap-1">
          {[250, 500, 1000].map((r) => (
            <button
              key={r}
              onClick={() => setRadius(r)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                radius === r
                  ? 'bg-neonGreen text-black shadow-[0_0_8px_rgba(46,204,113,0.4)]'
                  : 'bg-[#1a1f35] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {r >= 1000 ? `${r / 1000}km` : `${r}m`}
            </button>
          ))}
        </div>
      </div>

      {/* Route Comparison Subpanel (if toggled) */}
      {showComparison && comparisonData && (
        <div className="p-3 bg-[#1a1f35]/90 border-b border-gray-700/60 text-xs">
          <div className="font-bold text-gray-300 mb-2 flex items-center justify-between">
            <span>Route Facilities Comparison</span>
            <span className="text-[10px] text-gray-500">Corridor: {radius}m</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-[#0f1424] p-2 rounded-xl border border-neonGreen/30">
              <div className="text-[10px] text-neonGreen font-bold uppercase mb-1">Safest Route</div>
              <div className="text-lg font-black text-white">{comparisonData.safestCount} <span className="text-xs font-normal text-gray-400">stops</span></div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {comparisonData.safestPolice} 👮 · {comparisonData.safestHospital} 🏥
              </div>
            </div>
            <div className="bg-[#0f1424] p-2 rounded-xl border border-blue-500/30">
              <div className="text-[10px] text-blue-400 font-bold uppercase mb-1">Fastest Route</div>
              <div className="text-lg font-black text-white">{comparisonData.fastestCount} <span className="text-xs font-normal text-gray-400">stops</span></div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {comparisonData.fastestPolice} 👮 · {comparisonData.fastestHospital} 🏥
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency & Essential Highlights */}
      {!isLoading && !error && (highlights.nearestEmergency || highlights.nearestPharmacy || highlights.nearestBreak) && (
        <div className="px-4 py-2.5 bg-[#121626] border-b border-gray-800/80 flex gap-2 overflow-x-auto custom-scrollbar">
          {highlights.nearestPolice && (
            <div 
              onClick={() => onSelectStop(highlights.nearestPolice)}
              className="flex-shrink-0 bg-blue-950/40 border border-blue-500/40 rounded-xl p-2 cursor-pointer hover:border-blue-400 transition-colors flex items-center gap-2 text-left"
            >
              <span className="text-base">👮</span>
              <div>
                <div className="text-[9px] text-blue-400 uppercase font-black tracking-wider">Nearest Police</div>
                <div className="text-xs font-bold text-white truncate max-w-[110px]">{highlights.nearestPolice.name}</div>
                <div className="text-[10px] text-gray-400">{highlights.nearestPolice.distanceFromRoute}m from route</div>
              </div>
            </div>
          )}

          {highlights.nearestHospital && (
            <div 
              onClick={() => onSelectStop(highlights.nearestHospital)}
              className="flex-shrink-0 bg-red-950/40 border border-red-500/40 rounded-xl p-2 cursor-pointer hover:border-red-400 transition-colors flex items-center gap-2 text-left"
            >
              <span className="text-base">🏥</span>
              <div>
                <div className="text-[9px] text-red-400 uppercase font-black tracking-wider">Nearest Hospital</div>
                <div className="text-xs font-bold text-white truncate max-w-[110px]">{highlights.nearestHospital.name}</div>
                <div className="text-[10px] text-gray-400">{highlights.nearestHospital.distanceFromRoute}m from route</div>
              </div>
            </div>
          )}

          {highlights.nearestPharmacy && (
            <div 
              onClick={() => onSelectStop(highlights.nearestPharmacy)}
              className="flex-shrink-0 bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-2 cursor-pointer hover:border-emerald-400 transition-colors flex items-center gap-2 text-left"
            >
              <span className="text-base">💊</span>
              <div>
                <div className="text-[9px] text-emerald-400 uppercase font-black tracking-wider">Nearest Pharmacy</div>
                <div className="text-xs font-bold text-white truncate max-w-[110px]">{highlights.nearestPharmacy.name}</div>
                <div className="text-[10px] text-gray-400">{highlights.nearestPharmacy.distanceFromRoute}m from route</div>
              </div>
            </div>
          )}

          {highlights.nearestBreak && (
            <div 
              onClick={() => onSelectStop(highlights.nearestBreak)}
              className="flex-shrink-0 bg-amber-950/40 border border-amber-500/40 rounded-xl p-2 cursor-pointer hover:border-amber-400 transition-colors flex items-center gap-2 text-left"
            >
              <span className="text-base">☕</span>
              <div>
                <div className="text-[9px] text-amber-400 uppercase font-black tracking-wider">Nearest Break</div>
                <div className="text-xs font-bold text-white truncate max-w-[110px]">{highlights.nearestBreak.name}</div>
                <div className="text-[10px] text-gray-400">{highlights.nearestBreak.distanceFromRoute}m from route</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category Pills Filter */}
      <div className="p-3 border-b border-gray-800/80 bg-[#0f1424]">
        <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
          {categoriesList.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-neonGreen to-green-400 text-black shadow-[0_0_12px_rgba(46,204,113,0.4)] scale-[1.03]'
                    : 'bg-[#1a1f35] text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-800'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isSelected ? 'bg-black text-neonGreen' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search inside filtered list */}
        <div className="mt-2 relative">
          <input
            type="text"
            placeholder="Search stops by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a1f35] border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-neonGreen"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Stops List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 min-h-[160px] max-h-72">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
            <div className="w-8 h-8 border-2 border-neonGreen border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-medium text-gray-300">Finding useful places along your route...</p>
            <p className="text-[10px] text-gray-500 mt-1">Analyzing OSM corridor within {radius}m</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-950/30 border border-red-500/40 rounded-2xl text-center">
            <div className="text-red-400 text-sm font-bold mb-1">⚠️ Notice</div>
            <p className="text-xs text-red-200">{error}</p>
          </div>
        ) : filteredStops.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-xs font-semibold text-gray-300">No useful stops found</p>
            <p className="text-[11px] text-gray-500 mt-1">
              Try increasing the corridor radius to 1km or switching categories.
            </p>
          </div>
        ) : (
          filteredStops.map((stop) => {
            const catCfg = CATEGORY_CONFIG[stop.category] || {
              icon: '📍',
              color: '#2ecc71',
              bg: 'bg-green-500/20',
              border: 'border-green-500/50',
              text: 'text-green-400'
            };

            return (
              <div
                key={stop.id}
                onClick={() => onSelectStop(stop)}
                className="bg-[#1a1f35]/70 hover:bg-[#1a1f35] border border-gray-800/80 hover:border-gray-600 rounded-2xl p-3 transition-all cursor-pointer group flex items-start justify-between gap-3 text-left"
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl ${catCfg.bg} border ${catCfg.border} flex items-center justify-center text-sm flex-shrink-0 mt-0.5`}
                  >
                    {catCfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${catCfg.text}`}>
                        {catCfg.label || stop.category}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-white truncate group-hover:text-neonGreen transition-colors">
                      {stop.name}
                    </div>
                    {stop.tags.address && (
                      <div className="text-[10px] text-gray-400 truncate mt-0.5">
                        📍 {stop.tags.address}
                      </div>
                    )}
                    {stop.tags.openingHours && (
                      <div className="text-[10px] text-gray-400 truncate">
                        🕒 {stop.tags.openingHours}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0 flex flex-col items-end">
                  <span className="text-xs font-black text-white bg-[#0f1424] px-2 py-0.5 rounded-lg border border-gray-800">
                    {stop.distanceFromRoute}m
                  </span>
                  <span className="text-[9px] text-gray-500 mt-1">from route</span>
                  {stop.distanceAlongRoute > 0 && (
                    <span className="text-[9px] text-neonGreen font-medium mt-0.5">
                      +{(stop.distanceAlongRoute / 1000).toFixed(1)}km in
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-[#121626] border-t border-gray-800/80 text-[10px] text-gray-400 flex items-center justify-between">
        <span>Click any facility to inspect on map</span>
        <span className="text-neonGreen font-semibold">OpenStreetMap Verified</span>
      </div>
    </div>
  );
}

export default SafeStopsPanel;
