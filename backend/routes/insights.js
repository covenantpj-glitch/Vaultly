const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

router.get('/', auth, async (req, res) => {
  db.query(
    'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC LIMIT 50',
    [req.user.id],
    async (err, transactions) => {
      if (err) return res.status(500).json({ error: err.message });
      if (transactions.length === 0) return res.json({ insight: "No transactions yet — add some income and expenses to get insights!" });

      const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
      const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
      const balance = income - expense;

      const categories = {};
      transactions.filter(t => t.type === 'expense').forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + parseFloat(t.amount);
      });

      const topCategories = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cat, amt]) => `${cat}: R${amt.toFixed(2)}`)
        .join(', ');

      const summary = `
        Total income: R${income.toFixed(2)}
        Total expenses: R${expense.toFixed(2)}
        Balance: R${balance.toFixed(2)}
        Top expense categories: ${topCategories}
        Number of transactions: ${transactions.length}
        Most recent transactions: ${transactions.slice(0, 5).map(t => `${t.type} R${t.amount} (${t.category})`).join(', ')}
      `;

      try {
        const message = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: `You are a friendly personal finance assistant for a South African user. Based on their spending data below, give 3 short, specific observations about their finances. Be encouraging but honest. Point out patterns, potential savings, or things to watch. Do NOT give regulated financial advice. Keep it conversational, warm, and under 150 words. Use South African context (Rands).

Data: ${summary}

Format your response as 3 short bullet points starting with an emoji.`
          }]
        });
        res.json({ insight: message.content[0].text });
      } catch (e) {
        res.status(500).json({ error: 'Failed to generate insights' });
      }
    }
  );
});

module.exports = router;