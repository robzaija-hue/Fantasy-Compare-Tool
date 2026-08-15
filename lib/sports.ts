export interface SportConfig {
  id: string;
  tabLabel: string;
  title: string;
  subtitle: string;
  positions: string[];
  positionLabels: Record<string, string>;
  positionAliases: Record<string, string>;
  positionColors: Record<string, string>;
}

export const SOCCER: SportConfig = {
  id: "soccer",
  tabLabel: "Soccer",
  title: "Squad Sheet",
  subtitle:
    "Upload a roster export — one sheet per team, or one sheet with a Team column. We'll line up every squad by position and flag what they have in common.",
  positions: ["F", "M", "D", "G"],
  positionLabels: {
    F: "Forward",
    M: "Midfielder",
    D: "Defender",
    G: "Goalie",
  },
  positionColors: {
    F: "#e76f51",
    M: "#2a9d8f",
    D: "#335c78",
    G: "#d4a017",
  },
  positionAliases: {
    f: "F",
    forward: "F",
    fwd: "F",
    striker: "F",
    m: "M",
    mid: "M",
    midfielder: "M",
    midfield: "M",
    d: "D",
    def: "D",
    defender: "D",
    defence: "D",
    defense: "D",
    g: "G",
    gk: "G",
    goalie: "G",
    goalkeeper: "G",
    keeper: "G",
  },
};

export const FOOTBALL: SportConfig = {
  id: "football",
  tabLabel: "Fantasy Football",
  title: "Draft Board",
  subtitle:
    "Upload a fantasy roster export — one sheet per team, or one sheet with a Team column. We'll line up every squad by position and flag what they have in common.",
  positions: ["QB", "RB", "WR", "TE", "FLEX", "K", "DST"],
  positionLabels: {
    QB: "Quarterback",
    RB: "Running Back",
    WR: "Wide Receiver",
    TE: "Tight End",
    FLEX: "Flex",
    K: "Kicker",
    DST: "Defense/Special Teams",
  },
  positionColors: {
    QB: "#c0392b",
    RB: "#e67e22",
    WR: "#16a085",
    TE: "#2980b9",
    FLEX: "#8e44ad",
    K: "#b8860b",
    DST: "#34495e",
  },
  positionAliases: {
    qb: "QB",
    quarterback: "QB",
    rb: "RB",
    "running back": "RB",
    runningback: "RB",
    hb: "RB",
    halfback: "RB",
    wr: "WR",
    "wide receiver": "WR",
    widereceiver: "WR",
    receiver: "WR",
    te: "TE",
    "tight end": "TE",
    tightend: "TE",
    flex: "FLEX",
    "w/r/t": "FLEX",
    k: "K",
    kicker: "K",
    pk: "K",
    dst: "DST",
    "d/st": "DST",
    def: "DST",
    defense: "DST",
    "defense/special teams": "DST",
  },
};

export const SPORTS: SportConfig[] = [SOCCER, FOOTBALL];
