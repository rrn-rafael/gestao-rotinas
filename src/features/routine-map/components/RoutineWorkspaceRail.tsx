import type { ReactNode } from "react";

type RoutineWorkspaceRailProps = {
  activeFilterCount: number;
};

function RailIcon({
  children,
  active = false,
  badge,
}: {
  children: ReactNode;
  active?: boolean;
  badge?: number;
}) {
  return (
    <button
      type="button"
      className={`relative flex h-11 w-11 items-center justify-center rounded-[16px] border transition ${
        active
          ? "border-[#D7E0FF] bg-[#F2F5FF] text-[#4C64FF] shadow-[0_8px_20px_rgba(76,100,255,0.12)]"
          : "border-transparent bg-transparent text-slate-400 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-600"
      }`}
      aria-hidden="true"
      tabIndex={-1}
    >
      {badge && badge > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#4C64FF] px-1.5 text-[10px] font-semibold text-white">
          {badge}
        </span>
      ) : null}
      {children}
    </button>
  );
}

export function RoutineWorkspaceRail({
  activeFilterCount,
}: RoutineWorkspaceRailProps) {
  return (
    <aside className="flex w-[60px] shrink-0 flex-col items-center justify-between border-r border-slate-200/80 bg-[linear-gradient(180deg,#FAFBFF_0%,#F7F9FD_100%)] py-6">
      <div className="flex flex-col items-center gap-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-[14px] font-semibold tracking-[0.08em] text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
          RO
        </div>

        <div className="flex flex-col items-center gap-3">
          <RailIcon active badge={activeFilterCount}>
            <svg
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
            >
              <path
                d="M3 4.5H13M5 8H13M7 11.5H13"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </RailIcon>

          <RailIcon>
            <svg
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
            >
              <path
                d="M5.25 4.25 11.75 8 5.25 11.75V4.25Z"
                fill="currentColor"
              />
            </svg>
          </RailIcon>

          <RailIcon>
            <svg
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
            >
              <path
                d="M4.5 2.75V13.25M11.5 2.75V13.25M2.75 8H13.25"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </RailIcon>
        </div>
      </div>

      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        aria-hidden="true"
        tabIndex={-1}
      >
        ?
      </button>
    </aside>
  );
}
