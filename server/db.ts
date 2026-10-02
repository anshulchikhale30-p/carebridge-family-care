import { and, desc, eq, gt, inArray, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  auditEvents,
  careAppointments,
  careNotes,
  careTasks,
  familyCircles,
  familyConsents,
  familyDocuments,
  familyInvitations,
  familyMembers,
  emergencyContacts,
  InsertUser,
  notificationPreferences,
  users,
  visitNotes,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function userCanAccessFamily(userId: number, familyId: number) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select({ id: familyCircles.id })
    .from(familyCircles)
    .leftJoin(familyMembers, eq(familyMembers.familyId, familyCircles.id))
    .where(and(eq(familyCircles.id, familyId), or(eq(familyCircles.createdByUserId, userId), eq(familyMembers.userId, userId))))
    .limit(1);
  return rows.length > 0;
}

export async function getFamilyMembership(userId: number, familyId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(familyMembers).where(and(eq(familyMembers.userId, userId), eq(familyMembers.familyId, familyId))).limit(1);
  return rows[0];
}

export async function memberBelongsToFamily(memberId: number, familyId: number) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ id: familyMembers.id }).from(familyMembers).where(and(eq(familyMembers.id, memberId), eq(familyMembers.familyId, familyId))).limit(1);
  return rows.length > 0;
}

export async function hasGrantedConsent(familyId: number, memberId: number, consentType: "voice_share" | "health_context" | "document_share" | "ai_processing") {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select().from(familyConsents).where(and(eq(familyConsents.familyId, familyId), eq(familyConsents.memberId, memberId), eq(familyConsents.consentType, consentType))).orderBy(desc(familyConsents.createdAt)).limit(1);
  return Boolean(rows[0]?.grantedAt && !rows[0]?.revokedAt);
}

export async function redeemInvitation(tokenHash: string, userId: number, displayName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(familyInvitations).where(eq(familyInvitations.tokenHash, tokenHash)).limit(1);
  const invitation = rows[0];
  if (!invitation) throw new Error("This invitation is invalid or expired.");
  const existing = await db.select().from(familyMembers).where(and(eq(familyMembers.familyId, invitation.familyId), eq(familyMembers.userId, userId))).limit(1);
  if (invitation.status === "accepted" && existing.length > 0) return invitation.familyId;
  if (invitation.status !== "pending" || invitation.expiresAt <= new Date()) throw new Error("This invitation is invalid or expired.");
  if (existing.length === 0) {
    try {
      await db.insert(familyMembers).values({ familyId: invitation.familyId, userId, displayName, relationship: "Family member", ageGroup: "adult", preferredLanguage: "English", accessibilityNeeds: "Text + voice", careRole: invitation.role, consentStatus: "pending" });
    } catch (error) {
      const afterRace = await db.select().from(familyMembers).where(and(eq(familyMembers.familyId, invitation.familyId), eq(familyMembers.userId, userId))).limit(1);
      if (afterRace.length === 0) throw error;
    }
  }
  await db.update(familyInvitations).set({ status: "accepted" }).where(and(eq(familyInvitations.id, invitation.id), eq(familyInvitations.status, "pending")));
  return invitation.familyId;
}

export async function listFamiliesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const owned = await db.select().from(familyCircles).where(eq(familyCircles.createdByUserId, userId));
  const memberships = await db.select({ familyId: familyMembers.familyId }).from(familyMembers).where(eq(familyMembers.userId, userId));
  const ids = Array.from(new Set([...owned.map((family) => family.id), ...memberships.map((membership) => membership.familyId)]));
  if (ids.length === 0) return [];
  return db.select().from(familyCircles).where(inArray(familyCircles.id, ids));
}

export async function getFamilySnapshot(familyId: number, viewerUserId?: number) {
  const db = await getDb();
  if (!db) return null;
  const [family, members, appointments, tasks, notes, voiceNotes, recentAudit, preferences, consents, emergency] = await Promise.all([
    db.select().from(familyCircles).where(eq(familyCircles.id, familyId)).limit(1),
    db.select().from(familyMembers).where(eq(familyMembers.familyId, familyId)),
    db.select().from(careAppointments).where(eq(careAppointments.familyId, familyId)),
    db.select().from(careTasks).where(eq(careTasks.familyId, familyId)),
    db.select().from(visitNotes).where(and(eq(visitNotes.familyId, familyId), eq(visitNotes.visibility, "family"))).orderBy(desc(visitNotes.createdAt)).limit(25),
    db.select().from(careNotes).where(and(eq(careNotes.familyId, familyId), eq(careNotes.visibility, "family"), eq(careNotes.consentStatus, "granted"))).orderBy(desc(careNotes.createdAt)).limit(25),
    db.select().from(auditEvents).where(eq(auditEvents.familyId, familyId)).orderBy(desc(auditEvents.createdAt)).limit(50),
    db.select().from(notificationPreferences).where(eq(notificationPreferences.familyId, familyId)),
    db.select().from(familyConsents).where(eq(familyConsents.familyId, familyId)),
    db.select().from(emergencyContacts).where(eq(emergencyContacts.familyId, familyId)),
  ]);
  const viewerMemberId = viewerUserId ? members.find((member) => member.userId === viewerUserId)?.id : undefined;
  const visiblePreferences = viewerUserId ? preferences.filter((preference) => preference.userId === viewerUserId) : [];
  const visibleConsents = viewerMemberId ? consents.filter((consent) => consent.memberId === viewerMemberId) : [];
  return { family: family[0] ?? null, members, appointments, tasks, notes, voiceNotes, recentAudit, preferences: visiblePreferences, consents: visibleConsents, emergency };
}

export async function getFamilyExport(familyId: number) {
  const db = await getDb();
  if (!db) return null;
  const [family, members, appointments, tasks, visitNoteRows, voiceNotes, consents, documents, invitations, preferences, emergency, audit] = await Promise.all([
    db.select().from(familyCircles).where(eq(familyCircles.id, familyId)).limit(1),
    db.select().from(familyMembers).where(eq(familyMembers.familyId, familyId)),
    db.select().from(careAppointments).where(eq(careAppointments.familyId, familyId)),
    db.select().from(careTasks).where(eq(careTasks.familyId, familyId)),
    db.select().from(visitNotes).where(eq(visitNotes.familyId, familyId)),
    db.select().from(careNotes).where(eq(careNotes.familyId, familyId)),
    db.select().from(familyConsents).where(eq(familyConsents.familyId, familyId)),
    db.select().from(familyDocuments).where(eq(familyDocuments.familyId, familyId)),
    db.select().from(familyInvitations).where(eq(familyInvitations.familyId, familyId)),
    db.select().from(notificationPreferences).where(eq(notificationPreferences.familyId, familyId)),
    db.select().from(emergencyContacts).where(eq(emergencyContacts.familyId, familyId)),
    db.select().from(auditEvents).where(eq(auditEvents.familyId, familyId)).orderBy(desc(auditEvents.createdAt)),
  ]);
  return { family: family[0] ?? null, members, appointments, tasks, visitNotes: visitNoteRows, voiceNotes, consents, documents, invitations: invitations.map(({ tokenHash: _tokenHash, ...safe }) => safe), preferences, emergency, audit };
}

export async function createAuditEvent(input: {
  familyId: number;
  actorUserId?: number;
  action: string;
  entityType: string;
  entityId?: number;
  metadata?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditEvents).values({ ...input, metadata: input.metadata ?? null });
}

export async function createFamilyWithOwner(userId: number, name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(familyCircles).values({ name, createdByUserId: userId });
  const familyId = Number(result[0]?.insertId);
  const memberResult = await db.insert(familyMembers).values({ familyId, userId, displayName: "You", relationship: "Coordinator", ageGroup: "adult", preferredLanguage: "English", accessibilityNeeds: "Text + voice", careRole: "coordinator", consentStatus: "granted" });
  const memberId = Number(memberResult[0]?.insertId);
  await db.insert(familyConsents).values([
    { familyId, memberId, consentType: "voice_share", grantedAt: new Date(), revokedAt: null },
    { familyId, memberId, consentType: "health_context", grantedAt: new Date(), revokedAt: null },
    { familyId, memberId, consentType: "ai_processing", grantedAt: new Date(), revokedAt: null },
  ]);
  await createAuditEvent({ familyId, actorUserId: userId, action: "family.created", entityType: "family", entityId: familyId });
  return familyId;
}

export async function createCareAppointment(input: typeof careAppointments.$inferInsert, actorUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(careAppointments).values(input);
  const id = Number(result[0]?.insertId);
  await createAuditEvent({ familyId: input.familyId, actorUserId, action: "appointment.created", entityType: "appointment", entityId: id, metadata: { title: input.title } });
  return id;
}

export async function updateCareAppointment(id: number, familyId: number, actorUserId: number, patch: Partial<typeof careAppointments.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(careAppointments).set(patch).where(and(eq(careAppointments.id, id), eq(careAppointments.familyId, familyId)));
  await createAuditEvent({ familyId, actorUserId, action: "appointment.updated", entityType: "appointment", entityId: id, metadata: patch as Record<string, unknown> });
}

export async function createEmergencyContact(input: typeof emergencyContacts.$inferInsert, actorUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(emergencyContacts).values(input);
  const id = Number(result[0]?.insertId);
  await createAuditEvent({ familyId: input.familyId, actorUserId, action: "emergency_contact.added", entityType: "emergency_contact", entityId: id, metadata: { name: input.name } });
  return id;
}

export async function createCareTask(input: typeof careTasks.$inferInsert, actorUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(careTasks).values(input);
  const id = Number(result[0]?.insertId);
  await createAuditEvent({ familyId: input.familyId, actorUserId, action: "task.created", entityType: "task", entityId: id, metadata: { title: input.title } });
  return id;
}

export async function updateCareTask(id: number, familyId: number, actorUserId: number, patch: Partial<typeof careTasks.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(careTasks).set(patch).where(and(eq(careTasks.id, id), eq(careTasks.familyId, familyId)));
  await createAuditEvent({ familyId, actorUserId, action: "task.updated", entityType: "task", entityId: id, metadata: patch as Record<string, unknown> });
}

export async function createCareNoteDraft(input: typeof careNotes.$inferInsert, actorUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(careNotes).values(input);
  const id = Number(result[0]?.insertId);
  await createAuditEvent({ familyId: input.familyId, actorUserId, action: "care_note.draft_created", entityType: "care_note", entityId: id, metadata: { sourceType: input.sourceType, extractionStatus: input.extractionStatus } });
  return id;
}

export async function reviewCareNote(id: number, familyId: number, actorUserId: number, extractionStatus: "reviewed" | "confirmed" | "rejected", extractionJson: unknown) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select({ extractionStatus: careNotes.extractionStatus }).from(careNotes).where(and(eq(careNotes.id, id), eq(careNotes.familyId, familyId))).limit(1);
  const current = rows[0];
  if (!current) throw new Error("Care note not found");
  if (current.extractionStatus === "confirmed" || current.extractionStatus === "rejected") throw new Error("This care note is already closed and cannot be reviewed again");
  if (current.extractionStatus === "draft" && extractionStatus !== "reviewed") throw new Error("A draft must be reviewed before it can be confirmed or rejected");
  const result = await db.update(careNotes).set({ extractionStatus, extractionJson }).where(and(eq(careNotes.id, id), eq(careNotes.familyId, familyId), or(eq(careNotes.extractionStatus, "draft"), eq(careNotes.extractionStatus, "reviewed"))));
  if (Number(result[0]?.affectedRows ?? 0) !== 1) throw new Error("This care note was already reviewed by another family member");
  await createAuditEvent({ familyId, actorUserId, action: `care_note.${extractionStatus}`, entityType: "care_note", entityId: id });
}

export async function saveNotificationPreferences(input: typeof notificationPreferences.$inferInsert, actorUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(notificationPreferences).where(and(eq(notificationPreferences.familyId, input.familyId), eq(notificationPreferences.userId, input.userId))).limit(1);
  if (existing[0]) {
    await db.update(notificationPreferences).set({ quietStart: input.quietStart, quietEnd: input.quietEnd, pushEnabled: input.pushEnabled, emailEnabled: input.emailEnabled, smsEnabled: input.smsEnabled, weeklyDigest: input.weeklyDigest }).where(eq(notificationPreferences.id, existing[0].id));
  } else {
    await db.insert(notificationPreferences).values(input);
  }
  await createAuditEvent({ familyId: input.familyId, actorUserId, action: "notification_preferences.updated", entityType: "notification_preferences", metadata: { pushEnabled: input.pushEnabled, emailEnabled: input.emailEnabled, weeklyDigest: input.weeklyDigest } });
}

export async function createVisitNote(input: typeof visitNotes.$inferInsert, actorUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(visitNotes).values(input);
  const id = Number(result[0]?.insertId);
  await createAuditEvent({ familyId: input.familyId, actorUserId, action: "visit_note.created", entityType: "visit_note", entityId: id });
  return id;
}

export async function updateConsent(familyId: number, memberId: number, consentType: "voice_share" | "health_context" | "document_share" | "ai_processing", granted: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(familyConsents).values({ familyId, memberId, consentType, grantedAt: granted ? new Date() : null, revokedAt: granted ? null : new Date() });
  await db.update(familyMembers).set({ consentStatus: granted ? "granted" : "revoked" }).where(and(eq(familyMembers.id, memberId), eq(familyMembers.familyId, familyId)));
}

export async function createInvitation(input: typeof familyInvitations.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(familyInvitations).values(input);
  return Number(result[0]?.insertId);
}
