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

    const response = await fetch("https://api.cohere.ai/v1/summarize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${COHERE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: text,
        length: "medium"
      })
    });

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error summarizing text" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
