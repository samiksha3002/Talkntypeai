import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

import {
  Briefcase,
  UserPlus,
  RefreshCw,
  FileText,
  HelpCircle,
  Users,
  CreditCard,
  FileSearch,
  ClipboardList, // Icon for viewing the list
} from "lucide-react";

import CalendarHeader from "../components/Diary/CalendarHeader";
import MenuOption from "../components/MenuOption";
import QrFooter from "../components/Diary/QrFooter";
import CaseDiaryView from "../components/Diary/CaseDiaryView";

const Diary = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();

  // Features List Data
  const menuOptions = {
    caseManagement: [
      {
        id: 1,
        title: "Add New Case",
        desc: "Enter court details, case number, hearing dates.",
        icon: <Briefcase className="w-6 h-6 text-blue-400" />,
        path: "/add-case",
      },
      {
        id: 10,
        title: "Manage Existing Cases",
        desc: "View, edit, or delete your existing case files.",
        icon: <FileSearch className="w-6 h-6 text-indigo-400" />,
        path: "/manage-cases",
      },
      {
        id: 3,
        title: "Import Cases from eCourt",
        desc: "Only eCourt text file allows to import.",
        icon: <RefreshCw className="w-6 h-6 text-purple-400" />,
        path: "/import-ecourt",
      },
    ],
    clientManagement: [
      {
        id: 2,
        title: "Add New Client",
        desc: "Save complete client information.",
        icon: <UserPlus className="w-6 h-6 text-green-400" />,
        path: "/add-client",
      },
      {
        id: 11,
        title: "Manage Clients",
        desc: "View, edit, or delete your saved clients.",
        icon: <FileSearch className="w-6 h-6 text-pink-400" />,
        path: "/manage-clients",
      },
      {
        id: 5,
        title: "Add New Inquiry",
        desc: "Create and manage new client inquiries.",
        icon: <HelpCircle className="w-6 h-6 text-orange-400" />,
        path: "/inquiries", // Path for the FORM
      },
      {
        id: 12,
        title: "View Inquiries",
        desc: "See all your previous client inquiries.",
        icon: <ClipboardList className="w-6 h-6 text-yellow-400" />,
        path: "/manage-inquiries", // Path for the LIST
      },
    ],
  // Diary.jsx ke andar menuOptions object mein ye change karein
teamAccess: [
  {
    id: 6,
    title: "Add Team Member",
    desc: "Enable multi-user access for your staff.",
    icon: <UserPlus className="w-6 h-6 text-teal-400" />,
    path: "/team", // Isse naya member add karne ka form khulega
  },
  {
    id: 13,
    title: "Manage Team",
    desc: "View, edit, or remove team members.",
    icon: <Users className="w-6 h-6 text-blue-400" />, 
    path: "/manage-team", // Isse list view khulega
  },
],
    reportsPayments: [
      {
        id: 4,
        title: "Generate PDF",
        desc: "Select a date range to export case details.",
        icon: <FileText className="w-6 h-6 text-red-400" />,
        path: "/generate-report",
      },
      {
        id: 7,
        title: "Your Payment Book",
        desc: "Check payment history.",
        icon: <CreditCard className="w-6 h-6 text-yellow-400" />,
        path: "/payments",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-24">
      {/* --- Section 1: Calendar Header --- */}
      <CalendarHeader
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />

      {/* --- Section 2: Split Layout --- */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Core Actions Menu */}
        <div className="lg:col-span-2">
          <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4">
            Core Actions
          </h3>

          {/* Case Management */}
          <h4 className="text-slate-300 text-sm font-semibold mb-2 mt-6">
            📁 Case Management
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuOptions.caseManagement.map((item) => (
              <MenuOption key={item.id} {...item} />
            ))}
          </div>

          {/* Client Management */}
          <h4 className="text-slate-300 text-sm font-semibold mb-2 mt-6">
            👤 Client Management
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuOptions.clientManagement.map((item) => (
              <MenuOption key={item.id} {...item} />
            ))}
          </div>

          {/* Team & Access */}
          <h4 className="text-slate-300 text-sm font-semibold mb-2 mt-6">
            👥 Team & Access
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuOptions.teamAccess.map((item) => (
              <MenuOption key={item.id} {...item} />
            ))}
          </div>

          {/* Reports & Payments */}
          <h4 className="text-slate-300 text-sm font-semibold mb-2 mt-6">
            📊 Reports & Payments
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuOptions.reportsPayments.map((item) => (
              <MenuOption key={item.id} {...item} />
            ))}
          </div>
        </div>

        {/* Right Side: Selected Date Cases/Diary Entries */}
        <div className="lg:col-span-1">
          <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4">
            📅 {format(selectedDate, "d MMM, EEEE")} Hearings
          </h3>

          <CaseDiaryView selectedDate={selectedDate} navigate={navigate} />
          
          {/* Note: InquiryList is removed from here to keep the UI clean */}
        </div>
      </div>

      {/* --- Section 3: Bottom Footer / QR --- */}
    
    </div>
  );
};

export default Diary;