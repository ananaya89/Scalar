import { Board, Card, List, Member } from './mongo-db.js';
import { DEFAULT_LABEL_COLORS } from './seed-data.js';

function asId(value) {
  return value?.toString();
}

function currentDateString() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysString(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function uniqueIds(values = []) {
  return [...new Set(values.filter(Boolean).map(asId))];
}

function serializeMember(member) {
  return {
    id: asId(member._id),
    name: member.name,
    email: member.email,
    avatar_color: member.avatarColor,
  };
}

function serializeLabel(label, boardId) {
  return {
    id: asId(label._id),
    board_id: asId(boardId),
    name: label.name ?? '',
    color: label.color,
  };
}

function serializeList(list) {
  return {
    id: asId(list._id),
    board_id: asId(list.boardId),
    title: list.title,
    position: list.position,
    archived: Boolean(list.archived),
  };
}

function serializeChecklistItem(item, checklistId) {
  return {
    id: asId(item._id),
    checklist_id: asId(checklistId),
    text: item.text,
    completed: Boolean(item.completed),
    position: item.position ?? 0,
  };
}

function serializeChecklist(checklist) {
  const items = [...(checklist.items || [])]
    .sort((left, right) => (left.position ?? 0) - (right.position ?? 0))
    .map((item) => serializeChecklistItem(item, checklist._id));

  return {
    id: asId(checklist._id),
    title: checklist.title,
    items,
  };
}

function serializeCard(card, extras = {}) {
  return {
    id: asId(card._id),
    list_id: asId(card.listId),
    title: card.title,
    description: card.description ?? '',
    position: card.position ?? 0,
    due_date: card.dueDate || null,
    archived: Boolean(card.archived),
    created_at: card.createdAt?.toISOString?.() || null,
    ...extras,
  };
}

async function buildMemberLookup(memberIds) {
  const ids = uniqueIds(memberIds);
  if (ids.length === 0) {
    return new Map();
  }

  const members = await Member.find({ _id: { $in: ids } }).sort({ name: 1 }).lean();
  return new Map(members.map((member) => [asId(member._id), serializeMember(member)]));
}

function buildLabelLookup(board) {
  return new Map((board.labels || []).map((label) => [asId(label._id), serializeLabel(label, board._id)]));
}

function hydrateCard(card, labelLookup, memberLookup, listTitle = null) {
  const labels = uniqueIds(card.labelIds).map((id) => labelLookup.get(id)).filter(Boolean);
  const members = uniqueIds(card.memberIds).map((id) => memberLookup.get(id)).filter(Boolean);
  const checklistTotals = (card.checklists || []).reduce(
    (acc, checklist) => {
      acc.total += checklist.items?.length || 0;
      acc.completed += checklist.items?.filter((item) => item.completed).length || 0;
      return acc;
    },
    { total: 0, completed: 0 }
  );

  return serializeCard(card, {
    labels,
    members,
    checklist_stats: checklistTotals.total > 0
      ? { total: checklistTotals.total, completed: checklistTotals.completed }
      : null,
    ...(listTitle ? { list_title: listTitle } : {}),
  });
}

async function getBoardById(boardId) {
  const board = await Board.findById(boardId).lean();
  if (!board) {
    return null;
  }

  const lists = await List.find({ boardId: board._id, archived: false }).sort({ position: 1 }).lean();
  const listIds = lists.map((list) => list._id);
  const cards = listIds.length > 0
    ? await Card.find({ listId: { $in: listIds }, archived: false }).sort({ position: 1 }).lean()
    : [];
  const memberLookup = await buildMemberLookup(cards.flatMap((card) => card.memberIds || []));
  const labelLookup = buildLabelLookup(board);

  return {
    id: asId(board._id),
    title: board.title,
    background: board.background,
    created_at: board.createdAt?.toISOString?.() || null,
    labels: (board.labels || []).map((label) => serializeLabel(label, board._id)),
    lists: lists.map((list) => ({
      ...serializeList(list),
      cards: cards
        .filter((card) => asId(card.listId) === asId(list._id))
        .map((card) => hydrateCard(card, labelLookup, memberLookup)),
    })),
  };
}

async function reindexLists(boardId) {
  const lists = await List.find({ boardId, archived: false }).sort({ position: 1 });
  await Promise.all(lists.map((list, index) => List.updateOne({ _id: list._id }, { $set: { position: index } })));
}

async function reindexCards(listId) {
  const cards = await Card.find({ listId, archived: false }).sort({ position: 1 });
  await Promise.all(cards.map((card, index) => Card.updateOne({ _id: card._id }, { $set: { position: index } })));
}

function defaultLabels() {
  return DEFAULT_LABEL_COLORS.map((color) => ({ name: '', color }));
}

export async function listBoards() {
  const boards = await Board.find({}).sort({ createdAt: -1 }).lean();
  const boardIds = boards.map((board) => board._id);

  const listCounts = boardIds.length > 0
    ? await List.aggregate([
        { $match: { boardId: { $in: boardIds }, archived: false } },
        { $group: { _id: '$boardId', count: { $sum: 1 } } },
      ])
    : [];

  const activeLists = boardIds.length > 0
    ? await List.find({ boardId: { $in: boardIds }, archived: false }, { _id: 1, boardId: 1 }).lean()
    : [];

  const cardCountsByList = activeLists.length > 0
    ? await Card.aggregate([
        { $match: { listId: { $in: activeLists.map((list) => list._id) }, archived: false } },
        { $group: { _id: '$listId', count: { $sum: 1 } } },
      ])
    : [];

  const listCountMap = new Map(listCounts.map((item) => [asId(item._id), item.count]));
  const listToBoardMap = new Map(activeLists.map((list) => [asId(list._id), asId(list.boardId)]));
  const boardCardCountMap = new Map();

  for (const item of cardCountsByList) {
    const boardId = listToBoardMap.get(asId(item._id));
    if (boardId) {
      boardCardCountMap.set(boardId, (boardCardCountMap.get(boardId) || 0) + item.count);
    }
  }

  return boards.map((board) => ({
    id: asId(board._id),
    title: board.title,
    background: board.background,
    created_at: board.createdAt?.toISOString?.() || null,
    list_count: listCountMap.get(asId(board._id)) || 0,
    card_count: boardCardCountMap.get(asId(board._id)) || 0,
  }));
}

export async function createBoard(title, background = '#0079BF') {
  const board = await Board.create({
    title: title.trim(),
    background,
    labels: defaultLabels(),
  });

  return {
    id: asId(board._id),
    title: board.title,
    background: board.background,
    created_at: board.createdAt?.toISOString?.() || null,
  };
}

export async function getBoard(boardId) {
  return getBoardById(boardId);
}

export async function updateBoard(boardId, data) {
  const board = await Board.findById(boardId);
  if (!board) {
    return null;
  }

  if (data.title !== undefined) {
    board.title = data.title;
  }
  if (data.background !== undefined) {
    board.background = data.background;
  }

  await board.save();

  return {
    id: asId(board._id),
    title: board.title,
    background: board.background,
    created_at: board.createdAt?.toISOString?.() || null,
  };
}

export async function deleteBoard(boardId) {
  const lists = await List.find({ boardId }, { _id: 1 }).lean();
  await Card.deleteMany({ listId: { $in: lists.map((list) => list._id) } });
  await List.deleteMany({ boardId });
  const result = await Board.deleteOne({ _id: boardId });
  return result.deletedCount > 0;
}

export async function updateBoardLabel(boardId, labelId, data) {
  const board = await Board.findById(boardId);
  if (!board) {
    return null;
  }

  const label = board.labels.id(labelId);
  if (!label) {
    return null;
  }

  if (data.name !== undefined) {
    label.name = data.name;
  }
  if (data.color !== undefined) {
    label.color = data.color;
  }

  await board.save();
  return serializeLabel(label, board._id);
}

export async function createList(boardId, title) {
  const max = await List.findOne({ boardId, archived: false }).sort({ position: -1 }).lean();
  const list = await List.create({
    boardId,
    title: title.trim(),
    position: max ? max.position + 1 : 0,
  });

  return { ...serializeList(list), cards: [] };
}

export async function updateList(listId, title) {
  const list = await List.findById(listId);
  if (!list) {
    return null;
  }

  list.title = title.trim();
  await list.save();
  return serializeList(list);
}

export async function deleteList(listId) {
  const list = await List.findById(listId);
  if (!list) {
    return false;
  }

  await Card.deleteMany({ listId: list._id });
  await List.deleteOne({ _id: list._id });
  await reindexLists(list.boardId);
  return true;
}

export async function reorderLists(boardId, orderedListIds = []) {
  if (orderedListIds.length === 0) {
    return;
  }

  await Promise.all(
    orderedListIds.map((id, index) =>
      List.updateOne({ _id: id, boardId }, { $set: { position: index } })
    )
  );
}

export async function createCard(listId, title) {
  const max = await Card.findOne({ listId, archived: false }).sort({ position: -1 }).lean();
  const card = await Card.create({
    listId,
    title: title.trim(),
    position: max ? max.position + 1 : 0,
  });

  return serializeCard(card, { labels: [], members: [], checklist_stats: null });
}

export async function getCard(cardId) {
  const card = await Card.findById(cardId);
  if (!card) {
    return null;
  }

  const list = await List.findById(card.listId).lean();
  const board = list ? await Board.findById(list.boardId).lean() : null;
  const memberLookup = await buildMemberLookup(card.memberIds || []);
  const labelLookup = board ? buildLabelLookup(board) : new Map();

  return serializeCard(card, {
    list_title: list?.title || null,
    labels: uniqueIds(card.labelIds).map((id) => labelLookup.get(id)).filter(Boolean),
    members: uniqueIds(card.memberIds).map((id) => memberLookup.get(id)).filter(Boolean),
    checklists: (card.checklists || []).map((checklist) => serializeChecklist(checklist)),
  });
}

export async function updateCard(cardId, data) {
  const card = await Card.findById(cardId);
  if (!card) {
    return null;
  }

  if (data.title !== undefined) {
    card.title = data.title;
  }
  if (data.description !== undefined) {
    card.description = data.description;
  }
  if (data.due_date !== undefined) {
    card.dueDate = data.due_date || null;
  }
  if (data.archived !== undefined) {
    card.archived = Boolean(data.archived);
  }

  await card.save();
  return serializeCard(card);
}

export async function deleteCard(cardId) {
  const card = await Card.findById(cardId);
  if (!card) {
    return false;
  }

  const listId = card.listId;
  await Card.deleteOne({ _id: card._id });
  await reindexCards(listId);
  return true;
}

export async function reorderCards(sourceListId, destListId, orderedSourceIds = [], orderedDestIds = []) {
  if (sourceListId === destListId) {
    await Promise.all(
      orderedSourceIds.map((id, index) =>
        Card.updateOne({ _id: id }, { $set: { listId: sourceListId, position: index } })
      )
    );
    return;
  }

  await Promise.all([
    ...orderedSourceIds.map((id, index) =>
      Card.updateOne({ _id: id }, { $set: { listId: sourceListId, position: index } })
    ),
    ...orderedDestIds.map((id, index) =>
      Card.updateOne({ _id: id }, { $set: { listId: destListId, position: index } })
    ),
  ]);
}

async function getCardHydrationContext(card) {
  const list = await List.findById(card.listId).lean();
  const board = list ? await Board.findById(list.boardId).lean() : null;
  const labelLookup = board ? buildLabelLookup(board) : new Map();
  const memberLookup = await buildMemberLookup(card.memberIds || []);
  return { labelLookup, memberLookup };
}

export async function addCardLabel(cardId, labelId) {
  const card = await Card.findById(cardId);
  if (!card) {
    return null;
  }

  if (!card.labelIds.some((value) => asId(value) === asId(labelId))) {
    card.labelIds.push(labelId);
    await card.save();
  }

  const { labelLookup } = await getCardHydrationContext(card);
  return uniqueIds(card.labelIds).map((id) => labelLookup.get(id)).filter(Boolean);
}

export async function removeCardLabel(cardId, labelId) {
  const card = await Card.findById(cardId);
  if (!card) {
    return null;
  }

  card.labelIds = card.labelIds.filter((value) => asId(value) !== asId(labelId));
  await card.save();

  const { labelLookup } = await getCardHydrationContext(card);
  return uniqueIds(card.labelIds).map((id) => labelLookup.get(id)).filter(Boolean);
}

export async function addCardMember(cardId, memberId) {
  const card = await Card.findById(cardId);
  if (!card) {
    return null;
  }

  if (!card.memberIds.some((value) => asId(value) === asId(memberId))) {
    card.memberIds.push(memberId);
    await card.save();
  }

  const { memberLookup } = await getCardHydrationContext(card);
  return uniqueIds(card.memberIds).map((id) => memberLookup.get(id)).filter(Boolean);
}

export async function removeCardMember(cardId, memberId) {
  const card = await Card.findById(cardId);
  if (!card) {
    return null;
  }

  card.memberIds = card.memberIds.filter((value) => asId(value) !== asId(memberId));
  await card.save();

  const { memberLookup } = await getCardHydrationContext(card);
  return uniqueIds(card.memberIds).map((id) => memberLookup.get(id)).filter(Boolean);
}

export async function createChecklist(cardId, title = 'Checklist') {
  const card = await Card.findById(cardId);
  if (!card) {
    return null;
  }

  card.checklists.push({ title, items: [] });
  await card.save();
  return serializeChecklist(card.checklists[card.checklists.length - 1]);
}

export async function deleteChecklist(checklistId) {
  const card = await Card.findOne({ 'checklists._id': checklistId });
  if (!card) {
    return false;
  }

  card.checklists.pull({ _id: checklistId });
  await card.save();
  return true;
}

export async function addChecklistItem(checklistId, text) {
  const card = await Card.findOne({ 'checklists._id': checklistId });
  if (!card) {
    return null;
  }

  const checklist = card.checklists.id(checklistId);
  const maxPosition = Math.max(-1, ...(checklist.items || []).map((item) => item.position ?? 0));
  checklist.items.push({
    text: text.trim(),
    completed: false,
    position: maxPosition + 1,
  });

  await card.save();
  return serializeChecklistItem(checklist.items[checklist.items.length - 1], checklist._id);
}

export async function updateChecklistItem(itemId, data) {
  const card = await Card.findOne({ 'checklists.items._id': itemId });
  if (!card) {
    return null;
  }

  let matchedChecklist = null;
  let matchedItem = null;

  for (const checklist of card.checklists) {
    const item = checklist.items.id(itemId);
    if (item) {
      matchedChecklist = checklist;
      matchedItem = item;
      break;
    }
  }

  if (!matchedItem) {
    return null;
  }

  if (data.text !== undefined) {
    matchedItem.text = data.text;
  }
  if (data.completed !== undefined) {
    matchedItem.completed = Boolean(data.completed);
  }

  await card.save();
  return serializeChecklistItem(matchedItem, matchedChecklist._id);
}

export async function deleteChecklistItem(itemId) {
  const card = await Card.findOne({ 'checklists.items._id': itemId });
  if (!card) {
    return false;
  }

  for (const checklist of card.checklists) {
    const item = checklist.items.id(itemId);
    if (item) {
      item.deleteOne();
      await card.save();
      return true;
    }
  }

  return false;
}

export async function listMembers() {
  const members = await Member.find({}).sort({ name: 1 }).lean();
  return members.map((member) => serializeMember(member));
}

export async function searchCards(boardId, query) {
  const lists = await List.find({ boardId, archived: false }, { _id: 1, title: 1 }).lean();
  if (lists.length === 0) {
    return [];
  }

  const listTitleMap = new Map(lists.map((list) => [asId(list._id), list.title]));
  const cards = await Card.find({
    listId: { $in: lists.map((list) => list._id) },
    archived: false,
    title: { $regex: escapeRegExp(query.trim()), $options: 'i' },
  })
    .sort({ title: 1 })
    .lean();

  return cards.map((card) => serializeCard(card, { list_title: listTitleMap.get(asId(card.listId)) || '' }));
}

export async function filterCards(boardId, filters = {}) {
  const lists = await List.find({ boardId, archived: false }, { _id: 1, title: 1 }).lean();
  if (lists.length === 0) {
    return [];
  }

  const listIds = lists.map((list) => list._id);
  const query = {
    listId: { $in: listIds },
    archived: false,
  };

  const labelIds = uniqueIds((filters.labels || '').split(','));
  if (labelIds.length > 0) {
    query.labelIds = { $in: labelIds };
  }

  const memberIds = uniqueIds((filters.members || '').split(','));
  if (memberIds.length > 0) {
    query.memberIds = { $in: memberIds };
  }

  if (filters.due === 'overdue') {
    query.dueDate = { $ne: null, $lt: currentDateString() };
  } else if (filters.due === 'soon') {
    query.dueDate = { $ne: null, $gte: currentDateString(), $lte: addDaysString(7) };
  } else if (filters.due === 'none') {
    query.$or = [{ dueDate: null }, { dueDate: '' }];
  }

  const listTitleMap = new Map(lists.map((list) => [asId(list._id), list.title]));
  const cards = await Card.find(query).sort({ position: 1 }).lean();
  return cards.map((card) => serializeCard(card, { list_title: listTitleMap.get(asId(card.listId)) || '' }));
}
