import React from 'react';
import { QrCode } from 'lucide-react';

const QrFooter = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 p-4 border-t border-slate-800">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-4 flex items-center justify-between shadow-lg">
        <div>
          <h4 className="font-bold text-white">Payment QR Code</h4>
          <p className="text-xs text-slate-300">Share with your client</p>
        </div>
        <button className="bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
          <QrCode size={18} />
          Generate
        </button>
      </div>
    </div>
  );
};

export default QrFooter;