const cron = require('node-cron');
const db = require('./db');

// Run every day at midnight
cron.schedule('0 0 * * *', () => {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const dateStr = today.toISOString().split('T')[0];
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday

  console.log(`Running daily cron job — ${dateStr}`);

  // ── 1. RECURRING TRANSACTIONS ──
  db.query(
    'SELECT * FROM recurring_transactions WHERE day_of_month = ?',
    [dayOfMonth],
    (err, recurring) => {
      if (err) return console.error('Recurring error:', err);
      recurring.forEach(t => {
        db.query(
          'INSERT INTO transactions (user_id, type, category, amount, description, date) VALUES (?, ?, ?, ?, ?, ?)',
          [t.user_id, t.type, t.category, t.amount, t.description || t.category, dateStr],
          (err) => {
            if (err) console.error('Failed to insert recurring:', err);
            else console.log(`Recurring transaction added for user ${t.user_id}`);
          }
        );
      });
    }
  );

  // ── 2. MICROSPEND — runs every Monday ──
  if (dayOfWeek === 1) {
    db.query(
      'SELECT * FROM microspend WHERE active = 1',
      (err, microspends) => {
        if (err) return console.error('Microspend error:', err);
        microspends.forEach(m => {
          db.query(
            'INSERT INTO transactions (user_id, type, category, amount, description, date) VALUES (?, ?, ?, ?, ?, ?)',
            [m.user_id, 'expense', 'Microspend', m.amount, 'Microspend — weekly allowance', dateStr],
            (err) => {
              if (err) console.error('Failed to insert microspend:', err);
              else console.log(`Microspend added for user ${m.user_id}`);
            }
          );
        });
      }
    );
  }
});

console.log('Cron jobs scheduled ✅');