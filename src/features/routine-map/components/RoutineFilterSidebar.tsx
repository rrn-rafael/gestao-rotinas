import { useDeferredValue, useEffect, useMemo, useState } from "react";

import {
  DEFAULT_ROUTINE_FILTERS,
  getActiveRoutineFilterCount,
  type RoutineFilterOptions,
} from "../model/filters";
import type { CardStatus, RoutineFilters, RoutineKind } from "../model/types";

type RoutineFilterSidebarProps = {
  isOpen: boolean;
  filters: RoutineFilters;
  options: RoutineFilterOptions;
  onApplyFilters: (nextFilters: RoutineFilters) => void;
  onResetFilters: () => void;
  onClose: () => void;
};

type MultiSelectSectionProps<T extends string> = {
  title: string;
  options: readonly T[];
  selected: readonly T[];
  searchQuery: string;
  onChange: (nextValues: T[]) => void;
};

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function buildSortedSelection<T extends string>(
  options: readonly T[],
  selectedValues: Set<T>,
) {
  return options.filter((option) => selectedValues.has(option));
}

function MultiSelectSection<T extends string>({
  title,
  options,
  selected,
  searchQuery,
  onChange,
}: MultiSelectSectionProps<T>) {
  const selectedValues = useMemo(() => new Set(selected), [selected]);
  const normalizedSearchQuery = normalizeSearchValue(searchQuery);
  const visibleOptions = useMemo(() => {
    if (!normalizedSearchQuery) {
      return [...options];
    }

    return options.filter((option) =>
      option.toLowerCase().includes(normalizedSearchQuery),
    );
  }, [normalizedSearchQuery, options]);

  function handleToggleValue(option: T) {
    const nextSelectedValues = new Set(selectedValues);

    if (nextSelectedValues.has(option)) {
      nextSelectedValues.delete(option);
    } else {
      nextSelectedValues.add(option);
    }

    onChange(buildSortedSelection(options, nextSelectedValues));
  }

  function handleSelectAll() {
    onChange([...options]);
  }

  function handleClear() {
    onChange([]);
  }

  function handleInvert() {
    const nextSelectedValues = new Set<T>();

    options.forEach((option) => {
      if (!selectedValues.has(option)) {
        nextSelectedValues.add(option);
      }
    });

    onChange(buildSortedSelection(options, nextSelectedValues));
  }

  return (
    <section className="border-t border-slate-200 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[12px] font-semibold text-slate-900">{title}</h3>
        {selected.length > 0 ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            {selected.length}
          </span>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <button
          type="button"
          onClick={handleSelectAll}
          className="transition hover:text-slate-900"
        >
          Selecionar todos
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="transition hover:text-slate-900"
        >
          Limpar
        </button>
        <button
          type="button"
          onClick={handleInvert}
          className="transition hover:text-slate-900"
        >
          Inverter
        </button>
      </div>

      <div className="mt-2 max-h-[148px] overflow-y-auto rounded-[14px] border border-slate-200 bg-white">
        {visibleOptions.length === 0 ? (
          <div className="px-3 py-4 text-[11px] text-slate-400">
            Nenhuma opcao encontrada.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleOptions.map((option) => {
              const checked = selectedValues.has(option);

              return (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2 text-[12px] text-slate-700 transition hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      handleToggleValue(option);
                    }}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-[#4285f4] focus:ring-[#c8dcff]"
                  />
                  <span className="min-w-0 flex-1 truncate">{option}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export function RoutineFilterSidebar({
  isOpen,
  filters,
  options,
  onApplyFilters,
  onResetFilters,
  onClose,
}: RoutineFilterSidebarProps) {
  const [draftFilters, setDraftFilters] = useState<RoutineFilters>(filters);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const draftFilterCount = useMemo(
    () => getActiveRoutineFilterCount(draftFilters),
    [draftFilters],
  );

  useEffect(() => {
    if (isOpen) {
      setDraftFilters(filters);
      setSearchQuery("");
    }
  }, [filters, isOpen]);

  if (!isOpen) {
    return null;
  }

  function patchDraftFilters<K extends keyof RoutineFilters>(
    key: K,
    nextValue: RoutineFilters[K],
  ) {
    setDraftFilters((currentFilters) => ({
      ...currentFilters,
      [key]: nextValue,
    }));
  }

  function handleClearDraft() {
    setDraftFilters({ ...DEFAULT_ROUTINE_FILTERS });
  }

  function handleResetAll() {
    handleClearDraft();
    onResetFilters();
  }

  function handleApplyFilters() {
    onApplyFilters(draftFilters);
    onClose();
  }

  return (
    <aside
      className="absolute left-4 top-16 bottom-4 z-40 flex w-[284px] flex-col overflow-hidden rounded-[22px] border border-slate-300 bg-white"
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
        <h2 className="text-[12px] font-semibold text-slate-950">Filtros</h2>
        <button
          type="button"
          onClick={handleResetAll}
          className="text-[11px] font-medium text-slate-500 transition hover:text-slate-900"
        >
          Limpar tudo
        </button>
      </div>

      <div className="border-b border-slate-200 px-4 py-3">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
          }}
          placeholder="Pesquisar filtros..."
          className="h-8 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#b9d0ff] focus:ring-4 focus:ring-[#edf4ff]"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <MultiSelectSection
          title="Responsavel"
          options={options.owners}
          selected={draftFilters.owners}
          searchQuery={deferredSearchQuery}
          onChange={(nextValues) => {
            patchDraftFilters("owners", nextValues);
          }}
        />

        <MultiSelectSection
          title="Ferramenta"
          options={options.tools}
          selected={draftFilters.tools}
          searchQuery={deferredSearchQuery}
          onChange={(nextValues) => {
            patchDraftFilters("tools", nextValues);
          }}
        />

        <MultiSelectSection
          title="Tipo de rotina"
          options={options.kinds}
          selected={draftFilters.kinds}
          searchQuery={deferredSearchQuery}
          onChange={(nextValues) => {
            patchDraftFilters("kinds", nextValues as RoutineKind[]);
          }}
        />

        <MultiSelectSection
          title="Status"
          options={options.statuses}
          selected={draftFilters.statuses}
          searchQuery={deferredSearchQuery}
          onChange={(nextValues) => {
            patchDraftFilters("statuses", nextValues as CardStatus[]);
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-slate-200 px-4 py-3">
        <button
          type="button"
          onClick={handleApplyFilters}
          className="h-9 rounded-[10px] bg-[#5b9cf2] px-3 text-[12px] font-medium text-white transition hover:bg-[#4285f4]"
        >
          Aplicar
        </button>
        <button
          type="button"
          onClick={handleClearDraft}
          className="h-9 rounded-[10px] border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
        >
          Limpar
        </button>
      </div>

      {draftFilterCount > 0 ? (
        <div className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">
          {draftFilterCount} selecoes preparadas
        </div>
      ) : null}
    </aside>
  );
}
