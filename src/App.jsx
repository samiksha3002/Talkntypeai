// src/App.jsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// 🛑 FIX 1: Import the CaseProvider to use it in the routes.
import { CaseProvider } from './context/CaseContext'; 

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

// --- ROUTE GUARDS (Unchanged) ---
const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.role || user.role !== 'admin') { 
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const UserRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.role) {
    return <Navigate to="/login" replace />; 
  }
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
            
            {/* 🛑 FIX 2: Wrap all components that use CaseContext (Diary, Add Case, Manage Cases) 
                inside <CaseProvider> so the hook can access the context value.
            */}
            
            <Route 
              path="/dashboard" 
              element={<UserRoute><Dashboard /></UserRoute>} 
            />

            <Route 
                path="/Diary" 
                element={<UserRoute><CaseProvider><Diary /></CaseProvider></UserRoute>} 
            />
            
            <Route 
                path="/add-case" 
                element={<UserRoute><CaseProvider><AddCasePage /></CaseProvider></UserRoute>} 
            />
            
            <Route 
                path="/manage-cases" 
                element={<UserRoute><CaseProvider><ManageCasesPage /></CaseProvider></UserRoute>} 
            />

            {/* Other Protected User Routes (They don't need CaseProvider if they don't use useCases) */}
            <Route path="/judgements" element={<UserRoute><JudgementsPage /></UserRoute>} />
            <Route path="/business-card" element={<UserRoute><BusinessCardRequest /></UserRoute>} />
            <Route path="/add-client" element={<UserRoute><AddClientPage /></UserRoute>} />
            <Route path="/generate-report" element={<UserRoute><GenerateReportPage /></UserRoute>} />
            <Route path="/inquiries" element={<UserRoute><AddInquiryPage /></UserRoute>} />
            <Route path="/team" element={<UserRoute><AddTeamMemberPage /></UserRoute>} />
            <Route path="/payments" element={<UserRoute><PaymentBookPage /></UserRoute>} />
            <Route path="/import-ecourt" element={<UserRoute><ImportECourtPage /></UserRoute>} />

            {/* --- 3. PROTECTED ADMIN ROUTE --- */}
            <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />

            {/* --- 4. 404 CATCH-ALL ROUTE --- */}
            <Route path="*" element={<div>404 Page Not Found</div>} />
            
          </Routes>
        </Router>
      )}
    </>
  );
}

export default App;