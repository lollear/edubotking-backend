import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { CohereClient } from "cohere-ai";

// Initialize the Express application
const app = express();

// Middleware setup
app.use(cors());
app.use(bodyParser.json());

// Initialize Cohere Client
// Uses the environment variable COHERE_API_KEY
const cohere = new CohereClient({
  apiKey: process.env.COHERE_API_KEY, 
});

// Check if the API key is loaded
console.log("API KEY:", process.env.COHERE_API_KEY ? "✅ Loaded" : "❌ NOT Loaded");

// --- Root Endpoint ---
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "EdubotKing Backend Running 🚀" });
});

// --- Summary Endpoint (The corrected part) ---
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
        // NOTE: The prompt explicitly asks for the summary "in Spanish" 
        // as per your requirement ("en el codigo nuesro chat si español")
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
