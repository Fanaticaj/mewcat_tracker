import { STAT_KEYS } from "./constants";
import type {
  CatRow,
  PlannerRoomFile,
  PairInsight,
  PairTone,
  RoomsState,
  RoomStatLeader,
  SortDirection,
  SortField,
  StatFilterState,
  StatKey,
} from "./types";

export function catStatSum(cat: CatRow) {
  return STAT_KEYS.reduce((acc, key) => acc + (Number(cat[key]) || 0), 0);
}

export function getCatGender(cat: CatRow) {
  const rawGender = cat.gender?.trim().toLowerCase();
  if (rawGender === "male" || rawGender === "female" || rawGender === "?") {
    return rawGender;
  }

  if (cat.token_kind === "male" || cat.token_kind === "female") {
    return cat.token_kind;
  }

  return "?";
}

export function getCatGenderLabel(cat: CatRow) {
  const gender = getCatGender(cat);
  if (gender === "?") return "Unknown";
  return gender.charAt(0).toUpperCase() + gender.slice(1);
}

export function catAccent(cat: CatRow) {
  if (getCatGender(cat) === "female") return "#b97e76";
  if (getCatGender(cat) === "male") return "#6d785d";
  return "#8b7868";
}

export function averageStatSum(cats: CatRow[]) {
  if (cats.length === 0) return "-";
  return (
    cats.reduce((sum, cat) => sum + catStatSum(cat), 0) / cats.length
  ).toFixed(1);
}

export function getStatValue(cat: CatRow, stat: StatKey) {
  return Number(cat[stat]) || 0;
}

export function createDefaultStatFilters() {
  return Object.fromEntries(STAT_KEYS.map((stat) => [stat, ""])) as StatFilterState;
}

export function doesCatMatchStatFilters(cat: CatRow, statFilters: StatFilterState) {
  return STAT_KEYS.every((stat) => {
    const minimum = Number(statFilters[stat]);
    if (!Number.isFinite(minimum) || statFilters[stat].trim() === "") return true;
    return getStatValue(cat, stat) >= minimum;
  });
}

export function sortCats(
  cats: CatRow[],
  sortField: SortField,
  sortDirection: SortDirection,
) {
  return [...cats].sort((left, right) => {
    const directionMultiplier = sortDirection === "asc" ? 1 : -1;

    if (sortField === "name") {
      return (
        left.name.localeCompare(right.name, undefined, { sensitivity: "base" }) *
        directionMultiplier
      );
    }

    const leftValue =
      sortField === "total" ? catStatSum(left) : getStatValue(left, sortField);
    const rightValue =
      sortField === "total" ? catStatSum(right) : getStatValue(right, sortField);

    if (leftValue !== rightValue) {
      return (leftValue - rightValue) * directionMultiplier;
    }

    return (
      left.name.localeCompare(right.name, undefined, { sensitivity: "base" }) *
      directionMultiplier
    );
  });
}

export function getPerfectStats(cat: CatRow) {
  return STAT_KEYS.filter((stat) => getStatValue(cat, stat) === 7);
}

export function getStrongStatCount(cat: CatRow) {
  return STAT_KEYS.filter((stat) => getStatValue(cat, stat) >= 6).length;
}

export function buildRoomStatLeaders(cats: CatRow[]): RoomStatLeader[] {
  return STAT_KEYS.map((stat) => {
    const maxValue = Math.max(...cats.map((cat) => getStatValue(cat, stat)));

    return {
      stat,
      maxValue,
      leaders: cats.filter((cat) => getStatValue(cat, stat) === maxValue),
    };
  });
}

export function buildPairInsight(first: CatRow, second: CatRow): PairInsight {
  const combinedMax = {} as Record<StatKey, number>;
  const perfectStats: StatKey[] = [];
  const complementaryPerfectStats: StatKey[] = [];
  const firstExclusivePerfectStats: StatKey[] = [];
  const secondExclusivePerfectStats: StatKey[] = [];
  const sharedPerfectStats: StatKey[] = [];
  const strongStats: StatKey[] = [];

  for (const stat of STAT_KEYS) {
    const firstValue = getStatValue(first, stat);
    const secondValue = getStatValue(second, stat);
    const bestValue = Math.max(firstValue, secondValue);

    combinedMax[stat] = bestValue;

    if (bestValue >= 6) strongStats.push(stat);

    if (bestValue === 7) {
      perfectStats.push(stat);

      if (firstValue === 7 && secondValue === 7) {
        sharedPerfectStats.push(stat);
      } else if (firstValue === 7) {
        complementaryPerfectStats.push(stat);
        firstExclusivePerfectStats.push(stat);
      } else {
        complementaryPerfectStats.push(stat);
        secondExclusivePerfectStats.push(stat);
      }
    }
  }

  const combinedTotal = STAT_KEYS.reduce(
    (sum, stat) => sum + combinedMax[stat],
    0,
  );

  // Favor broader 7 coverage over overlapping peaks when ranking pairs.
  const score =
    perfectStats.length * 120 +
    complementaryPerfectStats.length * 30 +
    strongStats.length * 8 +
    combinedTotal -
    sharedPerfectStats.length * 4;

  return {
    first,
    second,
    combinedMax,
    perfectStats,
    complementaryPerfectStats,
    firstExclusivePerfectStats,
    secondExclusivePerfectStats,
    sharedPerfectStats,
    strongStats,
    combinedTotal,
    score,
  };
}

export function buildRoomPairInsights(cats: CatRow[]) {
  const insights: PairInsight[] = [];

  for (let index = 0; index < cats.length; index += 1) {
    for (let nestedIndex = index + 1; nestedIndex < cats.length; nestedIndex += 1) {
      insights.push(buildPairInsight(cats[index], cats[nestedIndex]));
    }
  }

  return insights.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    if (right.perfectStats.length !== left.perfectStats.length) {
      return right.perfectStats.length - left.perfectStats.length;
    }
    return right.combinedTotal - left.combinedTotal;
  });
}

export function formatStatList(stats: StatKey[]) {
  return stats.length > 0 ? stats.join(", ") : "None";
}

export function getPairTone(insight: PairInsight): PairTone {
  if (insight.complementaryPerfectStats.length >= 2) {
    return {
      label: "Prime complement",
      accent: "#58664a",
      background:
        "linear-gradient(180deg, rgba(239,244,232,0.97), rgba(224,232,214,0.92))",
      border: "rgba(109, 120, 93, 0.24)",
    };
  }

  if (insight.complementaryPerfectStats.length === 1) {
    return {
      label: "Useful upgrade",
      accent: "#7b6b5b",
      background:
        "linear-gradient(180deg, rgba(245,239,231,0.96), rgba(232,220,208,0.9))",
      border: "rgba(139, 120, 104, 0.24)",
    };
  }

  if (insight.sharedPerfectStats.length > 0) {
    return {
      label: "Overlap risk",
      accent: "#9a6b49",
      background:
        "linear-gradient(180deg, rgba(251,242,231,0.96), rgba(239,219,197,0.9))",
      border: "rgba(171, 123, 89, 0.24)",
    };
  }

  if (insight.strongStats.length >= 5) {
    return {
      label: "High floor",
      accent: "#5c5248",
      background:
        "linear-gradient(180deg, rgba(246,241,235,0.98), rgba(235,227,217,0.94))",
      border: "rgba(139, 120, 104, 0.22)",
    };
  }

  return {
    label: "Needs help",
    accent: "#7a5d4c",
    background:
      "linear-gradient(180deg, rgba(244,235,226,0.96), rgba(228,214,201,0.9))",
    border: "rgba(171, 123, 89, 0.2)",
  };
}

export function getPairNarrative(insight: PairInsight) {
  if (insight.complementaryPerfectStats.length > 0) {
    return `${insight.first.name} and ${insight.second.name} cover different perfect 7s, so this room can push a broader kitten ceiling.`;
  }

  if (insight.sharedPerfectStats.length > 0) {
    return "Both cats peak on the same perfect stats, so this pairing is steadier but adds less new ceiling.";
  }

  return "No perfect 7 handoff yet, so this pairing mainly improves the room's 6+ floor.";
}

function getSoloAssignmentScore(cat: CatRow) {
  return catStatSum(cat) + getStrongStatCount(cat) * 10 + getPerfectStats(cat).length * 55;
}

function getRoomAssignmentScore(cats: CatRow[]) {
  if (cats.length === 0) return 0;
  if (cats.length === 1) return getSoloAssignmentScore(cats[0]) * 0.55;

  const pairInsights = buildRoomPairInsights(cats);
  const bestPairScore = pairInsights[0]?.score ?? 0;
  const backupPairScore = pairInsights[1]?.score ?? 0;
  const distinctPerfectStats = new Set(cats.flatMap(getPerfectStats)).size;
  const crowdPenalty = Math.max(0, cats.length - 2) * 18;

  return (
    bestPairScore +
    backupPairScore * 0.18 +
    distinctPerfectStats * 14 -
    crowdPenalty
  );
}

function selectBestMatchForSingleCatRooms(
  roomNames: string[],
  roomCats: Map<string, CatRow[]>,
  pool: CatRow[],
) {
  let bestChoice:
    | {
        catIndex: number;
        delta: number;
        roomName: string;
      }
    | undefined;

  for (const roomName of roomNames) {
    const cats = roomCats.get(roomName) ?? [];
    if (cats.length !== 1) continue;

    const currentScore = getRoomAssignmentScore(cats);

    for (let index = 0; index < pool.length; index += 1) {
      const candidate = pool[index];
      const nextScore = getRoomAssignmentScore([...cats, candidate]);
      const delta = nextScore - currentScore;

      if (
        !bestChoice ||
        delta > bestChoice.delta ||
        (delta === bestChoice.delta && cats.length < (roomCats.get(bestChoice.roomName) ?? []).length)
      ) {
        bestChoice = {
          catIndex: index,
          delta,
          roomName,
        };
      }
    }
  }

  return bestChoice;
}

function selectBestPair(pool: CatRow[]) {
  let bestPair:
    | {
        firstIndex: number;
        score: number;
        secondIndex: number;
      }
    | undefined;

  for (let firstIndex = 0; firstIndex < pool.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < pool.length; secondIndex += 1) {
      const insight = buildPairInsight(pool[firstIndex], pool[secondIndex]);

      if (
        !bestPair ||
        insight.score > bestPair.score ||
        (insight.score === bestPair.score &&
          insight.combinedTotal >
            buildPairInsight(pool[bestPair.firstIndex], pool[bestPair.secondIndex]).combinedTotal)
      ) {
        bestPair = {
          firstIndex,
          score: insight.score,
          secondIndex,
        };
      }
    }
  }

  return bestPair;
}

function selectBestIncrementalAssignment(
  roomNames: string[],
  roomCats: Map<string, CatRow[]>,
  pool: CatRow[],
) {
  let bestChoice:
    | {
        catIndex: number;
        delta: number;
        roomName: string;
      }
    | undefined;

  for (const roomName of roomNames) {
    const cats = roomCats.get(roomName) ?? [];
    const currentScore = getRoomAssignmentScore(cats);

    for (let index = 0; index < pool.length; index += 1) {
      const candidate = pool[index];
      const nextScore = getRoomAssignmentScore([...cats, candidate]);
      const delta = nextScore - currentScore;

      if (
        !bestChoice ||
        delta > bestChoice.delta ||
        (delta === bestChoice.delta &&
          cats.length < (roomCats.get(bestChoice.roomName) ?? []).length)
      ) {
        bestChoice = {
          catIndex: index,
          delta,
          roomName,
        };
      }
    }
  }

  return bestChoice;
}

export function buildAutoAssignedRooms({
  catsByKey,
  currentRooms,
  eligibleUnassignedCats,
  roomNames,
}: {
  catsByKey: Map<string, CatRow>;
  currentRooms: RoomsState;
  eligibleUnassignedCats: CatRow[];
  roomNames: string[];
}) {
  const nextRooms = Object.fromEntries(
    roomNames.map((roomName) => [roomName, [...(currentRooms[roomName] ?? [])]]),
  ) as RoomsState;

  const roomCats = new Map(
    roomNames.map((roomName) => [
      roomName,
      (currentRooms[roomName] ?? [])
        .map((key) => catsByKey.get(key))
        .filter((cat): cat is CatRow => cat !== undefined),
    ]),
  );

  const pool = [...eligibleUnassignedCats];

  const assignCat = (roomName: string, catIndex: number) => {
    const [cat] = pool.splice(catIndex, 1);
    nextRooms[roomName].push(cat.key);
    roomCats.get(roomName)?.push(cat);
  };

  // First complete rooms that already have one cat so the planner quickly forms viable pairs.
  while (pool.length > 0) {
    const choice = selectBestMatchForSingleCatRooms(roomNames, roomCats, pool);
    if (!choice) break;
    assignCat(choice.roomName, choice.catIndex);
  }

  // Then seed empty rooms with the strongest remaining pairs before distributing leftovers.
  while (pool.length >= 2) {
    const emptyRoomName = roomNames.find((roomName) => (roomCats.get(roomName) ?? []).length === 0);
    if (!emptyRoomName) break;

    const bestPair = selectBestPair(pool);
    if (!bestPair) break;

    assignCat(emptyRoomName, bestPair.secondIndex);
    assignCat(emptyRoomName, bestPair.firstIndex);
  }

  // Finally place any leftovers where they improve room quality the most.
  while (pool.length > 0) {
    const choice = selectBestIncrementalAssignment(roomNames, roomCats, pool);
    if (!choice) break;
    assignCat(choice.roomName, choice.catIndex);
  }

  return nextRooms;
}

export function sanitizeRooms(roomNames: string[], rooms: RoomsState) {
  return Object.fromEntries(
    roomNames.map((roomName) => [roomName, [...(rooms[roomName] ?? [])]]),
  ) as RoomsState;
}

export function buildPlannerRoomFile({
  eligibility,
  roomNames,
  rooms,
}: {
  eligibility: Record<string, boolean>;
  roomNames: string[];
  rooms: RoomsState;
}): PlannerRoomFile {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    roomNames,
    rooms: sanitizeRooms(roomNames, rooms),
    eligibility,
  };
}

export function parsePlannerRoomFile(raw: string): PlannerRoomFile {
  const parsed = JSON.parse(raw) as Partial<PlannerRoomFile>;

  if (parsed.version !== 1) {
    throw new Error("Unsupported room file version.");
  }

  if (
    !Array.isArray(parsed.roomNames) ||
    !parsed.roomNames.every((name) => typeof name === "string" && name.trim().length > 0)
  ) {
    throw new Error("Room file is missing valid room names.");
  }

  if (!parsed.rooms || typeof parsed.rooms !== "object") {
    throw new Error("Room file is missing room assignments.");
  }

  const sanitizedRoomNames = parsed.roomNames.map((name) => name.trim());
  const sanitizedRooms = sanitizeRooms(
    sanitizedRoomNames,
    parsed.rooms as RoomsState,
  );
  const sanitizedEligibility =
    parsed.eligibility && typeof parsed.eligibility === "object"
      ? Object.fromEntries(
          Object.entries(parsed.eligibility).filter(
            (entry): entry is [string, boolean] => typeof entry[1] === "boolean",
          ),
        )
      : {};

  return {
    version: 1,
    savedAt:
      typeof parsed.savedAt === "string" ? parsed.savedAt : new Date().toISOString(),
    roomNames: sanitizedRoomNames,
    rooms: sanitizedRooms,
    eligibility: sanitizedEligibility,
  };
}
