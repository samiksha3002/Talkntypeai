import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Components
import Preloader from './components/Preloader';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Diary from './components/Dairy';
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
// --- FIX: THIS IMPORT WAS MISSING ---
import BusinessCardRequest from './components/BusinessCardRequest'; 

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

// --- ROUTE GUARDS ---

// 1. Only allow ADMINS here
const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// 2. Only allow REGULAR USERS here
const UserRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
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
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* --- PROTECTED USER ROUTES --- */}
            <Route 
              path="/dashboard" 
              element={
                <UserRoute>
                  <Dashboard />
                </UserRoute>
              } 
            />
            <Route 
             path="/judgements" 
             element={
               <UserRoute>
                 <JudgementsPage />
               </UserRoute>
             } 
           />
            
            {/* Business Card Route */}
            <Route 
              path="/business-card" 
              element={
                <UserRoute>
                  <BusinessCardRequest />
                </UserRoute>
              } 
            />
             <Route 
              path="/Diary" 
              element={
                <UserRoute>
                  <Diary />
                </UserRoute>
              } 
            />
            <Route path="/add-client" 
            element={<AddClientPage />} />
            <Route path="/generate-report" 
            element={<GenerateReportPage />} />
            <Route path="/inquiries" 
            element={<AddInquiryPage />} />
            <Route path="/team" 
            element={<AddTeamMemberPage />} />
            <Route path="/payments" 
            element={<PaymentBookPage />} />
            <Route path="/add-case" element={<AddCasePage />} />
            <Route path="*" element={<div>404 Page Not Found</div>} />

            

            {/* --- PROTECTED ADMIN ROUTE --- */}
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