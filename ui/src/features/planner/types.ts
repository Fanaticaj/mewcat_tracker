import type { STAT_KEYS } from "./constants";

export type CatRow = {
  key: string;
  name: string;
  token: string;
  token_kind: string;
  token_id: string;
  stats_endian: string;
  STR: string;
  DEX: string;
  CON: string;
  INT: string;
  SPD: string;
  CHA: string;
  LCK: string;
  error?: string;
};

export type RoomsState = Record<string, string[]>;

export type EligibilityState = Record<string, boolean>;

export type RoomDestination = string | "unassigned";

export type DragState = {
  catKey: string;
  fromRoom: RoomDestination;
} | null;

export type StatKey = (typeof STAT_KEYS)[number];

export type RoomStatLeader = {
  stat: StatKey;
  maxValue: number;
  leaders: CatRow[];
};

export type PairInsight = {
  first: CatRow;
  second: CatRow;
  combinedMax: Record<StatKey, number>;
  perfectStats: StatKey[];
  complementaryPerfectStats: StatKey[];
  firstExclusivePerfectStats: StatKey[];
  secondExclusivePerfectStats: StatKey[];
  sharedPerfectStats: StatKey[];
  strongStats: StatKey[];
  combinedTotal: number;
  score: number;
};

export type PairTone = {
  label: string;
  accent: string;
  background: string;
  border: string;
};
