# Inbuilt Bots (`/bots/inbuilt`) — Design

**Date:** 2026-06-22
**Status:** Approved (pending spec review)

## Summary

A page at `/bots/inbuilt` styled like the Digits trading panel. The top row becomes a
grid of **preset bots** — each a named digit-contract config (e.g. "Under 9", "Over 5").
Below is a settings card (symbol, stake, duration, stop conditions) and a Run/Stop
control. Running a bot repeatedly places the same digit contract (flat stake), tracks
each settled contract's profit, accumulates session P/L, and auto-stops on take-profit,
stop-loss, or max-runs — or when the user taps Stop.

Execution is fully **client-side** in `apps/home`, reusing the AI page's auth pattern
(`useAuthContext` + `getFreshWsUrl`). It is self-contained and does NOT import from
`apps/digits`. The bot stops if the tab closes (accepted).

## Decisions

- **Run behavior:** repeat with stop conditions (TP / SL / max-runs) + always-available manual Stop.
- **Staking:** flat stake only (no martingale for now).
- **Execution:** client-side WebSocket loop, no server.
- **Outcome tracking:** subscribe to `proposal_open_contract` to read each contract's settled `profit`.
- **No autonomous AI:** unrelated; these are deterministic preset contracts the user runs.

## Preset bots

Each preset maps to a Deriv digit contract: `{ id, label, contractType, barrier? }`.
Initial set:

| Label    | contract_type | barrier |
|----------|---------------|---------|
| Over 0   | DIGITOVER     | 0       |
| Over 5   | DIGITOVER     | 5       |
| Under 9  | DIGITUNDER    | 9       |
| Under 5  | DIGITUNDER    | 5       |
| Even     | DIGITEVEN     | —       |
| Odd      | DIGITODD      | —       |

(Barrier omitted from the proposal for Even/Odd.) The list is a static array, easy to extend.

## Components

All in `apps/home`:

1. **`lib/bots/inbuilt-presets.ts`** — the preset array + a `DigitPreset` type. Pure data.

2. **`lib/bots/digit-bot.ts`** — the bot engine, framework-agnostic. Exposes a
   `runDigitBot(opts)` that opens a WebSocket, loops buy→settle→repeat, and reports
   progress via callbacks. Inputs: `wsUrl`, `symbol`, `stake`, `duration` (ticks),
   `preset`, `currency`, stop conditions `{ takeProfit?, stopLoss?, maxRuns? }`, and
   callbacks `{ onUpdate(state), onStop(reason) }`. Returns a `stop()` function for
   manual stop. Pure logic around a WebSocket — no React.

3. **`app/bots/inbuilt/page.tsx`** — replaces the coming-soon stub. Client component:
   preset grid, settings card (symbol select, stake, duration, TP/SL/max-runs inputs),
   Run/Stop button, live status (runs, session P/L, state, last result). Uses
   `useAuthContext` for account + `getFreshWsUrl()`. Styled to match the Digits panel /
   Rise & Fall darker-card theme already used on the AI page.

## The bot loop (digit-bot.ts)

Single authenticated WebSocket (OTP url authenticates on connect):

1. `authorize` → on `authorize`, start round 1.
2. Each round: send `proposal` `{ proposal:1, amount: stake, basis:'stake',
   contract_type, currency, symbol, duration, duration_unit:'t', barrier? }`.
3. On `proposal` → `buy` `{ buy: id, price: ask_price }`.
4. On `buy` → subscribe to that contract:
   `{ proposal_open_contract:1, contract_id, subscribe:1 }`.
5. On `proposal_open_contract` where `is_sold|is_expired|status!=='open'`:
   - read `profit` (number), add to `sessionPnl`, increment `runs`.
   - `forget` that contract subscription.
   - emit `onUpdate({ runs, sessionPnl, lastProfit, state:'running' })`.
   - **check stops** (order: maxRuns → takeProfit → stopLoss): if any hit, `onStop(reason)`,
     close socket, done. Manual `stop()` sets a cancelled flag checked here too.
   - else start next round (back to step 2).

**Barrier:** included only when the preset has one (Over/Under/Match/Diff); omitted for Even/Odd.

**Single-flight:** one round at a time; never overlap buys. A `cancelled` flag short-circuits
between rounds so Stop is responsive even mid-contract (it stops after the current contract settles).

## Data flow

Page → builds opts from preset + settings + `getFreshWsUrl()` → `runDigitBot(opts)`.
Engine → callbacks → page updates live status. Stop button → calls the engine's `stop()`.

## Error handling

- **Not authenticated:** Run disabled unless `authState==='authenticated'` and `activeAccount`.
- **Invalid settings:** stake sanitized (finite, ≥ min, 2dp) like the AI page; TP/SL/max-runs
  optional but if present must be positive numbers; duration clamped to a sane tick range (1–10).
- **Deriv `error` message** at any step → `onStop('error: <message>')`, surface as a toast, stop the loop.
- **Socket close / connection error** → `onStop('disconnected')`; page shows it and resets to idle.
- **OTP single-use:** each Run mints a fresh `getFreshWsUrl()`; a Run after a Stop mints a new one.
- **Tab close:** loop dies with the page (accepted). No resume.

## Testing

- `inbuilt-presets.ts` — trivial data; covered by type-check.
- `digit-bot.ts` — unit-test the **proposal-request shaping** (barrier present for Over/Under,
  omitted for Even/Odd; correct contract_type; duration_unit 't') and the **stop-condition
  evaluation** (given a sequence of profits + limits, asserts correct stop reason/order).
  The WebSocket message-routing is verified manually.
- Page + live loop — manual verification via the `run` skill on a **demo** account: run a
  preset, confirm runs increment, session P/L updates, and each stop condition fires.

## Out of scope

- Martingale / variable staking.
- Server-side / tab-independent running.
- Persisting bot state or history across reloads.
- User-defined custom presets (the list is static for now).
- Autonomous AI deciding trades.
