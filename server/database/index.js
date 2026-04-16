const EXPLICIT_PROVIDER = process.env.DB_PROVIDER?.trim().toLowerCase();

console.log('🔍 Database Provider Resolution:');
console.log('  DB_PROVIDER env:', process.env.DB_PROVIDER);
console.log('  EXPLICIT_PROVIDER:', EXPLICIT_PROVIDER);
console.log('  MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('  DATABASE_URL exists:', !!process.env.DATABASE_URL);

function resolveProvider() {
  if (EXPLICIT_PROVIDER === 'mongodb' || EXPLICIT_PROVIDER === 'mongo') {
    console.log('  → Resolved to: mongodb (explicit)');
    return 'mongodb';
  }

  if (EXPLICIT_PROVIDER === 'postgres' || EXPLICIT_PROVIDER === 'postgresql' || EXPLICIT_PROVIDER === 'pg') {
    console.log('  → Resolved to: postgres (explicit)');
    return 'postgres';
  }

  if (process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI) {
    console.log('  → Resolved to: mongodb (MONGODB_URI found)');
    return 'mongodb';
  }

  if (process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL) {
    console.log('  → Resolved to: postgres (DATABASE_URL found)');
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
