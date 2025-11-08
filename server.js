import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const COHERE_API_KEY = process.env.COHERE_API_KEY;

app.post("/summarize", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) return res.status(400).json({ error: "No text provided" });

    const response = await fetch("https://api.cohere.ai/v1/chat", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${COHERE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "command-r-plus",
        message: `Resume este texto en un párrafo claro y sencillo:\n\n${text}`
      })
    });

    const data = await response.json();

    return res.json({
      summary: data.text || "No summary generated."
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error summarizing text" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ Server running on port", PORT));
