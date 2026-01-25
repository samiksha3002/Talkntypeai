import React, { useState, useEffect } from "react";
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
  ClipboardList,
} from "lucide-react";

import CalendarHeader from "../components/Diary/CalendarHeader";
import MenuOption from "../components/MenuOption";

import CaseDiaryView from "../components/Diary/CaseDiaryView";

const Diary = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todaysTasks, setTodaysTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- UNIVERSAL DATA FETCHING & FILTERING LOGIC ---
  useEffect(() => {
    const fetchUniversalData = async () => {
      setLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || "https://talkntypeai.onrender.com";
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");

        // 1. Fetch ALL Data (Cases + Inquiries) safely
        const [casesResult, inquiriesResult] = await Promise.allSettled([
          fetch(`${API_URL}/api/cases/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/inquiries`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        let allEvents = [];

        // 2. Process Cases
        if (casesResult.status === 'fulfilled') {
          const casesData = await casesResult.value.json();
          if (casesData.success && Array.isArray(casesData.cases)) {
            casesData.cases.forEach((c) => {
              if (c.hearingDate) { // Only add if date exists
                allEvents.push({
                  id: c._id,
                  type: "CASE",
                  title: c.caseName,
                  subtitle: `${c.courtName} (No: ${c.caseNumber})`,
                  rawDate: c.hearingDate, 
                  description: c.description,
                });
              }
            });
          }
        }

        // 3. Process Inquiries
        if (inquiriesResult.status === 'fulfilled') {
           try {
             const inquiriesData = await inquiriesResult.value.json();
             if (Array.isArray(inquiriesData)) {
                inquiriesData.forEach((i) => {
                  if (i.followUpDate) { // Only add if date exists
                    allEvents.push({
                      id: i._id,
                      type: "INQUIRY",
                      title: i.inquirerName,
                      subtitle: `Lead: ${i.typeOfCase}`,
                      rawDate: i.followUpDate,
                      description: i.summary,
                    });
                  }
                });
             }
           } catch (e) {
             console.log("No inquiries found or invalid format");
           }
        }

        // 4. Filter for SELECTED DATE (With Crash Protection)
        const targetDateStr = format(selectedDate, "yyyy-MM-dd");

        const filtered = allEvents.filter(event => {
          if (!event.rawDate) return false;
          
          const d = new Date(event.rawDate);
          // 🛡️ CRASH FIX: Check if date is valid
          if (isNaN(d.getTime())) return false; 
          
          const eventDateStr = format(d, "yyyy-MM-dd");
          return eventDateStr === targetDateStr;
        });

        setTodaysTasks(filtered);

      } catch (err) {
        console.error("Error fetching diary data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUniversalData();
  }, [selectedDate]); 


  // --- Menu Config ---
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
        desc: "Redirect to eCourt website.",
        icon: <RefreshCw className="w-6 h-6 text-purple-400" />,
        path: "https://ecourts.gov.in/ecourts_home/",
        isExternal: true, 
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
        path: "/inquiries", 
      },
      {
        id: 12,
        title: "View Inquiries",
        desc: "See all your previous client inquiries.",
        icon: <ClipboardList className="w-6 h-6 text-yellow-400" />,
        path: "/manage-inquiries", 
      },
    ],
    teamAccess: [
      {
        id: 6,
        title: "Add Team Member",
        desc: "Enable multi-user access for your staff.",
        icon: <UserPlus className="w-6 h-6 text-teal-400" />,
        path: "/team", 
      },
      {
        id: 13,
        title: "Manage Team",
        desc: "View, edit, or remove team members.",
        icon: <Users className="w-6 h-6 text-blue-400" />,
        path: "/manage-team", 
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
      {/* Header */}
      <CalendarHeader
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />

      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Menu */}
        <div className="lg:col-span-2">
          <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4">Core Actions</h3>

          <div className="space-y-6">
            <div>
              <h4 className="text-slate-300 text-sm font-semibold mb-2">📁 Case Management</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuOptions.caseManagement.map((item) => (<MenuOption key={item.id} {...item} />))}
              </div>
            </div>

            <div>
              <h4 className="text-slate-300 text-sm font-semibold mb-2">👤 Client Management</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuOptions.clientManagement.map((item) => (<MenuOption key={item.id} {...item} />))}
              </div>
            </div>

            <div>
              <h4 className="text-slate-300 text-sm font-semibold mb-2">👥 Team & Access</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuOptions.teamAccess.map((item) => (<MenuOption key={item.id} {...item} />))}
              </div>
            </div>

            <div>
              <h4 className="text-slate-300 text-sm font-semibold mb-2">📊 Reports & Payments</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuOptions.reportsPayments.map((item) => (<MenuOption key={item.id} {...item} />))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Case View */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">
                📅 {format(selectedDate, "d MMM, EEEE")} Hearings
              </h3>
              {format(selectedDate, "yyyy-MM-dd") !== format(new Date(), "yyyy-MM-dd") && (
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-600/40 transition"
                >
                  Today
                </button>
              )}
            </div>

            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl min-h-[200px]">
              {/* Passing data as props to avoid internal fetching crashes */}
              <CaseDiaryView 
                tasks={todaysTasks} 
                loading={loading} 
                navigate={navigate} 
              />
            </div>

            <p className="text-[10px] text-slate-500 mt-4 italic">
              * Showing hearings and inquiries scheduled for the date selected above.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Diary;