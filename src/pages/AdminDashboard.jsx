import React, { useState, useEffect } from 'react';
import { FileText, X, Check, XCircle, Eye } from 'lucide-react';

const AdminDashboard = () => {
    const [pendingBooks, setPendingBooks] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);

    useEffect(() => {
        fetchPendingBooks();
    }, []);

    const fetchPendingBooks = async () => {
        const token = localStorage.getItem('rawi_token');
        if (!token) return;

        try {
            const res = await fetch('/api/admin/books/pending', {
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
        const token = localStorage.getItem('rawi_token');
        try {
            const res = await fetch(`/api/admin/books/${bookId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status, feedback })
            });
            if (res.ok) {
                setPendingBooks(pendingBooks.filter(b => b.id !== bookId));
                setSelectedBook(null); // Close modal if open
                alert(`تم ${status === 'approved' ? 'قبول' : 'رفض'} الكتاب`);
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 pt-24" dir="rtl">
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
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg text-green-300 line-clamp-1">{book.title}</h3>
                                        <p className="text-sm text-gray-400">المؤلف: {book.author}</p>
                                        <p className="text-sm text-gray-400">نشر بواسطة: {book.author_name || 'غير معروف'}</p>
                                        <p className="text-xs text-gray-500 mt-2">{new Date(book.created_at).toLocaleDateString('ar-EG')}</p>

                                        <button
                                            onClick={() => setSelectedBook(book)}
                                            className="mt-3 text-sm bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full hover:bg-blue-600/30 transition-colors flex items-center gap-1 w-fit"
                                        >
                                            <Eye size={14} />
                                            عرض التفاصيل
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-auto">
                                    <button onClick={() => handleAction(book.id, 'approved')} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded transition-colors flex items-center justify-center gap-2">
                                        <Check size={18} /> قبول
                                    </button>
                                    <button onClick={() => {
                                        const reason = prompt('سبب الرفض:');
                                        if (reason) handleAction(book.id, 'rejected', reason);
                                    }} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded transition-colors flex items-center justify-center gap-2">
                                        <XCircle size={18} /> رفض
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {selectedBook && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#151515] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-2xl font-bold text-white">{selectedBook.title}</h2>
                                <button onClick={() => setSelectedBook(null)} className="text-gray-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex flex-col lg:flex-row gap-6">
                                <div className="lg:w-1/3 space-y-4">
                                    <img src={selectedBook.image_url} alt={selectedBook.title} className="w-full rounded-lg shadow-lg" />

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between border-b border-white/10 pb-2">
                                            <span className="text-gray-500">المؤلف</span>
                                            <span className="text-white">{selectedBook.author}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/10 pb-2">
                                            <span className="text-gray-500">التصنيف</span>
                                            <span className="text-white">{selectedBook.category}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/10 pb-2">
                                            <span className="text-gray-500">اللغة</span>
                                            <span className="text-white">{selectedBook.language}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/10 pb-2">
                                            <span className="text-gray-500">عدد الصفحات</span>
                                            <span className="text-white">{selectedBook.pages}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-gray-500 block mb-1">الوصف</span>
                                        <p className="text-gray-300 text-sm leading-relaxed bg-white/5 p-3 rounded-lg max-h-40 overflow-y-auto">
                                            {selectedBook.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="lg:w-2/3 flex flex-col">
                                    {selectedBook.pdf_url ? (
                                        <div className="flex-1 flex flex-col gap-4">
                                            <span className="text-gray-500 block">معاينة الملف</span>
                                            <div className="flex-1 bg-white rounded-xl overflow-hidden border border-white/10 min-h-[500px]">
                                                <iframe
                                                    src={selectedBook.pdf_url}
                                                    className="w-full h-full"
                                                    title="PDF Preview"
                                                />
                                            </div>
                                            <a
                                                href={selectedBook.pdf_url}
                                                download={`${selectedBook.title}.pdf`}
                                                className="flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl transition-colors font-bold"
                                            >
                                                <FileText size={20} />
                                                تحميل ملف الكتاب (PDF)
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center bg-white/5 rounded-xl border border-white/10">
                                            <p className="text-gray-500">لا يوجد ملف PDF مرفق</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
                                <button onClick={() => handleAction(selectedBook.id, 'approved')} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-colors">
                                    قبول الكتاب
                                </button>
                                <button onClick={() => {
                                    const reason = prompt('سبب الرفض:');
                                    if (reason) handleAction(selectedBook.id, 'rejected', reason);
                                }} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-colors">
                                    رفض الكتاب
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
