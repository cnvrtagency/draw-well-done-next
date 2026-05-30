# Next.js Launch Readiness

**Latest audit snapshot:** 2026-05-30

## Verdict (this pass)

- **Local QA readiness:** YES
- **Staging readiness:** CONDITIONAL
- **Production readiness:** NO
- **SEO indexing readiness:** CONDITIONAL

## Current state summary

- Core public/auth/account/checkout routes remain in place and stable.
- Admin parity for previously missing Vite areas requested in this implementation pass is now implemented/clarified:
  - `/admin/profit-calculator`
  - `/admin/verifications`
  - `/admin/users`
  - `/admin/settings`
  - `/admin/payments-dev`
  - `/footers-preview`
- `/admin/orders` now clearly documents its Vite parity status as a compatibility route while preserving explicit separation.
- Remaining major risk remains legal/compliance content, staging validation of all write paths, and light-mode/admin accessibility polish.

## Top hard blockers

1. Legal placeholders and launch content blockers in static/legal pages are still present.
2. High-risk checkout/account/admin write paths still need staging-safe execution (refund/cancel, entry actions, draw flow, claim + verification lifecycle).
3. Legacy alias routes remain intentionally present and require operator documentation during rollout.
4. Light-mode audit is only partial for dense admin tables, dialogs, and forms.

## What passed vs what remains

### Good
- Route surface includes all user-facing core pages.
- Theme persistence and dark-mode-default plumbing are fully operational.
- Route map for requested admin tools was expanded and wired in `app/admin/AdminPages.tsx` and visible in `components/admin/AdminShell.tsx`.
- Build/lint execution remains a gate.

### Remaining
- Confirm legal text cleanup and promoter/compliance copy.
- Confirm Vite parity decisions for legacy alias routes and explicit dev-only behavior.
- Confirm no console hydration or action-state regressions on admin pages under staging-like payloads.

## Build / lint status

- `npm run build`: ✅ PASS (warnings only)
- `npm run lint`: ✅ PASS (warnings only)

## Updated launch actions

- [x] Wire `/admin/profit-calculator` route/component from parity baseline.
- [x] Add `/admin/verifications` review workflow.
- [x] Add `/admin/users` dedicated route.
- [x] Add `/admin/settings` route placeholder (safe parity status preserved).
- [x] Add `/admin/payments-dev` parity route with dev-only visual guard.
- [x] Add `/footers-preview` route + noindex metadata.
- [ ] Resolve all legal/compliance placeholders before production signoff.
- [ ] Complete staging-safe manual validation for all checkout/account/admin mutations.
- [ ] Finish light-mode/admin accessibility verification and contrast checks.
