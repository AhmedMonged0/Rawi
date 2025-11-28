import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

import { useToast } from '../context/ToastContext';

const BookSubmission = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
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
    const [isLoading, setIsLoading] = useState(false);

    const onDropImage = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        const reader = new FileReader();
        reader.onload = () => {
            setFormData(prev => ({ ...prev, image_url: reader.result }));
        };
        reader.readAsDataURL(file);
    }, []);

    const onDropPdf = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        const reader = new FileReader();
        reader.onload = () => {
            setFormData(prev => ({ ...prev, pdf_url: reader.result }));
        };
        reader.readAsDataURL(file);
    }, []);

    const { getRootProps: getImageRootProps, getInputProps: getImageInputProps, isDragActive: isImageDragActive } = useDropzone({
        onDrop: onDropImage,
        accept: { 'image/*': [] },
        maxFiles: 1
    });

    const { getRootProps: getPdfRootProps, getInputProps: getPdfInputProps, isDragActive: isPdfDragActive } = useDropzone({
        onDrop: onDropPdf,
        accept: { 'application/pdf': [] },
        maxFiles: 1
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const token = localStorage.getItem('rawi_token'); // Fixed token key
        if (!token) {
            showToast('يجب تسجيل الدخول', 'warning');
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/books/submit', { // Relative path
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                showToast('تم إرسال الكتاب للمراجعة بنجاح!', 'success');
                navigate('/');
            } else {
                const data = await res.json();
                showToast(data.message || 'حدث خطأ', 'error');
            }
        } catch (error) {
            console.error('Error submitting book:', error);
            showToast('حدث خطأ في الاتصال', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pt-24 font-['Tajawal']" dir="rtl">
            <div className="max-w-3xl mx-auto bg-[#151515] p-8 rounded-3xl border border-white/10 shadow-2xl">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-8 text-center">نشر كتاب جديد</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-400 mb-2 text-sm">عنوان الكتاب</label>
                            <input type="text" required className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-colors"
                                value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2 text-sm">المؤلف</label>
                            <input type="text" required className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-colors"
                                value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-gray-400 mb-2 text-sm">التصنيف</label>
                            <select className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-colors"
                                value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                <option value="">اختر التصنيف</option>
                                <option value="تكنولوجيا">تكنولوجيا</option>
                                <option value="علوم">علوم</option>
                                <option value="ذكاء اصطناعي">ذكاء اصطناعي</option>
                                <option value="فنون">فنون</option>
                                <option value="خيال علمي">خيال علمي</option>
                                <option value="أخرى">أخرى</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2 text-sm">عدد الصفحات</label>
                            <input type="number" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-colors"
                                value={formData.pages} onChange={e => setFormData({ ...formData, pages: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2 text-sm">اللغة</label>
                            <input type="text" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-colors"
                                value={formData.language} onChange={e => setFormData({ ...formData, language: e.target.value })} />
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-gray-400 mb-2 text-sm">صورة الغلاف</label>
                        <div {...getImageRootProps()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isImageDragActive ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-white/30 bg-black/30'}`}>
                            <input {...getImageInputProps()} />
                            {formData.image_url ? (
                                <div className="relative inline-block">
                                    <img src={formData.image_url} alt="Preview" className="h-32 rounded-lg shadow-lg" />
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, image_url: '' }); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><X size={14} /></button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                    <ImageIcon size={32} />
                                    <p className="text-sm">اسحب الصورة هنا أو اضغط للاختيار</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* PDF Upload */}
                    <div>
                        <label className="block text-gray-400 mb-2 text-sm">ملف الكتاب (PDF)</label>
                        <div {...getPdfRootProps()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isPdfDragActive ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-white/30 bg-black/30'}`}>
                            <input {...getPdfInputProps()} />
                            {formData.pdf_url ? (
                                <div className="flex items-center justify-center gap-3 bg-purple-500/20 p-3 rounded-lg border border-purple-500/30">
                                    <FileText className="text-purple-400" />
                                    <span className="text-sm text-purple-200 truncate max-w-[200px]">تم اختيار ملف PDF</span>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, pdf_url: '' }); }} className="text-red-400 hover:text-red-300"><X size={16} /></button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                    <Upload size={32} />
                                    <p className="text-sm">اسحب ملف PDF هنا أو اضغط للاختيار</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 mb-2 text-sm">وصف الكتاب</label>
                        <textarea className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none h-32 transition-colors"
                            value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2">
                        {isLoading ? <Loader2 className="animate-spin" /> : 'إرسال للمراجعة'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BookSubmission;
