// src/pages/Diary.jsx
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
} from "lucide-react";

import CalendarHeader from "../components/Diary/CalendarHeader";
import MenuOption from "../components/MenuOption";
import QrFooter from "../components/Diary/QrFooter";
import CaseDiaryView from "../components/Diary/CaseDiaryView";
import InquiryList from "../components/Diary/InquiryList";

const Diary = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();

  // Features List Data
  const menuOptions = [
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
      id: 3,
      title: "Import Cases from eCourt",
      desc: "Only eCourt text file allows to import.",
      icon: <RefreshCw className="w-6 h-6 text-purple-400" />,
      path: "/import-ecourt",
    },
    {
      id: 4,
      title: "Generate PDF",
      desc: "Select a date range to export case details.",
      icon: <FileText className="w-6 h-6 text-red-400" />,
      path: "/generate-report",
    },
    {
      id: 5,
      title: "Add New Inquiry",
      desc: "Create and manage all client inquiries.",
      icon: <HelpCircle className="w-6 h-6 text-orange-400" />,
      path: "/inquiries",
    },
    {
      id: 6,
      title: "Add Team Member",
      desc: "Enable multi-user access.",
      icon: <Users className="w-6 h-6 text-teal-400" />,
      path: "/team",
    },
    {
      id: 7,
      title: "Your Payment Book",
      desc: "Check payment history.",
      icon: <CreditCard className="w-6 h-6 text-yellow-400" />,
      path: "/payments",
    },
  ];

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
          <div className="space-y-4">
            {menuOptions.map((item) => (
              <MenuOption
                key={item.id}
                title={item.title}
                desc={item.desc}
                icon={item.icon}
                path={item.path}
              />
            ))}
          </div>
        </div>

        {/* Right Side: Selected Date Cases/Diary Entries + Inquiries */}
        <div className="lg:col-span-1">
          <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4">
            📅 {format(selectedDate, "d MMM, EEEE")} Hearings
          </h3>

          <CaseDiaryView selectedDate={selectedDate} navigate={navigate} />

          {/* ✅ show user’s inquiries here */}
          <InquiryList />
        </div>
      </div>

      {/* --- Section 3: Bottom Footer / QR --- */}
      <QrFooter />
    </div>
  );
};

export default Diary;
