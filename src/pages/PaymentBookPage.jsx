import React, { useEffect, useState } from "react";
import { ChevronLeft, CreditCard, DollarSign, List, PlusCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PaymentBookPage = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for Form Visibility and Data
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: "Income",
    client: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    caseId: "",
  });
const API_URL = "https://tnt-gi49.onrender.com";

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/payments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      const data = await res.json();
      setTransactions(data.payments || []);
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          ...formData,
          amount: Number(formData.amount), // Ensure amount is a number
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        // Add new payment to top of list and close form
        setTransactions([data.payment, ...transactions]);
        setShowForm(false);
        // Reset form
        setFormData({
          type: "Income",
          client: "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
          caseId: "",
        });
      }
    } catch (err) {
      console.error("Error adding payment:", err);
    }
  };

  const getTransactionStyle = (type) =>
    type === "Income" ? "text-green-400 bg-green-900/50" : "text-red-400 bg-red-900/50";

  const totalIncome = transactions
    .filter((t) => t.type === "Income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const totalExpenses = transactions
    .filter((t) => t.type === "Expense")
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-10">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 mr-2 text-slate-400 hover:text-white rounded-full">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Your Payment Book</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-bold active:scale-95 transition ${
            showForm ? "bg-slate-700 text-white" : "bg-yellow-500 text-slate-900"
          }`}
        >
          {showForm ? <X size={18} className="mr-1" /> : <PlusCircle size={18} className="mr-1" />}
          {showForm ? "Cancel" : "Add"}
        </button>
      </div>

      {/* Add Payment Form Overlay/Section */}
      {showForm && (
        <div className="p-4 bg-slate-800 border-b border-slate-700 animate-in slide-in-from-top duration-300">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm outline-none focus:border-yellow-500"
                >
                  <option value="Income">Income (+)</option>
                  <option value="Expense">Expense (-)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm outline-none focus:border-yellow-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Client Name</label>
              <input
                type="text"
                name="client"
                placeholder="e.g. Rahul Sharma"
                value={formData.client}
                onChange={handleInputChange}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm outline-none focus:border-yellow-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  name="amount"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm outline-none focus:border-yellow-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Case ID (Optional)</label>
                <input
                  type="text"
                  name="caseId"
                  placeholder="C-123"
                  value={formData.caseId}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm outline-none focus:border-yellow-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-yellow-500 text-slate-900 py-2 rounded-lg font-bold hover:bg-yellow-400 transition"
            >
              Save Transaction
            </button>
          </form>
        </div>
      )}

      {/* Summary Dashboard */}
      {!showForm && (
        <div className="p-4 grid grid-cols-2 gap-4">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
            <DollarSign size={24} className="text-green-500 mb-2" />
            <p className="text-sm text-slate-400">Total Income</p>
            <h2 className="text-2xl font-bold text-green-400">₹ {totalIncome.toLocaleString("en-IN")}</h2>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
            <CreditCard size={24} className="text-red-500 mb-2" />
            <p className="text-sm text-slate-400">Total Expenses</p>
            <h2 className="text-2xl font-bold text-red-400">₹ {totalExpenses.toLocaleString("en-IN")}</h2>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-slate-200 mb-3 flex items-center">
          <List size={20} className="mr-2 text-yellow-400" /> Recent Transactions
        </h3>

        {loading ? (
          <p className="text-slate-500 text-center py-10">Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <div className="text-center py-10 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
            <p className="text-slate-500">No transactions yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx._id || tx.id}
                className="flex justify-between items-center p-3 bg-slate-800 rounded-lg border border-slate-700 transition hover:border-yellow-500"
              >
                <div>
                  <p className="font-semibold text-slate-100">{tx.client}</p>
                  <p className="text-xs text-slate-500">
                    {tx.caseId ? `Case: ${tx.caseId}` : "General"} | {tx.date}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${getTransactionStyle(tx.type)}`}>
                  {tx.type === "Income" ? "₹ " : "- ₹ "}
                  {Math.abs(tx.amount).toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>
        )}

        <button className="w-full mt-6 py-2 text-yellow-500 border border-yellow-500 rounded-lg hover:bg-yellow-500/10 transition">
          View Full Ledger
        </button>
      </div>
    </div>
  );
};

export default PaymentBookPage;