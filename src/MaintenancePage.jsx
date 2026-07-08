import React, { useState } from 'react'
import { Shield, CheckCircle, Mail, ArrowUpRight } from 'lucide-react'

export default function MaintenancePage() {
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

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
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
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#030f26] overflow-hidden px-6 py-12 flex-1 text-white">
      {/* Background Animated Gradients */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#39b54a]/10 rounded-full blur-[120px] animate-[pulse_6s_infinite] duration-1000"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[#062b66]/30 rounded-full blur-[150px] animate-[pulse_8s_infinite] duration-2000"></div>
        {/* Grid Overlay */}
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
