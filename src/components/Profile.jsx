import React, { useState, useEffect } from 'react';
import { User, Heart, Settings, LogOut, BookOpen, Camera, Save } from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = ({ user, token, onLogout }) => {
    const [activeTab, setActiveTab] = useState('favorites');
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState({
        username: user?.username || '',
        avatar_url: user?.avatar_url || ''
    });

    useEffect(() => {
        if (activeTab === 'favorites') {
            fetchFavorites();
        }
    }, [activeTab]);

    const fetchFavorites = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/users/${user.id}/favorites`);
            if (res.ok) {
                setFavorites(await res.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFavorite = async (bookId) => {
        try {
            const res = await fetch(`/api/favorites/${bookId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setFavorites(favorites.filter(b => b.id !== bookId));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profileData)
            });
            const data = await res.json();
            if (res.ok) {
                // Update local storage
                const currentUser = JSON.parse(localStorage.getItem('rawi_user') || '{}');
                const updatedUser = { ...currentUser, ...profileData };
                localStorage.setItem('rawi_user', JSON.stringify(updatedUser));

                alert('تم تحديث الملف الشخصي بنجاح');
            } else {
                alert(data.message || 'حدث خطأ');
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-['Tajawal'] p-4 md:p-8" dir="rtl">
            <div className="max-w-4xl mx-auto">
                {/* Profile Header */}
                <div className="bg-[#1a1a1a] rounded-2xl p-8 mb-8 border border-white/10 flex flex-col md:flex-row items-center gap-6">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center text-3xl font-bold overflow-hidden border-4 border-[#0a0a0a]">
                            {profileData.avatar_url ? <img src={profileData.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : profileData.username[0]?.toUpperCase()}
                        </div>
                        <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-[#0a0a0a]"></div>
                    </div>
                    <div className="text-center md:text-right flex-1">
                        <h1 className="text-2xl font-bold mb-1">{profileData.username}</h1>
                        <p className="text-gray-400 text-sm mb-4">{user?.email}</p>
                        <div className="flex gap-2 justify-center md:justify-start">
                            <span className="bg-white/5 px-3 py-1 rounded-full text-xs border border-white/10">عضو مميز</span>
                            <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-xs border border-purple-500/20">{user?.role === 'admin' ? 'مدير النظام' : 'قارئ نهم'}</span>
                        </div>
                    </div>
                    <button onClick={onLogout} className="bg-red-500/10 text-red-400 px-6 py-2 rounded-xl hover:bg-red-500/20 transition-colors flex items-center gap-2">
                        <LogOut size={18} /> تسجيل خروج
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-white/10 pb-1">
                    <button onClick={() => setActiveTab('favorites')} className={`pb-3 px-4 flex items-center gap-2 transition-colors ${activeTab === 'favorites' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'}`}>
                        <Heart size={18} /> المفضلة
                    </button>
                    <button onClick={() => setActiveTab('settings')} className={`pb-3 px-4 flex items-center gap-2 transition-colors ${activeTab === 'settings' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'}`}>
                        <Settings size={18} /> الإعدادات
                    </button>
                </div>

                {/* Content */}
                <div className="min-h-[400px]">
                    {activeTab === 'favorites' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loading ? <p className="text-center col-span-3 text-gray-400">جاري التحميل...</p> : favorites.length === 0 ? (
                                <div className="col-span-3 text-center py-12 text-gray-500">
                                    <Heart size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>لا توجد كتب في المفضلة بعد</p>
                                </div>
                            ) : (
                                favorites.map(book => (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={book.id} className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/10 group hover:border-purple-500/50 transition-all">
                                        <div className="h-48 overflow-hidden relative">
                                            <img src={book.image_url} alt={book.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                            <button onClick={() => handleRemoveFavorite(book.id)} className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-all">
                                                <Heart size={16} fill="currentColor" />
                                            </button>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-bold text-lg mb-1 truncate">{book.title}</h3>
                                            <p className="text-gray-400 text-sm mb-3">{book.author}</p>
                                            <a href={book.pdf_url} target="_blank" rel="noreferrer" className="block w-full bg-white/5 hover:bg-purple-600 hover:text-white text-center py-2 rounded-lg text-sm transition-colors border border-white/10">
                                                قراءة الكتاب
                                            </a>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto bg-[#1a1a1a] p-8 rounded-2xl border border-white/10">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Settings className="text-purple-500" /> تعديل البيانات</h3>
                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">الاسم المعروض</label>
                                    <input type="text" value={profileData.username} onChange={e => setProfileData({ ...profileData, username: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">الصورة الرمزية</label>
                                    <div className="flex gap-4 items-start">
                                        <div className="relative group w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer hover:border-purple-500 transition-colors">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setProfileData({ ...profileData, avatar_url: reader.result });
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            {profileData.avatar_url ? (
                                                <>
                                                    <img src={profileData.avatar_url} className="w-full h-full object-cover" alt="Avatar Preview" />
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Camera size={20} className="text-white" />
                                                    </div>
                                                </>
                                            ) : (
                                                <Camera size={24} className="text-gray-600 group-hover:text-purple-500 transition-colors" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-purple-500/50 transition-colors relative">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                setProfileData({ ...profileData, avatar_url: reader.result });
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <p className="text-gray-400 text-sm mb-1">اضغط أو اسحب الصورة هنا</p>
                                                <p className="text-gray-600 text-xs">يدعم JPG, PNG (الحد الأقصى 10MB)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-500 transition-colors flex items-center justify-center gap-2">
                                    <Save size={18} /> حفظ التغييرات
                                </button>
                            </form>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
