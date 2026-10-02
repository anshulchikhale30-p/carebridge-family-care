# CareBridge

> **One shared care plan. Fewer “Who is handling this?” messages.**

CareBridge is a family-care coordination workspace for the moments when love becomes logistics.

An appointment is tomorrow. One person knows the time. Someone else can drive. A third person has the prescription. The older adult is asking the same question again—not because they are difficult, but because the information is scattered across phone calls, paper notes, and a busy family group chat.

CareBridge gives the family one calm place to see what is happening, who owns the next step, and what changed.

## Why I Built This

I did not want to build another productivity dashboard.

I wanted to work on the kind of problem that usually stays invisible: the family member who keeps the appointment details in their head, reminds everyone else, follows up when nobody replies, and quietly becomes the default coordinator.

That work is full of small uncertainties:

- “Did someone confirm the ride?”
- “Which prescription needs to be picked up?”
- “Did Grandma understand what the doctor said?”
- “Who is checking in after the appointment?”
- “Was that update actually shared with everyone who needs it?”

The problem is not that families do not care. The problem is that care is distributed, while the information is fragmented.

CareBridge is designed to make care **shared, visible, and kind**—without turning a family into a project-management meeting.

## The Demo Story

The demo uses synthetic family data so it can be explored safely.

A grandmother has a hospital visit on Thursday. Her daughter is coordinating the plan. Her grandson can drive. Her granddaughter can call after the appointment. A prescription still needs to be picked up.

A single voice update becomes a set of **reviewable** details. The family can assign the ride, acknowledge the task, prepare a multilingual confirmation, and see the history of what happened.

Nothing important is silently changed by AI. A person reviews the draft before it becomes part of the shared care plan.

## Live Demo

**[Open CareBridge](https://3000-imnxg3gbyzg3o6oocxpte-8f33efbe.sg2.manus.computer)**

The preview contains synthetic data. Use the sidebar to explore:

- **Overview** — the next appointment and the family’s immediate priorities
- **Care plan** — tasks, ownership, due times, and completion state
- **Family** — people, roles, languages, and accessibility needs
- **Calendar** — appointment context and exportable calendar data
- **Memories** — private family notes that keep care human
- **Production workspace** — privacy, consent, reminders, care-load balance, older-adult mode, offline state, and emergency guidance

## What CareBridge Makes Possible

### Turn scattered updates into a reviewable plan

Voice and text updates can become structured drafts containing possible appointments, tasks, people, and follow-ups. The draft is not automatically trusted. A family member reviews it before sharing.

### Make invisible care work visible

Tasks have owners, due times, statuses, and an audit trail. The goal is not to measure who is “doing enough.” It is to make it easier to notice when one person is carrying everything.

### Design for different generations

The same family may include someone who prefers a phone, someone who uses voice notes, and an older adult who needs large text, clear language, high contrast, or a confirmation in Marathi, Hindi, or English.

### Make privacy part of the experience

CareBridge includes family roles, invitations, consent records, privacy-aware snapshots, audit events, data export, deletion requests, and emergency-contact context. Sensitive family information should not be treated like ordinary chat content.

### Keep AI in the right place

> **AI may help organize a draft. A person decides what becomes shared care information.**

CareBridge does not diagnose, prescribe, or replace a medical professional. Medication information is a reminder to verify, not a medical instruction.

## Architecture

```text
Family member update
        │
        ▼
Consent and family-role checks
        │
        ▼
Reviewable extraction draft
        │
        ▼
Human confirmation
        │
        ├── Shared care task
        ├── Appointment / reminder
        ├── Multilingual confirmation
        └── Audit event
```

### Stack

- React + TypeScript
- Vite + Tailwind CSS
- tRPC for typed client/server procedures
- Drizzle ORM + MySQL for durable data
- Manus OAuth for account identity
- Vitest for automated tests
- Server-side role, consent, audit, and family-scope checks

## Repository Structure

```text
client/       React application, pages, components, and styles
server/       tRPC procedures, authentication context, database helpers
shared/       Shared types and constants
drizzle/      Schema, relations, and checked-in migrations
public/       Route manifest and visual assets
plan.md       Product and design decisions
```

## Run Locally

```bash
pnpm install
pnpm dev
```

The development server uses port `3000` by default.

Useful commands:

```bash
pnpm check          # TypeScript validation
pnpm test           # Automated tests
pnpm build          # Production build
pnpm db:migrate     # Apply checked-in database migrations
```

## Privacy and Safety Boundaries

CareBridge is a coordination tool, not a clinical system.

- Demo data is synthetic.
- AI-generated text is treated as a draft.
- Human review is required before sharing extracted care information.
- Ambiguous or sensitive decisions should be clarified, not guessed.
- Emergency guidance tells users to contact local emergency services first.
- The project does not claim HIPAA compliance or clinical accuracy.
- Production deployments need a security review, encrypted document storage, real notification providers, retention controls, and usability testing with caregivers and older adults.

## Open Innovation

Family care is too personal and too culturally varied for one closed system to define the only acceptable workflow.

Open technologies make the system easier to inspect, adapt, and extend for different families, languages, devices, accessibility needs, and privacy expectations. They also make the important questions visible:

- What information was stored?
- Who can see it?
- What consent was granted?
- Which parts came from a model?
- What did a person confirm?
- What happens when the system is uncertain?

The current project is built on open web technologies and open-source frameworks. The next model-integration step is to connect a self-hosted or open-weight model to the bounded extraction stage while preserving the same consent and human-review boundary.

## Validation Status

The current demo is a product and engineering prototype with synthetic data. It has been type-checked, tested, built, and manually reviewed in the hosted preview.

Real-family usability validation is still an open next step. I would measure:

- Time to understand today’s responsibilities
- Task assignment and acknowledgement success
- Repeated coordination messages avoided
- Whether users understand the privacy boundary
- Whether an older adult can complete the main flow without help

I would rather show an honest missing measurement than invent a success percentage.

## Contributing

The most valuable contributions are not more dashboard widgets. They are improvements that make family care safer and easier to understand:

- Accessibility testing with older adults
- Multilingual UX review
- Privacy and threat-model review
- Offline-sync design
- Notification-provider integrations
- Open-weight model evaluation for structured extraction
- Usability research with family caregivers

## License

Add the project license before publishing the repository publicly.

## Final Thought

Care is often carried by the person who remembers everything.

CareBridge is an attempt to make remembering, updating, and following through a little less lonely.
