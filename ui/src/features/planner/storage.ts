import { ROOMS_STORAGE_KEY } from "./constants";
import type { RoomsState } from "./types";

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
