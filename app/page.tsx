"use client";

import { useRef, useState, useCallback } from "react";
import { parseWorkbook, analyzeRoster, AnalysisResult } from "../lib/analyze";
import { SPORTS, SportConfig } from "../lib/sports";

export default function Page() {
  const [activeSportId, setActiveSportId] = useState(SPORTS[0].id);
  const [results, setResults] = useState<Record<string, AnalysisResult | null>>(
    {}
  );
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sport = SPORTS.find((s) => s.id === activeSportId)!;
  const result = results[activeSportId] ?? null;
  const error = errors[activeSportId] ?? null;

  const handleFile = useCallback(
    async (file: File, config: SportConfig) => {
      setErrors((e) => ({ ...e, [config.id]: null }));
      try {
        const buffer = await file.arrayBuffer();
        const roster = parseWorkbook(buffer, config);
        const teamCount = Object.keys(roster).length;
        if (teamCount === 0) {
          setErrors((e) => ({
            ...e,
            [config.id]: `Couldn't find any valid ${config.tabLabel} rosters. Make sure your sheet has Name and Position columns (${config.positions.join("/")}), either one sheet per team or a single sheet with a Team column.`,
          }));
          return;
        }
        setResults((r) => ({ ...r, [config.id]: analyzeRoster(roster, config) }));
      } catch (e) {
        setErrors((err) => ({
          ...err,
          [config.id]: "Couldn't read that file. Try exporting as .xlsx or .csv.",
        }));
      }
    },
    []
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file, sport);
  };

  const reset = () => {
    setResults((r) => ({ ...r, [activeSportId]: null }));
    setErrors((e) => ({ ...e, [activeSportId]: null }));
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <>
      <div className="pitch-lines" />
      <div className="wrap">
        <div className="sport-tabs">
          {SPORTS.map((s) => (
            <button
              key={s.id}
              className={`sport-tab ${s.id === activeSportId ? "active" : ""}`}
              onClick={() => setActiveSportId(s.id)}
            >
              {s.tabLabel}
            </button>
          ))}
        </div>

        <div className="hero">
          <div className="eyebrow">Team Comparison</div>
          <h1 className="display">{sport.title}</h1>
          <p>{sport.subtitle}</p>
        </div>

        {!result && (
          <>
            <label
              className={`dropzone ${dragActive ? "active" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
            >
              <div className="label">Drop your spreadsheet here</div>
              <div className="hint">
                .xlsx, .xls, or .csv exported from Google Sheets — click to
                browse
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file, sport);
                }}
              />
            </label>
            {error && <div className="error-box">{error}</div>}
          </>
        )}

        {result && (
          <>
            <div className="section-title">
              <span className="num">01</span>
              <h2>Rosters</h2>
              <button className="reset-btn" onClick={reset}>
                Upload different sheet
              </button>
            </div>
            <div className="roster-grid">
              {Object.entries(result.roster).map(([team, players]) => {
                const sharedNames = new Set(
                  result.sharedAcrossTeams.map((s) => s.name.toLowerCase())
                );
                return (
                  <div className="team-card" key={team}>
                    <div className="team-head">
                      <h3>{team}</h3>
                      <span className="count mono">
                        {players.length} players
                      </span>
                    </div>
                    {sport.positions.map((pos) =>
                      players
                        .filter((p) => p.position === pos)
                        .map((p, i) => (
                          <div className="pos-row" key={`${pos}-${i}`}>
                            <span
                              className="pos-tag"
                              style={{ background: sport.positionColors[pos] }}
                            >
                              {pos}
                            </span>
                            <span className="pname">{p.name}</span>
                            {sharedNames.has(p.name.toLowerCase()) && (
                              <span
                                className="shared-dot"
                                title="Also on another team"
                              />
                            )}
                          </div>
                        ))
                    )}
                  </div>
                );
              })}
            </div>

            <div className="section-title">
              <span className="num">02</span>
              <h2>Shared Players</h2>
            </div>
            {result.sharedAcrossTeams.length === 0 ? (
              <div className="empty-note">
                No players appear on more than one team.
              </div>
            ) : (
              <div className="shared-list">
                {result.sharedAcrossTeams.map((s) => (
                  <div className="shared-item" key={s.name}>
                    <span className="sname">{s.name}</span>
                    <span className="steams">{s.teams.join("  ·  ")}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="section-title">
              <span className="num">03</span>
              <h2>{sport.id === "soccer" ? "Formation" : "Roster"} Similarity</h2>
            </div>
            <div className="legend">
              {sport.positions.map((pos) => (
                <span className="item" key={pos}>
                  <span
                    className="swatch"
                    style={{ background: sport.positionColors[pos] }}
                  />
                  {pos}
                </span>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              {result.pairSimilarities.map((pair) => {
                const pct = (team: string) =>
                  sport.positions.map((pos) => {
                    const counts = result.positionCounts[team];
                    const total = Object.values(counts).reduce(
                      (a, b) => a + b,
                      0
                    );
                    return total ? (counts[pos] / total) * 100 : 0;
                  });
                const teamAPct = pct(pair.teamA);
                const teamBPct = pct(pair.teamB);
                return (
                  <div
                    className="pair-row"
                    key={`${pair.teamA}-${pair.teamB}`}
                  >
                    <div className="pair-head">
                      <span className="pair-teams">
                        {pair.teamA} vs {pair.teamB}
                      </span>
                      <span className="pair-score mono">
                        {pair.formationScore}% shape match
                      </span>
                    </div>
                    <div className="bar-compare">
                      <div className="bar-line">
                        <span className="bar-label">{pair.teamA}</span>
                        <div className="bar-track">
                          {sport.positions.map((pos, i) => (
                            <div
                              key={pos}
                              className="bar-seg"
                              style={{
                                width: `${teamAPct[i]}%`,
                                background: sport.positionColors[pos],
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="bar-line">
                        <span className="bar-label">{pair.teamB}</span>
                        <div className="bar-track">
                          {sport.positions.map((pos, i) => (
                            <div
                              key={pos}
                              className="bar-seg"
                              style={{
                                width: `${teamBPct[i]}%`,
                                background: sport.positionColors[pos],
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="pair-shared">
                      {pair.sharedPlayers.length > 0 ? (
                        <>
                          <strong>{pair.sharedPlayers.length}</strong> shared
                          player{pair.sharedPlayers.length > 1 ? "s" : ""}:{" "}
                          {pair.sharedPlayers.join(", ")}
                        </>
                      ) : (
                        "No shared players"
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
