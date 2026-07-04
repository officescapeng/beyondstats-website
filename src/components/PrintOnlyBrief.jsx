import React from 'react';

export default function PrintOnlyBrief({ activeState, policyBrief }) {
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
        <h1 className="text-3xl font-bold uppercase tracking-tight">Executive Security Profile</h1>
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

      {/* All six pillars, not just three -- the composite score is made up of
          all of these, so dropping half of them here was misleading in an
          "Executive" summary. */}
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

      {/* Strategic implications & recommendations -- already computed by
          getStatePolicyBrief() in the parent dashboard for the Projections
          tab, but was never passed down here, so the "brief" had no actual
          analysis in it. */}
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
