import { useState } from 'react';
import LegalDictionary from './LegalDictionary'; // Import the component

function App() {
  const [showDictionary, setShowDictionary] = useState(false);

  return (
    <div className="app-container">
      {/* Your existing TNT header/editor */}
      <button onClick={() => setShowDictionary(!showDictionary)}>
        {showDictionary ? "Close Dictionary" : "Open Legal Dictionary"}
      </button>

      {/* Logic to show the component */}
      {showDictionary && (
        <div className="modal-overlay">
           <div className="modal-content">
              <button onClick={() => setShowDictionary(false)}>X</button>
              <LegalDictionary /> 
           </div>
        </div>
      )}
    </div>
  );
}