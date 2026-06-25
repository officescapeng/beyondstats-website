import React, { useState, useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { 
  Filter, 
  MapPin, 
  Plus, 
  X, 
  Calendar, 
  Users, 
  Layers, 
  BookOpen, 
  FileText, 
  MessageSquare, 
  Award,
  ChevronRight,
  Database,
  RefreshCw,
  Info,
  CheckCircle2,
  Trash2,
  Sun,
  Moon
} from 'lucide-react';
import { getProjects, addProject, deleteProject, resetProjects } from '../services/firebaseMock';

// Center of Nigeria
const NIGERIA_CENTER = [9.0820, 8.6753];
const DEFAULT_ZOOM = 6;

// Custom Marker Colors based on Program Category
const getCategoryColor = (category) => {
  switch (category) {
    case 'Human Security Monitoring':
      return '#ef4444'; // Red
    case 'Research & Evidence Generation':
      return '#3b82f6'; // Blue
    case 'Policy Engagement':
      return '#f59e0b'; // Amber/Yellow
    case 'Community Solutions':
      return '#10b981'; // Green
    case 'Capacity Development':
      return '#8b5cf6'; // Purple
    default:
      return '#39b54a'; // Brand secondary green
  }
};

// Create custom leaflet HTML icon
const createCustomIcon = (category) => {
  const color = getCategoryColor(category);
  return L.divIcon({
    html: `
      <div class="custom-marker-pin" style="color: ${color};">
        <div class="pin-pulse"></div>
        <div class="pin-circle" style="background-color: ${color};"></div>
      </div>
    `,
    className: 'custom-marker-wrapper',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

// Component to handle map clicks for coordinate selection in admin form
function MapClickHandler({ onMapClick, isPicking }) {
  useMapEvents({
    click(e) {
      if (isPicking) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

// Main Component
export default function ImpactMapPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to Light Mode
  
  // Filtering States
  const [filterState, setFilterState] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [timelineView, setTimelineView] = useState('inception'); // 'this-year' | '5-years' | 'inception'
  const [geoLayer, setGeoLayer] = useState('community'); // 'state' | 'lga' | 'community'

  // Admin Portal States
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isPickingCoords, setIsPickingCoords] = useState(false);
  const [adminStatus, setAdminStatus] = useState(null); // { type: 'success'|'error', msg: '' }
  
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStory, setFormStory] = useState('');
  const [formLessons, setFormLessons] = useState('');
  const [formCategory, setFormCategory] = useState('Human Security Monitoring');
  const [formType, setFormType] = useState('Survey');
  const [formState, setFormState] = useState('');
  const [formLga, setFormLga] = useState('');
  const [formCommunity, setFormCommunity] = useState('');
  const [formLat, setFormLat] = useState('');
  const [formLng, setFormLng] = useState('');
  const [formYear, setFormYear] = useState(new Date().getFullYear());
  const [formPartners, setFormPartners] = useState('');
  const [formBeneficiaries, setFormBeneficiaries] = useState('');
  const [formFindings, setFormFindings] = useState('');
  const [formPublications, setFormPublications] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('/hero_community.png');

  // Load Projects from Mock DB
  const loadProjects = () => {
    const data = getProjects();
    setProjects(data);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Unique lists for filtering dropdowns
  const statesList = useMemo(() => {
    const list = projects.map(p => p.state).filter(Boolean);
    return [...new Set(list)].sort();
  }, [projects]);

  const yearsList = useMemo(() => {
    const list = projects.map(p => p.year).filter(Boolean);
    return [...new Set(list)].sort((a, b) => b - a);
  }, [projects]);

  const categoriesList = [
    'Human Security Monitoring',
    'Research & Evidence Generation',
    'Policy Engagement',
    'Community Solutions',
    'Capacity Development'
  ];

  const typesList = ['Survey', 'Study', 'Dialogue', 'Training', 'Intervention', 'Assessment'];

  // Handle map click coordinate pick
  const handleMapCoordinatePick = (lat, lng) => {
    setFormLat(lat.toFixed(6));
    setFormLng(lng.toFixed(6));
    setIsPickingCoords(false);
    setAdminStatus({
      type: 'success',
      msg: `Coordinates captured: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
    });
    setTimeout(() => setAdminStatus(null), 3000);
  };

  // Reset database back to default seed projects
  const handleResetDB = () => {
    if (window.confirm("Are you sure you want to reset the database? This will clear any added projects and restore the default 10 projects.")) {
      const resetData = resetProjects();
      setProjects(resetData);
      setSelectedProject(null);
      setAdminStatus({ type: 'success', msg: 'Database reset to seed defaults!' });
      setTimeout(() => setAdminStatus(null), 3000);
    }
  };

  // Delete project handler
  const handleDeleteProject = (id) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      deleteProject(id);
      loadProjects();
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }
      setAdminStatus({ type: 'success', msg: 'Project deleted successfully.' });
      setTimeout(() => setAdminStatus(null), 3000);
    }
  };

  // Handle Admin Project Submit
  const handleAddProjectSubmit = (e) => {
    e.preventDefault();
    if (!formTitle || !formState || !formLat || !formLng) {
      setAdminStatus({
        type: 'error',
        msg: 'Please provide Title, State, Latitude, and Longitude.'
      });
      return;
    }

    const payload = {
      title: formTitle,
      description: formDesc,
      story: formStory,
      lessons: formLessons,
      category: formCategory,
      type: formType,
      state: formState,
      lga: formLga,
      community: formCommunity,
      lat: parseFloat(formLat),
      lng: parseFloat(formLng),
      year: parseInt(formYear, 10),
      partners: formPartners,
      beneficiaries: parseInt(formBeneficiaries, 10) || 0,
      findings: formFindings,
      publications: formPublications,
      imageUrl: formImageUrl
    };

    try {
      addProject(payload);
      loadProjects();
      setAdminStatus({
        type: 'success',
        msg: 'New project successfully registered!'
      });
      
      // Reset Form fields
      setFormTitle('');
      setFormDesc('');
      setFormStory('');
      setFormLessons('');
      setFormState('');
      setFormLga('');
      setFormCommunity('');
      setFormLat('');
      setFormLng('');
      setFormPartners('');
      setFormBeneficiaries('');
      setFormFindings('');
      setFormPublications('');
      
      setTimeout(() => setAdminStatus(null), 4000);
    } catch {
      setAdminStatus({
        type: 'error',
        msg: 'Failed to add project. Check coordinates.'
      });
    }
  };

  // Filtered Projects Computation
  const filteredProjects = useMemo(() => {
    return projects.filter(proj => {
      // 1. Dropdown Filters
      if (filterState && proj.state !== filterState) return false;
      if (filterYear && proj.year !== parseInt(filterYear, 10)) return false;
      if (filterCategory && proj.category !== filterCategory) return false;
      if (filterType && proj.type !== filterType) return false;

      // 2. Timeline filter
      const currentYear = new Date().getFullYear();
      if (timelineView === 'this-year' && proj.year !== currentYear) return false;
      if (timelineView === '5-years' && proj.year < (currentYear - 5)) return false;

      // 3. Geographic granularity filter logic (Simulating layers)
      if (geoLayer === 'state' && !proj.state) return false;
      if (geoLayer === 'lga' && !proj.lga) return false;
      if (geoLayer === 'community' && !proj.community) return false;

      return true;
    });
  }, [projects, filterState, filterYear, filterCategory, filterType, timelineView, geoLayer]);

  // Aggregate Impact Metrics based on filtered records
  const metrics = useMemo(() => {
    let totalBeneficiaries = 0;
    let totalCommunities = new Set();
    let researchCount = 0;
    let publicationsCount = 0;
    let dialoguesCount = 0;
    let trainingParticipants = 0;

    filteredProjects.forEach(p => {
      totalBeneficiaries += p.beneficiaries || 0;
      if (p.community) totalCommunities.add(`${p.state}-${p.lga}-${p.community}`);
      
      if (p.category === 'Research & Evidence Generation' || p.type === 'Study') {
        researchCount++;
      }
      if (p.publications) {
        publicationsCount += p.publications.length;
      }
      if (p.type === 'Dialogue' || p.category === 'Policy Engagement') {
        dialoguesCount++;
      }
      if (p.type === 'Training' || p.category === 'Capacity Development') {
        trainingParticipants += p.beneficiaries || 0;
      }
    });

    return {
      beneficiaries: totalBeneficiaries,
      communitiesCount: totalCommunities.size || filteredProjects.length,
      researchCount,
      publicationsCount,
      dialoguesCount,
      trainingParticipants
    };
  }, [filteredProjects]);

  return (
    <div className={`min-h-screen flex flex-col pt-24 pb-12 animate-fade-in relative z-10 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-b from-[#062b66] via-[#083478] to-[#062b66] text-white' 
        : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* Soft White Ambient Glow Blobs in Background (Dark Mode only) */}
      {isDarkMode && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-white/[0.05] blur-[140px]" />
          <div className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] rounded-full bg-white/[0.04] blur-[120px]" />
        </div>
      )}
      
      {/* HEADER BANNER */}
      <div className={`py-10 px-6 text-center border-b no-print transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-[#052353] border-white/5 text-white' 
          : 'bg-white border-slate-200 text-[#062b66]'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-left">
            <span className="font-inter text-xs font-bold tracking-[0.2em] text-[#39B54A] uppercase mb-1 block">
              Beyond# Interactive Mapping
            </span>
            <h1 className="font-poppins font-bold text-3xl sm:text-4xl tracking-tight uppercase leading-tight select-none">
              Humanitarian &amp; Development Impact Map
            </h1>
            <p className={`font-inter text-sm mt-1 max-w-xl leading-normal ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
              Visualizing evidence generation, policy advocacy, community interventions, and capacity building milestones across Nigeria.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-full border cursor-pointer transition-colors ${
                isDarkMode 
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 text-amber-400' 
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-violet-600'
              }`}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAdminPanel(!showAdminPanel);
                setSelectedProject(null);
              }}
              className={`px-5 py-2.5 rounded-full font-inter text-xs font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all duration-300 border ${
                showAdminPanel 
                  ? 'bg-[#39B54A] border-[#39B54A] text-white' 
                  : isDarkMode
                    ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Database className="w-4 h-4" />
              {showAdminPanel ? 'View Impact Map' : 'Admin Portal'}
            </button>
            <button
              type="button"
              onClick={handleResetDB}
              className={`p-2.5 rounded-full border cursor-pointer transition-colors ${
                isDarkMode 
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' 
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
              title="Reset Database to Defaults"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* DYNAMIC IMPACT METRICS TILES */}
      <div className="max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 no-print">
        {[
          { label: 'Communities Reached', val: metrics.communitiesCount, icon: MapPin, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Citizens Engaged', val: metrics.beneficiaries.toLocaleString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Research Conducted', val: metrics.researchCount, icon: BookOpen, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { label: 'Policy Briefs Published', val: metrics.publicationsCount, icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Stakeholder Dialogues', val: metrics.dialoguesCount, icon: MessageSquare, color: 'text-pink-400', bg: 'bg-pink-500/10' },
          { label: 'Participants Trained', val: metrics.trainingParticipants.toLocaleString(), icon: Award, color: 'text-purple-400', bg: 'bg-purple-500/10' }
        ].map((tile, i) => (
          <div 
            key={i} 
            className={`p-5 flex flex-col justify-between items-start transition-all hover:scale-[1.02] rounded-2xl border ${
              isDarkMode 
                ? 'bg-white/[0.03] border-white/5 text-white hover:border-white/10' 
                : 'bg-white border-slate-100 shadow-sm text-slate-800 hover:shadow-md'
            }`}
          >
            <div className="flex justify-between items-center w-full mb-3">
              <span className={`font-inter text-[10px] font-bold uppercase tracking-wider leading-snug ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
                {tile.label}
              </span>
              <div className={`p-2 rounded-xl ${tile.bg} ${tile.color}`}>
                <tile.icon className="w-4 h-4" />
              </div>
            </div>
            <span className={`font-poppins text-2xl font-bold tracking-tight mt-1 ${isDarkMode ? 'text-white' : 'text-[#062b66]'}`}>
              {tile.val}
            </span>
          </div>
        ))}
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl w-full mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
        
        {/* LEFT COLUMN: FILTERS & TIMELINES (LG: 4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6 no-print">
          
          {/* FILTERS PANEL */}
          <div className={`p-6 flex flex-col gap-5 rounded-2xl border ${
            isDarkMode 
              ? 'bg-white/[0.03] border-white/5 text-white' 
              : 'bg-white border-slate-100 shadow-sm text-slate-800'
          }`}>
            <h3 className={`font-poppins font-bold text-base uppercase tracking-wider flex items-center gap-2 border-b pb-3 ${
              isDarkMode ? 'border-white/5' : 'border-slate-100'
            }`}>
              <Filter className="w-4 h-4 text-[#39B54A]" />
              Filter Interventions
            </h3>

            {/* Program Area Filter */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className={`font-inter text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>Program Area</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className={`w-full rounded-xl px-4 py-3 font-inter text-sm outline-none focus:border-[#39B54A] transition-colors border ${
                  isDarkMode 
                    ? 'bg-[#051735]/90 border-white/10 text-white' 
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="">All Program Areas</option>
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Project Type Filter */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className={`font-inter text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>Project Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`w-full rounded-xl px-4 py-3 font-inter text-sm outline-none focus:border-[#39B54A] transition-colors border ${
                  isDarkMode 
                    ? 'bg-[#051735]/90 border-white/10 text-white' 
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="">All Project Types</option>
                {typesList.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* State Filter */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className={`font-inter text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>State</label>
                <select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  className={`w-full rounded-xl px-3 py-3 font-inter text-sm outline-none focus:border-[#39B54A] transition-colors border ${
                    isDarkMode 
                      ? 'bg-[#051735]/90 border-white/10 text-white' 
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="">All States</option>
                  {statesList.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className={`font-inter text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>Year</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className={`w-full rounded-xl px-3 py-3 font-inter text-sm outline-none focus:border-[#39B54A] transition-colors border ${
                    isDarkMode 
                      ? 'bg-[#051735]/90 border-white/10 text-white' 
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="">All Years</option>
                  {yearsList.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* TIMELINE CONTROL */}
          <div className={`p-6 flex flex-col gap-4 text-left rounded-2xl border ${
            isDarkMode 
              ? 'bg-white/[0.03] border-white/5 text-white' 
              : 'bg-white border-slate-100 shadow-sm text-slate-800'
          }`}>
            <h4 className={`font-poppins font-bold text-xs uppercase tracking-wider flex items-center gap-2 border-b pb-2 ${
              isDarkMode ? 'text-white/60 border-white/5' : 'text-slate-500 border-slate-100'
            }`}>
              <Calendar className="w-4 h-4 text-[#39B54A]" />
              Timeline Filter
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'this-year', label: 'This Year' },
                { id: '5-years', label: 'Last 5 Yrs' },
                { id: 'inception', label: 'Inception' }
              ].map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setTimelineView(opt.id)}
                  className={`py-2 px-1 rounded-xl text-center font-inter text-xs font-semibold cursor-pointer border transition-all ${
                    timelineView === opt.id
                      ? `bg-[#39B54A]/20 border-[#39B54A] shadow-lg ${isDarkMode ? 'text-white' : 'text-[#207c2d]'}`
                      : isDarkMode 
                        ? 'bg-white/5 border-white/5 hover:bg-white/10 text-white/70'
                        : 'bg-slate-50 border-slate-200/60 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* GEOGRAPHIC LAYERS */}
          <div className={`p-6 flex flex-col gap-4 text-left rounded-2xl border ${
            isDarkMode 
              ? 'bg-white/[0.03] border-white/5 text-white' 
              : 'bg-white border-slate-100 shadow-sm text-slate-800'
          }`}>
            <h4 className={`font-poppins font-bold text-xs uppercase tracking-wider flex items-center gap-2 border-b pb-2 ${
              isDarkMode ? 'text-white/60 border-white/5' : 'text-slate-500 border-slate-100'
            }`}>
              <Layers className="w-4 h-4 text-[#39B54A]" />
              Geographic Resolution
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'state', label: 'State Level' },
                { id: 'lga', label: 'LGA Level' },
                { id: 'community', label: 'Community' }
              ].map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setGeoLayer(opt.id)}
                  className={`py-2 px-1 rounded-xl text-center font-inter text-xs font-semibold cursor-pointer border transition-all ${
                    geoLayer === opt.id
                      ? `bg-[#39B54A]/20 border-[#39B54A] shadow-lg ${isDarkMode ? 'text-white' : 'text-[#207c2d]'}`
                      : isDarkMode 
                        ? 'bg-white/5 border-white/5 hover:bg-white/10 text-white/70'
                        : 'bg-slate-50 border-slate-200/60 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className={`font-inter text-[10px] leading-relaxed mt-1 ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}>
              Select geographic scope to drill down from regional administrative studies down to local site-level community actions.
            </p>
          </div>

          {/* MAP LEGEND */}
          <div className={`p-6 flex flex-col gap-3 text-left rounded-2xl border ${
            isDarkMode 
              ? 'bg-white/[0.03] border-white/5 text-white' 
              : 'bg-white border-slate-100 shadow-sm text-slate-800'
          }`}>
            <h4 className={`font-poppins font-bold text-xs uppercase tracking-wider ${
              isDarkMode ? 'text-white/60' : 'text-slate-500'
            }`}>
              Map Legend (Program Colors)
            </h4>
            <div className="flex flex-col gap-2.5 mt-2">
              {categoriesList.map(cat => (
                <div key={cat} className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-md" style={{ backgroundColor: getCategoryColor(cat) }} />
                  <span className={`font-inter text-xs ${isDarkMode ? 'text-white/80' : 'text-slate-700'}`}>{cat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MAP CANVAS OR ADMIN PORTAL (LG: 8 cols) */}
        <div className="lg:col-span-8 h-full min-h-[580px] flex flex-col gap-6 relative">
          
          {/* MAP CANVAS VIEW */}
          {!showAdminPanel ? (
            <div className={`w-full flex-1 min-h-[580px] p-1.5 rounded-[2rem] overflow-hidden transition-all duration-300 relative flex flex-col ${
              isDarkMode 
                ? 'bg-[#051735]/80 border border-white/10 shadow-2xl dark-theme-map' 
                : 'bg-white border border-slate-200/60 shadow-xl light-theme-map'
            }`}>
              
              {/* Floating map status HUD */}
              <div className={`absolute top-4 left-4 z-[999] backdrop-blur-md border px-4 py-2.5 rounded-2xl text-left pointer-events-auto shadow-xl transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-[#051630]/95 border-white/10 text-white' 
                  : 'bg-white/95 border-slate-200 text-slate-800'
              }`}>
                <span className={`font-inter text-[10px] font-bold uppercase tracking-widest block leading-tight ${
                  isDarkMode ? 'text-white/50' : 'text-slate-400'
                }`}>ACTIVE FILTER VIEW</span>
                <span className={`font-poppins font-bold text-xs uppercase block mt-0.5 ${
                  isDarkMode ? 'text-white' : 'text-[#062b66]'
                }`}>
                  Showing {filteredProjects.length} of {projects.length} Registered Projects
                </span>
              </div>

              {/* MAP COMPONENT */}
              <div className="w-full flex-1 h-[580px] relative z-0">
                <MapContainer 
                  center={NIGERIA_CENTER} 
                  zoom={DEFAULT_ZOOM} 
                  style={{ width: '100%', height: '100%' }}
                  zoomControl={true}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    url={isDarkMode 
                      ? "https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}{r}.png"
                      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
                    }
                    className={isDarkMode ? 'dark-map-tiles' : ''}
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  />
                  
                  {/* Labels on top for a professional map layout */}
                  <TileLayer
                    url={isDarkMode
                      ? "https://{s}.basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}{r}.png"
                      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
                    }
                    className={isDarkMode ? 'dark-map-tiles' : ''}
                  />
                  
                  {/* Capture coordinates directly on the main map */}
                  <MapClickHandler onMapClick={handleMapCoordinatePick} isPicking={isPickingCoords} />

                  {/* Marker Pins */}
                  {filteredProjects.map((proj) => (
                    <Marker 
                      key={proj.id}
                      position={[proj.lat, proj.lng]}
                      icon={createCustomIcon(proj.category)}
                      eventHandlers={{
                        click: () => {
                          setSelectedProject(proj);
                        }
                      }}
                    />
                  ))}
                </MapContainer>
              </div>
            </div>
          ) : (
            
            /* ADMIN PORTAL PANEL */
            <div className={`p-8 flex flex-col gap-6 text-left shadow-2xl rounded-2xl transition-all duration-300 border ${
              isDarkMode 
                ? 'bg-[#051735]/85 border-white/10 text-white shadow-black/40' 
                : 'bg-white border-slate-200/60 text-slate-800 shadow-slate-200/50'
            }`}>
              <div className={`flex justify-between items-center border-b pb-4 ${
                isDarkMode ? 'border-white/5' : 'border-slate-100'
              }`}>
                <div>
                  <h3 className={`font-poppins font-bold text-lg uppercase tracking-tight flex items-center gap-2 ${
                    isDarkMode ? 'text-white' : 'text-[#062b66]'
                  }`}>
                    <Database className="w-5 h-5 text-[#39B54A]" />
                    Beyond# Central Operations Registry
                  </h3>
                  <p className={`font-inter text-xs mt-1 ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
                    Register completed projects, publish evidence briefs, and log localized impact metrics directly into the active database.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowAdminPanel(false)}
                  className={`p-1 rounded-full border-none bg-transparent cursor-pointer transition-colors ${
                    isDarkMode 
                      ? 'hover:bg-white/5 text-white/60 hover:text-white' 
                      : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Status Alert */}
              {adminStatus && (
                <div className={`p-4 rounded-xl flex items-center gap-3 border transition-colors ${
                  adminStatus.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  <Info className="w-5 h-5 flex-shrink-0" />
                  <span className="font-inter text-xs font-semibold leading-relaxed">{adminStatus.msg}</span>
                </div>
              )}

              <form onSubmit={handleAddProjectSubmit} className="flex flex-col gap-6">
                
                {/* Basic Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={`font-inter text-xs font-semibold uppercase ${isDarkMode ? 'text-white/70' : 'text-slate-500'}`}>Project Title *</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. South-South Flood Mitigation Dialogue"
                      className={`border focus:border-[#39B54A] rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-[#051735]/90 border-white/10 text-white placeholder-white/30' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                      }`}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className={`font-inter text-xs font-semibold uppercase ${isDarkMode ? 'text-white/70' : 'text-slate-500'}`}>Category</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className={`border focus:border-[#39B54A] rounded-xl px-3 py-3 text-sm outline-none transition-colors ${
                          isDarkMode 
                            ? 'bg-[#051735]/90 border-white/10 text-white' 
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        {categoriesList.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className={`font-inter text-xs font-semibold uppercase ${isDarkMode ? 'text-white/70' : 'text-slate-500'}`}>Type</label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value)}
                        className={`border focus:border-[#39B54A] rounded-xl px-3 py-3 text-sm outline-none transition-colors ${
                          isDarkMode 
                            ? 'bg-[#051735]/90 border-white/10 text-white' 
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        {typesList.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Geography Details & Coordinates Picker */}
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-b py-5 rounded-2xl px-4 transition-colors ${
                  isDarkMode 
                    ? 'border-white/5 bg-white/[0.01]' 
                    : 'border-slate-100 bg-slate-50/50'
                }`}>
                  <div className="flex flex-col gap-1.5">
                    <label className={`font-inter text-xs font-semibold uppercase ${isDarkMode ? 'text-white/70' : 'text-slate-500'}`}>State *</label>
                    <input
                      type="text"
                      value={formState}
                      onChange={(e) => setFormState(e.target.value)}
                      placeholder="e.g. Rivers"
                      className={`border focus:border-[#39B54A] rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-[#051735]/90 border-white/10 text-white placeholder-white/30' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                      }`}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={`font-inter text-xs font-semibold uppercase ${isDarkMode ? 'text-white/70' : 'text-slate-500'}`}>LGA</label>
                    <input
                      type="text"
                      value={formLga}
                      onChange={(e) => setFormLga(e.target.value)}
                      placeholder="e.g. Obio-Akpor"
                      className={`border focus:border-[#39B54A] rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-[#051735]/90 border-white/10 text-white placeholder-white/30' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={`font-inter text-xs font-semibold uppercase ${isDarkMode ? 'text-white/70' : 'text-slate-500'}`}>Community</label>
                    <input
                      type="text"
                      value={formCommunity}
                      onChange={(e) => setFormCommunity(e.target.value)}
                      placeholder="e.g. Rumuosi Town"
                      className={`border focus:border-[#39B54A] rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-[#051735]/90 border-white/10 text-white placeholder-white/30' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 relative">
                    <label className={`font-inter text-xs font-semibold uppercase ${isDarkMode ? 'text-white/70' : 'text-slate-500'}`}>Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      value={formLat}
                      onChange={(e) => setFormLat(e.target.value)}
                      placeholder="e.g. 4.842"
                      className={`border focus:border-[#39B54A] rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-[#051735]/90 border-white/10 text-white placeholder-white/30' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                      }`}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={`font-inter text-xs font-semibold uppercase ${isDarkMode ? 'text-white/70' : 'text-slate-500'}`}>Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      value={formLng}
                      onChange={(e) => setFormLng(e.target.value)}
                      placeholder="e.g. 6.993"
                      className={`border focus:border-[#39B54A] rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-[#051735]/90 border-white/10 text-white placeholder-white/30' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                      }`}
                      required
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAdminPanel(false);
                        setIsPickingCoords(true);
                        setAdminStatus({
                          type: 'success',
                          msg: 'Click anywhere on the Nigeria map to capture coordinates!'
                        });
                      }}
                      className={`w-full py-3.5 rounded-xl font-inter text-xs font-semibold cursor-pointer border flex justify-center items-center gap-2 transition-all ${
                        isPickingCoords
                          ? 'bg-[#39B54A] border-[#39B54A] text-white shadow-lg animate-pulse'
                          : isDarkMode 
                            ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80'
                            : 'bg-slate-100 border-slate-200 hover:bg-slate-200/70 text-slate-700'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      {isPickingCoords ? 'Capture Click on Map...' : 'Pick from Map'}
                    </button>
                  </div>
                </div>

                {/* Metadata details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={`font-inter text-xs font-semibold uppercase ${isDarkMode ? 'text-white/70' : 'text-slate-500'}`}>Operational Year</label>
                    <input
                      type="number"
                      value={formYear}
                      onChange={(e) => setFormYear(e.target.value)}
                      className={`border focus:border-[#39B54A] rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-[#051735]/90 border-white/10 text-white placeholder-white/30' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={`font-inter text-xs font-semibold uppercase ${isDarkMode ? 'text-white/70' : 'text-slate-500'}`}>Partners (Comma-separated)</label>
                    <input
                      type="text"
                      value={formPartners}
                      onChange={(e) => setFormPartners(e.target.value)}
                      placeholder="e.g. UNICEF, World Bank"
                      className={`border focus:border-[#39B54A] rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-[#051735]/90 border-white/10 text-white placeholder-white/30' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={`font-inter text-xs font-semibold uppercase ${isDarkMode ? 'text-white/70' : 'text-slate-500'}`}>Beneficiaries Reached</label>
                    <input
                      type="number"
                      value={formBeneficiaries}
                      onChange={(e) => setFormBeneficiaries(e.target.value)}
                      placeholder="e.g. 1500"
                      className={`border focus:border-[#39B54A] rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-[#051735]/90 border-white/10 text-white placeholder-white/30' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Descriptions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={`font-inter text-xs font-semibold uppercase ${isDarkMode ? 'text-white/70' : 'text-slate-500'}`}>Brief Summary *</label>
                    <textarea
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      placeholder="Short 2-sentence description of the project..."
                      rows={3}
                      className={`border focus:border-[#39B54A] rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none ${
                        isDarkMode 
                          ? 'bg-[#051735]/90 border-white/10 text-white placeholder-white/30' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                      }`}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={`font-inter text-xs font-semibold uppercase ${isDarkMode ? 'text-white/70' : 'text-slate-500'}`}>Project Story (Storytelling feature)</label>
                    <textarea
                      value={formStory}
                      onChange={(e) => setFormStory(e.target.value)}
                      placeholder="Enter a descriptive story narrative of the field work..."
                      rows={3}
                      className={`border focus:border-[#39B54A] rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none ${
                        isDarkMode 
                          ? 'bg-[#051735]/90 border-white/10 text-white placeholder-white/30' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Additional list details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={`font-inter text-xs font-semibold uppercase ${isDarkMode ? 'text-white/70' : 'text-slate-500'}`}>Key Findings (One per line)</label>
                    <textarea
                      value={formFindings}
                      onChange={(e) => setFormFindings(e.target.value)}
                      placeholder="e.g. 60% of clinics lacked clean water supply.&#10;Average transit distance is 15 kilometers."
                      rows={3}
                      className={`border focus:border-[#39B54A] rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none ${
                        isDarkMode 
                          ? 'bg-[#051735]/90 border-white/10 text-white placeholder-white/30' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={`font-inter text-xs font-semibold uppercase ${isDarkMode ? 'text-white/70' : 'text-slate-500'}`}>Lessons Learned</label>
                    <textarea
                      value={formLessons}
                      onChange={(e) => setFormLessons(e.target.value)}
                      placeholder="What hurdles did you face? e.g., Road access during rains requires early planning."
                      rows={3}
                      className={`border focus:border-[#39B54A] rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none ${
                        isDarkMode 
                          ? 'bg-[#051735]/90 border-white/10 text-white placeholder-white/30' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Publications and Images */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={`font-inter text-xs font-semibold uppercase ${isDarkMode ? 'text-white/70' : 'text-slate-500'}`}>Linked Publications (Title|URL, one per line)</label>
                    <textarea
                      value={formPublications}
                      onChange={(e) => setFormPublications(e.target.value)}
                      placeholder="e.g. Northern Nigeria Conflict Study|https://beyond.org/pdf/study-1.pdf"
                      rows={2}
                      className={`border focus:border-[#39B54A] rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none ${
                        isDarkMode 
                          ? 'bg-[#051735]/90 border-white/10 text-white placeholder-white/30' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={`font-inter text-xs font-semibold uppercase ${isDarkMode ? 'text-white/70' : 'text-slate-500'}`}>Photo URL / Path</label>
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      className={`border focus:border-[#39B54A] rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-[#051735]/90 border-white/10 text-white placeholder-white/30' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                      }`}
                    />
                  </div>
                </div>

                <div className={`flex justify-end gap-3 border-t pt-5 ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminPanel(false);
                      setIsPickingCoords(false);
                    }}
                    className={`px-6 py-3.5 border rounded-xl font-inter text-xs font-semibold cursor-pointer transition-colors ${
                      isDarkMode 
                        ? 'border-white/10 hover:bg-white/5 hover:text-white text-white/80' 
                        : 'border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3.5 bg-[#39B54A] hover:bg-[#39B54A]/90 text-white rounded-xl font-inter text-xs font-bold uppercase tracking-wider cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Intervention Pin
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* STORYTELLING DRAWER (Slides in on project select) */}
      {selectedProject && (
        <div className={`fixed inset-y-0 right-0 w-full md:w-[480px] backdrop-blur-xl border-l shadow-2xl z-[1000] flex flex-col animate-fade-in no-print text-left transition-all duration-300 ${
          isDarkMode 
            ? 'bg-[#051735]/95 border-white/10 text-white shadow-black/40' 
            : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-200/50'
        }`}>
          
          {/* Drawer Header Banner */}
          <div className="relative h-48 bg-slate-800 overflow-hidden flex-shrink-0">
            <img 
              src={selectedProject.imageUrl || '/hero_community.png'} 
              alt={selectedProject.title}
              className="w-full h-full object-cover object-center opacity-70"
            />
            <div className={`absolute inset-0 bg-gradient-to-t to-transparent transition-all duration-300 ${
              isDarkMode ? 'from-[#051735]' : 'from-white'
            }`}></div>
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedProject(null)}
              className={`absolute top-4 right-4 p-2 rounded-full border cursor-pointer transition-colors z-20 outline-none ${
                isDarkMode 
                  ? 'bg-[#051630]/80 border-white/10 hover:bg-[#051630] text-white' 
                  : 'bg-white/90 border-slate-200 hover:bg-slate-100 text-slate-700 shadow-sm'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Floating Tag */}
            <span 
              className="absolute bottom-4 left-6 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white border border-white/10"
              style={{ backgroundColor: getCategoryColor(selectedProject.category) }}
            >
              {selectedProject.category}
            </span>
          </div>

          {/* Drawer Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
            
            {/* Title & Metadata */}
            <div className="flex flex-col gap-2">
              <h2 className={`font-poppins font-bold text-xl leading-snug ${isDarkMode ? 'text-white' : 'text-[#062b66]'}`}>
                {selectedProject.title}
              </h2>
              
              <div className={`flex flex-wrap items-center gap-y-2 gap-x-4 mt-2 border-t border-b py-3 text-xs ${
                isDarkMode ? 'border-white/5 text-white/60' : 'border-slate-100 text-slate-500'
              }`}>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-secondary" />
                  <span>{selectedProject.community ? `${selectedProject.community}, ` : ''}{selectedProject.lga ? `${selectedProject.lga}, ` : ''}{selectedProject.state} State</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-secondary" />
                  <span>{selectedProject.type} ({selectedProject.year})</span>
                </div>
              </div>
            </div>

            {/* Impact Statistic HUD */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`border rounded-2xl p-4 transition-colors ${
                isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200/60'
              }`}>
                <span className={`font-inter text-[9px] font-bold uppercase tracking-widest block ${
                  isDarkMode ? 'text-white/50' : 'text-slate-400'
                }`}>BENEFICIARIES REACHED</span>
                <span className={`font-poppins font-bold text-lg mt-1 block ${
                  isDarkMode ? 'text-white' : 'text-[#062b66]'
                }`}>{(selectedProject.beneficiaries || 0).toLocaleString()}</span>
              </div>
              <div className={`border rounded-2xl p-4 transition-colors ${
                isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200/60'
              }`}>
                <span className={`font-inter text-[9px] font-bold uppercase tracking-widest block ${
                  isDarkMode ? 'text-white/50' : 'text-slate-400'
                }`}>PROJECT SCALE</span>
                <span className="font-poppins font-bold text-lg text-[#39B54A] mt-1 block uppercase">{selectedProject.type}</span>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <h4 className="font-poppins font-bold text-xs uppercase tracking-wider text-[#39B54A]">Summary</h4>
              <p className={`font-inter text-sm leading-relaxed font-light ${isDarkMode ? 'text-white/80' : 'text-slate-600'}`}>{selectedProject.description}</p>
            </div>

            {/* Project Narrative Story */}
            {selectedProject.story && (
              <div className={`flex flex-col gap-2 border p-5 rounded-2xl transition-colors ${
                isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50/50 border-slate-200/60'
              }`}>
                <h4 className="font-poppins font-bold text-xs uppercase tracking-wider text-[#39B54A] mb-1">Field Narrative</h4>
                <p className={`font-inter text-xs leading-relaxed font-light whitespace-pre-line italic ${
                  isDarkMode ? 'text-white/70' : 'text-slate-500'
                }`}>"{selectedProject.story}"</p>
              </div>
            )}

            {/* Key Findings List */}
            {selectedProject.findings && selectedProject.findings.length > 0 && (
              <div className="flex flex-col gap-3">
                <h4 className="font-poppins font-bold text-xs uppercase tracking-wider text-[#39B54A]">Key Findings</h4>
                <div className="flex flex-col gap-2.5">
                  {selectedProject.findings.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                      <span className={`font-inter text-xs leading-relaxed ${isDarkMode ? 'text-white/80' : 'text-slate-600'}`}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lessons Learned */}
            {selectedProject.lessons && (
              <div className="flex flex-col gap-2">
                <h4 className="font-poppins font-bold text-xs uppercase tracking-wider text-[#39B54A]">Lessons &amp; Hurdles</h4>
                <p className={`font-inter text-xs leading-relaxed font-light border p-4 rounded-xl ${
                  isDarkMode 
                    ? 'text-white/75 bg-amber-500/5 border-amber-500/10' 
                    : 'text-amber-800 bg-amber-500/5 border-amber-500/20'
                }`}>{selectedProject.lessons}</p>
              </div>
            )}

            {/* Stakeholders & Partners */}
            {selectedProject.partners && selectedProject.partners.length > 0 && (
              <div className="flex flex-col gap-2">
                <h4 className="font-poppins font-bold text-xs uppercase tracking-wider text-[#39B54A]">Coalition &amp; Partners</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedProject.partners.map(p => (
                    <span key={p} className={`border px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                      isDarkMode 
                        ? 'bg-white/5 border-white/5 text-white/70' 
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Linked Publications */}
            {selectedProject.publications && selectedProject.publications.length > 0 && (
              <div className={`flex flex-col gap-3 border-t pt-4 ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                <h4 className="font-poppins font-bold text-xs uppercase tracking-wider text-[#39B54A] flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  Evidence briefs &amp; Reports
                </h4>
                <div className="flex flex-col gap-2">
                  {selectedProject.publications.map((pub, idx) => (
                    <a
                      key={idx}
                      href={pub.url}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all outline-none ${
                        isDarkMode 
                          ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-white/95' 
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="truncate max-w-[320px]">{pub.title}</span>
                      <ChevronRight className="w-4 h-4 text-secondary flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Delete Project in Admin Portal mode */}
          <div className={`p-4 border-t flex justify-between items-center flex-shrink-0 transition-colors ${
            isDarkMode ? 'border-white/5 bg-[#041633]' : 'border-slate-100 bg-slate-50'
          }`}>
            <span className={`font-inter text-[10px] ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}>Registered Pin ID: {selectedProject.id}</span>
            <button
              onClick={() => handleDeleteProject(selectedProject.id)}
              className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-inter text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove Pin
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
