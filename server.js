import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { CohereClient } from "cohere-ai";

// 1. STICKT CHECK: Get the API Key from environment variables.
const COHERE_KEY = process.env.COHERE_API_KEY;

// Fail fast if the key is not available
if (!COHERE_KEY) {
    console.error("FATAL ERROR: COHERE_API_KEY is missing. Please set it in your environment (e.g., Render).");
    // Exits the process if the crucial variable is missing
    process.exit(1); 
}

// Initialize the Express application
const app = express();

// Middleware setup
app.use(cors());
app.use(bodyParser.json());

// 2. INITIALIZATION: Initialize Cohere Client by passing the key directly
const cohere = new CohereClient({
    // Pass the value directly. No quotes needed here.
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
    // CORRECTION: Access the generated text via 'response.text'
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
