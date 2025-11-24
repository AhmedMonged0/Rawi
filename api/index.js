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
        role VARCHAR(20) DEFAULT 'user',
        ip_address VARCHAR(45),
        country VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // التأكد من وجود الأعمدة (للحالات القديمة)
    const schemaErrors = [];
    try { await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'`); } catch (e) { schemaErrors.push('role: ' + e.message); }
    try { await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45)`); } catch (e) { schemaErrors.push('ip_address: ' + e.message); }
    try { await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(50)`); } catch (e) { schemaErrors.push('country: ' + e.message); }
    try { await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500)`); } catch (e) { schemaErrors.push('avatar_url: ' + e.message); }

    // جدول المفضلة
    await db.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, book_id)
      );
    `);

    // إضافة أو تحديث مستخدم أدمن افتراضي
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const { rows: adminRows } = await db.query("SELECT * FROM users WHERE username = 'admin'");

    let adminStatus = '';
    if (adminRows.length === 0) {
      await db.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        ['admin', 'admin@rawi.com', adminPasswordHash, 'admin']
      );
      adminStatus = 'Admin user CREATED';
    } else {
      await db.query(
        'UPDATE users SET password_hash = $1, role = $2 WHERE username = $3',
        [adminPasswordHash, 'admin', 'admin']
      );
      adminStatus = 'Admin user UPDATED';
    }

    res.send(`Database initialized! ${adminStatus}`);
  } catch (error) {
    res.status(500).send('Error initializing database: ' + error.message);
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

    // تحديث الـ IP والدولة عند تسجيل الدخول
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const country = req.headers['x-vercel-ip-country'] || 'Unknown';
    await db.query('UPDATE users SET ip_address = $1, country = $2 WHERE id = $3', [ip, country, user.id]);

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'تم الدخول بنجاح',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url
      }
    });
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

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const country = req.headers['x-vercel-ip-country'] || 'Unknown';

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (username, email, password_hash, ip_address, country) VALUES ($1, $2, $3, $4, $5)',
      [username, email, hashedPassword, ip, country]
    );

    res.status(201).json({ message: 'تم إنشاء الحساب بنجاح' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 6. تسجيل دخول الأدمن (Hardcoded)
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (rows.length === 0) return res.status(401).json({ message: 'اسم المستخدم غير موجود' });

    const adminUser = rows[0];
    if (adminUser.role !== 'admin') return res.status(403).json({ message: 'هذا الحساب ليس له صلاحيات أدمن' });

    const isValid = await bcrypt.compare(password, adminUser.password_hash);
    if (!isValid) return res.status(401).json({ message: 'كلمة المرور غير صحيحة' });

    const token = jwt.sign({ id: adminUser.id, email: adminUser.email, role: adminUser.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ message: 'أهلاً بك يا مدير! 🕴️', token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 7. جلب المستخدمين (للأدمن فقط)
app.get('/api/admin/users', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'غير مسموح لك بهذا الإجراء' });

    const { rows } = await db.query('SELECT id, username, email, role, created_at, ip_address, country FROM users ORDER BY created_at DESC');
    res.json(rows);

  } catch (error) {
    res.status(403).json({ message: 'توكن غير صالح' });
  }
});

// 8. حذف مستخدم (للأدمن فقط)
app.delete('/api/admin/users/:id', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'غير مسموح لك بهذا الإجراء' });

    const userIdToDelete = req.params.id;

    // لا تسمح للأدمن بحذف نفسه
    if (decoded.id == userIdToDelete) {
      return res.status(403).json({ message: 'لا يمكنك حذف حسابك الخاص كأدمن' });
    }

    const { rowCount } = await db.query('DELETE FROM users WHERE id = $1', [userIdToDelete]);

    if (rowCount === 0) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    res.json({ message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    res.status(403).json({ message: 'توكن غير صالح أو خطأ في الخادم' });
  }
});

// 9. المفضلة
// إضافة للمفضلة
app.post('/api/favorites', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { bookId } = req.body;

    await db.query(
      'INSERT INTO favorites (user_id, book_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [decoded.id, bookId]
    );

    res.json({ message: 'تمت الإضافة للمفضلة' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// حذف من المفضلة
app.delete('/api/favorites/:bookId', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    await db.query(
      'DELETE FROM favorites WHERE user_id = $1 AND book_id = $2',
      [decoded.id, req.params.bookId]
    );

    res.json({ message: 'تم الحذف من المفضلة' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// جلب مفضلة المستخدم
app.get('/api/users/:id/favorites', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT b.* FROM books b
      JOIN favorites f ON b.id = f.book_id
      WHERE f.user_id = $1
      `, [req.params.id]);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 10. تحديث الملف الشخصي
app.put('/api/users/profile', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { username, avatar_url } = req.body;

    const { rows } = await db.query(
      'UPDATE users SET username = $1, avatar_url = $2 WHERE id = $3 RETURNING id, username, email, role, avatar_url',
      [username, avatar_url, decoded.id]
    );

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// هذا السطر هو سر عمل السيرفر على Vercel
export default app;