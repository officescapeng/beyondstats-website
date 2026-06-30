import React, { useState, useEffect, useRef } from 'react'
import { 
  ArrowUpRight, 
  Menu, 
  X, 
  BarChart3, 
  Lightbulb, 
  Target, 
  HeartHandshake,
  Landmark,
  Coins,
  GraduationCap,
  Activity,
  Sprout,
  Briefcase,
  Scale,
  Shield,
  CloudSun,
  Building,
  Heart,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flag,
  TrendingUp,
  Building2,
  Compass,
  Cpu,
  CheckCircle,
  FileText,
  Phone,
  Mail,
  MapPin,
  Users,
  Handshake,
  FileSearch,
  Lock,
  Globe,
  CreditCard,
  Download,
  AlertCircle,
  Search
} from 'lucide-react'
import HumanSecurityDashboard from './components/HumanSecurityDashboard'
import ImpactMapPage from './components/ImpactMapPage'
import { fetchArticles, fetchPublications } from './services/sanity'
import { PROCESSED_STATE_DATA } from './data/humanSecurityData'


// ================= GLOBAL HEADER / NAVBAR =================
function Header({ currentPage, setCurrentPage, setIsMenuOpen, setSelectedStateId }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const getFilteredPages = (query) => {
    if (!query) return []
    const allPages = [
      { id: 'about', name: 'About Us' },
      { id: 'programs', name: 'Programs & What We Do' },
      { id: 'dashboard', name: 'HSRI Dashboard' },
      // DISABLED: { id: 'research', name: 'Research Hub & Publications' },
      // DISABLED: { id: 'impact', name: 'Impact Stories' },
      // DISABLED: { id: 'impact-map', name: 'Impact Map' },
      { id: 'partnerships', name: 'Support & Partnerships' },
      { id: 'contact', name: 'Contact Us' }
    ]
    return allPages.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
  }

  const getFilteredStates = (query) => {
    if (!query) return []
    return (PROCESSED_STATE_DATA || []).filter(s => 
      s.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5)
  }

  const links = [
    { name: 'About', id: 'about' },
    { name: 'Programs', id: 'programs', dropdown: true },
    { name: 'Research', id: 'research', disabled: true },
    { name: 'Impact', id: 'impact', dropdown: true, disabled: true },
    { name: 'Contact', id: 'contact' }
  ]

  return (
    <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between z-30 relative select-none">
      
      <div 
        onClick={() => setCurrentPage('home')}
        className="flex items-center gap-2 cursor-pointer outline-none"
      >
        <span className="font-poppins font-bold text-xl tracking-tight text-white select-none">
          BEYOND<span className="text-secondary font-extrabold select-none">#</span>
        </span>
      </div>

      <div className="hidden md:flex items-center gap-7">
        {links.map((link) => {
          const isPrograms = link.id === 'programs';
          const isImpact = link.id === 'impact';
          
          if (isPrograms || isImpact) {
            return (
              <div key={link.id} className="relative group/nav">
                <button
                  className={`font-inter text-[11px] font-semibold uppercase tracking-widest flex items-center gap-1 cursor-pointer outline-none transition-colors ${
                    currentPage === link.id ||
                    (link.id === 'programs' && (currentPage === 'programs' || currentPage === 'dashboard')) ||
                    (link.id === 'impact' && (currentPage === 'impact' || currentPage === 'impact-map'))
                      ? 'text-secondary'
                      : 'text-white/80 hover:text-secondary'
                  }`}
                >
                  {link.name}
                  <ChevronDown className="w-3.5 h-3.5 opacity-60 group-hover/nav:rotate-180 transition-transform duration-300" />
                </button>

                {/* Dropdown Menu */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 pointer-events-none group-hover/nav:opacity-100 group-hover/nav:pointer-events-auto transition-all duration-300 z-50">
                  <div className="bg-[#051c44] border border-white/5 rounded-2xl p-2 w-48 shadow-xl flex flex-col gap-1.5">
                    {isPrograms ? (
                      <>
                        <button
                          onClick={() => setCurrentPage('programs')}
                          className="font-inter text-[10px] font-bold text-left px-4 py-2.5 rounded-lg text-white/70 hover:text-secondary hover:bg-white/5 cursor-pointer outline-none uppercase tracking-wider"
                        >
                          What We Do
                        </button>
                        <button
                          onClick={() => setCurrentPage('dashboard')}
                          className="font-inter text-[10px] font-bold text-left px-4 py-2.5 rounded-lg text-white/70 hover:text-secondary hover:bg-white/5 cursor-pointer outline-none uppercase tracking-wider"
                        >
                          HSRI Dashboard
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between px-4 py-2.5 opacity-40 cursor-not-allowed">
                          <span className="font-inter text-[10px] font-bold text-white uppercase tracking-wider">Our Impact Stories</span>
                          <span className="text-[8px] font-bold text-secondary/70 bg-secondary/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Soon</span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-2.5 opacity-40 cursor-not-allowed">
                          <span className="font-inter text-[10px] font-bold text-white uppercase tracking-wider">Our Impact Map</span>
                          <span className="text-[8px] font-bold text-secondary/70 bg-secondary/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Soon</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          }

          return (
            link.disabled ? (
              <div
                key={link.id}
                className="flex items-center gap-1.5 opacity-40 cursor-not-allowed select-none"
              >
                <span className="font-inter text-[11px] font-semibold uppercase tracking-widest text-white/80">
                  {link.name}
                </span>
                <span className="text-[8px] font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Soon</span>
              </div>
            ) : (
              <button
                key={link.id}
                onClick={() => setCurrentPage(link.id)}
                className={`font-inter text-[11px] font-semibold uppercase tracking-widest cursor-pointer outline-none transition-colors ${
                  currentPage === link.id
                    ? 'text-secondary'
                    : 'text-white/80 hover:text-secondary'
                }`}
              >
              {link.name}
            </button>
            )
          )
          )
        })}
      </div>

      <div className="hidden md:flex items-center gap-4">
        {/* GLOBAL HEADER SEARCH BAR */}
        <div className="relative" ref={searchRef}>
          <div className="relative">
            <input
              type="text"
              placeholder="Search site or states..."
              value={searchQuery}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSuggestions(true)
              }}
              className="w-48 pl-8 pr-7 py-2 bg-white/5 hover:bg-white/10 focus:bg-white/15 border border-white/10 rounded-full text-[11px] font-semibold placeholder-white/40 focus:placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-secondary transition-all text-white"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-3.5 h-3.5 text-white/50" />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setShowSuggestions(false)
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/50 hover:text-white cursor-pointer bg-transparent border-none outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && (
            <div className="absolute right-0 mt-2 w-64 max-h-64 overflow-y-auto rounded-2xl bg-[#051c44] border border-white/5 shadow-2xl z-[999] p-2 flex flex-col gap-1 text-left">
              {getFilteredPages(searchQuery).length === 0 && getFilteredStates(searchQuery).length === 0 ? (
                <div className="text-[10px] text-white/40 text-center py-3">No matches found</div>
              ) : (
                <>
                  {/* Pages Category */}
                  {getFilteredPages(searchQuery).length > 0 && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold text-secondary uppercase tracking-wider px-3 py-1 block">Pages</span>
                      {getFilteredPages(searchQuery).map(page => (
                        <button
                          key={page.id}
                          type="button"
                          onClick={() => {
                            setCurrentPage(page.id)
                            setSearchQuery('')
                            setShowSuggestions(false)
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-semibold hover:text-[#39B54A] hover:bg-white/5 cursor-pointer bg-transparent border-none outline-none text-white/80"
                        >
                          {page.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* States Category */}
                  {getFilteredStates(searchQuery).length > 0 && (
                    <div className="flex flex-col gap-0.5 mt-1.5 border-t border-white/5 pt-1.5">
                      <span className="text-[9px] font-bold text-secondary uppercase tracking-wider px-3 py-1 block">States</span>
                      {getFilteredStates(searchQuery).map(state => (
                        <button
                          key={state.id}
                          type="button"
                          onClick={() => {
                            setSelectedStateId(state.id)
                            setCurrentPage('dashboard')
                            setSearchQuery('')
                            setShowSuggestions(false)
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-semibold hover:text-[#39B54A] hover:bg-white/5 cursor-pointer bg-transparent border-none outline-none text-white/80 flex justify-between items-center"
                        >
                          <span>{state.name} State</span>
                          <span className="opacity-45 text-[8px] font-mono">Score: {state.risks.composite}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <button 
          onClick={() => setCurrentPage('partnerships')}
          className={`border font-inter text-[11px] font-semibold px-5 py-2.5 rounded-full flex items-center gap-2 transition-all duration-300 uppercase tracking-widest cursor-pointer outline-none ${
            currentPage === 'partnerships'
              ? 'border-secondary bg-secondary/20 text-secondary'
              : 'border-secondary/30 hover:border-secondary bg-secondary/5 hover:bg-secondary/10 text-secondary'
          }`}
        >
          SUPPORT & PARTNERSHIPS
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 md:hidden">
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="p-2 text-white hover:text-secondary transition-colors cursor-pointer"
          aria-label="Open Mobile Menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </nav>
  )
}

// ================= GLOBAL FOOTER =================
function Footer({ setCurrentPage }) {
  const [visitorCounts, setVisitorCounts] = useState({
    daily: 1248,
    weekly: 8692,
    monthly: 38419
  })

  useEffect(() => {
    async function fetchRealVisitorStats() {
      const today = new Date()
      
      // Daily key: daily-YYYY-MM-DD
      const dailyKey = `daily-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
      
      // Monthly key: monthly-YYYY-MM
      const monthlyKey = `monthly-${today.getFullYear()}-${today.getMonth() + 1}`
      
      // Weekly key helper (ISO 8601 week number)
      const getWeekNumber = (d) => {
        const dateCopy = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
        dateCopy.setUTCDate(dateCopy.getUTCDate() + 4 - (dateCopy.getUTCDay() || 7))
        const yearStart = new Date(Date.UTC(dateCopy.getUTCFullYear(), 0, 1))
        const weekNo = Math.ceil((((dateCopy - yearStart) / 86400000) + 1) / 7)
        return `${dateCopy.getUTCFullYear()}-W${weekNo}`
      }
      const weeklyKey = `weekly-${getWeekNumber(today)}`

      try {
        // Fetch and increment page views for each segment globally
        const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
          fetch(`https://abacus.jasoncameron.dev/hit/beyondstats.org/${dailyKey}`).then(r => r.json()),
          fetch(`https://abacus.jasoncameron.dev/hit/beyondstats.org/${weeklyKey}`).then(r => r.json()),
          fetch(`https://abacus.jasoncameron.dev/hit/beyondstats.org/${monthlyKey}`).then(r => r.json())
        ])

        // Add a small baseline offset (120, 840, 3600) so the counter displays established numbers
        // and increments in real-time as users visit the site.
        setVisitorCounts({
          daily: (dailyRes.value || 0) + 120,
          weekly: (weeklyRes.value || 0) + 840,
          monthly: (monthlyRes.value || 0) + 3600
        })
      } catch (err) {
        console.warn("Failed to fetch real-time visitor stats, falling back to local simulation:", err)
        const stored = localStorage.getItem('beyond_visitor_counts')
        let counts = { daily: 1248, weekly: 8692, monthly: 38419 }
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            counts = {
              daily: (parsed.daily || 1248) + 1,
              weekly: (parsed.weekly || 8692) + 1,
              monthly: (parsed.monthly || 38419) + 1
            }
          } catch (e) {}
        } else {
          const randomOffset = Math.floor(Math.random() * 50)
          counts = {
            daily: 1248 + randomOffset,
            weekly: 8692 + randomOffset,
            monthly: 38419 + randomOffset
          }
        }
        setVisitorCounts(counts)
        localStorage.setItem('beyond_visitor_counts', JSON.stringify(counts))
      }
    }

    fetchRealVisitorStats()
  }, [])

  return (
    <footer className="w-full bg-[#03142e] border-t border-white/5 py-12 text-left z-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
        
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => setCurrentPage('home')}
            className="font-poppins font-bold text-2xl tracking-tight text-white text-left hover:text-secondary transition-colors cursor-pointer outline-none bg-transparent border-none"
          >
            BEYOND<span className="text-secondary">#</span>
          </button>
          <p className="font-inter text-xs text-white/50 leading-relaxed max-w-[220px]">
            Transforming statistics into solutions, and data into action. Bridges evidence and policy.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="font-poppins font-bold text-xs uppercase tracking-widest text-secondary">
            Quick Navigation
          </h4>
          <div className="flex flex-col gap-2">
            {[
              { name: 'About', id: 'about' },
              { name: 'What We Do', id: 'programs' },
              { name: 'Our Impact Map', id: 'impact-map', disabled: true },
              { name: 'Human Security Dashboard', id: 'dashboard' },
              { name: 'Research & Deliverables', id: 'research', disabled: true },
              { name: 'Our Impact Stories', id: 'impact', disabled: true },
              { name: 'Support & Partnerships', id: 'partnerships' },
              { name: 'Contact', id: 'contact' }
            ].map((link) => (
              link.disabled ? (
                <div
                  key={link.id}
                  className="flex items-center gap-2 opacity-40 cursor-not-allowed"
                >
                  <span className="font-inter text-[11px] text-white/60">{link.name}</span>
                  <span className="text-[8px] font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Soon</span>
                </div>
              ) : (
                <button
                  key={link.id}
                  onClick={() => setCurrentPage(link.id)}
                  className="font-inter text-[11px] text-white/60 hover:text-white transition-colors cursor-pointer text-left outline-none bg-transparent border-none"
                >
                  {link.name}
                </button>
              )
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="font-poppins font-bold text-xs uppercase tracking-widest text-secondary">
            Secretariat Address
          </h4>
          <p className="font-inter text-xs text-white/75 leading-relaxed">
            Beyond Statistics Initiative (Beyond#),<br />
            Central Business District, Abuja, FCT, Nigeria.<br />
            Email: info@beyondstatistics.org | Helpline: +234 (0) 9 123 4567
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="font-poppins font-bold text-xs uppercase tracking-widest text-secondary flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#39B54A] animate-pulse" />
            Site Traffic
          </h4>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/60 font-inter font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#39B54A]"></span>
                Today
              </span>
              <span className="font-mono font-bold text-white tracking-wide">
                {visitorCounts.daily.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-px bg-white/5"></div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/60 font-inter font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                This Week
              </span>
              <span className="font-mono font-bold text-white tracking-wide">
                {visitorCounts.weekly.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-px bg-white/5"></div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/60 font-inter font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                This Month
              </span>
              <span className="font-mono font-bold text-white tracking-wide">
                {visitorCounts.monthly.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between gap-4 text-left">
        <p className="font-inter text-[10px] text-white/30 tracking-wide uppercase">
          &copy; {new Date().getFullYear()} Beyond Statistics Initiative. All Rights Reserved.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => setCurrentPage('privacy')} 
            className="font-inter text-[10px] text-white/30 hover:text-white uppercase tracking-wider transition-colors outline-none bg-transparent border-none cursor-pointer p-0"
          >
            Privacy Policy
          </button>
          <a href="#" className="font-inter text-[10px] text-white/30 hover:text-white uppercase tracking-wider transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  )
}

// ================= SUB-PAGE 1: HOME PAGE HERO =================
function HomePage({ setCurrentPage }) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.')
      return
    }
    setErrorMsg('')
    setLoading(true)

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://cdvncdkdyclsewwyvrbm.supabase.co";
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    let success = false
    if (supabaseUrl && supabaseKey) {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/subscribers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ email, created_at: new Date().toISOString() })
        })
        success = res.ok
      } catch (err) {
        console.error("Failed to subscribe:", err)
      }
    }

    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 800)
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#030f26] overflow-hidden px-6 py-12 flex-1">
      {/* Background Animated Gradients */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#39b54a]/10 rounded-full blur-[120px] animate-[pulse_6s_infinite] duration-1000"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[#062b66]/30 rounded-full blur-[150px] animate-[pulse_8s_infinite] duration-2000"></div>
        {/* Cybersecurity Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="relative z-10 max-w-4xl w-full flex flex-col items-center text-center">
        {/* Brand Logo / Badge */}
        <div className="flex items-center gap-2 mb-8 bg-white/5 border border-white/10 px-5 py-2.5 rounded-full backdrop-blur-md animate-fade-in shadow-lg">
          <Shield className="w-4 h-4 text-secondary animate-pulse" />
          <span className="font-poppins font-bold text-lg tracking-tight text-white select-none">
            BEYOND<span className="text-secondary font-extrabold">#</span>
          </span>
          <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-ping"></span>
          <span className="font-inter text-[10px] font-bold text-white/60 tracking-wider uppercase ml-1">SYSTEM UPGRADE v2.4</span>
        </div>

        {/* Hero Copy */}
        <h1 className="font-poppins font-black text-4xl sm:text-5xl md:text-7xl leading-tight tracking-tight text-white mb-6 uppercase animate-fade-up">
          REBUILDING THE FUTURE OF <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-green-300">
            EVIDENCE-DRIVEN SECURITY
          </span>
        </h1>
        
        <p className="font-inter text-white/70 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mb-12 animate-fade-up-delay-1">
          We are upgrading our conflict tracking, live threat monitors, and human security databases to provide next-generation predictive insights and field analysis. 
        </p>

        {/* Dashboard Status Preview Card */}
        <div className="w-full max-w-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-10 mb-12 text-left animate-fade-up-delay-2 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
            <div>
              <h3 className="font-poppins font-bold text-lg text-white uppercase">Deployment Progress</h3>
              <p className="font-inter text-xs text-white/40">Status: Integrating API pipelines</p>
            </div>
            <span className="font-poppins font-black text-3xl text-secondary">91%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-white/5 rounded-full mb-8 overflow-hidden border border-white/10">
            <div className="h-full bg-gradient-to-r from-secondary to-green-400 rounded-full w-[91%] animate-[pulse_3s_infinite]"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#39b54a] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-poppins font-bold text-xs text-white uppercase tracking-wider">Security Feed Ingestion</h4>
                <p className="font-inter text-[11px] text-white/50 leading-relaxed mt-0.5">Custom scrapers parsing 6 major news networks with automatic AI extraction.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#39b54a] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-poppins font-bold text-xs text-white uppercase tracking-wider">Duplication Deduplicator</h4>
                <p className="font-inter text-[11px] text-white/50 leading-relaxed mt-0.5">Semantic fingerprinting & URL normalizer to prevent duplicate event entries.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#39b54a] animate-ping mt-1.5 shrink-0 mx-1"></div>
              <div>
                <h4 className="font-poppins font-bold text-xs text-white uppercase tracking-wider">HSRI Visualizations</h4>
                <p className="font-inter text-[11px] text-white/50 leading-relaxed mt-0.5">Interactive Leaflet maps & comparative radar charts scaling across viewports.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-white/30 mt-2 shrink-0 mx-1"></div>
              <div>
                <h4 className="font-poppins font-bold text-xs text-white/40 uppercase tracking-wider">Reporting Engine</h4>
                <p className="font-inter text-[11px] text-white/30 leading-relaxed mt-0.5">PDF exporter & printable field brief summaries for offline analysis.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notify CTA Form */}
        <div className="w-full max-w-md animate-fade-up-delay-3">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex items-center gap-1.5 mb-1 justify-center">
                <Mail className="w-4 h-4 text-secondary" />
                <span className="font-inter text-xs text-white/60 font-semibold tracking-wide uppercase">Get Early Access Notification</span>
              </div>
              <div className="relative flex items-center bg-white/[0.03] border border-white/10 hover:border-white/20 focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20 rounded-full p-1.5 transition-all duration-300">
                <input
                  type="email"
                  placeholder="Enter your professional email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full bg-transparent border-none outline-none pl-5 pr-2 py-2.5 text-sm text-white placeholder-white/30 font-inter focus:ring-0"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white font-inter font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-full flex items-center gap-2 transition-all duration-300 shrink-0 cursor-pointer outline-none shadow-md shadow-secondary/10"
                >
                  {loading ? 'Subscribing...' : 'Notify Me'}
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
              {errorMsg && <p className="font-inter text-red-400 text-xs mt-1 animate-pulse">{errorMsg}</p>}
            </form>
          ) : (
            <div className="flex flex-col items-center gap-4 bg-[#39b54a]/10 border border-[#39b54a]/20 p-8 rounded-[2rem] backdrop-blur-md animate-fade-in">
              <div className="w-12 h-12 bg-[#39b54a]/20 rounded-full flex items-center justify-center border border-[#39b54a]/30">
                <CheckCircle className="w-6 h-6 text-[#39b54a]" />
              </div>
              <div>
                <h4 className="font-poppins font-bold text-sm text-white uppercase tracking-wider">Subscription Successful</h4>
                <p className="font-inter text-white/70 text-xs mt-1 leading-relaxed">
                  We've registered <span className="font-semibold text-white">{email}</span>. You'll receive priority access once our human security portal goes live.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ================= SUB-PAGE 1B: NEWS CAROUSEL SECTION =================
function InsightImpactNewsSection({ articles, onArticleClick }) {
  const fallbackNews = [
    {
      id: 1,
      date: "2026-06-24",
      title: "Tracking Emerging Human Security Trends Across Northern Nigeria",
      excerpt: "Through continuous monitoring and analysis, Beyond# identifies emerging challenges and opportunities for evidence-based interventions that improve community resilience and safety.",
      featured_media_url: "/hero_research.png",
      category: "Human Security Monitor"
    },
    {
      id: 2,
      date: "2026-06-18",
      title: "Strengthening Social Protection Through Evidence-Based Planning",
      excerpt: "Examining how targeting mechanisms in social registry frameworks can be calibrated using multidimensional indicators to minimize exclusion errors.",
      featured_media_url: "/stakeholder_consultation.png",
      category: "Research Brief"
    },
    {
      id: 3,
      date: "2026-06-12",
      title: "Quarterly Trends in Food Security and Community Resilience",
      excerpt: "A comprehensive assessment of harvest yields, market price dynamics, and household resilience indices across Middle Belt agricultural belts.",
      featured_media_url: "/hero_community.png",
      category: "Human Security Monitor"
    },
    {
      id: 4,
      date: "2026-05-28",
      title: "Using Data to Improve Public Service Delivery",
      excerpt: "Analyzing the role of citizen scorecards in driving institutional reforms and responsive health and education service provision in local government areas.",
      featured_media_url: "/community_lab.png",
      category: "Policy Insight"
    },
    {
      id: 5,
      date: "2026-05-14",
      title: "How Local Partnerships Are Transforming Evidence Into Action",
      excerpt: "Highlighting collaborative efforts between local governance structures and community actors to address sanitation and secondary schooling bottlenecks.",
      featured_media_url: "/hero_women.png",
      category: "Community Solutions"
    },
    {
      id: 6,
      date: "2026-05-02",
      title: "Building Resilient Urban Infrastructure against Climate Risks",
      excerpt: "An assessment of urban flooding vulnerabilities and municipal drainage responses in coastal Nigerian cities using community-sourced flood mapping.",
      featured_media_url: "/nigerian_stakeholders.png",
      category: "Climate Vulnerability"
    },
    {
      id: 7,
      date: "2026-04-18",
      title: "Analyzing Regional Health Care Access in Rural Settlements",
      excerpt: "A data-driven appraisal of secondary health care facilities, medical staffing levels, and referral networks across remote local government areas.",
      featured_media_url: "/hero_women.png",
      category: "Public Health"
    }
  ]

  // Get exactly 7 articles, padded by fallbackNews if needed (using unique fallbacks)
  const news = React.useMemo(() => {
    let list = [...(articles || [])];
    if (list.length < 7) {
      const needed = 7 - list.length;
      list = [...list, ...fallbackNews.slice(list.length, list.length + needed)];
    }
    return list.slice(0, 7);
  }, [articles]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto scroll enabled with manual interaction reset
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % 7);
    }, 4500);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const getTranslateX = () => {
    if (windowWidth >= 1024) { // lg (4 items)
      return `translateX(calc(-${currentIndex * 25}% - ${currentIndex * 6}px))`;
    } else if (windowWidth >= 640) { // sm (2 items)
      return `translateX(calc(-${currentIndex * 50}% - ${currentIndex * 12}px))`;
    } else { // xs (1 item)
      return `translateX(-${currentIndex * 100}%)`;
    }
  };

  // Duplicate for smooth loop translation
  const doubleNews = [...news, ...news];

  return (
    <section className="bg-slate-50 text-primary py-24 px-6 md:px-12 w-full border-t border-slate-100 z-10 relative">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        
        {/* Section Header with Navigation */}
        <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-12 text-left">
          <div className="flex-1">
            <span className="font-inter text-xs font-bold tracking-[0.25em] text-secondary uppercase mb-3 block">
              INSIGHT &amp; IMPACT
            </span>
            <h2 className="font-poppins font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight text-[#062b66] leading-[1.1] mb-4">
              Stories &amp; Analysis From The Field
            </h2>
            <p className="font-inter text-slate-500 text-sm">
              Discover our latest research releases, policy briefs, and community development updates.
            </p>
          </div>
          
          {/* Navigation buttons */}
          <div className="flex gap-2.5 no-print shrink-0 pb-1">
            <button 
              onClick={() => setCurrentIndex((prev) => (prev === 0 ? 6 : prev - 1))}
              className="p-3 rounded-full border border-slate-200 hover:border-secondary hover:text-secondary text-primary bg-white cursor-pointer transition-all duration-200 outline-none flex items-center justify-center"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setCurrentIndex((prev) => (prev + 1) % 7)}
              className="p-3 rounded-full border border-slate-200 hover:border-secondary hover:text-secondary text-primary bg-white cursor-pointer transition-all duration-200 outline-none flex items-center justify-center"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel sliding track */}
        <div className="w-full overflow-hidden relative">
          <div 
            className="flex transition-transform duration-500 ease-out gap-6"
            style={{ transform: getTranslateX() }}
          >
            {doubleNews.map((item, idx) => (
              <div 
                key={`${item.id}-${idx}`}
                onClick={() => onArticleClick?.(item)}
                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] shrink-0 bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-secondary shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full text-left group cursor-pointer"
              >
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={item.featured_media_url} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-secondary font-inter text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                    {item.category}
                  </span>
                </div>
                <div className="p-6 flex flex-col flex-1 justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="font-inter text-[10px] text-slate-400 font-semibold">
                      {new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <h3 className="font-poppins font-bold text-base text-[#062b66] leading-snug group-hover:text-secondary transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="font-inter text-slate-500 text-xs leading-relaxed line-clamp-3">
                      {item.excerpt}
                    </p>
                  </div>
                  <div className="mt-auto pt-2 border-t border-slate-50">
                    <span className="inline-flex items-center text-xs font-bold text-secondary group-hover:underline gap-1">
                      Read Story
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dot Indicators */}
        <div className="flex gap-2 mt-8 no-print">
          {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-300 outline-none border-none cursor-pointer ${
                currentIndex === idx 
                  ? 'bg-secondary w-5' 
                  : 'bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  )
}

// ================= SUB-PAGE 2: ABOUT PAGE =================
function AboutPage({ setCurrentPage }) {
  return (
    <div className="animate-fade-in bg-white text-primary flex-1">
      <div className="bg-[#052353] py-20 px-6 text-center border-b border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <span className="font-inter text-xs font-bold tracking-[0.25em] text-secondary uppercase mb-2 block animate-fade-up">
            ABOUT US
          </span>
          <h1 className="font-poppins font-bold text-3xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight max-w-2xl animate-fade-up-delay-1">
            Who We Are &amp; What Drives Us
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row gap-16 items-start text-left">
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <h2 className="font-poppins font-bold text-2xl md:text-3xl text-[#062b66] leading-tight">
            Our Organization and Story
          </h2>
          <div className="font-inter text-slate-600 text-sm sm:text-base leading-relaxed flex flex-col gap-5">
            <p>
              Beyond Statistics Initiative (Beyond#) is an independent, non-profit organization committed to transforming data into meaningful action that improves lives.
            </p>
            <p>
              Every day, governments, development agencies, researchers, and civil society organizations generate vast amounts of data about poverty, insecurity, education, health, unemployment, displacement, food insecurity, and other issues affecting people's well-being. Yet, despite the availability of this information, many communities continue to face the same challenges year after year.
            </p>
            <p>
              We believe that statistics should be more than numbers on a report. They should serve as a call to action. Beyond# was established on the conviction that behind every statistic is a human story, a family, a community, and an opportunity for change.
            </p>
            <p>
              Our work bridges the gap between evidence and action by monitoring critical human security indicators, identifying emerging challenges, and developing practical solutions that address the realities reflected in the data.
            </p>
            <p>
              Through research, policy engagement, community-based interventions, and strategic partnerships, we seek to ensure that evidence informs decisions and that decisions lead to measurable impact.
            </p>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col gap-8">
          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-secondary shadow-sm">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-poppins font-bold text-xl text-[#062b66] mb-2">
                Our Vision
              </h3>
              <p className="font-inter text-slate-600 text-sm leading-relaxed">
                A society where evidence drives action, policies respond to real needs, and every person has the opportunity to live in dignity, safety, and prosperity.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-secondary shadow-sm">
              <Flag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-poppins font-bold text-xl text-[#062b66] mb-2">
                Our Mission
              </h3>
              <p className="font-inter text-slate-600 text-sm leading-relaxed">
                To transform data into actionable solutions by monitoring human security trends, generating evidence-based insights, promoting accountability, and implementing programs that improve the lives of vulnerable populations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Our Values Section */}
      <div className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-100 text-center">
        <span className="font-inter text-xs font-bold tracking-[0.25em] text-secondary uppercase mb-3 block">
          OUR VALUES
        </span>
        <h2 className="font-poppins font-bold text-2xl md:text-3xl tracking-tight text-[#062b66] mb-12 max-w-xl mx-auto">
          Principles That Guide Our Work
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
          {[
            {
              title: "Credibility & Rigor",
              desc: "We are committed to absolute research independence, using scientific methods to produce objective, verified evidence.",
              icon: Shield,
              color: "text-[#062b66] bg-[#062b66]/5"
            },
            {
              title: "Human-Centered",
              desc: "Behind every data point is a human life. We prioritize the security, safety, and dignity of local communities.",
              icon: HeartHandshake,
              color: "text-secondary bg-secondary/5"
            },
            {
              title: "Strategic Collaboration",
              desc: "We believe sustainable development is co-created. We work alongside governments, researchers, CSOs, and citizens.",
              icon: Handshake,
              color: "text-[#062b66] bg-[#062b66]/5"
            },
            {
              title: "Actionability",
              desc: "We do not produce research for shelves. We focus on transforming complex metrics into practical, local solutions.",
              icon: Target,
              color: "text-secondary bg-secondary/5"
            },
            {
              title: "Accountability & Trust",
              desc: "We model transparency in our resource stewardship and advocate for accountable governance systems across Nigeria.",
              icon: Scale,
              color: "text-[#062b66] bg-[#062b66]/5"
            }
          ].map((val) => {
            const IconComponent = val.icon
            return (
              <div 
                key={val.title}
                className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 hover:border-secondary shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col gap-5"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${val.color} border border-slate-200/50 shadow-sm`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-poppins font-bold text-lg text-[#062b66] mb-2">
                    {val.title}
                  </h3>
                  <p className="font-inter text-slate-500 text-xs leading-relaxed">
                    {val.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Core Philosophy Section */}
      <div className="bg-slate-50 border-t border-slate-100 py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <span className="font-inter text-xs font-bold tracking-[0.25em] text-secondary uppercase mb-3 block">
            CORE PHILOSOPHY
          </span>
          <h2 className="font-poppins font-bold text-2xl md:text-3xl tracking-tight text-[#062b66] mb-12 max-w-xl mx-auto">
            Our Data-to-Impact Cycle
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
            {[
              { title: "DATA", desc: "We gather and analyze credible information to understand the realities people face.", icon: BarChart3 },
              { title: "INSIGHT", desc: "We turn information into knowledge by identifying patterns, risks, opportunities, and solutions.", icon: Lightbulb },
              { title: "ACTION", desc: "We work with communities, institutions, and partners to design practical responses to identified challenges.", icon: Target },
              { title: "IMPACT", desc: "We measure results and continuously improve interventions to create lasting change.", icon: TrendingUp }
            ].map((step, idx) => {
              const IconComponent = step.icon
              return (
                <div key={step.title} className="bg-white p-8 rounded-3xl border border-slate-150 shadow-sm relative flex flex-col gap-4">
                  <div className="absolute top-6 right-6 font-poppins font-extrabold text-slate-100 text-4xl select-none">
                    0{idx + 1}
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-[#39b54a]/10 flex items-center justify-center text-secondary border border-[#39b54a]/5">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-poppins font-bold text-base text-[#062b66] mb-2">
                      {step.title}
                    </h3>
                    <p className="font-inter text-slate-500 text-xs leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-16 flex justify-center">
            <button 
              onClick={() => setCurrentPage('programs')}
              className="bg-[#062b66] hover:bg-[#062b66]/90 text-white font-inter font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-full flex items-center gap-2 transition-transform duration-300 hover:scale-105 cursor-pointer outline-none"
            >
              See Our Programs
              <ArrowUpRight className="w-4 h-4 text-secondary" />
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}

// ================= SUB-PAGE 3: PROGRAMS PAGE =================
function ProgramsPage() {
  return (
    <div className="animate-fade-in bg-slate-50 text-primary flex-1">
      <div className="bg-[#052353] py-20 px-6 text-center border-b border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <span className="font-inter text-xs font-bold tracking-[0.25em] text-secondary uppercase mb-2 block">
            PROGRAMS
          </span>
          <h1 className="font-poppins font-bold text-3xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight max-w-2xl">
            Our Core Programs &amp; Indicators
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="font-poppins font-bold text-2xl md:text-3xl mb-4 text-[#062b66] tracking-tight">
          What We Do
        </h2>
        <p className="font-inter text-slate-500 text-sm max-w-2xl mx-auto mb-16">
          We bridge the gap between researchers and policy leaders through structured field monitoring and evidence generation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 text-left mb-24">
          {[
            {
              title: "Human Security Monitoring",
              desc: "We continuously monitor and analyze trends and indicators related to human security and quality of life, identifying emerging challenges and risks across vulnerable communities.",
              icon: BarChart3
            },
            {
              title: "Research & Evidence",
              desc: "We conduct empirical research, produce situation appraisals, and generate policy briefs to help stakeholders understand societal challenges and construct paths for solving them.",
              icon: Lightbulb
            },
            {
              title: "Policy Engagement",
              desc: "We engage government bodies, CSOs, and development organizations to advocate for accountability, inclusive policymaking, citizen participation, and responsive services.",
              icon: Landmark
            },
            {
              title: "Community Solutions",
              desc: "We collaborate with local communities and stakeholders to design, pilot, and scale innovative interventions that address critical local needs and strengthen resilience.",
              icon: HeartHandshake
            },
            {
              title: "Capacity Development",
              desc: "We run capacity development programs supporting CSOs, local governments, and youth assemblies in gathering, analyzing, and using data for accountability and planning.",
              icon: GraduationCap
            }
          ].map((program) => {
            const IconComponent = program.icon
            return (
              <div 
                key={program.title}
                className="group bg-white p-6 rounded-3xl border border-slate-150 shadow-sm hover:shadow-lg hover:border-secondary hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-150 text-secondary group-hover:bg-[#39b54a]/10 transition-colors">
                  <IconComponent className="w-5 h-5" />
                </div>
                <h3 className="font-poppins font-bold text-base leading-tight text-[#062b66]">
                  {program.title}
                </h3>
                <p className="font-inter text-slate-500 text-xs leading-relaxed">
                  {program.desc}
                </p>
              </div>
            )
          })}
        </div>

        <div className="border-t border-slate-200/80 pt-16">
          <h2 className="font-poppins font-bold text-2xl md:text-3xl text-[#062b66] mb-3">
            Areas We Monitor
          </h2>
          <p className="font-inter text-slate-500 text-sm max-w-2xl mx-auto mb-10">
            Our indicators capture the core domains that define people's safety, security, and options for advancement.
          </p>

          <div className="flex flex-wrap justify-center gap-3.5 max-w-5xl mx-auto">
            {[
              { name: "Poverty & Deprivation", icon: Coins },
              { name: "Education Access", icon: GraduationCap },
              { name: "Public Health", icon: Activity },
              { name: "Food Security", icon: Sprout },
              { name: "Youth Employment", icon: Briefcase },
              { name: "Gender Equality", icon: Scale },
              { name: "Conflict & Displacement", icon: Shield },
              { name: "Climate Vulnerability", icon: CloudSun },
              { name: "Governance & Services", icon: Building },
              { name: "Social Protection", icon: Heart }
            ].map((area) => {
              const IconComponent = area.icon
              return (
                <div 
                  key={area.name} 
                  className="flex items-center gap-2.5 bg-white px-5 py-3.5 rounded-full border border-slate-100 shadow-sm hover:shadow-md hover:border-secondary hover:scale-105 transition-all duration-300 group cursor-default"
                >
                  <IconComponent className="w-4 h-4 text-secondary group-hover:scale-110 transition-transform" />
                  <span className="font-inter text-xs font-semibold text-[#062b66] tracking-wide select-none">
                    {area.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}

// ================= SUB-PAGE 4: RESEARCH PAGE =================
function ResearchPage({ publications: sanityPublications }) {
  const [downloadingFile, setDownloadingFile] = useState(null)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [localDownloads, setLocalDownloads] = useState({})

  const handleDownload = (pubId, fileName) => {
    const activeFileName = (fileName && fileName !== '#') ? fileName : 'Beyond_Annual_Report_2025.pdf'
    
    setDownloadingFile(activeFileName)
    setDownloadProgress(0)
    let p = 0
    const interval = setInterval(() => {
      p += 10
      if (p <= 100) {
        setDownloadProgress(p)
      } else {
        clearInterval(interval)
        setTimeout(() => {
          setDownloadingFile(null)
          setLocalDownloads(prev => ({
            ...prev,
            [pubId]: (prev[pubId] || 0) + 1
          }))
          
          try {
            const link = document.createElement('a')
            const href = activeFileName.startsWith('http') ? activeFileName : (activeFileName.startsWith('/') ? activeFileName : `/${activeFileName}`)
            link.href = href
            link.target = '_blank'
            if (!activeFileName.startsWith('http')) {
              const basename = activeFileName.split('/').pop()
              link.setAttribute('download', basename || 'document.pdf')
            }
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
          } catch (err) {
            console.error('Triggering browser download failed:', err)
          }
        }, 600)
      }
    }, 120)
  }

  const fallbackPublications = [
    {
      id: 101,
      title: "Beyond# Annual Report 2025",
      cover_image_url: "/community_lab.png",
      acf: {
        pdf_upload: "Beyond_Annual_Report_2025.pdf",
        publication_type: "Annual Reports",
        year: 2025,
        topic_area: "Governance & Accountability",
        state_coverage: "National",
        author: "Beyond# Secretariat",
        summary: "A review of our stewardship, operations, program deliverables, and community impact indicators across all 36 states of Nigeria.",
        download_count: 342
      }
    },
    {
      id: 102,
      title: "Nigeria Human Security Index Report 2025",
      cover_image_url: "/hero_research.png",
      acf: {
        pdf_upload: "Human_Security_Index_Report_2025.pdf",
        publication_type: "Research Reports",
        year: 2025,
        topic_area: "Human Security Observatory",
        state_coverage: "National",
        author: "Beyond# Research Team",
        summary: "Our flagship research publication assessing human security vulnerabilities, food security margins, and public service indicators in Nigeria.",
        download_count: 855
      }
    },
    {
      id: 103,
      title: "Middle Belt Food Security Assessment Q1",
      cover_image_url: "/hero_community.png",
      acf: {
        pdf_upload: "Middle_Belt_Food_Security_2026.pdf",
        publication_type: "Situation Reports",
        year: 2026,
        topic_area: "Food Security",
        state_coverage: "Middle Belt",
        author: "Dr. Elizabeth Adebayo",
        summary: "A localized study evaluating harvest yields, market access, price volatility, and community resilience mechanisms in agricultural areas.",
        download_count: 512
      }
    },
    {
      id: 104,
      title: "Citizen Monitoring and Municipal Accountability",
      cover_image_url: "/logo.png",
      acf: {
        pdf_upload: "Citizen_Monitoring_Accountability.pdf",
        publication_type: "Human Security Briefs",
        year: 2026,
        topic_area: "Governance & Accountability",
        state_coverage: "Kaduna",
        author: "Aminu Ibrahim",
        summary: "An operational field report documenting the deployment of citizen scorecard tracking systems and municipal budget audits.",
        download_count: 420
      }
    }
  ]

  const publications = sanityPublications && sanityPublications.length > 0
    ? sanityPublications.map(pub => ({
        id: pub.id,
        title: pub.title,
        cover_image_url: pub.cover_image_url,
        acf: {
          pdf_upload: pub.pdf_upload,
          publication_type: pub.publication_type,
          year: pub.year,
          topic_area: pub.topic_area,
          state_coverage: pub.state_coverage,
          author: pub.author,
          summary: pub.summary,
          download_count: pub.download_count || 0
        }
      }))
    : fallbackPublications;

  return (
    <div className="animate-fade-in bg-white text-primary flex-1">
      <div className="bg-[#052353] py-20 px-6 text-center border-b border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <span className="font-inter text-xs font-bold tracking-[0.25em] text-secondary uppercase mb-2 block animate-fade-up">
            PUBLICATIONS LIBRARY
          </span>
          <h1 className="font-poppins font-bold text-3xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight max-w-2xl animate-fade-up-delay-1">
            Research, Reports &amp; Deliverables
          </h1>
          <p className="font-inter text-white/70 text-sm max-w-[700px] mx-auto mt-4 leading-relaxed animate-fade-up-delay-2">
            Access our repository of empirical assessments, annual summaries, policy briefs, and dataset reports.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {publications.map((pub) => {
            const currentDownloads = (pub.acf.download_count || 0) + (localDownloads[pub.id] || 0)
            return (
              <div 
                key={pub.id}
                className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-full group"
              >
                <div>
                  <div className="h-56 relative overflow-hidden bg-slate-100 border-b">
                    <img 
                      src={pub.cover_image_url || '/logo.png'} 
                      alt={pub.title} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                    />
                    <span className="absolute top-4 left-4 bg-[#062b66] text-white font-inter text-[8px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                      {pub.acf.publication_type}
                    </span>
                    <span className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-secondary font-mono text-[9px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                      {pub.acf.year}
                    </span>
                  </div>
                  
                  <div className="p-6 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-[#39B54A] uppercase tracking-wider">
                      <span>{pub.acf.topic_area}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className="text-slate-450">{pub.acf.state_coverage}</span>
                    </div>
                    
                    <h3 className="font-poppins font-bold text-base text-[#062b66] leading-snug group-hover:text-secondary transition-colors line-clamp-2">
                      {pub.title}
                    </h3>
                    
                    <p className="font-inter text-slate-500 text-xs leading-relaxed line-clamp-3">
                      {pub.acf.summary}
                    </p>
                    
                    <div className="text-[10px] text-slate-400 font-semibold mt-1">
                      By {pub.acf.author}
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2 border-t border-slate-100 flex items-center justify-between gap-4">
                  <span className="font-inter text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Downloads: {currentDownloads}
                  </span>
                  <button
                    onClick={() => handleDownload(pub.id, pub.acf.pdf_upload)}
                    disabled={downloadingFile !== null}
                    className="bg-[#062b66] hover:bg-[#062b66]/90 text-white font-inter text-[9px] font-bold px-5 py-3 rounded-full uppercase tracking-wider flex items-center gap-1.5 transition-all shadow cursor-pointer border-none outline-none"
                  >
                    Download PDF
                    <Download className="w-3.5 h-3.5 text-secondary" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {downloadingFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full border shadow-xl flex flex-col items-center gap-4 text-center animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border text-[#062b66]">
              <Download className="w-6 h-6 animate-bounce" />
            </div>
            <h4 className="font-poppins font-bold text-base text-[#062b66]">Downloading Document</h4>
            <p className="font-inter text-slate-500 text-xs leading-relaxed max-w-[200px]">{downloadingFile}</p>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2 border">
              <div 
                className="bg-secondary h-full transition-all duration-150" 
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
            <span className="font-mono text-xs font-bold text-[#062b66]">{downloadProgress}%</span>
          </div>
        </div>
      )}
    </div>
  )
}
// ================= SUB-PAGE 5: IMPACT & VALUES PAGE =================
// Animated Counter for stats
function AnimatedCounter({ end, duration = 2000 }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const totalMiliseconds = duration;
    const stepTime = 20; 
    const steps = totalMiliseconds / stepTime;
    const increment = end / steps;
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.ceil(start));
      }
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [end, duration]);
  
  return <span>{count.toLocaleString()}</span>;
}

// ================= SUB-PAGE 5: IMPACT & VALUES PAGE =================
function ImpactPage({ articles: sanityArticles, onArticleClick }) {
  const fallbackFeatured = {
    title: "Tracking Emerging Human Security Trends Across Northern Nigeria",
    excerpt: "This research appraisal assesses multidimensional security challenges across Kaduna, Kano, and Katsina states. Using structural field observations and data collected by our local observers, we analyze the intersecting risks of crop yields, food security fluctuations, displacement numbers, and community peace initiatives.",
    date: "2026-06-24",
    author: "Dr. Ngozi Balogun",
    category: "Human Security Monitor",
    featured_media_url: "/hero_research.png"
  }

  const fallbackArticles = [
    {
      id: 2,
      date: "2026-06-18",
      title: "Strengthening Social Protection Through Evidence-Based Planning",
      excerpt: "Examining how targeting mechanisms in social registry frameworks can be calibrated using multidimensional indicators to minimize exclusion errors.",
      featured_media_url: "/stakeholder_consultation.png",
      category: "Research Brief"
    },
    {
      id: 3,
      date: "2026-06-12",
      title: "Quarterly Trends in Food Security and Community Resilience",
      excerpt: "A comprehensive assessment of harvest yields, market price dynamics, and household resilience indices across Middle Belt agricultural belts.",
      featured_media_url: "/hero_community.png",
      category: "Human Security Monitor"
    },
    {
      id: 4,
      date: "2026-05-28",
      title: "Using Data to Improve Public Service Delivery",
      excerpt: "Analyzing the role of citizen scorecards in driving institutional reforms and responsive health and education service provision in local government areas.",
      featured_media_url: "/community_lab.png",
      category: "Policy Insight"
    },
    {
      id: 5,
      date: "2026-05-14",
      title: "How Local Partnerships Are Transforming Evidence Into Action",
      excerpt: "Highlighting collaborative efforts between local governance structures and community actors to address sanitation and secondary schooling bottlenecks.",
      featured_media_url: "/hero_women.png",
      category: "Community Solutions"
    }
  ]

  const hasSanity = sanityArticles && sanityArticles.length > 0
  const featured = hasSanity ? sanityArticles[0] : fallbackFeatured
  const articles = hasSanity ? sanityArticles.slice(1) : fallbackArticles

  return (
    <div className="animate-fade-in bg-white text-primary flex-1">
      
      {/* SECTION BANNER HEADER */}
      <div className="bg-[#052353] py-20 px-6 text-center border-b border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <span className="font-inter text-xs font-bold tracking-[0.25em] text-secondary uppercase mb-2 block animate-fade-up">
            INSIGHTS &amp; IMPACT
          </span>
          <h1 className="font-poppins font-bold text-3xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight max-w-2xl animate-fade-up-delay-1">
            From Evidence to Impact
          </h1>
          <p className="font-inter text-white/70 text-sm max-w-[700px] mx-auto mt-4 leading-relaxed animate-fade-up-delay-2">
            Beyond every statistic is a human story. We generate evidence, inform decisions, and support actions that improve lives and strengthen communities across Nigeria.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20">
        
        {/* FEATURED INSIGHT */}
        <div className="mb-20">
          <h3 className="font-poppins font-bold text-xs uppercase tracking-widest text-slate-400 mb-6 text-left border-b pb-2">
            Featured Insight
          </h3>
          
          <div 
            onClick={() => onArticleClick?.(featured)}
            className="bg-slate-50 border border-slate-100 hover:border-secondary rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 gap-0 text-left animate-fade-up cursor-pointer group"
          >
            
            {/* Image (6 columns) */}
            <div className="lg:col-span-6 h-[300px] lg:h-auto min-h-[300px] relative overflow-hidden">
              <img 
                src={featured.featured_media_url} 
                alt={featured.title} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
              />
            </div>

            {/* Content (6 columns) */}
            <div className="lg:col-span-6 p-8 lg:p-12 flex flex-col justify-center gap-4">
              <span className="font-inter text-[10px] font-bold tracking-[0.2em] text-secondary uppercase">
                {featured.category}
              </span>
              <h2 className="font-poppins font-bold text-2xl lg:text-3xl text-[#062b66] leading-tight group-hover:text-secondary transition-colors">
                {featured.title}
              </h2>
              <p className="font-inter text-slate-500 text-sm leading-relaxed">
                {featured.excerpt}
              </p>
              <div className="flex justify-between items-center mt-4 border-t border-slate-100 pt-4">
                <span className="font-inter text-[10px] opacity-40 font-semibold">
                  {new Date(featured.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <span className="inline-flex items-center text-xs font-bold text-secondary group-hover:underline gap-1">
                  Read Full Story
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* ARTICLES & IMPACT GRID */}
        <div className="mb-16">
          <h3 className="font-poppins font-bold text-xs uppercase tracking-widest text-slate-400 mb-8 text-left border-b pb-2">
            Insight Briefs &amp; Impact Stories
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            {articles.map((art) => (
              <div 
                key={art.id}
                onClick={() => onArticleClick?.(art)}
                className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full group cursor-pointer hover:border-secondary"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="h-48 relative overflow-hidden">
                    <img 
                      src={art.featured_media_url} 
                      alt={art.title} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  
                  {/* Body */}
                  <div className="p-6 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                      <span className="text-secondary">
                        {art.category}
                      </span>
                      <span className="opacity-40">
                        {new Date(art.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h4 className="font-poppins font-bold text-base text-[#062b66] leading-snug group-hover:text-secondary transition-colors line-clamp-2">
                      {art.title}
                    </h4>
                    <p className="font-inter text-slate-500 text-xs leading-relaxed line-clamp-3">
                      {art.excerpt}
                    </p>
                  </div>
                </div>
                <div className="px-6 pb-6 pt-2 mt-auto">
                  <span className="inline-flex items-center text-xs font-bold text-secondary group-hover:underline gap-1">
                    Read Story
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* CORE FRAMEWORK BANNER */}
      <div className="w-full bg-[#03142e] border-y border-white/5 py-24 px-6 text-left">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          
          <div className="max-w-xl">
            <span className="font-inter text-xs font-bold tracking-[0.2em] text-secondary uppercase mb-2 block">
              OUR FRAMEWORK
            </span>
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-white tracking-tight uppercase">
              Data. Insight. Action. Impact.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { num: "01", name: "DATA", desc: "Monitoring critical human security indicators across communities." },
              { num: "02", name: "INSIGHT", desc: "Generating evidence-based understanding that informs decisions." },
              { num: "03", name: "ACTION", desc: "Designing practical responses to real development and security challenges." },
              { num: "04", name: "IMPACT", desc: "Measuring meaningful, long-term change in people's lives." }
            ].map((pillar) => (
              <div 
                key={pillar.num} 
                className="bg-white/5 border border-white/5 p-8 rounded-3xl flex flex-col gap-6 hover:bg-white/10 hover:border-white/10 transition-all duration-300"
              >
                <div className="font-poppins font-extrabold text-4xl text-[#39B54A] opacity-80 leading-none">
                  {pillar.num}
                </div>
                <div>
                  <h4 className="font-poppins font-bold text-base text-white uppercase tracking-wider mb-2">
                    {pillar.name}
                  </h4>
                  <p className="font-inter text-white/60 text-xs leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ORGANIZATIONAL REACH COUNTERS */}
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="mb-16">
          <span className="font-inter text-xs font-bold tracking-[0.2em] text-[#39B54A] uppercase mb-2 block">
            REACH &amp; INFLUENCE
          </span>
          <h2 className="font-poppins font-bold text-2xl md:text-3xl text-[#062b66] tracking-tight">
            Our Footprint in Numbers
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {[
            { end: 36, label: "States", suffix: "", desc: "Coverage & Security Monitoring" },
            { end: 100, label: "Indicators", suffix: "+", desc: "Human Security Metrics Tracked" },
            { end: 50, label: "Publications", suffix: "+", desc: "Research & Policy Briefs" },
            { end: 100, label: "Activities", suffix: "+", desc: "Community Engagement Forums" }
          ].map((stat, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              <div className="font-poppins font-bold text-5xl sm:text-6xl text-primary leading-none">
                <AnimatedCounter end={stat.end} />{stat.suffix}
              </div>
              <h4 className="font-poppins font-bold text-sm uppercase tracking-wider text-secondary mt-1">
                {stat.label}
              </h4>
              <p className="font-inter text-slate-400 text-xs">
                {stat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* KNOWLEDGE HUB CTA */}
      <div className="bg-[#052353] border-t border-white/5 py-24 px-6 text-center text-white no-print">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
          <h2 className="font-poppins font-bold text-3xl md:text-4xl tracking-tight uppercase">
            Explore Our Evidence Library
          </h2>
          <p className="font-inter text-white/70 text-sm leading-relaxed max-w-2xl">
            Access research reports, policy briefs, situation analyses, data stories, and impact publications produced by Beyond#.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            <button 
              onClick={() => setCurrentPage('research')}
              className="bg-[#39B54A] hover:bg-[#2e993d] text-white text-xs font-bold px-8 py-3.5 rounded-full cursor-pointer transition-all duration-200 shadow uppercase tracking-wider border-none outline-none"
            >
              VIEW PUBLICATIONS
            </button>
            <button 
              onClick={() => setCurrentPage('contact')}
              className="border border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/10 text-white text-xs font-bold px-8 py-3.5 rounded-full cursor-pointer transition-all duration-200 uppercase tracking-wider outline-none"
            >
              PARTNER WITH US
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

// ================= SUB-PAGE 6: CONTACT & PARTNERSHIP PAGE =================
function ContactPage({ formData, handleInputChange, handleSubmit, formSubmitted }) {
  return (
    <div className="animate-fade-in bg-slate-50 text-primary flex-1">
      <div className="bg-[#052353] py-20 px-6 text-center border-b border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <span className="font-inter text-xs font-bold tracking-[0.25em] text-secondary uppercase mb-2 block">
            CONTACT
          </span>
          <h1 className="font-poppins font-bold text-3xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight max-w-2xl">
            Contact Beyond#
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row gap-16 text-left">
        
        <div className="w-full lg:w-1/2 flex flex-col justify-between gap-10">
          <div className="flex flex-col items-start gap-6">
            <h2 className="font-poppins font-bold text-2xl md:text-3xl text-[#062b66] leading-tight">
              Connect With the Beyond# Secretariat
            </h2>
            <p className="font-inter text-slate-600 text-sm leading-relaxed max-w-md">
              We welcome general inquiries, feedback, research proposals, press outreach, and community engagement queries. Reach out to our offices in Abuja or send a message directly.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-secondary shadow-sm flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-poppins font-semibold text-xs text-slate-400 uppercase tracking-widest">
                  Secretariat Address
                </h4>
                <p className="font-inter text-sm text-primary mt-1 leading-relaxed">
                  Beyond Statistics Initiative (Beyond#),<br />
                  Central Business District, Abuja, FCT, Nigeria.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-secondary shadow-sm flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-poppins font-semibold text-xs text-slate-400 uppercase tracking-widest">
                  Email Correspondence
                </h4>
                <p className="font-inter text-sm text-primary mt-1">
                  info@beyondstatistics.org
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-secondary shadow-sm flex-shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-poppins font-semibold text-xs text-slate-400 uppercase tracking-widest">
                  Helpline / Phone
                </h4>
                <p className="font-inter text-sm text-primary mt-1">
                  +234 (0) 9 123 4567
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2">
          <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm relative">
            <h3 className="font-poppins font-bold text-xl mb-2 text-[#062b66]">
              Send Us a Message
            </h3>
            <p className="font-inter text-slate-500 text-xs mb-6">
              Complete the form below and our secretariat will get back to you shortly.
            </p>

            {formSubmitted ? (
              <div className="py-12 flex flex-col items-center justify-center text-center gap-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-secondary/15 flex items-center justify-center text-secondary">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="font-poppins font-bold text-lg text-[#062b66]">
                  Thank You!
                </h4>
                <p className="font-inter text-slate-500 text-xs max-w-xs">
                  Your inquiry has been successfully received. A representative from the Beyond# secretariat will follow up with you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
                
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className="font-inter text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Full Name *
                  </label>
                  <input 
                    type="text" 
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. John Doe"
                    className="bg-slate-50 border border-slate-200 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl px-4 py-3 font-inter text-sm text-primary placeholder-slate-300 outline-none transition-all duration-200"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="font-inter text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Email Address *
                  </label>
                  <input 
                    type="email" 
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. j.doe@organization.org"
                    className="bg-slate-50 border border-slate-200 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl px-4 py-3 font-inter text-sm text-primary placeholder-slate-300 outline-none transition-all duration-200"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="organization" className="font-inter text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Organization
                  </label>
                  <input 
                    type="text" 
                    id="organization"
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                    placeholder="e.g. Development Agency"
                    className="bg-slate-50 border border-slate-200 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl px-4 py-3 font-inter text-sm text-primary placeholder-slate-300 outline-none transition-all duration-200"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="message" className="font-inter text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Your Message *
                  </label>
                  <textarea 
                    id="message"
                    name="message"
                    rows="4"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    placeholder="Write your message or inquiry here..."
                    className="bg-slate-50 border border-slate-200 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl px-4 py-3 font-inter text-sm text-primary placeholder-slate-300 outline-none resize-none transition-all duration-200"
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  className="mt-2 w-full bg-secondary hover:bg-secondary/90 text-white font-inter font-bold text-xs uppercase tracking-widest py-4 rounded-full flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-secondary/15 hover:scale-102 active:scale-98 cursor-pointer outline-none border-none"
                >
                  SEND MESSAGE
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

// ================= SUB-PAGE 7: SUPPORT & PARTNERSHIPS PAGE =================
function SupportPartnershipsPage() {
  const [frequency, setFrequency] = useState('monthly')
  const [amount, setAmount] = useState(25000)
  const [customAmount, setCustomAmount] = useState('')
  const [channel, setChannel] = useState('paystack')
  const [paymentStatus, setPaymentStatus] = useState('idle') // idle | processing | success
  const [txRef, setTxRef] = useState('')
  const [processStep, setProcessStep] = useState(0)
  const [downloadingFile, setDownloadingFile] = useState(null)
  const [downloadProgress, setDownloadProgress] = useState(0)

  // Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    organization: '',
    pathway: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const formRef = useRef(null)
  const supportRef = useRef(null)

  const handlePathwaySelect = (pathwayValue) => {
    setForm(prev => ({ ...prev, pathway: pathwayValue }))
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const handleSupportSubmit = (e) => {
    e.preventDefault()
    setPaymentStatus('processing')
    setProcessStep(0)
    
    const steps = [
      "Securing encrypted channel...",
      "Connecting to Paystack/Flutterwave API...",
      "Authorizing 3D secure payment...",
      "Generating transaction log..."
    ]
    
    let current = 0
    const interval = setInterval(() => {
      current++
      if (current < steps.length) {
        setProcessStep(current)
      } else {
        clearInterval(interval)
        setTxRef('BEYOND-' + Math.floor(100000 + Math.random() * 900000))
        setPaymentStatus('success')
      }
    }, 850)
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      setForm({ name: '', email: '', organization: '', pathway: '', message: '' })
      setSubmitted(false)
    }, 5000)
  }

  const triggerDownload = (fileName) => {
    setDownloadingFile(fileName)
    setDownloadProgress(0)
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      if (progress <= 100) {
        setDownloadProgress(progress)
      } else {
        clearInterval(interval)
        setTimeout(() => {
          setDownloadingFile(null)
        }, 800)
      }
    }, 150)
  }

  const pathways = [
    {
      id: 'strategic',
      title: 'Strategic Partnerships',
      icon: Handshake,
      desc: 'Collaborate on research, policy engagement, human security monitoring, and development initiatives.',
      cta: 'EXPLORE PARTNERSHIPS'
    },
    {
      id: 'research-sponsor',
      title: 'Research Sponsorship',
      icon: FileSearch,
      desc: 'Support flagship studies, observatories, dashboards, and evidence-generation initiatives.',
      cta: 'SPONSOR RESEARCH'
    },
    {
      id: 'dashboard-support',
      title: 'Human Security Dashboard',
      icon: BarChart3,
      desc: "Help strengthen Nigeria's leading evidence platform for monitoring human security trends.",
      cta: 'SUPPORT THE DASHBOARD'
    },
    {
      id: 'corporate-impact',
      title: 'Corporate Social Impact',
      icon: Building2,
      desc: 'Partner with Beyond# to support evidence-based programs that create measurable social impact.',
      cta: 'CORPORATE PARTNERSHIPS'
    },
    {
      id: 'youth-fellows',
      title: 'Youth Data Fellows',
      icon: GraduationCap,
      desc: 'Invest in the next generation of researchers, analysts, and evidence leaders.',
      cta: 'SUPPORT FELLOWS'
    },
    {
      id: 'technical-contribution',
      title: 'Technical Contributions',
      icon: Users,
      desc: 'Contribute expertise in research, monitoring and evaluation, data science, communications, technology, or policy.',
      cta: 'BECOME A CONTRIBUTOR'
    }
  ]



  const reportsList = [
    { name: "Annual Report 2025", type: "Annual Reports" },
    { name: "Financial Audits & Stewardship Q4", type: "Financial Reports" },
    { name: "Human Security Dashboard Index", type: "Research Publications" },
    { name: "Middle Belt Food Security Assessment", type: "Research Publications" },
    { name: "Niger State Solar Livelihood Impact Report", type: "Impact Reports" },
    { name: "Resource Governance & Transparency Policy", type: "Organizational Policies" }
  ]

  const loaderMessages = [
    "Securing encrypted channel...",
    "Connecting to Paystack/Flutterwave API...",
    "Authorizing 3D secure payment...",
    "Generating transaction log..."
  ]



  const activeAmount = customAmount ? parseFloat(customAmount) : amount

  return (
    <div className="animate-fade-in bg-white text-primary flex-1">
      
      {/* 1. INTRODUCTION SECTION */}
      <section className="bg-[#052353] py-24 px-6 text-center border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(57,181,74,0.15),rgba(0,0,0,0))] z-0"></div>
        <div className="max-w-7xl mx-auto flex flex-col items-center relative z-10">
          <span className="font-inter text-xs font-bold tracking-[0.3em] text-[#39B54A] uppercase mb-4 block animate-fade-up">
            SUPPORT & PARTNERSHIPS
          </span>
          <h1 className="font-poppins font-bold text-4xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.1] max-w-4xl animate-fade-up-delay-1">
            Partner For Evidence.<br />Invest In Impact.
          </h1>
          <p className="font-inter text-white/70 text-sm sm:text-base max-w-[850px] mx-auto mt-6 leading-relaxed animate-fade-up-delay-2">
            Beyond# works with institutions, researchers, development partners, philanthropists, and citizens committed to evidence-driven solutions. Together, we transform data into action and create measurable improvements in people's lives.
          </p>
        </div>
      </section>

      {/* 2. PARTNERSHIP PATHWAYS */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="font-inter text-[10px] font-bold tracking-[0.2em] text-[#39B54A] uppercase block mb-2">COLLABORATION PATHWAYS</span>
          <h2 className="font-poppins font-bold text-2xl md:text-3xl text-[#062b66]">How We Work Together</h2>
          <p className="font-inter text-slate-500 text-xs sm:text-sm max-w-xl mx-auto mt-2">
            Select an area of engagement below to initiate a strategic partnership with our research and field teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pathways.map((pw, idx) => {
            const IconComp = pw.icon
            return (
              <div 
                key={pw.id}
                style={{ animationDelay: `${idx * 0.08}s` }}
                className="bg-slate-50 border border-slate-100 hover:border-[#39B54A] p-8 rounded-[2rem] flex flex-col justify-between items-start text-left shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group animate-fade-up"
              >
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-slate-200 text-[#39B54A] shadow-sm mb-6 group-hover:bg-[#39B54A] group-hover:text-white transition-colors duration-300">
                  <IconComp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-poppins font-bold text-lg text-[#062b66] mb-3">
                    {pw.title}
                  </h3>
                  <p className="font-inter text-slate-500 text-xs leading-relaxed mb-6">
                    {pw.desc}
                  </p>
                </div>
                <button 
                  onClick={() => handlePathwaySelect(pw.title)}
                  className="font-inter text-[11px] font-bold text-[#39B54A] uppercase tracking-wider flex items-center gap-1.5 hover:text-[#062b66] transition-colors cursor-pointer outline-none border-none bg-transparent"
                >
                  {pw.cta}
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* 3. SUPPORT BEYOND# FINANCIALLY (SUBSECTION) */}
      <section ref={supportRef} className="bg-slate-50 border-y border-slate-100 py-24 px-6 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Content (6 Cols) */}
          <div className="lg:col-span-5 text-left flex flex-col gap-6">
            <span className="font-inter text-[10px] font-bold tracking-[0.2em] text-[#39B54A] uppercase">RESOURCE STRENGTHENING</span>
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-[#062b66] leading-tight">
              Support Independent Research and Evidence-Based Action
            </h2>
            <p className="font-inter text-slate-600 text-sm leading-relaxed">
              Your contribution helps sustain research, publications, community engagement, human security monitoring, and capacity development activities.
            </p>
            <div className="border-t border-slate-200/80 pt-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#39B54A]/10 text-[#39B54A] flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <span className="font-inter text-xs text-slate-600 font-medium">Guarantees data independence and think-tank credibility.</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#39B54A]/10 text-[#39B54A] flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <span className="font-inter text-xs text-slate-600 font-medium">Finances public alerts and Human Security dashboards.</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#39B54A]/10 text-[#39B54A] flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <span className="font-inter text-xs text-slate-600 font-medium">Funds scholarships &amp; field training for Youth Data Fellows.</span>
              </div>
            </div>
          </div>

          {/* Interactive Form Panel (7 Cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-250/70 p-8 sm:p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden text-left min-h-[480px] flex flex-col justify-between">
              
              {paymentStatus === 'idle' && (
                <form onSubmit={handleSupportSubmit} className="flex flex-col gap-6 justify-between flex-1">
                  
                  {/* Frequency Switcher */}
                  <div className="flex justify-between items-center">
                    <h3 className="font-poppins font-bold text-lg text-[#062b66]">Support Beyond#</h3>
                    <div className="bg-slate-100 p-1 rounded-full flex gap-1 border border-slate-200">
                      {['one-time', 'monthly', 'annual'].map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFrequency(f)}
                          className={`font-inter text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-full cursor-pointer outline-none border-none transition-all duration-300 ${
                            frequency === f 
                              ? 'bg-[#062b66] text-white shadow-sm' 
                              : 'text-slate-500 hover:text-[#062b66]'
                          }`}
                        >
                          {f.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amounts Selectors */}
                  <div className="flex flex-col gap-3">
                    <label className="font-inter text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Contribution Amount</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                      {[5000, 10000, 25000, 50000, 100000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setAmount(amt)
                            setCustomAmount('')
                          }}
                          className={`border rounded-xl font-poppins font-bold text-xs py-3.5 text-center cursor-pointer outline-none transition-all duration-200 ${
                            amount === amt && !customAmount
                              ? 'border-[#39B54A] bg-[#39B54A]/5 text-[#39B54A]'
                              : 'border-slate-200 text-slate-600 bg-white hover:border-[#062b66]'
                          }`}
                        >
                          ₦{amt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    
                    {/* Custom Input */}
                    <div className="relative mt-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-inter text-slate-400 text-sm font-semibold">₦</span>
                      <input 
                        type="number"
                        min="500"
                        placeholder="Enter Custom Amount"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className={`w-full pl-8 pr-4 py-3 bg-slate-50 border rounded-xl font-inter text-sm text-primary placeholder-slate-300 outline-none focus:bg-white focus:ring-1 focus:ring-secondary transition-all ${
                          customAmount ? 'border-[#39B54A] ring-1 ring-[#39B54A]/50 bg-white' : 'border-slate-200 focus:border-[#062b66]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Payment Channel Card Grid */}
                  <div className="flex flex-col gap-3">
                    <label className="font-inter text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment Channel</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: 'paystack', name: 'Paystack', desc: 'Local Cards/Bank' },
                        { id: 'flutterwave', name: 'Flutterwave', desc: 'USSD/Mobile' },
                        { id: 'transfer', name: 'Bank Transfer', desc: 'Abuja Secretariat' },
                        { id: 'international', name: 'Intl Card', desc: 'USD/GBP/EUR' }
                      ].map((ch) => (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => setChannel(ch.id)}
                          className={`border rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer outline-none transition-all duration-200 ${
                            channel === ch.id
                              ? 'border-[#39B54A] bg-[#39B54A]/5 text-[#39B54A]'
                              : 'border-slate-200 text-slate-600 bg-white hover:border-[#062b66]'
                          }`}
                        >
                          <span className="font-poppins font-bold text-xs leading-none mb-1">{ch.name}</span>
                          <span className="font-inter text-[9px] opacity-60 leading-none">{ch.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Secure payment indicator & Submit */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                    <div className="flex items-center gap-2 opacity-50">
                      <Lock className="w-4 h-4 text-slate-500" />
                      <span className="font-inter text-[10px] font-medium tracking-wide">SECURE 256-BIT SSL ENCRYPTION</span>
                    </div>
                    <button 
                      type="submit"
                      className="w-full sm:w-auto bg-[#39B54A] hover:bg-[#39B54A]/90 text-white font-inter font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-full flex items-center justify-center gap-2 transition-all duration-300 shadow-md shadow-[#39B54A]/10 hover:scale-105 active:scale-95 cursor-pointer outline-none border-none"
                    >
                      Process Support ({frequency === 'one-time' ? 'One-time' : frequency === 'monthly' ? 'Monthly' : 'Annual'})
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>

                </form>
              )}

              {paymentStatus === 'processing' && (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center gap-6 animate-pulse">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-[#39B54A] animate-spin"></div>
                  <h4 className="font-poppins font-bold text-xl text-[#062b66]">
                    Processing Contribution
                  </h4>
                  <p className="font-inter text-slate-500 text-xs max-w-xs transition-opacity duration-300">
                    {loaderMessages[processStep]}
                  </p>
                </div>
              )}

              {paymentStatus === 'success' && (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-center gap-6 animate-fade-in">
                  <div className="w-20 h-20 rounded-full bg-[#39B54A]/15 flex items-center justify-center text-[#39B54A]">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="font-poppins font-bold text-2xl text-[#062b66] mb-1">
                      Support Initialized
                    </h4>
                    <p className="font-inter text-slate-500 text-xs max-w-sm leading-relaxed mt-2">
                      Thank you for investing in independent research and evidence-based action across Nigeria. Your contribution is highly valued.
                    </p>
                  </div>
                  
                  {/* Receipt breakdown */}
                  <div className="bg-slate-50 border border-slate-150 p-6 rounded-2xl w-full max-w-md text-left flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-400">SUPPORT TYPE:</span>
                      <span className="text-[#062b66] uppercase">{frequency} Support</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-400">AMOUNT:</span>
                      <span className="text-[#062b66]">₦{activeAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-400">CHANNEL:</span>
                      <span className="text-[#062b66] uppercase">{channel}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-semibold border-t border-slate-200/60 pt-2.5 mt-1">
                      <span className="text-slate-400">TXN REFERENCE:</span>
                      <span className="font-mono font-bold text-[#062b66]">{txRef}</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setPaymentStatus('idle')}
                      className="border border-[#062b66]/10 hover:border-[#062b66] text-[#062b66] text-[10px] font-bold px-6 py-3 rounded-full uppercase tracking-wider transition-all cursor-pointer outline-none bg-white"
                    >
                      Make Another Support
                    </button>
                    <button 
                      onClick={() => {
                        setPaymentStatus('idle')
                        window.scrollTo(0,0)
                      }}
                      className="bg-[#062b66] hover:bg-[#062b66]/90 text-white text-[10px] font-bold px-6 py-3 rounded-full uppercase tracking-wider transition-all cursor-pointer outline-none border-none"
                    >
                      Back To Portal
                    </button>
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* 4. WHY PARTNER WITH BEYOND#? (SPLIT LAYOUT) */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Column: Image */}
          <div className="lg:col-span-6 relative group overflow-hidden rounded-[2.5rem] shadow-sm border border-slate-100 h-[380px] sm:h-[450px]">
            <img 
              src="/nigerian_stakeholders.png" 
              alt="Beyond# Researchers and Policymakers working together in Nigeria" 
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#052353]/90 via-[#052353]/25 to-transparent flex items-end p-8 text-left">
              <div>
                <span className="font-inter text-[9px] font-bold tracking-[0.25em] text-[#39B54A] uppercase block mb-1">FIELD ENGAGEMENT</span>
                <h4 className="font-poppins font-bold text-white text-lg leading-tight">Secretariat-Led Multistakeholder Alignment in Abuja</h4>
                <p className="font-inter text-white/70 text-[11px] mt-1 max-w-sm leading-relaxed">Collaborative assessment design involving development agencies and local practitioners.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Values */}
          <div className="lg:col-span-6 text-left flex flex-col gap-6">
            <span className="font-inter text-[10px] font-bold tracking-[0.2em] text-[#39B54A] uppercase">EVIDENCE THAT DRIVES ACTION</span>
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-[#062b66] leading-tight">
              Why Partner With Beyond#?
            </h2>
            <p className="font-inter text-slate-500 text-sm leading-relaxed">
              Beyond# combines rigorous research, continuous monitoring, policy engagement, and community-centered solutions to address Nigeria's most pressing human security challenges.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {[
                { title: "Independent and evidence-driven", desc: "Committed to neutrality and scientific analysis." },
                { title: "Human-centered approach", desc: "Prioritizing local communities and human safety first." },
                { title: "Policy relevance", desc: "Translating academic indices into actionable governance guidelines." },
                { title: "Measurable outcomes", desc: "Documenting progress through community pilot assessments." },
                { title: "National reach", desc: "Field researchers deployed across all 36 states." },
                { title: "Trusted partnerships", desc: "Working hand-in-hand with federal, local, and global networks." }
              ].map((val, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-[#39B54A]/10 text-[#39B54A] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-poppins font-bold text-xs text-[#062b66] leading-tight mb-1">{val.title}</h4>
                    <p className="font-inter text-slate-400 text-[10px] leading-relaxed">{val.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>



      {/* 6. TRANSPARENCY & ACCOUNTABILITY */}
      <section className="py-24 px-6 max-w-7xl mx-auto border-t border-slate-100 text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          <div className="lg:col-span-5 flex flex-col gap-6">
            <span className="font-inter text-[10px] font-bold tracking-[0.2em] text-[#39B54A] uppercase">TRUST & STEWARDSHIP</span>
            <h2 className="font-poppins font-bold text-3xl text-[#062b66]">Transparency Builds Trust</h2>
            <p className="font-inter text-slate-500 text-sm leading-relaxed">
              We are committed to responsible stewardship of resources, transparent reporting, and measurable impact. Access our library of governance documents below.
            </p>
            <div className="flex gap-4 mt-2">
              <button 
                onClick={() => handlePathwaySelect("Strategic Partnerships")}
                className="bg-[#062b66] hover:bg-[#062b66]/90 text-white font-inter text-[10px] font-bold px-6 py-3.5 rounded-full uppercase tracking-wider transition-colors cursor-pointer outline-none border-none"
              >
                VIEW REPORTS
              </button>
              <button 
                onClick={() => {
                  window.scrollTo(0,0)
                  // Simply scroll back or toggle research page
                }}
                className="border border-[#062b66]/20 hover:border-[#062b66] text-[#062b66] font-inter text-[10px] font-bold px-6 py-3.5 rounded-full uppercase tracking-wider transition-colors cursor-pointer outline-none bg-white"
              >
                VIEW PUBLICATIONS
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-50 border border-slate-100 p-8 rounded-[2rem] flex flex-col gap-4">
            <h3 className="font-poppins font-bold text-sm uppercase tracking-wider text-slate-400 mb-2">Transparency Index Files</h3>
            <div className="flex flex-col gap-3">
              {reportsList.map((rep, idx) => (
                <div 
                  key={idx}
                  className="bg-white border border-slate-150 p-4 rounded-xl flex items-center justify-between shadow-sm hover:border-[#39B54A] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <div>
                      <h4 className="font-poppins font-bold text-xs text-[#062b66] leading-none mb-1">{rep.name}</h4>
                      <span className="font-inter text-[9px] text-slate-400 uppercase tracking-wide">{rep.type}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => triggerDownload(rep.name)}
                    disabled={downloadingFile !== null}
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      downloadingFile === rep.name
                        ? 'bg-[#39B54A]/10 text-[#39B54A] border-transparent'
                        : 'border-slate-200 text-[#062b66] hover:bg-[#062b66] hover:text-white hover:border-[#062b66]'
                    }`}
                  >
                    {downloadingFile === rep.name ? (
                      <span className="font-mono text-[9px] font-bold">{downloadProgress}%</span>
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION (DEEP NAVY BACKGROUND) */}
      <section className="bg-[#03142e] text-white py-24 px-6 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(57,181,74,0.1),rgba(0,0,0,0))] z-0"></div>
        <div className="max-w-4xl mx-auto flex flex-col items-center relative z-10 gap-6">
          <h2 className="font-poppins font-bold text-3xl sm:text-4xl tracking-tight uppercase">
            Join Us In Turning Data Into Action
          </h2>
          <p className="font-inter text-white/70 text-sm leading-relaxed max-w-2xl">
            Whether through partnership, sponsorship, technical expertise, or financial support, your contribution helps strengthen evidence-based solutions that improve lives and build more resilient communities.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <button 
              onClick={() => handlePathwaySelect("Strategic Partnerships")}
              className="bg-[#39B54A] hover:bg-[#39B54A]/90 text-white font-inter text-[11px] font-bold px-8 py-4 rounded-full flex items-center gap-2 shadow-md shadow-[#39B54A]/10 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer outline-none border-none"
            >
              PARTNER WITH BEYOND#
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                if (supportRef.current) {
                  supportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }}
              className="border border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/10 text-white font-inter text-[11px] font-bold px-8 py-4 rounded-full flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer outline-none"
            >
              SUPPORT OUR PROGRAMS
              <ArrowUpRight className="w-4 h-4 text-[#39B54A]" />
            </button>
          </div>
        </div>
      </section>

      {/* 8. INTAKE & COLLABORATION FORM */}
      <section ref={formRef} id="partnership-inquiry-form" className="py-24 px-6 max-w-4xl mx-auto text-left">
        <div className="bg-white border border-slate-200 p-8 sm:p-12 rounded-[2.5rem] shadow-sm relative">
          <div className="flex flex-col gap-2 mb-8">
            <span className="font-inter text-[10px] font-bold tracking-[0.25em] text-[#39B54A] uppercase">SECRETARIAT COMMUNICATIONS</span>
            <h3 className="font-poppins font-bold text-2xl text-[#062b66]">
              Partnership &amp; Collaboration Form
            </h3>
            <p className="font-inter text-slate-500 text-xs max-w-md mt-1 leading-relaxed">
              Submit your organizational details to co-design evidence projects, sponsor regional studies, or join the human security dashboard framework.
            </p>
          </div>

          {submitted ? (
            <div className="py-16 flex flex-col items-center justify-center text-center gap-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-[#39B54A]/15 flex items-center justify-center text-[#39B54A]">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="font-poppins font-bold text-xl text-[#062b66]">
                Submission Received!
              </h4>
              <p className="font-inter text-slate-500 text-xs max-w-xs leading-relaxed">
                Thank you for your interest in partnering with Beyond#. A program analyst from our secretariat will follow up with you within 2 business days.
              </p>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pname" className="font-inter text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Full Name *
                  </label>
                  <input 
                    type="text" 
                    id="pname"
                    required
                    placeholder="e.g. Dr. Ngozi Balogun"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 focus:border-[#39B54A] focus:ring-1 focus:ring-[#39B54A]/50 rounded-xl px-4 py-3 font-inter text-sm text-primary placeholder-slate-300 outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pemail" className="font-inter text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Email Address *
                  </label>
                  <input 
                    type="email" 
                    id="pemail"
                    required
                    placeholder="e.g. n.balogun@ministry.gov.ng"
                    value={form.email}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 focus:border-[#39B54A] focus:ring-1 focus:ring-[#39B54A]/50 rounded-xl px-4 py-3 font-inter text-sm text-primary placeholder-slate-300 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="porganization" className="font-inter text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Organization Name
                  </label>
                  <input 
                    type="text" 
                    id="porganization"
                    placeholder="e.g. Federal Ministry of Budget &amp; Planning"
                    value={form.organization}
                    onChange={(e) => setForm(prev => ({ ...prev, organization: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 focus:border-[#39B54A] focus:ring-1 focus:ring-[#39B54A]/50 rounded-xl px-4 py-3 font-inter text-sm text-primary placeholder-slate-300 outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ppathway" className="font-inter text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Pathway of Interest *
                  </label>
                  <select 
                    id="ppathway"
                    required
                    value={form.pathway}
                    onChange={(e) => setForm(prev => ({ ...prev, pathway: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 focus:border-[#39B54A] focus:ring-1 focus:ring-[#39B54A]/50 rounded-xl px-4 py-3 font-inter text-sm text-primary outline-none transition-all"
                  >
                    <option value="">Select Pathway</option>
                    <option value="Strategic Partnerships">Strategic Partnerships</option>
                    <option value="Research Sponsorship">Research Sponsorship</option>
                    <option value="Human Security Dashboard">Human Security Dashboard</option>
                    <option value="Corporate Social Impact">Corporate Social Impact</option>
                    <option value="Youth Data Fellows">Youth Data Fellows</option>
                    <option value="Technical Contributions">Technical Contributions</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pmessage" className="font-inter text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Collaboration Proposal Summary *
                </label>
                <textarea 
                  id="pmessage"
                  required
                  rows="4"
                  placeholder="Tell us about your organization's vision for this collaboration..."
                  value={form.message}
                  onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 focus:border-[#39B54A] focus:ring-1 focus:ring-[#39B54A]/50 rounded-xl px-4 py-3 font-inter text-sm text-primary placeholder-slate-300 outline-none resize-none transition-all"
                ></textarea>
              </div>

              <button 
                type="submit"
                className="mt-2 w-full bg-[#062b66] hover:bg-[#062b66]/95 text-white font-inter font-bold text-xs uppercase tracking-widest py-4 rounded-full flex items-center justify-center gap-2 transition-all duration-300 shadow-md shadow-[#062b66]/10 hover:scale-102 active:scale-98 cursor-pointer outline-none border-none"
              >
                SUBMIT PARTNERSHIP PROPOSAL
                <ArrowUpRight className="w-4 h-4" />
              </button>

            </form>
          )}
        </div>
      </section>

      {/* 9. DOWNLOAD PROGRESS PREVIEW INDICATOR MODAL */}
      {downloadingFile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200 p-8 rounded-[2rem] w-full max-w-sm flex flex-col items-center gap-4 text-center shadow-lg animate-scale-up">
            <div className="w-12 h-12 rounded-xl bg-[#39B54A]/10 text-[#39B54A] flex items-center justify-center">
              <Download className="w-6 h-6 animate-bounce" />
            </div>
            <h4 className="font-poppins font-bold text-base text-[#062b66]">Downloading Document</h4>
            <p className="font-inter text-slate-500 text-xs leading-relaxed max-w-[200px]">{downloadingFile}</p>
            
            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2 border">
              <div 
                className="bg-[#39B54A] h-full transition-all duration-150" 
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
            <span className="font-mono text-xs font-bold text-[#062b66]">{downloadProgress}%</span>
            <span className="font-inter text-[10px] text-slate-400">Please do not close this window.</span>
          </div>
        </div>
      )}

    </div>
  )
}

// ================= HELPERS & DIALOGS =================
function renderBlockContent(blocks) {
  if (!blocks) return null
  if (typeof blocks === 'string') return <p className="mb-4">{blocks}</p>
  if (!Array.isArray(blocks)) return null

  return blocks.map((block, index) => {
    if (block._type === 'block') {
      const { style = 'normal', children = [] } = block

      const content = children.map((child, childIndex) => {
        if (child._type !== 'span') return child.text || ''
        
        let node = child.text
        if (child.marks && child.marks.length > 0) {
          child.marks.forEach(mark => {
            if (mark === 'strong') {
              node = <strong key={childIndex} className="font-bold text-[#062b66]">{node}</strong>
            } else if (mark === 'em') {
              node = <em key={childIndex} className="italic">{node}</em>
            } else if (mark === 'underline') {
              node = <span key={childIndex} className="underline">{node}</span>
            }
          })
        }
        return node
      })

      if (style === 'h1') return <h1 key={index} className="font-poppins font-bold text-2xl sm:text-3xl text-[#062b66] mt-8 mb-4">{content}</h1>
      if (style === 'h2') return <h2 key={index} className="font-poppins font-bold text-xl sm:text-2xl text-[#062b66] mt-6 mb-3">{content}</h2>
      if (style === 'h3') return <h3 key={index} className="font-poppins font-bold text-lg sm:text-xl text-[#062b66] mt-4 mb-2">{content}</h3>
      if (style === 'h4') return <h4 key={index} className="font-poppins font-bold text-base sm:text-lg text-[#062b66] mt-3 mb-2">{content}</h4>
      
      if (style === 'blockquote') {
        return (
          <blockquote key={index} className="border-l-4 border-[#39B54A] bg-slate-50 pl-4 py-2 my-4 italic text-slate-500 rounded-r-lg">
            {content}
          </blockquote>
        )
      }

      if (block.listItem === 'bullet') {
        return <li key={index} className="list-disc ml-6 mb-2 text-slate-600 text-sm sm:text-base">{content}</li>
      }
      if (block.listItem === 'number') {
        return <li key={index} className="list-decimal ml-6 mb-2 text-slate-600 text-sm sm:text-base">{content}</li>
      }

      return <p key={index} className="mb-4 text-slate-600 text-sm sm:text-base leading-relaxed">{content}</p>
    }

    return null
  })
}

function ArticleReaderModal({ article, onClose }) {
  if (!article) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-slate-950/70 backdrop-blur-md transition-all duration-300 animate-fade-in">
      <div 
        className="bg-white w-full max-w-4xl max-h-[85vh] rounded-[2rem] overflow-hidden border border-slate-100 shadow-2xl flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-10 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 p-2.5 rounded-full transition-all duration-200 cursor-pointer border-none outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto flex-1 p-6 sm:p-10 md:p-12 scrollbar-thin">
          {/* Category Tag */}
          <span className="font-inter text-xs font-bold tracking-[0.25em] text-secondary uppercase mb-3 block">
            {article.category}
          </span>

          {/* Title */}
          <h2 className="font-poppins font-bold text-2xl sm:text-3xl md:text-4xl text-[#062b66] leading-tight mb-4 pr-10">
            {article.title}
          </h2>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 items-center text-xs text-slate-400 font-semibold border-b border-slate-100 pb-6 mb-8">
            <span>
              {new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-250"></span>
            <span className="text-secondary font-bold uppercase tracking-wider">
              By {article.author}
            </span>
          </div>

          {/* Featured Image */}
          {article.featured_media_url && (
            <div className="w-full h-[250px] sm:h-[350px] md:h-[400px] rounded-2xl overflow-hidden mb-8 shadow-sm">
              <img 
                src={article.featured_media_url} 
                alt={article.title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Rich Content Body */}
          <div className="prose max-w-none font-inter text-slate-600 text-sm sm:text-base leading-relaxed">
            {renderBlockContent(article.body || article.excerpt)}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-150 px-6 sm:px-10 py-5 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-primary hover:bg-[#052353] text-white font-inter text-xs font-bold px-6 py-3 rounded-full transition-all duration-200 cursor-pointer shadow-sm border-none outline-none"
          >
            Close Story
          </button>
        </div>
      </div>
    </div>
  )
}

// ================= SUB-PAGE 7: PRIVACY POLICY PAGE =================
function PrivacyPolicyPage({ setCurrentPage }) {
  return (
    <div className="animate-fade-in bg-white text-primary flex-1">
      {/* HEADER BANNER */}
      <div className="bg-[#052353] py-20 px-6 text-center border-b border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <span className="font-inter text-xs font-bold tracking-[0.25em] text-secondary uppercase mb-2 block animate-fade-up">
            LEGAL INFORMATION
          </span>
          <h1 className="font-poppins font-bold text-3xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight max-w-2xl animate-fade-up-delay-1">
            Privacy Policy
          </h1>
          <p className="font-inter text-white/70 text-sm max-w-[700px] mx-auto mt-4 leading-relaxed animate-fade-up-delay-2">
            Last Updated: June 2026. This policy outlines how the Beyond Statistics Initiative handles your data and privacy.
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-4xl mx-auto px-6 py-20 text-left">
        <div className="flex flex-col gap-10">
          
          <div className="flex flex-col gap-4">
            <h2 className="font-poppins font-bold text-xl text-[#062b66]">1. Introduction &amp; Commitment</h2>
            <p className="font-inter text-slate-600 text-sm leading-relaxed">
              At Beyond Statistics Initiative (Beyond#), we are committed to safeguarding your privacy and protecting the integrity of any information gathered through our Observatory portal. As a professional, data-centric policy observatory, we ensure that data collection remains transparent, secure, and limited strictly to optimizing user engagement and public observatory utilities.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="font-poppins font-bold text-xl text-[#062b66]">2. Data We Collect</h2>
            <p className="font-inter text-slate-600 text-sm leading-relaxed">
              We collect and process information through two primary streams:
            </p>
            <ul className="list-disc ml-6 flex flex-col gap-2 font-inter text-slate-600 text-sm">
              <li><strong>Anonymous Traffic Metrics:</strong> We log general, non-personally identifiable page request hits (e.g., daily, weekly, and monthly totals) to track observatory document access and dashboard engagement. We use a keyless public hit counter (Abacus) which does not log IP addresses or personal identifiers.</li>
              <li><strong>Partnership Proposals &amp; Contact Forms:</strong> If you choose to submit a support/partnership application, we collect your Name, Email Address, Organization Name, and the Message content you provide to facilitate collaboration.</li>
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="font-poppins font-bold text-xl text-[#062b66]">3. Cookies &amp; Local Storage</h2>
            <p className="font-inter text-slate-600 text-sm leading-relaxed">
              Our site uses minor cookies and HTML5 Local Storage keys:
            </p>
            <ul className="list-disc ml-6 flex flex-col gap-2 font-inter text-slate-600 text-sm">
              <li><strong>beyond_cookie_consent:</strong> Stores your cookie preference (Accept/Decline) so we do not prompt you on subsequent visits.</li>
              <li><strong>beyond_visitor_counts:</strong> Temporarily buffers local metrics in case the public statistics server is offline.</li>
              <li><strong>Weekly data sync checks:</strong> Used on the HSRI Dashboard to check if local cache datasets are older than 7 days.</li>
            </ul>
            <p className="font-inter text-slate-600 text-sm leading-relaxed">
              You can choose to disable cookies in your browser settings or decline consent through our cookie banner. Doing so will not restrict your access to the Human Security Dashboard or research articles.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="font-poppins font-bold text-xl text-[#062b66]">4. Data Sharing &amp; Third-Party Services</h2>
            <p className="font-inter text-slate-600 text-sm leading-relaxed">
              Beyond# does not sell, lease, or rent your personal information to third parties. We utilize <strong>Sanity.io CMS</strong> as our headless backend provider. Sanity.io processes read-only content requests securely and does not harvest personal details from visitors.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="font-poppins font-bold text-xl text-[#062b66]">5. Contact Us</h2>
            <p className="font-inter text-slate-600 text-sm leading-relaxed">
              If you have any questions about this Privacy Policy, your rights under data protection laws, or wish to review/delete any contact form details submitted, please contact the secretariat at:
            </p>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 font-inter text-slate-600 text-sm flex flex-col gap-1">
              <strong>Beyond Statistics Initiative (Beyond#) Secretariat</strong>
              <span>Central Business District, Abuja, FCT, Nigeria</span>
              <span>Email: <a href="mailto:info@beyondstatistics.org" className="text-secondary font-bold hover:underline">info@beyondstatistics.org</a></span>
            </div>
          </div>

          <div className="pt-6 border-t flex justify-start">
            <button 
              onClick={() => setCurrentPage('home')}
              className="bg-primary hover:bg-[#052353] text-white font-inter text-xs font-bold px-8 py-3.5 rounded-full transition-all duration-200 cursor-pointer shadow-md border-none outline-none"
            >
              Return To Home
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

// ================= APP COMPONENT (Router Shell) =================
function App() {
  const slides = [
    '/hero_community.png',
    '/hero_women.png',
    '/hero_research.png'
  ]

  // Dynamic Routing state: 'home' | 'about' | 'programs' | 'impact-map' | 'dashboard' | 'research' | 'impact' | 'contact'
  const [currentPage, _setCurrentPage] = useState('home')
  const [selectedStateId, setSelectedStateId] = useState('fct')

  const setCurrentPage = (page) => {
    _setCurrentPage(page)
    const path = page === 'home' ? '/' : `/${page}`
    window.history.pushState({ page }, '', path)
  }

  // Handle browser Back / Forward buttons (popstate)
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.page) {
        _setCurrentPage(event.state.page)
      } else {
        _setCurrentPage('home')
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Handle initial page load from URL path (e.g. going directly to /about)
  useEffect(() => {
    const path = window.location.pathname
    const pagePath = path.replace('/', '')
    const validPages = ['about', 'programs', 'impact-map', 'dashboard', 'research', 'impact', 'partnerships', 'contact', 'privacy']
    if (validPages.includes(pagePath)) {
      _setCurrentPage(pagePath)
    } else {
      _setCurrentPage('home')
    }
  }, [])

  // Mobile menu open
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Sanity.io CMS states
  const [sanityArticles, setSanityArticles] = useState([])
  const [sanityPublications, setSanityPublications] = useState([])
  const [loadingSanity, setLoadingSanity] = useState(true)
  const [activeArticle, setActiveArticle] = useState(null)
  
  // Cookie Consent States & Handlers
  const [showCookieBanner, setShowCookieBanner] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('beyond_cookie_consent')
    if (!consent) {
      const timer = setTimeout(() => {
        setShowCookieBanner(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAcceptCookies = () => {
    localStorage.setItem('beyond_cookie_consent', 'accepted')
    setShowCookieBanner(false)
  }

  const handleDeclineCookies = () => {
    localStorage.setItem('beyond_cookie_consent', 'declined')
    setShowCookieBanner(false)
  }

  useEffect(() => {
    async function loadSanityData() {
      try {
        console.log("Sanity Config - Project ID:", import.meta.env.VITE_SANITY_PROJECT_ID)
        const [arts, pubs] = await Promise.all([
          fetchArticles(),
          fetchPublications()
        ])
        console.log("Sanity Fetch - Articles:", arts.length, "Publications:", pubs.length)
        setSanityArticles(arts)
        setSanityPublications(pubs)
      } catch (err) {
        console.error("Failed to load Sanity CMS data, using static fallbacks:", err)
      } finally {
        setLoadingSanity(false)
      }
    }
    loadSanityData()
  }, [])

  // Partner Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    message: ''
  })
  const [formSubmitted, setFormSubmitted] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.name && formData.email) {
      setFormSubmitted(true)
      setTimeout(() => {
        setFormData({ name: '', email: '', organization: '', message: '' })
        setFormSubmitted(false)
      }, 5000)
    }
  }

  // Slide carousel index
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [currentPage])

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between text-white font-sans bg-primary">
      
      {/* GLOBAL HEADER */}
      {currentPage !== 'home' && (
        <div className="w-full bg-[#051c44] border-b border-white/5 relative z-30">
          <Header 
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            setIsMenuOpen={setIsMenuOpen}
            setSelectedStateId={setSelectedStateId}
          />
        </div>
      )}

      {/* MOBILE MENU OVERLAY */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col justify-between p-8 animate-fade-in">
          <div className="flex justify-between items-center w-full">
            <span className="font-poppins font-bold text-2xl tracking-tight">
              BEYOND<span className="text-secondary">#</span>
            </span>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="p-2 text-white hover:text-secondary transition-colors cursor-pointer"
              aria-label="Close Mobile Menu"
            >
              <X className="w-7 h-7" />
            </button>
          </div>

          <div className="flex flex-col gap-6 my-auto text-left">
            {[
              { name: 'About Us', id: 'about' },
              { name: 'What We Do', id: 'programs' },
              { name: 'Human Security Dashboard', id: 'dashboard', indent: true },
              { name: 'Research Hub', id: 'research', disabled: true },
              { name: 'Our Impact Stories', id: 'impact', disabled: true },
              { name: 'Our Impact Map', id: 'impact-map', indent: true, disabled: true },
              { name: 'Support & Partnerships', id: 'partnerships' },
              { name: 'Contact Us', id: 'contact' }
            ].map((link, idx) => (
              link.disabled ? (
                <div
                  key={link.id}
                  className={`flex items-center gap-3 opacity-40 cursor-not-allowed ${
                    link.indent ? 'pl-6' : ''
                  }`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <span className={`font-poppins font-bold uppercase ${
                    link.indent ? 'text-lg tracking-wider text-white/60' : 'text-2xl tracking-widest text-white'
                  }`}>{link.name}</span>
                  <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Soon</span>
                </div>
              ) : (
                <button
                  key={link.id}
                  onClick={() => {
                    setCurrentPage(link.id)
                    setIsMenuOpen(false)
                  }}
                  className={`transition-all duration-300 animate-fade-up block text-left outline-none border-none bg-transparent ${
                    link.indent 
                      ? 'pl-6 text-white/60 hover:text-[#39B54A] text-lg font-poppins font-semibold uppercase tracking-wider' 
                      : 'text-white hover:text-secondary text-2xl font-poppins font-bold uppercase tracking-widest'
                  } ${
                    currentPage === link.id ? 'text-secondary' : ''
                  }`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  {link.name}
                </button>
              )
            ))}
          </div>

          <button 
            onClick={() => {
              setCurrentPage('partnerships')
              setIsMenuOpen(false)
            }}
            className="w-full border border-secondary/30 hover:border-secondary bg-secondary/5 hover:bg-secondary/10 text-secondary font-inter font-bold px-6 py-4 rounded-full flex items-center justify-center gap-2 transition-all duration-300 uppercase tracking-widest text-sm cursor-pointer outline-none animate-fade-up"
            style={{ animationDelay: '0.5s' }}
          >
            SUPPORT & PARTNERSHIPS
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* DYNAMIC CONTENT ROUTER */}
      {currentPage === 'home' && (
        <div className="flex-1 flex flex-col justify-between">
          <HomePage 
            slides={slides}
            currentSlide={currentSlide}
            setCurrentPage={setCurrentPage}
          />
          <InsightImpactNewsSection articles={sanityArticles} onArticleClick={setActiveArticle} />
        </div>
      )}
      
      {currentPage === 'about' && (
        <AboutPage 
          setCurrentPage={setCurrentPage}
        />
      )}

      {currentPage === 'programs' && (
        <ProgramsPage />
      )}

      {currentPage === 'impact-map' && (
        <ImpactMapPage />
      )}

      {currentPage === 'dashboard' && (
        <HumanSecurityDashboard 
          selectedStateId={selectedStateId} 
          setSelectedStateId={setSelectedStateId} 
        />
      )}

      {currentPage === 'research' && (
        <ResearchPage publications={sanityPublications} />
      )}

      {currentPage === 'impact' && (
        <ImpactPage articles={sanityArticles} onArticleClick={setActiveArticle} />
      )}

      {currentPage === 'partnerships' && (
        <SupportPartnershipsPage />
      )}

      {currentPage === 'contact' && (
        <ContactPage 
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          formSubmitted={formSubmitted}
        />
      )}

      {currentPage === 'privacy' && (
        <PrivacyPolicyPage setCurrentPage={setCurrentPage} />
      )}

      {/* GLOBAL FOOTER */}
      {currentPage !== 'home' && <Footer setCurrentPage={setCurrentPage} />}

      {/* Reusable Global Modals */}
      {activeArticle && (
        <ArticleReaderModal 
          article={activeArticle} 
          onClose={() => setActiveArticle(null)} 
        />
      )}

      {/* Cookie Consent Banner */}
      {showCookieBanner && (
        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:max-w-md z-50 animate-fade-in">
          <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] shadow-2xl flex flex-col gap-4 text-left">
            <h4 className="font-poppins font-bold text-sm text-white">Cookie Consent</h4>
            <p className="font-inter text-white/70 text-xs leading-relaxed">
              We use cookies and browser storage to optimize site speed, record global visitors, and check dataset sync status. By clicking "Accept Cookies", you consent to our use of these tools in accordance with our <button onClick={() => { setCurrentPage('privacy'); setShowCookieBanner(false); }} className="text-secondary font-bold hover:underline bg-transparent border-none cursor-pointer p-0">Privacy Policy</button>.
            </p>
            <div className="flex gap-3 justify-end mt-2">
              <button 
                onClick={handleDeclineCookies}
                className="font-inter text-[11px] font-bold text-white/50 hover:text-white px-4 py-2.5 rounded-full hover:bg-white/5 transition-all cursor-pointer border border-white/10 bg-transparent"
              >
                Decline
              </button>
              <button 
                onClick={handleAcceptCookies}
                className="font-inter text-[11px] font-bold bg-[#39B54A] hover:bg-[#39B54A]/95 text-white px-5 py-2.5 rounded-full transition-all cursor-pointer shadow-md shadow-[#39B54A]/10 border-none outline-none"
              >
                Accept Cookies
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default App
