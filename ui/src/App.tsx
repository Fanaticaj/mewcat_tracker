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
type StatKey = (typeof STAT_KEYS)[number];
type RoomStatLeader = {
  stat: StatKey;
  maxValue: number;
  leaders: CatRow[];
};
type PairInsight = {
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

function getStatValue(cat: CatRow, stat: StatKey) {
  return Number(cat[stat]) || 0;
}

function buildRoomStatLeaders(cats: CatRow[]): RoomStatLeader[] {
  return STAT_KEYS.map((stat) => {
    const maxValue = Math.max(...cats.map((cat) => getStatValue(cat, stat)));
    return {
      stat,
      maxValue,
      leaders: cats.filter((cat) => getStatValue(cat, stat) === maxValue),
    };
  });
}

function buildPairInsight(first: CatRow, second: CatRow): PairInsight {
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

function buildRoomPairInsights(cats: CatRow[]) {
  const insights: PairInsight[] = [];

  for (let i = 0; i < cats.length; i += 1) {
    for (let j = i + 1; j < cats.length; j += 1) {
      insights.push(buildPairInsight(cats[i], cats[j]));
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

function formatStatList(stats: StatKey[]) {
  return stats.length > 0 ? stats.join(", ") : "None";
}

function getPairTone(insight: PairInsight) {
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

function getPairNarrative(insight: PairInsight) {
  if (insight.complementaryPerfectStats.length > 0) {
    return `${insight.first.name} and ${insight.second.name} cover different perfect 7s, so this room can push a broader kitten ceiling.`;
  }

  if (insight.sharedPerfectStats.length > 0) {
    return "Both cats peak on the same perfect stats, so this pairing is steadier but adds less new ceiling.";
  }

  return "No perfect 7 handoff yet, so this pairing mainly improves the room's 6+ floor.";
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

  const totalValidCats = cats.filter(
    (cat) => !(cat.error && cat.error.length > 0),
  ).length;
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
  const isRoomSection = dropId !== "unassigned";
  const roomStatLeaders = isRoomSection ? buildRoomStatLeaders(cats) : [];
  const topPairInsights =
    isRoomSection && cats.length >= 2 ? buildRoomPairInsights(cats).slice(0, 3) : [];

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
        transition:
          "border-color 180ms ease, box-shadow 180ms ease, background 180ms ease",
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

          {isRoomSection && cats.length > 0 ? (
            <RoomInsights
              cats={cats}
              roomStatLeaders={roomStatLeaders}
              topPairInsights={topPairInsights}
            />
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
                gridTemplateColumns: "repeat(auto-fill, minmax(216px, 1fr))",
                gap: 1.25,
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

function RoomInsights({
  cats,
  roomStatLeaders,
  topPairInsights,
}: {
  cats: CatRow[];
  roomStatLeaders: RoomStatLeader[];
  topPairInsights: PairInsight[];
}) {
  const bestPair = topPairInsights[0] ?? null;
  const alternativePairs = topPairInsights.slice(1);
  const bestPairTone = bestPair ? getPairTone(bestPair) : null;

  return (
    <Box
      sx={{
        borderRadius: 4,
        border: "1px solid rgba(59, 130, 246, 0.12)",
        background:
          "linear-gradient(180deg, rgba(244,248,255,0.96), rgba(255,255,255,0.98))",
        p: { xs: 1.35, md: 1.5 },
      }}
    >
      <Stack spacing={1.25}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1}
        >
          <Box>
            <Typography
              variant="overline"
              sx={{ letterSpacing: "0.08em", color: "primary.main" }}
            >
              Breeding Outlook
            </Typography>
            <Typography variant="body2" color="text.secondary">
              See which cats own each room&apos;s best stats and which pairs create
              the strongest kitten ceilings.
            </Typography>
          </Box>
          <Chip
            size="small"
            color="primary"
            variant="outlined"
            label={`${cats.length} cats in play`}
          />
        </Stack>

        {bestPair ? (
          <Box
            sx={{
              ...featuredInsightSx,
              borderColor: bestPairTone?.border,
              background: bestPairTone?.background,
            }}
          >
            <Stack spacing={1.15}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                spacing={1}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="overline"
                    sx={{ display: "block", color: "text.secondary", letterSpacing: "0.08em" }}
                  >
                    Best next pair
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: { xs: "1.05rem", md: "1.18rem" },
                      lineHeight: 1.15,
                      fontWeight: 800,
                    }}
                  >
                    {bestPair.first.name} + {bestPair.second.name}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.45, fontSize: 13 }}>
                    {getPairNarrative(bestPair)}
                  </Typography>
                </Box>

                <Chip
                  size="small"
                  label={bestPairTone?.label}
                  sx={{
                    alignSelf: { xs: "flex-start", md: "center" },
                    fontWeight: 700,
                    color: bestPairTone?.accent,
                    background: "rgba(255,255,255,0.72)",
                    border: `1px solid ${bestPairTone?.border}`,
                  }}
                />
              </Stack>

              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                <Chip
                  size="small"
                  color="success"
                  label={`${bestPair.perfectStats.length} perfect 7s`}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${bestPair.strongStats.length} stats at 6+`}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Ceiling total ${bestPair.combinedTotal}`}
                />
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(3, minmax(0, 1fr))",
                  },
                  gap: 0.85,
                }}
              >
                <Box sx={contributionCardSx}>
                  <Typography variant="caption" color="text.secondary">
                    {bestPair.first.name}
                  </Typography>
                  <Typography sx={{ mt: 0.45, fontWeight: 700 }}>
                    {formatStatList(bestPair.firstExclusivePerfectStats)}
                  </Typography>
                  <Typography sx={{ mt: 0.35, fontSize: 11.5, color: "text.secondary" }}>
                    Unique perfect 7s this cat brings in.
                  </Typography>
                </Box>

                <Box
                  sx={{
                    ...contributionCardSx,
                    background:
                      bestPair.sharedPerfectStats.length > 0
                        ? "rgba(255,255,255,0.84)"
                        : "rgba(255,255,255,0.56)",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Shared perfect 7s
                  </Typography>
                  <Typography sx={{ mt: 0.45, fontWeight: 700 }}>
                    {formatStatList(bestPair.sharedPerfectStats)}
                  </Typography>
                  <Typography sx={{ mt: 0.35, fontSize: 11.5, color: "text.secondary" }}>
                    Shared peaks mean less new upside from breeding them together.
                  </Typography>
                </Box>

                <Box sx={contributionCardSx}>
                  <Typography variant="caption" color="text.secondary">
                    {bestPair.second.name}
                  </Typography>
                  <Typography sx={{ mt: 0.45, fontWeight: 700 }}>
                    {formatStatList(bestPair.secondExclusivePerfectStats)}
                  </Typography>
                  <Typography sx={{ mt: 0.35, fontSize: 11.5, color: "text.secondary" }}>
                    Unique perfect 7s this cat adds to the pairing.
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  sx={{ display: "block", mb: 0.65, color: "text.secondary" }}
                >
                  Kitten ceiling by stat
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                    gap: 0.5,
                  }}
                >
                  {STAT_KEYS.map((stat) => {
                    const value = bestPair.combinedMax[stat];
                    const isPerfect = value === 7;

                    return (
                      <Box
                        key={stat}
                        sx={{
                          minWidth: 0,
                          borderRadius: 2.2,
                          border: isPerfect
                            ? "1px solid rgba(34, 197, 94, 0.24)"
                            : "1px solid rgba(148, 163, 184, 0.18)",
                          background: isPerfect
                            ? "rgba(255,255,255,0.84)"
                            : "rgba(255,255,255,0.6)",
                          px: 0.45,
                          py: 0.65,
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", fontSize: 9.5, lineHeight: 1 }}
                        >
                          {stat}
                        </Typography>
                        <Typography
                          sx={{
                            mt: 0.25,
                            fontSize: 15,
                            lineHeight: 1,
                            fontWeight: 800,
                            color: isPerfect ? "#15803d" : "text.primary",
                          }}
                        >
                          {value}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Stack>
          </Box>
        ) : null}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              xl: alternativePairs.length > 0 ? "1fr 1fr" : "1fr",
            },
            gap: 1.1,
          }}
        >
          <Box sx={analysisPanelSx}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.95 }}>
              Room ceiling by stat
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: 12.5, mb: 1 }}>
              Quickly see who holds the room&apos;s best number in each trait.
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  sm: "repeat(4, minmax(0, 1fr))",
                  lg: "repeat(7, minmax(0, 1fr))",
                },
                gap: 0.75,
              }}
            >
              {roomStatLeaders.map((leader) => (
                <Box
                  key={leader.stat}
                  sx={{
                    minWidth: 0,
                    borderRadius: 2.5,
                    border:
                      leader.maxValue === 7
                        ? "1px solid rgba(34, 197, 94, 0.2)"
                        : "1px solid rgba(148, 163, 184, 0.18)",
                    background:
                      leader.maxValue === 7
                        ? "linear-gradient(180deg, rgba(240,253,244,0.96), rgba(255,255,255,0.9))"
                        : "rgba(255, 255, 255, 0.82)",
                    px: 0.85,
                    py: 0.8,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", lineHeight: 1 }}
                  >
                    {leader.stat}
                  </Typography>
                  <Typography sx={{ mt: 0.4, fontSize: 18, fontWeight: 800, lineHeight: 1 }}>
                    {leader.maxValue}
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      fontSize: 11,
                      lineHeight: 1.25,
                      display: "-webkit-box",
                      overflow: "hidden",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 2,
                    }}
                  >
                    {leader.leaders.map((cat) => cat.name).join(", ")}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.35,
                      fontSize: 10.5,
                      color: leader.leaders.length > 1 ? "#b45309" : "#475569",
                    }}
                  >
                    {leader.leaders.length > 1 ? "Shared lead" : "Primary owner"}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {alternativePairs.length > 0 ? (
            <Box sx={analysisPanelSx}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.95 }}>
                Other viable pairings
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: 12.5, mb: 1 }}>
                Compare backup pairings when the top recommendation is occupied elsewhere.
              </Typography>
              <Stack spacing={1}>
                {alternativePairs.map((insight) => (
                  <PairInsightCard
                    key={`${insight.first.key}-${insight.second.key}`}
                    insight={insight}
                  />
                ))}
              </Stack>
            </Box>
          ) : null}
        </Box>
      </Stack>
    </Box>
  );
}

function PairInsightCard({ insight }: { insight: PairInsight }) {
  const tone = getPairTone(insight);
  const summary =
    insight.complementaryPerfectStats.length > 0
      ? `Complementary 7s: ${insight.complementaryPerfectStats.join(", ")}`
      : insight.sharedPerfectStats.length > 0
        ? `Only shared 7s: ${insight.sharedPerfectStats.join(", ")}`
        : "No perfect 7 crossover yet";

  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${tone.border}`,
        background: tone.background,
        p: 1.05,
      }}
    >
      <Stack spacing={0.9}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={0.75}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={800} sx={{ lineHeight: 1.2, fontSize: 14.5 }}>
              {insight.first.name} + {insight.second.name}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: 12 }}>
              Ceiling total {insight.combinedTotal} across best inherited stats
            </Typography>
          </Box>

          <Chip
            size="small"
            label={tone.label}
            sx={{
              alignSelf: { xs: "flex-start", sm: "center" },
              fontWeight: 700,
              color: tone.accent,
              background: "rgba(255,255,255,0.74)",
              border: `1px solid ${tone.border}`,
            }}
          />
        </Stack>

        <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            color="success"
            label={`${insight.perfectStats.length} perfect`}
          />
          <Chip
            size="small"
            variant="outlined"
            label={`${insight.strongStats.length} at 6+`}
          />
        </Stack>

        <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>
          {summary}
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
            gap: 0.55,
          }}
        >
          <Box sx={pairDetailPillSx}>
            <Typography variant="caption" color="text.secondary">
              {insight.first.name}
            </Typography>
            <Typography sx={{ mt: 0.25, fontSize: 12.5, fontWeight: 700 }}>
              {formatStatList(insight.firstExclusivePerfectStats)}
            </Typography>
          </Box>
          <Box sx={pairDetailPillSx}>
            <Typography variant="caption" color="text.secondary">
              Shared
            </Typography>
            <Typography sx={{ mt: 0.25, fontSize: 12.5, fontWeight: 700 }}>
              {formatStatList(insight.sharedPerfectStats)}
            </Typography>
          </Box>
          <Box sx={pairDetailPillSx}>
            <Typography variant="caption" color="text.secondary">
              {insight.second.name}
            </Typography>
            <Typography sx={{ mt: 0.25, fontSize: 12.5, fontWeight: 700 }}>
              {formatStatList(insight.secondExclusivePerfectStats)}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: 0.45,
          }}
        >
          {STAT_KEYS.map((stat) => {
            const value = insight.combinedMax[stat];
            const isPerfect = value === 7;

            return (
              <Box
                key={stat}
                sx={{
                  minWidth: 0,
                  borderRadius: 2,
                  border: isPerfect
                    ? "1px solid rgba(34, 197, 94, 0.24)"
                    : "1px solid rgba(148, 163, 184, 0.18)",
                  background: isPerfect
                    ? "rgba(255,255,255,0.82)"
                    : "rgba(248,250,252,0.84)",
                  px: 0.35,
                  py: 0.55,
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", fontSize: 9.5, lineHeight: 1 }}
                >
                  {stat}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.25,
                    fontSize: 15,
                    fontWeight: 800,
                    lineHeight: 1,
                    color: isPerfect ? "#15803d" : "text.primary",
                  }}
                >
                  {value}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Stack>
    </Box>
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
        overflow: "hidden",
        borderRadius: 3.5,
        border: `1px solid ${accent}26`,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.99), rgba(248,250,252,0.99))",
        boxShadow: isDragging
          ? "0 12px 28px rgba(15, 23, 42, 0.10)"
          : "0 8px 18px rgba(15, 23, 42, 0.06)",
        opacity: isDragging ? 0.52 : 1,
        transform: isDragging ? "scale(0.985)" : "translateY(0)",
        transition:
          "transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease",
        "&:hover": {
          transform: "translateY(-1px)",
          boxShadow: "0 12px 24px rgba(15, 23, 42, 0.09)",
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: "0 auto 0 0",
          width: 4,
          background: accent,
        }}
      />

      <CardContent sx={{ p: 1.5, pl: 2.2 }}>
        <Stack spacing={1.25}>
          <Stack direction="row" justifyContent="space-between" spacing={1.25}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="subtitle1"
                fontWeight={800}
                sx={{
                  fontSize: "1rem",
                  lineHeight: 1.15,
                  display: "-webkit-box",
                  overflow: "hidden",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 2,
                }}
              >
                {cat.name}
              </Typography>
              <Typography
                color="text.secondary"
                variant="body2"
                sx={{ mt: 0.35, fontSize: 12.5 }}
              >
                #{cat.key} / {cat.token}
              </Typography>
            </Box>

            <Box
              sx={{
                flexShrink: 0,
                minWidth: 68,
                borderRadius: 2.5,
                background: `linear-gradient(180deg, ${accent}, ${accent}cc)`,
                color: "#fff",
                px: 1,
                py: 0.85,
                display: "grid",
                placeItems: "center",
                alignSelf: "center",
                textAlign: "center",
                boxShadow: `inset 0 1px 0 ${accent}55`,
              }}
            >
              <Typography sx={{ fontSize: 10, lineHeight: 1, opacity: 0.86 }}>
                TOTAL
              </Typography>
              <Typography sx={{ fontSize: 17, lineHeight: 1.1, fontWeight: 800 }}>
                {catStatSum(cat)}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              label={`${cat.token_kind}${cat.token_id ? ` ${cat.token_id}` : ""}`}
              sx={{
                height: 24,
                background: `${accent}16`,
                color: accent,
                fontWeight: 700,
                "& .MuiChip-label": { px: 1, fontSize: 12 },
              }}
            />
            <Chip
              size="small"
              variant="outlined"
              label={currentRoom === "unassigned" ? "Ready to assign" : currentRoom}
              sx={{
                height: 24,
                "& .MuiChip-label": { px: 1, fontSize: 12 },
              }}
            />
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              gap: 0.5,
            }}
          >
            {STAT_KEYS.map((key) => (
              <Box
                key={key}
                sx={{
                  minWidth: 0,
                  borderRadius: 2,
                  border: "1px solid rgba(148, 163, 184, 0.18)",
                  background: "rgba(15, 23, 42, 0.03)",
                  px: 0.45,
                  py: 0.7,
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", fontSize: 10, lineHeight: 1 }}
                >
                  {key}
                </Typography>
                <Typography
                  sx={{ mt: 0.3, fontSize: 16, fontWeight: 800, lineHeight: 1 }}
                >
                  {cat[key]}
                </Typography>
              </Box>
            ))}
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ pt: 0.25 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                flexShrink: 0,
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}
            >
              MOVE
            </Typography>
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
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

const primaryActionSx = {
  minWidth: { xs: "100%", md: 180 },
  boxShadow: "none",
};

const analysisPanelSx = {
  borderRadius: 3,
  border: "1px solid rgba(148, 163, 184, 0.16)",
  background: "rgba(255,255,255,0.76)",
  p: 1.1,
};

const featuredInsightSx = {
  borderRadius: 3.5,
  border: "1px solid rgba(148, 163, 184, 0.18)",
  p: 1.2,
};

const contributionCardSx = {
  minWidth: 0,
  borderRadius: 2.75,
  border: "1px solid rgba(255,255,255,0.72)",
  background: "rgba(255,255,255,0.72)",
  px: 0.95,
  py: 0.9,
};

const pairDetailPillSx = {
  minWidth: 0,
  borderRadius: 2.2,
  border: "1px solid rgba(255,255,255,0.72)",
  background: "rgba(255,255,255,0.68)",
  px: 0.75,
  py: 0.65,
};

const quickMoveSelectStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 10,
  border: "1px solid rgba(148, 163, 184, 0.35)",
  background: "rgba(255, 255, 255, 0.92)",
  padding: "8px 10px",
  fontSize: 13,
  lineHeight: 1.2,
  color: "#0f172a",
  outline: "none",
  minHeight: "36px",
  boxShadow: "inset 0 1px 2px rgba(15, 23, 42, 0.04)",
};
