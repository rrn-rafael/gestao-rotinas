type RoutineMapHeaderProps = {
  gridMode: boolean;
  visibleCount: number;
  totalCount: number;
};

export function RoutineMapHeader({
  gridMode,
  visibleCount,
  totalCount,
}: RoutineMapHeaderProps) {
  return (
    <header className="col-span-2 flex h-full items-center justify-between border-b border-white/65 bg-white/76 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Rotina operacional
          </div>
          <div className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-slate-950">
            Mapa causal do pipeline
          </div>
        </div>
        <div className="hidden h-10 w-px bg-slate-200 lg:block" />
        <div className="hidden text-[12px] text-slate-500 lg:block">
          {gridMode
            ? "Filtros ativos reorganizam o conteudo em grade para leitura rapida."
            : "Segure Space e arraste para navegar pelo fluxograma."}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {gridMode ? "Modo grade" : "Modo fluxo"}
        </div>
        <div className="rounded-full bg-slate-950 px-3 py-1.5 text-[12px] font-semibold text-white">
          {visibleCount}/{totalCount} rotinas
        </div>
      </div>
    </header>
  );
}
