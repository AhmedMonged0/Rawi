import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Book, Calendar, Edit2, Check, X, MessageCircle, UserPlus, Clock, BookOpen, Heart, LogOut, Users, UserMinus, Upload, BadgeCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar';

const UserProfile = () => {
    const { id } = useParams();
    const { showToast } = useToast();
    const [user, setUser] = useState(null);
    const [userBooks, setUserBooks] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('none'); // none, pending, friends
    const [isSender, setIsSender] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [isCurrentUser, setIsCurrentUser] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [requestId, setRequestId] = useState(null);

    // Social State
    const [friendRequests, setFriendRequests] = useState([]);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (id) {
            fetchUser();
            checkConnectionStatus();
            fetchUserBooks();
            fetchFollowData();
        }
    }, [id]);

    useEffect(() => {
        if (isCurrentUser) {
            fetchFriendRequests();
        }
    }, [isCurrentUser]);

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
                        const isCurrent = payload.id == id;
                        setIsCurrentUser(isCurrent);
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

    const fetchUserBooks = async () => {
        try {
            const res = await fetch(`/api/books`);
            if (res.ok) {
                const allBooks = await res.json();
                const myBooks = allBooks.filter(b => b.user_id == id);
                setUserBooks(myBooks);
            }
        } catch (error) {
            console.error("Error fetching books", error);
        }
    };

    const fetchFollowData = async () => {
        try {
            const followersRes = await fetch(`/api/users/${id}/followers`);
            const followingRes = await fetch(`/api/users/${id}/following`);
            if (followersRes.ok) setFollowersCount((await followersRes.json()).length);
            if (followingRes.ok) setFollowingCount((await followingRes.json()).length);

            const token = localStorage.getItem('rawi_token');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const myId = payload.id;
                // Check if I am following this user
                if (myId != id) {
                    const isFollowingRes = await fetch(`/api/users/${myId}/is-following/${id}`);
                    if (isFollowingRes.ok) {
                        const data = await isFollowingRes.json();
                        setIsFollowing(data.isFollowing);
                    }
                }
            }
        } catch (e) { console.error(e); }
    };

    const fetchFriendRequests = async () => {
        const token = localStorage.getItem('rawi_token');
        if (!token) return;
        try {
            const res = await fetch('/api/connections/requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setFriendRequests(await res.json());
        } catch (e) { console.error(e); }
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
                // If I am the receiver of a pending request, I need the request ID to respond
                if (data.status === 'pending' && !data.isSender) {
                    // We can store it in a state or just use it directly if we had a way.
                    // Let's add a state for it.
                    setRequestId(data.requestId);
                }
            }
        } catch (error) {
            console.error('Error checking status:', error);
        }
    };

    const handleVerifyRequest = async () => {
        const token = localStorage.getItem('rawi_token');
        if (!token) return;

        try {
            const res = await fetch('/api/users/verify-request', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                showToast('تم إرسال طلب التوثيق بنجاح', 'success');
                setUser(prev => ({ ...prev, verification_status: 'pending' }));
            } else {
                showToast('فشل إرسال الطلب', 'error');
            }
        } catch (error) {
            console.error('Error requesting verification:', error);
            showToast('حدث خطأ ما', 'error');
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
                    avatar_url: user.avatar_url
                })
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUser(prev => ({ ...prev, username: updatedUser.username }));
                setIsEditing(false);
                showToast('تم تحديث الملف الشخصي', 'success');
            } else {
                showToast('فشل تحديث الملف الشخصي', 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast('حدث خطأ أثناء التحديث', 'error');
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result;
            // Optimistic update
            setUser(prev => ({ ...prev, avatar_url: base64 }));

            const token = localStorage.getItem('rawi_token');
            if (!token) return;

            try {
                await fetch('/api/users/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ username: user.username, avatar_url: base64 })
                });
                showToast('تم تحديث الصورة الشخصية', 'success');
            } catch (err) { console.error(err); }
        };
        reader.readAsDataURL(file);
    };

    const sendRequest = async () => {
        const token = localStorage.getItem('rawi_token');
        if (!token) return showToast('يجب تسجيل الدخول أولاً', 'warning');

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
                showToast('تم إرسال طلب الصداقة', 'success');
            } else {
                const data = await res.json();
                showToast(data.message, 'error');
            }
        } catch (error) {
            console.error('Error sending request:', error);
            showToast('فشل إرسال الطلب', 'error');
        }
    };

    const handleFollowToggle = async () => {
        const token = localStorage.getItem('rawi_token');
        if (!token) return showToast('يجب تسجيل الدخول', 'warning');

        const url = isFollowing ? `/api/follow/${id}` : '/api/follow';
        const method = isFollowing ? 'DELETE' : 'POST';
        const body = isFollowing ? null : JSON.stringify({ followedId: id });

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body
            });
            if (res.ok) {
                setIsFollowing(!isFollowing);
                setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
                showToast(isFollowing ? 'تم إلغاء المتابعة' : 'تمت المتابعة', 'success');
            }
        } catch (e) { console.error(e); }
    };

    const handleRespondRequest = async (requestId, status) => {
        const token = localStorage.getItem('rawi_token');
        try {
            const res = await fetch(`/api/connections/${requestId}/respond`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                setFriendRequests(prev => prev.filter(r => r.id !== requestId));
                // If accepted, we might want to refresh connection status if it was from this user
                // But this list is "Requests Received", so if I accept, we become friends.
                // If the current profile page IS the sender, we should update status.
                // But usually requests list is shown on MY profile.
                // If I am viewing MY profile, and I accept a request from User X.
                // My connection status with User X changes.
                // But I am viewing ME.
            }
        } catch (e) { console.error(e); }
    };

    if (isLoading) return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="animate-pulse text-purple-500 text-xl">جاري التحميل...</div>
        </div>
    );

    if (error || !user) return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center flex-col gap-6 p-4 text-center">
            <div className="bg-red-500/10 p-6 rounded-2xl border border-red-500/20 max-w-md">
                <h2 className="text-2xl font-bold text-red-500 mb-2">المستخدم غير موجود</h2>
                <p className="text-gray-400 mb-6">
                    عذراً، لم نتمكن من العثور على هذا المستخدم (ID: {id}).
                    <br />
                    قد يكون الحساب قد حذف أو أن الرابط غير صحيح.
                </p>
                <div className="flex flex-col gap-3">
                    <button onClick={() => navigate('/')} className="w-full bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition-colors font-bold">
                        العودة للرئيسية
                    </button>
                    <button
                        onClick={() => {
                            localStorage.removeItem('rawi_token');
                            localStorage.removeItem('rawi_user');
                            window.location.href = '/';
                        }}
                        className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 font-bold"
                    >
                        <LogOut size={20} /> تسجيل خروج (لإصلاح المشكلة)
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pt-24 font-['Tajawal']" dir="rtl">
            <button onClick={() => navigate('/')} className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-50">
                <X size={24} />
            </button>
            {/* Profile Header Card */}
            <div className="bg-[#151515] rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden mb-8">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-purple-900/20 to-blue-900/20"></div>

                <div className="relative flex flex-col md:flex-row items-center gap-8 mt-12">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="w-40 h-40 rounded-full p-1 bg-gradient-to-br from-purple-500 to-blue-500">
                            <Avatar
                                url={user.avatar_url}
                                username={user.username}
                                size="w-full h-full"
                                textSize="text-5xl"
                                className="border-4 border-[#151515]"
                            />
                        </div>
                        {isCurrentUser && (
                            <>
                                <label htmlFor="avatar-upload" className="absolute bottom-2 right-2 bg-gray-800 p-2 rounded-full border border-white/10 hover:bg-gray-700 transition-colors cursor-pointer">
                                    <Edit2 size={16} className="text-gray-300" />
                                </label>
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarUpload}
                                />
                            </>
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
                                    <h1 className="text-4xl font-bold text-white flex items-center gap-2">
                                        {user.username}
                                        {user.is_verified && <BadgeCheck className="text-blue-500" size={32} />}
                                    </h1>
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
                                <span>انضم في {user.created_at ? new Date(user.created_at).toLocaleDateString('ar-EG') : 'غير معروف'}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full">
                                <User size={14} />
                                <span>{user.role === 'admin' ? 'مشرف' : 'عضو'}</span>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex justify-center md:justify-start gap-6 mt-6">
                            <div className="text-center">
                                <span className="block text-2xl font-bold text-white">{userBooks.length || user.published_books || 0}</span>
                                <span className="text-sm text-gray-500">كتب منشورة</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-2xl font-bold text-white">{followersCount}</span>
                                <span className="text-sm text-gray-500">متابعين</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-2xl font-bold text-white">{followingCount}</span>
                                <span className="text-sm text-gray-500">متابعة</span>
                            </div>
                        </div>
                    </div>

                    {/* Verification Status/Request (Current User) */}
                    {
                        isCurrentUser && (
                            <div className="flex justify-center md:justify-start mt-4">
                                {user.verification_status === 'pending' && (
                                    <div className="bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-xl flex items-center gap-2 border border-yellow-500/20">
                                        <Clock size={20} />
                                        <span>طلب التوثيق قيد المراجعة</span>
                                    </div>
                                )}
                                {(user.verification_status === 'none' || user.verification_status === 'rejected') && !user.is_verified && (
                                    <button
                                        onClick={handleVerifyRequest}
                                        className="flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 px-6 py-2 rounded-xl transition-all font-bold"
                                    >
                                        <BadgeCheck size={20} />
                                        <span>طلب توثيق الحساب</span>
                                    </button>
                                )}
                            </div>
                        )
                    }
                </div >

                {/* Actions */}
                {
                    !isCurrentUser && (
                        <div className="flex flex-col gap-3 min-w-[150px]">
                            {/* Follow Button */}
                            <button
                                onClick={handleFollowToggle}
                                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all font-bold shadow-lg ${isFollowing
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                    : 'bg-white text-black hover:bg-gray-200'
                                    }`}
                            >
                                {isFollowing ? <UserMinus size={20} /> : <UserPlus size={20} />}
                                <span>{isFollowing ? 'إلغاء المتابعة' : 'متابعة'}</span>
                            </button>

                            {/* Friend Request Button */}
                            {connectionStatus === 'none' && (
                                <button onClick={sendRequest} className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-all font-bold shadow-lg shadow-purple-900/20">
                                    <UserPlus size={20} />
                                    <span>إضافة صديق</span>
                                </button>
                            )}
                            {connectionStatus === 'pending' && (
                                isSender ? (
                                    <button disabled className="flex items-center justify-center gap-2 bg-gray-700 text-gray-300 px-6 py-3 rounded-xl cursor-not-allowed">
                                        <Clock size={20} />
                                        <span>تم الإرسال</span>
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRespondRequest(requestId, 'accepted')}
                                            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl transition-all font-bold"
                                        >
                                            <Check size={20} />
                                            <span>قبول</span>
                                        </button>
                                        <button
                                            onClick={() => handleRespondRequest(requestId, 'rejected')}
                                            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl transition-all font-bold"
                                        >
                                            <X size={20} />
                                            <span>رفض</span>
                                        </button>
                                    </div>
                                )
                            )}
                            {connectionStatus === 'friends' && (
                                <button
                                    onClick={() => navigate('/chat', { state: { selectedUserId: id } })}
                                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-all font-bold shadow-lg shadow-blue-900/20"
                                >
                                    <MessageCircle size={20} />
                                    <span>مراسلة</span>
                                </button>
                            )}
                        </div>
                    )
                }
            </div>

            {/* Friend Requests Section (Only for Current User) */}
            {
                isCurrentUser && friendRequests.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
                            <Users className="text-purple-500" />
                            <span>طلبات الصداقة ({friendRequests.length})</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {friendRequests.map(req => (
                                <div key={req.id} className="bg-[#151515] p-4 rounded-xl border border-white/10 flex items-center justify-between">
                                    <div
                                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => navigate(`/profile/${req.user_id}`)}
                                    >
                                        <img src={req.avatar_url || 'https://via.placeholder.com/40'} alt={req.username} className="w-10 h-10 rounded-full object-cover" />
                                        <div>
                                            <h4 className="font-bold">{req.username}</h4>
                                            <span className="text-xs text-gray-500">{new Date(req.created_at).toLocaleDateString('ar-EG')}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleRespondRequest(req.id, 'accepted')} className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30">
                                            <Check size={18} />
                                        </button>
                                        <button onClick={() => handleRespondRequest(req.id, 'rejected')} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* Books Grid */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <BookOpen className="text-purple-500" />
                    <span>الكتب المنشورة</span>
                </h2>

                {userBooks.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userBooks.map(book => (
                            <div key={book.id} className="bg-[#151515] rounded-xl overflow-hidden border border-white/10 group hover:border-purple-500/50 transition-all">
                                <div className="h-48 overflow-hidden relative">
                                    <img src={book.image_url} alt={book.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-lg mb-1 truncate">{book.title}</h3>
                                    <p className="text-gray-400 text-sm mb-3">{book.author}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs bg-white/5 px-2 py-1 rounded text-gray-300">{book.category}</span>
                                        <div className="flex items-center gap-1 text-yellow-400 text-xs">
                                            <span className="font-bold">{book.rating || 0}</span>
                                            <span>★</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-[#151515] rounded-3xl border border-white/5">
                        <Book className="mx-auto text-gray-600 mb-4" size={48} />
                        <p className="text-gray-400">لم يقم هذا المستخدم بنشر أي كتب بعد.</p>
                    </div>
                )}
            </div>
        </div>

    );
};

export default UserProfile;
