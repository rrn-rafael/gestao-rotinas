import {
  CARD_GAP,
  CARD_HEIGHT,
  CARD_WIDTH,
  MAP_HORIZONTAL_PADDING,
  MAP_VERTICAL_PADDING,
  TIMELINE_BUCKET_LANE_GAP,
  TIMELINE_BUCKET_SAFE_PADDING,
  TIMELINE_COLUMN_DENSITY_STEP,
  TIMELINE_COLUMN_EMPTY_WIDTH,
  TIMELINE_COLUMN_MAX_WIDTH,
  TIMELINE_COLUMN_MIN_WIDTH,
  TIMELINE_COLUMN_SINGLE_WIDTH,
  TIMELINE_END_HOUR,
  TIMELINE_START_HOUR,
} from "./config";
import type {
  PositionedRoutineCard,
  RoutineCard,
  RoutineLink,
  RoutineMapLayout,
  TimelineBucket,
} from "./types";

const MINUTES_PER_HOUR = 60;
const FIRST_TIMELINE_MINUTE = TIMELINE_START_HOUR * MINUTES_PER_HOUR;
const LAST_TIMELINE_MINUTE =
  (TIMELINE_END_HOUR + 1) * MINUTES_PER_HOUR - 1;
const MAX_GROUPED_HOUR_SPAN = 4;
const MAX_GROUPED_HOUR_ITEMS = 3;
const MAX_GROUPED_HOUR_ITEMS_WITH_FLOW = 4;

type TimelineBucketDescriptor = Omit<TimelineBucket, "x" | "width">;

type BucketItem = {
  card: RoutineCard;
  minutes: number;
  originalIndex: number;
};

type BucketEntry = {
  descriptor: TimelineBucketDescriptor;
  items: BucketItem[];
};

type GraphLayoutMeta = {
  upstreamByNode: Map<string, string[]>;
  downstreamByNode: Map<string, string[]>;
  parentSetByNode: Map<string, Set<string>>;
  childSetByNode: Map<string, Set<string>>;
  ancestorSetByNode: Map<string, Set<string>>;
  descendantSetByNode: Map<string, Set<string>>;
  componentByNode: Map<string, number>;
  depthByNode: Map<string, number>;
};

type PlacementBand = {
  id: string;
  bucketEntries: BucketEntry[];
  items: BucketItem[];
  columnAssignments: Map<string, { columnIndex: number; rowIndex: number }>;
  columnCount: number;
};

type FlowColumn = {
  items: BucketItem[];
};

function parseTimelineMinutes(value: string | undefined) {
  if (!value) {
    return null;
  }

  const match = /^(\d{1,2}):(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * MINUTES_PER_HOUR + minutes;
}

export function getRoutineCardTimelineMinutes(card: RoutineCard) {
  return (
    parseTimelineMinutes(card.forecast ?? card.completedAt) ??
    FIRST_TIMELINE_MINUTE
  );
}

export function getTimelineBucketIdForMinutes(minutes: number) {
  if (minutes < FIRST_TIMELINE_MINUTE) {
    return "before";
  }

  if (minutes > LAST_TIMELINE_MINUTE) {
    return "after";
  }

  const hour = Math.floor(minutes / MINUTES_PER_HOUR);

  return `hour-${hour}`;
}

export function getTimelineBucketIdForDate(date: Date) {
  return getTimelineBucketIdForMinutes(
    date.getHours() * MINUTES_PER_HOUR + date.getMinutes(),
  );
}

function buildTimelineBucketDescriptors(): TimelineBucketDescriptor[] {
  const descriptors: TimelineBucketDescriptor[] = [
    {
      id: "before",
      label: "Antes das 8h",
      kind: "before",
      index: 0,
      startMinutes: null,
      endMinutes: FIRST_TIMELINE_MINUTE - 1,
    },
  ];

  for (let hour = TIMELINE_START_HOUR; hour <= TIMELINE_END_HOUR; hour += 1) {
    descriptors.push({
      id: `hour-${hour}`,
      label: `${hour}h`,
      kind: "hour",
      index: descriptors.length,
      startMinutes: hour * MINUTES_PER_HOUR,
      endMinutes: hour * MINUTES_PER_HOUR + MINUTES_PER_HOUR - 1,
    });
  }

  descriptors.push({
    id: "after",
    label: "Depois das 16h",
    kind: "after",
    index: descriptors.length,
    startMinutes: LAST_TIMELINE_MINUTE + 1,
    endMinutes: null,
  });

  return descriptors;
}

function buildBucketEntries(cards: readonly RoutineCard[]) {
  const entries: BucketEntry[] = buildTimelineBucketDescriptors().map(
    (descriptor) => ({
      descriptor,
      items: [],
    }),
  );

  cards.forEach((card, originalIndex) => {
    const minutes = getRoutineCardTimelineMinutes(card);
    const bucketId = getTimelineBucketIdForMinutes(minutes);
    const entry = entries.find((candidate) => candidate.descriptor.id === bucketId);

    if (!entry) {
      return;
    }

    entry.items.push({ card, minutes, originalIndex });
  });

  entries.forEach((entry) => {
    entry.items.sort((left, right) => {
      const minuteDelta = left.minutes - right.minutes;

      if (minuteDelta !== 0) {
        return minuteDelta;
      }

      return left.originalIndex - right.originalIndex;
    });
  });

  return entries;
}

function buildGraphLayoutMeta(
  cards: readonly RoutineCard[],
  links: readonly RoutineLink[],
): GraphLayoutMeta {
  const upstreamByNode = new Map<string, string[]>();
  const downstreamByNode = new Map<string, string[]>();
  const undirectedNeighbors = new Map<string, Set<string>>();

  cards.forEach((card) => {
    upstreamByNode.set(card.id, []);
    downstreamByNode.set(card.id, []);
    undirectedNeighbors.set(card.id, new Set());
  });

  links.forEach((link) => {
    upstreamByNode.get(link.to)?.push(link.from);
    downstreamByNode.get(link.from)?.push(link.to);
    undirectedNeighbors.get(link.from)?.add(link.to);
    undirectedNeighbors.get(link.to)?.add(link.from);
  });

  const parentSetByNode = new Map<string, Set<string>>();
  const childSetByNode = new Map<string, Set<string>>();

  cards.forEach((card) => {
    parentSetByNode.set(card.id, new Set(upstreamByNode.get(card.id) ?? []));
    childSetByNode.set(card.id, new Set(downstreamByNode.get(card.id) ?? []));
  });

  const ancestorSetByNode = new Map<string, Set<string>>();
  const descendantSetByNode = new Map<string, Set<string>>();
  const depthByNode = new Map<string, number>();

  function getAncestors(nodeId: string): Set<string> {
    const cached = ancestorSetByNode.get(nodeId);

    if (cached) {
      return cached;
    }

    const ancestors = new Set<string>();

    for (const parentId of upstreamByNode.get(nodeId) ?? []) {
      ancestors.add(parentId);

      getAncestors(parentId).forEach((ancestorId) => {
        ancestors.add(ancestorId);
      });
    }

    ancestorSetByNode.set(nodeId, ancestors);

    return ancestors;
  }

  function getDescendants(nodeId: string): Set<string> {
    const cached = descendantSetByNode.get(nodeId);

    if (cached) {
      return cached;
    }

    const descendants = new Set<string>();

    for (const childId of downstreamByNode.get(nodeId) ?? []) {
      descendants.add(childId);

      getDescendants(childId).forEach((descendantId) => {
        descendants.add(descendantId);
      });
    }

    descendantSetByNode.set(nodeId, descendants);

    return descendants;
  }

  function getDepth(nodeId: string): number {
    const cached = depthByNode.get(nodeId);

    if (cached !== undefined) {
      return cached;
    }

    const parents = upstreamByNode.get(nodeId) ?? [];

    if (parents.length === 0) {
      depthByNode.set(nodeId, 0);
      return 0;
    }

    const depth =
      Math.max(...parents.map((parentId) => getDepth(parentId))) + 1;

    depthByNode.set(nodeId, depth);

    return depth;
  }

  const componentByNode = new Map<string, number>();
  let componentIndex = 0;

  cards.forEach((card) => {
    if (componentByNode.has(card.id)) {
      return;
    }

    const queue = [card.id];
    componentByNode.set(card.id, componentIndex);

    while (queue.length > 0) {
      const currentId = queue.shift();

      if (!currentId) {
        continue;
      }

      for (const neighborId of undirectedNeighbors.get(currentId) ?? []) {
        if (componentByNode.has(neighborId)) {
          continue;
        }

        componentByNode.set(neighborId, componentIndex);
        queue.push(neighborId);
      }
    }

    componentIndex += 1;
  });

  cards.forEach((card) => {
    getAncestors(card.id);
    getDescendants(card.id);
    getDepth(card.id);
  });

  return {
    upstreamByNode,
    downstreamByNode,
    parentSetByNode,
    childSetByNode,
    ancestorSetByNode,
    descendantSetByNode,
    componentByNode,
    depthByNode,
  };
}

function getBaseBucketWidth(entry: BucketEntry) {
  const count = entry.items.length;

  if (count === 0) {
    return TIMELINE_COLUMN_EMPTY_WIDTH;
  }

  if (count === 1) {
    return TIMELINE_COLUMN_SINGLE_WIDTH;
  }

  return Math.min(
    TIMELINE_COLUMN_MAX_WIDTH,
    TIMELINE_COLUMN_MIN_WIDTH +
      Math.max(count - 2, 0) * TIMELINE_COLUMN_DENSITY_STEP,
  );
}

function hasAnyFlowRelation(
  leftItems: readonly BucketItem[],
  rightItems: readonly BucketItem[],
  graphMeta: GraphLayoutMeta,
) {
  return leftItems.some((leftItem) =>
    rightItems.some((rightItem) => {
      const leftId = leftItem.card.id;
      const rightId = rightItem.card.id;

      return (
        graphMeta.ancestorSetByNode.get(leftId)?.has(rightId) ||
        graphMeta.ancestorSetByNode.get(rightId)?.has(leftId) ||
        graphMeta.parentSetByNode.get(leftId)?.has(rightId) ||
        graphMeta.parentSetByNode.get(rightId)?.has(leftId) ||
        graphMeta.childSetByNode.get(leftId)?.has(rightId) ||
        graphMeta.childSetByNode.get(rightId)?.has(leftId)
      );
    }),
  );
}

function canMergeIntoPlacementBand(
  bandEntries: readonly BucketEntry[],
  nextEntry: BucketEntry,
  graphMeta: GraphLayoutMeta,
) {
  if (
    nextEntry.descriptor.kind !== "hour" ||
    bandEntries.some((entry) => entry.descriptor.kind !== "hour")
  ) {
    return false;
  }

  const totalItemCount = bandEntries.reduce(
    (sum, entry) => sum + entry.items.length,
    0,
  );
  const bandSpan = bandEntries.length;
  const nextItemCount = nextEntry.items.length;

  if (bandSpan >= MAX_GROUPED_HOUR_SPAN) {
    return false;
  }

  const bandIsSparse = bandEntries.every((entry) => entry.items.length <= 1);
  const nextIsSparse = nextItemCount <= 1;

  if (!bandIsSparse || !nextIsSparse) {
    return false;
  }

  const combinedItems = totalItemCount + nextItemCount;
  const flowRelation = hasAnyFlowRelation(
    bandEntries.flatMap((entry) => entry.items),
    nextEntry.items,
    graphMeta,
  );

  return flowRelation
    ? combinedItems <= MAX_GROUPED_HOUR_ITEMS_WITH_FLOW
    : combinedItems <= MAX_GROUPED_HOUR_ITEMS;
}

function buildPlacementBands(
  bucketEntries: readonly BucketEntry[],
  graphMeta: GraphLayoutMeta,
) {
  const bands: PlacementBand[] = [];
  let currentEntries: BucketEntry[] = [];

  const flushBand = () => {
    if (currentEntries.length === 0) {
      return;
    }

    const bandItems = currentEntries.flatMap((entry) => entry.items);
    bands.push({
      id: currentEntries.map((entry) => entry.descriptor.id).join("__"),
      bucketEntries: currentEntries,
      items: bandItems,
      columnAssignments: new Map(),
      columnCount: 1,
    });
    currentEntries = [];
  };

  bucketEntries.forEach((entry) => {
    if (currentEntries.length === 0) {
      currentEntries = [entry];
      return;
    }

    if (canMergeIntoPlacementBand(currentEntries, entry, graphMeta)) {
      currentEntries = [...currentEntries, entry];
      return;
    }

    flushBand();
    currentEntries = [entry];
  });

  flushBand();

  return bands;
}

function shareParentsOrChildren(
  leftId: string,
  rightId: string,
  graphMeta: GraphLayoutMeta,
) {
  const leftParents = graphMeta.parentSetByNode.get(leftId) ?? new Set<string>();
  const rightParents =
    graphMeta.parentSetByNode.get(rightId) ?? new Set<string>();
  const leftChildren = graphMeta.childSetByNode.get(leftId) ?? new Set<string>();
  const rightChildren =
    graphMeta.childSetByNode.get(rightId) ?? new Set<string>();

  for (const parentId of leftParents) {
    if (rightParents.has(parentId)) {
      return true;
    }
  }

  for (const childId of leftChildren) {
    if (rightChildren.has(childId)) {
      return true;
    }
  }

  return false;
}

function hasFlowColumnConflict(
  item: BucketItem,
  existing: BucketItem,
  graphMeta: GraphLayoutMeta,
) {
  const itemId = item.card.id;
  const existingId = existing.card.id;
  const itemComponent = graphMeta.componentByNode.get(itemId);
  const existingComponent = graphMeta.componentByNode.get(existingId);

  if (itemComponent !== existingComponent) {
    return false;
  }

  if (
    graphMeta.ancestorSetByNode.get(itemId)?.has(existingId) ||
    graphMeta.ancestorSetByNode.get(existingId)?.has(itemId)
  ) {
    return true;
  }

  return shareParentsOrChildren(itemId, existingId, graphMeta);
}

function buildPlacementBandColumns(
  band: PlacementBand,
  graphMeta: GraphLayoutMeta,
) {
  const columns: FlowColumn[] = [];
  const placements = new Map<
    string,
    {
      column: FlowColumn;
      rowIndex: number;
    }
  >();

  const sortedItems = [...band.items].sort((left, right) => {
    const minuteDelta = left.minutes - right.minutes;

    if (minuteDelta !== 0) {
      return minuteDelta;
    }

    const depthDelta =
      (graphMeta.depthByNode.get(left.card.id) ?? 0) -
      (graphMeta.depthByNode.get(right.card.id) ?? 0);

    if (depthDelta !== 0) {
      return depthDelta;
    }

    return left.originalIndex - right.originalIndex;
  });

  sortedItems.forEach((item) => {
    const itemId = item.card.id;
    const relatedColumnIndexes: number[] = [];

    [
      ...(graphMeta.upstreamByNode.get(itemId) ?? []),
      ...(graphMeta.downstreamByNode.get(itemId) ?? []),
      ...(graphMeta.ancestorSetByNode.get(itemId) ?? []),
      ...(graphMeta.descendantSetByNode.get(itemId) ?? []),
    ].forEach((relatedId) => {
      const relatedPlacement = placements.get(relatedId);

      if (!relatedPlacement) {
        return;
      }

      const columnIndex = columns.indexOf(relatedPlacement.column);

      if (columnIndex >= 0) {
        relatedColumnIndexes.push(columnIndex);
      }
    });

    const preferredColumnIndex =
      relatedColumnIndexes.length > 0
        ? relatedColumnIndexes.reduce((sum, value) => sum + value, 0) /
          relatedColumnIndexes.length
        : columns.length;

    const availableColumns = columns
      .map((column, index) => ({ column, index }))
      .filter(({ column }) =>
        !column.items.some((existing) =>
          hasFlowColumnConflict(item, existing, graphMeta),
        ),
      )
      .sort((left, right) => {
        const leftDistance = Math.abs(left.index - preferredColumnIndex);
        const rightDistance = Math.abs(right.index - preferredColumnIndex);

        if (leftDistance !== rightDistance) {
          return leftDistance - rightDistance;
        }

        return left.column.items.length - right.column.items.length;
      });

    if (availableColumns.length > 0) {
      const targetColumn = availableColumns[0].column;
      const rowIndex = targetColumn.items.length;

      targetColumn.items.push(item);
      placements.set(itemId, { column: targetColumn, rowIndex });
      return;
    }

    const insertIndex = Math.min(
      Math.max(Math.round(preferredColumnIndex), 0),
      columns.length,
    );
    const newColumn: FlowColumn = {
      items: [item],
    };

    columns.splice(insertIndex, 0, newColumn);
    placements.set(itemId, { column: newColumn, rowIndex: 0 });
  });

  band.columnAssignments = new Map(
    [...placements.entries()].map(([itemId, placement]) => [
      itemId,
      {
        columnIndex: columns.indexOf(placement.column),
        rowIndex: placement.rowIndex,
      },
    ]),
  );
  band.columnCount = Math.max(columns.length, 1);
}

function getRequiredBandWidth(columnCount: number) {
  return (
    TIMELINE_BUCKET_SAFE_PADDING * 2 +
    columnCount * CARD_WIDTH +
    Math.max(columnCount - 1, 0) * TIMELINE_BUCKET_LANE_GAP
  );
}

function allocateBucketWidthsByBand(bands: readonly PlacementBand[]) {
  const widths = new Map<string, number>();

  bands.forEach((band) => {
    const baseWidths = band.bucketEntries.map((entry) => getBaseBucketWidth(entry));
    const baseTotalWidth = baseWidths.reduce((sum, width) => sum + width, 0);
    const requiredBandWidth = getRequiredBandWidth(band.columnCount);
    const extraWidth = Math.max(requiredBandWidth - baseTotalWidth, 0);
    const weights = band.bucketEntries.map((entry) =>
      Math.max(entry.items.length, 1),
    );
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    let remainingExtra = extraWidth;

    band.bucketEntries.forEach((entry, index) => {
      const baseWidth = baseWidths[index];
      const isLast = index === band.bucketEntries.length - 1;
      const share = isLast
        ? remainingExtra
        : Math.round((extraWidth * weights[index]) / totalWeight);
      const width = baseWidth + share;

      widths.set(entry.descriptor.id, width);
      remainingExtra -= share;
    });
  });

  return widths;
}

function buildTimelineBuckets(
  bucketEntries: readonly BucketEntry[],
  bucketWidths: Map<string, number>,
) {
  let currentX = MAP_HORIZONTAL_PADDING;

  return bucketEntries.map((entry) => {
    const width = bucketWidths.get(entry.descriptor.id) ?? getBaseBucketWidth(entry);
    const bucket: TimelineBucket = {
      ...entry.descriptor,
      x: currentX,
      width,
    };

    currentX += width;

    return bucket;
  });
}

function getBandGeometry(
  band: PlacementBand,
  buckets: readonly TimelineBucket[],
) {
  const firstBucket = buckets.find(
    (bucket) => bucket.id === band.bucketEntries[0]?.descriptor.id,
  );
  const lastBucket = buckets.find(
    (bucket) =>
      bucket.id === band.bucketEntries[band.bucketEntries.length - 1]?.descriptor.id,
  );

  if (!firstBucket || !lastBucket) {
    return null;
  }

  return {
    x: firstBucket.x,
    width: lastBucket.x + lastBucket.width - firstBucket.x,
  };
}

export function buildRoutineMapLayout(
  cards: readonly RoutineCard[],
  links: readonly RoutineLink[],
  _columnWidth: number,
): RoutineMapLayout {
  const bucketEntries = buildBucketEntries(cards);
  const graphMeta = buildGraphLayoutMeta(cards, links);
  const placementBands = buildPlacementBands(bucketEntries, graphMeta);

  placementBands.forEach((band) => {
    buildPlacementBandColumns(band, graphMeta);
  });

  const bucketWidths = allocateBucketWidthsByBand(placementBands);
  const buckets = buildTimelineBuckets(bucketEntries, bucketWidths);
  const positionedCards: PositionedRoutineCard[] = [];
  let maxBottom = MAP_VERTICAL_PADDING + CARD_HEIGHT;

  placementBands.forEach((band) => {
    const geometry = getBandGeometry(band, buckets);

    if (!geometry) {
      return;
    }

    const laneWidth =
      (geometry.width -
        TIMELINE_BUCKET_SAFE_PADDING * 2 -
        Math.max(band.columnCount - 1, 0) * TIMELINE_BUCKET_LANE_GAP) /
      band.columnCount;

    band.items.forEach((item) => {
      const assignment = band.columnAssignments.get(item.card.id);

      if (!assignment) {
        return;
      }

      const x =
        geometry.x +
        TIMELINE_BUCKET_SAFE_PADDING +
        assignment.columnIndex * (laneWidth + TIMELINE_BUCKET_LANE_GAP) +
        (laneWidth - CARD_WIDTH) / 2;
      const y =
        MAP_VERTICAL_PADDING + assignment.rowIndex * (CARD_HEIGHT + CARD_GAP);

      positionedCards.push({
        ...item.card,
        x,
        y,
      });

      maxBottom = Math.max(maxBottom, y + CARD_HEIGHT);
    });
  });

  const lastBucket = buckets[buckets.length - 1];
  const totalWidth =
    (lastBucket ? lastBucket.x + lastBucket.width : MAP_HORIZONTAL_PADDING) +
    MAP_HORIZONTAL_PADDING;

  return {
    cards: positionedCards,
    buckets,
    width: totalWidth,
    height: maxBottom + MAP_VERTICAL_PADDING,
  };
}
