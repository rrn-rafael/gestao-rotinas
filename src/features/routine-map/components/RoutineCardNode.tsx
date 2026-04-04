import { useState } from "react";

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
  const isSelected = relation === "selected";
  const isRelated = relation === "upstream" || relation === "downstream";
  const isRunning = isRunningStatus(item.status);
  const runnerColor = getStatusRunnerColor(item.status);
  const isCanvasMode = layoutMode === "canvas";

  return (
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
      onPointerEnter={() => {
        setHovered(true);
      }}
      onPointerLeave={() => {
        setHovered(false);
      }}
      className={`group rounded-[16px] bg-white px-3 py-2 text-left transition-all duration-200 ${isCanvasMode ? "absolute" : "relative w-full"}`}
      style={{
        left: isCanvasMode ? item.x : undefined,
        top: isCanvasMode ? item.y : undefined,
        width: isCanvasMode ? CARD_WIDTH : "100%",
        height: CARD_HEIGHT,
        boxShadow: isSelected
          ? "0 14px 34px rgba(15,23,42,0.08)"
          : hovered
            ? "0 16px 36px rgba(15,23,42,0.07)"
            : "0 12px 30px rgba(15,23,42,0.05)",
        transform: isSelected
          ? "translateY(-1px) scale(1.02)"
          : hovered
            ? "translateY(-2px)"
            : "translateY(0px)",
      }}
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
          className="pointer-events-none absolute inset-0 overflow-visible"
          viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
          aria-hidden="true"
        >
          <rect
            className="routine-card-runner"
            x="1.25"
            y="1.25"
            width={CARD_WIDTH - 2.5}
            height={CARD_HEIGHT - 2.5}
            rx="16"
            pathLength="100"
            fill="none"
            stroke={`rgb(${runnerColor})`}
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
          <div className="min-w-0 flex-1 truncate whitespace-nowrap text-[13px] font-semibold tracking-[-0.01em] text-neutral-950">
            {item.name}
          </div>
          <CardIconGlyph type={item.icon} />
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
              {item.status === "Concluído" ? "Conclusao" : "EST"}
            </span>
            <span className="font-semibold text-neutral-900">
              {item.status === "Concluído" ? item.completedAt : item.forecast}
            </span>
            {item.status !== "Concluído" && item.variance ? (
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
  );
}
