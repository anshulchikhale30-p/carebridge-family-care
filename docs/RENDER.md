# CareBridge on Render

CareBridge uses Render for two separate production concerns:

1. **`carebridge-web`** serves the family-care workspace.
2. **`carebridge-ai-runtime`** runs an open-weight model behind a small FastAPI service.

The AI runtime is intentionally narrow. `POST /extract` accepts a family note and returns a structured **draft**. The app must still show the draft to a person for review before creating a shared task, appointment, reminder, or audit event.

## Deploy

1. Create a new Render Blueprint from this repository.
2. Render reads [`render.yaml`](../render.yaml) and creates both services.
3. The AI runtime downloads the configured Hugging Face model on first boot. Use a larger Render plan or a smaller model if the service runs out of memory.
4. Set `AI_RUNTIME_URL` for the web service if you are connecting the Node API to the runtime.
5. Add `ELEVENLABS_API_KEY` to the `carebridge-web` service in Render. Render keeps this value private; never commit it to GitHub or expose it in client code.

## ElevenLabs voice loop

CareBridge uses ElevenLabs in two review-first moments:

- **Speech to Text:** a family member can record a care update; the server sends the audio to ElevenLabs and places the transcript back into the editable draft.
- **Text to Speech:** after a person approves the extracted details, the approved handoff can be played aloud for the family.

The browser never receives the API key. The Node server proxies both calls through `/api/voice/transcribe` and `/api/voice/speak`. If the key is absent, the rest of the demo remains usable and the UI explains that typed updates are available.

## Local run

```bash
cd ai-runtime
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

Then test the health endpoint:

```bash
curl http://localhost:8001/health
```

## Safety boundary

The runtime does not diagnose or prescribe. Medication-related phrases are labeled as context that must be verified by a qualified professional. If the model fails to load, the service uses a deterministic extraction fallback and still marks the result as requiring human review.
