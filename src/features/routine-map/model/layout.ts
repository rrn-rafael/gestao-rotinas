import {
  CARD_GAP,
  CARD_HEIGHT,
  CARD_WIDTH,
  MAP_HORIZONTAL_PADDING,
  MAP_VERTICAL_PADDING,
  TIMELINE_END_HOUR,
  TIMELINE_START_HOUR,
} from "./config";
import type { PositionedRoutineCard, RoutineCard, RoutineMapLayout, TimelineBucket } from "./types";

const MINUTES_PER_HOUR = 60;
const FIRST_TIMELINE_MINUTE = TIMELINE_START_HOUR * MINUTES_PER_HOUR;
const LAST_TIMELINE_MINUTE =
  (TIMELINE_END_HOUR + 1) * MINUTES_PER_HOUR - 1;
const HOURLY_BUCKET_COUNT = TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1;
const TOTAL_BUCKET_COUNT = HOURLY_BUCKET_COUNT + 2;

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
  return parseTimelineMinutes(card.forecast ?? card.completedAt) ?? FIRST_TIMELINE_MINUTE;
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

export function buildTimelineBuckets(columnWidth: number): TimelineBucket[] {
  const buckets: TimelineBucket[] = [
    {
      id: "before",
      label: "Antes das 8h",
      kind: "before",
      index: 0,
      x: MAP_HORIZONTAL_PADDING,
      width: columnWidth,
      startMinutes: null,
      endMinutes: FIRST_TIMELINE_MINUTE - 1,
    },
  ];

  for (let hour = TIMELINE_START_HOUR; hour <= TIMELINE_END_HOUR; hour += 1) {
    buckets.push({
      id: `hour-${hour}`,
      label: `${hour}h`,
      kind: "hour",
      index: buckets.length,
      x: MAP_HORIZONTAL_PADDING + buckets.length * columnWidth,
      width: columnWidth,
      startMinutes: hour * MINUTES_PER_HOUR,
      endMinutes: hour * MINUTES_PER_HOUR + MINUTES_PER_HOUR - 1,
    });
  }

  buckets.push({
    id: "after",
    label: "Depois das 16h",
    kind: "after",
    index: buckets.length,
    x: MAP_HORIZONTAL_PADDING + buckets.length * columnWidth,
    width: columnWidth,
    startMinutes: LAST_TIMELINE_MINUTE + 1,
    endMinutes: null,
  });

  return buckets;
}

export function buildRoutineMapLayout(
  cards: readonly RoutineCard[],
  columnWidth: number,
): RoutineMapLayout {
  const buckets = buildTimelineBuckets(columnWidth);
  const bucketEntries = buckets.map((bucket) => ({
    bucket,
    items: [] as { card: RoutineCard; minutes: number; originalIndex: number }[],
  }));

  cards.forEach((card, originalIndex) => {
    const minutes = getRoutineCardTimelineMinutes(card);
    const bucketId = getTimelineBucketIdForMinutes(minutes);
    const bucketEntry = bucketEntries.find((entry) => entry.bucket.id === bucketId);

    if (!bucketEntry) {
      return;
    }

    bucketEntry.items.push({ card, minutes, originalIndex });
  });

  const positionedCards: PositionedRoutineCard[] = [];
  let maxCardsInBucket = 0;

  bucketEntries.forEach((entry) => {
    entry.items.sort((left, right) => {
      const minuteDelta = left.minutes - right.minutes;

      if (minuteDelta !== 0) {
        return minuteDelta;
      }

      return left.originalIndex - right.originalIndex;
    });

    maxCardsInBucket = Math.max(maxCardsInBucket, entry.items.length);

    entry.items.forEach((entryItem, rowIndex) => {
      positionedCards.push({
        ...entryItem.card,
        x: entry.bucket.x + (entry.bucket.width - CARD_WIDTH) / 2,
        y:
          MAP_VERTICAL_PADDING +
          rowIndex * (CARD_HEIGHT + CARD_GAP),
      });
    });
  });

  const contentHeight =
    Math.max(maxCardsInBucket, 1) * CARD_HEIGHT +
    Math.max(maxCardsInBucket - 1, 0) * CARD_GAP;

  return {
    cards: positionedCards,
    buckets,
    width: MAP_HORIZONTAL_PADDING * 2 + TOTAL_BUCKET_COUNT * columnWidth,
    height: contentHeight + MAP_VERTICAL_PADDING * 2,
  };
}
