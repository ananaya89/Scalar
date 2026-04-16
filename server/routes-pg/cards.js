import { Router } from 'express';
import { db, transaction } from '../pg-db.js';

const router = Router();
const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

function toOptionalBoolean(value) {
  if (value === undefined || value === null) {
    return null;
  }
  return Boolean(value);
}

router.put('/reorder', asyncHandler(async (req, res) => {
  const { sourceListId, destListId, orderedSourceIds, orderedDestIds } = req.body;

  await transaction(async (tx) => {
    if (sourceListId === destListId) {
      for (const [index, id] of (orderedSourceIds || []).entries()) {
        await tx.query('UPDATE cards SET list_id = $1, position = $2 WHERE id = $3', [
          sourceListId,
          index,
          id,
        ]);
      }
      return;
    }

    for (const [index, id] of (orderedSourceIds || []).entries()) {
      await tx.query('UPDATE cards SET list_id = $1, position = $2 WHERE id = $3', [
        sourceListId,
        index,
        id,
      ]);
    }

    for (const [index, id] of (orderedDestIds || []).entries()) {
      await tx.query('UPDATE cards SET list_id = $1, position = $2 WHERE id = $3', [
        destListId,
        index,
        id,
      ]);
    }
  });

  res.json({ success: true });
}));

router.delete('/checklists/:id', asyncHandler(async (req, res) => {
  await db.query('DELETE FROM checklists WHERE id = $1', [req.params.id]);
  res.json({ success: true });
}));

router.post('/checklists/:checklistId/items', asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const maxPos = await db.one(
    'SELECT COALESCE(MAX(position), -1) AS max_position FROM checklist_items WHERE checklist_id = $1',
    [req.params.checklistId]
  );

  const item = await db.one(
    'INSERT INTO checklist_items (checklist_id, text, position) VALUES ($1, $2, $3) RETURNING *',
    [req.params.checklistId, text.trim(), Number(maxPos.max_position) + 1]
  );

  res.status(201).json(item);
}));

router.put('/checklist-items/:id', asyncHandler(async (req, res) => {
  const { text, completed } = req.body;
  const item = await db.one('SELECT * FROM checklist_items WHERE id = $1', [req.params.id]);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  await db.query(
    `UPDATE checklist_items
     SET text = COALESCE($1, text),
         completed = COALESCE($2, completed)
     WHERE id = $3`,
    [text ?? null, toOptionalBoolean(completed), req.params.id]
  );

  res.json(await db.one('SELECT * FROM checklist_items WHERE id = $1', [req.params.id]));
}));

router.delete('/checklist-items/:id', asyncHandler(async (req, res) => {
  await db.query('DELETE FROM checklist_items WHERE id = $1', [req.params.id]);
  res.json({ success: true });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { list_id, title } = req.body;
  if (!list_id || !title?.trim()) {
    return res.status(400).json({ error: 'list_id and title are required' });
  }

  const maxPos = await db.one(
    'SELECT COALESCE(MAX(position), -1) AS max_position FROM cards WHERE list_id = $1 AND archived = FALSE',
    [list_id]
  );

  const card = await db.one(
    'INSERT INTO cards (list_id, title, position) VALUES ($1, $2, $3) RETURNING *',
    [list_id, title.trim(), Number(maxPos.max_position) + 1]
  );

  res.status(201).json({ ...card, labels: [], members: [], checklist_stats: null });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const card = await db.one('SELECT * FROM cards WHERE id = $1', [req.params.id]);
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }

  const [labels, members, checklists] = await Promise.all([
    db.many(
      `SELECT l.* FROM labels l
       JOIN card_labels cl ON cl.label_id = l.id
       WHERE cl.card_id = $1`,
      [card.id]
    ),
    db.many(
      `SELECT m.* FROM members m
       JOIN card_members cm ON cm.member_id = m.id
       WHERE cm.card_id = $1`,
      [card.id]
    ),
    db.many('SELECT * FROM checklists WHERE card_id = $1 ORDER BY id', [card.id]),
  ]);

  for (const checklist of checklists) {
    checklist.items = await db.many(
      'SELECT * FROM checklist_items WHERE checklist_id = $1 ORDER BY position',
      [checklist.id]
    );
  }

  res.json({ ...card, labels, members, checklists });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { title, description, due_date, archived } = req.body;
  const card = await db.one('SELECT * FROM cards WHERE id = $1', [req.params.id]);
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }

  await db.query(
    `UPDATE cards
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         due_date = $3,
         archived = COALESCE($4, archived)
     WHERE id = $5`,
    [
      title ?? null,
      description ?? null,
      due_date !== undefined ? due_date : card.due_date,
      toOptionalBoolean(archived),
      req.params.id,
    ]
  );

  res.json(await db.one('SELECT * FROM cards WHERE id = $1', [req.params.id]));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const card = await db.one('SELECT * FROM cards WHERE id = $1', [req.params.id]);
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }

  await transaction(async (tx) => {
    await tx.query('DELETE FROM cards WHERE id = $1', [req.params.id]);
    const remaining = await tx.many(
      'SELECT id FROM cards WHERE list_id = $1 AND archived = FALSE ORDER BY position',
      [card.list_id]
    );

    for (const [index, item] of remaining.entries()) {
      await tx.query('UPDATE cards SET position = $1 WHERE id = $2', [index, item.id]);
    }
  });

  res.json({ success: true });
}));

router.post('/:id/labels', asyncHandler(async (req, res) => {
  const { label_id } = req.body;
  await db.query(
    'INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [req.params.id, label_id]
  );

  res.json(await db.many(
    `SELECT l.* FROM labels l
     JOIN card_labels cl ON cl.label_id = l.id
     WHERE cl.card_id = $1`,
    [req.params.id]
  ));
}));

router.delete('/:id/labels/:labelId', asyncHandler(async (req, res) => {
  await db.query('DELETE FROM card_labels WHERE card_id = $1 AND label_id = $2', [
    req.params.id,
    req.params.labelId,
  ]);

  res.json(await db.many(
    `SELECT l.* FROM labels l
     JOIN card_labels cl ON cl.label_id = l.id
     WHERE cl.card_id = $1`,
    [req.params.id]
  ));
}));

router.post('/:id/members', asyncHandler(async (req, res) => {
  const { member_id } = req.body;
  await db.query(
    'INSERT INTO card_members (card_id, member_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [req.params.id, member_id]
  );

  res.json(await db.many(
    `SELECT m.* FROM members m
     JOIN card_members cm ON cm.member_id = m.id
     WHERE cm.card_id = $1`,
    [req.params.id]
  ));
}));

router.delete('/:id/members/:memberId', asyncHandler(async (req, res) => {
  await db.query('DELETE FROM card_members WHERE card_id = $1 AND member_id = $2', [
    req.params.id,
    req.params.memberId,
  ]);

  res.json(await db.many(
    `SELECT m.* FROM members m
     JOIN card_members cm ON cm.member_id = m.id
     WHERE cm.card_id = $1`,
    [req.params.id]
  ));
}));

router.post('/:id/checklists', asyncHandler(async (req, res) => {
  const { title = 'Checklist' } = req.body;
  const checklist = await db.one(
    'INSERT INTO checklists (card_id, title) VALUES ($1, $2) RETURNING *',
    [req.params.id, title]
  );

  res.status(201).json({ ...checklist, items: [] });
}));

export default router;
