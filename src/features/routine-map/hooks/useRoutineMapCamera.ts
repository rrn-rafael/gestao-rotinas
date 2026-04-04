import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type {
  PointerEvent as ReactPointerEvent,
  RefObject,
  WheelEvent as ReactWheelEvent,
} from "react";

import { clamp, quantize } from "../model/geometry";
import type { ViewState } from "../model/types";

type PanState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

type UseRoutineMapCameraParams = {
  viewportRef: RefObject<HTMLDivElement>;
  worldWidth: number;
  worldHeight: number;
  minScale: number;
  maxScale: number;
  initialView: ViewState;
};

export function useRoutineMapCamera({
  viewportRef,
  worldWidth,
  worldHeight,
  minScale,
  maxScale,
  initialView,
}: UseRoutineMapCameraParams) {
  const viewRef = useRef<ViewState>(initialView);
  const homeViewRef = useRef<ViewState>(initialView);
  const centeredRef = useRef(false);
  const panStateRef = useRef<PanState | null>(null);

  const [spacePressed, setSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [view, setView] = useState<ViewState>(viewRef.current);

  const commitView = useCallback((nextView: ViewState) => {
    viewRef.current = nextView;
    setView(nextView);
  }, []);

  const centerHomeView = useCallback(() => {
    const viewportElement = viewportRef.current;

    if (!viewportElement) {
      return;
    }

    const viewportRect = viewportElement.getBoundingClientRect();
    const nextScale = initialView.scale;
    const nextView = {
      scale: nextScale,
      x: quantize((viewportRect.width - worldWidth * nextScale) / 2),
      y: quantize((viewportRect.height - worldHeight * nextScale) / 2),
    };

    homeViewRef.current = nextView;
    commitView(nextView);
  }, [commitView, initialView.scale, viewportRef, worldHeight, worldWidth]);

  const zoomAtClientPoint = useCallback(
    (nextScale: number, clientX: number, clientY: number) => {
      const viewportElement = viewportRef.current;

      if (!viewportElement) {
        return;
      }

      const viewportRect = viewportElement.getBoundingClientRect();
      const clampedScale = clamp(nextScale, minScale, maxScale);
      const worldX =
        (clientX - viewportRect.left - viewRef.current.x) /
        viewRef.current.scale;
      const worldY =
        (clientY - viewportRect.top - viewRef.current.y) /
        viewRef.current.scale;
      const nextView = {
        scale: clampedScale,
        x: quantize(clientX - viewportRect.left - worldX * clampedScale),
        y: quantize(clientY - viewportRect.top - worldY * clampedScale),
      };

      commitView(nextView);
    },
    [commitView, maxScale, minScale, viewportRef],
  );

  const zoomByStep = useCallback(
    (delta: number) => {
      const viewportElement = viewportRef.current;

      if (!viewportElement) {
        return;
      }

      const rect = viewportElement.getBoundingClientRect();
      zoomAtClientPoint(
        viewRef.current.scale + delta,
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      );
    },
    [viewportRef, zoomAtClientPoint],
  );

  const resetView = useCallback(() => {
    commitView(homeViewRef.current);
  }, [commitView]);

  const endPan = useCallback((pointerId?: number) => {
    if (
      pointerId !== undefined &&
      panStateRef.current?.pointerId !== pointerId
    ) {
      return;
    }

    panStateRef.current = null;
    setIsPanning(false);
  }, []);

  useLayoutEffect(() => {
    if (centeredRef.current) {
      return;
    }

    centeredRef.current = true;
    centerHomeView();
  }, [centerHomeView]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") {
        return;
      }

      event.preventDefault();
      setSpacePressed(true);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space") {
        return;
      }

      setSpacePressed(false);
      endPan();
    };

    const handleWindowBlur = () => {
      setSpacePressed(false);
      endPan();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [endPan]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!spacePressed) {
        return;
      }

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      panStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: viewRef.current.x,
        originY: viewRef.current.y,
      };
      setIsPanning(true);
    },
    [spacePressed],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const panState = panStateRef.current;

      if (!panState || panState.pointerId !== event.pointerId) {
        return;
      }

      const nextView = {
        ...viewRef.current,
        x: quantize(panState.originX + (event.clientX - panState.startX)),
        y: quantize(panState.originY + (event.clientY - panState.startY)),
      };

      commitView(nextView);
    },
    [commitView],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      endPan(event.pointerId);
    },
    [endPan],
  );

  const onPointerCancel = useCallback(() => {
    endPan();
  }, [endPan]);

  const onWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }

      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.08 : 0.08;
      zoomAtClientPoint(
        viewRef.current.scale + delta,
        event.clientX,
        event.clientY,
      );
    },
    [zoomAtClientPoint],
  );

  return {
    view,
    spacePressed,
    isPanning,
    cursor: isPanning ? "grabbing" : spacePressed ? "grab" : "default",
    resetView,
    zoomByStep,
    viewportHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onWheel,
    },
  };
}
