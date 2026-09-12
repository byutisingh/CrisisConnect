# CrisisConnect

> **When emergencies move fast, your community moves together.**

CrisisConnect is a polished, browser-based emergency assistance and community safety dashboard. It gives people one calm response layer for urgent alerts, trusted contacts, local incident awareness, safety check-ins, and emergency resources.

The project is intentionally built as a lightweight static web app: there is no backend, build step, or account setup required. All demo interactions run in the browser and user-managed data is stored locally.

## Problem statement

During an emergency, people often have to switch between phone calls, messaging apps, maps, social feeds, and service directories. That fragmentation creates hesitation and makes it harder for trusted people to coordinate quickly.

CrisisConnect brings the most important actions into one focused experience: activate an SOS, share a location when needed, notify a trusted circle, report a local incident, confirm that you are safe, and find emergency resources without losing context.

## Key features

- Premium responsive landing page and emergency dashboard
- Emergency SOS flow with:
  - Accidental-click confirmation
  - Three-second arming countdown
  - Clear sent state and notification feedback
- Animated live network status panel with operational indicators
- **CrisisConnect AI** local safety guidance engine:
  - Natural-language emergency description analysis
  - Medical, fire, crime, accident, natural-disaster, and other classification
  - Critical, high, medium, and low urgency estimation
  - Signal extraction for injuries, danger, people affected, and location cues
  - Immediate-action guidance and an AI-assisted structured summary
  - Five example scenarios and optional LocalStorage report saving
- Community incident timeline with:
  - Medical, hazard, weather, and security categories
  - High, medium, and low severity levels
  - Search, category filters, severity filters, and empty states
- Incident reporting form with browser validation
- Emergency contact management stored in `localStorage`
- One-click “I’m safe” confirmation flow
- Safety check-in timer with progress indicator, active state, cancellation, and reset
- Browser Geolocation API demo with loading, success, and permission-error states
- Emergency quick actions for calls, location, contacts, and resources
- Emergency resources with click-to-call links and weather information
- Dashboard statistics and response-readiness indicators
- Persistent light/dark mode
- Toast notifications and accessible native dialogs
- Keyboard-friendly controls, visible focus states, labels, live regions, and skip navigation
- Reset demo data control for presentations and judging

## Technologies used

- Semantic HTML5
- CSS3:
  - Responsive Grid and Flexbox layouts
  - CSS custom properties
  - Native animations and transitions
  - Responsive breakpoints for mobile and desktop
- Vanilla JavaScript
- Browser APIs:
  - `localStorage`
  - Geolocation API
  - Native `<dialog>`

The AI assistant is a deterministic, private rule-based/NLP-style engine implemented in `script.js`. It does not call an external model, require an API key, claim to contact emergency services, or send location data.

No frameworks, packages, build tools, external APIs, or backend services are required.

## How GitHub Copilot was used

GitHub Copilot was used as a development partner throughout the project to:

- Shape the information architecture and interaction model
- Generate and refine the semantic HTML structure
- Develop the visual system, responsive layouts, animation details, and accessibility states
- Implement browser-only functionality such as LocalStorage persistence, geolocation handling, timers, dialogs, filters, and toast feedback
- Review interactions through repeated browser smoke tests
- Identify and fix edge cases such as SOS countdown cancellation, refresh persistence, malformed LocalStorage data, form validation, and mobile layout behavior
- Polish copy and presentation details for a hackathon-ready demo

All application behavior remains transparent in the included `index.html`, `style.css`, and `script.js` files.

## Project structure

```text
CrisisConnect/
├── index.html    # Application markup and accessible dialogs
├── style.css     # Visual system, responsive layout, and animations
├── script.js     # Interactions, browser APIs, persistence, and demo data
├── README.md     # Project documentation
└── .gitignore    # Repository hygiene rules
```

## Run locally

From the project directory, start any static file server. Python is available on most development machines:

```bash
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000) in a modern browser.

Alternatively, use a static hosting preview in your editor or any equivalent local server. Geolocation permissions work most reliably on `localhost` or an HTTPS origin.

## Data and privacy

Contacts, incident reports, and theme preference are stored only in the browser's LocalStorage for this demo. The SOS action is simulated and does not contact emergency services. Location is requested only after an explicit user action and is not sent to a server.

For a production deployment, the app would need secure authentication, encrypted transport and storage, server-side alert routing, audit logging, rate limiting, verified emergency-service integrations, and a clear regional emergency policy.

## Future scope

- Secure account and trusted-circle invitations
- Real-time, server-backed incident updates with moderation
- Push notifications and SMS fallback
- Verified responder roles and escalation workflows
- Offline-first support for unreliable connectivity
- Localized emergency numbers, languages, and accessibility preferences
- Encrypted event history and privacy controls
- Community resilience resources, shelter capacity, and preparedness checklists
