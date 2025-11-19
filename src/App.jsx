import React, { useState, useEffect } from 'react'; // <--- 1. Imported hooks
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

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

// Separate Landing Page Component (to keep code clean)
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

function App() {
  // --- 2. State for loading ---
  const [loading, setLoading] = useState(true);

  // --- 3. Effect to handle the timer ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000); // 5000ms = 5 Seconds (Matches your video length)

    return () => clearTimeout(timer); // Cleanup the timer
  }, []);

  return (
    <>
      {/* --- 4. Condition: Show Preloader OR Router --- */}
      {loading ? (
        <Preloader />
      ) : (
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </Router>
      )}
    </>
  );
}

export default App;