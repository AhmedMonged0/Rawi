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

    // تحديث عمود الصورة ليكون TEXT بدلاً من VARCHAR لدعم Base64
    try {
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

  console.error('All models failed. Last error:', lastError);
  res.status(500).json({ error: `فشل الاتصال بجميع الموديلات. الخطأ الأخير: ${lastError}` });
});

// 12. User Search
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

// 13. User Profile
app.get('/api/users/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, username, avatar_url, created_at FROM users WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'المستخدم غير موجود' });

    // Get published books count
    const { rows: booksRows } = await db.query("SELECT COUNT(*) FROM books WHERE user_id = $1 AND status = 'approved'", [req.params.id]);

    const user = rows[0];
    user.published_books = parseInt(booksRows[0].count);

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 14. Submit Book
app.post('/api/books/submit', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { title, author, category, description, image_url, pdf_url, pages, language } = req.body;
    const pagesInt = pages ? parseInt(pages) : 0;

    const { rows } = await db.query(
      `INSERT INTO books (title, author, category, description, image_url, pdf_url, pages, language, is_new, user_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending') RETURNING *`,
      [title, author, category, description, image_url, pdf_url, pagesInt, language || 'العربية', true, decoded.id]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 15. Connections
// Send Request
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
    `, [decoded.id]);

    res.json({ friends, pending });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check Connection Status
app.get('/api/connections/status/:userId', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const otherUserId = req.params.userId;

    const { rows } = await db.query(`
      SELECT * FROM connections 
      WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
    `, [decoded.id, otherUserId]);

    if (rows.length === 0) return res.json({ status: 'none' });

    const conn = rows[0];
    if (conn.status === 'accepted') return res.json({ status: 'friends' });
    if (conn.status === 'pending') {
      return res.json({ status: 'pending', isSender: conn.sender_id === decoded.id });
    }
    res.json({ status: 'none' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 16. Chat
// Send Message
app.post('/api/messages', async (req, res) => {
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

export default app;