import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { 
  ShoppingBag, Search, BookOpen, X, Star, ArrowRight, Heart, Menu, 
  Globe, Sparkles, MessageSquare, Send, Bot, Loader2, Check, 
  MapPin, CreditCard, Trash2, Share2, Mail, User, Phone, Code, Feather
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Helper: Gemini API ---
const generateGeminiContent = async (prompt) => {
  const apiKey = "AIzaSyB6V8xJtkBK-8R4AmQpPA1O6L_v6-KDC18"; // 🔴 ضع مفتاح API هنا
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

// --- Mock Data ---
const books = [
  {
    id: 1,
    title: "رحلة عبر الزمن",
    author: "د. أحمد خالد",
    price: 150,
    category: "خيال علمي",
    color: "from-purple-600 to-blue-600",
    desc: "رواية تأخذك في رحلة لا تصدق عبر العصور المختلفة لاكتشاف أسرار البشرية.",
    rating: 4.8,
    pages: 320,
    lang: "العربية",
    reviews: 1240
  },
  {
    id: 2,
    title: "فن اللامبالاة",
    author: "مارك مانسون",
    price: 120,
    category: "تطوير ذات",
    color: "from-orange-500 to-red-500",
    desc: "كتاب يغير طريقة تفكيرك تجاه المصاعب وكيفية ترتيب أولوياتك في الحياة.",
    rating: 4.5,
    pages: 280,
    lang: "مترجم",
    reviews: 850
  },
  {
    id: 3,
    title: "شفرة دافنشي",
    author: "دان براون",
    price: 180,
    category: "غموض",
    color: "from-emerald-600 to-teal-800",
    desc: "لغز مثير يجمع بين الفن والتاريخ في مطاردة عبر باريس ولندن.",
    rating: 4.9,
    pages: 450,
    lang: "مترجم",
    reviews: 3200
  },
  {
    id: 4,
    title: "الخيميائي",
    author: "باولو كويلو",
    price: 95,
    category: "فلسفة",
    color: "from-yellow-500 to-amber-700",
    desc: "قصة رمزية عن اتباع أحلامك والاستماع إلى قلبك.",
    rating: 4.7,
    pages: 190,
    lang: "مترجم",
    reviews: 5100
  },
  {
    id: 5,
    title: "قواعد العشق",
    author: "إليف شفق",
    price: 140,
    category: "رواية",
    color: "from-pink-600 to-rose-800",
    desc: "رواية ساحرة تمزج بين الماضي والحاضر عبر قصة الرومي وشمس التبريزي.",
    rating: 4.6,
    pages: 400,
    lang: "مترجم",
    reviews: 2100
  },
  {
    id: 6,
    title: "عالم صوفي",
    author: "جوستاين غاردر",
    price: 200,
    category: "فلسفة",
    color: "from-blue-500 to-indigo-700",
    desc: "مدخل روائي مبسط لتاريخ الفلسفة الغربية.",
    rating: 4.8,
    pages: 550,
    lang: "مترجم",
    reviews: 1800
  }
];

// --- Custom Components & Icons ---

// Logo Component
const RawiLogo = () => (
  <div className="flex items-center gap-2 group cursor-pointer">
    <div className="relative w-10 h-10 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)] overflow-hidden transition-transform group-hover:scale-110">
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <Feather className="text-white w-6 h-6 transform -rotate-12 group-hover:rotate-0 transition-transform duration-300" strokeWidth={2.5} />
    </div>
    <div className="flex flex-col">
      <span className="text-2xl font-bold tracking-wide font-serif text-white leading-none group-hover:text-amber-400 transition-colors">
        راوي<span className="text-amber-500">.</span>
      </span>
      <span className="text-[9px] text-gray-400 tracking-[0.2em] uppercase">المستقبل</span>
    </div>
  </div>
);

const SocialIcon = ({ type }) => {
  const paths = {
    facebook: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
    instagram: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z M17.5 6.5h.01 M16 21H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5z",
    whatsapp: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
  };
  const colors = {
    facebook: "hover:bg-[#1877F2]",
    instagram: "hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888]",
    whatsapp: "hover:bg-[#25D366]"
  };
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none">
      <path d={paths[type]} />
    </svg>
  );
};

// 1. Click Ripple Effect
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
          <motion.div initial={{ opacity: 1, scale: 0, width: 0, height: 0 }} animate={{ opacity: 0, scale: 5, width: 60, height: 60 }} transition={{ duration: 0.5, ease: "easeOut" }} style={{ left: ripple.x, top: ripple.y }} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-amber-400 bg-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
          <motion.div initial={{ opacity: 1, scale: 0 }} animate={{ opacity: 0, scale: 2.5 }} transition={{ duration: 0.3 }} style={{ left: ripple.x, top: ripple.y }} className="absolute w-3 h-3 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-[1px] shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
        </React.Fragment>
      ))}
    </div>
  );
};

// 2. Ambient Background
const AmbientBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#050505]">
    <motion.div animate={{ x: [0, 100, -50, 0], y: [0, -50, 50, 0], scale: [1, 1.2, 0.9, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[-10%] left-[-10%] w-[700px] h-[700px] bg-purple-800/40 rounded-full blur-[100px] mix-blend-screen" />
    <motion.div animate={{ x: [0, -70, 30, 0], y: [0, 60, -40, 0], scale: [1, 1.1, 0.9, 1] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-amber-700/40 rounded-full blur-[100px] mix-blend-screen" />
    <motion.div animate={{ x: [0, 50, -50, 0], y: [0, 50, -50, 0], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[40%] left-[30%] w-[500px] h-[500px] bg-blue-800/30 rounded-full blur-[120px] mix-blend-screen" />
  </div>
);

// 3. Advanced Particle Background
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

// 4. AI Librarian Widget
const AILibrarianWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'أهلاً بك في راوي! 🪶 أنا مساعدك الذكي. كيف يمكنني إلهامك اليوم؟' }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput("");
    setIsTyping(true);
    const context = `أنت "راوي"، أمين مكتبة ذكي ومثقف في موقع "راوي" لبيع الكتب. أنت تتحدث بأسلوب فصيح وراقٍ. ساعد الزوار في اختيار الكتب.`;
    const prompt = `${context}\n\nالمستخدم: ${userMsg}\nراوي:`;
    const reply = await generateGeminiContent(prompt);
    setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    setIsTyping(false);
  };

  return (
    <div className="fixed bottom-6 left-6 z-[90] flex flex-col items-start font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="mb-4 w-80 md:w-96 bg-[#111] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[400px]">
            <div className="bg-gradient-to-r from-amber-600 to-orange-700 p-4 flex justify-between items-center"><div className="flex items-center gap-2 text-white font-bold"><Bot size={20} /><span>الراوي الذكي</span></div><button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white"><X size={18} /></button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/40 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-amber-500 text-black rounded-br-none' : 'bg-white/10 text-gray-200 rounded-bl-none'}`}>{msg.text}</div>
                </div>
              ))}
              {isTyping && <div className="flex justify-start"><div className="bg-white/10 p-3 rounded-2xl rounded-bl-none flex gap-1 items-center"><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span></div></div>}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="p-3 bg-[#1a1a1a] border-t border-white/5 flex gap-2"><input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="اسأل الراوي..." className="flex-1 bg-black border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:border-amber-500 outline-none" /><button type="submit" disabled={!input.trim() || isTyping} className="bg-amber-500 text-black p-2 rounded-full hover:bg-amber-400 disabled:opacity-50 transition-colors"><Send size={18} /></button></form>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsOpen(!isOpen)} className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)] text-white z-50 relative group">
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
        <span className="absolute left-full ml-3 bg-white text-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">تحدث مع الراوي</span>
      </motion.button>
    </div>
  );
};

// 5. Toast & Modal Components
const ToastContainer = ({ toasts }) => (
  <div className="fixed top-24 left-6 z-[100] flex flex-col gap-2 pointer-events-none">
    <AnimatePresence>{toasts.map((toast) => (<motion.div key={toast.id} initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="bg-white text-black px-4 py-3 rounded-lg shadow-2xl border-r-4 border-amber-500 flex items-center gap-3 min-w-[250px] pointer-events-auto"><div className="bg-green-100 p-1 rounded-full text-green-600"><Check size={16} /></div><span className="text-sm font-bold">{toast.message}</span></motion.div>))}</AnimatePresence>
  </div>
);

const BookDetailsModal = ({ book, onClose, onAddToCart, onAddWishlist }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={onClose}>
    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#151515] w-full max-w-4xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row max-h-[90vh]" onClick={e => e.stopPropagation()}>
      <div className={`md:w-1/3 bg-gradient-to-br ${book.color} p-8 flex items-center justify-center relative overflow-hidden`}>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30"></div>
        <div className="w-40 h-60 bg-black/20 backdrop-blur shadow-2xl rounded flex items-center justify-center text-center p-4 border border-white/20 transform hover:scale-105 transition-transform duration-500"><h2 className="text-white font-bold font-serif text-xl">{book.title}</h2></div>
      </div>
      <div className="md:w-2/3 p-8 flex flex-col overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-start mb-4"><div><span className="text-amber-400 text-sm font-medium">{book.category}</span><h2 className="text-3xl font-bold text-white mt-1">{book.title}</h2><p className="text-gray-400">{book.author}</p></div><button onClick={onClose} className="text-gray-500 hover:text-white"><X /></button></div>
        <div className="flex gap-6 text-sm text-gray-400 mb-6 border-b border-white/10 pb-4"><div className="flex items-center gap-1"><Star className="text-yellow-400 fill-yellow-400" size={16} /> {book.rating} ({book.reviews})</div><div className="flex items-center gap-1"><BookOpen size={16} /> {book.pages} صفحة</div><div className="flex items-center gap-1"><Globe size={16} /> {book.lang}</div></div>
        <p className="text-gray-300 leading-relaxed mb-6">{book.desc} وصف الكتاب الممتع في راوي...</p>
        <div className="flex gap-3 mb-8"><button onClick={() => onAddToCart(book)} className="flex-1 bg-amber-400 text-black py-3 rounded-xl font-bold hover:bg-amber-500 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"><ShoppingBag size={20} /> إضافة للسلة - {book.price} ج.م</button><button onClick={() => onAddWishlist(book)} className="p-3 rounded-xl border border-white/20 hover:bg-white/10 text-white transition-all hover:scale-[1.05]"><Heart size={20} /></button></div>
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
          {step === 1 && (<motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4"><div className="space-y-2"><label className="text-sm text-gray-400">الاسم الكامل</label><input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-amber-400 outline-none" placeholder="أحمد محمد" /></div><div className="space-y-2"><label className="text-sm text-gray-400">العنوان</label><input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-amber-400 outline-none" placeholder="القاهرة..." /></div><div className="bg-amber-400/10 p-4 rounded-lg border border-amber-400/20 mt-4 flex justify-between text-amber-400 font-bold"><span>المجموع الكلي</span><span>{total} ج.م</span></div><button onClick={() => setStep(2)} className="w-full mt-4 bg-amber-400 text-black py-3 rounded-lg font-bold hover:bg-amber-500">المتابعة للدفع</button></motion.div>)}
          {step === 2 && (<motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6 text-center"><div className="w-full h-48 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl border border-white/10 p-6 relative overflow-hidden flex flex-col justify-between text-left"><div className="text-white font-mono text-xl tracking-widest mt-auto">**** **** **** 4242</div></div><button onClick={handlePayment} disabled={isLoading} className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 flex items-center justify-center gap-2">{isLoading ? <Loader2 className="animate-spin" /> : <><CreditCard size={20} /> تأكيد ودفع {total} ج.م</>}</button></motion.div>)}
          {step === 3 && (<motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8"><div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20"><Check size={40} className="text-white" /></div><h2 className="text-2xl font-bold text-white mb-2">تم الدفع بنجاح!</h2><button onClick={onClose} className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">العودة للراوي</button></motion.div>)}
        </div>
      </div>
    </motion.div>
  );
};

// 6. Main App
export default function App() {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [selectedBook, setSelectedBook] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [toasts, setToasts] = useState([]);
  const aboutSectionRef = useRef(null);

  const addToast = (message) => { const id = Date.now(); setToasts(prev => [...prev, { id, message }]); setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000); };
  const addToCart = (book) => { if (!cart.find(item => item.id === book.id)) { setCart([...cart, book]); addToast(`تمت إضافة "${book.title}" للسلة`); } else { addToast(`"${book.title}" موجود بالفعل`); } };
  const toggleWishlist = (book) => { if (wishlist.find(i => i.id === book.id)) { setWishlist(wishlist.filter(i => i.id !== book.id)); addToast("تم الحذف من المفضلة"); } else { setWishlist([...wishlist, book]); addToast("تمت الإضافة للمفضلة"); } };
  const removeFromCart = (id) => setCart(cart.filter(i => i.id !== id));
  const scrollToAbout = () => aboutSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  const filteredBooks = books.filter(book => (activeCategory === "الكل" || book.category === activeCategory) && (book.title.includes(searchQuery) || book.author.includes(searchQuery)));
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-amber-500 selection:text-white overflow-x-hidden" dir="rtl">
      <ClickRippleEffect />
      <AmbientBackground />
      <ParticleBackground />
      <ToastContainer toasts={toasts} />
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/60 border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}><RawiLogo /></div>
        <div className="flex-1 max-w-lg mx-4 md:mx-8"><div className="relative group"><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث عن قصة..." className="w-full bg-white/5 border border-white/10 rounded-full py-2 px-10 text-white focus:outline-none focus:border-amber-400/50 focus:bg-black/50 transition-all" /><Search className="absolute right-3 top-2.5 text-gray-400 group-focus-within:text-amber-400 transition-colors" size={18} />{searchQuery && <button onClick={() => setSearchQuery("")} className="absolute left-3 top-2.5 text-gray-500 hover:text-white"><X size={16}/></button>}</div></div>
        <div className="flex items-center gap-3 md:gap-5 text-white">
          <button className="hover:text-amber-400 transition-colors hover:scale-110 active:scale-95 transform"><Globe size={20} /></button>
          <button className="hover:text-red-500 transition-colors hidden md:block hover:scale-110 active:scale-95 transform"><Heart size={22} className={wishlist.length > 0 ? "fill-red-500 text-red-500" : ""} />{wishlist.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>}</button>
          <button className="hover:text-amber-400 transition-colors hover:scale-110 active:scale-95 transform" onClick={() => setIsCartOpen(true)}><ShoppingBag size={22} />{cart.length > 0 && <span className="absolute -top-2 -right-2 bg-amber-500 text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{cart.length}</span>}</button>
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}><Menu size={24} /></button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 min-h-screen flex items-center overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-amber-400/10 text-amber-400 text-sm font-medium mb-4 border border-amber-400/20"><Feather size={14} /> كل كتاب، حكاية جديدة</span>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">دع <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">الراوي</span><br />يسرد قصتك</h1>
            <p className="text-gray-400 text-lg mb-8 max-w-lg leading-relaxed">منصة "راوي" تجمع بين عبق الماضي وذكاء المستقبل. استكشف الكتب كما لم تفعل من قبل.</p>
            <div className="flex flex-wrap gap-4"><button onClick={() => document.getElementById('books-section').scrollIntoView({behavior: 'smooth'})} className="bg-amber-400 text-black px-8 py-3 rounded-full font-bold hover:bg-amber-500 transition-all flex items-center gap-2 hover:scale-105 active:scale-95">تصفح الحكايات <ArrowRight size={18} /></button><button onClick={scrollToAbout} className="border border-white/20 px-8 py-3 rounded-full font-medium hover:bg-white/5 hover:border-white/50 transition-all bg-white/5 backdrop-blur hover:scale-105 active:scale-95">عن راوي</button></div>
          </motion.div>
          <div className="flex justify-center lg:justify-end perspective-1000 group">
             <motion.div className="w-72 h-[450px] bg-gradient-to-br from-amber-600 to-orange-800 rounded-r-xl rounded-l-sm shadow-[20px_20px_60px_rgba(0,0,0,0.5)] relative transform transition-transform duration-300 group-hover:rotate-y-12 group-hover:rotate-x-6 preserve-3d cursor-pointer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <div className="absolute inset-0 flex flex-col justify-between p-8 border-l-4 border-white/20"><div><h2 className="text-4xl font-bold text-white font-serif drop-shadow-lg">ألف<br/>ليلة</h2><p className="text-white/80 mt-2">وليـلة</p></div><div className="flex justify-between items-center"><span className="text-2xl font-bold text-white">راوي</span><Feather size={32} className="text-white/80" /></div></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Books Grid */}
      <section id="books-section" className="py-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6"><h2 className="text-3xl font-bold border-r-4 border-amber-400 pr-4">روائع القصص</h2><div className="flex flex-wrap gap-2 justify-center">{["الكل", ...new Set(books.map(b => b.category))].map(cat => (<button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-sm transition-all border border-transparent ${activeCategory === cat ? "bg-amber-400 text-black font-bold scale-105" : "bg-white/5 text-gray-300 border-white/10 hover:border-amber-400/50"}`}>{cat}</button>))}</div></div>
          {filteredBooks.length === 0 ? <div className="text-center py-20 text-gray-500">لا توجد حكايات مطابقة 🔍</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">{filteredBooks.map((book) => (<motion.div key={book.id} layout initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} whileHover={{ y: -10 }} className="group bg-[#151515] border border-white/5 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all hover:shadow-2xl hover:shadow-amber-500/10"><div className={`h-64 bg-gradient-to-br ${book.color} relative p-6 flex items-center justify-center overflow-hidden cursor-pointer`} onClick={() => setSelectedBook(book)}><div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div><motion.div whileHover={{ scale: 1.1, rotate: -3 }} className="w-32 h-48 bg-black/20 backdrop-blur rounded shadow-2xl border border-white/20 flex flex-col items-center justify-center text-center p-2"><h3 className="text-white font-bold text-sm line-clamp-2">{book.title}</h3></motion.div></div><div className="p-5"><div className="flex justify-between items-start mb-2"><div><h3 className="text-lg font-bold text-white cursor-pointer hover:text-amber-400" onClick={() => setSelectedBook(book)}>{book.title}</h3><p className="text-sm text-gray-400">{book.author}</p></div><div className="flex items-center gap-1 text-amber-400 text-xs bg-amber-400/10 px-2 py-1 rounded"><Star size={10} fill="currentColor" /> {book.rating}</div></div><div className="flex items-center justify-between mt-4 border-t border-white/5 pt-4"><span className="text-xl font-bold text-white">{book.price} <span className="text-sm text-gray-500 font-normal">ج.م</span></span><button onClick={() => addToCart(book)} className="bg-white text-black p-2.5 rounded-xl hover:bg-amber-400 transition-all hover:scale-105 active:scale-95"><ShoppingBag size={18} /></button></div></div></motion.div>))}</AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {/* About */}
      <section ref={aboutSectionRef} className="py-24 bg-[#0f0f0f] relative border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div><h2 className="text-4xl font-bold mb-6">لماذا <span className="text-amber-400">راوي</span>؟</h2><p className="text-gray-400 leading-relaxed mb-6 text-lg">راوي ليس مجرد مكتبة، بل هو جسر يربط بين حكمة الماضي وتقنية المستقبل.</p><ul className="space-y-4">{["كتب منتقاة بعناية", "تلخيص ذكي بالذكاء الاصطناعي", "مجتمع للقراء والمفكرين"].map((item, i) => (<li key={i} className="flex items-center gap-3 text-gray-300"><span className="bg-amber-400/20 text-amber-400 p-1 rounded-full"><Check size={14}/></span> {item}</li>))}</ul></div>
          <div className="bg-white/5 rounded-2xl p-8 border border-white/5 relative overflow-hidden"><div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/20 blur-3xl rounded-full"></div><h3 className="text-2xl font-bold mb-4">قالوا عن راوي</h3><div className="space-y-4"><div className="bg-black/40 p-4 rounded-xl border border-white/5"><p className="text-gray-400 text-sm">"تجربة راوي ساحرة، تجعل القراءة متعة بصرية وعقلية."</p></div></div></div>
        </div>
      </section>

      {/* Cart & Modals */}
      <AnimatePresence>
        {isCartOpen && <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="fixed top-0 left-0 h-full w-full max-w-md bg-[#111] border-r border-white/10 z-[70] p-6 flex flex-col shadow-2xl"><div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10"><h2 className="text-2xl font-bold">حقيبة الراوي <span className="text-amber-400">({cart.length})</span></h2><button onClick={() => setIsCartOpen(false)}><X /></button></div><div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">{cart.length === 0 ? <p className="text-gray-500 text-center mt-10">الحقيبة فارغة، أضف بعض الحكايات.</p> : cart.map((item, idx) => (<motion.div layout key={`${item.id}-${idx}`} className="flex gap-4 bg-white/5 p-3 rounded-lg border border-white/5 relative"><div className={`w-12 h-16 rounded bg-gradient-to-br ${item.color}`}></div><div className="flex-1"><h4 className="font-bold text-sm">{item.title}</h4><p className="text-xs text-gray-400">{item.price} ج.م</p></div><button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded"><Trash2 size={16} /></button></motion.div>))}</div><div className="mt-6 pt-6 border-t border-white/10"><button onClick={() => { setIsCartOpen(false); setShowCheckout(true); }} disabled={cart.length === 0} className="w-full bg-amber-400 text-black py-3 rounded-xl font-bold hover:bg-amber-500 disabled:opacity-50">إتمام الشراء ({total} ج.م)</button></div></motion.div>}
        {selectedBook && <BookDetailsModal book={selectedBook} onClose={() => setSelectedBook(null)} onAddToCart={(b) => { addToCart(b); setSelectedBook(null); }} onAddWishlist={toggleWishlist} />}
        {showCheckout && <CheckoutModal cart={cart} total={total} onClose={() => setShowCheckout(false)} onClearCart={() => setCart([])} />}
      </AnimatePresence>

      <AILibrarianWidget />

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 pt-16 pb-8 px-6 relative z-10">
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
            <h4 className="font-bold text-white mb-6 flex items-center gap-2"><Code size={18} className="text-amber-400"/> عن المطور</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li className="flex items-center gap-3 hover:text-white transition-colors"><User size={16} className="text-amber-400" /> Ahmed Monged</li>
              <li className="flex items-center gap-3 hover:text-white transition-colors"><Phone size={16} className="text-amber-400" /> +201003061972</li>
              <li className="flex items-center gap-3 hover:text-white transition-colors"><Mail size={16} className="text-amber-400" /> ahmdmnjd806@gmail.com</li>
            </ul>
          </div>
          <div><h4 className="font-bold text-white mb-6">النشرة البريدية</h4><div className="flex gap-2"><input type="email" placeholder="بريدك الإلكتروني" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm w-full focus:border-amber-400 outline-none text-white" /><button className="bg-amber-400 text-black p-2 rounded-lg hover:bg-amber-500"><Send size={18} /></button></div></div>
        </div>
        <div className="text-center text-gray-600 text-xs border-t border-white/5 pt-8">© 2024 راوي - جميع الحقوق محفوظة. تطوير Ahmed Monged.</div>
      </footer>
    </div>
  );
}