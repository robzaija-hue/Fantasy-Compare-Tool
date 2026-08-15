# Squad Sheet — Multi-Sport Team Comparison

One Vercel app, two tabs: **Soccer** and **Fantasy Football**. Upload a
roster spreadsheet under either tab and compare teams — shared players and
how similar their position mix is. Everything runs client-side; no backend,
no data leaves the browser. Each tab keeps its own uploaded data, so you can
switch back and forth without losing anything.

## Expected spreadsheet format

Three layouts are supported per sheet (export your Google Sheet as `.xlsx`
first: File → Download → Microsoft Excel):

**Option A — one tab per team**, columns `Name` + `Position`.

**Option B — one sheet**, columns `Name` + `Position` + `Team`.

**Option C — draft-export block format**: a team name alone in column A,
followed by rows whose first cell is a position code and remaining cells
across the row list that position's players:

```
Team Underdog1
QB   Josh Allen
RB   Bijan Robinson   Jahmyr Gibbs
WR   CeeDee Lamb   Justin Jefferson

Roto5
QB   ...
```

**Soccer positions:** F (Forward), M (Midfielder), D (Defender), G (Goalie)
— full words also accepted.

**Fantasy football positions:** QB, RB, WR, TE, FLEX, K, DST — full words
(Quarterback, Running Back, etc.) also accepted.

Column headers and position values are case-insensitive.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

**Option 1 — Vercel CLI (fastest)**
```bash
npm install -g vercel
cd team-compare
vercel
```
Run `vercel --prod` to push to production.

**Option 2 — GitHub + Vercel dashboard**
```bash
cd team-compare
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-empty-github-repo-url>
git push -u origin main
```
Import that repo at [vercel.com/new](https://vercel.com/new). No config or
environment variables needed.

## Adding another sport

Add a new `SportConfig` entry to `lib/sports.ts` (positions, aliases,
labels, colors) and push it into the `SPORTS` array — the tab, parser, and
analysis all pick it up automatically.
