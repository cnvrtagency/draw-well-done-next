# Next.js Parity Checklist (Current Audit State)

## Scope
Vite → Next.js parity across public, auth, checkout, account, admin, SEO, and operational paths.

## Global
- [x] Core route map implemented
- [x] Supabase schema untouched
- [x] Basket/checkout pipeline preserved
- [x] Theme infrastructure (dark default + toggle + persistence)
- [ ] Full visual parity via browser pass at 1440/1280/390/430
- [ ] Full accessibility parity pass

## Public
- [x] `/` homepage and marketing blocks
- [x] `/competitions` + route tabs
- [x] `/competitions/[slug]`
- [x] `/build-a-bundle`
- [x] `/winners`
- [x] `/faqs`
- [x] `/guides`
- [x] `/guides/[slug]`
- [x] `/past-competitions` redirect
- [x] `/how-it-works` redirect
- [x] `/terms` redirect
- [x] Static/legal routes: `/free-entry`, `/contact`, `/terms-and-conditions`, `/privacy-policy`, `/cookie-policy`, `/responsible-play`
- [ ] Remove/resolve all legal placeholders before production

## Auth
- [x] `/login`
- [x] `/register`
- [x] `/forgot-password`
- [x] `/reset-password`
- [ ] Browser visual QA for auth flows
- [ ] Session edge cases in mixed nav states

## Basket/Checkout
- [x] `/basket`
- [x] `/checkout`
- [x] `/checkout/success`
- [ ] Paid checkout end-to-end test
- [ ] Free order test
- [ ] Discount + wallet + stale-line + polling validation

## Account
- [x] `/account`
- [x] `/account/entries`
- [x] `/account/orders`
- [x] `/account/transactions`
- [x] `/account/wallet`
- [x] `/account/profile`
- [x] `/account/security`
- [x] `/account/wins`
- [x] `/account/responsible-play`
- [ ] End-to-end staging tests for claim, verification upload, security updates

## Admin
- [x] `/admin` and `/admin/...` route map
- [x] Core CRUD paths: competitions, hero banners, customers, entries, payments, draws, winners, reviews, discounts, FAQs, guides, wallets, postal entries, content library, SEO centre
- [ ] Complete admin write-path staging tests
- [x] Route parity: `/admin/profit-calculator`
- [x] Route parity: `/admin/verifications`
- [x] Route parity: `/admin/users`
- [x] Route parity: `/admin/settings`
- [x] Route parity: `/admin/payments-dev`
- [x] Route parity: `/footers-preview`
- [x] Alias route parity: `/admin/content`, `/admin/seo`, `/admin/dynamic-content`, `/admin/page-content`, `/admin/orders`
- [ ] Email tooling parity remains reduced vs Vite (editor/preview)
- [x] `/admin/emails` runtime schema alignment (`email_templates.is_enabled`)
- [x] `/admin/discount-codes` graceful fallback when `admin-discount-codes` is unavailable
- [ ] Deploy `admin-discount-codes` Edge Function in every target Supabase environment

## Infrastructure / SEO
- [x] `next.config.mjs`, `netlify.toml`, `app/sitemap.ts`, `app/robots.ts`
- [ ] Validate IndexNow key deployment and production envs
- [ ] Confirm canonical + OG for critical public pages

## Notes
- `TOPDRAW_FINAL_FULL_AUDIT.md` is the complete master audit deliverable for this pass.
- Build/lint pass with warnings:
  - `npm run build`: pass
  - `npm run lint`: pass
