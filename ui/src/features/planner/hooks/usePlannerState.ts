import { useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import Papa from "papaparse";
import { DEFAULT_ROOM_NAMES } from "../constants";
import { loadRooms, saveRooms } from "../storage";
import type { CatRow, DragState, RoomDestination, RoomsState } from "../types";

export function usePlannerState() {
  const [cats, setCats] = useState<CatRow[]>([]);
  const [rooms, setRooms] = useState<RoomsState>(() => loadRooms());
  const [roomNames, setRoomNames] = useState<string[]>(DEFAULT_ROOM_NAMES);
  const [newRoomName, setNewRoomName] = useState("");
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [dragState, setDragState] = useState<DragState>(null);
  const [activeDropZone, setActiveDropZone] = useState<RoomDestination | null>(null);

  useEffect(() => saveRooms(rooms), [rooms]);

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
    cats,
    clearAllRooms,
    dragState,
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
    tokenKinds,
    totalValidCats: validCats.length,
    unassigned,
    visibleRoomCats,
  };
}
