import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Components
import Preloader from './components/Preloader';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Testimonials from './components/Testimonials';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Register from './components/Register';
import AdminPanel from './components/AdminPanel';

// --- LANDING PAGE COMPONENT ---
const LandingPage = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <Testimonials />
      <Contact />
      <Footer />
    </>
  );
};

// --- ROUTE GUARDS (The Fix for Merging) ---

// 1. Only allow ADMINS here
const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  // If user is not admin, kick them to dashboard (or login)
  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// 2. Only allow REGULAR USERS here
const UserRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  // If ADMIN tries to go here, kick them to Admin Panel
  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

function App() {
  // --- State for loading ---
  const [loading, setLoading] = useState(true);

  // --- Effect to handle the timer ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000); // 5 Seconds
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {loading ? (
        <Preloader />
      ) : (
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* --- PROTECTED USER ROUTE --- */}
            {/* This ensures Admins CANNOT enter /dashboard */}
            <Route 
              path="/dashboard" 
              element={
                <UserRoute>
                  <Dashboard />
                </UserRoute>
              } 
            />

            {/* --- PROTECTED ADMIN ROUTE --- */}
            {/* This ensures Users CANNOT enter /admin */}
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              } 
            />
          </Routes>
        </Router>
      )}
    </>
  );
}

export default App;