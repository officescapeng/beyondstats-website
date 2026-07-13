import React, { useState, useEffect } from 'react';
import { Sun, Moon, AlertTriangle, Skull, Users, Activity } from 'lucide-react';
import nigeriaMap from '@svg-maps/nigeria';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const getSourceName = (url, name) => {
  if (name) return name;
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '');
  } catch (e) {
    return 'News Link';
  }
};

function computeStats(incidents) {
  const totalIncidents = incidents.length;
  const totalFatalities = incidents.reduce((s, i) => s + (i.fatalities || 0), 0);
  const totalAbductions = incidents.reduce((s, i) => s + (i.abductions || 0), 0);
  const totalInjuries = incidents.reduce((s, i) => s + (i.injuries || 0), 0);
  const stateMap = {};
  const typeMap = {};
  for (const i of incidents) {
    if (!i.state) continue;
    const rawState = i.state.trim();
    const normalizedState = rawState.charAt(0).toUpperCase() + rawState.slice(1).toLowerCase();

    if (!stateMap[normalizedState]) stateMap[normalizedState] = { state: normalizedState, count: 0, fatalities: 0, abductions: 0, injuries: 0 };
    stateMap[normalizedState].count++;
    stateMap[normalizedState].fatalities += i.fatalities || 0;
    stateMap[normalizedState].abductions += i.abductions || 0;
    stateMap[normalizedState].injuries += i.injuries || 0;

    const rawType = i.incident_type || 'other';
    const typeKey = getIncidentTypeKey(rawType);
    if (!typeMap[typeKey]) typeMap[typeKey] = { incidentType: typeKey, count: 0, fatalities: 0, abductions: 0, injuries: 0 };
    typeMap[typeKey].count++;
    typeMap[typeKey].fatalities += i.fatalities || 0;
    typeMap[typeKey].abductions += i.abductions || 0;
    typeMap[typeKey].injuries += i.injuries || 0;
  }
  return {
    overall: { totalIncidents, totalFatalities, totalAbductions, totalInjuries },
    byState: Object.values(stateMap).sort((a, b) => b.fatalities - a.fatalities),
    byType: Object.values(typeMap).sort((a, b) => b.count - a.count),
  };
}

const INCIDENT_TYPE_COLORS = {
  terrorism: '#dc2626',
  banditry: '#ea580c',
  kidnapping: '#d97706',
  'armed attack': '#e11d48',
  clash: '#9333ea',
  bombing: '#c026d3',
  other: '#6b7280',
};

const INCIDENT_TYPE_LABELS = {
  terrorism: 'Terrorism',
  banditry: 'Banditry',
  kidnapping: 'Kidnapping',
  'armed attack': 'Armed Attack',
  clash: 'Clash',
  bombing: 'Bombing',
  other: 'Other',
};

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr + 'T00:00:00Z');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  } catch {
    return dateStr;
  }
}

function StatsCards({ overall, isDarkMode }) {
  const cards = [
    { label: 'Total Incidents', value: overall.totalIncidents.toLocaleString(), color: 'text-red-500', icon: AlertTriangle },
    { label: 'People Killed', value: overall.totalFatalities.toLocaleString(), color: 'text-rose-500', icon: Skull },
    { label: 'People Abducted', value: overall.totalAbductions.toLocaleString(), color: 'text-amber-500', icon: Users },
    { label: 'People Injured', value: overall.totalInjuries.toLocaleString(), color: 'text-orange-500', icon: Activity },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div key={card.label} className={`rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow ${isDarkMode ? 'bg-[#051630] border border-white/10' : 'bg-white border border-slate-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{card.label}</span>
              <IconComponent className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className={`text-2xl lg:text-3xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        );
      })}
    </div>
  );
}

function StateHeatmap({ byState, selectedState, onStateClick, isDarkMode }) {
  const statsMap = new Map(byState.map((s) => [s.state ? s.state.toLowerCase().trim() : '', s]));
  const maxFatalities = Math.max(...byState.map((s) => s.fatalities), 1);
  const [tooltip, setTooltip] = useState(null);

  const nameOverrides = { 'Federal Capital Territory': 'FCT' };

  function getHeatColor(fatalities) {
    if (fatalities === 0) return '#e2e8f0';
    const ratio = fatalities / maxFatalities;
    if (ratio > 0.75) return '#7f1d1d';
    if (ratio > 0.5) return '#b91c1c';
    if (ratio > 0.25) return '#dc2626';
    if (ratio > 0.1) return '#f87171';
    return '#fca5a5';
  }

  return (
    <div className={`rounded-xl p-5 shadow-sm ${isDarkMode ? 'bg-[#051630] border border-white/10' : 'bg-white border border-slate-200'}`}>
      <h3 className={`text-sm font-bold mb-4 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>Fatalities by State &mdash; Choropleth</h3>
      <div className="relative">
        <svg viewBox={nigeriaMap.viewBox} className="w-full h-auto drop-shadow-lg select-none">
          {nigeriaMap.locations.map(loc => {
            const stateName = nameOverrides[loc.name] || loc.name;
            const stats = statsMap.get(stateName.toLowerCase().trim());
            const fatalities = stats?.fatalities || 0;
            const color = getHeatColor(fatalities);
            const isSelected = selectedState && selectedState.toLowerCase() === stateName.toLowerCase();
            return (
              <path
                key={loc.id}
                d={loc.path}
                fill={color}
                stroke={isSelected ? '#ffffff' : color === '#e2e8f0' ? '#cbd5e1' : '#ffffff'}
                strokeWidth={isSelected ? '4' : '0.75'}
                className="transition-all duration-200 cursor-pointer hover:opacity-90"
                style={{ ...(isSelected ? { filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.9))' } : {}), transformBox: 'fill-box', transformOrigin: 'center' }}
                onClick={() => onStateClick?.(stateName === selectedState ? null : stateName)}
                onMouseEnter={e => {
                  const svg = e.target.closest('svg');
                  if (!svg) return;
                  const rect = svg.getBoundingClientRect();
                  setTooltip({ state: loc.name, fatalities, incidents: stats?.count || 0, abductions: stats?.abductions || 0, x: e.clientX - rect.left, y: e.clientY - rect.top });
                }}
                onMouseMove={e => {
                  const svg = e.target.closest('svg');
                  if (!svg) return;
                  const rect = svg.getBoundingClientRect();
                  setTooltip(t => t ? { ...t, x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}
        </svg>
        {tooltip && (
          <div className={`absolute pointer-events-none rounded-lg px-3 py-2 text-xs shadow-xl z-10 whitespace-nowrap ${isDarkMode ? 'bg-[#051c3a] border border-white/10 text-white' : 'bg-white border border-slate-200'}`} style={{ left: tooltip.x + 12, top: tooltip.y - 12 }}>
            <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{tooltip.state}</p>
            <p className={isDarkMode ? 'text-slate-300' : 'text-slate-500'}>{tooltip.incidents} incidents</p>
            <p className="text-red-500">{tooltip.fatalities} killed</p>
            <p className="text-amber-600">{tooltip.abductions} abducted</p>
          </div>
        )}
      </div>
        <div className={`flex items-center gap-3 justify-center mt-4 text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        <span>Intensity:</span>
        <div className="flex items-center gap-1"><div className="w-4 h-3 rounded-sm border border-slate-300" style={{backgroundColor:'#e2e8f0'}} /><span>0</span></div>
        <div className="flex items-center gap-1"><div className="w-4 h-3 rounded-sm" style={{backgroundColor:'#fca5a5'}} /><span>Low</span></div>
        <div className="flex items-center gap-1"><div className="w-4 h-3 rounded-sm" style={{backgroundColor:'#dc2626'}} /><span>Med</span></div>
        <div className="flex items-center gap-1"><div className="w-4 h-3 rounded-sm" style={{backgroundColor:'#7f1d1d'}} /><span>High</span></div>
      </div>
    </div>
  );
}

function getIncidentTypeKey(type) {
  if (!type) return 'other';
  const t = type.toLowerCase();
  if (t.includes('terror')) return 'terrorism';
  if (t.includes('bandit')) return 'banditry';
  if (t.includes('kidnap') || t.includes('abduct')) return 'kidnapping';
  if (t.includes('attack')) return 'armed attack';
  if (t.includes('clash')) return 'clash';
  if (t.includes('bomb')) return 'bombing';
  return 'other';
}

function IncidentTable({ incidents, isDarkMode }) {
  if (incidents.length === 0) {
    return <div className={`text-center py-12 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}><p className="text-lg">No incidents found</p></div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className={`border-b ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
            <th className={`text-left py-3 px-3 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Date</th>
            <th className={`text-left py-3 px-3 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Location</th>
            <th className={`text-left py-3 px-3 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Type</th>
            <th className={`text-center py-3 px-3 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Killed</th>
            <th className={`text-center py-3 px-3 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Abducted</th>
            <th className={`text-center py-3 px-3 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Injured</th>
            <th className={`text-left py-3 px-3 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} hidden lg:table-cell`}>Summary</th>
            <th className={`text-center py-3 px-3 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Source</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => {
            const typeKey = getIncidentTypeKey(incident.incident_type);
            const typeColor = INCIDENT_TYPE_COLORS[typeKey] || INCIDENT_TYPE_COLORS.other;
            const typeLabel = INCIDENT_TYPE_LABELS[typeKey] || incident.incident_type;
            return (
              <tr key={incident.id} className={`border-b transition-colors ${isDarkMode ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'}`}>
                <td className={`py-3 px-3 whitespace-nowrap ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(incident.date)}</td>
                <td className="py-3 px-3">
                  <span className={`font-medium ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{incident.state}</span>
                  {incident.lga && <span className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}> &middot; {incident.lga}</span>}
                </td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: typeColor }}>
                    {typeLabel}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  {incident.fatalities > 0 ? <span className="font-bold text-red-500">{incident.fatalities}</span> : <span className={isDarkMode ? 'text-slate-600' : 'text-slate-300'}>&mdash;</span>}
                </td>
                <td className="py-3 px-3 text-center">
                  {incident.abductions > 0 ? <span className="font-bold text-amber-600">{incident.abductions}</span> : <span className={isDarkMode ? 'text-slate-600' : 'text-slate-300'}>&mdash;</span>}
                </td>
                <td className="py-3 px-3 text-center">
                  {incident.injuries > 0 ? <span className="font-bold text-orange-600">{incident.injuries}</span> : <span className={isDarkMode ? 'text-slate-600' : 'text-slate-300'}>&mdash;</span>}
                </td>
                <td className="py-3 px-3 hidden lg:table-cell max-w-xs">
                  <p className={`text-xs leading-relaxed line-clamp-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{incident.summary}</p>
                </td>
                <td className="py-3 px-3 text-center">
                  {getSourceName(incident.source_url, incident.source_name) ? (
                    <a
                      href={incident.source_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider transition-colors ${isDarkMode ? 'bg-white/10 text-slate-400 hover:text-secondary hover:bg-white/20' : 'bg-slate-100 text-slate-500 hover:text-secondary hover:bg-slate-200'}`}
                    >
                      {getSourceName(incident.source_url, incident.source_name)}
                    </a>
                  ) : (
                    <span className={`text-[10px] ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>&mdash;</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ConflictTracker() {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterState, setFilterState] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedMapState, setSelectedMapState] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(10);

  useEffect(() => {
    setDisplayLimit(10);
  }, [filterState, filterType, selectedMapState]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        let res = await fetch(`${SUPABASE_URL}/rest/v1/incidents?select=*&status=eq.approved&order=date.desc`, {
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
        });
        if (!res.ok && res.status === 400) {
          console.warn("Status column not found in database. Retrying query without status filter.");
          res = await fetch(`${SUPABASE_URL}/rest/v1/incidents?select=*&order=date.desc`, {
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
          });
        }
        if (!res.ok) throw new Error('Supabase fetch failed');
        const data = await res.json();
        if (data && data.length > 0) {
          setIncidents(data);
          setStats(computeStats(data));
        } else {
          throw new Error('No data');
        }
      } catch (err) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredIncidents = incidents.filter((i) => {
    const activeStateFilter = filterState || selectedMapState;
    if (activeStateFilter && i.state.toLowerCase() !== activeStateFilter.toLowerCase()) return false;
    if (filterType && getIncidentTypeKey(i.incident_type) !== filterType) return false;
    return true;
  });

  const stateOptions = [...new Set(incidents.map((i) => i.state))].filter(Boolean).sort();
  const typeOptions = [...new Set(incidents.map((i) => getIncidentTypeKey(i.incident_type)))].filter(Boolean).sort();

  if (loading) {
    return (
      <div className={`min-h-screen w-full transition-colors duration-300 ${isDarkMode ? 'bg-[#030e20]' : 'bg-white'}`}>
        {/* Banner Skeleton */}
        <div className="bg-[#052353] py-16 px-6 border-b border-white/5 relative">
          <div className="max-w-7xl mx-auto text-center flex flex-col items-center">
            <div className="h-4 w-32 bg-secondary/30 rounded-full animate-pulse mb-3"></div>
            <div className="h-9 w-64 bg-white/20 rounded-lg animate-pulse mb-3"></div>
            <div className="h-4 w-96 bg-white/10 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col gap-8">
          {/* 4 Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`p-6 rounded-2xl border flex flex-col gap-3 animate-pulse ${
                  isDarkMode ? 'bg-[#051630] border-white/5' : 'bg-white border-slate-100 shadow-sm'
                }`}
              >
                <div className="h-3 w-20 bg-slate-400/20 rounded"></div>
                <div className="h-8 w-24 bg-slate-400/30 rounded-lg"></div>
                <div className="h-3 w-32 bg-slate-400/10 rounded"></div>
              </div>
            ))}
          </div>

          {/* Main Map & Table Layout Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Map Column */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div
                className={`p-6 rounded-2xl border h-[420px] flex flex-col justify-between animate-pulse ${
                  isDarkMode ? 'bg-[#051630] border-white/5' : 'bg-white border-slate-100 shadow-sm'
                }`}
              >
                <div className="h-4 w-40 bg-slate-400/20 rounded"></div>
                <div className="flex-1 flex items-center justify-center my-6">
                  <div className="w-48 h-48 rounded-full bg-slate-400/10 border-4 border-dashed border-slate-400/20 animate-pulse"></div>
                </div>
                <div className="h-10 w-full bg-slate-400/20 rounded-lg"></div>
              </div>
            </div>

            {/* Table Column */}
            <div className="lg:col-span-8">
              <div
                className={`rounded-2xl border overflow-hidden p-6 flex flex-col gap-5 animate-pulse ${
                  isDarkMode ? 'bg-[#051630] border-white/5' : 'bg-white border-slate-100 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-center border-b pb-4 border-slate-400/10">
                  <div className="h-5 w-24 bg-slate-400/20 rounded"></div>
                  <div className="flex gap-3">
                    <div className="h-8 w-24 bg-slate-400/25 rounded-lg"></div>
                    <div className="h-8 w-24 bg-slate-400/25 rounded-lg"></div>
                  </div>
                </div>
                {/* Table Rows */}
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <div key={r} className="flex justify-between items-center py-2 border-b border-slate-400/5">
                      <div className="flex flex-col gap-2 flex-1">
                        <div className="h-4 w-3/4 bg-slate-400/20 rounded"></div>
                        <div className="h-3 w-1/2 bg-slate-400/10 rounded"></div>
                      </div>
                      <div className="h-6 w-16 bg-slate-400/20 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen p-8 flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-[#030e20]' : 'bg-white'}`}>
        <div className="text-red-400 text-lg">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#030e20]' : 'bg-white'}`}>
      <div className="bg-[#052353] py-16 px-6 border-b border-white/5 relative">
        <div className="max-w-7xl mx-auto text-center">
          <span className="font-inter text-xs font-bold tracking-[0.2em] text-secondary uppercase mb-2 block">Beyond# Observatory</span>
          <h1 className="text-3xl md:text-4xl font-poppins font-bold text-white mb-3">Conflict Incident Tracker</h1>
          <p className="text-white/60 text-sm max-w-2xl mx-auto">
            Real-time tracking of security incidents across Nigeria. Data sourced from news reports via automated scraping and AI extraction.
          </p>
        </div>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="absolute top-6 right-6 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer outline-none border-none"
          title={isDarkMode ? "Light Mode" : "Dark Mode"}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-12">

        {stats && <StatsCards overall={stats.overall} isDarkMode={isDarkMode} />}

        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <StateHeatmap byState={stats.byState} selectedState={selectedMapState} onStateClick={setSelectedMapState} isDarkMode={isDarkMode} />
            </div>
              <div className={`rounded-xl p-5 shadow-sm ${isDarkMode ? 'bg-[#051630] border border-white/10' : 'bg-white border border-slate-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{selectedMapState ? `Incidents in ${selectedMapState}` : 'Incidents per State'}</h3>
                {(filterType || filterState || selectedMapState) && (
                  <button onClick={() => { setFilterType(''); setFilterState(''); setSelectedMapState(null); }} className={`text-[10px] font-semibold uppercase tracking-wider bg-transparent border-none cursor-pointer outline-none ${isDarkMode ? 'text-slate-500 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}`}>Clear</button>
                )}
              </div>
              {selectedMapState && (() => {
                const s = stats.byState.find(s => s.state === selectedMapState);
                if (!s) return null;
                return (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className={`rounded-lg p-2.5 text-center ${isDarkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Incidents</div>
                      <div className={`text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{s.count}</div>
                    </div>
                    <div className={`rounded-lg p-2.5 text-center ${isDarkMode ? 'bg-red-950/40' : 'bg-red-50'}`}>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-red-400">Killed</div>
                      <div className="text-lg font-bold text-red-500">{s.fatalities}</div>
                    </div>
                    <div className={`rounded-lg p-2.5 text-center ${isDarkMode ? 'bg-amber-950/40' : 'bg-amber-50'}`}>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">Abducted</div>
                      <div className="text-lg font-bold text-amber-600">{s.abductions}</div>
                    </div>
                    <div className={`rounded-lg p-2.5 text-center ${isDarkMode ? 'bg-orange-950/40' : 'bg-orange-50'}`}>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-orange-500">Injured</div>
                      <div className="text-lg font-bold text-orange-600">{s.injuries}</div>
                    </div>
                  </div>
                );
              })()}
              {!selectedMapState && (
                <div className={`text-center py-8 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  <p className="text-xs">Click a state on the map to view its incident breakdown.</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className={`rounded-xl overflow-hidden shadow-sm ${isDarkMode ? 'bg-[#051630] border border-white/10' : 'bg-white border border-slate-200'}`}>
          <div className={`p-5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>Incidents</h3>
            <div className="flex gap-3">
              <select
                id="conflict-filter-state"
                name="filterState"
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-secondary focus:border-secondary ${isDarkMode ? 'bg-[#030e20] border border-white/20 text-slate-200' : 'bg-white border border-slate-300 text-slate-700'}`}
              >
                <option value="">All States</option>
                {stateOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                id="conflict-filter-type"
                name="filterType"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-secondary focus:border-secondary ${isDarkMode ? 'bg-[#030e20] border border-white/20 text-slate-200' : 'bg-white border border-slate-300 text-slate-700'}`}
              >
                <option value="">All Types</option>
                {typeOptions.map((t) => <option key={t} value={t}>{INCIDENT_TYPE_LABELS[t] || t}</option>)}
              </select>
            </div>
          </div>
          <IncidentTable incidents={filteredIncidents.slice(0, displayLimit)} isDarkMode={isDarkMode} />
          {filteredIncidents.length > displayLimit && (
            <div className={`flex justify-center p-4 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
              <button
                onClick={() => setDisplayLimit((prev) => prev + 10)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider outline-none border cursor-pointer ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Load More Events
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Data sources & limitations explainer */}
      <div className="max-w-7xl mx-auto px-6 pb-10 mt-8">
        <div className={`rounded-xl border ${isDarkMode ? 'bg-[#051630] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Methodology */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`p-1.5 rounded-md ${isDarkMode ? 'bg-secondary/20 text-secondary' : 'bg-secondary/10 text-secondary'}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m-6-8h6M4 6h16M4 18h16" />
                    </svg>
                  </div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider font-poppins ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    Methodology & Pipeline
                  </h3>
                </div>
                <ul className={`space-y-3 text-[11px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <li className="flex gap-2.5">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0"></span>
                    <span>
                      <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>News Ingestion:</strong> Polling of RSS feeds from major Nigerian press outlets (Premium Times, Daily Trust, Vanguard, Punch, The Cable, Channels TV) every 5 hours.
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0"></span>
                    <span>
                      <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>AI Entity Extraction:</strong> Throttled LLM engines extract structured records (date, location, incident type, and casualties) directly from article body text.
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0"></span>
                    <span>
                      <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>Deduplication:</strong> A semantic fingerprinting system checks coordinates and casualty details to merge duplicates and multi-source cross-reports.
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0"></span>
                    <span>
                      <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>Human Verification:</strong> Every incident is routed through an admin verification gateway before being published to the public registry.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Scope & Limitations */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`p-1.5 rounded-md ${isDarkMode ? 'bg-amber-500/20 text-amber-500' : 'bg-amber-500/10 text-amber-600'}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider font-poppins ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    Scope & Limitations
                  </h3>
                </div>
                <ul className={`space-y-3 text-[11px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <li className="flex gap-2.5">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                    <span>
                      <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>Media Dependency:</strong> The registry relies on documented press coverage. Remote or offline conflict events are subject to media under-reporting.
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                    <span>
                      <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>Temporal Latency:</strong> New developments take up to 5 hours to sync. Rapidly changing or emerging reports will update sequentially.
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                    <span>
                      <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>Registry Focus:</strong> To ensure high-quality policy indicators, only conflict events involving active casualties (fatalities, injuries, or abductions) are recorded.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
            <div className={`mt-6 pt-4 border-t flex flex-col sm:flex-row sm:justify-between items-center gap-2 text-[10px] ${isDarkMode ? 'border-white/5 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
              <span>Beyond Statistics Observatory &middot; Abuja, FCT, Nigeria</span>
              <span>For analytical, research, and policy planning purposes only.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
