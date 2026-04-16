import { db, transaction } from '../pg-db.js';

export async function initializeSchema() {
  try {
    console.log('Initializing PostgreSQL schema...');

    // Create tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS members (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        avatar_color TEXT NOT NULL DEFAULT '#0079BF',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS boards (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        background TEXT NOT NULL DEFAULT '#0079BF',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS lists (
        id SERIAL PRIMARY KEY,
        board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        archived INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cards (
        id SERIAL PRIMARY KEY,
        list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        position INTEGER NOT NULL DEFAULT 0,
        due_date TEXT,
        archived INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS labels (
        id SERIAL PRIMARY KEY,
        board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
        name TEXT DEFAULT '',
        color TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        title TEXT NOT NULL DEFAULT 'Checklist',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS checklist_items (
        id SERIAL PRIMARY KEY,
        checklist_id INTEGER NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Schema created successfully');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Schema already exists');
    } else {
      console.error('❌ Schema creation failed:', error.message);
      throw error;
    }
  }
}

export async function seedDatabase() {
  try {
    // Check if already seeded
    const result = await db.one('SELECT COUNT(*) as count FROM members');
    if (result && result.count > 0) {
      console.log('✅ Database already seeded');
      return;
    }

    console.log('Seeding database with sample data...');

    await transaction(async (tx) => {
      // Insert members
      const members = [
        ['Alice Johnson', 'alice@example.com', '#0079BF'],
        ['Bob Smith', 'bob@example.com', '#61BD4F'],
        ['Charlie Davis', 'charlie@example.com', '#EB5A46'],
        ['Diana Wilson', 'diana@example.com', '#C377E0'],
        ['Eve Martinez', 'eve@example.com', '#FF9F1A'],
      ];

      const memberIds = [];
      for (const [name, email, color] of members) {
        const member = await tx.one(
          'INSERT INTO members (name, email, avatar_color) VALUES ($1, $2, $3) RETURNING id',
          [name, email, color]
        );
        memberIds.push(member.id);
      }

      console.log('✅ Members seeded');

      // Insert boards
      const board1 = await tx.one(
        'INSERT INTO boards (title, background) VALUES ($1, $2) RETURNING id',
        ['Project Sprint Board', '#0079BF']
      );

      const board2 = await tx.one(
        'INSERT INTO boards (title, background) VALUES ($1, $2) RETURNING id',
        ['Product Roadmap', '#519839']
      );

      const board3 = await tx.one(
        'INSERT INTO boards (title, background) VALUES ($1, $2) RETURNING id',
        ['Marketing Campaign', '#D29034']
      );

      console.log('✅ Boards seeded');

      // Insert labels for board 1
      const labels = [
        [board1.id, 'Bug', '#EB5A46'],
        [board1.id, 'Feature', '#61BD4F'],
        [board1.id, 'Urgent', '#FF9F1A'],
        [board1.id, 'Design', '#C377E0'],
        [board1.id, 'Documentation', '#0079BF'],
        [board1.id, 'Enhancement', '#F2D600'],
      ];

      const labelIds = {};
      for (const [boardId, name, color] of labels) {
        const label = await tx.one(
          'INSERT INTO labels (board_id, name, color) VALUES ($1, $2, $3) RETURNING id',
          [boardId, name, color]
        );
        labelIds[name.toLowerCase()] = label.id;
      }

      console.log('✅ Labels seeded');

      // Insert lists for board 1
      const lists = [
        ['Backlog', 0],
        ['To Do', 1],
        ['In Progress', 2],
        ['Review', 3],
        ['Done', 4],
      ];

      const listIds = {};
      for (const [title, position] of lists) {
        const list = await tx.one(
          'INSERT INTO lists (board_id, title, position) VALUES ($1, $2, $3) RETURNING id',
          [board1.id, title, position]
        );
        listIds[title] = list.id;
      }

      console.log('✅ Lists seeded');

      // Insert sample cards
      const card1 = await tx.one(
        'INSERT INTO cards (list_id, title, description, position) VALUES ($1, $2, $3, $4) RETURNING id',
        [listIds['Backlog'], 'Research competitor products', 'Analyze top 5 competitors', 0]
      );

      const card2 = await tx.one(
        'INSERT INTO cards (list_id, title, description, position) VALUES ($1, $2, $3, $4) RETURNING id',
        [listIds['To Do'], 'Design database schema', 'Create ERD diagram', 0]
      );

      const card3 = await tx.one(
        'INSERT INTO cards (list_id, title, description, position) VALUES ($1, $2, $3, $4) RETURNING id',
        [listIds['In Progress'], 'Build REST API endpoints', 'Implement CRUD operations', 0]
      );

      console.log('✅ Cards seeded');

      // Add card members
      await tx.query('INSERT INTO card_members (card_id, member_id) VALUES ($1, $2)', [card1.id, memberIds[0]]);
      await tx.query('INSERT INTO card_members (card_id, member_id) VALUES ($1, $2)', [card2.id, memberIds[0]]);
      await tx.query('INSERT INTO card_members (card_id, member_id) VALUES ($1, $2)', [card2.id, memberIds[1]]);
      await tx.query('INSERT INTO card_members (card_id, member_id) VALUES ($1, $2)', [card3.id, memberIds[0]]);

      console.log('✅ Card members seeded');

      // Add labels to cards
      if (labelIds['bug']) {
        await tx.query('INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2)', [card1.id, labelIds['bug']]);
      }
      if (labelIds['feature']) {
        await tx.query('INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2)', [card2.id, labelIds['feature']]);
        await tx.query('INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2)', [card3.id, labelIds['feature']]);
      }

      console.log('✅ Card labels seeded');

      // Add checklists
      const checklist = await tx.one(
        'INSERT INTO checklists (card_id, title) VALUES ($1, $2) RETURNING id',
        [card2.id, 'Schema Tasks']
      );

      await tx.query(
        'INSERT INTO checklist_items (checklist_id, text, position) VALUES ($1, $2, $3)',
        [checklist.id, 'Define tables', 0]
      );
      await tx.query(
        'INSERT INTO checklist_items (checklist_id, text, position) VALUES ($1, $2, $3)',
        [checklist.id, 'Add indexes', 1]
      );

      console.log('✅ Checklists seeded');
    });

    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  }
}
