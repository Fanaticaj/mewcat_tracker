import type { DragEvent } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { STAT_KEYS } from "../constants";
import { quickMoveSelectStyle } from "../styles";
import type { CatRow, RoomDestination } from "../types";
import { catAccent, catStatSum } from "../utils";

type CatCardProps = {
  cat: CatRow;
  currentRoom: RoomDestination;
  isDragging: boolean;
  isEligibleForAutoAssign: boolean;
  onDragEnd: () => void;
  onDragStart: (
    event: DragEvent<HTMLElement>,
    catKey: string,
    fromRoom: RoomDestination,
  ) => void;
  onMove: (key: string, destination: RoomDestination) => void;
  onToggleEligibility: (key: string) => void;
  roomNames: string[];
};

export function CatCard({
  cat,
  currentRoom,
  isDragging,
  isEligibleForAutoAssign,
  onDragEnd,
  onDragStart,
  onMove,
  onToggleEligibility,
  roomNames,
}: CatCardProps) {
  const accent = catAccent(cat);

  return (
    <Card
      draggable
      onDragStart={(event) => onDragStart(event, cat.key, currentRoom)}
      onDragEnd={onDragEnd}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 2.25,
        border: `1px solid ${accent}26`,
        background:
          "linear-gradient(180deg, rgba(251,245,236,0.98), rgba(240,232,223,0.98))",
        boxShadow: isDragging
          ? "0 14px 28px rgba(45, 35, 29, 0.12)"
          : "0 8px 18px rgba(45, 35, 29, 0.08)",
        opacity: isDragging ? 0.52 : 1,
        transform: isDragging ? "scale(0.985)" : "translateY(0)",
        transition:
          "transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease",
        "&:hover": {
          transform: "translateY(-1px)",
          boxShadow: "0 12px 24px rgba(45, 35, 29, 0.12)",
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
                borderRadius: 1.5,
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
            {STAT_KEYS.map((stat) => (
              <Box
                key={stat}
                sx={{
                  minWidth: 0,
                  borderRadius: 1.1,
                  border: "1px solid rgba(90, 67, 51, 0.12)",
                  background: "rgba(255, 250, 245, 0.52)",
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
                  {stat}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.25,
                    fontSize: 15,
                    fontWeight: 800,
                    lineHeight: 1,
                    color: Number(cat[stat]) === 7 ? accent : "text.primary",
                  }}
                >
                  {cat[stat]}
                </Typography>
              </Box>
            ))}
          </Box>

          <Stack spacing={0.55}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ letterSpacing: "0.08em", fontWeight: 700 }}
                >
                  AUTO ASSIGN
                </Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                  {isEligibleForAutoAssign ? "Eligible" : "Excluded"}
                </Typography>
              </Box>
              <Switch
                size="small"
                checked={isEligibleForAutoAssign}
                inputProps={{ "aria-label": `Include ${cat.name} in auto-assign` }}
                onChange={() => onToggleEligibility(cat.key)}
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
              />
            </Stack>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ letterSpacing: "0.08em", fontWeight: 700 }}
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
