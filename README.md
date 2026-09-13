# Alex Health Plan

An installable, mobile-first wellness coach built around simple daily actions, beginner-friendly GBOMBS education, honest meal checks, a seven-day meal plan, grocery planning, gradual walking, rest, mindset, and progress trends.

## Local setup

1. Copy `.env.example` to `.env` and add the Gemini and Airtable settings.
2. Run `npm install`.
3. Run `npm run dev`.

The saved recipe library and daily plan remain visible if Gemini is unavailable. Airtable stores profile settings, daily check-ins, weight, weekly plans, planned meals, meal checks, groceries, coach exchanges, safety events, and app events.

## Airtable

The Airtable personal access token needs record read and write access plus base schema read access. Keep `AIRTABLE_PAT` and `AIRTABLE_BASE_ID` server-side. Never use a `NEXT_PUBLIC_` prefix.

Run `scripts/setup-airtable-v2.ps1` once after adding the local Airtable settings. It safely adds the V2 fields and tables when they are missing.

When Airtable is configured, the app requires a private six-digit code. Set `ALEX_ACCESS_CODE` to choose the code. If it is blank, the app creates a stable code from the protected server settings. Alex enters it once per device and does not need an account or ChatGPT sign-in.

## Deployment

Add `GEMINI_API_KEY`, `AIRTABLE_PAT`, and `AIRTABLE_BASE_ID` as protected server-side environment variables in Vercel. `ALEX_ACCESS_CODE` and `GEMINI_MODEL` are optional. Do not expose these values to the browser or commit them to source control.
