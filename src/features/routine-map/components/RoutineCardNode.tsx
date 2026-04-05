import { useEffect, useState } from "react";
import type { ReactNode } from "react";

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
  buttonRef?: (node: HTMLButtonElement | null) => void;
  layoutMode?: "canvas" | "grid";
  onToggleSelect: (cardId: string) => void;
};

type CardActionItem = {
  id: "start" | "stop" | "edit" | "clear" | "complete";
  label: string;
  icon: ReactNode;
  enabled: boolean;
};

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
        d="M5.5 4.1L11.1 8L5.5 11.9V4.1Z"
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
        d="M6 4.4V11.6M10 4.4V11.6"
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
        x="4.3"
        y="4.3"
        width="7.4"
        height="7.4"
        rx="1.6"
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
        d="M10.85 3.95L12.05 5.15M6.1 10.7L11.4 5.4C11.73 5.07 11.73 4.53 11.4 4.2L10.8 3.6C10.47 3.27 9.93 3.27 9.6 3.6L4.3 8.9L3.75 12.25L7.1 11.7L8.65 10.15"
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
        d="M6.15 5.1H11.45L9 10.1H3.7L6.15 5.1Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.1 10.1L4.25 11.5"
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
      <circle cx="8" cy="8" r="4.8" stroke="currentColor" strokeWidth="1.35" />
      <path
        d="M5.7 8.05L7.25 9.6L10.4 6.45"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RoutineCardNode({
  item,
  relation,
  opacity,
  interactionLocked,
  buttonRef,
  layoutMode = "canvas",
  onToggleSelect,
}: RoutineCardNodeProps) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isSelected = relation === "selected";
  const isRelated = relation === "upstream" || relation === "downstream";
  const isRunning = isRunningStatus(item.status);
  const isCompleted = item.completedAt !== undefined;
  const runnerColor = getStatusRunnerColor(item.status);
  const isCanvasMode = layoutMode === "canvas";
  const elevated = hovered || menuOpen;
  const showActionButton = !interactionLocked && (hovered || menuOpen);

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
        setMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (interactionLocked) {
      setMenuOpen(false);
    }
  }, [interactionLocked]);

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
        zIndex: menuOpen ? 40 : undefined,
      }}
    >
      {menuOpen ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen(false);
          }}
          className="fixed inset-0 z-30 bg-slate-950/10"
          aria-label="Fechar menu de acoes"
        />
      ) : null}

      <div
        className="relative z-40 h-full w-full transition-all duration-200"
        style={{
          boxShadow: isSelected
            ? "0 14px 34px rgba(15,23,42,0.08)"
            : elevated
              ? "0 16px 36px rgba(15,23,42,0.07)"
              : "0 12px 30px rgba(15,23,42,0.05)",
          transform: isSelected
            ? "translateY(-1px) scale(1.02)"
            : elevated
              ? "translateY(-2px)"
              : "translateY(0px)",
        }}
      >
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
          className="h-full w-full overflow-hidden rounded-[16px] bg-white px-3 py-2 text-left transition-all duration-200"
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-[16px] border bg-white transition-all duration-200"
            style={{
              borderColor: isSelected
                ? "rgba(253, 230, 138, 0.95)"
                : hovered
                  ? "rgba(229, 231, 235, 0.95)"
                  : "rgba(255, 255, 255, 0.72)",
              boxShadow: isSelected
                ? "inset 0 0 0 2px rgba(253,230,138,0.95)"
                : isRelated
                  ? "inset 0 0 0 1px rgba(254,243,199,0.95)"
                  : "inset 0 0 0 1px rgba(255,255,255,0.72)",
            }}
          />

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

          <div
            className="relative flex h-full flex-col gap-1.5"
            style={{ opacity }}
          >
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                {item.tool}
              </div>
              <div className="min-w-0 flex-1 truncate whitespace-nowrap pr-8 text-[13px] font-semibold tracking-[-0.01em] text-neutral-950">
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

        <div className="absolute right-3 top-2.5 z-10">
          {showActionButton ? (
            <div className="relative">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen((currentValue) => !currentValue);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-[9px] border border-slate-200 bg-white text-[15px] leading-none text-slate-600 shadow-[0_3px_8px_rgba(15,23,42,0.16),0_1px_2px_rgba(15,23,42,0.08)] transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Abrir acoes da rotina"
              >
                <span className="-translate-y-[1px]">...</span>
              </button>

              {menuOpen ? (
                <div className="absolute bottom-full left-0 z-20 mb-1.5 w-max min-w-[120px] overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_10px_20px_rgba(15,23,42,0.14),0_2px_4px_rgba(15,23,42,0.08)]">
                  <div className="divide-y divide-slate-200/70">
                    {actionItems.map((actionItem) => (
                      <button
                        key={actionItem.id}
                        type="button"
                        disabled={!actionItem.enabled}
                        onClick={(event) => {
                          event.stopPropagation();
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 whitespace-nowrap px-2.5 py-1.5 text-left text-[12px] font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-default disabled:text-slate-300 disabled:hover:bg-white disabled:hover:text-slate-300"
                      >
                        <span className="flex h-4 w-4 items-center justify-center">
                          {actionItem.icon}
                        </span>
                        <span>{actionItem.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="pointer-events-none flex h-4 w-4 items-center justify-center">
              <CardIconGlyph type={item.icon} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
