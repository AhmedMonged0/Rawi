import pg from 'pg';

// إعداد الاتصال بقاعدة البيانات (PostgreSQL)
// نستخدم process.env لقراءة البيانات السرية من إعدادات Vercel
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL, // الرابط الكامل الذي سنضعه في Vercel
  ssl: {
    rejectUnauthorized: false // ضروري جداً للاتصال بخدمات السحاب مثل Aiven
  }
});

export default pool;