import { useRef, useState } from "react";
import { ArrowRight, AudioLines, Check, CheckCircle2, ClipboardCheck, FileText, Heart, Languages, Loader2, Mic, RotateCcw, ShieldCheck, Sparkles, Square, UserRound } from "lucide-react";

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
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
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
  const startRecording = () => {
    if (!navigator.mediaDevices?.getUserMedia) { setVoiceMessage("This browser does not support voice capture. You can type the update instead."); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setTranscribing(true);
        setVoiceMessage("ElevenLabs is transcribing your update…");
        try {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
          const audioBase64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onloadend = () => resolve(String(reader.result).split(",")[1] ?? ""); reader.onerror = reject; reader.readAsDataURL(blob); });
          const response = await fetch("/api/voice/transcribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ audioBase64, audioType: blob.type }) });
          const payload = await response.json() as { text?: string; error?: string; provider?: string };
          if (!response.ok || !payload.text) throw new Error(payload.error ?? "No transcript returned");
          setNote(payload.text);
          setVoiceMessage(`${payload.provider ?? "Voice AI"} transcript ready — review it before organizing.`);
        } catch (error) { setVoiceMessage(error instanceof Error ? error.message : "Voice transcription failed. You can type the update instead."); }
        finally { setTranscribing(false); }
      };
      recorder.start();
      setRecording(true);
      setVoiceMessage("Listening… tap stop when the family update is complete.");
    }).catch(() => setVoiceMessage("Microphone permission was not granted. You can type the update instead."));
  };
  const stopRecording = () => { recorderRef.current?.stop(); setRecording(false); };
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
    } catch (error) { setVoiceMessage(error instanceof Error ? error.message : "Speech generation failed."); }
    finally { setSpeaking(false); }
  };
  return <section id="handoff" aria-labelledby="handoff-title" className="mt-7 overflow-hidden rounded-[28px] border border-[#ded7ee] bg-[#fbf9ff] shadow-[0_14px_36px_rgba(96,82,143,.07)]">
      <div className="border-b border-[#e9e3f3] bg-[#f2eefb] px-5 py-5 sm:px-8"><div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#665786]"><Sparkles className="h-3.5 w-3.5" /> Handoff studio <span className="rounded-full bg-white/70 px-2.5 py-1 tracking-[0.08em] text-[#7d70a0]">Open-model assisted</span></div><div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 id="handoff-title" className="font-display text-[27px] font-semibold tracking-[-0.04em] text-[#332d47] sm:text-[31px]">Turn one update into shared follow-through.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#716984]">Stop rewriting the family group chat. CareBridge captures who this is about and how they feel, then extracts possible actions for a person to approve.</p></div><div className="flex items-center gap-1.5 text-[11px] font-bold text-[#716984]"><span className={`flex h-7 w-7 items-center justify-center rounded-full ${step >= 1 ? "bg-[#665786] text-white" : "bg-white"}`}>1</span><span className="h-px w-5 bg-[#cfc5e5]" /><span className={`flex h-7 w-7 items-center justify-center rounded-full ${step >= 2 ? "bg-[#665786] text-white" : "bg-white"}`}>2</span><span className="h-px w-5 bg-[#cfc5e5]" /><span className={`flex h-7 w-7 items-center justify-center rounded-full ${step >= 3 ? "bg-[#665786] text-white" : "bg-white"}`}>3</span></div></div></div>
    <div className="grid lg:grid-cols-[.93fr_1.07fr]">
      <div className="border-b border-[#e9e3f3] p-5 sm:p-8 lg:border-b-0 lg:border-r"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#998daf]"><Mic className="h-3.5 w-3.5" /> Step 1 · Capture</div><h3 className="mt-2 font-display text-[22px] font-semibold text-[#3e3850]">Who needs care right now?</h3><p className="mt-1 text-xs leading-5 text-[#81778f]">Add the relationship and emotion first. That context helps the family respond with care, not just logistics.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#998daf]">Person</span><select value={person} onChange={(event) => setPerson(event.target.value)} className="w-full rounded-xl border border-[#ddd5eb] bg-white px-3 py-2.5 text-sm font-bold text-[#4b4557]">{relationships.map((item) => <option key={item}>{item}</option>)}</select></label><label className="block"><span className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#998daf]"><Heart className="h-3 w-3" /> Feeling</span><select value={emotion} onChange={(event) => setEmotion(event.target.value)} className="w-full rounded-xl border border-[#ddd5eb] bg-white px-3 py-2.5 text-sm font-bold text-[#4b4557]">{emotions.map((item) => <option key={item}>{item}</option>)}</select></label></div><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Example: Mum has a check-up tomorrow…" className="mt-4 min-h-[145px] w-full resize-none rounded-2xl border border-[#ddd5eb] bg-white p-4 text-sm leading-6 text-[#4b4557] outline-none transition focus:border-[#9586b7] focus:ring-4 focus:ring-[#e8e2f4]" />
        <div className="mt-3 flex flex-wrap items-center gap-2"><button onClick={recording ? stopRecording : startRecording} disabled={transcribing} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-bold ${recording ? "border-[#e6b8ad] bg-[#fff0ed] text-[#a25c50]" : "border-[#ddd5eb] bg-white text-[#71618f]"}`}>{recording ? <Square className="h-3.5 w-3.5 fill-current" /> : <AudioLines className="h-3.5 w-3.5" />} {transcribing ? "Transcribing…" : recording ? "Stop voice update" : "Speak update"}</button><button onClick={() => setNote(sampleNote)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#ddd5eb] bg-white px-2.5 py-2 text-[11px] font-bold text-[#71618f]"><FileText className="h-3.5 w-3.5" /> Use sample update</button><label className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-[#81778f]"><Languages className="h-3.5 w-3.5" /><select value={language} onChange={(event) => setLanguage(event.target.value)} className="rounded-lg border border-[#ddd5eb] bg-white px-2 py-2 text-[11px] font-bold text-[#665786]"><option>English</option><option>Hindi</option><option>Marathi</option></select></label></div>
        <button onClick={extract} disabled={!note.trim() || loading || recording || transcribing} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#665786] text-sm font-bold text-white shadow-[0_7px_16px_rgba(102,87,134,.18)] transition hover:bg-[#564a72] disabled:cursor-not-allowed disabled:opacity-45">{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Organizing safely…</> : <><Sparkles className="h-4 w-4" /> Find the follow-through</>}</button>
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#e1d9ef] bg-white/70 p-3 text-[11px] leading-5 text-[#716984]"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#665786]" /> Your words stay a draft until a family member approves the handoff.</div>{voiceMessage && <p className="mt-3 rounded-xl bg-[#f1ecfa] px-3 py-2 text-[11px] font-semibold leading-5 text-[#665786]">{voiceMessage}</p>}
      </div>
      <div className="p-5 sm:p-8">{step === 1 && <div className="flex min-h-[300px] flex-col items-center justify-center text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ebe5f7] text-[#665786]"><ClipboardCheck className="h-7 w-7" /></div><h3 className="mt-5 font-display text-[23px] font-semibold text-[#3e3850]">Your review queue is waiting.</h3><p className="mt-2 max-w-sm text-sm leading-6 text-[#81778f]">Once you submit an update, possible appointments, tasks, and follow-ups appear here for approval.</p></div>}
        {step === 2 && <div><div className="flex items-start justify-between"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#665786]"><Sparkles className="h-3.5 w-3.5" /> Step 2 · Review</div><h3 className="mt-2 font-display text-[23px] font-semibold text-[#3e3850]">Does this look right?</h3><p className="mt-1 text-xs leading-5 text-[#81778f]">Uncheck anything that should stay out of the family plan.</p></div><span className="rounded-full bg-[#f1ecfa] px-2.5 py-1 text-[10px] font-bold text-[#665786]">Draft · human check</span></div><div className="mt-5 space-y-3">{details.map((detail, index) => <button key={`${detail.type}-${index}`} onClick={() => toggle(index)} className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition ${detail.selected ? "border-[#d8cde9] bg-[#fbf9ff]" : "border-[#e8e3ee] bg-[#faf9fb] opacity-55"}`}><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${detail.selected ? "bg-[#ebe5f7] text-[#665786]" : "bg-[#eeeef0] text-[#aaa5b0]"}`}>{detail.selected && <Check className="h-3.5 w-3.5" />}</span><span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#998daf]">{typeLabels[detail.type] ?? "Possible action"}</span><span className="mt-1 block text-sm font-semibold leading-5 text-[#4b4557]">{detail.value}</span></span></button>)}</div><div className="mt-5 flex gap-2"><button onClick={() => setStep(1)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#ddd5eb] bg-white px-4 text-xs font-bold text-[#81778f]"><RotateCcw className="h-3.5 w-3.5" /> Edit</button><button onClick={approve} disabled={!details.some((item) => item.selected)} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#665786] px-4 text-xs font-bold text-white disabled:opacity-45"><Check className="h-3.5 w-3.5" /> Approve handoff</button></div></div>}
        {step === 3 && <div><div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f3eb] text-[#2f6b58]"><CheckCircle2 className="h-5 w-5" /></div><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#4e8b68]">Step 3 · Handoff ready</div><h3 className="mt-1 font-display text-[23px] font-semibold text-[#3e3850]">Make the next steps visible.</h3><p className="mt-1 text-xs leading-5 text-[#81778f]">This handoff is for <strong>{person}</strong>, who is feeling <strong>{emotion.toLowerCase()}</strong>. The approved details are ready to become assigned family actions.</p></div></div><div className="mt-5 space-y-2">{details.filter((item) => item.selected).map((detail, index) => <div key={`${detail.type}-approved-${index}`} className="flex items-center gap-3 rounded-xl border border-[#e1e9e2] bg-[#f7fbf7] p-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#4e8b68]"><Check className="h-4 w-4" /></div><p className="flex-1 text-xs font-bold text-[#4b5c50]">{detail.value}</p><button onClick={() => onToast("Owner picker opened for this action")} aria-label="Assign an owner" className="rounded-lg p-2 text-[#7d9b85] hover:bg-white"><UserRound className="h-4 w-4" /></button></div>)}</div>{shared ? <div className="mt-5 rounded-2xl border border-[#cfe4d5] bg-[#edf8f0] p-4 text-sm font-bold text-[#3f7653]"><CheckCircle2 className="mr-2 inline h-4 w-4" /> Shared with the family care circle. Every action is traceable.</div> : <div className="mt-5 grid gap-2 sm:grid-cols-2"><button onClick={speakApprovedHandoff} disabled={speaking} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#bcd7c4] bg-[#f2faf3] text-xs font-bold text-[#2f6b58] disabled:opacity-60"><AudioLines className="h-4 w-4" /> {speaking ? "Preparing voice…" : "Play approved handoff"}</button><button onClick={share} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2f6b58] text-xs font-bold text-white shadow-[0_7px_16px_rgba(47,107,88,.16)]"><ArrowRight className="h-4 w-4" /> Share verified handoff</button></div>}</div>}
      </div>
    </div>
  </section>;
}
