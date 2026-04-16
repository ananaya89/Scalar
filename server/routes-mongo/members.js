import { Router } from 'express';
import { asyncHandler } from './async-handler.js';
import { listMembers } from '../mongo-store.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  res.json(await listMembers());
}));

export default router;
