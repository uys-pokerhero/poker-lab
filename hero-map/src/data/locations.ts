export interface MapLocation {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  available: boolean;
}

export const locations: MapLocation[] = [
  {
    id: "rules",
    name: "Beginner's Guide",
    description: "Learn the rules of Texas Hold'em and hand rankings.",
    url: "#rules",
    icon: "\u2660",
    available: false,
  },
  {
    id: "bankroll",
    name: "Bankroll Management",
    description: "Master mindset, tilt control, and bankroll management.",
    url: "#bankroll",
    icon: "\u{1FA99}",
    available: false,
  },
  {
    id: "preflop",
    name: "Pre-Flop Strategy",
    description: "Opening ranges, 3-betting, and pre-flop decision making.",
    url: "#preflop",
    icon: "\u2694",
    available: false,
  },
  {
    id: "postflop",
    name: "Post-Flop Play",
    description: "Continuation betting, pot odds, and board texture reading.",
    url: "#postflop",
    icon: "\u{1F50D}",
    available: false,
  },
  {
    id: "bluff",
    name: "Bluffing & Position",
    description: "Bluffing, semi-bluffing, and the power of position.",
    url: "#bluff",
    icon: "\u{1F3AD}",
    available: false,
  },
  {
    id: "tournament",
    name: "Tournament Strategy",
    description: "ICM, bubble play, and multi-table tournament strategy.",
    url: "#tournament",
    icon: "\u{1F3C6}",
    available: false,
  },
  {
    id: "exploitation",
    name: "Exploitation",
    description: "Identify and exploit opponent tendencies and leaks.",
    url: "#exploitation",
    icon: "\u{1F9E0}",
    available: false,
  },
  {
    id: "variance",
    name: "Variance Calculator",
    description: "Understand variance, standard deviation, and risk of ruin.",
    url: "/variance",
    icon: "\u{1F4C8}",
    available: true,
  },
];
