import { useState } from "react";
import { Flower2, Heart, Leaf, Sparkles, TreePine } from "lucide-react";

type Member = {
  name: string;
  role: string;
  responsibility: string;
  emotion: string;
  initials: string;
  color: string;
  position: string;
  branch: string;
};

const members: Member[] = [
  { name: "Dad", role: "Parent", responsibility: "Medication pickup", emotion: "Calm", initials: "DA", color: "#d99562", position: "left-[3%] top-[27%]", branch: "M 50% 57% C 39% 45%, 28% 35%, 13% 31%" },
  { name: "Mom", role: "Parent", responsibility: "Meal planning", emotion: "Happy", initials: "MO", color: "#d77e91", position: "left-[17%] top-[9%]", branch: "M 50% 52% C 45% 37%, 36% 21%, 25% 15%" },
  { name: "Grandpa", role: "Care recipient", responsibility: "Morning check-in", emotion: "Tired", initials: "GP", color: "#8f83bd", position: "left-[36%] top-[1%]", branch: "M 50% 48% C 48% 31%, 46% 16%, 43% 8%" },
  { name: "Grandma", role: "Care recipient", responsibility: "Thursday visit", emotion: "Worried", initials: "GM", color: "#bd8660", position: "right-[34%] top-[1%]", branch: "M 50% 48% C 53% 31%, 55% 16%, 57% 8%" },
  { name: "Sister", role: "Coordinator", responsibility: "Family updates", emotion: "Focused", initials: "SI", color: "#5b9e7b", position: "right-[15%] top-[10%]", branch: "M 50% 52% C 56% 37%, 65% 21%, 75% 15%" },
  { name: "Brother", role: "Driver", responsibility: "Hospital ride", emotion: "Ready", initials: "BR", color: "#5b91b4", position: "right-[2%] top-[27%]", branch: "M 50% 57% C 61% 45%, 72% 35%, 87% 31%" },
  { name: "Friend", role: "Support", responsibility: "Evening call", emotion: "Caring", initials: "FR", color: "#7b9d67", position: "left-[18%] bottom-[8%]", branch: "M 50% 67% C 43% 73%, 33% 78%, 25% 83%" },
  { name: "Wife", role: "Partner", responsibility: "Comfort & notes", emotion: "Steady", initials: "WI", color: "#af7da8", position: "right-[18%] bottom-[8%]", branch: "M 50% 67% C 57% 73%, 67% 78%, 75% 83%" },
];

const emotionTone: Record<string, string> = {
  Calm: "bg-[#edf7f0] text-[#4d8065]",
  Happy: "bg-[#fff3df] text-[#a56c37]",
  Tired: "bg-[#f0eef9] text-[#665786]",
  Worried: "bg-[#fff0ed] text-[#a55d50]",
  Focused: "bg-[#edf7f0] text-[#4d8065]",
  Ready: "bg-[#edf4fa] text-[#4c7897]",
  Caring: "bg-[#edf7f0] text-[#4d8065]",
  Steady: "bg-[#f7edf6] text-[#8b5c82]",
};

export default function FamilyCareTree() {
  const [active, setActive] = useState<Member>(members[3]);
  return <section aria-labelledby="family-tree-title" className="family-tree relative mt-7 overflow-hidden rounded-[30px] border border-[#cfe2d5] bg-[#eef8f0] shadow-[0_16px_42px_rgba(47,107,88,.08)]">
    <style>{`@keyframes treeGrow { from { opacity: 0; transform: scaleY(.65); transform-origin: 50% 100%; } to { opacity: 1; transform: scaleY(1); transform-origin: 50% 100%; } } @keyframes branchGrow { from { stroke-dashoffset: 900; } to { stroke-dashoffset: 0; } } @keyframes flowerBloom { 0% { opacity: 0; transform: scale(.3) rotate(-20deg); } 70% { transform: scale(1.12) rotate(4deg); } 100% { opacity: 1; transform: scale(1) rotate(0deg); } } @keyframes floatLeaf { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-7px) rotate(5deg); } } .tree-trunk { animation: treeGrow 1.1s cubic-bezier(.2,.8,.2,1) both; } .tree-branch { stroke-dasharray: 900; stroke-dashoffset: 900; animation: branchGrow 1.2s .35s ease-out forwards; } .tree-card { animation: flowerBloom .65s both; } .tree-leaf { animation: floatLeaf 4s ease-in-out infinite; }`}</style>
    <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full border-[26px] border-white/35" />
    <div className="relative z-10 flex flex-col justify-between gap-5 px-5 py-6 sm:px-8 sm:py-8 lg:flex-row lg:items-start"><div><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#4d8065]"><TreePine className="h-3.5 w-3.5" /> Family care tree <span className="rounded-full bg-white/70 px-2.5 py-1 tracking-[0.08em] text-[#6e8c78]">8 people · connected by care</span></div><h2 id="family-tree-title" className="mt-3 max-w-xl font-display text-[29px] font-semibold leading-tight tracking-[-0.04em] text-[#263c35] sm:text-[35px]">Every branch carries a little less alone.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#63786b]">Hover over a person to see what they are carrying and how they are feeling today. Flowers represent the care they bring to the family.</p></div><div className="flex items-center gap-2 rounded-2xl border border-white/80 bg-white/65 px-3 py-2.5 text-xs text-[#52715d]"><Heart className="h-4 w-4 text-[#c27683]" fill="currentColor" /> Shared care, visible emotion</div></div>
    <div className="relative h-[570px] min-w-[700px] sm:h-[520px] lg:h-[470px]">
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M 50 100 C 47 88, 48 75, 50 59 C 51 48, 48 34, 50 19" fill="none" stroke="#6f9976" strokeWidth="3.1" strokeLinecap="round" className="tree-trunk" /><path d="M 50 61 C 45 70, 36 79, 24 86 M 50 61 C 55 70, 64 79, 76 86" fill="none" stroke="#6f9976" strokeWidth="2.2" strokeLinecap="round" className="tree-branch" />{members.map((member) => <path key={member.name} d={member.branch} fill="none" stroke={active.name === member.name ? member.color : "#8bb196"} strokeWidth={active.name === member.name ? "2.4" : "1.6"} strokeLinecap="round" className="tree-branch" />)}</svg>
      <div className="tree-trunk absolute bottom-[3%] left-1/2 flex -translate-x-1/2 flex-col items-center"><div className="relative flex h-28 w-24 items-end justify-center"><span className="absolute bottom-0 h-24 w-8 rounded-[60%_40%_30%_30%] bg-[#6f9976]" /><span className="absolute bottom-12 left-1 h-16 w-5 rotate-[-32deg] rounded-full bg-[#78a681]" /><span className="absolute bottom-12 right-1 h-16 w-5 rotate-[32deg] rounded-full bg-[#78a681]" /></div><div className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5b8064]">Shared care</div></div>
      {members.map((member, index) => <button key={member.name} onMouseEnter={() => setActive(member)} onFocus={() => setActive(member)} onClick={() => setActive(member)} className={`tree-card absolute ${member.position} z-20 w-[142px] rounded-2xl border-2 bg-white/90 p-2.5 text-left shadow-[0_10px_22px_rgba(55,93,67,.1)] backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(55,93,67,.18)] focus:outline-none focus:ring-4 focus:ring-[#9fc4a7]/45 sm:w-[154px]`} style={{ borderColor: active.name === member.name ? member.color : "rgba(207,226,213,.95)", animationDelay: `${0.75 + index * 0.08}s` }}><div className="flex items-center gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: member.color }}>{member.initials}</span><span className="min-w-0"><span className="block truncate text-xs font-bold text-[#3c5143]">{member.name}</span><span className="block truncate text-[10px] text-[#8a9b8e]">{member.role}</span></span></div><div className="mt-2 flex items-center gap-1.5"><span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ color: member.color }}><Flower2 className="h-4 w-4" /></span><span className="truncate text-[10px] font-bold text-[#617264]">{member.responsibility}</span></div><span className={`mt-1.5 inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${emotionTone[member.emotion]}`}><Sparkles className="h-2.5 w-2.5" /> {member.emotion}</span></button>)}
      <div className="tree-leaf absolute left-[47%] top-[35%] text-[#8eb897]"><Leaf className="h-5 w-5 rotate-[-25deg]" fill="currentColor" /></div><div className="tree-leaf absolute left-[52%] top-[29%] text-[#79a985]" style={{ animationDelay: "1.2s" }}><Leaf className="h-4 w-4 rotate-[35deg]" fill="currentColor" /></div><div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-2xl border border-white/80 bg-white/75 px-4 py-2 text-center shadow-sm"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7d9782]">Right now</p><p className="mt-0.5 text-xs font-bold text-[#45634d]">{active.name} is carrying <span className="text-[#2f6b58]">{active.responsibility.toLowerCase()}</span></p><p className="mt-0.5 text-[10px] text-[#789080]">Feeling {active.emotion.toLowerCase()}</p></div>
    </div>
  </section>;
}
