import { Router } from 'express';
import db from '../db.js';

const router = Router();

// POST /api/lists — Create list for a board
router.post('/', (req, res) => {
  try {
    const { board_id, title } = req.body;
    if (!board_id || !title?.trim()) {
      return res.status(400).json({ error: 'board_id and title are required' });
    }

    // Get max position in this board
    const maxPos = db.prepare(
      'SELECT COALESCE(MAX(position), -1) as maxPos FROM lists WHERE board_id = ? AND archived = 0'
    ).get(board_id);

    const result = db.prepare('INSERT INTO lists (board_id, title, position) VALUES (?, ?, ?)')
      .run(board_id, title.trim(), maxPos.maxPos + 1);

    const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ ...list, cards: [] });
  } catch (err) {
    console.error('POST /lists error:', err);
    res.status(500).json({ error: 'Failed to create list' });
  }
});

// PUT /api/lists/:id — Update list title
router.put('/:id', (req, res) => {
  try {
    const { title } = req.body;
    const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(req.params.id);
    if (!list) return res.status(404).json({ error: 'List not found' });

    if (title !== undefined) {
      db.prepare('UPDATE lists SET title = ? WHERE id = ?').run(title.trim(), req.params.id);
    }

    const updated = db.prepare('SELECT * FROM lists WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('PUT /lists/:id error:', err);
    res.status(500).json({ error: 'Failed to update list' });
  }
});

// DELETE /api/lists/:id — Delete list and its cards
router.delete('/:id', (req, res) => {
  try {
    const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(req.params.id);
    if (!list) return res.status(404).json({ error: 'List not found' });

    db.transaction(() => {
      db.prepare('DELETE FROM lists WHERE id = ?').run(req.params.id);
      // Re-index remaining lists
      const remaining = db.prepare(
        'SELECT id FROM lists WHERE board_id = ? AND archived = 0 ORDER BY position'
      ).all(list.board_id);
      const updatePos = db.prepare('UPDATE lists SET position = ? WHERE id = ?');
      remaining.forEach((l, i) => updatePos.run(i, l.id));
    })();

    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /lists/:id error:', err);
    res.status(500).json({ error: 'Failed to delete list' });
  }
});

// PUT /api/lists/reorder — Reorder lists
router.put('/reorder', (req, res) => {
  try {
    const { boardId, orderedListIds } = req.body;
    if (!boardId || !orderedListIds?.length) {
      return res.status(400).json({ error: 'boardId and orderedListIds are required' });
    }

    const updatePos = db.prepare('UPDATE lists SET position = ? WHERE id = ? AND board_id = ?');
    db.transaction(() => {
      orderedListIds.forEach((id, index) => {
        updatePos.run(index, id, boardId);
      });
    })();

    res.json({ success: true });
  } catch (err) {
    console.error('PUT /lists/reorder error:', err);
    res.status(500).json({ error: 'Failed to reorder lists' });
  }
});

export default router;
