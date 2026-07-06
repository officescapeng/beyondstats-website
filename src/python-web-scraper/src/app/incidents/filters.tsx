"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Filter, X } from "lucide-react";

interface IncidentFiltersProps {
  states: string[];
  types: string[];
  currentState: string;
  currentType: string;
  currentStartDate: string;
  currentEndDate: string;
}

export function IncidentFilters({
  states,
  types,
  currentState,
  currentType,
  currentStartDate,
  currentEndDate,
}: IncidentFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      params.delete("page"); // Reset pagination on filter change
      return params.toString();
    },
    [searchParams]
  );

  const handleChange = (name: string, value: string) => {
    const qs = createQueryString(name, value);
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  const hasFilters = currentState || currentType || currentStartDate || currentEndDate;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-semibold text-slate-700">Filters</span>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium"
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* State filter */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            State
          </label>
          <select
            value={currentState}
            onChange={(e) => handleChange("state", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          >
            <option value="">All States</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Type filter */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Incident Type
          </label>
          <select
            value={currentType}
            onChange={(e) => handleChange("type", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          >
            <option value="">All Types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Start date */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            From Date
          </label>
          <input
            type="date"
            value={currentStartDate}
            onChange={(e) => handleChange("startDate", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
        </div>

        {/* End date */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={currentEndDate}
            onChange={(e) => handleChange("endDate", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
        </div>
      </div>
    </div>
  );
}
