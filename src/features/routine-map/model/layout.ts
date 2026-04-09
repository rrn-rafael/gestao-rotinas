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
  TimelineBucketKind,
} from "./types";

const MINUTES_PER_HOUR = 60;
const FIRST_TIMELINE_MINUTE = TIMELINE_START_HOUR * MINUTES_PER_HOUR;
const LAST_TIMELINE_MINUTE =
  (TIMELINE_END_HOUR + 1) * MINUTES_PER_HOUR - 1;
const MAX_GROUPED_HOUR_SPAN = 5;
const MAX_GROUPED_HOUR_ITEMS = 4;
const MAX_GROUPED_HOUR_ITEMS_WITH_FLOW = 6;
const GROUPED_HOUR_SPAN_STEP = Math.round(TIMELINE_COLUMN_SINGLE_WIDTH * 0.52);
const GROUPED_HOUR_ITEM_STEP = Math.round(TIMELINE_COLUMN_DENSITY_STEP * 1.2);

type TimelineBucketDescriptor = Omit<TimelineBucket, "x" | "width">;

type BucketItem = {
  card: RoutineCard;
  minutes: number;
  originalIndex: number;
};

type RawBucketEntry = {
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
  componentSizeByNode: Map<string, number>;
  depthByNode: Map<string, number>;
  topologicalIndexByNode: Map<string, number>;
};

type MacroTimelineBand = {
  descriptor: TimelineBucketDescriptor;
  rawEntries: RawBucketEntry[];
  items: BucketItem[];
  columnByNode: Map<string, number>;
  columnCount: number;
};

type BandPlacement = {
  bandIndex: number;
  columnIndex: number;
  rowIndex: number;
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

export function findTimelineBucketForMinutes(
  buckets: readonly TimelineBucket[],
  minutes: number,
) {
  return (
    buckets.find((bucket) => {
      if (bucket.startMinutes === null) {
        return bucket.endMinutes !== null && minutes <= bucket.endMinutes;
      }

      if (bucket.endMinutes === null) {
        return minutes >= bucket.startMinutes;
      }

      return minutes >= bucket.startMinutes && minutes <= bucket.endMinutes;
    }) ?? null
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

function buildRawBucketEntries(cards: readonly RoutineCard[]) {
  const entries: RawBucketEntry[] = buildTimelineBucketDescriptors().map(
    (descriptor) => ({
      descriptor,
      items: [],
    }),
  );
  const entryById = new Map(
    entries.map((entry) => [entry.descriptor.id, entry] as const),
  );

  cards.forEach((card, originalIndex) => {
    const minutes = getRoutineCardTimelineMinutes(card);
    const bucketId = getTimelineBucketIdForMinutes(minutes);
    const entry = entryById.get(bucketId);

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
  const originalIndexByNode = new Map<string, number>();
  const minutesByNode = new Map<string, number>();

  cards.forEach((card, originalIndex) => {
    upstreamByNode.set(card.id, []);
    downstreamByNode.set(card.id, []);
    undirectedNeighbors.set(card.id, new Set());
    originalIndexByNode.set(card.id, originalIndex);
    minutesByNode.set(card.id, getRoutineCardTimelineMinutes(card));
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

  const indegreeByNode = new Map<string, number>();
  const pendingNodes: string[] = [];

  cards.forEach((card) => {
    const indegree = upstreamByNode.get(card.id)?.length ?? 0;
    indegreeByNode.set(card.id, indegree);

    if (indegree === 0) {
      pendingNodes.push(card.id);
    }
  });

  const topologicalOrder: string[] = [];

  function sortPendingNodes() {
    pendingNodes.sort((leftId, rightId) => {
      const minuteDelta =
        (minutesByNode.get(leftId) ?? FIRST_TIMELINE_MINUTE) -
        (minutesByNode.get(rightId) ?? FIRST_TIMELINE_MINUTE);

      if (minuteDelta !== 0) {
        return minuteDelta;
      }

      return (
        (originalIndexByNode.get(leftId) ?? 0) -
        (originalIndexByNode.get(rightId) ?? 0)
      );
    });
  }

  sortPendingNodes();

  while (pendingNodes.length > 0) {
    const currentId = pendingNodes.shift();

    if (!currentId) {
      continue;
    }

    topologicalOrder.push(currentId);

    for (const childId of downstreamByNode.get(currentId) ?? []) {
      const nextIndegree = (indegreeByNode.get(childId) ?? 0) - 1;
      indegreeByNode.set(childId, nextIndegree);

      if (nextIndegree === 0) {
        pendingNodes.push(childId);
        sortPendingNodes();
      }
    }
  }

  if (topologicalOrder.length < cards.length) {
    const orderedIds = cards
      .map((card) => card.id)
      .sort((leftId, rightId) => {
        const minuteDelta =
          (minutesByNode.get(leftId) ?? FIRST_TIMELINE_MINUTE) -
          (minutesByNode.get(rightId) ?? FIRST_TIMELINE_MINUTE);

        if (minuteDelta !== 0) {
          return minuteDelta;
        }

        return (
          (originalIndexByNode.get(leftId) ?? 0) -
          (originalIndexByNode.get(rightId) ?? 0)
        );
      });

    topologicalOrder.splice(0, topologicalOrder.length, ...orderedIds);
  }

  const topologicalIndexByNode = new Map<string, number>();
  const depthByNode = new Map<string, number>();

  topologicalOrder.forEach((nodeId, index) => {
    topologicalIndexByNode.set(nodeId, index);

    const depth =
      Math.max(
        -1,
        ...(upstreamByNode.get(nodeId) ?? []).map(
          (parentId) => depthByNode.get(parentId) ?? 0,
        ),
      ) + 1;

    depthByNode.set(nodeId, depth);
  });

  const ancestorSetByNode = new Map<string, Set<string>>();
  const descendantSetByNode = new Map<string, Set<string>>();

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

  const componentSizeCounts = new Map<number, number>();

  componentByNode.forEach((componentId) => {
    componentSizeCounts.set(
      componentId,
      (componentSizeCounts.get(componentId) ?? 0) + 1,
    );
  });
  const componentSizeByNode = new Map<string, number>();

  componentByNode.forEach((componentId, nodeId) => {
    componentSizeByNode.set(nodeId, componentSizeCounts.get(componentId) ?? 1);
  });

  cards.forEach((card) => {
    getAncestors(card.id);
    getDescendants(card.id);
  });

  return {
    upstreamByNode,
    downstreamByNode,
    parentSetByNode,
    childSetByNode,
    ancestorSetByNode,
    descendantSetByNode,
    componentByNode,
    componentSizeByNode,
    depthByNode,
    topologicalIndexByNode,
  };
}

function getSingleHourBaseWidth(itemCount: number) {
  if (itemCount === 0) {
    return TIMELINE_COLUMN_EMPTY_WIDTH;
  }

  if (itemCount === 1) {
    return TIMELINE_COLUMN_SINGLE_WIDTH;
  }

  return Math.min(
    TIMELINE_COLUMN_MAX_WIDTH,
    TIMELINE_COLUMN_MIN_WIDTH +
      Math.max(itemCount - 2, 0) * TIMELINE_COLUMN_DENSITY_STEP,
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

function canMergeIntoMacroBand(
  currentEntries: readonly RawBucketEntry[],
  nextEntry: RawBucketEntry,
  graphMeta: GraphLayoutMeta,
) {
  if (
    nextEntry.descriptor.kind !== "hour" ||
    currentEntries.some((entry) => entry.descriptor.kind !== "hour")
  ) {
    return false;
  }

  const nextSpan = currentEntries.length + 1;

  if (nextSpan > MAX_GROUPED_HOUR_SPAN) {
    return false;
  }

  const bandIsSparse = currentEntries.every((entry) => entry.items.length <= 1);
  const nextIsSparse = nextEntry.items.length <= 1;

  if (!bandIsSparse || !nextIsSparse) {
    return false;
  }

  const currentItems = currentEntries.flatMap((entry) => entry.items);
  const combinedItems = currentItems.length + nextEntry.items.length;
  const hasEmptyHour =
    currentEntries.some((entry) => entry.items.length === 0) ||
    nextEntry.items.length === 0;
  const hasFlowRelation = hasAnyFlowRelation(
    currentItems,
    nextEntry.items,
    graphMeta,
  );

  if (hasFlowRelation) {
    return combinedItems <= MAX_GROUPED_HOUR_ITEMS_WITH_FLOW;
  }

  if (hasEmptyHour) {
    return combinedItems <= MAX_GROUPED_HOUR_ITEMS + 1;
  }

  return combinedItems <= MAX_GROUPED_HOUR_ITEMS;
}

function buildBandLabel(entries: readonly RawBucketEntry[]) {
  if (entries.length === 1) {
    return entries[0].descriptor.label;
  }

  const firstEntry = entries[0];
  const lastEntry = entries[entries.length - 1];

  if (
    firstEntry.descriptor.kind === "hour" &&
    lastEntry.descriptor.kind === "hour" &&
    firstEntry.descriptor.startMinutes !== null &&
    lastEntry.descriptor.startMinutes !== null
  ) {
    const firstHour = Math.floor(firstEntry.descriptor.startMinutes / MINUTES_PER_HOUR);
    const lastHour = Math.floor(lastEntry.descriptor.startMinutes / MINUTES_PER_HOUR);

    return `${firstHour}h-${lastHour}h`;
  }

  return `${firstEntry.descriptor.label} - ${lastEntry.descriptor.label}`;
}

function buildMacroTimelineBands(
  rawEntries: readonly RawBucketEntry[],
  graphMeta: GraphLayoutMeta,
) {
  const bands: MacroTimelineBand[] = [];
  let currentEntries: RawBucketEntry[] = [];

  const flushBand = () => {
    if (currentEntries.length === 0) {
      return;
    }

    const firstEntry = currentEntries[0];
    const lastEntry = currentEntries[currentEntries.length - 1];

    bands.push({
      descriptor: {
        id: currentEntries.map((entry) => entry.descriptor.id).join("__"),
        label: buildBandLabel(currentEntries),
        kind: firstEntry.descriptor.kind as TimelineBucketKind,
        index: bands.length,
        startMinutes: firstEntry.descriptor.startMinutes,
        endMinutes: lastEntry.descriptor.endMinutes,
      },
      rawEntries: currentEntries,
      items: currentEntries.flatMap((entry) => entry.items),
      columnByNode: new Map(),
      columnCount: 1,
    });

    currentEntries = [];
  };

  rawEntries.forEach((entry) => {
    if (currentEntries.length === 0) {
      currentEntries = [entry];
      return;
    }

    if (canMergeIntoMacroBand(currentEntries, entry, graphMeta)) {
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

function hasColumnConflict(
  item: BucketItem,
  existing: BucketItem,
  graphMeta: GraphLayoutMeta,
) {
  const itemId = item.card.id;
  const existingId = existing.card.id;

  if (
    graphMeta.componentByNode.get(itemId) !==
    graphMeta.componentByNode.get(existingId)
  ) {
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

function buildMacroBandColumns(
  band: MacroTimelineBand,
  graphMeta: GraphLayoutMeta,
) {
  const itemIdsInBand = new Set(band.items.map((item) => item.card.id));
  const columns: BucketItem[][] = [];
  const columnByNode = new Map<string, number>();

  const sortedItems = [...band.items].sort((left, right) => {
    const topologyDelta =
      (graphMeta.topologicalIndexByNode.get(left.card.id) ?? 0) -
      (graphMeta.topologicalIndexByNode.get(right.card.id) ?? 0);

    if (topologyDelta !== 0) {
      return topologyDelta;
    }

    const minuteDelta = left.minutes - right.minutes;

    if (minuteDelta !== 0) {
      return minuteDelta;
    }

    return left.originalIndex - right.originalIndex;
  });

  sortedItems.forEach((item) => {
    const itemId = item.card.id;
    const inBandParents = (graphMeta.upstreamByNode.get(itemId) ?? []).filter(
      (parentId) => itemIdsInBand.has(parentId),
    );
    const earliestColumn =
      inBandParents.length > 0
        ? Math.max(
            ...inBandParents.map((parentId) => (columnByNode.get(parentId) ?? 0) + 1),
          )
        : 0;
    const relatedColumns = [
      ...inBandParents,
      ...(graphMeta.ancestorSetByNode.get(itemId) ?? new Set<string>()),
      ...(graphMeta.descendantSetByNode.get(itemId) ?? new Set<string>()),
      ...(graphMeta.parentSetByNode.get(itemId) ?? new Set<string>()),
      ...(graphMeta.childSetByNode.get(itemId) ?? new Set<string>()),
    ]
      .filter((relatedId) => itemIdsInBand.has(relatedId))
      .map((relatedId) => columnByNode.get(relatedId))
      .filter((columnIndex): columnIndex is number => columnIndex !== undefined);
    const preferredColumn =
      relatedColumns.length > 0
        ? Math.max(
            earliestColumn,
            Math.round(
              relatedColumns.reduce((sum, columnIndex) => sum + columnIndex, 0) /
                relatedColumns.length,
            ),
          )
        : earliestColumn;

    const candidateColumns = columns
      .map((column, columnIndex) => ({ column, columnIndex }))
      .filter(
        ({ column, columnIndex }) =>
          columnIndex >= earliestColumn &&
          !column.some((existing) => hasColumnConflict(item, existing, graphMeta)),
      )
      .sort((left, right) => {
        const leftDistance = Math.abs(left.columnIndex - preferredColumn);
        const rightDistance = Math.abs(right.columnIndex - preferredColumn);

        if (leftDistance !== rightDistance) {
          return leftDistance - rightDistance;
        }

        return left.column.length - right.column.length;
      });

    let chosenColumnIndex: number;

    if (candidateColumns.length > 0) {
      chosenColumnIndex = candidateColumns[0].columnIndex;
    } else {
      chosenColumnIndex = Math.max(earliestColumn, columns.length);

      while (columns.length <= chosenColumnIndex) {
        columns.push([]);
      }
    }

    columns[chosenColumnIndex].push(item);
    columnByNode.set(itemId, chosenColumnIndex);
  });

  band.columnByNode = columnByNode;
  band.columnCount = Math.max(columns.length, 1);
}

function getRequiredBandWidth(columnCount: number) {
  return (
    TIMELINE_BUCKET_SAFE_PADDING * 2 +
    columnCount * CARD_WIDTH +
    Math.max(columnCount - 1, 0) * TIMELINE_BUCKET_LANE_GAP
  );
}

function getMacroBandWidth(band: MacroTimelineBand) {
  const requiredWidth = getRequiredBandWidth(band.columnCount);
  const span = band.rawEntries.length;
  const itemCount = band.items.length;

  if (
    band.descriptor.kind !== "hour" ||
    span === 1 ||
    band.columnCount <= 1
  ) {
    return Math.max(requiredWidth, getSingleHourBaseWidth(itemCount));
  }

  const groupedBaseWidth = Math.min(
    TIMELINE_COLUMN_MAX_WIDTH +
      Math.max(span - 1, 0) * Math.round(TIMELINE_COLUMN_MAX_WIDTH * 0.35),
    TIMELINE_COLUMN_SINGLE_WIDTH +
      Math.max(span - 1, 0) * GROUPED_HOUR_SPAN_STEP +
      Math.max(itemCount - 1, 0) * GROUPED_HOUR_ITEM_STEP,
  );

  return Math.max(requiredWidth, groupedBaseWidth);
}

function getBandHorizontalGeometry(
  bucket: TimelineBucket,
  columnCount: number,
) {
  const safePadding = TIMELINE_BUCKET_SAFE_PADDING;

  if (columnCount <= 1) {
    return {
      contentLeft: bucket.x + safePadding,
      columnStep: CARD_WIDTH,
    };
  }

  const totalGapWidth =
    bucket.width - safePadding * 2 - columnCount * CARD_WIDTH;
  const columnGap = totalGapWidth / (columnCount - 1);

  return {
    contentLeft: bucket.x + safePadding,
    columnStep: CARD_WIDTH + columnGap,
  };
}

function buildTimelineBuckets(bands: readonly MacroTimelineBand[]) {
  let currentX = MAP_HORIZONTAL_PADDING;

  return bands.map((band) => {
    const width = getMacroBandWidth(band);
    const bucket: TimelineBucket = {
      ...band.descriptor,
      x: currentX,
      width,
    };

    currentX += width;

    return bucket;
  });
}

function buildBandPlacements(
  bands: readonly MacroTimelineBand[],
  graphMeta: GraphLayoutMeta,
) {
  const placements = new Map<string, BandPlacement>();
  const slotItems = new Map<
    string,
    { bandIndex: number; columnIndex: number; items: BucketItem[] }
  >();

  bands.forEach((band, bandIndex) => {
    band.items.forEach((item) => {
      const columnIndex = band.columnByNode.get(item.card.id) ?? 0;
      const slotKey = `${bandIndex}:${columnIndex}`;
      const slot =
        slotItems.get(slotKey) ??
        (() => {
          const nextSlot = {
            bandIndex,
            columnIndex,
            items: [] as BucketItem[],
          };
          slotItems.set(slotKey, nextSlot);
          return nextSlot;
        })();

      slot.items.push(item);
    });
  });

  const orderedSlots = [...slotItems.values()].sort((left, right) => {
    if (left.bandIndex !== right.bandIndex) {
      return left.bandIndex - right.bandIndex;
    }

    return left.columnIndex - right.columnIndex;
  });

  function getPlacedRelatedRows(nodeId: string) {
    const relatedIds = new Set<string>([
      ...(graphMeta.upstreamByNode.get(nodeId) ?? []),
      ...(graphMeta.parentSetByNode.get(nodeId) ?? new Set<string>()),
      ...(graphMeta.ancestorSetByNode.get(nodeId) ?? new Set<string>()),
      ...(graphMeta.childSetByNode.get(nodeId) ?? new Set<string>()),
      ...(graphMeta.downstreamByNode.get(nodeId) ?? []),
      ...(graphMeta.descendantSetByNode.get(nodeId) ?? new Set<string>()),
    ]);

    return [...relatedIds]
      .map((relatedId) => placements.get(relatedId)?.rowIndex)
      .filter((rowIndex): rowIndex is number => rowIndex !== undefined);
  }

  function getFlowPriority(item: BucketItem) {
    const nodeId = item.card.id;
    const upstreamCount = graphMeta.upstreamByNode.get(nodeId)?.length ?? 0;
    const downstreamCount = graphMeta.downstreamByNode.get(nodeId)?.length ?? 0;
    const ancestorCount = graphMeta.ancestorSetByNode.get(nodeId)?.size ?? 0;
    const descendantCount = graphMeta.descendantSetByNode.get(nodeId)?.size ?? 0;
    const componentSize = graphMeta.componentSizeByNode.get(nodeId) ?? 1;
    const relatedRows = getPlacedRelatedRows(nodeId);

    return {
      nodeId,
      relatedRows,
      anchorPresent: relatedRows.length > 0,
      anchorRow:
        relatedRows.length > 0
          ? relatedRows.reduce((sum, rowIndex) => sum + rowIndex, 0) /
            relatedRows.length
          : Number.POSITIVE_INFINITY,
      flowStrength:
        componentSize * 100 +
        descendantCount * 12 +
        ancestorCount * 8 +
        downstreamCount * 5 +
        upstreamCount * 4 +
        (upstreamCount > 0 && downstreamCount > 0 ? 12 : 0) +
        (upstreamCount > 0 || downstreamCount > 0 ? 6 : 0),
    };
  }

  orderedSlots.forEach((slot) => {
    const orderedItems = [...slot.items].sort((left, right) => {
      const leftPriority = getFlowPriority(left);
      const rightPriority = getFlowPriority(right);

      if (leftPriority.anchorPresent !== rightPriority.anchorPresent) {
        return leftPriority.anchorPresent ? -1 : 1;
      }

      if (
        leftPriority.anchorPresent &&
        rightPriority.anchorPresent &&
        leftPriority.anchorRow !== rightPriority.anchorRow
      ) {
        return leftPriority.anchorRow - rightPriority.anchorRow;
      }

      if (leftPriority.flowStrength !== rightPriority.flowStrength) {
        return rightPriority.flowStrength - leftPriority.flowStrength;
      }

      const topologyDelta =
        (graphMeta.topologicalIndexByNode.get(leftPriority.nodeId) ?? 0) -
        (graphMeta.topologicalIndexByNode.get(rightPriority.nodeId) ?? 0);

      if (topologyDelta !== 0) {
        return topologyDelta;
      }

      const minuteDelta = left.minutes - right.minutes;

      if (minuteDelta !== 0) {
        return minuteDelta;
      }

      return left.originalIndex - right.originalIndex;
    });

    orderedItems.forEach((item, rowIndex) => {
      placements.set(item.card.id, {
        bandIndex: slot.bandIndex,
        columnIndex: slot.columnIndex,
        rowIndex,
      });
    });
  });

  return placements;
}

export function buildRoutineMapLayout(
  cards: readonly RoutineCard[],
  links: readonly RoutineLink[],
  _columnWidth: number,
): RoutineMapLayout {
  const rawEntries = buildRawBucketEntries(cards);
  const graphMeta = buildGraphLayoutMeta(cards, links);
  const macroBands = buildMacroTimelineBands(rawEntries, graphMeta);

  macroBands.forEach((band) => {
    buildMacroBandColumns(band, graphMeta);
  });

  const buckets = buildTimelineBuckets(macroBands);
  const placements = buildBandPlacements(macroBands, graphMeta);
  const positionedCards: PositionedRoutineCard[] = [];
  let maxBottom = MAP_VERTICAL_PADDING + CARD_HEIGHT;

  macroBands.forEach((band, bandIndex) => {
    const bucket = buckets[bandIndex];
    const horizontalGeometry = getBandHorizontalGeometry(
      bucket,
      band.columnCount,
    );

    band.items.forEach((item) => {
      const placement = placements.get(item.card.id);

      if (!placement) {
        return;
      }

      const x =
        horizontalGeometry.contentLeft +
        placement.columnIndex * horizontalGeometry.columnStep;
      const y = MAP_VERTICAL_PADDING + placement.rowIndex * (CARD_HEIGHT + CARD_GAP);

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
