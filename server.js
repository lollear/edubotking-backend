import express from "express";
import cors from "cors";
import { CohereClient } from "cohere-ai";

const app = express();
app.use(cors());
app.use(express.json());

// =======================
//  INSERTA TU API KEY AQUÍ
// =======================
const cohere = new CohereClient({
  apiKey: "17511zHi9k3mu25rOX7OY9hkJ7LOh4UjCtHS8dgP",
});

// Ruta para resumir texto
app.post("/summarize", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.json({ summary: "No text provided." });
    }

    const response = await cohere.generate({
      model: "command-r-plus",
      prompt: `Summarize the following text in clear Spanish:\n\n${text}\n\nResumen:`,
      max_tokens: 200,
      temperature: 0.4,
    });

    const summary = response.generations?.[0]?.text?.trim() || "No summary generated.";
    res.json({ summary });

  } catch (error) {
    console.error("COHERE ERROR:", error);
    res.json({ summary: "Error generating summary." });
  }
});

// Run server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
