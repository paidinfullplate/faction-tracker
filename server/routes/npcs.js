const express = require('express');
const { pool, queryOne } = require('../db');
const { requireDM } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireDM, async (req, res) => {
  try {
    const { faction_id, name, description, notes } = req.body;
    if (!faction_id || !name) return res.status(400).json({ error: 'faction_id and name required' });

    const faction = await queryOne('SELECT id FROM factions WHERE id = $1', [faction_id]);
    if (!faction) return res.status(404).json({ error: 'Faction not found' });

    const npc = await queryOne(
      'INSERT INTO npcs (faction_id, name, description, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [faction_id, name, description || '', notes || '']
    );
    res.status(201).json(npc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', requireDM, async (req, res) => {
  try {
    const existing = await queryOne('SELECT id FROM npcs WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'NPC not found' });

    const { name, description, notes } = req.body;
    const npc = await queryOne(
      `UPDATE npcs
       SET name        = COALESCE($1, name),
           description = COALESCE($2, description),
           notes       = COALESCE($3, notes)
       WHERE id = $4 RETURNING *`,
      [name ?? null, description ?? null, notes ?? null, req.params.id]
    );
    res.json(npc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireDM, async (req, res) => {
  try {
    const existing = await queryOne('SELECT id FROM npcs WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'NPC not found' });

    await pool.query('DELETE FROM npcs WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
