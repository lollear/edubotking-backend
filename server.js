import express from "express";
import cors from "cors";

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

// 🚀 Endpoint para resumir texto con Cohere
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
        format: "paragraph",
        model: "summarize-xlarge"
      })
    });

    const data = await response.json();
    res.json({ result: data.summary });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something broke" });
  }
});

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto:", PORT);
});
