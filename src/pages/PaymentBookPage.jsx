// src/pages/PaymentBookPage.jsx
import React from 'react';
import { ChevronLeft, CreditCard, DollarSign, List, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PaymentBookPage = () => {
  const navigate = useNavigate();

  // Mock data for recent transactions
  const mockTransactions = [
    { id: 1, date: '2025-12-05', client: 'Ramesh Kumar', amount: 50000, type: 'Income', caseId: 'C-001' },
    { id: 2, date: '2025-12-01', client: 'Office Supplies', amount: -2500, type: 'Expense', caseId: null },
    { id: 3, date: '2025-11-28', client: 'Sunita Devi', amount: 20000, type: 'Income', caseId: 'C-005' },
    { id: 4, date: '2025-11-15', client: 'Travel Allowance', amount: -1500, type: 'Expense', caseId: null },
  ];

  const getTransactionStyle = (type) => {
    return type === 'Income'
      ? 'text-green-400 bg-green-900/50'
      : 'text-red-400 bg-red-900/50';
  };
  
  const handleAddPayment = () => {
      alert("Opening form to record a new payment/expense...");
      // In a real app, this would navigate to a detailed entry form
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 mr-2 text-slate-400 hover:text-white rounded-full">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-xl font-bold">Your Payment Book</h1>
        </div>
        <button 
            onClick={handleAddPayment}
            className="flex items-center bg-yellow-500 text-slate-900 px-3 py-1.5 rounded-lg text-sm font-bold active:scale-95 transition"
        >
            <PlusCircle size={18} className="mr-1" />
            Add
        </button>
      </div>

      {/* Summary Dashboard */}
      <div className="p-4 grid grid-cols-2 gap-4">
        {/* Total Income Card */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
          <DollarSign size={24} className="text-green-500 mb-2" />
          <p className="text-sm text-slate-400">Total Income</p>
          <h2 className="text-2xl font-bold text-green-400">₹ 70,000</h2>
        </div>
        
        {/* Total Expenses Card */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
          <CreditCard size={24} className="text-red-500 mb-2" />
          <p className="text-sm text-slate-400">Total Expenses</p>
          <h2 className="text-2xl font-bold text-red-400">₹ 4,000</h2>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-slate-200 mb-3 flex items-center">
            <List size={20} className="mr-2 text-yellow-400" /> Recent Transactions
        </h3>
        
        <div className="space-y-3">
          {mockTransactions.map((tx) => (
            <div 
              key={tx.id} 
              className="flex justify-between items-center p-3 bg-slate-800 rounded-lg border border-slate-700 transition hover:border-yellow-500"
            >
              {/* Left Side: Client/Details */}
              <div>
                <p className="font-semibold text-slate-100">{tx.client}</p>
                <p className="text-xs text-slate-500">
                    {tx.caseId ? `Case: ${tx.caseId}` : 'General'} | {tx.date}
                </p>
              </div>
              
              {/* Right Side: Amount and Type */}
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${getTransactionStyle(tx.type)}`}>
                {tx.type === 'Income' ? '₹ ' : '- ₹ '}{Math.abs(tx.amount).toLocaleString('en-IN')}
              </div>
            </div>
          ))}
        </div>
        
        <button className="w-full mt-6 py-2 text-yellow-500 border border-yellow-500 rounded-lg hover:bg-yellow-500/10 transition">
            View Full Ledger
        </button>
      </div>
      
    </div>
  );
};

export default PaymentBookPage;