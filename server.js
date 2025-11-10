// server.js (Versión CommonJS, ajuste final de constructor)

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
// ----------------------------------------------------
// Importamos el paquete completo como objeto.
const CoherePackage = require("cohere-ai"); 

// CORRECCIÓN DEFINITIVA: Intentamos acceder a la clase de la manera más exhaustiva posible.
// Si el paquete exporta un objeto con una propiedad CohereClient, la usamos.
// Si el paquete es la clase misma o la tiene en .default, la usamos.
const CohereClient = CoherePackage.CohereClient || CoherePackage.default || CoherePackage; 
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
const cohere = new CohereClient({ // Línea 32: Debería funcionar con el constructor correcto
    apiKey: COHERE_KEY, 
});

console.log("API KEY:", COHERE_KEY ? "✅ Loaded and Ready" : "❌ Initialization Error");


// --- Root Endpoint ---
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "EdubotKing Backend Running 🚀" });
});

// --- Summary Endpoint (VERSIÓN CON COHERE-AI V6.x) ---
app.post("/summary", async (req, res) => {
  try {
    const { text } = req.body;

    // Input validation
    if (!text || text.trim() === "") {
      return res.status(400).json({ summary: "Error: No text provided." });
    }

    // LLAMADA A LA API CON SINTAXIS V6.x
    const response = await cohere.chat({
      model: "command", // Modelo compatible con V6.x 
      message: `Summarize this text in Spanish:\n\n${text}` // 'message' en singular
    });

    // ACCESO A LA RESPUESTA: Sintaxis más compatible con V6.x
    const summary = response.text ? response.text.trim() : "No text generated."; 
    
    // Send the successful response
    return res.json({ summary });

  } catch (error) {
    // Enhanced error handling
    const errorMessage = error?.message || "Unknown error during Cohere API call.";
    
    console.error("COHERE ERROR:", error.response?.data || errorMessage);
    
    // Send a 500 Internal Server Error response
    res.status(500).json({ 
      summary: "Error generating summary (Final Attempt).", 
      detail: errorMessage 
    });
  }
});

// --- Server Start ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
