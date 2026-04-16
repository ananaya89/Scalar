import mongoose from 'mongoose';
import { DEFAULT_LABEL_COLORS, seedBoards, seedMembers } from './seed-data.js';

const globalForMongo = globalThis;
const mongoUri =
  process.env.MONGODB_URI ||
  process.env.MONGODB_ATLAS_URI;

if (!mongoUri) {
  throw new Error('Set MONGODB_URI (or MONGODB_ATLAS_URI) before starting the server.');
}

mongoose.set('strictQuery', true);

const labelSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    color: { type: String, required: true },
  },
  { _id: true, id: false }
);

const checklistItemSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    position: { type: Number, default: 0 },
  },
  { _id: true, id: false }
);

const checklistSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, default: 'Checklist' },
    items: { type: [checklistItemSchema], default: [] },
  },
  { _id: true, id: false }
);

const boardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    background: { type: String, required: true, default: '#0079BF' },
    labels: { type: [labelSchema], default: [] },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

const listSchema = new mongoose.Schema(
  {
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    title: { type: String, required: true, trim: true },
    position: { type: Number, required: true, default: 0 },
    archived: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: false,
  }
);

const cardSchema = new mongoose.Schema(
  {
    listId: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    position: { type: Number, required: true, default: 0 },
    dueDate: { type: String, default: null },
    archived: { type: Boolean, required: true, default: false },
    labelIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    memberIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    checklists: { type: [checklistSchema], default: [] },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    avatarColor: { type: String, required: true, default: '#0079BF' },
  },
  {
    timestamps: false,
  }
);

export const Board = mongoose.models.Board || mongoose.model('Board', boardSchema);
export const List = mongoose.models.List || mongoose.model('List', listSchema);
export const Card = mongoose.models.Card || mongoose.model('Card', cardSchema);
export const Member = mongoose.models.Member || mongoose.model('Member', memberSchema);

function buildDefaultLabels() {
  return DEFAULT_LABEL_COLORS.map((color) => ({ name: '', color }));
}

async function connectMongo() {
  if (!globalForMongo.__taskflowMongoPromise) {
    globalForMongo.__taskflowMongoPromise = mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB_NAME || undefined,
      serverSelectionTimeoutMS: 10000,
    });
  }

  return globalForMongo.__taskflowMongoPromise;
}

async function seedDatabase() {
  const existingMembers = await Member.countDocuments();
  if (existingMembers > 0) {
    return;
  }

  const memberDocs = await Member.insertMany(
    seedMembers.map(([name, email, avatarColor]) => ({ name, email, avatarColor }))
  );
  const memberIdMap = new Map(memberDocs.map((member, index) => [index + 1, member._id]));

  for (const boardData of seedBoards) {
    const board = await Board.create({
      title: boardData.title,
      background: boardData.background,
      labels: boardData.labels.length > 0
        ? boardData.labels.map(([, name, color]) => ({ name, color }))
        : buildDefaultLabels(),
    });

    const labelIdMap = new Map();
    board.labels.forEach((label, index) => {
      const [key] = boardData.labels[index] || [];
      if (key) {
        labelIdMap.set(key, label._id);
      }
    });

    for (const [listIndex, [listTitle, cards]] of boardData.lists.entries()) {
      const list = await List.create({
        boardId: board._id,
        title: listTitle,
        position: listIndex,
      });

      for (const [cardIndex, cardData] of cards.entries()) {
        await Card.create({
          listId: list._id,
          title: cardData.title,
          description: cardData.description || '',
          position: cardIndex,
          dueDate: cardData.due || null,
          labelIds: (cardData.labels || [])
            .map((key) => labelIdMap.get(key))
            .filter(Boolean),
          memberIds: (cardData.members || [])
            .map((id) => memberIdMap.get(id))
            .filter(Boolean),
          checklists: cardData.checklist?.length
            ? [
                {
                  title: cardData.checklistTitle || 'Checklist',
                  items: cardData.checklist.map((text, itemIndex) => ({
                    text,
                    completed: false,
                    position: itemIndex,
                  })),
                },
              ]
            : [],
        });
      }
    }
  }
}

let initPromise;

export function initializeDatabase() {
  if (!initPromise) {
    initPromise = (async () => {
      await connectMongo();
      await seedDatabase();
    })();
  }

  return initPromise;
}
