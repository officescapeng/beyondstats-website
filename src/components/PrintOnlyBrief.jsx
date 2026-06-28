import React from 'react';
import { getRiskCategory, NATIONAL_AVERAGES } from '../data/humanSecurityData';

export default function PrintOnlyBrief({ activeState }) {
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="print-only-brief text-black bg-white p-8 max-w-[800px] mx-auto text-left">
      {/* PAGE 1 */}
      <div className="flex flex-col gap-6 w-full">
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
            <p className="text-[9px] text-slate-500 mt-1">Generated: {dateStr}</p>
          </div>
        </div>

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

        <div className="border-b border-slate-200 pb-2">
          <h3 className="font-poppins font-bold text-sm uppercase tracking-wider text-[#052353]">
            I. Core Security &amp; Vulnerability Pillars
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-6 w-full">
          {/* Pillar 1: Poverty */}
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="font-poppins font-bold text-xs uppercase text-[#052353]">1. Poverty &amp; Livelihoods</h4>
              <span className="text-xs font-bold font-mono bg-slate-100 px-2 py-0.5 rounded">Index Score: {activeState.risks.poverty}/100</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="opacity-50 text-[10px] uppercase font-bold text-left">
                  <th className="pb-1.5">Indicator Metric</th><th className="pb-1.5 text-right">State</th><th className="pb-1.5 text-right">National Avg</th>
                </tr>
              </thead>
              <tbody className="font-semibold text-slate-700">
                <tr className="border-t border-slate-150">
                  <td className="py-2">Multidimensional Poverty Index (%)</td><td className="py-2 text-right font-mono">{activeState.poverty.mpi}%</td><td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.poverty.mpi}%</td>
                </tr>
                <tr className="border-t border-slate-150">
                  <td className="py-2">Unemployment Rate (%)</td><td className="py-2 text-right font-mono">{activeState.poverty.unemployment}%</td><td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.poverty.unemployment}%</td>
                </tr>
                <tr className="border-t border-slate-150">
                  <td className="py-2">Inflation Impact Index (1-10)</td><td className="py-2 text-right font-mono">{activeState.poverty.inflationImpact}/10</td><td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.poverty.inflationImpact}/10</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pillar 2: Education */}
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="font-poppins font-bold text-xs uppercase text-[#052353]">2. Education Systems</h4>
              <span className="text-xs font-bold font-mono bg-slate-100 px-2 py-0.5 rounded">Index Score: {activeState.risks.education}/100</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="opacity-50 text-[10px] uppercase font-bold text-left">
                  <th className="pb-1.5">Indicator Metric</th><th className="pb-1.5 text-right">State</th><th className="pb-1.5 text-right">National Avg</th>
                </tr>
              </thead>
              <tbody className="font-semibold text-slate-700">
                <tr className="border-t border-slate-150">
                  <td className="py-2">Net School Attendance Rate (%)</td><td className="py-2 text-right font-mono">{activeState.education.attendance}%</td><td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.education.attendance}%</td>
                </tr>
                <tr className="border-t border-slate-150">
                  <td className="py-2">Out-of-School Children Rate (%)</td><td className="py-2 text-right font-mono">{activeState.education.outOfSchool}%</td><td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.education.outOfSchool}%</td>
                </tr>
                <tr className="border-t border-slate-150">
                  <td className="py-2">Youth Literacy Rate (%)</td><td className="py-2 text-right font-mono">{activeState.education.literacy}%</td><td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.education.literacy}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pillar 3: Health */}
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="font-poppins font-bold text-xs uppercase text-[#052353]">3. Health &amp; Wellbeing</h4>
              <span className="text-xs font-bold font-mono bg-slate-100 px-2 py-0.5 rounded">Index Score: {activeState.risks.health}/100</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="opacity-50 text-[10px] uppercase font-bold text-left">
                  <th className="pb-1.5">Indicator Metric</th><th className="pb-1.5 text-right">State</th><th className="pb-1.5 text-right">National Avg</th>
                </tr>
              </thead>
              <tbody className="font-semibold text-slate-700">
                <tr className="border-t border-slate-150">
                  <td className="py-2">Maternal Health Deprivation Index</td><td className="py-2 text-right font-mono">{activeState.health.maternalHealth}/100</td><td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.health.maternalHealth}/100</td>
                </tr>
                <tr className="border-t border-slate-150">
                  <td className="py-2">Basic Immunization Coverage (%)</td><td className="py-2 text-right font-mono">{activeState.health.childHealth}%</td><td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.health.childHealth}%</td>
                </tr>
                <tr className="border-t border-slate-150">
                  <td className="py-2">Access to Healthcare Facilities (%)</td><td className="py-2 text-right font-mono">{activeState.health.healthcareAccess}%</td><td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.health.healthcareAccess}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PAGE 2 */}
      <div className="page-break flex flex-col gap-6 w-full pt-10">
        <div className="flex justify-between items-center border-b border-black pb-4">
          <h2 className="font-poppins font-black text-lg tracking-tighter text-[#052353]">BEYOND STATISTICS INITIATIVE</h2>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{activeState.name} State Risk Profile Continued</p>
        </div>

        <div className="border-b border-slate-200 pb-2">
          <h3 className="font-poppins font-bold text-sm uppercase tracking-wider text-[#052353]">I. Core Security &amp; Vulnerability Pillars (Continued)</h3>
        </div>

        <div className="grid grid-cols-1 gap-6 w-full">
          {/* Pillar 4: Food Security */}
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="font-poppins font-bold text-xs uppercase text-[#052353]">4. Food Security &amp; Nutrition</h4>
              <span className="text-xs font-bold font-mono bg-slate-100 px-2 py-0.5 rounded">Index Score: {activeState.risks.foodSecurity}/100</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="opacity-50 text-[10px] uppercase font-bold text-left">
                  <th className="pb-1.5">Indicator Metric</th><th className="pb-1.5 text-right">State</th><th className="pb-1.5 text-right">National Avg</th>
                </tr>
              </thead>
              <tbody className="font-semibold text-slate-700">
                <tr className="border-t border-slate-150">
                  <td className="py-2">Acceptable Food Consumption Rate (%)</td><td className="py-2 text-right font-mono">{activeState.foodSecurity.foodConsumption}%</td><td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.foodSecurity.foodConsumption}%</td>
                </tr>
                <tr className="border-t border-slate-150">
                  <td className="py-2">Phase 3+ Acute Food Insecurity (%)</td><td className="py-2 text-right font-mono">{activeState.foodSecurity.acuteInsecurity}%</td><td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.foodSecurity.acuteInsecurity}%</td>
                </tr>
                <tr className="border-t border-slate-150">
                  <td className="py-2">Child Wasting &amp; Nutrition Risk (1-10)</td><td className="py-2 text-right font-mono">{activeState.foodSecurity.nutritionRisk}/10</td><td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.foodSecurity.nutritionRisk}/10</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pillar 5: Displacement */}
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="font-poppins font-bold text-xs uppercase text-[#052353]">5. Displacement &amp; Migration</h4>
              <span className="text-xs font-bold font-mono bg-slate-100 px-2 py-0.5 rounded">Index Score: {activeState.risks.displacement}/100</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="opacity-50 text-[10px] uppercase font-bold text-left">
                  <th className="pb-1.5">Indicator Metric</th><th className="pb-1.5 text-right">State</th><th className="pb-1.5 text-right">National Avg</th>
                </tr>
              </thead>
              <tbody className="font-semibold text-slate-700">
                <tr className="border-t border-slate-150">
                  <td className="py-2">Active IDP Population</td><td className="py-2 text-right font-mono">{activeState.displacement.idps.toLocaleString()}</td><td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.displacement.idps.toLocaleString()}</td>
                </tr>
                <tr className="border-t border-slate-150">
                  <td className="py-2">Registered Returnees</td><td className="py-2 text-right font-mono">{activeState.displacement.returnees.toLocaleString()}</td><td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.displacement.returnees.toLocaleString()}</td>
                </tr>
                <tr className="border-t border-slate-150">
                  <td className="py-2">New Displacement Events (1 Year)</td><td className="py-2 text-right font-mono">{activeState.displacement.newEvents}</td><td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.displacement.newEvents}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pillar 6: Peace & Security */}
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="font-poppins font-bold text-xs uppercase text-[#052353]">6. Peace &amp; Security</h4>
              <span className="text-xs font-bold font-mono bg-slate-100 px-2 py-0.5 rounded">Index Score: {activeState.risks.peaceSecurity}/100</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="opacity-50 text-[10px] uppercase font-bold text-left">
                  <th className="pb-1.5">Indicator Metric</th><th className="pb-1.5 text-right">State</th><th className="pb-1.5 text-right">National Avg</th>
                </tr>
              </thead>
              <tbody className="font-semibold text-slate-700">
                <tr className="border-t border-slate-150">
                  <td className="py-2">Conflict Incidents (1 Year)</td><td className="py-2 text-right font-mono">{activeState.peaceSecurity.conflictIncidents}</td><td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.peaceSecurity.conflictIncidents}</td>
                </tr>
                <tr className="border-t border-slate-150">
                  <td className="py-2">Conflict-Related Fatalities (1 Year)</td><td className="py-2 text-right font-mono">{activeState.peaceSecurity.fatalities}</td><td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.peaceSecurity.fatalities}</td>
                </tr>
                <tr className="border-t border-slate-150">
                  <td className="py-2">Feelings of Safety in Neighborhood (%)</td><td className="py-2 text-right font-mono">{activeState.peaceSecurity.communitySecurity}%</td><td className="py-2 text-right font-mono">{NATIONAL_AVERAGES.peaceSecurity.communitySecurity}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-300 pt-6">
          <h4 className="font-poppins font-bold text-xs uppercase text-[#052353] mb-2">II. Aggregation Registry &amp; Methodology References</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            This executive brief aggregates datasets from: **National Bureau of Statistics (NBS)**; **World Bank**; **UNICEF &amp; WHO**; **Cadre Harmonisé Joint Analysis**; **IOM DTM &amp; NEMA**; and **Beyond# Live Tracker**.
          </p>
          <div className="flex justify-between items-center mt-6 text-[9px] font-bold text-slate-400">
            <span>BEYOND STATISTICS SECRETARIAT • ABUJA, FCT, NIGERIA</span>
            <span>VERIFIED AGGREGATION ARRAY V1.06</span>
          </div>
        </div>
      </div>
    </div>
  );
}