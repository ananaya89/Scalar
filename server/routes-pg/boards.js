import { Router } from 'express';
import { db, transaction } from '../pg-db.js';

const router = Router();
const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

router.get('/', asyncHandler(async (req, res) => {
  const boards = await db.many(
    `SELECT
       b.*,
       (SELECT COUNT(*)::int FROM lists WHERE board_id = b.id AND archived = FALSE) AS list_count,
       (
         SELECT COUNT(*)::int
         FROM cards c
         JOIN lists l ON c.list_id = l.id
         WHERE l.board_id = b.id AND c.archived = FALSE
       ) AS card_count
     FROM boards b
     ORDER BY b.created_at DESC`
  );

  res.json(boards);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { title, background = '#0079BF' } = req.body;
  if (!title?.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const board = await transaction(async (tx) => {
    const inserted = await tx.one(
      'INSERT INTO boards (title, background) VALUES ($1, $2) RETURNING *',
      [title.trim(), background]
    );
    const colors = ['#61BD4F', '#F2D600', '#FF9F1A', '#EB5A46', '#C377E0', '#0079BF'];

    for (const color of colors) {
      await tx.query(
        'INSERT INTO labels (board_id, name, color) VALUES ($1, $2, $3)',
        [inserted.id, '', color]
      );
    }

    return inserted;
  });

  res.status(201).json(board);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const board = await db.one('SELECT * FROM boards WHERE id = $1', [req.params.id]);
  if (!board) {
    return res.status(404).json({ error: 'Board not found' });
  }

  const [labels, lists, cards, cardLabels, cardMembers, checklistStats] = await Promise.all([
    db.many('SELECT * FROM labels WHERE board_id = $1 ORDER BY id', [board.id]),
    db.many('SELECT * FROM lists WHERE board_id = $1 AND archived = FALSE ORDER BY position', [board.id]),
    db.many(
      `SELECT c.*
       FROM cards c
       JOIN lists l ON c.list_id = l.id
       WHERE l.board_id = $1 AND c.archived = FALSE
       ORDER BY c.position`,
      [board.id]
    ),
    db.many(
      `SELECT cl.card_id, l.*
       FROM card_labels cl
       JOIN labels l ON cl.label_id = l.id
       WHERE l.board_id = $1`,
      [board.id]
    ),
    db.many(
      `SELECT cm.card_id, m.*
       FROM card_members cm
       JOIN members m ON cm.member_id = m.id
       JOIN cards c ON cm.card_id = c.id
       JOIN lists l ON c.list_id = l.id
       WHERE l.board_id = $1`,
      [board.id]
    ),
    db.many(
      `SELECT
         c.id AS card_id,
         COUNT(ci.id)::int AS total_items,
         COALESCE(SUM(CASE WHEN ci.completed THEN 1 ELSE 0 END), 0)::int AS completed_items
       FROM cards c
       JOIN lists l ON c.list_id = l.id
       JOIN checklists ch ON ch.card_id = c.id
       JOIN checklist_items ci ON ci.checklist_id = ch.id
       WHERE l.board_id = $1 AND c.archived = FALSE
       GROUP BY c.id`,
      [board.id]
    ),
  ]);

  const labelMap = {};
  for (const item of cardLabels) {
    if (!labelMap[item.card_id]) {
      labelMap[item.card_id] = [];
    }
    labelMap[item.card_id].push({ id: item.id, name: item.name, color: item.color });
  }

  const memberMap = {};
  for (const item of cardMembers) {
    if (!memberMap[item.card_id]) {
      memberMap[item.card_id] = [];
    }
    memberMap[item.card_id].push({
      id: item.id,
      name: item.name,
      avatar_color: item.avatar_color,
    });
  }

  const checklistMap = {};
  for (const item of checklistStats) {
    checklistMap[item.card_id] = {
      total: item.total_items,
      completed: item.completed_items,
    };
  }

  res.json({
    ...board,
    labels,
    lists: lists.map((list) => ({
      ...list,
      cards: cards
        .filter((card) => card.list_id === list.id)
        .map((card) => ({
          ...card,
          labels: labelMap[card.id] || [],
          members: memberMap[card.id] || [],
          checklist_stats: checklistMap[card.id] || null,
        })),
    })),
  });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { title, background } = req.body;
  const board = await db.one('SELECT * FROM boards WHERE id = $1', [req.params.id]);
  if (!board) {
    return res.status(404).json({ error: 'Board not found' });
  }

  await db.query(
    `UPDATE boards
     SET title = COALESCE($1, title),
         background = COALESCE($2, background)
     WHERE id = $3`,
    [title ?? null, background ?? null, req.params.id]
  );

  res.json(await db.one('SELECT * FROM boards WHERE id = $1', [req.params.id]));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const result = await db.query('DELETE FROM boards WHERE id = $1', [req.params.id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Board not found' });
  }

  res.json({ success: true });
}));

router.put('/:id/labels/:labelId', asyncHandler(async (req, res) => {
  const { name, color } = req.body;
  const result = await db.query(
    `UPDATE labels
     SET name = COALESCE($1, name),
         color = COALESCE($2, color)
     WHERE id = $3 AND board_id = $4`,
    [name ?? null, color ?? null, req.params.labelId, req.params.id]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Label not found' });
  }

  res.json(await db.one('SELECT * FROM labels WHERE id = $1', [req.params.labelId]));
}));

export default router;
