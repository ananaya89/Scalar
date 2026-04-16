import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/boards/:boardId/search?q= — Search cards by title
router.get('/boards/:boardId/search', (req, res) => {
  try {
    const { q } = req.query;
    if (!q?.trim()) return res.json([]);

    const cards = db.prepare(`
      SELECT c.*, l.title as list_title FROM cards c
      JOIN lists l ON c.list_id = l.id
      WHERE l.board_id = ? AND c.archived = 0
        AND c.title LIKE ?
      ORDER BY c.title
    `).all(req.params.boardId, `%${q.trim()}%`);

    res.json(cards);
  } catch (err) {
    console.error('GET /boards/:boardId/search error:', err);
    res.status(500).json({ error: 'Failed to search cards' });
  }
});

// GET /api/boards/:boardId/cards/filter — Filter cards
router.get('/boards/:boardId/cards/filter', (req, res) => {
  try {
    const { labels, members, due } = req.query;
    let query = `
      SELECT DISTINCT c.*, l.title as list_title FROM cards c
      JOIN lists l ON c.list_id = l.id
    `;
    const conditions = ['l.board_id = ?', 'c.archived = 0'];
    const params = [req.params.boardId];

    if (labels) {
      query += ' JOIN card_labels cl ON cl.card_id = c.id';
      const labelIds = labels.split(',').map(Number);
      conditions.push(`cl.label_id IN (${labelIds.map(() => '?').join(',')})`);
      params.push(...labelIds);
    }

    if (members) {
      query += ' JOIN card_members cm ON cm.card_id = c.id';
      const memberIds = members.split(',').map(Number);
      conditions.push(`cm.member_id IN (${memberIds.map(() => '?').join(',')})`);
      params.push(...memberIds);
    }

    if (due === 'overdue') {
      conditions.push("c.due_date IS NOT NULL AND c.due_date < date('now')");
    } else if (due === 'soon') {
      conditions.push("c.due_date IS NOT NULL AND c.due_date BETWEEN date('now') AND date('now', '+7 days')");
    } else if (due === 'none') {
      conditions.push('c.due_date IS NULL');
    }

    query += ` WHERE ${conditions.join(' AND ')} ORDER BY c.position`;

    const cards = db.prepare(query).all(...params);
    res.json(cards);
  } catch (err) {
    console.error('GET /boards/:boardId/cards/filter error:', err);
    res.status(500).json({ error: 'Failed to filter cards' });
  }
});

export default router;
