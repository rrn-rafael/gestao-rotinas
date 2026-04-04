import { isRunningStatus } from "./presentation";
import type {
  CardIcon,
  RoutineCard,
  RoutineFilters,
  RoutineKind,
} from "./types";

export const DEFAULT_ROUTINE_FILTERS: RoutineFilters = {
  owner: "",
  tool: "",
  kind: "",
  status: "",
  onlyExecuting: false,
};

export type RoutineFilterOptions = {
  owners: string[];
  tools: string[];
  kinds: RoutineKind[];
  statuses: string[];
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
  const statuses = new Set<string>();

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

export function hasActiveFilters(filters: RoutineFilters) {
  return Boolean(
    filters.owner ||
      filters.tool ||
      filters.kind ||
      filters.status ||
      filters.onlyExecuting,
  );
}

export function filterRoutineCards(
  cards: readonly RoutineCard[],
  filters: RoutineFilters,
) {
  return cards.filter((card) => {
    if (filters.onlyExecuting && !isRunningStatus(card.status)) {
      return false;
    }

    if (filters.owner && card.owner !== filters.owner) {
      return false;
    }

    if (filters.tool && card.tool !== filters.tool) {
      return false;
    }

    if (filters.kind && getRoutineKind(card.icon) !== filters.kind) {
      return false;
    }

    if (filters.status && card.status !== filters.status) {
      return false;
    }

    return true;
  });
}
