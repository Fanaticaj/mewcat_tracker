import {
  DEFAULT_ROOM_NAMES,
  ELIGIBILITY_STORAGE_KEY,
  ROOM_NAMES_STORAGE_KEY,
  ROOMS_STORAGE_KEY,
} from "./constants";
import type { EligibilityState, RoomsState } from "./types";

export function loadRooms(): RoomsState {
  try {
    const raw = localStorage.getItem(ROOMS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as RoomsState;
  } catch {
    return {};
  }
}

export function saveRooms(rooms: RoomsState) {
  localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
}

export function loadRoomNames() {
  try {
    const raw = localStorage.getItem(ROOM_NAMES_STORAGE_KEY);
    if (!raw) return DEFAULT_ROOM_NAMES;

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every((value) => typeof value === "string")
      ? parsed
      : DEFAULT_ROOM_NAMES;
  } catch {
    return DEFAULT_ROOM_NAMES;
  }
}

export function saveRoomNames(roomNames: string[]) {
  localStorage.setItem(ROOM_NAMES_STORAGE_KEY, JSON.stringify(roomNames));
}

export function loadEligibility(): EligibilityState {
  try {
    const raw = localStorage.getItem(ELIGIBILITY_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as EligibilityState;
  } catch {
    return {};
  }
}

export function saveEligibility(eligibility: EligibilityState) {
  localStorage.setItem(ELIGIBILITY_STORAGE_KEY, JSON.stringify(eligibility));
}
