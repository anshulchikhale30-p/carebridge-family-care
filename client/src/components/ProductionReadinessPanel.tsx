import { useEffect, useState } from "react";
import {
  BellRing,
  BookOpen,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CloudOff,
  FileLock2,
  FileText,
  HeartPulse,
  History,
  Languages,
  LockKeyhole,
  MessageCircleHeart,
  PhoneCall,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  SunMedium,
  UserRound,
  UsersRound,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

type Tab = "timeline" | "reminders" | "privacy";

const timeline = [
  { time: "Just now", title: "Leela’s voice note was reviewed", detail: "Asha checked 5 extracted details before sharing", icon: MessageCircleHeart, tone: "bg-[#e6f0eb] text-[#2f6b58]" },
  { time: "18 min ago", title: "Rohan accepted the hospital ride", detail: "Thursday · 9:15 AM pickup · CityCare Hospital", icon: CheckCircle2, tone: "bg-[#fff1df] text-[#a56c37]" },
  { time: "Yesterday", title: "Appointment confirmed", detail: "CityCare Hospital · Dr. Shah · 10:00 AM", icon: CalendarClock, tone: "bg-[#eeebf8] text-[#665786]" },
  { time: "12 Mar", title: "Family note added", detail: "“Leela laughed when Rohan tried the new camera.”", icon: BookOpen, tone: "bg-[#f8e9e2] text-[#a56c4a]" },
];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return <button aria-label={label} aria-pressed={checked} onClick={onChange} className={`relative h-6 w-11 shrink-0 rounded-full p-1 transition-colors ${checked ? "bg-[#2f6b58]" : "bg-[#d8d5cd]"}`}><span className={`block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} /></button>;
}

export default function ProductionReadinessPanel() {
  const [tab, setTab] = useState<Tab>("timeline");
  const [largeText, setLargeText] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");
  const [consent, setConsent] = useState({ voice: true, ai: true, documents: false });
  const [saved, setSaved] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [privacyMessage, setPrivacyMessage] = useState("");
  const { user, isAuthenticated, logout } = useAuth();
  const familyList = trpc.family.list.useQuery(undefined, { enabled: isAuthenticated });
  const activeFamilyId = familyList.data?.[0]?.id;
  const familySnapshot = trpc.family.snapshot.useQuery({ familyId: activeFamilyId ?? 0 }, { enabled: Boolean(activeFamilyId) });
  const createFamily = trpc.family.create.useMutation({ onSuccess: () => familyList.refetch() });
  const savePreferences = trpc.family.saveNotificationPreferences.useMutation({ onSuccess: () => setSaved(true) });
  const requestDeletion = trpc.care.requestDeletion.useMutation({ onSuccess: (result) => setPrivacyMessage(result.message), onError: (error) => setPrivacyMessage(error.message) });
  const updateConsent = trpc.family.updateConsent.useMutation({ onSuccess: () => familySnapshot.refetch(), onError: (error) => setPrivacyMessage(error.message) });
  const utils = trpc.useUtils();

  const signIn = () => {
    try {
      startLogin();
    } catch {
      setAuthMessage("Account connection is not enabled; this workspace runs locally on this device.");
    }
  };
  const createCircle = () => createFamily.mutate({ name: "The Patil family" });
  const exportFamilyData = async () => {
    const family = familyList.data?.[0];
    if (!family) { setPrivacyMessage("Sign in and create a family circle before exporting data."); return; }
    const data = family ? await utils.care.exportData.fetch({ familyId: family.id }) : { workspace: "carebridge-local", exportedAt: new Date().toISOString(), preferences: { push, email, weeklyDigest, quietStart, quietEnd }, consent };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "carebridge-family-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setPrivacyMessage("Family export downloaded.");
  };

  const requestFamilyDeletion = () => {
    const family = familyList.data?.[0];
    if (!family) { localStorage.removeItem("carebridge-local-workspace"); setPrivacyMessage("Local workspace data cleared from this browser."); return; }
    const typedName = window.prompt(`Type ${family.name} to request deletion review.`);
    if (typedName === null) return;
    requestDeletion.mutate({ familyId: family.id, confirmFamilyName: typedName });
  };

  const handleSavePreferences = () => {
    const familyId = familyList.data?.[0]?.id;
    if (!familyId) { setSaved(true); return; }
    savePreferences.mutate({ familyId, quietStart, quietEnd, pushEnabled: push, emailEnabled: email, smsEnabled: false, weeklyDigest });
  };

  const activeMember = familySnapshot.data?.members.find((member) => member.userId === user?.id);
  const emergencyContact = familySnapshot.data?.emergency?.[0];
  useEffect(() => {
    const data = familySnapshot.data;
    if (!activeMember || !data?.consents) return;
    const latestFor = (type: "voice_share" | "ai_processing" | "document_share") => data.consents.filter((item) => item.memberId === activeMember.id && item.consentType === type).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    setConsent({ voice: Boolean(latestFor("voice_share")?.grantedAt && !latestFor("voice_share")?.revokedAt), ai: Boolean(latestFor("ai_processing")?.grantedAt && !latestFor("ai_processing")?.revokedAt), documents: Boolean(latestFor("document_share")?.grantedAt && !latestFor("document_share")?.revokedAt) });
  }, [activeMember, familySnapshot.data?.consents]);
  useEffect(() => {
    const preference = familySnapshot.data?.preferences.find((item) => item.userId === user?.id);
    if (!preference) return;
    setPush(preference.pushEnabled);
    setEmail(preference.emailEnabled);
    setWeeklyDigest(preference.weeklyDigest);
    setQuietStart(preference.quietStart);
    setQuietEnd(preference.quietEnd);
  }, [familySnapshot.data?.preferences, user?.id]);
  const handleConsentToggle = (key: keyof typeof consent) => {
    const nextValue = !consent[key];
    setConsent((current) => ({ ...current, [key]: nextValue }));
    const consentType = key === "voice" ? "voice_share" : key === "ai" ? "ai_processing" : "document_share";
    if (activeFamilyId && activeMember) updateConsent.mutate({ familyId: activeFamilyId, memberId: activeMember.id, consentType, granted: nextValue });
  };

  const reminderChannels = [
    { label: "Push notifications", checked: push, setter: setPush, Icon: Smartphone },
    { label: "Email summaries", checked: email, setter: setEmail, Icon: BellRing },
    { label: "Weekly family digest", checked: weeklyDigest, setter: setWeeklyDigest, Icon: CalendarClock },
  ];

  return <section id="operations" className={`mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.42fr)_minmax(330px,.78fr)] ${highContrast ? "contrast-125" : ""}`}>
    <div className="overflow-hidden rounded-[22px] border border-[#dfddd4] bg-[#fffdf9] shadow-[0_8px_24px_rgba(43,56,50,.035)]">
      <div className="flex flex-col gap-4 border-b border-[#ebe7de] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#87988d]"><SlidersHorizontal className="h-3.5 w-3.5 text-[#2f6b58]" /> Production workspace</div><h3 className="mt-2 font-display text-[23px] font-semibold tracking-[-0.035em] text-[#2b3934]">Make care safer to share.</h3></div><span className="inline-flex items-center gap-2 rounded-full border border-[#cce2d7] bg-[#eef8f1] px-3 py-1.5 text-[11px] font-bold text-[#2f6b58]"><span className="h-1.5 w-1.5 rounded-full bg-[#55a07f]" /> Local-first workspace</span></div>
      {authMessage && <p className="border-b border-[#f0dfcc] bg-[#fff8ee] px-5 py-2 text-[11px] font-semibold text-[#9b663d] sm:px-7">{authMessage}</p>}<p className="border-b border-[#ebe7de] bg-[#fbfaf7] px-5 py-2 text-[11px] leading-5 text-[#9a958a] sm:px-7">This local-first workspace keeps your care settings and updates on this device. Connect a family account later to sync across devices.</p>
      <div className="flex gap-1 border-b border-[#ebe7de] px-5 pt-2 sm:px-7">{([ ["timeline", History, "Care timeline"], ["reminders", BellRing, "Reminders"], ["privacy", LockKeyhole, "Privacy & consent"]] as const).map(([id, Icon, label]) => <button key={id} onClick={() => setTab(id)} className={`flex min-h-11 items-center gap-2 border-b-2 px-3 text-xs font-bold transition-colors ${tab === id ? "border-[#2f6b58] text-[#2f6b58]" : "border-transparent text-[#9a958a] hover:text-[#5f675f]"}`}><Icon className="h-3.5 w-3.5" />{label}</button>)}</div>
      <div className="p-5 sm:p-7">
        {tab === "timeline" && <div className="space-y-5">{timeline.map((event) => { const Icon = event.icon; return <div key={event.title} className="flex gap-3"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${event.tone}`}><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline"><p className="text-sm font-bold text-[#46524d]">{event.title}</p><span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#aaa398]">{event.time}</span></div><p className="mt-1 text-xs leading-5 text-[#8c8a81]">{event.detail}</p></div></div>; })}<button className="mt-2 flex items-center gap-1 text-xs font-bold text-[#2f6b58]">View full audit history <ChevronRight className="h-3.5 w-3.5" /></button></div>}
        {tab === "reminders" && <div className="grid gap-5 md:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#a49f94]">Delivery channels</p><div className="mt-3 space-y-3">{reminderChannels.map(({ label, checked, setter, Icon }) => <div key={label} className="flex items-center gap-3 rounded-2xl border border-[#ebe7de] bg-[#fbfaf7] p-3"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eaf2ec] text-[#2f6b58]"><Icon className="h-4 w-4" /></div><span className="flex-1 text-xs font-bold text-[#5d665f]">{label}</span><Toggle checked={checked} onChange={() => setter(!checked)} label={`Toggle ${label}`} /></div>)}</div></div><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#a49f94]">Quiet hours</p><div className="mt-3 rounded-2xl border border-[#ebe7de] bg-[#fbfaf7] p-4"><div className="flex items-center gap-2 text-xs font-bold text-[#5d665f]"><SunMedium className="h-4 w-4 text-[#c18d4f]" /> No non-urgent alerts between</div><div className="mt-4 flex items-center gap-2"><span className="rounded-xl border border-[#dedbd2] bg-white px-3 py-2 text-sm font-bold text-[#4e5c55]">{quietStart}</span><span className="text-xs text-[#aaa398]">to</span><span className="rounded-xl border border-[#dedbd2] bg-white px-3 py-2 text-sm font-bold text-[#4e5c55]">{quietEnd}</span></div><p className="mt-3 text-[11px] leading-5 text-[#969087]">Urgent care escalations can still reach your chosen coordinator.</p></div></div></div>}
        {tab === "privacy" && <div className="grid gap-5 md:grid-cols-[1.1fr_.9fr]"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#a49f94]">Consent ledger</p><div className="mt-3 space-y-3">{[["Voice-note sharing", "Family members can hear Leela’s original notes", "voice"], ["AI-assisted organization", "AI may draft tasks; a person confirms before sharing", "ai"], ["Document sharing", "Prescriptions and insurance stay private until enabled", "documents"]].map(([label, detail, key]) => <div key={key} className="flex items-start gap-3 rounded-2xl border border-[#ebe7de] bg-[#fbfaf7] p-3"><div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eaf2ec] text-[#2f6b58]"><FileLock2 className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="text-xs font-bold text-[#5d665f]">{label}</p><p className="mt-1 text-[11px] leading-4 text-[#969087]">{detail}</p></div><Toggle checked={consent[key as keyof typeof consent]} onChange={() => handleConsentToggle(key as keyof typeof consent)} label={`Toggle ${label}`} /></div>)}</div></div><div className="rounded-2xl bg-[#f5f1e9] p-4"><div className="flex items-center gap-2 text-xs font-bold text-[#8e6031]"><ShieldCheck className="h-4 w-4" /> Your data promise</div><p className="mt-3 text-xs leading-5 text-[#887d6c]">Family data is private by default. CareBridge does not train models on your voice notes. This anonymous workspace keeps settings and updates on the current device.</p><div className="mt-4 grid gap-2"><button onClick={exportFamilyData} className="rounded-xl border border-[#dbcdb8] bg-white/60 px-3 py-2 text-left text-xs font-bold text-[#8e6031]">Export family data <ChevronRight className="float-right h-3.5 w-3.5" /></button><button onClick={requestFamilyDeletion} className="rounded-xl border border-[#dbcdb8] bg-white/60 px-3 py-2 text-left text-xs font-bold text-[#8e6031]">Retention & deletion <ChevronRight className="float-right h-3.5 w-3.5" /></button></div></div></div>}
      </div>
    </div>

    <div className="space-y-5">
      <div className="rounded-[22px] border border-[#dfddd4] bg-[#fffdf9] p-5 shadow-[0_8px_24px_rgba(43,56,50,.035)] sm:p-6"><div className="flex items-start justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#a49f94]">Care load</p><h3 className="mt-2 font-display text-[22px] font-semibold tracking-[-0.035em] text-[#2b3934]">No one carries it all.</h3></div><UsersRound className="h-5 w-5 text-[#8caf98]" /></div><div className="mt-5 space-y-4">{[["Asha", "Coordinator", "45%", "bg-[#2f6b58]"], ["Rohan", "Driver", "25%", "bg-[#d99562]"], ["Meera", "Check-in", "20%", "bg-[#7f70ae]"]].map(([name, role, load, tone]) => <div key={name}><div className="flex items-center justify-between text-xs"><span className="font-bold text-[#5d665f]">{name} <span className="font-normal text-[#aaa398]">· {role}</span></span><span className="font-bold text-[#7f877e]">{load}</span></div><div className="mt-2 h-1.5 rounded-full bg-[#efede7]"><div className={`h-full rounded-full ${tone}`} style={{ width: load }} /></div></div>)}</div><p className="mt-4 text-[11px] leading-5 text-[#969087]">Based on active tasks and estimated effort. Use this to start a conversation, not to score family members.</p></div>
      <div className="rounded-[22px] border border-[#dfddd4] bg-[#fffdf9] p-5 shadow-[0_8px_24px_rgba(43,56,50,.035)] sm:p-6"><div className="flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#a49f94]">Older-adult mode</p><h3 className="mt-2 font-display text-[21px] font-semibold tracking-[-0.035em] text-[#2b3934]">Make Leela’s view easier.</h3></div><HeartPulse className="h-5 w-5 text-[#c27a62]" /></div><div className="mt-4 space-y-3"><div className="flex items-center gap-3 rounded-2xl bg-[#fbfaf7] p-3"><Volume2 className="h-4 w-4 text-[#2f6b58]" /><span className="flex-1 text-xs font-bold text-[#5d665f]">Large text & voice prompts</span><Toggle checked={largeText} onChange={() => setLargeText(!largeText)} label="Toggle large text and voice prompts" /></div><div className="flex items-center gap-3 rounded-2xl bg-[#fbfaf7] p-3"><SunMedium className="h-4 w-4 text-[#c18d4f]" /><span className="flex-1 text-xs font-bold text-[#5d665f]">High contrast</span><Toggle checked={highContrast} onChange={() => setHighContrast(!highContrast)} label="Toggle high contrast mode" /></div><div className="flex items-center gap-3 rounded-2xl bg-[#fbfaf7] p-3"><CloudOff className="h-4 w-4 text-[#7b7794]" /><span className="flex-1 text-xs font-bold text-[#5d665f]">Offline queue {offlineMode ? "· 1 update waiting" : "· ready"}</span><Toggle checked={offlineMode} onChange={() => setOfflineMode(!offlineMode)} label="Toggle offline queue simulation" /></div></div>{offlineMode && <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#f4f1fb] p-3 text-[11px] leading-5 text-[#665786]"><CloudOff className="mt-0.5 h-3.5 w-3.5 shrink-0" /> One care update is queued. It will sync when this device reconnects.</div>}</div>
      <div className="rounded-[22px] border border-[#ead8ca] bg-[#fff7ed] p-5 shadow-[0_8px_24px_rgba(43,56,50,.025)] sm:p-6"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#b95e4d]"><CircleAlert className="h-4 w-4" /></div><div><p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#af7551]">Trusted emergency mode</p><h3 className="mt-2 font-display text-[20px] font-semibold tracking-[-0.035em] text-[#6f4538]">If there is immediate danger</h3></div></div><p className="mt-3 text-xs leading-5 text-[#8f6b5a]">Contact local emergency services first. CareBridge can show your chosen contacts and hospital preference, but it is not an emergency service.</p><div className="mt-4 grid gap-2"><button onClick={() => emergencyContact?.phone ? (window.location.href = `tel:${emergencyContact.phone}`) : setPrivacyMessage("Add a coordinator phone number to this family circle first.")} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-left text-xs font-bold text-[#8f5348]"><PhoneCall className="h-3.5 w-3.5" /> Call family coordinator <span className="ml-auto text-[11px] font-normal text-[#b79483]">{emergencyContact?.name ?? "Asha · local contact"}</span></button><button onClick={() => setPrivacyMessage(emergencyContact?.preferredHospital ? `Preferred hospital: ${emergencyContact.preferredHospital}` : "Add a preferred hospital to this family circle first.")} className="flex items-center gap-2 rounded-xl border border-[#e6cfc0] bg-transparent px-3 py-2.5 text-left text-xs font-bold text-[#8f5348]"><MapPinIcon /> Preferred hospital <span className="ml-auto text-[11px] font-normal text-[#b79483]">{emergencyContact?.preferredHospital ?? "CityCare · local preference"}</span></button></div></div>
      <div className="rounded-[22px] border border-[#dfddd4] bg-[#fffdf9] p-5 shadow-[0_8px_24px_rgba(43,56,50,.035)] sm:p-6"><div className="flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#a49f94]">Family records {familySnapshot.data ? "" : "· local workspace"}</p><h3 className="mt-2 font-display text-[20px] font-semibold tracking-[-0.035em] text-[#2b3934]">Practical, family-provided.</h3></div><FileText className="h-5 w-5 text-[#8caf98]" /></div><div className="mt-4 space-y-2"><div className="flex items-center gap-3 rounded-xl border border-[#ebe7de] p-3"><FileText className="h-4 w-4 text-[#2f6b58]" /><span className="flex-1 text-xs font-bold text-[#5d665f]">Previous prescription</span><span className="text-[10px] font-bold text-[#9a958a]">Private</span></div><div className="flex items-center gap-3 rounded-xl border border-[#ebe7de] p-3"><UserRound className="h-4 w-4 text-[#c18d4f]" /><span className="flex-1 text-xs font-bold text-[#5d665f]">Emergency contacts</span><span className="text-[10px] font-bold text-[#9a958a]">2 people</span></div></div><button className="mt-4 flex items-center gap-1 text-xs font-bold text-[#2f6b58]">Manage family records <ChevronRight className="h-3.5 w-3.5" /></button></div>
      {saved && <div className="flex items-center gap-2 rounded-xl bg-[#eef8f1] px-3 py-2 text-xs font-bold text-[#2f6b58]"><Check className="h-3.5 w-3.5" /> Preferences saved for this device</div>}
      {privacyMessage && <div className="rounded-xl bg-[#f5f1e9] px-3 py-2 text-xs font-semibold leading-5 text-[#8e6031]">{privacyMessage}</div>}
      <Button onClick={handleSavePreferences} disabled={savePreferences.isPending} className="h-11 w-full rounded-xl bg-[#2f6b58] text-sm font-bold text-white hover:bg-[#265a4a]"><Settings2 className="h-4 w-4" /> Save production preferences</Button>
    </div>
  </section>;
}

function MapPinIcon() { return <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-current text-[8px]">•</span>; }
