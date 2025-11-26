import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const UserProfile = () => {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('none'); // none, pending, friends
    const [isSender, setIsSender] = useState(false);

    useEffect(() => {
        fetchUser();
        checkConnectionStatus();
    }, [id]);

    const fetchUser = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/users/${id}`);
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    };

    const checkConnectionStatus = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`http://localhost:3000/api/connections/status/${id}`, {
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

    const sendRequest = async () => {
        const token = localStorage.getItem('token');
        if (!token) return alert('يجب تسجيل الدخول أولاً');

        try {
            const res = await fetch('http://localhost:3000/api/connections/request', {
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

    if (!user) return <div className="text-white text-center mt-20">جاري التحميل...</div>;

    return (
        <div className="min-h-screen bg-black text-white p-8 pt-24">
            <div className="max-w-2xl mx-auto bg-gray-900 rounded-xl p-8 border border-green-500/30 shadow-[0_0_15px_rgba(0,255,0,0.1)]">
                <div className="flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full bg-gray-800 border-2 border-green-500 mb-4 overflow-hidden">
                        <img src={user.avatar_url || 'https://via.placeholder.com/150'} alt={user.username} className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-3xl font-bold text-green-400 mb-2">{user.username}</h1>
                    <p className="text-gray-400 mb-6">انضم في {new Date(user.created_at).toLocaleDateString('ar-EG')}</p>

                    <div className="flex gap-4 mb-8">
                        <div className="text-center bg-gray-800 p-4 rounded-lg min-w-[100px]">
                            <span className="block text-2xl font-bold text-white">{user.published_books || 0}</span>
                            <span className="text-sm text-gray-400">كتب منشورة</span>
                        </div>
                    </div>

                    {connectionStatus === 'none' && (
                        <button onClick={sendRequest} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full transition-colors">
                            إضافة صديق
                        </button>
                    )}
                    {connectionStatus === 'pending' && (
                        <button disabled className="bg-gray-600 text-white px-6 py-2 rounded-full cursor-not-allowed">
                            {isSender ? 'تم إرسال الطلب' : 'طلب معلق (راجع التنبيهات)'}
                        </button>
                    )}
                    {connectionStatus === 'friends' && (
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors">
                            مراسلة
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
