// server.js (Usando FETCH para evitar bugs de la librería Cohere-ai)

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
// ¡Ya no necesitamos importar CohereClient!

// ----------------------------------------------------
// URL del endpoint de CHAT de Cohere (V3)
const COHERE_API_URL = "https://api.cohere.ai/v1/chat";
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

// --- Summary Endpoint (USANDO FETCH) ---
app.post("/summary", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ summary: "Error: No text provided." });
    }

    // 1. DEFINIMOS EL CUERPO JSON (EL FORMATO CORRECTO QUE EVITA EL ERROR)
    const payload = {
      model: "command-light", // Usamos el modelo estable
      messages: [ 
        { 
          role: "USER", // Roles en mayúsculas a veces son más compatibles
          message: `Summarize this text in Spanish:\n\n${text}` // Nota: Usamos 'message' en lugar de 'content' por si acaso.
        } 
      ],
      // Forzar que el campo 'message' esté presente en el objeto messages
    };
    
    // 2. HACEMOS LA SOLICITUD FETCH
    const fetchResponse = await fetch(COHERE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Autenticación Bearer Token (la forma que probamos que funciona)
        'Authorization': `Bearer ${COHERE_KEY}` 
      },
      body: JSON.stringify(payload)
    });

    const data = await fetchResponse.json();

    // Manejo de errores de la API (si el status no es 200)
    if (!fetchResponse.ok) {
        throw new Error(`Cohere API Error: ${data.message || fetchResponse.statusText}`);
    }

    // 3. ACCESO A LA RESPUESTA (Directamente del JSON, sin librería SDK)
    const summary = data.text ? data.text.trim() : "No text generated."; 
    
    // Send the successful response
    return res.json({ summary });

  } catch (error) {
    // Enhanced error handling
    const errorMessage = error?.message || "Unknown error during Cohere API call.";
    
    console.error("COHERE ERROR:", errorMessage);
    
    res.status(500).json({ 
      summary: "Error generating summary (Final Fetch Attempt).", 
      detail: errorMessage 
    });
  }
});

// --- Server Start ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
