import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'trello.db'));

// Performance and integrity settings
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema Creation ──────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_color TEXT NOT NULL DEFAULT '#0079BF'
  );

  CREATE TABLE IF NOT EXISTS boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    background TEXT NOT NULL DEFAULT '#0079BF',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    archived INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0,
    due_date TEXT,
    archived INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS labels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    name TEXT DEFAULT '',
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
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Checklist'
  );

  CREATE TABLE IF NOT EXISTS checklist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    checklist_id INTEGER NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0
  );
`);

// ── Seed Data ────────────────────────────────────────────────────────────────

export function seedDatabase() {
  const count = db.prepare('SELECT COUNT(*) as count FROM members').get();
  if (count.count > 0) return; // Already seeded

  const insertMember = db.prepare('INSERT INTO members (name, email, avatar_color) VALUES (?, ?, ?)');
  const insertBoard = db.prepare('INSERT INTO boards (title, background) VALUES (?, ?)');
  const insertList = db.prepare('INSERT INTO lists (board_id, title, position) VALUES (?, ?, ?)');
  const insertCard = db.prepare('INSERT INTO cards (list_id, title, description, position, due_date) VALUES (?, ?, ?, ?, ?)');
  const insertLabel = db.prepare('INSERT INTO labels (board_id, name, color) VALUES (?, ?, ?)');
  const insertCardLabel = db.prepare('INSERT INTO card_labels (card_id, label_id) VALUES (?, ?)');
  const insertCardMember = db.prepare('INSERT INTO card_members (card_id, member_id) VALUES (?, ?)');
  const insertChecklist = db.prepare('INSERT INTO checklists (card_id, title) VALUES (?, ?)');
  const insertChecklistItem = db.prepare('INSERT INTO checklist_items (checklist_id, text, completed, position) VALUES (?, ?, ?, ?)');

  db.transaction(() => {
    // ── Members ──
    insertMember.run('Alice Johnson', 'alice@example.com', '#0079BF');
    insertMember.run('Bob Smith', 'bob@example.com', '#61BD4F');
    insertMember.run('Charlie Davis', 'charlie@example.com', '#EB5A46');
    insertMember.run('Diana Wilson', 'diana@example.com', '#C377E0');
    insertMember.run('Eve Martinez', 'eve@example.com', '#FF9F1A');

    // ── Board 1: Project Sprint Board ──
    const board1 = insertBoard.run('Project Sprint Board', '#0079BF').lastInsertRowid;

    // Labels for Board 1
    const lblBug = insertLabel.run(board1, 'Bug', '#EB5A46').lastInsertRowid;
    const lblFeature = insertLabel.run(board1, 'Feature', '#61BD4F').lastInsertRowid;
    const lblUrgent = insertLabel.run(board1, 'Urgent', '#FF9F1A').lastInsertRowid;
    const lblDesign = insertLabel.run(board1, 'Design', '#C377E0').lastInsertRowid;
    const lblDocs = insertLabel.run(board1, 'Documentation', '#0079BF').lastInsertRowid;
    const lblEnhance = insertLabel.run(board1, 'Enhancement', '#F2D600').lastInsertRowid;

    // Lists for Board 1
    const listBacklog = insertList.run(board1, 'Backlog', 0).lastInsertRowid;
    const listTodo = insertList.run(board1, 'To Do', 1).lastInsertRowid;
    const listInProgress = insertList.run(board1, 'In Progress', 2).lastInsertRowid;
    const listReview = insertList.run(board1, 'Review', 3).lastInsertRowid;
    const listDone = insertList.run(board1, 'Done', 4).lastInsertRowid;

    // ── Backlog cards ──
    const c1 = insertCard.run(listBacklog, 'Research competitor products', 'Analyze top 5 competitors and document their key features, pricing models, and user experience patterns.', 0, null).lastInsertRowid;
    insertCardLabel.run(c1, lblDocs);
    insertCardMember.run(c1, 1);

    const c2 = insertCard.run(listBacklog, 'Define project scope & requirements', 'Create a comprehensive requirements document covering all user stories and acceptance criteria.', 1, null).lastInsertRowid;
    insertCardLabel.run(c2, lblDocs);

    const c3 = insertCard.run(listBacklog, 'Write technical specification', 'Document the system architecture, API contracts, data models, and technology decisions.', 2, null).lastInsertRowid;
    insertCardLabel.run(c3, lblDocs);
    insertCardMember.run(c3, 2);

    const c4 = insertCard.run(listBacklog, 'Performance benchmarking plan', '', 3, null).lastInsertRowid;
    insertCardLabel.run(c4, lblEnhance);

    // ── To Do cards ──
    const c5 = insertCard.run(listTodo, 'Design database schema', 'Create ERD diagram and define all tables, relationships, indexes, and constraints.', 0, '2026-04-20').lastInsertRowid;
    insertCardLabel.run(c5, lblFeature);
    insertCardLabel.run(c5, lblDesign);
    insertCardMember.run(c5, 1);
    insertCardMember.run(c5, 2);
    // Checklist for schema design
    const cl1 = insertChecklist.run(c5, 'Schema Tasks').lastInsertRowid;
    insertChecklistItem.run(cl1, 'Define user tables', 1, 0);
    insertChecklistItem.run(cl1, 'Define board/list/card tables', 1, 1);
    insertChecklistItem.run(cl1, 'Add indexes for performance', 0, 2);
    insertChecklistItem.run(cl1, 'Write migration scripts', 0, 3);

    const c6 = insertCard.run(listTodo, 'Create UI wireframes', 'Design wireframes for all major pages including board view, card detail, and home page.', 1, '2026-04-22').lastInsertRowid;
    insertCardLabel.run(c6, lblDesign);
    insertCardMember.run(c6, 4);

    const c7 = insertCard.run(listTodo, 'Set up CI/CD pipeline', 'Configure GitHub Actions for automated testing, linting, and deployment.', 2, '2026-04-25').lastInsertRowid;
    insertCardLabel.run(c7, lblFeature);
    insertCardMember.run(c7, 3);
    const cl2 = insertChecklist.run(c7, 'CI/CD Setup').lastInsertRowid;
    insertChecklistItem.run(cl2, 'Configure GitHub Actions', 0, 0);
    insertChecklistItem.run(cl2, 'Add test runner', 0, 1);
    insertChecklistItem.run(cl2, 'Set up deployment', 0, 2);

    const c8 = insertCard.run(listTodo, 'Implement error logging service', 'Set up Sentry or similar for error tracking and monitoring.', 3, null).lastInsertRowid;
    insertCardLabel.run(c8, lblFeature);

    // ── In Progress cards ──
    const c9 = insertCard.run(listInProgress, 'Build REST API endpoints', 'Implement all CRUD endpoints for boards, lists, and cards with proper validation and error handling.', 0, '2026-04-18').lastInsertRowid;
    insertCardLabel.run(c9, lblFeature);
    insertCardLabel.run(c9, lblUrgent);
    insertCardMember.run(c9, 1);
    insertCardMember.run(c9, 3);
    const cl3 = insertChecklist.run(c9, 'API Endpoints').lastInsertRowid;
    insertChecklistItem.run(cl3, 'Board CRUD', 1, 0);
    insertChecklistItem.run(cl3, 'List CRUD', 1, 1);
    insertChecklistItem.run(cl3, 'Card CRUD', 0, 2);
    insertChecklistItem.run(cl3, 'Search & Filter', 0, 3);
    insertChecklistItem.run(cl3, 'Drag & Drop reorder', 0, 4);

    const c10 = insertCard.run(listInProgress, 'Implement drag-and-drop UI', 'Build the drag-and-drop interaction for reordering lists and moving cards between lists.', 1, '2026-04-19').lastInsertRowid;
    insertCardLabel.run(c10, lblFeature);
    insertCardLabel.run(c10, lblDesign);
    insertCardMember.run(c10, 2);

    const c11 = insertCard.run(listInProgress, 'Fix card position bug on refresh', 'Cards lose their position after page refresh. Investigate and fix the position persistence logic.', 2, '2026-04-17').lastInsertRowid;
    insertCardLabel.run(c11, lblBug);
    insertCardLabel.run(c11, lblUrgent);
    insertCardMember.run(c11, 3);

    // ── Review cards ──
    const c12 = insertCard.run(listReview, 'Code review: Authentication module', 'Review the OAuth implementation and session management code for security best practices.', 0, null).lastInsertRowid;
    insertCardLabel.run(c12, lblFeature);
    insertCardMember.run(c12, 2);
    insertCardMember.run(c12, 4);

    const c13 = insertCard.run(listReview, 'Review board component tests', '', 1, null).lastInsertRowid;
    insertCardMember.run(c13, 1);

    // ── Done cards ──
    const c14 = insertCard.run(listDone, 'Project kickoff meeting', 'Conducted team kickoff meeting, defined sprint goals and assigned initial tasks.', 0, null).lastInsertRowid;
    insertCardMember.run(c14, 1);
    insertCardMember.run(c14, 2);
    insertCardMember.run(c14, 3);
    insertCardMember.run(c14, 4);

    const c15 = insertCard.run(listDone, 'Set up development environment', 'Configured local dev environment with Node.js, database, and development tools.', 1, null).lastInsertRowid;
    insertCardLabel.run(c15, lblFeature);
    insertCardMember.run(c15, 3);

    const c16 = insertCard.run(listDone, 'Create project README', 'Wrote comprehensive README with setup instructions, architecture overview, and contribution guidelines.', 2, null).lastInsertRowid;
    insertCardLabel.run(c16, lblDocs);
    insertCardMember.run(c16, 1);

    // ── Board 2: Marketing Campaign ──
    const board2 = insertBoard.run('Marketing Campaign', '#D29034').lastInsertRowid;

    // Labels for Board 2
    const lbl2Social = insertLabel.run(board2, 'Social Media', '#61BD4F').lastInsertRowid;
    const lbl2Email = insertLabel.run(board2, 'Email', '#0079BF').lastInsertRowid;
    const lbl2Content = insertLabel.run(board2, 'Content', '#C377E0').lastInsertRowid;
    const lbl2Ads = insertLabel.run(board2, 'Paid Ads', '#EB5A46').lastInsertRowid;
    const lbl2Analytics = insertLabel.run(board2, 'Analytics', '#F2D600').lastInsertRowid;
    const lbl2Urgent2 = insertLabel.run(board2, 'Urgent', '#FF9F1A').lastInsertRowid;

    const listIdeas = insertList.run(board2, 'Ideas', 0).lastInsertRowid;
    const listPlanning = insertList.run(board2, 'Planning', 1).lastInsertRowid;
    const listActive = insertList.run(board2, 'Active', 2).lastInsertRowid;
    const listCompleted = insertList.run(board2, 'Completed', 3).lastInsertRowid;

    const m1 = insertCard.run(listIdeas, 'Launch social media contest', 'Run a user-generated content contest across Instagram and Twitter to boost engagement.', 0, null).lastInsertRowid;
    insertCardLabel.run(m1, lbl2Social);
    insertCardMember.run(m1, 4);

    const m2 = insertCard.run(listIdeas, 'Partner with influencers', 'Identify and reach out to 10 micro-influencers in our niche for sponsored content.', 1, null).lastInsertRowid;
    insertCardLabel.run(m2, lbl2Social);

    const m3 = insertCard.run(listIdeas, 'Create video tutorials', '', 2, null).lastInsertRowid;
    insertCardLabel.run(m3, lbl2Content);

    const m4 = insertCard.run(listPlanning, 'Q2 email newsletter series', 'Design and schedule a 6-part email series for Q2 product announcements.', 0, '2026-04-30').lastInsertRowid;
    insertCardLabel.run(m4, lbl2Email);
    insertCardLabel.run(m4, lbl2Content);
    insertCardMember.run(m4, 5);
    const cl4 = insertChecklist.run(m4, 'Newsletter Schedule').lastInsertRowid;
    insertChecklistItem.run(cl4, 'Week 1: Product intro', 1, 0);
    insertChecklistItem.run(cl4, 'Week 2: Features deep dive', 0, 1);
    insertChecklistItem.run(cl4, 'Week 3: Customer stories', 0, 2);
    insertChecklistItem.run(cl4, 'Week 4: Tips & tricks', 0, 3);

    const m5 = insertCard.run(listPlanning, 'Google Ads campaign setup', 'Configure Google Ads campaigns targeting key product keywords.', 1, '2026-04-28').lastInsertRowid;
    insertCardLabel.run(m5, lbl2Ads);
    insertCardMember.run(m5, 5);

    const m6 = insertCard.run(listActive, 'Blog content calendar', 'Publishing 2 blog posts per week on product insights and industry trends.', 0, '2026-04-20').lastInsertRowid;
    insertCardLabel.run(m6, lbl2Content);
    insertCardMember.run(m6, 4);
    insertCardMember.run(m6, 5);

    const m7 = insertCard.run(listCompleted, 'Brand guidelines document', 'Created comprehensive brand guide with logo usage, color palette, and tone of voice.', 0, null).lastInsertRowid;
    insertCardLabel.run(m7, lbl2Content);
    insertCardMember.run(m7, 4);

    // ── Board 3: Product Roadmap ──
    const board3 = insertBoard.run('Product Roadmap', '#519839').lastInsertRowid;
    const lbl3Core = insertLabel.run(board3, 'Core', '#0079BF').lastInsertRowid;
    const lbl3UI = insertLabel.run(board3, 'UI/UX', '#C377E0').lastInsertRowid;
    const lbl3Perf = insertLabel.run(board3, 'Performance', '#61BD4F').lastInsertRowid;
    const lbl3Sec = insertLabel.run(board3, 'Security', '#EB5A46').lastInsertRowid;
    const lbl3Infra = insertLabel.run(board3, 'Infrastructure', '#FF9F1A').lastInsertRowid;
    const lbl3Research = insertLabel.run(board3, 'Research', '#F2D600').lastInsertRowid;

    const listQ1 = insertList.run(board3, 'Q1 2026', 0).lastInsertRowid;
    const listQ2 = insertList.run(board3, 'Q2 2026', 1).lastInsertRowid;
    const listQ3 = insertList.run(board3, 'Q3 2026', 2).lastInsertRowid;

    insertCard.run(listQ1, 'User authentication v2', 'Implement OAuth 2.0 with Google and GitHub providers.', 0, '2026-03-31');
    insertCard.run(listQ1, 'Dashboard redesign', 'Complete overhaul of the main dashboard with new analytics widgets.', 1, '2026-03-15');
    insertCard.run(listQ2, 'Real-time notifications', 'WebSocket-based notification system for live updates.', 0, '2026-06-30');
    insertCard.run(listQ2, 'Mobile app MVP', 'React Native mobile application with core features.', 1, '2026-06-30');
    insertCard.run(listQ3, 'AI-powered recommendations', 'ML-based feature for smart task suggestions and prioritization.', 0, '2026-09-30');
  })();

  console.log('✓ Database seeded with sample data');
}

export default db;
