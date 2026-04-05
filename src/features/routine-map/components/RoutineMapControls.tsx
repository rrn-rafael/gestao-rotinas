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
  bordered = true,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  bordered?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center bg-white text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 ${
        bordered ? "border-b border-slate-200" : ""
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
      className="absolute bottom-5 right-5 z-30 overflow-hidden rounded-[18px] border border-slate-300 bg-white shadow-[0_3px_8px_rgba(15,23,42,0.16),0_1px_2px_rgba(15,23,42,0.08)]"
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      <div className="flex flex-col">
        <MapControlButton label="Aumentar zoom" onClick={onZoomIn}>
          <span className="text-[20px] leading-none">+</span>
        </MapControlButton>

        <MapControlButton label="Diminuir zoom" onClick={onZoomOut}>
          <span className="text-[20px] leading-none">-</span>
        </MapControlButton>

        <MapControlButton
          label="Enquadrar mapa"
          onClick={onFitView}
          bordered={false}
        >
          <FitViewIcon />
        </MapControlButton>
      </div>
    </div>
  );
}
