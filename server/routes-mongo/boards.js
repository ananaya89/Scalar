import { Router } from 'express';
import { asyncHandler } from './async-handler.js';
import {
  createBoard,
  deleteBoard,
  getBoard,
  listBoards,
  updateBoard,
  updateBoardLabel,
} from '../mongo-store.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  res.json(await listBoards());
}));

router.post('/', asyncHandler(async (req, res) => {
  const { title, background = '#0079BF' } = req.body;
  if (!title?.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  res.status(201).json(await createBoard(title, background));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const board = await getBoard(req.params.id);
  if (!board) {
    return res.status(404).json({ error: 'Board not found' });
  }

  res.json(board);
}));

router.put('/:id/labels/:labelId', asyncHandler(async (req, res) => {
  const label = await updateBoardLabel(req.params.id, req.params.labelId, req.body);
  if (!label) {
    return res.status(404).json({ error: 'Label not found' });
  }

  res.json(label);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const board = await updateBoard(req.params.id, req.body);
  if (!board) {
    return res.status(404).json({ error: 'Board not found' });
  }

  res.json(board);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await deleteBoard(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Board not found' });
  }

  res.json({ success: true });
}));

export default router;
