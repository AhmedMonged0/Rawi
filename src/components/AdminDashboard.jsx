import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Loader2, X, LogOut, Trash2, MapPin, Globe, BookOpen, Plus, DollarSign, FileText, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = ({ token, onLogout }) => {
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'books'
    const [users, setUsers] = useState([]);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddBook, setShowAddBook] = useState(false);
    const [newBook, setNewBook] = useState({
        title: '', author: '', price: '', category: '', description: '',
        image_url: '', pdf_url: '', pages: '', language: 'العربية', is_new: false
    });

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const headers = { 'Authorization': `Bearer ${token}` };

                // Fetch Users
                const usersRes = await fetch('/api/admin/users', { headers });
                if (usersRes.ok) setUsers(await usersRes.json());

                // Fetch Books
                const booksRes = await fetch('/api/books');
                if (booksRes.ok) setBooks(await booksRes.json());

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    // --- User Actions ---
    const handleDeleteUser = async (userId) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setUsers(users.filter(u => u.id !== userId));
                alert('تم الحذف بنجاح');
            } else {
                alert('فشل الحذف');
            }
        } catch (error) {
            console.error(error);
    );
};

export default AdminDashboard;
