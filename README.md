# Alex Health Plan

An installable, mobile-first wellness coach built around simple daily actions, beginner-friendly GBOMBS education, honest meal checks, gradual walking, rest, and mindset.

## Local setup

1. Copy `.env.example` to `.env` and add the Gemini and Airtable settings.
2. Run `npm install`.
3. Run `npm run dev`.

The app remains useful without Gemini or Airtable. Meal checking and daily habits include an offline fallback. When Airtable is configured, the server syncs Alex's plan, daily check-ins, meals, coach exchanges, groceries, progress history, and editable plan content.

## Airtable

The Airtable personal access token needs record read and write access plus base schema read access. Keep `AIRTABLE_PAT` and `AIRTABLE_BASE_ID` server-side. Never use a `NEXT_PUBLIC_` prefix.

When Airtable is configured, the app requires a private six-digit code. Set `ALEX_ACCESS_CODE` to choose the code. If it is blank, the app creates a stable code from the protected server settings. Alex enters it once per device and does not need an account or ChatGPT sign-in.

## Deployment

Add `GEMINI_API_KEY`, `AIRTABLE_PAT`, and `AIRTABLE_BASE_ID` as protected server-side environment variables in the hosting dashboard. `ALEX_ACCESS_CODE` is optional. Do not expose these values to the browser or commit them to source control.
