export const C = {
  bg: "#ffffff",
  surface: "#ffffff",
  card: "#f6faff",
  border: "#cfe2f5",
  accent: "#1e5799",
  accent2: "#7db9e8",
  green: "#16a34a",
  amber: "#f59e0b",
  blue: "#1d4ed8",
  purple: "#60a5fa",
  muted: "#6b7f95",
  text: "#0f2a47",
  subtext: "#3f5f80",
};

export const STATUS = {
  pending_screening: {
    label: "Pending Screening",
    color: C.amber,
    bg: "rgba(245,158,11,0.15)",
    step: 0,
  },
  screened: {
    label: "Screened",
    color: C.blue,
    bg: "rgba(59,130,246,0.15)",
    step: 1,
  },
  interview_scheduled: {
    label: "Interview Scheduled",
    color: C.purple,
    bg: "rgba(167,139,250,0.15)",
    step: 2,
  },
  feedback_submitted: {
    label: "Feedback Submitted",
    color: C.green,
    bg: "rgba(34,197,94,0.15)",
    step: 3,
  },
};
