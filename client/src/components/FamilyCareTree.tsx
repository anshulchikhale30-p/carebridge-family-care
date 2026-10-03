import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Check, Flower2, Heart, ShieldCheck, SkipForward, Sparkles, TreePine, UsersRound } from "lucide-react";

const VIEW_W = 800;
const VIEW_H = 600;
const INTRO_SECONDS = 20;
const REVEAL_START = 1.5;
const REVEAL_STEP = 2.4;
const CARD_W = 144;
const MIN_SCALE = 0.8;

type Member = {
  name: string;
  role: string;
  responsibility: string;
  emotion: string;
  initials: string;
  color: string;
  branch: string;
  tip: [number, number];
  card: [number, number];
};

const members: Member[] = [
  { name: "Dad", role: "Parent", responsibility: "Medication pickup", emotion: "Calm", initials: "DA", color: "#D8925E", branch: "M400 336 C356 330, 300 330, 252 334", tip: [252, 334], card: [150, 334] },
  { name: "Mom", role: "Parent", responsibility: "Meal planning", emotion: "Happy", initials: "MO", color: "#D97E91", branch: "M400 300 C356 254, 306 216, 268 196", tip: [268, 196], card: [166, 180] },
  { name: "Grandpa", role: "Care recipient", responsibility: "Morning check-in", emotion: "Tired", initials: "GP", color: "#8A7CB8", branch: "M400 268 C384 214, 348 160, 300 128", tip: [300, 128], card: [300, 54] },
  { name: "Grandma", role: "Care recipient", responsibility: "Thursday visit", emotion: "Worried", initials: "GM", color: "#B8795B", branch: "M400 268 C416 214, 452 160, 500 128", tip: [500, 128], card: [500, 54] },
  { name: "Sister", role: "Coordinator", responsibility: "Family updates", emotion: "Focused", initials: "SI", color: "#4D946F", branch: "M400 300 C444 254, 494 216, 532 196", tip: [532, 196], card: [634, 180] },
  { name: "Brother", role: "Driver", responsibility: "Hospital ride", emotion: "Ready", initials: "BR", color: "#5689AF", branch: "M400 336 C444 330, 500 330, 548 334", tip: [548, 334], card: [650, 334] },
  { name: "Friend", role: "Support", responsibility: "Evening call", emotion: "Caring", initials: "FR", color: "#789965", branch: "M400 386 C376 442, 350 476, 330 488", tip: [330, 488], card: [228, 450] },
  { name: "Wife", role: "Partner", responsibility: "Comfort & notes", emotion: "Steady", initials: "WI", color: "#A1729F", branch: "M400 386 C424 442, 450 476, 470 488", tip: [470, 488], card: [572, 450] },
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
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playing || elapsed >= INTRO_SECONDS) return;
    const timer = window.setInterval(() => setElapsed((value) => Math.min(INTRO_SECONDS, value + 1)), 1000);
    return () => window.clearInterval(timer);
  }, [playing, elapsed]);

  const revealed = useMemo(() => members.map((_, index) => elapsed >= REVEAL_START + index * REVEAL_STEP), [elapsed]);
  const grown = revealed.filter(Boolean).length;

  useEffect(() => {
    if (hoveredMember) return;
    const latest = revealed.lastIndexOf(true);
    if (latest >= 0) setActive(members[latest]);
  }, [revealed, hoveredMember]);

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setViewport({ width: rect.width, height: rect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scale = viewport.width && viewport.height ? Math.max(Math.min(viewport.width / VIEW_W, viewport.height / VIEW_H), MIN_SCALE) : 0;
  const stageWidth = VIEW_W * scale;
  const stageHeight = VIEW_H * scale;
  const overflows = stageWidth > viewport.width + 1;
  const u = (value: number) => Math.round(value * scale);
  const finishIntro = () => { setElapsed(INTRO_SECONDS); setPlaying(false); };

  return <section aria-labelledby="family-tree-title" className="relative mt-7 overflow-hidden rounded-[32px] bg-[#DCEFE0] shadow-[0_20px_60px_rgba(42,78,53,.14)] transition-colors duration-500 dark:bg-[#0d1f16] dark:shadow-[0_20px_60px_rgba(0,0,0,.4)]">
    <style>{`
      @keyframes trunkGrow { from { stroke-dashoffset:1; } to { stroke-dashoffset:0; } }
      @keyframes branchGrow { from { stroke-dashoffset:1; opacity:0; } to { stroke-dashoffset:0; opacity:1; } }
      @keyframes rootGrow { from { stroke-dashoffset:1; opacity:0; } to { stroke-dashoffset:0; opacity:1; } }
      @keyframes stemGrow { from { stroke-dashoffset:1; opacity:0; } to { stroke-dashoffset:0; opacity:1; } }
      @keyframes memberBloom { 0% { opacity:0; transform:translateY(16px) scale(.82); } 62% { opacity:1; transform:translateY(-3px) scale(1.035); } 100% { opacity:1; transform:translateY(0) scale(1); } }
      @keyframes flowerBloom { 0% { opacity:0; transform:scale(.2) rotate(-25deg); } 70% { transform:scale(1.22) rotate(8deg); } 100% { opacity:1; transform:scale(1) rotate(0); } }
      @keyframes canopyPulse { 0%,100% { opacity:.38; transform:scale(.95); } 50% { opacity:.7; transform:scale(1.05); } }
      @keyframes leafFloat { 0%,100% { transform:translateY(0) rotate(-8deg); } 50% { transform:translateY(-8px) rotate(8deg); } }
      @keyframes particleDrift { 0% { transform:translateY(0) translateX(0); opacity:0; } 10% { opacity:1; } 90% { opacity:1; } 100% { transform:translateY(-120px) translateX(20px); opacity:0; } }
      @keyframes fireflyGlow { 0%,100% { opacity:0; transform:scale(.5); } 50% { opacity:1; transform:scale(1.2); } }
      @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
      @keyframes glowPulse { 0%,100% { filter:drop-shadow(0 0 4px currentColor); } 50% { filter:drop-shadow(0 0 12px currentColor); } }
      @keyframes ringPulse { 0% { opacity:.85; transform:scale(.7); } 70% { opacity:0; transform:scale(1.55); } 100% { opacity:0; transform:scale(1.55); } }
      @keyframes sparkle { 0%,100% { opacity:0; transform:scale(0) rotate(0deg); } 50% { opacity:1; transform:scale(1) rotate(180deg); } }
      @keyframes sway { 0%,100% { transform:rotate(-1.2deg); } 50% { transform:rotate(1.2deg); } }
      .grow-trunk { stroke-dasharray:1; stroke-dashoffset:1; animation:trunkGrow 2.6s cubic-bezier(.2,.8,.2,1) both; }
      .grow-branch { stroke-dasharray:1; stroke-dashoffset:1; animation:branchGrow 1.1s cubic-bezier(.2,.8,.2,1) both; }
      .grow-root { stroke-dasharray:1; stroke-dashoffset:1; animation:rootGrow 2.4s cubic-bezier(.2,.8,.2,1) both; }
      .grow-stem { stroke-dasharray:1; stroke-dashoffset:1; animation:stemGrow .6s cubic-bezier(.2,.8,.2,1) both; }
      .member-bloom { animation:memberBloom .9s both cubic-bezier(.2,.8,.2,1); }
      .flower-bloom { animation:flowerBloom .8s both cubic-bezier(.2,.8,.2,1); transform-box:fill-box; transform-origin:center; }
      .canopy-pulse { animation:canopyPulse 5s ease-in-out infinite; transform-box:fill-box; transform-origin:center; }
      .ring-pulse { animation:ringPulse 1.8s ease-out infinite; transform-box:fill-box; transform-origin:center; }
      .tree-sway { animation:sway 7s ease-in-out infinite; transform-box:view-box; transform-origin:400px 600px; }
      .tree-leaf { animation:leafFloat 4s ease-in-out infinite; }
      .particle { animation:particleDrift linear infinite; }
      .firefly { animation:fireflyGlow ease-in-out infinite; }
      .shimmer-text { background:linear-gradient(90deg, currentColor 0%, currentColor 40%, rgba(255,255,255,.8) 50%, currentColor 60%, currentColor 100%); background-size:200% 100%; -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 3s ease-in-out infinite; }
      .glow-pulse { animation:glowPulse 2s ease-in-out infinite; }
      .sparkle { animation:sparkle 2s ease-in-out infinite; }
      .member-card-glow { box-shadow:0 0 22px rgba(78,201,160,.35), 0 14px 30px rgba(20,70,33,.24); }
      @media (prefers-reduced-motion: reduce) { .grow-trunk, .grow-branch, .grow-root, .grow-stem, .member-bloom, .flower-bloom { animation-duration:.01ms !important; animation-delay:0ms !important; } }
    `}</style>
    <div className="relative min-h-[860px] overflow-hidden bg-[linear-gradient(180deg,#7DC8EE_0%,#C7E9F0_43%,#91C995_72%,#4E965B_100%)] transition-colors duration-500 dark:bg-[linear-gradient(180deg,#0a1f18_0%,#0d2820_43%,#113528_72%,#0d2820_100%)] sm:min-h-[880px] lg:min-h-[900px]">
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_17%_22%,white_0_1px,transparent_2px),radial-gradient(circle_at_78%_17%,white_0_1px,transparent_2px)] [background-size:115px_90px] dark:opacity-20" />
      <div className="absolute inset-x-0 bottom-0 h-[29%] bg-[linear-gradient(180deg,rgba(83,157,86,.18),rgba(39,106,51,.5))] dark:bg-[linear-gradient(180deg,rgba(20,60,40,.18),rgba(10,30,20,.6))]" />

      {particles.map((p) => (
        <div key={p.id} className="particle absolute rounded-full bg-white/60 dark:bg-[#4ec9a0]/40" style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`, opacity: p.opacity }} />
      ))}

      {fireflies.map((f) => (
        <div key={f.id} className="firefly absolute h-2 w-2 rounded-full bg-[#fff2b8] shadow-[0_0_8px_2px_rgba(255,242,184,.6)]" style={{ left: `${f.x}%`, top: `${f.y}%`, animationDelay: `${f.delay}s`, animationDuration: `${f.duration}s` }} />
      ))}

      <div className="relative z-30 flex flex-col gap-4 px-5 py-6 text-white sm:px-8 sm:py-8 lg:flex-row lg:items-start lg:justify-between lg:px-10">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
            <TreePine className="h-3.5 w-3.5" />
            Living family tree
            <span className="rounded-full border border-white/35 bg-white/15 px-2.5 py-1 tracking-[0.08em] backdrop-blur-sm">{INTRO_SECONDS} second growth story</span>
          </div>
          <h2 id="family-tree-title" className="shimmer-text mt-4 font-display text-[35px] font-semibold leading-[.98] tracking-[-0.05em] drop-shadow-[0_3px_16px_rgba(0,0,0,.2)] sm:text-[50px]">Care grows<br />branch by branch.</h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/90">Every card sits on the tip of its own branch, blooming as that branch grows.</p>
        </div>
        <div className="flex w-fit items-center gap-3 rounded-2xl border border-white/35 bg-[#123E32]/42 px-4 py-3 shadow-lg backdrop-blur-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Heart className="h-5 w-5 fill-current" />
          </div>
          <div>
            <p className="text-xs font-bold">Growing together</p>
            <p className="mt-0.5 text-[10px] text-white/70">{elapsed < INTRO_SECONDS ? `Branch ${Math.max(1, grown)} of ${members.length}` : "All branches connected"}</p>
          </div>
        </div>
      </div>

      <div ref={stageRef} className="absolute inset-x-0 top-[244px] bottom-[100px] overflow-x-auto overflow-y-hidden">
        <div className="relative mx-auto" style={{ width: stageWidth, height: stageHeight }}>
          {scale > 0 && <>
            <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" aria-hidden="true">
              <ellipse cx="400" cy="196" rx="215" ry="150" fill="#4A965D" fillOpacity=".22" className="canopy-pulse" />
              <ellipse cx="400" cy="226" rx="262" ry="162" fill="#5BAE68" fillOpacity=".15" className="canopy-pulse" style={{ animationDelay: "1s" }} />
              <ellipse cx="400" cy="166" rx="168" ry="112" fill="#6BC47A" fillOpacity=".12" className="canopy-pulse" style={{ animationDelay: "2s" }} />

              <g className="tree-sway">
              <ellipse cx="400" cy="566" rx="330" ry="46" fill="#3C7C48" fillOpacity=".3" />
              <path d="M400 600 C386 520 388 430 400 348 C406 300 396 230 400 150" fill="none" stroke="#5B713C" strokeWidth="42" strokeLinecap="round" pathLength={1} className={elapsed > 0 ? "grow-trunk" : "opacity-0"} />
              <path d="M400 600 C386 520 388 430 400 348 C406 300 396 230 400 150" fill="none" stroke="#6B8548" strokeWidth="42" strokeLinecap="round" opacity=".3" pathLength={1} className={elapsed > 0 ? "grow-trunk" : "opacity-0"} style={{ animationDelay: ".2s" }} />

              <path d="M400 556 C360 578 320 594 280 600 M400 556 C440 578 480 594 520 600" fill="none" stroke="#5B713C" strokeWidth="14" strokeLinecap="round" pathLength={1} className={elapsed >= 1 ? "grow-root" : "opacity-0"} style={{ animationDelay: ".5s" }} />
              <path d="M400 580 C380 596 360 604 340 610 M400 580 C420 596 440 604 460 610" fill="none" stroke="#5B713C" strokeWidth="12" strokeLinecap="round" pathLength={1} className={elapsed >= 1 ? "grow-root" : "opacity-0"} style={{ animationDelay: ".9s" }} />

              {members.map((member, index) => {
                const lit = active.name === member.name || hoveredMember === member.name;
                return <path key={member.name} d={member.branch} pathLength={1} fill="none" stroke={lit ? member.color : "#668044"} strokeWidth={lit ? 13 : 9} strokeLinecap="round" className={revealed[index] ? "grow-branch" : "opacity-0"} style={{ animationDelay: `${index * 0.16}s`, filter: lit ? `drop-shadow(0 0 8px ${member.color})` : "none" }} />;
              })}

              <circle cx="400" cy="348" r="32" fill="#2F6B58" stroke="#D9F0DC" strokeWidth="5" className="glow-pulse" style={{ color: "#4ec9a0" }} />
              <path d="M400 330c-10-12-27 3 0 24 27-21 10-36 0-24Z" fill="#ECFAEE" />

              {members.map((member, index) => {
                const lit = active.name === member.name || hoveredMember === member.name;
                return <g key={`${member.name}-tip`} className={revealed[index] ? "grow-stem" : "opacity-0"} style={{ animationDelay: `${index * 0.16 + 0.55}s` }}>
                  <line x1={member.tip[0]} y1={member.tip[1]} x2={member.card[0]} y2={member.card[1]} pathLength={1} stroke={member.color} strokeWidth="3" strokeLinecap="round" strokeOpacity={lit ? ".95" : ".6"} />
                  <circle cx={member.tip[0]} cy={member.tip[1]} r={lit ? 30 : 26} fill="none" stroke={member.color} strokeWidth="2" strokeOpacity=".55" strokeDasharray="none" className="ring-pulse" />
                </g>;
              })}

              {members.map((member, index) => (
                <g key={`${member.name}-flower`} className={revealed[index] ? "flower-bloom" : "opacity-0"} style={{ animationDelay: `${index * 0.16 + 0.75}s` }}>
                  <circle cx={member.tip[0]} cy={member.tip[1]} r="20" fill={member.color} fillOpacity=".95" />
                  <circle cx={member.tip[0]} cy={member.tip[1]} r="7" fill="#FFF2B8" />
                  <circle cx={member.tip[0]} cy={member.tip[1]} r="26" fill="none" stroke={member.color} strokeWidth="1.5" strokeOpacity=".4" className="canopy-pulse" />
                </g>
              ))}

              {members.map((member, index) => (
                <g key={`${member.name}-sparkle`} className={revealed[index] ? "sparkle" : "opacity-0"} style={{ animationDelay: `${index * 0.16 + 1.1}s` }}>
                  <circle cx={member.tip[0] + 14} cy={member.tip[1] - 12} r="2.5" fill="#FFF2B8" />
                  <circle cx={member.tip[0] - 10} cy={member.tip[1] + 10} r="2" fill="#FFF2B8" />
                </g>
              ))}
            </g>

              <g className="tree-leaf" style={{ animationDelay: ".3s" }}><path d="M330 556 q26 -8 34 -30 q-26 6 -34 30Z" fill="#fff" fillOpacity=".7" /></g>
              <g className="tree-leaf" style={{ animationDelay: "1.1s" }}><path d="M470 562 q-26 -6 -36 -28 q28 4 36 28Z" fill="#fff" fillOpacity=".6" /></g>
              <g className="tree-leaf" style={{ animationDelay: "1.9s" }}><path d="M286 578 q24 -6 30 -26 q-24 6 -30 26Z" fill="#fff" fillOpacity=".45" /></g>
              <g className="tree-leaf" style={{ animationDelay: "2.7s" }}><path d="M520 582 q-22 -4 -30 -24 q24 4 30 24Z" fill="#fff" fillOpacity=".5" /></g>
            </svg>

            {members.map((member, index) => revealed[index] && (
              <div key={member.name} className="absolute z-20" style={{ left: u(member.card[0]), top: u(member.card[1]), width: u(CARD_W), transform: "translate(-50%,-50%)" }}>
                <div className="member-bloom" style={{ animationDelay: `${index * 0.16 + 0.95}s` }}>
                  <button
                    onMouseEnter={() => { setActive(member); setHoveredMember(member.name); }}
                    onMouseLeave={() => { setHoveredMember(null); setActive(members[revealed.lastIndexOf(true)] ?? members[0]); }}
                    onFocus={() => setActive(member)}
                    onClick={() => setActive(member)}
                    aria-pressed={active.name === member.name}
                    className={`block w-full rounded-2xl border border-white/60 bg-white/92 text-left shadow-[0_12px_28px_rgba(20,70,33,.2)] backdrop-blur-md transition-[transform,background-color,box-shadow] duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_16px_36px_rgba(20,70,33,.3)] focus:outline-none focus:ring-4 focus:ring-white/70 dark:border-white/10 dark:bg-[#152019]/94 dark:shadow-[0_12px_28px_rgba(0,0,0,.4)] dark:hover:bg-[#1a2b23] ${active.name === member.name ? "member-card-glow dark:border-[#4ec9a0]/40" : ""}`}
                    style={{ borderLeft: `4px solid ${member.color}`, padding: u(11), borderRadius: u(14) }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: u(7) }}>
                      <span className="flex shrink-0 items-center justify-center rounded-full font-extrabold text-white" style={{ width: u(26), height: u(26), backgroundColor: member.color, fontSize: u(9) }}>{member.initials}</span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span className="block truncate font-extrabold text-[#294335] dark:text-[#e8f0ec]" style={{ fontSize: u(11) }}>{member.name}</span>
                        <span className="block truncate text-[#79907E] dark:text-[#7a9488]" style={{ fontSize: u(9) }}>{member.role}</span>
                      </span>
                      <Check className="shrink-0 text-[#4F9A64] dark:text-[#4ec9a0]" style={{ width: u(13), height: u(13) }} />
                    </div>
                    <div className="flex items-center border-t border-[#E5EFE5] dark:border-[#2a3f35]" style={{ gap: u(6), marginTop: u(7), paddingTop: u(6) }}>
                      <Flower2 className="shrink-0" style={{ width: u(13), height: u(13), color: member.color }} />
                      <span className="truncate font-bold text-[#55705C] dark:text-[#b8d4c8]" style={{ fontSize: u(9.5) }}>{member.responsibility}</span>
                    </div>
                    <span className="mt-1.5 inline-flex items-center rounded-full bg-[#F4F8F3] dark:bg-[#1a2b23]" style={{ gap: u(4), padding: `${u(2)}px ${u(7)}px`, fontSize: u(9), fontWeight: 700, color: emotionTone[member.emotion] }}>
                      <Sparkles style={{ width: u(10), height: u(10) }} /> {member.emotion}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </>}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-[66px] left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/40 bg-[#123E32]/60 px-3 py-1 text-[9px] font-bold text-white/85 backdrop-blur-md" style={{ display: overflows ? "flex" : "none" }}>Swipe the tree to explore every branch</div>

      <div className="absolute bottom-5 left-5 right-5 z-40 flex flex-col gap-3 sm:left-8 sm:right-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-[220px] rounded-2xl border border-white/35 bg-[#123E32]/60 px-4 py-3 text-white shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.16em] text-white/70">
                <span className="h-1.5 w-1.5 rounded-full bg-[#B7E0A9]" />
                {elapsed < INTRO_SECONDS ? "Growing care circle" : "Tree complete"}
              </div>
              <p className="mt-1 text-sm font-bold">{elapsed < INTRO_SECONDS ? "Watch every branch arrive" : `${active.name} is carrying ${active.responsibility.toLowerCase()}`}</p>
            </div>
            <span className="text-xl font-display font-semibold">{String(elapsed).padStart(2, "0")}<span className="text-xs text-white/55">/{INTRO_SECONDS}</span></span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-[#B7E0A9] transition-[width] duration-1000" style={{ width: `${(elapsed / INTRO_SECONDS) * 100}%` }} />
          </div>
        </div>
        {playing && elapsed < INTRO_SECONDS ? (
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
