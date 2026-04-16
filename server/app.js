import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getActiveDatabaseProvider, initializeDatabase } from './database/index.js';

const provider = getActiveDatabaseProvider();
const routeSet = provider === 'mongodb' ? 'routes-mongo' : 'routes-pg';

const [
  { default: boardsRouter },
  { default: listsRouter },
  { default: cardsRouter },
  { default: membersRouter },
  { default: searchRouter },
] = await Promise.all([
  import(provider === 'mongodb' ? './routes-mongo/boards.js' : './routes-pg/boards.js'),
  import(provider === 'mongodb' ? './routes-mongo/lists.js' : './routes-pg/lists.js'),
  import(provider === 'mongodb' ? './routes-mongo/cards.js' : './routes-pg/cards.js'),
  import(provider === 'mongodb' ? './routes-mongo/members.js' : './routes-pg/members.js'),
  import(provider === 'mongodb' ? './routes-mongo/search.js' : './routes-pg/search.js'),
]);

const app = express();
const PORT = process.env.PORT || 5000;
let startupPromise;

function ensureStartup() {
  if (!startupPromise) {
    startupPromise = initializeDatabase();
  }

  return startupPromise;
}

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  ensureStartup().then(() => next()).catch(next);
});

app.use('/api/boards', boardsRouter);
app.use('/api/lists', listsRouter);
app.use('/api/cards', cardsRouter);
app.use('/api/members', membersRouter);
app.use('/api', searchRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: provider,
    routes: routeSet,
    timestamp: new Date().toISOString(),
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

if (!process.env.VERCEL) {
  ensureStartup()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT} using ${provider}`);
      });
    })
    .catch((error) => {
      console.error('Failed to initialize database:', error);
      process.exit(1);
    });
}

export default app;
