import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import pdf from "pdf-parse";

// ----------------------------------------------------
// API Endpoints
const COHERE_API_URL = "https://api.cohere.ai/v1/chat";
const GEMINI_TTS_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent";
// ----------------------------------------------------

// 1. Get API Keys from environment variables.
const COHERE_KEY = process.env.COHERE_API_KEY || process.env.CO_API_KEY;
// We will use COHERE_KEY for the Gemini TTS call.
const API_KEY = COHERE_KEY; 

// Fail fast if the key is not available
if (!API_KEY) {
    console.error("FATAL ERROR: API Key is missing. Please set COHERE_API_KEY or CO_API_KEY in Render.");
    process.exit(1);
}

// 2. Multer configuration: Store file in memory (buffer)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // Max 10MB PDF
}); 

// Initialize the Express application
const app = express();

// Middleware setup
app.use(cors());
app.use(bodyParser.json()); 

console.log("API KEY Status:", API_KEY ? "✅ Loaded and Ready" : "❌ Initialization Error");

// --- Root Endpoint ---
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "EdubotKing Backend Running 🚀" });
});

// ------------------------------------------------------------------
// 🚀 ENDPOINT 1: PDF UPLOAD AND COHERE SUMMARY GENERATION
// ------------------------------------------------------------------
app.post("/summary", upload.single('pdfFile'), async (req, res) => {
  try {
    const userPrompt = "Summarize the following text in English:\n\n";

    // 1. File Validation
    const pdfFile = req.file;
    if (!pdfFile || pdfFile.mimetype !== 'application/pdf') {
      return res.status(400).json({ summary: "Error: Invalid PDF file provided.", detail: "Please upload a valid PDF file with field name 'pdfFile'." });
    }
    
    // 2. Text Extraction
    const data = await pdf(pdfFile.buffer);
    const extractedText = data.text; 

    if (!extractedText || extractedText.trim() === "") {
        return res.status(400).json({ summary: "Error: The PDF is empty or illegible." });
    }
    
    // 3. Cohere Payload (Using your confirmed functional model)
    const textToSummarize = extractedText;
    const fullPrompt = `${userPrompt}${textToSummarize}`;
    
    const payload = {
      model: "command-a-03-2025",
      messages: [ 
        { role: "USER", message: fullPrompt } 
      ],
      message: fullPrompt // Redundant field for compatibility
    };
    
    // 4. Fetch Request to Cohere
    const fetchResponse = await fetch(COHERE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}` 
      },
      body: JSON.stringify(payload)
    });

    const cohereData = await fetchResponse.json();

    if (!fetchResponse.ok) {
        throw new Error(`Cohere API Error: ${cohereData.message || fetchResponse.statusText}`);
    }

    // 5. Return Summary
    const summary = cohereData.text ? cohereData.text.trim() : "No text generated.";
    
    return res.json({ summary });

  } catch (error) {
    const errorMessage = error?.message || "Unknown processing error.";
    console.error("PDF/COHERE ERROR:", errorMessage);
    
    res.status(500).json({ 
      summary: "Error processing the PDF and generating summary.", 
      detail: errorMessage 
    });
  }
});

// ------------------------------------------------------------------
// 🗣️ ENDPOINT 2: TEXT-TO-SPEECH (TTS) - THE PAID SERVICE
// ------------------------------------------------------------------
app.post("/audio-summary", async (req, res) => {
    // ⚠️ FUTURE GATING LOGIC: Add Firebase/Stripe check here to ensure the user is premium.
    
    try {
        const { summaryText } = req.body; // Expects the generated summary text

        if (!summaryText || summaryText.trim() === "") {
            return res.status(400).json({ detail: "Error: No summary text provided for TTS." });
        }

        // Payload for Gemini TTS (uses Kore voice - Firm)
        const payload = {
            contents: [{
                parts: [{ text: summaryText }]
            }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: "Kore" }
                    }
                }
            },
            model: "gemini-2.5-flash-preview-tts"
        };

        // Fetching TTS from Gemini
        // We use the same API_KEY here.
        const fetchResponse = await fetch(`${GEMINI_TTS_API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await fetchResponse.json();

        if (!fetchResponse.ok) {
            throw new Error(`Gemini TTS Error: ${data.message || fetchResponse.statusText}`);
        }

        const audioPart = data.candidates?.[0]?.content?.parts?.[0];
        
        if (!audioPart || !audioPart.inlineData) {
            return res.status(500).json({ detail: "Error: TTS generation failed to return audio data." });
        }

        // Send back the base64 audio data and the MIME type (which contains the sample rate)
        // The client (React) will decode this and play the audio.
        res.json({ 
            audioData: audioPart.inlineData.data, 
            mimeType: audioPart.inlineData.mimeType 
        });

    } catch (error) {
        console.error("TTS GENERATION ERROR:", error.message);
        res.status(500).json({ 
            detail: `TTS Generation Error: ${error.message}` 
        });
    }
});


// --- Server Start ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
