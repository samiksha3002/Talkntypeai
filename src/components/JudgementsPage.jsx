import React from 'react';
import { useNavigate } from 'react-router-dom';
// import FooterButtons from './FooterButtons'; 

const JudgementsPage = () => {
  const navigate = useNavigate();

  // Data for the buttons
  const dashboardItems = [
    { label: "New Criminal Laws" },
    { label: "Latest Cases" },
    { label: "Latest Law-Points" },
    { label: "Latest News" },
    { label: "Latest Amendments" },
    { label: "Subject/Topic Search" },
    { label: "Citation Search" },
    { label: "Statutes Wise Search" },
    { label: "Advance Search" },
    { label: "Nominal Search" },
    { label: "Judges/Adv. Search" },
    { label: "Date Wise Search" },
    { label: "Prosecution Page" },
    { label: "Central Laws" },
    { label: "Central Laws (Hindi)" },
    { label: "State Laws" },
    { label: "Overruled Cases" },
    { label: "Assembly Debates" },
    { label: "Law Comm. Reports" },
    { label: "Bills in Parliament" },
    { label: "Legal Dictionary" },
    { label: "Articles" },
    { label: "Deeds and Documents" },
    { label: "My Saved Bookmarks" },
  ];

  // Uniform Sky Blue Button Style
  const skyButtonClass = "bg-sky-500 hover:bg-sky-600 border-sky-600 text-white";

  return (
    <div className="min-h-screen bg-gray-50 pb-24"> 
      
      {/* ================= HEADER SECTION ================= */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          
          {/* Top Row: Back Button & Title */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div className="bg-sky-100 p-2 rounded-lg text-sky-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 leading-tight">Legal Judgements</h1>
                <p className="text-sm text-gray-500">Repository of Acts, Rules & Rulings</p>
              </div>
            </div>

            {/* Back Button */}
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-sm font-medium text-gray-500 hover:text-sky-600 flex items-center gap-1 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
          </div>

          {/* Optional: Quick Search Bar for look & feel */}
          <div className="relative">
             <input 
                type="text" 
                placeholder="Quick Search for Judgements, Acts or Citations..." 
                className="w-full pl-10 pr-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all outline-none text-gray-700"
             />
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
             </svg>
          </div>

        </div>
      </div>
      {/* ================= END HEADER ================= */}


      {/* ================= GRID BUTTONS ================= */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <h2 className="text-gray-600 font-semibold mb-4 text-sm uppercase tracking-wide">Quick Access Menu</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Main List Buttons */}
          {dashboardItems.map((item, index) => (
            <button
              key={index}
              className={`
                ${skyButtonClass}
                py-4 px-4 rounded-xl shadow-sm hover:shadow-lg
                text-lg font-medium 
                transition-all active:scale-95 duration-200
                flex items-center justify-center text-center
                border-b-4
              `}
              onClick={() => console.log(`Clicked ${item.label}`)}
            >
              {item.label}
            </button>
          ))}
          
          {/* Search History Button */}
          <button className={`
              ${skyButtonClass}
              py-4 px-4 rounded-xl shadow-sm hover:shadow-lg
              text-lg font-medium 
              border-b-4
              flex items-center justify-center text-center
              opacity-90 hover:opacity-100
            `}>
              Search History
          </button>

        </div>
      </div>

       {/* Footer would go here */}
       {/* <FooterButtons /> */}
    </div>
  );
};

export default JudgementsPage;