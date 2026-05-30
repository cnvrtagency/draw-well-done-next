# TopDraw Next.js Manual QA Script (Final)

Prepared: 2026-05-30  
Target: TopDraw Next.js staging vs Vite parity (source of truth: `~/Desktop/draw-well-done`)

## Preconditions
- Use staging data and test accounts only.
- Do **not** run real production payments.
- Confirm legal placeholders are still intentionally unresolved if this pass is pre-production.

## Mandatory environment checks
- Confirm Netlify env vars (`NEXT_PUBLIC_SITE_URL`, Supabase URL keys, Stripe keys, IndexNow key).
- Confirm `robots.txt` and `sitemap.xml` are reachable.

## Core required checks (highest priority)
1. Public legal pages (`/free-entry`, `/contact`, `/terms-and-conditions`, `/privacy-policy`, `/cookie-policy`, `/responsible-play`) render complete final copy.
2. `/build-a-bundle` to `/checkout` handoff with basket merge and MiniCart open.
3. `/checkout` with paid path and free path.
4. `/checkout/success` allocation polling + basket clear.
5. Auth: login/register/reset/logout happy path.
6. Account: `/account/entries`, `/account/orders`, `/account/wins`, `/account/security`, `/account/responsible-play`.
7. Account claim and verification upload.
8. Admin: competitions create/edit/view, draw, payment refund/cancel, winners publish/process.
9. Header/footer/nav state transitions at 390/430/1280/1440.
10. Theme toggle across light/dark in public + account + admin at all breakpoints.

## Additional parity checks
- `/competitions` tabs and `/competitions/[slug]` states (live/coming soon/closed/sold out/drawn).
- `/guides` and `/guides/[slug]` rendering and navigation.
- `/admin` fallback/unsupported path behavior (`/admin/notifications`, `/admin/page-content`, etc.)
- `app/sitemap.xml` includes all required public routes.
- `/help` route behavior vs Vite baseline decision (remove/keep/noindex).

## Known staged blockers to record during QA
- legal placeholders in static/legal + footer
- incomplete admin secondary pages (verifications/emails/settings/notifications/page-content/dynamic content/profit calculator)
- missing/no-handler CTA on certain coming-soon state in competition detail
- unresolved light-mode accessibility/contrast in some admin states

## Completion criteria
- All checkboxes below can be marked pass before production sign-off.

- [ ] No console errors/hydration warnings on core journeys
- [ ] No horizontal scroll on required breakpoints
- [ ] Payment and checkout success flows clear in staging
- [ ] High-risk admin actions tested on staging-safe data
- [ ] Legal blockers resolved
