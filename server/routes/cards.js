import { Router } from 'express';
import db from '../db.js';

const router = Router();

// ── Card CRUD ────────────────────────────────────────────────────────────────

// POST /api/cards — Create card
router.post('/', (req, res) => {
  try {
    const { list_id, title } = req.body;
    if (!list_id || !title?.trim()) {
      return res.status(400).json({ error: 'list_id and title are required' });
    }

    const maxPos = db.prepare(
      'SELECT COALESCE(MAX(position), -1) as maxPos FROM cards WHERE list_id = ? AND archived = 0'
    ).get(list_id);

    const result = db.prepare('INSERT INTO cards (list_id, title, position) VALUES (?, ?, ?)')
      .run(list_id, title.trim(), maxPos.maxPos + 1);

    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ ...card, labels: [], members: [], checklist_stats: null });
  } catch (err) {
    console.error('POST /cards error:', err);
    res.status(500).json({ error: 'Failed to create card' });
  }
});

// GET /api/cards/:id — Get full card detail
router.get('/:id', (req, res) => {
  try {
    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card not found' });

    const labels = db.prepare(`
      SELECT l.* FROM labels l
      JOIN card_labels cl ON cl.label_id = l.id
      WHERE cl.card_id = ?
    `).all(card.id);

    const members = db.prepare(`
      SELECT m.* FROM members m
      JOIN card_members cm ON cm.member_id = m.id
      WHERE cm.card_id = ?
    `).all(card.id);

    const checklists = db.prepare('SELECT * FROM checklists WHERE card_id = ?').all(card.id);
    for (const cl of checklists) {
      cl.items = db.prepare(
        'SELECT * FROM checklist_items WHERE checklist_id = ? ORDER BY position'
      ).all(cl.id);
    }

    res.json({ ...card, labels, members, checklists });
  } catch (err) {
    console.error('GET /cards/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch card' });
  }
});

// PUT /api/cards/:id — Update card
router.put('/:id', (req, res) => {
  try {
    const { title, description, due_date, archived } = req.body;
    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card not found' });

    db.prepare(`
      UPDATE cards SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        due_date = ?,
        archived = COALESCE(?, archived)
      WHERE id = ?
    `).run(
      title ?? null,
      description ?? null,
      due_date !== undefined ? due_date : card.due_date,
      archived ?? null,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('PUT /cards/:id error:', err);
    res.status(500).json({ error: 'Failed to update card' });
  }
});

// DELETE /api/cards/:id — Delete card
router.delete('/:id', (req, res) => {
  try {
    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card not found' });

    db.transaction(() => {
      db.prepare('DELETE FROM cards WHERE id = ?').run(req.params.id);
      // Re-index remaining cards in the list
      const remaining = db.prepare(
        'SELECT id FROM cards WHERE list_id = ? AND archived = 0 ORDER BY position'
      ).all(card.list_id);
      const updatePos = db.prepare('UPDATE cards SET position = ? WHERE id = ?');
      remaining.forEach((c, i) => updatePos.run(i, c.id));
    })();

    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /cards/:id error:', err);
    res.status(500).json({ error: 'Failed to delete card' });
  }
});

// PUT /api/cards/reorder — Reorder / move cards
router.put('/reorder', (req, res) => {
  try {
    const { sourceListId, destListId, orderedSourceIds, orderedDestIds } = req.body;

    const updateCard = db.prepare('UPDATE cards SET list_id = ?, position = ? WHERE id = ?');

    db.transaction(() => {
      if (sourceListId === destListId) {
        // Same-list reorder
        (orderedSourceIds || []).forEach((id, index) => {
          updateCard.run(sourceListId, index, id);
        });
      } else {
        // Cross-list move
        (orderedSourceIds || []).forEach((id, index) => {
          updateCard.run(sourceListId, index, id);
        });
        (orderedDestIds || []).forEach((id, index) => {
          updateCard.run(destListId, index, id);
        });
      }
    })();

    res.json({ success: true });
  } catch (err) {
    console.error('PUT /cards/reorder error:', err);
    res.status(500).json({ error: 'Failed to reorder cards' });
  }
});

// ── Labels ───────────────────────────────────────────────────────────────────

// POST /api/cards/:id/labels — Add label to card
router.post('/:id/labels', (req, res) => {
  try {
    const { label_id } = req.body;
    db.prepare('INSERT OR IGNORE INTO card_labels (card_id, label_id) VALUES (?, ?)')
      .run(req.params.id, label_id);
    const labels = db.prepare(`
      SELECT l.* FROM labels l
      JOIN card_labels cl ON cl.label_id = l.id
      WHERE cl.card_id = ?
    `).all(req.params.id);
    res.json(labels);
  } catch (err) {
    console.error('POST /cards/:id/labels error:', err);
    res.status(500).json({ error: 'Failed to add label' });
  }
});

// DELETE /api/cards/:id/labels/:labelId — Remove label
router.delete('/:id/labels/:labelId', (req, res) => {
  try {
    db.prepare('DELETE FROM card_labels WHERE card_id = ? AND label_id = ?')
      .run(req.params.id, req.params.labelId);
    const labels = db.prepare(`
      SELECT l.* FROM labels l
      JOIN card_labels cl ON cl.label_id = l.id
      WHERE cl.card_id = ?
    `).all(req.params.id);
    res.json(labels);
  } catch (err) {
    console.error('DELETE /cards/:id/labels/:labelId error:', err);
    res.status(500).json({ error: 'Failed to remove label' });
  }
});

// ── Members ──────────────────────────────────────────────────────────────────

// POST /api/cards/:id/members — Assign member
router.post('/:id/members', (req, res) => {
  try {
    const { member_id } = req.body;
    db.prepare('INSERT OR IGNORE INTO card_members (card_id, member_id) VALUES (?, ?)')
      .run(req.params.id, member_id);
    const members = db.prepare(`
      SELECT m.* FROM members m
      JOIN card_members cm ON cm.member_id = m.id
      WHERE cm.card_id = ?
    `).all(req.params.id);
    res.json(members);
  } catch (err) {
    console.error('POST /cards/:id/members error:', err);
    res.status(500).json({ error: 'Failed to assign member' });
  }
});

// DELETE /api/cards/:id/members/:memberId — Remove member
router.delete('/:id/members/:memberId', (req, res) => {
  try {
    db.prepare('DELETE FROM card_members WHERE card_id = ? AND member_id = ?')
      .run(req.params.id, req.params.memberId);
    const members = db.prepare(`
      SELECT m.* FROM members m
      JOIN card_members cm ON cm.member_id = m.id
      WHERE cm.card_id = ?
    `).all(req.params.id);
    res.json(members);
  } catch (err) {
    console.error('DELETE /cards/:id/members/:memberId error:', err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// ── Checklists ───────────────────────────────────────────────────────────────

// POST /api/cards/:id/checklists — Create checklist
router.post('/:id/checklists', (req, res) => {
  try {
    const { title = 'Checklist' } = req.body;
    const result = db.prepare('INSERT INTO checklists (card_id, title) VALUES (?, ?)')
      .run(req.params.id, title);
    const checklist = db.prepare('SELECT * FROM checklists WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ ...checklist, items: [] });
  } catch (err) {
    console.error('POST /cards/:id/checklists error:', err);
    res.status(500).json({ error: 'Failed to create checklist' });
  }
});

// DELETE /api/checklists/:id — Delete checklist
router.delete('/checklists/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM checklists WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /checklists/:id error:', err);
    res.status(500).json({ error: 'Failed to delete checklist' });
  }
});

// POST /api/cards/checklists/:checklistId/items — Add item
router.post('/checklists/:checklistId/items', (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Text is required' });

    const maxPos = db.prepare(
      'SELECT COALESCE(MAX(position), -1) as maxPos FROM checklist_items WHERE checklist_id = ?'
    ).get(req.params.checklistId);

    const result = db.prepare(
      'INSERT INTO checklist_items (checklist_id, text, position) VALUES (?, ?, ?)'
    ).run(req.params.checklistId, text.trim(), maxPos.maxPos + 1);

    const item = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(item);
  } catch (err) {
    console.error('POST /checklists/:id/items error:', err);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// PUT /api/cards/checklist-items/:id — Update item
router.put('/checklist-items/:id', (req, res) => {
  try {
    const { text, completed } = req.body;
    const item = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    db.prepare(`
      UPDATE checklist_items SET
        text = COALESCE(?, text),
        completed = COALESCE(?, completed)
      WHERE id = ?
    `).run(text ?? null, completed ?? null, req.params.id);

    const updated = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('PUT /checklist-items/:id error:', err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE /api/cards/checklist-items/:id — Delete item
router.delete('/checklist-items/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM checklist_items WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /checklist-items/:id error:', err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
