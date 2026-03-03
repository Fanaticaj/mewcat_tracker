import { Box, Chip, Stack, Typography } from "@mui/material";
import { STAT_KEYS } from "../constants";
import {
  analysisPanelSx,
  contributionCardSx,
  featuredInsightSx,
  pairDetailPillSx,
} from "../styles";
import type { PairInsight, RoomStatLeader } from "../types";
import { formatStatList, getPairNarrative, getPairTone } from "../utils";

type RoomInsightsProps = {
  catsInRoom: number;
  roomStatLeaders: RoomStatLeader[];
  topPairInsights: PairInsight[];
};

export function RoomInsights({
  catsInRoom,
  roomStatLeaders,
  topPairInsights,
}: RoomInsightsProps) {
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
            label={`${catsInRoom} cats in play`}
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
                    sx={{
                      display: "block",
                      color: "text.secondary",
                      letterSpacing: "0.08em",
                    }}
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
                  <Typography
                    sx={{ mt: 0.4, fontSize: 18, fontWeight: 800, lineHeight: 1 }}
                  >
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
                Compare backup pairings when the top recommendation is occupied
                elsewhere.
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
          <Chip size="small" color="success" label={`${insight.perfectStats.length} perfect`} />
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
