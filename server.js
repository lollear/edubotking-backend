// server.js (Último y Definitivo Intento con el endpoint /v1/chat)

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

// ----------------------------------------------------
// URL del endpoint de CHAT de Cohere
const COHERE_API_URL = "https://api.cohere.ai/v1/chat"; // <--- ¡Volvemos a CHAT!
// ----------------------------------------------------

// 1. Get the API Key from environment variables.
const COHERE_KEY = process.env.COHERE_API_KEY || process.env.CO_API_KEY;

if (!COHERE_KEY) {
    console.error("FATAL ERROR: API Key is missing.");
    process.exit(1); 
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

console.log("API KEY:", COHERE_KEY ? "✅ Loaded and Ready" : "❌ Initialization Error");

// --- Root Endpoint ---
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "EdubotKing Backend Running 🚀" });
});

// --- Summary Endpoint (USANDO FETCH Y CHAT CON FORMATO ANTIGUO) ---
app.post("/summary", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ summary: "Error: No text provided." });
    }

    // 1. DEFINIMOS EL CUERPO JSON (Con la sintaxis que el error "message" pide)
    const payload = {
      model: "command", // Modelo estable
      messages: [ 
        { 
          role: "USER", 
          // ¡USAMOS 'message' porque es lo que el error siempre ha pedido!
          message: `Summarize the following text in Spanish:\n\n${text}` 
        } 
      ],
      // Forzamos el uso de la propiedad "message" en el objeto principal, 
      // si el endpoint es muy antiguo y lo requiere
      // message: `Summarize the following text in Spanish:\n\n${text}`, 
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

    // 3. ACCESO A LA RESPUESTA
    const summary = data.text ? data.text.trim() : "No text generated.";
    
    // Send the successful response
    return res.json({ summary });

  } catch (error) {
    const errorMessage = error?.message || "Unknown error during Cohere API call.";
    
    console.error("COHERE ERROR:", errorMessage);
    
    res.status(500).json({ 
      summary: "Error generating summary (Final Chat Attempt).", 
      detail: errorMessage 
    });
  }
});

// --- Server Start ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
