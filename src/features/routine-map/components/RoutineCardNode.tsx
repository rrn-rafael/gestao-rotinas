import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { createPortal } from "react-dom";

import { CARD_HEIGHT, CARD_WIDTH } from "../model/config";
import {
  getPresenceDot,
  getStatusAccent,
  getStatusRunnerColor,
  getVarianceClass,
  isRunningStatus,
} from "../model/presentation";
import type { CardRelation, PositionedRoutineCard } from "../model/types";
import { CardIconGlyph } from "./CardIconGlyph";

type RoutineCardNodeProps = {
  item: PositionedRoutineCard;
  relation: CardRelation;
  opacity: number;
  interactionLocked: boolean;
  activeActionMenuCardId: string | null;
  onSetActiveActionMenuCardId: (cardId: string | null) => void;
  buttonRef?: (node: HTMLButtonElement | null) => void;
  layoutMode?: "canvas" | "grid";
  menuBoundaryRef: RefObject<HTMLElement | null>;
  forceHighlighted?: boolean;
  onToggleSelect: (cardId: string) => void;
};

type CardActionId = "start" | "stop" | "edit" | "clear" | "complete";

type CardActionItem = {
  id: CardActionId;
  label: string;
  icon: ReactNode;
  enabled: boolean;
};

type ActionMenuPlacement = "top-end" | "bottom-end";

type ActionMenuPosition = {
  left: number;
  top: number;
  placement: ActionMenuPlacement;
};

function getMenuBoundaryRect(boundaryElement: HTMLElement | null) {
  if (boundaryElement) {
    return boundaryElement.getBoundingClientRect();
  }

  return {
    top: 0,
    left: 0,
    right: window.innerWidth,
    bottom: window.innerHeight,
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function PlayIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        d="M5.3 4.35L10.95 8L5.3 11.65V4.35Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        d="M5.8 4.25V11.75M10.2 4.25V11.75"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <rect
        x="4.25"
        y="4.25"
        width="7.5"
        height="7.5"
        rx="1.8"
        stroke="currentColor"
        strokeWidth="1.35"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        d="M9.65 4.15L11.85 6.35M4.35 11.65L6.95 11.05L11.25 6.75C11.72 6.28 11.72 5.52 11.25 5.05L10.95 4.75C10.48 4.28 9.72 4.28 9.25 4.75L4.95 9.05L4.35 11.65Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        d="M4.6 10.6L9.75 5.45C10.15 5.05 10.8 5.05 11.2 5.45L11.55 5.8C11.95 6.2 11.95 6.85 11.55 7.25L6.4 12.4H4.6V10.6Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.3 12.4H11.7"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CompleteIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="4.85" stroke="currentColor" strokeWidth="1.35" />
      <path
        d="M5.55 8.1L7.2 9.75L10.5 6.45"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RoutineCardActionMenu({
  open,
  anchorRef,
  boundaryRef,
  actionItems,
  onClose,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLButtonElement | null>;
  boundaryRef: RefObject<HTMLElement | null>;
  actionItems: readonly CardActionItem[];
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<ActionMenuPosition | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    let frameId = 0;

    const updatePosition = () => {
      const anchorElement = anchorRef.current;
      const menuElement = menuRef.current;

      if (!anchorElement || !menuElement) {
        frameId = window.requestAnimationFrame(updatePosition);
        return;
      }

      const gap = 6;
      const padding = 8;
      const anchorRect = anchorElement.getBoundingClientRect();
      const menuRect = menuElement.getBoundingClientRect();
      const boundaryRect = getMenuBoundaryRect(boundaryRef.current);
      const minTop = boundaryRect.top + padding;
      const maxTop = Math.max(
        minTop,
        boundaryRect.bottom - menuRect.height - padding,
      );
      const minLeft = boundaryRect.left + padding;
      const maxLeft = Math.max(
        minLeft,
        boundaryRect.right - menuRect.width - padding,
      );
      const topPlacementTop = anchorRect.top - menuRect.height - gap;
      const bottomPlacementTop = anchorRect.bottom + gap;
      let placement: ActionMenuPlacement =
        topPlacementTop >= minTop ? "top-end" : "bottom-end";
      let top =
        placement === "top-end" ? topPlacementTop : bottomPlacementTop;

      if (placement === "bottom-end" && bottomPlacementTop > maxTop) {
        if (topPlacementTop >= minTop) {
          placement = "top-end";
          top = topPlacementTop;
        } else {
          top = maxTop;
        }
      }

      top = Math.min(Math.max(top, minTop), maxTop);

      const preferredLeft = anchorRect.left;
      const left = Math.min(Math.max(preferredLeft, minLeft), maxLeft);

      setPosition((currentPosition) => {
        if (
          currentPosition &&
          currentPosition.left === left &&
          currentPosition.top === top &&
          currentPosition.placement === placement
        ) {
          return currentPosition;
        }

        return { left, top, placement };
      });

      frameId = window.requestAnimationFrame(updatePosition);
    };

    frameId = window.requestAnimationFrame(updatePosition);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [anchorRef, boundaryRef, open]);

  if (!open) {
    return null;
  }

  const menuStyle: CSSProperties = position
    ? {
        left: position.left,
        top: position.top,
        transformOrigin:
          position.placement === "top-end" ? "bottom left" : "top left",
        visibility: "visible",
      }
    : {
        left: -9999,
        top: -9999,
        visibility: "hidden",
      };

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[80] w-max min-w-[118px] overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_10px_20px_rgba(15,23,42,0.14),0_2px_4px_rgba(15,23,42,0.08)]"
      style={menuStyle}
      role="menu"
      aria-label="Acoes da rotina"
    >
      <div className="divide-y divide-slate-200/70">
        {actionItems.map((actionItem) => (
          <button
            key={actionItem.id}
            type="button"
            disabled={!actionItem.enabled}
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            className="flex w-full items-center gap-2.5 whitespace-nowrap px-2.5 py-1.5 text-left text-[12px] font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-default disabled:text-slate-300 disabled:hover:bg-white disabled:hover:text-slate-300"
            role="menuitem"
          >
            <span className="flex h-4 w-4 items-center justify-center">
              {actionItem.icon}
            </span>
            <span>{actionItem.label}</span>
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}

export function RoutineCardNode({
  item,
  relation,
  opacity,
  interactionLocked,
  activeActionMenuCardId,
  onSetActiveActionMenuCardId,
  buttonRef,
  layoutMode = "canvas",
  menuBoundaryRef,
  forceHighlighted = false,
  onToggleSelect,
}: RoutineCardNodeProps) {
  const [hovered, setHovered] = useState(false);
  const actionButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuOpen = activeActionMenuCardId === item.id;
  const isSelected = forceHighlighted || relation === "selected";
  const isRelated = !isSelected && (relation === "upstream" || relation === "downstream");
  const isRunning = isRunningStatus(item.status);
  const isCompleted = item.completedAt !== undefined;
  const runnerColor = getStatusRunnerColor(item.status);
  const isCanvasMode = layoutMode === "canvas";
  const elevated = hovered || menuOpen;
  const showActionButton = !interactionLocked && (hovered || menuOpen);
  const menuContextActive = activeActionMenuCardId !== null;
  const contentOpacity = menuContextActive && !menuOpen ? Math.min(opacity, 0.68) : opacity;
  const outerShadow = isSelected
    ? "0 16px 34px rgba(15,23,42,0.12)"
    : elevated
      ? "0 14px 30px rgba(15,23,42,0.08)"
      : "0 10px 24px rgba(15,23,42,0.05)";
  const insetHighlight = isSelected
    ? "inset 0 0 0 2px rgba(253,230,138,0.95)"
    : isRelated
      ? "inset 0 0 0 1px rgba(254,243,199,0.95)"
      : "inset 0 0 0 1px rgba(255,255,255,0.72)";
  const borderColor = isSelected
    ? "rgba(253, 230, 138, 0.95)"
    : hovered
      ? "rgba(229, 231, 235, 0.95)"
      : "rgba(255, 255, 255, 0.72)";

  const actionItems: CardActionItem[] = [
    {
      id: "start",
      label: isRunning ? "Pausar" : "Iniciar",
      icon: isRunning ? <PauseIcon /> : <PlayIcon />,
      enabled: !isCompleted,
    },
    {
      id: "stop",
      label: "Parar",
      icon: <StopIcon />,
      enabled: isRunning && !isCompleted,
    },
    {
      id: "edit",
      label: "Editar",
      icon: <EditIcon />,
      enabled: !isCompleted,
    },
    {
      id: "clear",
      label: "Limpar",
      icon: <ClearIcon />,
      enabled: true,
    },
    {
      id: "complete",
      label: "Concluir",
      icon: <CompleteIcon />,
      enabled: !isCompleted,
    },
  ];

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onSetActiveActionMenuCardId(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen, onSetActiveActionMenuCardId]);

  useEffect(() => {
    if (interactionLocked && menuOpen) {
      onSetActiveActionMenuCardId(null);
    }
  }, [interactionLocked, menuOpen, onSetActiveActionMenuCardId]);

  useEffect(() => {
    if (activeActionMenuCardId && activeActionMenuCardId !== item.id) {
      setHovered(false);
    }
  }, [activeActionMenuCardId, item.id]);

  return (
    <div
      onPointerEnter={() => {
        setHovered(true);
      }}
      onPointerLeave={() => {
        setHovered(false);
      }}
      className={isCanvasMode ? "absolute" : "relative w-full"}
      style={{
        left: isCanvasMode ? item.x : undefined,
        top: isCanvasMode ? item.y : undefined,
        width: isCanvasMode ? CARD_WIDTH : "100%",
        height: CARD_HEIGHT,
        zIndex: menuOpen ? 40 : elevated ? 10 : undefined,
      }}
    >
      <div
        className="relative h-full w-full transition-all duration-200"
        style={{
          transform: isSelected
            ? "translateY(-1px) scale(1.02)"
            : elevated
              ? "translateY(-2px)"
              : "translateY(0px)",
        }}
      >
        <div
          className="relative isolate h-full w-full overflow-hidden rounded-[16px] bg-white transition-all duration-200"
          style={{
            border: `1px solid ${borderColor}`,
            boxShadow: `${outerShadow}, ${insetHighlight}`,
          }}
        >
          {isRunning ? (
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <rect
                className="routine-card-runner"
                x="1"
                y="1"
                width="98"
                height="98"
                rx="15.4"
                ry="15.4"
                pathLength="100"
                fill="none"
                stroke={`rgb(${runnerColor})`}
                vectorEffect="non-scaling-stroke"
                style={{ ["--runner-color" as string]: runnerColor }}
              />
            </svg>
          ) : null}

          <button
            ref={buttonRef}
            type="button"
            onClick={(event) => {
              event.stopPropagation();

              if (interactionLocked) {
                return;
              }

              onToggleSelect(item.id);
            }}
            className="relative z-10 h-full w-full bg-transparent px-3 py-2 text-left transition-all duration-200"
          >
            <div
              className="flex h-full flex-col gap-1.5"
              style={{ opacity: contentOpacity }}
            >
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                  {item.tool}
                </div>
                <div className="min-w-0 flex-1 truncate whitespace-nowrap pr-7 text-[13px] font-semibold leading-5 tracking-[-0.01em] text-neutral-950">
                  {item.name}
                </div>
              </div>

              <div className="mt-0.5 flex items-center justify-between gap-2">
                <div
                  className={`mt-0.5 h-8 w-1.5 shrink-0 rounded-full ${getStatusAccent(item.status, item.color)}`}
                />

                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold leading-none text-neutral-950">
                    {item.status}
                  </div>
                  <div className="mt-0.5 truncate text-[10px] leading-none text-neutral-500">
                    {item.detail}
                  </div>
                </div>
              </div>

              <div className="mt-0.5 flex items-center justify-between gap-2">
                <div className="min-w-0 flex flex-1 items-center gap-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${getPresenceDot(item.ownerPresence)}`}
                  />
                  <div className="truncate text-[10px] font-medium text-neutral-700">
                    {item.owner}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1 text-[10px]">
                  <span className="text-neutral-400">
                    {isCompleted ? "Conclusao" : "EST"}
                  </span>
                  <span className="font-semibold text-neutral-900">
                    {isCompleted ? item.completedAt : item.forecast}
                  </span>
                  {!isCompleted && item.variance ? (
                    <span
                      className={`font-semibold ${getVarianceClass(item.varianceTone)}`}
                    >
                      {item.variance}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="absolute right-3 top-[8px] z-[60] flex h-5 items-center">
          {showActionButton ? (
            <div className="relative">
              <button
                ref={actionButtonRef}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSetActiveActionMenuCardId(menuOpen ? null : item.id);
                }}
                className="flex h-5 w-5 items-center justify-center rounded-[7px] bg-slate-100/90 text-[12px] leading-none text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.12)] transition hover:bg-white hover:text-slate-800"
                aria-label="Abrir acoes da rotina"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="-translate-y-[1px]">...</span>
              </button>
            </div>
          ) : (
            <div className="pointer-events-none flex h-5 w-5 items-center justify-center text-neutral-400">
              <CardIconGlyph type={item.icon} />
            </div>
          )}
        </div>
      </div>

      <RoutineCardActionMenu
        open={menuOpen}
        anchorRef={actionButtonRef}
        boundaryRef={menuBoundaryRef}
        actionItems={actionItems}
        onClose={() => {
          onSetActiveActionMenuCardId(null);
        }}
      />
    </div>
  );
}
