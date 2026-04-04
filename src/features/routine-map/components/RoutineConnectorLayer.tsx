import { buildConnectorPath } from "../model/geometry";
import { getEdgeRelation } from "../model/graph";
import type { CardRect, FocusSets, RoutineLink } from "../model/types";

type RoutineConnectorLayerProps = {
  width: number;
  height: number;
  links: readonly RoutineLink[];
  cardRects: Record<string, CardRect>;
  selectedId: string | null;
  focusSets: FocusSets;
};

export function RoutineConnectorLayer({
  width,
  height,
  links,
  cardRects,
  selectedId,
  focusSets,
}: RoutineConnectorLayerProps) {
  return (
    <svg
      className="pointer-events-none absolute left-0 top-0 z-0"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      {links.map((link) => {
        const fromRect = cardRects[link.from];
        const toRect = cardRects[link.to];

        if (!fromRect || !toRect) {
          return null;
        }

        const relation = getEdgeRelation(link, selectedId, focusSets);
        const isHighlighted =
          relation === "upstream" || relation === "downstream";

        return (
          <path
            key={`${link.from}-${link.to}`}
            d={buildConnectorPath(fromRect, toRect)}
            fill="none"
            stroke={isHighlighted ? "#F59E0B" : "#D1D5DB"}
            strokeWidth={isHighlighted ? 2 : 1.5}
            strokeLinecap="round"
            opacity={selectedId ? (isHighlighted ? 1 : 0.18) : 1}
          />
        );
      })}
    </svg>
  );
}
