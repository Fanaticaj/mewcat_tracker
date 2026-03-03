import { useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import Papa from "papaparse";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

type CatRow = {
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

type RoomsState = Record<string, string[]>;
type RoomDestination = string | "unassigned";
type DragState = {
  catKey: string;
  fromRoom: RoomDestination;
} | null;

const STAT_KEYS = ["STR", "DEX", "CON", "INT", "SPD", "CHA", "LCK"] as const;

function loadRooms(): RoomsState {
  try {
    const raw = localStorage.getItem("mew_rooms_v1");
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveRooms(rooms: RoomsState) {
  localStorage.setItem("mew_rooms_v1", JSON.stringify(rooms));
}

function catStatSum(cat: CatRow) {
  return STAT_KEYS.reduce((acc, key) => acc + (Number(cat[key]) || 0), 0);
}

function catAccent(cat: CatRow) {
  if (cat.token_kind === "female") return "#d3547f";
  if (cat.token_kind === "male") return "#3f7ae0";
  return "#5b6475";
}

function averageStatSum(cats: CatRow[]) {
  if (cats.length === 0) return "-";
  return (
    cats.reduce((sum, cat) => sum + catStatSum(cat), 0) / cats.length
  ).toFixed(1);
}

export default function App() {
  const [cats, setCats] = useState<CatRow[]>([]);
  const [rooms, setRooms] = useState<RoomsState>(() => loadRooms());
  const [roomNames, setRoomNames] = useState<string[]>([
    "Room A",
    "Room B",
    "Room C",
  ]);
  const [newRoomName, setNewRoomName] = useState("");
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [dragState, setDragState] = useState<DragState>(null);
  const [activeDropZone, setActiveDropZone] = useState<RoomDestination | null>(
    null,
  );

  useEffect(() => saveRooms(rooms), [rooms]);

  const catsByKey = useMemo(() => {
    const map = new Map<string, CatRow>();
    for (const cat of cats) map.set(cat.key, cat);
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
    return cats.filter((cat) => {
      if (cat.error && cat.error.length > 0) return false;
      if (genderFilter !== "all" && cat.token_kind !== genderFilter) return false;
      if (!query) return true;
      return (
        cat.name.toLowerCase().includes(query) ||
        cat.key.toLowerCase().includes(query) ||
        cat.token.toLowerCase().includes(query)
      );
    });
  }, [cats, search, genderFilter]);

  const unassigned = useMemo(
    () => filteredCats.filter((cat) => !assignedKeys.has(cat.key)),
    [filteredCats, assignedKeys],
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
        const roomCats = keys
          .map((key) => catsByKey.get(key))
          .filter(Boolean) as CatRow[];
        const shown = roomCats.filter((cat) =>
          filteredCats.some((visibleCat) => visibleCat.key === cat.key),
        );
        return [roomName, shown];
      }),
    ) as Record<string, CatRow[]>;
  }, [roomNames, rooms, catsByKey, filteredCats]);

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
    if (activeDropZone !== destination) setActiveDropZone(destination);
  }

  function handleDragLeave(
    event: DragEvent<HTMLElement>,
    destination: RoomDestination,
  ) {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }
    if (activeDropZone === destination) setActiveDropZone(null);
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

  const totalValidCats = cats.filter((cat) => !(cat.error && cat.error.length > 0)).length;
  const assignedCount = assignedKeys.size;

  return (
    <Container maxWidth="xl" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        <Card
          sx={{
            borderRadius: 6,
            border: "1px solid rgba(15, 23, 42, 0.08)",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(240,244,255,0.96))",
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)",
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="overline" sx={{ letterSpacing: "0.12em" }}>
                  Breeding Planner
                </Typography>
                <Typography variant="h3" fontWeight={800} sx={{ mb: 1 }}>
                  Mewgenics Cat Room Manager
                </Typography>
                <Typography color="text.secondary" sx={{ maxWidth: 780 }}>
                  Drag cats into rooms to sketch pairings quickly. The quick-move
                  selector stays available as a fallback when drag and drop is not
                  convenient.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={`${totalValidCats} cats loaded`} color="primary" />
                <Chip label={`${assignedCount} assigned`} variant="outlined" />
                <Chip label={`${roomNames.length} rooms`} variant="outlined" />
                <Chip
                  label={`${filteredCats.length} visible after filters`}
                  variant="outlined"
                />
              </Stack>

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <Button variant="contained" component="label" sx={primaryActionSx}>
                  Import cats CSV
                  <input
                    hidden
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) importCsv(file);
                    }}
                  />
                </Button>

                <TextField
                  label="Search name, key, or token"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  size="small"
                  sx={{ width: { xs: "100%", md: 300 } }}
                />

                <FormControl size="small" sx={{ width: { xs: "100%", md: 220 } }}>
                  <InputLabel>Gender / Type</InputLabel>
                  <Select
                    label="Gender / Type"
                    value={genderFilter}
                    onChange={(event) => setGenderFilter(event.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    {tokenKinds.map((kind) => (
                      <MenuItem key={kind} value={kind}>
                        {kind}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box sx={{ flex: 1, display: { xs: "none", md: "block" } }} />

                <Button
                  variant="outlined"
                  color="warning"
                  onClick={clearAllRooms}
                  sx={{ width: { xs: "100%", md: "auto" } }}
                >
                  Clear room assignments
                </Button>
              </Stack>

              <Divider />

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <TextField
                  label="New room name"
                  size="small"
                  value={newRoomName}
                  onChange={(event) => setNewRoomName(event.target.value)}
                  sx={{ width: { xs: "100%", md: 280 } }}
                />
                <Button
                  variant="outlined"
                  onClick={addRoom}
                  sx={{ width: { xs: "100%", md: "auto" } }}
                >
                  Add room
                </Button>
                <Typography color="text.secondary">
                  Rooms are UI groupings for now. Once you decode the real in-game
                  room data, these assignments can map to that model.
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={2}
          alignItems="flex-start"
        >
          <DropZoneSection
            title="Unassigned Cats"
            subtitle="Start here, then drag cats into rooms."
            count={unassigned.length}
            averageLabel={`${filteredCats.length - unassigned.length} assigned in view`}
            cats={unassigned}
            roomNames={roomNames}
            getRoomForCat={() => "unassigned"}
            onMove={moveCatToRoom}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            dropId="unassigned"
            isActiveDropZone={activeDropZone === "unassigned"}
            draggingCatKey={dragState?.catKey ?? null}
            emptyMessage={
              cats.length === 0
                ? "Import a CSV to start building your room plan."
                : "No unassigned cats match the current filters."
            }
            sx={{ flex: 1.15, minWidth: 0, width: "100%" }}
          />

          <Stack spacing={2} sx={{ flex: 1, minWidth: 0, width: "100%" }}>
            {roomNames.map((roomName) => (
              <DropZoneSection
                key={roomName}
                title={roomName}
                subtitle="Drop cats here to assign the room."
                count={visibleRoomCats[roomName].length}
                averageLabel={`Avg total stats ${averageStatSum(
                  visibleRoomCats[roomName],
                )}`}
                cats={visibleRoomCats[roomName]}
                roomNames={roomNames}
                getRoomForCat={() => roomName}
                onMove={moveCatToRoom}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                dropId={roomName}
                isActiveDropZone={activeDropZone === roomName}
                draggingCatKey={dragState?.catKey ?? null}
                emptyMessage="No cats in this room yet."
              />
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
}

function DropZoneSection({
  title,
  subtitle,
  count,
  averageLabel,
  cats,
  roomNames,
  getRoomForCat,
  onMove,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  dropId,
  isActiveDropZone,
  draggingCatKey,
  emptyMessage,
  sx,
}: {
  title: string;
  subtitle: string;
  count: number;
  averageLabel: string;
  cats: CatRow[];
  roomNames: string[];
  getRoomForCat: (key: string) => RoomDestination;
  onMove: (key: string, destination: RoomDestination) => void;
  onDragStart: (
    event: DragEvent<HTMLElement>,
    catKey: string,
    fromRoom: RoomDestination,
  ) => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLElement>, destination: RoomDestination) => void;
  onDragLeave: (
    event: DragEvent<HTMLElement>,
    destination: RoomDestination,
  ) => void;
  onDrop: (event: DragEvent<HTMLElement>, destination: RoomDestination) => void;
  dropId: RoomDestination;
  isActiveDropZone: boolean;
  draggingCatKey: string | null;
  emptyMessage: string;
  sx?: Record<string, unknown>;
}) {
  return (
    <Card
      onDragOver={(event) => onDragOver(event, dropId)}
      onDragLeave={(event) => onDragLeave(event, dropId)}
      onDrop={(event) => onDrop(event, dropId)}
      sx={{
        borderRadius: 5,
        border: isActiveDropZone
          ? "1px solid rgba(63, 122, 224, 0.45)"
          : "1px solid rgba(15, 23, 42, 0.08)",
        background: isActiveDropZone
          ? "linear-gradient(180deg, rgba(239,245,255,0.98), rgba(255,255,255,0.98))"
          : "rgba(255,255,255,0.96)",
        boxShadow: isActiveDropZone
          ? "0 20px 45px rgba(63, 122, 224, 0.14)"
          : "0 12px 32px rgba(15, 23, 42, 0.06)",
        transition: "border-color 180ms ease, box-shadow 180ms ease, background 180ms ease",
        ...sx,
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={1}
          >
            <Box>
              <Typography variant="h5" fontWeight={800}>
                {title}
              </Typography>
              <Typography color="text.secondary">{subtitle}</Typography>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={`${count} cats`} size="small" color="primary" />
              <Chip label={averageLabel} size="small" variant="outlined" />
            </Stack>
          </Stack>

          {isActiveDropZone ? (
            <Box
              sx={{
                borderRadius: 3,
                border: "1px dashed rgba(63, 122, 224, 0.45)",
                background: "rgba(63, 122, 224, 0.08)",
                px: 1.5,
                py: 1,
              }}
            >
              <Typography fontWeight={700} color="primary.main">
                Release to drop here
              </Typography>
            </Box>
          ) : null}

          {cats.length === 0 ? (
            <Box
              sx={{
                borderRadius: 4,
                border: "1px dashed rgba(15, 23, 42, 0.14)",
                px: 2,
                py: 3,
                textAlign: "center",
                color: "text.secondary",
              }}
            >
              {draggingCatKey ? "Drop a cat here." : emptyMessage}
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 1.5,
              }}
            >
              {cats.map((cat) => (
                <CatCard
                  key={cat.key}
                  cat={cat}
                  currentRoom={getRoomForCat(cat.key)}
                  roomNames={roomNames}
                  onMove={onMove}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  isDragging={draggingCatKey === cat.key}
                />
              ))}
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function CatCard({
  cat,
  currentRoom,
  roomNames,
  onMove,
  onDragStart,
  onDragEnd,
  isDragging,
}: {
  cat: CatRow;
  currentRoom: RoomDestination;
  roomNames: string[];
  onMove: (key: string, destination: RoomDestination) => void;
  onDragStart: (
    event: DragEvent<HTMLElement>,
    catKey: string,
    fromRoom: RoomDestination,
  ) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  const accent = catAccent(cat);

  return (
    <Card
      draggable
      onDragStart={(event) => onDragStart(event, cat.key, currentRoom)}
      onDragEnd={onDragEnd}
      sx={{
        position: "relative",
        borderRadius: 4,
        border: `1px solid ${accent}22`,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(249,250,251,0.98))",
        boxShadow: isDragging
          ? "0 10px 24px rgba(15, 23, 42, 0.08)"
          : "0 10px 24px rgba(15, 23, 42, 0.05)",
        opacity: isDragging ? 0.48 : 1,
        transform: isDragging ? "scale(0.985)" : "translateY(0)",
        transition: "transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 16px 32px rgba(15, 23, 42, 0.08)",
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: "0 auto 0 0",
          width: 5,
          borderTopLeftRadius: 16,
          borderBottomLeftRadius: 16,
          background: accent,
        }}
      />

      <CardContent sx={{ p: 2, pl: 2.5 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" spacing={1.5}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={800} noWrap>
                {cat.name}
              </Typography>
              <Typography color="text.secondary" variant="body2" noWrap>
                {cat.key} · {cat.token}
              </Typography>
            </Box>

            <Box
              sx={{
                flexShrink: 0,
                borderRadius: 999,
                background: accent,
                color: "#fff",
                px: 1.2,
                py: 0.6,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Total {catStatSum(cat)}
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              label={`${cat.token_kind}${cat.token_id ? ` ${cat.token_id}` : ""}`}
              sx={{
                background: `${accent}16`,
                color: accent,
                fontWeight: 700,
              }}
            />
            <Chip
              size="small"
              variant="outlined"
              label={currentRoom === "unassigned" ? "Ready to assign" : currentRoom}
            />
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 1,
            }}
          >
            {STAT_KEYS.map((key) => (
              <Box
                key={key}
                sx={{
                  borderRadius: 2,
                  background: "rgba(15, 23, 42, 0.04)",
                  px: 1,
                  py: 0.9,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {key}
                </Typography>
                <Typography fontWeight={700}>{cat[key]}</Typography>
              </Box>
            ))}
          </Box>

          <Typography variant="caption" color="text.secondary">
            Drag this card to another room, or use quick move below.
          </Typography>

          <Box
            component="label"
            sx={{
              display: "grid",
              gap: 0.5,
              fontSize: 12,
              color: "text.secondary",
            }}
          >
            Quick move
            <select
              aria-label={`Move ${cat.name}`}
              value={currentRoom}
              onChange={(event) =>
                onMove(cat.key, event.target.value as RoomDestination)
              }
              style={quickMoveSelectStyle}
            >
              <option value="unassigned">Unassigned</option>
              {roomNames.map((roomName) => (
                <option key={roomName} value={roomName}>
                  {roomName}
                </option>
              ))}
            </select>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

const primaryActionSx = {
  minWidth: { xs: "100%", md: 180 },
  boxShadow: "none",
};

const quickMoveSelectStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid rgba(148, 163, 184, 0.45)",
  background: "#fff",
  padding: "10px 12px",
  fontSize: 14,
  color: "#0f172a",
  outline: "none",
};
