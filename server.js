import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import CohereClient from "cohere-ai";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// =======================
/////  INSERTA TU KEY  ////
// =======================
const cohere = new CohereClient({
  apiKey: 17511zHi9k3mu25rOX7OY9hkJ7LOh4UjCtHS8dgP,
});

// Ruta principal para resumir texto
app.post("/summary", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.json({ summary: "No text provided." });
    }

    const response = await cohere.generate({
      model: "command-r-plus",
      prompt: `Summarize the following text in clear, concise English:\n\n${text}\n\nSummary:`,
      max_tokens: 250,
      temperature: 0.4,
    });

    const summary = response.generations?.[0]?.text?.trim() || "No summary generated.";

    res.json({ summary });
  } catch (error) {
    console.error("Error:", error);
    res.json({ summary: "Error generating summary." });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
