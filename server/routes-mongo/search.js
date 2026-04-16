import { Router } from 'express';
import { asyncHandler } from './async-handler.js';
import { filterCards, searchCards } from '../mongo-store.js';

const router = Router();

router.get('/boards/:boardId/search', asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q?.trim()) {
    return res.json([]);
  }

  res.json(await searchCards(req.params.boardId, q));
}));

router.get('/boards/:boardId/cards/filter', asyncHandler(async (req, res) => {
  res.json(await filterCards(req.params.boardId, req.query));
}));

export default router;
