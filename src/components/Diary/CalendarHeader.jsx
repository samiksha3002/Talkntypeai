import React from 'react';

// You will need a date manipulation library like date-fns or moment
// For this example, we'll assume the parent component passes the formatted month/year string.

/**
 * CalendarHeader Component
 * @param {object} props - Component properties
 * @param {string} props.currentMonthYear - Formatted string like "December 2025"
 * @param {function} props.onPrevMonth - Function to navigate to the previous month
 * @param {function} props.onNextMonth - Function to navigate to the next month
 */
const CalendarHeader = ({ currentMonthYear, onPrevMonth, onNextMonth }) => {
  return (
    <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm rounded-t-lg">
      
      {/* --- 1. Current Month & Year Display --- */}
      <h2 className="text-xl font-bold text-gray-800 tracking-wider">
        {/* Display the formatted date string */}
        {currentMonthYear || 'Loading...'}
      </h2>

      {/* --- 2. Navigation Controls --- */}
      <div className="flex space-x-2">
        
        {/* Previous Month Button */}
        <button
          onClick={onPrevMonth}
          className="p-2 border border-gray-300 rounded-full text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition duration-150 ease-in-out"
          aria-label="Previous Month"
        >
          {/* Unicode left arrow */}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>

        {/* Next Month Button */}
        <button
          onClick={onNextMonth}
          className="p-2 border border-gray-300 rounded-full text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition duration-150 ease-in-out"
          aria-label="Next Month"
        >
          {/* Unicode right arrow */}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>
    </header>
  );
};

export default CalendarHeader;