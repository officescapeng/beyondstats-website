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
import { 
  fetchArticles, 
  fetchPublications, 
  fetchProjects, 
  globalSearch, 
  getRelatedArticles 
} from './services/wordpress'


// ================= GLOBAL HEADER / NAVBAR =================
function Header({ currentPage, setCurrentPage, setIsMenuOpen, setIsSearchOpen }) {
  const links = [
    { name: 'About', id: 'about' },
    { name: 'Programs', id: 'programs', dropdown: true },
    { name: 'Research', id: 'research' },
    { name: 'Impact', id: 'impact', dropdown: true },
    { name: 'Contact', id: 'contact' }
  ]

  return (
    <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-30">
      <button 
        onClick={() => setCurrentPage('home')}
        className="font-poppins font-bold text-2xl tracking-tight text-white select-none hover:text-secondary transition-colors cursor-pointer outline-none border-none bg-transparent"
      >
        BEYOND<span className="text-secondary">#</span>
      </button>

      <div className="hidden md:flex items-center gap-8">
        {links.map((link) => {
          if (link.dropdown) {
            const isImpact = link.id === 'impact';
            const isActive = isImpact 
              ? (currentPage === 'impact' || currentPage === 'impact-map')
              : (currentPage === 'programs' || currentPage === 'dashboard');

            return (
              <div key={link.id} className="relative group py-2">
                <button
                  onClick={() => setCurrentPage(link.id)}
                  className={`font-inter text-[11px] font-medium uppercase tracking-[0.2em] transition-all duration-200 cursor-pointer outline-none border-none bg-transparent flex items-center gap-1.5 ${
                    isActive
                      ? 'text-secondary border-b-2 border-secondary pb-1'
                      : 'text-white/80 hover:text-white pb-1'
                  }`}
                >
                  {link.name}
                  <ChevronDown className="w-3.5 h-3.5 opacity-60 group-hover:rotate-180 transition-transform duration-300" />
                </button>
                
                {/* Dropdown Menu */}
                <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-[#051735]/95 backdrop-blur-md border border-white/10 rounded-2xl p-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-250 z-50 flex flex-col gap-1 ${
                  isImpact ? 'w-48' : 'w-52'
                }`}>
                  {isImpact ? (
                    <>
                      <button
                        onClick={() => setCurrentPage('impact')}
                        className={`w-full text-left font-inter text-[10px] font-semibold uppercase tracking-[0.15em] px-4 py-2.5 rounded-xl transition-colors cursor-pointer outline-none border-none ${
                          currentPage === 'impact'
                            ? 'bg-secondary/20 text-secondary'
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        Our Impact Stories
                      </button>
                      <button
                        onClick={() => setCurrentPage('impact-map')}
                        className={`w-full text-left font-inter text-[10px] font-semibold uppercase tracking-[0.15em] px-4 py-2.5 rounded-xl transition-colors cursor-pointer outline-none border-none ${
                          currentPage === 'impact-map'
                            ? 'bg-secondary/20 text-secondary'
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        Our Impact Map
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setCurrentPage('programs')}
                        className={`w-full text-left font-inter text-[10px] font-semibold uppercase tracking-[0.15em] px-4 py-2.5 rounded-xl transition-colors cursor-pointer outline-none border-none ${
                          currentPage === 'programs'
                            ? 'bg-secondary/20 text-secondary'
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        What We Do
                      </button>
                      <button
                        onClick={() => setCurrentPage('dashboard')}
                        className={`w-full text-left font-inter text-[10px] font-semibold uppercase tracking-[0.15em] px-4 py-2.5 rounded-xl transition-colors cursor-pointer outline-none border-none ${
                          currentPage === 'dashboard'
                            ? 'bg-secondary/20 text-secondary'
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        Human Security Dashboard
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          }

          return (
            <button
              key={link.id}
              onClick={() => setCurrentPage(link.id)}
              className={`font-inter text-[11px] font-medium uppercase tracking-[0.2em] transition-all duration-200 cursor-pointer outline-none border-none bg-transparent pb-1 ${
                currentPage === link.id 
                  ? 'text-secondary border-b-2 border-secondary' 
                  : 'text-white/80 hover:text-white'
              }`}
            >
              {link.name}
            </button>
          )
        })}
      </div>

      <div className="hidden md:flex items-center gap-4">
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="p-2.5 rounded-full border border-white/10 hover:border-white/30 bg-white/5 text-white hover:text-secondary hover:scale-105 active:scale-95 transition-all cursor-pointer outline-none"
          aria-label="Search site"
        >
          <Search className="w-4 h-4" />
        </button>
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
          onClick={() => setIsSearchOpen(true)}
          className="p-2 text-white hover:text-secondary transition-colors cursor-pointer"
          aria-label="Search site"
        >
          <Search className="w-5 h-5" />
        </button>
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
              { name: 'Our Impact Map', id: 'impact-map' },
              { name: 'Human Security Dashboard', id: 'dashboard' },
              { name: 'Research & Deliverables', id: 'research' },
              { name: 'Our Impact Stories', id: 'impact' },
              { name: 'Support & Partnerships', id: 'partnerships' },
              { name: 'Contact', id: 'contact' }
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => setCurrentPage(link.id)}
                className="font-inter text-[11px] text-white/60 hover:text-white transition-colors cursor-pointer text-left outline-none bg-transparent border-none"
              >
                {link.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:col-span-2">
          <h4 className="font-poppins font-bold text-xs uppercase tracking-widest text-secondary">
            Secretariat Address
          </h4>
          <p className="font-inter text-xs text-white/75 leading-relaxed">
            Beyond Statistics Initiative (Beyond#),<br />
            Central Business District, Abuja, FCT, Nigeria.<br />
            Email: info@beyondstatistics.org | Helpline: +234 (0) 9 123 4567
          </p>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between gap-4 text-left">
        <p className="font-inter text-[10px] text-white/30 tracking-wide uppercase">
          &copy; {new Date().getFullYear()} Beyond Statistics Initiative. All Rights Reserved.
        </p>
        <div className="flex gap-4">
          <a href="#" className="font-inter text-[10px] text-white/30 hover:text-white uppercase tracking-wider transition-colors">Privacy Policy</a>
          <a href="#" className="font-inter text-[10px] text-white/30 hover:text-white uppercase tracking-wider transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  )
}

// ================= SUB-PAGE 1: HOME PAGE HERO =================
function HomePage({ slides, currentSlide, setCurrentPage }) {
  return (
    <div className="relative h-screen w-full flex flex-col justify-between">
      
      {/* Background Hero Slider */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        {slides.map((slide, idx) => (
          <div
            key={slide}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide}
              alt={`Beyond# Hero Slider Background ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-black/65 z-1"></div>
      </div>

      {/* Main Hero Content */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="max-w-[700px] flex flex-col items-start text-left">
          
          {/* Intro Label */}
          <div className="flex items-center gap-2 mb-4 animate-fade-up">
            <BarChart3 className="w-4 h-4 text-secondary" />
            <span className="font-inter text-xs font-semibold tracking-[0.2em] text-white/70 uppercase">
              EVIDENCE-DRIVEN DEVELOPMENT
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="font-poppins font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight leading-[0.95] text-white mb-6 uppercase animate-fade-up-delay-1 select-none">
            DATA.<br />
            INSIGHT.<br />
            ACTION.<br />
            <span className="text-secondary">IMPACT.</span>
          </h1>

          {/* Supporting Text */}
          <p className="font-inter text-white/75 text-base sm:text-lg leading-relaxed max-w-[650px] mb-8 animate-fade-up-delay-2">
            We believe every statistic represents a human story. Beyond# transforms evidence into practical solutions that improve lives, strengthen communities, and promote human security.
          </p>

          {/* CTA Row */}
          <div className="flex flex-wrap items-center gap-4 mb-16 animate-fade-up-delay-3">
            <button 
              onClick={() => setCurrentPage('programs')}
              className="bg-secondary hover:bg-secondary/90 text-white font-inter font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-full flex items-center gap-2 shadow-lg shadow-secondary/15 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer outline-none"
            >
              EXPLORE OUR PROGRAMS
              <ArrowUpRight className="w-4 h-4" />
            </button>

            <button 
              onClick={() => setCurrentPage('dashboard')}
              className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 px-5 py-3 rounded-full text-xs font-medium text-white/80 hover:bg-white/20 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer outline-none"
            >
              <HeartHandshake className="w-4 h-4 text-secondary" />
              <span className="font-inter uppercase tracking-wide">
                Human Security Dashboard
              </span>
            </button>
          </div>

          {/* Impact Indicators Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-up-delay-4">
            
            <div className="bg-black/25 backdrop-blur-sm border border-white/5 p-5 rounded-2xl flex flex-col gap-3 hover:bg-black/35 hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                <BarChart3 className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h4 className="font-poppins font-semibold text-sm uppercase tracking-wider mb-1">
                  DATA
                </h4>
                <p className="font-inter text-white/60 text-[11px] leading-relaxed">
                  Monitor critical human security indicators
                </p>
              </div>
            </div>

            <div className="bg-black/25 backdrop-blur-sm border border-white/5 p-5 rounded-2xl flex flex-col gap-3 hover:bg-black/35 hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                <Lightbulb className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h4 className="font-poppins font-semibold text-sm uppercase tracking-wider mb-1">
                  INSIGHT
                </h4>
                <p className="font-inter text-white/60 text-[11px] leading-relaxed">
                  Generate evidence-based recommendations
                </p>
              </div>
            </div>

            <div className="bg-black/25 backdrop-blur-sm border border-white/5 p-5 rounded-2xl flex flex-col gap-3 hover:bg-black/35 hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                <Target className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h4 className="font-poppins font-semibold text-sm uppercase tracking-wider mb-1">
                  ACTION
                </h4>
                <p className="font-inter text-white/60 text-[11px] leading-relaxed">
                  Design practical community solutions
                </p>
              </div>
            </div>

            <div className="bg-black/25 backdrop-blur-sm border border-white/5 p-5 rounded-2xl flex flex-col gap-3 hover:bg-black/35 hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                <HeartHandshake className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h4 className="font-poppins font-semibold text-sm uppercase tracking-wider mb-1">
                  IMPACT
                </h4>
                <p className="font-inter text-white/60 text-[11px] leading-relaxed">
                  Measure meaningful social change
                </p>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* STATISTICS DRAWER FOOTER */}
      <footer className="relative z-10 w-full bg-black/40 backdrop-blur-md border-t border-white/5 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-between gap-6">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 w-full lg:w-auto text-left">
            <div className="flex flex-col">
              <span className="font-poppins font-bold text-2xl text-white">36 States</span>
              <span className="font-inter text-[10px] text-white/50 uppercase tracking-widest mt-1">
                Coverage
              </span>
            </div>

            <div className="flex flex-col">
              <span className="font-poppins font-bold text-2xl text-white">100+</span>
              <span className="font-inter text-[10px] text-white/50 uppercase tracking-widest mt-1">
                Indicators Tracked
              </span>
            </div>

            <div className="flex flex-col">
              <span className="font-poppins font-bold text-2xl text-white">Research</span>
              <span className="font-inter text-[10px] text-white/50 uppercase tracking-widest mt-1">
                Evidence-Driven
              </span>
            </div>

            <div className="flex flex-col">
              <span className="font-poppins font-bold text-2xl text-white">Communities</span>
              <span className="font-inter text-[10px] text-white/50 uppercase tracking-widest mt-1">
                People-Centered
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 border-l border-white/10 pl-0 lg:pl-8 w-full lg:w-auto text-left">
            <div className="flex flex-col items-center gap-1">
              <div className="w-5 h-8 rounded-full border border-white/30 flex items-start justify-center p-1">
                <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce"></div>
              </div>
            </div>
            
            <div className="flex flex-col">
              <span className="font-poppins font-semibold text-xs tracking-wider text-secondary uppercase">
                Scroll Down
              </span>
              <span className="font-inter text-[11px] text-white/60 leading-relaxed max-w-[240px] mt-0.5">
                See our latest field insights &amp; publications news below.
              </span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  )
}

// ================= SUB-PAGE 1B: NEWS CAROUSEL SECTION =================
function InsightImpactNewsSection({ onReadArticle }) {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [newsIndex, setNewsIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    async function loadNews() {
      try {
        const res = await fetchArticles({ page: 1, perPage: 5, sortBy: 'newest' })
        setNews(res.data)
      } catch (err) {
        console.error("Error loading news for carousel:", err)
      } finally {
        setLoading(false)
      }
    }
    loadNews()
  }, [])

  // Track responsive screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const maxIndex = loading ? 0 : (isMobile ? news.length - 1 : news.length - 3)

  const nextSlide = () => {
    setNewsIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
  }

  const prevSlide = () => {
    setNewsIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))
  }

  if (loading) {
    return (
      <section className="bg-slate-50 text-primary py-24 px-6 md:px-12 w-full border-t border-slate-100 z-10 relative">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="flex flex-col md:flex-row justify-between items-end w-full mb-16 gap-6 text-left animate-pulse">
            <div className="max-w-2xl w-full">
              <div className="h-4 bg-slate-200 rounded w-1/4 mb-3"></div>
              <div className="h-10 bg-slate-200 rounded w-3/4"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-10">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm p-6 flex flex-col gap-4 animate-pulse">
                <div className="h-48 bg-slate-200 rounded-2xl w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-6 bg-slate-200 rounded w-5/6"></div>
                <div className="h-12 bg-slate-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-slate-50 text-primary py-24 px-6 md:px-12 w-full transition-colors duration-300 border-t border-slate-100 z-10 relative">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-end w-full mb-16 gap-6 text-left">
          <div className="max-w-2xl">
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
          
          {/* Slider Chevrons */}
          <div className="flex gap-3">
            <button 
              onClick={prevSlide}
              className="w-12 h-12 rounded-full border border-slate-200 bg-white flex items-center justify-center text-primary hover:border-secondary hover:text-secondary shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer outline-none"
              aria-label="Previous News Story"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={nextSlide}
              className="w-12 h-12 rounded-full border border-slate-200 bg-white flex items-center justify-center text-primary hover:border-secondary hover:text-secondary shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer outline-none"
              aria-label="Next News Story"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Carousel Tracks */}
        <div className="relative w-full overflow-hidden mb-10">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ 
              transform: isMobile 
                ? `translateX(-${newsIndex * 100}%)` 
                : `translateX(-${newsIndex * 33.333}%)`,
              width: isMobile ? `${news.length * 100}%` : '100%'
            }}
          >
            {news.map((item) => (
              <div 
                key={item.id}
                className="px-3"
                style={{ 
                  width: isMobile ? '100%' : '33.333%',
                  flexShrink: 0
                }}
              >
                <div 
                  onClick={() => onReadArticle(item)}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-secondary shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full text-left cursor-pointer group"
                >
                  <div className="h-48 overflow-hidden relative">
                    <img 
                      src={item.featured_media_url} 
                      alt={item.title.rendered} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-secondary font-inter text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                      {item.categories && item.categories[0] ? item.categories[0] : 'Insight'}
                    </span>
                  </div>
                  <div className="p-6 flex flex-col flex-1 justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <span className="font-inter text-[10px] text-slate-400 font-semibold">
                        {new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                      <h3 className="font-poppins font-bold text-base text-[#062b66] leading-snug group-hover:text-secondary transition-colors">
                        {item.title.rendered}
                      </h3>
                      <p className="font-inter text-slate-500 text-xs leading-relaxed line-clamp-3" dangerouslySetInnerHTML={{ __html: item.excerpt.rendered }} />
                    </div>
                    <div className="flex items-center gap-1.5 text-secondary font-inter text-[10px] font-bold uppercase tracking-wider group-hover:text-[#062b66] transition-colors cursor-pointer">
                      Read Report
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Dots */}
        <div className="flex gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setNewsIndex(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 outline-none border-none cursor-pointer ${
                idx === newsIndex ? 'bg-secondary w-6' : 'bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            ></button>
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
function ResearchPage() {
  const [publications, setPublications] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('All')
  const [year, setYear] = useState('All')
  const [topic, setTopic] = useState('All')
  const [state, setState] = useState('All')
  const [downloadingFile, setDownloadingFile] = useState(null)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [localDownloads, setLocalDownloads] = useState({})

  const types = ['All', 'Annual Reports', 'Research Reports', 'Situation Reports', 'Human Security Briefs', 'Data Stories', 'Financial Reports']
  const years = ['All', '2026', '2025']
  const topics = ['All', 'Governance & Accountability', 'Human Security Observatory', 'Food Security', 'Climate Vulnerability']
  const states = ['All', 'National', 'Niger', 'Kaduna', 'Oyo']

  useEffect(() => {
    async function loadPublications() {
      setLoading(true)
      try {
        const data = await fetchPublications({
          type,
          year,
          topic,
          state,
          search
        })
        setPublications(data)
      } catch (err) {
        console.error("Error loading publications:", err)
      } finally {
        setLoading(false)
      }
    }
    loadPublications()
  }, [type, year, topic, state, search])

  const handleDownload = (pubId, fileName) => {
    setDownloadingFile(fileName)
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
        }, 600)
      }
    }, 120)
  }

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
            Access our repository of empirical assessments, annual summaries, policy briefs, and dataset reports. Use the filters below to refine your search.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-3xl shadow-sm text-left mb-12 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="font-inter text-[10px] font-bold text-slate-500 uppercase tracking-widest">Search Publications</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search by title, summary, topic..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-inter text-sm text-primary placeholder-slate-350 outline-none focus:border-[#062b66] transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-inter text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-inter text-xs text-primary outline-none focus:border-[#062b66] cursor-pointer"
              >
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-inter text-[10px] font-bold text-slate-500 uppercase tracking-widest">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-inter text-xs text-primary outline-none focus:border-[#062b66] cursor-pointer"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-inter text-[10px] font-bold text-slate-500 uppercase tracking-widest">Topic Area</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-inter text-xs text-primary outline-none focus:border-[#062b66] cursor-pointer"
              >
                {topics.map(tp => <option key={tp} value={tp}>{tp}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-inter text-[10px] font-bold text-slate-500 uppercase tracking-widest">State Coverage</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-inter text-xs text-primary outline-none focus:border-[#062b66] cursor-pointer"
              >
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {(type !== 'All' || year !== 'All' || topic !== 'All' || state !== 'All' || search !== '') && (
            <div className="flex justify-end pt-2 border-t border-slate-200/50">
              <button
                onClick={() => {
                  setType('All')
                  setYear('All')
                  setTopic('All')
                  setState('All')
                  setSearch('')
                }}
                className="text-xs text-secondary hover:text-[#062b66] font-bold font-inter tracking-wider uppercase transition-colors outline-none bg-transparent border-none cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        <div className="min-h-[300px]">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(n => (
                <div key={n} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm p-6 flex flex-col gap-4 animate-pulse">
                  <div className="h-56 bg-slate-100 rounded-2xl w-full"></div>
                  <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                  <div className="h-6 bg-slate-100 rounded w-5/6"></div>
                  <div className="h-10 bg-slate-100 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : publications.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border text-slate-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="font-poppins font-bold text-lg text-[#062b66]">No Publications Found</h4>
              <p className="font-inter text-slate-400 text-xs max-w-xs">
                We couldn't find any publications matching your filter criteria. Try resetting the filters or modifying your search query.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
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
                          alt={pub.title.rendered} 
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
                          {pub.title.rendered}
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
                        className="bg-[#062b66] hover:bg-[#062b66]/90 text-white font-inter text-[9px] font-bold px-5 py-3 rounded-full uppercase tracking-wider flex items-center gap-1.5 transition-all shadow cursor-pointer border-none outline-none animate-duration-300"
                      >
                        Download PDF
                        <Download className="w-3.5 h-3.5 text-secondary" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {downloadingFile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200 p-8 rounded-[2rem] w-full max-w-sm flex flex-col items-center gap-4 text-center shadow-lg animate-scale-up">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
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
// ================= REUSABLE ARTICLE READER MODAL =================
function ArticleReaderModal({ article, onClose, onSelectArticle }) {
  const [related, setRelated] = useState([])
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (article) {
      const primaryCat = article.categories && article.categories[0] ? article.categories[0] : 'Insight'
      const rel = getRelatedArticles(article.id, primaryCat, article.tags || [])
      setRelated(rel)
      // Scroll modal body to top on load/swap
      const modalBody = document.getElementById('article-modal-body')
      if (modalBody) modalBody.scrollTo(0, 0)
    }
  }, [article])

  if (!article) return null

  const handleDownload = (fileName) => {
    setDownloading(true)
    setProgress(0)
    let p = 0
    const interval = setInterval(() => {
      p += 10
      if (p <= 100) {
        setProgress(p)
      } else {
        clearInterval(interval)
        setTimeout(() => {
          setDownloading(false)
        }, 600)
      }
    }, 120)
  }

  const primaryCat = article.categories && article.categories[0] ? article.categories[0] : 'Insight'

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-10 animate-fade-in no-print">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative animate-scale-up">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-3 rounded-full border border-slate-250 bg-slate-50 text-slate-600 hover:bg-[#062b66] hover:text-white transition-all duration-200 z-10 cursor-pointer outline-none"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Scroll Body */}
        <div id="article-modal-body" className="overflow-y-auto p-8 sm:p-12 text-left flex-1">
          
          {/* Category Badges */}
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-secondary/15 text-secondary font-inter text-[10px] font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              {primaryCat}
            </span>
            {article.acf?.state_focus && (
              <span className="bg-[#062b66]/10 text-[#062b66] font-inter text-[10px] font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
                {article.acf.state_focus} Focus
              </span>
            )}
          </div>

          <h2 className="font-poppins font-bold text-3xl sm:text-4xl text-[#062b66] leading-tight mb-6">
            {article.title.rendered}
          </h2>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400 border-b border-slate-100 pb-6 mb-8">
            <span>By {article.author_name || 'Beyond# Researcher'}</span>
            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
            <span>{new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>

          {/* Featured Image */}
          {article.featured_media_url && (
            <div className="w-full h-[250px] sm:h-[350px] rounded-3xl overflow-hidden mb-8 relative border shadow-sm">
              <img 
                src={article.featured_media_url} 
                alt={article.title.rendered} 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content Body */}
          <div 
            className="font-inter text-slate-600 text-sm sm:text-base leading-relaxed flex flex-col gap-6 prose max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content.rendered }}
          />

          {/* Attachment Downloader */}
          {article.acf?.download_attachment && (
            <div className="bg-slate-50 border border-slate-150 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-10">
              <div className="flex items-center gap-3 text-left">
                <FileText className="w-8 h-8 text-slate-450 flex-shrink-0" />
                <div>
                  <h4 className="font-poppins font-bold text-xs text-[#062b66]">Actionable Research Brief PDF</h4>
                  <span className="font-inter text-[9px] text-slate-450 uppercase tracking-wider font-semibold">
                    {article.acf.download_attachment}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDownload(article.acf.download_attachment)}
                disabled={downloading}
                className="bg-[#062b66] hover:bg-[#062b66]/90 text-white font-inter text-[10px] font-bold px-6 py-3.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 transition-all shadow cursor-pointer border-none outline-none"
              >
                {downloading ? (
                  <>Downloading ({progress}%)</>
                ) : (
                  <>
                    Download Attachment
                    <Download className="w-4 h-4 text-secondary" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Related Articles Engine */}
          {related.length > 0 && (
            <div className="border-t border-slate-100 pt-10 mt-12">
              <h3 className="font-poppins font-bold text-lg text-[#062b66] mb-6">Related Articles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {related.map(art => (
                  <div 
                    key={art.id}
                    onClick={() => onSelectArticle(art)}
                    className="bg-slate-50 border border-slate-150 hover:border-secondary p-5 rounded-2xl flex flex-col justify-between items-start text-left cursor-pointer transition-all hover:-translate-y-0.5 group h-full"
                  >
                    <div>
                      <span className="text-secondary font-inter text-[8px] font-bold uppercase tracking-widest block mb-2">
                        {art.categories && art.categories[0] ? art.categories[0] : 'Insight'}
                      </span>
                      <h4 className="font-poppins font-bold text-xs text-[#062b66] leading-snug group-hover:text-secondary transition-colors line-clamp-2 mb-2">
                        {art.title.rendered}
                      </h4>
                      <p className="font-inter text-slate-455 text-[10px] leading-relaxed line-clamp-2" dangerouslySetInnerHTML={{ __html: art.excerpt.rendered }} />
                    </div>
                    <span className="font-inter text-[9px] font-bold text-slate-400 group-hover:text-[#062b66] uppercase mt-4 flex items-center gap-1 transition-colors">
                      Read brief <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Progress modal */}
      {downloading && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200 p-8 rounded-[2rem] w-full max-w-sm flex flex-col items-center gap-4 text-center shadow-lg animate-scale-up">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <Download className="w-6 h-6 animate-bounce" />
            </div>
            <h4 className="font-poppins font-bold text-base text-[#062b66]">Downloading Document</h4>
            <p className="font-inter text-slate-500 text-xs leading-relaxed max-w-[200px]">{article.acf.download_attachment}</p>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2 border">
              <div 
                className="bg-secondary h-full transition-all duration-150" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="font-mono text-xs font-bold text-[#062b66]">{progress}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ================= SUB-PAGE 5: IMPACT & VALUES PAGE =================
function ImpactPage({ setCurrentPage, onReadArticle }) {
  const [articles, setArticles] = useState([])
  const [featured, setFeatured] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const categoriesList = [
    'All',
    'Human Security Monitor',
    'Research Brief',
    'Policy Insight',
    'Impact Story',
    'Community Solutions',
    'Governance & Accountability'
  ]

  // Load Featured article once on mount
  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await fetchArticles({ page: 1, perPage: 100, sortBy: 'newest' })
        const feat = res.data.find(art => art.acf?.featured_status === true) || res.data[0]
        setFeatured(feat)
      } catch (err) {
        console.error("Error loading featured article:", err)
      }
    }
    loadFeatured()
  }, [])

  // Load list on state changes
  useEffect(() => {
    async function loadArticles() {
      setLoading(true)
      try {
        const res = await fetchArticles({
          category,
          search,
          page,
          perPage: 12,
          sortBy
        })
        setArticles(res.data)
        setTotal(res.total)
        setTotalPages(res.totalPages)
      } catch (err) {
        console.error("Error loading articles list:", err)
      } finally {
        setLoading(false)
      }
    }
    loadArticles()
  }, [category, search, page, sortBy])

  const handleCategorySelect = (cat) => {
    setCategory(cat)
    setPage(1)
  }

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const handleSortChange = (e) => {
    setSortBy(e.target.value)
    setPage(1)
  }

  return (
    <div className="animate-fade-in bg-white text-primary flex-1">
      
      {/* SECTION BANNER HEADER */}
      <div className="bg-[#052353] py-20 px-6 text-center border-b border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <span className="font-inter text-xs font-bold tracking-[0.25em] text-secondary uppercase mb-2 block animate-fade-up">
            INSIGHTS &amp; IMPACT
          </span>
          <h1 className="font-poppins font-bold text-3xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight max-w-2xl animate-fade-up-delay-1 animate-duration-500">
            From Evidence to Impact
          </h1>
          <p className="font-inter text-white/70 text-sm max-w-[700px] mx-auto mt-4 leading-relaxed animate-fade-up-delay-2">
            Beyond every statistic is a human story. We generate evidence, inform decisions, and support actions that improve lives and strengthen communities across Nigeria.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20">
        
        {/* FEATURED INSIGHT */}
        {featured && (
          <div className="mb-20">
            <h3 className="font-poppins font-bold text-xs uppercase tracking-widest text-slate-400 mb-6 text-left border-b pb-2">
              Featured Insight
            </h3>
            
            <div className="bg-slate-50 border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 gap-0 text-left animate-fade-up">
              
              {/* Image (6 columns) */}
              {featured.featured_media_url && (
                <div className="lg:col-span-6 h-[300px] lg:h-auto min-h-[300px] relative overflow-hidden group">
                  <img 
                    src={featured.featured_media_url} 
                    alt={featured.title.rendered} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}

              {/* Content (6 columns) */}
              <div className="lg:col-span-6 p-8 lg:p-12 flex flex-col justify-center gap-4">
                <span className="font-inter text-[10px] font-bold tracking-[0.2em] text-secondary uppercase">
                  {featured.categories && featured.categories[0] ? featured.categories[0] : 'Insight'}
                </span>
                <h2 className="font-poppins font-bold text-2xl lg:text-3xl text-[#062b66] leading-tight">
                  {featured.title.rendered}
                </h2>
                <p className="font-inter text-slate-500 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: featured.excerpt.rendered }} />
                <div className="flex justify-between items-center mt-4">
                  <span className="font-inter text-[10px] opacity-40 font-semibold">
                    {new Date(featured.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  <button 
                    onClick={() => onReadArticle(featured)}
                    className="bg-primary hover:bg-primary/95 text-white text-xs font-bold px-6 py-3 rounded-full flex items-center gap-2 transition-all duration-200 cursor-pointer shadow border-none outline-none"
                  >
                    READ THE INSIGHT
                    <ArrowUpRight className="w-4 h-4 text-secondary" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SEARCH, FILTER & SORT PANEL */}
        <div className="flex flex-col gap-6 mb-12 text-left border-t border-slate-100 pt-12">
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Search Bar */}
            <div className="relative w-full md:w-96">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search articles & stories..."
                value={search}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-inter text-sm text-primary placeholder-slate-350 outline-none focus:bg-white focus:border-[#062b66] transition-all"
              />
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <span className="font-inter text-xs text-slate-400 font-semibold whitespace-nowrap">Sort By:</span>
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-inter text-xs text-primary outline-none focus:border-[#062b66] cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most-viewed">Most Viewed</option>
              </select>
            </div>

          </div>

          {/* Category Tabs Filter */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200/50 pb-6">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`font-inter text-[9px] font-bold uppercase tracking-widest px-4.5 py-2.5 rounded-full border transition-all cursor-pointer outline-none ${
                  category === cat
                    ? 'bg-[#062b66] text-white border-[#062b66]'
                    : 'bg-white text-slate-650 border-slate-200 hover:border-[#062b66]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>

        {/* ARTICLES & IMPACT GRID */}
        <div className="mb-16 min-h-[300px]">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm p-6 flex flex-col gap-4 animate-pulse">
                  <div className="h-48 bg-slate-100 rounded-2xl w-full"></div>
                  <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                  <div className="h-6 bg-slate-100 rounded w-5/6"></div>
                  <div className="h-10 bg-slate-100 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border text-slate-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="font-poppins font-bold text-lg text-[#062b66]">No Articles Found</h4>
              <p className="font-inter text-slate-400 text-xs max-w-xs">
                No matching articles are currently published in the repository. Try modifying your search query or categories.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
              {articles.map((art) => (
                <div 
                  key={art.id}
                  onClick={() => onReadArticle(art)}
                  className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full cursor-pointer group"
                >
                  <div>
                    {/* Thumbnail */}
                    {art.featured_media_url && (
                      <div className="h-48 relative overflow-hidden">
                        <img 
                          src={art.featured_media_url} 
                          alt={art.title.rendered} 
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    
                    {/* Body */}
                    <div className="p-6 flex flex-col gap-3">
                      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                        <span className="text-secondary">
                          {art.categories && art.categories[0] ? art.categories[0] : 'Insight'}
                        </span>
                        <span className="opacity-40">
                          {new Date(art.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <h4 className="font-poppins font-bold text-base text-[#062b66] leading-snug group-hover:text-[#39B54A] transition-colors line-clamp-2">
                        {art.title.rendered}
                      </h4>
                      <p className="font-inter text-slate-500 text-xs leading-relaxed line-clamp-3" dangerouslySetInnerHTML={{ __html: art.excerpt.rendered }} />
                    </div>
                  </div>

                  {/* Read brief bottom */}
                  <div className="px-6 pb-6 pt-2">
                    <span className="font-inter text-xs font-bold text-primary group-hover:text-[#39B54A] flex items-center gap-1.5 transition-colors cursor-pointer">
                      Read Brief
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* PAGINATION ENGINE */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-center gap-2 border-t border-slate-100 pt-8 mb-16">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-slate-200 rounded-xl font-inter text-xs font-bold hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-all outline-none"
            >
              Previous
            </button>
            <div className="flex gap-1.5">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setPage(idx + 1)}
                  className={`w-9 h-9 rounded-xl font-mono text-xs font-bold cursor-pointer transition-all border outline-none ${
                    page === idx + 1
                      ? 'bg-[#062b66] text-white border-[#062b66]'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-[#062b66]'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-slate-200 rounded-xl font-inter text-xs font-bold hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-all outline-none"
            >
              Next
            </button>
          </div>
        )}

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
            Partner With Beyond#
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
              We collaborate with government entities, international development agencies, research bodies, civil society groups, and local community leadership. Reach out to our offices in Abuja.
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
              Partner With Us
            </h3>
            <p className="font-inter text-slate-500 text-xs mb-6">
              Tell us about your organization and how we can collaborate to turn evidence into action.
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
                    How can we collaborate?
                  </label>
                  <textarea 
                    id="message"
                    name="message"
                    rows="4"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Share details about your project or inquiry..."
                    className="bg-slate-50 border border-slate-200 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl px-4 py-3 font-inter text-sm text-primary placeholder-slate-300 outline-none resize-none transition-all duration-200"
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  className="mt-2 w-full bg-secondary hover:bg-secondary/90 text-white font-inter font-bold text-xs uppercase tracking-widest py-4 rounded-full flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-secondary/15 hover:scale-102 active:scale-98 cursor-pointer outline-none border-none"
                >
                  SUBMIT INQUIRY
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

  // Partners Filter State
  const [selectedPartnerCategory, setSelectedPartnerCategory] = useState('All')

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

  const partnerCategories = [
    'All',
    'Government Institutions',
    'Development Partners',
    'Foundations',
    'Universities',
    'Research Institutes',
    'Corporate Organizations',
    'Civil Society Networks'
  ]

  const partnerLogos = [
    { name: "Federal Ministry of Budget & Economic Planning", category: "Government Institutions", shortcut: "FMBEP", desc: "National Planning Authority" },
    { name: "UN Development Programme", category: "Development Partners", shortcut: "UNDP", desc: "Empowered lives. Resilient nations." },
    { name: "MacArthur Foundation", category: "Foundations", shortcut: "MAC", desc: "Supporting creative people & institutions." },
    { name: "Abuja Policy Research Institute", category: "Research Institutes", shortcut: "APRI", desc: "Independent public policy research." },
    { name: "The Ford Foundation", category: "Foundations", shortcut: "FORD", desc: "Social justice and shared opportunity." },
    { name: "Dangote Social Impact Fund", category: "Corporate Organizations", shortcut: "DANGOTE", desc: "Driving African industrialization and impact." },
    { name: "Lagos Business School", category: "Universities", shortcut: "LBS", desc: "Developing business and society leaders." },
    { name: "National Human Security Council", category: "Government Institutions", shortcut: "NHSC", desc: "National Coordination Dashboard" },
    { name: "Civil Society Accountability Network", category: "Civil Society Networks", shortcut: "CSAN", desc: "Transparency and governance watchdog." }
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

  const filteredPartners = selectedPartnerCategory === 'All' 
    ? partnerLogos 
    : partnerLogos.filter(p => p.category === selectedPartnerCategory)

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

      {/* 5. CURRENT & FUTURE PARTNERS (LOGO SHOWCASE) */}
      <section className="bg-slate-50 border-t border-slate-100 py-24 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          
          <div className="mb-12">
            <span className="font-inter text-[10px] font-bold tracking-[0.2em] text-[#39B54A] uppercase block mb-2">SHARED VALUE NETWORK</span>
            <h2 className="font-poppins font-bold text-2xl md:text-3xl text-[#062b66]">Building Impact Through Collaboration</h2>
            <p className="font-inter text-slate-500 text-xs sm:text-sm max-w-xl mx-auto mt-2">
              Beyond# welcomes collaboration with institutions committed to evidence, accountability, and sustainable development.
            </p>
          </div>

          {/* Categories Tab Filter */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-12 max-w-4xl border-b border-slate-200 pb-6">
            {partnerCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedPartnerCategory(cat)}
                className={`font-inter text-[9px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-full border transition-all cursor-pointer outline-none ${
                  selectedPartnerCategory === cat
                    ? 'bg-[#062b66] text-white border-[#062b66]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-[#062b66]'
                }`}
              >
                {cat.replace(' Institutions', '').replace(' Organizations', '').replace(' Networks', '')}
              </button>
            ))}
          </div>

          {/* Logo Cards Grid */}
          <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredPartners.map((logo, idx) => (
              <div 
                key={idx}
                className="bg-white border border-slate-200/80 p-6 rounded-2xl flex flex-col justify-between items-start text-left hover:border-[#39B54A] hover:shadow-sm transition-all duration-300 group h-[140px] relative overflow-hidden"
              >
                <span className="absolute top-4 right-4 font-poppins font-extrabold text-[10px] text-slate-200 group-hover:text-[#39B54A]/30 transition-colors">
                  PARTNER
                </span>
                <div>
                  <div className="font-poppins font-black text-2xl tracking-tighter text-slate-300 group-hover:text-[#062b66] transition-colors mb-2">
                    {logo.shortcut}
                  </div>
                  <h4 className="font-poppins font-bold text-xs text-[#062b66] line-clamp-1 leading-snug">
                    {logo.name}
                  </h4>
                  <p className="font-inter text-[9px] text-slate-400 mt-1 line-clamp-2">
                    {logo.desc}
                  </p>
                </div>
                <div className="font-inter text-[8px] font-semibold text-slate-400 group-hover:text-[#39B54A] transition-colors uppercase mt-2">
                  {logo.category.replace(' Institutions', '').replace(' Organizations', '')}
                </div>
              </div>
            ))}

            {/* Future placeholders */}
            {Array.from({ length: 4 - (filteredPartners.length % 4 || 4) + 4 }).map((_, idx) => (
              <div 
                key={`placeholder-${idx}`}
                className="border border-dashed border-slate-300 bg-white/5 p-6 rounded-2xl flex flex-col justify-center items-center text-center opacity-65 h-[140px] hover:opacity-100 hover:border-[#39B54A] hover:bg-slate-100/50 transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-full border border-dashed border-slate-400 text-slate-400 flex items-center justify-center font-inter text-sm mb-2 font-bold">+</div>
                <span className="font-poppins font-bold text-[10px] tracking-wide text-slate-500">Future Partner</span>
                <span className="font-inter text-[8px] text-slate-400 mt-0.5 uppercase tracking-wider">
                  {selectedPartnerCategory === 'All' ? 'Select Domain' : selectedPartnerCategory.replace(' Institutions', '')}
                </span>
              </div>
            ))}
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

// ================= GLOBAL SEARCH OVERLAY MODAL =================
function GlobalSearchModal({ isOpen, onClose, onSelectArticle }) {
  const [query, setQuery] = useState('')
  const [results, setSearchResults] = useState({ articles: [], publications: [], projects: [] })
  const [loading, setLoading] = useState(false)
  const [downloadingFile, setDownloadingFile] = useState(null)
  const [downloadProgress, setDownloadProgress] = useState(0)

  const popularSearches = [
    'Food Security',
    'Kaduna',
    'Annual Report 2025',
    'Climate Vulnerability',
    'Human Security Monitor'
  ]

  useEffect(() => {
    if (!query || query.trim() === '') {
      setSearchResults({ articles: [], publications: [], projects: [] })
      return
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await globalSearch(query)
        setSearchResults(res)
      } catch (err) {
        console.error("Global search failed:", err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [query])

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setSearchResults({ articles: [], publications: [], projects: [] })
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleDownload = (fileName) => {
    setDownloadingFile(fileName)
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
        }, 600)
      }
    }, 120)
  }

  const totalResults = results.articles.length + results.publications.length + results.projects.length

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-start justify-center p-4 sm:p-6 md:p-10 animate-fade-in no-print">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl mt-10 animate-scale-up text-left">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 relative">
          <Search className="w-6 h-6 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search publications, policy briefs, articles, projects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full font-inter text-lg text-primary placeholder-slate-350 outline-none border-none bg-transparent"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all outline-none border-none bg-transparent cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-2 rounded-full border border-slate-200 hover:bg-[#062b66] hover:text-white transition-all duration-200 cursor-pointer outline-none bg-slate-50 text-slate-500"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-8 flex-1 flex flex-col gap-8">
          {!query && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <h4 className="font-poppins font-bold text-xs uppercase tracking-widest text-slate-400">Popular Searches</h4>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="font-inter text-xs text-slate-650 bg-slate-50 border border-slate-200 hover:border-[#062b66] hover:bg-white px-4 py-2.5 rounded-full transition-all cursor-pointer outline-none"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col gap-6 animate-pulse">
              {[1, 2].map((n) => (
                <div key={n} className="flex flex-col gap-2">
                  <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                  <div className="h-12 bg-slate-50 rounded-2xl w-full"></div>
                </div>
              ))}
            </div>
          )}

          {query && !loading && totalResults === 0 && (
            <div className="py-12 text-center flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border text-slate-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="font-poppins font-bold text-base text-[#062b66]">No results match "{query}"</h4>
              <p className="font-inter text-slate-400 text-xs max-w-xs">
                Double check spelling or try terms like "Abuja", "annual", "observatory", or "climate".
              </p>
            </div>
          )}

          {query && !loading && totalResults > 0 && (
            <div className="flex flex-col gap-8">
              {results.articles.length > 0 && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  <h4 className="font-poppins font-bold text-xs uppercase tracking-widest text-[#39B54A] border-b pb-2">
                    Research Insights &amp; Stories ({results.articles.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.articles.map(art => (
                      <div 
                        key={art.id}
                        onClick={() => {
                          onSelectArticle(art)
                          onClose()
                        }}
                        className="bg-slate-50 border border-slate-150 hover:border-secondary p-5 rounded-2xl flex flex-col justify-between items-start cursor-pointer transition-all hover:-translate-y-0.5 group h-full"
                      >
                        <div>
                          <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-wider w-full mb-1">
                            <span className="text-secondary">{art.categories && art.categories[0] ? art.categories[0] : 'Insight'}</span>
                            <span className="opacity-40">{new Date(art.date).toLocaleDateString()}</span>
                          </div>
                          <h5 className="font-poppins font-bold text-xs text-[#062b66] leading-snug group-hover:text-secondary transition-colors line-clamp-2 mb-1">
                            {art.title.rendered}
                          </h5>
                          <p className="font-inter text-slate-500 text-[10px] leading-relaxed line-clamp-2" dangerouslySetInnerHTML={{ __html: art.excerpt.rendered }} />
                        </div>
                        <span className="font-inter text-[9px] font-bold text-slate-400 group-hover:text-[#062b66] uppercase mt-3 flex items-center gap-1 transition-colors">
                          Read brief <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.publications.length > 0 && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  <h4 className="font-poppins font-bold text-xs uppercase tracking-widest text-[#062b66] border-b pb-2">
                    Publications Library ({results.publications.length})
                  </h4>
                  <div className="flex flex-col gap-3">
                    {results.publications.map(pub => (
                      <div 
                        key={pub.id}
                        className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                      >
                        <div className="flex items-start sm:items-center gap-3 text-left">
                          <div className="w-10 h-14 bg-slate-200 rounded overflow-hidden flex-shrink-0 border hidden sm:block">
                            <img src={pub.cover_image_url || '/logo.png'} alt={pub.title.rendered} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <span className="text-[#39B54A] font-inter text-[8px] font-bold uppercase tracking-wider block mb-0.5">
                              {pub.acf.publication_type} ({pub.acf.year})
                            </span>
                            <h5 className="font-poppins font-bold text-xs text-[#062b66] leading-tight mb-1">
                              {pub.title.rendered}
                            </h5>
                            <p className="font-inter text-slate-450 text-[10px] leading-relaxed line-clamp-2 max-w-xl">
                              {pub.acf.summary}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDownload(pub.acf.pdf_upload)}
                          disabled={downloadingFile !== null}
                          className="w-full sm:w-auto bg-[#062b66] hover:bg-[#062b66]/90 text-white font-inter text-[9px] font-bold px-4 py-2.5 rounded-full uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer border-none outline-none flex-shrink-0"
                        >
                          Download
                          <Download className="w-3.5 h-3.5 text-secondary" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.projects.length > 0 && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  <h4 className="font-poppins font-bold text-xs uppercase tracking-widest text-[#062b66] border-b pb-2">
                    Human Security Observatory Projects ({results.projects.length})
                  </h4>
                  <div className="flex flex-col gap-4">
                    {results.projects.map(p => (
                      <div 
                        key={p.id}
                        className="bg-slate-50 border border-slate-150 p-6 rounded-2xl flex flex-col gap-4 text-left shadow-sm hover:border-[#39B54A] transition-all"
                      >
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <div>
                            <span className="text-[#39B54A] font-inter text-[9px] font-bold uppercase tracking-wider block">
                              Location: {p.acf.location} (Lat: {p.acf.coordinates.lat}, Lng: {p.acf.coordinates.lng})
                            </span>
                            <h5 className="font-poppins font-bold text-sm text-[#062b66] leading-tight mt-0.5">
                              {p.acf.project_name}
                            </h5>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {p.acf.partners.map((partner, pIdx) => (
                              <span key={pIdx} className="bg-[#062b66]/10 text-[#062b66] font-inter text-[8px] font-bold px-2 py-1 rounded-md">
                                {partner}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="font-inter text-slate-500 text-xs leading-relaxed">
                          {p.acf.description}
                        </p>
                        <div className="border-t border-slate-200/60 pt-3 mt-1 grid grid-cols-3 gap-4">
                          {Object.entries(p.acf.impact_statistics).map(([label, val], sIdx) => (
                            <div key={sIdx} className="flex flex-col">
                              <span className="font-mono text-xs font-bold text-[#062b66]">{val}</span>
                              <span className="font-inter text-[9px] text-slate-400 uppercase">{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {downloadingFile && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200 p-8 rounded-[2rem] w-full max-w-sm flex flex-col items-center gap-4 text-center shadow-lg animate-scale-up">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
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

// ================= APP COMPONENT (Router Shell) =================
function App() {
  const slides = [
    '/hero_community.png',
    '/hero_women.png',
    '/hero_research.png'
  ]

  // Dynamic Routing state: 'home' | 'about' | 'programs' | 'impact-map' | 'dashboard' | 'research' | 'impact' | 'contact'
  const [currentPage, setCurrentPage] = useState('home')

  // Mobile menu open
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Global Search Overlay state
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Active article state for global reader modal
  const [activeArticle, setActiveArticle] = useState(null)

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
      <div className="w-full bg-[#051c44] border-b border-white/5 relative z-30">
        <Header 
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          setIsMenuOpen={setIsMenuOpen}
          setIsSearchOpen={setIsSearchOpen}
        />
      </div>

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
              { name: 'Research Hub', id: 'research' },
              { name: 'Our Impact Stories', id: 'impact' },
              { name: 'Our Impact Map', id: 'impact-map', indent: true },
              { name: 'Support & Partnerships', id: 'partnerships' },
              { name: 'Contact Us', id: 'contact' }
            ].map((link, idx) => (
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
          <InsightImpactNewsSection onReadArticle={setActiveArticle} />
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
        <HumanSecurityDashboard />
      )}

      {currentPage === 'research' && (
        <ResearchPage />
      )}

      {currentPage === 'impact' && (
        <ImpactPage setCurrentPage={setCurrentPage} onReadArticle={setActiveArticle} />
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

      {/* GLOBAL FOOTER */}
      <Footer setCurrentPage={setCurrentPage} />

      {/* REUSABLE GLOBAL MODALS */}
      <GlobalSearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectArticle={setActiveArticle}
      />

      <ArticleReaderModal 
        article={activeArticle}
        onClose={() => setActiveArticle(null)}
        onSelectArticle={setActiveArticle}
      />

    </div>
  )
}

export default App
