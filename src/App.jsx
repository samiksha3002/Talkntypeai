// src/App.jsx

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// GLOBAL CONTEXT PROVIDER
import { CaseProvider } from "./context/CaseContext";

// Components
import Preloader from "./components/Preloader";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Diary from "./pages/Diary";
import Features from "./components/Features";
import Testimonials from "./components/Testimonials";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Register from "./components/Register";
import AdminPanel from "./components/AdminPanel";
import JudgementsPage from "./components/JudgementsPage";
import AddClientPage from "./pages/AddClientPage";
import GenerateReportPage from "./pages/GenerateReportPage";
import AddInquiryPage from "./pages/AddInquiryPage";
import AddTeamMemberPage from "./pages/AddTeamMemberPage";
import PaymentBookPage from "./pages/PaymentBookPage";
import AddCasePage from "./pages/AddCasePage";
import ManageCasesPage from "./pages/ManageCasesPage";
import BusinessCardRequest from "./components/BusinessCardRequest";
import ImportECourtPage from "./pages/ImportECourtPage";

// Landing Page
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

// Protect Admin
const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user.role || user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Protect User
const UserRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user.role) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === "admin") {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {loading ? (
        <Preloader />
      ) : (
        // ✅ GLOBAL CONTEXT WRAPPED HERE
        <CaseProvider>
          <Router>
            <Routes>
              {/* PUBLIC ROUTES */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* USER ROUTES */}
              <Route path="/dashboard" element={<UserRoute><Dashboard /></UserRoute>} />

              <Route path="/diary" element={<UserRoute><Diary /></UserRoute>} />
              <Route path="/add-case" element={<UserRoute><AddCasePage /></UserRoute>} />
              <Route path="/manage-cases" element={<UserRoute><ManageCasesPage /></UserRoute>} />

              <Route path="/judgements" element={<UserRoute><JudgementsPage /></UserRoute>} />
              <Route path="/business-card" element={<UserRoute><BusinessCardRequest /></UserRoute>} />
              <Route path="/add-client" element={<UserRoute><AddClientPage /></UserRoute>} />
              <Route path="/generate-report" element={<UserRoute><GenerateReportPage /></UserRoute>} />
              <Route path="/inquiries" element={<UserRoute><AddInquiryPage /></UserRoute>} />
              <Route path="/team" element={<UserRoute><AddTeamMemberPage /></UserRoute>} />
              <Route path="/payments" element={<UserRoute><PaymentBookPage /></UserRoute>} />
              <Route path="/import-ecourt" element={<UserRoute><ImportECourtPage /></UserRoute>} />

              {/* ADMIN ROUTE */}
              <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />

              {/* 404 */}
              <Route path="*" element={<div>404 Page Not Found</div>} />
            </Routes>
          </Router>
        </CaseProvider>
      )}
    </>
  );
}

export default App;
