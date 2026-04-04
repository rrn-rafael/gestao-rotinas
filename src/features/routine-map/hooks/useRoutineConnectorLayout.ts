import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { RefObject } from "react";

import { areRectMapsSimilar, quantize } from "../model/geometry";
import type { CardRect, RoutineCard, ViewState } from "../model/types";

type UseRoutineConnectorLayoutParams = {
  worldRef: RefObject<HTMLDivElement>;
  cardRefs: RefObject<Record<string, HTMLButtonElement | null>>;
  cards: readonly RoutineCard[];
  view: ViewState;
  selectedId: string | null;
};

export function useRoutineConnectorLayout({
  worldRef,
  cardRefs,
  cards,
  view,
  selectedId,
}: UseRoutineConnectorLayoutParams) {
  const rafRef = useRef<number | null>(null);
  const [cardRects, setCardRects] = useState<Record<string, CardRect>>({});

  const syncConnectorLayout = useCallback(() => {
    const worldElement = worldRef.current;
    const cardRegistry = cardRefs.current;

    if (!worldElement || !cardRegistry || view.scale <= 0) {
      return;
    }

    const worldRect = worldElement.getBoundingClientRect();
    const nextRects: Record<string, CardRect> = {};

    for (const item of cards) {
      const cardElement = cardRegistry[item.id];

      if (!cardElement) {
        continue;
      }

      const cardRect = cardElement.getBoundingClientRect();
      nextRects[item.id] = {
        x: quantize((cardRect.left - worldRect.left) / view.scale),
        y: quantize((cardRect.top - worldRect.top) / view.scale),
        width: quantize(cardRect.width / view.scale),
        height: quantize(cardRect.height / view.scale),
      };
    }

    setCardRects((previousRects) =>
      areRectMapsSimilar(previousRects, nextRects) ? previousRects : nextRects,
    );
  }, [cardRefs, cards, view.scale, worldRef]);

  const scheduleConnectorLayout = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      syncConnectorLayout();
    });
  }, [syncConnectorLayout]);

  useLayoutEffect(() => {
    syncConnectorLayout();
  }, [selectedId, syncConnectorLayout]);

  useEffect(() => {
    scheduleConnectorLayout();
  }, [scheduleConnectorLayout, view.scale, view.x, view.y]);

  useLayoutEffect(() => {
    const cardRegistry = cardRefs.current;
    const resizeObserver = new ResizeObserver(() => {
      scheduleConnectorLayout();
    });

    if (worldRef.current) {
      resizeObserver.observe(worldRef.current);
    }

    if (!cardRegistry) {
      return () => {
        resizeObserver.disconnect();
        window.removeEventListener("resize", scheduleConnectorLayout);
      };
    }

    for (const item of cards) {
      const cardElement = cardRegistry[item.id];

      if (cardElement) {
        resizeObserver.observe(cardElement);
      }
    }

    window.addEventListener("resize", scheduleConnectorLayout);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleConnectorLayout);
    };
  }, [cardRefs, cards, scheduleConnectorLayout, worldRef]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return { cardRects };
}
