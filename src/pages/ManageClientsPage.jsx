import React, { useEffect, useState } from 'react';
import { ChevronLeft, User, Phone, Mail, Trash2, PlusCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManageClientsPage = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) return navigate('/login');

      try {
        const res = await fetch(`https://tnt-gi49.onrender.com/api/clients/user/${userId}`);
        const data = await res.json();
        if (data.success) setClients(data.clients);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, [navigate]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this client?")) return;
    try {
      const res = await fetch(`https://tnt-gi49.onrender.com/api/clients/${id}`, { method: 'DELETE' });
      if (res.ok) setClients(clients.filter(c => c._id !== id));
    } catch (err) {
      alert("Delete failed");
    }
  };

  // ✅ FIX 1: c.fullName ki jagah c.name use kiya
  const filteredClients = clients.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 bg-slate-800 rounded-full mr-3"><ChevronLeft /></button>
          <h1 className="text-xl font-bold">My Clients ({clients.length})</h1>
        </div>
        <button onClick={() => navigate('/add-client')} className="bg-green-600 p-2 rounded-lg flex items-center text-sm font-bold">
          <PlusCircle size={18} className="mr-1" /> Add Client
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 text-slate-500" size={20} />
        <input 
          type="text" 
          placeholder="Search by name..." 
          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-green-500"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Client List */}
      {loading ? (
        <p className="text-center text-slate-500">Loading...</p>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-10 bg-slate-800 rounded-2xl border border-dashed border-slate-700">
          <p className="text-slate-400">No clients found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredClients.map((client) => (
            <div key={client._id} className="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex justify-between items-center shadow-lg hover:border-green-500/50 transition">
              <div>
                {/* ✅ FIX 2: client.fullName ki jagah client.name use kiya */}
                <h3 className="font-bold text-lg text-slate-100">{client.name}</h3>
                <div className="flex flex-col space-y-1 mt-1">
                  <span className="text-sm text-slate-400 flex items-center"><Phone size={14} className="mr-2" /> {client.phone}</span>
                  {client.email && <span className="text-sm text-slate-400 flex items-center"><Mail size={14} className="mr-2" /> {client.email}</span>}
                </div>
              </div>
              <button onClick={() => handleDelete(client._id)} className="p-3 text-red-400 hover:bg-red-500/10 rounded-full transition">
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageClientsPage;