import {
  CARD_GAP,
  CARD_HEIGHT,
  COLUMN_GAP,
  COLUMN_WIDTH,
  MAP_PADDING,
} from "./config";
import type {
  PositionedRoutineCard,
  RoutineCard,
  RoutineLink,
  RoutineMapLayout,
} from "./types";

type ColumnGroup = {
  level: number;
  items: RoutineCard[];
};

type OrderIndexMap = Record<string, number>;

const ORDER_SWEEPS = 4;
const COLUMN_BALANCE_PENALTY = 0.08;

function buildOrderIndex(columns: readonly ColumnGroup[]): OrderIndexMap {
  const orderIndex: OrderIndexMap = {};

  columns.forEach((column) => {
    column.items.forEach((card, rowIndex) => {
      orderIndex[card.id] = rowIndex;
    });
  });

  return orderIndex;
}

function buildAbsoluteRowIndex(
  columns: readonly ColumnGroup[],
  startSlots: readonly number[],
): OrderIndexMap {
  const absoluteRowIndex: OrderIndexMap = {};

  columns.forEach((column, columnIndex) => {
    column.items.forEach((card, rowIndex) => {
      absoluteRowIndex[card.id] = startSlots[columnIndex] + rowIndex;
    });
  });

  return absoluteRowIndex;
}

function getAverageNeighborIndex(
  neighbors: readonly string[],
  orderIndex: OrderIndexMap,
  fallback: number,
): number {
  const knownNeighbors = neighbors.filter(
    (neighborId) => orderIndex[neighborId] !== undefined,
  );

  if (knownNeighbors.length === 0) {
    return fallback;
  }

  return (
    knownNeighbors.reduce((sum, neighborId) => sum + orderIndex[neighborId], 0) /
    knownNeighbors.length
  );
}

function sortColumnItems(
  items: readonly RoutineCard[],
  primaryWeight: (card: RoutineCard) => number,
  secondaryWeight: (card: RoutineCard) => number,
  originalIndex: Record<string, number>,
): RoutineCard[] {
  return [...items].sort((cardA, cardB) => {
    const primaryDelta = primaryWeight(cardA) - primaryWeight(cardB);

    if (primaryDelta !== 0) {
      return primaryDelta;
    }

    const secondaryDelta = secondaryWeight(cardA) - secondaryWeight(cardB);

    if (secondaryDelta !== 0) {
      return secondaryDelta;
    }

    return originalIndex[cardA.id] - originalIndex[cardB.id];
  });
}

function findBestStartSlot(
  column: ColumnGroup,
  maxItemsInColumn: number,
  centeredStartSlot: number,
  parents: Record<string, string[]>,
  children: Record<string, string[]>,
  absoluteRowIndex: OrderIndexMap,
): number {
  const maxStartSlot = maxItemsInColumn - column.items.length;

  if (maxStartSlot <= 0) {
    return 0;
  }

  let bestStartSlot = centeredStartSlot;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let candidateStartSlot = 0; candidateStartSlot <= maxStartSlot; candidateStartSlot += 1) {
    let score = 0;

    column.items.forEach((card, rowIndex) => {
      const neighborRows = [...(parents[card.id] ?? []), ...(children[card.id] ?? [])]
        .map((neighborId) => absoluteRowIndex[neighborId])
        .filter((neighborRow): neighborRow is number => neighborRow !== undefined);

      if (neighborRows.length === 0) {
        return;
      }

      const targetRow =
        neighborRows.reduce((sum, neighborRow) => sum + neighborRow, 0) /
        neighborRows.length;

      score += Math.abs(candidateStartSlot + rowIndex - targetRow);
    });

    score += Math.abs(candidateStartSlot - centeredStartSlot) * COLUMN_BALANCE_PENALTY;

    if (score < bestScore) {
      bestScore = score;
      bestStartSlot = candidateStartSlot;
    }
  }

  return bestStartSlot;
}

export function buildRoutineMapLayout(
  cards: readonly RoutineCard[],
  links: readonly RoutineLink[],
): RoutineMapLayout {
  const incoming = Object.fromEntries(cards.map((card) => [card.id, 0]));
  const outgoing = Object.fromEntries(
    cards.map((card) => [card.id, [] as string[]]),
  );
  const parents = Object.fromEntries(
    cards.map((card) => [card.id, [] as string[]]),
  );
  const originalIndex = Object.fromEntries(
    cards.map((card, index) => [card.id, index]),
  );

  for (const link of links) {
    if (outgoing[link.from]) {
      outgoing[link.from].push(link.to);
    }

    if (parents[link.to]) {
      parents[link.to].push(link.from);
    }

    if (incoming[link.to] !== undefined) {
      incoming[link.to] += 1;
    }
  }

  const queue = Object.keys(incoming).filter(
    (cardId) => incoming[cardId] === 0,
  );
  const levelMap = Object.fromEntries(cards.map((card) => [card.id, 0]));

  while (queue.length > 0) {
    const currentId = queue.shift();

    if (!currentId) {
      continue;
    }

    for (const nextId of outgoing[currentId] ?? []) {
      levelMap[nextId] = Math.max(levelMap[nextId], levelMap[currentId] + 1);
      incoming[nextId] -= 1;

      if (incoming[nextId] === 0) {
        queue.push(nextId);
      }
    }
  }

  const groupedByLevel = new Map<number, RoutineCard[]>();

  for (const card of cards) {
    const level = levelMap[card.id] ?? 0;
    const columnCards = groupedByLevel.get(level);

    if (columnCards) {
      columnCards.push(card);
    } else {
      groupedByLevel.set(level, [card]);
    }
  }

  const columns: ColumnGroup[] = [...groupedByLevel.entries()]
    .sort(([a], [b]) => a - b)
    .map(([level, columnCards]) => ({
      level,
      items: sortColumnItems(
        columnCards,
        (card) =>
          getAverageNeighborIndex(
            parents[card.id] ?? [],
            originalIndex,
            originalIndex[card.id],
          ),
        (card) =>
          getAverageNeighborIndex(
            outgoing[card.id] ?? [],
            originalIndex,
            originalIndex[card.id],
          ),
        originalIndex,
      ),
    }));

  let orderIndex = buildOrderIndex(columns);

  for (let sweep = 0; sweep < ORDER_SWEEPS; sweep += 1) {
    for (let columnIndex = 1; columnIndex < columns.length; columnIndex += 1) {
      const column = columns[columnIndex];

      column.items = sortColumnItems(
        column.items,
        (card) =>
          getAverageNeighborIndex(
            parents[card.id] ?? [],
            orderIndex,
            originalIndex[card.id],
          ),
        (card) =>
          getAverageNeighborIndex(
            outgoing[card.id] ?? [],
            orderIndex,
            originalIndex[card.id],
          ),
        originalIndex,
      );

      orderIndex = buildOrderIndex(columns);
    }

    for (let columnIndex = columns.length - 2; columnIndex >= 0; columnIndex -= 1) {
      const column = columns[columnIndex];

      column.items = sortColumnItems(
        column.items,
        (card) =>
          getAverageNeighborIndex(
            outgoing[card.id] ?? [],
            orderIndex,
            originalIndex[card.id],
          ),
        (card) =>
          getAverageNeighborIndex(
            parents[card.id] ?? [],
            orderIndex,
            originalIndex[card.id],
          ),
        originalIndex,
      );

      orderIndex = buildOrderIndex(columns);
    }
  }

  const maxItemsInColumn = Math.max(
    1,
    ...columns.map((column) => column.items.length),
  );
  const maxColumnHeight =
    maxItemsInColumn * CARD_HEIGHT +
    Math.max(0, maxItemsInColumn - 1) * CARD_GAP;
  const centeredStartSlots = columns.map((column) =>
    Math.floor((maxItemsInColumn - column.items.length) / 2),
  );
  const startSlots = [...centeredStartSlots];
  let absoluteRowIndex = buildAbsoluteRowIndex(columns, startSlots);

  for (let sweep = 0; sweep < ORDER_SWEEPS; sweep += 1) {
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
      startSlots[columnIndex] = findBestStartSlot(
        columns[columnIndex],
        maxItemsInColumn,
        centeredStartSlots[columnIndex],
        parents,
        outgoing,
        absoluteRowIndex,
      );

      absoluteRowIndex = buildAbsoluteRowIndex(columns, startSlots);
    }

    for (let columnIndex = columns.length - 1; columnIndex >= 0; columnIndex -= 1) {
      startSlots[columnIndex] = findBestStartSlot(
        columns[columnIndex],
        maxItemsInColumn,
        centeredStartSlots[columnIndex],
        parents,
        outgoing,
        absoluteRowIndex,
      );

      absoluteRowIndex = buildAbsoluteRowIndex(columns, startSlots);
    }
  }

  const positionedCards: PositionedRoutineCard[] = [];

  columns.forEach((column, columnIndex) => {
    const startY = MAP_PADDING + startSlots[columnIndex] * (CARD_HEIGHT + CARD_GAP);
    const x = MAP_PADDING + columnIndex * (COLUMN_WIDTH + COLUMN_GAP);

    column.items.forEach((card, rowIndex) => {
      positionedCards.push({
        ...card,
        x,
        y: startY + rowIndex * (CARD_HEIGHT + CARD_GAP),
      });
    });
  });

  return {
    cards: positionedCards,
    width:
      columns.length * COLUMN_WIDTH +
      Math.max(0, columns.length - 1) * COLUMN_GAP +
      MAP_PADDING * 2,
    height: maxColumnHeight + MAP_PADDING * 2,
  };
}
