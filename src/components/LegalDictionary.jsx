import React, { useState } from 'react';
import axios from 'axios';

const LegalDictionary = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!searchTerm.trim()) return;

        setLoading(true);
        setResult(null);

        try {
            // Replace with your actual Render URL or localhost during dev
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await axios.get(`${API_URL}/api/dictionary/define/${searchTerm}`);
            setResult(response.data);
        } catch (error) {
            setResult({ error: "Could not find definition. Please check your connection." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '500px', background: '#f9f9f9', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#2c3e50' }}>Legal Dictionary</h2>
            
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    placeholder="Search e.g. Affidavit, BNS..."
                    style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <button 
                    type="submit" 
                    disabled={loading}
                    style={{ padding: '8px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    {loading ? '...' : 'Search'}
                </button>
            </form>

            {result && (
                <div style={{ padding: '15px', background: 'white', borderLeft: '4px solid #007bff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <strong style={{ display: 'block', textTransform: 'capitalize', marginBottom: '5px' }}>
                        {result.term}
                    </strong>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: '#444' }}>
                        {result.definition || result.error}
                    </p>
                </div>
            )}
        </div>
    );
};

export default LegalDictionary;