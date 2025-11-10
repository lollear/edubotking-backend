// server.js (Versión ES Modules compatible con cohere-ai@7.x)

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
// ----------------------------------------------------
// Importación Moderna para cohere-ai V7.x
import { CohereClient } from "cohere-ai"; 
// ----------------------------------------------------

// 1. Get the API Key from environment variables.
const COHERE_KEY = process.env.COHERE_API_KEY || process.env.CO_API_KEY;

// Fail fast if the key is not available
if (!COHERE_KEY) {
    console.error("FATAL ERROR: API Key is missing. Please set either COHERE_API_KEY or CO_API_KEY in Render.");
    process.exit(1); 
}

// Initialize the Express application
const app = express();

// Middleware setup
app.use(cors());
app.use(bodyParser.json());

// 2. Initialize Cohere Client 
const cohere = new CohereClient({
    apiKey: COHERE_KEY, 
});

console.log("API KEY:", COHERE_KEY ? "✅ Loaded and Ready" : "❌ Initialization Error");


// --- Root Endpoint ---
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "EdubotKing Backend Running 🚀" });
});

// --- Summary Endpoint (Sintaxis V7.x - La original que falló por el API key) ---
app.post("/summary", async (req, res) => {
  try {
    const { text } = req.body;

    // Input validation
    if (!text || text.trim() === "") {
      return res.status(400).json({ summary: "Error: No text provided." });
    }

    // LLAMADA A LA API CON SINTAXIS V7.x
    const response = await cohere.chat({
      model: "command-r", // Modelo moderno
      messages: [ // 'messages' plural y array
        { role: "user", content: `Summarize this text in Spanish:\n\n${text}` } 
      ]
    });

    // ACCESO A LA RESPUESTA: Sintaxis moderna y correcta
    const summary = response.text ? response.text.trim() : "No text generated."; 
    
    // Send the successful response
    return res.json({ summary });

  } catch (error) {
    // Enhanced error handling
    const errorMessage = error?.message || "Unknown error during Cohere API call.";
    
    console.error("COHERE ERROR:", error.response?.data || errorMessage);
    
    // Send a 500 Internal Server Error response
    res.status(500).json({ 
      summary: "Error generating summary (Reverted to V7).", 
      detail: errorMessage 
    });
  }
});

// --- Server Start ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
