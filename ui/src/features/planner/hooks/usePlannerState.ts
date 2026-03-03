import { useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import Papa from "papaparse";
import { DEFAULT_ROOM_NAMES } from "../constants";
import { loadEligibility, loadRooms, saveEligibility, saveRooms } from "../storage";
import type {
  CatRow,
  DragState,
  EligibilityState,
  RoomDestination,
  RoomsState,
} from "../types";
import { buildAutoAssignedRooms } from "../utils";

export function usePlannerState() {
  const [cats, setCats] = useState<CatRow[]>([]);
  const [rooms, setRooms] = useState<RoomsState>(() => loadRooms());
  const [eligibility, setEligibility] = useState<EligibilityState>(() =>
    loadEligibility(),
  );
  const [roomNames, setRoomNames] = useState<string[]>(DEFAULT_ROOM_NAMES);
  const [newRoomName, setNewRoomName] = useState("");
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [dragState, setDragState] = useState<DragState>(null);
  const [activeDropZone, setActiveDropZone] = useState<RoomDestination | null>(null);

  useEffect(() => saveRooms(rooms), [rooms]);
  useEffect(() => saveEligibility(eligibility), [eligibility]);

  const validCats = useMemo(
    () => cats.filter((cat) => !(cat.error && cat.error.length > 0)),
    [cats],
  );

  const catsByKey = useMemo(() => {
    const map = new Map<string, CatRow>();

    for (const cat of cats) {
      map.set(cat.key, cat);
    }

    return map;
  }, [cats]);

  const assignedKeys = useMemo(() => {
    const assigned = new Set<string>();

    for (const keys of Object.values(rooms)) {
      keys.forEach((key) => assigned.add(key));
    }

    return assigned;
  }, [rooms]);

  const isCatEligible = (catKey: string) => eligibility[catKey] ?? true;

  const filteredCats = useMemo(() => {
    const query = search.trim().toLowerCase();

    return validCats.filter((cat) => {
      if (genderFilter !== "all" && cat.token_kind !== genderFilter) return false;
      if (!query) return true;

      return (
        cat.name.toLowerCase().includes(query) ||
        cat.key.toLowerCase().includes(query) ||
        cat.token.toLowerCase().includes(query)
      );
    });
  }, [genderFilter, search, validCats]);

  const filteredCatKeys = useMemo(
    () => new Set(filteredCats.map((cat) => cat.key)),
    [filteredCats],
  );

  const unassigned = useMemo(
    () => filteredCats.filter((cat) => !assignedKeys.has(cat.key)),
    [assignedKeys, filteredCats],
  );

  const eligibleUnassignedCats = useMemo(
    () => validCats.filter((cat) => !assignedKeys.has(cat.key) && isCatEligible(cat.key)),
    [assignedKeys, eligibility, validCats],
  );

  const tokenKinds = useMemo(() => {
    const kinds = new Set<string>();

    for (const cat of cats) {
      if (cat.token_kind) kinds.add(cat.token_kind);
    }

    return Array.from(kinds).sort();
  }, [cats]);

  const visibleRoomCats = useMemo(() => {
    return Object.fromEntries(
      roomNames.map((roomName) => {
        const keys = rooms[roomName] ?? [];
        const shown = keys
          .map((key) => catsByKey.get(key))
          .filter(
            (cat): cat is CatRow => cat !== undefined && filteredCatKeys.has(cat.key),
          );

        return [roomName, shown];
      }),
    ) as Record<string, CatRow[]>;
  }, [catsByKey, filteredCatKeys, roomNames, rooms]);

  function importCsv(file: File) {
    Papa.parse<CatRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setCats(result.data.filter((row) => row.key));
      },
    });
  }

  function addRoom() {
    const name = newRoomName.trim();
    if (!name || roomNames.includes(name)) return;

    setRoomNames((current) => [...current, name]);
    setNewRoomName("");
  }

  function moveCatToRoom(catKey: string, destination: RoomDestination) {
    setRooms((current) => {
      const next: RoomsState = {};

      for (const roomName of Object.keys(current)) {
        next[roomName] = current[roomName].filter((key) => key !== catKey);
      }

      if (destination !== "unassigned") {
        next[destination] = next[destination] ?? [];
        if (!next[destination].includes(catKey)) next[destination].push(catKey);
      }

      for (const roomName of roomNames) {
        next[roomName] = next[roomName] ?? [];
      }

      return next;
    });
  }

  function clearAllRooms() {
    setRooms({});
  }

  function toggleCatEligibility(catKey: string) {
    setEligibility((current) => ({
      ...current,
      [catKey]: !(current[catKey] ?? true),
    }));
  }

  function autoAssignEligibleCats() {
    if (eligibleUnassignedCats.length === 0 || roomNames.length === 0) return;

    setRooms((current) =>
      buildAutoAssignedRooms({
        catsByKey,
        currentRooms: current,
        eligibleUnassignedCats,
        roomNames,
      }),
    );
  }

  function handleDragStart(
    event: DragEvent<HTMLElement>,
    catKey: string,
    fromRoom: RoomDestination,
  ) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", catKey);
    setDragState({ catKey, fromRoom });
  }

  function handleDragEnd() {
    setDragState(null);
    setActiveDropZone(null);
  }

  function handleDragOver(
    event: DragEvent<HTMLElement>,
    destination: RoomDestination,
  ) {
    if (!dragState) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    if (activeDropZone !== destination) {
      setActiveDropZone(destination);
    }
  }

  function handleDragLeave(
    event: DragEvent<HTMLElement>,
    destination: RoomDestination,
  ) {
    const nextTarget = event.relatedTarget;

    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }

    if (activeDropZone === destination) {
      setActiveDropZone(null);
    }
  }

  function handleDrop(
    event: DragEvent<HTMLElement>,
    destination: RoomDestination,
  ) {
    event.preventDefault();

    const catKey = dragState?.catKey || event.dataTransfer.getData("text/plain");

    if (catKey && dragState?.fromRoom !== destination) {
      moveCatToRoom(catKey, destination);
    }

    setDragState(null);
    setActiveDropZone(null);
  }

  return {
    activeDropZone,
    addRoom,
    assignedCount: assignedKeys.size,
    autoAssignEligibleCats,
    cats,
    clearAllRooms,
    dragState,
    eligibleUnassignedCount: eligibleUnassignedCats.length,
    filteredCats,
    genderFilter,
    handleDragEnd,
    handleDragLeave,
    handleDragOver,
    handleDragStart,
    handleDrop,
    importCsv,
    moveCatToRoom,
    newRoomName,
    roomNames,
    search,
    setGenderFilter,
    setNewRoomName,
    setSearch,
    toggleCatEligibility,
    tokenKinds,
    totalValidCats: validCats.length,
    unassigned,
    visibleRoomCats,
    wasCatMarkedEligible: isCatEligible,
  };
}
