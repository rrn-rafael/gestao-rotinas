import type { TimelineBucket, ViewState } from "../model/types";
import {
  TIMELINE_HEADER_DIVIDER_HEIGHT,
  TIMELINE_LABEL_BAND_HEIGHT,
  TIMELINE_TOP_BAR_HEIGHT,
} from "../model/config";

type RoutineMapHeaderProps = {
  buckets: readonly TimelineBucket[];
  view: ViewState;
  currentBucketId: string | null;
  visibleCount: number;
  totalCount: number;
};

export function RoutineMapHeader({
  buckets,
  view,
  currentBucketId,
  visibleCount,
  totalCount,
}: RoutineMapHeaderProps) {
  const currentBucket =
    buckets.find((bucket) => bucket.id === currentBucketId) ?? null;

  return (
    <header
      className="relative z-20 h-full overflow-hidden bg-white/88 backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.78))]" />
      <div
        className="pointer-events-none absolute inset-x-0 left-0 top-0 z-[1] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,250,251,0.9))]"
        style={{ height: TIMELINE_TOP_BAR_HEIGHT }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 z-[1] bg-[linear-gradient(180deg,rgba(250,251,253,0.76),rgba(248,250,252,0.58))]"
        style={{
          top: TIMELINE_TOP_BAR_HEIGHT,
          height: TIMELINE_LABEL_BAND_HEIGHT,
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 bg-slate-500/70"
        style={{ height: 0.5 }}
      />

      <div className="absolute right-4 top-4 z-10 rounded-full border border-white/70 bg-white/86 px-3 py-1 text-[11px] font-medium text-slate-500 shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
        {visibleCount}/{totalCount} rotinas
      </div>

      <div
        className="absolute inset-x-0 overflow-hidden"
        style={{
          top: TIMELINE_TOP_BAR_HEIGHT,
          height: TIMELINE_LABEL_BAND_HEIGHT,
        }}
      >
        {buckets.map((bucket) => {
          const left = view.x + bucket.x * view.scale;
          const width = bucket.width * view.scale;
          const isCurrent = bucket.id === currentBucketId;

          return (
            <div
              key={bucket.id}
              className="absolute inset-y-0"
              style={{ left, width }}
            >
              <div
                className="absolute inset-y-0 left-0 bg-slate-300/80"
                style={{ width: 0.5 }}
              />
              <div
                className={`absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] ${
                  isCurrent
                    ? "font-bold tracking-[-0.02em] text-slate-950"
                    : "font-normal text-slate-600"
                }`}
              >
                {bucket.label}
              </div>
            </div>
          );
        })}

        {buckets.length > 0 ? (
          <div
            className="absolute inset-y-0 bg-slate-300/80"
            style={{
              left:
                view.x +
                (buckets[buckets.length - 1].x + buckets[buckets.length - 1].width) *
                  view.scale,
              width: 0.5,
            }}
          />
        ) : null}
      </div>

      {currentBucket ? (
        <div
          className="pointer-events-none absolute bottom-0 z-[3] bg-slate-900/85"
          style={{
            left: view.x + currentBucket.x * view.scale,
            width: currentBucket.width * view.scale,
            height: TIMELINE_HEADER_DIVIDER_HEIGHT,
          }}
        />
      ) : null}
    </header>
  );
}
