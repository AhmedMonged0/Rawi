import React, { useState, useEffect } from 'react';

const AdminDashboard = () => {
    const [pendingBooks, setPendingBooks] = useState([]);

    useEffect(() => {
        fetchPendingBooks();
    }, []);

    const fetchPendingBooks = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch('http://localhost:3000/api/admin/books/pending', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPendingBooks(data);
            }
        } catch (error) {
            console.error('Error fetching pending books:', error);
        }
    };

    const handleAction = async (bookId, status, feedback = '') => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:3000/api/admin/books/${bookId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status, feedback })
            });
            if (res.ok) {
                setPendingBooks(pendingBooks.filter(b => b.id !== bookId));
                alert(`تم ${status === 'approved' ? 'قبول' : 'رفض'} الكتاب`);
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 pt-24">
            <h1 className="text-3xl font-bold text-green-400 mb-8 text-center">لوحة تحكم المشرف</h1>

            <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">كتب بانتظار الموافقة</h2>

                {pendingBooks.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">لا توجد كتب معلقة حالياً</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingBooks.map(book => (
                            <div key={book.id} className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex flex-col">
                                <div className="flex gap-4 mb-4">
                                    <img src={book.image_url} alt={book.title} className="w-24 h-36 object-cover rounded" />
                                    <div>
                                        <h3 className="font-bold text-lg text-green-300">{book.title}</h3>
                                        <p className="text-sm text-gray-400">المؤلف: {book.author}</p>
                                        <p className="text-sm text-gray-400">نشر بواسطة: {book.author_name || 'غير معروف'}</p>
                                        <p className="text-xs text-gray-500 mt-2">{new Date(book.created_at).toLocaleDateString('ar-EG')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-auto">
                                    <button onClick={() => handleAction(book.id, 'approved')} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded transition-colors">
                                        قبول
                                    </button>
                                    <button onClick={() => {
                                        const reason = prompt('سبب الرفض:');
                                        if (reason) handleAction(book.id, 'rejected', reason);
                                    }} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded transition-colors">
                                        رفض
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
