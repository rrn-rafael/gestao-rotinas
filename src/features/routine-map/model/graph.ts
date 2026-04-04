import { isSecondaryStatus } from "./presentation";
import type {
  CardRelation,
  CardStatus,
  EdgeRelation,
  FocusSets,
  RoutineLink,
} from "./types";

type GraphIndexes = {
  upstreamByNode: Map<string, string[]>;
  downstreamByNode: Map<string, string[]>;
};

export function buildGraphIndexes(links: readonly RoutineLink[]): GraphIndexes {
  const upstreamByNode = new Map<string, string[]>();
  const downstreamByNode = new Map<string, string[]>();

  for (const link of links) {
    const upstreamNodes = upstreamByNode.get(link.to);
    const downstreamNodes = downstreamByNode.get(link.from);

    if (upstreamNodes) {
      upstreamNodes.push(link.from);
    } else {
      upstreamByNode.set(link.to, [link.from]);
    }

    if (downstreamNodes) {
      downstreamNodes.push(link.to);
    } else {
      downstreamByNode.set(link.from, [link.to]);
    }
  }

  return { upstreamByNode, downstreamByNode };
}

export function buildFocusSets(
  selectedId: string | null,
  graphIndexes: GraphIndexes,
): FocusSets {
  const upstream = new Set<string>();
  const downstream = new Set<string>();

  if (!selectedId) {
    return { upstream, downstream };
  }

  const reverseQueue = [selectedId];
  const forwardQueue = [selectedId];

  while (reverseQueue.length > 0) {
    const currentId = reverseQueue.shift();

    if (!currentId) {
      continue;
    }

    const nextUpstreamNodes = graphIndexes.upstreamByNode.get(currentId) ?? [];

    for (const nextId of nextUpstreamNodes) {
      if (nextId === selectedId || upstream.has(nextId)) {
        continue;
      }

      upstream.add(nextId);
      reverseQueue.push(nextId);
    }
  }

  while (forwardQueue.length > 0) {
    const currentId = forwardQueue.shift();

    if (!currentId) {
      continue;
    }

    const nextDownstreamNodes =
      graphIndexes.downstreamByNode.get(currentId) ?? [];

    for (const nextId of nextDownstreamNodes) {
      if (nextId === selectedId || downstream.has(nextId)) {
        continue;
      }

      downstream.add(nextId);
      forwardQueue.push(nextId);
    }
  }

  return { upstream, downstream };
}

export function getCardRelation(
  cardId: string,
  selectedId: string | null,
  focusSets: FocusSets,
): CardRelation {
  if (!selectedId) {
    return "idle";
  }

  if (cardId === selectedId) {
    return "selected";
  }

  if (focusSets.upstream.has(cardId)) {
    return "upstream";
  }

  if (focusSets.downstream.has(cardId)) {
    return "downstream";
  }

  return "muted";
}

export function getCardOpacity(
  status: CardStatus,
  relation: CardRelation,
  hasSelection: boolean,
) {
  if (!hasSelection) {
    return isSecondaryStatus(status) ? 0.45 : 1;
  }

  return relation === "muted" ? 0.45 : 1;
}

export function getEdgeRelation(
  link: RoutineLink,
  selectedId: string | null,
  focusSets: FocusSets,
): EdgeRelation {
  if (!selectedId) {
    return "idle";
  }

  const fromRelation = getCardRelation(link.from, selectedId, focusSets);
  const toRelation = getCardRelation(link.to, selectedId, focusSets);

  if (
    (fromRelation === "selected" || fromRelation === "upstream") &&
    (toRelation === "selected" || toRelation === "upstream")
  ) {
    return "upstream";
  }

  if (
    (fromRelation === "selected" || fromRelation === "downstream") &&
    (toRelation === "selected" || toRelation === "downstream")
  ) {
    return "downstream";
  }

  return "muted";
}
