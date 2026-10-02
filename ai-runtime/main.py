"""CareBridge open-weight extraction runtime.

The model only produces a draft. The product still requires a human review before
anything is shared with the family care circle.
"""
import json
import os
import re
from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="CareBridge AI Runtime", version="0.1.0")
MODEL_ID = os.getenv("MODEL_ID", "HuggingFaceTB/SmolLM2-360M-Instruct")
_pipeline = None


class ExtractRequest(BaseModel):
    text: str = Field(min_length=1, max_length=10000)
    language: str = Field(default="English", max_length=40)


class ExtractResponse(BaseModel):
    model: str
    draft: dict[str, Any]
    requires_human_review: bool = True
    safety_note: str = "Draft only. Confirm details with a person before sharing."


def fallback_extract(text: str) -> dict[str, Any]:
    """A predictable no-model fallback for health-safe demos and cold starts."""
    lowered = text.lower()
    details: list[dict[str, str]] = []
    if any(word in lowered for word in ("doctor", "hospital", "appointment", "clinic")):
        details.append({"type": "appointment", "value": "Possible appointment or visit mentioned"})
    if any(word in lowered for word in ("ride", "drive", "take me", "transport")):
        details.append({"type": "transport", "value": "Transportation may need to be arranged"})
    if any(word in lowered for word in ("tablet", "medicine", "medication", "prescription")):
        details.append({"type": "medication_context", "value": "Medication context mentioned; verify with a qualified professional"})
    if any(word in lowered for word in ("call", "check in", "check-in", "remind")):
        details.append({"type": "follow_up", "value": "A follow-up or reminder may be useful"})
    return {"summary": text[:240], "details": details, "confidence": 0, "source": "safe_fallback"}


def load_pipeline():
    global _pipeline
    if _pipeline is not None:
        return _pipeline
    try:
        from transformers import pipeline
        _pipeline = pipeline("text-generation", model=MODEL_ID, device=-1)
    except Exception:
        _pipeline = False
    return _pipeline


def model_extract(text: str, language: str) -> dict[str, Any] | None:
    generator = load_pipeline()
    if not generator:
        return None
    prompt = (
        "Extract only coordination details from this family care note. "
        "Never diagnose, prescribe, infer a medical condition, or invent a date. "
        "Return JSON with summary, details (array of {type,value}), and confidence (0-100). "
        f"The preferred confirmation language is {language}. Note: {text}"
    )
    try:
        result = generator(prompt, max_new_tokens=220, do_sample=False)[0]["generated_text"]
        match = re.search(r"\{.*\}", result, re.DOTALL)
        if match:
            parsed = json.loads(match.group(0))
            parsed.setdefault("details", [])
            parsed["confidence"] = min(max(int(parsed.get("confidence", 0)), 0), 100)
            return parsed
    except (ValueError, TypeError, json.JSONDecodeError, KeyError):
        return None
    return None


@app.get("/health")
def health():
    return {"ok": True, "service": "carebridge-ai-runtime", "model": MODEL_ID, "model_loaded": bool(_pipeline)}


@app.post("/extract", response_model=ExtractResponse)
def extract(request: ExtractRequest):
    draft = model_extract(request.text, request.language) or fallback_extract(request.text)
    return ExtractResponse(model=MODEL_ID, draft=draft)
