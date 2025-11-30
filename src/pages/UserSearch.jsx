import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';

const UserSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        try {
            const res = await fetch(`/api/users/search?q=${query}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data);
            }
        } catch (error) {
            console.error('Error searching users:', error);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 pt-24" dir="rtl">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-green-400 mb-8 text-center">البحث عن قراء</h1>

                <form onSubmit={handleSearch} className="flex gap-2 mb-8">
                    <input
                        type="text"
                        placeholder="ابحث باسم المستخدم..."
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-full px-6 py-3 text-white focus:border-green-500 outline-none"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-bold transition-colors">
                        بحث
                    </button>
                </form>

                <div className="space-y-4">
                    {results.map(user => (
                        <Link to={`/profile/${user.id}`} key={user.id} className="block bg-gray-900 border border-gray-800 hover:border-green-500/50 rounded-xl p-4 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden">
                                    <img src={user.avatar_url || 'https://via.placeholder.com/150'} alt={user.username} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg flex items-center gap-1">
                                        {user.username}
                                        {user.is_verified && <BadgeCheck size={16} className="text-blue-500" />}
                                    </h3>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {results.length === 0 && query && <p className="text-center text-gray-500">لا توجد نتائج</p>}
                </div>
            </div>
        </div>
    );
};

export default UserSearch;
