import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { STAT_KEYS } from "../constants";
import { primaryActionSx } from "../styles";
import type { SortDirection, SortField, StatFilterState } from "../types";

type PlannerHeaderProps = {
  assignedCount: number;
  eligibleUnassignedCount: number;
  filteredCount: number;
  genderFilter: string;
  newRoomName: string;
  onAddRoom: () => void;
  onAutoAssignEligibleCats: () => void;
  onClearAllRooms: () => void;
  onExportRoomFile: () => void;
  onGenderFilterChange: (value: string) => void;
  onImportCsv: (file: File) => void;
  onImportRoomFile: (file: File) => void;
  onNewRoomNameChange: (value: string) => void;
  onResetStatFilters: () => void;
  onSearchChange: (value: string) => void;
  onSortDirectionChange: (value: SortDirection) => void;
  onSortFieldChange: (value: SortField) => void;
  onStatFilterChange: (stat: keyof StatFilterState, value: string) => void;
  plannerMessage: string;
  plannerMessageTone: "info" | "success" | "error";
  roomCount: number;
  search: string;
  sortDirection: SortDirection;
  sortField: SortField;
  statFilters: StatFilterState;
  tokenKinds: string[];
  totalValidCats: number;
};

const sortFieldOptions: Array<{ label: string; value: SortField }> = [
  { label: "Name", value: "name" },
  { label: "Total stats", value: "total" },
  ...STAT_KEYS.map((stat) => ({ label: stat, value: stat })),
];

export function PlannerHeader({
  assignedCount,
  eligibleUnassignedCount,
  filteredCount,
  genderFilter,
  newRoomName,
  onAddRoom,
  onAutoAssignEligibleCats,
  onClearAllRooms,
  onExportRoomFile,
  onGenderFilterChange,
  onImportCsv,
  onImportRoomFile,
  onNewRoomNameChange,
  onResetStatFilters,
  onSearchChange,
  onSortDirectionChange,
  onSortFieldChange,
  onStatFilterChange,
  plannerMessage,
  plannerMessageTone,
  roomCount,
  search,
  sortDirection,
  sortField,
  statFilters,
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
            <Typography color="text.secondary" sx={{ maxWidth: 820 }}>
              Filter and sort the current roster, then save room plans to JSON so
              you can revisit or share a breeding layout outside the browser.
            </Typography>
          </Box>

          {plannerMessage ? (
            <Alert severity={plannerMessageTone} sx={{ borderRadius: 3 }}>
              {plannerMessage}
            </Alert>
          ) : null}

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label={`${totalValidCats} cats loaded`} color="primary" />
            <Chip label={`${assignedCount} assigned`} variant="outlined" />
            <Chip label={`${roomCount} rooms`} variant="outlined" />
            <Chip
              label={`${eligibleUnassignedCount} eligible for auto-assign`}
              variant="outlined"
              color="success"
            />
            <Chip label={`${filteredCount} visible after filters`} variant="outlined" />
          </Stack>

          <Stack
            direction={{ xs: "column", xl: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", xl: "center" }}
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
                  event.target.value = "";
                }}
              />
            </Button>

            <Button variant="outlined" component="label">
              Load room file
              <input
                hidden
                type="file"
                accept=".json,application/json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onImportRoomFile(file);
                  event.target.value = "";
                }}
              />
            </Button>

            <Button variant="outlined" onClick={onExportRoomFile}>
              Save room file
            </Button>

            <Box sx={{ flex: 1, display: { xs: "none", xl: "block" } }} />

            <Button
              variant="contained"
              color="success"
              onClick={onAutoAssignEligibleCats}
              disabled={eligibleUnassignedCount === 0 || roomCount === 0}
              sx={{ width: { xs: "100%", xl: "auto" } }}
            >
              Auto-assign eligible cats
            </Button>

            <Button
              variant="outlined"
              color="warning"
              onClick={onClearAllRooms}
              sx={{ width: { xs: "100%", xl: "auto" } }}
            >
              Clear room assignments
            </Button>
          </Stack>

          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, md: 6, xl: 4 }}>
              <TextField
                fullWidth
                label="Search name, key, or token"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, xl: 2.5 }}>
              <FormControl fullWidth size="small">
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
            </Grid>

            <Grid size={{ xs: 12, sm: 6, xl: 2.5 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort by</InputLabel>
                <Select
                  label="Sort by"
                  value={sortField}
                  onChange={(event) => onSortFieldChange(event.target.value as SortField)}
                >
                  {sortFieldOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Direction</InputLabel>
                <Select
                  label="Direction"
                  value={sortDirection}
                  onChange={(event) =>
                    onSortDirectionChange(event.target.value as SortDirection)
                  }
                >
                  <MenuItem value="asc">Ascending</MenuItem>
                  <MenuItem value="desc">Descending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider />

          <Stack spacing={1.5}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={1}
            >
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  Stat floor filters
                </Typography>
                <Typography color="text.secondary">
                  Leave a field blank to ignore it. A value of `6` means show only cats
                  with at least 6 in that stat.
                </Typography>
              </Box>

              <Button variant="text" onClick={onResetStatFilters}>
                Reset stat filters
              </Button>
            </Stack>

            <Grid container spacing={1.25}>
              {STAT_KEYS.map((stat) => (
                <Grid key={stat} size={{ xs: 6, sm: 3, lg: "grow" }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={`${stat} min`}
                    value={statFilters[stat]}
                    onChange={(event) => onStatFilterChange(stat, event.target.value)}
                    inputProps={{
                      inputMode: "numeric",
                      pattern: "[0-7]*",
                      maxLength: 1,
                    }}
                  />
                </Grid>
              ))}
            </Grid>
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
              Rooms can now be renamed, removed, and saved to a JSON room file so a
              plan can survive browser resets.
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
