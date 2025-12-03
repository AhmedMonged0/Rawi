import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminDashboard from '../components/AdminDashboard';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [token, setToken] = useState(localStorage.getItem('rawi_admin_token'));
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('rawi_admin_token');
        setToken(null);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setToken(data.token);
                localStorage.setItem('rawi_admin_token', data.token);
            } else {
                setError(data.message || 'فشل تسجيل الدخول');
            }
        } catch (err) {
            setError('حدث خطأ في الاتصال');
        } finally {
            setLoading(false);
        }
    };

    if (token) {
        return <AdminDashboard token={token} onLogout={handleLogout} />;
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-['Tajawal']" dir="rtl">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-8"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-400">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white">بوابة الإدارة</h1>
                    <p className="text-gray-400 mt-2">يرجى تسجيل الدخول للمتابعة</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">اسم المستخدم</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-10 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                placeholder="أدخل اسم المستخدم"
                            />
                            <User className="absolute right-3 top-3.5 text-gray-500" size={18} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">كلمة المرور</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-10 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                placeholder="أدخل كلمة المرور"
                            />
                            <Lock className="absolute right-3 top-3.5 text-gray-500" size={18} />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'تسجيل الدخول'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
