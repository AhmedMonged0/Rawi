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
        pdf_url VARCHAR(500),
        rating DECIMAL(3, 1) DEFAULT 0.0,
        pages INT,
        language VARCHAR(50) DEFAULT 'العربية',
        is_new BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // التأكد من وجود عمود pdf_url
    try { await db.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(500)`); } catch (e) { schemaErrors.push('books.pdf_url: ' + e.message); }

    // إضافة كتب افتراضية إذا كان الجدول فارغاً
    const { rows } = await db.query('SELECT count(*) as count FROM books');
    if (parseInt(rows[0].count) === 0) {
      const initialBooks = [
        ['خوارزميات المستقبل', 'د. أحمد الرفاعي', 120.00, 'تكنولوجيا', 'وصف...', 4.8, 320, 'العربية', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800', true, 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'],
        ['أسرار الكون المظلم', 'سارة الفلكي', 95.00, 'علوم', 'وصف...', 4.5, 280, 'العربية', 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=800', false, 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'],
        ['رحلة في عقل آلة', 'عمر الذكي', 150.00, 'ذكاء اصطناعي', 'وصف...', 4.9, 450, 'مترجم', 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800', true, 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'],
        ['فن التصميم الرقمي', 'ليلى المصمم', 85.00, 'فنون', 'وصف...', 4.7, 190, 'العربية', 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=800', false, 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'],
        ['تاريخ ما بعد البشرية', 'يوسف المؤرخ', 110.00, 'خيال علمي', 'وصف...', 4.6, 400, 'العربية', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800', true, 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'],
        ['البرمجة للجميع', 'أكاديمية الكود', 200.00, 'تكنولوجيا', 'وصف...', 5.0, 550, 'مترجم', 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&q=80&w=800', false, 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf']
      ];

      for (const book of initialBooks) {
        await db.query(
          'INSERT INTO books (title, author, price, category, description, rating, pages, language, image_url, is_new, pdf_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
          book
        );
      }
    }

    res.json({
      message: 'Database Initialized Successfully!',
      adminStatus,
      schemaErrors: schemaErrors.length > 0 ? schemaErrors : 'None'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 3. جلب الكتب
app.get('/api/books', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM books ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3.1 إضافة كتاب جديد (للأدمن فقط)
app.post('/api/books', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'غير مسموح لك بهذا الإجراء' });

    const { title, author, price, category, description, image_url, pdf_url, pages, language, is_new } = req.body;

    const { rows } = await db.query(
      'INSERT INTO books (title, author, price, category, description, image_url, pdf_url, pages, language, is_new) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [title, author, price, category, description, image_url, pdf_url, pages || 0, language || 'العربية', is_new || false]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3.2 حذف كتاب (للأدمن فقط)
app.delete('/api/books/:id', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'غير مسموح لك بهذا الإجراء' });

    const { rowCount } = await db.query('DELETE FROM books WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ message: 'الكتاب غير موجود' });

    res.json({ message: 'تم حذف الكتاب بنجاح' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3.3 تحديث كتاب (للأدمن فقط)
app.put('/api/books/:id', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'غير مسموح لك بهذا الإجراء' });

    const { title, author, price, category, description, image_url, pdf_url, pages, language, is_new } = req.body;

    const { rows } = await db.query(
      `UPDATE books SET 
        title = $1, author = $2, price = $3, category = $4, description = $5, 
        image_url = $6, pdf_url = $7, pages = $8, language = $9, is_new = $10 
       WHERE id = $11 RETURNING *`,
      [title, author, price, category, description, image_url, pdf_url, pages, language, is_new, req.params.id]
    );

    if (rows.length === 0) return res.status(404).json({ message: 'الكتاب غير موجود' });

    res.json(rows[0]);
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

    // تحديث الـ IP والدولة عند تسجيل الدخول
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const country = req.headers['x-vercel-ip-country'] || 'Unknown';
    await db.query('UPDATE users SET ip_address = $1, country = $2 WHERE id = $3', [ip, country, user.id]);


    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ message: 'تم الدخول بنجاح', token, user: { username: user.username, email: user.email, role: user.role } });
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
  const userIdToDelete = req.params.id;

  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'غير مسموح لك بهذا الإجراء' });

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

// هذا السطر هو سر عمل السيرفر على Vercel
export default app;