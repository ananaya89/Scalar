import { Router } from 'express';
import { asyncHandler } from './async-handler.js';
import {
  addCardLabel,
  addCardMember,
  addChecklistItem,
  createCard,
  createChecklist,
  deleteCard,
  deleteChecklist,
  deleteChecklistItem,
  getCard,
  removeCardLabel,
  removeCardMember,
  reorderCards,
  updateCard,
  updateChecklistItem,
} from '../mongo-store.js';

const router = Router();

router.put('/reorder', asyncHandler(async (req, res) => {
  const {
    sourceListId,
    destListId,
    orderedSourceIds = [],
    orderedDestIds = [],
  } = req.body;

  await reorderCards(sourceListId, destListId, orderedSourceIds, orderedDestIds);
  res.json({ success: true });
}));

router.delete('/checklists/:id', asyncHandler(async (req, res) => {
  await deleteChecklist(req.params.id);
  res.json({ success: true });
}));

router.post('/checklists/:checklistId/items', asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const item = await addChecklistItem(req.params.checklistId, text);
  if (!item) {
    return res.status(404).json({ error: 'Checklist not found' });
  }

  res.status(201).json(item);
}));

router.put('/checklist-items/:id', asyncHandler(async (req, res) => {
  const item = await updateChecklistItem(req.params.id, req.body);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  res.json(item);
}));

router.delete('/checklist-items/:id', asyncHandler(async (req, res) => {
  await deleteChecklistItem(req.params.id);
  res.json({ success: true });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { list_id, title } = req.body;
  if (!list_id || !title?.trim()) {
    return res.status(400).json({ error: 'list_id and title are required' });
  }

  res.status(201).json(await createCard(list_id, title));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const card = await getCard(req.params.id);
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }

  res.json(card);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const card = await updateCard(req.params.id, req.body);
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }

  res.json(card);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await deleteCard(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Card not found' });
  }

  res.json({ success: true });
}));

router.post('/:id/labels', asyncHandler(async (req, res) => {
  const { label_id } = req.body;
  const labels = await addCardLabel(req.params.id, label_id);
  if (!labels) {
    return res.status(404).json({ error: 'Card not found' });
  }

  res.json(labels);
}));

router.delete('/:id/labels/:labelId', asyncHandler(async (req, res) => {
  const labels = await removeCardLabel(req.params.id, req.params.labelId);
  if (!labels) {
    return res.status(404).json({ error: 'Card not found' });
  }

  res.json(labels);
}));

router.post('/:id/members', asyncHandler(async (req, res) => {
  const { member_id } = req.body;
  const members = await addCardMember(req.params.id, member_id);
  if (!members) {
    return res.status(404).json({ error: 'Card not found' });
  }

  res.json(members);
}));

router.delete('/:id/members/:memberId', asyncHandler(async (req, res) => {
  const members = await removeCardMember(req.params.id, req.params.memberId);
  if (!members) {
    return res.status(404).json({ error: 'Card not found' });
  }

  res.json(members);
}));

router.post('/:id/checklists', asyncHandler(async (req, res) => {
  const checklist = await createChecklist(req.params.id, req.body.title || 'Checklist');
  if (!checklist) {
    return res.status(404).json({ error: 'Card not found' });
  }

  res.status(201).json(checklist);
}));

export default router;
