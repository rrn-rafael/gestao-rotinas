import type { CardRect } from "./types";

type ConnectorPoint = {
  x: number;
  y: number;
};

type ConnectorGeometry = {
  path: string;
  start: ConnectorPoint;
  end: ConnectorPoint;
};

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function quantize(value: number) {
  return Math.round(value * 2) / 2;
}

export function areRectMapsSimilar(
  previous: Record<string, CardRect>,
  next: Record<string, CardRect>,
) {
  const previousKeys = Object.keys(previous);
  const nextKeys = Object.keys(next);

  if (previousKeys.length !== nextKeys.length) {
    return false;
  }

  for (const key of nextKeys) {
    const previousRect = previous[key];
    const nextRect = next[key];

    if (!previousRect || !nextRect) {
      return false;
    }

    if (
      Math.abs(previousRect.x - nextRect.x) > 0.5 ||
      Math.abs(previousRect.y - nextRect.y) > 0.5 ||
      Math.abs(previousRect.width - nextRect.width) > 0.5 ||
      Math.abs(previousRect.height - nextRect.height) > 0.5
    ) {
      return false;
    }
  }

  return true;
}

export function buildConnectorPath(fromRect: CardRect, toRect: CardRect) {
  return buildConnectorGeometry(fromRect, toRect).path;
}

export function buildConnectorGeometry(
  fromRect: CardRect,
  toRect: CardRect,
): ConnectorGeometry {
  const startX = fromRect.x + fromRect.width;
  const startY = fromRect.y + fromRect.height / 2;
  const endX = toRect.x;
  const endY = toRect.y + toRect.height / 2;
  const distance = Math.max(24, endX - startX);
  const bend = Math.min(40, Math.max(18, distance * 0.35));

  return {
    start: {
      x: quantize(startX),
      y: quantize(startY),
    },
    end: {
      x: quantize(endX),
      y: quantize(endY),
    },
    path: `M ${quantize(startX)} ${quantize(startY)} C ${quantize(startX + bend)} ${quantize(startY)}, ${quantize(endX - bend)} ${quantize(endY)}, ${quantize(endX)} ${quantize(endY)}`,
  };
}
