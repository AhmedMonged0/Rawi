import pg from 'pg';

// إعداد الاتصال بقاعدة البيانات (PostgreSQL)
// نستخدم process.env لقراءة البيانات السرية من إعدادات Vercel
let pool;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing! Database queries will fail.');
  // Create a dummy pool that throws an error when queried
  pool = {
    query: async () => {
      throw new Error('DATABASE_URL is not configured in environment variables.');
    }
  };
} else {
  console.log('DATABASE_URL is set.');
  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

export default pool;