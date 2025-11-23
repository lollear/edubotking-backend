import os
import io
import time
import requests
import json
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader # Para extraer texto de PDFs
from typing import List, Dict, Any

# --- CONFIGURACIÓN DE FASTAPI ---
app = FastAPI(
    title="EdubotKing Gemini Backend",
    description="Servidor FastAPI para manejar la lógica de negocio y las interacciones con la API de Google Gemini (Resúmenes, Quizzes, TTS)."
)

# 🚨 CONFIGURACIÓN CORS: MUY IMPORTANTE
# Reemplaza el "*" con el dominio de tu frontend (ej: https://www.edubotking.com)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permite tu frontend. ¡Cámbialo en producción!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURACIÓN DE LA API KEY DE GEMINI ---
# La clave se debe configurar como variable de entorno en Render: GEMINI_API_KEY
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    # Esto garantiza que el despliegue falle si la clave no está presente.
    raise ValueError("La variable de entorno GEMINI_API_KEY no está configurada. Necesitas la clave de la API de Gemini.")

# --- CONSTANTES DE LA API DE GEMINI ---
GEMINI_FLASH_MODEL = "gemini-2.5-flash-preview-09-2025"
GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts"
GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

# --- ESTRUCTURAS DE DATOS (Pydantic) ---

# Esquema para la petición del Quiz y el Audio
class TextRequest(BaseModel):
    summaryText: str

# Esquema JSON para el Quiz (fuerza a Gemini a devolver el formato correcto)
QUIZ_SCHEMA = {
    "type": "ARRAY",
    "description": "Lista de 5 preguntas de opción múltiple con la respuesta correcta indicada.",
    "items": {
        "type": "OBJECT",
        "properties": {
            "question": {"type": "STRING", "description": "La pregunta del quiz."},
            "options": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
                "description": "Lista de 4 opciones de respuesta para la pregunta."
            },
            "answer": {"type": "STRING", "description": "La opción correcta (debe ser idéntica a una de las opciones)."}
        },
        "required": ["question", "options", "answer"]
    }
}


# --- FUNCIONES HELPER ---

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extrae texto de un PDF en bytes."""
    try:
        reader = PdfReader(io.BytesIO(file_content))
        text = ""
        for page in reader.pages:
            text += (page.extract_text() or "") + " " # Añade espacio para que las palabras no se peguen
        return text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fallo la extracción del texto del PDF: {e}")

def api_call_with_retry(model_name: str, payload: dict, max_retries: int = 3) -> dict:
    """Realiza una llamada POST a la API de Gemini con reintento exponencial."""
    url = f"{GEMINI_API_BASE_URL}/{model_name}:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    
    for i in range(max_retries):
        try:
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status() # Lanza excepción si el estado es 4xx o 5xx
            return response.json()
        except requests.exceptions.HTTPError as e:
            # Manejo de errores 429 (Rate Limit) y 503 (Servicio no disponible)
            if i < max_retries - 1 and e.response.status_code in [429, 503]:
                wait_time = 2 ** i
                print(f"Intento {i+1} fallido (Código: {e.response.status_code}). Reintentando en {wait_time}s...")
                time.sleep(wait_time)
            else:
                # Otros errores o último intento
                print(f"Error en la llamada a la API de Gemini: {e}")
                detail_message = e.response.json().get("error", {}).get("message", "Error desconocido de la API de Gemini")
                raise HTTPException(status_code=e.response.status_code, detail=f"Error en la API de Gemini: {detail_message}")
        except requests.exceptions.RequestException as e:
            # Errores de red
            print(f"Error de red/conexión: {e}")
            if i < max_retries - 1:
                wait_time = 2 ** i
                print(f"Intento {i+1} fallido (Red). Reintentando en {wait_time}s...")
                time.sleep(wait_time)
            else:
                raise HTTPException(status_code=500, detail=f"Error de red al conectar con la API de Gemini: {e}")
    
    raise HTTPException(status_code=500, detail="Fallo la llamada a la API después de múltiples reintentos.")

# ------------------------------------------------------------------
# 📚 ENDPOINT 1: GENERAR RESUMEN (Text Generation)
# ------------------------------------------------------------------
@app.post("/summary")
async def generate_summary(pdfFile: UploadFile = File(...)):
    """Genera un resumen detallado a partir del texto extraído de un PDF."""
    if pdfFile.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="El archivo debe ser un PDF.")
    
    # 1. Leer y extraer el texto del PDF
    file_content = await pdfFile.read()
    document_text = extract_text_from_pdf(file_content)
    
    if len(document_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="El PDF está vacío o no se pudo extraer suficiente texto legible.")

    # 2. Prompts para el modelo
    system_prompt = (
        "Actúa como un profesor experto y conciso. Tu tarea es analizar el texto proporcionado y "
        "generar un resumen detallado y exhaustivo en español de no más de 300 palabras. "
        "El resumen debe capturar las ideas principales, los conceptos clave y cualquier conclusión importante del documento. "
        "Asegúrate de que la respuesta sea un único bloque de texto sin títulos, subtítulos o formato Markdown adicional."
    )
    user_query = f"Genera un resumen detallado y exhaustivo del siguiente texto del documento:\n\n---\n{document_text}"

    # 3. Construir el payload
    payload = {
        "contents": [{"parts": [{"text": user_query}]}],
        "systemInstruction": {"parts": [{"text": system_prompt}]}
    }

    # 4. Llamar a la API
    response_data = api_call_with_retry(GEMINI_FLASH_MODEL, payload)
    
    # 5. Extraer el resultado
    try:
        summary_text = response_data['candidates'][0]['content']['parts'][0]['text']
        return {"summary": summary_text}
    except (KeyError, IndexError):
        raise HTTPException(status_code=500, detail="Fallo la estructura de la respuesta de la IA al generar el resumen. Verifica los logs del servidor.")

# ------------------------------------------------------------------
# 🧠 ENDPOINT 2: GENERAR QUIZ (Structured JSON Generation)
# ------------------------------------------------------------------
@app.post("/quiz")
async def generate_quiz(request: TextRequest):
    """Genera un quiz de 5 preguntas de opción múltiple a partir del resumen."""
    summary_text = request.summaryText
    if not summary_text:
        raise HTTPException(status_code=400, detail="Se requiere el texto del resumen para generar el quiz.")

    # 1. Prompts para el modelo
    system_prompt = (
        "Crea un quiz de 5 preguntas de opción múltiple basado exclusivamente en el resumen proporcionado. "
        "Cada pregunta debe tener 4 opciones y una única respuesta correcta. "
        "La respuesta final DEBE estar en formato JSON que se ajuste al esquema proporcionado."
    )
    user_query = f"Genera un quiz de 5 preguntas basado en el siguiente resumen:\n\n---\n{summary_text}"

    # 2. Construir el payload (con esquema JSON)
    payload = {
        "contents": [{"parts": [{"text": user_query}]}],
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "config": {
            "responseMimeType": "application/json",
            "responseSchema": QUIZ_SCHEMA
        }
    }

    # 3. Llamar a la API
    response_data = api_call_with_retry(GEMINI_FLASH_MODEL, payload)

    # 4. Extraer y parsear la respuesta JSON
    try:
        json_string = response_data['candidates'][0]['content']['parts'][0]['text']
        quiz_list = json.loads(json_string)
        
        # Validación
        if not isinstance(quiz_list, list) or len(quiz_list) != 5:
            raise ValueError("La IA no devolvió exactamente 5 preguntas en el formato esperado.")

        return {"quiz": quiz_list}
    except (KeyError, IndexError, json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status_code=500, detail="Fallo la estructura JSON de la respuesta del quiz. Intenta de nuevo.")

# ------------------------------------------------------------------
# 🗣️ ENDPOINT 3: GENERAR AUDIO (Text-to-Speech)
# ------------------------------------------------------------------
@app.post("/audio-summary")
async def generate_audio_summary(request: TextRequest):
    """Genera un archivo de audio (Base64) a partir de un texto de resumen."""
    summary_text = request.summaryText
    if not summary_text:
        raise HTTPException(status_code=400, detail="Se requiere el texto del resumen para generar el audio.")

    # 1. Construir el payload (TTS)
    # Voz Kore seleccionada por ser una voz firme y adecuada para el español.
    tts_config = {
        "voiceConfig": {
            "prebuiltVoiceConfig": {"voiceName": "Kore"} 
        }
    }

    payload = {
        "contents": [{"parts": [{"text": summary_text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": tts_config
        }
    }

    # 2. Llamar a la API
    response_data = api_call_with_retry(GEMINI_TTS_MODEL, payload)
    
    # 3. Extraer los datos binarios de audio (Base64)
    try:
        audio_part = response_data['candidates'][0]['content']['parts'][0]['inlineData']
        
        # Devolvemos el audio en Base64 y su mimetype
        return {
            "audioData": audio_part['data'], 
            "mimeType": audio_part['mimeType']
        }
    except (KeyError, IndexError):
        raise HTTPException(status_code=500, detail="Fallo la estructura de la respuesta de la IA al generar el audio.")
