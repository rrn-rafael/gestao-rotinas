import { getCardOpacity, getCardRelation } from "../model/graph";
import type { FocusSets, RoutineCard } from "../model/types";
import { RoutineCardNode } from "./RoutineCardNode";

type RoutineCardGridProps = {
  cards: readonly RoutineCard[];
  selectedId: string | null;
  focusSets: FocusSets;
  onToggleSelect: (cardId: string) => void;
};

export function RoutineCardGrid({
  cards,
  selectedId,
  focusSets,
  onToggleSelect,
}: RoutineCardGridProps) {
  if (cards.length === 0) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white/60 px-6 text-center backdrop-blur-xl">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Sem resultados
          </div>
          <div className="mt-2 text-[18px] font-semibold tracking-[-0.03em] text-slate-900">
            Nenhuma rotina corresponde aos filtros atuais
          </div>
          <div className="mt-2 text-[13px] text-slate-500">
            Ajuste os filtros para voltar a visualizar o pipeline.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
      {cards.map((card) => {
        const relation = getCardRelation(card.id, selectedId, focusSets);
        const opacity = getCardOpacity(
          card.status,
          relation,
          selectedId !== null,
        );

        return (
          <RoutineCardNode
            key={card.id}
            item={{ ...card, x: 0, y: 0 }}
            relation={relation}
            opacity={opacity}
            interactionLocked={false}
            layoutMode="grid"
            onToggleSelect={onToggleSelect}
          />
        );
      })}
    </div>
  );
}
