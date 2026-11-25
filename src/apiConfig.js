const NODE_URL = "https://talkntypeai.onrender.com";
const PYTHON_URL = "https://talkntype-ai-python.onrender.com";

export const getUrl = (feature) => {
    const isLocal = window.location.hostname === "localhost";
    const usePython = ["draft", "research", "chat"].includes(feature);

    if (isLocal) {
        return usePython ? "http://localhost:8000" : "http://localhost:10000";
    }
    return usePython ? PYTHON_URL : NODE_URL;
};