const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryOne } = require('../db');
const { JWT_SECRET, requireDM } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { type, password, name } = req.body;

    if (type === 'dm') {
      const dmPassword = process.env.DM_PASSWORD || 'dm1234';
      if (password !== dmPassword) return res.status(401).json({ error: 'Invalid DM password' });
      const token = jwt.sign({ role: 'dm' }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, role: 'dm' });
    }

    if (type === 'player') {
      if (!name || !password) return res.status(400).json({ error: 'Character name and password required' });
      const character = await queryOne('SELECT * FROM characters WHERE name = $1 AND active = TRUE', [name]);
      if (!character || !bcrypt.compareSync(password, character.password_hash)) {
        return res.status(401).json({ error: 'Invalid character name or password' });
      }
      const token = jwt.sign(
        { role: 'player', characterId: character.id, characterName: character.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({ token, role: 'player', characterId: character.id, characterName: character.name });
    }

    return res.status(400).json({ error: 'type must be "dm" or "player"' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/characters', async (req, res) => {
  try {
    const { query } = require('../db');
    const characters = await query('SELECT id, name FROM characters WHERE active = TRUE ORDER BY name');
    res.json(characters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/campaign-token', requireDM, async (req, res) => {
  try {
    const row = await queryOne("SELECT value FROM config WHERE key = 'campaign_token'");
    res.json({ token: row?.value ?? null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
