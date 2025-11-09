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
        model: "command-r",
        messages: [
          { role: "user", content: `Resuma este texto de forma clara y concisa:\n\n${text}` }
        ]
      })
    });

    const data = await response.json();

    // PARA REVISAR LA RESPUESTA DEL MODELO
    console.log("COHERE RESPONSE:", JSON.stringify(data, null, 2));

    const summary = data.message?.content?.[0]?.text || "No summary generated.";

    res.json({ summary });

  } catch (error) {
    console.error("ERROR in /summarize:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


    const data = await response.json();
    console.log("COHERE RESPONSE:", JSON.stringify(data, null, 2)); // 👈 Debug para ver respuesta real

    // ✅ Nuevo formato correcto
    let summary = data.message?.content?.[0]?.text || "No summary generated.";

    res.json({ summary });

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto:", PORT);
});
