import type { ChangeEvent } from "react";

import type { RoutineFilterOptions } from "../model/filters";
import type { RoutineFilters, RoutineKind } from "../model/types";

type RoutineFilterSidebarProps = {
  filters: RoutineFilters;
  options: RoutineFilterOptions;
  onFiltersChange: (nextFilters: RoutineFilters) => void;
  onResetFilters: () => void;
};

type FilterSelectProps = {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
};

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: FilterSelectProps) {
  return (
    <label className="block">
      <div className="mb-2 text-[13px] font-medium text-slate-700">{label}</div>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          className="w-full appearance-none rounded-[16px] border border-slate-200 bg-white px-4 py-3 pr-10 text-[15px] font-medium text-slate-900 outline-none transition focus:border-[#c8d2ff] focus:ring-4 focus:ring-[#eef1ff]"
        >
          <option value="">Todos</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              d="M5 6.5 8 10 11 6.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </label>
  );
}

export function RoutineFilterSidebar({
  filters,
  options,
  onFiltersChange,
  onResetFilters,
}: RoutineFilterSidebarProps) {
  function patchFilters(nextPatch: Partial<RoutineFilters>) {
    onFiltersChange({ ...filters, ...nextPatch });
  }

  function handleCheckboxChange(event: ChangeEvent<HTMLInputElement>) {
    patchFilters({ onlyExecuting: event.target.checked });
  }

  return (
    <aside className="flex w-[244px] shrink-0 flex-col border-r border-slate-200/80 bg-white px-5 py-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[16px] font-semibold tracking-[-0.03em] text-slate-950">
          Filtros
        </h2>
        <button
          type="button"
          onClick={onResetFilters}
          className="text-[14px] font-medium text-[#4c64ff] transition hover:text-[#3448d5]"
        >
          Clear all
        </button>
      </div>

      <div className="mt-7 space-y-4">
        <FilterSelect
          label="Responsavel"
          value={filters.owner}
          options={options.owners}
          onChange={(value) => {
            patchFilters({ owner: value });
          }}
        />

        <FilterSelect
          label="Ferramenta"
          value={filters.tool}
          options={options.tools}
          onChange={(value) => {
            patchFilters({ tool: value });
          }}
        />

        <FilterSelect
          label="Tipo de rotina"
          value={filters.kind}
          options={options.kinds}
          onChange={(value) => {
            patchFilters({ kind: value as RoutineKind | "" });
          }}
        />

        <FilterSelect
          label="Status"
          value={filters.status}
          options={options.statuses}
          onChange={(value) => {
            patchFilters({ status: value as RoutineFilters["status"] });
          }}
        />
      </div>

      <label className="mt-6 flex items-center gap-3 rounded-[16px] border border-slate-200 bg-white px-4 py-3 shadow-[0_6px_20px_rgba(15,23,42,0.03)]">
        <input
          type="checkbox"
          checked={filters.onlyExecuting}
          onChange={handleCheckboxChange}
          className="h-4 w-4 rounded border-slate-300 text-[#4c64ff] focus:ring-[#c8d2ff]"
        />
        <span className="text-[15px] font-medium text-slate-900">
          Apenas em execucao
        </span>
      </label>

      <div className="mt-4 text-[14px] font-medium text-slate-950">
        Apenas em execucao
      </div>
    </aside>
  );
}
