CREATE TABLE `auditEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyId` int NOT NULL,
	`actorUserId` int,
	`action` varchar(120) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `careAppointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp,
	`location` varchar(255),
	`contactName` varchar(160),
	`status` enum('draft','confirmed','completed','cancelled') NOT NULL DEFAULT 'draft',
	`recurrenceRule` varchar(255),
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `careAppointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `careNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyId` int NOT NULL,
	`authorMemberId` int,
	`sourceType` enum('voice','text') NOT NULL DEFAULT 'text',
	`sourceText` text NOT NULL,
	`visibility` enum('family','selected','private') NOT NULL DEFAULT 'family',
	`consentStatus` enum('pending','granted','revoked') NOT NULL DEFAULT 'pending',
	`extractionStatus` enum('draft','reviewed','confirmed','rejected') NOT NULL DEFAULT 'draft',
	`extractionJson` json,
	`confidence` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `careNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `careTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyId` int NOT NULL,
	`appointmentId` int,
	`title` varchar(200) NOT NULL,
	`detail` text,
	`category` enum('transport','medication','grocery','checkin','document','other') NOT NULL DEFAULT 'other',
	`ownerMemberId` int,
	`dueAt` timestamp,
	`status` enum('unassigned','planned','in_progress','blocked','completed') NOT NULL DEFAULT 'unassigned',
	`blockedReason` text,
	`effortMinutes` int,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `careTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emergencyContacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`relationship` varchar(80),
	`phone` varchar(40) NOT NULL,
	`preferredHospital` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emergencyContacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `familyCircles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `familyCircles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `familyConsents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyId` int NOT NULL,
	`memberId` int NOT NULL,
	`consentType` enum('voice_share','health_context','document_share','ai_processing') NOT NULL,
	`grantedAt` timestamp,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `familyConsents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `familyDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`kind` enum('prescription','insurance','contact','instruction','other') NOT NULL DEFAULT 'other',
	`storageKey` varchar(512),
	`providedByFamily` boolean NOT NULL DEFAULT true,
	`visibility` enum('family','selected','private') NOT NULL DEFAULT 'family',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `familyDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `familyInvitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('recipient','coordinator','helper','viewer') NOT NULL DEFAULT 'helper',
	`tokenHash` varchar(128) NOT NULL,
	`status` enum('pending','accepted','revoked','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `familyInvitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `familyInvitations_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `familyMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyId` int NOT NULL,
	`userId` int,
	`displayName` varchar(160) NOT NULL,
	`relationship` varchar(80) NOT NULL,
	`ageGroup` enum('child','teen','young_adult','adult','older_adult') NOT NULL,
	`preferredLanguage` varchar(40) NOT NULL DEFAULT 'English',
	`accessibilityNeeds` varchar(255),
	`careRole` enum('recipient','coordinator','helper','viewer') NOT NULL DEFAULT 'helper',
	`availability` enum('available','busy','away') NOT NULL DEFAULT 'available',
	`consentStatus` enum('pending','granted','revoked') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `familyMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyId` int NOT NULL,
	`userId` int NOT NULL,
	`quietStart` varchar(5) NOT NULL DEFAULT '22:00',
	`quietEnd` varchar(5) NOT NULL DEFAULT '07:00',
	`pushEnabled` boolean NOT NULL DEFAULT true,
	`emailEnabled` boolean NOT NULL DEFAULT true,
	`smsEnabled` boolean NOT NULL DEFAULT false,
	`weeklyDigest` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationPreferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visitNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyId` int NOT NULL,
	`authorMemberId` int,
	`body` text NOT NULL,
	`visibility` enum('family','selected','private') NOT NULL DEFAULT 'family',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `visitNotes_id` PRIMARY KEY(`id`)
);
