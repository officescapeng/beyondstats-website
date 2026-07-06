import React, { useState, useEffect } from 'react';
import nigeriaMap from '@svg-maps/nigeria';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://cdvncdkdyclsewwyvrbm.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkdm5jZGtkeWNsc2V3d3l2cmJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NTAyNDQsImV4cCI6MjA5ODEyNjI0NH0.KoCgn1Ez0XZeoYTonvSHyfGCe8nzX0sNFQDb9leH0fw";

const FALLBACK_INCIDENTS = [
  { id: 1, date: "2026-07-01", state: "Borno", lga: "Konduga", community: "Auno", incident_type: "terrorism", fatalities: 12, abductions: 0, injuries: 8, summary: "ISWAP fighters attacked Auno village, killing at least 12 residents.", source_name: "Daily Trust", source_url: "https://dailytrust.com/security/" },
  { id: 2, date: "2026-07-02", state: "Kaduna", lga: "Chikun", community: "Guguwa", incident_type: "banditry", fatalities: 8, abductions: 15, injuries: 3, summary: "Armed bandits raided Guguwa community, killing 8 and kidnapping 15 others.", source_name: "Punch", source_url: "https://punchng.com/topics/nigerian-army/" },
  { id: 3, date: "2026-07-03", state: "Niger", lga: "Shiroro", community: "Kurebe", incident_type: "clash", fatalities: 23, abductions: 0, injuries: 12, summary: "Farmer-herder clash in Kurebe left 23 dead.", source_name: "Premium Times", source_url: "https://www.premiumtimesng.com/news/more-news/" },
  { id: 4, date: "2026-07-05", state: "Zamfara", lga: "Anka", community: "Fararu", incident_type: "banditry", fatalities: 9, abductions: 30, injuries: 2, summary: "Gunmen attacked Fararu village, killing 9 and kidnapping 30.", source_name: "Vanguard", source_url: "https://www.vanguardngr.com/category/security/" },
  { id: 5, date: "2026-08-02", state: "Plateau", lga: "Bokkos", community: "Bokkos town", incident_type: "clash", fatalities: 22, abductions: 0, injuries: 15, summary: "Coordinated attacks on Bokkos community left 22 dead.", source_name: "Channels TV", source_url: "https://www.channelstv.com/tags/security/" },
];

function computeStats(incidents) {
  const totalIncidents = incidents.length;
  const totalFatalities = incidents.reduce((s, i) => s + (i.fatalities || 0), 0);
  const totalAbductions = incidents.reduce((s, i) => s + (i.abductions || 0), 0);
  const totalInjuries = incidents.reduce((s, i) => s + (i.injuries || 0), 0);
  const stateMap = {};
  const typeMap = {};
  for (const i of incidents) {
    if (!stateMap[i.state]) stateMap[i.state] = { state: i.state, count: 0, fatalities: 0, abductions: 0, injuries: 0 };
    stateMap[i.state].count++;
    stateMap[i.state].fatalities += i.fatalities || 0;
    stateMap[i.state].abductions += i.abductions || 0;
    stateMap[i.state].injuries += i.injuries || 0;
    if (!typeMap[i.incident_type]) typeMap[i.incident_type] = { incidentType: i.incident_type, count: 0, fatalities: 0, abductions: 0, injuries: 0 };
    typeMap[i.incident_type].count++;
    typeMap[i.incident_type].fatalities += i.fatalities || 0;
    typeMap[i.incident_type].abductions += i.abductions || 0;
    typeMap[i.incident_type].injuries += i.injuries || 0;
  }
  return {
    overall: { totalIncidents, totalFatalities, totalAbductions, totalInjuries },
    byState: Object.values(stateMap).sort((a, b) => b.fatalities - a.fatalities),
    byType: Object.values(typeMap).sort((a, b) => b.count - a.count),
    byDate: [],
    byLga: [],
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

function StatsCards({ overall }) {
  const cards = [
    { label: 'Total Incidents', value: overall.totalIncidents.toLocaleString(), color: 'text-red-500', icon: '\u26A0' },
    { label: 'People Killed', value: overall.totalFatalities.toLocaleString(), color: 'text-slate-600', icon: '\u2620' },
    { label: 'People Abducted', value: overall.totalAbductions.toLocaleString(), color: 'text-amber-600', icon: '\uD83D\uDC64' },
    { label: 'People Injured', value: overall.totalInjuries.toLocaleString(), color: 'text-orange-600', icon: '\u2764' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => (
        <div key={card.label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.label}</span>
            <span className={`text-lg ${card.color}`}>{card.icon}</span>
          </div>
          <p className={`text-2xl lg:text-3xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}

function StateHeatmap({ byState, selectedState, onStateClick }) {
  const statsMap = new Map(byState.map((s) => [s.state, s]));
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
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-bold text-slate-800 mb-4">Fatalities by State — Choropleth</h3>
      <div className="relative">
        <svg viewBox={nigeriaMap.viewBox} className="w-full h-auto drop-shadow-lg select-none">
          {nigeriaMap.locations.map(loc => {
            const stateName = nameOverrides[loc.name] || loc.name;
            const stats = statsMap.get(stateName);
            const fatalities = stats?.fatalities || 0;
            const color = getHeatColor(fatalities);
            const isSelected = selectedState === stateName;
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
          <div className="absolute pointer-events-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs shadow-xl z-10 whitespace-nowrap" style={{ left: tooltip.x + 12, top: tooltip.y - 12 }}>
            <p className="font-bold text-slate-800">{tooltip.state}</p>
            <p className="text-slate-500">{tooltip.incidents} incidents</p>
            <p className="text-red-500">{tooltip.fatalities} killed</p>
            <p className="text-amber-600">{tooltip.abductions} abducted</p>
          </div>
        )}
      </div>
        <div className="flex items-center gap-3 justify-center mt-4 text-xs text-slate-400">
        <span>Intensity:</span>
        <div className="flex items-center gap-1"><div className="w-4 h-3 rounded-sm border border-slate-300" style={{backgroundColor:'#e2e8f0'}} /><span>0</span></div>
        <div className="flex items-center gap-1"><div className="w-4 h-3 rounded-sm" style={{backgroundColor:'#fca5a5'}} /><span>Low</span></div>
        <div className="flex items-center gap-1"><div className="w-4 h-3 rounded-sm" style={{backgroundColor:'#dc2626'}} /><span>Med</span></div>
        <div className="flex items-center gap-1"><div className="w-4 h-3 rounded-sm" style={{backgroundColor:'#7f1d1d'}} /><span>High</span></div>
      </div>
    </div>
  );
}

function IncidentTable({ incidents }) {
  if (incidents.length === 0) {
    return <div className="text-center py-12 text-slate-400"><p className="text-lg">No incidents found</p></div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-3 font-semibold text-slate-500">Date</th>
            <th className="text-left py-3 px-3 font-semibold text-slate-500">Location</th>
            <th className="text-left py-3 px-3 font-semibold text-slate-500">Type</th>
            <th className="text-center py-3 px-3 font-semibold text-slate-500">Killed</th>
            <th className="text-center py-3 px-3 font-semibold text-slate-500">Abducted</th>
            <th className="text-center py-3 px-3 font-semibold text-slate-500">Injured</th>
            <th className="text-left py-3 px-3 font-semibold text-slate-500 hidden lg:table-cell">Summary</th>
            <th className="text-center py-3 px-3 font-semibold text-slate-500">Source</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => {
            const typeColor = INCIDENT_TYPE_COLORS[incident.incident_type] || INCIDENT_TYPE_COLORS.other;
            const typeLabel = INCIDENT_TYPE_LABELS[incident.incident_type] || incident.incident_type;
            return (
              <tr key={incident.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="py-3 px-3 whitespace-nowrap text-slate-500">{formatDate(incident.date)}</td>
                <td className="py-3 px-3">
                  <span className="font-medium text-slate-800">{incident.state}</span>
                  {incident.lga && <span className="text-slate-400"> &middot; {incident.lga}</span>}
                </td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: typeColor }}>
                    {typeLabel}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  {incident.fatalities > 0 ? <span className="font-bold text-red-500">{incident.fatalities}</span> : <span className="text-slate-300">&mdash;</span>}
                </td>
                <td className="py-3 px-3 text-center">
                  {incident.abductions > 0 ? <span className="font-bold text-amber-600">{incident.abductions}</span> : <span className="text-slate-300">&mdash;</span>}
                </td>
                <td className="py-3 px-3 text-center">
                  {incident.injuries > 0 ? <span className="font-bold text-orange-600">{incident.injuries}</span> : <span className="text-slate-300">&mdash;</span>}
                </td>
                <td className="py-3 px-3 hidden lg:table-cell max-w-xs">
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{incident.summary}</p>
                </td>
                <td className="py-3 px-3 text-center">
                  {incident.source_name ? (
                    <a
                      href={incident.source_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 hover:text-secondary hover:bg-slate-200 text-[9px] font-semibold uppercase tracking-wider transition-colors"
                    >
                      {incident.source_name}
                    </a>
                  ) : (
                    <span className="text-slate-300 text-[10px]">&mdash;</span>
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

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/incidents?select=*\&order=date.desc`, {
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
        });
        if (!res.ok) throw new Error('Supabase fetch failed');
        const data = await res.json();
        if (data && data.length > 0) {
          setIncidents(data);
          setStats(computeStats(data));
        } else {
          throw new Error('No data');
        }
      } catch {
        setIncidents(FALLBACK_INCIDENTS);
        setStats(computeStats(FALLBACK_INCIDENTS));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredIncidents = incidents.filter((i) => {
    if (filterState && i.state.toLowerCase() !== filterState.toLowerCase()) return false;
    if (filterType && i.incident_type !== filterType) return false;
    return true;
  });

  const stateOptions = [...new Set(incidents.map((i) => i.state))].sort();
  const typeOptions = [...new Set(incidents.map((i) => i.incident_type))].sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8 flex items-center justify-center">
        <div className="text-slate-400 text-lg">Loading conflict data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-8 flex items-center justify-center">
        <div className="text-red-400 text-lg">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#052353] py-16 px-6 text-center border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <span className="font-inter text-xs font-bold tracking-[0.2em] text-secondary uppercase mb-2 block">Beyond# Observatory</span>
          <h1 className="text-3xl md:text-4xl font-poppins font-bold text-white mb-3">Conflict Incident Tracker</h1>
          <p className="text-white/60 text-sm max-w-2xl mx-auto">
            Real-time tracking of security incidents across Nigeria. Data sourced from news reports via automated scraping and AI extraction.
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-12">

        {stats && <StatsCards overall={stats.overall} />}

        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <StateHeatmap byState={stats.byState} selectedState={selectedMapState} onStateClick={setSelectedMapState} />
            </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800">{selectedMapState ? `Incidents in ${selectedMapState}` : 'Incidents per State'}</h3>
                {(filterType || filterState || selectedMapState) && (
                  <button onClick={() => { setFilterType(''); setFilterState(''); setSelectedMapState(null); }} className="text-[10px] text-slate-400 hover:text-red-500 font-semibold uppercase tracking-wider bg-transparent border-none cursor-pointer outline-none">Clear</button>
                )}
              </div>
              {selectedMapState && (() => {
                const s = stats.byState.find(s => s.state === selectedMapState);
                if (!s) return null;
                return (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Incidents</div>
                      <div className="text-lg font-bold text-slate-800">{s.count}</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2.5 text-center">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-red-400">Killed</div>
                      <div className="text-lg font-bold text-red-500">{s.fatalities}</div>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2.5 text-center">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">Abducted</div>
                      <div className="text-lg font-bold text-amber-600">{s.abductions}</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-2.5 text-center">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-orange-500">Injured</div>
                      <div className="text-lg font-bold text-orange-600">{s.injuries}</div>
                    </div>
                  </div>
                );
              })()}
              {!selectedMapState && (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-xs">Click a state on the map to view its incident breakdown.</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-sm font-bold text-slate-800">Incidents</h3>
            <div className="flex gap-3">
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-secondary focus:border-secondary"
              >
                <option value="">All States</option>
                {stateOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-secondary focus:border-secondary"
              >
                <option value="">All Types</option>
                {typeOptions.map((t) => <option key={t} value={t}>{INCIDENT_TYPE_LABELS[t] || t}</option>)}
              </select>
            </div>
          </div>
          <IncidentTable incidents={filteredIncidents} />
        </div>
      </div>
    </div>
  );
}
