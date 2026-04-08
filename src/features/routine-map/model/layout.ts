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
  RoutineMapLayout,
  TimelineBucket,
} from "./types";

const MINUTES_PER_HOUR = 60;
const HALF_HOUR_MINUTES = 30;
const FIRST_TIMELINE_MINUTE = TIMELINE_START_HOUR * MINUTES_PER_HOUR;
const LAST_TIMELINE_MINUTE =
  (TIMELINE_END_HOUR + 1) * MINUTES_PER_HOUR - 1;

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

type DenseLanePlan = {
  laneCount: number;
  getLaneIndex: (item: BucketItem, laneRows: number[]) => number;
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

function buildDenseLanePlan(entry: BucketEntry): DenseLanePlan {
  if (entry.descriptor.kind === "hour" && entry.descriptor.startMinutes !== null) {
    const splitMinute = entry.descriptor.startMinutes + HALF_HOUR_MINUTES;
    const firstHalfCount = entry.items.filter((item) => item.minutes < splitMinute).length;
    const secondHalfCount = entry.items.length - firstHalfCount;
    const occupiedHalfCount =
      Number(firstHalfCount > 0) + Number(secondHalfCount > 0);

    if (entry.items.length >= 4 && occupiedHalfCount === 2) {
      return {
        laneCount: 2,
        getLaneIndex: (item) => (item.minutes < splitMinute ? 0 : 1),
      };
    }
  }

  if (entry.descriptor.kind !== "hour" && entry.items.length >= 6) {
    return {
      laneCount: 2,
      getLaneIndex: (_item, laneRows) =>
        laneRows[0] <= laneRows[1] ? 0 : 1,
    };
  }

  return {
    laneCount: 1,
    getLaneIndex: () => 0,
  };
}

function getAdaptiveBucketWidth(entry: BucketEntry, lanePlan: DenseLanePlan) {
  const count = entry.items.length;
  const laneRequirement =
    TIMELINE_BUCKET_SAFE_PADDING * 2 +
    lanePlan.laneCount * CARD_WIDTH +
    Math.max(lanePlan.laneCount - 1, 0) * TIMELINE_BUCKET_LANE_GAP;

  if (count === 0) {
    return TIMELINE_COLUMN_EMPTY_WIDTH;
  }

  if (count === 1) {
    return Math.max(TIMELINE_COLUMN_SINGLE_WIDTH, laneRequirement);
  }

  const densityWidth = Math.min(
    TIMELINE_COLUMN_MAX_WIDTH,
    TIMELINE_COLUMN_MIN_WIDTH + Math.max(count - 2, 0) * TIMELINE_COLUMN_DENSITY_STEP,
  );

  return Math.max(densityWidth, laneRequirement);
}

function buildTimelineBuckets(entries: readonly BucketEntry[]) {
  let currentX = MAP_HORIZONTAL_PADDING;

  return entries.map((entry) => {
    const lanePlan = buildDenseLanePlan(entry);
    const width = getAdaptiveBucketWidth(entry, lanePlan);
    const bucket: TimelineBucket = {
      ...entry.descriptor,
      x: currentX,
      width,
    };

    currentX += width;

    return {
      bucket,
      items: entry.items,
      lanePlan,
    };
  });
}

function getLaneWidth(bucketWidth: number, laneCount: number) {
  const totalGapWidth = Math.max(laneCount - 1, 0) * TIMELINE_BUCKET_LANE_GAP;
  const innerWidth = Math.max(
    bucketWidth - TIMELINE_BUCKET_SAFE_PADDING * 2 - totalGapWidth,
    CARD_WIDTH,
  );

  return innerWidth / laneCount;
}

export function buildRoutineMapLayout(
  cards: readonly RoutineCard[],
  _columnWidth: number,
): RoutineMapLayout {
  const entries = buildBucketEntries(cards);
  const bucketLayouts = buildTimelineBuckets(entries);
  const positionedCards: PositionedRoutineCard[] = [];
  let maxBottom = MAP_VERTICAL_PADDING + CARD_HEIGHT;

  bucketLayouts.forEach((entry) => {
    const laneRows = Array.from({ length: entry.lanePlan.laneCount }, () => 0);
    const laneWidth = getLaneWidth(entry.bucket.width, entry.lanePlan.laneCount);

    entry.items.forEach((item) => {
      const laneIndex = entry.lanePlan.getLaneIndex(item, laneRows);
      const rowIndex = laneRows[laneIndex];

      laneRows[laneIndex] += 1;

      const x =
        entry.bucket.x +
        TIMELINE_BUCKET_SAFE_PADDING +
        laneIndex * (laneWidth + TIMELINE_BUCKET_LANE_GAP) +
        (laneWidth - CARD_WIDTH) / 2;
      const y = MAP_VERTICAL_PADDING + rowIndex * (CARD_HEIGHT + CARD_GAP);

      positionedCards.push({
        ...item.card,
        x,
        y,
      });

      maxBottom = Math.max(maxBottom, y + CARD_HEIGHT);
    });
  });

  const lastBucket = bucketLayouts[bucketLayouts.length - 1];
  const totalWidth =
    (lastBucket ? lastBucket.bucket.x + lastBucket.bucket.width : MAP_HORIZONTAL_PADDING) +
    MAP_HORIZONTAL_PADDING;

  return {
    cards: positionedCards,
    buckets: bucketLayouts.map((entry) => entry.bucket),
    width: totalWidth,
    height: maxBottom + MAP_VERTICAL_PADDING,
  };
}
