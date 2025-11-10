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

// --- Summary Endpoint ---
app.post("/summary", async (req, res) => {
  try {
    const { text } = req.body;

    // Input validation
    if (!text || text.trim() === "") {
      return res.status(400).json({ summary: "Error: No text provided." });
    }

    // Call the Cohere API
    const response = await cohere.chat({
      model: "command-r",
      messages: [
        { role: "user", content: `Summarize this text in Spanish:\n\n${text}` } 
      ]
    });

    // Extract the summary text
    // CORRECTED: Access the generated text via 'response.text'
    const summary = response.text ? response.text.trim() : "No text generated.";
    
    // Send the successful response
    res.json({ summary });

  } catch (error) {
    // Enhanced error handling
    const errorMessage = error?.message || "Unknown error during Cohere API call.";
    
    console.error("COHERE ERROR:", errorMessage);
    
    // Send a 500 Internal Server Error response
    res.status(500).json({ 
      summary: "Error generating summary.", 
      detail: errorMessage 
    });
  }
});

// --- Server Start ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
