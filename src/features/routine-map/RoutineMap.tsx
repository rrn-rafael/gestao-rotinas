import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import { RoutineCanvasBackground } from "./components/RoutineCanvasBackground";
import { RoutineCardGrid } from "./components/RoutineCardGrid";
import { RoutineCardNode } from "./components/RoutineCardNode";
import { RoutineConnectorLayer } from "./components/RoutineConnectorLayer";
import { RoutineFilterSidebar } from "./components/RoutineFilterSidebar";
import { RoutineMapControls } from "./components/RoutineMapControls";
import { RoutineMapViewport } from "./components/RoutineMapViewport";
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
  getActiveRoutineFilterCount,
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

function FilterButtonIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M2.75 4H13.25M5.25 8H10.75M6.75 12H9.25"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function RoutineMap() {
  const BUTTON_ZOOM_STEP = 0.15;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [selectedId, setSelectedId] = useState<string | null>(
    DEFAULT_SELECTED_CARD_ID,
  );
  const [activeActionMenuCardId, setActiveActionMenuCardId] = useState<
    string | null
  >(null);
  const [filters, setFilters] = useState<RoutineFilters>(
    DEFAULT_ROUTINE_FILTERS,
  );
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

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
  const activeFilterCount = useMemo(
    () => getActiveRoutineFilterCount(filters),
    [filters],
  );
  const hasActiveActionMenu = activeActionMenuCardId !== null;
  const presentedSelectedId = hasActiveActionMenu ? null : selectedId;
  const focusSets = useMemo(
    () => buildFocusSets(presentedSelectedId, routineGraphIndexes),
    [presentedSelectedId],
  );

  useEffect(() => {
    if (selectedId && !filteredCardIds.has(selectedId)) {
      setSelectedId(null);
    }
  }, [filteredCardIds, selectedId]);

  useEffect(() => {
    if (activeActionMenuCardId && !filteredCardIds.has(activeActionMenuCardId)) {
      setActiveActionMenuCardId(null);
    }
  }, [activeActionMenuCardId, filteredCardIds]);

  const {
    view,
    spacePressed,
    isPanning,
    cursor,
    resetView,
    zoomByStep,
    viewportHandlers,
  } = useRoutineMapCamera({
    rootRef,
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
    if (activeActionMenuCardId) {
      setActiveActionMenuCardId(null);
      return;
    }

    if (!spacePressed) {
      setSelectedId(null);
    }
  }

  function handleApplyFilters(nextFilters: RoutineFilters) {
    startTransition(() => {
      setFilters(nextFilters);
    });
  }

  function handleResetFilters() {
    startTransition(() => {
      setFilters({ ...DEFAULT_ROUTINE_FILTERS });
    });
  }

  function toggleFilterPanel() {
    setIsFilterPanelOpen((currentState) => !currentState);
  }

  return (
    <div
      ref={rootRef}
      className="h-screen overflow-hidden bg-white text-neutral-950"
    >
      <main className="relative h-full overflow-hidden bg-white text-[12px]">
        <RoutineCanvasBackground />

        {hasActiveActionMenu ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setActiveActionMenuCardId(null);
            }}
            className="absolute inset-0 z-[45] bg-slate-950/10"
            aria-label="Fechar menu de acoes"
          />
        ) : null}

        <div className="pointer-events-none absolute left-4 top-4 z-30 flex items-center gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              toggleFilterPanel();
            }}
            className="routine-ui-button pointer-events-auto flex h-10 items-center gap-2 rounded-full px-4 text-[12px] font-medium text-slate-800"
          >
            <FilterButtonIcon />
            <span>Filtros</span>
            {activeFilterCount > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#4285f4] px-1.5 text-[11px] font-semibold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>

          {gridMode ? (
            <div className="flex h-10 items-center rounded-full border border-slate-300 bg-white px-3 text-[12px] font-medium text-slate-700">
              {filteredCards.length} de {routineCards.length}
            </div>
          ) : null}
        </div>

        <RoutineFilterSidebar
          isOpen={isFilterPanelOpen}
          filters={filters}
          options={filterOptions}
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
          onClose={() => {
            setIsFilterPanelOpen(false);
          }}
        />

        {gridMode ? (
          <div
            className={`relative h-full overflow-auto px-4 pb-4 pt-20 ${
              hasActiveActionMenu ? "z-50" : "z-10"
            }`}
            onClick={handleClearSelection}
          >
            <RoutineCardGrid
              cards={gridCards}
              selectedId={presentedSelectedId}
              focusSets={focusSets}
              activeActionMenuCardId={activeActionMenuCardId}
              onSetActiveActionMenuCardId={setActiveActionMenuCardId}
              onToggleSelect={handleToggleSelect}
            />
          </div>
        ) : (
          <div
            className={`relative h-full ${
              hasActiveActionMenu ? "z-50" : "z-10"
            }`}
            onClick={handleClearSelection}
          >
            <RoutineMapControls
              onZoomOut={() => zoomByStep(-BUTTON_ZOOM_STEP)}
              onZoomIn={() => zoomByStep(BUTTON_ZOOM_STEP)}
              onFitView={resetView}
              dimmed={hasActiveActionMenu}
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
            >
              <RoutineConnectorLayer
                width={layout.width}
                height={layout.height}
                links={routineLinks}
                cardRects={cardRects}
                selectedId={presentedSelectedId}
                focusSets={focusSets}
                dimmed={hasActiveActionMenu}
              />

              <div
                ref={worldRef}
                className="absolute inset-0 z-10"
                style={{ width: layout.width, height: layout.height }}
              >
                {hasActiveActionMenu ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveActionMenuCardId(null);
                    }}
                    className="absolute inset-0 z-20 bg-slate-950/12"
                    aria-label="Fechar menu de acoes"
                  />
                ) : null}

                {layout.cards.map((item) => {
                  const isMenuCard = activeActionMenuCardId === item.id;
                  const relation = hasActiveActionMenu
                    ? isMenuCard
                      ? "selected"
                      : "idle"
                    : getCardRelation(item.id, presentedSelectedId, focusSets);
                  const opacity = getCardOpacity(
                    item.status,
                    relation,
                    hasActiveActionMenu ? isMenuCard : presentedSelectedId !== null,
                  );

                  return (
                    <RoutineCardNode
                      key={item.id}
                      item={item}
                      relation={relation}
                      opacity={opacity}
                      interactionLocked={spacePressed || isPanning}
                      activeActionMenuCardId={activeActionMenuCardId}
                      onSetActiveActionMenuCardId={setActiveActionMenuCardId}
                      forceHighlighted={isMenuCard}
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
      </main>
    </div>
  );
}
