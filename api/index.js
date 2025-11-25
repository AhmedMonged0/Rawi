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
        is_new BOOLEAN DEFAULT FALSE,
        rating DECIMAL(2,1) DEFAULT 5.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // جدول المفضلة
    await db.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, book_id)
      );
    `);

    // إضافة بيانات أولية للكتب (إذا كان الجدول فارغاً)
    const { rows: bookRows } = await db.query('SELECT COUNT(*) FROM books');
    if (parseInt(bookRows[0].count) === 0) {
      const initialBooks = [
        {
          title: "خوارزميات المستقبل",
          author: "د. أحمد الرفاعي",
          category: "تكنولوجيا",
          description: "رحلة مذهلة في عالم الذكاء الاصطناعي وكيف سيغير حياتنا.",
          image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800",
          pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          pages: 320,
          is_new: true,
          rating: 4.8
        },
        {
          title: "صدى الصمت",
          author: "سارة الجابري",
          category: "روايات",
          description: "رواية مؤثرة تحكي قصة كفاح وأمل في زمن الصعاب.",
          image_url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800",
          pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          pages: 215,
          is_new: false,
          rating: 4.5
        },
        {
          title: "أسرار الكون",
          author: "مارك تايسون",
          category: "علوم",
          description: "استكشاف لأعماق الفضاء والثقوب السوداء بلغة مبسطة.",
          image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
          pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          pages: 400,
          is_new: true,
          rating: 4.9
        }
      ];

      for (const book of initialBooks) {
        await db.query(
          `INSERT INTO books (title, author, category, description, image_url, pdf_url, pages, is_new, rating)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [book.title, book.author, book.category, book.description, book.image_url, book.pdf_url, book.pages, book.is_new, book.rating]
        );
      }
    }

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

// 3. جلب جميع الكتب
app.get('/api/books', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM books ORDER BY created_at DESC');
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
    const { rows } = await db.query(
      `INSERT INTO books (title, author, category, description, image_url, pdf_url, pages, language, is_new)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [title, author, category, description, image_url, pdf_url, pages, language || 'العربية', is_new || false]
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
    const { rows } = await db.query(
      `UPDATE books SET title=$1, author=$2, category=$3, description=$4, image_url=$5, pdf_url=$6, pages=$7, language=$8, is_new=$9
       WHERE id=$10 RETURNING *`,
      [title, author, category, description, image_url, pdf_url, pages, language, is_new, req.params.id]
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

  } catch (error) {
    res.status(500).send('Error initializing database: ' + error.message);
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
      console.log(`Attempting model: ${model}`);
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

export default app;