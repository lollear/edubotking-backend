// server.js (Volvemos a generate() para evitar el error de formateo del chat)

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { CohereClient } from "cohere-ai"; // V7.x

// 1. Get the API Key from environment variables (igual).
const COHERE_KEY = process.env.COHERE_API_KEY || process.env.CO_API_KEY;
if (!COHERE_KEY) {
    console.error("FATAL ERROR: API Key is missing.");
    process.exit(1); 
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

const cohere = new CohereClient({
    apiKey: COHERE_KEY, 
});

console.log("API KEY:", COHERE_KEY ? "✅ Loaded and Ready" : "❌ Initialization Error");


// --- Root Endpoint ---
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "EdubotKing Backend Running 🚀" });
});

// --- Summary Endpoint (USANDO GENERATE() - La solución más robusta) ---
app.post("/summary", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ summary: "Error: No text provided." });
    }

    // LLAMADA A LA API USANDO GENERATE (evitando el error de formato del chat)
    const response = await cohere.generate({
      model: "command-light", // Usamos un modelo que sabemos que tu cuenta acepta
      prompt: `Please summarize the following text in Spanish: ${text}`,
      maxTokens: 300,
      temperature: 0.2,
    });

    // ACCESO A LA RESPUESTA (generate usa generations[0].text)
    const summary = response.generations[0].text.trim();
    
    // Send the successful response
    return res.json({ summary });

  } catch (error) {
    // Si obtenemos el error de "Generate API was removed...", sabremos que Cohere lo bloqueó.
    const errorMessage = error?.message || "Unknown error during Cohere API call.";
    
    console.error("COHERE ERROR:", error.response?.data || errorMessage);
    
    res.status(500).json({ 
      summary: "Error generating summary (Using Generate).", 
      detail: errorMessage 
    });
  }
});

// --- Server Start ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
