import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingBag, Search, BookOpen, X, Star, ArrowRight, Heart, Menu,
    Globe, Sparkles, MessageSquare, Send, Bot, Loader2, Check,
    CreditCard, Trash2, Mail, User, Phone, Code, Feather, Zap, LogIn, LogOut, ShieldCheck, Users, History, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Helper: Gemini API ---
const generateGeminiContent = async (prompt) => {
    const apiKey = "AIzaSyB_Rsb4xsxIjOgKYvRHwdkhYrLU0rB0HVE";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        if (!response.ok) throw new Error('Error');
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، حدث خطأ.";
    } catch (error) {
        return "يرجى التأكد من مفتاح API أو الاتصال بالإنترنت.";
    }
};

// --- Components ---

const RawiLogo = () => (
    <div className="flex items-center gap-3 group cursor-pointer">
        <div className="relative w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.4)] overflow-hidden transition-transform group-hover:scale-110">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <BookOpen className="text-white w-6 h-6 transform -rotate-12 group-hover:rotate-0 transition-transform duration-300" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-wide font-serif bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 leading-none group-hover:text-purple-400 transition-colors">
                راوي<span className="text-purple-500">.</span>
            </span>
            <span className="text-[9px] text-gray-500 tracking-[0.2em] uppercase">المستقبل</span>
        </div>
    </div>
);

const SocialIcon = ({ type }) => {
    const paths = {
        facebook: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
        instagram: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z M17.5 6.5h.01 M16 21H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5z",
        whatsapp: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
    };
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none"><path d={paths[type]} /></svg>
    );
};

const ClickRippleEffect = () => {
    const [ripples, setRipples] = useState([]);
    useEffect(() => {
        const handleClick = (e) => {
            const newRipple = { id: Date.now(), x: e.clientX, y: e.clientY };
            setRipples((prev) => [...prev, newRipple]);
            setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== newRipple.id)), 800);
        };
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);
    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            {ripples.map((ripple) => (
                <React.Fragment key={ripple.id}>
                    <motion.div initial={{ opacity: 1, scale: 0, width: 0, height: 0 }} animate={{ opacity: 0, scale: 5, width: 60, height: 60 }} transition={{ duration: 0.5, ease: "easeOut" }} style={{ left: ripple.x, top: ripple.y }} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-purple-400 bg-purple-400/20 shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                    <motion.div initial={{ opacity: 1, scale: 0 }} animate={{ opacity: 0, scale: 2.5 }} transition={{ duration: 0.3 }} style={{ left: ripple.x, top: ripple.y }} className="absolute w-3 h-3 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-[1px] shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                </React.Fragment>
            ))}
        </div>
    );
};

const AmbientBackground = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#050505]">
        <motion.div animate={{ x: [0, 100, -50, 0], y: [0, -50, 50, 0], scale: [1, 1.2, 0.9, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[-10%] left-[-10%] w-[700px] h-[700px] bg-purple-600/20 rounded-full blur-[128px] -z-10" />
        <motion.div animate={{ x: [0, -70, 30, 0], y: [0, 60, -40, 0], scale: [1, 1.1, 0.9, 1] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[128px] -z-10" />
    </div>
);

const ParticleBackground = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let particles = [];
        const resizeCanvas = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        const createParticles = () => {
            particles = Array.from({ length: 100 }, () => ({
                x: Math.random() * canvas.width, y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.8, vy: (Math.random() - 0.5) * 0.8,
                size: Math.random() * 3 + 1.5, opacity: Math.random() * 0.6 + 0.4
            }));
        };
        createParticles();
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p, i) => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x; const dy = p.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < 150) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - distance / 150) * 0.4})`;
                        ctx.lineWidth = 0.8;
                        ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                    }
                }
            });
            animationFrameId = requestAnimationFrame(draw);
        };
        draw();
        return () => { window.removeEventListener('resize', resizeCanvas); cancelAnimationFrame(animationFrameId); };
    }, []);
    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 opacity-60" />;
};

// --- Auth Modal ---
const AuthModal = ({ isOpen, onClose, onLoginSuccess, addToast }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (res.ok) {
                addToast(data.message);
                if (isLogin) {
                    onLoginSuccess(data.user, data.token);
                    onClose();
                } else {
                    setIsLogin(true);
                }
            } else {
                addToast(data.message);
            }
        } catch (error) {
            addToast("حدث خطأ في الاتصال بالسيرفر");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#151515] border border-purple-500/30 w-full max-w-md rounded-2xl p-8 relative shadow-2xl">
                <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-white"><X /></button>
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">{isLogin ? 'أهلاً بعودتك' : 'انضم لعائلة راوي'}</h2>
                    <p className="text-gray-400 text-sm">بوابتك نحو المعرفة والمستقبل</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div><label className="block text-sm text-gray-400 mb-1">الاسم</label><input type="text" required className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} /></div>
                    )}
                    <div><label className="block text-sm text-gray-400 mb-1">البريد الإلكتروني</label><input type="email" required className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                    <div><label className="block text-sm text-gray-400 mb-1">كلمة المرور</label><input type="password" required className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} /></div>
                    <button disabled={isLoading} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 py-3 rounded-lg font-bold text-white hover:opacity-90 transition-opacity flex justify-center items-center gap-2 mt-4">{isLoading ? <Loader2 className="animate-spin" /> : (isLogin ? 'دخول' : 'إنشاء حساب')}</button>
                </form>
                <div className="mt-6 text-center text-sm text-gray-400">{isLogin ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"} <button onClick={() => setIsLogin(!isLogin)} className="text-purple-400 font-bold mr-2 hover:underline">{isLogin ? "أنشئ حساباً" : "سجل دخول"}</button></div>
            </motion.div>
        </motion.div>
    );
};

// --- User Profile Component (NEW) ---
const UserProfile = ({ isOpen, onClose, user }) => {
    if (!isOpen || !user) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#151515] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-purple-600 to-blue-600 relative">
                    <button onClick={onClose} className="absolute top-4 left-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-sm transition-colors"><X size={20} /></button>
                </div>
                <div className="px-8 pb-8">
                    <div className="relative -mt-12 mb-6 flex justify-between items-end">
                        <div className="bg-[#151515] p-2 rounded-full"><div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center border-4 border-[#151515] text-4xl font-bold text-gray-400">{user.username.charAt(0).toUpperCase()}</div></div>
                        <div className="mb-2"><span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-bold border border-purple-500/30">{user.role === 'admin' ? 'مدير النظام' : 'قارئ مميز'}</span></div>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-1">{user.username}</h2>
                    <p className="text-gray-400 mb-8">{user.email}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><History size={18} className="text-purple-400" /> سجل الطلبات</h3>
                            <div className="text-center py-8 text-gray-500 text-sm">لا توجد طلبات سابقة حتى الآن.<br />ابدأ رحلتك واقتنِ كتابك الأول!</div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Heart size={18} className="text-red-400" /> الكتب المفضلة</h3>
                            <div className="text-center py-8 text-gray-500 text-sm">قائمة أمنياتك فارغة حالياً.</div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const ToastContainer = ({ toasts }) => (
    <div className="fixed top-24 left-6 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>{toasts.map((toast) => (<motion.div key={toast.id} initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="bg-white text-black px-4 py-3 rounded-lg shadow-2xl border-r-4 border-purple-500 flex items-center gap-3 min-w-[250px] pointer-events-auto"><div className="bg-green-100 p-1 rounded-full text-green-600"><Check size={16} /></div><span className="text-sm font-bold">{toast.message}</span></motion.div>))}</AnimatePresence>
    </div>
);

const BookDetailsModal = ({ book, onClose, onAddToCart, onAddWishlist }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#151515] w-full max-w-4xl rounded-2xl overflow-hiddenYZ border border-white/10 shadow-2xl flex flex-col md:flex-row max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="md:w-1/3 relative overflow-hidden">
                <img src={book.image_url || book.image} alt={book.title} className="w-full h-full object-cover absolute inset-0 blur-sm opacity-30" />
                <div className="relative h-full flex items-center justify-center p-8 z-10 bg-black/40">
                    <img src={book.image_url || book.image} alt={book.title} className="w-48 rounded-lg shadow-2xl shadow-black/50 transform hover:scale-105 transition-transform" />
                </div>
            </div>
            <div className="md:w-2/3 p-8 flex flex-col overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-start mb-4"><div><span className="text-purple-400 text-sm font-medium">{book.category}</span><h2 className="text-3xl font-bold text-white mt-1">{book.title}</h2><p className="text-gray-400">{book.author}</p></div><button onClick={onClose} className="text-gray-500 hover:text-white"><X /></button></div>
                <div className="flex gap-6 text-sm text-gray-400 mb-6 border-b border-white/10 pb-4"><div className="flex items-center gap-1"><Star className="text-yellow-400 fill-yellow-400" size={16} /> {book.rating}</div><div className="flex items-center gap-1"><BookOpen size={16} /> {book.pages} صفحة</div><div className="flex items-center gap-1"><Globe size={16} /> {book.language}</div></div>
                <p className="text-gray-300 leading-relaxed mb-6">{book.description || "وصف الكتاب غير متاح حالياً."}</p>
                <div className="flex gap-3 mb-8"><button onClick={() => window.open(book.pdf_url, '_blank')} className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"><Download size={20} /> تحميل الكتاب</button><button onClick={() => onAddWishlist(book)} className="p-3 rounded-xl border border-white/20 hover:bg-white/10 text-white transition-all hover:scale-[1.05]"><Heart size={20} /></button></div>
            </div>
        </motion.div>
    </motion.div>
);

const CheckoutModal = ({ cart, total, onClose, onClearCart }) => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const handlePayment = () => { setIsLoading(true); setTimeout(() => { setIsLoading(false); setStep(3); onClearCart(); }, 2500); };
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-md px-4">
            <div className="w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-white/10 flex justify-between items-center"><h3 className="text-xl font-bold text-white">إتمام الشراء</h3>{step < 3 && <button onClick={onClose}><X className="text-gray-400 hover:text-white" /></button>}</div>
                <div className="p-6 min-h-[300px] flex flex-col">
                    {step === 1 && (<motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4"><div className="space-y-2"><label className="text-sm text-gray-400">الاسم الكامل</label><input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-400 outline-none" placeholder="أحمد محمد" /></div><div className="space-y-2"><label className="text-sm text-gray-400">العنوان</label><input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-400 outline-none" placeholder="القاهرة..." /></div><div className="bg-purple-400/10 p-4 rounded-lg border border-purple-400/20 mt-4 flex justify-between text-purple-400 font-bold"><span>المجموع الكلي</span><span>{total} ر.س</span></div><button onClick={() => setStep(2)} className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-bold hover:opacity-90">المتابعة للدفع</button></motion.div>)}
                    {step === 2 && (<motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6 text-center"><div className="w-full h-48 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl border border-white/10 p-6 relative overflow-hidden flex flex-col justify-between text-left"><div className="text-white font-mono text-xl tracking-widest mt-auto">**** **** **** 4242</div></div><button onClick={handlePayment} disabled={isLoading} className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 flex items-center justify-center gap-2">{isLoading ? <Loader2 className="animate-spin" /> : <><CreditCard size={20} /> تأكيد ودفع {total} ر.س</>}</button></motion.div>)}
                    {step === 3 && (<motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8"><div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20"><Check size={40} className="text-white" /></div><h2 className="text-2xl font-bold text-white mb-2">تم الدفع بنجاح!</h2><button onClick={onClose} className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">العودة للراوي</button></motion.div>)}
                </div>
            </div>
        </motion.div>
    );
};

const AILibrarianWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ role: 'bot', text: 'أهلاً بك في راوي! 🪶 أنا مساعدك الذكي. كيف يمكنني إلهامك اليوم؟' }]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);
    const handleSend = async (e) => {
        e.preventDefault(); if (!input.trim()) return;
        const userMsg = input; setMessages(prev => [...prev, { role: 'user', text: userMsg }]); setInput(""); setIsTyping(true);
        const context = `أنت "راوي"، أمين مكتبة ذكي ومثقف في موقع "راوي". ساعد الزوار في اختيار الكتب.`;
        const prompt = `${context}\n\nالمستخدم: ${userMsg}\nراوي:`;
        const reply = await generateGeminiContent(prompt);
        setMessages(prev => [...prev, { role: 'bot', text: reply }]); setIsTyping(false);
    };
    return (
        <div className="fixed bottom-6 left-6 z-[90] flex flex-col items-start font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="mb-4 w-80 md:w-96 bg-[#111] border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[400px]">
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex justify-between items-center"><div className="flex items-center gap-2 text-white font-bold"><Bot size={20} /><span>الراوي الذكي</span></div><button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white"><X size={18} /></button></div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/40 custom-scrollbar">
                            {messages.map((msg, idx) => (<div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-white/10 text-gray-200 rounded-bl-none'}`}>{msg.text}</div></div>))}
                            {isTyping && <div className="flex justify-start"><div className="bg-white/10 p-3 rounded-2xl rounded-bl-none flex gap-1 items-center"><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span></div></div>}
                            <div ref={messagesEndRef} />
                        </div>
                        <form onSubmit={handleSend} className="p-3 bg-[#1a1a1a] border-t border-white/5 flex gap-2"><input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="اسأل الراوي..." className="flex-1 bg-black border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:border-purple-500 outline-none" /><button type="submit" disabled={!input.trim() || isTyping} className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-500 disabled:opacity-50 transition-colors"><Send size={18} /></button></form>
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsOpen(!isOpen)} className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.4)] text-white z-50 relative group">
                {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
            </motion.button>
        </div>
    );
};

// --- Main Home Component ---
export default function Home() {
    const [cart, setCart] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("الكل");
    const [selectedBook, setSelectedBook] = useState(null);
    const [showCheckout, setShowCheckout] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [books, setBooks] = useState([]);
    const [isLoadingBooks, setIsLoadingBooks] = useState(true);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const aboutSectionRef = useRef(null);
    const userMenuRef = useRef(null);
    const navigate = useNavigate();

    // Load User & Fonts
    useEffect(() => {
        const savedUser = localStorage.getItem('rawi_user');
        if (savedUser) setUser(JSON.parse(savedUser));
        const link = document.createElement('link');
        link.href = "https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
    }, []);

    // Fetch Books from API (Database)
    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const response = await fetch('/api/books');
                if (response.ok) {
                    const data = await response.json();
                    setBooks(data);
                } else {
                    console.error("Failed to fetch books");
                }
            } catch (error) {
                console.error("Error fetching books:", error);
            } finally {
                setIsLoadingBooks(false);
            }
        };
        fetchBooks();
    }, []);

    // Fetch Favorites
    useEffect(() => {
        if (user) {
            const fetchFavorites = async () => {
                try {
                    const res = await fetch(`/api/users/${user.id}/favorites`);
                    if (res.ok) {
                        setWishlist(await res.json());
                    }
                } catch (error) {
                    console.error(error);
                }
            };
            fetchFavorites();
        }
    }, [user]);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };

        if (isUserMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isUserMenuOpen]);

    const addToast = (message) => { const id = Date.now(); setToasts(prev => [...prev, { id, message }]); setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000); };
    const addToCart = (book) => { if (!cart.find(item => item.id === book.id)) { setCart([...cart, book]); addToast(`تمت إضافة "${book.title}" للسلة`); } else { addToast(`"${book.title}" موجود بالفعل`); } };

    const toggleWishlist = async (book) => {
        if (!user) {
            addToast("يرجى تسجيل الدخول لإضافة للمفضلة");
            setIsAuthOpen(true);
            return;
        }

        const isFav = wishlist.find(i => i.id === book.id);
        const token = localStorage.getItem('rawi_token');

        try {
            if (isFav) {
                const res = await fetch(`/api/favorites/${book.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setWishlist(wishlist.filter(i => i.id !== book.id));
                    addToast("تم الحذف من المفضلة");
                }
            } else {
                const res = await fetch('/api/favorites', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ bookId: book.id })
                });
                if (res.ok) {
                    setWishlist([...wishlist, book]);
                    addToast("تمت الإضافة للمفضلة");
                }
            }
        } catch (error) {
            addToast("حدث خطأ");
        }
    };
    const removeFromCart = (id) => setCart(cart.filter(i => i.id !== id));
    const scrollToAbout = () => aboutSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    const filteredBooks = books.filter(book => (activeCategory === "الكل" || book.category === activeCategory) && (book.title.includes(searchQuery) || book.author.includes(searchQuery)));
    const total = cart.reduce((sum, item) => Number(sum) + Number(item.price), 0);

    // Auth Handlers
    const handleLoginSuccess = (userData, token) => {
        setUser(userData);
        localStorage.setItem('rawi_user', JSON.stringify(userData));
        localStorage.setItem('rawi_token', token);
    };

    const handleLogout = () => {
        localStorage.removeItem('rawi_user');
        localStorage.removeItem('rawi_token');
        setUser(null);
        setIsProfileOpen(false);
        addToast("تم تسجيل الخروج بنجاح");
        window.location.href = "/";
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-['Tajawal'] selection:bg-purple-500/30 overflow-x-hidden" dir="rtl">
            <ToastContainer toasts={toasts} />

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-[#0a0a0a]/80 border-b border-white/10 px-6 py-4 flex justify-between items-center">
                <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><RawiLogo /></div>
                <div className="flex-1 max-w-lg mx-4 md:mx-8"><div className="relative group"><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث عن قصة..." className="w-full bg-white/5 border border-white/10 rounded-full py-2 px-10 text-white focus:outline-none focus:border-purple-500/50 focus:bg-black/50 transition-all" /><Search className="absolute right-3 top-2.5 text-gray-400 group-focus-within:text-purple-400 transition-colors" size={18} />{searchQuery && <button onClick={() => setSearchQuery("")} className="absolute left-3 top-2.5 text-gray-500 hover:text-white"><X size={16} /></button>}</div></div>
                <div className="flex items-center gap-3 md:gap-5 text-white">
                    <button className="hover:text-purple-400 transition-colors hover:scale-110 active:scale-95 transform"><Globe size={20} /></button>

                    {user ? (
                        <div className="relative flex items-center gap-3" ref={userMenuRef}>
                            <div
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-2 hover:text-purple-400 transition-colors cursor-pointer"
                            >
                                <User size={20} />
                                <span className="text-sm font-bold hidden md:block">{user.username}</span>
                            </div>

                            <AnimatePresence>
                                {isUserMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute left-0 top-full mt-2 w-48 bg-[#151515] border border-white/10 rounded-xl shadow-xl overflow-hidden z-[60]"
                                    >
                                        <button
                                            onClick={() => {
                                                navigate('/profile');
                                                setIsUserMenuOpen(false);
                                            }}
                                            className="w-full text-right px-4 py-3 hover:bg-white/5 text-gray-300 text-sm flex items-center gap-2 border-b border-white/5"
                                        >
                                            <User size={16} /> الملف الشخصي
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleLogout();
                                                setIsUserMenuOpen(false);
                                            }}
                                            className="w-full text-right px-4 py-3 hover:bg-white/5 text-red-400 text-sm flex items-center gap-2"
                                        >
                                            <LogOut size={16} /> تسجيل خروج
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <button onClick={() => setIsAuthOpen(true)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm font-bold transition-all">
                            <LogIn size={16} /> <span>دخول</span>
                        </button>
                    )}

                    {/* Cart Button Removed */}
                    <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}><Menu size={24} /></button>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative pt-32 pb-20 px-6 min-h-screen flex items-center overflow-hidden">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
                        <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-white/5 border border-white/10 text-purple-400 text-sm font-medium mb-4 backdrop-blur-sm"><Sparkles size={14} /> مكتبة المستقبل الذكية</span>
                        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 text-white">اكتشف عوالماً <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">لا حدود لها</span></h1>
                        <p className="text-gray-400 text-lg mb-8 max-w-lg leading-relaxed">منصة "راوي" تقدم لك تجربة قراءة استثنائية تجمع بين سحر الورق وتقنيات المستقبل.</p>
                        <div className="flex flex-wrap gap-4"><button onClick={() => document.getElementById('books-section').scrollIntoView({ behavior: 'smooth' })} className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"><Sparkles size={18} /> تصفح الكتب الجديدة</button><button onClick={scrollToAbout} className="border border-white/20 px-8 py-3 rounded-full font-medium hover:bg-white/5 hover:border-white/50 transition-all bg-white/5 backdrop-blur hover:scale-105 active:scale-95 text-white">انضم لمجتمع القراء</button></div>
                    </motion.div>
                    <div className="flex justify-center lg:justify-end perspective-1000 group">
                        <motion.div className="w-72 h-[450px] bg-gradient-to-br from-purple-600 to-blue-800 rounded-2xl shadow-[0_20px_50px_rgba(88,28,135,0.5)] relative transform transition-transform duration-300 group-hover:rotate-y-12 group-hover:rotate-x-6 preserve-3d cursor-pointer overflow-hidden" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800" className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay" alt="Cover" />
                            <div className="absolute inset-0 flex flex-col justify-between p-8 border-l-4 border-white/10">
                                <div><h2 className="text-4xl font-bold text-white font-serif drop-shadow-lg">خوارزميات<br />المستقبل</h2><p className="text-white/80 mt-2 text-sm">د. أحمد الرفاعي</p></div>
                                <div className="flex justify-between items-center"><span className="text-xl font-bold text-white">راوي</span><BookOpen size={28} className="text-white/80" /></div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Books Grid */}
            <section id="books-section" className="py-20 px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                        <h2 className="text-3xl font-bold border-r-4 border-purple-500 pr-4 text-white">روائع القصص</h2>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {["الكل", "تكنولوجيا", "علوم", "ذكاء اصطناعي", "فنون", "خيال علمي"].map(cat => (
                                <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${activeCategory === cat ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5 hover:text-white"}`}>{cat}</button>
                            ))}
                        </div>
                    </div>

                    {isLoadingBooks ? (
                        <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-purple-500 w-10 h-10" /></div>
                    ) : filteredBooks.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">لا توجد حكايات مطابقة 🔍</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            <AnimatePresence mode="popLayout">{filteredBooks.map((book) => (
                                <motion.div key={book.id} layout initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} whileHover={{ y: -10 }} className="group relative bg-white/5 rounded-3xl p-4 border border-white/5 hover:border-purple-500/30 transition-all duration-300">
                                    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-4 shadow-2xl shadow-black/50 cursor-pointer" onClick={() => setSelectedBook(book)}>
                                        <img src={book.image_url || book.image} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        {book.is_new && <div className="absolute top-3 right-3 bg-blue-500/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1"><Zap size={12} /> جديد</div>}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleWishlist(book); }}
                                            className="absolute top-3 left-3 bg-black/50 p-2 rounded-full text-white hover:bg-white hover:text-red-500 transition-all z-10"
                                        >
                                            <Heart size={16} className={wishlist.some(i => i.id === book.id) ? "fill-red-500 text-red-500" : ""} />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs text-gray-400"><span>{book.category}</span><div className="flex items-center gap-1 text-yellow-400"><Star size={12} className="fill-yellow-400" /><span>{book.rating}</span></div></div>
                                        <h3 className="text-lg font-bold text-white line-clamp-1 cursor-pointer hover:text-purple-400 transition-colors" onClick={() => setSelectedBook(book)}>{book.title}</h3>
                                        <p className="text-sm text-gray-400 line-clamp-1">{book.author}</p>
                                        <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-3">
                                            <button onClick={() => window.open(book.pdf_url, '_blank')} className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"><Download size={16} /> تحميل الكتاب</button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}</AnimatePresence>
                        </div>
                    )}
                </div>
            </section>

            {/* About */}
            <section ref={aboutSectionRef} className="py-24 bg-[#0f0f0f] relative border-t border-white/5">
                <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
                    <div><h2 className="text-4xl font-bold mb-6 text-white">لماذا <span className="text-purple-500">راوي</span>؟</h2><p className="text-gray-400 leading-relaxed mb-6 text-lg">راوي ليس مجرد مكتبة، بل هو جسر يربط بين حكمة الماضي وتقنية المستقبل.</p><ul className="space-y-4">{["كتب منتقاة بعناية", "تلخيص ذكي بالذكاء الاصطناعي", "مجتمع للقراء والمفكرين"].map((item, i) => (<li key={i} className="flex items-center gap-3 text-gray-300"><span className="bg-purple-500/20 text-purple-400 p-1 rounded-full"><Check size={14} /></span> {item}</li>))}</ul></div>
                    <div className="bg-white/5 rounded-2xl p-8 border border-white/5 relative overflow-hidden"><div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 blur-3xl rounded-full"></div><h3 className="text-2xl font-bold mb-4 text-white">قالوا عن راوي</h3><div className="space-y-4"><div className="bg-black/40 p-4 rounded-xl border border-white/5"><p className="text-gray-400 text-sm">"تجربة راوي ساحرة، تجعل القراءة متعة بصرية وعقلية."</p></div></div></div>
                </div>
            </section>

            {/* Modals */}
            <AnimatePresence>
                {isCartOpen && <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="fixed top-0 left-0 h-full w-full max-w-md bg-[#0f0f0f] border-r border-white/10 z-[70] p-6 flex flex-col shadow-2xl"><div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10"><h2 className="text-2xl font-bold text-white flex gap-2 items-center"><ShoppingBag className="text-purple-500" /> حقيبة الراوي <span className="text-gray-400 text-lg">({cart.length})</span></h2><button onClick={() => setIsCartOpen(false)} className="text-white"><X /></button></div><div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">{cart.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4"><ShoppingBag className="w-16 h-16 opacity-20" /><p>الحقيبة فارغة، أضف بعض الحكايات.</p></div> : cart.map((item, idx) => (<motion.div layout key={`${item.id}-${idx}`} className="flex gap-4 bg-white/5 p-3 rounded-2xl border border-white/5 relative"><img src={item.image_url || item.image} className="w-16 h-20 object-cover rounded-xl" alt={item.title} /><div className="flex-1 flex flex-col justify-between"><div><h4 className="font-bold text-sm text-white">{item.title}</h4><p className="text-xs text-gray-400">{item.author}</p></div><div className="flex justify-between items-center"><span className="text-purple-400 font-bold">{item.price} ر.س</span><button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-300 text-xs">حذف</button></div></div></motion.div>))}</div><div className="mt-6 pt-6 border-t border-white/10"><div className="flex justify-between text-xl font-bold text-white mb-4"><span>الإجمالي</span><span>{total} ر.س</span></div><button onClick={() => { setIsCartOpen(false); setShowCheckout(true); }} disabled={cart.length === 0} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 shadow-lg shadow-purple-900/30">إتمام الشراء</button></div></motion.div>}
                {selectedBook && <BookDetailsModal book={selectedBook} onClose={() => setSelectedBook(null)} onAddToCart={(b) => { addToCart(b); setSelectedBook(null); }} onAddWishlist={toggleWishlist} />}
                {showCheckout && <CheckoutModal cart={cart} total={total} onClose={() => setShowCheckout(false)} onClearCart={() => setCart([])} />}
                <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLoginSuccess={handleLoginSuccess} addToast={addToast} />
                <UserProfile isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user} />
            </AnimatePresence>

            <AILibrarianWidget />

            {/* Footer */}
            <footer className="bg-[#050505] border-t border-white/10 pt-16 pb-8 px-6 relative z-10">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-2">
                        <div className="mb-4"><RawiLogo /></div>
                        <p className="text-gray-500 max-w-xs mb-6">راوي.. حيث تلتقي الحكايات بالتكنولوجيا.</p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all hover:scale-110 hover:bg-[#1877F2]"><SocialIcon type="facebook" /></a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all hover:scale-110 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888]"><SocialIcon type="instagram" /></a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all hover:scale-110 hover:bg-[#25D366]"><SocialIcon type="whatsapp" /></a>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-6 flex items-center gap-2"><Code size={18} className="text-purple-500" /> عن المطور</h4>
                        <ul className="space-y-4 text-gray-400 text-sm">
                            <li className="flex items-center gap-3 hover:text-white transition-colors"><User size={16} className="text-purple-500" /> Ahmed Monged</li>
                            <li className="flex items-center gap-3 hover:text-white transition-colors"><Phone size={16} className="text-purple-500" /> +201003061972</li>
                            <li className="flex items-center gap-3 hover:text-white transition-colors"><Mail size={16} className="text-purple-500" /> ahmdmnjd806@gmail.com</li>
                        </ul>
                    </div>
                    <div><h4 className="font-bold text-white mb-6">النشرة البريدية</h4><div className="flex gap-2"><input type="email" placeholder="بريدك الإلكتروني" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm w-full focus:border-purple-500 outline-none text-white" /><button className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-500"><Send size={18} /></button></div></div>
                </div>
                <div className="text-center text-gray-600 text-xs border-t border-white/5 pt-8">© 2024 راوي - جميع الحقوق محفوظة. تطوير Ahmed Monged.</div>
            </footer>
        </div>
    );
}
