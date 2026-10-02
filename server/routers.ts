import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createAuditEvent,
  createCareAppointment,
  createCareNoteDraft,
  createEmergencyContact,
  createCareTask,
  createFamilyWithOwner,
  createInvitation,
  createVisitNote,
  getFamilyExport,
  getFamilyMembership,
  getFamilySnapshot,
  hasGrantedConsent,
  listFamiliesForUser,
  memberBelongsToFamily,
  redeemInvitation,
  updateCareAppointment,
  updateCareTask,
  updateConsent,
  reviewCareNote,
  saveNotificationPreferences,
  userCanAccessFamily,
} from "./db";

const familyIdInput = z.object({ familyId: z.number().int().positive() });
const taskStatus = z.enum(["unassigned", "planned", "in_progress", "blocked", "completed"]);
const taskCategory = z.enum(["transport", "medication", "grocery", "checkin", "document", "other"]);

async function requireFamilyAccess(userId: number, familyId: number) {
  if (!(await userCanAccessFamily(userId, familyId))) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You are not a member of this family care circle." });
  }
}

async function requireFamilyRole(userId: number, familyId: number, roles: Array<"recipient" | "coordinator" | "helper" | "viewer">) {
  const membership = await getFamilyMembership(userId, familyId);
  if (!membership || !roles.includes(membership.careRole)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Your family role cannot perform this action." });
  }
  return membership;
}

async function requireFamilyMember(memberId: number | undefined | null, familyId: number) {
  if (memberId && !(await memberBelongsToFamily(memberId, familyId))) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "That person is not part of this family circle." });
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  family: router({
    list: protectedProcedure.query(({ ctx }) => listFamiliesForUser(ctx.user.id)),
    create: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(160) })).mutation(({ ctx, input }) => createFamilyWithOwner(ctx.user.id, input.name)),
    snapshot: protectedProcedure.input(familyIdInput).query(async ({ ctx, input }) => {
      await requireFamilyAccess(ctx.user.id, input.familyId);
      return getFamilySnapshot(input.familyId, ctx.user.id);
    }),
    invite: protectedProcedure.input(z.object({ familyId: z.number().int().positive(), email: z.string().email(), role: z.enum(["recipient", "coordinator", "helper", "viewer"]).default("helper") })).mutation(async ({ ctx, input }) => {
      await requireFamilyRole(ctx.user.id, input.familyId, ["coordinator"]);
      const token = crypto.randomUUID();
      const tokenHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)).then((buffer) => Buffer.from(buffer).toString("hex"));
      const id = await createInvitation({ familyId: input.familyId, email: input.email, role: input.role, tokenHash, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 72) });
      await createAuditEvent({ familyId: input.familyId, actorUserId: ctx.user.id, action: "family.invitation_created", entityType: "invitation", entityId: id, metadata: { email: input.email, role: input.role } });
      return { id, invitePath: `/invite/${token}`, expiresInHours: 72 };
    }),
    saveNotificationPreferences: protectedProcedure.input(z.object({ familyId: z.number().int().positive(), quietStart: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).default("22:00"), quietEnd: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).default("07:00"), pushEnabled: z.boolean().default(true), emailEnabled: z.boolean().default(true), smsEnabled: z.boolean().default(false), weeklyDigest: z.boolean().default(true) })).mutation(async ({ ctx, input }) => {
      await requireFamilyAccess(ctx.user.id, input.familyId);
      await saveNotificationPreferences({ ...input, userId: ctx.user.id }, ctx.user.id);
      return { success: true } as const;
    }),
    acceptInvite: protectedProcedure.input(z.object({ token: z.string().min(20).max(200) })).mutation(async ({ ctx, input }) => {
      const tokenHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input.token)).then((buffer) => Buffer.from(buffer).toString("hex"));
      const familyId = await redeemInvitation(tokenHash, ctx.user.id, ctx.user.name ?? ctx.user.email ?? "Family member");
      return { familyId } as const;
    }),
    updateConsent: protectedProcedure.input(z.object({ familyId: z.number().int().positive(), memberId: z.number().int().positive(), consentType: z.enum(["voice_share", "health_context", "document_share", "ai_processing"]), granted: z.boolean() })).mutation(async ({ ctx, input }) => {
      await requireFamilyRole(ctx.user.id, input.familyId, ["coordinator"]);
      await requireFamilyMember(input.memberId, input.familyId);
      await updateConsent(input.familyId, input.memberId, input.consentType, input.granted);
      await createAuditEvent({ familyId: input.familyId, actorUserId: ctx.user.id, action: input.granted ? "consent.granted" : "consent.revoked", entityType: "consent", entityId: input.memberId, metadata: { consentType: input.consentType } });
      return { success: true } as const;
    }),
  }),
  care: router({
    createTask: protectedProcedure.input(z.object({ familyId: z.number().int().positive(), title: z.string().trim().min(2).max(200), detail: z.string().max(2000).optional(), category: taskCategory.default("other"), ownerMemberId: z.number().int().positive().optional(), dueAt: z.coerce.date().optional(), effortMinutes: z.number().int().positive().max(1440).optional() })).mutation(async ({ ctx, input }) => {
      await requireFamilyRole(ctx.user.id, input.familyId, ["coordinator", "helper"]);
      await requireFamilyMember(input.ownerMemberId, input.familyId);
      return createCareTask({ ...input, status: input.ownerMemberId ? "planned" : "unassigned", createdByUserId: ctx.user.id }, ctx.user.id);
    }),
    updateTask: protectedProcedure.input(z.object({ familyId: z.number().int().positive(), id: z.number().int().positive(), status: taskStatus.optional(), ownerMemberId: z.number().int().positive().nullable().optional(), blockedReason: z.string().max(1000).nullable().optional(), dueAt: z.coerce.date().nullable().optional() })).mutation(async ({ ctx, input }) => {
      await requireFamilyRole(ctx.user.id, input.familyId, ["coordinator", "helper"]);
      await requireFamilyMember(input.ownerMemberId, input.familyId);
      const { familyId, id, ...patch } = input;
      await updateCareTask(id, familyId, ctx.user.id, patch);
      return { success: true } as const;
    }),
    createNoteDraft: protectedProcedure.input(z.object({ familyId: z.number().int().positive(), authorMemberId: z.number().int().positive().optional(), sourceType: z.enum(["voice", "text"]).default("voice"), sourceText: z.string().trim().min(1).max(10000), visibility: z.enum(["family", "selected", "private"]).default("family"), consentStatus: z.enum(["pending", "granted", "revoked"]).default("pending"), extractionJson: z.record(z.string(), z.unknown()).optional(), confidence: z.number().int().min(0).max(100).optional() })).mutation(async ({ ctx, input }) => {
      const membership = await requireFamilyRole(ctx.user.id, input.familyId, ["recipient", "coordinator", "helper"]);
      const consentType = input.sourceType === "voice" ? "voice_share" : "health_context";
      if (input.consentStatus !== "granted" || !(await hasGrantedConsent(input.familyId, membership.id, consentType))) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A current family consent grant is required before sharing this note draft." });
      if (input.extractionJson && !(await hasGrantedConsent(input.familyId, membership.id, "ai_processing"))) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "AI-organized fields require a separate AI-processing consent grant." });
      const id = await createCareNoteDraft({ ...input, authorMemberId: membership.id, extractionStatus: "draft" }, ctx.user.id);
      return { id, requiresHumanReview: true } as const;
    }),
    reviewNote: protectedProcedure.input(z.object({ familyId: z.number().int().positive(), id: z.number().int().positive(), extractionStatus: z.enum(["reviewed", "confirmed", "rejected"]), extractionJson: z.record(z.string(), z.unknown()) })).mutation(async ({ ctx, input }) => {
      await requireFamilyRole(ctx.user.id, input.familyId, ["coordinator", "helper"]);
      await reviewCareNote(input.id, input.familyId, ctx.user.id, input.extractionStatus, input.extractionJson);
      return { success: true } as const;
    }),
    addVisitNote: protectedProcedure.input(z.object({ familyId: z.number().int().positive(), authorMemberId: z.number().int().positive().optional(), body: z.string().trim().min(1).max(5000), visibility: z.enum(["family", "selected", "private"]).default("family") })).mutation(async ({ ctx, input }) => {
      const membership = await requireFamilyRole(ctx.user.id, input.familyId, ["recipient", "coordinator", "helper"]);
      const id = await createVisitNote({ ...input, authorMemberId: membership.id }, ctx.user.id);
      return { id };
    }),
    createAppointment: protectedProcedure.input(z.object({ familyId: z.number().int().positive(), title: z.string().trim().min(2).max(200), startsAt: z.coerce.date(), endsAt: z.coerce.date().optional(), location: z.string().max(255).optional(), contactName: z.string().max(160).optional(), status: z.enum(["draft", "confirmed"]).default("confirmed") }).refine((value) => !value.endsAt || value.endsAt > value.startsAt, { message: "The appointment end must be after its start." })).mutation(async ({ ctx, input }) => {
      await requireFamilyRole(ctx.user.id, input.familyId, ["coordinator", "helper"]);
      const id = await createCareAppointment({ ...input, createdByUserId: ctx.user.id }, ctx.user.id);
      return { id, status: input.status } as const;
    }),
    updateAppointment: protectedProcedure.input(z.object({ familyId: z.number().int().positive(), id: z.number().int().positive(), status: z.enum(["draft", "confirmed", "completed", "cancelled"]).optional(), startsAt: z.coerce.date().optional(), endsAt: z.coerce.date().nullable().optional(), location: z.string().max(255).nullable().optional(), contactName: z.string().max(160).nullable().optional() })).mutation(async ({ ctx, input }) => {
      await requireFamilyRole(ctx.user.id, input.familyId, ["coordinator", "helper"]);
      if (input.startsAt && input.endsAt && input.endsAt <= input.startsAt) throw new TRPCError({ code: "BAD_REQUEST", message: "The appointment end must be after its start." });
      const { familyId, id, ...patch } = input;
      await updateCareAppointment(id, familyId, ctx.user.id, patch);
      return { success: true } as const;
    }),
    addEmergencyContact: protectedProcedure.input(z.object({ familyId: z.number().int().positive(), name: z.string().trim().min(2).max(160), relationship: z.string().max(80).optional(), phone: z.string().trim().min(5).max(40), preferredHospital: z.string().max(255).optional() })).mutation(async ({ ctx, input }) => {
      await requireFamilyRole(ctx.user.id, input.familyId, ["coordinator"]);
      const id = await createEmergencyContact(input, ctx.user.id);
      return { id } as const;
    }),
    exportCalendar: protectedProcedure.input(z.object({ familyId: z.number().int().positive(), title: z.string().default("CareBridge appointments") })).query(async ({ ctx, input }) => {
      await requireFamilyAccess(ctx.user.id, input.familyId);
      const snapshot = await getFamilySnapshot(input.familyId);
      const escapeIcs = (value: string) => value.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/[\r\n]+/g, " ");
      const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CareBridge//Care calendar//EN", `X-WR-CALNAME:${escapeIcs(input.title)}`];
      for (const appointment of (snapshot?.appointments ?? []).filter((item) => item.status === "confirmed" || item.status === "completed")) {
        const start = appointment.startsAt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
        const end = appointment.endsAt ? appointment.endsAt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z") : null;
        const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
        lines.push("BEGIN:VEVENT", `UID:carebridge-${appointment.id}@carebridge`, `DTSTAMP:${stamp}`, `DTSTART:${start}`, ...(end ? [`DTEND:${end}`] : []), `SUMMARY:${escapeIcs(appointment.title)}`, `LOCATION:${escapeIcs(appointment.location ?? "")}`, `DESCRIPTION:${escapeIcs(appointment.contactName ? `Contact: ${appointment.contactName}` : "")}`, "END:VEVENT");
      }
      lines.push("END:VCALENDAR");
      return { ics: lines.join("\r\n") };
    }),
    exportData: protectedProcedure.input(familyIdInput).query(async ({ ctx, input }) => {
      await requireFamilyRole(ctx.user.id, input.familyId, ["coordinator"]);
      const snapshot = await getFamilyExport(input.familyId);
      await createAuditEvent({ familyId: input.familyId, actorUserId: ctx.user.id, action: "family.data_exported", entityType: "family" });
      return snapshot;
    }),
    requestDeletion: protectedProcedure.input(z.object({ familyId: z.number().int().positive(), confirmFamilyName: z.string().min(2) })).mutation(async ({ ctx, input }) => {
      await requireFamilyRole(ctx.user.id, input.familyId, ["coordinator"]);
      const snapshot = await getFamilySnapshot(input.familyId);
      if (snapshot?.family?.name !== input.confirmFamilyName) throw new TRPCError({ code: "BAD_REQUEST", message: "Type the family name exactly to request deletion." });
      await createAuditEvent({ familyId: input.familyId, actorUserId: ctx.user.id, action: "family.deletion_requested", entityType: "family", metadata: { requiresConfirmation: true } });
      return { requested: true, message: "Deletion request recorded for review." } as const;
    }),
    audit: protectedProcedure.input(familyIdInput).query(async ({ ctx, input }) => {
      await requireFamilyAccess(ctx.user.id, input.familyId);
      const snapshot = await getFamilySnapshot(input.familyId);
      return snapshot?.recentAudit ?? [];
    }),
  }),
});

export type AppRouter = typeof appRouter;
