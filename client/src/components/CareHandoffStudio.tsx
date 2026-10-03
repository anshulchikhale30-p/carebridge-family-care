import { useRef, useState } from "react";
import { ArrowRight, AudioLines, Check, CheckCircle2, ClipboardCheck, FileText, Heart, Languages, Loader2, Mic, RotateCcw, ShieldCheck, Sparkles, Square, Upload, UserRound } from "lucide-react";

type ExtractedDetail = { type: string; value: string; selected: boolean };
type Props = { onToast: (message: string) => void };

const sampleNote = "Leela has a hospital appointment on Thursday at 10 AM. Rohan, can you take her? Please remind her to bring the blue prescription folder. Meera, call her after the appointment in Hindi.";
const typeLabels: Record<string, string> = { appointment: "Appointment", transport: "Transport", medication_context: "Health context", follow_up: "Follow-up", task: "Task" };
const relationships = ["Dad", "Mom", "Grandpa", "Grandma", "Sister", "Brother", "Friend", "Wife"];
const emotions = ["Calm", "Happy", "Worried", "Sad", "Tired", "Frustrated", "Uncomfortable"];

export default function CareHandoffStudio({ onToast }: Props) {
  const [note, setNote] = useState("");
  const [language, setLanguage] = useState("English");
  const [person, setPerson] = useState("Grandma");
  const [emotion, setEmotion] = useState("Worried");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<ExtractedDetail[]>([]);
  const [shared, setShared] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const localTranscriptRef = useRef("");
  const extract = async () => {
    if (!note.trim()) return;
    setLoading(true);
    try {
      const response = await fetch("/api/ai/extract", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: note, language, person, emotion }) });
      if (!response.ok) throw new Error("Extraction unavailable");
      const payload = await response.json() as { draft?: { details?: Array<{ type?: string; value?: string }> } };
      const next = (payload.draft?.details ?? []).map((item) => ({ type: item.type ?? "task", value: item.value ?? "Possible care action", selected: true }));
      setDetails(next.length ? next : [{ type: "task", value: "Review this update and decide what the family should know", selected: true }]);
      setStep(2);
    } catch {
      setDetails([{ type: "task", value: "Review this update and decide what the family should know", selected: true }]);
      setStep(2);
    } finally { setLoading(false); }
  };
  const toggle = (index: number) => setDetails((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, selected: !item.selected } : item));
  const approve = () => { setStep(3); setShared(false); };
  const share = () => { setShared(true); onToast("Verified handoff shared with the care circle"); };
  const transcribeAudio = async (blob: Blob, filename: string) => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(blob));
    setTranscribing(true);
    setVoiceMessage("ElevenLabs is transcribing your update…");
    try {
      const audioBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result).split(",")[1] ?? "");
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const response = await fetch("/api/voice/transcribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ audioBase64, audioType: blob.type || "audio/webm", filename }) });
      const payload = await response.json() as { text?: string; error?: string; provider?: string };
      if (!response.ok || !payload.text) throw new Error(payload.error ?? "No transcript returned");
      setNote(payload.text);
      setVoiceMessage(`${payload.provider ?? "Voice AI"} transcript ready — review it before organizing.`);
    } catch (error) {
      if (localTranscriptRef.current.trim()) {
        setNote(localTranscriptRef.current.trim());
        setVoiceMessage("Browser transcript ready — review it before organizing. ElevenLabs was unavailable, but your recording is saved below.");
      } else {
        setVoiceMessage(error instanceof Error ? `${error.message} Recordings can still be played below.` : "Voice transcription failed. Your recording is saved below; you can type the update.");
      }
    } finally { setTranscribing(false); }
  };

  const startBrowserRecognition = () => {
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = language === "Marathi" ? "mr-IN" : language === "Hindi" ? "hi-IN" : "en-IN";
    recognition.continuous = true;
    recognition.interimResults = false;
    localTranscriptRef.current = "";
    recognition.onresult = (event: any) => {
      localTranscriptRef.current = Array.from(event.results).map((result: any) => result[0]?.transcript ?? "").join(" ").trim();
    };
    recognition.onerror = () => {};
    recognitionRef.current = recognition;
    recognition.start();
  };

  const startRecording = () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setVoiceMessage("Microphone capture is unavailable. Upload an audio recording instead."); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (blob.size < 1000) { setVoiceMessage("The recording was empty. Try again or upload an audio file."); return; }
        await transcribeAudio(blob, "care-update.webm");
      };
      startBrowserRecognition();
      recorder.start();
      setRecording(true);
      setVoiceMessage("Listening… tap stop when the family update is complete.");
    }).catch(() => setVoiceMessage("Microphone permission was blocked. Use Upload recording below or allow microphone access in your browser settings."));
  };

  const handleAudioFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("audio/")) { setVoiceMessage("Please choose an audio file."); return; }
    if (file.size > 8 * 1024 * 1024) { setVoiceMessage("Please choose an audio file smaller than 8 MB."); return; }
    await transcribeAudio(file, file.name);
  };
  const stopRecording = () => {
    try { recognitionRef.current?.stop(); } catch { /* recognition may already be stopped */ }
    recognitionRef.current = null;
    recorderRef.current?.stop();
    setRecording(false);
  };
  const speakApprovedHandoff = async () => {
    const approved = details.filter((item) => item.selected).map((item) => item.value).join(". ");
    if (!approved) return;
    setSpeaking(true);
    setVoiceMessage("ElevenLabs is preparing the approved handoff…");
    try {
      const response = await fetch("/api/voice/speak", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: `${person} is feeling ${emotion.toLowerCase()}. ${approved}` }) });
      const payload = await response.json() as { audioBase64?: string; mimeType?: string; error?: string };
      if (!response.ok || !payload.audioBase64) throw new Error(payload.error ?? "Speech generation unavailable");
      const audio = new Audio(`data:${payload.mimeType ?? "audio/mpeg"};base64,${payload.audioBase64}`);
      await audio.play();
      setVoiceMessage("Playing the approved family handoff aloud.");
    } catch (error) {
      const fallbackText = `${person} is feeling ${emotion.toLowerCase()}. ${approved}`;
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(fallbackText));
        setVoiceMessage("Playing the approved handoff with browser voice. ElevenLabs is unavailable.");
      } else setVoiceMessage(error instanceof Error ? error.message : "Speech generation failed.");
    } finally { setSpeaking(false); }
  };
  return <section id="handoff" aria-labelledby="handoff-title" className="mt-7 overflow-hidden rounded-[28px] border border-[#ded7ee] bg-[#fbf9ff] shadow-[0_14px_36px_rgba(96,82,143,.07)] transition-colors duration-500 dark:border-[#2a3f35] dark:bg-[#151a25]">
      <div className="border-b border-[#e9e3f3] bg-[#f2eefb] px-5 py-5 transition-colors duration-500 dark:border-[#2a3f35] dark:bg-[#1a2030] sm:px-8"><div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#665786] dark:text-[#a0b0e0]"><Sparkles className="h-3.5 w-3.5" /> Handoff studio <span className="rounded-full bg-white/70 dark:bg-[#152019] px-2.5 py-1 tracking-[0.08em] text-[#7d70a0] dark:text-[#a0b0e0]">Open-model assisted</span></div><div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 id="handoff-title" className="font-display text-[27px] font-semibold tracking-[-0.04em] text-[#332d47] dark:text-[#e8eef8] sm:text-[31px]">Turn one update into shared follow-through.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#716984] dark:text-[#7a9488]">Stop rewriting the family group chat. CareBridge captures who this is about and how they feel, then extracts possible actions for a person to approve.</p></div><div className="flex items-center gap-1.5 text-[11px] font-bold text-[#716984] dark:text-[#7a9488]"><span className={`flex h-7 w-7 items-center justify-center rounded-full ${step >= 1 ? "bg-[#665786] text-white dark:bg-[#a0b0e0] dark:text-[#0a1f18]" : "bg-white dark:bg-[#111c16] dark:text-[#8f9fc8]"}`}>1</span><span className="h-px w-5 bg-[#cfc5e5] dark:bg-[#2a3f35]" /><span className={`flex h-7 w-7 items-center justify-center rounded-full ${step >= 2 ? "bg-[#665786] text-white dark:bg-[#a0b0e0] dark:text-[#0a1f18]" : "bg-white dark:bg-[#111c16] dark:text-[#8f9fc8]"}`}>2</span><span className="h-px w-5 bg-[#cfc5e5] dark:bg-[#2a3f35]" /><span className={`flex h-7 w-7 items-center justify-center rounded-full ${step >= 3 ? "bg-[#665786] text-white dark:bg-[#a0b0e0] dark:text-[#0a1f18]" : "bg-white dark:bg-[#111c16] dark:text-[#8f9fc8]"}`}>3</span></div></div></div>
    <div className="grid lg:grid-cols-[.93fr_1.07fr]">
      <div className="border-b border-[#e9e3f3] dark:border-[#2a3f35] p-5 sm:p-8 lg:border-b-0 lg:border-r"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#998daf] dark:text-[#8f9fc8]"><Mic className="h-3.5 w-3.5" /> Step 1 · Capture</div><h3 className="mt-2 font-display text-[22px] font-semibold text-[#3e3850] dark:text-[#e8eef8]">Who needs care right now?</h3><p className="mt-1 text-xs leading-5 text-[#81778f] dark:text-[#7a9488]">Add the relationship and emotion first. That context helps the family respond with care, not just logistics.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#998daf] dark:text-[#8f9fc8]">Person</span><select value={person} onChange={(event) => setPerson(event.target.value)} className="w-full rounded-xl border border-[#ddd5eb] bg-white dark:border-[#2a3f35] dark:bg-[#111c16] px-3 py-2.5 text-sm font-bold text-[#4b4557] dark:text-[#e8f0ec]">{relationships.map((item) => <option key={item}>{item}</option>)}</select></label><label className="block"><span className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#998daf] dark:text-[#8f9fc8]"><Heart className="h-3 w-3" /> Feeling</span><select value={emotion} onChange={(event) => setEmotion(event.target.value)} className="w-full rounded-xl border border-[#ddd5eb] bg-white dark:border-[#2a3f35] dark:bg-[#111c16] px-3 py-2.5 text-sm font-bold text-[#4b4557] dark:text-[#e8f0ec]">{emotions.map((item) => <option key={item}>{item}</option>)}</select></label></div><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Example: Mum has a check-up tomorrow…" className="mt-4 min-h-[145px] w-full resize-none rounded-2xl border border-[#ddd5eb] bg-white dark:border-[#2a3f35] dark:bg-[#111c16] p-4 text-sm leading-6 text-[#4b4557] dark:text-[#e8f0ec] outline-none transition focus:border-[#9586b7] focus:ring-4 focus:ring-[#e8e2f4] dark:focus:border-[#6b7fb5] dark:focus:ring-[#1a2030]" />
        <div className="mt-3 flex flex-wrap items-center gap-2"><button onClick={recording ? stopRecording : startRecording} disabled={transcribing} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-bold ${recording ? "border-[#e6b8ad] bg-[#fff0ed] text-[#a25c50] dark:border-[#5a2f28] dark:bg-[#2a1512] dark:text-[#e0a080]" : "border-[#ddd5eb] bg-white dark:border-[#2a3f35] dark:bg-[#111c16] text-[#71618f] dark:text-[#a0b0e0]"}`}>{recording ? <Square className="h-3.5 w-3.5 fill-current" /> : <AudioLines className="h-3.5 w-3.5" />} {transcribing ? "Transcribing…" : recording ? "Stop voice update" : "Speak update"}</button><button type="button" onClick={() => fileInputRef.current?.click()} disabled={transcribing || recording} className="inline-flex items-center gap-1.5 rounded-lg border border-[#ddd5eb] bg-white dark:border-[#2a3f35] dark:bg-[#111c16] px-2.5 py-2 text-[11px] font-bold text-[#71618f] dark:text-[#a0b0e0] disabled:opacity-50"><Upload className="h-3.5 w-3.5" /> Upload recording</button><input ref={fileInputRef} type="file" accept="audio/*" className="sr-only" onChange={handleAudioFile} /><button onClick={() => setNote(sampleNote)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#ddd5eb] bg-white dark:border-[#2a3f35] dark:bg-[#111c16] px-2.5 py-2 text-[11px] font-bold text-[#71618f] dark:text-[#a0b0e0]"><FileText className="h-3.5 w-3.5" /> Use sample update</button><label className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-[#81778f] dark:text-[#7a9488]"><Languages className="h-3.5 w-3.5" /><select value={language} onChange={(event) => setLanguage(event.target.value)} className="rounded-lg border border-[#ddd5eb] bg-white dark:border-[#2a3f35] dark:bg-[#111c16] px-2 py-2 text-[11px] font-bold text-[#665786] dark:text-[#a0b0e0]"><option>English</option><option>Hindi</option><option>Marathi</option></select></label></div>
        <button onClick={extract} disabled={!note.trim() || loading || recording || transcribing} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#665786] text-sm font-bold text-white shadow-[0_7px_16px_rgba(102,87,134,.18)] transition hover:bg-[#564a72] dark:bg-[#a0b0e0] dark:text-[#0a1f18] dark:hover:bg-[#8f9fc8] disabled:cursor-not-allowed disabled:opacity-45">{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Organizing safely…</> : <><Sparkles className="h-4 w-4" /> Find the follow-through</>}</button>
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#e1d9ef] bg-white/70 dark:border-[#2a3f35] dark:bg-[#152019] p-3 text-[11px] leading-5 text-[#716984] dark:text-[#7a9488]"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#665786] dark:text-[#a0b0e0]" /> Your words stay a draft until a family member approves the handoff.</div>{audioUrl && <div className="mt-3 rounded-xl border border-[#d9e5dc] bg-[#f4faf5] dark:border-[#1a3a2e] dark:bg-[#0d1f18] p-3"><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#4e8b68] dark:text-[#4ec9a0]">Recording saved</p><audio controls preload="metadata" src={audioUrl} className="h-9 w-full" /></div>}{voiceMessage && <p className="mt-3 rounded-xl bg-[#f1ecfa] dark:bg-[#1a2030] px-3 py-2 text-[11px] font-semibold leading-5 text-[#665786] dark:text-[#a0b0e0]">{voiceMessage}</p>}
      </div>
      <div className="p-5 sm:p-8">{step === 1 && <div className="flex min-h-[300px] flex-col items-center justify-center text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ebe5f7] dark:bg-[#1a2030] text-[#665786] dark:text-[#a0b0e0]"><ClipboardCheck className="h-7 w-7" /></div><h3 className="mt-5 font-display text-[23px] font-semibold text-[#3e3850] dark:text-[#e8eef8]">Your review queue is waiting.</h3><p className="mt-2 max-w-sm text-sm leading-6 text-[#81778f] dark:text-[#7a9488]">Once you submit an update, possible appointments, tasks, and follow-ups appear here for approval.</p></div>}
        {step === 2 && <div><div className="flex items-start justify-between"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#665786] dark:text-[#a0b0e0]"><Sparkles className="h-3.5 w-3.5" /> Step 2 · Review</div><h3 className="mt-2 font-display text-[23px] font-semibold text-[#3e3850] dark:text-[#e8eef8]">Does this look right?</h3><p className="mt-1 text-xs leading-5 text-[#81778f] dark:text-[#7a9488]">Uncheck anything that should stay out of the family plan.</p></div><span className="rounded-full bg-[#f1ecfa] dark:bg-[#1a2030] px-2.5 py-1 text-[10px] font-bold text-[#665786] dark:text-[#a0b0e0]">Draft · human check</span></div><div className="mt-5 space-y-3">{details.map((detail, index) => <button key={`${detail.type}-${index}`} onClick={() => toggle(index)} className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition ${detail.selected ? "border-[#d8cde9] bg-[#fbf9ff] dark:border-[#33415a] dark:bg-[#1a2030]" : "border-[#e8e3ee] bg-[#faf9fb] opacity-55 dark:border-[#2a3f35] dark:bg-[#111c16]"}`}><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${detail.selected ? "bg-[#ebe5f7] dark:bg-[#1a2030] text-[#665786] dark:text-[#a0b0e0]" : "bg-[#eeeef0] dark:bg-[#1a2b23] text-[#aaa5b0] dark:text-[#5a7a6a]"}`}>{detail.selected && <Check className="h-3.5 w-3.5" />}</span><span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#998daf] dark:text-[#8f9fc8]">{typeLabels[detail.type] ?? "Possible action"}</span><span className="mt-1 block text-sm font-semibold leading-5 text-[#4b4557] dark:text-[#e8f0ec]">{detail.value}</span></span></button>)}</div><div className="mt-5 flex gap-2"><button onClick={() => setStep(1)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#ddd5eb] bg-white dark:border-[#2a3f35] dark:bg-[#111c16] px-4 text-xs font-bold text-[#81778f] dark:text-[#7a9488]"><RotateCcw className="h-3.5 w-3.5" /> Edit</button><button onClick={approve} disabled={!details.some((item) => item.selected)} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#665786] px-4 text-xs font-bold text-white dark:bg-[#a0b0e0] dark:text-[#0a1f18] disabled:opacity-45"><Check className="h-3.5 w-3.5" /> Approve handoff</button></div></div>}
        {step === 3 && <div><div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f3eb] text-[#2f6b58] dark:bg-[#0d1f18] dark:text-[#4ec9a0]"><CheckCircle2 className="h-5 w-5" /></div><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#4e8b68] dark:text-[#4ec9a0]">Step 3 · Handoff ready</div><h3 className="mt-1 font-display text-[23px] font-semibold text-[#3e3850] dark:text-[#e8eef8]">Make the next steps visible.</h3><p className="mt-1 text-xs leading-5 text-[#81778f] dark:text-[#7a9488]">This handoff is for <strong>{person}</strong>, who is feeling <strong>{emotion.toLowerCase()}</strong>. The approved details are ready to become assigned family actions.</p></div></div><div className="mt-5 space-y-2">{details.filter((item) => item.selected).map((detail, index) => <div key={`${detail.type}-approved-${index}`} className="flex items-center gap-3 rounded-xl border border-[#e1e9e2] bg-[#f7fbf7] dark:border-[#1a3a2e] dark:bg-[#0d1f18] p-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#4e8b68] dark:bg-[#111c16] dark:text-[#4ec9a0]"><Check className="h-4 w-4" /></div><p className="flex-1 text-xs font-bold text-[#4b5c50] dark:text-[#cfe3d6]">{detail.value}</p><button onClick={() => onToast("Owner picker opened for this action")} aria-label="Assign an owner" className="rounded-lg p-2 text-[#7d9b85] hover:bg-white dark:text-[#5a7a6a] dark:hover:bg-[#152019]"><UserRound className="h-4 w-4" /></button></div>)}</div>{shared ? <div className="mt-5 rounded-2xl border border-[#cfe4d5] bg-[#edf8f0] dark:border-[#1a3a2e] dark:bg-[#0d1f18] p-4 text-sm font-bold text-[#3f7653] dark:text-[#8fd6b0]"><CheckCircle2 className="mr-2 inline h-4 w-4" /> Shared with the family care circle. Every action is traceable.</div> : <div className="mt-5 grid gap-2 sm:grid-cols-2"><button onClick={speakApprovedHandoff} disabled={speaking} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#bcd7c4] bg-[#f2faf3] dark:border-[#1a3a2e] dark:bg-[#0d1f18] text-xs font-bold text-[#2f6b58] dark:text-[#4ec9a0] disabled:opacity-60"><AudioLines className="h-4 w-4" /> {speaking ? "Preparing voice…" : "Play approved handoff"}</button><button onClick={share} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2f6b58] text-xs font-bold text-white shadow-[0_7px_16px_rgba(47,107,88,.16)]"><ArrowRight className="h-4 w-4" /> Share verified handoff</button></div>}</div>}
      </div>
    </div>
  </section>;
}
