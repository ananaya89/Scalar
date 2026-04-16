import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/members — List all members
router.get('/', (req, res) => {
  try {
    const members = db.prepare('SELECT * FROM members ORDER BY name').all();
    res.json(members);
  } catch (err) {
    console.error('GET /members error:', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

export default router;
