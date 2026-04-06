import { startTransition, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { RoutineCanvasBackground } from "./components/RoutineCanvasBackground";
import { RoutineCardNode } from "./components/RoutineCardNode";
import { RoutineConnectorLayer } from "./components/RoutineConnectorLayer";
import { RoutineFilterSidebar } from "./components/RoutineFilterSidebar";
import { RoutineMapControls } from "./components/RoutineMapControls";
import { RoutineMapHeader } from "./components/RoutineMapHeader";
import { RoutineMapViewport } from "./components/RoutineMapViewport";
import { useRoutineConnectorLayout } from "./hooks/useRoutineConnectorLayout";
import { useRoutineMapCamera } from "./hooks/useRoutineMapCamera";
import {
  DEFAULT_SELECTED_CARD_ID,
  INITIAL_VIEW,
  MAX_SCALE,
  MIN_SCALE,
  TIMELINE_FILTER_RESERVE_FALLBACK,
  TIMELINE_FILTER_RESERVE_GAP,
  TIMELINE_COLUMN_MIN_WIDTH,
  TIMELINE_HEADER_HEIGHT,
  TIMELINE_HOME_VIEW_PADDING,
} from "./model/config";
import { routineCards, routineLinks } from "./model/data";
import {
  buildRoutineFilterOptions,
  DEFAULT_ROUTINE_FILTERS,
  filterRoutineCards,
  getActiveRoutineFilterCount,
} from "./model/filters";
import {
  buildFocusSets,
  buildGraphIndexes,
  getCardOpacity,
  getCardRelation,
} from "./model/graph";
import {
  buildRoutineMapLayout,
  getTimelineBucketIdForDate,
} from "./model/layout";
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
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);

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
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [filterReservedWidth, setFilterReservedWidth] = useState(
    TIMELINE_FILTER_RESERVE_FALLBACK,
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
  const layout = useMemo(
    () => buildRoutineMapLayout(filteredCards, TIMELINE_COLUMN_MIN_WIDTH),
    [filteredCards],
  );
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
  const currentBucketId = useMemo(
    () => getTimelineBucketIdForDate(currentTime),
    [currentTime],
  );
  const currentBucket = useMemo(
    () =>
      layout.buckets.find((bucket) => bucket.id === currentBucketId) ?? null,
    [currentBucketId, layout.buckets],
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

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useLayoutEffect(() => {
    const filterButtonElement = filterButtonRef.current;

    if (!filterButtonElement) {
      return;
    }

    const updateReservedWidth = () => {
      const nextWidth = Math.ceil(
        16 + filterButtonElement.getBoundingClientRect().width + TIMELINE_FILTER_RESERVE_GAP,
      );

      setFilterReservedWidth((currentWidth) =>
        currentWidth === nextWidth ? currentWidth : nextWidth,
      );
    };

    updateReservedWidth();

    const resizeObserver = new ResizeObserver(() => {
      updateReservedWidth();
    });

    resizeObserver.observe(filterButtonElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [activeFilterCount]);

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
    fitPadding: TIMELINE_HOME_VIEW_PADDING,
    initialView: INITIAL_VIEW,
  });

  const { cardRects } = useRoutineConnectorLayout({
    worldRef,
    cardRefs,
    cards: layout.cards,
    view,
    selectedId: presentedSelectedId,
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
            ref={filterButtonRef}
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

        <div
          className="absolute inset-x-0 top-0 z-20"
          style={{ height: TIMELINE_HEADER_HEIGHT }}
        >
          <RoutineMapHeader
            buckets={layout.buckets}
            view={view}
            currentBucketId={currentBucketId}
            visibleCount={filteredCards.length}
            totalCount={routineCards.length}
            reservedLeftWidth={filterReservedWidth}
          />
        </div>

        <div
          className="absolute inset-x-0 bottom-0 z-10"
          style={{ top: TIMELINE_HEADER_HEIGHT }}
          onClick={handleClearSelection}
        >
          <RoutineMapControls
            onZoomOut={() => zoomByStep(-BUTTON_ZOOM_STEP)}
            onZoomIn={() => zoomByStep(BUTTON_ZOOM_STEP)}
            onFitView={resetView}
          />

          <RoutineMapViewport
            viewportRef={viewportRef}
            view={view}
            worldWidth={layout.width}
            worldHeight={layout.height}
            cursor={cursor}
            overlay={
              <>
                {layout.buckets.map((bucket) => (
                  <div
                    key={bucket.id}
                    className="pointer-events-none absolute inset-y-0 z-[1]"
                    style={{
                      left: view.x + bucket.x * view.scale,
                      width: bucket.width * view.scale,
                    }}
                  >
                    <div className="absolute inset-y-0 left-0 w-px bg-slate-300/75" />
                  </div>
                ))}

                {layout.buckets.length > 0 ? (
                  <div
                    className="pointer-events-none absolute inset-y-0 z-[1] w-px bg-slate-300/75"
                    style={{
                      left:
                        view.x +
                        (layout.buckets[layout.buckets.length - 1].x +
                          layout.buckets[layout.buckets.length - 1].width) *
                          view.scale,
                    }}
                  />
                ) : null}

                {currentBucket ? (
                  <div
                    className="pointer-events-none absolute inset-y-0 z-[1]"
                    style={{
                      left: view.x + currentBucket.x * view.scale,
                      width: currentBucket.width * view.scale,
                    }}
                  >
                    <div className="absolute inset-0 bg-slate-950/[0.05]" />
                    <div className="absolute inset-y-0 left-0 w-px bg-slate-400/85" />
                    <div className="absolute inset-y-0 right-0 w-px bg-slate-400/85" />
                  </div>
                ) : null}
              </>
            }
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
            />

            <div
              ref={worldRef}
              className="absolute inset-0 z-10"
              style={{ width: layout.width, height: layout.height }}
            >
              {layout.cards.map((item) => {
                const relation = hasActiveActionMenu
                  ? "idle"
                  : getCardRelation(item.id, presentedSelectedId, focusSets);
                const opacity = getCardOpacity(
                  item.status,
                  relation,
                  presentedSelectedId !== null,
                );

                return (
                  <RoutineCardNode
                    key={item.id}
                    item={item}
                    relation={relation}
                    opacity={opacity}
                    interactionLocked={spacePressed || isPanning}
                    menuBoundaryRef={rootRef}
                    activeActionMenuCardId={activeActionMenuCardId}
                    onSetActiveActionMenuCardId={setActiveActionMenuCardId}
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
      </main>
    </div>
  );
}
