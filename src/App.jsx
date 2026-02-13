import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// GLOBAL CONTEXT PROVIDER
import { CaseProvider } from "./context/CaseContext";

// Components
import CsvCaseManager from "./pages/CsvCaseManager"; // ✅ Your new component
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
import ManageInquiries from "./pages/ManageInquiries";
import AddTeamMemberPage from "./pages/AddTeamMemberPage";
import PaymentBookPage from "./pages/PaymentBookPage";
import AddCasePage from "./pages/AddCasePage";
import ManageCasesPage from "./pages/ManageCasesPage";
import BusinessCardRequest from "./components/BusinessCardRequest";
import ImportECourtPage from "./pages/ImportECourtPage";
import ManageTeamPage from "./pages/ManageTeamPage"; 
import WebsiteShowcase from "./components/WebsiteShowcase";
import ManageClientsPage from "./pages/ManageClientsPage";
import EditCasePage from "./pages/EditCasePage";
import EditInquiryPage from "./pages/EditInquiryPage";

// Landing Page Wrapper
const LandingPage = () => {
  return (
    <>
      <Navbar />
      <section id="home-section"><Hero /></section>
      <section id="features-section"><Features /></section>
      <section id="testimonials-section"><Testimonials /></section>
      <section id="contact-section"><Contact /></section>
      <Footer />
    </>
  );
};

// Protect Admin Route
const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user.role || user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Protect User Route
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

  // ✅ FIX 1: Define API URL and userId here so they are available for routes
  // This uses Vite env variable if available, otherwise defaults to localhost
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  
  // Safely get user ID from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user._id || user.id; // Handles different ID formats

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
        <CaseProvider>
          <Router>
            <Routes>
              {/* PUBLIC ROUTES */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* USER ROUTES */}
              <Route path="/dashboard" element={<UserRoute><Dashboard /></UserRoute>} />

              {/* ✅ FIX 2: Added the CSV Case Manager Route with props */}
              <Route 
                path="/case-manager" 
                element={
                  <UserRoute>
                    <CsvCaseManager userId={userId} API={API_URL} />
                  </UserRoute>
                } 
              />

              <Route path="/diary" element={<UserRoute><Diary /></UserRoute>} />
              <Route path="/add-case" element={<UserRoute><AddCasePage /></UserRoute>} />
              <Route path="/manage-cases" element={<UserRoute><ManageCasesPage /></UserRoute>} />

              <Route path="/manage-team" element={<ManageTeamPage />} />

              <Route path="/judgements" element={<UserRoute><JudgementsPage /></UserRoute>} />
              <Route path="/business-card" element={<UserRoute><BusinessCardRequest /></UserRoute>} />
              <Route path="/add-client" element={<UserRoute><AddClientPage /></UserRoute>} />
              <Route path="/generate-report" element={<UserRoute><GenerateReportPage /></UserRoute>} />
              <Route path="/inquiries" element={<UserRoute><AddInquiryPage /></UserRoute>} />
              <Route path="/manage-inquiries" element={<UserRoute><ManageInquiries /></UserRoute>} />
              <Route path="/team" element={<UserRoute><AddTeamMemberPage /></UserRoute>} />
              <Route path="/payments" element={<UserRoute><PaymentBookPage /></UserRoute>} />
              <Route path="/import-ecourt" element={<UserRoute><ImportECourtPage /></UserRoute>} />
              <Route path="/website-showcase" element={<UserRoute><WebsiteShowcase /></UserRoute>} />
              <Route path="/manage-clients" element={<UserRoute><ManageClientsPage /></UserRoute>} />
              
              {/* ADMIN ROUTE */}
              <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
              
              {/* EDIT ROUTES */}
              <Route path="/case/edit/:id" element={<EditCasePage />} />
              <Route path="/edit-inquiry/:id" element={<EditInquiryPage />} />

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