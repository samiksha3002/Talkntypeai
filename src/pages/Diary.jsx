import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, UserPlus, RefreshCw, FileText, HelpCircle, Users, CreditCard 
} from 'lucide-react';

// Naye Components Import Karein
import CalendarHeader from '../components/Diary/CalendarHeader'; // Path adjust karein
import MenuOption from '../components/MenuOption'; // Assuming you create this wrapper component
import QrFooter from '../components/Diary/QrFooter'; // Path adjust karein

const Diary = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate(); // navigate abhi bhi MenuOption mein use ho raha hai

  // Features List Data (Yeh data yahi rakhenge, ya fir alag 'constants' file mein)
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
      
      {/* --- Section 1: Calendar Header (Extracted) --- */}
      <CalendarHeader 
        selectedDate={selectedDate} 
        setSelectedDate={setSelectedDate} 
      />

      {/* --- Section 2: More Options List --- */}
      <div className="px-4 py-6">
        <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4">More Options</h3>
        
        <div className="space-y-4">
          {menuOptions.map((item) => (
            <MenuOption 
              key={item.id}
              title={item.title}
              desc={item.desc}
              icon={item.icon}
              path={item.path}
              // Agar aap MenuOption component use kar rahe hain
            />
          ))}
        </div>
      </div>

      {/* --- Section 3: Bottom Footer / QR (Extracted) --- */}
      <QrFooter />

    </div>
  );
};

export default Diary;