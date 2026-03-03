import type { DragEvent } from "react";
import type { SxProps, Theme } from "@mui/material/styles";
import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import type { CatRow, RoomDestination } from "../types";
import { buildRoomPairInsights, buildRoomStatLeaders } from "../utils";
import { CatCard } from "./CatCard";
import { RoomInsights } from "./RoomInsights";

type DropZoneSectionProps = {
  averageLabel: string;
  cats: CatRow[];
  count: number;
  draggingCatKey: string | null;
  dropId: RoomDestination;
  emptyMessage: string;
  getRoomForCat: (key: string) => RoomDestination;
  isActiveDropZone: boolean;
  isCatEligibleForAutoAssign: (key: string) => boolean;
  onDragEnd: () => void;
  onDragLeave: (event: DragEvent<HTMLElement>, destination: RoomDestination) => void;
  onDragOver: (event: DragEvent<HTMLElement>, destination: RoomDestination) => void;
  onDragStart: (
    event: DragEvent<HTMLElement>,
    catKey: string,
    fromRoom: RoomDestination,
  ) => void;
  onDrop: (event: DragEvent<HTMLElement>, destination: RoomDestination) => void;
  onMove: (key: string, destination: RoomDestination) => void;
  onToggleEligibility: (key: string) => void;
  roomNames: string[];
  subtitle: string;
  sx?: SxProps<Theme>;
  title: string;
};

export function DropZoneSection({
  averageLabel,
  cats,
  count,
  draggingCatKey,
  dropId,
  emptyMessage,
  getRoomForCat,
  isActiveDropZone,
  isCatEligibleForAutoAssign,
  onDragEnd,
  onDragLeave,
  onDragOver,
  onDragStart,
  onDrop,
  onMove,
  onToggleEligibility,
  roomNames,
  subtitle,
  sx,
  title,
}: DropZoneSectionProps) {
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
              catsInRoom={cats.length}
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
                  isEligibleForAutoAssign={isCatEligibleForAutoAssign(cat.key)}
                  isDragging={draggingCatKey === cat.key}
                  onDragEnd={onDragEnd}
                  onDragStart={onDragStart}
                  onMove={onMove}
                  onToggleEligibility={onToggleEligibility}
                  roomNames={roomNames}
                />
              ))}
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
