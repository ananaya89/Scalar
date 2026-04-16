import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  try {
    console.log('Testing PostgreSQL (Neon) connection...');
    console.log('URI:', process.env.DATABASE_URL ? 'CONFIGURED' : 'NOT SET');
    
    const client = new pg.Client({
      connectionString: process.env.DATABASE_URL,
    });
    
    await client.connect();
    
    const result = await client.query('SELECT NOW()');
    console.log('✅ PostgreSQL Connection SUCCESS!');
    console.log('Current Time:', result.rows[0].now);
    
    await client.end();
  } catch (error) {
    console.log('❌ PostgreSQL Connection FAILED!');
    console.log('Error:', error.message);
    process.exit(1);
  }
}

testConnection();
