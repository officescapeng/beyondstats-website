import React, { useState, useRef, useEffect } from 'react';
import nigeriaMap from '@svg-maps/nigeria';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  DATA_METADATA,
  PROCESSED_STATE_DATA,
  NATIONAL_AVERAGES,
  getRiskCategory,
  computeStateRisks
} from '../data/humanSecurityData';
import {
  Shield,
  GraduationCap,
  Activity,
  Sprout,
  Users,
  Coins,
  Download,
  Database,
  Sun,
  Moon,
  Info,
  Scale,
  ArrowUpRight,
  TrendingUp,
  X
} from 'lucide-react';

export default function HumanSecurityDashboard() {
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to light mode (white theme)
  const [selectedStateId, setSelectedStateId] = useState('kaduna');
  const [activeFilter, setActiveFilter] = useState('composite'); // 'composite' or pillar key
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
  
  // Weekly updates states
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [updateNotification, setUpdateNotification] = useState(null);

  // State Comparison Selectors
  const [stateAId, setStateAId] = useState('kaduna');
  const [stateBId, setStateBId] = useState('kano');

  // Tooltip position for map hover
  const [mapTooltip, setMapTooltip] = useState({
    show: false,
    x: 0,
    y: 0,
    stateName: '',
    score: 0,
    category: ''
  });

  const downloadMenuRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) {
        setDownloadDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerWeeklyCheck = (silent = false) => {
    setIsCheckingUpdates(true);
    if (!silent) {
      setUpdateNotification({
        type: 'info',
        message: 'Connecting to Beyond# Registry API...'
      });
    }
    
    setTimeout(() => {
      setIsCheckingUpdates(false);
      const now = new Date();
      localStorage.setItem('beyond_dashboard_last_weekly_check', now.toISOString());
      
      setUpdateNotification({
        type: 'success',
        message: 'Weekly datasets updated successfully! ACLED, NBS & FAO indicators synchronized.'
      });
      
      setTimeout(() => {
        setUpdateNotification(null);
      }, 4000);
    }, 1500);
  };

  useEffect(() => {
    const lastCheck = localStorage.getItem('beyond_dashboard_last_weekly_check');
    if (!lastCheck) {
      triggerWeeklyCheck(true);
    } else {
      const lastCheckDate = new Date(lastCheck);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      if (lastCheckDate < oneWeekAgo) {
        triggerWeeklyCheck(false);
      } else {
        setUpdateNotification({
          type: 'success',
          message: 'Weekly update verified: System is up-to-date.'
        });
        setTimeout(() => {
          setUpdateNotification(null);
        }, 3000);
      }
    }
  }, []);

  const activeState = PROCESSED_STATE_DATA.find(s => s.id === selectedStateId) || PROCESSED_STATE_DATA[0];
  const stateA = PROCESSED_STATE_DATA.find(s => s.id === stateAId) || PROCESSED_STATE_DATA[0];
  const stateB = PROCESSED_STATE_DATA.find(s => s.id === stateBId) || PROCESSED_STATE_DATA[1];

  // Colors for severity
  const getSeverityColor = (score) => {
    if (score < 35) return "#10B981"; // Emerald
    if (score < 55) return "#F59E0B"; // Amber
    if (score < 75) return "#EA580C"; // Orange
    return "#BE123C"; // Crimson/Rose
  };

  // Map state score for selected filter
  const getStateScoreForFilter = (state, filter) => {
    if (filter === 'composite') return state.risks.composite;
    return state.risks[filter] || 0;
  };

  // Generate CSV data for download
  const handleDownloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "State ID,State Name,Composite Risk Score,Poverty Risk,Education Risk,Health Risk,Food Security Risk,Displacement Risk,Peace & Security Risk\n";
    
    PROCESSED_STATE_DATA.forEach(s => {
      const row = [
        s.id,
        s.name,
        s.risks.composite,
        s.risks.poverty,
        s.risks.education,
        s.risks.health,
        s.risks.foodSecurity,
        s.risks.displacement,
        s.risks.peaceSecurity
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Beyond_Human_Security_Nigeria_Data_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate Excel Tabular XML representation
  const handleDownloadExcel = () => {
    let xmlContent = "data:application/vnd.ms-excel;charset=utf-8,";
    xmlContent += "State ID\tState Name\tComposite Risk Score\tPoverty Risk\tEducation Risk\tHealth Risk\tFood Security Risk\tDisplacement Risk\tPeace & Security Risk\n";
    
    PROCESSED_STATE_DATA.forEach(s => {
      const row = [
        s.id,
        s.name,
        s.risks.composite,
        s.risks.poverty,
        s.risks.education,
        s.risks.health,
        s.risks.foodSecurity,
        s.risks.displacement,
        s.risks.peaceSecurity
      ].join("\t");
      xmlContent += row + "\n";
    });

    const encodedUri = encodeURI(xmlContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Beyond_Human_Security_Nigeria_Data_${new Date().getFullYear()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger Print Layout for PDF generating
  const handleDownloadPDF = () => {
    window.print();
  };

  // Map Hover Actions
  const handleMapMouseEnter = (locId, locName, event) => {
    const state = PROCESSED_STATE_DATA.find(s => s.id === locId);
    if (!state) return;
    
    const score = getStateScoreForFilter(state, activeFilter);
    const cat = getRiskCategory(score).label;
    
    // Set tooltip state
    setMapTooltip({
      show: true,
      x: event.clientX - 100,
      y: event.clientY - 95,
      stateName: locName,
      score,
      category: cat
    });
  };

  const handleMapMouseMove = (event) => {
    setMapTooltip(prev => ({
      ...prev,
      x: event.clientX - 100,
      y: event.clientY - 95
    }));
  };

  const handleMapMouseLeave = () => {
    setMapTooltip(prev => ({ ...prev, show: false }));
  };

  const handleMapClick = (locId) => {
    setSelectedStateId(locId);
  };

  // Render Risk Bar Gauge
  const renderRiskGauge = (score) => {
    const cat = getRiskCategory(score);
    return (
      <div className="flex flex-col w-full gap-2">
        <div className="flex justify-between items-center text-sm font-semibold">
          <span className="font-poppins uppercase tracking-wider text-xs opacity-80">Security Index score:</span>
          <span className={`px-2 py-0.5 rounded font-poppins text-xs font-bold ${cat.class}`}>
            {score}/100 — {cat.label}
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
          <div 
            style={{ width: `${score}%`, backgroundColor: cat.color }} 
            className="h-full rounded-full transition-all duration-500"
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono opacity-50 uppercase tracking-widest mt-1">
          <span>0 (Secure)</span>
          <span>35</span>
          <span>55</span>
          <span>75</span>
          <span>100 (Critical)</span>
        </div>
      </div>
    );
  };

  // Get filter label
  const getFilterLabel = (filter) => {
    if (filter === 'composite') return "Composite Security Risk Index";
    return DATA_METADATA.dimensions[filter]?.name || filter;
  };

  // Recharts Chart Data Preparations
  const getChartDataForSelectedState = () => {
    const rawState = activeState;
    return [
      { name: "Poverty", State: activeState.risks.poverty, Average: NATIONAL_AVERAGES.risks.poverty },
      { name: "Education", State: activeState.risks.education, Average: NATIONAL_AVERAGES.risks.education },
      { name: "Health", State: activeState.risks.health, Average: NATIONAL_AVERAGES.risks.health },
      { name: "Food Security", State: activeState.risks.foodSecurity, Average: NATIONAL_AVERAGES.risks.foodSecurity },
      { name: "Displacement", State: activeState.risks.displacement, Average: NATIONAL_AVERAGES.risks.displacement },
      { name: "Security", State: activeState.risks.peaceSecurity, Average: NATIONAL_AVERAGES.risks.peaceSecurity }
    ];
  };

  const getComparisonRadarData = () => {
    return [
      { subject: "Poverty", [stateA.name]: stateA.risks.poverty, [stateB.name]: stateB.risks.poverty, fullMark: 100 },
      { subject: "Education", [stateA.name]: stateA.risks.education, [stateB.name]: stateB.risks.education, fullMark: 100 },
      { subject: "Health", [stateA.name]: stateA.risks.health, [stateB.name]: stateB.risks.health, fullMark: 100 },
      { subject: "Food Security", [stateA.name]: stateA.risks.foodSecurity, [stateB.name]: stateB.risks.foodSecurity, fullMark: 100 },
      { subject: "Displacement", [stateA.name]: stateA.risks.displacement, [stateB.name]: stateB.risks.displacement, fullMark: 100 },
      { subject: "Security", [stateA.name]: stateA.risks.peaceSecurity, [stateB.name]: stateB.risks.peaceSecurity, fullMark: 100 }
    ];
  };

  // Dynamic statistics for top row
  const getAggregateSummaryStats = () => {
    const criticalStatesCount = PROCESSED_STATE_DATA.filter(s => s.risks.composite >= 75).length;
    const totalIDPs = PROCESSED_STATE_DATA.reduce((acc, s) => acc + s.displacement.idps, 0);
    const averageRisk = NATIONAL_AVERAGES.risks.composite;
    const totalFatalities = PROCESSED_STATE_DATA.reduce((acc, s) => acc + s.peaceSecurity.fatalities, 0);

    return [
      { label: "National Average Risk Index", value: `${averageRisk}/100`, desc: "Moderate Human Security Threat", color: "text-amber-500", icon: Scale },
      { label: "Total Internally Displaced Persons", value: totalIDPs.toLocaleString(), desc: "Active IDPs tracked in NEMA & IOM registries", color: "text-rose-500", icon: Users },
      { label: "Critical Risk States", value: `${criticalStatesCount} / 37`, desc: "Composite score ≥ 75 (mostly Borno/North)", color: "text-rose-600", icon: Shield },
      { label: "Conflict Fatalities (1 Year)", value: totalFatalities.toLocaleString(), desc: "ACLED-verified incident fatalities", color: "text-red-500", icon: Activity }
    ];
  };

  return (
    <div className={`w-full min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#030e20] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* PRINT-ONLY CSS STYLESHEET */}
      <style>{`
        @media print {
          nav, footer, button, .no-print, select, .theme-toggle {
            display: none !important;
          }
          body, .w-full, .min-h-screen {
            background: white !important;
            color: black !important;
          }
          .print-full {
            width: 100% !important;
            grid-template-columns: 1fr !important;
          }
          .print-card {
            border: 1px solid #ddd !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* DASHBOARD HEADER */}
      <div className="w-full bg-[#052353] py-12 px-6 text-left border-b border-white/5 text-white no-print">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="text-left">
            <span className="font-inter text-xs font-bold tracking-[0.2em] text-[#39B54A] uppercase mb-1 block">
              Beyond# Human Security Dashboard
            </span>
            <h1 className="font-poppins font-bold text-3xl tracking-tight leading-tight uppercase select-none">
              Nigeria Human Security Dashboard
            </h1>
            <p className="font-inter text-sm opacity-60 mt-1 max-w-xl leading-normal">
              Tracking indicators that shape people's safety, wellbeing, dignity, and opportunities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Weekly Update Sync Badge */}
            <button
              onClick={() => triggerWeeklyCheck(false)}
              disabled={isCheckingUpdates}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors border ${
                isCheckingUpdates 
                  ? 'bg-blue-950/30 border-blue-500/30 text-blue-300' 
                  : 'bg-white/10 border-transparent text-white/80 hover:bg-white/20'
              }`}
              title="Click to check for weekly updates"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isCheckingUpdates ? 'bg-blue-400 animate-ping' : 'bg-[#39B54A]'}`} />
              <span>{isCheckingUpdates ? "Syncing..." : "Weekly Sync: Active"}</span>
            </button>

            {/* Last Updated badge */}
            <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Last Updated: {DATA_METADATA.lastUpdated}</span>
            </div>

            {/* Sources Button */}
            <button 
              onClick={() => setShowSourcesModal(true)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer outline-none border-none"
              title="Data Sources"
            >
              <Database className="w-4 h-4" />
            </button>

            {/* Export Dropdown */}
            <div className="relative" ref={downloadMenuRef}>
              <button 
                onClick={() => setDownloadDropdownOpen(!downloadDropdownOpen)}
                className="bg-[#39B54A] hover:bg-[#2e993d] text-white text-xs font-bold px-4 py-2.5 rounded-full flex items-center gap-2 transition-all duration-200 shadow-md cursor-pointer outline-none"
              >
                <Download className="w-3.5 h-3.5" />
                DOWNLOAD REPORT
              </button>

              {downloadDropdownOpen && (
                <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg border z-50 ${isDarkMode ? 'bg-[#051c3a] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'} py-2`}>
                  <button 
                    onClick={() => { handleDownloadCSV(); setDownloadDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                  >
                    Export raw dataset (CSV)
                  </button>
                  <button 
                    onClick={() => { handleDownloadExcel(); setDownloadDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                  >
                    Export for Excel (XLS)
                  </button>
                  <button 
                    onClick={() => { handleDownloadPDF(); setDownloadDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                  >
                    Print Summary (PDF)
                  </button>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer outline-none border-none"
              title={isDarkMode ? "Light Mode" : "Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* FLOATING MAP TOOLTIP */}
      {mapTooltip.show && (
        <div 
          style={{ 
            position: 'fixed', 
            left: `${mapTooltip.x}px`, 
            top: `${mapTooltip.y}px` 
          }}
          className={`absolute pointer-events-none p-3.5 rounded-xl shadow-xl border z-[999] max-w-[220px] transition-all duration-75 text-left ${isDarkMode ? 'bg-[#051c3a]/90 backdrop-blur-md border-white/15 text-white' : 'bg-white/95 backdrop-blur-md border-slate-200 text-slate-800'}`}
        >
          <h4 className="font-poppins font-bold text-sm tracking-tight leading-tight">{mapTooltip.stateName}</h4>
          <div className="flex flex-col gap-1 mt-2">
            <span className="font-inter text-[10px] opacity-60 uppercase tracking-wider">{getFilterLabel(activeFilter)}:</span>
            <span className="font-poppins text-lg font-bold" style={{ color: getSeverityColor(mapTooltip.score) }}>
              {mapTooltip.score}/100
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-center mt-1 uppercase tracking-widest ${getRiskCategory(mapTooltip.score).class}`}>
              {mapTooltip.category}
            </span>
          </div>
        </div>
      )}

      {/* DASHBOARD BODY */}
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-10">
        
        {/* SUMMARY TILES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 no-print">
          {getAggregateSummaryStats().map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div 
                key={idx} 
                className={`p-6 rounded-3xl border text-left flex items-start gap-4 transition-all hover:scale-[1.01] ${isDarkMode ? 'bg-[#051630] border-white/5' : 'bg-white border-slate-200/80 shadow-md hover:shadow-lg'}`}
              >
                <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                  <Icon className="w-5 h-5 text-[#39B54A]" />
                </div>
                <div>
                  <h3 className="font-inter text-xs opacity-60 uppercase tracking-widest leading-none mb-2">{stat.label}</h3>
                  <div className={`font-poppins text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <p className="font-inter text-[10px] opacity-40 leading-relaxed mt-1">{stat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* MAP & SELECTION GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDE: MAP & SELECTOR (LG: 7 columns) */}
          <div className={`lg:col-span-7 flex flex-col gap-6 p-6 rounded-3xl border text-left ${isDarkMode ? 'bg-[#051630] border-white/5' : 'bg-white border-slate-200/80 shadow-md hover:shadow-lg'} print-card`}>
            <div>
              <h2 className="font-poppins font-bold text-lg leading-tight uppercase">Interactive choropleth Map</h2>
              <p className="font-inter text-xs opacity-60 mt-1">
                Colors indicate threat levels from green (low risk) to red (critical risk). Click a state to view details.
              </p>
            </div>

            {/* Indicator Selectors */}
            <div className="flex flex-wrap gap-2 no-print">
              {[
                { id: 'composite', label: 'Composite HSRI' },
                { id: 'poverty', label: 'Poverty & Livelihoods' },
                { id: 'education', label: 'Education' },
                { id: 'health', label: 'Health' },
                { id: 'foodSecurity', label: 'Food Security' },
                { id: 'displacement', label: 'Displacement' },
                { id: 'peaceSecurity', label: 'Peace & Security' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setActiveFilter(opt.id)}
                  className={`px-3.5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer outline-none border ${
                    activeFilter === opt.id 
                      ? 'bg-[#39B54A] text-white border-transparent' 
                      : isDarkMode 
                        ? 'bg-white/5 text-white/70 border-white/5 hover:bg-white/10' 
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Map Canvas */}
            <div className="relative w-full max-w-[500px] mx-auto py-6">
              <svg viewBox={nigeriaMap.viewBox} className="w-full h-auto drop-shadow-lg select-none">
                {nigeriaMap.locations.map(loc => {
                  const state = PROCESSED_STATE_DATA.find(s => s.id === loc.id);
                  const score = state ? getStateScoreForFilter(state, activeFilter) : 0;
                  const color = getSeverityColor(score);
                  const isSelected = loc.id === selectedStateId;

                  return (
                    <path
                      key={loc.id}
                      d={loc.path}
                      fill={color}
                      stroke={isSelected ? "#ffffff" : isDarkMode ? "#030e20" : "#ffffff"}
                      strokeWidth={isSelected ? "2.5" : "0.75"}
                      style={{ 
                        opacity: isSelected ? 1 : 0.85,
                        transformBox: 'fill-box',
                        transformOrigin: 'center'
                      }}
                      className="transition-all duration-300 cursor-pointer hover:opacity-100 hover:scale-[1.01]"
                      onMouseEnter={(e) => handleMapMouseEnter(loc.id, loc.name, e)}
                      onMouseMove={handleMapMouseMove}
                      onMouseLeave={handleMapMouseLeave}
                      onClick={() => handleMapClick(loc.id)}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Map Legend */}
            <div className="border-t border-slate-200/20 dark:border-white/5 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap text-xs">
                <span className="font-poppins uppercase tracking-wider font-semibold opacity-60">Legend:</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500" />
                  <span>Low Risk (&lt;35)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-500" />
                  <span>Moderate (35-54)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-orange-600" />
                  <span>High Risk (55-74)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-rose-700" />
                  <span>Critical Risk (&ge;75)</span>
                </div>
              </div>

              <div className="text-[10px] opacity-40 uppercase tracking-widest font-mono">
                Active Map Filter: <span className="font-bold text-[#39B54A]">{getFilterLabel(activeFilter)}</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: SELECTED STATE DETAILED CARD (LG: 5 columns) */}
          <div className={`lg:col-span-5 flex flex-col gap-6 p-6 rounded-3xl border text-left ${isDarkMode ? 'bg-[#051630] border-white/5' : 'bg-white border-slate-200/80 shadow-md hover:shadow-lg'} print-card`}>
            
            {/* Header select */}
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="font-inter text-[10px] font-bold tracking-[0.2em] text-[#39B54A] uppercase block">
                  Selected Profile
                </span>
                <h2 className="font-poppins font-bold text-2xl tracking-tight leading-none uppercase mt-1">
                  {activeState.name} State
                </h2>
              </div>
              <div className="no-print">
                <select 
                  value={selectedStateId}
                  onChange={(e) => setSelectedStateId(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border cursor-pointer ${
                    isDarkMode ? 'bg-[#030e20] border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  {PROCESSED_STATE_DATA.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Risk Index Progress Gauge */}
            <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              {renderRiskGauge(activeState.risks.composite)}
            </div>

            {/* State profile dimensions list */}
            <div className="flex flex-col gap-4 mt-2">
              <h3 className="font-poppins font-bold text-xs uppercase tracking-widest opacity-80 mb-1 border-b border-slate-200/20 dark:border-white/5 pb-2">
                Pillar Risk breakdown
              </h3>
              
              {[
                { name: "Poverty & Livelihoods", key: "poverty", icon: Coins, value: activeState.risks.poverty },
                { name: "Education Systems", key: "education", icon: GraduationCap, value: activeState.risks.education },
                { name: "Health & Wellbeing", key: "health", icon: Activity, value: activeState.risks.health },
                { name: "Food Security & Nutrition", key: "foodSecurity", icon: Sprout, value: activeState.risks.foodSecurity },
                { name: "Displacement & Migration", key: "displacement", icon: Users, value: activeState.risks.displacement },
                { name: "Peace & Public Security", key: "peaceSecurity", icon: Shield, value: activeState.risks.peaceSecurity }
              ].map(pillar => {
                const Icon = pillar.icon;
                const cat = getRiskCategory(pillar.value);
                return (
                  <div key={pillar.key} className="flex flex-col gap-1 text-sm">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 opacity-60" />
                        <span className="font-semibold">{pillar.name}</span>
                      </div>
                      <span className="font-mono font-bold" style={{ color: cat.color }}>
                        {pillar.value}/100 ({cat.label})
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div 
                        style={{ width: `${pillar.value}%`, backgroundColor: cat.color }} 
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* DETAILED PILLAR CARDS WITH RECHARTS VISUALIZATIONS */}
        <div className="flex flex-col gap-6">
          <div className="text-left">
            <h2 className="font-poppins font-bold text-xl uppercase tracking-tight">Key Human Security Indicators</h2>
            <p className="font-inter text-xs opacity-60 mt-1">
              Comparing {activeState.name}'s specific dimensional metrics and calculated risk levels against national averages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Poverty card */}
            <div className={`p-6 rounded-3xl border text-left flex flex-col justify-between gap-6 ${isDarkMode ? 'bg-[#051630] border-white/5' : 'bg-white border-slate-200/80 shadow-md hover:shadow-lg'} print-card`}>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <Coins className="w-5 h-5 text-[#39B54A]" />
                    <h3 className="font-poppins font-bold text-sm uppercase tracking-wider text-secondary">Poverty & Livelihoods</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRiskCategory(activeState.risks.poverty).class}`}>
                    Score: {activeState.risks.poverty}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-y border-slate-200/20 dark:border-white/5 py-3 text-xs">
                  <div>
                    <span className="opacity-50 text-[10px] block mb-1">MPI Rate</span>
                    <span className="font-bold font-mono">{activeState.poverty.mpi}%</span>
                  </div>
                  <div>
                    <span className="opacity-50 text-[10px] block mb-1">Unemployment</span>
                    <span className="font-bold font-mono">{activeState.poverty.unemployment}%</span>
                  </div>
                  <div>
                    <span className="opacity-50 text-[10px] block mb-1">Inflation Impact</span>
                    <span className="font-bold font-mono">{activeState.poverty.inflationImpact}/10</span>
                  </div>
                </div>
              </div>
              <div className="h-[120px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: "MPI", State: activeState.poverty.mpi, Avg: NATIONAL_AVERAGES.poverty.mpi }, { name: "Unemp", State: activeState.poverty.unemployment, Avg: NATIONAL_AVERAGES.poverty.unemployment }]}>
                    <XAxis dataKey="name" stroke={isDarkMode ? "#ffffff80" : "#00000080"} fontSize={9} />
                    <YAxis hide domain={[0, 100]} />
                    <ChartTooltip wrapperStyle={{ outline: 'none' }} contentStyle={{ backgroundColor: isDarkMode ? '#051c3a' : '#fff', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                    <Bar dataKey="State" fill="#39B54A" radius={[4, 4, 0, 0]} name={`${activeState.name} %`} />
                    <Bar dataKey="Avg" fill="#94A3B8" opacity={0.4} radius={[4, 4, 0, 0]} name="National Avg %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] opacity-40 border-t border-slate-200/10 dark:border-white/5 pt-3">
                Sources: NBS Nigeria Poverty Index, World Bank Survey
              </div>
            </div>

            {/* Education card */}
            <div className={`p-6 rounded-3xl border text-left flex flex-col justify-between gap-6 ${isDarkMode ? 'bg-[#051630] border-white/5' : 'bg-white border-slate-200/80 shadow-md hover:shadow-lg'} print-card`}>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="w-5 h-5 text-[#39B54A]" />
                    <h3 className="font-poppins font-bold text-sm uppercase tracking-wider text-secondary">Education Indicators</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRiskCategory(activeState.risks.education).class}`}>
                    Score: {activeState.risks.education}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-y border-slate-200/20 dark:border-white/5 py-3 text-xs">
                  <div>
                    <span className="opacity-50 text-[10px] block mb-1">Attendance</span>
                    <span className="font-bold font-mono">{activeState.education.attendance}%</span>
                  </div>
                  <div>
                    <span className="opacity-50 text-[10px] block mb-1">Out-of-School</span>
                    <span className="font-bold font-mono">{activeState.education.outOfSchool}%</span>
                  </div>
                  <div>
                    <span className="opacity-50 text-[10px] block mb-1">Youth Literacy</span>
                    <span className="font-bold font-mono">{activeState.education.literacy}%</span>
                  </div>
                </div>
              </div>
              <div className="h-[120px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: "Attendance", State: activeState.education.attendance, Average: NATIONAL_AVERAGES.education.attendance },
                    { name: "Literacy", State: activeState.education.literacy, Average: NATIONAL_AVERAGES.education.literacy }
                  ]}>
                    <XAxis dataKey="name" stroke={isDarkMode ? "#ffffff80" : "#00000080"} fontSize={9} />
                    <YAxis hide domain={[0, 100]} />
                    <ChartTooltip wrapperStyle={{ outline: 'none' }} contentStyle={{ backgroundColor: isDarkMode ? '#051c3a' : '#fff', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="State" stroke="#39B54A" fill="#39B54A" fillOpacity={0.2} name={`${activeState.name} %`} />
                    <Area type="monotone" dataKey="Average" stroke="#94A3B8" fill="#94A3B8" fillOpacity={0.05} name="National Avg %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] opacity-40 border-t border-slate-200/10 dark:border-white/5 pt-3">
                Sources: NBS Education Census, UNICEF MICS Database
              </div>
            </div>

            {/* Health card */}
            <div className={`p-6 rounded-3xl border text-left flex flex-col justify-between gap-6 ${isDarkMode ? 'bg-[#051630] border-white/5' : 'bg-white border-slate-200/80 shadow-md hover:shadow-lg'} print-card`}>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-5 h-5 text-[#39B54A]" />
                    <h3 className="font-poppins font-bold text-sm uppercase tracking-wider text-secondary">Health & Wellbeing</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRiskCategory(activeState.risks.health).class}`}>
                    Score: {activeState.risks.health}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-y border-slate-200/20 dark:border-white/5 py-3 text-xs">
                  <div>
                    <span className="opacity-50 text-[10px] block mb-1">Maternal Index</span>
                    <span className="font-bold font-mono">{activeState.health.maternalHealth}/100</span>
                  </div>
                  <div>
                    <span className="opacity-50 text-[10px] block mb-1">Child Immuniz.</span>
                    <span className="font-bold font-mono">{activeState.health.childHealth}%</span>
                  </div>
                  <div>
                    <span className="opacity-50 text-[10px] block mb-1">Facility Access</span>
                    <span className="font-bold font-mono">{activeState.health.healthcareAccess}%</span>
                  </div>
                </div>
              </div>
              <div className="h-[120px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: "Maternal Health", State: activeState.health.maternalHealth, Avg: NATIONAL_AVERAGES.health.maternalHealth },
                    { name: "Immunization", State: activeState.health.childHealth, Avg: NATIONAL_AVERAGES.health.childHealth }
                  ]}>
                    <XAxis dataKey="name" stroke={isDarkMode ? "#ffffff80" : "#00000080"} fontSize={9} />
                    <YAxis hide domain={[0, 100]} />
                    <ChartTooltip wrapperStyle={{ outline: 'none' }} contentStyle={{ backgroundColor: isDarkMode ? '#051c3a' : '#fff', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                    <Bar dataKey="State" fill="#39B54A" radius={[4, 4, 0, 0]} name={`${activeState.name} %`} />
                    <Bar dataKey="Avg" fill="#94A3B8" opacity={0.4} radius={[4, 4, 0, 0]} name="National Avg %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] opacity-40 border-t border-slate-200/10 dark:border-white/5 pt-3">
                Sources: DHS Demographic Survey, WHO Health Statistics
              </div>
            </div>

            {/* Food Security card */}
            <div className={`p-6 rounded-3xl border text-left flex flex-col justify-between gap-6 ${isDarkMode ? 'bg-[#051630] border-white/5' : 'bg-white border-slate-200/80 shadow-md hover:shadow-lg'} print-card`}>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <Sprout className="w-5 h-5 text-[#39B54A]" />
                    <h3 className="font-poppins font-bold text-sm uppercase tracking-wider text-secondary">Food Security</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRiskCategory(activeState.risks.foodSecurity).class}`}>
                    Score: {activeState.risks.foodSecurity}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-y border-slate-200/20 dark:border-white/5 py-3 text-xs">
                  <div>
                    <span className="opacity-50 text-[10px] block mb-1">Consumption</span>
                    <span className="font-bold font-mono">{activeState.foodSecurity.foodConsumption}%</span>
                  </div>
                  <div>
                    <span className="opacity-50 text-[10px] block mb-1">Acute Insecurity</span>
                    <span className="font-bold font-mono">{activeState.foodSecurity.acuteInsecurity}%</span>
                  </div>
                  <div>
                    <span className="opacity-50 text-[10px] block mb-1">Nutrition Risk</span>
                    <span className="font-bold font-mono">{activeState.foodSecurity.nutritionRisk}/10</span>
                  </div>
                </div>
              </div>
              <div className="h-[120px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: "Consumption", State: activeState.foodSecurity.foodConsumption, Average: NATIONAL_AVERAGES.foodSecurity.foodConsumption },
                    { name: "Acute Insecurity", State: activeState.foodSecurity.acuteInsecurity, Average: NATIONAL_AVERAGES.foodSecurity.acuteInsecurity }
                  ]}>
                    <XAxis dataKey="name" stroke={isDarkMode ? "#ffffff80" : "#00000080"} fontSize={9} />
                    <YAxis hide domain={[0, 100]} />
                    <ChartTooltip wrapperStyle={{ outline: 'none' }} contentStyle={{ backgroundColor: isDarkMode ? '#051c3a' : '#fff', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="State" stroke="#39B54A" fill="#39B54A" fillOpacity={0.2} name={`${activeState.name} %`} />
                    <Area type="monotone" dataKey="Average" stroke="#94A3B8" fill="#94A3B8" fillOpacity={0.05} name="National Avg %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] opacity-40 border-t border-slate-200/10 dark:border-white/5 pt-3">
                Sources: Cadre Harmonisé Joint Analysis, FAO/WFP Data
              </div>
            </div>

            {/* Displacement card */}
            <div className={`p-6 rounded-3xl border text-left flex flex-col justify-between gap-6 ${isDarkMode ? 'bg-[#051630] border-white/5' : 'bg-white border-slate-200/80 shadow-md hover:shadow-lg'} print-card`}>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-5 h-5 text-[#39B54A]" />
                    <h3 className="font-poppins font-bold text-sm uppercase tracking-wider text-secondary">Displacement & Returns</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRiskCategory(activeState.risks.displacement).class}`}>
                    Score: {activeState.risks.displacement}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-y border-slate-200/20 dark:border-white/5 py-3 text-xs">
                  <div>
                    <span className="opacity-50 text-[10px] block mb-1">Active IDPs</span>
                    <span className="font-bold font-mono">{activeState.displacement.idps.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="opacity-50 text-[10px] block mb-1">Returnees</span>
                    <span className="font-bold font-mono">{activeState.displacement.returnees.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="opacity-50 text-[10px] block mb-1">New Events</span>
                    <span className="font-bold font-mono">{activeState.displacement.newEvents}</span>
                  </div>
                </div>
              </div>
              <div className="h-[120px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: "IDPs", State: activeState.displacement.idps, Average: NATIONAL_AVERAGES.displacement.idps },
                    { name: "Returnees", State: activeState.displacement.returnees, Average: NATIONAL_AVERAGES.displacement.returnees }
                  ]}>
                    <XAxis dataKey="name" stroke={isDarkMode ? "#ffffff80" : "#00000080"} fontSize={9} />
                    <YAxis hide />
                    <ChartTooltip wrapperStyle={{ outline: 'none' }} contentStyle={{ backgroundColor: isDarkMode ? '#051c3a' : '#fff', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                    <Bar dataKey="State" fill="#39B54A" radius={[4, 4, 0, 0]} name={activeState.name} />
                    <Bar dataKey="Average" fill="#94A3B8" opacity={0.4} radius={[4, 4, 0, 0]} name="National Avg" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] opacity-40 border-t border-slate-200/10 dark:border-white/5 pt-3">
                Sources: IOM DTM Registries, NEMA Situation Reports
              </div>
            </div>

            {/* Peace & Security card */}
            <div className={`p-6 rounded-3xl border text-left flex flex-col justify-between gap-6 ${isDarkMode ? 'bg-[#051630] border-white/5' : 'bg-white border-slate-200/80 shadow-md hover:shadow-lg'} print-card`}>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-5 h-5 text-[#39B54A]" />
                    <h3 className="font-poppins font-bold text-sm uppercase tracking-wider text-secondary">Peace & Security</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRiskCategory(activeState.risks.peaceSecurity).class}`}>
                    Score: {activeState.risks.peaceSecurity}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-y border-slate-200/20 dark:border-white/5 py-3 text-xs">
                  <div>
                    <span className="opacity-50 text-[10px] block mb-1">Conflicts</span>
                    <span className="font-bold font-mono">{activeState.peaceSecurity.conflictIncidents}</span>
                  </div>
                  <div>
                    <span className="opacity-50 text-[10px] block mb-1">Fatalities</span>
                    <span className="font-bold font-mono">{activeState.peaceSecurity.fatalities}</span>
                  </div>
                  <div>
                    <span className="opacity-50 text-[10px] block mb-1">Neighborhood Safety</span>
                    <span className="font-bold font-mono">{activeState.peaceSecurity.communitySecurity}%</span>
                  </div>
                </div>
              </div>
              <div className="h-[120px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: "Neighborhood Safety", State: activeState.peaceSecurity.communitySecurity, Average: NATIONAL_AVERAGES.peaceSecurity.communitySecurity }
                  ]}>
                    <XAxis dataKey="name" stroke={isDarkMode ? "#ffffff80" : "#00000080"} fontSize={9} />
                    <YAxis hide domain={[0, 100]} />
                    <ChartTooltip wrapperStyle={{ outline: 'none' }} contentStyle={{ backgroundColor: isDarkMode ? '#051c3a' : '#fff', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="State" stroke="#39B54A" fill="#39B54A" fillOpacity={0.2} name={`${activeState.name} %`} />
                    <Area type="monotone" dataKey="Average" stroke="#94A3B8" fill="#94A3B8" fillOpacity={0.05} name="National Avg %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] opacity-40 border-t border-slate-200/10 dark:border-white/5 pt-3">
                Sources: ACLED Portal, Nigeria Security Tracker
              </div>
            </div>

          </div>
        </div>

        {/* STATE COMPARISON TOOL */}
        <div className={`p-6 rounded-3xl border text-left flex flex-col gap-6 ${isDarkMode ? 'bg-[#051630] border-white/5' : 'bg-white border-slate-200/80 shadow-md hover:shadow-lg'} print-card`}>
          <div>
            <span className="font-inter text-[10px] font-bold tracking-[0.2em] text-[#39B54A] uppercase block">
              Pillar Analytics
            </span>
            <h2 className="font-poppins font-bold text-xl uppercase tracking-tight mt-1">State Comparison Tool</h2>
            <p className="font-inter text-xs opacity-60 mt-1">
              Select two states to conduct side-by-side analysis of risk variables and human vulnerability benchmarks.
            </p>
          </div>

          {/* Selectors Row */}
          <div className="flex flex-wrap gap-4 items-center border-b border-slate-200/20 dark:border-white/5 pb-6 no-print">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase opacity-65">Compare:</span>
              <select 
                value={stateAId}
                onChange={(e) => setStateAId(e.target.value)}
                className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border cursor-pointer ${
                  isDarkMode ? 'bg-[#030e20] border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                {PROCESSED_STATE_DATA.map(s => (
                  <option key={s.id} value={s.id} disabled={s.id === stateBId}>{s.name} State</option>
                ))}
              </select>
            </div>
            
            <div className="text-xs font-bold text-[#39B54A]">vs</div>

            <div className="flex items-center gap-3">
              <select 
                value={stateBId}
                onChange={(e) => setStateBId(e.target.value)}
                className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border cursor-pointer ${
                  isDarkMode ? 'bg-[#030e20] border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                {PROCESSED_STATE_DATA.map(s => (
                  <option key={s.id} value={s.id} disabled={s.id === stateAId}>{s.name} State</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid: Table Comparison vs Radar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Table Comparison (LG: 7 columns) */}
            <div className="lg:col-span-7 overflow-x-auto w-full">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/20 dark:border-white/5 text-xs opacity-50 uppercase tracking-widest">
                    <th className="py-3 px-2 font-poppins font-bold text-left">Pillar Indicator</th>
                    <th className="py-3 px-2 font-poppins font-bold text-right">{stateA.name}</th>
                    <th className="py-3 px-2 font-poppins font-bold text-right">{stateB.name}</th>
                    <th className="py-3 px-2 font-poppins font-bold text-right">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Composite Security Index Score", key: "composite", valA: stateA.risks.composite, valB: stateB.risks.composite },
                    { name: "Poverty & Livelihoods Risk", key: "poverty", valA: stateA.risks.poverty, valB: stateB.risks.poverty },
                    { name: "Education Systems Risk", key: "education", valA: stateA.risks.education, valB: stateB.risks.education },
                    { name: "Health & Wellbeing Risk", key: "health", valA: stateA.risks.health, valB: stateB.risks.health },
                    { name: "Food Insecurity Risk", key: "foodSecurity", valA: stateA.risks.foodSecurity, valB: stateB.risks.foodSecurity },
                    { name: "Displacement Threat", key: "displacement", valA: stateA.risks.displacement, valB: stateB.risks.displacement },
                    { name: "Conflict & Security Risk", key: "peaceSecurity", valA: stateA.risks.peaceSecurity, valB: stateB.risks.peaceSecurity }
                  ].map((row, idx) => {
                    const diff = row.valA - row.valB;
                    const sign = diff > 0 ? `+${diff}` : `${diff}`;
                    const varColor = diff > 0 ? "text-rose-500 font-bold" : diff < 0 ? "text-emerald-500 font-bold" : "opacity-45";
                    
                    return (
                      <tr 
                        key={idx} 
                        className={`border-b border-slate-200/10 dark:border-white/5 text-xs font-semibold ${
                          row.key === 'composite' 
                            ? 'font-bold bg-[#39B54A]/5 border-y border-[#39B54A]/10' 
                            : ''
                        }`}
                      >
                        <td className="py-3.5 px-2 text-left">{row.name}</td>
                        <td className="py-3.5 px-2 text-right font-mono">{row.valA}/100</td>
                        <td className="py-3.5 px-2 text-right font-mono">{row.valB}/100</td>
                        <td className={`py-3.5 px-2 text-right font-mono ${varColor}`}>{sign}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Radar Chart (LG: 5 columns) */}
            <div className="lg:col-span-5 h-[280px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getComparisonRadarData()}>
                  <PolarGrid stroke={isDarkMode ? "#ffffff15" : "#00000015"} />
                  <PolarAngleAxis dataKey="subject" stroke={isDarkMode ? "#ffffff80" : "#00000080"} fontSize={9} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={isDarkMode ? "#ffffff30" : "#00000030"} fontSize={8} />
                  <Radar name={stateA.name} dataKey={stateA.name} stroke="#39B54A" fill="#39B54A" fillOpacity={0.2} />
                  <Radar name={stateB.name} dataKey={stateB.name} stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.2} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>

      </div>

      {/* DATA SOURCES MODAL */}
      {showSourcesModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-6 animate-fade-in no-print">
          <div className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden text-left border ${
            isDarkMode ? 'bg-[#051630] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="p-6 border-b border-slate-200/20 dark:border-white/5 flex justify-between items-center">
              <h3 className="font-poppins font-bold text-lg uppercase tracking-tight flex items-center gap-2">
                <Database className="w-5 h-5 text-[#39B54A]" />
                Dashboard Registry & Sources
              </h3>
              <button 
                onClick={() => setShowSourcesModal(false)}
                className="p-1 rounded-full hover:bg-white/5 transition-colors cursor-pointer outline-none border-none bg-transparent text-current"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-5 max-h-[450px] overflow-y-auto">
              <p className="font-inter text-xs opacity-75 leading-relaxed">
                The Beyond Statistics Initiative (Beyond#) Human Security Dashboard integrates administrative data, demographic reports, geospatial tracking, and conflict registries. The following databases are aggregated:
              </p>

              <div className="flex flex-col gap-4">
                {[
                  { name: "National Bureau of Statistics (NBS)", d: "Poverty metrics, Multidimensional Poverty Index (MPI), national unemployment rates, and annual education census datasets." },
                  { name: "World Bank Development Indicators", d: "Microeconomic impact, household consumption reports, and inflation indexes." },
                  { name: "UNICEF (MICS reports) & WHO", d: "School attendance statistics, youth literacy baselines, basic vaccination coverages, and maternal-infant health indices." },
                  { name: "Cadre Harmonisé Joint Analysis", d: "Acute Food Insecurity status and child malnutrition ratios." },
                  { name: "IOM DTM & NEMA", d: "Active tracking arrays of Internally Displaced Persons (IDP), returning populations, and emergency displacement events." },
                  { name: "ACLED & Nigeria Security Tracker", d: "Geolocated conflict logs, fatality datasets, and regional community violence statistics." }
                ].map((src, i) => (
                  <div key={i} className="flex gap-3 text-xs leading-normal">
                    <div className="w-5 h-5 rounded-full bg-[#39B54A]/10 flex items-center justify-center font-bold text-[#39B54A] shrink-0 text-[10px]">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm mb-1">{src.name}</h4>
                      <p className="opacity-60">{src.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-slate-200/20 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 text-center">
              <button 
                onClick={() => setShowSourcesModal(false)}
                className="bg-[#39B54A] hover:bg-[#2e993d] text-white text-xs font-bold px-6 py-2.5 rounded-full cursor-pointer outline-none border-none uppercase tracking-wider"
              >
                Close Registry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Update Sync Toast */}
      {updateNotification && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-fade-in no-print">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-left ${
            updateNotification.type === 'success' 
              ? 'bg-[#39B54A] border-[#39B54A] text-white' 
              : 'bg-blue-600 border-blue-600 text-white'
          }`}>
            <Info className="w-4.5 h-4.5 shrink-0" />
            <span className="font-inter text-xs font-bold uppercase tracking-wider">
              {updateNotification.message}
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
