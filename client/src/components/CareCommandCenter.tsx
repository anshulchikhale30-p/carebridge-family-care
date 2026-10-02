import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  HeartPulse,
  Mic,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

type CareCommandCenterProps = {
  activeTasks: number;
  completedTasks: number;
  onRecord: () => void;
  onReview: () => void;
  onPlan: () => void;
};

const actions = [
  {
    eyebrow: "Due in 2 hours",
    title: "Confirm the ride to CityCare",
    detail: "Rohan has not acknowledged the 9:15 AM pickup yet.",
    tone: "border-[#f0ddbc] bg-[#fffaf1]",
    iconTone: "bg-[#fff0d7] text-[#a56c37]",
    icon: Clock3,
    action: "Open task",
  },
  {
    eyebrow: "Needs a human check",
    title: "Review Leela’s voice update",
    detail: "Five possible care details are ready to be confirmed.",
    tone: "border-[#d7e6da] bg-[#f5fbf6]",
    iconTone: "bg-[#e2f1e6] text-[#2f6b58]",
    icon: FileCheck2,
    action: "Review draft",
  },
  {
    eyebrow: "Before Thursday",
    title: "Assign the prescription folder",
    detail: "One care task still has no owner in this plan.",
    tone: "border-[#ded7ee] bg-[#f8f5fd]",
    iconTone: "bg-[#ece7f7] text-[#665786]",
    icon: UsersRound,
    action: "Assign owner",
  },
];

export default function CareCommandCenter({
  activeTasks,
  completedTasks,
  onRecord,
  onReview,
  onPlan,
}: CareCommandCenterProps) {
  const totalTasks = Math.max(activeTasks + completedTasks, 1);
  const completion = Math.round((completedTasks / totalTasks) * 100);

  return (
    <section aria-labelledby="command-center-title" className="care-story-section mt-14 overflow-hidden rounded-[30px] border border-[#d9e4dc] bg-[#eef7f0] shadow-[0_14px_36px_rgba(47,107,88,.07)]">
      <div className="grid lg:grid-cols-[1.05fr_.95fr]">
        <div className="relative overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border-[28px] border-[#dcecdf] opacity-80" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#4d8065]">
              <span className="h-2 w-2 rounded-full bg-[#55a07f]" />
              Today&apos;s care brief
              <span className="rounded-full bg-white/75 px-2.5 py-1 tracking-[0.08em] text-[#6e8c78]">Live family plan</span>
            </div>
            <div className="mt-4 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2f6b58] text-white shadow-[0_8px_18px_rgba(47,107,88,.2)]">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <h2 id="command-center-title" className="font-display text-[28px] font-semibold leading-tight tracking-[-0.04em] text-[#263c35] sm:text-[32px]">Make Thursday feel lighter.</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#63786b]">The plan is moving. Three decisions will keep Leela&apos;s appointment calm, shared, and ready for everyone.</p>
              </div>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/80 bg-white/65 p-3.5"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#8a9a8d]">Open actions</p><p className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[#2b493c]">{activeTasks}</p><p className="mt-0.5 text-[11px] text-[#789080]">across the plan</p></div>
              <div className="rounded-2xl border border-white/80 bg-white/65 p-3.5"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#8a9a8d]">Progress</p><p className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[#2b493c]">{completion}%</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#d7e7da]"><div className="h-full rounded-full bg-[#55a07f]" style={{ width: `${completion}%` }} /></div></div>
              <div className="rounded-2xl border border-white/80 bg-white/65 p-3.5"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#8a9a8d]">Next milestone</p><p className="mt-1 text-sm font-bold text-[#2b493c]">Thu · 10:00</p><p className="mt-0.5 text-[11px] text-[#789080]">CityCare Hospital</p></div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={onRecord} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2f6b58] px-4 text-xs font-bold text-white shadow-[0_6px_14px_rgba(47,107,88,.15)] transition hover:bg-[#265a4a]"><Mic className="h-3.5 w-3.5" /> Add voice update</button>
              <button onClick={onPlan} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#c9ded0] bg-white/70 px-4 text-xs font-bold text-[#2f6b58] transition hover:bg-white"><ArrowRight className="h-3.5 w-3.5" /> Open care plan</button>
            </div>
          </div>
        </div>
        <div className="border-t border-[#d9e4dc] bg-white/55 px-5 py-6 sm:px-8 sm:py-8 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b9b90]">Decision queue</p><h3 className="mt-1 font-display text-[22px] font-semibold tracking-[-0.035em] text-[#2b3934]">What needs you next</h3></div><span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff8ec] px-2.5 py-1 text-[10px] font-bold text-[#a56c37]"><Sparkles className="h-3 w-3" /> 3 moments</span></div>
          <div className="mt-5 space-y-3">{actions.map((action, index) => { const Icon = action.icon; return <button key={action.title} onClick={index === 1 ? onReview : onPlan} className={`group flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${action.tone}`}><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${action.iconTone}`}><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b9189]">{action.eyebrow}</p><p className="mt-1 text-xs font-bold text-[#46524d]">{action.title}</p><p className="mt-1 text-[11px] leading-4 text-[#8b8b81]">{action.detail}</p></div><ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-[#aaa398] transition group-hover:translate-x-0.5" /></button>; })}</div>
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-[#d7e6da] bg-[#f5fbf6] p-3 text-[11px] leading-5 text-[#52715d]"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4d8a66]" /><span><strong>Review-first protection.</strong> CareBridge can suggest structure; a person decides what becomes shared care information.</span></div>
          <button onClick={onReview} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#2f6b58]">View review queue <ArrowRight className="h-3.5 w-3.5" /></button>
          <div className="sr-only"><CheckCircle2 /></div>
        </div>
      </div>
    </section>
  );
}
