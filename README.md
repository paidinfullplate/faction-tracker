# Faction & Reputation Tracker

A D&D campaign tool for tracking your party's standing with factions. Three views: DM, Player, and a read-only table display.

## Quick Start

### 1. Install dependencies

```bash
# From the faction-tracker/ root
npm install                        # installs concurrently
npm run install:all                # installs server + client deps
```

Or install manually:

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

```bash
cd server
cp .env.example .env
# Edit .env to set DM_PASSWORD and JWT_SECRET
```

### 3. Run development servers

```bash
# From faction-tracker/ root
npm run dev
```

This starts:
- **Server** on `http://localhost:3001`
- **Client** on `http://localhost:5173`

Open `http://localhost:5173` in your browser.

---

## Default Credentials

| Role | Login | Password |
|------|-------|----------|
| DM | *(DM tab)* | `dm1234` |
| Aldric (Player 1) | `Aldric` | `player1` |
| Zara (Player 2) | `Zara` | `player2` |

---

## Table View (read-only)

After logging in as DM, your Dashboard shows a **Table View URL** — share this with players or display it on a TV. It requires no login and auto-refreshes every 60 seconds.

URL format: `http://localhost:5173/view/<campaign-token>`

---

## Features

### DM
- Dashboard overview of all factions and character scores
- Create, edit, delete factions with color coding
- Set party score per faction (logged as event)
- Adjust individual character scores with required notes
- Approve / reject / modify player-submitted events
- Manage character accounts (create, edit, deactivate)
- Add / edit / delete NPCs per faction (with private DM notes)
- Full filterable event log

### Players
- View personal + party reputation per faction (side by side)
- Submit proposed reputation events for DM review
- Track own event history with status and DM notes
- Click any faction to see its description, NPCs, and personal history

### Table View
- Public read-only display of all faction party standings
- Auto-refreshes every 60 seconds — suitable for a TV

---

## Reputation Tiers

| Range | Tier | Color |
|-------|------|-------|
| −100 to −61 | Hostile | Red |
| −60 to −21 | Unfriendly | Orange |
| −20 to +20 | Neutral | Gray |
| +21 to +60 | Friendly | Green |
| +61 to +90 | Honored | Blue |
| +91 to +100 | Exalted | Purple |

---

## Tech Stack

- **Frontend**: React 18 + Vite + React Router v6 + Axios
- **Backend**: Node.js + Express
- **Database**: SQLite via `better-sqlite3`
- **Auth**: JWT + bcrypt

## Project Structure

```
faction-tracker/
├── package.json          root scripts (concurrently)
├── server/
│   ├── index.js          Express entry point
│   ├── db.js             SQLite setup, migrations, seed data
│   ├── middleware/auth.js JWT verification
│   └── routes/
│       ├── auth.js
│       ├── factions.js
│       ├── characters.js
│       ├── events.js
│       └── npcs.js
└── client/
    ├── index.html
    ├── vite.config.js    dev proxy → localhost:3001
    └── src/
        ├── App.jsx       routing
        ├── index.css     all styles (CSS variables)
        ├── context/      AuthContext
        ├── api/          axios client
        ├── components/   NavBar, ReputationBar, TierBadge
        ├── utils/        tier mapping helpers
        └── pages/
            ├── Login.jsx
            ├── TableView.jsx
            ├── dm/       Dashboard, FactionManager, CharacterManager,
            │             PendingQueue, EventLog
            └── player/   MyReputation, SubmitEvent, MyHistory, FactionDetail
```
