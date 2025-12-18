import { useState } from "react";
import { generateDraftAPI } from "./editor.api";

const DRAFT_TYPES = [
  {
    title: "Divorce – Mutual Consent",
    description:
      "Joint petition filed by both husband and wife under Hindu Marriage Act, 1955."
  },
  { title: "Divorce – Contested" },
  { title: "Marriage Affidavit" },
  { title: "Legal Notice" },
  { title: "Rent Agreement" },
  { title: "Power of Attorney" }
];

const DraftPopup = ({ onClose, setManualText, setIsAIGenerating }) => {
  const [step, setStep] = useState(1);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [prompt, setPrompt] = useState("");

  const handleGenerate = async () => {
    if (!selectedDraft) {
      return alert("Please select a draft type first");
    }
    if (!prompt.trim()) {
      return alert("Enter prompt");
    }

    try {
      setIsAIGenerating(true);

      const res = await generateDraftAPI({
        prompt, // only user input
        language: "English",
        draftType: selectedDraft.title // pass draft type separately
      });

      if (!res.text || res.text === "No draft generated.") {
        alert("AI did not return a valid draft. Try a clearer prompt.");
        return;
      }

      setManualText(res.text);
      onClose();
    } catch (e) {
      console.error("Draft generation failed:", e);
      alert("Draft generation failed");
    } finally {
      setIsAIGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[600px] rounded-xl shadow-xl p-6">

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <h2 className="text-xl font-semibold mb-4">
              Select Draft Type
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {DRAFT_TYPES.map(d => (
                <button
                  key={d.title}
                  onClick={() => {
                    setSelectedDraft(d);
                    setStep(2);
                  }}
                  className="border rounded-lg p-3 hover:bg-indigo-50 text-left"
                >
                  <div className="font-medium">{d.title}</div>
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="mt-4 text-sm text-gray-500"
            >
              Close
            </button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && selectedDraft && (
          <>
            <h2 className="text-xl font-semibold mb-2">
              {selectedDraft.title}
            </h2>

            {selectedDraft.description && (
              <div className="bg-indigo-50 p-3 rounded text-sm mb-3">
                {selectedDraft.description}
              </div>
            )}

            <label className="text-sm font-medium">
              Draft Prompt
            </label>

            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe the document you want..."
              className="w-full border rounded-lg p-3 mt-1 h-32"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={onClose} className="px-4 py-2 border rounded">
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                className="px-4 py-2 bg-indigo-600 text-white rounded"
              >
                Generate Draft
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DraftPopup;
