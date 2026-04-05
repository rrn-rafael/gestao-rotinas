import { buildConnectorGeometry } from "../model/geometry";
import { getEdgeRelation } from "../model/graph";
import type { CardRect, FocusSets, RoutineLink } from "../model/types";

type ConnectorTerminal = {
  x: number;
  y: number;
  stroke: string;
  opacity: number;
};

type RoutineConnectorLayerProps = {
  width: number;
  height: number;
  links: readonly RoutineLink[];
  cardRects: Record<string, CardRect>;
  selectedId: string | null;
  focusSets: FocusSets;
  dimmed?: boolean;
};

export function RoutineConnectorLayer({
  width,
  height,
  links,
  cardRects,
  selectedId,
  focusSets,
  dimmed = false,
}: RoutineConnectorLayerProps) {
  const connectorPaths: {
    key: string;
    d: string;
    stroke: string;
    strokeWidth: number;
    opacity: number;
  }[] = [];
  const connectorTerminals = new Map<string, ConnectorTerminal>();

  for (const link of links) {
    const fromRect = cardRects[link.from];
    const toRect = cardRects[link.to];

    if (!fromRect || !toRect) {
      continue;
    }

    const relation = getEdgeRelation(link, selectedId, focusSets);
    const isHighlighted =
      relation === "upstream" || relation === "downstream";
    const stroke = isHighlighted ? "#F59E0B" : "#D1D5DB";
    const opacity = dimmed ? 0.18 : selectedId ? (isHighlighted ? 1 : 0.18) : 1;
    const geometry = buildConnectorGeometry(fromRect, toRect);

    connectorPaths.push({
      key: `${link.from}-${link.to}`,
      d: geometry.path,
      stroke,
      strokeWidth: isHighlighted ? 2 : 1.5,
      opacity,
    });

    for (const [terminalKey, terminal] of [
      [
        `${link.from}:out`,
        {
          x: geometry.start.x,
          y: geometry.start.y,
          stroke,
          opacity,
        },
      ],
      [
        `${link.to}:in`,
        {
          x: geometry.end.x,
          y: geometry.end.y,
          stroke,
          opacity,
        },
      ],
    ] as const) {
      const existingTerminal = connectorTerminals.get(terminalKey);

      if (
        !existingTerminal ||
        terminal.opacity > existingTerminal.opacity ||
        (terminal.opacity === existingTerminal.opacity &&
          terminal.stroke !== "#D1D5DB")
      ) {
        connectorTerminals.set(terminalKey, terminal);
      }
    }
  }

  return (
    <>
      <svg
        className="pointer-events-none absolute left-0 top-0 z-0"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
      >
        {connectorPaths.map((connectorPath) => (
          <path
            key={connectorPath.key}
            d={connectorPath.d}
            fill="none"
            stroke={connectorPath.stroke}
            strokeWidth={connectorPath.strokeWidth}
            strokeLinecap="round"
            opacity={connectorPath.opacity}
          />
        ))}
      </svg>

      <svg
        className="pointer-events-none absolute left-0 top-0 z-20 overflow-visible"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
      >
        {[...connectorTerminals.entries()].map(([terminalKey, terminal]) => (
          <circle
            key={terminalKey}
            cx={terminal.x}
            cy={terminal.y}
            r="4.75"
            fill="white"
            stroke={terminal.stroke}
            strokeWidth="1.5"
            opacity={terminal.opacity}
          />
        ))}
      </svg>
    </>
  );
}
