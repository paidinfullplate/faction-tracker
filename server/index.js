require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { migrate, seed } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',       require('./routes/auth'));
app.use('/api/factions',   require('./routes/factions'));
app.use('/api/characters', require('./routes/characters'));
app.use('/api/events',     require('./routes/events'));
app.use('/api/npcs',       require('./routes/npcs'));
app.get('/api/health',     (req, res) => res.json({ ok: true }));

// Run migrations + seed, then start (only when executed directly)
const ready = migrate().then(seed).catch((err) => {
  console.error('[DB] Startup error:', err);
  process.exit(1);
});

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  ready.then(() =>
    app.listen(PORT, () =>
      console.log(`[Server] Faction Tracker running on http://localhost:${PORT}`)
    )
  );
}

module.exports = app;
