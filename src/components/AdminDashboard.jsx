import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Loader2, X, LogOut, Trash2, MapPin, Globe, BookOpen, Plus, DollarSign, FileText, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = ({ token, onLogout }) => {
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'books'
    const [users, setUsers] = useState([]);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddBook, setShowAddBook] = useState(false);
    const [newBook, setNewBook] = useState({
        title: '', author: '', category: '', description: '',
        image_url: '', pdf_url: '', pages: '', language: 'العربية', is_new: false
    });

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const headers = { 'Authorization': `Bearer ${token}` };

                // Fetch Users
                const usersRes = await fetch('/api/admin/users', { headers });
                if (usersRes.ok) setUsers(await usersRes.json());

                // Fetch Books
                const booksRes = await fetch('/api/books');
                if (booksRes.ok) setBooks(await booksRes.json());

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    // --- User Actions ---
    const handleDeleteUser = async (userId) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setUsers(users.filter(u => u.id !== userId));
                alert('تم الحذف بنجاح');
            } else {
                alert('فشل الحذف');
            }
        } catch (error) {
            console.error(error);
        }
    };

    // --- Book Actions ---
    const handleAddBook = async (e) => {
        e.preventDefault();
        const isEdit = !!newBook.id;
        const url = isEdit ? `/api/books/${newBook.id}` : '/api/books';
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newBook)
            });
            const data = await res.json();
            if (res.ok) {
                if (isEdit) {
                    setBooks(books.map(b => b.id === newBook.id ? data : b));
                    alert('تم تعديل الكتاب بنجاح');
                } else {
                    setBooks([data, ...books]);
                    alert('تم إضافة الكتاب بنجاح');
                }
                setShowAddBook(false);
                setShowAddBook(false);
                setNewBook({ title: '', author: '', category: '', description: '', image_url: '', pdf_url: '', pages: '', language: 'العربية', is_new: false });
            } else {
                alert(data.message || 'حدث خطأ');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteBook = async (bookId) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا الكتاب؟')) return;
        try {
            const res = await fetch(`/api/books/${bookId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setBooks(books.filter(b => b.id !== bookId));
                alert('تم حذف الكتاب');
            } else {
                alert('فشل الحذف');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const openEditModal = (book) => {
        setNewBook(book);
        setShowAddBook(true);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-['Tajawal'] p-8" dir="rtl">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold flex items-center gap-2">
                        <ShieldCheck className="text-green-500" /> لوحة التحكم
                    </h2>
                    <button onClick={onLogout} className="flex items-center gap-2 bg-red-500/10 text-red-400 px-4 py-2 rounded-xl hover:bg-red-500/20 transition-colors">
                        <LogOut size={18} /> تسجيل خروج
                    </button>
                </div>

                {/* Stats & Tabs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div
                        onClick={() => setActiveTab('users')}
                        className={`p-6 rounded-2xl border cursor-pointer transition-all ${activeTab === 'users' ? 'bg-white/10 border-purple-500' : 'bg-[#1a1a1a] border-white/10 hover:bg-white/5'} flex items-center gap-4`}
                    >
                        <div className="p-3 bg-blue-500/20 rounded-full text-blue-400"><Users size={24} /></div>
                        <div><h3 className="text-gray-400 text-sm">المستخدمين</h3><p className="text-2xl font-bold text-white">{users.length}</p></div>
                    </div>
                    <div
                        onClick={() => setActiveTab('books')}
                        className={`p-6 rounded-2xl border cursor-pointer transition-all ${activeTab === 'books' ? 'bg-white/10 border-purple-500' : 'bg-[#1a1a1a] border-white/10 hover:bg-white/5'} flex items-center gap-4`}
                    >
                        <div className="p-3 bg-purple-500/20 rounded-full text-purple-400"><BookOpen size={24} /></div>
                        <div><h3 className="text-gray-400 text-sm">الكتب</h3><p className="text-2xl font-bold text-white">{books.length}</p></div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 overflow-hidden min-h-[500px]">
                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <>
                            <div className="p-6 border-b border-white/10"><h3 className="text-xl font-bold">قائمة المستخدمين</h3></div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-sm text-gray-300">
                                    <thead className="bg-white/5 text-gray-400">
                                        <tr><th className="p-4">ID</th><th className="p-4">الاسم</th><th className="p-4">البريد</th><th className="p-4">الموقع</th><th className="p-4">الصلاحية</th><th className="p-4">التاريخ</th><th className="p-4">إجراءات</th></tr>
                                    </thead>
                                    <tbody>
                                        {loading ? <tr><td colSpan="7" className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr> : users.map(u => (
                                            <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                                                <td className="p-4">#{u.id}</td>
                                                <td className="p-4 font-bold text-white">{u.username}</td>
                                                <td className="p-4">{u.email}</td>
                                                <td className="p-4 text-xs text-gray-400"><div className="flex items-center gap-1"><Globe size={12} /> {u.country || 'غير معروف'}</div></td>
                                                <td className="p-4"><span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>{u.role || 'user'}</span></td>
                                                <td className="p-4">{new Date(u.created_at).toLocaleDateString('ar-EG')}</td>
                                                <td className="p-4">{u.role !== 'admin' && <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg"><Trash2 size={18} /></button>}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* Books Tab */}
                    {activeTab === 'books' && (
                        <>
                            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                <h3 className="text-xl font-bold">مكتبة الكتب</h3>
                                <button onClick={() => { setNewBook({ title: '', author: '', category: '', description: '', image_url: '', pdf_url: '', pages: '', language: 'العربية', is_new: false }); setShowAddBook(true); }} className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-500 transition-colors"><Plus size={18} /> إضافة كتاب</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-sm text-gray-300">
                                    <thead className="bg-white/5 text-gray-400">
                                        <tr><th className="p-4">الغلاف</th><th className="p-4">العنوان</th><th className="p-4">المؤلف</th><th className="p-4">التصنيف</th><th className="p-4">ملف PDF</th><th className="p-4">إجراءات</th></tr>
                                    </thead>
                                    <tbody>
                                        {loading ? <tr><td colSpan="7" className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr> : books.map(b => (
                                            <tr key={b.id} className="border-b border-white/5 hover:bg-white/5">
                                                <td className="p-4"><img src={b.image_url} alt="cover" className="w-10 h-14 object-cover rounded" /></td>
                                                <td className="p-4 font-bold text-white">{b.title}</td>
                                                <td className="p-4">{b.author}</td>
                                                <td className="p-4"><span className="bg-white/10 px-2 py-1 rounded text-xs">{b.category}</span></td>
                                                <td className="p-4 text-xs truncate max-w-[150px]" title={b.pdf_url}>{b.pdf_url}</td>
                                                <td className="p-4 flex gap-2">
                                                    <button onClick={() => openEditModal(b)} className="text-blue-400 hover:bg-blue-500/10 p-2 rounded-lg"><FileText size={18} /></button>
                                                    <button onClick={() => handleDeleteBook(b.id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg"><Trash2 size={18} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Add/Edit Book Modal */}
            <AnimatePresence>
                {showAddBook && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#151515] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white">{newBook.id ? 'تعديل الكتاب' : 'إضافة كتاب جديد'}</h3>
                                <button onClick={() => setShowAddBook(false)} className="text-gray-400 hover:text-white"><X /></button>
                            </div>
                            <form onSubmit={handleAddBook} className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm text-gray-400 mb-1">عنوان الكتاب</label><input required type="text" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" value={newBook.title} onChange={e => setNewBook({ ...newBook, title: e.target.value })} /></div>
                                    <div><label className="block text-sm text-gray-400 mb-1">المؤلف</label><input required type="text" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" value={newBook.author} onChange={e => setNewBook({ ...newBook, author: e.target.value })} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm text-gray-400 mb-1">التصنيف</label><input required type="text" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" value={newBook.category} onChange={e => setNewBook({ ...newBook, category: e.target.value })} /></div>
                                </div>
                                <div><label className="block text-sm text-gray-400 mb-1">الوصف</label><textarea required className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none h-24" value={newBook.description} onChange={e => setNewBook({ ...newBook, description: e.target.value })}></textarea></div>

                                <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                                    <h4 className="text-purple-400 font-bold mb-3 text-sm flex items-center gap-2"><FileText size={16} /> ملفات الكتاب</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Cover Image Upload */}
                                        <div className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center hover:border-purple-500/50 transition-colors relative group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setNewBook({ ...newBook, image_url: reader.result });
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="flex flex-col items-center gap-2">
                                                {newBook.image_url ? (
                                                    <div className="relative w-20 h-28 rounded overflow-hidden border border-white/20">
                                                        <img src={newBook.image_url} className="w-full h-full object-cover" alt="Cover" />
                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <ImageIcon size={20} className="text-white" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                                                        <ImageIcon size={24} className="text-gray-400" />
                                                    </div>
                                                )}
                                                <p className="text-xs text-gray-400">{newBook.image_url ? 'تغيير الغلاف' : 'رفع غلاف الكتاب'}</p>
                                            </div>
                                        </div>

                                        {/* PDF Upload */}
                                        <div className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center hover:border-purple-500/50 transition-colors relative group flex flex-col items-center justify-center">
                                            <input
                                                type="file"
                                                accept="application/pdf"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setNewBook({ ...newBook, pdf_url: reader.result });
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-2">
                                                <FileText size={24} className={newBook.pdf_url ? "text-green-500" : "text-gray-400"} />
                                            </div>
                                            <p className="text-xs text-gray-400">{newBook.pdf_url ? 'تم اختيار ملف PDF' : 'رفع ملف PDF'}</p>
                                            {newBook.pdf_url && <p className="text-[10px] text-green-400 mt-1">جاهز للرفع</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div><label className="block text-sm text-gray-400 mb-1">عدد الصفحات</label><input type="number" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" value={newBook.pages} onChange={e => setNewBook({ ...newBook, pages: e.target.value })} /></div>
                                    <div><label className="block text-sm text-gray-400 mb-1">اللغة</label><input type="text" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" value={newBook.language} onChange={e => setNewBook({ ...newBook, language: e.target.value })} /></div>
                                    <div className="flex items-center pt-6"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-5 h-5 accent-purple-500" checked={newBook.is_new} onChange={e => setNewBook({ ...newBook, is_new: e.target.checked })} /><span className="text-white">علامة "جديد"</span></label></div>
                                </div>

                                <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all mt-4">{newBook.id ? 'حفظ التعديلات' : 'حفظ الكتاب'}</button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;
