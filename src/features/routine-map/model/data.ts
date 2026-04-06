import type {
  CardColor,
  CardIcon,
  CardStatus,
  PresenceStatus,
  RoutineCard,
  RoutineLink,
} from "./types";

type RoutineTool = "SAS" | "SQL" | "MSTR";
type ScenarioState = "completed" | "running" | "late" | "waiting";

type RawRoutine = {
  sourceId: number;
  id: string;
  name: string;
  prerequisiteId: number | null;
  owner: string;
  averageDuration: string;
  startTime: string;
  tool: RoutineTool;
  scenarioState: ScenarioState;
  targetTime: string;
  note?: string;
};

type BuiltRoutineEntry = {
  raw: RawRoutine;
  status: CardStatus;
  icon: CardIcon;
  color: CardColor;
  ownerPresence: PresenceStatus;
  actualStartMinutes: number;
  actualEndMinutes: number;
  plannedEndMinutes: number;
  card: RoutineCard;
};

const STATUS_COMPLETED = "Concluído" as const;
const STATUS_RUNNING = "Executando" as const;
const STATUS_WAITING = "Aguardando" as const;
const STATUS_LATE = "Em atraso" as const;
const OPERATION_SNAPSHOT_TIME = "15:24";
const HANDOFF_MINUTES = 6;

export const ROUTINE_DATA_SEED = "real-routines-image-v1";

const rawRoutines: RawRoutine[] = [
  {
    sourceId: 1,
    id: "mapa-producao",
    name: "Mapa de Produção",
    prerequisiteId: null,
    owner: "Isaque Pimentel",
    averageDuration: "03:00:00",
    startTime: "06:30:00",
    tool: "SAS",
    scenarioState: "completed",
    targetTime: "09:41",
    note: "painel consolidado da abertura operacional",
  },
  {
    sourceId: 2,
    id: "contratos",
    name: "Contratos",
    prerequisiteId: null,
    owner: "Michael Borges",
    averageDuration: "00:05:00",
    startTime: "06:30:00",
    tool: "SAS",
    scenarioState: "completed",
    targetTime: "06:37",
  },
  {
    sourceId: 3,
    id: "atualizacao-base-gsre-salvados",
    name: "Atualização Base GSRE Salvados",
    prerequisiteId: null,
    owner: "Michael Borges",
    averageDuration: "00:05:00",
    startTime: "06:30:00",
    tool: "SAS",
    scenarioState: "completed",
    targetTime: "06:41",
  },
  {
    sourceId: 4,
    id: "atualizacao-rotina-cac",
    name: "Atualização Rotina CAC",
    prerequisiteId: null,
    owner: "Michael Borges",
    averageDuration: "00:05:00",
    startTime: "06:30:00",
    tool: "SAS",
    scenarioState: "completed",
    targetTime: "06:38",
  },
  {
    sourceId: 5,
    id: "atualizacao-rotina-sap-despesas",
    name: "Atualização Rotina SAP Diária - Despesas",
    prerequisiteId: null,
    owner: "Michael Borges",
    averageDuration: "00:15:00",
    startTime: "06:30:00",
    tool: "SAS",
    scenarioState: "completed",
    targetTime: "06:54",
  },
  {
    sourceId: 6,
    id: "fato-producao",
    name: "Fato de Produção",
    prerequisiteId: null,
    owner: "Monica Peixoto",
    averageDuration: "00:15:00",
    startTime: "06:30:00",
    tool: "SAS",
    scenarioState: "completed",
    targetTime: "07:02",
  },
  {
    sourceId: 7,
    id: "nasa-qar",
    name: "NASA_QAR",
    prerequisiteId: null,
    owner: "Tommy Cheng",
    averageDuration: "00:30:00",
    startTime: "06:30:00",
    tool: "SAS",
    scenarioState: "completed",
    targetTime: "07:12",
  },
  {
    sourceId: 8,
    id: "sinistro-por-cobertura",
    name: "Sinistro por Cobertura",
    prerequisiteId: null,
    owner: "Tommy Cheng",
    averageDuration: "00:10:00",
    startTime: "06:30:00",
    tool: "SAS",
    scenarioState: "completed",
    targetTime: "06:46",
  },
  {
    sourceId: 9,
    id: "daec",
    name: "DAEC",
    prerequisiteId: null,
    owner: "Tommy Cheng",
    averageDuration: "00:10:00",
    startTime: "06:30:00",
    tool: "SAS",
    scenarioState: "completed",
    targetTime: "06:48",
  },
  {
    sourceId: 10,
    id: "bol",
    name: "BOL",
    prerequisiteId: null,
    owner: "Tuany Lima",
    averageDuration: "00:20:00",
    startTime: "06:30:00",
    tool: "SAS",
    scenarioState: "completed",
    targetTime: "07:01",
  },
  {
    sourceId: 11,
    id: "crivo",
    name: "CRIVO",
    prerequisiteId: null,
    owner: "Tuany Lima",
    averageDuration: "00:50:00",
    startTime: "06:30:00",
    tool: "SAS",
    scenarioState: "completed",
    targetTime: "07:34",
  },
  {
    sourceId: 12,
    id: "processamento-extracao-smb-diaria",
    name: "Processamento Extração SMB Diária",
    prerequisiteId: null,
    owner: "Isaque Pimentel",
    averageDuration: "00:30:00",
    startTime: "06:30:00",
    tool: "SAS",
    scenarioState: "completed",
    targetTime: "07:08",
  },
  {
    sourceId: 13,
    id: "nasa-diario",
    name: "NASA_Diário",
    prerequisiteId: null,
    owner: "Tuany Lima",
    averageDuration: "00:30:00",
    startTime: "06:30:00",
    tool: "SAS",
    scenarioState: "completed",
    targetTime: "07:15",
  },
  {
    sourceId: 14,
    id: "fato-propostas-pendentes-parte-1",
    name: "Fato Propostas Pendentes (parte 1)",
    prerequisiteId: 13,
    owner: "Isaque Pimentel",
    averageDuration: "01:00:00",
    startTime: "07:00:00",
    tool: "SQL",
    scenarioState: "completed",
    targetTime: "08:34",
  },
  {
    sourceId: 15,
    id: "gsin-diario",
    name: "GSIN Diário",
    prerequisiteId: null,
    owner: "Tuany Lima",
    averageDuration: "00:15:00",
    startTime: "07:00:00",
    tool: "SAS",
    scenarioState: "completed",
    targetTime: "07:18",
  },
  {
    sourceId: 16,
    id: "gsin-pago-e-avisado",
    name: "GSIN Pago e Avisado",
    prerequisiteId: 15,
    owner: "Tuany Lima",
    averageDuration: "00:15:00",
    startTime: "07:00:00",
    tool: "SAS",
    scenarioState: "completed",
    targetTime: "07:41",
  },
  {
    sourceId: 17,
    id: "lista-pt",
    name: "LISTA PT",
    prerequisiteId: 16,
    owner: "Tuany Lima",
    averageDuration: "00:15:00",
    startTime: "07:30:00",
    tool: "SAS",
    scenarioState: "completed",
    targetTime: "08:03",
  },
  {
    sourceId: 18,
    id: "base-cancelamento",
    name: "Base de Cancelamento",
    prerequisiteId: 17,
    owner: "Tuany Lima",
    averageDuration: "00:40:00",
    startTime: "08:00:00",
    tool: "SQL",
    scenarioState: "completed",
    targetTime: "08:57",
  },
  {
    sourceId: 19,
    id: "apolc",
    name: "APOLC",
    prerequisiteId: 18,
    owner: "Tuany Lima",
    averageDuration: "01:30:00",
    startTime: "07:00:00",
    tool: "SQL",
    scenarioState: "completed",
    targetTime: "10:36",
  },
  {
    sourceId: 20,
    id: "fato-propostas-pendentes-parte-2",
    name: "Fato Propostas Pendentes (parte 2)",
    prerequisiteId: 19,
    owner: "Isaque Pimentel",
    averageDuration: "02:00:00",
    startTime: "07:00:00",
    tool: "SQL",
    scenarioState: "completed",
    targetTime: "13:34",
    note: "segunda etapa liberada após a cadeia do APOLC",
  },
  {
    sourceId: 21,
    id: "carga-proposta-alerta-auto",
    name: "CARGA PROPOSTA ALERTA AUTO",
    prerequisiteId: 13,
    owner: "Isaque Pimentel",
    averageDuration: "03:00:00",
    startTime: "07:00:00",
    tool: "SQL",
    scenarioState: "completed",
    targetTime: "12:06",
    note: "reconciliação de alerta auto concluída após reprocesso parcial",
  },
  {
    sourceId: 22,
    id: "cubo-fato-emissao",
    name: "CUBO/FATO EMISSÃO",
    prerequisiteId: 19,
    owner: "Tuany Lima",
    averageDuration: "04:00:00",
    startTime: "07:00:00",
    tool: "MSTR",
    scenarioState: "late",
    targetTime: "15:34",
    note: "refresh MSTR pressionado pela fila final do APOLC",
  },
  {
    sourceId: 23,
    id: "fato-sinistro-auto",
    name: "Fato Sinistro Auto",
    prerequisiteId: 19,
    owner: "Isaque Pimentel",
    averageDuration: "06:00:00",
    startTime: "07:00:00",
    tool: "SQL",
    scenarioState: "late",
    targetTime: "16:54",
    note: "cadeia de sinistro auto acumulou reprocessamento na consolidação",
  },
  {
    sourceId: 24,
    id: "fato-sinistro-re",
    name: "Fato Sinistro RE",
    prerequisiteId: 16,
    owner: "Isaque Pimentel",
    averageDuration: "01:00:00",
    startTime: "07:30:00",
    tool: "SQL",
    scenarioState: "completed",
    targetTime: "09:28",
  },
  {
    sourceId: 25,
    id: "scbo",
    name: "SCBO",
    prerequisiteId: null,
    owner: "Tuany Lima",
    averageDuration: "00:10:00",
    startTime: "07:00:00",
    tool: "SQL",
    scenarioState: "completed",
    targetTime: "07:16",
  },
  {
    sourceId: 26,
    id: "bi-indice-renovacao",
    name: "BI de Índice de Renovação",
    prerequisiteId: 20,
    owner: "Tommy Cheng",
    averageDuration: "04:00:00",
    startTime: "07:00:00",
    tool: "MSTR",
    scenarioState: "running",
    targetTime: "18:39",
    note: "índice de renovação em cálculo após propostas pendentes",
  },
  {
    sourceId: 27,
    id: "fato-card-renovacao-hypercard",
    name: "Fato Card Renovação (Hypercard)",
    prerequisiteId: 26,
    owner: "Tommy Cheng",
    averageDuration: "00:15:00",
    startTime: "07:00:00",
    tool: "MSTR",
    scenarioState: "waiting",
    targetTime: "19:06",
    note: "aguardando liberação do BI de Índice de Renovação",
  },
  {
    sourceId: 28,
    id: "card-indicadores-resumo-corretor",
    name: "Card Indicadores Resumo Corretor",
    prerequisiteId: 26,
    owner: "Tommy Cheng",
    averageDuration: "00:15:00",
    startTime: "07:00:00",
    tool: "MSTR",
    scenarioState: "waiting",
    targetTime: "19:10",
    note: "aguardando publicação do BI de Índice de Renovação",
  },
  {
    sourceId: 29,
    id: "pre-cotacao",
    name: "Pré-Cotação",
    prerequisiteId: 11,
    owner: "Tuany Lima",
    averageDuration: "02:30:00",
    startTime: "07:30:00",
    tool: "SAS",
    scenarioState: "completed",
    targetTime: "11:04",
  },
  {
    sourceId: 30,
    id: "fato-auto-cotacao-diaria",
    name: "Fato Auto Cotação Diária",
    prerequisiteId: 29,
    owner: "Tommy Cheng",
    averageDuration: "07:00:00",
    startTime: "07:00:00",
    tool: "SQL",
    scenarioState: "running",
    targetTime: "18:27",
    note: "carga longa de cotação diária ainda em processamento",
  },
  {
    sourceId: 31,
    id: "cubo-fato-cbo",
    name: "CUBO/FATO CBO",
    prerequisiteId: 25,
    owner: "Tommy Cheng",
    averageDuration: "01:00:00",
    startTime: "07:00:00",
    tool: "MSTR",
    scenarioState: "completed",
    targetTime: "08:29",
  },
  {
    sourceId: 32,
    id: "fato-emissao-re",
    name: "Fato Emissão RE",
    prerequisiteId: 12,
    owner: "Isaque Pimentel",
    averageDuration: "05:00:00",
    startTime: "07:00:00",
    tool: "MSTR",
    scenarioState: "completed",
    targetTime: "14:12",
    note: "publicação RE concluída após a extração SMB diária",
  },
  {
    sourceId: 33,
    id: "atualizacao-operacao-especial-worksite",
    name: "Atualização Operacao Especial Worksite",
    prerequisiteId: 12,
    owner: "Tuany Lima",
    averageDuration: "00:15:00",
    startTime: "07:00:00",
    tool: "MSTR",
    scenarioState: "completed",
    targetTime: "07:39",
  },
  {
    sourceId: 34,
    id: "fato-auto-grid",
    name: "Fato Auto GRID",
    prerequisiteId: 13,
    owner: "Tuany Lima",
    averageDuration: "00:30:00",
    startTime: "07:00:00",
    tool: "SQL",
    scenarioState: "completed",
    targetTime: "08:11",
  },
];

const rawRoutineBySourceId = new Map(
  rawRoutines.map((routine) => [routine.sourceId, routine]),
);
const snapshotMinutes = parseClockTime(OPERATION_SNAPSHOT_TIME);
const plannedFinishCache = new Map<number, number>();
const actualStartCache = new Map<number, number>();
const actualEndCache = new Map<number, number>();

function parseClockTime(value: string) {
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);

  if (!match) {
    throw new Error(`Horario invalido na massa mock: ${value}`);
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(`Horario invalido na massa mock: ${value}`);
  }

  return hours * 60 + minutes;
}

function parseDurationMinutes(value: string) {
  const match = /^(\d{2}):(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    throw new Error(`Duracao invalida na massa mock: ${value}`);
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    Number.isNaN(seconds)
  ) {
    throw new Error(`Duracao invalida na massa mock: ${value}`);
  }

  return hours * 60 + minutes + Math.floor(seconds / 60);
}

function formatClock(minutes: number) {
  const clamped = Math.max(minutes, 0);
  const hours = Math.floor(clamped / 60);
  const remainder = clamped % 60;

  return `${String(hours).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function formatVariance(minutes: number) {
  if (minutes === 0) {
    return undefined;
  }

  const sign = minutes > 0 ? "+" : "-";

  return `${sign}${Math.abs(minutes)}m`;
}

function getRawRoutine(sourceId: number) {
  const routine = rawRoutineBySourceId.get(sourceId);

  if (!routine) {
    throw new Error(`Prerequisito ${sourceId} nao encontrado na massa mock`);
  }

  return routine;
}

function getPlannedFinishMinutes(sourceId: number): number {
  const cachedValue = plannedFinishCache.get(sourceId);

  if (cachedValue !== undefined) {
    return cachedValue;
  }

  const routine = getRawRoutine(sourceId);
  const scheduledStart = parseClockTime(routine.startTime);
  const dependencyFinish =
    routine.prerequisiteId === null
      ? scheduledStart
      : getPlannedFinishMinutes(routine.prerequisiteId) + HANDOFF_MINUTES;
  const actualStart = Math.max(scheduledStart, dependencyFinish);
  const plannedFinish = actualStart + parseDurationMinutes(routine.averageDuration);

  plannedFinishCache.set(sourceId, plannedFinish);

  return plannedFinish;
}

function getActualStartMinutes(sourceId: number): number {
  const cachedValue = actualStartCache.get(sourceId);

  if (cachedValue !== undefined) {
    return cachedValue;
  }

  const routine = getRawRoutine(sourceId);
  const scheduledStart = parseClockTime(routine.startTime);
  const dependencyAvailability =
    routine.prerequisiteId === null
      ? scheduledStart
      : getActualEndMinutes(routine.prerequisiteId) + HANDOFF_MINUTES;
  const actualStart = Math.max(scheduledStart, dependencyAvailability);

  actualStartCache.set(sourceId, actualStart);

  return actualStart;
}

function getActualEndMinutes(sourceId: number): number {
  const cachedValue = actualEndCache.get(sourceId);

  if (cachedValue !== undefined) {
    return cachedValue;
  }

  const routine = getRawRoutine(sourceId);
  const earliestFinish =
    getActualStartMinutes(sourceId) + parseDurationMinutes(routine.averageDuration);
  const targetFinish = parseClockTime(routine.targetTime);
  const finalFinish = Math.max(earliestFinish, targetFinish);

  actualEndCache.set(sourceId, finalFinish);

  return finalFinish;
}

function getStatusForScenarioState(state: ScenarioState): CardStatus {
  if (state === "running") {
    return STATUS_RUNNING;
  }

  if (state === "late") {
    return STATUS_LATE;
  }

  if (state === "waiting") {
    return STATUS_WAITING;
  }

  return STATUS_COMPLETED;
}

function getIconForTool(tool: RoutineTool): CardIcon {
  return tool === "MSTR" ? "cube" : "table";
}

function getColorForStatus(status: CardStatus): CardColor {
  if (status === STATUS_COMPLETED) {
    return "green";
  }

  if (status === STATUS_LATE) {
    return "amber";
  }

  if (status === STATUS_WAITING) {
    return "gray";
  }

  return "blue";
}

function buildDetail(raw: RawRoutine, status: CardStatus) {
  if (raw.note) {
    return raw.note;
  }

  if (raw.prerequisiteId === null) {
    return status === STATUS_COMPLETED
      ? "origem concluida na janela inicial"
      : `janela inicial em ${raw.tool}`;
  }

  const prerequisite = getRawRoutine(raw.prerequisiteId);

  if (status === STATUS_WAITING) {
    return `aguardando liberacao de ${prerequisite.name}`;
  }

  if (status === STATUS_LATE) {
    return `cadeia pressionada por ${prerequisite.name}`;
  }

  if (status === STATUS_RUNNING) {
    return `processando apos ${prerequisite.name}`;
  }

  return `dep.: ${prerequisite.name}`;
}

function buildRoutineEntries(): BuiltRoutineEntry[] {
  const activeOwners = new Set(
    rawRoutines
      .filter((routine) => routine.scenarioState === "running" || routine.scenarioState === "late")
      .map((routine) => routine.owner),
  );

  return rawRoutines.map((raw) => {
    const status = getStatusForScenarioState(raw.scenarioState);
    const actualStartMinutes = getActualStartMinutes(raw.sourceId);
    const actualEndMinutes = getActualEndMinutes(raw.sourceId);
    const plannedEndMinutes = getPlannedFinishMinutes(raw.sourceId);
    const varianceMinutes = actualEndMinutes - plannedEndMinutes;
    const ownerPresence: PresenceStatus =
      status === STATUS_WAITING
        ? "ausente"
        : activeOwners.has(raw.owner)
          ? "online"
          : "offline";
    const card: RoutineCard = {
      id: raw.id,
      tool: raw.tool,
      icon: getIconForTool(raw.tool),
      name: raw.name,
      owner: raw.owner,
      ownerPresence,
      status,
      detail: buildDetail(raw, status),
      color: getColorForStatus(status),
      ...(status === STATUS_COMPLETED
        ? { completedAt: formatClock(actualEndMinutes) }
        : {
            forecast: formatClock(actualEndMinutes),
            variance: formatVariance(varianceMinutes),
            varianceTone:
              varianceMinutes === 0
                ? undefined
                : varianceMinutes < 0
                  ? "positive"
                  : "negative",
          }),
    };

    return {
      raw,
      status,
      icon: card.icon,
      color: card.color,
      ownerPresence,
      actualStartMinutes,
      actualEndMinutes,
      plannedEndMinutes,
      card,
    };
  });
}

function validateScenario(entries: readonly BuiltRoutineEntry[]) {
  if (entries.length !== 34) {
    throw new Error(`A massa mock precisa conter 34 rotinas, recebeu ${entries.length}`);
  }

  const routineIds = new Set(entries.map((entry) => entry.card.id));

  if (routineIds.size !== entries.length) {
    throw new Error("A massa mock contem ids de rotina duplicados");
  }

  entries.forEach((entry) => {
    const prerequisiteId = entry.raw.prerequisiteId;

    if (prerequisiteId !== null) {
      const prerequisiteEntry = entries.find(
        (candidate) => candidate.raw.sourceId === prerequisiteId,
      );

      if (!prerequisiteEntry) {
        throw new Error(
          `A rotina ${entry.raw.name} perdeu o prerequisito ${prerequisiteId}`,
        );
      }

      if (entry.actualStartMinutes < prerequisiteEntry.actualEndMinutes + HANDOFF_MINUTES) {
        throw new Error(
          `A rotina ${entry.raw.name} inicia antes da liberacao de ${prerequisiteEntry.raw.name}`,
        );
      }
    }

    if (entry.status === STATUS_COMPLETED && entry.actualEndMinutes > snapshotMinutes) {
      throw new Error(
        `A rotina ${entry.raw.name} nao pode estar concluida depois do snapshot`,
      );
    }

    if (
      (entry.status === STATUS_RUNNING || entry.status === STATUS_LATE) &&
      (entry.actualStartMinutes > snapshotMinutes || entry.actualEndMinutes <= snapshotMinutes)
    ) {
      throw new Error(
        `A rotina ${entry.raw.name} deveria estar em execucao no snapshot`,
      );
    }

    if (entry.status === STATUS_WAITING && entry.actualStartMinutes <= snapshotMinutes) {
      throw new Error(
        `A rotina ${entry.raw.name} deveria estar aguardando sem ter iniciado`,
      );
    }
  });
}

const builtEntries = buildRoutineEntries();

validateScenario(builtEntries);

export const routineCards: RoutineCard[] = builtEntries.map((entry) => entry.card);

export const routineLinks: RoutineLink[] = rawRoutines
  .filter((routine) => routine.prerequisiteId !== null)
  .map((routine) => ({
    from: getRawRoutine(routine.prerequisiteId as number).id,
    to: routine.id,
  }));
