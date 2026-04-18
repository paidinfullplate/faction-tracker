require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function query(text, params = []) {
  const { rows } = await pool.query(text, params);
  return rows;
}

async function queryOne(text, params = []) {
  const rows = await query(text, params);
  return rows[0] ?? null;
}

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS factions (
      id          SERIAL PRIMARY KEY,
      name        TEXT    NOT NULL,
      description TEXT    NOT NULL DEFAULT '',
      color       TEXT    NOT NULL DEFAULT '#888888',
      party_score INTEGER NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS characters (
      id            SERIAL PRIMARY KEY,
      name          TEXT    NOT NULL UNIQUE,
      player_name   TEXT    NOT NULL,
      password_hash TEXT    NOT NULL,
      active        BOOLEAN NOT NULL DEFAULT TRUE,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS faction_character_scores (
      id           SERIAL PRIMARY KEY,
      faction_id   INTEGER NOT NULL REFERENCES factions(id)   ON DELETE CASCADE,
      character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      score        INTEGER NOT NULL DEFAULT 0,
      updated_at   TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(faction_id, character_id)
    );

    CREATE TABLE IF NOT EXISTS reputation_events (
      id             SERIAL PRIMARY KEY,
      faction_id     INTEGER NOT NULL REFERENCES factions(id)   ON DELETE CASCADE,
      character_id   INTEGER          REFERENCES characters(id) ON DELETE SET NULL,
      score_delta    INTEGER NOT NULL,
      description    TEXT    NOT NULL,
      session_number INTEGER,
      event_date     DATE,
      status         TEXT    NOT NULL DEFAULT 'pending'
                             CHECK(status IN ('approved','pending','rejected')),
      submitted_by   TEXT    NOT NULL,
      dm_note        TEXT    NOT NULL DEFAULT '',
      created_at     TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS npcs (
      id          SERIAL PRIMARY KEY,
      faction_id  INTEGER NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
      name        TEXT    NOT NULL,
      description TEXT    NOT NULL DEFAULT '',
      notes       TEXT    NOT NULL DEFAULT '',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('[DB] Migrations complete.');
}

async function seed() {
  const row = await queryOne("SELECT value FROM config WHERE key = 'seeded'");
  if (row) return;

  const campaignToken = crypto.randomBytes(16).toString('hex');
  await pool.query("INSERT INTO config (key, value) VALUES ('seeded', '1')");
  await pool.query("INSERT INTO config (key, value) VALUES ('campaign_token', $1)", [campaignToken]);

  const { rows: [faction] } = await pool.query(
    `INSERT INTO factions (name, description, color, party_score)
     VALUES ($1, $2, $3, 0) RETURNING id`,
    [
      'The City Watch',
      'The official peacekeeping force of the city, responsible for maintaining order and enforcing the law. They patrol the streets, man the gates, and answer to the Lord Commander.',
      '#4a6fa5',
    ]
  );

  const hash1 = bcrypt.hashSync('player1', 10);
  const hash2 = bcrypt.hashSync('player2', 10);

  const { rows: [c1] } = await pool.query(
    'INSERT INTO characters (name, player_name, password_hash) VALUES ($1, $2, $3) RETURNING id',
    ['Aldric', 'Player 1', hash1]
  );
  const { rows: [c2] } = await pool.query(
    'INSERT INTO characters (name, player_name, password_hash) VALUES ($1, $2, $3) RETURNING id',
    ['Zara', 'Player 2', hash2]
  );

  await pool.query(
    `INSERT INTO faction_character_scores (faction_id, character_id, score) VALUES
     ($1, $2, 0), ($1, $3, 0)`,
    [faction.id, c1.id, c2.id]
  );

  await pool.query(
    'INSERT INTO npcs (faction_id, name, description, notes) VALUES ($1, $2, $3, $4)',
    [
      faction.id,
      'Captain Varek',
      'Grizzled veteran commander of the East Gate garrison',
      'Responds well to direct, honest dealings. Dislikes magic users. Has a soft spot for veterans.',
    ]
  );

  console.log('[DB] Seeded. Campaign token:', campaignToken);
}

module.exports = { pool, query, queryOne, migrate, seed };
