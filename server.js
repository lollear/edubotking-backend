// server.js (USANDO FETCH y el endpoint /v1/generate para máxima compatibilidad)

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
// Ya no necesitamos importar la librería 'cohere-ai'

// ----------------------------------------------------
// URL del endpoint de GENERATE de Cohere
const COHERE_API_URL = "https://api.cohere.ai/v1/generate";
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

// No necesitamos inicializar el cliente Cohere.

console.log("API KEY:", COHERE_KEY ? "✅ Loaded and Ready" : "❌ Initialization Error");


// --- Root Endpoint ---
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "EdubotKing Backend Running 🚀" });
});

// --- Summary Endpoint (USANDO FETCH Y GENERATE) ---
app.post("/summary", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ summary: "Error: No text provided." });
    }

    // 1. DEFINIMOS EL CUERPO JSON (El formato simple que la API de GENERATE espera)
    const payload = {
      model: "command", 
      prompt: `Summarize the following text in Spanish: ${text}`, // Usa el campo 'prompt'
      max_tokens: 300,
      temperature: 0.2
    };
    
    // 2. HACEMOS LA SOLICITUD FETCH
    const fetchResponse = await fetch(COHERE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COHERE_KEY}` 
      },
      body: JSON.stringify(payload)
    });

    const data = await fetchResponse.json();

    // Manejo de errores de la API 
    if (!fetchResponse.ok) {
        throw new Error(`Cohere API Error: ${data.message || fetchResponse.statusText}`);
    }

    // 3. ACCESO A LA RESPUESTA (Generate usa generations[0].text)
    const summary = data.generations[0].text.trim();
    
    // Send the successful response
    return res.json({ summary });

  } catch (error) {
    // Enhanced error handling
    const errorMessage = error?.message || "Unknown error during Cohere API call.";
    
    console.error("COHERE ERROR:", errorMessage);
    
    res.status(500).json({ 
      summary: "Error generating summary (Final Fetch Attempt - Failed).", 
      detail: errorMessage 
    });
  }
});

// --- Server Start ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
