const EditorStatusBar = ({
  manualText,
  speechText,
  isTranslating,
  isTransliterating,
  isConverting,
  isOCRLoading
}) => (
  <div className="h-8 bg-sky-50 border-t px-4 flex justify-between items-center text-xs">
    <span>
      {isTranslating || isTransliterating || isConverting || isOCRLoading
        ? "Processing..."
        : speechText
        ? "Receiving Audio..."
        : "Ready to Draft"}
    </span>
    <span>{manualText?.split(/\s+/).filter(Boolean).length || 0} words</span>
  </div>
);

export default EditorStatusBar;