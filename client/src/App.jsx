import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { AnnouncementBar, Header, Footer } from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import ToolDetail from './pages/ToolDetail.jsx';
import ToolForm from './pages/ToolForm.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

// Scrolls to #sections (How it works, About) and to the top on normal page changes
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50);
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="py-20 text-center text-stone-500">Loading…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7] font-sans text-stone-800 selection:bg-emerald-200">
      <ScrollManager />
      <AnnouncementBar />
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tools/new" element={<Protected><ToolForm /></Protected>} />
          <Route path="/tools/:id/edit" element={<Protected><ToolForm /></Protected>} />
          <Route path="/tools/:id" element={<ToolDetail />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<p className="py-20 text-center text-stone-500">Page not found.</p>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
