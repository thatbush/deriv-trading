# AI Bot (`/bots/ai`) — Design

**Date:** 2026-06-12
**Status:** Approved (pending spec review)

## Summary

Port the old-app "AI Market Analysis" page (`apps/home/public/app_binarymatix_com.html`)
into a native React page at `/bots/ai` in the home shell. The user uploads a chart
screenshot; Gemini analyzes it and predicts Rise/Fall; the user can place a Deriv
trade based on the prediction.

Unlike the existing sub-apps (separate origins in iframes, auth via postMessage),
this is a **native page** rendered as shell `children`, so it uses the shell's auth
and Deriv WebSocket plumbing directly. One new server route proxies Gemini to keep
the API key out of the browser.

## Decisions

- **Server split:** server-side is *only* the Gemini proxy. Deriv trade execution,
  account display, and the trade WebSocket stay client-side.
- **UI:** native React page, not an iframe sub-app. Uses shell theming (CSS vars).
- **Auth/trade socket:** uses the shell's `useAuth` (`getFreshWsUrl()` OTP socket) —
  the logged-in active account. No URL-token scheme.
- **Trade config:** uses the shell's active account (real/demo via header switcher)
  plus a stake amount field on the page. No separate account toggle.
- **All trading via Deriv API** (authorize → proposal → buy over Deriv WebSocket).
- **No chart** on the page — the bot's premise is upload-a-screenshot, not a live chart.
- **Drop** the old Portfolio/Charts floating-button modals in the port.
- **Gemini key:** reuse the existing (compromised) key via `GEMINI_API_KEY` env var for
  now; advise client; swap later. See memory `project_ai_bot`.

## Architecture

```
Browser (/bots/ai native page)
  ├─ useAuthContext()  ── active account, balance, getFreshWsUrl()
  ├─ upload screenshot → base64
  ├─ POST /api/bots/ai/analyze (base64)  ──►  Gemini 2.5 Flash (key server-side)
  │                                       ◄──  { market, timeframe, rise, fall, text }
  └─ Rise/Fall → getFreshWsUrl() → ai-trade.ts → Deriv WS (authorize→proposal→buy)
```

### Auth-sharing change

Today `useAuth` is called *inside* `Shell` and only handed to iframes via postMessage.
A native page can't reach it. Fix: lift auth into a context provider (`AuthContext`)
alongside the existing `TenantContext` in `shell.tsx`, expose `useAuthContext()`.
Shell behavior is unchanged (it reads the same object); native pages consume the
context. This is the only structural change; everything else is additive.

## Components

1. **Gemini proxy** — `app/api/bots/ai/analyze/route.ts`
   POST; receives base64 image; calls Gemini 2.5 Flash server-side with
   `GEMINI_API_KEY`; returns parsed analysis. Carries over the old app's 503
   retry/backoff. Key never reaches the browser.

2. **`AuthContext`** — in `shell.tsx`
   Wrap children in `<AuthContext.Provider value={auth}>`; export `useAuthContext()`.
   No behavior change to shell or sub-apps.

3. **The page** — `app/bots/ai/page.tsx` (replaces the coming-soon stub)
   Client component. Sections: account/balance strip (from `useAuthContext`), image
   upload + preview, Analyze button, prediction card (confidence meter, rise/fall %,
   written analysis), stake amount input, Rise/Fall buttons + against-prediction
   warning modal. React + shell theming (CSS vars, not the hardcoded slate palette).

4. **Trade logic** — `lib/bots/ai-trade.ts`
   Market-text→Deriv-symbol mapping and the authorize→proposal→buy WebSocket
   sequence, extracted as a focused, testable module.

## Data flow

1. Page reads active account + balance from `useAuthContext`.
2. User uploads chart → base64 in state.
3. Analyze → POST `/api/bots/ai/analyze` → Gemini → parsed result rendered.
4. User sets stake, clicks Rise/Fall → `getFreshWsUrl()` mints OTP socket →
   `ai-trade.ts` runs authorize → proposal → buy via Deriv API → success/error toast.
5. Trading against the prediction triggers the warning modal first.

## Error handling

- **Gemini proxy:** 503 retry/backoff; other failures → JSON error → page toast.
  Malformed AI output (missing `Market:`/`Rise:` format) → "Couldn't parse analysis,
  try another screenshot."
- **Not authenticated:** if `authState !== 'authenticated'`, disable trade buttons,
  prompt login (shell header handles login).
- **Trade:** authorize/proposal/buy errors surface the Deriv API error message in a
  toast; unrecognized market symbol → explicit "Market X not recognized."
- **Against-prediction guard:** warning modal before a contradicting trade.

## Testing

- `lib/bots/ai-trade.ts` — unit-test market-text→symbol mapping and proposal-request
  shaping (pure logic).
- Gemini proxy — test the response parser with sample payloads (valid + malformed).
- Page — manual verification via `run` skill: upload sample chart, confirm analysis
  renders, confirm a demo trade fires against the Deriv API.

## Out of scope

- Autonomous/server-side bot loop (this is on-demand only).
- Swapping the compromised Gemini key (separate follow-up after advising client).
- Live embedded chart, Portfolio/Charts modals.
