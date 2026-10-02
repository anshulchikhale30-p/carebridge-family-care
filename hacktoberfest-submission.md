# CareBridge: Making Family Care a Shared Responsibility

*This is a submission for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)*

## What I Built

I built **CareBridge**, a shared family-care workspace for the people we love—and the family members trying to help them from different cities, schedules, and generations.

I built it around a familiar family problem: important care details are scattered across WhatsApp messages, phone calls, paper notes, and someone’s memory. One person knows about the appointment. Another person can drive. Someone else needs to buy the medication. The older adult may only want a simple voice-first confirmation in their preferred language.

CareBridge brings those pieces into one calm, private family circle:

- Coordinate appointments, rides, medication pickups, check-ins, and documents
- Assign care tasks and make ownership visible without blaming anyone
- Capture voice notes naturally and turn them into **reviewable drafts**, not automatic medical advice
- Keep a family timeline for both practical care and meaningful memories
- Support older-adult mode with large text, voice prompts, multilingual confirmations, and high contrast
- Protect sensitive information with family roles, invitations, consent records, privacy controls, audit history, and export/delete-request flows
- Show care-load balance so one person does not quietly carry everything
- Provide emergency-contact and preferred-hospital context with a clear reminder to contact local emergency services first

The friend I built this for is my family’s older loved one—and every family coordinator who is quietly carrying the invisible work of care.

## Demo

**Live demo:** [Open CareBridge](https://3000-imnxg3gbyzg3o6oocxpte-8f33efbe.sg2.manus.computer)

The preview includes a seeded family example so you can explore the experience immediately. Sign in to create a real family circle and sync production data.

The most important flows to try:

1. Use the left navigation to jump between **Overview**, **Care plan**, **Family**, **Calendar**, and **Memories**.
2. Open **Production workspace** to explore privacy, consent, reminders, care-load balance, older-adult mode, offline state, and emergency guidance.
3. Try the voice-note review flow and inspect the human confirmation boundary before anything is shared.
4. Open the invitation flow at `/invite/:token` when testing a family invitation.

## Code

The project is built with:

- React and TypeScript
- Vite and Tailwind CSS
- tRPC for typed client/server procedures
- Drizzle ORM and MySQL for durable family data
- Manus OAuth for account identity
- A server-side audit and consent model for sensitive care workflows

**Public repository:** _Add the public GitHub repository URL here before publishing._

The latest validated checkpoint is `ebee509`.

## How I Built It

I used the **Manus agent harness** as an agentic development environment to plan, implement, inspect, test, and iterate on the project. The implementation is grounded in open web technologies and open-source frameworks rather than a locked-in proprietary application stack.

The architecture has two layers:

### 1. A simple, humane interface

The visual design uses warm neutrals, deep green, generous spacing, readable typography, and short action labels. The goal is to make family care feel less like an enterprise dashboard and more like a calm shared room.

The interface is intentionally responsive because family members may use:

- A laptop while coordinating care
- A phone while driving or shopping
- A simplified, larger-text view as an older adult

### 2. A safer production foundation

The backend includes persistent models for:

- Family circles and member roles
- Invitations and redemption
- Care tasks and appointments
- Voice-note drafts and human review status
- Visit notes and family memories
- Consent records by purpose
- Notification preferences and quiet hours
- Documents and emergency contacts
- Audit events

The AI-assisted workflow is deliberately constrained:

> AI can help organize a note into a draft. A person must review and confirm it before it becomes shared care information.

CareBridge does not diagnose, prescribe, or replace a qualified professional. Medication details remain reminders to verify—not medical instructions.

## Why Does Open Innovation Matter?

Family care is too personal and too culturally varied for one closed system to define the “right” workflow.

Open innovation makes it possible to build around real families instead of forcing them into a fixed enterprise process. It lets developers adapt the product for:

- Different languages and family structures
- Older-adult accessibility needs
- Local emergency-contact conventions
- Different privacy expectations
- Multiple devices and connectivity conditions
- Portable, inspectable data models

It also makes the safety boundary visible. The family should be able to understand what is stored, who can see it, what consent was granted, and what an AI-assisted draft actually did.

For CareBridge, openness is not just a technical preference. It is part of the trust model.

## My Agent Session

_Add your saved DevRelay agent-session embed or link here before publishing._

## Prize Categories

- **Hacktoberfest Weekend Challenge: Build for a Friend**

_Remove this section or add partner categories if you are entering any of them._

## What I’d Build Next

The next production steps would be:

- Connect email, push, or SMS delivery providers
- Add encrypted file storage for family documents
- Add real audio capture and transcription with an explicit consent gate
- Add calendar-account integrations in addition to ICS export
- Add richer offline sync conflict resolution
- Run usability sessions with older adults and family caregivers

CareBridge started with a simple idea: **care should be shared, visible, and kind—not hidden in one person’s head.**
