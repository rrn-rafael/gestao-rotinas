import type { ChangeEvent } from "react";

import type {
  RoutineFilters,
  RoutineKind,
} from "../model/types";
import type { RoutineFilterOptions } from "../model/filters";

type RoutineFilterSidebarProps = {
  filters: RoutineFilters;
  options: RoutineFilterOptions;
  visibleCount: number;
  totalCount: number;
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
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <select
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-[13px] text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200/60"
      >
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function RoutineFilterSidebar({
  filters,
  options,
  visibleCount,
  totalCount,
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
    <aside className="flex h-full flex-col border-r border-white/65 bg-white/74 px-5 py-5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Painel
          </div>
          <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-slate-950">
            Filtros do pipeline
          </h2>
        </div>
        <button
          type="button"
          onClick={onResetFilters}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
        >
          Limpar
        </button>
      </div>

      <div className="mt-5 rounded-[24px] border border-slate-200/70 bg-slate-50/70 p-4 shadow-[0_22px_40px_rgba(15,23,42,0.04)]">
        <div className="text-[11px] font-medium text-slate-500">
          Visiveis agora
        </div>
        <div className="mt-1 flex items-end gap-2">
          <span className="text-[30px] font-semibold tracking-[-0.04em] text-slate-950">
            {visibleCount}
          </span>
          <span className="pb-1 text-[12px] text-slate-400">
            de {totalCount} rotinas
          </span>
        </div>
      </div>

      <div className="mt-6 flex-1 space-y-4 overflow-y-auto pr-1">
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

        <label className="block rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_16px_32px_rgba(15,23,42,0.04)]">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={filters.onlyExecuting}
              onChange={handleCheckboxChange}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-200"
            />
            <div>
              <div className="text-[13px] font-semibold text-slate-900">
                Apenas em execucao
              </div>
              <div className="mt-1 text-[11px] leading-5 text-slate-500">
                Mostra rotinas em andamento e com atraso para leitura rapida em
                grade.
              </div>
            </div>
          </div>
        </label>
      </div>
    </aside>
  );
}
