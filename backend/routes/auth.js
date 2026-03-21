const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { sendOTP } = require('../mailer');

// Generate 6 digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

// Login — step 1: verify password, send OTP
router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid input data' });

    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err || results.length === 0)
        return res.status(400).json({ error: 'Invalid email or password' });
      const user = results[0];
      if (!bcrypt.compareSync(password, user.password))
        return res.status(400).json({ error: 'Invalid email or password' });

      // Generate OTP
      const otp = generateOTP();
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save OTP to database
      db.query('DELETE FROM otp_codes WHERE email = ?', [email], () => {
        db.query('INSERT INTO otp_codes (email, otp, expires_at) VALUES (?, ?, ?)',
          [email, otp, expires],
          async (err) => {
            if (err) return res.status(500).json({ error: 'Failed to generate code' });
            try {
              await sendOTP(email, otp);
              res.json({ message: 'Code sent to your email', requiresOTP: true });
            } catch {
              res.status(500).json({ error: 'Failed to send email' });
            }
          }
        );
      });
    });
  }
);

// Login — step 2: verify OTP
router.post('/verify-otp',
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid input data' });

    const { email, otp } = req.body;
    db.query(
      'SELECT * FROM otp_codes WHERE email = ? AND otp = ? AND expires_at > NOW()',
      [email, otp],
      (err, results) => {
        if (err || results.length === 0)
          return res.status(400).json({ error: 'Invalid or expired code' });

        // Delete used OTP
        db.query('DELETE FROM otp_codes WHERE email = ?', [email]);

        // Get user and return token
        db.query('SELECT * FROM users WHERE email = ?', [email], (err, users) => {
          if (err || users.length === 0)
            return res.status(400).json({ error: 'User not found' });
          const user = users[0];
          const token = jwt.sign(
            { id: user.id, name: user.name },
            'novatech_secret_key_2026',
            { expiresIn: '7d' }
          );
          res.json({ token, name: user.name });
        });
      }
    );
  }
);

module.exports = router;