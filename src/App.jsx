import MaintenanceNotice from './components/MaintenanceNotice.jsx';
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getDraftSession } from "./Features/LegalHubMain/draftClient.js";
import { apiBase } from "./apiAuth.js";

// GLOBAL CONTEXT PROVIDERS
import { CaseProvider } from "./context/CaseContext";
import { SearchProvider } from './components/Context/searchcontext.jsx'; // ✅ Added SearchContext import

// Components
import CsvCaseManager from "./pages/CsvCaseManager";
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
import AddCasePage from "./pages/AddCasePage";
import ManageCasesPage from "./pages/ManageCasesPage";
import BusinessCardRequest from "./components/BusinessCardRequest";
import ImportECourtPage from "./pages/ImportECourtPage";
import WebsiteShowcase from "./components/WebsiteShowcase";
import ManageClientsPage from "./pages/ManageClientsPage";
import EditCasePage from "./pages/EditCasePage";
import Packages from "./components/Packages";
import MyDrafts from "./Features/LegalHubMain/pages/MyDrafts.jsx";
import DraftStudio from "./Features/LegalHubMain/pages/DraftStudio";
import DraftCreate from "../src/Features/LegalHubMain/pages/DraftCreate";

// Landing Page Wrapper
const LandingPage = () => {
  return (
    <>
      <Navbar />
      <section id="home-section"><Hero /></section>
      <section id="features-section"><Features /></section>
      <section id="packages-section"><Packages /></section>
      <section id="testimonials-section"><Testimonials /></section>
      <section id="contact-section"><Contact /></section>
      <Footer />
    </>
  );
};

// These guards only improve navigation; the API enforces authentication and roles.
// Without a session token every API call would fail, so send the user to sign in.
const hasSession = () => Boolean(getDraftSession());

// Protect Admin Route
const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!hasSession()) return <Navigate to="/login" replace />;
  if (!user.role || user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Protect User Route
const UserRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user.role || !hasSession()) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === "admin") {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

function App() {
  const [loading, setLoading] = useState(true);

  // Define API URL and userId here so they are available for routes
  // VITE_API_URL in production builds (required); loopback only in the dev server.
  const API_URL = apiBase();
  
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
          <SearchProvider> {/* ✅ WRAPPED ROUTER WITH SEARCH PROVIDER */}
            <Router>
              <Routes>
                {/* PUBLIC ROUTES */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* USER ROUTES */}
                <Route path="/dashboard" element={<UserRoute><Dashboard /></UserRoute>} />

                {/* CSV Case Manager Route with props */}
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
                <Route path="/manage-team" element={<MaintenanceNotice feature="Team management" />} />
                <Route path="/judgements" element={<UserRoute><JudgementsPage /></UserRoute>} />
                <Route path="/business-card" element={<UserRoute><BusinessCardRequest /></UserRoute>} />
                <Route path="/add-client" element={<UserRoute><AddClientPage /></UserRoute>} />
                <Route path="/generate-report" element={<UserRoute><GenerateReportPage /></UserRoute>} />
                <Route path="/inquiries" element={<UserRoute><MaintenanceNotice feature="Inquiry management" /></UserRoute>} />
                <Route path="/manage-inquiries" element={<UserRoute><MaintenanceNotice feature="Inquiry management" /></UserRoute>} />
                <Route path="/team" element={<UserRoute><MaintenanceNotice feature="Team management" /></UserRoute>} />
                <Route path="/payments" element={<UserRoute><MaintenanceNotice feature="Payment book" /></UserRoute>} />
                <Route path="/import-ecourt" element={<UserRoute><ImportECourtPage /></UserRoute>} />
                <Route path="/website-showcase" element={<UserRoute><WebsiteShowcase /></UserRoute>} />
                <Route path="/manage-clients" element={<UserRoute><ManageClientsPage /></UserRoute>} />
                <Route path="/draft-studio" element={<DraftStudio />}/>
                <Route
  path="/draft/create" element={<DraftCreate />}/>
                <Route path="/drafts" element={<MyDrafts />} />
                <Route path="/draft/edit/:id" element={<DraftCreate />} />
                {/* ADMIN ROUTE */}
                <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                
                {/* EDIT ROUTES */}
                <Route path="/case/edit/:id" element={<UserRoute><EditCasePage /></UserRoute>} />
                <Route path="/edit-inquiry/:id" element={<MaintenanceNotice feature="Inquiry editing" />} />

                {/* 404 */}
                <Route path="*" element={<div>404 Page Not Found</div>} />
              </Routes>
            </Router>
          </SearchProvider>
        </CaseProvider>
      )}
    </>
  );
}

export default App;