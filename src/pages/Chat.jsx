import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trash2, Edit2, MoreVertical, X, Check, AlertTriangle, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { useModal } from '../context/ModalContext';

const Avatar = ({ url, username, size = "w-10 h-10", textSize = "text-lg" }) => {
    const [error, setError] = useState(false);

    if (!url || error) {
        return (
            <div className={`${size} rounded-full bg-purple-600 flex items-center justify-center text-white font-bold ${textSize}`}>
                {username ? username.charAt(0).toUpperCase() : '?'}
            </div>
        );
    }

    return (
        <div className={`${size} rounded-full bg-gray-700 overflow-hidden`}>
            <img
                src={url}
                alt={username}
                className="w-full h-full object-cover"
                onError={() => setError(true)}
            />
        </div>
    );
};

const Chat = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const { showConfirm } = useModal();
    const [friends, setFriends] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const [currentUser, setCurrentUser] = useState(null);

    // Edit State
    const [editingMessage, setEditingMessage] = useState(null); // { id, content }
    const [editContent, setEditContent] = useState('');

    // Context Menu State
    const [contextMenu, setContextMenu] = useState(null); // { x, y, message }

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('rawi_user'));
        setCurrentUser(user);
        fetchConnections();
    }, []);

    // Handle auto-selection from profile page
    useEffect(() => {
        if (location.state?.selectedUserId && friends.length > 0) {
            const friendToSelect = friends.find(f => f.id == location.state.selectedUserId);
            if (friendToSelect) {
                setSelectedFriend(friendToSelect);
            }
        }
    }, [location.state, friends]);

    useEffect(() => {
        if (selectedFriend) {
            fetchMessages(selectedFriend.id);
            const interval = setInterval(() => fetchMessages(selectedFriend.id), 3000); // Poll every 3s
            return () => clearInterval(interval);
        }
    }, [selectedFriend]);

    useEffect(() => {
        if (!editingMessage) {
            scrollToBottom();
        }
    }, [messages, editingMessage]);

    // Close context menu on click anywhere
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchConnections = async () => {
        const token = localStorage.getItem('rawi_token');
        if (!token) return;

        try {
            const res = await fetch('/api/connections', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFriends(data.friends);
            }
        } catch (error) {
            console.error('Error fetching connections:', error);
        }
    };

    const fetchMessages = async (friendId) => {
        const token = localStorage.getItem('rawi_token');
        try {
            const res = await fetch(`/api/messages/${friendId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedFriend) return;

        const token = localStorage.getItem('rawi_token');
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ receiverId: selectedFriend.id, content: newMessage })
            });
            if (res.ok) {
                setNewMessage('');
                fetchMessages(selectedFriend.id);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleDeleteConversation = () => {
        showConfirm('حذف المحادثة', 'هل أنت متأكد من حذف المحادثة بالكامل؟ لا يمكن التراجع عن هذا الإجراء.', async () => {
            const token = localStorage.getItem('rawi_token');
            try {
                const res = await fetch(`/api/messages/conversation/${selectedFriend.id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    setMessages([]);
                    showToast('تم حذف المحادثة', 'success');
                }
            } catch (error) {
                console.error('Error deleting conversation:', error);
                showToast('فشل حذف المحادثة', 'error');
            }
        });
    };

    const handleDeleteMessage = (messageId) => {
        showConfirm('حذف رسالة', 'هل أنت متأكد من حذف هذه الرسالة؟', async () => {
            const token = localStorage.getItem('rawi_token');
            try {
                const res = await fetch(`/api/messages/${messageId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    setMessages(messages.filter(m => m.id !== messageId));
                    showToast('تم حذف الرسالة', 'success');
                }
            } catch (error) {
                console.error('Error deleting message:', error);
                showToast('فشل حذف الرسالة', 'error');
            }
        });
    };

    const startEditing = (msg) => {
        setEditingMessage(msg);
        setEditContent(msg.content);
        setContextMenu(null);
    };

    const handleEditMessage = async () => {
        if (!editContent.trim()) return;

        const token = localStorage.getItem('rawi_token');
        try {
            const res = await fetch(`/api/messages/${editingMessage.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content: editContent })
            });

            if (res.ok) {
                setMessages(prev => prev.map(m => m.id === editingMessage.id ? { ...m, content: editContent, is_edited: true } : m));
                setEditingMessage(null);
                setEditContent('');
                showToast('تم تعديل الرسالة', 'success');
            } else {
                const data = await res.json();
                showToast(data.message || 'فشل تعديل الرسالة', 'error');
            }
        } catch (error) {
            console.error('Error editing message:', error);
            showToast('حدث خطأ أثناء التعديل', 'error');
        }
    };

    const handleContextMenu = (e, msg) => {
        e.preventDefault();
        setContextMenu({
            x: e.pageX,
            y: e.pageY,
            message: msg
        });
    };

    const handleCopyMessage = (content) => {
        navigator.clipboard.writeText(content);
        setContextMenu(null);
    };

    return (
        <div className="h-screen bg-black text-white pt-20 flex overflow-hidden max-w-full" dir="rtl">
            {/* Sidebar - Friends List */}
            <div className="w-1/4 border-l border-gray-800 bg-gray-900/50 flex flex-col">
                <div className="p-4 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-green-400">الأصدقاء</h2>
                </div>
                <div className="overflow-y-auto flex-1">
                    {friends.map(friend => (
                        <div
                            key={friend.id}
                            onClick={() => setSelectedFriend(friend)}
                            className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-800 transition-colors ${selectedFriend?.id === friend.id ? 'bg-gray-800 border-r-4 border-green-500' : ''}`}
                        >
                            <Avatar url={friend.avatar_url} username={friend.username} />
                            <span className="font-medium">{friend.username}</span>
                        </div>
                    ))}
                    {friends.length === 0 && <p className="text-gray-500 text-center p-4">لا يوجد أصدقاء بعد</p>}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-black h-full overflow-hidden relative">
                {selectedFriend ? (
                    <>
                        <div className="p-4 border-b border-gray-800 bg-gray-900/30 flex items-center justify-between shrink-0">
                            <div
                                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => navigate(`/profile/${selectedFriend.id}`)}
                                title="عرض الملف الشخصي"
                            >
                                <Avatar url={selectedFriend.avatar_url} username={selectedFriend.username} size="w-10 h-10" textSize="text-lg" />
                                <span className="font-bold text-lg">{selectedFriend.username}</span>
                            </div>

                            <button
                                onClick={handleDeleteConversation}
                                className="text-red-400 hover:bg-red-500/10 p-2 rounded-full transition-colors"
                                title="حذف المحادثة بالكامل"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map(msg => {
                                const isMe = msg.sender_id === currentUser?.id;
                                const isEditing = editingMessage?.id === msg.id;

                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                        <div
                                            className={`max-w-[70%] px-4 py-2 rounded-2xl relative cursor-context-menu ${isMe ? 'bg-green-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}
                                            onContextMenu={(e) => handleContextMenu(e, msg)}
                                        >
                                            {isEditing ? (
                                                <div className="flex flex-col gap-2 min-w-[200px]">
                                                    <input
                                                        type="text"
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        className="bg-black/20 text-white p-1 rounded outline-none border border-white/20"
                                                        autoFocus
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setEditingMessage(null)} className="text-xs bg-black/20 px-2 py-1 rounded hover:bg-black/40">إلغاء</button>
                                                        <button onClick={handleEditMessage} className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30">حفظ</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <p>
                                                        {msg.content}
                                                        {msg.is_edited && <span className="text-[10px] text-white/60 mr-2">(معدل)</span>}
                                                    </p>
                                                    <span className="text-xs opacity-50 block mt-1 text-right">
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={sendMessage} className="p-4 border-t border-gray-800 bg-gray-900/30 flex gap-2 shrink-0">
                            <input
                                type="text"
                                className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-white focus:border-green-500 outline-none"
                                placeholder="اكتب رسالة..."
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                            />
                            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors">
                                ➤
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        <p>اختر صديقاً لبدء المحادثة</p>
                    </div>
                )}

                {/* Context Menu */}
                <AnimatePresence>
                    {contextMenu && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            style={{ top: contextMenu.y, left: contextMenu.x }}
                            className="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden min-w-[150px]"
                        >
                            <button
                                onClick={() => handleCopyMessage(contextMenu.message.content)}
                                className="w-full text-right px-4 py-2 hover:bg-gray-700 flex items-center gap-2 text-sm"
                            >
                                <Copy size={14} /> نسخ
                            </button>

                            {contextMenu.message.sender_id === currentUser?.id && (
                                <>
                                    <button
                                        onClick={() => startEditing(contextMenu.message)}
                                        className="w-full text-right px-4 py-2 hover:bg-gray-700 flex items-center gap-2 text-sm"
                                    >
                                        <Edit2 size={14} /> تعديل
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleDeleteMessage(contextMenu.message.id);
                                            setContextMenu(null);
                                        }}
                                        className="w-full text-right px-4 py-2 hover:bg-red-900/30 text-red-400 flex items-center gap-2 text-sm"
                                    >
                                        <Trash2 size={14} /> حذف
                                    </button>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Chat;
