# CareBridge implementation plan

## Product scope
CareBridge is a calm, voice-first family care coordination dashboard for multigenerational families. The MVP is a realistic seeded grandmother hospital-visit scenario. It turns an older relative's voice note into a reviewable care plan, distributes responsibility, provides multilingual confirmations, and preserves a private visit note after care is completed. It organizes information; it does not diagnose, prescribe, or provide medical advice.

## Design direction
- **Design movement:** Editorial civic-tech / warm utility — a quiet, human-centered operations surface rather than a clinical dashboard.
- **Core principles:** reduce cognitive load; make responsibility visible; prioritize older-adult legibility; keep the family relationship at the center.
- **Color philosophy:** deep ink and warm paper establish trust, a proprietary **Cedar** green signals care and completion, and soft amber is reserved for attention without feeling like an alarm.
- **Layout paradigm:** a left rail for stable orientation and a broad asymmetric workspace: a narrative care brief on the left, action queue on the right, with a horizontal family thread below.
- **Signature elements:** Cedar status line, large rounded voice-note intake card, and “who is carrying this?” owner chips.
- **Interaction philosophy:** every action should clarify either what happened, what happens next, or who owns it. Use direct labels, visible states, and no hidden hover-only meaning.
- **Animation:** small 160–220ms fades and slide-ins for updates; a gentle pulse only while recording; no looping decorative motion.
- **Typography:** DM Sans for UI and Fraunces for human, reflective headings. High-contrast labels, 15px minimum body copy, generous touch targets.
- **Brand essence:** A private family care layer that turns scattered voice notes into shared responsibility. Personality: grounded, thoughtful, reassuring.
- **Brand voice:** plain, specific, non-clinical. Example lines: “Grandma asked for a ride to Thursday’s appointment.” / “You do not have to carry this alone.”
- **Wordmark & logo:** CareBridge wordmark paired with a simple bridge mark made from two offset rounded bars joined by a small cedar dot.
- **Signature brand color:** Cedar `#2F6B58`.

## Implementation
- Replace the starter Home page with a responsive single-page CareBridge dashboard.
- Keep seeded demo data in typed constants so the demo is immediate and editable.
- Add interaction state for recording simulation, review modal, care-task status updates, language confirmation, activity navigation, and visit-note capture.
- Use existing React/Tailwind/Lucide dependencies; no new packages needed.
- Add `public/manus-routes.json` with the `/` route before starting the dev server.
- Add root `app.config.ts` with a stable HTTPS logo URL using a small inline SVG data URL is not allowed by project rules; use a durable external logo URL only if available, otherwise preserve the visual logo in-app and leave app config with no speculative URL.
- Validate with TypeScript check, production build, HTTP readiness, route manifest response, and a shared read-only implementation review.

## Project structure
- `client/src/pages/Home.tsx`: CareBridge dashboard composition, seeded data, interaction state, and accessible UI.
- `client/src/index.css`: global tokens, typography, responsive layout helpers, and Cedar visual system.
- `client/public/manus-routes.json`: static page route manifest.
- `plan.md`: implementation and design decisions.
