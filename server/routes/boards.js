import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/boards — List all boards
router.get('/', (req, res) => {
  try {
    const boards = db.prepare(`
      SELECT b.*, 
        (SELECT COUNT(*) FROM lists WHERE board_id = b.id AND archived = 0) as list_count,
        (SELECT COUNT(*) FROM cards c JOIN lists l ON c.list_id = l.id WHERE l.board_id = b.id AND c.archived = 0) as card_count
      FROM boards b
      ORDER BY b.created_at DESC
    `).all();
    res.json(boards);
  } catch (err) {
    console.error('GET /boards error:', err);
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
});

// POST /api/boards — Create board
router.post('/', (req, res) => {
  try {
    const { title, background = '#0079BF' } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });

    const result = db.prepare('INSERT INTO boards (title, background) VALUES (?, ?)').run(title.trim(), background);
    const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(result.lastInsertRowid);

    // Create default labels for the new board
    const insertLabel = db.prepare('INSERT INTO labels (board_id, name, color) VALUES (?, ?, ?)');
    insertLabel.run(board.id, '', '#61BD4F');
    insertLabel.run(board.id, '', '#F2D600');
    insertLabel.run(board.id, '', '#FF9F1A');
    insertLabel.run(board.id, '', '#EB5A46');
    insertLabel.run(board.id, '', '#C377E0');
    insertLabel.run(board.id, '', '#0079BF');

    res.status(201).json(board);
  } catch (err) {
    console.error('POST /boards error:', err);
    res.status(500).json({ error: 'Failed to create board' });
  }
});

// GET /api/boards/:id — Get board with all lists, cards, labels
router.get('/:id', (req, res) => {
  try {
    const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.params.id);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    // Get labels
    const labels = db.prepare('SELECT * FROM labels WHERE board_id = ?').all(board.id);

    // Get lists
    const lists = db.prepare(
      'SELECT * FROM lists WHERE board_id = ? AND archived = 0 ORDER BY position'
    ).all(board.id);

    // Get all non-archived cards for this board
    const cards = db.prepare(`
      SELECT c.* FROM cards c
      JOIN lists l ON c.list_id = l.id
      WHERE l.board_id = ? AND c.archived = 0
      ORDER BY c.position
    `).all(board.id);

    // Get card-label associations
    const cardLabels = db.prepare(`
      SELECT cl.card_id, l.* FROM card_labels cl
      JOIN labels l ON cl.label_id = l.id
      WHERE l.board_id = ?
    `).all(board.id);

    // Get card-member associations
    const cardMembers = db.prepare(`
      SELECT cm.card_id, m.* FROM card_members cm
      JOIN members m ON cm.member_id = m.id
      JOIN cards c ON cm.card_id = c.id
      JOIN lists l ON c.list_id = l.id
      WHERE l.board_id = ?
    `).all(board.id);

    // Get checklist stats per card
    const checklistStats = db.prepare(`
      SELECT c.id as card_id,
        COUNT(ci.id) as total_items,
        SUM(CASE WHEN ci.completed = 1 THEN 1 ELSE 0 END) as completed_items
      FROM cards c
      JOIN lists l ON c.list_id = l.id
      JOIN checklists ch ON ch.card_id = c.id
      JOIN checklist_items ci ON ci.checklist_id = ch.id
      WHERE l.board_id = ? AND c.archived = 0
      GROUP BY c.id
    `).all(board.id);

    // Build card-label map
    const cardLabelMap = {};
    for (const cl of cardLabels) {
      if (!cardLabelMap[cl.card_id]) cardLabelMap[cl.card_id] = [];
      cardLabelMap[cl.card_id].push({ id: cl.id, name: cl.name, color: cl.color });
    }

    // Build card-member map
    const cardMemberMap = {};
    for (const cm of cardMembers) {
      if (!cardMemberMap[cm.card_id]) cardMemberMap[cm.card_id] = [];
      cardMemberMap[cm.card_id].push({ id: cm.id, name: cm.name, avatar_color: cm.avatar_color });
    }

    // Build checklist stats map
    const checklistStatsMap = {};
    for (const cs of checklistStats) {
      checklistStatsMap[cs.card_id] = { total: cs.total_items, completed: cs.completed_items };
    }

    // Assemble nested response
    const listsWithCards = lists.map(list => ({
      ...list,
      cards: cards
        .filter(c => c.list_id === list.id)
        .map(card => ({
          ...card,
          labels: cardLabelMap[card.id] || [],
          members: cardMemberMap[card.id] || [],
          checklist_stats: checklistStatsMap[card.id] || null,
        })),
    }));

    res.json({
      ...board,
      labels,
      lists: listsWithCards,
    });
  } catch (err) {
    console.error('GET /boards/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch board' });
  }
});

// PUT /api/boards/:id — Update board
router.put('/:id', (req, res) => {
  try {
    const { title, background } = req.body;
    const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.params.id);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    db.prepare('UPDATE boards SET title = COALESCE(?, title), background = COALESCE(?, background) WHERE id = ?')
      .run(title ?? null, background ?? null, req.params.id);

    const updated = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('PUT /boards/:id error:', err);
    res.status(500).json({ error: 'Failed to update board' });
  }
});

// DELETE /api/boards/:id — Delete board
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM boards WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Board not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /boards/:id error:', err);
    res.status(500).json({ error: 'Failed to delete board' });
  }
});

// PUT /api/boards/:id/labels/:labelId — Update label
router.put('/:id/labels/:labelId', (req, res) => {
  try {
    const { name, color } = req.body;
    db.prepare('UPDATE labels SET name = COALESCE(?, name), color = COALESCE(?, color) WHERE id = ? AND board_id = ?')
      .run(name ?? null, color ?? null, req.params.labelId, req.params.id);
    const label = db.prepare('SELECT * FROM labels WHERE id = ?').get(req.params.labelId);
    res.json(label);
  } catch (err) {
    console.error('PUT /boards/:id/labels/:labelId error:', err);
    res.status(500).json({ error: 'Failed to update label' });
  }
});

export default router;
