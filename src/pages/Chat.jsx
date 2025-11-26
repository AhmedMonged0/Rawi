import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trash2, Edit2, MoreVertical, X, Check, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [friends, setFriends] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null); // { id, content }
    const [editContent, setEditContent] = useState('');

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
                // Clear state to prevent re-selection on refresh if not desired, 
                // but keeping it might be fine. 
                // window.history.replaceState({}, document.title);
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

    const handleDeleteConversation = async () => {
        if (!window.confirm('هل أنت متأكد من حذف المحادثة بالكامل؟ لا يمكن التراجع عن هذا الإجراء.')) return;

        const token = localStorage.getItem('rawi_token');
        try {
            const res = await fetch(`/api/messages/conversation/${selectedFriend.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setMessages([]);
                alert('تم حذف المحادثة');
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm('حذف هذه الرسالة؟')) return;

        const token = localStorage.getItem('rawi_token');
        try {
            const res = await fetch(`/api/messages/${messageId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setMessages(messages.filter(m => m.id !== messageId));
            }
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    };

    const startEditing = (msg) => {
        setEditingMessage(msg);
        setEditContent(msg.content);
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
                setMessages(messages.map(m => m.id === editingMessage.id ? { ...m, content: editContent, is_edited: true } : m));
                setEditingMessage(null);
                setEditContent('');
            }
        } catch (error) {
            console.error('Error editing message:', error);
        }
    };

    return (
        <div className="h-screen bg-black text-white pt-20 flex overflow-hidden" dir="rtl">
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
            <div className="flex-1 flex flex-col bg-black h-full">
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
                                        <div className={`max-w-[70%] px-4 py-2 rounded-2xl relative ${isMe ? 'bg-green-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>
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

                                                    {isMe && (
                                                        <div className="absolute top-0 left-0 -translate-x-full px-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 items-center h-full">
                                                            <button onClick={() => startEditing(msg)} className="p-1 text-gray-400 hover:text-white bg-black/50 rounded-full"><Edit2 size={12} /></button>
                                                            <button onClick={() => handleDeleteMessage(msg.id)} className="p-1 text-red-400 hover:text-red-300 bg-black/50 rounded-full"><Trash2 size={12} /></button>
                                                        </div>
                                                    )}
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
            </div>
        </div>
    );
};

export default Chat;
