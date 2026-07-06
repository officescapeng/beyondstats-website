"use client";

import { STATE_POSITIONS, GEO_POLITICAL_ZONES, INCIDENT_TYPE_COLORS } from "@/lib/nigeria-data";
import { Tooltip } from "./tooltip";

interface StateStats {
  state: string;
  count: number;
  fatalities: number;
  abductions: number;
  injuries: number;
  topType: string;
}

interface StateHeatmapProps {
  stateStats: StateStats[];
}

function getHeatColor(fatalities: number, maxFatalities: number): string {
  if (fatalities === 0) return "#f1f5f9"; // slate-100
  const ratio = fatalities / maxFatalities;
  if (ratio > 0.75) return "#991b1b"; // red-800
  if (ratio > 0.5) return "#dc2626"; // red-600
  if (ratio > 0.25) return "#ef4444"; // red-400
  if (ratio > 0.1) return "#fca5a5"; // red-300
  return "#fecaca"; // red-200
}

export function StateHeatmap({ stateStats }: StateHeatmapProps) {
  const statsMap = new Map(stateStats.map((s) => [s.state, s]));
  const maxFatalities = Math.max(...stateStats.map((s) => s.fatalities), 1);

  // Organize states into rows for grid layout
  const rows = 7;
  const cols = 7;

  // Build grid
  const grid: (string | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null)
  );

  for (const [state, pos] of Object.entries(STATE_POSITIONS)) {
    if (pos.row < rows && pos.col < cols) {
      grid[pos.row][pos.col] = state;
    }
  }

  // Fill in states not in the position map
  const positionedStates = new Set(Object.keys(STATE_POSITIONS));
  const unpositioned = stateStats
    .filter((s) => !positionedStates.has(s.state))
    .map((s) => s.state);

  return (
    <div className="space-y-4">
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {grid.flat().map((state, i) => {
          if (!state) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }

          const stats = statsMap.get(state);
          const fatalities = stats?.fatalities || 0;
          const color = getHeatColor(fatalities, maxFatalities);
          const typeColor = stats?.topType
            ? INCIDENT_TYPE_COLORS[stats.topType] || INCIDENT_TYPE_COLORS.other
            : "#94a3b8";

          return (
            <Tooltip
              key={state}
              content={
                stats ? (
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-sm">{state}</p>
                    <p>{stats.count} incident{stats.count !== 1 ? "s" : ""}</p>
                    <p className="text-red-300">{stats.fatalities} killed</p>
                    <p className="text-amber-300">{stats.abductions} abducted</p>
                    <p className="text-orange-300">{stats.injuries} injured</p>
                    {stats.topType && (
                      <p>
                        Top type:{" "}
                        <span className="font-semibold">{stats.topType}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-xs">
                    <p className="font-bold">{state}</p>
                    <p>No incidents recorded</p>
                  </div>
                )
              }
            >
              <div
                className="aspect-square rounded-md flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-110 hover:shadow-lg relative border border-white/50"
                style={{ backgroundColor: color }}
              >
                {stats && stats.topType && fatalities > 0 && (
                  <div
                    className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full"
                    style={{ backgroundColor: typeColor }}
                  />
                )}
                <span
                  className={`text-[9px] font-bold leading-none ${
                    fatalities > maxFatalities * 0.25
                      ? "text-white"
                      : "text-slate-700"
                  }`}
                >
                  {state.length > 6 ? state.slice(0, 3) : state}
                </span>
                {fatalities > 0 && (
                  <span
                    className={`text-[8px] font-medium leading-none mt-0.5 ${
                      fatalities > maxFatalities * 0.25
                        ? "text-red-100"
                        : "text-slate-500"
                    }`}
                  >
                    {fatalities}K
                  </span>
                )}
              </div>
            </Tooltip>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 justify-center text-xs text-slate-500">
        <span>Fatalities intensity:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded-sm bg-slate-100 border border-slate-200" />
          <span>0</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded-sm bg-red-200" />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded-sm bg-red-400" />
          <span>Med</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded-sm bg-red-800" />
          <span>High</span>
        </div>
      </div>

      {/* Unpositioned states */}
      {unpositioned.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {unpositioned.map((state) => {
            const stats = statsMap.get(state);
            const fatalities = stats?.fatalities || 0;
            const color = getHeatColor(fatalities, maxFatalities);
            return (
              <div
                key={state}
                className="px-2 py-1 rounded-md text-xs font-medium"
                style={{ backgroundColor: color }}
              >
                {state} ({fatalities})
              </div>
            );
          })}
        </div>
      )}

      {/* Geo-political zone summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
        {Object.entries(GEO_POLITICAL_ZONES).map(([zone, zoneStates]) => {
          const zoneStats = zoneStates
            .map((s) => statsMap.get(s))
            .filter(Boolean) as StateStats[];
          const totalFatalities = zoneStats.reduce((a, s) => a + s.fatalities, 0);
          const totalIncidents = zoneStats.reduce((a, s) => a + s.count, 0);

          return (
            <div
              key={zone}
              className="bg-white border border-slate-200 rounded-lg p-3"
            >
              <p className="text-xs font-semibold text-slate-900">{zone}</p>
              <p className="text-lg font-bold text-red-700">{totalFatalities}</p>
              <p className="text-[10px] text-slate-500">
                {totalIncidents} incident{totalIncidents !== 1 ? "s" : ""}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
