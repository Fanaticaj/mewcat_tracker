import { useMemo, useState } from "react";
import AutoAwesomeRounded from "@mui/icons-material/AutoAwesomeRounded";
import FilterAltRounded from "@mui/icons-material/FilterAltRounded";
import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowUpRounded from "@mui/icons-material/KeyboardArrowUpRounded";
import SaveAltRounded from "@mui/icons-material/SaveAltRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import UploadFileRounded from "@mui/icons-material/UploadFileRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { STAT_KEYS } from "../constants";
import { primaryActionSx, secondaryActionSx } from "../styles";
import type {
  SortDirection,
  SortField,
  StatusFilter,
  StatFilterState,
} from "../types";

type PlannerHeaderProps = {
  assignedCount: number;
  eligibleUnassignedCount: number;
  filteredCount: number;
  genderFilter: string;
  isDecodingSav: boolean;
  newRoomName: string;
  onAddRoom: () => void;
  onAutoAssignEligibleCats: () => void;
  onClearAllRooms: () => void;
  onDecodeSavFile: (file: File) => void;
  onExportRoomFile: () => void;
  onGenderFilterChange: (value: string) => void;
  onImportCsv: (file: File) => void;
  onImportRoomFile: (file: File) => void;
  onNewRoomNameChange: (value: string) => void;
  onResetStatFilters: () => void;
  onSearchChange: (value: string) => void;
  onSortDirectionChange: (value: SortDirection) => void;
  onSortFieldChange: (value: SortField) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onStatFilterChange: (stat: keyof StatFilterState, value: string) => void;
  plannerMessage: string;
  plannerMessageTone: "info" | "success" | "error";
  roomCount: number;
  search: string;
  sortDirection: SortDirection;
  sortField: SortField;
  statFilters: StatFilterState;
  statusFilter: StatusFilter;
  statusOptions: StatusFilter[];
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
  isDecodingSav,
  newRoomName,
  onAddRoom,
  onAutoAssignEligibleCats,
  onClearAllRooms,
  onDecodeSavFile,
  onExportRoomFile,
  onGenderFilterChange,
  onImportCsv,
  onImportRoomFile,
  onNewRoomNameChange,
  onResetStatFilters,
  onSearchChange,
  onSortDirectionChange,
  onSortFieldChange,
  onStatusFilterChange,
  onStatFilterChange,
  plannerMessage,
  plannerMessageTone,
  roomCount,
  search,
  sortDirection,
  sortField,
  statFilters,
  statusFilter,
  statusOptions,
  tokenKinds,
  totalValidCats,
}: PlannerHeaderProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeStatFilterCount = useMemo(
    () => Object.values(statFilters).filter((value) => value.trim().length > 0).length,
    [statFilters],
  );
  const activeControlCount =
    activeStatFilterCount +
    (genderFilter !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (sortField !== "name" ? 1 : 0) +
    (sortDirection !== "asc" ? 1 : 0);

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: "1px solid rgba(90, 67, 51, 0.1)",
        background:
          "linear-gradient(135deg, rgba(251,245,236,0.98), rgba(236,227,216,0.98))",
        boxShadow: "0 18px 42px rgba(45, 35, 29, 0.08)",
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack spacing={1.75}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", lg: "center" }}
            spacing={1.5}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="overline"
                sx={{ letterSpacing: "0.14em", color: "primary.main" }}
              >
                Breeding Planner
              </Typography>
              <Typography
                fontWeight={800}
                sx={{
                  fontSize: { xs: "1.4rem", md: "1.8rem" },
                  lineHeight: 1.05,
                  mb: 0.35,
                }}
              >
                Mewgenics Cat Room Manager
              </Typography>
              <Typography
                color="text.secondary"
                variant="body2"
                sx={{ maxWidth: 700, fontSize: { xs: 13, md: 14 } }}
              >
                Decode a save, clean the CSV if needed, import it, and compare breeding
                room plans without leaving the tracker.
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              sx={{ width: { xs: "100%", lg: "auto" } }}
            >
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadFileRounded />}
                sx={primaryActionSx}
              >
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

              <Button
                variant="outlined"
                component="label"
                startIcon={<SaveAltRounded />}
                disabled={isDecodingSav}
                sx={secondaryActionSx}
              >
                {isDecodingSav ? "Decoding .sav..." : "Decode .sav"}
                <input
                  hidden
                  type="file"
                  accept=".sav,application/octet-stream"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onDecodeSavFile(file);
                    event.target.value = "";
                  }}
                />
              </Button>

              <Button
                variant="contained"
                color="success"
                startIcon={<AutoAwesomeRounded />}
                onClick={onAutoAssignEligibleCats}
                disabled={eligibleUnassignedCount === 0 || roomCount === 0}
                sx={primaryActionSx}
              >
                Auto-assign
              </Button>
            </Stack>
          </Stack>

          {plannerMessage ? (
            <Alert
              severity={plannerMessageTone}
              sx={{
                borderRadius: 2,
                py: 0,
                "& .MuiAlert-message": { py: 0.85 },
              }}
            >
              {plannerMessage}
            </Alert>
          ) : null}

          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <Chip size="small" label={`${totalValidCats} loaded`} color="primary" />
            <Chip size="small" label={`${assignedCount} assigned`} variant="outlined" />
            <Chip size="small" label={`${roomCount} rooms`} variant="outlined" />
            <Chip
              size="small"
              label={`${eligibleUnassignedCount} eligible`}
              variant="outlined"
              color="success"
            />
            <Chip
              size="small"
              label={`${filteredCount} visible`}
              variant="outlined"
            />
          </Stack>

          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", lg: "center" }}
          >
            <TextField
              fullWidth
              label="Search name, key, or token"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              size="small"
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded sx={{ fontSize: 18, color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              variant={activeControlCount > 0 ? "contained" : "outlined"}
              color={activeControlCount > 0 ? "primary" : "inherit"}
              startIcon={<FilterAltRounded />}
              endIcon={
                filtersOpen ? <KeyboardArrowUpRounded /> : <KeyboardArrowDownRounded />
              }
              onClick={() => setFiltersOpen((current) => !current)}
              sx={secondaryActionSx}
            >
              Filters & sort{activeControlCount > 0 ? ` (${activeControlCount})` : ""}
            </Button>

            <Button variant="outlined" component="label" sx={secondaryActionSx}>
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

            <Button variant="outlined" onClick={onExportRoomFile} sx={secondaryActionSx}>
              Save room file
            </Button>

            <Button
              variant="outlined"
              color="warning"
              onClick={onClearAllRooms}
              sx={secondaryActionSx}
            >
              Clear rooms
            </Button>
          </Stack>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <TextField
              label="New room name"
              size="small"
              value={newRoomName}
              onChange={(event) => onNewRoomNameChange(event.target.value)}
              sx={{ width: { xs: "100%", md: 220 } }}
            />
            <Button variant="outlined" onClick={onAddRoom} sx={secondaryActionSx}>
              Add room
            </Button>
            <Typography color="text.secondary" variant="body2">
              Rooms persist locally and can also be saved to a JSON plan.
            </Typography>
          </Stack>

          <Collapse in={filtersOpen} timeout={180}>
            <Box
              sx={{
                mt: 0.25,
                borderRadius: 2.25,
                border: "1px solid rgba(90, 67, 51, 0.14)",
                background: "rgba(251,245,236,0.82)",
                px: { xs: 1.25, md: 1.5 },
                py: 1.5,
              }}
            >
              <Stack spacing={1.25}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", md: "center" }}
                  spacing={0.75}
                >
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800}>
                      Sort and filter controls
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Keep the roster focused by status, trait floor, gender, and ranking order.
                    </Typography>
                  </Box>
                  <Button variant="text" onClick={onResetStatFilters} sx={secondaryActionSx}>
                    Reset stat floors
                  </Button>
                </Stack>

                <Grid container spacing={1.25}>
                  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        label="Status"
                        value={statusFilter}
                        onChange={(event) =>
                          onStatusFilterChange(event.target.value as StatusFilter)
                        }
                      >
                        <MenuItem value="all">All</MenuItem>
                        {statusOptions.map((status) => (
                          <MenuItem key={status} value={status}>
                            {status === "alive" ? "Alive" : status}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Gender</InputLabel>
                      <Select
                        label="Gender"
                        value={genderFilter}
                        onChange={(event) => onGenderFilterChange(event.target.value)}
                      >
                        <MenuItem value="all">All</MenuItem>
                        {tokenKinds.map((kind) => (
                          <MenuItem key={kind} value={kind}>
                            {kind === "?" ? "Unknown" : kind}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Sort by</InputLabel>
                      <Select
                        label="Sort by"
                        value={sortField}
                        onChange={(event) =>
                          onSortFieldChange(event.target.value as SortField)
                        }
                      >
                        {sortFieldOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
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

                  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <Chip
                      label={
                        activeStatFilterCount > 0
                          ? `${activeStatFilterCount} stat floors active`
                          : "No stat floors"
                      }
                      variant="outlined"
                      sx={{
                        mt: { xs: 0, lg: 0.5 },
                        width: "100%",
                        height: 40,
                        justifyContent: "flex-start",
                        "& .MuiChip-label": {
                          width: "100%",
                          textAlign: "center",
                          fontWeight: 700,
                        },
                      }}
                    />
                  </Grid>
                </Grid>

                <Divider />

                <Grid container spacing={1}>
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
            </Box>
          </Collapse>
        </Stack>
      </CardContent>
    </Card>
  );
}
