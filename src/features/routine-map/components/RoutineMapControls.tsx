import type { ReactNode } from "react";

type RoutineMapControlsProps = {
  onZoomOut: () => void;
  onZoomIn: () => void;
  onReset: () => void;
};

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
  onReset,
}: RoutineMapControlsProps) {
  return (
    <div
      className="absolute bottom-5 right-5 z-30 overflow-hidden rounded-[18px] border border-slate-300 bg-white"
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
          label="Resetar visualizacao"
          onClick={onReset}
          bordered={false}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              d="M8 2.5V5.5M8 10.5V13.5M2.5 8H5.5M10.5 8H13.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <circle
              cx="8"
              cy="8"
              r="2.25"
              stroke="currentColor"
              strokeWidth="1.4"
            />
          </svg>
        </MapControlButton>
      </div>
    </div>
  );
}
