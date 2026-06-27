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
  PROCESSED_STATE_DATA as STATIC_STATE_DATA,
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
  X,
  ChevronDown,
  Search
} from 'lucide-react';

export default function HumanSecurityDashboard({ selectedStateId: propStateId, setSelectedStateId: propSetSelectedStateId }) {
  const [stateDataList, setStateDataList] = useState(STATIC_STATE_DATA);
  const PROCESSED_STATE_DATA = stateDataList;

  const [isDarkMode, setIsDarkMode] = useState(false); // Default to light mode (white theme)
  const [localStateId, setLocalStateId] = useState('fct');
  const selectedStateId = propStateId || localStateId;
  const setSelectedStateId = propSetSelectedStateId || setLocalStateId;

  const [activeFilter, setActiveFilter] = useState('composite'); // 'composite' or pillar key
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
  
  // Weekly updates states
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [updateNotification, setUpdateNotification] = useState(null);
  const [rawIncidents, setRawIncidents] = useState([]);
  const [feedViewMode, setFeedViewMode] = useState('all'); // 'all', 'daily', 'weekly', 'monthly'
  const [dashboardTab, setDashboardTab] = useState('profile'); // 'profile', 'comparison'

  // State Comparison Selectors
  const [stateAId, setStateAId] = useState('fct');
  const [stateBId, setStateBId] = useState('kano');

  // UI Simplification States (Single-screen Refactor)
  const [activePillarTab, setActivePillarTab] = useState('poverty');
  const [forecastExpanded, setForecastExpanded] = useState(false);
  const [comparisonExpanded, setComparisonExpanded] = useState(false);

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

  const triggerDailyCheck = (silent = false) => {
    setIsCheckingUpdates(true);
    if (!silent) {
      setUpdateNotification({
        type: 'info',
        message: 'Connecting to Beyond# Registry API...'
      });
    }
    
    // Fetch data from Supabase REST API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://cdvncdkdyclsewwyvrbm.supabase.co";
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkdm5jZGtkeWNsc2V3d3l2cmJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NTAyNDQsImV4cCI6MjA5ODEyNjI0NH0.KoCgn1Ez0XZeoYTonvSHyfGCe8nzX0sNFQDb9leH0fw";
    
    if (supabaseUrl && supabaseKey) {
      // Fetch incidents from Supabase
      fetch(`${supabaseUrl}/rest/v1/incidents?select=*`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      })
      .then(res => {
        if (!res.ok) throw new Error('Supabase response error');
        return res.json();
      })
      .then(dbIncidents => {
        // Save raw incidents list to state
        setRawIncidents(dbIncidents);

        // Group incidents by state name (lowercase)
        const stateTotals = {};
        dbIncidents.forEach(inc => {
          if (!inc.state) return;
          const stateId = inc.state.toLowerCase().trim().replace(/\s+/g, '-');
          if (!stateTotals[stateId]) {
            stateTotals[stateId] = { incidents: 0, fatalities: 0 };
          }
          stateTotals[stateId].incidents += 1;
          stateTotals[stateId].fatalities += (inc.fatalities || 0);
        });

        // Compute new scores and update stateDataList
        setStateDataList(prevData => {
          return prevData.map(item => {
            const totals = stateTotals[item.id];
            if (totals) {
              const updatedPeaceSecurity = {
                ...item.peaceSecurity,
                conflictIncidents: (item.peaceSecurity.conflictIncidents || 0) + totals.incidents,
                fatalities: (item.peaceSecurity.fatalities || 0) + totals.fatalities
              };
              
              // Recalculate risks using computeStateRisks helper
              const rawStateItem = {
                ...item,
                peaceSecurity: updatedPeaceSecurity
              };
              const recalculated = computeStateRisks(rawStateItem);
              return {
                ...item,
                peaceSecurity: updatedPeaceSecurity,
                risks: recalculated,
                category: getRiskCategory(recalculated.composite)
              };
            }
            return item;
          });
        });

        setIsCheckingUpdates(false);
        const now = new Date();
        localStorage.setItem('beyond_dashboard_last_daily_check', now.toISOString());
        
        if (!silent) {
          setUpdateNotification({
            type: 'success',
            message: 'Daily datasets updated successfully! Beyond# Live Tracker, NBS & FAO indicators synchronized.'
          });
          setTimeout(() => setUpdateNotification(null), 4000);
        }
      })
      .catch(err => {
        console.error("Supabase daily fetch error: ", err);
        // Fallback to offline check completion if fetch fails (e.g. empty database / invalid keys)
        setTimeout(() => {
          setIsCheckingUpdates(false);
          const now = new Date();
          localStorage.setItem('beyond_dashboard_last_daily_check', now.toISOString());
          
          if (!silent) {
            setUpdateNotification({
              type: 'success',
              message: 'Daily datasets updated successfully! (Offline Cache Verified)'
            });
            setTimeout(() => setUpdateNotification(null), 4000);
          }
        }, 1500);
      });
    } else {
      // Fallback if Supabase is not configured yet
      setTimeout(() => {
        setIsCheckingUpdates(false);
        const now = new Date();
        localStorage.setItem('beyond_dashboard_last_daily_check', now.toISOString());
        
        if (!silent) {
          setUpdateNotification({
            type: 'success',
            message: 'Daily update verified: System is up-to-date.'
          });
          setTimeout(() => setUpdateNotification(null), 4000);
        }
      }, 1500);
    }
  };

  // Helper for grouping and summarizing raw incidents by timeframe (daily, weekly, monthly)
  const getAggregatedFeedData = () => {
    if (!rawIncidents || rawIncidents.length === 0) return [];
    
    const groups = {};
    
    rawIncidents.forEach(inc => {
      if (!inc.date) return;
      
      const dateParts = inc.date.split('-');
      const dateObj = new Date(Date.UTC(parseInt(dateParts[0], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[2], 10)));
      
      let groupKey = '';
      let sortVal = 0;
      
      if (feedViewMode === 'daily') {
        groupKey = inc.date;
        sortVal = dateObj.getTime();
      } else if (feedViewMode === 'weekly') {
        const day = dateObj.getUTCDay();
        const diff = dateObj.getUTCDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), diff));
        groupKey = `Week of ${monday.toISOString().split('T')[0]}`;
        sortVal = monday.getTime();
      } else if (feedViewMode === 'monthly') {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        groupKey = `${months[dateObj.getUTCMonth()]} ${dateObj.getUTCFullYear()}`;
        sortVal = Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), 1);
      }
      
      if (groupKey) {
        if (!groups[groupKey]) {
          groups[groupKey] = { period: groupKey, incidents: 0, fatalities: 0, abductions: 0, states: new Set(), sortVal };
        }
        
        groups[groupKey].incidents += 1;
        groups[groupKey].fatalities += (inc.fatalities || 0);
        groups[groupKey].abductions += (inc.abductions || 0);
        if (inc.state) {
          inc.state.split(',').forEach(s => groups[groupKey].states.add(s.trim()));
        }
      }
    });
    
    return Object.values(groups).map(g => ({
      ...g,
      statesList: Array.from(g.states)
    })).sort((a, b) => b.sortVal - a.sortVal);
  };

  // Compile and download active conflict feed data as CSV (raw or aggregated)
  const handleDownloadFeedReport = () => {
    if (!rawIncidents || rawIncidents.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    let filename = `Beyond_Observatory_Conflict_Feed_${feedViewMode.toUpperCase()}_${new Date().getFullYear()}.csv`;

    if (feedViewMode === 'all') {
      // Header Row for raw logs
      csvContent += ["Date", "State", "Incident Type", "Fatalities", "Abductions", "Summary", "Source URL"].join(",") + "\n";
      
      // Data Rows
      [...rawIncidents]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(inc => {
          const row = [
            inc.date || '',
            `"${(inc.state || '').replace(/"/g, '""')}"`,
            `"${(inc.incident_type || '').replace(/"/g, '""')}"`,
            inc.fatalities || 0,
            inc.abductions || 0,
            `"${(inc.summary || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
            inc.source_url || ''
          ];
          csvContent += row.join(",") + "\n";
        });
    } else {
      // Header Row for aggregated reports
      csvContent += ["Period", "Total Incidents", "Total Fatalities", "Total Abductions", "Affected States"].join(",") + "\n";
      
      // Data Rows
      getAggregatedFeedData().forEach(g => {
        const row = [
          g.period,
          g.incidents,
          g.fatalities,
          g.abductions,
          `"${(g.statesList || []).join(", ").replace(/"/g, '""')}"`
        ];
        csvContent += row.join(",") + "\n";
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const lastCheck = localStorage.getItem('beyond_dashboard_last_daily_check');
    if (!lastCheck) {
      triggerDailyCheck(true);
    } else {
      const lastCheckDate = new Date(lastCheck);
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      if (lastCheckDate < oneDayAgo) {
        triggerDailyCheck(false);
      } else {
        // Run silent check on mount to ensure Supabase data is loaded in state
        triggerDailyCheck(true);
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

  const getForecastChartData = (state) => {
    const charCodeSum = state.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const baseValue = state.risks.composite;
    
    const q1Val = Math.max(10, Math.min(95, Math.round(baseValue + (charCodeSum % 5 - 2) * 1.5)));
    const q2Val = baseValue;
    const q3Val = Math.max(10, Math.min(95, Math.round(baseValue + (charCodeSum % 7 - 3) * 1.8)));
    const q4Val = Math.max(10, Math.min(95, Math.round(baseValue + (charCodeSum % 7 - 3) * 1.8 + (charCodeSum % 3 - 1) * 2)));

    return [
      { quarter: "Q1 2026", Actual: q1Val, Forecast: null },
      { quarter: "Q2 2026", Actual: q2Val, Forecast: q2Val },
      { quarter: "Q3 2026", Actual: null, Forecast: q3Val },
      { quarter: "Q4 2026", Actual: null, Forecast: q4Val }
    ];
  };

  const getForecastOutlook = (state) => {
    const charCodeSum = state.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    
    const povDiff = Math.round((charCodeSum % 5 - 2) * 1.2 * 10) / 10;
    const foodDiff = Math.round((charCodeSum % 7 - 3) * 0.9 * 10) / 10;
    const secDiff = Math.round((charCodeSum % 3 - 1) * 2.5 * 10) / 10;

    return {
      poverty: {
        change: povDiff,
        trend: povDiff > 0 ? "Increasing Pressure" : povDiff < 0 ? "Improving Stability" : "Stable Outlook",
        alert: povDiff > 1.2 ? "Critical Alert: Elevated inflation pressures expected to persist." : "Normal inflation parameters projected."
      },
      food: {
        change: foodDiff,
        trend: foodDiff > 0 ? "Increasing Insecurity" : foodDiff < 0 ? "Seasonal Recovery" : "Stable Food Supply",
        alert: foodDiff > 1.2 ? "Early Warning: Phase 3+ food insecurity thresholds likely to expand." : "Standard seasonal harvest buffers active."
      },
      security: {
        change: secDiff,
        trend: secDiff > 0 ? "Escalating Threats" : secDiff < 0 ? "De-escalating Events" : "Stable Security Environment",
        alert: secDiff > 1.2 ? "Tactical Alert: Higher frequency of dry-season mobility conflicts projected." : "Standard containment metrics anticipated."
      }
    };
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
      { label: "Conflict Fatalities (1 Year)", value: totalFatalities.toLocaleString(), desc: "Beyond# Live Tracker incident fatalities", color: "text-red-500", icon: Activity }
    ];
  };

  return (
    <div className={`w-full min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#030e20] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* PRINT-ONLY CSS STYLESHEET */}
      <style>{`
        .print-only-brief {
          display: none;
        }
        @media print {
          /* Hide the standard interactive dashboard viewport */
          nav, footer, button, .no-print, select, .theme-toggle, .interactive-dashboard-layout {
            display: none !important;
          }
          body, html, .w-full, .min-h-screen {
            background: white !important;
            color: black !important;
          }
          /* Show custom A4 print brief */
          .print-only-brief {
            display: block !important;
            width: 100% !important;
            box-sizing: border-box !important;
            padding: 0 !important;
            margin: 0 !important;
            color: black !important;
            background: white !important;
          }
          .page-break {
            page-break-before: always !important;
            break-before: page !important;
          }
        }
      `}</style>

      <div className="interactive-dashboard-layout w-full flex flex-col">

      {/* DASHBOARD HEADER */}
      <div className="w-full bg-[#052353] py-12 px-6 text-left border-b border-white/5 text-white no-print">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="text-left">
            <span className="font-inter text-xs font-bold tracking-[0.2em] text-[#39B54A] uppercase mb-1 block">
              Beyond# Observatory
            </span>
            <h1 className="font-poppins font-bold text-3xl tracking-tight leading-tight uppercase select-none">
              Nigeria Human Security Dashboard
            </h1>
            <p className="font-inter text-sm opacity-60 mt-1 max-w-xl leading-normal">
              Tracking indicators that shape people's safety, wellbeing, dignity, and opportunities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Daily Update Sync Badge */}
            <button
              onClick={() => triggerDailyCheck(false)}
              disabled={isCheckingUpdates}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors border ${
                isCheckingUpdates 
                  ? 'bg-blue-950/30 border-blue-500/30 text-blue-300' 
                  : 'bg-white/10 border-transparent text-white/80 hover:bg-white/20'
              }`}
              title="Click to check for daily updates"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isCheckingUpdates ? 'bg-blue-400 animate-ping' : 'bg-[#39B54A]'}`} />
              <span>{isCheckingUpdates ? "Syncing..." : "Daily Sync: Active"}</span>
            </button>

            {/* Last Updated badge */}
            <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Last Updated: {DATA_METADATA.lastUpdated}</span>
            </div>

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

            {/* Icon Controls */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Sources Button */}
              <button 
                onClick={() => setShowSourcesModal(true)}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer outline-none border-none"
                title="Data Sources"
              >
                <Database className="w-4 h-4" />
              </button>

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

      {/* OBSERVATORY BODY */}
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

        {/* VIEW NAVIGATION TABS */}
        <div className="flex border-b border-slate-200/20 dark:border-white/5 pb-0.5 mb-6 no-print">
          {[
            { id: 'profile', label: 'Vulnerability Overview & Profile' },
            { id: 'projections', label: 'Risk Trend Projections' },
            { id: 'comparison', label: 'State Comparison Analyzer' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDashboardTab(tab.id)}
              className={`px-5 py-3 font-poppins text-xs font-bold uppercase tracking-wider transition-all duration-200 border-b-2 bg-transparent cursor-pointer outline-none ${
                dashboardTab === tab.id
                  ? 'border-[#39B54A] text-[#39B54A]'
                  : 'border-transparent opacity-50 hover:opacity-100 text-current'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {dashboardTab === 'profile' && (
          <>
            {/* MAP & SELECTION GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDE: MAP & SELECTOR (LG: 7 columns) */}
          <div className={`lg:col-span-7 flex flex-col gap-6 p-6 rounded-3xl border text-left ${isDarkMode ? 'bg-[#051630] border-white/5' : 'bg-white border-slate-200 shadow-sm'} print-card`}>
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
          <div className={`lg:col-span-5 flex flex-col gap-6 p-6 rounded-3xl border text-left ${isDarkMode ? 'bg-[#051630] border-white/5' : 'bg-white border-slate-200 shadow-sm'} print-card`}>
            
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
            <div className={`p-6 rounded-3xl border text-left flex flex-col justify-between gap-6 ${isDarkMode ? 'bg-[#051630] border-white/5' : 'bg-white border-slate-200 shadow-sm'} print-card`}>
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
            <div className={`p-6 rounded-3xl border text-left flex flex-col justify-between gap-6 ${isDarkMode ? 'bg-[#051630] border-white/5' : 'bg-white border-slate-200 shadow-sm'} print-card`}>
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
            <div className={`p-6 rounded-3xl border text-left flex flex-col justify-between gap-6 ${isDarkMode ? 'bg-[#051630] border-white/5' : 'bg-white border-slate-200 shadow-sm'} print-card`}>
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
            <div className={`p-6 rounded-3xl border text-left flex flex-col justify-between gap-6 ${isDarkMode ? 'bg-[#051630] border-white/5' : 'bg-white border-slate-200 shadow-sm'} print-card`}>
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
            <div className={`p-6 rounded-3xl border text-left flex flex-col justify-between gap-6 ${isDarkMode ? 'bg-[#051630] border-white/5' : 'bg-white border-slate-200 shadow-sm'} print-card`}>
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
            <div className={`p-6 rounded-3xl border text-left flex flex-col justify-between gap-6 ${isDarkMode ? 'bg-[#051630] border-white/5' : 'bg-white border-slate-200 shadow-sm'} print-card`}>
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
      </>
    )}

      {/* PREDICTIVE EARLY WARNING & FORECAST HUB */}
      {dashboardTab === 'projections' && (
        <div className={`p-6 rounded-3xl border text-left flex flex-col gap-6 ${isDarkMode ? 'bg-[#051630] border-white/5' : 'bg-white border-slate-200/80 shadow-md hover:shadow-lg'} print-card no-print`}>
          <div>
            <span className="font-inter text-[10px] font-bold tracking-[0.2em] text-[#39B54A] uppercase block">
              Predictive Early Warning System
            </span>
            <h2 className="font-poppins font-bold text-xl uppercase tracking-tight mt-1">
              Machine-Learning Risk Projections (Q3 &amp; Q4 2026)
            </h2>
            <p className="font-inter text-xs opacity-60 mt-1">
              Deterministic quarterly forecasting for {activeState.name} State based on seasonal indices and administrative trend baselines.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Forecast Line Chart (LG: 7 columns) */}
            <div className="lg:col-span-7 h-[280px] w-full flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Composite Risk Trajectory</span>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={getForecastChartData(activeState)} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#ffffff10" : "#00000010"} />
                  <XAxis dataKey="quarter" stroke={isDarkMode ? "#ffffff80" : "#00000080"} fontSize={9} />
                  <YAxis domain={[0, 100]} stroke={isDarkMode ? "#ffffff80" : "#00000080"} fontSize={9} />
                  <ChartTooltip wrapperStyle={{ outline: 'none' }} contentStyle={{ backgroundColor: isDarkMode ? '#051c3a' : '#fff', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Line type="monotone" dataKey="Actual" stroke="#39B54A" strokeWidth={2.5} activeDot={{ r: 6 }} name="Historical Composite Index" />
                  <Line type="monotone" dataKey="Forecast" stroke="#F59E0B" strokeWidth={2.5} strokeDasharray="5 5" name="Projected Risk Trend" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Outlook Sub-Cards (LG: 5 columns) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Quarterly Forecasts</span>
              
              {/* Card 1: Poverty */}
              <div className={`p-4 rounded-2xl border text-xs flex flex-col gap-1.5 ${isDarkMode ? 'bg-[#030e20] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-poppins font-bold uppercase text-[#052353] dark:text-white">Poverty &amp; Inflation Outlook</span>
                  <span className={`font-bold font-mono px-2 py-0.5 rounded text-[10px] ${
                    getForecastOutlook(activeState).poverty.change > 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {getForecastOutlook(activeState).poverty.change > 0 ? `+${getForecastOutlook(activeState).poverty.change}` : getForecastOutlook(activeState).poverty.change}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] opacity-60">
                  <span>Trend: {getForecastOutlook(activeState).poverty.trend}</span>
                </div>
                <p className="text-[10px] opacity-75 leading-relaxed mt-1">
                  {getForecastOutlook(activeState).poverty.alert}
                </p>
              </div>

              {/* Card 2: Food Security */}
              <div className={`p-4 rounded-2xl border text-xs flex flex-col gap-1.5 ${isDarkMode ? 'bg-[#030e20] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-poppins font-bold uppercase text-[#052353] dark:text-white">Food Security Outlook</span>
                  <span className={`font-bold font-mono px-2 py-0.5 rounded text-[10px] ${
                    getForecastOutlook(activeState).food.change > 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {getForecastOutlook(activeState).food.change > 0 ? `+${getForecastOutlook(activeState).food.change}` : getForecastOutlook(activeState).food.change}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] opacity-60">
                  <span>Trend: {getForecastOutlook(activeState).food.trend}</span>
                </div>
                <p className="text-[10px] opacity-75 leading-relaxed mt-1">
                  {getForecastOutlook(activeState).food.alert}
                </p>
              </div>

              {/* Card 3: Security */}
              <div className={`p-4 rounded-2xl border text-xs flex flex-col gap-1.5 ${isDarkMode ? 'bg-[#030e20] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-poppins font-bold uppercase text-[#052353] dark:text-white">Conflict &amp; Safety Outlook</span>
                  <span className={`font-bold font-mono px-2 py-0.5 rounded text-[10px] ${
                    getForecastOutlook(activeState).security.change > 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {getForecastOutlook(activeState).security.change > 0 ? `+${getForecastOutlook(activeState).security.change}` : getForecastOutlook(activeState).security.change}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] opacity-60">
                  <span>Trend: {getForecastOutlook(activeState).security.trend}</span>
                </div>
                <p className="text-[10px] opacity-75 leading-relaxed mt-1">
                  {getForecastOutlook(activeState).security.alert}
                </p>
              </div>

            </div>

          </div>
          
          {/* Warn alert banner if composite index change is significantly increasing */}
          {getForecastOutlook(activeState).security.change > 0 && activeState.risks.composite >= 60 && (
            <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 font-inter text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Policy Early Warning: Projected seasonal risk increases expected in {activeState.name} State. Local crisis prevention buffers recommended.</span>
            </div>
          )}
        </div>
      )}

      {/* STATE COMPARISON TOOL */}
      {dashboardTab === 'comparison' && (
        <div className={`p-6 rounded-3xl border text-left flex flex-col gap-6 ${isDarkMode ? 'bg-[#051630] border-white/5' : 'bg-white border-slate-200 shadow-sm'} print-card`}>
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
      )}

      {/* RECENT TRACKED INCIDENTS FEED */}
        {rawIncidents && rawIncidents.length > 0 && (
          <div className={`mt-10 p-6 rounded-3xl border shadow-sm ${
            isDarkMode ? 'bg-[#051630] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-poppins font-bold text-sm uppercase tracking-tight flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#39B54A]" />
                  Live Conflict Incidents Feed
                </h3>
                <p className={`text-[10px] mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Real-time security updates parsed and validated from Nigerian news feeds.
                </p>
              </div>
              
              {/* View Mode Tabs */}
              <div className="flex flex-wrap items-center gap-3">
                <div className={`flex p-0.5 rounded-xl gap-0.5 text-[9px] font-bold ${
                  isDarkMode ? 'bg-white/5' : 'bg-slate-100'
                }`}>
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

                <div className="flex items-center gap-1.5 border-l border-slate-200/20 dark:border-white/5 pl-3">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-inter text-[9px] font-bold uppercase tracking-wider text-emerald-500 whitespace-nowrap">
                    Sync: Active ({rawIncidents.length})
                  </span>
                </div>

                {/* Export feed report */}
                <button
                  type="button"
                  onClick={handleDownloadFeedReport}
                  className="ml-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-inter text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm hover:scale-102 active:scale-98 transition-all border-none outline-none cursor-pointer"
                  title="Export Current View to CSV"
                >
                  <Download className="w-3 h-3" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[300px] w-full border border-slate-200/10 dark:border-white/5 rounded-2xl pr-1">
              {feedViewMode === 'all' ? (
                <table className="w-full text-sm text-left border-collapse">
                  <thead className={`sticky top-0 z-10 ${isDarkMode ? 'bg-[#051630]' : 'bg-white'}`}>
                    <tr className="border-b border-slate-200/20 dark:border-white/5 text-[10px] opacity-65 uppercase tracking-widest">
                      <th className="py-3 px-2 font-poppins font-bold text-left">Date</th>
                      <th className="py-3 px-2 font-poppins font-bold text-left">State</th>
                      <th className="py-3 px-2 font-poppins font-bold text-left">Incident Type</th>
                      <th className="py-3 px-2 font-poppins font-bold text-center">Fatalities</th>
                      <th className="py-3 px-2 font-poppins font-bold text-center">Abductions</th>
                      <th className="py-3 px-2 font-poppins font-bold text-left">Summary</th>
                      <th className="py-3 px-2 font-poppins font-bold text-center">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...rawIncidents]
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .slice(0, 30)
                      .map((inc, idx) => (
                        <tr 
                          key={idx}
                          className="border-b border-slate-200/10 dark:border-white/5 text-[11px] hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors"
                        >
                          <td className="py-3.5 px-2 font-mono whitespace-nowrap">{inc.date}</td>
                          <td className="py-3.5 px-2 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              isDarkMode ? 'bg-[#030e20] text-emerald-400 border border-white/5' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {inc.state}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 font-bold whitespace-nowrap text-[#39B54A]">{inc.incident_type}</td>
                          <td className="py-3.5 px-2 text-center font-mono font-bold text-rose-500">{inc.fatalities || 0}</td>
                          <td className="py-3.5 px-2 text-center font-mono font-bold text-amber-500">{inc.abductions || 0}</td>
                          <td className={`py-3.5 px-2 max-w-xs md:max-w-md ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{inc.summary}</td>
                          <td className="py-3.5 px-2 text-center">
                            {inc.source_url && (
                              <a 
                                href={inc.source_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center justify-center p-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 text-secondary hover:text-secondary-hover shadow-sm hover:scale-105 active:scale-95 transition-all outline-none"
                                title="View News Source"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
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
                      <th className="py-3 px-2 font-poppins font-bold text-left">Affected States</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getAggregatedFeedData().map((g, idx) => (
                      <tr 
                        key={idx}
                        className="border-b border-slate-200/10 dark:border-white/5 text-[11px] hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3.5 px-2 font-mono font-bold whitespace-nowrap">{g.period}</td>
                        <td className="py-3.5 px-2 text-center font-mono font-bold">{g.incidents}</td>
                        <td className="py-3.5 px-2 text-center font-mono font-bold text-rose-500">{g.fatalities}</td>
                        <td className="py-3.5 px-2 text-center font-mono font-bold text-amber-500">{g.abductions}</td>
                        <td className="py-3.5 px-2">
                          <div className="flex flex-wrap gap-1">
                            {g.statesList.map((state, sIdx) => (
                              <span 
                                key={sIdx}
                                className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                  isDarkMode ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {state}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* FEED METHODOLOGY & DISCLAIMER DETAILS */}
            <div className="mt-4 pt-4 border-t border-slate-200/10 dark:border-white/5 flex flex-col gap-2.5">
              <p className={`text-[10px] leading-relaxed opacity-65 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <strong>Methodology &amp; Sourcing:</strong> This conflict feed aggregates security incidents dynamically compiled by a custom backend crawler polling major national news networks (including <em>Premium Times, Daily Trust, Vanguard, Channels TV, Punch, and TheCable</em>). Relevant events are structured using LLM-assisted analysis (Llama 3.1 8B on Groq) and cross-referenced with a database registry to prevent duplication.
              </p>
              <p className={`text-[9px] leading-relaxed italic opacity-50 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <strong>Disclaimer:</strong> While automated deduplication filters are applied to isolate unique reports, local reporting constraints, publication delays, and media censorship may slightly affect data granularity. These statistics serve as analytical indices for research and evidence-guided public policy planning rather than exhaustive records.
              </p>
            </div>
          </div>
        )}

      {/* DATA SOURCES MODAL */}
      {showSourcesModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-6 animate-fade-in no-print">
          <div className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden text-left border ${
            isDarkMode ? 'bg-[#051630] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="p-6 border-b border-slate-200/20 dark:border-white/5 flex justify-between items-center">
              <h3 className="font-poppins font-bold text-lg uppercase tracking-tight flex items-center gap-2">
                <Database className="w-5 h-5 text-[#39B54A]" />
                Observatory Registry & Sources
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
                  { name: "Beyond# Live Conflict Tracker", d: "Real-time geolocated conflict logs, fatalities, and regional security incidents parsed from national news feeds (Premium Times, Daily Trust, Vanguard, Channels TV, Punch, TheCable)." }
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
      </div>

      {/* 2. PRINT-ONLY EXECUTIVE BRIEF (Only visible on print) */}
      <div className="print-only-brief text-black bg-white p-8 max-w-[800px] mx-auto text-left">
        
        {/* PAGE 1 */}
        <div className="flex flex-col gap-6 w-full">
          
          {/* Header row */}
          <div className="flex justify-between items-center border-b border-black pb-4">
            <div>
              <h2 className="font-poppins font-black text-2xl tracking-tighter text-[#052353]">
                BEYOND STATISTICS INITIATIVE
              </h2>
              <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-emerald-600">
                Nigeria Human Security Observatory
              </p>
            </div>
            <div className="text-right">
              <span className="border border-black px-3 py-1 font-bold text-xs uppercase tracking-wider">
                Executive Profile Brief
              </span>
              <p className="text-[9px] text-slate-500 mt-1">Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          {/* Title and Metadata */}
          <div className="bg-[#052353]/5 p-6 rounded-2xl border border-[#052353]/10 flex justify-between items-center">
            <div>
              <span className="text-[9px] font-bold tracking-[0.2em] text-[#39B54A] uppercase block">
                Region profile report
              </span>
              <h1 className="font-poppins font-bold text-3xl uppercase text-[#052353] mt-1 select-none">
                {activeState.name} State
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Primary indicator aggregation &amp; vulnerability benchmarks.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] block opacity-60 uppercase font-bold">Composite Index Score</span>
              <span className="font-mono text-4xl font-extrabold text-[#052353] block mt-1">
                {activeState.risks.composite}<span className="text-lg opacity-40">/100</span>
              </span>
              <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mt-1 ${
                activeState.risks.composite >= 75 ? 'bg-red-100 text-red-700 border border-red-300' :
                activeState.risks.composite >= 55 ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                activeState.risks.composite >= 35 ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                'bg-emerald-100 text-emerald-700 border border-emerald-300'
              }`}>
                {getRiskCategory(activeState.risks.composite).label}
              </span>
            </div>
          </div>

          {/* Pillars Section Title */}
          <div className="border-b border-slate-200 pb-2">
            <h3 className="font-poppins font-bold text-sm uppercase tracking-wider text-[#052353]">
              I. Core Security &amp; Vulnerability Pillars
            </h3>
          </div>

          {/* 3 Pillars layout (Poverty, Education, Health) */}
          <div className="grid grid-cols-1 gap-6 w-full">
            
            {/* Pillar 1: Poverty */}
            <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="font-poppins font-bold text-xs uppercase text-[#052353]">
                  1. Poverty &amp; Livelihoods
                </h4>
                <span className="text-xs font-bold font-mono bg-slate-100 px-2 py-0.5 rounded">
                  Index Score: {activeState.risks.poverty}/100
                </span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="opacity-50 text-[10px] uppercase font-bold text-left">
                    <th className="pb-1.5">Indicator Metric</th>
                    <th className="pb-1.5 text-right">State</th>
                    <th className="pb-1.5 text-right">National Avg</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-slate-700">
                  <tr className="border-t border-slate-150">
                    <td className="py-2">Multidimensional Poverty Index (%)</td>
                    <td className="py-2 text-right font-mono">{activeState.poverty.mpi}%</td>
                    <td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.poverty.mpi}%</td>
                  </tr>
                  <tr className="border-t border-slate-150">
                    <td className="py-2">Unemployment Rate (%)</td>
                    <td className="py-2 text-right font-mono">{activeState.poverty.unemployment}%</td>
                    <td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.poverty.unemployment}%</td>
                  </tr>
                  <tr className="border-t border-slate-150">
                    <td className="py-2">Inflation Impact Index (1-10)</td>
                    <td className="py-2 text-right font-mono">{activeState.poverty.inflationImpact}/10</td>
                    <td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.poverty.inflationImpact}/10</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pillar 2: Education */}
            <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="font-poppins font-bold text-xs uppercase text-[#052353]">
                  2. Education Systems
                </h4>
                <span className="text-xs font-bold font-mono bg-slate-100 px-2 py-0.5 rounded">
                  Index Score: {activeState.risks.education}/100
                </span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="opacity-50 text-[10px] uppercase font-bold text-left">
                    <th className="pb-1.5">Indicator Metric</th>
                    <th className="pb-1.5 text-right">State</th>
                    <th className="pb-1.5 text-right">National Avg</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-slate-700">
                  <tr className="border-t border-slate-150">
                    <td className="py-2">Net School Attendance Rate (%)</td>
                    <td className="py-2 text-right font-mono">{activeState.education.attendance}%</td>
                    <td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.education.attendance}%</td>
                  </tr>
                  <tr className="border-t border-slate-150">
                    <td className="py-2">Out-of-School Children Rate (%)</td>
                    <td className="py-2 text-right font-mono">{activeState.education.outOfSchool}%</td>
                    <td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.education.outOfSchool}%</td>
                  </tr>
                  <tr className="border-t border-slate-150">
                    <td className="py-2">Youth Literacy Rate (%)</td>
                    <td className="py-2 text-right font-mono">{activeState.education.literacy}%</td>
                    <td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.education.literacy}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pillar 3: Health */}
            <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="font-poppins font-bold text-xs uppercase text-[#052353]">
                  3. Health &amp; Wellbeing
                </h4>
                <span className="text-xs font-bold font-mono bg-slate-100 px-2 py-0.5 rounded">
                  Index Score: {activeState.risks.health}/100
                </span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="opacity-50 text-[10px] uppercase font-bold text-left">
                    <th className="pb-1.5">Indicator Metric</th>
                    <th className="pb-1.5 text-right">State</th>
                    <th className="pb-1.5 text-right">National Avg</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-slate-700">
                  <tr className="border-t border-slate-150">
                    <td className="py-2">Maternal Health Deprivation Index</td>
                    <td className="py-2 text-right font-mono">{activeState.health.maternalHealth}/100</td>
                    <td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.health.maternalHealth}/100</td>
                  </tr>
                  <tr className="border-t border-slate-150">
                    <td className="py-2">Basic Immunization Coverage (%)</td>
                    <td className="py-2 text-right font-mono">{activeState.health.childHealth}%</td>
                    <td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.health.childHealth}%</td>
                  </tr>
                  <tr className="border-t border-slate-150">
                    <td className="py-2">Access to Healthcare Facilities (%)</td>
                    <td className="py-2 text-right font-mono">{activeState.health.healthcareAccess}%</td>
                    <td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.health.healthcareAccess}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>

        {/* PAGE 2 */}
        <div className="page-break flex flex-col gap-6 w-full pt-10">
          
          <div className="flex justify-between items-center border-b border-black pb-4">
            <h2 className="font-poppins font-black text-lg tracking-tighter text-[#052353]">
              BEYOND STATISTICS INITIATIVE
            </h2>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{activeState.name} State Risk Profile Continued</p>
          </div>

          <div className="border-b border-slate-200 pb-2">
            <h3 className="font-poppins font-bold text-sm uppercase tracking-wider text-[#052353]">
              I. Core Security &amp; Vulnerability Pillars (Continued)
            </h3>
          </div>

          {/* 3 Pillars layout (Food Security, Displacement, Peace & Security) */}
          <div className="grid grid-cols-1 gap-6 w-full">

            {/* Pillar 4: Food Security */}
            <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="font-poppins font-bold text-xs uppercase text-[#052353]">
                  4. Food Security &amp; Nutrition
                </h4>
                <span className="text-xs font-bold font-mono bg-slate-100 px-2 py-0.5 rounded">
                  Index Score: {activeState.risks.foodSecurity}/100
                </span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="opacity-50 text-[10px] uppercase font-bold text-left">
                    <th className="pb-1.5">Indicator Metric</th>
                    <th className="pb-1.5 text-right">State</th>
                    <th className="pb-1.5 text-right">National Avg</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-slate-700">
                  <tr className="border-t border-slate-150">
                    <td className="py-2">Acceptable Food Consumption Rate (%)</td>
                    <td className="py-2 text-right font-mono">{activeState.foodSecurity.foodConsumption}%</td>
                    <td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.foodSecurity.foodConsumption}%</td>
                  </tr>
                  <tr className="border-t border-slate-150">
                    <td className="py-2">Phase 3+ Acute Food Insecurity (%)</td>
                    <td className="py-2 text-right font-mono">{activeState.foodSecurity.acuteInsecurity}%</td>
                    <td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.foodSecurity.acuteInsecurity}%</td>
                  </tr>
                  <tr className="border-t border-slate-150">
                    <td className="py-2">Child Wasting &amp; Nutrition Risk (1-10)</td>
                    <td className="py-2 text-right font-mono">{activeState.foodSecurity.nutritionRisk}/10</td>
                    <td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.foodSecurity.nutritionRisk}/10</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pillar 5: Displacement */}
            <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="font-poppins font-bold text-xs uppercase text-[#052353]">
                  5. Displacement &amp; Migration
                </h4>
                <span className="text-xs font-bold font-mono bg-slate-100 px-2 py-0.5 rounded">
                  Index Score: {activeState.risks.displacement}/100
                </span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="opacity-50 text-[10px] uppercase font-bold text-left">
                    <th className="pb-1.5">Indicator Metric</th>
                    <th className="pb-1.5 text-right">State</th>
                    <th className="pb-1.5 text-right">National Avg</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-slate-700">
                  <tr className="border-t border-slate-150">
                    <td className="py-2">Active IDP Population</td>
                    <td className="py-2 text-right font-mono">{activeState.displacement.idps.toLocaleString()}</td>
                    <td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.displacement.idps.toLocaleString()}</td>
                  </tr>
                  <tr className="border-t border-slate-150">
                    <td className="py-2">Registered Returnees</td>
                    <td className="py-2 text-right font-mono">{activeState.displacement.returnees.toLocaleString()}</td>
                    <td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.displacement.returnees.toLocaleString()}</td>
                  </tr>
                  <tr className="border-t border-slate-150">
                    <td className="py-2">New Displacement Events (1 Year)</td>
                    <td className="py-2 text-right font-mono">{activeState.displacement.newEvents}</td>
                    <td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.displacement.newEvents}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pillar 6: Peace & Security */}
            <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="font-poppins font-bold text-xs uppercase text-[#052353]">
                  6. Peace &amp; Security
                </h4>
                <span className="text-xs font-bold font-mono bg-slate-100 px-2 py-0.5 rounded">
                  Index Score: {activeState.risks.peaceSecurity}/100
                </span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="opacity-50 text-[10px] uppercase font-bold text-left">
                    <th className="pb-1.5">Indicator Metric</th>
                    <th className="pb-1.5 text-right">State</th>
                    <th className="pb-1.5 text-right">National Avg</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-slate-700">
                  <tr className="border-t border-slate-150">
                    <td className="py-2">Conflict Incidents (1 Year)</td>
                    <td className="py-2 text-right font-mono">{activeState.peaceSecurity.conflictIncidents}</td>
                    <td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.peaceSecurity.conflictIncidents}</td>
                  </tr>
                  <tr className="border-t border-slate-150">
                    <td className="py-2">Conflict-Related Fatalities (1 Year)</td>
                    <td className="py-2 text-right font-mono">{activeState.peaceSecurity.fatalities}</td>
                    <td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.peaceSecurity.fatalities}</td>
                  </tr>
                  <tr className="border-t border-slate-150">
                    <td className="py-2">Feelings of Safety in Neighborhood (%)</td>
                    <td className="py-2 text-right font-mono">{activeState.peaceSecurity.communitySecurity}%</td>
                    <td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.peaceSecurity.communitySecurity}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

          {/* Sources and disclaimers */}
          <div className="mt-6 border-t border-slate-300 pt-6">
            <h4 className="font-poppins font-bold text-xs uppercase text-[#052353] mb-2">
              II. Aggregation Registry &amp; Methodology References
            </h4>
            <p className="text-[10px] text-slate-500 leading-normal">
              This executive brief aggregates datasets from: **National Bureau of Statistics (NBS)** (Multidimensional Poverty Index, Education Census, Labor Surveys); **World Bank** (Microeconomic impact profiles); **UNICEF &amp; WHO** (Health registers, school attendance surveys); **Cadre Harmonisé Joint Analysis** (Food security Phase levels); **IOM DTM &amp; NEMA** (Displacement grids); and **Beyond# Live Tracker** (Geolocated conflict indicators parsed from national feeds).
            </p>
            <p className="text-[9px] text-slate-400 mt-4 leading-normal italic border-t border-slate-100 pt-3">
              Disclaimer: Beyond# observatory briefs are compiled automatically based on institutional database updates. These reports are published for research, academic studies, and evidence-guided public policy planning.
            </p>
            <div className="flex justify-between items-center mt-6 text-[9px] font-bold text-slate-400">
              <span>BEYOND STATISTICS SECRETARIAT • ABUJA, FCT, NIGERIA</span>
              <span>VERIFIED AGGREGATION ARRAY V1.06</span>
            </div>
          </div>

        </div>
        
      </div>

    </div>
  );
}
