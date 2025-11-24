import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Loader2, X, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminDashboard = ({ token, onLogout }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => { setUsers(data); setLoading(false); })
            .catch(err => console.error(err));
    }, [token]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-['Tajawal'] p-8" dir="rtl">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold flex items-center gap-2">
                        <ShieldCheck className="text-green-500" /> لوحة التحكم
                    </h2>
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 bg-red-500/10 text-red-400 px-4 py-2 rounded-xl hover:bg-red-500/20 transition-colors"
                    >
                        <LogOut size={18} /> تسجيل خروج
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/10 flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-full text-blue-400">
                            <Users size={24} />
                        </div>
                        <div>
                            <h3 className="text-gray-400 text-sm">المستخدمين</h3>
                            <p className="text-2xl font-bold text-white">{users.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h3 className="text-xl font-bold">قائمة المستخدمين</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm text-gray-300">
                            <thead className="bg-white/5 text-gray-400">
                                <tr>
                                    <th className="p-4">ID</th>
                                    <th className="p-4">الاسم</th>
                                    <th className="p-4">البريد</th>
                                    <th className="p-4">الصلاحية</th>
                                    <th className="p-4">التاريخ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center">
                                            <Loader2 className="animate-spin mx-auto" />
                                        </td>
                                    </tr>
                                ) : (
                                    users.map(u => (
                                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="p-4">#{u.id}</td>
                                            <td className="p-4 font-bold text-white">{u.username}</td>
                                            <td className="p-4">{u.email}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                    {u.role || 'user'}
                                                </span>
                                            </td>
                                            <td className="p-4">{new Date(u.created_at).toLocaleDateString('ar-EG')}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
