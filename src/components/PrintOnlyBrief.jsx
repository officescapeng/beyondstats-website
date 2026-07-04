import React from 'react';

export default function PrintOnlyBrief({ mode = 'profile', activeState, policyBrief, forecastData, outlook }) {
  if (!activeState) return null;

  const pillars = [
    { name: "Poverty & Livelihoods", value: activeState.risks.poverty },
    { name: "Education Systems", value: activeState.risks.education },
    { name: "Health & Wellbeing", value: activeState.risks.health },
    { name: "Food Security & Nutrition", value: activeState.risks.foodSecurity },
    { name: "Displacement & Migration", value: activeState.risks.displacement },
    { name: "Peace & Public Security", value: activeState.risks.peaceSecurity }
  ];

  return (
    <div className="w-full p-10 bg-white text-slate-900 print-only-brief">
      <header className="border-b-2 border-slate-900 pb-6 mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-tight">
          {mode === 'trend' ? 'Risk Trend & Forecast Brief' : 'Executive Security Profile'}
        </h1>
        <p className="text-sm opacity-70">Generated: {new Date().toLocaleDateString()}</p>
      </header>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 uppercase">{activeState.name} State Analysis</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="p-4 border border-slate-200 rounded-lg">
            <p className="text-xs uppercase opacity-60 font-bold">Composite Risk Score</p>
            <p className="text-3xl font-bold">{activeState.risks.composite}/100</p>
          </div>
          <div className="p-4 border border-slate-200 rounded-lg">
            <p className="text-xs uppercase opacity-60 font-bold">Primary Threat</p>
            <p className="text-xl font-semibold capitalize">{activeState.primaryThreat || 'General Security'}</p>
          </div>
        </div>
      </section>

      {mode === 'trend' && forecastData && outlook ? (
        <>
          {/* Trend Brief: quarterly forecast table + outlook narrative.
              Deliberately rendered as a plain table rather than reusing the
              live Recharts LineChart -- print output shouldn't depend on a
              chart library remeasuring itself correctly inside window.print(). */}
          <section className="mb-10">
            <h3 className="text-sm font-bold uppercase mb-4">Quarterly Composite Risk Forecast</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-xs uppercase opacity-60">
                  <th className="text-left py-2">Quarter</th>
                  <th className="text-right py-2">Actual</th>
                  <th className="text-right py-2">Forecast</th>
                </tr>
              </thead>
              <tbody>
                {forecastData.map((row) => (
                  <tr key={row.quarter} className="border-b border-slate-100">
                    <td className="py-2">{row.quarter}</td>
                    <td className="py-2 text-right font-mono">{row.Actual ?? '—'}</td>
                    <td className="py-2 text-right font-mono">{row.Forecast ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="mb-10">
            <h3 className="text-sm font-bold uppercase mb-4">Dimensional Outlook</h3>
            <div className="grid grid-cols-1 gap-4">
              {[
                { label: 'Poverty & Inflation', data: outlook.poverty },
                { label: 'Food Security', data: outlook.food },
                { label: 'Conflict & Safety', data: outlook.security }
              ].map((item) => (
                <div key={item.label} className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm">{item.label}</span>
                    <span className="font-mono text-sm">
                      {item.data.change > 0 ? `+${item.data.change}` : item.data.change}%
                    </span>
                  </div>
                  <p className="text-xs opacity-70 mb-1">Trend: {item.data.trend}</p>
                  <p className="text-xs">{item.data.alert}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        /* Profile Brief: all six pillars -- the composite score is made up
           of all of these, so showing only three (as before) was misleading
           in an "Executive" summary. */
        <section className="mb-10">
          <h3 className="text-sm font-bold uppercase mb-4">Key Dimensional Metrics</h3>
          <ul className="space-y-3">
            {pillars.map((p) => (
              <li key={p.name} className="flex justify-between border-b border-slate-100 py-2">
                <span>{p.name}</span>
                <span className="font-mono font-bold">{p.value}/100</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {policyBrief && (
        <section className="grid grid-cols-2 gap-6">
          <div className="p-4 border border-slate-200 rounded-lg">
            <h4 className="text-xs font-bold uppercase mb-2 opacity-70">Strategic Implications</h4>
            <p className="text-xs leading-relaxed">{policyBrief.implications}</p>
          </div>
          <div className="p-4 border border-slate-200 rounded-lg">
            <h4 className="text-xs font-bold uppercase mb-2 opacity-70">Policy Recommendations</h4>
            <ul className="list-disc pl-4 text-xs leading-relaxed space-y-1">
              {policyBrief.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <footer className="mt-10 pt-4 border-t border-slate-200 text-[10px] opacity-50">
        Source: Beyond# Human Security Observatory -- see Data Sources & Registry for full methodology.
      </footer>
    </div>
  );
}
