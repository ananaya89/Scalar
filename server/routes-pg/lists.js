import { Router } from 'express';
import { db, transaction } from '../pg-db.js';

const router = Router();
const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

router.post('/', asyncHandler(async (req, res) => {
  const { board_id, title } = req.body;
  if (!board_id || !title?.trim()) {
    return res.status(400).json({ error: 'board_id and title are required' });
  }

  const maxPos = await db.one(
    'SELECT COALESCE(MAX(position), -1) AS max_position FROM lists WHERE board_id = $1 AND archived = FALSE',
    [board_id]
  );

  const list = await db.one(
    'INSERT INTO lists (board_id, title, position) VALUES ($1, $2, $3) RETURNING *',
    [board_id, title.trim(), Number(maxPos.max_position) + 1]
  );

  res.status(201).json({ ...list, cards: [] });
}));

router.put('/reorder', asyncHandler(async (req, res) => {
  const { boardId, orderedListIds } = req.body;
  if (!boardId || !orderedListIds?.length) {
    return res.status(400).json({ error: 'boardId and orderedListIds are required' });
  }

  await transaction(async (tx) => {
    for (const [index, id] of orderedListIds.entries()) {
      await tx.query('UPDATE lists SET position = $1 WHERE id = $2 AND board_id = $3', [
        index,
        id,
        boardId,
      ]);
    }
  });

  res.json({ success: true });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { title } = req.body;
  const list = await db.one('SELECT * FROM lists WHERE id = $1', [req.params.id]);
  if (!list) {
    return res.status(404).json({ error: 'List not found' });
  }

  if (title !== undefined) {
    await db.query('UPDATE lists SET title = $1 WHERE id = $2', [title.trim(), req.params.id]);
  }

  res.json(await db.one('SELECT * FROM lists WHERE id = $1', [req.params.id]));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const list = await db.one('SELECT * FROM lists WHERE id = $1', [req.params.id]);
  if (!list) {
    return res.status(404).json({ error: 'List not found' });
  }

  await transaction(async (tx) => {
    await tx.query('DELETE FROM lists WHERE id = $1', [req.params.id]);
    const remaining = await tx.many(
      'SELECT id FROM lists WHERE board_id = $1 AND archived = FALSE ORDER BY position',
      [list.board_id]
    );

    for (const [index, item] of remaining.entries()) {
      await tx.query('UPDATE lists SET position = $1 WHERE id = $2', [index, item.id]);
    }
  });

  res.json({ success: true });
}));

export default router;
