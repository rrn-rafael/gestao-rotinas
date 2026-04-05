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

type TouchPoint = {
  clientX: number;
  clientY: number;
};

type TouchGestureState = {
  pointerIds: [number, number];
  initialDistance: number;
  initialMidpoint: {
    x: number;
    y: number;
  };
  originView: ViewState;
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
  const touchPointsRef = useRef<Map<number, TouchPoint>>(new Map());
  const touchGestureRef = useRef<TouchGestureState | null>(null);

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

  const toViewportPoint = useCallback(
    (clientX: number, clientY: number) => {
      const viewportElement = viewportRef.current;

      if (!viewportElement) {
        return null;
      }

      const viewportRect = viewportElement.getBoundingClientRect();

      return {
        x: clientX - viewportRect.left,
        y: clientY - viewportRect.top,
      };
    },
    [viewportRef],
  );

  const zoomAtViewportPoint = useCallback(
    (nextScale: number, viewportX: number, viewportY: number) => {
      const clampedScale = clamp(nextScale, minScale, maxScale);
      const worldX = (viewportX - viewRef.current.x) / viewRef.current.scale;
      const worldY = (viewportY - viewRef.current.y) / viewRef.current.scale;
      const nextView = {
        scale: clampedScale,
        x: quantize(viewportX - worldX * clampedScale),
        y: quantize(viewportY - worldY * clampedScale),
      };

      commitView(nextView);
    },
    [commitView, maxScale, minScale],
  );

  const zoomAtClientPoint = useCallback(
    (nextScale: number, clientX: number, clientY: number) => {
      const viewportPoint = toViewportPoint(clientX, clientY);

      if (!viewportPoint) {
        return;
      }

      zoomAtViewportPoint(nextScale, viewportPoint.x, viewportPoint.y);
    },
    [toViewportPoint, zoomAtViewportPoint],
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

  const buildTouchGesture = useCallback(() => {
    const activeTouchPoints = [...touchPointsRef.current.entries()].slice(0, 2);

    if (activeTouchPoints.length < 2) {
      return null;
    }

    const firstPoint = toViewportPoint(
      activeTouchPoints[0][1].clientX,
      activeTouchPoints[0][1].clientY,
    );
    const secondPoint = toViewportPoint(
      activeTouchPoints[1][1].clientX,
      activeTouchPoints[1][1].clientY,
    );

    if (!firstPoint || !secondPoint) {
      return null;
    }

    const distance = Math.hypot(
      secondPoint.x - firstPoint.x,
      secondPoint.y - firstPoint.y,
    );

    return {
      pointerIds: [activeTouchPoints[0][0], activeTouchPoints[1][0]],
      initialDistance: Math.max(distance, 1),
      initialMidpoint: {
        x: (firstPoint.x + secondPoint.x) / 2,
        y: (firstPoint.y + secondPoint.y) / 2,
      },
      originView: viewRef.current,
    } satisfies TouchGestureState;
  }, [toViewportPoint]);

  const syncTouchGesture = useCallback(() => {
    const touchGesture = touchGestureRef.current;

    if (!touchGesture) {
      return;
    }

    const firstPointer = touchPointsRef.current.get(touchGesture.pointerIds[0]);
    const secondPointer = touchPointsRef.current.get(
      touchGesture.pointerIds[1],
    );

    if (!firstPointer || !secondPointer) {
      return;
    }

    const firstPoint = toViewportPoint(
      firstPointer.clientX,
      firstPointer.clientY,
    );
    const secondPoint = toViewportPoint(
      secondPointer.clientX,
      secondPointer.clientY,
    );

    if (!firstPoint || !secondPoint) {
      return;
    }

    const currentDistance = Math.max(
      Math.hypot(secondPoint.x - firstPoint.x, secondPoint.y - firstPoint.y),
      1,
    );
    const currentMidpoint = {
      x: (firstPoint.x + secondPoint.x) / 2,
      y: (firstPoint.y + secondPoint.y) / 2,
    };
    const nextScale =
      touchGesture.originView.scale *
      (currentDistance / touchGesture.initialDistance);
    const clampedScale = clamp(nextScale, minScale, maxScale);
    const worldX =
      (touchGesture.initialMidpoint.x - touchGesture.originView.x) /
      touchGesture.originView.scale;
    const worldY =
      (touchGesture.initialMidpoint.y - touchGesture.originView.y) /
      touchGesture.originView.scale;

    commitView({
      scale: clampedScale,
      x: quantize(currentMidpoint.x - worldX * clampedScale),
      y: quantize(currentMidpoint.y - worldY * clampedScale),
    });
  }, [commitView, maxScale, minScale, toViewportPoint]);

  const clearTouchGesture = useCallback(() => {
    touchPointsRef.current.clear();
    touchGestureRef.current = null;
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
      clearTouchGesture();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [clearTouchGesture, endPan]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "touch") {
        touchPointsRef.current.set(event.pointerId, {
          clientX: event.clientX,
          clientY: event.clientY,
        });
        event.currentTarget.setPointerCapture(event.pointerId);

        if (touchPointsRef.current.size >= 2) {
          event.preventDefault();
          touchGestureRef.current = buildTouchGesture();
          setIsPanning(true);
        }

        return;
      }

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
    [buildTouchGesture, spacePressed],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "touch") {
        if (!touchPointsRef.current.has(event.pointerId)) {
          return;
        }

        touchPointsRef.current.set(event.pointerId, {
          clientX: event.clientX,
          clientY: event.clientY,
        });

        if (touchPointsRef.current.size < 2) {
          return;
        }

        event.preventDefault();

        if (!touchGestureRef.current) {
          touchGestureRef.current = buildTouchGesture();
        }

        if (!touchGestureRef.current) {
          return;
        }

        syncTouchGesture();
        return;
      }

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
    [buildTouchGesture, commitView, syncTouchGesture],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "touch") {
        touchPointsRef.current.delete(event.pointerId);

        if (touchPointsRef.current.size >= 2) {
          touchGestureRef.current = buildTouchGesture();
          syncTouchGesture();
        } else {
          touchGestureRef.current = null;
          setIsPanning(false);
        }

        return;
      }

      endPan(event.pointerId);
    },
    [buildTouchGesture, endPan, syncTouchGesture],
  );

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "touch") {
        touchPointsRef.current.delete(event.pointerId);

        if (touchPointsRef.current.size >= 2) {
          touchGestureRef.current = buildTouchGesture();
          syncTouchGesture();
        } else {
          touchGestureRef.current = null;
          setIsPanning(false);
        }

        return;
      }

      endPan();
    },
    [buildTouchGesture, endPan, syncTouchGesture],
  );

  const onWheelCapture = useCallback(
    (event: ReactWheelEvent<HTMLElement>) => {
      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }

      event.preventDefault();
      const targetNode = event.target;
      const viewportElement = viewportRef.current;

      if (!(targetNode instanceof Node) || !viewportElement) {
        return;
      }

      if (!viewportElement.contains(targetNode)) {
        return;
      }

      const delta = clamp(-event.deltaY * 0.01, -0.2, 0.2);

      zoomAtClientPoint(
        viewRef.current.scale + delta,
        event.clientX,
        event.clientY,
      );
    },
    [viewportRef, zoomAtClientPoint],
  );

  return {
    view,
    spacePressed,
    isPanning,
    cursor: isPanning ? "grabbing" : spacePressed ? "grab" : "default",
    resetView,
    zoomByStep,
    onWheelCapture,
    viewportHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  };
}
