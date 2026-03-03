import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  Box,
  Button,
  Card,
  CardContent,
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

type RoomsState = Record<string, string[]>; // roomName -> cat keys

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

function catStatSum(c: CatRow) {
  return STAT_KEYS.reduce((acc, k) => acc + (Number(c[k]) || 0), 0);
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

  // persist rooms
  useEffect(() => saveRooms(rooms), [rooms]);

  const catsByKey = useMemo(() => {
    const m = new Map<string, CatRow>();
    for (const c of cats) m.set(c.key, c);
    return m;
  }, [cats]);

  const assignedKeys = useMemo(() => {
    const s = new Set<string>();
    for (const keys of Object.values(rooms)) keys.forEach((k) => s.add(k));
    return s;
  }, [rooms]);

  const filteredCats = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cats.filter((c) => {
      if (c.error && c.error.length > 0) return false; // hide broken rows by default
      if (genderFilter !== "all" && c.token_kind !== genderFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.key.toLowerCase().includes(q) ||
        c.token.toLowerCase().includes(q)
      );
    });
  }, [cats, search, genderFilter]);

  const unassigned = useMemo(
    () => filteredCats.filter((c) => !assignedKeys.has(c.key)),
    [filteredCats, assignedKeys],
  );

  const tokenKinds = useMemo(() => {
    const s = new Set<string>();
    for (const c of cats) {
      if (c.token_kind) s.add(c.token_kind);
    }
    return Array.from(s).sort();
  }, [cats]);

  function importCsv(file: File) {
    Papa.parse<CatRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        setCats(res.data.filter((r) => r.key)); // basic sanity
      },
    });
  }

  function addRoom() {
    const name = newRoomName.trim();
    if (!name) return;
    if (roomNames.includes(name)) return;
    setRoomNames((prev) => [...prev, name]);
    setNewRoomName("");
  }

  function moveCatToRoom(catKey: string, destRoom: string | "unassigned") {
    setRooms((prev) => {
      const next: RoomsState = {};
      // remove from all rooms
      for (const rn of Object.keys(prev)) {
        next[rn] = prev[rn].filter((k) => k !== catKey);
      }
      if (destRoom !== "unassigned") {
        next[destRoom] = next[destRoom] ?? [];
        if (!next[destRoom].includes(catKey)) next[destRoom].push(catKey);
      }
      // ensure any rooms not in prev still exist
      for (const rn of roomNames) next[rn] = next[rn] ?? [];
      return next;
    });
  }

  function clearAllRooms() {
    setRooms({});
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h4" fontWeight={800}>
          Mewgenics Cat Room Manager
        </Typography>

        <Card>
          <CardContent>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems="center"
            >
              <Button variant="contained" component="label">
                Import cats CSV
                <input
                  hidden
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) importCsv(f);
                  }}
                />
              </Button>

              <TextField
                label="Search (name, key, token)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                sx={{ minWidth: 280 }}
              />

              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Gender/Type</InputLabel>
                <Select
                  label="Gender/Type"
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  {tokenKinds.map((k) => (
                    <MenuItem key={k} value={k}>
                      {k}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box flex={1} />

              <Button
                variant="outlined"
                color="warning"
                onClick={clearAllRooms}
              >
                Clear room assignments
              </Button>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems="center"
            >
              <TextField
                label="New room name"
                size="small"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                sx={{ minWidth: 260 }}
              />
              <Button variant="outlined" onClick={addRoom}>
                Add room
              </Button>
              <Typography color="text.secondary">
                Rooms are just UI groupings for now (we’ll wire to real “in-game
                room” once decoded).
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={2}
          alignItems="flex-start"
        >
          {/* Unassigned */}
          <Card sx={{ flex: 1, minWidth: 420 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800}>
                Unassigned Cats ({unassigned.length})
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                Move cats into rooms to plan breeding setups.
              </Typography>
              <CatTable
                cats={unassigned}
                roomNames={roomNames}
                getRoom={(key) => "unassigned"}
                onMove={moveCatToRoom}
              />
            </CardContent>
          </Card>

          {/* Rooms */}
          <Stack spacing={2} sx={{ flex: 2, minWidth: 520 }}>
            {roomNames.map((rn) => {
              const keys = rooms[rn] ?? [];
              const roomCats = keys
                .map((k) => catsByKey.get(k))
                .filter(Boolean) as CatRow[];
              const shown = roomCats.filter((c) =>
                filteredCats.some((x) => x.key === c.key),
              );
              return (
                <Card key={rn}>
                  <CardContent>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="h6" fontWeight={800}>
                        {rn} ({shown.length})
                      </Typography>
                      <Typography color="text.secondary">
                        Avg sum:{" "}
                        {shown.length
                          ? (
                              shown.reduce((a, c) => a + catStatSum(c), 0) /
                              shown.length
                            ).toFixed(1)
                          : "—"}
                      </Typography>
                    </Stack>

                    <CatTable
                      cats={shown}
                      roomNames={roomNames}
                      getRoom={() => rn}
                      onMove={moveCatToRoom}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
}

function CatTable({
  cats,
  roomNames,
  getRoom,
  onMove,
}: {
  cats: CatRow[];
  roomNames: string[];
  getRoom: (key: string) => string | "unassigned";
  onMove: (key: string, dest: string | "unassigned") => void;
}) {
  return (
    <Box sx={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
      >
        <thead>
          <tr style={{ textAlign: "left" }}>
            <th style={th}>Name</th>
            <th style={th}>Key</th>
            <th style={th}>Gender/Type</th>
            {STAT_KEYS.map((k) => (
              <th key={k} style={th}>
                {k}
              </th>
            ))}
            <th style={th}>Sum</th>
            <th style={th}>Move</th>
          </tr>
        </thead>
        <tbody>
          {cats.map((c) => (
            <tr key={c.key}>
              <td style={tdStrong}>{c.name}</td>
              <td style={td}>{c.key}</td>
              <td style={td}>
                {c.token_kind}
                {c.token_id ? ` ${c.token_id}` : ""}
              </td>
              {STAT_KEYS.map((k) => (
                <td key={k} style={td}>
                  {c[k]}
                </td>
              ))}
              <td style={td}>
                {STAT_KEYS.reduce((a, k) => a + (Number(c[k]) || 0), 0)}
              </td>
              <td style={td}>
                <select
                  value={getRoom(c.key)}
                  onChange={(e) => onMove(c.key, e.target.value as any)}
                >
                  <option value="unassigned">Unassigned</option>
                  {roomNames.map((rn) => (
                    <option key={rn} value={rn}>
                      {rn}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
          {cats.length === 0 ? (
            <tr>
              <td style={td} colSpan={STAT_KEYS.length + 6}>
                <span style={{ color: "#777" }}>No cats to show.</span>
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </Box>
  );
}

const th: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid #ddd",
  whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid #eee",
  whiteSpace: "nowrap",
};
const tdStrong: React.CSSProperties = {
  ...td,
  fontWeight: 700,
};
