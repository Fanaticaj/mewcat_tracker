import { ELIGIBILITY_STORAGE_KEY, ROOMS_STORAGE_KEY } from "./constants";
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
