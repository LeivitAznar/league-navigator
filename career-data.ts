// Shared mock data for the career mode UI.
// This is presentation-only data — replace with real game state when integrating the engine.

export type Position = "GK" | "DEF" | "MID" | "FWD";

export interface Club {
  id: string;
  name: string;
  short: string;
  color: string; // hex or oklch
  secondary: string;
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: Position;
  overall: number;
  isUser?: boolean;
}

export interface Fixture {
  id: string;
  round: number;
  date: string;
  home: string; // club id
  away: string;
  homeGoals?: number;
  awayGoals?: number;
  played: boolean;
}

export interface TableRow {
  clubId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
}

export const CLUBS: Club[] = [
  { id: "rio", name: "Río Plate FC", short: "RIO", color: "#1E3A8A", secondary: "#FFFFFF" },
  { id: "cnd", name: "Cóndores United", short: "CND", color: "#B91C1C", secondary: "#0D1117" },
  { id: "pmp", name: "Pampas Athletic", short: "PMP", color: "#065F46", secondary: "#FBBF24" },
  { id: "vlk", name: "Volcán CF", short: "VLK", color: "#EA580C", secondary: "#0D1117" },
  { id: "aur", name: "Aurora SC", short: "AUR", color: "#7C3AED", secondary: "#FDE68A" },
  { id: "trm", name: "Tormenta FC", short: "TRM", color: "#0891B2", secondary: "#FFFFFF" },
  { id: "and", name: "Andes Real", short: "AND", color: "#DC2626", secondary: "#F5F5F4" },
  { id: "gcs", name: "Gaucho Sur", short: "GCS", color: "#166534", secondary: "#FFFFFF" },
  { id: "flx", name: "Fénix Club", short: "FLX", color: "#F59E0B", secondary: "#111827" },
  { id: "atl", name: "Atlántico BC", short: "ATL", color: "#1E40AF", secondary: "#F87171" },
];

export const USER_CLUB_ID = "rio";
export const CURRENT_SEASON = "2026/27";

export const USER_PLAYER: Player = {
  id: "user",
  name: "Tu Jugador",
  number: 10,
  position: "FWD",
  overall: 78,
  isUser: true,
};

export const SQUAD: Player[] = [
  { id: "p1", name: "M. Herrera", number: 1, position: "GK", overall: 81 },
  { id: "p2", name: "L. Vega", number: 12, position: "GK", overall: 72 },
  { id: "p3", name: "R. Sosa", number: 2, position: "DEF", overall: 79 },
  { id: "p4", name: "D. Rojas", number: 4, position: "DEF", overall: 83 },
  { id: "p5", name: "F. Núñez", number: 5, position: "DEF", overall: 76 },
  { id: "p6", name: "A. Castro", number: 3, position: "DEF", overall: 74 },
  { id: "p7", name: "J. Molina", number: 6, position: "MID", overall: 80 },
  { id: "p8", name: "N. Peralta", number: 8, position: "MID", overall: 82 },
  { id: "p9", name: "S. Ibáñez", number: 14, position: "MID", overall: 77 },
  USER_PLAYER,
  { id: "p10", name: "T. Aguirre", number: 7, position: "FWD", overall: 84 },
  { id: "p11", name: "C. Moreno", number: 9, position: "FWD", overall: 80 },
  { id: "p12", name: "B. Salas", number: 11, position: "FWD", overall: 75 },
];

// Simple round-robin subset
export const FIXTURES: Fixture[] = [
  { id: "f1", round: 1, date: "2026-08-15", home: "rio", away: "cnd", homeGoals: 2, awayGoals: 1, played: true },
  { id: "f2", round: 2, date: "2026-08-22", home: "pmp", away: "rio", homeGoals: 0, awayGoals: 0, played: true },
  { id: "f3", round: 3, date: "2026-08-29", home: "rio", away: "vlk", homeGoals: 3, awayGoals: 2, played: true },
  { id: "f4", round: 4, date: "2026-09-05", home: "aur", away: "rio", homeGoals: 1, awayGoals: 2, played: true },
  { id: "f5", round: 5, date: "2026-09-12", home: "rio", away: "trm", homeGoals: 1, awayGoals: 1, played: true },
  { id: "f6", round: 6, date: "2026-09-19", home: "and", away: "rio", played: false },
  { id: "f7", round: 7, date: "2026-09-26", home: "rio", away: "gcs", played: false },
  { id: "f8", round: 8, date: "2026-10-03", home: "flx", away: "rio", played: false },
  { id: "f9", round: 9, date: "2026-10-10", home: "rio", away: "atl", played: false },
  { id: "f10", round: 10, date: "2026-10-17", home: "cnd", away: "rio", played: false },
];

export const TABLE: TableRow[] = [
  { clubId: "trm", played: 5, won: 4, drawn: 1, lost: 0, gf: 12, ga: 3 },
  { clubId: "rio", played: 5, won: 3, drawn: 2, lost: 0, gf: 8, ga: 4 },
  { clubId: "flx", played: 5, won: 3, drawn: 1, lost: 1, gf: 9, ga: 5 },
  { clubId: "and", played: 5, won: 3, drawn: 0, lost: 2, gf: 7, ga: 6 },
  { clubId: "vlk", played: 5, won: 2, drawn: 2, lost: 1, gf: 8, ga: 7 },
  { clubId: "aur", played: 5, won: 2, drawn: 1, lost: 2, gf: 6, ga: 7 },
  { clubId: "atl", played: 5, won: 2, drawn: 0, lost: 3, gf: 5, ga: 8 },
  { clubId: "cnd", played: 5, won: 1, drawn: 2, lost: 2, gf: 5, ga: 6 },
  { clubId: "gcs", played: 5, won: 1, drawn: 1, lost: 3, gf: 4, ga: 9 },
  { clubId: "pmp", played: 5, won: 0, drawn: 2, lost: 3, gf: 2, ga: 11 },
];

export interface TransferOffer {
  id: string;
  fromClub: string;
  wage: number; // per week (k)
  fee: number; // millions
  contractYears: number;
}

export const OFFERS: TransferOffer[] = [
  { id: "o1", fromClub: "trm", wage: 45, fee: 12, contractYears: 3 },
  { id: "o2", fromClub: "flx", wage: 38, fee: 9, contractYears: 4 },
  { id: "o3", fromClub: "and", wage: 52, fee: 15, contractYears: 2 },
];

export interface PlayerStat {
  key: string;
  label: string;
  value: number; // 0-99
}

export const USER_STATS: PlayerStat[] = [
  { key: "pac", label: "Velocidad", value: 82 },
  { key: "sho", label: "Tiro", value: 79 },
  { key: "pas", label: "Pase", value: 74 },
  { key: "dri", label: "Regate", value: 81 },
  { key: "def", label: "Defensa", value: 42 },
  { key: "phy", label: "Físico", value: 76 },
];

export const USER_HISTORY = {
  matches: 87,
  goals: 34,
  assists: 21,
  seasons: 3,
  overallProgression: [
    { season: "24/25", overall: 68 },
    { season: "25/26", overall: 73 },
    { season: "26/27", overall: 78 },
  ],
};

export function clubById(id: string): Club {
  return CLUBS.find((c) => c.id === id) ?? CLUBS[0];
}

export function nextFixture(): Fixture | undefined {
  return FIXTURES.find((f) => !f.played);
}

export function tableSorted(): (TableRow & { points: number; gd: number })[] {
  return TABLE.map((r) => ({
    ...r,
    points: r.won * 3 + r.drawn,
    gd: r.gf - r.ga,
  })).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
}
