import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, uniqueIndex } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const familyCircles = mysqlTable("familyCircles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const familyMembers = mysqlTable("familyMembers", {
  id: int("id").autoincrement().primaryKey(),
  familyId: int("familyId").notNull(),
  userId: int("userId"),
  displayName: varchar("displayName", { length: 160 }).notNull(),
  relationship: varchar("relationship", { length: 80 }).notNull(),
  ageGroup: mysqlEnum("ageGroup", ["child", "teen", "young_adult", "adult", "older_adult"]).notNull(),
  preferredLanguage: varchar("preferredLanguage", { length: 40 }).default("English").notNull(),
  accessibilityNeeds: varchar("accessibilityNeeds", { length: 255 }),
  careRole: mysqlEnum("careRole", ["recipient", "coordinator", "helper", "viewer"]).default("helper").notNull(),
  availability: mysqlEnum("availability", ["available", "busy", "away"]).default("available").notNull(),
  consentStatus: mysqlEnum("consentStatus", ["pending", "granted", "revoked"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  familyUserUnique: uniqueIndex("familyMembers_family_user_unique").on(table.familyId, table.userId),
}));

export const familyInvitations = mysqlTable("familyInvitations", {
  id: int("id").autoincrement().primaryKey(),
  familyId: int("familyId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  role: mysqlEnum("role", ["recipient", "coordinator", "helper", "viewer"]).default("helper").notNull(),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "accepted", "revoked", "expired"]).default("pending").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const careAppointments = mysqlTable("careAppointments", {
  id: int("id").autoincrement().primaryKey(),
  familyId: int("familyId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt"),
  location: varchar("location", { length: 255 }),
  contactName: varchar("contactName", { length: 160 }),
  status: mysqlEnum("status", ["draft", "confirmed", "completed", "cancelled"]).default("draft").notNull(),
  recurrenceRule: varchar("recurrenceRule", { length: 255 }),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const careTasks = mysqlTable("careTasks", {
  id: int("id").autoincrement().primaryKey(),
  familyId: int("familyId").notNull(),
  appointmentId: int("appointmentId"),
  title: varchar("title", { length: 200 }).notNull(),
  detail: text("detail"),
  category: mysqlEnum("category", ["transport", "medication", "grocery", "checkin", "document", "other"]).default("other").notNull(),
  ownerMemberId: int("ownerMemberId"),
  dueAt: timestamp("dueAt"),
  status: mysqlEnum("status", ["unassigned", "planned", "in_progress", "blocked", "completed"]).default("unassigned").notNull(),
  blockedReason: text("blockedReason"),
  effortMinutes: int("effortMinutes"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const careNotes = mysqlTable("careNotes", {
  id: int("id").autoincrement().primaryKey(),
  familyId: int("familyId").notNull(),
  authorMemberId: int("authorMemberId"),
  sourceType: mysqlEnum("sourceType", ["voice", "text"]).default("text").notNull(),
  sourceText: text("sourceText").notNull(),
  visibility: mysqlEnum("visibility", ["family", "selected", "private"]).default("family").notNull(),
  consentStatus: mysqlEnum("consentStatus", ["pending", "granted", "revoked"]).default("pending").notNull(),
  extractionStatus: mysqlEnum("extractionStatus", ["draft", "reviewed", "confirmed", "rejected"]).default("draft").notNull(),
  extractionJson: json("extractionJson"),
  confidence: int("confidence"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const visitNotes = mysqlTable("visitNotes", {
  id: int("id").autoincrement().primaryKey(),
  familyId: int("familyId").notNull(),
  authorMemberId: int("authorMemberId"),
  body: text("body").notNull(),
  visibility: mysqlEnum("visibility", ["family", "selected", "private"]).default("family").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const familyConsents = mysqlTable("familyConsents", {
  id: int("id").autoincrement().primaryKey(),
  familyId: int("familyId").notNull(),
  memberId: int("memberId").notNull(),
  consentType: mysqlEnum("consentType", ["voice_share", "health_context", "document_share", "ai_processing"]).notNull(),
  grantedAt: timestamp("grantedAt"),
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const notificationPreferences = mysqlTable("notificationPreferences", {
  id: int("id").autoincrement().primaryKey(),
  familyId: int("familyId").notNull(),
  userId: int("userId").notNull(),
  quietStart: varchar("quietStart", { length: 5 }).default("22:00").notNull(),
  quietEnd: varchar("quietEnd", { length: 5 }).default("07:00").notNull(),
  pushEnabled: boolean("pushEnabled").default(true).notNull(),
  emailEnabled: boolean("emailEnabled").default(true).notNull(),
  smsEnabled: boolean("smsEnabled").default(false).notNull(),
  weeklyDigest: boolean("weeklyDigest").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  familyUserUnique: uniqueIndex("notificationPreferences_family_user_unique").on(table.familyId, table.userId),
}));

export const familyDocuments = mysqlTable("familyDocuments", {
  id: int("id").autoincrement().primaryKey(),
  familyId: int("familyId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  kind: mysqlEnum("kind", ["prescription", "insurance", "contact", "instruction", "other"]).default("other").notNull(),
  storageKey: varchar("storageKey", { length: 512 }),
  providedByFamily: boolean("providedByFamily").default(true).notNull(),
  visibility: mysqlEnum("visibility", ["family", "selected", "private"]).default("family").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const emergencyContacts = mysqlTable("emergencyContacts", {
  id: int("id").autoincrement().primaryKey(),
  familyId: int("familyId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  relationship: varchar("relationship", { length: 80 }),
  phone: varchar("phone", { length: 40 }).notNull(),
  preferredHospital: varchar("preferredHospital", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const auditEvents = mysqlTable("auditEvents", {
  id: int("id").autoincrement().primaryKey(),
  familyId: int("familyId").notNull(),
  actorUserId: int("actorUserId"),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityId: int("entityId"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type FamilyCircle = typeof familyCircles.$inferSelect;
export type FamilyMember = typeof familyMembers.$inferSelect;
export type CareTask = typeof careTasks.$inferSelect;
export type CareNote = typeof careNotes.$inferSelect;
export type VisitNote = typeof visitNotes.$inferSelect;
