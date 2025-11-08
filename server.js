import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ✅ Ruta principal
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "EdubotKing Backend Running 🚀"
  });
});

// ✅ Nueva ruta correcta para resumir
app.post("/summarize", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "No text provided" });
    }

    const response = await fetch("https://api.cohere.com/v1/chat", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.COHERE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "command-r-plus",
        messages: [
          { role: "user", content: `Resume el siguiente texto de forma clara y corta:\n\n${text}` }
        ]
      })
    });

    const data = await response.json();
    console.log("COHERE RESPONSE:", data);

    if (!data.text) {
      return res.json({ summary: "No summary generated." });
    }

    res.json({ summary: data.text });

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Levantar servidor
app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto:", PORT);
});
