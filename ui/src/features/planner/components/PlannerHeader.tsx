import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { primaryActionSx } from "../styles";

type PlannerHeaderProps = {
  assignedCount: number;
  filteredCount: number;
  genderFilter: string;
  newRoomName: string;
  onAddRoom: () => void;
  onClearAllRooms: () => void;
  onGenderFilterChange: (value: string) => void;
  onImportCsv: (file: File) => void;
  onNewRoomNameChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  roomCount: number;
  search: string;
  tokenKinds: string[];
  totalValidCats: number;
};

export function PlannerHeader({
  assignedCount,
  filteredCount,
  genderFilter,
  newRoomName,
  onAddRoom,
  onClearAllRooms,
  onGenderFilterChange,
  onImportCsv,
  onNewRoomNameChange,
  onSearchChange,
  roomCount,
  search,
  tokenKinds,
  totalValidCats,
}: PlannerHeaderProps) {
  return (
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
            <Chip label={`${roomCount} rooms`} variant="outlined" />
            <Chip label={`${filteredCount} visible after filters`} variant="outlined" />
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
                  if (file) onImportCsv(file);
                }}
              />
            </Button>

            <TextField
              label="Search name, key, or token"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              size="small"
              sx={{ width: { xs: "100%", md: 300 } }}
            />

            <FormControl size="small" sx={{ width: { xs: "100%", md: 220 } }}>
              <InputLabel>Gender / Type</InputLabel>
              <Select
                label="Gender / Type"
                value={genderFilter}
                onChange={(event) => onGenderFilterChange(event.target.value)}
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
              onClick={onClearAllRooms}
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
              onChange={(event) => onNewRoomNameChange(event.target.value)}
              sx={{ width: { xs: "100%", md: 280 } }}
            />
            <Button
              variant="outlined"
              onClick={onAddRoom}
              sx={{ width: { xs: "100%", md: "auto" } }}
            >
              Add room
            </Button>
            <Typography color="text.secondary">
              Rooms are UI groupings for now. Once you decode the real in-game room
              data, these assignments can map to that model.
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
