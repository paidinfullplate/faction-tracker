const express = require('express');
const bcrypt = require('bcryptjs');
const { pool, query, queryOne } = require('../db');
const { requireDM } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireDM, async (req, res) => {
  try {
    const characters = await query(
      'SELECT id, name, player_name, active, created_at FROM characters ORDER BY name'
    );
    res.json(characters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requireDM, async (req, res) => {
  try {
    const { name, player_name, password } = req.body;
    if (!name || !player_name || !password) {
      return res.status(400).json({ error: 'name, player_name, and password required' });
    }

    const existing = await queryOne('SELECT id FROM characters WHERE name = $1', [name]);
    if (existing) return res.status(409).json({ error: 'Character name already in use' });

    const hash = bcrypt.hashSync(password, 10);
    const character = await queryOne(
      `INSERT INTO characters (name, player_name, password_hash)
       VALUES ($1, $2, $3) RETURNING id, name, player_name, active, created_at`,
      [name, player_name, hash]
    );

    const factions = await query('SELECT id FROM factions');
    await Promise.all(factions.map((f) =>
      pool.query(
        'INSERT INTO faction_character_scores (faction_id, character_id, score) VALUES ($1, $2, 0) ON CONFLICT DO NOTHING',
        [f.id, character.id]
      )
    ));

    res.status(201).json(character);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', requireDM, async (req, res) => {
  try {
    const existing = await queryOne('SELECT id FROM characters WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Character not found' });

    const { name, player_name, password } = req.body;
    let updated;

    if (password) {
      const hash = bcrypt.hashSync(password, 10);
      updated = await queryOne(
        `UPDATE characters
         SET name = COALESCE($1, name), player_name = COALESCE($2, player_name), password_hash = $3
         WHERE id = $4
         RETURNING id, name, player_name, active, created_at`,
        [name ?? null, player_name ?? null, hash, req.params.id]
      );
    } else {
      updated = await queryOne(
        `UPDATE characters
         SET name = COALESCE($1, name), player_name = COALESCE($2, player_name)
         WHERE id = $3
         RETURNING id, name, player_name, active, created_at`,
        [name ?? null, player_name ?? null, req.params.id]
      );
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/deactivate', requireDM, async (req, res) => {
  try {
    await pool.query('UPDATE characters SET active = FALSE WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/activate', requireDM, async (req, res) => {
  try {
    await pool.query('UPDATE characters SET active = TRUE WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
