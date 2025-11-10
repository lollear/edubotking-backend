import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
// ----------------------------------------------------
// CORRECCIÓN FINAL DE IMPORTACIÓN para COHERE-AI V6.x (CommonJS)
// Importamos el paquete completo y asumimos que la clase constructora
// es el export por defecto (pkg.default) o el objeto raíz (pkg).
import pkg from 'cohere-ai';
const CohereClient = pkg.default || pkg; 
// ----------------------------------------------------

// 1. Get the API Key from environment variables.
const COHERE_KEY = process.env.COHERE_API_KEY || process.env.CO_API_KEY;

// Fail fast if the key is not available
if (!COHERE_KEY) {
    console.error("FATAL ERROR: API Key is missing. Please set either COHERE_API_KEY or CO_API_KEY in Render.");
    // Detiene la aplicación para evitar el error de constructor
    process.exit(1); 
}

// Initialize the Express application
const app = express();

// Middleware setup
app.use(cors());
app.use(bodyParser.json());

// 2. Initialize Cohere Client (AHORA DEBE FUNCIONAR)
const cohere = new CohereClient({
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

//--- Server Start ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
