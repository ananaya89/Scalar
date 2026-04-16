import { Router } from 'express';
import { db } from '../pg-db.js';

const router = Router();
const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

router.get('/boards/:boardId/search', asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q?.trim()) {
    return res.json([]);
  }

  res.json(await db.many(
    `SELECT c.*, l.title AS list_title
     FROM cards c
     JOIN lists l ON c.list_id = l.id
     WHERE l.board_id = $1 AND c.archived = FALSE AND c.title ILIKE $2
     ORDER BY c.title`,
    [req.params.boardId, `%${q.trim()}%`]
  ));
}));

router.get('/boards/:boardId/cards/filter', asyncHandler(async (req, res) => {
  const { labels, members, due } = req.query;
  let query = `
    SELECT DISTINCT c.*, l.title AS list_title
    FROM cards c
    JOIN lists l ON c.list_id = l.id
  `;
  const conditions = ['l.board_id = $1', 'c.archived = FALSE'];
  const params = [req.params.boardId];
  let nextParam = 2;

  if (labels) {
    const ids = labels.split(',').map((value) => Number(value)).filter(Number.isInteger);
    if (ids.length > 0) {
      query += ' JOIN card_labels cl ON cl.card_id = c.id';
      conditions.push(`cl.label_id IN (${ids.map(() => `$${nextParam++}`).join(', ')})`);
      params.push(...ids);
    }
  }

  if (members) {
    const ids = members.split(',').map((value) => Number(value)).filter(Number.isInteger);
    if (ids.length > 0) {
      query += ' JOIN card_members cm ON cm.card_id = c.id';
      conditions.push(`cm.member_id IN (${ids.map(() => `$${nextParam++}`).join(', ')})`);
      params.push(...ids);
    }
  }

  if (due === 'overdue') {
    conditions.push('c.due_date IS NOT NULL AND c.due_date < CURRENT_DATE');
  } else if (due === 'soon') {
    conditions.push('c.due_date IS NOT NULL AND c.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7');
  } else if (due === 'none') {
    conditions.push('c.due_date IS NULL');
  }

  query += ` WHERE ${conditions.join(' AND ')} ORDER BY c.position`;
  res.json(await db.many(query, params));
}));

export default router;
