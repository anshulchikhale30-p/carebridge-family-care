import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  BookHeart,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  ClipboardList,
  Clock3,
  FileText,
  HeartHandshake,
  Languages,
  LayoutDashboard,
  MapPin,
  Menu,
  MessageCircleHeart,
  Mic,
  MoreHorizontal,
  Navigation,
  Pause,
  Phone,
  Play,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
  Stethoscope,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CareCommandCenter from "@/components/CareCommandCenter";
import ProductionReadinessPanel from "@/components/ProductionReadinessPanel";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const familyMembers = [
  { name: "Asha", role: "Daughter · Coordinator", ageGroup: "Adult", accessibility: "Text + voice", language: "English", initials: "AS", tone: "bg-[#dcebe4] text-[#2f6b58]", online: true },
  { name: "Rohan", role: "Grandson · Driver", ageGroup: "Young adult", accessibility: "Mobile-first", language: "English", initials: "RO", tone: "bg-[#f7e7cf] text-[#99632f]", online: true },
  { name: "Meera", role: "Granddaughter · Check-in", ageGroup: "Young adult", accessibility: "Text + voice", language: "Hindi", initials: "ME", tone: "bg-[#e4e1f4] text-[#60528f]", online: false },
  { name: "Leela", role: "Grandmother · Care recipient", ageGroup: "Older adult", accessibility: "Large text · voice", language: "Marathi", initials: "LE", tone: "bg-[#f3ddd7] text-[#9b5145]", online: false },
];

type TaskStatus = "unassigned" | "planned" | "in-progress" | "completed";
type CareTask = {
  id: number;
  title: string;
  detail: string;
  owner: string;
  initials: string;
  ownerTone: string;
  due: string;
  status: TaskStatus;
  icon: "transport" | "grocery" | "checkin" | "document";
};

const initialTasks: CareTask[] = [
  { id: 1, title: "Ride to CityCare Hospital", detail: "Thursday · 10:00 AM", owner: "Rohan", initials: "RO", ownerTone: "bg-[#f7e7cf] text-[#99632f]", due: "Due Thu, 9:15 AM", status: "planned", icon: "transport" },
  { id: 2, title: "Pick up blood-pressure tablets", detail: "Green Cross Pharmacy · confirm dosage", owner: "Asha", initials: "AS", ownerTone: "bg-[#dcebe4] text-[#2f6b58]", due: "Due Wed, 6:00 PM", status: "in-progress", icon: "grocery" },
  { id: 3, title: "Call Grandma after the appointment", detail: "Ask how the new routine feels", owner: "Meera", initials: "ME", ownerTone: "bg-[#e4e1f4] text-[#60528f]", due: "Due Thu, 7:00 PM", status: "planned", icon: "checkin" },
  { id: 4, title: "Bring the previous prescription", detail: "Keep it in the blue folder", owner: "Unassigned", initials: "?", ownerTone: "bg-[#f0eee8] text-[#817c72]", due: "Before appointment", status: "unassigned", icon: "document" },
];

const statusLabels: Record<TaskStatus, string> = {
  unassigned: "Unassigned",
  planned: "Planned",
  "in-progress": "In progress",
  completed: "Completed",
};

function Avatar({ initials, tone, size = "md" }: { initials: string; tone: string; size?: "sm" | "md" | "lg" }) {
  const sizing = size === "lg" ? "h-12 w-12 text-sm" : size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";
  return <div className={`flex shrink-0 items-center justify-center rounded-full font-bold ${tone} ${sizing}`}>{initials}</div>;
}

function StatusPill({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    unassigned: "border-[#ddd8ca] bg-[#f7f5ef] text-[#7b766b]",
    planned: "border-[#ded7ee] bg-[#f5f1fb] text-[#665786]",
    "in-progress": "border-[#f0ddbc] bg-[#fff8ec] text-[#99632f]",
    completed: "border-[#cce2d7] bg-[#eef8f1] text-[#2f6b58]",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${styles[status]}`}>{status === "completed" ? <CheckCircle2 className="h-3 w-3" /> : status === "unassigned" ? <CircleDashed className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}{statusLabels[status]}</span>;
}

function TaskIcon({ type }: { type: CareTask["icon"] }) {
  const iconClass = "h-4 w-4";
  if (type === "transport") return <Navigation className={iconClass} />;
  if (type === "grocery") return <ShoppingBag className={iconClass} />;
  if (type === "checkin") return <MessageCircleHeart className={iconClass} />;
  return <FileText className={iconClass} />;
}

export default function Home() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [tasks, setTasks] = useState(initialTasks);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [noteText, setNoteText] = useState("Leela felt reassured after the appointment.");
  const [language, setLanguage] = useState("Marathi");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState("");
  const recordingTimer = useRef<number | null>(null);
  const { isAuthenticated } = useAuth();
  const acceptInvite = trpc.family.acceptInvite.useMutation();

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = sessionStorage.getItem("carebridge-invite-token");
    if (!token) return;
    acceptInvite.mutate({ token }, { onSettled: () => sessionStorage.removeItem("carebridge-invite-token") });
  }, [isAuthenticated, acceptInvite]);

  const completedCount = useMemo(() => tasks.filter((task) => task.status === "completed").length, [tasks]);
  const activeCount = tasks.filter((task) => task.status !== "completed").length;
  const confirmationText = language === "Marathi"
    ? "गुरुवारी सकाळी १० वाजता रोहन तुम्हाला सिटीकेअर हॉस्पिटलला घेऊन जाईल."
    : language === "Hindi"
      ? "गुरुवार सुबह 10 बजे रोहन आपको सिटीकेयर अस्पताल ले जाएगा।"
      : "Rohan will take you to CityCare Hospital on Thursday at 10:00 AM.";

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const cycleTaskStatus = (id: number) => {
    setTasks((current) => current.map((task) => {
      if (task.id !== id) return task;
      const next: TaskStatus = task.status === "unassigned" ? "planned" : task.status === "planned" ? "in-progress" : task.status === "in-progress" ? "completed" : "completed";
      if (next === "completed") showToast(`${task.title} marked complete`);
      return { ...task, status: next };
    }));
  };

  const assignTask = (id: number) => {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, owner: "Asha", initials: "AS", ownerTone: "bg-[#dcebe4] text-[#2f6b58]", status: "planned" } : task));
    showToast("Task assigned to Asha");
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recordingTimer.current) window.clearInterval(recordingTimer.current);
      recordingTimer.current = null;
      setIsRecording(false);
      setRecordingSeconds(12);
      setReviewOpen(true);
      return;
    }
    setIsRecording(true);
    setRecordingSeconds(0);
    recordingTimer.current = window.setInterval(() => {
      setRecordingSeconds((value) => {
        if (value >= 11) {
          if (recordingTimer.current) window.clearInterval(recordingTimer.current);
          recordingTimer.current = null;
          setIsRecording(false);
          setReviewOpen(true);
          return 12;
        }
        return value + 1;
      });
    }, 1000);
  };

  const retryRecording = () => {
    setReviewOpen(false);
    setRecordingSeconds(0);
    setIsRecording(true);
    recordingTimer.current = window.setInterval(() => {
      setRecordingSeconds((value) => {
        if (value >= 11) {
          if (recordingTimer.current) window.clearInterval(recordingTimer.current);
          recordingTimer.current = null;
          setIsRecording(false);
          setReviewOpen(true);
          return 12;
        }
        return value + 1;
      });
    }, 1000);
  };

  const navItems = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "Care plan", icon: ClipboardList, count: activeCount },
    { label: "Family", icon: UsersRound },
    { label: "Calendar", icon: CalendarDays },
    { label: "Memories", icon: BookHeart },
  ];
  const navTargets: Record<string, string> = { Overview: "overview", "Care plan": "care-plan", Family: "family", Calendar: "calendar", Memories: "memories" };
  const goToSection = (label: string) => {
    setActiveNav(label);
    setMobileNavOpen(false);
    document.getElementById(navTargets[label])?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#f6f4ef] text-[#202b29]">
      <div className="flex min-h-screen">
        <aside className={`${mobileNavOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 flex w-[244px] flex-col border-r border-[#e7e3d9] bg-[#fbfaf7] px-5 py-6 transition-transform duration-200 lg:static lg:translate-x-0`}>
          <div className="flex items-center gap-3 px-2">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#2f6b58] text-[#fffdf8] shadow-[0_6px_16px_rgba(47,107,88,.18)]">
              <HeartHandshake className="h-5 w-5" strokeWidth={2.25} />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#fbfaf7] bg-[#e7b86b]" />
            </div>
            <div>
              <p className="font-display text-[21px] font-semibold leading-none tracking-[-0.03em] text-[#263c35]">CareBridge</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a9488]">Family care, shared</p>
            </div>
          </div>

          <div className="mt-11 px-2 text-[10px] font-bold uppercase tracking-[0.17em] text-[#aaa398]">Your family</div>
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[#e7e3d9] bg-white px-3 py-3 shadow-[0_2px_8px_rgba(42,54,49,.03)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e9f3ee] text-[#2f6b58]"><UsersRound className="h-4 w-4" /></div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#2d3936]">The Patil family</p><p className="mt-0.5 text-xs text-[#918c82]">4 people · Mumbai</p></div>
            <ChevronDown className="h-4 w-4 text-[#aaa398]" />
          </div>

          <nav className="mt-8 space-y-1" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeNav === item.label;
              return <button key={item.label} onClick={() => goToSection(item.label)} className={`group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-colors ${active ? "bg-[#e6f0eb] text-[#2f6b58]" : "text-[#817f76] hover:bg-[#f1efe9] hover:text-[#36433e]"}`}><Icon className={`h-[18px] w-[18px] ${active ? "text-[#2f6b58]" : "text-[#a49f94]"}`} />{item.label}{item.count ? <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-white text-[#2f6b58]" : "bg-[#efede7] text-[#9b9589]"}`}>{item.count}</span> : null}</button>;
            })}
          </nav>

          <div className="mt-auto rounded-2xl border border-[#e5ded0] bg-[#f5efe3] p-4">
            <div className="flex items-center gap-2 text-[#99632f]"><ShieldCheck className="h-4 w-4" /><span className="text-xs font-bold">Private by design</span></div>
            <p className="mt-2 text-xs leading-5 text-[#887d6c]">Your family notes stay in your care circle. CareBridge organizes information — it never diagnoses.</p>
            <button className="mt-3 text-xs font-bold text-[#8e6031] underline decoration-[#c8a779] underline-offset-4">Read our privacy promise</button>
          </div>
          <div className="mt-4 flex items-center gap-2 px-2 text-xs font-semibold text-[#9a958a]"><Settings2 className="h-4 w-4" /> Settings <span className="ml-auto">⌘,</span></div>
        </aside>

        {mobileNavOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-[#21322e]/25 lg:hidden" onClick={() => setMobileNavOpen(false)} />}

        <main className="min-w-0 flex-1">
          <header className="flex h-[76px] items-center justify-between border-b border-[#e7e3d9] bg-[#fbfaf7]/90 px-5 backdrop-blur-md sm:px-8 lg:px-10">
            <div className="flex items-center gap-3"><button aria-label="Open navigation" className="rounded-lg p-2 text-[#817f76] hover:bg-[#f0eee8] lg:hidden" onClick={() => setMobileNavOpen(true)}><Menu className="h-5 w-5" /></button><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#aaa398]">Thursday, 14 March 2024</p><h1 className="mt-1 font-display text-[24px] font-semibold tracking-[-0.03em] text-[#263c35]">Good morning, Asha</h1></div></div>
            <div className="flex items-center gap-2 sm:gap-4"><button className="hidden h-10 items-center gap-2 rounded-xl border border-[#e4e0d7] bg-white px-3 text-xs font-semibold text-[#77756d] shadow-sm sm:flex"><Search className="h-4 w-4 text-[#aaa398]" /> Search family notes <span className="ml-3 rounded bg-[#f3f1eb] px-1.5 py-0.5 text-[10px] text-[#a49f94]">⌘ K</span></button><button aria-label="View notifications" className="relative rounded-xl p-2.5 text-[#77756d] hover:bg-[#f0eee8]"><Bell className="h-[19px] w-[19px]" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#d99562] ring-2 ring-[#fbfaf7]" /></button><Avatar initials="AS" tone="bg-[#dcebe4] text-[#2f6b58]" /></div>
          </header>

          <div className="mx-auto max-w-[1500px] px-5 pb-12 pt-7 sm:px-8 lg:px-10">
            <section id="overview" className="scroll-mt-24 flex flex-col justify-between gap-4 border-b border-[#e1ddd3] pb-6 sm:flex-row sm:items-end"><div><div className="flex items-center gap-2 text-xs font-bold text-[#2f6b58]"><span className="h-2 w-2 rounded-full bg-[#55a07f]" /> Sample family care plan · demo workspace</div><h2 className="mt-2 font-display text-[32px] font-semibold leading-tight tracking-[-0.04em] text-[#263c35] sm:text-[38px]">One less thing to carry<br className="hidden sm:block" /> on your own.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#77756d]">Here’s the latest on Leela’s appointment — and what each person can do to make Thursday feel a little easier.</p></div><Button className="h-11 shrink-0 rounded-xl bg-[#2f6b58] px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(47,107,88,.16)] hover:bg-[#265a4a]" onClick={() => setNoteOpen(true)}><Plus className="h-4 w-4" /> Add a care update</Button></section>

            <CareCommandCenter activeTasks={activeCount} completedTasks={completedCount} onRecord={toggleRecording} onReview={() => setReviewOpen(true)} onPlan={() => goToSection("Care plan")} />

            <section id="calendar" className="scroll-mt-24 mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.42fr)_minmax(330px,.78fr)]">
              <div className="overflow-hidden rounded-[22px] border border-[#dfddd4] bg-[#fffdf9] shadow-[0_8px_24px_rgba(43,56,50,.035)]">
                <div className="flex items-start justify-between border-b border-[#ebe7de] px-5 py-5 sm:px-7"><div><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#9b9589]"><span className="h-2 w-2 rounded-full bg-[#d99562]" /> Next up</div><h3 className="mt-2 font-display text-[25px] font-semibold tracking-[-0.035em] text-[#2b3934]">CityCare Hospital visit</h3><p className="mt-1 text-sm text-[#77756d]">Thursday, 15 March · 10:00 AM</p></div><button aria-label="More appointment actions" className="rounded-lg p-2 text-[#aaa398] hover:bg-[#f3f1eb]"><MoreHorizontal className="h-5 w-5" /></button></div>
                <div className="grid gap-0 md:grid-cols-[1.08fr_.92fr]">
                  <div className="border-b border-[#ebe7de] p-5 sm:p-7 md:border-b-0 md:border-r"><div className="flex items-center gap-3"><Avatar initials="LE" tone="bg-[#f3ddd7] text-[#9b5145]" size="lg" /><div><p className="text-sm font-bold text-[#2d3936]">For Leela Patil</p><p className="mt-0.5 text-xs text-[#969087]">Grandmother · Marathi preferred</p></div><span className="ml-auto rounded-full bg-[#f9eee9] px-2.5 py-1 text-[10px] font-bold text-[#9b5145]">Needs a little help</span></div><div className="mt-6 rounded-2xl bg-[#f5f1e9] p-4"><div className="flex items-start gap-3"><div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#99632f]"><Mic className="h-4 w-4" /></div><div><p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#a08768]">Leela’s voice note · Yesterday</p><p className="mt-2 text-sm leading-6 text-[#575a51]">“Asha, doctor said Thursday morning. I will need someone to take me, and please remind me about the tablets.”</p><button className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#8e6031]"><Play className="h-3.5 w-3.5 fill-current" /> Play original note <span className="font-normal text-[#b6a68f]">0:12</span></button></div></div></div><div className="mt-5 flex items-center gap-2 text-xs text-[#77756d]"><Sparkles className="h-4 w-4 text-[#c59555]" /><span>Demo extraction preview shows <strong className="text-[#3e4944]">5 things to organize</strong> from this note.</span></div><button className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#2f6b58]" onClick={() => setReviewOpen(true)}>Review demo extracted details <ArrowUpRight className="h-3.5 w-3.5" /></button></div>
                  <div className="bg-[#f8faf6] p-5 sm:p-7"><div className="flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#87988d]">Care plan status</p><span className="text-xs font-bold text-[#2f6b58]">{completedCount}/4 done</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#dfe9e0]"><div className="h-full rounded-full bg-[#4e9a76] transition-all duration-500" style={{ width: `${Math.max(12, (completedCount / 4) * 100)}%` }} /></div><div className="mt-5 space-y-4"><div className="flex items-start gap-3"><div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#2f6b58] shadow-sm"><CalendarDays className="h-3.5 w-3.5" /></div><div><p className="text-xs font-bold text-[#3e4944]">Appointment confirmed</p><p className="mt-1 text-[11px] leading-4 text-[#889188]">CityCare Hospital · Dr. Shah</p></div></div><div className="flex items-start gap-3"><div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#2f6b58] shadow-sm"><Languages className="h-3.5 w-3.5" /></div><div><p className="text-xs font-bold text-[#3e4944]">Confirmation ready</p><p className="mt-1 text-[11px] leading-4 text-[#889188]">{`In ${language} for Leela`}</p></div></div><div className="flex items-start gap-3"><div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#d99562] shadow-sm"><Clock3 className="h-3.5 w-3.5" /></div><div><p className="text-xs font-bold text-[#3e4944]">2 items need attention</p><p className="mt-1 text-[11px] leading-4 text-[#889188]">A ride and prescription folder</p></div></div></div><button className="mt-6 flex items-center gap-1 text-xs font-bold text-[#2f6b58]" onClick={() => goToSection("Care plan")}>Open full care plan <ChevronRight className="h-3.5 w-3.5" /></button></div>
                </div>
              </div>

              <div className="rounded-[22px] border border-[#dfddd4] bg-[#2f6b58] p-5 text-[#f7fbf7] shadow-[0_8px_24px_rgba(43,56,50,.06)] sm:p-6"><div className="flex items-start justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b4d6c3]">Voice note for Leela</p><h3 className="mt-2 font-display text-[24px] font-semibold tracking-[-0.035em]">Need to share a care update?</h3></div><div className="rounded-xl bg-white/10 p-2.5"><Mic className="h-5 w-5 text-[#d7eee1]" /></div></div><p className="mt-3 max-w-sm text-sm leading-6 text-[#d3e6da]">Speak naturally in your language. We’ll turn it into a clear plan for the family to review.</p><div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-white/15 bg-white/8 py-6"><button aria-label={isRecording ? "Stop recording" : "Start recording"} onClick={toggleRecording} className={`relative flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#f6b37a] text-[#553c2b] shadow-[0_8px_24px_rgba(15,42,30,.2)] transition-transform hover:scale-105 ${isRecording ? "ring-8 ring-[#f6b37a]/20" : ""}`}>{isRecording ? <Pause className="h-6 w-6 fill-current" /> : <Mic className="h-6 w-6" />}{isRecording && <span className="absolute inset-[-8px] animate-ping rounded-full border border-[#f6b37a]/40" />}</button><p className="mt-4 text-xs font-bold text-white">{isRecording ? `Listening… 00:${String(recordingSeconds).padStart(2, "0")}` : "Tap to record"}</p><p className="mt-1 text-[11px] text-[#b4d6c3]">{isRecording ? "Tap again when you’re finished" : "Up to 2 minutes · Marathi, Hindi or English"}</p></div><div className="mt-5 flex items-center gap-2 text-[11px] text-[#c1dfcc]"><ShieldCheck className="h-3.5 w-3.5" /> Only shared with your family care circle</div></div>
            </section>

            <section id="care-plan" className="scroll-mt-24 mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.42fr)_minmax(330px,.78fr)]">
              <div className="rounded-[22px] border border-[#dfddd4] bg-[#fffdf9] shadow-[0_8px_24px_rgba(43,56,50,.035)]"><div className="flex items-center justify-between border-b border-[#ebe7de] px-5 py-5 sm:px-7"><div><h3 className="font-display text-[22px] font-semibold tracking-[-0.035em] text-[#2b3934]">Who’s carrying what?</h3><p className="mt-1 text-xs text-[#908c82]">Small, clear steps make care feel shared.</p></div><button onClick={() => goToSection("Care plan")} className="hidden items-center gap-1 text-xs font-bold text-[#2f6b58] sm:flex">View all <ArrowUpRight className="h-3.5 w-3.5" /></button></div><div className="divide-y divide-[#efebe3]">{tasks.map((task) => <div key={task.id} className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-[#fcfbf7] sm:flex-row sm:items-center sm:px-7"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${task.status === "completed" ? "bg-[#e7f3eb] text-[#2f6b58]" : task.status === "unassigned" ? "bg-[#f3f1eb] text-[#969087]" : "bg-[#fff3e5] text-[#a9723d]"}`}><TaskIcon type={task.icon} /></div><div className="min-w-0 flex-1"><p className={`text-sm font-bold ${task.status === "completed" ? "text-[#7e9588] line-through" : "text-[#39443f]"}`}>{task.title}</p><p className="mt-1 text-xs text-[#969087]">{task.detail} · <span className="text-[#9f8c72]">{task.due}</span></p></div><div className="flex items-center gap-3 pl-12 sm:pl-0"><button className="flex items-center gap-2" onClick={() => task.owner === "Unassigned" ? assignTask(task.id) : showToast(`${task.owner} owns this task`)}><Avatar initials={task.initials} tone={task.ownerTone} size="sm" /><span className="hidden text-xs font-semibold text-[#77756d] md:inline">{task.owner}</span></button><button aria-label={`Update ${task.title}`} onClick={() => cycleTaskStatus(task.id)}><StatusPill status={task.status} /></button></div></div>)}</div></div>

              <div id="family" className="scroll-mt-24 rounded-[22px] border border-[#dfddd4] bg-[#fffdf9] p-5 shadow-[0_8px_24px_rgba(43,56,50,.035)] sm:p-6"><div className="flex items-start justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#a49f94]">Family circle</p><h3 className="mt-2 font-display text-[22px] font-semibold tracking-[-0.035em] text-[#2b3934]">Everyone has a place.</h3></div><button aria-label="More family options" onClick={() => goToSection("Family")} className="rounded-lg p-2 text-[#aaa398] hover:bg-[#f2f0ea]"><MoreHorizontal className="h-5 w-5" /></button></div><div className="mt-6 space-y-4">{familyMembers.map((member) => <div key={member.name} className="flex items-center gap-3"><div className="relative"><Avatar initials={member.initials} tone={member.tone} />{member.online && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#fffdf9] bg-[#55a07f]" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#46524d]">{member.name}</p><p className="truncate text-[11px] text-[#9a958a]">{member.role} · {member.ageGroup}</p><p className="truncate text-[10px] text-[#aaa398]">{member.accessibility}</p></div><span className="text-[10px] font-semibold text-[#aaa398]">{member.language}</span></div>)}</div><button onClick={() => goToSection("Family")} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-[#e4e0d7] py-2.5 text-xs font-bold text-[#77756d] hover:bg-[#f6f4ef]"><Plus className="h-3.5 w-3.5" /> Add family member</button></div>
            </section>

            <section id="memories" className="scroll-mt-24 mt-7 rounded-[22px] border border-[#dfddd4] bg-[#fffdf9] shadow-[0_8px_24px_rgba(43,56,50,.035)]"><div className="flex flex-col gap-3 border-b border-[#ebe7de] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#a49f94]"><BookHeart className="h-3.5 w-3.5 text-[#bd8660]" /> Private family memory</div><h3 className="mt-2 font-display text-[23px] font-semibold tracking-[-0.035em] text-[#2b3934]">Keep the human part, too.</h3></div>{noteSaved ? <span className="inline-flex items-center gap-2 rounded-full bg-[#eef8f1] px-3 py-1.5 text-xs font-bold text-[#2f6b58]"><CheckCircle2 className="h-3.5 w-3.5" /> Note saved in this demo</span> : <Button variant="outline" onClick={() => setNoteOpen(true)} className="h-10 rounded-xl border-[#dcd8ce] bg-transparent text-xs font-bold text-[#2f6b58] hover:bg-[#f5f3ed]"><Plus className="h-3.5 w-3.5" /> Add visit note</Button>}</div><div className="grid gap-0 md:grid-cols-[.86fr_1.14fr]"><div className="border-b border-[#ebe7de] bg-[#fbf8f1] p-5 sm:p-7 md:border-b-0 md:border-r"><div className="flex items-center gap-3"><Avatar initials="LE" tone="bg-[#f3ddd7] text-[#9b5145]" /><div><p className="text-sm font-bold text-[#46524d]">Last family note</p><p className="mt-0.5 text-xs text-[#a09b90]">12 March · Meera</p></div></div><p className="mt-5 font-display text-[19px] leading-7 text-[#4d564e]">{noteSaved ? `“${noteText}”` : "“Leela laughed when Rohan tried to explain the new phone camera.”"}</p></div><div className="p-5 sm:p-7"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf2ec] text-[#2f6b58]"><MessageCircleHeart className="h-4 w-4" /></div><div><p className="text-sm font-bold text-[#46524d]">A care plan can hold more than appointments.</p><p className="mt-1 max-w-xl text-sm leading-6 text-[#88877e]">After Thursday, capture the little moment someone will want to remember. Notes are private to your family circle.</p></div></div><button onClick={() => setNoteOpen(true)} className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#2f6b58]">Write a private note <ArrowUpRight className="h-3.5 w-3.5" /></button></div></div></section>

            <ProductionReadinessPanel />
            <footer className="mt-8 flex flex-col gap-2 border-t border-[#e5e1d8] pt-5 text-[11px] leading-5 text-[#a09b90] sm:flex-row sm:items-center sm:justify-between"><p>CareBridge organizes family information. It does not provide medical diagnosis or advice.</p><p className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[#6d9b82]" /> Your care circle is private</p></footer>
          </div>
        </main>
      </div>

      {toast && <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#233a32] px-4 py-3 text-xs font-bold text-white shadow-xl"><CheckCircle2 className="h-4 w-4 text-[#a9d3b9]" /> {toast}</div>}

      {reviewOpen && <div role="dialog" aria-modal="true" aria-labelledby="review-title" className="fixed inset-0 z-50 flex items-center justify-center bg-[#20312c]/35 p-4 backdrop-blur-sm"><div className="w-full max-w-xl overflow-hidden rounded-[24px] border border-[#e1ddd3] bg-[#fffdf9] shadow-2xl"><div className="flex items-start justify-between border-b border-[#ebe7de] p-5 sm:p-6"><div><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#2f6b58]"><Sparkles className="h-3.5 w-3.5" /> Review before sharing · demo</div><h3 id="review-title" className="mt-2 font-display text-[25px] font-semibold tracking-[-0.035em] text-[#2b3934]">We heard five things.</h3><p className="mt-1 text-sm text-[#85837a]">Check the details before they become part of the family care plan.</p></div><button aria-label="Close review" onClick={() => setReviewOpen(false)} className="rounded-lg p-2 text-[#aaa398] hover:bg-[#f2f0ea]"><X className="h-5 w-5" /></button></div><div className="space-y-3 p-5 sm:p-6">{[{ icon: CalendarDays, label: "Appointment", value: "CityCare Hospital · Thursday at 10:00 AM" }, { icon: Navigation, label: "Transportation", value: "Leela needs someone to take her" }, { icon: Plus, label: "Medication reminder", value: "Remember the tablets before leaving" }, { icon: ShoppingBag, label: "Grocery pickup", value: "Blood-pressure tablets at Green Cross Pharmacy" }, { icon: Phone, label: "Family check-in", value: "Asha to confirm the plan in Marathi" }].map((item) => { const Icon = item.icon; return <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-[#ebe7de] bg-[#fbfaf7] p-3.5"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f2ec] text-[#2f6b58]"><Icon className="h-4 w-4" /></div><div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#a49f94]">{item.label}</p><p className="mt-1 text-sm font-semibold text-[#46524d]">{item.value}</p></div><Check className="ml-auto h-4 w-4 shrink-0 text-[#55a07f]" /></div> })}<div className="rounded-2xl border border-[#d7e6da] bg-[#f4faf5] p-3.5 text-xs leading-5 text-[#3f6a50]"><p className="font-bold">Confirmation in {language}</p><p className="mt-1">{confirmationText}</p></div><div className="flex gap-3 rounded-2xl bg-[#fff7e9] p-3.5 text-xs leading-5 text-[#8b6e48]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#c18d4f]" /><p>CareBridge can organize a reminder, but please confirm any medication details with a qualified professional.</p></div></div><div className="flex flex-col-reverse gap-2 border-t border-[#ebe7de] p-5 sm:flex-row sm:justify-end sm:p-6"><Button variant="outline" onClick={retryRecording} className="h-11 rounded-xl border-[#ded9cf] text-sm font-bold text-[#77756d]">Retry voice note</Button><Button onClick={() => { setReviewOpen(false); showToast("Details saved in the demo workspace"); }} className="h-11 rounded-xl bg-[#2f6b58] px-5 text-sm font-bold text-white hover:bg-[#265a4a]"><Check className="h-4 w-4" /> Share in demo</Button></div></div></div>}

      {noteOpen && <div role="dialog" aria-modal="true" aria-labelledby="note-title" className="fixed inset-0 z-50 flex items-center justify-center bg-[#20312c]/35 p-4 backdrop-blur-sm"><div className="w-full max-w-lg overflow-hidden rounded-[24px] border border-[#e1ddd3] bg-[#fffdf9] shadow-2xl"><div className="flex items-start justify-between border-b border-[#ebe7de] p-5 sm:p-6"><div><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#a56c4a]"><BookHeart className="h-3.5 w-3.5" /> Private family memory</div><h3 id="note-title" className="mt-2 font-display text-[25px] font-semibold tracking-[-0.035em] text-[#2b3934]">What should the family remember?</h3></div><button aria-label="Close visit note" onClick={() => setNoteOpen(false)} className="rounded-lg p-2 text-[#aaa398] hover:bg-[#f2f0ea]"><X className="h-5 w-5" /></button></div><div className="p-5 sm:p-6"><label htmlFor="visit-note" className="text-xs font-bold text-[#5f675f]">A moment, update, or follow-up</label><textarea id="visit-note" autoFocus value={noteText} onChange={(event) => setNoteText(event.target.value)} className="mt-2 min-h-[130px] w-full resize-none rounded-2xl border border-[#dedbd2] bg-[#fbfaf7] p-4 text-sm leading-6 text-[#4d564e] outline-none transition focus:border-[#79a88f] focus:ring-4 focus:ring-[#dcebe4]" placeholder="Write in your own words…" /><div className="mt-4 flex items-center gap-2 text-xs text-[#918c82]"><ShieldCheck className="h-4 w-4 text-[#6d9b82]" /> Demo preview · family privacy applies after sign-in.</div></div><div className="flex justify-end gap-2 border-t border-[#ebe7de] p-5 sm:p-6"><Button variant="outline" onClick={() => setNoteOpen(false)} className="h-11 rounded-xl border-[#ded9cf] text-sm font-bold text-[#77756d]">Cancel</Button><Button onClick={() => { setNoteSaved(true); setNoteOpen(false); showToast("Private note saved in demo"); }} className="h-11 rounded-xl bg-[#2f6b58] px-5 text-sm font-bold text-white hover:bg-[#265a4a]"><BookHeart className="h-4 w-4" /> Save note</Button></div></div></div>}

      {language !== "English" && <div className="fixed bottom-5 right-5 z-40 rounded-2xl border border-[#d7e6da] bg-[#f5fbf6] px-4 py-3 text-xs text-[#3f6a50] shadow-lg"><p className="font-bold">Confirmation language: {language}</p><p className="mt-1">Asha · Leela’s care circle</p></div>}
      <button aria-label="Change confirmation language" onClick={() => setLanguage((current) => current === "English" ? "Marathi" : current === "Marathi" ? "Hindi" : "English")} className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full border border-[#dedbd2] bg-[#fffdf9] px-3 py-2 text-xs font-bold text-[#77756d] shadow-sm sm:flex"><Languages className="h-3.5 w-3.5 text-[#2f6b58]" /> {language}</button>
    </div>
  );
}
