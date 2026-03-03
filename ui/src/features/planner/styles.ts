import type { CSSProperties } from "react";

export const primaryActionSx = {
  minWidth: { xs: "100%", sm: 160 },
  minHeight: 38,
  boxShadow: "none",
  borderRadius: 10,
  textTransform: "none",
  fontWeight: 700,
};

export const secondaryActionSx = {
  minWidth: { xs: "100%", sm: "auto" },
  minHeight: 38,
  borderRadius: 10,
  textTransform: "none",
  fontWeight: 700,
};

export const analysisPanelSx = {
  borderRadius: 2,
  border: "1px solid rgba(90, 67, 51, 0.14)",
  background: "rgba(251,245,236,0.72)",
  p: 1.1,
};

export const featuredInsightSx = {
  borderRadius: 2.25,
  border: "1px solid rgba(90, 67, 51, 0.16)",
  p: 1.2,
};

export const contributionCardSx = {
  minWidth: 0,
  borderRadius: 1.75,
  border: "1px solid rgba(255,255,255,0.64)",
  background: "rgba(251,245,236,0.7)",
  px: 0.95,
  py: 0.9,
};

export const pairDetailPillSx = {
  minWidth: 0,
  borderRadius: 1.5,
  border: "1px solid rgba(255,255,255,0.62)",
  background: "rgba(251,245,236,0.64)",
  px: 0.75,
  py: 0.65,
};

export const quickMoveSelectStyle: CSSProperties = {
  width: "100%",
  borderRadius: 7,
  border: "1px solid rgba(90, 67, 51, 0.24)",
  background: "rgba(251, 245, 236, 0.92)",
  padding: "8px 10px",
  fontSize: 13,
  lineHeight: 1.2,
  color: "#2d231d",
  outline: "none",
  minHeight: "36px",
  boxShadow: "inset 0 1px 2px rgba(45, 35, 29, 0.05)",
};
