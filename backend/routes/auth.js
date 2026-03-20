require('dotenv').config();

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  const hashed = bcrypt.hashSync(password, 10);
  db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    [name, email, hashed],
    (err) => {
      if (err) return res.status(400).json({ error: 'Email already exists' });
      res.json({ message: 'Account created successfully' });
    }
  );
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err || results.length === 0)
      return res.status(400).json({ error: 'Invalid email or password' });
    const user = results[0];
    if (!bcrypt.compareSync(password, user.password))
      return res.status(400).json({ error: 'Invalid email or password' });
    const token = jwt.sign({ id: user.id, name: user.name }, 'novatech_secret_key_2026', { expiresIn: '7d' });
    res.json({ token, name: user.name });
  });
});

module.exports = router;