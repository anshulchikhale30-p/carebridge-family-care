import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.post("/api/ai/extract", async (req, res) => {
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    const language = typeof req.body?.language === "string" ? req.body.language : "English";
    if (!text || text.length > 10000) return res.status(400).json({ error: "A note between 1 and 10000 characters is required." });
    if (!process.env.AI_RUNTIME_URL) {
      const lowered = text.toLowerCase();
      const details = [
        ...(/(doctor|hospital|appointment|clinic)/.test(lowered) ? [{ type: "appointment", value: "Review the appointment or visit details" }] : []),
        ...(/(ride|drive|take her|take him|transport)/.test(lowered) ? [{ type: "transport", value: "Arrange or confirm transportation" }] : []),
        ...(/(call|check in|check-in|remind)/.test(lowered) ? [{ type: "follow_up", value: "Schedule a family follow-up or reminder" }] : []),
        ...(/(folder|prescription|document)/.test(lowered) ? [{ type: "task", value: "Bring or locate the referenced document" }] : []),
      ];
      return res.json({ model: "safe-local-fallback", requires_human_review: true, draft: { summary: text.slice(0, 240), details: details.length ? details : [{ type: "task", value: "Review this update and decide what the family should know" }], confidence: 0 } });
    }
    try {
      const configuredRuntime = process.env.AI_RUNTIME_URL;
      const runtimeBase = configuredRuntime.startsWith("http") ? configuredRuntime : `https://${configuredRuntime}`;
      const runtimeUrl = `${runtimeBase.replace(/\/$/, "")}/extract`;
      const response = await fetch(runtimeUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, language }) });
      const payload = await response.json();
      return res.status(response.status).json(payload);
    } catch {
      return res.status(502).json({ error: "The AI runtime is temporarily unavailable." });
    }
  });
  app.post("/api/voice/transcribe", async (req, res) => {
    if (!process.env.ELEVENLABS_API_KEY) return res.status(503).json({ error: "ElevenLabs voice is not configured yet.", fallback: true });
    const audioBase64 = typeof req.body?.audioBase64 === "string" ? req.body.audioBase64 : "";
    const audioType = typeof req.body?.audioType === "string" ? req.body.audioType : "audio/webm";
    if (!audioBase64 || audioBase64.length > 12_000_000) return res.status(400).json({ error: "A short audio recording is required." });
    try {
      const bytes = Buffer.from(audioBase64, "base64");
      const form = new FormData();
      form.append("file", new Blob([bytes], { type: audioType }), "care-update.webm");
      form.append("model_id", "scribe_v1");
      const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY }, body: form });
      const payload = await response.json() as { text?: string; detail?: { message?: string; code?: string }; message?: string };
      if (!response.ok) {
        return res.status(response.status).json({
          error: payload.detail?.message ?? payload.message ?? "ElevenLabs rejected the recording request.",
          code: payload.detail?.code ?? "ELEVENLABS_REQUEST_FAILED",
          provider: "ElevenLabs",
        });
      }
      const text = typeof payload.text === "string" ? payload.text.trim() : "";
      if (!text) return res.status(422).json({ error: "ElevenLabs returned an empty transcript. Record a longer, clearer update and try again.", code: "EMPTY_TRANSCRIPT", provider: "ElevenLabs" });
      return res.json({ text, provider: "ElevenLabs" });
    } catch { return res.status(502).json({ error: "ElevenLabs transcription is temporarily unavailable." }); }
  });
  app.post("/api/voice/speak", async (req, res) => {
    if (!process.env.ELEVENLABS_API_KEY) return res.status(503).json({ error: "ElevenLabs voice is not configured yet.", fallback: true });
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    if (!text || text.length > 3000) return res.status(400).json({ error: "A short approved handoff is required." });
    try {
      const voiceId = typeof req.body?.voiceId === "string" ? req.body.voiceId : "JBFqnCBsd6RMkjVDRZzb";
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, { method: "POST", headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "content-type": "application/json", accept: "audio/mpeg" }, body: JSON.stringify({ text, model_id: "eleven_multilingual_v2", output_format: "mp3_44100_128" }) });
      if (!response.ok) return res.status(response.status).json({ error: "ElevenLabs speech generation failed." });
      const audio = Buffer.from(await response.arrayBuffer()).toString("base64");
      return res.json({ audioBase64: audio, mimeType: "audio/mpeg", provider: "ElevenLabs" });
    } catch { return res.status(502).json({ error: "ElevenLabs speech is temporarily unavailable." }); }
  });
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

startServer().catch(error => { console.error(error); process.exit(1); });
