import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- SVG ICONS (Internal Components for cleaner look) ---
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
);
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- MODAL STATE ---
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [planDates, setPlanDates] = useState({ startDate: '', expiryDate: '' });

  const navigate = useNavigate();

  // 1. Initial Load
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('https://talkntype.onrender.com/api/admin/users');
      const data = await response.json();
      setUsers(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('expiryDate');
    navigate('/login');
  };

  // 2. Toggle Active Status
  const toggleStatus = async (id, currentStatus) => {
    // Optimistic Update
    setUsers(users.map(u => u._id === id ? { ...u, subscription: { ...u.subscription, isActive: !currentStatus } } : u));

    try {
      await fetch(`https://https://talkntype.onrender.com/api/admin/update-status/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      fetchUsers(); 
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // 3. DELETE USER FUNCTION (New)
  const handleDeleteUser = async (userId) => {
    if (window.confirm("ARE YOU SURE? \n\nThis will permanently delete the user and all their data. This action cannot be undone.")) {
      try {
        const response = await fetch(`https://https://talkntype.onrender.com/api/admin/delete-user/${userId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Remove from local state immediately
          setUsers(users.filter(user => user._id !== userId));
          alert("User deleted successfully");
        } else {
          alert("Failed to delete user");
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Error connecting to server");
      }
    }
  };

  // 4. Open Modal for Date Selection
  const openPlanModal = (user) => {
    setSelectedUser(user);
    const start = user.subscription.startDate ? new Date(user.subscription.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const end = user.subscription.expiryDate ? new Date(user.subscription.expiryDate).toISOString().split('T')[0] : '';
    setPlanDates({ startDate: start, expiryDate: end });
    setShowModal(true);
  };

  // 5. Quick Date Setters
  const setDuration = (months) => {
    const start = new Date(planDates.startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    setPlanDates({ ...planDates, expiryDate: end.toISOString().split('T')[0] });
  };

  // 6. Save Subscription
  const saveSubscription = async () => {
    if (!selectedUser) return;
    try {
      const response = await fetch(`https://https://talkntype.onrender.com/api/admin/update-subscription/${selectedUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planDates),
      });

      if (response.ok) {
        setShowModal(false);
        fetchUsers();
        alert("Plan Updated Successfully!");
      }
    } catch (error) {
      console.error("Failed to update plan", error);
    }
  };

  // Filter Users based on Search
  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* --- TOP NAVIGATION BAR --- */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg font-bold text-lg">AS</div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Admin<span className="text-indigo-600">Suite</span></h1>
          </div>
          <button 
            onClick={handleLogout}
            className="text-sm font-medium text-slate-500 hover:text-red-600 transition flex items-center gap-2"
          >
            Log Out
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        
        {/* --- STATS ROW --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total Users" value={users.length} color="indigo" />
          <StatCard title="Active Subscriptions" value={users.filter(u => u.subscription.isActive).length} color="green" />
          <StatCard title="Inactive / Expired" value={users.filter(u => !u.subscription.isActive).length} color="amber" />
        </div>

        {/* --- ACTIONS BAR (Search & Title) --- */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
            <p className="text-slate-500 text-sm mt-1">View, manage, and delete system users.</p>
          </div>
          
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <SearchIcon />
            </div>
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition shadow-sm"
            />
          </div>
        </div>

        {/* --- USER TABLE --- */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Plan Details</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="4" className="p-8 text-center text-slate-500">Loading data...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan="4" className="p-8 text-center text-slate-500">No users found matching "{searchTerm}"</td></tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="group hover:bg-slate-50 transition duration-150">
                      
                      {/* Name & Contact */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 font-bold text-sm uppercase">
                            {user.fullName.substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{user.fullName}</div>
                            <div className="text-sm text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Subscription Info */}
                      <td className="p-4">
                         {user.subscription.expiryDate ? (
                            <div className="flex flex-col">
                               <span className="text-xs text-slate-500 uppercase font-semibold">Expires</span>
                               <span className={`text-sm font-medium ${new Date(user.subscription.expiryDate) < new Date() ? 'text-red-600' : 'text-slate-700'}`}>
                                  {new Date(user.subscription.expiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                               </span>
                            </div>
                         ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                              No Plan
                            </span>
                         )}
                      </td>

                      {/* Status Toggle */}
                      <td className="p-4">
                        <button 
                          onClick={() => toggleStatus(user._id, user.subscription.isActive)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${user.subscription.isActive ? 'bg-green-500' : 'bg-slate-200'}`}
                        >
                          <span className="sr-only">Use setting</span>
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${user.subscription.isActive ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                        <span className="ml-3 text-sm text-slate-600">
                            {user.subscription.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                            {/* Manage Button */}
                            <button
                              onClick={() => openPlanModal(user)}
                              className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 p-2 rounded-lg transition"
                              title="Edit Subscription"
                            >
                              <EditIcon />
                            </button>
                            
                            {/* Delete Button (NEW) */}
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition"
                              title="Delete User"
                            >
                              <TrashIcon />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- EDIT PLAN MODAL --- */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800">Update Subscription</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
              </div>
              
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                  <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
                     {selectedUser.fullName.substring(0, 2)}
                  </div>
                  <div>
                     <div className="text-sm font-semibold text-slate-800">{selectedUser.fullName}</div>
                     <div className="text-xs text-slate-500">{selectedUser.email}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Date</label>
                    <input 
                      type="date" 
                      value={planDates.startDate}
                      onChange={(e) => setPlanDates({...planDates, startDate: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expiry Date</label>
                    <input 
                      type="date" 
                      value={planDates.expiryDate}
                      onChange={(e) => setPlanDates({...planDates, expiryDate: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                   <button onClick={() => setDuration(1)} className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium py-2 rounded shadow-sm transition">
                     + 1 Month
                   </button>
                   <button onClick={() => setDuration(12)} className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium py-2 rounded shadow-sm transition">
                     + 1 Year
                   </button>
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-4 flex gap-3 border-t border-slate-100">
                <button 
                  onClick={() => setShowModal(false)}
                  className="flex-1 text-slate-600 font-medium hover:bg-slate-200 py-2.5 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveSubscription}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow-md transition"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// Helper Component for Stats
const StatCard = ({ title, value, color }) => {
    const colorStyles = {
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        green: 'bg-green-50 text-green-700 border-green-200',
        amber: 'bg-amber-50 text-amber-700 border-amber-200'
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-2">{value}</h3>
                </div>
                <div className={`p-2 rounded-lg ${colorStyles[color]} border`}>
                   {/* Simple dynamic icon based on color for visual cue */}
                   {color === 'indigo' && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                   {color === 'green' && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                   {color === 'amber' && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;