import React from "react";
import { format, startOfWeek, addDays, isSameDay, setMonth, setYear } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CalendarHeader = ({ selectedDate, setSelectedDate }) => {
  // Calculate the 7 days of the current week
  const startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = [...Array(7)].map((_, i) => addDays(startDate, i));

  // Generate Year Options (e.g., 2020 to 2035)
  const years = [];
  for (let i = 2020; i <= 2035; i++) {
    years.push(i);
  }

  // Month Names
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleMonthChange = (e) => {
    const newDate = setMonth(selectedDate, parseInt(e.target.value));
    setSelectedDate(newDate);
  };

  const handleYearChange = (e) => {
    const newDate = setYear(selectedDate, parseInt(e.target.value));
    setSelectedDate(newDate);
  };

  return (
    <div className="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-20">
      <div className="flex items-center justify-between mb-4">
        {/* Dropdown Selection for Month and Year */}
        <div className="flex gap-2">
          <select
            value={selectedDate.getMonth()}
            onChange={handleMonthChange}
            className="bg-slate-900 text-white text-sm font-bold border border-slate-600 rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer"
          >
            {months.map((month, index) => (
              <option key={month} value={index}>{month}</option>
            ))}
          </select>

          <select
            value={selectedDate.getFullYear()}
            onChange={handleYearChange}
            className="bg-slate-900 text-white text-sm font-bold border border-slate-600 rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer"
          >
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Navigation Arrows */}
        <div className="flex gap-2">
          <button 
            onClick={() => setSelectedDate(addDays(selectedDate, -7))} 
            className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => setSelectedDate(addDays(selectedDate, 7))} 
            className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Week Strip */}
      <div className="flex justify-between">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          return (
            <button
              key={day.toString()}
              onClick={() => setSelectedDate(day)}
              className={`flex flex-col items-center p-2 min-w-[45px] rounded-xl transition-all ${
                isSelected 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 scale-105" 
                  : "hover:bg-slate-700 text-slate-400"
              }`}
            >
              <span className="text-[10px] uppercase font-bold tracking-tighter mb-1">
                {format(day, "EEE")}
              </span>
              <span className="text-sm font-bold">
                {format(day, "d")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarHeader;