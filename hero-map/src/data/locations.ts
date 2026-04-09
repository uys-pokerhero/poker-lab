export interface MapLocation {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  url: string;
  icon: LocationIcon;
}

export type LocationIcon =
  | "anchor"
  | "chest"
  | "skull"
  | "swords"
  | "spyglass"
  | "flag"
  | "wheel"
  | "compass";

export interface MapEdge {
  from: string;
  to: string;
}

export const locations: MapLocation[] = [
  {
    id: "rules",
    name: "Beginner's Port",
    description: "Learn the rules of Texas Hold'em and hand rankings.",
    x: 12,
    y: 72,
    url: "#rules",
    icon: "anchor",
  },
  {
    id: "bankroll",
    name: "Bankroll Bay",
    description: "Master mindset, tilt control, and bankroll management.",
    x: 24,
    y: 38,
    url: "#bankroll",
    icon: "chest",
  },
  {
    id: "bluff",
    name: "Bluff Reef",
    description: "Bluffing, semi-bluffing, and the power of position.",
    x: 40,
    y: 62,
    url: "#bluff",
    icon: "skull",
  },
  {
    id: "preflop",
    name: "Pre-Flop Plains",
    description: "Opening ranges, 3-betting, and pre-flop decision making.",
    x: 52,
    y: 28,
    url: "#preflop",
    icon: "swords",
  },
  {
    id: "postflop",
    name: "Post-Flop Forest",
    description: "Continuation betting, pot odds, and board texture reading.",
    x: 62,
    y: 54,
    url: "#postflop",
    icon: "spyglass",
  },
  {
    id: "tournament",
    name: "Tournament Towers",
    description: "ICM, bubble play, and multi-table tournament strategy.",
    x: 78,
    y: 32,
    url: "#tournament",
    icon: "flag",
  },
  {
    id: "exploitation",
    name: "Exploitation Cove",
    description: "Identify and exploit opponent tendencies and leaks.",
    x: 88,
    y: 58,
    url: "#exploitation",
    icon: "wheel",
  },
  {
    id: "variance",
    name: "Variance Valley",
    description: "Understand variance, standard deviation, and risk of ruin.",
    x: 44,
    y: 85,
    url: "#variance",
    icon: "compass",
  },
];

export const edges: MapEdge[] = [
  { from: "rules", to: "bankroll" },
  { from: "bankroll", to: "preflop" },
  { from: "rules", to: "bluff" },
  { from: "bluff", to: "postflop" },
  { from: "preflop", to: "postflop" },
  { from: "postflop", to: "tournament" },
  { from: "tournament", to: "exploitation" },
  { from: "rules", to: "variance" },
];
