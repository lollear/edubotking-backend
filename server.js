import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { CohereClient } from "cohere-ai";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ========= AQUI PONES TU KEY =========
const cohere = new CohereClient({
  apiKey: process.env.COHERE_API_KEY, 
});

// ✅ Ruta principal (solo para probar que corre)
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "EdubotKing Backend Running 🚀" });
});

// ✅ Ruta de resumen
app.post("/summary", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.json({ summary: "No text provided." });
    }

    const response = await cohere.generate({
      model: "command",
      prompt: `Summarize the following text in clear English:\n\n${text}\n\nSummary:`,
      max_tokens: 250,
      temperature: 0.4,
    });

    const summary = response.generations?.[0]?.text?.trim() || "No summary generated.";
    res.json({ summary });
  } catch (error) {
    console.error("ERROR:", error);
    res.json({ summary: "Error generating summary." });
  }
});

// ✅ Encender servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
