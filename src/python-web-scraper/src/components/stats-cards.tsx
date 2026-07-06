import { Skull, Users, Heart, AlertTriangle } from "lucide-react";

interface StatsCardsProps {
  totalIncidents: number;
  totalFatalities: number;
  totalAbductions: number;
  totalInjuries: number;
}

export function StatsCards({
  totalIncidents,
  totalFatalities,
  totalAbductions,
  totalInjuries,
}: StatsCardsProps) {
  const cards = [
    {
      label: "Total Incidents",
      value: totalIncidents.toLocaleString(),
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-100",
    },
    {
      label: "People Killed",
      value: totalFatalities.toLocaleString(),
      icon: Skull,
      color: "text-slate-800",
      bg: "bg-slate-50",
      border: "border-slate-200",
    },
    {
      label: "People Abducted",
      value: totalAbductions.toLocaleString(),
      icon: Users,
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
    {
      label: "People Injured",
      value: totalInjuries.toLocaleString(),
      icon: Heart,
      color: "text-orange-700",
      bg: "bg-orange-50",
      border: "border-orange-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`rounded-xl border ${card.border} ${card.bg} p-5 transition-shadow hover:shadow-md`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {card.label}
              </span>
              <Icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className={`text-2xl lg:text-3xl font-bold ${card.color}`}>
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
