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
// server.js

// ... (El código anterior permanece igual) ...

// --- Summary Endpoint (CAMBIO DE MODELO) ---
app.post("/summary", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ summary: "Error: No text provided." });
    }

    // 1. LLAMADA A LA API con el modelo más básico y estable
    const response = await cohere.chat({
      model: "command-light", // <--- ¡AQUÍ ESTÁ EL CAMBIO CLAVE!
      messages: [ 
        { role: "user", content: `Summarize this text in Spanish:\n\n${text}` } 
      ]
    });

    // 2. ACCESO A LA RESPUESTA
    const summary = response.text ? response.text.trim() : "No text generated."; 
    
    // Send the successful response
    return res.json({ summary });

  } catch (error) {
    // Manejo de errores 
    const errorMessage = error?.message || "Unknown error during Cohere API call.";
    
    console.error("COHERE ERROR:", error.response?.data || errorMessage);
    
    res.status(500).json({ 
      summary: "Error generating summary (Final Check V7 - Model Fail).", 
      detail: errorMessage 
    });
  }
});

// ... (El resto del código) ...
// --- Server Start ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
