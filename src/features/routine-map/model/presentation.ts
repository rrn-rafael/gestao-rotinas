import type { CardColor, CardStatus, PresenceStatus } from "./types";

export function isSecondaryStatus(status: CardStatus) {
  return status === "Concluído" || status === "Aguardando";
}

export function isRunningStatus(status: CardStatus) {
  return status === "Executando" || status === "Em atraso";
}

export function getStatusAccent(status: CardStatus, color?: CardColor) {
  if (status === "Executando") {
    return "bg-emerald-500";
  }

  if (status === "Em atraso") {
    return "bg-amber-500";
  }

  if (status === "Aguardando") {
    return "bg-neutral-400";
  }

  if (color === "amber") {
    return "bg-amber-500";
  }

  if (color === "gray") {
    return "bg-neutral-400";
  }

  if (color === "blue") {
    return "bg-sky-500";
  }

  return "bg-emerald-500";
}

export function getStatusRunnerColor(status: CardStatus) {
  if (status === "Em atraso") {
    return "245 158 11";
  }

  return "16 185 129";
}

export function getPresenceDot(presence: PresenceStatus) {
  if (presence === "online") {
    return "bg-emerald-500";
  }

  if (presence === "ausente") {
    return "bg-amber-500";
  }

  return "bg-neutral-400";
}

export function getVarianceClass(tone?: "positive" | "negative") {
  if (tone === "positive") {
    return "text-emerald-600";
  }

  if (tone === "negative") {
    return "text-amber-600";
  }

  return "text-neutral-400";
}
