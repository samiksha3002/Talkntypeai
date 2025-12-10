import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Components
import Preloader from './components/Preloader';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Diary from './pages/Diary';
import Features from './components/Features';
import Testimonials from './components/Testimonials';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Register from './components/Register';
import AdminPanel from './components/AdminPanel';
import JudgementsPage from './components/JudgementsPage';
import AddClientPage from './pages/AddClientPage';
import GenerateReportPage from './pages/GenerateReportPage';
import AddInquiryPage from './pages/AddInquiryPage';
import AddTeamMemberPage from './pages/AddTeamMemberPage';
import PaymentBookPage from './pages/PaymentBookPage';
import AddCasePage from './pages/AddCasePage';
import ManageCasesPage from './pages/ManageCasesPage'
import BusinessCardRequest from './components/BusinessCardRequest'; 
import ImportECourtPage from './pages/ImportECourtPage';

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

// --- ROUTE GUARDS (Unchanged, but crucial) ---

// 1. Only allow ADMINS here
const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  // Check if user is logged in AND is an admin
  if (!user.role || user.role !== 'admin') { 
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// 2. Only allow REGULAR USERS here
const UserRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  // Check if user is logged in (i.e., has a role)
  if (!user.role) {
    return <Navigate to="/login" replace />; // Redirect to login if no role/user found
  }
  // Check if user is an admin; if so, send them to their dedicated area
  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

function App() {
  const [loading, setLoading] = useState(true);

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
            
            {/* --- 1. PUBLIC ROUTES --- */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* --- 2. PROTECTED USER ROUTES (Standard User Pages) --- */}
            {/* All user-facing application pages MUST be wrapped in UserRoute */}

            <Route path="/dashboard" element={<UserRoute><Dashboard /></UserRoute>} />
            <Route path="/judgements" element={<UserRoute><JudgementsPage /></UserRoute>} />
            <Route path="/business-card" element={<UserRoute><BusinessCardRequest /></UserRoute>} />
            <Route path="/Diary" element={<UserRoute><Diary /></UserRoute>} />
            
            {/* 🛑 FIX: Protecting formerly exposed routes */}
            <Route path="/add-client" element={<UserRoute><AddClientPage /></UserRoute>} />
            <Route path="/generate-report" element={<UserRoute><GenerateReportPage /></UserRoute>} />
            <Route path="/inquiries" element={<UserRoute><AddInquiryPage /></UserRoute>} />
            <Route path="/team" element={<UserRoute><AddTeamMemberPage /></UserRoute>} />
            <Route path="/payments" element={<UserRoute><PaymentBookPage /></UserRoute>} />
            <Route path="/add-case" element={<UserRoute><AddCasePage /></UserRoute>} />
            <Route path="/manage-cases" element={<UserRoute><ManageCasesPage /></UserRoute>} />
            <Route path="/import-ecourt" element={<UserRoute><ImportECourtPage /></UserRoute>} />

            {/* --- 3. PROTECTED ADMIN ROUTE --- */}
            <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />

            {/* 🛑 FIX: The 404 route MUST be the last one defined. */}
            <Route path="*" element={<div>404 Page Not Found</div>} />
            
          </Routes>
        </Router>
      )}
    </>
  );
}

export default App;