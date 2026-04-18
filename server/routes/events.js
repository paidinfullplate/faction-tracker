const express = require('express');
const { pool, query, queryOne } = require('../db');
const { requireAuth, requireDM } = require('../middleware/auth');

const router = express.Router();

router.get('/pending-count', requireDM, async (req, res) => {
  try {
    const row = await queryOne("SELECT COUNT(*)::int AS count FROM reputation_events WHERE status = 'pending'");
    res.json({ count: row.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const { faction_id, character_id, status, limit = 100, offset = 0 } = req.query;

    const conditions = ['1=1'];
    const params = [];
    let p = 1;

    if (req.user.role === 'player') {
      conditions.push(`(re.character_id = $${p++} OR re.character_id IS NULL)`);
      params.push(req.user.characterId);
    } else if (character_id) {
      conditions.push(`re.character_id = $${p++}`);
      params.push(parseInt(character_id));
    }

    if (faction_id) {
      conditions.push(`re.faction_id = $${p++}`);
      params.push(parseInt(faction_id));
    }
    if (status) {
      conditions.push(`re.status = $${p++}`);
      params.push(status);
    }

    params.push(parseInt(limit), parseInt(offset));

    const events = await query(
      `SELECT re.*, f.name AS faction_name, c.name AS character_name
       FROM reputation_events re
       JOIN factions f ON f.id = re.faction_id
       LEFT JOIN characters c ON c.id = re.character_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY re.created_at DESC
       LIMIT $${p++} OFFSET $${p}`,
      params
    );
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { faction_id, character_id, score_delta, description, session_number, event_date } = req.body;
    if (!faction_id || score_delta === undefined || !description) {
      return res.status(400).json({ error: 'faction_id, score_delta, and description required' });
    }

    const faction = await queryOne('SELECT id FROM factions WHERE id = $1', [faction_id]);
    if (!faction) return res.status(404).json({ error: 'Faction not found' });

    let status = 'pending';
    let submitted_by = String(req.user.characterId);
    let actualCharId = req.user.characterId;

    if (req.user.role === 'dm') {
      status = 'approved';
      submitted_by = 'dm';
      actualCharId = character_id ?? null;
    }

    const event = await queryOne(
      `INSERT INTO reputation_events
         (faction_id, character_id, score_delta, description, session_number, event_date, status, submitted_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [faction_id, actualCharId, parseInt(score_delta), description,
       session_number ?? null, event_date ?? null, status, submitted_by]
    );

    if (status === 'approved') await applyScore(faction_id, actualCharId, parseInt(score_delta));

    const full = await queryOne(
      `SELECT re.*, f.name AS faction_name, c.name AS character_name
       FROM reputation_events re
       JOIN factions f ON f.id = re.faction_id
       LEFT JOIN characters c ON c.id = re.character_id
       WHERE re.id = $1`,
      [event.id]
    );
    res.status(201).json(full);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/approve', requireDM, async (req, res) => {
  try {
    const event = await queryOne('SELECT * FROM reputation_events WHERE id = $1', [req.params.id]);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.status !== 'pending') return res.status(400).json({ error: 'Event is not pending' });

    const { score_delta, dm_note } = req.body;
    const finalDelta = score_delta !== undefined ? parseInt(score_delta) : event.score_delta;

    await pool.query(
      "UPDATE reputation_events SET status = 'approved', score_delta = $1, dm_note = $2 WHERE id = $3",
      [finalDelta, dm_note || '', req.params.id]
    );

    await applyScore(event.faction_id, event.character_id, finalDelta);

    const updated = await queryOne(
      `SELECT re.*, f.name AS faction_name, c.name AS character_name
       FROM reputation_events re
       JOIN factions f ON f.id = re.faction_id
       LEFT JOIN characters c ON c.id = re.character_id
       WHERE re.id = $1`,
      [req.params.id]
    );
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/reject', requireDM, async (req, res) => {
  try {
    const event = await queryOne('SELECT * FROM reputation_events WHERE id = $1', [req.params.id]);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.status !== 'pending') return res.status(400).json({ error: 'Event is not pending' });

    const { dm_note } = req.body;
    await pool.query(
      "UPDATE reputation_events SET status = 'rejected', dm_note = $1 WHERE id = $2",
      [dm_note || '', req.params.id]
    );

    const updated = await queryOne(
      `SELECT re.*, f.name AS faction_name, c.name AS character_name
       FROM reputation_events re
       JOIN factions f ON f.id = re.faction_id
       LEFT JOIN characters c ON c.id = re.character_id
       WHERE re.id = $1`,
      [req.params.id]
    );
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function applyScore(factionId, characterId, delta) {
  if (characterId) {
    await pool.query(
      `INSERT INTO faction_character_scores (faction_id, character_id, score)
       VALUES ($1, $2, $3)
       ON CONFLICT (faction_id, character_id)
       DO UPDATE SET score = faction_character_scores.score + $3, updated_at = NOW()`,
      [factionId, characterId, delta]
    );
  } else {
    await pool.query(
      'UPDATE factions SET party_score = party_score + $1 WHERE id = $2',
      [delta, factionId]
    );
  }
}

module.exports = router;
