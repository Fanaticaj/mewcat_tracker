import { STAT_KEYS } from "./constants";
import type {
  CatRow,
  PairInsight,
  PairTone,
  RoomsState,
  RoomStatLeader,
  StatKey,
} from "./types";

export function catStatSum(cat: CatRow) {
  return STAT_KEYS.reduce((acc, key) => acc + (Number(cat[key]) || 0), 0);
}

export function catAccent(cat: CatRow) {
  if (cat.token_kind === "female") return "#d3547f";
  if (cat.token_kind === "male") return "#3f7ae0";
  return "#5b6475";
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
      accent: "#15803d",
      background:
        "linear-gradient(180deg, rgba(240,253,244,0.96), rgba(220,252,231,0.9))",
      border: "rgba(34, 197, 94, 0.22)",
    };
  }

  if (insight.complementaryPerfectStats.length === 1) {
    return {
      label: "Useful upgrade",
      accent: "#0f766e",
      background:
        "linear-gradient(180deg, rgba(240,253,250,0.96), rgba(204,251,241,0.88))",
      border: "rgba(20, 184, 166, 0.2)",
    };
  }

  if (insight.sharedPerfectStats.length > 0) {
    return {
      label: "Overlap risk",
      accent: "#b45309",
      background:
        "linear-gradient(180deg, rgba(255,251,235,0.96), rgba(254,243,199,0.9))",
      border: "rgba(245, 158, 11, 0.22)",
    };
  }

  if (insight.strongStats.length >= 5) {
    return {
      label: "High floor",
      accent: "#475569",
      background:
        "linear-gradient(180deg, rgba(248,250,252,0.98), rgba(241,245,249,0.94))",
      border: "rgba(148, 163, 184, 0.22)",
    };
  }

  return {
    label: "Needs help",
    accent: "#7c3aed",
    background:
      "linear-gradient(180deg, rgba(250,245,255,0.96), rgba(243,232,255,0.9))",
    border: "rgba(168, 85, 247, 0.2)",
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
