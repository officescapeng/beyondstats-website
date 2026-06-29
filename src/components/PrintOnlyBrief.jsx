import React from 'react';

export default function PrintOnlyBrief({ activeState }) {
  if (!activeState) return null;

  return (
    <div className="hidden print:block w-full p-10 bg-white text-slate-900">
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

      <section>
        <h3 className="text-sm font-bold uppercase mb-4">Key Dimensional Metrics</h3>
        <ul className="space-y-3">
          <li className="flex justify-between border-b border-slate-100 py-2">
            <span>Poverty & Livelihoods</span>
            <span className="font-mono font-bold">{activeState.risks.poverty}/100</span>
          </li>
          <li className="flex justify-between border-b border-slate-100 py-2">
            <span>Food Security</span>
            <span className="font-mono font-bold">{activeState.risks.foodSecurity}/100</span>
          </li>
          <li className="flex justify-between border-b border-slate-100 py-2">
            <span>Public Security</span>
            <span className="font-mono font-bold">{activeState.risks.security}/100</span>
          </li>
        </ul>
      </section>
    </div>
  );
}