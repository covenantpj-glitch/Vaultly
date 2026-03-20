const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

// Middleware to verify token
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, 'novatech_secret_key_2026');
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Get all transactions for logged-in user
router.get('/', auth, (req, res) => {
  db.query('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC',
    [req.user.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// Add transaction
router.post('/', auth, (req, res) => {
  const { type, category, amount, description, date } = req.body;
  db.query(
    'INSERT INTO transactions (user_id, type, category, amount, description, date) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.id, type, category, amount, description, date],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, message: 'Transaction added' });
    }
  );
});

// Delete transaction
router.delete('/:id', auth, (req, res) => {
  db.query('DELETE FROM transactions WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Deleted' });
    }
  );
});

module.exports = router;
