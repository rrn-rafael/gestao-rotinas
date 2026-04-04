import { useEffect, useMemo, useRef, useState } from "react";

import { RoutineCanvasBackground } from "./components/RoutineCanvasBackground";
import { RoutineCardGrid } from "./components/RoutineCardGrid";
import { RoutineCardNode } from "./components/RoutineCardNode";
import { RoutineConnectorLayer } from "./components/RoutineConnectorLayer";
import { RoutineFilterSidebar } from "./components/RoutineFilterSidebar";
import { RoutineMapControls } from "./components/RoutineMapControls";
import { RoutineMapViewport } from "./components/RoutineMapViewport";
import { RoutineWorkspaceRail } from "./components/RoutineWorkspaceRail";
import { useRoutineConnectorLayout } from "./hooks/useRoutineConnectorLayout";
import { useRoutineMapCamera } from "./hooks/useRoutineMapCamera";
import {
  DEFAULT_SELECTED_CARD_ID,
  INITIAL_VIEW,
  MAX_SCALE,
  MIN_SCALE,
} from "./model/config";
import { routineCards, routineLinks } from "./model/data";
import {
  buildRoutineFilterOptions,
  DEFAULT_ROUTINE_FILTERS,
  filterRoutineCards,
  hasActiveFilters,
} from "./model/filters";
import {
  buildFocusSets,
  buildGraphIndexes,
  getCardOpacity,
  getCardRelation,
} from "./model/graph";
import { buildRoutineMapLayout } from "./model/layout";
import type { RoutineFilters } from "./model/types";

const routineGraphIndexes = buildGraphIndexes(routineLinks);

export default function RoutineMap() {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [selectedId, setSelectedId] = useState<string | null>(
    DEFAULT_SELECTED_CARD_ID,
  );
  const [filters, setFilters] = useState<RoutineFilters>(
    DEFAULT_ROUTINE_FILTERS,
  );

  const layout = useMemo(
    () => buildRoutineMapLayout(routineCards, routineLinks),
    [],
  );
  const filterOptions = useMemo(
    () => buildRoutineFilterOptions(routineCards),
    [],
  );
  const filteredCards = useMemo(
    () => filterRoutineCards(routineCards, filters),
    [filters],
  );
  const filteredCardIds = useMemo(
    () => new Set(filteredCards.map((card) => card.id)),
    [filteredCards],
  );
  const layoutOrder = useMemo(
    () =>
      Object.fromEntries(
        layout.cards.map((card, index) => [card.id, index] as const),
      ),
    [layout.cards],
  );
  const gridCards = useMemo(
    () =>
      [...filteredCards].sort(
        (left, right) =>
          (layoutOrder[left.id] ?? 0) - (layoutOrder[right.id] ?? 0),
      ),
    [filteredCards, layoutOrder],
  );
  const gridMode = hasActiveFilters(filters);
  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (filters.owner) {
      count += 1;
    }

    if (filters.tool) {
      count += 1;
    }

    if (filters.kind) {
      count += 1;
    }

    if (filters.status) {
      count += 1;
    }

    if (filters.onlyExecuting) {
      count += 1;
    }

    return count;
  }, [filters]);
  const focusSets = useMemo(
    () => buildFocusSets(selectedId, routineGraphIndexes),
    [selectedId],
  );

  useEffect(() => {
    if (selectedId && !filteredCardIds.has(selectedId)) {
      setSelectedId(null);
    }
  }, [filteredCardIds, selectedId]);

  const {
    view,
    spacePressed,
    isPanning,
    cursor,
    resetView,
    zoomByStep,
    viewportHandlers,
  } = useRoutineMapCamera({
    viewportRef,
    worldWidth: layout.width,
    worldHeight: layout.height,
    minScale: MIN_SCALE,
    maxScale: MAX_SCALE,
    initialView: INITIAL_VIEW,
  });

  const { cardRects } = useRoutineConnectorLayout({
    worldRef,
    cardRefs,
    cards: gridMode ? [] : layout.cards,
    view,
    selectedId,
  });

  function handleToggleSelect(cardId: string) {
    setSelectedId((currentSelectedId) =>
      currentSelectedId === cardId ? null : cardId,
    );
  }

  function handleClearSelection() {
    if (!spacePressed) {
      setSelectedId(null);
    }
  }

  function handleFiltersChange(nextFilters: RoutineFilters) {
    setFilters(nextFilters);
  }

  function handleResetFilters() {
    setFilters({ ...DEFAULT_ROUTINE_FILTERS });
  }

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#edf1ff_0%,#f7f8fc_48%,#f3f5f9_100%)] p-4 text-neutral-950">
      <section className="flex h-full overflow-hidden rounded-[34px] border border-[#e7ecf5] bg-white shadow-[0_22px_72px_rgba(15,23,42,0.08)]">
        <RoutineWorkspaceRail activeFilterCount={activeFilterCount} />

        <RoutineFilterSidebar
          filters={filters}
          options={filterOptions}
          onFiltersChange={handleFiltersChange}
          onResetFilters={handleResetFilters}
        />

        <main className="min-w-0 flex-1 bg-white">
          <section className="relative h-full overflow-hidden bg-white">
            <RoutineCanvasBackground />

            {gridMode ? (
              <div
                className="relative z-10 h-full overflow-auto px-8 py-8"
                onClick={handleClearSelection}
              >
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Visualizacao
                    </div>
                    <div className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-slate-950">
                      Rotinas filtradas em grade
                    </div>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                    {filteredCards.length}/{routineCards.length}
                  </div>
                </div>

                <RoutineCardGrid
                  cards={gridCards}
                  selectedId={selectedId}
                  focusSets={focusSets}
                  onToggleSelect={handleToggleSelect}
                />
              </div>
            ) : (
              <div
                className="relative z-10 h-full"
                onClick={handleClearSelection}
              >
                <RoutineMapControls
                  scale={view.scale}
                  onZoomOut={() => zoomByStep(-0.1)}
                  onZoomIn={() => zoomByStep(0.1)}
                  onReset={resetView}
                />

                <RoutineMapViewport
                  viewportRef={viewportRef}
                  view={view}
                  worldWidth={layout.width}
                  worldHeight={layout.height}
                  cursor={cursor}
                  onPointerDown={viewportHandlers.onPointerDown}
                  onPointerMove={viewportHandlers.onPointerMove}
                  onPointerUp={viewportHandlers.onPointerUp}
                  onPointerCancel={viewportHandlers.onPointerCancel}
                  onWheel={viewportHandlers.onWheel}
                >
                  <RoutineConnectorLayer
                    width={layout.width}
                    height={layout.height}
                    links={routineLinks}
                    cardRects={cardRects}
                    selectedId={selectedId}
                    focusSets={focusSets}
                  />

                  <div
                    ref={worldRef}
                    className="absolute inset-0 z-10"
                    style={{ width: layout.width, height: layout.height }}
                  >
                    {layout.cards.map((item) => {
                      const relation = getCardRelation(
                        item.id,
                        selectedId,
                        focusSets,
                      );
                      const opacity = getCardOpacity(
                        item.status,
                        relation,
                        selectedId !== null,
                      );

                      return (
                        <RoutineCardNode
                          key={item.id}
                          item={item}
                          relation={relation}
                          opacity={opacity}
                          interactionLocked={spacePressed || isPanning}
                          buttonRef={(node) => {
                            cardRefs.current[item.id] = node;
                          }}
                          onToggleSelect={handleToggleSelect}
                        />
                      );
                    })}
                  </div>
                </RoutineMapViewport>
              </div>
            )}
          </section>
        </main>
      </section>
    </div>
  );
}
