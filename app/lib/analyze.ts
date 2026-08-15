import * as XLSX from "xlsx";
import { SportConfig } from "./sports";

export interface Player {
  name: string;
  position: string;
}

export interface Roster {
  [teamName: string]: Player[];
}

export interface PairSimilarity {
  teamA: string;
  teamB: string;
  formationScore: number; // 0-100, how similar the position mix is
  sharedPlayers: string[];
}

export interface AnalysisResult {
  roster: Roster;
  sharedAcrossTeams: { name: string; teams: string[] }[];
  positionCounts: Record<string, Record<string, number>>;
  pairSimilarities: PairSimilarity[];
}

function normalizePosition(
  raw: unknown,
  config: SportConfig
): string | null {
  if (raw == null) return null;
  const key = String(raw).trim().toLowerCase();
  return config.positionAliases[key] ?? null;
}

function findColumn(headers: string[], candidates: string[]): string | null {
  const lowered = headers.map((h) => h.toLowerCase().trim());
  for (const c of candidates) {
    const idx = lowered.indexOf(c);
    if (idx !== -1) return headers[idx];
  }
  return null;
}

/**
 * Block-format parser: handles sheets shaped like a draft/roster export where
 * a team name sits alone in column A, followed by rows starting with a
 * position code whose remaining cells (across columns) are player names for
 * that position, e.g.:
 *
 *   Team Underdog1
 *   QB   Josh Allen
 *   RB   Bijan Robinson   Jahmyr Gibbs
 *   (blank row)
 *   Roto5
 *   QB   ...
 */
function parseBlockFormat(
  sheet: XLSX.WorkSheet,
  config: SportConfig
): Roster {
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
  });
  const roster: Roster = {};
  let currentTeam: string | null = null;

  for (const row of rows) {
    const cells = row.map((c) => String(c ?? "").trim());
    const first = cells[0];
    const rest = cells.slice(1).filter((c) => c.length > 0);

    if (!first) continue; // blank separator row

    const position = normalizePosition(first, config);
    if (position) {
      if (!currentTeam) continue; // position row with no team context yet
      if (!roster[currentTeam]) roster[currentTeam] = [];
      for (const name of rest) {
        roster[currentTeam].push({ name, position });
      }
    } else {
      // A non-position, non-empty first cell starts a new team block.
      currentTeam = first;
      if (!roster[currentTeam]) roster[currentTeam] = [];
    }
  }

  for (const team of Object.keys(roster)) {
    if (roster[team].length === 0) delete roster[team];
  }

  return roster;
}

/**
 * Parses an uploaded workbook into a Roster, for the given sport's position set.
 * Supports three layouts:
 *  1. One sheet per team (sheet name = team name), each with Name + Position columns.
 *  2. One sheet with Name + Position + Team columns.
 *  3. Block format: team name alone in column A, followed by position-code
 *     rows whose remaining columns list that position's players.
 */
export function parseWorkbook(
  buffer: ArrayBuffer,
  config: SportConfig
): Roster {
  const wb = XLSX.read(buffer, { type: "array" });
  const roster: Roster = {};

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
    });
    if (rows.length === 0) continue;

    const headers = Object.keys(rows[0]);
    const nameCol = findColumn(headers, ["name", "player", "player name"]);
    const posCol = findColumn(headers, [
      "position",
      "pos",
      "category",
      "role",
    ]);
    const teamCol = findColumn(headers, ["team", "team name", "squad"]);

    if (!nameCol || !posCol) continue; // not a columnar roster sheet

    for (const row of rows) {
      const name = String(row[nameCol] ?? "").trim();
      const position = normalizePosition(row[posCol], config);
      if (!name || !position) continue;

      const team = teamCol ? String(row[teamCol] ?? "").trim() : sheetName;
      if (!team) continue;

      if (!roster[team]) roster[team] = [];
      roster[team].push({ name, position });
    }
  }

  if (Object.keys(roster).length > 0) return roster;

  // Fall back to block format if no columnar sheet matched.
  for (const sheetName of wb.SheetNames) {
    const blockRoster = parseBlockFormat(wb.Sheets[sheetName], config);
    for (const [team, players] of Object.entries(blockRoster)) {
      roster[team] = players;
    }
  }

  return roster;
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

export function analyzeRoster(
  roster: Roster,
  config: SportConfig
): AnalysisResult {
  const teams = Object.keys(roster);
  const positions = config.positions;

  const positionCounts: Record<string, Record<string, number>> = {};
  for (const team of teams) {
    const counts: Record<string, number> = {};
    for (const p of positions) counts[p] = 0;
    for (const p of roster[team]) counts[p.position]++;
    positionCounts[team] = counts;
  }

  const nameToTeams = new Map<string, Set<string>>();
  const nameDisplay = new Map<string, string>();
  for (const team of teams) {
    for (const p of roster[team]) {
      const key = p.name.toLowerCase();
      if (!nameToTeams.has(key)) nameToTeams.set(key, new Set());
      nameToTeams.get(key)!.add(team);
      if (!nameDisplay.has(key)) nameDisplay.set(key, p.name);
    }
  }
  const sharedAcrossTeams = Array.from(nameToTeams.entries())
    .filter(([, teamSet]) => teamSet.size > 1)
    .map(([key, teamSet]) => ({
      name: nameDisplay.get(key)!,
      teams: Array.from(teamSet).sort(),
    }))
    .sort((a, b) => b.teams.length - a.teams.length);

  const pairSimilarities: PairSimilarity[] = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const teamA = teams[i];
      const teamB = teams[j];
      const totalA = roster[teamA].length || 1;
      const totalB = roster[teamB].length || 1;
      const vecA = positions.map((p) => positionCounts[teamA][p] / totalA);
      const vecB = positions.map((p) => positionCounts[teamB][p] / totalB);
      const sim = cosineSimilarity(vecA, vecB);

      const setA = new Set(roster[teamA].map((p) => p.name.toLowerCase()));
      const shared = roster[teamB]
        .map((p) => p.name)
        .filter((n) => setA.has(n.toLowerCase()));

      pairSimilarities.push({
        teamA,
        teamB,
        formationScore: Math.round(sim * 100),
        sharedPlayers: Array.from(new Set(shared)),
      });
    }
  }
  pairSimilarities.sort((a, b) => b.formationScore - a.formationScore);

  return { roster, sharedAcrossTeams, positionCounts, pairSimilarities };
}
