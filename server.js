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

    if (!text || text.trim().length < 3) {
      return res.status(400).json({ error: "Text too short to summarize" });
    }

    const response = await fetch("https://api.cohere.com/v1/chat", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.COHERE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "command-r",
        message: `Summarize this text in clear English:\n\n${text}`
      })
    });

    const data = await response.json();
    console.log("COHERE RAW:", JSON.stringify(data, null, 2));

    // 🔥 Nueva forma correcta de acceder al texto
    const summary =
      data.text ||
      data.message ||
      data.response ||
      data.output ||
      "No summary generated.";

    return res.json({ summary });

  } catch (error) {
    console.error("ERROR:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto:", PORT);
});
