import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { CohereClient } from "cohere-ai";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const cohere = new CohereClient({
  apiKey: process.env.COHERE_API_KEY, // <-- ESTE NOMBRE debe ser igual en Render
});
console.log("API KEY:", process.env.COHERE_API_KEY ? "✅ Cargada" : "❌ NO Cargada");

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "EdubotKing Backend Running 🚀" });
});

app.post("/summary", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.json({ summary: "No text provided." });
    }

    const response = await cohere.chat({
      model: "command-r",
      messages: [
        { role: "user", content: `Summarize this text:\n\n${text}` }
      ]
    });

    const summary = response.message.content[0].text.trim();
    res.json({ summary });

  } catch (error) {
    console.error("COHERE ERROR:", error?.response?.data || error);
    res.json({ summary: "Error generating summary." });
  }
});
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
