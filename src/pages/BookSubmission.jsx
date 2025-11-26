import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BookSubmission = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        category: '',
        description: '',
        image_url: '',
        pdf_url: '',
        pages: '',
        language: 'العربية'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) return alert('يجب تسجيل الدخول');

        try {
            const res = await fetch('http://localhost:3000/api/books/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                alert('تم إرسال الكتاب للمراجعة بنجاح!');
                navigate('/');
            } else {
                const data = await res.json();
                alert(data.message || 'حدث خطأ');
            }
        } catch (error) {
            console.error('Error submitting book:', error);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 pt-24">
            <div className="max-w-2xl mx-auto bg-gray-900 p-8 rounded-xl border border-green-500/30">
                <h1 className="text-3xl font-bold text-green-400 mb-6 text-center">نشر كتاب جديد</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 mb-1">عنوان الكتاب</label>
                        <input type="text" required className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-green-500 outline-none"
                            value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-1">المؤلف</label>
                        <input type="text" required className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-green-500 outline-none"
                            value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-1">التصنيف</label>
                        <input type="text" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-green-500 outline-none"
                            value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-1">رابط الغلاف (صورة)</label>
                        <input type="url" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-green-500 outline-none"
                            value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-1">رابط الكتاب (PDF)</label>
                        <input type="url" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-green-500 outline-none"
                            value={formData.pdf_url} onChange={e => setFormData({ ...formData, pdf_url: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-1">عدد الصفحات</label>
                        <input type="number" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-green-500 outline-none"
                            value={formData.pages} onChange={e => setFormData({ ...formData, pages: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-1">الوصف</label>
                        <textarea className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-green-500 outline-none h-32"
                            value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                    </div>
                    <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded transition-colors">
                        إرسال للمراجعة
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BookSubmission;
