const EXPLICIT_PROVIDER = process.env.DB_PROVIDER?.trim().toLowerCase();

function resolveProvider() {
  if (EXPLICIT_PROVIDER === 'mongodb' || EXPLICIT_PROVIDER === 'mongo') {
    return 'mongodb';
  }

  if (EXPLICIT_PROVIDER === 'postgres' || EXPLICIT_PROVIDER === 'postgresql' || EXPLICIT_PROVIDER === 'pg') {
    return 'postgres';
  }

  if (process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI) {
    return 'mongodb';
  }

  if (process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL) {
    return 'postgres';
  }

  throw new Error(
    'No database configuration found. Set MONGODB_URI for MongoDB Atlas or DATABASE_URL for Postgres.'
  );
}

const activeProvider = resolveProvider();
let providerModulePromise;

async function loadProviderModule() {
  if (!providerModulePromise) {
    providerModulePromise = activeProvider === 'mongodb'
      ? import('../mongo-db.js')
      : import('../pg-db.js');
  }

  return providerModulePromise;
}

export function getActiveDatabaseProvider() {
  return activeProvider;
}

export async function initializeDatabase() {
  const module = await loadProviderModule();
  return module.initializeDatabase();
}
