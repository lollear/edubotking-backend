// server.js (Volvemos a Chat, pero asegurando una inicialización limpia)

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
// Versión V7.x (Asegúrate de tener "type": "module" en package.json)
import { CohereClient } from "cohere-ai"; 

// 1. Get the API Key from environment variables.
const COHERE_KEY = process.env.COHERE_API_KEY || process.env.CO_API_KEY;

// Fail fast if the key is not available
if (!COHERE_KEY) {
    console.error("FATAL ERROR: API Key is missing.");
    process.exit(1); 
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 2. Initialize Cohere Client (LA ÚNICA FORMA QUE DEBE FUNCIONAR)
// Nota: La librería de Cohere ya debe tomar la clave de process.env, 
// pero la pasamos explícitamente por si acaso.
const cohere = new CohereClient({
    apiKey: COHERE_KEY, 
});

console.log("API KEY:", COHERE_KEY ? "✅ Loaded and Ready" : "❌ Initialization Error");


// --- Root Endpoint ---
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "EdubotKing Backend Running 🚀" });
});

// --- Summary Endpoint (USANDO CHAT() CON SINTAXIS MODERNA) ---
app.post("/summary", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ summary: "Error: No text provided." });
    }

    // LLAMADA A LA API CON SINTAXIS MODERNA (V7.x)
    const response = await cohere.chat({
      model: "command-light", // Usamos el modelo más básico
      messages: [ 
        { role: "user", content: `Summarize this text in Spanish:\n\n${text}` } 
      ]
    });

    // ACCESO A LA RESPUESTA
    const summary = response.text ? response.text.trim() : "No text generated."; 
    
    // Send the successful response
    return res.json({ summary });

  } catch (error) {
    // Manejo de errores 
    const errorMessage = error?.message || "Unknown error during Cohere API call.";
    
    console.error("COHERE ERROR:", error.response?.data || errorMessage);
    
    res.status(500).json({ 
      summary: "Error generating summary (Final Check V7 - Chat Fail).", 
      detail: errorMessage 
    });
  }
});

// --- Server Start ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
