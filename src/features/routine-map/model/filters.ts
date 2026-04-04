import type {
  CardIcon,
  CardStatus,
  RoutineCard,
  RoutineFilters,
  RoutineKind,
} from "./types";

export const DEFAULT_ROUTINE_FILTERS: RoutineFilters = {
  owners: [],
  tools: [],
  kinds: [],
  statuses: [],
};

export type RoutineFilterOptions = {
  owners: string[];
  tools: string[];
  kinds: RoutineKind[];
  statuses: CardStatus[];
};

export function getRoutineKind(icon: CardIcon): RoutineKind {
  if (icon === "cube") {
    return "Cubos";
  }

  if (icon === "pulse") {
    return "Sinais";
  }

  return "Tabelas";
}

export function buildRoutineFilterOptions(
  cards: readonly RoutineCard[],
): RoutineFilterOptions {
  const owners = new Set<string>();
  const tools = new Set<string>();
  const kinds = new Set<RoutineKind>();
  const statuses = new Set<CardStatus>();

  cards.forEach((card) => {
    owners.add(card.owner);
    tools.add(card.tool);
    kinds.add(getRoutineKind(card.icon));
    statuses.add(card.status);
  });

  return {
    owners: [...owners].sort((left, right) => left.localeCompare(right)),
    tools: [...tools].sort((left, right) => left.localeCompare(right)),
    kinds: [...kinds].sort((left, right) => left.localeCompare(right)),
    statuses: [...statuses].sort((left, right) => left.localeCompare(right)),
  };
}

export function getActiveRoutineFilterCount(filters: RoutineFilters) {
  return (
    filters.owners.length +
    filters.tools.length +
    filters.kinds.length +
    filters.statuses.length
  );
}

export function hasActiveFilters(filters: RoutineFilters) {
  return getActiveRoutineFilterCount(filters) > 0;
}

export function filterRoutineCards(
  cards: readonly RoutineCard[],
  filters: RoutineFilters,
) {
  return cards.filter((card) => {
    if (filters.owners.length > 0 && !filters.owners.includes(card.owner)) {
      return false;
    }

    if (filters.tools.length > 0 && !filters.tools.includes(card.tool)) {
      return false;
    }

    if (
      filters.kinds.length > 0 &&
      !filters.kinds.includes(getRoutineKind(card.icon))
    ) {
      return false;
    }

    if (filters.statuses.length > 0 && !filters.statuses.includes(card.status)) {
      return false;
    }

    return true;
  });
}
