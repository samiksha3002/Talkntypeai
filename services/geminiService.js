import { askGemini } from "../services/geminiService.js";

router.post("/", async (req, res) => {
  const { messages, provider } = req.body; // provider = "openai" or "gemini"
  ...
  let aiReply;
  if (provider === "openai") {
    aiReply = await askOpenAI(messages);
  } else {
    aiReply = await askGemini(messages);
  }
  res.json({ reply: aiReply });
});
