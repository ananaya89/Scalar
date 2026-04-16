import { Router } from 'express';
import { db } from '../pg-db.js';

const router = Router();
const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

router.get('/', asyncHandler(async (req, res) => {
  res.json(await db.many('SELECT * FROM members ORDER BY name'));
}));

export default router;
