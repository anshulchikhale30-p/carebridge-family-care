import { useState } from "react";
import { ArrowRight, CheckCircle2, HeartHandshake, LockKeyhole, UsersRound } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function Invite() {
  const { token = "" } = useParams<{ token: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [message, setMessage] = useState("");
  const acceptInvite = trpc.family.acceptInvite.useMutation({
    onSuccess: () => navigate("/"),
    onError: (error) => setMessage(error.message),
  });

  const accept = () => {
    if (!isAuthenticated) {
      try { sessionStorage.setItem("carebridge-invite-token", token); startLogin(); } catch { setMessage("Sign-in is not configured in this preview."); }
      return;
    }
    acceptInvite.mutate({ token });
  };

  return <main className="flex min-h-screen items-center justify-center bg-[#f6f4ef] p-5 text-[#202b29]"><section className="w-full max-w-lg overflow-hidden rounded-[28px] border border-[#e1ddd3] bg-[#fffdf9] shadow-[0_18px_48px_rgba(43,56,50,.09)]"><div className="bg-[#2f6b58] px-6 py-8 text-white sm:px-9"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12"><HeartHandshake className="h-6 w-6" /></div><p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#b9ddc6]">CareBridge family circle</p><h1 className="mt-2 font-display text-[30px] font-semibold tracking-[-0.04em]">You’ve been invited to share care.</h1><p className="mt-3 text-sm leading-6 text-[#d8ebe0]">Join your family’s private care circle to coordinate appointments, tasks, and the moments that matter.</p></div><div className="p-6 sm:p-9"><div className="space-y-4"><div className="flex gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f2ec] text-[#2f6b58]"><UsersRound className="h-4 w-4" /></div><div><p className="text-sm font-bold text-[#46524d]">Shared responsibility</p><p className="mt-1 text-xs leading-5 text-[#8c8a81]">See what needs doing, who has accepted it, and what is still waiting.</p></div></div><div className="flex gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff3e5] text-[#a56c37]"><LockKeyhole className="h-4 w-4" /></div><div><p className="text-sm font-bold text-[#46524d]">Private by default</p><p className="mt-1 text-xs leading-5 text-[#8c8a81]">Only members of the family circle can see its notes and care plan.</p></div></div></div>{message && <div className="mt-6 rounded-xl border border-[#f0dfcc] bg-[#fff8ee] px-3 py-2 text-xs font-semibold leading-5 text-[#9b663d]">{message}</div>}<Button onClick={accept} disabled={acceptInvite.isPending} className="mt-7 h-12 w-full rounded-xl bg-[#2f6b58] text-sm font-bold text-white hover:bg-[#265a4a]">{isAuthenticated ? <>{acceptInvite.isPending ? "Joining…" : `Join as ${user?.name ?? "family member"}`}<ArrowRight className="h-4 w-4" /></> : <>Sign in to join<ArrowRight className="h-4 w-4" /></>}</Button><p className="mt-4 text-center text-[11px] leading-5 text-[#aaa398]">You can leave the family circle or revoke access at any time.</p>{acceptInvite.isSuccess && <p className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-[#2f6b58]"><CheckCircle2 className="h-4 w-4" /> You’re in.</p>}</div></section></main>;
}
