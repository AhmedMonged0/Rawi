import React, { useState, useEffect, useRef } from 'react';

const Chat = () => {
    const [friends, setFriends] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        setCurrentUser(user);
        fetchConnections();
    }, []);

    useEffect(() => {
        if (selectedFriend) {
            fetchMessages(selectedFriend.id);
            const interval = setInterval(() => fetchMessages(selectedFriend.id), 3000); // Poll every 3s
            return () => clearInterval(interval);
        }
    }, [selectedFriend]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchConnections = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch('http://localhost:3000/api/connections', {
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
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:3000/api/messages/${friendId}`, {
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

        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:3000/api/messages', {
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

    return (
        <div className="min-h-screen bg-black text-white pt-20 flex">
            {/* Sidebar - Friends List */}
            <div className="w-1/4 border-r border-gray-800 bg-gray-900/50">
                <div className="p-4 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-green-400">الأصدقاء</h2>
                </div>
                <div className="overflow-y-auto h-[calc(100vh-80px)]">
                    {friends.map(friend => (
                        <div
                            key={friend.id}
                            onClick={() => setSelectedFriend(friend)}
                            className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-800 transition-colors ${selectedFriend?.id === friend.id ? 'bg-gray-800 border-l-4 border-green-500' : ''}`}
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                                <img src={friend.avatar_url || 'https://via.placeholder.com/150'} alt={friend.username} className="w-full h-full object-cover" />
                            </div>
                            <span className="font-medium">{friend.username}</span>
                        </div>
                    ))}
                    {friends.length === 0 && <p className="text-gray-500 text-center p-4">لا يوجد أصدقاء بعد</p>}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-black">
                {selectedFriend ? (
                    <>
                        <div className="p-4 border-b border-gray-800 bg-gray-900/30 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
                                <img src={selectedFriend.avatar_url || 'https://via.placeholder.com/150'} alt={selectedFriend.username} className="w-full h-full object-cover" />
                            </div>
                            <span className="font-bold text-lg">{selectedFriend.username}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map(msg => {
                                const isMe = msg.sender_id === currentUser?.id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${isMe ? 'bg-green-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>
                                            <p>{msg.content}</p>
                                            <span className="text-xs opacity-50 block mt-1 text-right">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={sendMessage} className="p-4 border-t border-gray-800 bg-gray-900/30 flex gap-2">
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
