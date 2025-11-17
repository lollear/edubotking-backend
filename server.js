import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";  // Para manejar la subida de archivos
import pdf from "pdf-parse";  // Para extraer texto del PDF

// ----------------------------------------------------
// URL del endpoint de CHAT de Cohere
const COHERE_API_URL = "https://api.cohere.ai/v1/chat"; 
// ----------------------------------------------------

// 1. Get the API Key from environment variables.
const COHERE_KEY = process.env.COHERE_API_KEY || process.env.CO_API_KEY;

// Fail fast if the key is not available
if (!COHERE_KEY) {
    console.error("FATAL ERROR: API Key is missing. Please set either COHERE_API_KEY or CO_API_KEY in Render.");
    process.exit(1); 
}

// 2. Configuración de Multer para almacenar archivos en memoria (Buffer)
// Esto es crucial para Render, que no tiene acceso persistente al disco.
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // Límite de 10MB para el PDF
}); 

// Initialize the Express application
const app = express();

// Middleware setup
app.use(cors());
// body-parser ya no es estrictamente necesario para el endpoint de PDF, 
// pero se mantiene por si acaso
app.use(bodyParser.json()); 

console.log("API KEY:", COHERE_KEY ? "✅ Loaded and Ready" : "❌ Initialization Error");

// --- Root Endpoint ---
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "EdubotKing Backend Running 🚀" });
});

// --- Summary Endpoint (Manejo de PDF) ---
// Usamos 'upload.single' para esperar un archivo llamado 'pdfFile'
app.post("/summary", upload.single('pdfFile'), async (req, res) => {
  try {
    const userPrompt = "Summarize the following text in Spanish:\n\n";

    // 1. Manejo y Validación de Archivo
    const pdfFile = req.file;

    if (!pdfFile || pdfFile.mimetype !== 'application/pdf') {
      return res.status(400).json({ summary: "Error: No se encontró un archivo PDF válido.", detail: "Asegúrate de enviar un archivo con el nombre de campo 'pdfFile'." });
    }
    
    // 2. Extracción de Texto del PDF
    // pdfFile.buffer contiene los datos binarios del archivo
    const data = await pdf(pdfFile.buffer);
    const extractedText = data.text; // Este es todo el texto del PDF

    if (!extractedText || extractedText.trim() === "") {
        return res.status(400).json({ summary: "Error: El archivo PDF está vacío o no tiene texto legible." });
    }
    
    // 3. Preparación del Payload
    const textToSummarize = extractedText;
    
    const payload = {
      model: "command-a-03-2025", // <-- ¡Tu modelo funcional!
      messages: [ 
        { 
          role: "USER", 
          message: `${userPrompt}${textToSummarize}` 
        } 
      ],
      // Campo redundante para compatibilidad con el error de Cohere
      message: `${userPrompt}${textToSummarize}`
    };
    
    // 4. Solicitud FETCH a Cohere
    const fetchResponse = await fetch(COHERE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COHERE_KEY}` 
      },
      body: JSON.stringify(payload)
    });

    const cohereData = await fetchResponse.json();

    if (!fetchResponse.ok) {
        throw new Error(`Cohere API Error: ${cohereData.message || fetchResponse.statusText}`);
    }

    // 5. Devolver el resumen
    const summary = cohereData.text ? cohereData.text.trim() : "No text generated.";
    
    return res.json({ summary });

  } catch (error) {
    const errorMessage = error?.message || "Unknown error during processing.";
    
    console.error("PDF/COHERE ERROR:", errorMessage);
    
    res.status(500).json({ 
      summary: "Error al procesar el PDF.", 
      detail: errorMessage 
    });
  }
});

// --- Server Start ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
// --- Server Start ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
