# CareBridge: the family care handoff nobody should have to carry alone

*This is a submission for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01).*

## What I Built

CareBridge is a **voice-first family-care workspace** for the moment when love becomes logistics.

I built it for families who coordinate care through scattered voice notes, phone calls, paper reminders, and busy group chats. One person knows the appointment time. Someone else can drive. Another person has the prescription. The person receiving care may still be unsure what is happening.

CareBridge turns one natural family update into a **reviewable care handoff**:

1. A family member speaks or types an update.
2. The update carries human context: who it is about and how they feel.
3. AI extracts possible appointments, responsibilities, reminders, and follow-ups.
4. A person reviews, edits, and unchecks anything that is not correct.
5. Only approved details become shared family actions.
6. The approved handoff can be read aloud for the family.

The product is deliberately not a medical diagnosis tool. It organizes coordination; it does not diagnose, prescribe, or make clinical decisions.

The starter family story is synthetic: Leela has a hospital visit on Thursday. Rohan may drive her. A prescription folder needs to come along. Meera should call afterward. CareBridge makes those small responsibilities visible without turning the family into a project-management meeting.

## Demo

**Live demo:** [Open CareBridge](https://carebridge-family-care.onrender.com)

The best demo path is:

1. Open **Handoff studio**.
2. Select the person and emotion.
3. Use **Speak update**, **Upload recording**, or type a note.
4. Review the extracted details.
5. Approve only the useful actions.
6. Share the verified handoff and play it aloud.

The home experience also opens with a living family tree: branches grow one by one, and family members appear with their care responsibility and emotional context.

The workspace uses synthetic starter records so the project can be explored immediately without login. It is designed as a local-first family-care experience rather than a fake “AI chat” demo.

## Code

[GitHub repository](https://github.com/anshulchikhale30-p/carebridge-family-care)

The latest voice-flow improvements are in the `main` branch. API credentials are server-side only and are not committed to the repository.

## How I Built It

CareBridge is a React and TypeScript application with a Node server, a Render Blueprint, and a separate open-weight AI runtime.

### Architecture

```text
Family voice or text update
          │
          ▼
CareBridge server on Render
          │
          ├── ElevenLabs Speech to Text
          │
          ▼
Reviewable extraction draft
          │
          ▼
Human approval
          │
          ├── Shared care action
          ├── Appointment or reminder
          ├── Multilingual confirmation
          └── ElevenLabs spoken handoff

Bounded extraction runtime on Render
          │
          └── Open-weight model + deterministic safe fallback
```

### Review-first AI

The extraction runtime is intentionally bounded. It is prompted to return coordination details only: appointments, transport, tasks, reminders, and follow-ups. It is not allowed to diagnose, prescribe, infer a medical condition, or invent a date.

Every extraction response remains a draft requiring human review. If the model is unavailable, CareBridge uses a deterministic fallback and still keeps the result in draft mode.

The core product rule is:

> AI may help organize a draft. A person decides what becomes shared care information.

### Voice and accessibility

ElevenLabs is used at two product-critical moments:

- **Speech to Text:** a family member can speak naturally instead of rewriting an update into formal text.
- **Text to Speech:** after approval, the verified handoff can be read aloud for the person receiving care and for family members who prefer voice.

The voice flow also includes a practical browser fallback: recordings are saved with an in-browser audio player, browser speech recognition can provide a transcript when available, and browser speech synthesis can read the approved handoff when the provider is unavailable.

The interface supports English, Hindi, and Marathi context, along with relationship, emotion, large-text, high-contrast, and voice-oriented experiences.

### Render

Render runs both sides of the AI boundary:

- `carebridge-web` serves the application and protects provider secrets.
- `carebridge-ai-runtime` runs the separate FastAPI open-weight extraction service.

The deployment is reproducible through [`render.yaml`](https://github.com/anshulchikhale30-p/carebridge-family-care/blob/main/render.yaml). The web service can call the private runtime through `AI_RUNTIME_URL`, while `ELEVENLABS_API_KEY` remains a server-side secret.

## Why Does Open Innovation Matter?

Family-care information is personal. A closed, opaque assistant that silently rewrites a family message into a medical-looking instruction would be the wrong product.

Open innovation makes the important boundaries inspectable and replaceable:

- The extraction prompt is visible.
- The model can be swapped without redesigning the product.
- The deterministic fallback is in the repository.
- Human review is enforced in the workflow, not left to a model’s good intentions.
- The family can see what was suggested before anything is shared.
- A family can eventually self-host or choose a different open-weight runtime when privacy, language, cost, or hardware requirements change.

The open approach made it possible to build a focused system instead of a generic chatbot. CareBridge does not need an assistant that answers everything. It needs a careful system that says: **“Here are the possible next steps. Please confirm what is actually true.”**

## Prize Categories

### Best Use of Render

CareBridge uses Render as an actual part of the product architecture, not just as a static hosting destination. Render runs the web application and a separate open-weight AI extraction runtime.

This separation gives the project a clear boundary:

- the web service handles the product workflow and protected provider calls;
- the AI runtime has one bounded job: extract coordination details;
- the runtime can fall back safely when a model is unavailable;
- the deployment is reproducible from the checked-in Render Blueprint.

Render is part of how CareBridge works, not just where the frontend happens to be hosted.

### Best Use of ElevenLabs

ElevenLabs gives the family-care workflow a voice. It is used for both sides of the handoff:

- natural family updates become editable text through Speech to Text;
- approved actions can be spoken back through Text to Speech.

Voice is not decoration. It is an accessibility layer for family members who should not have to type, navigate a dense dashboard, or translate a formal care summary themselves.

## What I Learned

The hardest part was not extracting more information. It was deciding what the system must **not** do.

A family-care assistant should not silently turn an uncertain voice note into a task. It should preserve emotion and context, suggest structure, show the draft, and ask a person to confirm.

CareBridge is my attempt to make the invisible coordination work of caring for someone a little more shared, visible, and kind.
