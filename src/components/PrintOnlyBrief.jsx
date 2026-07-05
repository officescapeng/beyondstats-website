import React from 'react';
import { NATIONAL_AVERAGES } from '../data/humanSecurityData';

// Matches the dashboard's own getSeverityColor() thresholds, so the visual
// bars in the print brief use the same color language as the on-screen map
// and pillar breakdowns.
function getBarColor(score) {
  if (score < 35) return '#10B981';
  if (score < 55) return '#F59E0B';
  if (score < 75) return '#EA580C';
  return '#BE123C';
}

// A single pillar block: title, composite pillar score with a visual bar,
// and a 3-row State-vs-National-Average comparison table. The bar makes this
// read as a visual brief rather than a plain data table -- matches the
// letterhead-brief design (pre-componentization) so print output reads as a
// real institutional report rather than a bare summary card.
function PillarTable({ number, title, score, rows }) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
        <h4 className="font-poppins font-bold text-xs uppercase text-[#052353]">
          {number}. {title}
        </h4>
        <span className="text-xs font-bold font-mono bg-slate-100 px-2 py-0.5 rounded">
          Index Score: {score}/100
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          style={{ width: `${score}%`, backgroundColor: getBarColor(score) }}
          className="h-full rounded-full"
        />
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="opacity-50 text-[10px] uppercase font-bold text-left">
            <th className="pb-1.5">Indicator Metric</th>
            <th className="pb-1.5 text-right">State</th>
            <th className="pb-1.5 text-right">National Avg</th>
          </tr>
        </thead>
        <tbody className="font-semibold text-slate-700">
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-150">
              <td className="py-2">{r.label}</td>
              <td className="py-2 text-right font-mono">{r.state}</td>
              <td className="py-2 text-right font-mono">{r.avg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const LetterheadRow = ({ subtitle }) => (
  <div className="flex justify-between items-center border-b border-black pb-4">
    <h2 className="font-poppins font-black text-lg tracking-tighter text-[#052353]">
      BEYOND STATISTICS INITIATIVE
    </h2>
    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{subtitle}</p>
  </div>
);

export default function PrintOnlyBrief({ mode = 'profile', activeState, policyBrief, forecastData, outlook }) {
  if (!activeState) return null;

  const compositeBadgeClass =
    activeState.risks.composite >= 75 ? 'bg-red-100 text-red-700 border border-red-300' :
    activeState.risks.composite >= 55 ? 'bg-orange-100 text-orange-700 border border-orange-300' :
    activeState.risks.composite >= 35 ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
    'bg-emerald-100 text-emerald-700 border border-emerald-300';

  const compositeLabel =
    activeState.risks.composite >= 75 ? 'Critical' :
    activeState.risks.composite >= 55 ? 'High' :
    activeState.risks.composite >= 35 ? 'Moderate' : 'Low';

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
              {mode === 'trend' ? 'Trend & Forecast Brief' : 'Executive Profile Brief'}
            </span>
            <p className="text-[9px] text-slate-500 mt-1">
              Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
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
            <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mt-1 ${compositeBadgeClass}`}>
              {compositeLabel}
            </span>
          </div>
        </div>

        {/* Visual gauge for the composite score -- gives the summary a
            visual anchor instead of a bare number, mirroring the on-screen
            RiskGauge component. */}
        <div className="flex flex-col gap-1.5 px-1">
          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
            <div
              style={{ width: `${activeState.risks.composite}%`, backgroundColor: getBarColor(activeState.risks.composite) }}
              className="h-full rounded-full"
            />
          </div>
          <div className="flex justify-between text-[8px] font-mono uppercase tracking-widest text-slate-400">
            <span>0 (Secure)</span>
            <span>35</span>
            <span>55</span>
            <span>75</span>
            <span>100 (Critical)</span>
          </div>
        </div>

        <div className="border-b border-slate-200 pb-2">
          <h3 className="font-poppins font-bold text-sm uppercase tracking-wider text-[#052353]">
            I. Core Security &amp; Vulnerability Pillars
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-6 w-full">
          <PillarTable
            number={1} title="Poverty & Livelihoods" score={activeState.risks.poverty}
            rows={[
              { label: 'Multidimensional Poverty Index (%)', state: `${activeState.poverty.mpi}%`, avg: `${NATIONAL_AVERAGES.poverty.mpi}%` },
              { label: 'Unemployment Rate (%)', state: `${activeState.poverty.unemployment}%`, avg: `${NATIONAL_AVERAGES.poverty.unemployment}%` },
              { label: 'Inflation Impact Index (1-10)', state: `${activeState.poverty.inflationImpact}/10`, avg: `${NATIONAL_AVERAGES.poverty.inflationImpact}/10` }
            ]}
          />
          <PillarTable
            number={2} title="Education Systems" score={activeState.risks.education}
            rows={[
              { label: 'Net School Attendance Rate (%)', state: `${activeState.education.attendance}%`, avg: `${NATIONAL_AVERAGES.education.attendance}%` },
              { label: 'Out-of-School Children Rate (%)', state: `${activeState.education.outOfSchool}%`, avg: `${NATIONAL_AVERAGES.education.outOfSchool}%` },
              { label: 'Youth Literacy Rate (%)', state: `${activeState.education.literacy}%`, avg: `${NATIONAL_AVERAGES.education.literacy}%` }
            ]}
          />
          <PillarTable
            number={3} title="Health & Wellbeing" score={activeState.risks.health}
            rows={[
              { label: 'Maternal Health Deprivation Index', state: `${activeState.health.maternalHealth}/100`, avg: `${NATIONAL_AVERAGES.health.maternalHealth}/100` },
              { label: 'Basic Immunization Coverage (%)', state: `${activeState.health.childHealth}%`, avg: `${NATIONAL_AVERAGES.health.childHealth}%` },
              { label: 'Access to Healthcare Facilities (%)', state: `${activeState.health.healthcareAccess}%`, avg: `${NATIONAL_AVERAGES.health.healthcareAccess}%` }
            ]}
          />
        </div>
      </div>

      {/* PAGE 2 */}
      <div className="page-break flex flex-col gap-6 w-full pt-10">
        <LetterheadRow subtitle={`${activeState.name} State Risk Profile Continued`} />

        <div className="border-b border-slate-200 pb-2">
          <h3 className="font-poppins font-bold text-sm uppercase tracking-wider text-[#052353]">
            I. Core Security &amp; Vulnerability Pillars (Continued)
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-6 w-full">
          <PillarTable
            number={4} title="Food Security & Nutrition" score={activeState.risks.foodSecurity}
            rows={[
              { label: 'Acceptable Food Consumption Rate (%)', state: `${activeState.foodSecurity.foodConsumption}%`, avg: `${NATIONAL_AVERAGES.foodSecurity.foodConsumption}%` },
              { label: 'Phase 3+ Acute Food Insecurity (%)', state: `${activeState.foodSecurity.acuteInsecurity}%`, avg: `${NATIONAL_AVERAGES.foodSecurity.acuteInsecurity}%` },
              { label: 'Child Wasting & Nutrition Risk (1-10)', state: `${activeState.foodSecurity.nutritionRisk}/10`, avg: `${NATIONAL_AVERAGES.foodSecurity.nutritionRisk}/10` }
            ]}
          />
          <PillarTable
            number={5} title="Displacement & Migration" score={activeState.risks.displacement}
            rows={[
              { label: 'Active IDP Population', state: activeState.displacement.idps.toLocaleString(), avg: NATIONAL_AVERAGES.displacement.idps.toLocaleString() },
              { label: 'Registered Returnees', state: activeState.displacement.returnees.toLocaleString(), avg: NATIONAL_AVERAGES.displacement.returnees.toLocaleString() },
              { label: 'New Displacement Events (1 Year)', state: activeState.displacement.newEvents, avg: NATIONAL_AVERAGES.displacement.newEvents }
            ]}
          />
          <PillarTable
            number={6} title="Peace & Security" score={activeState.risks.peaceSecurity}
            rows={[
              { label: 'Conflict Incidents (1 Year)', state: activeState.peaceSecurity.conflictIncidents, avg: NATIONAL_AVERAGES.peaceSecurity.conflictIncidents },
              { label: 'Conflict-Related Fatalities (1 Year)', state: activeState.peaceSecurity.fatalities, avg: NATIONAL_AVERAGES.peaceSecurity.fatalities },
              { label: 'Feelings of Safety in Neighborhood (%)', state: `${activeState.peaceSecurity.communitySecurity}%`, avg: `${NATIONAL_AVERAGES.peaceSecurity.communitySecurity}%` }
            ]}
          />
        </div>

        {mode !== 'trend' && (
          <div className="mt-6 border-t border-slate-300 pt-6">
            <h4 className="font-poppins font-bold text-xs uppercase text-[#052353] mb-2">
              II. Aggregation Registry &amp; Methodology References
            </h4>
            <p className="text-[10px] text-slate-500 leading-normal">
              This executive brief aggregates datasets from: National Bureau of Statistics (NBS) (Multidimensional
              Poverty Index, Education Census, Labor Surveys); World Bank (Microeconomic impact profiles); UNICEF
              &amp; WHO (Health registers, school attendance surveys); Cadre Harmonisé Joint Analysis (Food security
              Phase levels); IOM DTM &amp; NEMA (Displacement grids); and Beyond# Live Conflict Tracker (Geolocated
              conflict indicators).
            </p>
            <p className="text-[9px] text-slate-400 mt-4 leading-normal italic border-t border-slate-100 pt-3">
              Disclaimer: Beyond# observatory briefs are compiled automatically based on institutional database
              updates. These reports are published for research, academic studies, and evidence-guided public
              policy planning.
            </p>
            <div className="flex justify-between items-center mt-6 text-[9px] font-bold text-slate-400">
              <span>BEYOND STATISTICS SECRETARIAT - ABUJA, FCT, NIGERIA</span>
              <span>VERIFIED AGGREGATION ARRAY V1.06</span>
            </div>
          </div>
        )}
      </div>

      {/* PAGE 3: Trend/Forecast addendum -- only appended for the Trend Brief,
          keeping the Executive Profile Brief itself unchanged for the general
          "Print Executive Brief" button. */}
      {mode === 'trend' && forecastData && outlook && (
        <div className="page-break flex flex-col gap-6 w-full pt-10">
          <LetterheadRow subtitle={`${activeState.name} State Trend & Forecast Addendum`} />

          <div className="border-b border-slate-200 pb-2">
            <h3 className="font-poppins font-bold text-sm uppercase tracking-wider text-[#052353]">
              II. Quarterly Composite Risk Forecast
            </h3>
          </div>

          <table className="w-full text-xs">
            <thead>
              <tr className="opacity-50 text-[10px] uppercase font-bold text-left">
                <th className="pb-1.5">Quarter</th>
                <th className="pb-1.5 text-right">Actual</th>
                <th className="pb-1.5 text-right">Forecast</th>
              </tr>
            </thead>
            <tbody className="font-semibold text-slate-700">
              {forecastData.map((row) => (
                <tr key={row.quarter} className="border-t border-slate-150">
                  <td className="py-2">{row.quarter}</td>
                  <td className="py-2 text-right font-mono">{row.Actual ?? '\u2014'}</td>
                  <td className="py-2 text-right font-mono">{row.Forecast ?? '\u2014'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-b border-slate-200 pb-2 mt-2">
            <h3 className="font-poppins font-bold text-sm uppercase tracking-wider text-[#052353]">
              III. Dimensional Outlook
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {[
              { label: 'Poverty & Inflation', data: outlook.poverty },
              { label: 'Food Security', data: outlook.food },
              { label: 'Conflict & Safety', data: outlook.security }
            ].map((item) => (
              <div key={item.label} className="border border-slate-200 rounded-xl p-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs uppercase text-[#052353]">{item.label}</span>
                  <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded">
                    {item.data.change > 0 ? `+${item.data.change}` : item.data.change}%
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mb-1">Trend: {item.data.trend}</p>
                <p className="text-[10px] text-slate-600">{item.data.alert}</p>
              </div>
            ))}
          </div>

          {policyBrief && (
            <div className="mt-4 border-t border-slate-300 pt-6 flex flex-col gap-6">
              <div>
                <h4 className="font-poppins font-bold text-xs uppercase text-[#052353] mb-2">Strategic Implications</h4>
                <p className="text-[10px] text-slate-600 leading-relaxed">{policyBrief.implications}</p>
              </div>
              <div>
                <h4 className="font-poppins font-bold text-xs uppercase text-[#052353] mb-3">
                  Targeted Policy Recommendations
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'State Government', items: policyBrief.recommendations.state },
                    { label: 'NGOs & Development Partners', items: policyBrief.recommendations.ngo },
                    { label: 'Multinationals & Private Sector', items: policyBrief.recommendations.private }
                  ].map((group) => (
                    <div key={group.label} className="flex flex-col gap-1.5">
                      <span className="font-poppins font-bold text-[9px] uppercase tracking-wider text-[#39B54A]">
                        {group.label}
                      </span>
                      <ul className="list-disc pl-3 text-[10px] text-slate-600 leading-relaxed space-y-1">
                        {(group.items || []).map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-6 text-[9px] font-bold text-slate-400 border-t border-slate-100 pt-4">
            <span>BEYOND STATISTICS SECRETARIAT - ABUJA, FCT, NIGERIA</span>
            <span>VERIFIED AGGREGATION ARRAY V1.06</span>
          </div>
        </div>
      )}

    </div>
  );
}
