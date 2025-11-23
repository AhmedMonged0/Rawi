import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from './db.js';

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'rawi-secret-key';

// إعدادات CORS للسماح للواجهة بالاتصال
app.use(cors({
  origin: '*', // يسمح للطلبات من أي مكان (جيد للتجربة)
  credentials: true
}));
app.use(express.json());

// --- الروابط (Endpoints) ---

// 1. فحص السيرفر
app.get('/api', (req, res) => {
  res.send('Rawi Server is Running on Vercel! 🚀');
});

// 2. 🛠️ بناء قاعدة البيانات (شغله مرة واحدة بعد الرفع)
app.get('/api/init-db', async (req, res) => {
  try {
    // جدول المستخدمين
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // جدول الكتب
    await db.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        image_url VARCHAR(500),
        rating DECIMAL(3, 1) DEFAULT 0.0,
        pages INT,
        language VARCHAR(50) DEFAULT 'العربية',
        is_new BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // إضافة كتب افتراضية إذا كان الجدول فارغاً
    const { rows } = await db.query('SELECT count(*) as count FROM books');
    if (parseInt(rows[0].count) === 0) {
      const initialBooks = [
        ['خوارزميات المستقبل', 'د. أحمد الرفاعي', 120.00, 'تكنولوجيا', 'وصف...', 4.8, 320, 'العربية', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800', true],
        ['أسرار الكون المظلم', 'سارة الفلكي', 95.00, 'علوم', 'وصف...', 4.5, 280, 'العربية', 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=800', false],
        ['رحلة في عقل آلة', 'عمر الذكي', 150.00, 'ذكاء اصطناعي', 'وصف...', 4.9, 450, 'مترجم', 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800', true],
        ['فن التصميم الرقمي', 'ليلى المصمم', 85.00, 'فنون', 'وصف...', 4.7, 190, 'العربية', 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=800', false],
        ['تاريخ ما بعد البشرية', 'يوسف المؤرخ', 110.00, 'خيال علمي', 'وصف...', 4.6, 400, 'العربية', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800', true],
        ['البرمجة للجميع', 'أكاديمية الكود', 200.00, 'تكنولوجيا', 'وصف...', 5.0, 550, 'مترجم', 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&q=80&w=800', false]
      ];

      for (const book of initialBooks) {
        await db.query(
          'INSERT INTO books (title, author, price, category, description, rating, pages, language, image_url, is_new) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
          book
        );
      }
    }

    res.send('✅ Database & Tables Created Successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).send('❌ Error: ' + error.message);
  }
});

// 3. جلب الكتب
app.get('/api/books', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM books');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. تسجيل الدخول
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) return res.status(401).json({ message: 'البريد غير مسجل' });

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ message: 'كلمة المرور غير صحيحة' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ message: 'تم الدخول بنجاح', token, user: { username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5. إنشاء حساب
app.post('/api/auth/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length > 0) return res.status(400).json({ message: 'البريد مسجل مسبقاً' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: 'تم إنشاء الحساب بنجاح' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// هذا السطر هو سر عمل السيرفر على Vercel
export default app;