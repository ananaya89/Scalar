import { Pool } from 'pg';

const globalForDb = globalThis;
const rawConnectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!rawConnectionString) {
  throw new Error('Set DATABASE_URL or POSTGRES_URL before starting the server.');
}

const connectionUrl = new URL(rawConnectionString);
const usesRequireSsl = connectionUrl.searchParams.get('sslmode') === 'require';

if (usesRequireSsl && !connectionUrl.searchParams.has('uselibpqcompat')) {
  connectionUrl.searchParams.set('uselibpqcompat', 'true');
}

const connectionString = connectionUrl.toString();

const ssl =
  process.env.PGSSLMODE === 'disable' || connectionString.includes('sslmode=disable')
    ? false
    : process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false;

const pool =
  globalForDb.__taskflowPool ||
  new Pool({
    connectionString,
    ssl,
  });

if (!globalForDb.__taskflowPool) {
  globalForDb.__taskflowPool = pool;
}

function createClient(client) {
  return {
    query(text, params = []) {
      return client.query(text, params);
    },
    async one(text, params = []) {
      const result = await client.query(text, params);
      return result.rows[0] ?? null;
    },
    async many(text, params = []) {
      const result = await client.query(text, params);
      return result.rows;
    },
  };
}

export const db = createClient(pool);

export async function transaction(callback) {
  const client = await pool.connect();
  const tx = createClient(client);

  try {
    await client.query('BEGIN');
    const result = await callback(tx);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

const seedMembers = [
  ['Alice Johnson', 'alice@example.com', '#0079BF'],
  ['Bob Smith', 'bob@example.com', '#61BD4F'],
  ['Charlie Davis', 'charlie@example.com', '#EB5A46'],
  ['Diana Wilson', 'diana@example.com', '#C377E0'],
  ['Eve Martinez', 'eve@example.com', '#FF9F1A'],
];

const seedBoards = [
  {
    title: 'Project Sprint Board',
    background: '#0079BF',
    labels: [
      ['bug', 'Bug', '#EB5A46'],
      ['feature', 'Feature', '#61BD4F'],
      ['urgent', 'Urgent', '#FF9F1A'],
      ['design', 'Design', '#C377E0'],
      ['docs', 'Documentation', '#0079BF'],
    ],
    lists: [
      ['Backlog', [
        { title: 'Research competitor products', labels: ['docs'], members: [1] },
        { title: 'Define project scope', labels: ['docs'] },
      ]],
      ['To Do', [
        {
          title: 'Design database schema',
          due: '2026-04-20',
          labels: ['feature', 'design'],
          members: [1, 2],
          checklist: ['Define tables', 'Add indexes', 'Write migrations'],
        },
        { title: 'Create UI wireframes', due: '2026-04-22', labels: ['design'], members: [4] },
      ]],
      ['In Progress', [
        { title: 'Build REST API endpoints', due: '2026-04-18', labels: ['feature', 'urgent'], members: [1, 3] },
        { title: 'Implement drag-and-drop UI', due: '2026-04-19', labels: ['feature', 'design'], members: [2] },
      ]],
      ['Done', [
        { title: 'Project kickoff meeting', members: [1, 2, 3, 4] },
      ]],
    ],
  },
  {
    title: 'Marketing Campaign',
    background: '#D29034',
    labels: [
      ['social', 'Social Media', '#61BD4F'],
      ['email', 'Email', '#0079BF'],
      ['content', 'Content', '#C377E0'],
      ['ads', 'Paid Ads', '#EB5A46'],
    ],
    lists: [
      ['Ideas', [
        { title: 'Launch social media contest', labels: ['social'], members: [4] },
        { title: 'Partner with influencers', labels: ['social'] },
      ]],
      ['Planning', [
        { title: 'Q2 email newsletter series', due: '2026-04-30', labels: ['email', 'content'], members: [5] },
        { title: 'Google Ads campaign setup', due: '2026-04-28', labels: ['ads'], members: [5] },
      ]],
      ['Active', [
        { title: 'Blog content calendar', due: '2026-04-20', labels: ['content'], members: [4, 5] },
      ]],
    ],
  },
  {
    title: 'Product Roadmap',
    background: '#519839',
    labels: [
      ['core', 'Core', '#0079BF'],
      ['ui', 'UI/UX', '#C377E0'],
      ['research', 'Research', '#F2D600'],
    ],
    lists: [
      ['Q1 2026', [
        { title: 'User authentication v2', due: '2026-03-31', labels: ['core'] },
        { title: 'Dashboard redesign', due: '2026-03-15', labels: ['ui'] },
      ]],
      ['Q2 2026', [
        { title: 'Real-time notifications', due: '2026-06-30', labels: ['core'] },
      ]],
      ['Q3 2026', [
        { title: 'AI-powered recommendations', due: '2026-09-30', labels: ['research'] },
      ]],
    ],
  },
];

async function seedDatabase() {
  try {
    // Check if data already exists
    const count = await db.one('SELECT COUNT(*)::int AS count FROM members');
    if (count?.count > 0) {
      console.log('✅ Database already seeded, skipping...');
      return;
    }

    console.log('🌱 Seeding database with sample data...');

    await transaction(async (tx) => {
      const memberIds = [];
      for (const [name, email, avatarColor] of seedMembers) {
        try {
          const member = await tx.one(
            'INSERT INTO members (name, email, avatar_color) VALUES ($1, $2, $3) RETURNING id',
            [name, email, avatarColor]
          );
          memberIds.push(member.id);
        } catch (error) {
          if (error.code === '23505') {
            // Unique constraint violation - member already exists
            const existing = await tx.one('SELECT id FROM members WHERE email = $1', [email]);
            memberIds.push(existing.id);
          } else {
            throw error;
          }
        }
      }

      for (const boardData of seedBoards) {
        const board = await tx.one(
          'INSERT INTO boards (title, background) VALUES ($1, $2) RETURNING id',
          [boardData.title, boardData.background]
        );
        const labelIds = new Map();

        for (const [key, name, color] of boardData.labels) {
          const label = await tx.one(
            'INSERT INTO labels (board_id, name, color) VALUES ($1, $2, $3) RETURNING id',
            [board.id, name, color]
          );
          labelIds.set(key, label.id);
        }

        for (const [listIndex, [listTitle, cards]] of boardData.lists.entries()) {
          const list = await tx.one(
            'INSERT INTO lists (board_id, title, position) VALUES ($1, $2, $3) RETURNING id',
            [board.id, listTitle, listIndex]
          );

          for (const [cardIndex, cardData] of cards.entries()) {
            const card = await tx.one(
              `INSERT INTO cards (list_id, title, description, position, due_date)
               VALUES ($1, $2, $3, $4, $5)
               RETURNING id`,
              [list.id, cardData.title, '', cardIndex, cardData.due || null]
            );

            for (const labelKey of cardData.labels || []) {
              const labelId = labelIds.get(labelKey);
              if (labelId) {
                try {
                  await tx.query(
                    'INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [card.id, labelId]
                  );
                } catch (error) {
                  // Ignore conflicts
                }
              }
            }

            for (const memberIndex of cardData.members || []) {
              const actualMemberId = memberIds[memberIndex - 1];
              if (actualMemberId) {
                try {
                  await tx.query(
                    'INSERT INTO card_members (card_id, member_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [card.id, actualMemberId]
                  );
                } catch (error) {
                  // Ignore conflicts
                }
              }
            }

            if (cardData.checklist?.length) {
              const checklist = await tx.one(
                'INSERT INTO checklists (card_id, title) VALUES ($1, $2) RETURNING id',
                [card.id, 'Checklist']
              );
              for (const [itemIndex, text] of cardData.checklist.entries()) {
                await tx.query(
                  'INSERT INTO checklist_items (checklist_id, text, position) VALUES ($1, $2, $3)',
                  [checklist.id, text, itemIndex]
                );
              }
            }
          }
        }
      }
    });

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.log('⚠️ Seeding error (may be normal if data already exists):', error.message);
    // Don't throw - if seeding fails, the app can still work
  }
}

let initPromise;

export function initializeDatabase() {
  if (!initPromise) {
    initPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS members (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          avatar_color TEXT NOT NULL DEFAULT '#0079BF'
        );
        CREATE TABLE IF NOT EXISTS boards (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          background TEXT NOT NULL DEFAULT '#0079BF',
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS lists (
          id SERIAL PRIMARY KEY,
          board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          position INTEGER NOT NULL DEFAULT 0,
          archived BOOLEAN NOT NULL DEFAULT FALSE
        );
        CREATE TABLE IF NOT EXISTS cards (
          id SERIAL PRIMARY KEY,
          list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          position INTEGER NOT NULL DEFAULT 0,
          due_date DATE,
          archived BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS labels (
          id SERIAL PRIMARY KEY,
          board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
          name TEXT NOT NULL DEFAULT '',
          color TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS card_labels (
          card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
          label_id INTEGER NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
          PRIMARY KEY (card_id, label_id)
        );
        CREATE TABLE IF NOT EXISTS card_members (
          card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
          member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
          PRIMARY KEY (card_id, member_id)
        );
        CREATE TABLE IF NOT EXISTS checklists (
          id SERIAL PRIMARY KEY,
          card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
          title TEXT NOT NULL DEFAULT 'Checklist'
        );
        CREATE TABLE IF NOT EXISTS checklist_items (
          id SERIAL PRIMARY KEY,
          checklist_id INTEGER NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
          text TEXT NOT NULL,
          completed BOOLEAN NOT NULL DEFAULT FALSE,
          position INTEGER NOT NULL DEFAULT 0
        );
      `);

      await seedDatabase();
    })();
  }

  return initPromise;
}
