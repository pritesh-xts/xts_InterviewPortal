const Icon = ({ d, size = 20, color = "currentColor", strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {d.map((p, i) => <path key={i} d={p} />)}
  </svg>
);

export const Icons = {
  Users: () => <Icon d={["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"]} />,
  BarChart: () => <Icon d={["M12 20V10", "M18 20V4", "M6 20v-4"]} />,
  Plus: () => <Icon d={["M12 5v14", "M5 12h14"]} />,
  Search: () => <Icon d={["M11 17.25a6.25 6.25 0 1 0 0-12.5 6.25 6.25 0 0 0 0 12.5z", "M16 16l3.5 3.5"]} />,
  X: () => <Icon d={["M18 6L6 18", "M6 6l12 12"]} />,
  Check: () => <Icon d={["M20 6L9 17l-5-5"]} />,
  ChevronR: () => <Icon d={["M9 18l6-6-6-6"]} />,
  Calendar: () => <Icon d={["M3 4h18v18H3z", "M16 2v4", "M8 2v4", "M3 10h18"]} />,
};
