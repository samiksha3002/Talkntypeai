import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const DashboardNavbar = () => {
  const [timeRemaining, setTimeRemaining] = useState("Checking...");
  const [isExpired, setIsExpired] = useState(false);
  const navigate = useNavigate();

  // 'user' object में fullName या userName होना चाहिए
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // --- 1. LOGOUT FUNCTION ---
  const handleLogout = () => {
    // Clear all stored data so the next user starts fresh
    localStorage.removeItem('user');
    localStorage.removeItem('expiryDate');
    navigate('/login');
  };

  // --- 2. CALCULATE REMAINING TIME ---
  useEffect(() => {
    // Retrieve the expiry date stored during Login
    const storedExpiryDate = localStorage.getItem("expiryDate");

    const calculateTimeLeft = () => {
      // Handle case where no date is set (New users or errors)
      if (!storedExpiryDate) {
        setTimeRemaining("No Active Plan");
        // Optional: Block them if you want strictly paid access
        // setIsExpired(true); 
        return;
      }

      const today = new Date();
      const expiry = new Date(storedExpiryDate);
      const difference = expiry - today;

      // Check if time has run out
      if (difference <= 0) {
        setIsExpired(true);
        setTimeRemaining("Expired");
      } else {
        setIsExpired(false);
        
        // Calculate Days
        const daysLeft = Math.floor(difference / (1000 * 60 * 60 * 24));
        
        // Format logic: Show Months if > 30 days, otherwise just Days
        const months = Math.floor(daysLeft / 30);
        const days = daysLeft % 30;

        if (months > 0) {
          setTimeRemaining(`${months} Month${months > 1 ? 's' : ''}, ${days} Day${days !== 1 ? 's' : ''}`);
        } else {
          setTimeRemaining(`${days} Day${days !== 1 ? 's' : ''} Remaining`);
        }
      }
    };

    calculateTimeLeft();
    
    // Optional: Update timer every minute
    const timer = setInterval(calculateTimeLeft, 60000); 
    return () => clearInterval(timer);

  }, []);

  return (
    <>
      {/* --- 1. SECURITY OVERLAY (BLOCKS SCREEN IF EXPIRED) --- */}
      {isExpired && (
        <div className="fixed inset-0 bg-slate-900/95 z-[60] flex flex-col items-center justify-center text-white backdrop-blur-sm">
            <div className="text-6xl mb-6">🔒</div>
            <h2 className="text-3xl font-bold mb-3">Subscription Expired</h2>
            <p className="text-slate-300 mb-8 text-center max-w-md px-4 leading-relaxed">
                Dear <strong>{user.fullName || 'Valued User'}</strong>, your license validity has ended. 
                <br/>
                Please renew your plan to continue accessing the Talk N Type tools.
            </p>
            
            <div className="flex gap-4">
                <button 
                  onClick={() => alert("Please contact Admin at +91-7678073260 to renew.")}
                  className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-lg font-bold transition shadow-lg transform hover:scale-105"
                >
                    Renew Now
                </button>
                <button 
                  onClick={handleLogout}
                  className="bg-slate-700 hover:bg-slate-600 px-8 py-3 rounded-lg font-bold transition border border-slate-600"
                >
                    Logout
                </button>
            </div>
        </div>
      )}

      {/* --- 2. NAVBAR --- */}
      <nav className="w-full bg-white h-16 flex items-center justify-between px-6 border-b border-slate-200 fixed top-0 z-40 shadow-sm">
        
        {/* Left: Branding */}
        <div className="flex items-center gap-2">
        
        {/* --- CHANGE 2: Negative Margin (-my-6) --- */}
        {/* '-my-6' image ke upar/niche ka extra space kha jayega */}
        <img 
          src="/logo.png" 
          alt="Talk N Type Logo" 
          className="w-48 h-auto object-contain -my-6" 
        />
        
      </div>

        {/* Right: Info & Actions */}
        <div className="flex items-center gap-6 text-sm">
          
          {/* License Status Pill */}
          <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border ${
              isExpired 
                ? "bg-red-50 border-red-200 text-red-600" 
                : "bg-green-50 border-green-200 text-green-700"
          }`}>
            <span className="text-lg">{isExpired ? "⚠️" : "📅"}</span>
            <span className="font-semibold">
                {isExpired ? "Plan Expired" : `liscence: ${timeRemaining}`}
            </span>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-300 hidden md:block"></div>

          {/* ✨ नया बदलाव: WELCOME MESSAGE (Welcome Samiksha) ✨ */}
          <div className="hidden sm:flex flex-col items-end leading-tight text-slate-700">
            <span className="text-xs font-semibold text-slate-400 uppercase">Welcome</span>
            <span className="font-bold text-base">{user.fullName || user.userName || 'User'}</span>
          </div>
          
        
          
          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-lg transition shadow-sm font-medium flex items-center gap-2"
          >
            <span>Logout</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

      </nav>

      {/* Spacer to push content down because Navbar is fixed */}
      <div className="h-16"></div>
    </>
  );
};

export default DashboardNavbar;