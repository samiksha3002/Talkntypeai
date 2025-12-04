import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Using react-router for navigation
import { 
  Briefcase, 
  UserPlus, 
  RefreshCw, 
  FileText, 
  HelpCircle, 
  Users, 
  CreditCard, 
  QrCode, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';

const Diary = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Logic to generate a simple week view
  const startDate = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  // Features List Data
  const menuOptions = [
    {
      id: 1,
      title: "Add New Case (Manage Case)",
      desc: "Enter court details, case number, hearing dates.",
      icon: <Briefcase className="w-6 h-6 text-blue-400" />,
      path: "/add-case"
    },
    {
      id: 2,
      title: "Add New Client",
      desc: "Save complete client information.",
      icon: <UserPlus className="w-6 h-6 text-green-400" />,
      path: "/add-client"
    },
    {
      id: 3,
      title: "Import Cases from eCourt",
      desc: "Only eCourt text file allows to import.",
      icon: <RefreshCw className="w-6 h-6 text-purple-400" />,
      path: "/import-ecourt"
    },
    {
      id: 4,
      title: "Generate PDF",
      desc: "Select a date range to export case details.",
      icon: <FileText className="w-6 h-6 text-red-400" />,
      path: "/generate-report"
    },
    {
      id: 5,
      title: "Add New Inquiry",
      desc: "Create and manage all client inquiries.",
      icon: <HelpCircle className="w-6 h-6 text-orange-400" />,
      path: "/inquiries"
    },
    {
      id: 6,
      title: "Add Team Member",
      desc: "Enable multi-user access.",
      icon: <Users className="w-6 h-6 text-teal-400" />,
      path: "/team"
    },
    {
      id: 7,
      title: "Your Payment Book",
      desc: "Check payment history.",
      icon: <CreditCard className="w-6 h-6 text-yellow-400" />,
      path: "/payments"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-24">
      
      {/* --- Section 1: Calendar Header --- */}
      <div className="bg-slate-800 p-4 rounded-b-3xl shadow-lg border-b border-slate-700">
        
        {/* Month Selector */}
        <div className="flex justify-between items-center mb-4">
          <button className="p-2 hover:bg-slate-700 rounded-full"><ChevronLeft /></button>
          <h2 className="text-xl font-bold">{format(selectedDate, 'MMMM yyyy')}</h2>
          <button className="p-2 hover:bg-slate-700 rounded-full"><ChevronRight /></button>
        </div>

        {/* Date Strip */}
        <div className="flex justify-between items-center">
          {weekDays.map((date, index) => {
            const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
            
            return (
              <div 
                key={index} 
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center justify-center w-10 h-14 rounded-xl cursor-pointer transition-all
                  ${isSelected ? 'bg-green-500 text-white shadow-lg scale-110' : 'text-slate-400 hover:bg-slate-700'}
                  ${isToday && !isSelected ? 'border border-green-500 text-green-500' : ''}
                `}
              >
                <span className="text-xs font-medium">{format(date, 'EEE')}</span>
                <span className="text-lg font-bold">{format(date, 'd')}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- Section 2: More Options List --- */}
      <div className="px-4 py-6">
        <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4">More Options</h3>
        
        <div className="space-y-4">
          {menuOptions.map((item) => (
            <div 
              key={item.id}
              onClick={() => navigate(item.path)}
              className="group flex items-center bg-slate-800/50 p-4 rounded-2xl border border-slate-700 hover:border-green-500/50 transition-all cursor-pointer active:scale-95"
            >
              {/* Icon Container */}
              <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mr-4 shadow-sm group-hover:bg-slate-800">
                {item.icon}
              </div>
              
              {/* Text Content */}
              <div className="flex-1">
                <h4 className="text-base font-bold text-slate-100 mb-0.5">{item.title}</h4>
                <p className="text-xs text-slate-400 leading-tight">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Section 3: Bottom Footer / QR --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 p-4 border-t border-slate-800">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <h4 className="font-bold text-white">Payment QR Code</h4>
            <p className="text-xs text-slate-300">Share with your client</p>
          </div>
          <button className="bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
            <QrCode size={18} />
            Generate
          </button>
        </div>
      </div>

    </div>
  );
};

export default Diary;