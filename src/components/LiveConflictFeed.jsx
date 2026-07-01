import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Database, Download, ChevronDown, ChevronRight, X, Activity, Clock } from 'lucide-react';

export default function LiveConflictFeed({ isDarkMode, incidents: initialIncidents, aggregatedData }) {
  const [feedViewMode, setFeedViewMode] = useState('all');
  const [exportPanelOpen, setExportPanelOpen] = useState(false);
  const [exportTab, setExportTab] = useState('month'); 
  const [exportDay, setExportDay] = useState(new Date().toISOString().split('T')[0]);
  const [exportMonth, setExportMonth] = useState(new Date().getMonth());
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  
  // Real-time Feed State
  const [liveIncidents, setLiveIncidents] = useState(initialIncidents || []);
  const [expandedClusters, setExpandedClusters] = useState(new Set());

  const exportPanelRef = useRef(null);
  const exportButtonRef = useRef(null);

  // Sync initial props
  useEffect(() => {
    if (initialIncidents && initialIncidents.length > 0) {
      setLiveIncidents(initialIncidents);
    }
  }, [initialIncidents]);

  // --- D. REAL-TIME STREAMING FEED (POLLING UPGRADE) ---
  useEffect(() => {
    const fetchLatest = async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://kpspsgvqylrqfiewglsd.supabase.co";
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkdm5jZGtkeWNsc2V3d3l2cmJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NTAyNDQsImV4cCI6MjA5ODEyNjI0NH0.KoCgn1Ez0XZeoYTonvSHyfGCe8nzX0sNFQDb9leH0fw";
      
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/incidents?select=*&order=date.desc&limit=100`, {
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLiveIncidents(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
        }
      } catch (err) {
        console.warn("Live feed polling failed. Using cache.", err);
      }
    };

    // Poll every 2 minutes as requested
    const interval = setInterval(fetchLatest, 120000); 
    return () => clearInterval(interval);
  }, []);

  // --- A. EVENT CLUSTERING CORE LOGIC ---
  const timelines = useMemo(() => {
    const map = new Map();

    liveIncidents.forEach(inc => {
      // Use cluster_id if backend provides it, otherwise fallback to a semantic signature
      const key = inc.cluster_id || `${inc.state}-${inc.date}-${inc.incident_type}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(inc);
    });

    return Array.from(map.entries()).map(([clusterId, items]) => {
      // Sort oldest to newest for timeline flow
      const sorted = items.sort((a, b) => new Date(a.date) - new Date(b.date));
      return {
        clusterId,
        items: sorted,
        latest: sorted[sorted.length - 1], // Newest is the representative parent
        isMulti: sorted.length > 1
      };
    }).sort((a, b) => new Date(b.latest.date) - new Date(a.latest.date)); // Sort clusters newest first
  }, [liveIncidents]);

  // --- C. CONFIDENCE SCORING LOGIC ---
  const getConfidenceScore = (inc) => {
    if (inc.confidence !== undefined) return inc.confidence;
    // Fallback pseudo-score based on data completeness if backend is still processing
    let score = 0.5;
    if (inc.state) score += 0.2;
    if (inc.incident_type) score += 0.2;
    if (inc.fatalities !== undefined) score += 0.1;
    return Math.min(score, 1.0);
  };

  const getConfidenceBadge = (confidence) => {
    const confScore = Math.round(confidence * 100);
    const badgeClass = confidence >= 0.75 
      ? "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 border-green-500/20"
      : confidence >= 0.5 
      ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20"
      : "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border-red-500/20";

    return (
      <span className={`text-[9px] px-2 py-0.5 rounded border font-mono font-bold ${badgeClass}`} title="AI Extraction Confidence Score">
        {confScore}%
      </span>
    );
  };

  // Toggle timeline expansion
  const toggleCluster = (clusterId) => {
    setExpandedClusters(prev => {
      const next = new Set(prev);
      if (next.has(clusterId)) next.delete(clusterId);
      else next.add(clusterId);
      return next;
    });
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (exportPanelRef.current && !exportPanelRef.current.contains(event.target)) {
        setExportPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const handleExportCSV = () => {
    const allIncidents = liveIncidents.filter(inc => inc.source_url && !String(inc.source_url).startsWith('mock-'));
    if (allIncidents.length === 0) { alert('No valid incident data available to export.'); return; }

    let filtered = [];
    let fileLabel = '';

    if (exportTab === 'day') {
      filtered = allIncidents.filter(inc => inc.date === exportDay);
      fileLabel = exportDay;
    } else if (exportTab === 'month') {
      const monthStr = String(exportMonth + 1).padStart(2, '0');
      filtered = allIncidents.filter(inc => inc.date && inc.date.startsWith(`${exportYear}-${monthStr}`));
      fileLabel = `${MONTH_SHORT[exportMonth]}-${exportYear}`;
    } else {
      filtered = allIncidents.filter(inc => inc.date && inc.date.startsWith(String(exportYear)));
      fileLabel = String(exportYear);
    }

    if (filtered.length === 0) { alert(`No incidents found for the selected period.`); return; }

    let csvContent = "data:text/csv;charset=utf-8,Date,State,LGA,Cluster ID,Incident Type,Confidence,Fatalities,Abductions,Summary,Source URL\n";
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(inc => {
      const row = [
        inc.date || '',
        `"${(inc.state || '').replace(/"/g, '""')}"`,
        `"${(inc.lga || '').replace(/"/g, '""')}"`,
        inc.cluster_id || 'unassigned',
        `"${(inc.incident_type || '').replace(/"/g, '""')}"`,
        getConfidenceScore(inc),
        inc.fatalities || 0,
        inc.abductions || 0,
        `"${(inc.summary || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        inc.source_url || ''
      ];
      csvContent += row.join(",") + "\n";
    });

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Beyond_Incidents_${fileLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportPanelOpen(false);
  };

  if (!liveIncidents || liveIncidents.length === 0) return null;

  return (
    <div className={`mt-10 p-6 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-[#051630] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-poppins font-bold text-sm uppercase tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#39B54A] animate-pulse" />
            Live Conflict Aggregation Engine
          </h3>
          <p className="font-inter text-[10px] opacity-60 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Real-time monitoring active
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className={`flex p-0.5 rounded-xl gap-0.5 text-[9px] font-bold ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
            {[
              { mode: 'all', label: 'All Logs' },
              { mode: 'daily', label: 'Daily' },
              { mode: 'weekly', label: 'Weekly' },
              { mode: 'monthly', label: 'Monthly' }
            ].map((btn) => (
              <button
                key={btn.mode}
                type="button"
                onClick={() => setFeedViewMode(btn.mode)}
                className={`px-2.5 py-1.5 rounded-lg uppercase transition-all duration-150 border-none outline-none cursor-pointer ${
                  feedViewMode === btn.mode
                    ? 'bg-[#39B54A] text-white shadow-sm'
                    : (isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="relative ml-1" ref={exportPanelRef}>
            <button
              ref={exportButtonRef}
              type="button"
              onClick={() => setExportPanelOpen(prev => !prev)}
              className={`px-3 py-1.5 rounded-lg font-inter text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm border outline-none cursor-pointer ${
                isDarkMode ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              <Download className="w-3 h-3" />
              <span>Export CSV</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${exportPanelOpen ? 'rotate-180' : ''}`} />
            </button>

            {exportPanelOpen && (
              <div className={`absolute right-0 bottom-full mb-2 z-50 w-72 rounded-2xl shadow-2xl border p-4 ${isDarkMode ? 'bg-[#051630] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-poppins font-bold text-[11px] uppercase tracking-wider">Export Conflict Data</span>
                  <button onClick={() => setExportPanelOpen(false)} className={`p-1 rounded-lg border-none outline-none cursor-pointer ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className={`flex p-0.5 rounded-xl gap-0.5 text-[9px] font-bold mb-4 ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                  {['day', 'month', 'year'].map(tab => (
                    <button key={tab} type="button" onClick={() => setExportTab(tab)} className={`flex-1 py-1.5 rounded-lg uppercase tracking-wider transition-all duration-150 border-none outline-none cursor-pointer ${exportTab === tab ? 'bg-emerald-500 text-white shadow-sm' : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
                      {tab}
                    </button>
                  ))}
                </div>

                {exportTab === 'day' && (
                  <input type="date" value={exportDay} onChange={e => setExportDay(e.target.value)} className={`w-full mb-4 px-3 py-2 rounded-xl text-[11px] font-mono border outline-none ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
                )}
                {exportTab === 'month' && (
                  <select value={exportYear} onChange={e => setExportYear(Number(e.target.value))} className={`w-full mb-4 text-[10px] font-bold rounded-lg px-2 py-2 border outline-none cursor-pointer ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    {[2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                )}
                {exportTab === 'year' && (
                  <div className="flex gap-2 mb-4">
                    {[2026, 2027, 2028].map(y => (
                      <button key={y} type="button" onClick={() => setExportYear(y)} className={`flex-1 py-2 rounded-xl text-[11px] font-bold border-none outline-none cursor-pointer transition-all ${exportYear === y ? 'bg-emerald-500 text-white shadow-sm' : isDarkMode ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{y}</button>
                    ))}
                  </div>
                )}

                <button type="button" onClick={handleExportCSV} className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-inter text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all border-none outline-none cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> Download CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-y-auto overflow-x-auto max-h-[400px] w-full border border-slate-200/10 dark:border-white/5 rounded-2xl pr-1">
        {feedViewMode === 'all' ? (
          <table className="w-full min-w-[750px] text-sm text-left border-collapse">
            <thead className={`sticky top-0 z-10 ${isDarkMode ? 'bg-[#051630]' : 'bg-white'}`}>
              <tr className="border-b border-slate-200/20 dark:border-white/5 text-[10px] opacity-65 uppercase tracking-widest">
                <th className="py-3 px-3 font-poppins font-bold text-left w-6"></th>
                <th className="py-3 px-2 font-poppins font-bold text-left">Date</th>
                <th className="py-3 px-2 font-poppins font-bold text-left">State</th>
                <th className="py-3 px-2 font-poppins font-bold text-left">Incident (Cluster)</th>
                <th className="py-3 px-2 font-poppins font-bold text-center">Quality</th>
                <th className="py-3 px-2 font-poppins font-bold text-center">Fatalities</th>
                <th className="py-3 px-2 font-poppins font-bold text-center">Abductions</th>
                <th className="py-3 px-2 font-poppins font-bold text-left">Summary</th>
              </tr>
            </thead>
            <tbody>
              {timelines.slice(0, 20).map((cluster) => {
                const isExpanded = expandedClusters.has(cluster.clusterId);
                
                return (
                  <React.Fragment key={cluster.clusterId}>
                    {/* --- B. TIMELINE MODE: PARENT ROW --- */}
                    <tr 
                      onClick={() => cluster.isMulti && toggleCluster(cluster.clusterId)}
                      className={`border-b border-slate-200/10 dark:border-white/5 text-[11px] transition-colors ${
                        cluster.isMulti ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5' : 'hover:bg-slate-50/50 dark:hover:bg-white/5'
                      } ${isExpanded ? (isDarkMode ? 'bg-white/5' : 'bg-slate-50') : ''}`}
                    >
                      <td className="py-3.5 px-3 text-center">
                        {cluster.isMulti && (
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 opacity-50 ${isExpanded ? 'rotate-90' : ''}`} />
                        )}
                      </td>
                      <td className="py-3.5 px-2 font-mono whitespace-nowrap">{cluster.latest.date}</td>
                      <td className="py-3.5 px-2 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? 'bg-[#030e20] text-emerald-400 border border-white/5' : 'bg-slate-100 text-slate-700'}`}>
                          {cluster.latest.state}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 font-bold whitespace-nowrap">
                        <span className="text-[#39B54A] mr-2">{cluster.latest.incident_type}</span>
                        {cluster.isMulti && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                            +{cluster.items.length - 1} related
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        {getConfidenceBadge(getConfidenceScore(cluster.latest))}
                      </td>
                      <td className="py-3.5 px-2 text-center font-mono font-bold text-rose-500">{cluster.latest.fatalities || 0}</td>
                      <td className="py-3.5 px-2 text-center font-mono font-bold text-amber-500">{cluster.latest.abductions || 0}</td>
                      <td className={`py-3.5 px-2 max-w-xs md:max-w-sm truncate ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`} title={cluster.latest.summary}>
                        {cluster.latest.source_url && !String(cluster.latest.source_url).startsWith('mock-') ? (
                          <a 
                            href={cluster.latest.source_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:text-[#39B54A] hover:underline transition-all cursor-pointer"
                          >
                            {cluster.latest.summary}
                          </a>
                        ) : (
                          cluster.latest.summary
                        )}
                      </td>
                    </tr>

                    {/* --- B. TIMELINE MODE: EXPANDED NESTED ROW --- */}
                    {isExpanded && cluster.isMulti && (
                      <tr>
                        <td colSpan="8" className="p-0 border-b border-slate-200/10 dark:border-white/5">
                          <div className={`p-4 pl-12 flex flex-col gap-3 shadow-inner ${isDarkMode ? 'bg-[#030e20]/50' : 'bg-slate-100/50'}`}>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 opacity-60">
                              <Clock className="w-3 h-3" /> Event Timeline Evolution
                            </h4>
                            <div className="flex flex-col gap-2 relative before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-slate-300 dark:before:bg-slate-700">
                              {cluster.items.map((subEvent, i) => (
                                <div key={i} className="flex gap-4 relative">
                                  <div className="w-6 h-6 rounded-full bg-white dark:bg-[#051630] border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0 z-10 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#39B54A]"></span>
                                  </div>
                                  <div className="flex-1 text-[11px]">
                                    <div className="flex gap-3 mb-0.5">
                                      <span className="font-mono font-bold opacity-70">{subEvent.date}</span>
                                      <span className="opacity-50">• Source: {subEvent.source_url ? new URL(subEvent.source_url.startsWith('http') ? subEvent.source_url : 'http://' + subEvent.source_url).hostname : 'registry'}</span>
                                    </div>
                                    <p className={`leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                      {subEvent.source_url && !String(subEvent.source_url).startsWith('mock-') ? (
                                        <a 
                                          href={subEvent.source_url} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="hover:text-[#39B54A] hover:underline transition-all cursor-pointer"
                                        >
                                          {subEvent.summary}
                                        </a>
                                      ) : (
                                        subEvent.summary
                                      )}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm text-left border-collapse">
            <thead className={`sticky top-0 z-10 ${isDarkMode ? 'bg-[#051630]' : 'bg-white'}`}>
              <tr className="border-b border-slate-200/20 dark:border-white/5 text-[10px] opacity-65 uppercase tracking-widest">
                <th className="py-3 px-2 font-poppins font-bold text-left">Period</th>
                <th className="py-3 px-2 font-poppins font-bold text-center">Total Incidents</th>
                <th className="py-3 px-2 font-poppins font-bold text-center">Fatalities</th>
                <th className="py-3 px-2 font-poppins font-bold text-center">Abductions</th>
              </tr>
            </thead>
            <tbody>
              {aggregatedData.map((g, idx) => (
                <tr key={idx} className="border-b border-slate-200/10 dark:border-white/5 text-[11px] hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-2 font-mono font-bold whitespace-nowrap">{g.period}</td>
                  <td className="py-3.5 px-2 text-center font-mono font-bold">{g.incidents}</td>
                  <td className="py-3.5 px-2 text-center font-mono font-bold text-rose-500">{g.fatalities}</td>
                  <td className="py-3.5 px-2 text-center font-mono font-bold text-amber-500">{g.abductions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}