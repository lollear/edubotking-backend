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
// --- Summary Endpoint (CORRECCIÓN FINAL DEFINITIVA) ---
app.post("/summary", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ summary: "Error: No text provided." });
    }

    // LLAMADA A LA API usando cohere.chat
    const response = await cohere.chat({
      model: "command-r",
      messages: [
        { role: "user", content: `Summarize this text in Spanish:\n\n${text}` } 
      ]
    });

    // ACCESO A LA RESPUESTA: Forzamos la sintaxis que tu error solicita.
    // Aunque la versión 7.7.5 debería usar response.text, el error indica 
    // que necesita la propiedad 'message'.
    const summary = response.message.text.trim(); 
    
    // Si la línea de arriba se ejecuta sin error, la respuesta se envía aquí.
    return res.json({ summary });

  } catch (error) {
    // Si falla la línea de 'response.message.text', el error es capturado aquí
    // y enviado al frontend para diagnóstico.
    const errorMessage = error?.message || "Unknown error during Cohere API call.";
    
    // Si ves 'Cannot read properties of undefined (reading 'text')', significa 
    // que 'response.message' es undefined.
    console.error("COHERE ERROR:", error.response?.data || errorMessage);
    
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
