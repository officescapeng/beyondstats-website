import { INCIDENT_TYPE_COLORS, INCIDENT_TYPE_LABELS } from "@/lib/nigeria-data";
import { ExternalLink, MapPin, Calendar } from "lucide-react";

interface Incident {
  id: number;
  date: string;
  state: string;
  lga: string | null;
  community: string | null;
  incidentType: string;
  fatalities: number;
  abductions: number;
  injuries: number;
  summary: string | null;
  sourceUrl: string | null;
}

interface IncidentTableProps {
  incidents: Incident[];
  showPagination?: boolean;
  pageSize?: number;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00Z");
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return dateStr;
  }
}

export function IncidentTable({ incidents }: IncidentTableProps) {
  if (incidents.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-lg">No incidents found</p>
        <p className="text-sm mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-3 font-semibold text-slate-600">Date</th>
            <th className="text-left py-3 px-3 font-semibold text-slate-600">Location</th>
            <th className="text-left py-3 px-3 font-semibold text-slate-600">Type</th>
            <th className="text-center py-3 px-3 font-semibold text-slate-600">Killed</th>
            <th className="text-center py-3 px-3 font-semibold text-slate-600">Abducted</th>
            <th className="text-center py-3 px-3 font-semibold text-slate-600">Injured</th>
            <th className="text-left py-3 px-3 font-semibold text-slate-600 hidden lg:table-cell">Summary</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => {
            const typeColor =
              INCIDENT_TYPE_COLORS[incident.incidentType] || INCIDENT_TYPE_COLORS.other;
            const typeLabel =
              INCIDENT_TYPE_LABELS[incident.incidentType] || incident.incidentType;

            return (
              <tr
                key={incident.id}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td className="py-3 px-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(incident.date)}
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium text-slate-900">{incident.state}</span>
                      {incident.lga && (
                        <span className="text-slate-500"> · {incident.lga}</span>
                      )}
                      {incident.community && incident.community !== "Unknown" && (
                        <span className="text-slate-400 block text-xs">
                          {incident.community}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: typeColor }}
                  >
                    {typeLabel}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  {incident.fatalities > 0 ? (
                    <span className="font-bold text-red-700">{incident.fatalities}</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="py-3 px-3 text-center">
                  {incident.abductions > 0 ? (
                    <span className="font-bold text-amber-700">{incident.abductions}</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="py-3 px-3 text-center">
                  {incident.injuries > 0 ? (
                    <span className="font-bold text-orange-700">{incident.injuries}</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="py-3 px-3 hidden lg:table-cell max-w-xs">
                  <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                    {incident.summary}
                  </p>
                  {incident.sourceUrl && (
                    <a
                      href={incident.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 mt-1"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      Source
                    </a>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
