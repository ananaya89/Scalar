const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
}

// ── Boards ───────────────────────────────────────────────────────────────────

export const getBoards = async () => {
  const data = await request('/boards');
  return data.value || data || [];
};

export const getBoard = (id) => request(`/boards/${id}`);

export const createBoard = (title, background) =>
  request('/boards', {
    method: 'POST',
    body: JSON.stringify({ title, background }),
  });

export const updateBoard = (id, data) =>
  request(`/boards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteBoard = (id) =>
  request(`/boards/${id}`, { method: 'DELETE' });

// ── Lists ────────────────────────────────────────────────────────────────────

export const createList = (board_id, title) =>
  request('/lists', {
    method: 'POST',
    body: JSON.stringify({ board_id, title }),
  });

export const updateList = (id, title) =>
  request(`/lists/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ title }),
  });

export const deleteList = (id) =>
  request(`/lists/${id}`, { method: 'DELETE' });

export const reorderLists = (boardId, orderedListIds) =>
  request('/lists/reorder', {
    method: 'PUT',
    body: JSON.stringify({ boardId, orderedListIds }),
  });

// ── Cards ────────────────────────────────────────────────────────────────────

export const createCard = (list_id, title) =>
  request('/cards', {
    method: 'POST',
    body: JSON.stringify({ list_id, title }),
  });

export const getCard = (id) => request(`/cards/${id}`);

export const updateCard = (id, data) =>
  request(`/cards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteCard = (id) =>
  request(`/cards/${id}`, { method: 'DELETE' });

export const reorderCards = (sourceListId, destListId, orderedSourceIds, orderedDestIds) =>
  request('/cards/reorder', {
    method: 'PUT',
    body: JSON.stringify({ sourceListId, destListId, orderedSourceIds, orderedDestIds }),
  });

// ── Card Labels ──────────────────────────────────────────────────────────────

export const addCardLabel = (cardId, label_id) =>
  request(`/cards/${cardId}/labels`, {
    method: 'POST',
    body: JSON.stringify({ label_id }),
  });

export const removeCardLabel = (cardId, labelId) =>
  request(`/cards/${cardId}/labels/${labelId}`, { method: 'DELETE' });

// ── Card Members ─────────────────────────────────────────────────────────────

export const addCardMember = (cardId, member_id) =>
  request(`/cards/${cardId}/members`, {
    method: 'POST',
    body: JSON.stringify({ member_id }),
  });

export const removeCardMember = (cardId, memberId) =>
  request(`/cards/${cardId}/members/${memberId}`, { method: 'DELETE' });

// ── Checklists ───────────────────────────────────────────────────────────────

export const createChecklist = (cardId, title) =>
  request(`/cards/${cardId}/checklists`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });

export const deleteChecklist = (id) =>
  request(`/cards/checklists/${id}`, { method: 'DELETE' });

export const addChecklistItem = (checklistId, text) =>
  request(`/cards/checklists/${checklistId}/items`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });

export const updateChecklistItem = (id, data) =>
  request(`/cards/checklist-items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteChecklistItem = (id) =>
  request(`/cards/checklist-items/${id}`, { method: 'DELETE' });

// ── Members ──────────────────────────────────────────────────────────────────

export const getMembers = () => request('/members');

// ── Search ───────────────────────────────────────────────────────────────────

export const searchCards = (boardId, query) =>
  request(`/boards/${boardId}/search?q=${encodeURIComponent(query)}`);

// ── Labels ───────────────────────────────────────────────────────────────────

export const updateLabel = (boardId, labelId, data) =>
  request(`/boards/${boardId}/labels/${labelId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
