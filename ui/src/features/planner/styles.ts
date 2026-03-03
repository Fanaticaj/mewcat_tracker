import type { CSSProperties } from "react";

export const primaryActionSx = {
  minWidth: { xs: "100%", md: 180 },
  boxShadow: "none",
};

export const analysisPanelSx = {
  borderRadius: 3,
  border: "1px solid rgba(148, 163, 184, 0.16)",
  background: "rgba(255,255,255,0.76)",
  p: 1.1,
};

export const featuredInsightSx = {
  borderRadius: 3.5,
  border: "1px solid rgba(148, 163, 184, 0.18)",
  p: 1.2,
};

export const contributionCardSx = {
  minWidth: 0,
  borderRadius: 2.75,
  border: "1px solid rgba(255,255,255,0.72)",
  background: "rgba(255,255,255,0.72)",
  px: 0.95,
  py: 0.9,
};

export const pairDetailPillSx = {
  minWidth: 0,
  borderRadius: 2.2,
  border: "1px solid rgba(255,255,255,0.72)",
  background: "rgba(255,255,255,0.68)",
  px: 0.75,
  py: 0.65,
};

export const quickMoveSelectStyle: CSSProperties = {
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
