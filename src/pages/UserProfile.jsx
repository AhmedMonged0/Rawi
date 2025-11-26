import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { User, Book, Calendar, Edit2, Check, X, MessageCircle, UserPlus, Clock } from 'lucide-react';

const UserProfile = () => {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('none'); // none, pending, friends
    const [isSender, setIsSender] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [isCurrentUser, setIsCurrentUser] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (id) {
            fetchUser();
            checkConnectionStatus();
        }
    }, [id]);

    const fetchUser = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/users/${id}`);
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                setNewUsername(data.username);

                // Check if this is the current user
                const token = localStorage.getItem('rawi_token');
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        setIsCurrentUser(payload.id == id);
                    } catch (e) {
                        console.error("Token parse error", e);
                    }
                }
            } else {
                setError("المستخدم غير موجود");
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            setError("حدث خطأ في الاتصال");
        } finally {
            setIsLoading(false);
        }
    };

    const checkConnectionStatus = async () => {
        const token = localStorage.getItem('rawi_token');
        if (!token) return;

        try {
            const res = await fetch(`/api/connections/status/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConnectionStatus(data.status);
                setIsSender(data.isSender);
            }
        } catch (error) {
            console.error('Error checking status:', error);
        }
    };

    const handleUpdateProfile = async () => {
        const token = localStorage.getItem('rawi_token');
        if (!token) return;

        try {
            const res = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: newUsername,
                    avatar_url: user.avatar_url // Keep existing avatar for now
                })
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUser(prev => ({ ...prev, username: updatedUser.username }));
                setIsEditing(false);
                // Update local storage user info if needed
            } else {
                alert('فشل تحديث الملف الشخصي');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const sendRequest = async () => {
        const token = localStorage.getItem('rawi_token');
        if (!token) return alert('يجب تسجيل الدخول أولاً');

        try {
            const res = await fetch('/api/connections/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ receiverId: id })
            });
            if (res.ok) {
                setConnectionStatus('pending');
                setIsSender(true);
            } else {
                const data = await res.json();
                alert(data.message);
            }
        } catch (error) {
            console.error('Error sending request:', error);
        }
    };

    if (isLoading) return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="animate-pulse text-purple-500 text-xl">جاري التحميل...</div>
        </div>
    );

    if (error || !user) return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="text-red-500 text-xl">{error || "المستخدم غير موجود"}</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pt-24 font-['Tajawal']" dir="rtl">
            <div className="max-w-4xl mx-auto">
                {/* Profile Header Card */}
                <div className="bg-[#151515] rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-purple-900/20 to-blue-900/20"></div>

                    <div className="relative flex flex-col md:flex-row items-center gap-8 mt-12">
                        {/* Avatar */}
                        <div className="relative group">
                            <div className="w-40 h-40 rounded-full p-1 bg-gradient-to-br from-purple-500 to-blue-500">
                                <img
                                    src={user.avatar_url || 'https://via.placeholder.com/150'}
                                    alt={user.username}
                                    className="w-full h-full rounded-full object-cover border-4 border-[#151515]"
                                />
                            </div>
                            {isCurrentUser && (
                                <button className="absolute bottom-2 right-2 bg-gray-800 p-2 rounded-full border border-white/10 hover:bg-gray-700 transition-colors">
                                    <Edit2 size={16} className="text-gray-300" />
                                </button>
                            )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-right space-y-4">
                            <div className="flex items-center justify-center md:justify-start gap-3">
                                {isEditing ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={newUsername}
                                            onChange={(e) => setNewUsername(e.target.value)}
                                            className="bg-black/50 border border-purple-500 rounded-lg px-3 py-1 text-xl font-bold outline-none"
                                        />
                                        <button onClick={handleUpdateProfile} className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30">
                                            <Check size={20} />
                                        </button>
                                        <button onClick={() => setIsEditing(false)} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">
                                            <X size={20} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-4xl font-bold text-white">{user.username}</h1>
                                        {isCurrentUser && (
                                            <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-purple-400 transition-colors">
                                                <Edit2 size={20} />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-400 text-sm">
                                <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full">
                                    <Calendar size={14} />
                                    <span>انضم في {new Date(user.created_at).toLocaleDateString('ar-EG')}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full">
                                    <User size={14} />
                                    <span>{user.role === 'admin' ? 'مشرف' : 'عضو'}</span>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex justify-center md:justify-start gap-6 mt-6">
                                <div className="text-center">
                                    <span className="block text-2xl font-bold text-white">{user.published_books || 0}</span>
                                    <span className="text-sm text-gray-500">كتب منشورة</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-2xl font-bold text-white">0</span>
                                    <span className="text-sm text-gray-500">متابعين</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-2xl font-bold text-white">0</span>
                                    <span className="text-sm text-gray-500">متابعة</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        {!isCurrentUser && (
                            <div className="flex flex-col gap-3 min-w-[150px]">
                                {connectionStatus === 'none' && (
                                    <button onClick={sendRequest} className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-all font-bold shadow-lg shadow-purple-900/20">
                                        <UserPlus size={20} />
                                        <span>إضافة صديق</span>
                                    </button>
                                )}
                                {connectionStatus === 'pending' && (
                                    <button disabled className="flex items-center justify-center gap-2 bg-gray-700 text-gray-300 px-6 py-3 rounded-xl cursor-not-allowed">
                                        <Clock size={20} />
                                        <span>{isSender ? 'تم الإرسال' : 'طلب معلق'}</span>
                                    </button>
                                )}
                                {connectionStatus === 'friends' && (
                                    <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-all font-bold shadow-lg shadow-blue-900/20">
                                        <MessageCircle size={20} />
                                        <span>مراسلة</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
