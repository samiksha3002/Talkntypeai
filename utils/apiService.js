import axios from 'axios';

const API_URL = "http://localhost:8000";

export const askLegalAI = async (queryText) => {
    try {
        const response = await axios.post(`${API_URL}/ask`, {
            text: queryText
        });
        return response.data.answer;
    } catch (error) {
        console.error("Connection Error:", error);
        return "Server se connect nahi ho pa raha hai.";
    }
};