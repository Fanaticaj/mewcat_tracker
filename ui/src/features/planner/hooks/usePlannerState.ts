import { useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import Papa from "papaparse";
import {
  loadEligibility,
  loadRoomNames,
  loadRooms,
  saveEligibility,
  saveRoomNames,
  saveRooms,
} from "../storage";
import type {
  CatRow,
  DragState,
  EligibilityState,
  RoomDestination,
  RoomsState,
  SavDecodeResponse,
  SortDirection,
  SortField,
  StatFilterState,
} from "../types";
import {
  buildAutoAssignedRooms,
  buildPlannerRoomFile,
  createDefaultStatFilters,
  doesCatMatchStatFilters,
  parsePlannerRoomFile,
  sanitizeRooms,
  sortCats,
} from "../utils";

function downloadRoomPlanFile(contents: string) {
  const blob = new Blob([contents], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);

  anchor.href = url;
  anchor.download = `mew-room-plan-${stamp}.json`;
  anchor.click();

  URL.revokeObjectURL(url);
}

export function usePlannerState() {
  const [cats, setCats] = useState<CatRow[]>([]);
  const [rooms, setRooms] = useState<RoomsState>(() => loadRooms());
  const [eligibility, setEligibility] = useState<EligibilityState>(() =>
    loadEligibility(),
  );
  const [roomNames, setRoomNames] = useState<string[]>(() => loadRoomNames());
  const [newRoomName, setNewRoomName] = useState("");
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [statFilters, setStatFilters] = useState<StatFilterState>(
    createDefaultStatFilters,
  );
  const [isDecodingSav, setIsDecodingSav] = useState(false);
  const [plannerMessage, setPlannerMessage] = useState("");
  const [plannerMessageTone, setPlannerMessageTone] = useState<
    "info" | "success" | "error"
  >("info");
  const [dragState, setDragState] = useState<DragState>(null);
  const [activeDropZone, setActiveDropZone] = useState<RoomDestination | null>(null);

  useEffect(() => saveRooms(rooms), [rooms]);
  useEffect(() => saveEligibility(eligibility), [eligibility]);
  useEffect(() => saveRoomNames(roomNames), [roomNames]);

  const validCats = useMemo(
    () => cats.filter((cat) => !(cat.error && cat.error.length > 0)),
    [cats],
  );

  const validCatKeys = useMemo(
    () => new Set(validCats.map((cat) => cat.key)),
    [validCats],
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
      keys.forEach((key) => {
        if (validCatKeys.has(key)) assigned.add(key);
      });
    }

    return assigned;
  }, [rooms, validCatKeys]);

  const isCatEligible = (catKey: string) => eligibility[catKey] ?? true;

  const filteredCats = useMemo(() => {
    const query = search.trim().toLowerCase();
    const visible = validCats.filter((cat) => {
      if (genderFilter !== "all" && cat.token_kind !== genderFilter) return false;
      if (!doesCatMatchStatFilters(cat, statFilters)) return false;
      if (!query) return true;

      return (
        cat.name.toLowerCase().includes(query) ||
        cat.key.toLowerCase().includes(query) ||
        cat.token.toLowerCase().includes(query)
      );
    });

    return sortCats(visible, sortField, sortDirection);
  }, [genderFilter, search, sortDirection, sortField, statFilters, validCats]);

  const filteredCatKeys = useMemo(
    () => new Set(filteredCats.map((cat) => cat.key)),
    [filteredCats],
  );

  const unassigned = useMemo(
    () => filteredCats.filter((cat) => !assignedKeys.has(cat.key)),
    [assignedKeys, filteredCats],
  );

  const eligibleUnassignedCats = useMemo(
    () =>
      validCats.filter(
        (cat) => !assignedKeys.has(cat.key) && (eligibility[cat.key] ?? true),
      ),
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

        return [roomName, sortCats(shown, sortField, sortDirection)];
      }),
    ) as Record<string, CatRow[]>;
  }, [catsByKey, filteredCatKeys, roomNames, rooms, sortDirection, sortField]);

  function setNotice(message: string, tone: "info" | "success" | "error") {
    setPlannerMessage(message);
    setPlannerMessageTone(tone);
  }

  function importCsv(file: File) {
    Papa.parse<CatRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setCats(result.data.filter((row) => row.key));
        setNotice(`Loaded ${file.name}.`, "success");
      },
    });
  }

  async function decodeSavFile(file: File) {
    setIsDecodingSav(true);

    try {
      const response = await fetch("/api/decode-sav", {
        body: await file.arrayBuffer(),
        headers: {
          "Content-Type": "application/octet-stream",
          "X-File-Name": file.name,
        },
        method: "POST",
      });

      const payload = (await response.json()) as
        | SavDecodeResponse
        | { error?: string; message?: string };
      const payloadError = "error" in payload ? payload.error : undefined;
      const payloadMessage = "message" in payload ? payload.message : undefined;

      if (!response.ok) {
        throw new Error(
          payloadError || payloadMessage || "Failed to decode that save file.",
        );
      }

      setNotice(
        `${payloadMessage || "Decoded the save file."} Clean up the CSV if needed, then use Import cats CSV.`,
        "success",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to decode that save file from the web app.";
      setNotice(message, "error");
    } finally {
      setIsDecodingSav(false);
    }
  }

  function addRoom() {
    const name = newRoomName.trim();
    if (!name) return;
    if (roomNames.some((roomName) => roomName.toLowerCase() === name.toLowerCase())) {
      return;
    }

    setRoomNames((current) => [...current, name]);
    setRooms((current) => ({ ...current, [name]: current[name] ?? [] }));
    setNewRoomName("");
    setNotice(`Added ${name}.`, "success");
  }

  function renameRoom(currentName: string, nextName: string) {
    const trimmedName = nextName.trim();
    if (!trimmedName) return;

    const hasConflict = roomNames.some(
      (roomName) =>
        roomName !== currentName && roomName.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (hasConflict) return;

    setRoomNames((current) =>
      current.map((roomName) => (roomName === currentName ? trimmedName : roomName)),
    );
    setRooms((current) => {
      const nextRooms: RoomsState = {};

      for (const roomName of Object.keys(current)) {
        if (roomName === currentName) continue;
        nextRooms[roomName] = current[roomName];
      }

      nextRooms[trimmedName] = current[currentName] ?? [];
      return sanitizeRooms(
        roomNames.map((roomName) => (roomName === currentName ? trimmedName : roomName)),
        nextRooms,
      );
    });
    setNotice(`Renamed ${currentName} to ${trimmedName}.`, "success");
  }

  function removeRoom(roomName: string) {
    setRoomNames((current) => current.filter((name) => name !== roomName));
    setRooms((current) => {
      const nextRooms: RoomsState = {};

      for (const name of Object.keys(current)) {
        if (name !== roomName) nextRooms[name] = current[name];
      }

      return nextRooms;
    });
    setNotice(`Removed ${roomName}. Its cats are now unassigned.`, "info");
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
    setRooms(sanitizeRooms(roomNames, {}));
    setNotice("Cleared all room assignments.", "info");
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
    setNotice("Assigned eligible unassigned cats to the strongest available rooms.", "success");
  }

  async function importRoomFile(file: File) {
    try {
      const parsed = parsePlannerRoomFile(await file.text());
      setRoomNames(parsed.roomNames);
      setRooms(parsed.rooms);
      setEligibility(parsed.eligibility);
      setNotice(`Loaded room plan from ${file.name}.`, "success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to read that room file.";
      setNotice(message, "error");
    }
  }

  function exportRoomFile() {
    const roomFile = buildPlannerRoomFile({
      eligibility,
      roomNames,
      rooms,
    });

    downloadRoomPlanFile(JSON.stringify(roomFile, null, 2));
    setNotice("Downloaded the current room plan as JSON.", "success");
  }

  function updateStatFilter(stat: keyof StatFilterState, value: string) {
    const digit = value.replace(/[^0-9]/g, "").slice(0, 1);
    const cleaned =
      digit.length === 0 ? "" : String(Math.max(0, Math.min(7, Number(digit))));

    setStatFilters((current) => ({
      ...current,
      [stat]: cleaned,
    }));
  }

  function resetStatFilters() {
    setStatFilters(createDefaultStatFilters());
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
    decodeSavFile,
    dragState,
    eligibleUnassignedCount: eligibleUnassignedCats.length,
    exportRoomFile,
    filteredCats,
    genderFilter,
    handleDragEnd,
    handleDragLeave,
    handleDragOver,
    handleDragStart,
    handleDrop,
    importCsv,
    importRoomFile,
    isDecodingSav,
    moveCatToRoom,
    newRoomName,
    plannerMessage,
    plannerMessageTone,
    removeRoom,
    renameRoom,
    resetStatFilters,
    roomNames,
    search,
    setGenderFilter,
    setNewRoomName,
    setSearch,
    setSortDirection,
    setSortField,
    sortDirection,
    sortField,
    statFilters,
    toggleCatEligibility,
    tokenKinds,
    totalValidCats: validCats.length,
    unassigned,
    updateStatFilter,
    visibleRoomCats,
    wasCatMarkedEligible: isCatEligible,
  };
}
