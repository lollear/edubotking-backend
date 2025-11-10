import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import * as cohereai from "cohere-ai"; // Importa todo como 'cohereai'

const CohereClient = cohereai.CohereClient; // Extrae el cliente de lo importado

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

// Inicialización del cliente (se mantiene igual, usa CohereClient)
const cohere = new CohereClient({
    apiKey: COHERE_KEY, 
});
// --- Root Endpoint ---
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "EdubotKing Backend Running 🚀" });
});
// server.js

// ... (Todos los imports y la inicialización de cohereClient permanecen igual) ...

// --- Summary Endpoint (VERSIÓN CON COHERE-AI V6.x) ---
app.post("/summary", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ summary: "Error: No text provided." });
    }

    // LLAMADA A LA API usando cohere.chat (para V6.x)
    const response = await cohere.chat({
      // El modelo 'command-r' no existía en v6.x, ¡usaremos el modelo 'command'!
      model: "command", 
      message: `Summarize this text in Spanish:\n\n${text}` // V6.x usa 'message', no 'messages'
    });

    // ACCESO A LA RESPUESTA: Sintaxis correcta para V6.x
    // Es response.generations[0].text o response.text. ¡Probaremos el más simple!
    const summary = response.text ? response.text.trim() : "No text generated."; 
    
    // Si la línea de arriba falla, prueba: const summary = response.generations[0].text.trim();
    
    return res.json({ summary });

  } catch (error) {
    const errorMessage = error?.message || "Unknown error during Cohere API call.";
    console.error("COHERE ERROR:", error.response?.data || errorMessage);
    
    res.status(500).json({ 
      summary: "Error generating summary (Downgrade Failed).", 
      detail: errorMessage 
    });
  }
});
// --- Server Start ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
