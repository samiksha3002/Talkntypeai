import { useState } from "react";
import { 
  FileText, Handshake, Users, Gavel, Building2, 
  FileCheck, Home, Heart, Car, Scale, 
  Bell, FileSignature, Baby, ClipboardCheck, Briefcase 
} from "lucide-react";
import { generateDraftAPI } from "./editor.api";

// Expanded DRAFT_TYPES based on images
const DRAFT_TYPES = [
  { id: "will_gift", title: "Will & Gift Deeds", icon: <FileText size={24} /> },
  { id: "agreements", title: "Agreements", icon: <ClipboardCheck size={24} /> },
  { id: "appointments", title: "Appointments", icon: <Briefcase size={24} /> },
  { id: "criminal", title: "Criminal Pleadings", icon: <Gavel size={24} /> },
  { id: "civil", title: "Civil Pleadings", icon: <Users size={24} /> },
  { id: "arbitration", title: "Arbitration", icon: <Handshake size={24} /> },
  { id: "banking", title: "Banking", icon: <Building2 size={24} /> },
  { id: "bonds", title: "Bonds", icon: <FileCheck size={24} /> },
  { id: "rent", title: "Rent", icon: <Home size={24} /> },
  { id: "matrimonial", title: "Matrimonial", icon: <Heart size={24} /> },
  { id: "motor_vehicle", title: "Motor Vehicle Act", icon: <Car size={24} /> },
  { id: "negotiable", title: "Negotiable Instrument", icon: <Scale size={24} /> },
  { id: "legal_notice", title: "Legal Notice", icon: <Bell size={24} /> },
  { id: "power_of_attorney", title: "Power of Attorney", icon: <Handshake size={24} /> },
  { id: "special_leave", title: "Special Leave Petition", icon: <Scale size={24} /> },
  { id: "adoption", title: "Adoption Deeds", icon: <Baby size={24} /> },
  { id: "specific_relief", title: "Specific Relief Act", icon: <FileSignature size={24} /> },
  { id: "affidavits", title: "Affidavits", icon: <ClipboardCheck size={24} /> },
];

const DraftPopup = ({ onClose, setManualText, setIsAIGenerating }) => {
  const [step, setStep] = useState(1);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [prompt, setPrompt] = useState("");

  const handleGenerate = async () => {
    if (!selectedDraft || !prompt.trim()) return alert("Please fill all fields");

    try {
      setIsAIGenerating(true);
      const res = await generateDraftAPI({
        prompt,
        language: "English",
        draftType: selectedDraft.title
      });

      if (res.text && res.text !== "No draft generated.") {
        setManualText(res.text);
        onClose();
      } else {
        alert("AI did not return a valid draft.");
      }
    } catch (e) {
      alert("Draft generation failed");
    } finally {
      setIsAIGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2 font-semibold text-gray-800 text-lg">
            <FileText size={20} className="text-gray-600" />
            {step === 1 ? "Select Draft Category" : selectedDraft.title}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* STEP 1: Grid of Categories */}
          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {DRAFT_TYPES.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setSelectedDraft(d);
                    setStep(2);
                  }}
                  className="flex flex-col items-center justify-center p-6 border rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group"
                >
                  <div className="text-indigo-600 mb-3 group-hover:scale-110 transition-transform">
                    {d.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-700 text-center">
                    {d.title}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* STEP 2: Prompt Input */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg text-sm text-indigo-800">
                Describe the specific details for your <strong>{selectedDraft.title}</strong>. 
                Include names, dates, and key terms for better results.
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Draft Prompt
                </label>
                <textarea
                  autoFocus
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Draft a rent agreement for a 2BHK flat in Mumbai between..."
                  className="w-full border border-gray-300 rounded-lg p-4 h-48 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => setStep(1)} 
                  className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleGenerate}
                  className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                >
                  Generate Draft
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DraftPopup;