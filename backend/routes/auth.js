const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../db');

// Register
router.post('/register',
  body('name').trim().notEmpty().isLength({ max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid input data' });

    const { name, email, password } = req.body;
    const hashed = bcrypt.hashSync(password, 12);
    db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashed],
      (err) => {
        if (err) return res.status(400).json({ error: 'Email already exists' });
        res.json({ message: 'Account created successfully' });
      }
    );
  }
);

// Login
router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid input data' });

    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
      if (err || results.length === 0)
        return res.status(400).json({ error: 'Invalid email or password' });
      const user = results[0];
      if (!bcrypt.compareSync(password, user.password))
        return res.status(400).json({ error: 'Invalid email or password' });
      const token = jwt.sign(
        { id: user.id, name: user.name },
        'novatech_secret_key_2026',
        { expiresIn: '7d' }
      );
      res.json({ token, name: user.name });
    });
  }
);

module.exports = router;
