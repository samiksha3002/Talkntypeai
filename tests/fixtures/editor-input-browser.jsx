import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Quill } from 'react-quill-new';
import Dashboard from '../../src/components/Dashboard.jsx';
const owner = '000000000000000000000009';
localStorage.setItem('user', JSON.stringify({ _id: owner, role: 'user' }));
const fetcher = window.fetch;
window.fetch = (input, options) => {
  if (new URL(input, location.href).origin !== location.origin) throw Error('External traffic blocked');
  return fetcher(input, options);
};
window.__alerts = [];
window.alert = message => window.__alerts.push(message);
window.q = () => Quill.find(document.querySelector('.ql-container'));
window.owner = owner;
createRoot(document.getElementById('root')).render(<BrowserRouter><Dashboard /></BrowserRouter>);
