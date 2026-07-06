"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { INCIDENT_TYPE_COLORS, INCIDENT_TYPE_LABELS } from "@/lib/nigeria-data";

interface ByTypeData {
  incidentType: string;
  count: number;
  fatalities: number;
  abductions: number;
  injuries: number;
}

interface ByDateData {
  date: string;
  count: number;
  fatalities: number;
  abductions: number;
}

interface ByStateData {
  state: string;
  count: number;
  fatalities: number;
  abductions: number;
  injuries: number;
}

export function IncidentTypeChart({ data }: { data: ByTypeData[] }) {
  const chartData = data.map((d) => ({
    name: INCIDENT_TYPE_LABELS[d.incidentType] || d.incidentType,
    value: d.count,
    fatalities: d.fatalities,
    color: INCIDENT_TYPE_COLORS[d.incidentType] || INCIDENT_TYPE_COLORS.other,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderLabel = (entry: any) => {
    const percent = entry.percent || 0;
    return `${entry.name || ""} ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">
        Incidents by Type
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={renderLabel}
              labelLine={true}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function FatalitiesByTypeChart({ data }: { data: ByTypeData[] }) {
  const chartData = data
    .map((d) => ({
      name: INCIDENT_TYPE_LABELS[d.incidentType] || d.incidentType,
      fatalities: d.fatalities,
      abductions: d.abductions,
      injuries: d.injuries,
    }))
    .sort((a, b) => b.fatalities - a.fatalities);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">
        Casualties by Incident Type
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              tick={{ fontSize: 11 }}
            />
            <Tooltip />
            <Bar dataKey="fatalities" fill="#dc2626" name="Killed" radius={[0, 2, 2, 0]} />
            <Bar dataKey="abductions" fill="#d97706" name="Abducted" radius={[0, 2, 2, 0]} />
            <Bar dataKey="injuries" fill="#ea580c" name="Injured" radius={[0, 2, 2, 0]} />
            <Legend />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TimelineChart({ data }: { data: ByDateData[] }) {
  const chartData = data.map((d) => ({
    date: d.date,
    Incidents: d.count,
    Fatalities: d.fatalities,
    Abductions: d.abductions,
  }));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">
        Daily Timeline
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fatalitiesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="incidentsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickFormatter={(v: string) => {
                const d = new Date(v + "T00:00:00Z");
                return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
              }}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="Fatalities"
              stroke="#dc2626"
              fill="url(#fatalitiesGrad)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="Incidents"
              stroke="#3b82f6"
              fill="url(#incidentsGrad)"
              strokeWidth={2}
            />
            <Legend />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TopStatesChart({ data }: { data: ByStateData[] }) {
  const chartData = data.slice(0, 10).map((d) => ({
    name: d.state,
    fatalities: d.fatalities,
    abductions: d.abductions,
    injuries: d.injuries,
  }));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">
        Top 10 Most Affected States
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={75}
              tick={{ fontSize: 11 }}
            />
            <Tooltip />
            <Bar dataKey="fatalities" fill="#dc2626" name="Killed" radius={[0, 2, 2, 0]} />
            <Bar dataKey="abductions" fill="#d97706" name="Abducted" radius={[0, 2, 2, 0]} />
            <Bar dataKey="injuries" fill="#ea580c" name="Injured" radius={[0, 2, 2, 0]} />
            <Legend />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
