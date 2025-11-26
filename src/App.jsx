import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import UserProfile from './pages/UserProfile';
import BookSubmission from './pages/BookSubmission';
import AdminDashboard from './pages/AdminDashboard';
import UserSearch from './pages/UserSearch';
import Chat from './pages/Chat';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
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