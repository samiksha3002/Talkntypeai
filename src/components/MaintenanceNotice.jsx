import React from 'react';
import {Link} from 'react-router-dom';
export default function MaintenanceNotice({feature,onBack}) {
 return <section role="status" className="p-8"><h1>{feature} temporarily unavailable</h1><p>This workflow is paused for a security update. Existing records are retained; this screen cannot change them while unavailable.</p>{onBack?<button onClick={onBack}>Back</button>:<Link to="/diary">Back to diary</Link>}</section>;
}
