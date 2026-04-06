import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type {
  PointerEvent as ReactPointerEvent,
  RefObject,
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

type ZoomIntent = {
  delta: number;
  viewportX: number;
  viewportY: number;
};

type UseRoutineMapCameraParams = {
  rootRef: RefObject<HTMLDivElement | null>;
  viewportRef: RefObject<HTMLDivElement | null>;
  worldWidth: number;
  worldHeight: number;
  fitWorldWidth: number;
  fitWorldHeight: number;
  minScale: number;
  maxScale: number;
  fitPadding: number;
  onZoomIntent?: (intent: ZoomIntent) => void;
};

const PAN_PADDING = 40;

function clampAxis(offset: number, viewportSize: number, contentSize: number) {
  if (contentSize + PAN_PADDING * 2 <= viewportSize) {
    return quantize((viewportSize - contentSize) / 2);
  }

  return quantize(
    clamp(offset, viewportSize - contentSize - PAN_PADDING, PAN_PADDING),
  );
}

export function useRoutineMapCamera({
  rootRef,
  viewportRef,
  worldWidth,
  worldHeight,
  fitWorldWidth,
  fitWorldHeight,
  minScale,
  maxScale,
  fitPadding,
  onZoomIntent,
}: UseRoutineMapCameraParams) {
  const initializedRef = useRef(false);
  const panStateRef = useRef<PanState | null>(null);
  const viewRef = useRef<ViewState>({ x: 0, y: 0, scale: 1 });

  const [spacePressed, setSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [view, setView] = useState<ViewState>(viewRef.current);

  const buildDisplayScale = useCallback(() => {
    const viewportElement = viewportRef.current;

    if (!viewportElement) {
      return 1;
    }

    const viewportRect = viewportElement.getBoundingClientRect();
    const availableWidth = Math.max(1, viewportRect.width - fitPadding * 2);
    const availableHeight = Math.max(1, viewportRect.height - fitPadding * 2);

    return clamp(
      Math.min(
        availableWidth / Math.max(fitWorldWidth, 1),
        availableHeight / Math.max(fitWorldHeight, 1),
      ),
      minScale,
      maxScale,
    );
  }, [
    fitPadding,
    fitWorldHeight,
    fitWorldWidth,
    maxScale,
    minScale,
    viewportRef,
  ]);

  const constrainView = useCallback(
    (candidate: ViewState) => {
      const viewportElement = viewportRef.current;

      if (!viewportElement) {
        return candidate;
      }

      const viewportRect = viewportElement.getBoundingClientRect();
      const displayScale = candidate.scale;
      const contentWidth = worldWidth * displayScale;
      const contentHeight = worldHeight * displayScale;

      return {
        scale: displayScale,
        x: clampAxis(candidate.x, viewportRect.width, contentWidth),
        y: clampAxis(candidate.y, viewportRect.height, contentHeight),
      };
    },
    [viewportRef, worldHeight, worldWidth],
  );

  const commitView = useCallback(
    (candidate: ViewState) => {
      const nextView = constrainView(candidate);

      viewRef.current = nextView;
      setView(nextView);
    },
    [constrainView],
  );

  const setViewWithinBounds = useCallback(
    (nextView: ViewState | ((currentView: ViewState) => ViewState)) => {
      const displayScale = buildDisplayScale();
      const resolvedView =
        typeof nextView === "function" ? nextView(viewRef.current) : nextView;

      commitView({
        ...resolvedView,
        scale: displayScale,
      });
    },
    [buildDisplayScale, commitView],
  );

  const buildHomeView = useCallback(() => {
    const viewportElement = viewportRef.current;

    if (!viewportElement) {
      return null;
    }

    const viewportRect = viewportElement.getBoundingClientRect();
    const displayScale = buildDisplayScale();

    return constrainView({
      scale: displayScale,
      x: quantize((viewportRect.width - worldWidth * displayScale) / 2),
      y: quantize((viewportRect.height - worldHeight * displayScale) / 2),
    });
  }, [buildDisplayScale, constrainView, viewportRef, worldHeight, worldWidth]);

  const resetView = useCallback(() => {
    const homeView = buildHomeView();

    if (homeView) {
      commitView(homeView);
    }
  }, [buildHomeView, commitView]);

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
    const homeView = buildHomeView();

    if (!homeView) {
      return;
    }

    if (!initializedRef.current) {
      initializedRef.current = true;
      commitView(homeView);
      return;
    }

    commitView({
      ...viewRef.current,
      scale: homeView.scale,
    });
  }, [buildHomeView, commitView, worldHeight, worldWidth]);

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

      commitView({
        ...viewRef.current,
        x: panState.originX + (event.clientX - panState.startX),
        y: panState.originY + (event.clientY - panState.startY),
      });
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

  useEffect(() => {
    const rootElement = rootRef.current;
    const viewportElement = viewportRef.current;

    if (!rootElement || !viewportElement || !onZoomIntent) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }

      if (!(event.target instanceof Node) || !viewportElement.contains(event.target)) {
        return;
      }

      event.preventDefault();

      onZoomIntent({
        delta: event.deltaY < 0 ? 1 : -1,
        viewportX: event.clientX - viewportElement.getBoundingClientRect().left,
        viewportY: event.clientY - viewportElement.getBoundingClientRect().top,
      });
    };

    rootElement.addEventListener("wheel", handleWheel, {
      capture: true,
      passive: false,
    });

    return () => {
      rootElement.removeEventListener("wheel", handleWheel, true);
    };
  }, [onZoomIntent, rootRef, viewportRef]);

  return {
    view,
    spacePressed,
    isPanning,
    cursor: isPanning ? "grabbing" : spacePressed ? "grab" : "default",
    resetView,
    setViewWithinBounds,
    viewportHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  };
}
