from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import cohere
import os

# Cargar API KEY desde variables de entorno
CO_API_KEY = os.getenv("CO_API_KEY")

if not COHERE_API_KEY:
    raise ValueError("⚠️ Falta la variable de entorno COHERE_API_KEY")

co = cohere.Client(CO_API_KEY)

app = FastAPI()

# Permitir que el frontend se conecte
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "ok", "message": "EdubotKing Backend Running 🚀"}

@app.post("/summarize")
async def summarize_text(text: str = Form(...)):
    """
    Resumir texto enviado desde formulario.
    """
    response = co.summarize(
        text=text,
        length="medium",
        format="paragraph",
        model="command"
    )

    return {"summary": response.summary}

