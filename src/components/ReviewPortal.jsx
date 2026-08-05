import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  Trash2, 
  Edit2, 
  Save, 
  ArrowLeft, 
  AlertCircle, 
  ExternalLink,
  Shield,
  Activity,
  Calendar,
  MapPin,
  FileText
} from 'lucide-react';

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

const STATES_LIST = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo", 
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", 
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", 
  "Yobe", "Zamfara"
].sort();

const INCIDENT_TYPES = [
  "kidnapping", "terrorism", "banditry", "bombing", "clash", "armed attack", "political conflict", "other"
];

export default function ReviewPortal({ setCurrentPage }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('review_auth') === 'true';
  });
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchPending = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/incidents?select=*&status=eq.pending&order=date.desc`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      });
      if (!res.ok) throw new Error('Failed to load pending queue');
      const data = await res.json();
      setIncidents(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPending();
    }
  }, [isAuthenticated]);

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    const expected = import.meta.env.VITE_ADMIN_PASSCODE || 'beyondstats2026';
    if (passcode === expected) {
      setIsAuthenticated(true);
      sessionStorage.setItem('review_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('Invalid passcode. Access denied.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white text-slate-800 font-inter flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center shadow-lg animate-fade-in">
          <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-slate-700" />
          </div>
          
          <h2 className="text-xl font-poppins font-bold text-slate-900 mb-2">Restricted Access</h2>
          <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">
            This portal is restricted to authorized registry administrators. Please enter the passcode to proceed.
          </p>

          <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col text-left gap-1.5">
              <label className="text-xs font-semibold text-slate-500">Passcode</label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••••"
                className="bg-white border border-slate-300 rounded-xl p-3 text-slate-850 outline-none focus:ring-1 focus:ring-secondary focus:border-secondary text-center text-sm tracking-widest"
                required
              />
            </div>
            
            {authError && (
              <p className="text-xs text-red-600 font-semibold">{authError}</p>
            )}

            <button
              type="submit"
              className="bg-secondary hover:bg-secondary/90 text-white font-bold py-3 rounded-xl transition-all cursor-pointer border-none text-xs tracking-wider uppercase mt-2 font-inter"
            >
              Verify Passcode
            </button>
          </form>

          <button
            onClick={() => setCurrentPage('home')}
            className="mt-6 text-xs text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer font-semibold flex items-center justify-center gap-1.5 mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Home
          </button>
        </div>
      </div>
    );
  }

  const handleAction = async (id, statusUpdate, updatedFields = null) => {
    try {
      setError(null);
      setSuccessMsg(null);
      
      const payload = updatedFields ? { ...updatedFields, status: statusUpdate } : { status: statusUpdate };
      
      let res = await fetch(`${SUPABASE_URL}/rest/v1/incidents?id=eq.${id}`, {
        method: 'PATCH',
        headers: { 
          'apikey': SUPABASE_KEY, 
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.message || '';
        const errCode = errData.code || '';
        
        if (res.status === 400 && (errMsg.includes('rescued') || errCode === 'PGRST204') && payload.hasOwnProperty('rescued')) {
          console.warn("Retrying incident update without 'rescued' column because it is missing in Supabase.");
          const { rescued, ...retryPayload } = payload;
          res = await fetch(`${SUPABASE_URL}/rest/v1/incidents?id=eq.${id}`, {
            method: 'PATCH',
            headers: { 
              'apikey': SUPABASE_KEY, 
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(retryPayload)
          });
        }
      }
      
      if (!res.ok) throw new Error(`Failed to update incident: ${res.statusText || res.status}`);
      
      setSuccessMsg(`Incident successfully ${statusUpdate === 'approved' ? 'approved' : 'rejected'}!`);
      setEditingId(null);
      // Refresh list
      fetchPending();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this incident from the database?")) return;
    
    try {
      setError(null);
      setSuccessMsg(null);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/incidents?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 
          'apikey': SUPABASE_KEY, 
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      
      if (!res.ok) throw new Error(`Failed to delete incident: ${res.statusText}`);
      
      setSuccessMsg("Incident permanently deleted from the registry.");
      fetchPending();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEditing = (inc) => {
    setEditingId(inc.id);
    setEditForm({
      date: inc.date,
      state: inc.state,
      lga: inc.lga || '',
      community: inc.community || '',
      incident_type: inc.incident_type,
      fatalities: inc.fatalities || 0,
      abductions: inc.abductions || 0,
      injuries: inc.injuries || 0,
      rescued: inc.rescued || 0,
      summary: inc.summary || '',
      source_url: inc.source_url || '',
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: ['fatalities', 'abductions', 'injuries', 'rescued'].includes(name) ? parseInt(value) || 0 : value
    }));
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-inter">
      {/* Top Banner Header */}
      <div className="bg-[#052353] py-10 px-6 border-b border-white/5 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-left flex items-center gap-4">
            <button 
              onClick={() => setCurrentPage('home')}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer outline-none border-none"
              title="Go back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="font-inter text-xs font-bold tracking-[0.2em] text-[#39B54A] uppercase mb-1 block">
                Verification Dashboard
              </span>
              <h1 className="text-2xl md:text-3xl font-poppins font-bold text-white flex items-center gap-2">
                <Shield className="w-7 h-7 text-secondary" /> Incident Review Queue
              </h1>
            </div>
          </div>
          <div className="bg-white/5 border border-white/15 px-4 py-2.5 rounded-2xl flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-secondary animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-200">
              Pending Items: <span className="font-mono text-white text-sm font-bold bg-[#052353] px-2.5 py-0.5 rounded-lg ml-1">{incidents.length}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        
        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-xs">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span><strong>Error:</strong> {error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-700 text-xs">
            <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && incidents.length === 0 && (
          <div className="text-center py-20 bg-slate-50 border border-slate-200 rounded-2xl">
            <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-base font-bold uppercase tracking-wider text-slate-700">Queue is Clear</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2">
              All scraped security incidents have been audited and verified. Check back when the next scraper cycle completes.
            </p>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-secondary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xs text-slate-400 uppercase tracking-widest">Loading review queue...</p>
          </div>
        )}

        {/* Incidents Queue */}
        <div className="space-y-6">
          {incidents.map((inc) => {
            const isEditing = editingId === inc.id;
            
            return (
              <div 
                key={inc.id}
                className={`rounded-2xl border transition-all duration-300 ${
                  isEditing 
                    ? 'border-secondary bg-white shadow-xl shadow-secondary/5' 
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50 shadow-sm'
                }`}
              >
                {isEditing ? (
                  /* EDITING FORM */
                  <div className="p-6 flex flex-col gap-5 text-xs text-slate-700">
                    <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                      <span className="font-bold text-secondary uppercase tracking-wider">Editing Entry #{inc.id}</span>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Date */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-slate-500">Date (YYYY-MM-DD)</label>
                        <input 
                          type="text" 
                          name="date"
                          value={editForm.date} 
                          onChange={handleEditChange}
                          className="bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-1 focus:ring-secondary focus:border-secondary"
                        />
                      </div>
                      
                      {/* State */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-slate-500">State</label>
                        <select 
                          name="state"
                          value={editForm.state} 
                          onChange={handleEditChange}
                          className="bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-1 focus:ring-secondary focus:border-secondary"
                        >
                          {STATES_LIST.map(st => <option key={st} value={st}>{st}</option>)}
                        </select>
                      </div>

                      {/* LGA */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-slate-500">LGA</label>
                        <input 
                          type="text" 
                          name="lga"
                          value={editForm.lga} 
                          onChange={handleEditChange}
                          className="bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-1 focus:ring-secondary focus:border-secondary"
                          placeholder="e.g. Shiroro"
                        />
                      </div>

                      {/* Community */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-slate-500">Community</label>
                        <input 
                          type="text" 
                          name="community"
                          value={editForm.community} 
                          onChange={handleEditChange}
                          className="bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-1 focus:ring-secondary focus:border-secondary"
                          placeholder="e.g. Baidi Village"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {/* Incident Type */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-slate-500">Incident Type</label>
                        <select 
                          name="incident_type"
                          value={editForm.incident_type} 
                          onChange={handleEditChange}
                          className="bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-1 focus:ring-secondary focus:border-secondary"
                        >
                          {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>

                      {/* Killed */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-slate-500">Fatalities (Killed)</label>
                        <input 
                          type="number" 
                          name="fatalities"
                          value={editForm.fatalities} 
                          onChange={handleEditChange}
                          min="0"
                          className="bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-1 focus:ring-secondary focus:border-secondary"
                        />
                      </div>

                      {/* Abducted */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-slate-500">Abductions (Abducted)</label>
                        <input 
                          type="number" 
                          name="abductions"
                          value={editForm.abductions} 
                          onChange={handleEditChange}
                          min="0"
                          className="bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-1 focus:ring-secondary focus:border-secondary"
                        />
                      </div>

                      {/* Injured */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-slate-500">Injuries (Injured)</label>
                        <input 
                          type="number" 
                          name="injuries"
                          value={editForm.injuries} 
                          onChange={handleEditChange}
                          min="0"
                          className="bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-1 focus:ring-secondary focus:border-secondary"
                        />
                      </div>

                      {/* Rescued */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-slate-500">Rescued (Saved)</label>
                        <input 
                          type="number" 
                          name="rescued"
                          value={editForm.rescued} 
                          onChange={handleEditChange}
                          min="0"
                          className="bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-1 focus:ring-secondary focus:border-secondary"
                        />
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-slate-500">Incident Summary</label>
                      <textarea 
                        name="summary"
                        value={editForm.summary} 
                        onChange={handleEditChange}
                        rows="3"
                        className="bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-1 focus:ring-secondary focus:border-secondary resize-y"
                        placeholder="Brief summary..."
                      />
                    </div>

                    {/* Source URL */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-slate-500">Source News Link (URL)</label>
                      <input 
                        type="text" 
                        name="source_url"
                        value={editForm.source_url} 
                        onChange={handleEditChange}
                        className="bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-1 focus:ring-secondary focus:border-secondary"
                      />
                    </div>

                    {/* Form Controls */}
                    <div className="border-t border-slate-200 pt-4 flex justify-end gap-3">
                      <button 
                        onClick={() => handleAction(inc.id, 'approved', editForm)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border-none"
                      >
                        <Save className="w-4 h-4" /> Save &amp; Approve
                      </button>
                    </div>
                  </div>
                ) : (
                  /* STANDARD RENDER CARD */
                  <div className="p-6 flex flex-col gap-4">
                    
                    {/* Top Row: Meta details */}
                    <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-3">
                      <div className="flex flex-wrap items-center gap-3.5 text-xs text-slate-500 font-semibold">
                        <span className="flex items-center gap-1.5 bg-[#052353] text-white px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider">
                          {inc.incident_type}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> {inc.date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {inc.state} {inc.lga && `| {inc.lga} LGA`} {inc.community && `| {inc.community}`}
                        </span>
                      </div>
                      
                      {/* Casualty indicators */}
                      <div className="flex gap-2">
                        <span className="bg-red-50 border border-red-200 text-red-700 px-3 py-1 rounded-lg text-xs font-bold">
                          {inc.fatalities || 0} Killed
                        </span>
                        <span className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-lg text-xs font-bold">
                          {inc.abductions || 0} Abducted
                        </span>
                        {inc.injuries > 0 && (
                          <span className="bg-orange-50 border border-orange-200 text-orange-700 px-3 py-1 rounded-lg text-xs font-bold">
                            {inc.injuries || 0} Injured
                          </span>
                        )}
                        <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold">
                          {inc.rescued || 0} Rescued
                        </span>
                      </div>
                    </div>

                    {/* Summary text */}
                    <div className="text-left text-sm text-slate-700 leading-relaxed font-semibold">
                      {inc.summary}
                    </div>

                    {/* Source link */}
                    {inc.source_url && (
                      <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-3">
                        <a 
                          href={inc.source_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#39B54A] hover:underline flex items-center gap-1 font-bold"
                        >
                          Source: {getSourceName(inc.source_url, inc.source_name)} <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className="text-[10px] text-slate-400 font-mono">
                          content_fp: {inc.content_fp || 'none'}
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="border-t border-slate-100 pt-4 flex flex-wrap justify-between items-center gap-3">
                      <button 
                        onClick={() => handleDelete(inc.id)}
                        className="bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 text-red-600 p-2.5 rounded-xl transition-all cursor-pointer"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => startEditing(inc)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border-none text-xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button 
                          onClick={() => handleAction(inc.id, 'rejected')}
                          className="bg-slate-205 hover:bg-slate-300 text-slate-750 font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border-none text-xs"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                        <button 
                          onClick={() => handleAction(inc.id, 'approved')}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border-none text-xs"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
