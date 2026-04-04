type RoutineMapControlsProps = {
  scale: number;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onReset: () => void;
};

export function RoutineMapControls({
  scale,
  onZoomOut,
  onZoomIn,
  onReset,
}: RoutineMapControlsProps) {
  return (
    <div
      className="absolute right-6 top-6 z-30 flex items-center gap-2 rounded-[20px] border border-white/70 bg-white/78 p-2 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl"
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      <button
        type="button"
        onClick={onZoomOut}
        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-lg font-medium text-neutral-700 transition hover:border-neutral-300 hover:text-neutral-950"
        aria-label="Diminuir zoom"
      >
        -
      </button>
      <div className="min-w-[70px] text-center text-[12px] font-semibold text-neutral-500">
        {Math.round(scale * 100)}%
      </div>
      <button
        type="button"
        onClick={onZoomIn}
        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-lg font-medium text-neutral-700 transition hover:border-neutral-300 hover:text-neutral-950"
        aria-label="Aumentar zoom"
      >
        +
      </button>
      <button
        type="button"
        onClick={onReset}
        className="rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500 transition hover:border-neutral-300 hover:text-neutral-900"
      >
        Reset
      </button>
    </div>
  );
}
