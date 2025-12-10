// src/context/CaseContext.jsx
import React, { createContext, useState, useContext } from 'react';

// 1. Context Create Karein
const CaseContext = createContext();

// Mock initial data (testing ke liye)
const MOCK_INITIAL_CASES = [
  { 
    id: 1, 
    caseName: 'Sharma vs. Verma', 
    caseNumber: 'C-2025/001', 
    courtName: 'High Court', 
    hearingDate: '2025-12-15', 
    description: 'Initial hearing on property matter.',
  },
  { 
    id: 2, 
    caseName: 'State vs. Rakesh', 
    caseNumber: 'CR-2025/005', 
    courtName: 'District Court', 
    hearingDate: '2025-12-10', 
    description: 'Bail application hearing.',
  },
  { 
    id: 3, 
    caseName: 'Patel Family Matter', 
    caseNumber: 'F-2025/010', 
    courtName: 'Family Court', 
    hearingDate: '2025-12-09', 
    description: 'Divorce petition final arguments.',
  },
];

// 2. Provider Component
export const CaseProvider = ({ children }) => {
  const [allCases, setAllCases] = useState(MOCK_INITIAL_CASES);
  
  const addCase = (newCaseDetails) => {
    const newCase = {
      ...newCaseDetails,
      id: Date.now(),
    };
    setAllCases([newCase, ...allCases]);
  };

  return (
    <CaseContext.Provider value={{ allCases, addCase }}>
      {children}
    </CaseContext.Provider>
  );
};

// 3. Custom Hook
export const useCases = () => {
  return useContext(CaseContext);
};