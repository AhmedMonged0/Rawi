import express from 'express';
import cors from 'cors';
import db from './db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'my-super-secret-key-123'; // في الواقع يوضع في .env

// Middleware
app.use(cors());
app.use(express.json());

// --- API Endpoints ---

// 1. تجربة السيرفر
app.get('/', (req, res) => {
  res.send('مرحباً بك في سيرفر راوي 🚀');
});

// 2. جلب الكتب
app.get('/api/books', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM books');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ أثناء جلب الكتب' });
  }
});

// 3. تسجيل دخول (Login)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // البحث عن المستخدم
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const user = users[0];
    // التحقق من كلمة المرور
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    // إنشاء التذكرة (Token)
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'تم تسجيل الدخول بنجاح',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ في السيرفر' });
  }
});

// 4. إنشاء حساب جديد (Signup)
app.post('/api/auth/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    // التأكد من عدم وجود الإيميل مسبقاً
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'هذا البريد الإلكتروني مسجل بالفعل' });
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // حفظ المستخدم في قاعدة البيانات
    await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: 'تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ أثناء إنشاء الحساب' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل الآن على الرابط: http://localhost:${PORT}`);
});