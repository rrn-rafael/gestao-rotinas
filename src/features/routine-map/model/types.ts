export type CardStatus =
  | "Concluído"
  | "Executando"
  | "Aguardando"
  | "Em atraso";
export type PresenceStatus = "online" | "ausente" | "offline";
export type CardIcon = "table" | "cube" | "pulse";
export type CardColor = "green" | "amber" | "blue" | "gray";
export type RoutineKind = "Tabelas" | "Cubos" | "Sinais";

export type RoutineCard = {
  id: string;
  tool: string;
  icon: CardIcon;
  name: string;
  owner: string;
  ownerPresence: PresenceStatus;
  status: CardStatus;
  detail: string;
  completedAt?: string;
  forecast?: string;
  variance?: string;
  varianceTone?: "positive" | "negative";
  color: CardColor;
};

export type PositionedRoutineCard = RoutineCard & {
  x: number;
  y: number;
};

export type TimelineBucketKind = "before" | "hour" | "after";

export type TimelineBucket = {
  id: string;
  label: string;
  kind: TimelineBucketKind;
  index: number;
  x: number;
  width: number;
  startMinutes: number | null;
  endMinutes: number | null;
};

export type RoutineLink = {
  from: string;
  to: string;
};

export type CardRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ViewState = {
  x: number;
  y: number;
  scale: number;
};

export type CardRelation =
  | "idle"
  | "selected"
  | "upstream"
  | "downstream"
  | "muted";

export type EdgeRelation = "idle" | "upstream" | "downstream" | "muted";

export type FocusSets = {
  upstream: Set<string>;
  downstream: Set<string>;
};

export type RoutineMapLayout = {
  cards: PositionedRoutineCard[];
  buckets: TimelineBucket[];
  width: number;
  height: number;
};

export type RoutineFilters = {
  owners: string[];
  tools: string[];
  kinds: RoutineKind[];
  statuses: CardStatus[];
};
