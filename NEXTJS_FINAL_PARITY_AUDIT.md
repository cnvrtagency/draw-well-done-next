# TopDraw Next.js Final Parity Audit

**Date:** 2026-05-30  
**Status:** Broad route parity achieved; production launch blocked by content + validation + visual access checks.

## Executive parity verdict

- **Core public journey parity:** High (exists and functional)
- **Checkout/account/admin parity:** Implemented, but staging mutation validation required
- **Theme parity:** Dark parity strong; light parity partial and route-complete but still QA-dependent
- **Launch parity:** Not yet fully launch-ready

## Route parity matrix (required scope)

### Implemented (with parity notes)
- **Public:** `/`, `/competitions`, `/competitions/[slug]`, `/build-a-bundle`, `/winners`, `/past-competitions`, `/faqs`, `/guides`, `/guides/[slug]`, `/free-entry`, `/contact`, `/terms-and-conditions`, `/terms`, `/privacy-policy`, `/cookie-policy`, `/responsible-play`, `/how-it-works`
- **Auth:** `/login`, `/register`, `/forgot-password`, `/reset-password`
- **Checkout:** `/basket`, `/checkout`, `/checkout/success`
- **Account:** `/account`, `/account/entries`, `/account/orders`, `/account/transactions`, `/account/wallet`, `/account/profile`, `/account/security`, `/account/wins`, `/account/responsible-play`
- **Admin:** `/admin` and core admin subroutes listed in parity plan

### Missing/extra notes
- `/footers-preview` is now implemented as a public preview route with `noindex`.
- `/help` exists in Next as redirect alias, but no direct Vite source equivalent.
- Previously missing Vite admin routes now have dedicated parity pages:
  - `/admin/profit-calculator`
  - `/admin/verifications`
  - `/admin/users`
  - `/admin/settings`
  - `/admin/payments-dev`
  - `/admin/orders` (compatibility route with explicit note)

## What is close to parity
- Basket + MiniCart + discount and wallet math are present and shape-compatible.
- Checkout success polling and allocation summary are present.
- Competition detail/build-a-bundle are implemented using Vite query/logic patterns.
- Account and admin route map and role guards exist.

## What is not yet launch-parity
- Legal/static placeholder cleanup.
- Full-staging validation of high-impact writes.
- Visual and accessibility parity under real breakpoint/browser testing.
- Admin route completeness for reduced/editor-light workflows (emails, notifications, dynamic/page content) and operator training on alias routes.

## Recommended decision

Proceed only as a **staging candidate**, not production, until the 25 ranked blockers in `TOPDRAW_FINAL_FULL_AUDIT.md` are resolved.
