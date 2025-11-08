import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "EdubotKing Backend Running 🚀"
  });
});

app.post("/summarize", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    const response = await fetch("https://api.cohere.com/v1/summarize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.COHERE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: text,
        length: "medium",
        format: "paragraph"
      })
    });

    const data = await response.json();
    return res.json({ result: data.summary });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => console.log("Servidor corriendo en puerto:", PORT));
