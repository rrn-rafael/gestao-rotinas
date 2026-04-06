import type { TimelineBucket, ViewState } from "../model/types";

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
  return (
    <header
      className="relative z-20 h-full overflow-hidden border-b border-slate-300/85 bg-white/88 backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.78))]" />

      <div className="absolute right-4 top-4 z-10 rounded-full border border-white/70 bg-white/86 px-3 py-1 text-[11px] font-medium text-slate-500 shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
        {visibleCount}/{totalCount} rotinas
      </div>

      <div className="absolute inset-0 overflow-hidden">
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
              {isCurrent ? (
                <div className="absolute inset-y-0 inset-x-0 bg-slate-950/[0.05]" />
              ) : null}
              <div className="absolute inset-y-0 left-0 w-px bg-slate-200/85" />
              <div
                className={`absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] font-medium ${
                  isCurrent ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {bucket.label}
              </div>
            </div>
          );
        })}

        {buckets.length > 0 ? (
          <div
            className="absolute inset-y-0 w-px bg-slate-200/85"
            style={{
              left:
                view.x +
                (buckets[buckets.length - 1].x + buckets[buckets.length - 1].width) *
                  view.scale,
            }}
          />
        ) : null}
      </div>
    </header>
  );
}
