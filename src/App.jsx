import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rawi-admin-secret" element={<AdminLogin />} />
      </Routes>
    </Router>
  );
}

export default App;