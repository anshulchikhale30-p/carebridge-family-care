import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, Flower2, Heart, Leaf, ShieldCheck, SkipForward, Sparkles, TreePine, UsersRound } from "lucide-react";

type Member = { name: string; role: string; responsibility: string; emotion: string; initials: string; color: string; card: string; branch: string; flower: [number, number] };

const members: Member[] = [
  { name: "Dad", role: "Parent", responsibility: "Medication pickup", emotion: "Calm", initials: "DA", color: "#D8925E", card: "left-[1%] top-[38%]", branch: "M 400 340 C 300 300, 200 260, 100 230", flower: [100, 230] },
  { name: "Mom", role: "Parent", responsibility: "Meal planning", emotion: "Happy", initials: "MO", color: "#D97E91", card: "left-[14%] top-[12%]", branch: "M 400 310 C 340 250, 280 190, 220 130", flower: [220, 130] },
  { name: "Grandpa", role: "Care recipient", responsibility: "Morning check-in", emotion: "Tired", initials: "GP", color: "#8A7CB8", card: "left-[30%] top-[2%]", branch: "M 400 280 C 380 210, 370 140, 360 70", flower: [360, 70] },
  { name: "Grandma", role: "Care recipient", responsibility: "Thursday visit", emotion: "Worried", initials: "GM", color: "#B8795B", card: "right-[30%] top-[2%]", branch: "M 400 280 C 420 210, 430 140, 440 70", flower: [440, 70] },
  { name: "Sister", role: "Coordinator", responsibility: "Family updates", emotion: "Focused", initials: "SI", color: "#4D946F", card: "right-[14%] top-[12%]", branch: "M 400 310 C 460 250, 520 190, 580 130", flower: [580, 130] },
  { name: "Brother", role: "Driver", responsibility: "Hospital ride", emotion: "Ready", initials: "BR", color: "#5689AF", card: "right-[1%] top-[38%]", branch: "M 400 340 C 500 300, 600 260, 700 230", flower: [700, 230] },
  { name: "Friend", role: "Support", responsibility: "Evening call", emotion: "Caring", initials: "FR", color: "#789965", card: "left-[16%] bottom-[8%]", branch: "M 400 380 C 340 420, 280 460, 220 500", flower: [220, 500] },
  { name: "Wife", role: "Partner", responsibility: "Comfort & notes", emotion: "Steady", initials: "WI", color: "#A1729F", card: "right-[16%] bottom-[8%]", branch: "M 400 380 C 460 420, 520 460, 580 500", flower: [580, 500] },
];

const emotionTone: Record<string, string> = { Calm: "#43815E", Happy: "#A46B34", Tired: "#665787", Worried: "#A25C50", Focused: "#43815E", Ready: "#4D7694", Caring: "#43815E", Steady: "#875C80" };

const particles = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 4 + 2,
  delay: Math.random() * 8,
  duration: Math.random() * 4 + 6,
  opacity: Math.random() * 0.5 + 0.2,
}));

const fireflies = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  x: 5 + Math.random() * 90,
  y: 15 + Math.random() * 70,
  delay: Math.random() * 6,
  duration: Math.random() * 3 + 4,
}));

export default function FamilyCareTree() {
  const [active, setActive] = useState<Member>(members[3]);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hoveredMember, setHoveredMember] = useState<string | null>(null);

  useEffect(() => {
    if (!playing || elapsed >= 30) return;
    const timer = window.setInterval(() => setElapsed((value) => Math.min(30, value + 1)), 1000);
    return () => window.clearInterval(timer);
  }, [playing, elapsed]);

  const revealed = useMemo(() => members.map((_, index) => elapsed >= 2 + index * 3), [elapsed]);
  const finishIntro = () => { setElapsed(30); setPlaying(false); };

  return <section aria-labelledby="family-tree-title" className="relative mt-7 overflow-hidden rounded-[32px] bg-[#DCEFE0] shadow-[0_20px_60px_rgba(42,78,53,.14)] transition-colors duration-500 dark:bg-[#0d1f16] dark:shadow-[0_20px_60px_rgba(0,0,0,.4)]">
    <style>{`
      @keyframes trunkGrow { from { stroke-dashoffset:680; } to { stroke-dashoffset:0; } }
      @keyframes branchGrow { from { stroke-dashoffset:620; opacity:.1; } to { stroke-dashoffset:0; opacity:1; } }
      @keyframes memberBloom { 0% { opacity:0; transform:translate(-50%,12px) scale(.65); } 70% { transform:translate(-50%,-4px) scale(1.04); } 100% { opacity:1; transform:translate(-50%,0) scale(1); } }
      @keyframes flowerBloom { 0% { opacity:0; transform:scale(.2) rotate(-25deg); } 70% { transform:scale(1.2) rotate(8deg); } 100% { opacity:1; transform:scale(1) rotate(0); } }
      @keyframes canopyPulse { 0%,100% { opacity:.38; transform:scale(.95); } 50% { opacity:.7; transform:scale(1.05); } }
      @keyframes leafFloat { 0%,100% { transform:translateY(0) rotate(-8deg); } 50% { transform:translateY(-8px) rotate(8deg); } }
      @keyframes particleDrift { 0% { transform:translateY(0) translateX(0); opacity:0; } 10% { opacity:1; } 90% { opacity:1; } 100% { transform:translateY(-120px) translateX(20px); opacity:0; } }
      @keyframes fireflyGlow { 0%,100% { opacity:0; transform:scale(.5); } 50% { opacity:1; transform:scale(1.2); } }
      @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
      @keyframes glowPulse { 0%,100% { filter:drop-shadow(0 0 4px currentColor); } 50% { filter:drop-shadow(0 0 12px currentColor); } }
      @keyframes rootGrow { from { stroke-dashoffset:400; opacity:0; } to { stroke-dashoffset:0; opacity:1; } }
      @keyframes sparkle { 0%,100% { opacity:0; transform:scale(0) rotate(0deg); } 50% { opacity:1; transform:scale(1) rotate(180deg); } }
      .grow-trunk { stroke-dasharray:680; stroke-dashoffset:680; animation:trunkGrow 4s cubic-bezier(.2,.8,.2,1) forwards; }
      .grow-branch { stroke-dasharray:620; stroke-dashoffset:620; animation:branchGrow 2.4s cubic-bezier(.2,.8,.2,1) forwards; }
      .member-bloom { animation:memberBloom 1s both cubic-bezier(.2,.8,.2,1); }
      .flower-bloom { animation:flowerBloom .8s both cubic-bezier(.2,.8,.2,1); }
      .canopy-pulse { animation:canopyPulse 5s ease-in-out infinite; transform-origin:center; }
      .tree-leaf { animation:leafFloat 4s ease-in-out infinite; }
      .particle { animation:particleDrift linear infinite; }
      .firefly { animation:fireflyGlow ease-in-out infinite; }
      .shimmer-text { background:linear-gradient(90deg, currentColor 0%, currentColor 40%, rgba(255,255,255,.8) 50%, currentColor 60%, currentColor 100%); background-size:200% 100%; -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 3s ease-in-out infinite; }
      .glow-pulse { animation:glowPulse 2s ease-in-out infinite; }
      .root-grow { stroke-dasharray:400; stroke-dashoffset:400; animation:rootGrow 3s cubic-bezier(.2,.8,.2,1) forwards; }
      .sparkle { animation:sparkle 2s ease-in-out infinite; }
      .member-card-glow { box-shadow:0 0 20px rgba(78,201,160,.3), 0 12px 28px rgba(20,70,33,.2); }
    `}</style>
    <div className="relative min-h-[900px] overflow-hidden bg-[linear-gradient(180deg,#7DC8EE_0%,#C7E9F0_43%,#91C995_72%,#4E965B_100%)] transition-colors duration-500 dark:bg-[linear-gradient(180deg,#0a1f18_0%,#0d2820_43%,#113528_72%,#0d2820_100%)] sm:min-h-[850px] lg:min-h-[800px]">
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_17%_22%,white_0_1px,transparent_2px),radial-gradient(circle_at_78%_17%,white_0_1px,transparent_2px)] [background-size:115px_90px] dark:opacity-20" />
      <div className="absolute inset-x-0 bottom-0 h-[29%] bg-[linear-gradient(180deg,rgba(83,157,86,.18),rgba(39,106,51,.5))] dark:bg-[linear-gradient(180deg,rgba(20,60,40,.18),rgba(10,30,20,.6))]" />

      {particles.map((p) => (
        <div key={p.id} className="particle absolute rounded-full bg-white/60 dark:bg-[#4ec9a0]/40" style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`, opacity: p.opacity }} />
      ))}

      {fireflies.map((f) => (
        <div key={f.id} className="firefly absolute h-2 w-2 rounded-full bg-[#fff2b8] shadow-[0_0_8px_2px_rgba(255,242,184,.6)]" style={{ left: `${f.x}%`, top: `${f.y}%`, animationDelay: `${f.delay}s`, animationDuration: `${f.duration}s` }} />
      ))}

      <div className="relative z-20 flex flex-col gap-4 px-5 py-6 text-white sm:px-8 sm:py-8 lg:flex-row lg:items-start lg:justify-between lg:px-10">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
            <TreePine className="h-3.5 w-3.5" />
            Living family tree
            <span className="rounded-full border border-white/35 bg-white/15 px-2.5 py-1 tracking-[0.08em] backdrop-blur-sm">30 second growth story</span>
          </div>
          <h2 id="family-tree-title" className="shimmer-text mt-4 font-display text-[35px] font-semibold leading-[.98] tracking-[-0.05em] drop-shadow-[0_3px_16px_rgba(0,0,0,.2)] sm:text-[50px]">Care grows<br />branch by branch.</h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/90">Watch every person bloom into the care circle with their responsibility and emotion.</p>
        </div>
        <div className="flex w-fit items-center gap-3 rounded-2xl border border-white/35 bg-[#123E32]/42 px-4 py-3 shadow-lg backdrop-blur-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Heart className="h-5 w-5 fill-current" />
          </div>
          <div>
            <p className="text-xs font-bold">Growing together</p>
            <p className="mt-0.5 text-[10px] text-white/70">{elapsed < 30 ? `Branch ${Math.min(8, Math.floor(Math.max(0, elapsed - 1) / 3) + 1)} of 8` : "All branches connected"}</p>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 top-[18%] bottom-0">
        <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <ellipse cx="400" cy="200" rx="200" ry="150" fill="#4A965D" fillOpacity=".22" className="canopy-pulse" />
          <ellipse cx="400" cy="230" rx="250" ry="160" fill="#5BAE68" fillOpacity=".15" className="canopy-pulse" style={{ animationDelay: "1s" }} />
          <ellipse cx="400" cy="170" rx="160" ry="110" fill="#6BC47A" fillOpacity=".12" className="canopy-pulse" style={{ animationDelay: "2s" }} />

          <path d="M400 600 C386 510 388 420 400 340 C408 290 396 220 400 140" fill="none" stroke="#5B713C" strokeWidth="42" strokeLinecap="round" className={elapsed > 0 ? "grow-trunk" : "opacity-0"} />
          <path d="M400 600 C386 510 388 420 400 340 C408 290 396 220 400 140" fill="none" stroke="#6B8548" strokeWidth="42" strokeLinecap="round" opacity=".3" className={elapsed > 0 ? "grow-trunk" : "opacity-0"} style={{ animationDelay: ".2s" }} />

          <path d="M400 380 C340 430 270 490 200 530 M400 380 C460 430 530 490 600 530" fill="none" stroke="#668044" strokeWidth="20" strokeLinecap="round" className={elapsed >= 1 ? "grow-branch" : "opacity-0"} />

          <path d="M400 560 C360 580 320 595 280 600 M400 560 C440 580 480 595 520 600" fill="none" stroke="#5B713C" strokeWidth="14" strokeLinecap="round" className={elapsed >= 1 ? "root-grow" : "opacity-0"} style={{ animationDelay: "1s" }} />
          <path d="M400 580 C380 595 360 605 340 610 M400 580 C420 595 440 605 460 610" fill="none" stroke="#5B713C" strokeWidth="12" strokeLinecap="round" className={elapsed >= 1 ? "root-grow" : "opacity-0"} style={{ animationDelay: "1.5s" }} />

          {members.map((member, index) => (
            <path key={member.name} d={member.branch} fill="none" stroke={active.name === member.name || hoveredMember === member.name ? member.color : "#668044"} strokeWidth={active.name === member.name || hoveredMember === member.name ? "12" : "8"} strokeLinecap="round" className={revealed[index] ? "grow-branch" : "opacity-0"} style={{ animationDelay: `${Math.max(0, 1 + index * 3)}s`, filter: active.name === member.name ? `drop-shadow(0 0 8px ${member.color})` : "none" }} />
          ))}

          <circle cx="400" cy="340" r="32" fill="#2F6B58" stroke="#D9F0DC" strokeWidth="5" className="glow-pulse" style={{ color: "#4ec9a0" }} />
          <path d="M400 322c-10-12-27 3 0 24 27-21 10-36 0-24Z" fill="#ECFAEE" />

          {members.map((member, index) => (
            <g key={`${member.name}-flower`} className={revealed[index] ? "flower-bloom" : "opacity-0"} style={{ animationDelay: `${1.8 + index * 3}s` }}>
              <circle cx={member.flower[0]} cy={member.flower[1]} r="20" fill={member.color} fillOpacity=".95" />
              <circle cx={member.flower[0]} cy={member.flower[1]} r="7" fill="#FFF2B8" />
              <circle cx={member.flower[0]} cy={member.flower[1]} r="26" fill="none" stroke={member.color} strokeWidth="1.5" strokeOpacity=".4" className="canopy-pulse" />
            </g>
          ))}

          {members.map((member, index) => (
            <g key={`${member.name}-sparkle`} className={revealed[index] ? "sparkle" : "opacity-0"} style={{ animationDelay: `${2.5 + index * 3}s` }}>
              <circle cx={member.flower[0] + 14} cy={member.flower[1] - 12} r="2.5" fill="#FFF2B8" />
              <circle cx={member.flower[0] - 10} cy={member.flower[1] + 10} r="2" fill="#FFF2B8" />
            </g>
          ))}
        </svg>

        {members.map((member, index) => revealed[index] && (
          <button key={member.name} onMouseEnter={() => { setActive(member); setHoveredMember(member.name); }} onMouseLeave={() => setHoveredMember(null)} onFocus={() => setActive(member)} onClick={() => setActive(member)} className={`member-bloom absolute ${member.card} z-30 w-[136px] rounded-2xl border border-white/55 bg-white/92 p-3 text-left shadow-[0_12px_28px_rgba(20,70,33,.2)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_16px_36px_rgba(20,70,33,.3)] focus:outline-none focus:ring-4 focus:ring-white/70 dark:border-white/10 dark:bg-[#152019]/92 dark:shadow-[0_12px_28px_rgba(0,0,0,.4)] dark:hover:bg-[#1a2b23] sm:w-[168px] ${active.name === member.name ? "member-card-glow dark:border-[#4ec9a0]/30" : ""}`} style={{ borderLeft: `4px solid ${member.color}`, animationDelay: `${2 + index * 3}s` }}>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[9px] font-extrabold text-white" style={{ backgroundColor: member.color }}>{member.initials}</span>
              <span className="min-w-0">
                <span className="block truncate text-[11px] font-extrabold text-[#294335] dark:text-[#e8f0ec] sm:text-xs">{member.name}</span>
                <span className="block truncate text-[9px] text-[#79907E] dark:text-[#7a9488] sm:text-[10px]">{member.role}</span>
              </span>
              <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-[#4F9A64] dark:text-[#4ec9a0]" />
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 border-t border-[#E5EFE5] pt-2 dark:border-[#2a3f35]">
              <Flower2 className="h-3.5 w-3.5 shrink-0" style={{ color: member.color }} />
              <span className="truncate text-[10px] font-bold text-[#55705C] dark:text-[#b8d4c8]">{member.responsibility}</span>
            </div>
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#F4F8F3] px-2 py-0.5 text-[9px] font-bold dark:bg-[#1a2b23]" style={{ color: emotionTone[member.emotion] }}>
              <Sparkles className="h-2.5 w-2.5" /> {member.emotion}
            </span>
          </button>
        ))}

        <div className="tree-leaf absolute left-[46%] bottom-[25%] text-white/80"><Leaf className="h-7 w-7 rotate-[-24deg]" fill="currentColor" /></div>
        <div className="tree-leaf absolute left-[54%] bottom-[32%] text-white/65" style={{ animationDelay: "1.2s" }}><Leaf className="h-6 w-6 rotate-[28deg]" fill="currentColor" /></div>
        <div className="tree-leaf absolute left-[40%] bottom-[30%] text-white/50" style={{ animationDelay: "2.4s" }}><Leaf className="h-5 w-5 rotate-[15deg]" fill="currentColor" /></div>
        <div className="tree-leaf absolute left-[60%] bottom-[22%] text-white/60" style={{ animationDelay: ".8s" }}><Leaf className="h-6 w-6 rotate-[-35deg]" fill="currentColor" /></div>
      </div>

      <div className="absolute bottom-5 left-5 right-5 z-40 flex flex-col gap-3 sm:left-8 sm:right-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-[220px] rounded-2xl border border-white/35 bg-[#123E32]/60 px-4 py-3 text-white shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.16em] text-white/70">
                <span className="h-1.5 w-1.5 rounded-full bg-[#B7E0A9]" />
                {elapsed < 30 ? "Growing care circle" : "Tree complete"}
              </div>
              <p className="mt-1 text-sm font-bold">{elapsed < 30 ? "Watch every branch arrive" : `${active.name} is carrying ${active.responsibility.toLowerCase()}`}</p>
            </div>
            <span className="text-xl font-display font-semibold">{String(elapsed).padStart(2, "0")}<span className="text-xs text-white/55">/30</span></span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-[#B7E0A9] transition-[width] duration-1000" style={{ width: `${(elapsed / 30) * 100}%` }} />
          </div>
        </div>
        {playing && elapsed < 30 ? (
          <button onClick={finishIntro} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/35 bg-[#123E32]/55 px-3 py-2 text-[10px] font-bold text-white backdrop-blur-md transition-all hover:bg-[#123E32]/80 hover:scale-105">
            <SkipForward className="h-3.5 w-3.5" /> Skip growth
          </button>
        ) : (
          <div className="flex items-center gap-2 text-[10px] font-bold text-white/80">
            <ShieldCheck className="h-4 w-4" /> Private to this care circle
          </div>
        )}
      </div>
    </div>

    <div className="flex flex-col gap-4 border-t border-[#2B6247] bg-[#173F31] px-5 py-4 text-white transition-colors duration-500 dark:border-[#1a3a2e] dark:bg-[#0a1f18] sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
          <UsersRound className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-bold">Selected: {active.name} · {active.emotion}</p>
          <p className="mt-0.5 text-[10px] text-white/60">Select a flower or member branch to see their care story.</p>
        </div>
      </div>
      <button onClick={() => document.getElementById("handoff")?.scrollIntoView({ behavior: "smooth" })} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-[#245640] shadow-sm transition-all hover:bg-[#F2FAF3] hover:scale-105 dark:bg-[#4ec9a0] dark:text-[#0a1f18] dark:hover:bg-[#5ed4aa]">
        Add a care update <ArrowUpRight className="h-3.5 w-3.5" />
      </button>
    </div>
  </section>;
}
