import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
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

// زيادة حجم الطلب المسموح به لرفع الصور
app.use(express.json({ limit: '10mb' }));

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
    try { await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`); } catch (e) { schemaErrors.push('avatar_url: ' + e.message); }
    try { await db.query(`ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT`); } catch (e) { schemaErrors.push('avatar_url type: ' + e.message); }

    // تحديث عمود الصورة ليكون TEXT بدلاً من VARCHAR لدعم Base64
    try { await db.query(`ALTER TABLE books ALTER COLUMN image_url TYPE TEXT`); } catch (e) { schemaErrors.push('image_url type: ' + e.message); }

    // جدول الكتب
    await db.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        image_url TEXT,
        pdf_url TEXT,
        pages INTEGER,
        language VARCHAR(50) DEFAULT 'العربية',
        rating DECIMAL(2,1) DEFAULT 5.0,
        is_new BOOLEAN DEFAULT FALSE,
        user_id INTEGER REFERENCES users(id),
        status VARCHAR(20) DEFAULT 'approved',
        admin_feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // تحديث جدول الكتب (للحالات القديمة)
    try { await db.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)`); } catch (e) { schemaErrors.push('books.user_id: ' + e.message); }
    try { await db.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'approved'`); } catch (e) { schemaErrors.push('books.status: ' + e.message); }
    try { await db.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS admin_feedback TEXT`); } catch (e) { schemaErrors.push('books.admin_feedback: ' + e.message); }

    // جدول الصداقات
    await db.query(`
      CREATE TABLE IF NOT EXISTS connections (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id),
        receiver_id INTEGER REFERENCES users(id),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // جدول الرسائل
    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id),
        receiver_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        is_edited BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // تحديث جدول الرسائل (للحالات القديمة)
    try { await db.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE`); } catch (e) { schemaErrors.push('messages.is_edited: ' + e.message); }


    // جدول المفضلة
    await db.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        book_id INTEGER REFERENCES books(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, book_id)
      );
    `);

    // جدول المتابعة
    await db.query(`
      CREATE TABLE IF NOT EXISTS follows (
        id SERIAL PRIMARY KEY,
        follower_id INTEGER REFERENCES users(id),
        followed_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, followed_id)
      );
    `);

    // إنشاء مستخدم أدمن افتراضي
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ($1, $2, $3, 'admin')
      ON CONFLICT (email) DO NOTHING;
    `, ['admin', 'admin@rawi.com', hashedPassword]);

    // إضافة كتب افتراضية إذا كان الجدول فارغاً
    const { rows: bookCount } = await db.query('SELECT COUNT(*) FROM books');
    if (parseInt(bookCount[0].count) === 0) {
      const initialBooks = [
        {
          title: "خوارزميات المستقبل",
          author: "د. أحمد الرفاعي",
          category: "تكنولوجيا",
          description: "رحلة ممتعة في عالم الخوارزميات وكيف تشكل حياتنا اليومية ومستقبلنا.",
          image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
          pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          pages: 250,
          rating: 4.8,
          is_new: true
        },
        {
          title: "رحلة إلى المريخ",
          author: "سارة العلي",
          category: "خيال علمي",
          description: "رواية مشوقة تحكي قصة أول مستعمرة بشرية على سطح الكوكب الأحمر.",
          image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
          pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          pages: 320,
          rating: 4.5,
          is_new: false
        },
        {
          title: "أساسيات الذكاء الاصطناعي",
          author: "م. خالد عمر",
          category: "ذكاء اصطناعي",
          description: "دليل شامل للمبتدئين لفهم مبادئ الذكاء الاصطناعي وتطبيقاته.",
          image_url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80",
          pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          pages: 180,
          rating: 4.9,
          is_new: true
        }
      ];

      for (const book of initialBooks) {
        await db.query(`
          INSERT INTO books (title, author, category, description, image_url, pdf_url, pages, rating, is_new, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'approved')
        `, [book.title, book.author, book.category, book.description, book.image_url, book.pdf_url, book.pages, book.rating, book.is_new]);
      }
    }

    res.json({ message: 'Database initialized successfully', schemaErrors });
  } catch (error) {
    console.error('Init DB Error:', error);
    res.status(500).json({ message: 'Database initialization failed', error: error.message });
  }
});

// 3. جلب جميع الكتب
app.get('/api/books', async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM books WHERE status = 'approved' OR status IS NULL ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// جلب كتاب واحد
app.get('/api/books/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'الكتاب غير موجود' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// إضافة كتاب (للمستخدمين - يتطلب موافقة)
app.post('/api/books/submit', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { title, author, category, description, image_url, pdf_url, pages, language } = req.body;
    const pagesInt = pages ? parseInt(pages) : 0;

    const { rows } = await db.query(
      `INSERT INTO books(title, author, category, description, image_url, pdf_url, pages, language, is_new, user_id, status)
       VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending') RETURNING *`,
      [title, author, category, description, image_url, pdf_url, pagesInt, language || 'العربية', true, decoded.id]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// إضافة كتاب (للأدمن فقط)
app.post('/api/books', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'غير مسموح لك بهذا الإجراء' });

    const { title, author, category, description, image_url, pdf_url, pages, language, is_new } = req.body;
    const pagesInt = pages ? parseInt(pages) : 0;

    // محاولة حذف عمود السعر إذا كان موجوداً قبل الإضافة (كحل احتياطي)
    try { await db.query(`ALTER TABLE books DROP COLUMN IF EXISTS price`); } catch (e) { console.log('Auto-drop price error:', e.message); }

    const { rows } = await db.query(
      `INSERT INTO books(title, author, category, description, image_url, pdf_url, pages, language, is_new)
    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING * `,
      [title, author, category, description, image_url, pdf_url, pagesInt, language || 'العربية', is_new || false]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// تعديل كتاب (للأدمن فقط)
app.put('/api/books/:id', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'غير مسموح لك بهذا الإجراء' });

    const { title, author, category, description, image_url, pdf_url, pages, language, is_new } = req.body;
    const pagesInt = pages ? parseInt(pages) : 0;

    const { rows } = await db.query(
      `UPDATE books SET title = $1, author = $2, category = $3, description = $4, image_url = $5, pdf_url = $6, pages = $7, language = $8, is_new = $9
       WHERE id = $10 RETURNING * `,
      [title, author, category, description, image_url, pdf_url, pagesInt, language, is_new, req.params.id]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// حذف كتاب (للأدمن فقط)
app.delete('/api/books/:id', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'غير مسموح لك بهذا الإجراء' });

    await db.query('DELETE FROM books WHERE id = $1', [req.params.id]);
    res.json({ message: 'تم حذف الكتاب' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DEBUG: List all users
app.get('/api/debug/users', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, username, email FROM users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 13. User Profile
app.get('/api/users/:id', async (req, res) => {
  console.log(`Fetching user with ID: ${req.params.id}`);
  try {
    const { rows } = await db.query('SELECT id, username, avatar_url, created_at FROM users WHERE id = $1', [req.params.id]);
    console.log(`Found ${rows.length} users for ID ${req.params.id}`);

    if (rows.length === 0) return res.status(404).json({ message: 'المستخدم غير موجود' });

    // Get published books count
    const { rows: booksRows } = await db.query("SELECT COUNT(*) FROM books WHERE user_id = $1 AND status = 'approved'", [req.params.id]);

    const user = rows[0];
    user.published_books = parseInt(booksRows[0].count);

    res.json(user);
  } catch (error) {
    console.error(`Error fetching user ${req.params.id}:`, error);
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
    // TODO: Implement delete logic if needed
    await db.query('DELETE FROM users WHERE id = $1', [userIdToDelete]);
    res.json({ message: 'تم حذف المستخدم' });

  } catch (error) {
    res.status(500).send('Error deleting user: ' + error.message);
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
    console.log(`User ${decoded.id} added book ${bookId} to favorites.`);

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

// 11. Gemini Chat Endpoint
app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body;
  // Check for both spellings just in case
  const apiKey = process.env.GEMENI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('API Key missing on server');
    return res.status(500).json({ error: 'API key not configured on server (Check GEMENI_API_KEY)' });
  }

  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-flash-latest'
  ];

  let lastError = null;

  for (const model of models) {
    try {
      console.log(`Attempting model: ${model} `);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error for ${model}: ${response.status} - ${errorText}`);

        if (response.status === 404) {
          lastError = `Model ${model} not found`;
          continue;
        }
        if (response.status === 429) {
          return res.status(429).json({ error: "تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار قليلاً والمحاولة مرة أخرى." });
        }

        lastError = `API Error: ${response.status} - ${errorText}`;
        continue;
      }

      const data = await response.json();
      let text = null;
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        text = data.candidates[0].content.parts[0].text;
      } else if (data.candidates?.[0]?.text) {
        text = data.candidates[0].text;
      } else if (data.text) {
        text = data.text;
      }

      if (text) {
        return res.json({ text });
      } else {
        lastError = 'No text found in response';
      }

    } catch (error) {
      console.error(`Error with model ${model}:`, error);
      lastError = error.message;
      continue;
    }
  }

  if (lastError) {
    return res.status(500).json({ error: lastError });
  }
});

// إرسال طلب صداقة
app.post('/api/connections/request', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { receiverId } = req.body;

    if (decoded.id == receiverId) return res.status(400).json({ message: 'لا يمكنك إرسال طلب لنفسك' });

    await db.query(
      "INSERT INTO connections (sender_id, receiver_id, status) VALUES ($1, $2, 'pending') ON CONFLICT DO NOTHING",
      [decoded.id, receiverId]
    );
    res.json({ message: 'تم إرسال الطلب' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// البحث عن مستخدمين
app.get('/api/users/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  try {
    const { rows } = await db.query(
      "SELECT id, username, avatar_url FROM users WHERE username ILIKE $1 LIMIT 20",
      [`%${q}%`]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Respond to Request
app.put('/api/connections/:id/respond', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { status } = req.body; // 'accepted' or 'rejected'

    if (!['accepted', 'rejected'].includes(status)) return res.status(400).json({ message: 'حالة غير صالحة' });

    await db.query(
      "UPDATE connections SET status = $1 WHERE id = $2 AND receiver_id = $3",
      [status, req.params.id, decoded.id]
    );
    res.json({ message: `تم ${status === 'accepted' ? 'قبول' : 'رفض'} الطلب` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Connections
app.get('/api/connections', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Friends (accepted)
    const { rows: friends } = await db.query(`
      SELECT u.id, u.username, u.avatar_url 
      FROM users u
      JOIN connections c ON (u.id = c.sender_id OR u.id = c.receiver_id)
      WHERE (c.sender_id = $1 OR c.receiver_id = $1) AND c.status = 'accepted' AND u.id != $1
    `, [decoded.id]);

    // Pending Requests (received)
    const { rows: pending } = await db.query(`
      SELECT c.id, u.id as user_id, u.username, u.avatar_url, c.created_at
      FROM connections c
      JOIN users u ON c.sender_id = u.id
      WHERE c.receiver_id = $1 AND c.status = 'pending'
      ORDER BY c.created_at DESC
    `, [decoded.id]);

    res.json({ friends, pending });
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const { receiverId, content } = req.body;

      // Check if friends
      const { rows: conn } = await db.query(`
      SELECT * FROM connections 
      WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)) AND status = 'accepted'
    `, [decoded.id, receiverId]);

      if (conn.length === 0) return res.status(403).json({ message: 'يجب أن تكونوا أصدقاء للمراسلة' });

      const { rows } = await db.query(
        "INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *",
        [decoded.id, receiverId, content]
      );
      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

// Get Messages
app.get('/api/messages/:userId', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const otherUserId = req.params.userId;

    const { rows } = await db.query(`
      SELECT * FROM messages 
      WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC
    `, [decoded.id, otherUserId]);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Conversation
app.delete('/api/messages/conversation/:friendId', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const friendId = req.params.friendId;

    await db.query(
      "DELETE FROM messages WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)",
      [decoded.id, friendId]
    );
    res.json({ message: 'تم حذف المحادثة' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Message
app.delete('/api/messages/:id', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const messageId = req.params.id;

    const { rowCount } = await db.query(
      "DELETE FROM messages WHERE id = $1 AND sender_id = $2",
      [messageId, decoded.id]
    );

    if (rowCount === 0) return res.status(403).json({ message: 'غير مسموح بحذف هذه الرسالة' });
    res.json({ message: 'تم حذف الرسالة' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Edit Message
app.put('/api/messages/:id', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const messageId = req.params.id;
    const { content } = req.body;

    const { rowCount } = await db.query(
      "UPDATE messages SET content = $1, is_edited = TRUE WHERE id = $2 AND sender_id = $3",
      [content, messageId, decoded.id]
    );

    if (rowCount === 0) return res.status(403).json({ message: 'غير مسموح بتعديل هذه الرسالة' });
    res.json({ message: 'تم تعديل الرسالة' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 17. Admin Book Approvals
app.get('/api/admin/books/pending', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'غير مسموح' });

    const { rows } = await db.query("SELECT b.*, u.username as author_name FROM books b LEFT JOIN users u ON b.user_id = u.id WHERE b.status = 'pending' ORDER BY b.created_at DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/admin/books/:id/status', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'غير مسموح' });

    const { status, feedback } = req.body;

    await db.query(
      "UPDATE books SET status = $1, admin_feedback = $2 WHERE id = $3",
      [status, feedback, req.params.id]
    );
    res.json({ message: 'تم تحديث حالة الكتاب' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 18. Follow System
// Follow User
app.post('/api/follow', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { followedId } = req.body;

    if (decoded.id == followedId) return res.status(400).json({ message: 'لا يمكنك متابعة نفسك' });

    await db.query(
      "INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [decoded.id, followedId]
    );
    res.json({ message: 'تمت المتابعة' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Unfollow User
app.delete('/api/follow/:id', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const followedId = req.params.id;

    await db.query(
      "DELETE FROM follows WHERE follower_id = $1 AND followed_id = $2",
      [decoded.id, followedId]
    );
    res.json({ message: 'تم إلغاء المتابعة' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Followers
app.get('/api/users/:id/followers', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT u.id, u.username, u.avatar_url 
      FROM users u
      JOIN follows f ON u.id = f.follower_id
      WHERE f.followed_id = $1
    `, [req.params.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Following
app.get('/api/users/:id/following', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT u.id, u.username, u.avatar_url 
      FROM users u
      JOIN follows f ON u.id = f.followed_id
      WHERE f.follower_id = $1
    `, [req.params.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check Follow Status
app.get('/api/users/:id/is-following/:targetId', async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM follows WHERE follower_id = $1 AND followed_id = $2",
      [req.params.id, req.params.targetId]
    );
    res.json({ isFollowing: rows.length > 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 19. Friend Requests List
app.get('/api/connections/requests', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const { rows } = await db.query(`
      SELECT c.id, u.id as user_id, u.username, u.avatar_url, c.created_at
      FROM connections c
      JOIN users u ON c.sender_id = u.id
      WHERE c.receiver_id = $1 AND c.status = 'pending'
      ORDER BY c.created_at DESC
    `, [decoded.id]);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 20. Notification Summary
app.get('/api/notifications/summary', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    const userRole = decoded.role; // Assuming role is in token, otherwise query user

    // 1. Pending Friend Requests
    const requestsRes = await db.query(
      "SELECT COUNT(*) FROM connections WHERE receiver_id = $1 AND status = 'pending'",
      [userId]
    );
    const requestsCount = parseInt(requestsRes.rows[0].count);

    // 2. Unread Messages
    const messagesRes = await db.query(
      "SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = FALSE",
      [userId]
    );
    const messagesCount = parseInt(messagesRes.rows[0].count);

    // 3. Pending Books (Admin only)
    let adminCount = 0;
    // We need to check role from DB to be safe, or trust token. 
    // Let's trust token if available, or query DB if needed.
    // For now, let's query DB for role to be sure or just use token if we added it there.
    // The login endpoint signs: { id: user.id, email: user.email, role: user.role }

    if (userRole === 'admin') {
      const booksRes = await db.query(
        "SELECT COUNT(*) FROM books WHERE status = 'pending'"
      );
      adminCount = parseInt(booksRes.rows[0].count);
    }

    res.json({
      requests: requestsCount,
      messages: messagesCount,
      admin: adminCount
    });

  } catch (error) {
    console.error("Notification Summary Error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default app;