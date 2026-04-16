import 'dotenv/config';

console.log('DB_PROVIDER:', process.env.DB_PROVIDER);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
