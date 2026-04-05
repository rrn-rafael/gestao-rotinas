import type { ReactNode } from "react";

type RoutineMapControlsProps = {
  onZoomOut: () => void;
  onZoomIn: () => void;
  onFitView: () => void;
};

function FitViewIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M3 6V3H6M10 3H13V6M13 10V13H10M6 13H3V10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MapControlButton({
  label,
  onClick,
  children,
  compact = false,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`routine-ui-button flex items-center justify-center gap-2 rounded-full text-[12px] font-medium text-slate-800 ${
        compact ? "h-11 min-w-[44px] px-4" : "h-11 px-4"
      }`}
      aria-label={label}
    >
      {children}
    </button>
  );
}

export function RoutineMapControls({
  onZoomOut,
  onZoomIn,
  onFitView,
}: RoutineMapControlsProps) {
  return (
    <div
      className="absolute bottom-5 right-5 z-30 flex flex-col items-end gap-2"
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      <div className="flex flex-col gap-2">
        <MapControlButton
          label="Aumentar zoom"
          onClick={onZoomIn}
          compact={true}
        >
          <span className="text-[20px] leading-none">+</span>
        </MapControlButton>

        <MapControlButton
          label="Diminuir zoom"
          onClick={onZoomOut}
          compact={true}
        >
          <span className="text-[20px] leading-none">-</span>
        </MapControlButton>
      </div>

      <MapControlButton label="Enquadrar mapa" onClick={onFitView}>
        <FitViewIcon />
        <span>Enquadrar</span>
      </MapControlButton>
    </div>
  );
}
