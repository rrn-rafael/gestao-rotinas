import type {
  CSSProperties,
  PointerEventHandler,
  ReactNode,
  RefObject,
  WheelEventHandler,
} from "react";

import type { ViewState } from "../model/types";

type RoutineMapViewportProps = {
  viewportRef: RefObject<HTMLDivElement>;
  view: ViewState;
  worldWidth: number;
  worldHeight: number;
  cursor: CSSProperties["cursor"];
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onPointerMove: PointerEventHandler<HTMLDivElement>;
  onPointerUp: PointerEventHandler<HTMLDivElement>;
  onPointerCancel: PointerEventHandler<HTMLDivElement>;
  onWheel: WheelEventHandler<HTMLDivElement>;
  children: ReactNode;
};

export function RoutineMapViewport({
  viewportRef,
  view,
  worldWidth,
  worldHeight,
  cursor,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onWheel,
  children,
}: RoutineMapViewportProps) {
  return (
    <div
      ref={viewportRef}
      className="relative z-10 h-full w-full touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onWheel={onWheel}
      style={{ cursor }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left will-change-transform"
        style={{
          width: worldWidth,
          height: worldHeight,
          transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
