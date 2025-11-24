import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import db from './db.js';

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'rawi-secret-key';

// إعدادات CORS
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// --- إعداد Nodemailer ---
// ⚠️ يجب وضع بياناتك الحقيقية هنا أو في متغيرات البيئة
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: 'ahmdmnjd806@gmail.com',
    pass: 'tgka hyta eyjp ikhj'
  }
});

// --- الروابط (Endpoints) ---

// 1. فحص السيرفر
app.get('/api', (req, res) => {
  res.send('Rawi Server is Running on Vercel! 🚀');
});

// 2. 🛠️ تهيئة قاعدة البيانات
app.get('/api/init-db', async (req, res) => {
  try {
    // جدول المستخدمين الأساسي
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

    // جدول التسجيلات المعلقة (Pending Signups)
    await db.query(`
      CREATE TABLE IF NOT EXISTS pending_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45),
        country VARCHAR(50),
        verification_code VARCHAR(6) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // تحديث الأعمدة للمستخدمين القدامى (للتوافق فقط)
    const schemaErrors = [];
    try { await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'`); } catch (e) { schemaErrors.push('role: ' + e.message); }
    try { await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45)`); } catch (e) { schemaErrors.push('ip_address: ' + e.message); }
    try { await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(50)`); } catch (e) { schemaErrors.push('country: ' + e.message); }

    // أدمن افتراضي
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const { rows: adminRows } = await db.query("SELECT * FROM users WHERE username = 'admin'");
    let adminStatus = '';

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

    // إضافة كتب افتراضية
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

    res.json({ message: 'Database Initialized Successfully!', adminStatus, schemaErrors: schemaErrors.length > 0 ? schemaErrors : 'None' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
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

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const country = req.headers['x-vercel-ip-country'] || 'Unknown';
    await db.query('UPDATE users SET ip_address = $1, country = $2 WHERE id = $3', [ip, country, user.id]);

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ message: 'تم الدخول بنجاح', token, user: { username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5. إنشاء حساب (مبدئي - Pending)
app.post('/api/auth/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    // 1. التحقق من عدم وجود البريد في المستخدمين الفعليين
    const { rows: existingUsers } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUsers.length > 0) return res.status(400).json({ message: 'البريد مسجل مسبقاً' });

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const country = req.headers['x-vercel-ip-country'] || 'Unknown';
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // إعداد الإيميل
    const mailOptions = {
      from: '"Rawi Bookstore" <ahmdmnjd806@gmail.com>',
      to: email,
      subject: 'كود تفعيل حسابك في راوي',
      text: `أهلاً بك في راوي! كود التفعيل الخاص بك هو: ${ verificationCode } `,
      html: `< h3 > أهلاً بك في راوي! 📚</h3 ><p>كود التفعيل الخاص بك هو:</p><h2>${verificationCode}</h2>`
    };

    // 2. التحقق من وجوده في المعلقين (Pending)
    const { rows: pendingRows } = await db.query('SELECT * FROM pending_users WHERE email = $1', [email]);

    if (pendingRows.length > 0) {
      // تحديث البيانات وإرسال كود جديد
      await db.query(
        'UPDATE pending_users SET username = $1, password_hash = $2, verification_code = $3, ip_address = $4, country = $5, created_at = CURRENT_TIMESTAMP WHERE email = $6',
        [username, hashedPassword, verificationCode, ip, country, email]
      );
    } else {
      // إدخال جديد في جدول المعلقين
      await db.query(
        'INSERT INTO pending_users (username, email, password_hash, ip_address, country, verification_code) VALUES ($1, $2, $3, $4, $5, $6)',
        [username, email, hashedPassword, ip, country, verificationCode]
      );
    }

    // إرسال الإيميل
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Verification email sent to ${ email } `);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      return res.status(500).json({ message: "فشل إرسال البريد الإلكتروني. يرجى المحاولة لاحقاً." });
    }

    res.status(201).json({ message: 'تم إرسال كود التحقق إلى بريدك الإلكتروني.', needsVerification: true, email });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// 5.5 تفعيل الحساب (نقل من Pending إلى Users)
app.post('/api/auth/verify', async (req, res) => {
  const { email, code } = req.body;
  try {
    // البحث في جدول المعلقين
    const { rows } = await db.query('SELECT * FROM pending_users WHERE email = $1', [email]);
    if (rows.length === 0) return res.status(404).json({ message: 'لم يتم العثور على طلب تسجيل بهذا البريد أو انتهت صلاحيته' });

    const pendingUser = rows[0];

    if (pendingUser.verification_code !== code) {
      return res.status(400).json({ message: 'كود التحقق غير صحيح' });
    }

    // نقل المستخدم إلى الجدول الأساسي
    const { rows: newUserRows } = await db.query(
      'INSERT INTO users (username, email, password_hash, role, ip_address, country) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, role',
      [pendingUser.username, pendingUser.email, pendingUser.password_hash, 'user', pendingUser.ip_address, pendingUser.country]
    );

    const newUser = newUserRows[0];

    // حذف من جدول المعلقين
    await db.query('DELETE FROM pending_users WHERE email = $1', [email]);

    // تسجيل الدخول
    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ message: 'تم تفعيل الحساب وإنشاؤه بنجاح! 🎉', token, user: newUser });

  } catch (error) {
    console.error("Verify Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// 6. أدمن لوجن
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (rows.length === 0) return res.status(401).json({ message: 'اسم المستخدم غير موجود' });

    const adminUser = rows[0];
    if (adminUser.role !== 'admin') return res.status(403).json({ message: 'هذا الحساب ليس له صلاحيات أدمن' });

    const isValid = await bcrypt.compare(password, adminUser.password_hash);
    if (!isValid) return res.status(401).json({ message: 'كلمة المرور غير صحيحة' });

    const token = jwt.sign({ id: adminUser.id, email: adminUser.email, role: adminUser.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'أهلاً بك يا مدير! 🕴️', token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 7. جلب المستخدمين
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

// 8. حذف مستخدم
app.delete('/api/admin/users/:id', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const userIdToDelete = req.params.id;
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'غير مسموح لك بهذا الإجراء' });
    if (decoded.id == userIdToDelete) return res.status(403).json({ message: 'لا يمكنك حذف حسابك الخاص كأدمن' });

    const { rowCount } = await db.query('DELETE FROM users WHERE id = $1', [userIdToDelete]);
    if (rowCount === 0) return res.status(404).json({ message: 'المستخدم غير موجود' });
    res.json({ message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    res.status(403).json({ message: 'توكن غير صالح' });
  }
});

// 9. 🤖 المحادثة مع الذكاء الاصطناعي
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  const apiKey = "AIzaSyB_Rsb4xsxIjOgKYvRHwdkhYrLU0rB0HVE";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

try {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `أنت "راوي"، أمين مكتبة ذكي ومثقف في موقع "راوي". ساعد الزوار في اختيار الكتب. اجابتك يجب أن تكون قصيرة ومفيدة.\n\nالمستخدم: ${message}\nراوي:` }]
      }]
    })
  });

  if (!response.ok) {
    const errData = await response.json();
    console.error("Gemini Backend Error:", errData);
    return res.status(response.status).json({ message: "فشل الاتصال بالذكاء الاصطناعي" });
  }

  const data = await response.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، لم أستطع فهم ذلك.";
  res.json({ reply });

} catch (error) {
  console.error("Chat Server Error:", error);
  res.status(500).json({ message: "حدث خطأ في الخادم" });
}
});

export default app;