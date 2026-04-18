const express = require('express');
const { pool, query, queryOne } = require('../db');
const { requireAuth, requireDM } = require('../middleware/auth');

const router = express.Router();

// Public table view
router.get('/public/:token', async (req, res) => {
  try {
    const tokenRow = await queryOne("SELECT value FROM config WHERE key = 'campaign_token'");
    if (!tokenRow || tokenRow.value !== req.params.token) {
      return res.status(403).json({ error: 'Invalid campaign token' });
    }
    const factions = await query('SELECT id, name, description, color, party_score FROM factions ORDER BY name');
    res.json(factions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all factions (authenticated)
router.get('/', requireAuth, async (req, res) => {
  try {
    const factions = await query('SELECT id, name, description, color, party_score FROM factions ORDER BY name');

    if (req.user.role === 'player') {
      const withScore = await Promise.all(factions.map(async (f) => {
        const row = await queryOne(
          'SELECT score FROM faction_character_scores WHERE faction_id = $1 AND character_id = $2',
          [f.id, req.user.characterId]
        );
        return { ...f, character_score: row?.score ?? 0 };
      }));
      return res.json(withScore);
    }

    const withScores = await Promise.all(factions.map(async (f) => {
      const characterScores = await query(
        `SELECT fcs.score, c.id AS character_id, c.name AS character_name
         FROM faction_character_scores fcs
         JOIN characters c ON c.id = fcs.character_id
         WHERE fcs.faction_id = $1 AND c.active = TRUE
         ORDER BY c.name`,
        [f.id]
      );
      return { ...f, character_scores: characterScores };
    }));
    res.json(withScores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single faction with NPCs
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const faction = await queryOne('SELECT * FROM factions WHERE id = $1', [req.params.id]);
    if (!faction) return res.status(404).json({ error: 'Faction not found' });

    const npcs = req.user.role === 'dm'
      ? await query('SELECT * FROM npcs WHERE faction_id = $1 ORDER BY name', [req.params.id])
      : await query('SELECT id, faction_id, name, description FROM npcs WHERE faction_id = $1 ORDER BY name', [req.params.id]);

    res.json({ ...faction, npcs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create faction (DM only)
router.post('/', requireDM, async (req, res) => {
  try {
    const { name, description, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const faction = await queryOne(
      'INSERT INTO factions (name, description, color) VALUES ($1, $2, $3) RETURNING *',
      [name, description || '', color || '#888888']
    );

    const characters = await query('SELECT id FROM characters WHERE active = TRUE');
    await Promise.all(characters.map((c) =>
      pool.query(
        'INSERT INTO faction_character_scores (faction_id, character_id, score) VALUES ($1, $2, 0) ON CONFLICT DO NOTHING',
        [faction.id, c.id]
      )
    ));

    res.status(201).json(faction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update faction (DM only)
router.put('/:id', requireDM, async (req, res) => {
  try {
    const faction = await queryOne('SELECT id FROM factions WHERE id = $1', [req.params.id]);
    if (!faction) return res.status(404).json({ error: 'Faction not found' });

    const { name, description, color } = req.body;
    const updated = await queryOne(
      `UPDATE factions
       SET name        = COALESCE($1, name),
           description = COALESCE($2, description),
           color       = COALESCE($3, color)
       WHERE id = $4 RETURNING *`,
      [name ?? null, description ?? null, color ?? null, req.params.id]
    );
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete faction (DM only)
router.delete('/:id', requireDM, async (req, res) => {
  try {
    const faction = await queryOne('SELECT id FROM factions WHERE id = $1', [req.params.id]);
    if (!faction) return res.status(404).json({ error: 'Faction not found' });

    await pool.query('DELETE FROM factions WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set party score (DM only)
router.post('/:id/party-score', requireDM, async (req, res) => {
  try {
    const { score, note } = req.body;
    if (score === undefined || score === null) return res.status(400).json({ error: 'Score required' });

    const faction = await queryOne('SELECT * FROM factions WHERE id = $1', [req.params.id]);
    if (!faction) return res.status(404).json({ error: 'Faction not found' });

    const delta = parseInt(score) - faction.party_score;

    const updated = await queryOne(
      'UPDATE factions SET party_score = $1 WHERE id = $2 RETURNING *',
      [parseInt(score), req.params.id]
    );

    await pool.query(
      `INSERT INTO reputation_events
         (faction_id, character_id, score_delta, description, status, submitted_by, dm_note)
       VALUES ($1, NULL, $2, $3, 'approved', 'dm', '')`,
      [req.params.id, delta, note || `Party score set to ${score}`]
    );

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Adjust character score (DM only)
router.post('/:factionId/character-score/:characterId', requireDM, async (req, res) => {
  try {
    const { delta, note } = req.body;
    if (delta === undefined || delta === null) return res.status(400).json({ error: 'Delta required' });
    if (!note) return res.status(400).json({ error: 'Note required' });

    const { factionId, characterId } = req.params;

    await pool.query(
      `INSERT INTO faction_character_scores (faction_id, character_id, score)
       VALUES ($1, $2, $3)
       ON CONFLICT (faction_id, character_id)
       DO UPDATE SET score = faction_character_scores.score + $3, updated_at = NOW()`,
      [factionId, characterId, parseInt(delta)]
    );

    await pool.query(
      `INSERT INTO reputation_events
         (faction_id, character_id, score_delta, description, status, submitted_by)
       VALUES ($1, $2, $3, $4, 'approved', 'dm')`,
      [factionId, characterId, parseInt(delta), note]
    );

    const row = await queryOne(
      'SELECT score FROM faction_character_scores WHERE faction_id = $1 AND character_id = $2',
      [factionId, characterId]
    );
    res.json({ score: row.score });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
