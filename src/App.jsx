import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import Profile from './components/Profile';
import UserProfile from './pages/UserProfile';
import BookSubmission from './pages/BookSubmission';
import AdminDashboard from './pages/AdminDashboard';
import UserSearch from './pages/UserSearch';
import Chat from './pages/Chat';

const ProfileWrapper = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const token = localStorage.getItem('rawi_token');

  useEffect(() => {
    const storedUser = localStorage.getItem('rawi_user');
    if (!token || !storedUser) {
      navigate('/');
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [navigate, token]);

  const handleLogout = () => {
    localStorage.removeItem('rawi_token');
    localStorage.removeItem('rawi_user');
    navigate('/');
  };

  if (!user) return null;

  return <Profile user={user} token={token} onLogout={handleLogout} />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<ProfileWrapper />} />
        <Route path="/profile/:id" element={<UserProfile />} />
        <Route path="/submit" element={<BookSubmission />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/search" element={<UserSearch />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/rawi-admin-secret" element={<AdminLogin />} />
      </Routes>
    </Router>
  );
}




export default App;