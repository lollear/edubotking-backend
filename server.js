import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { CohereClient } from "cohere-ai";

// We check for the key you defined (COHERE_API_KEY) or the one Cohere's SDK prefers (CO_API_KEY).
// You must ensure at least one of these is set in Render.
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

// Initialize Cohere Client by passing the key explicitly
const cohere = new CohereClient({
    apiKey: COHERE_KEY, 
});

console.log("API KEY:", COHERE_KEY ? "✅ Loaded and Ready" : "❌ Initialization Error");


// --- Root Endpoint ---
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "EdubotKing Backend Running 🚀" });
});

// ... (todo el código de arriba se mantiene igual, incluyendo imports)

// server.js

// ... (Todos los imports y la inicialización de cohereClient permanecen igual) ...

// --- Summary Endpoint (CORREGIDO FINAL: Usando cohere.generate) ---
app.post("/summary", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ summary: "Error: No text provided." });
    }

    // 1. LLAMADA A LA API usando cohere.generate (más estable a veces que .chat)
    const response = await cohere.generate({
      model: "command-r", // Puedes probar con "command" si "command-r" sigue fallando
      prompt: `Summarize the following text in Spanish:\n\n${text}`,
      maxTokens: 300, // Límite de tokens para la respuesta
      temperature: 0.1, // Baja temperatura para un resumen más preciso
    });

    // 2. ACCESO A LA RESPUESTA
    // Para cohere.generate, el texto generado está en response.generations[0].text
    const summary = response.generations[0].text.trim();
    
    // Send the successful response
    res.json({ summary });

  } catch (error) {
    // Enhanced error handling
    const errorMessage = error?.message || "Unknown error during Cohere API call.";
    
    console.error("COHERE ERROR:", error.response?.data || errorMessage);
    
    // Send a 500 Internal Server Error response
    res.status(500).json({ 
      summary: "Error generating summary.", 
      // Si el error vuelve a ser el de Bearer, aparecerá aquí.
      detail: errorMessage 
    });
  }
});
// ... (el resto del código se mantiene igual)
// --- Server Start ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
