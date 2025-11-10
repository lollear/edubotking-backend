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

// --- Summary Endpoint (TEMPORAL) ---
app.post("/summary", async (req, res) => {
  try {
    // ESTA ES LA PRUEBA. Devuelve una respuesta fija sin llamar a Cohere.
    const { text } = req.body;
    
    // Si esta parte funciona y devuelve el JSON, el problema es SÍ O SÍ la librería cohere.
    return res.json({ summary: `Test successful: Received ${text.length} characters.` });

  } catch (error) {
    // Si la llamada falla aquí, el problema es Express o Body Parser.
    console.error("TEST ERROR:", error.message);
    res.status(500).json({ summary: "Internal Server Test Error" });
  }
});

// ... (el resto del código se mantiene igual)
// --- Server Start ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
