import { Router } from 'express';
import { asyncHandler } from './async-handler.js';
import {
  createList,
  deleteList,
  reorderLists,
  updateList,
} from '../mongo-store.js';

const router = Router();

router.put('/reorder', asyncHandler(async (req, res) => {
  const { boardId, orderedListIds } = req.body;
  if (!boardId || !orderedListIds?.length) {
    return res.status(400).json({ error: 'boardId and orderedListIds are required' });
  }

  await reorderLists(boardId, orderedListIds);
  res.json({ success: true });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { board_id, title } = req.body;
  if (!board_id || !title?.trim()) {
    return res.status(400).json({ error: 'board_id and title are required' });
  }

  res.status(201).json(await createList(board_id, title));
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { title } = req.body;
  if (!title?.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }

  const list = await updateList(req.params.id, title);
  if (!list) {
    return res.status(404).json({ error: 'List not found' });
  }

  res.json(list);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await deleteList(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'List not found' });
  }

  res.json({ success: true });
}));

export default router;
