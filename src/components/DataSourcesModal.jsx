import React from 'react';
import { Database, X } from 'lucide-react';

export default function DataSourcesModal({ isDarkMode, onClose }) {
  return (
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
            onClick={onClose}
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
              { name: "Beyond# Live Conflict Tracker", d: "Real-time geolocated conflict logs, fatalities, and regional security incidents parsed from national news feeds." }
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
            onClick={onClose}
            className="bg-[#39B54A] hover:bg-[#2e993d] text-white text-xs font-bold px-6 py-2.5 rounded-full cursor-pointer outline-none border-none uppercase tracking-wider"
          >
            Close Registry
          </button>
        </div>
      </div>
    </div>
  );
}