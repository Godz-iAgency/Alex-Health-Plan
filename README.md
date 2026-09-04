# Alex Health Plan

An installable, mobile-first wellness coach built around simple daily actions, beginner-friendly GBOMBS education, honest meal checks, gradual walking, rest, and mindset.

## Local setup

1. Copy `.env.example` to `.env.local` and add your Gemini API key.
2. Run `npm install`.
3. Run `npm run dev`.

The app remains useful without Gemini: meal checking and daily habits include an offline fallback. Personal progress is stored only in the browser on Alex's device.

## Deployment

Add `GEMINI_API_KEY` as a protected server-side environment variable in the hosting dashboard. Do not expose it to the browser or commit it to source control.
