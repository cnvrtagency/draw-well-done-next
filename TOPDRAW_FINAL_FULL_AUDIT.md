# TOPDRAW_NEXTJS_FINAL_AUDIT_FULL

**Date:** 2026-05-30 (UTC)  
**Repository:** `~/Desktop/draw-well-done-next`  
**Source of truth:** `~/Desktop/draw-well-done`  
**Scope:** complete audit only (no functional changes)

## 0) Post-pass implementation update (2026-05-30)

Admin parity gap closure has been completed for:
- `/admin/profit-calculator`
- `/admin/verifications`
- `/admin/users`
- `/admin/settings`
- `/admin/payments-dev`
- `/footers-preview`
- explicit `/admin/orders` admin compatibility route note

All of these are now surfaced in admin navigation and/or route handling with Vite-aligned behavior and no schema or function changes introduced.

## 1) Executive summary

## 1) Executive summary

The Next.js App Router rebuild is substantially complete functionally, with most customer and admin routes present and wired to existing Supabase/Edge Function plumbing. It is **not yet production-ready** for replacement of the Vite app.

Primary launch blockers remain: legal/content placeholders inherited from the Vite source, unvalidated high-risk flows (checkout/account/admin mutations), incomplete secondary admin parity, and incomplete visual/accessibility proofing under real browser conditions.

**Current signal:**
- Local build/lint: ✅ pass
- Browser visual/interaction parity: ⚠️ pending structured QA at 390/430/1280/1440
- Payment/account/admin operations: ⚠️ pending staging execution
- Theme system: ✅ infrastructure and substantial conversion complete; ⚠️ light-mode final QA still pending especially admin and all-state variants

## 2) Current state

### Architecture and repository health
- **`package.json`** is focused and minimal for a production Next app (`next`, `react`, `react-dom`, `tailwind`, `@supabase/supabase-js`, `radix` ui primitives).
- **`next.config.mjs`** uses `unoptimized` images and explicit remote host patterns for Supabase CDNs.
- **`netlify.toml`** is valid and aligned to `@netlify/plugin-nextjs` with `publish = ".next"`.
- `app/` routes are organized by domain (public, auth, account, admin, checkout).
- Concerns are somewhat separated, but **large orchestration files** concentrate complexity:
  - `app/admin/AdminPages.tsx` (~2800 LOC)
  - `app/account/AccountPages.tsx` (~750 LOC)
  - `app/globals.css` (~2270 LOC)
  - `app/checkout/success/CheckoutSuccessClient.tsx` (~658 LOC)
- These monoliths are functioning but expensive to review and likely the first places to refactor post-launch.
- `components/ui/` and route-specific components are relatively clean and reusable.
- `NEXTJS_*` docs are present and already tracking staged audit status, but some are superseded by this report and require consolidation.

### `app/globals.css` and design system
- Shared token model is extensive and supports both dark and light theme states through `html[data-theme="light"] .theme-dark`.
- Light-mode overrides are broad, including glow suppression and panel/input/card tokens.
- Many custom utility overrides are applied via deep selectors (`.admin-shell`, `.account-*`, `.competition-*`, `.mini-cart-*`) increasing maintenance burden.

### Route and feature completeness snapshot
- All required public, auth, basket/checkout, account, and admin shell routes exist in some form.\n- Several secondary admin features are present only as aliases or unavailable fallbacks.
- Static/legal pages are ported but carry unresolved placeholders.

## 3) Top 25 blockers / issues (ranked)

1. **Legal placeholders still visible and indexable** (`[Insert date]`, `[insert postal address]`, `[Insert postal address]`, footer promoter note). 
   - File evidence: `components/StaticPages.tsx:29,150,303,740,772,885`, `components/Footer.tsx:??`
   - Impact: high legal/compliance risk.
2. **High-risk checkout/payment paths unverified in staging** (`/checkout`, `/checkout/success`, free-order path, `create-checkout-session`, discount + wallet + stale-item blocking). 
   - Impact: revenue + compliance + support risk.
3. **Account claim/verification/storage flows unverified in staging** (`submit_prize_claim`, `submit_account_verification`).
4. **Admin draw/payment/entry/wallet/postal mutation paths unverified**.
5. **`/admin/verifications` now has dedicated parity workflow**.
6. **Admin route `/admin/emails` is simplified** compared with Vite rich editor/preview/log tooling.
7. **Secondary admin routes remain limited**: `/admin/notifications`, `/admin/dynamic-content`, `/admin/page-content`.
8. **Light-mode browser QA not completed for admin and all-route-state combinations.**
9. **Real-browser pixel/interactivity QA still not completed at required breakpoints** (1440/1280/390/430).
10. **Competition detail: "Tell me when it’s live" CTA appears for coming-soon with no visible handler** (dead clickable target risk).
11. **No explicit route-level noindex for `/help` redirect route** (currently indexable and extra route vs Vite map).
12. **Guide rendering is simplified (markdown/body parity gap)** versus Vite.
13. **Header/homepage state transitions differ** from Vite due server-tab routing vs Vite client transitions.
14. **Newsletter popup parity not implemented** in public homepage.
15. **Dynamic image/content hydration/perf improvements not completed** (`next/image` migration still pending on many images).
16. **Next lint warning: custom font loading via inline `<link>` in layout** (optimization not aligned to ideal Next pattern).
17. **`app/sitemap.ts` uses `new Date()` for many `lastModified` entries**, causing unnecessary churn.
18. **IndexNow key-file and endpoint validation not yet confirmed on deployed Netlify host**.
19. **Route `/admin/orders` is an alias route pattern, not separate Vite parity view**, and may confuse operators.
20. **Some legacy/wait-state copy still present as migration text** (e.g., “Phase 2” in admin shell).
21. **Potential accessibility gaps in forms**: labels, status messaging, and focus order need browser QA pass.
22. **Raw `<img>` usage on many pages** may impact performance and LCP (not blockers, but risk with many images).
23. **No dedicated route-level metadata for `/basket` noindex decision** (currently public redirect route).
24. **Theme token scope complexity is high**; selector-level overrides are easy to regress during future light-mode edits.
25. **No explicit proof that every admin alias route path is intentionally hidden/paged**; catch-all route can mask unresolved paths.

## 4) Route matrix

### Public routes

| Route | Exists | Render target | Data source | Noindex/Private | Visual parity | Functional parity | Parity risk | Blocker | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | ✅ | `app/page.tsx` + sections/components | Supabase + static config | Public | Partial / good | Close | Low | No | P2 |
| `/competitions` | ✅ | `app/competitions/page.tsx` | Supabase `competitions` | Public | Partial | Close | Tab interactions are link-based instead of client transition | No | P2 |
| `/competitions/[slug]` | ✅ | `app/competitions/[slug]/page.tsx` + `CompetitionDetailClient` | Supabase query by slug | Public | Close | Close (high-risk unverified) | Live/coming/closed/drawn state QA pending | Yes | P1 |
| `/build-a-bundle` | ✅ | `app/build-a-bundle/page.tsx` + `components/home/BundleBuilder.tsx` | Supabase live comps + discount tiers | Public | Close | Close | Mobile + basket handoff + pricing edge cases not fully QA’d | Yes | P1 |
| `/winners` | ✅ | `app/winners/page.tsx` | Supabase `winners` query | Public | Partial | Close | Browser parity for spacing/card states pending | No | P2 |
| `/past-competitions` | ✅ | Redirect component -> `/competitions?tab=ended` | Client redirect | Public | Exact redirect behavior | Close | None | No | P3 |
| `/faqs` | ✅ | `app/faqs/page.tsx` + `FAQClient` | Supabase `faqs` | Public | Partial | Close | Content and accordion parity to be confirmed | No | P2 |
| `/guides` | ✅ | `app/guides/page.tsx` | Supabase `guides` | Public | Partial | Close | Body/markdown rendering parity gap | No | P2 |
| `/guides/[slug]` | ✅ | `app/guides/[slug]/page.tsx` | Supabase guide row | Public | Partial | Partial | Rich markdown/rendering not equivalent | No | P2 |
| `/free-entry` | ✅ | Static page via `components/StaticPages` | Static + legal data | Public | Close | Full-content parity but placeholders | Placeholder content blocker | Yes (content) | P0 |
| `/contact` | ✅ | Static page via `components/StaticPages` | Static + legal data | Public | Close | Full-content parity but placeholders | Placeholder content blocker | Yes (content) | P0 |
| `/terms-and-conditions` | ✅ | Static page via `components/StaticPages` | Static + legal data | Public | Close | Full-content parity but placeholders | Placeholder content blocker | Yes (content) | P0 |
| `/terms` | ✅ | Redirect to `/terms-and-conditions` | Server redirect | Public | Exact alias behavior | Close | None | No | P3 |
| `/privacy-policy` | ✅ | Static page via `components/StaticPages` | Static + legal data | Public | Close | Close but placeholders | Placeholder content blocker | Yes (content) | P0 |
| `/cookie-policy` | ✅ | Static page via `components/StaticPages` | Static + legal data | Public | Close | Close but placeholder date remains | Minor/legal formatting | Yes (content) | P1 |
| `/responsible-play` | ✅ | Static page via `components/StaticPages` | Static + legal data | Public | Close | Close but placeholder date remains | Minor/legal formatting | Yes (content) | P1 |
| `/how-it-works` | ✅ | Redirect to `/faqs` | Server redirect | Public | Exact alias behavior | Close | None | No | P3 |
| `/help` | ✅ | Redirect to `/faqs` | Server redirect | Public | Alias exists (Vite does not expose /help route) | Extra route | Route mismatch vs Vite source-of-truth parity | No (decision gate) | P4 |
| `/account/*` (alias family) | ❌ in public scope | — | — | — | — | — | — | — |

### Auth routes

| Route | Exists | Render target | Data source | Private/Noindex | Visual | Functional parity | Parity risk | Blocker | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/login` | ✅ | `app/login/page.tsx` -> `LoginClient` | Supabase auth | Private route metadata + robots | Close | Close | Browser QA still required | No | P2 |
| `/register` | ✅ | `app/register/page.tsx` -> `RegisterClient` | Supabase auth + profile insert | Private + robots | Close | Close | Browser QA still required | No | P2 |
| `/forgot-password` | ✅ | `app/forgot-password/page.tsx` | Supabase password reset | Private + robots | Close | Close | Browser QA still required | No | P2 |
| `/reset-password` | ✅ | `app/reset-password/page.tsx` | Supabase session reset | Private + robots | Close | Close | Browser QA still required | No | P2 |

### Basket/Checkout

| Route | Exists | Render target | Data source | Private/Noindex | Functional parity | Risk | Blocker | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/basket` | ✅ | `app/basket/page.tsx` | `topdraw_basket_v1` localStorage bridge | Public (redirect route) | Partial | Redirect behavior simple | Low visual risk | No | P2 |
| `/checkout` | ✅ | `app/checkout/page.tsx` -> `CheckoutClient` | Supabase + wallet settings + edge function helpers | robots disallow | Close | Stripe/session/wallet/discount/retry flows unverified | Yes (high) | P1 |
| `/checkout/success` | ✅ | `app/checkout/success/page.tsx` -> `CheckoutSuccessClient` | `payments`, `payment_lines`, `entries` | robots disallow | Close | Polling/clear and allocation UX unverified | Yes (high) | P1 |

### Account routes

| Route | Exists | Render target | Data source | Private/noindex | Visual parity | Functional parity | Risk | Blocker | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/account` | ✅ | `app/account/page.tsx` -> `AccountPages` overview | Supabase profile/orders/tickets aggregates | Private + noindex | Partial | Close | Mobile/empty-state QA pending | No | P2 |
| `/account/entries` | ✅ | `app/account/entries/page.tsx` -> `AccountPages` | Supabase query user entries | Private + noindex | Partial | Close | Manual testing with verified/winning states pending | Yes (medium) | P1 |
| `/account/orders` | ✅ | `app/account/orders/page.tsx` -> `AccountPages` | Supabase orders/allocations | Private + noindex | Partial | Close | QA pending | No | P2 |
| `/account/transactions` | ✅ | `app/account/transactions/page.tsx` -> `AccountPages` | Supabase wallet tx | Private + noindex | Partial | Close | QA pending | No | P2 |
| `/account/wallet` | ✅ | `app/account/wallet/page.tsx` -> `AccountPages` | Supabase wallet ledger | Private + noindex | Partial | Close | QA pending | No | P2 |
| `/account/profile` | ✅ | `app/account/profile/page.tsx` -> `AccountPages` | Supabase profile + update RPC | Private + noindex | Partial | Close | Update flow validation pending | No | P2 |
| `/account/security` | ✅ | `app/account/security/page.tsx` -> `AccountPages` | Supabase auth/session | Private + noindex | Partial | Close | Password/logout QA pending | No | P2 |
| `/account/wins` | ✅ | `app/account/wins/page.tsx` -> `AccountPages` | Supabase winners + claims | Private + noindex | Close | Close | Claim submit path needs staging test | Yes (high) | P1 |
| `/account/responsible-play` | ✅ | `app/account/responsible-play/page.tsx` -> `AccountPages` | Supabase RPC `create_self_exclusion` | Private + noindex | Partial | Close | RPC behavior not staging tested | Yes (high) | P1 |

### Admin routes

| Route | Exists in app routing | Implementation path | Parity gap | Risk | Blocker | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| `/admin` | ✅ | `app/admin/page.tsx` + `AdminPages` | Dashboard shell exists | Role-check and action surface not browser-validated | Staging validation required | P1 |
| `/admin/competitions` | ✅ | `app/admin/competitions/page.tsx` -> `AdminPages` | Route list exists | Mutation correctness risk (duplicates/reconcile/archive/delete) | Staging validation | P1 |
| `/admin/competitions/new` | ✅ | `app/admin/competitions/new/page.tsx` -> `AdminPages` | Form/edit create path exists | High-risk writes/variant regen not tested | Staging validation | P1 |
| `/admin/competitions/[id]` | ✅ | `app/admin/competitions/[id]/page.tsx` -> `AdminPages` | Edit/tier image logic exists | Mutation correctness risk | Staging validation | P1 |
| `/admin/hero-banners` | ✅ | `app/admin/hero-banners/page.tsx` -> `AdminPages` | Parity close | Upload/activation/test path not browser-verified | Staging validation | P2 |
| `/admin/customers` | ✅ | `app/admin/customers/page.tsx` -> `AdminPages` | Customer list and wallet actions exist | Richness reduced vs Vite but usable | QA + storage/action validation | P1 |
| `/admin/entries` | ✅ | `app/admin/entries/page.tsx` -> `AdminPages` | Route exists | Entry actions available | Staging validation | P1 |
| `/admin/orders` | ✅ (alias-like list path into generic admin route) | `app/admin/...` + `AdminPages` | Vite does not expose a distinct orders page and Next presents compatibility route | Admin confusion risk only | QA | P2 |
| `/admin/payments` | ✅ | `app/admin/payments/page.tsx` -> `AdminPages` | Refund/cancel flows exist | Very high-stakes money flow | Staging validation | P1 |
| `/admin/draws` | ✅ | `app/admin/draws/page.tsx` -> `AdminPages` | Draw execution path exists | High-stakes operational risk | Staging validation | P1 |
| `/admin/winners` | ✅ | `app/admin/winners/page.tsx` -> `AdminPages` | Status/publish/proof actions exist | Proof bucket/display QA pending | Staging validation | P1 |
| `/admin/reviews` | ✅ | `app/admin/reviews/page.tsx` -> `AdminPages` | CRUD exists | parity lower than Vite but usable | Low-medium | P2 |
| `/admin/discount-codes` | ✅ | `app/admin/discount-codes/page.tsx` -> `AdminPages` | Actions exist | Function tests unverified | P1 |
| `/admin/wallet-settings` | ✅ | `app/admin/wallet-settings/page.tsx` -> `AdminPages` | Single form/settings path | No regression of wallet policy seen | QA + env policy | P2 |
| `/admin/postal-entries` | ✅ | `app/admin/postal-entries/page.tsx` -> `AdminPages` | Workflow exists | RPC/action validation pending | P1 |
| `/admin/emails` | ✅ | `app/admin/emails/page.tsx` -> `AdminPages` + `/api/send-email` | Reduced editor/preview parity | Major feature-gap for marketing operations | Medium | P3 |
| `/admin/faqs` | ✅ | `app/admin/faqs/page.tsx` -> `AdminPages` | Feature exists | Editor parity acceptable but simplified | Low | P2 |
| `/admin/guides` | ✅ | `app/admin/guides/page.tsx` -> `AdminPages` | Markdown editor simplified | Content parity risk | P2 |
| `/admin/guides/new` | ✅ | `app/admin/guides/new/page.tsx` -> `AdminPages` | Editor simplified | Content parity risk | P2 |
| `/admin/guides/[id]` | ✅ | `app/admin/guides/[id]/page.tsx` -> `AdminPages` | Similar to Vite create/edit | Content parity risk | P2 |
| `/admin/content-library` | ✅ | `app/admin/content-library/page.tsx` -> `AdminPages` | Functional parity close | Storage/perms validation pending | P1 |
| `/admin/seo-centre` | ✅ | `app/admin/seo-centre/page.tsx` -> `AdminPages` | Functionality exists (IndexNow submit + URL list/copy) | Env-key and production verification needed | P2 |
| `/admin` catch-all `/admin/[...path]` | ✅ | `app/admin/[...path]/page.tsx` + `AdminPages` | Unknown/unsupported routes fallback | Useful compatibility bridge | Unknown visual parity for fallback states | Low | P4 |
| `/admin/profit-calculator` | ✅ | `app/admin/profit-calculator/page.tsx` + `components/admin/AdminProfitCalculator.tsx` | Dedicated calculator implemented | Formula parity depends on Vite-side validation | Staging validation | P2 |
| `/admin/verifications` | ✅ | `app/admin/verifications/page.tsx` + `components/admin/AdminVerificationsPage.tsx` | Dedicated verification review workflow | Action safety depends on storage/RLS | Staging validation | P1 |
| `/admin/users` | ✅ | `app/admin/users/page.tsx` + `components/admin/AdminUsersPage.tsx` | Dedicated route implemented | Distinction from `/admin/customers` incomplete by design | Staging validation | P2 |
| `/admin/settings` | ✅ | `app/admin/settings/page.tsx` + `components/admin/AdminSettingsPage.tsx` | Settings parity mostly placeholder/utility | Depends on Vite source expectations | Staging validation | P2 |
| `/admin/custom alias routes` (`/admin/content`, `/admin/seo`, `/admin/notifications`, `/admin/dynamic-content`, `/admin/page-content`) | ✅ aliases | same as above via fallback | Dedicated implementations incomplete for listed routes | Operational feature gap | P3 |

## 5) Design / visual audit

### What is polished
- Premium premium-dark visual language is preserved (glass panels, gradients, card depth, CTA emphasis).
- Header and footer parity and responsive behavior are close to Vite.
- Competition cards, builders, and cart/drawer interactions are visually coherent.
- Winners/cards + checkout surfaces are largely styled correctly for conversion.
- Light-theme tokenization has removed the worst glow and excessive blue bleed in many high-traffic pages.

### What is unfinished/inconsistent
- Admin areas remain uneven in light-mode polish despite token cleanup.
- Public route parity is functional but certain interaction transitions differ from Vite (especially competition tabs and loading states).
- Guide/FAQ rendering and winners/competition detail state-specific polish is not yet visually certified.
- Some copy/placeholder surfaces remain plain legal placeholders.

### Top visual blockers
1. Placeholder legal/postal text exposed in public routes.
2. `CompetitionDetailClient` CTA for “Tell me when it’s live” appears non-functional in coming-soon UI.
3. Admin light-mode parity incomplete in dense detail rows and certain route modals.

### Top polish items before launch
1. Dedicated route-level theme QA at all breakpoints.
2. Admin shell and fallback screens visual cleanup.
3. Guide and FAQ body typography and readability polish.

### Can wait after launch
- Decorative animation refinement and non-functional micro-animations.
- Additional motion polish for non-critical states.

## 6) Light/dark mode audit

- `ThemeProvider`, `useTheme`, and `setTheme` are wired in `app/layout.tsx` and `hooks/useTheme.tsx` with `topdraw_theme` persistence in both `localStorage` + cookie.
- Server-side default remains `data-theme="dark"`; prepaint script resolves stored preference before hydration.
- Light theme tokens are implemented for public, checkout, auth, account, and much of admin.
- Dark mode remains stable and closest to baseline.
- Light mode is significantly improved but **not yet production-ready across all components** (notably some admin and less-traveled states).
- Major contrast issues still require browser verification, especially in tables/modals/forms with dense states.

**Toggle recommendation:**
- Keep visible for internal staging QA now.
- For a public launch candidate, either:
  - complete admin/light-mode validation and keep visible, or
  - hide behind a low-traffic feature flag until parity passes.

**Highest risk files for light-mode QA:**
- `components/CompetitionDetailClient.tsx`
- `components/home/BundleBuilder.tsx`
- `components/MiniCart.tsx`
- `app/account/AccountPages.tsx`
- `components/admin/*`
- `app/admin/AdminPages.tsx`

## 7) SEO audit

### Ready items
- `app/sitemap.ts` includes public routes and dynamic competition/guide entries.
- `app/robots.ts` disallows `/admin`, `/account`, `/checkout`, auth routes.
- Public metadata exists on key pages and dynamic metadata for competition pages is present.

### Gaps / risks
- Placeholder legal content makes legal pages indexable with production-incomplete copy.
- `lastModified` values are generated as `new Date()` for static entries (crawl churn).
- Route aliases like `/help` may need explicit noindex or canonical decision.
- JSON-LD parity for all marketing routes is not uniformly audited; confirm OG/Twitter cards after final content updates.
- IndexNow depends on key-file/deployment state and env vars.

## 8) Performance / SSR / technical audit

### Strengths
- Mostly static/dynamic mix is reasonable; many public routes are prerendered for crawlability.
- Critical logic mostly server-rendered where practical.
- Basket/checkout logic preserved with shared providers to avoid duplicate implementations.

### Risks
- Repeated raw `<img>` usage can increase payload and reduce optimization benefits.
- Some client-side pages/components still perform multiple Supabase queries and polling (`/checkout/success`), which can affect first paint and JS execution.
- `next/image` adoption is partial; image-heavy pages can remain at higher LCP risk.
- `app/globals.css` is very large and includes many deep scoped selectors, increasing style recalculation overhead.
- No hard SSR errors, but JS is required for most interactive flows.

### Launch-blocking technical items
- Checkout/account/admin mutation staging tests.
- Potential perf regression in image-heavy paths if raw `<img>` remains unaddressed.

## 9) Accessibility audit

### High priority issues
- Need full keyboard navigation validation on all headers, drawers, dialogs, and mobile menu states.
- Verify semantic labels and focus management in admin/modals and form dialogs.
- Verify status messaging and error announcements (discount errors, validation, claim failures).
- Confirm no overlay trap/click-block across breakpoints with MiniCart closed state.

### Current positives
- Buttons and nav controls largely use native button/link primitives.
- Theme toggle has `aria-pressed` and `aria-label`.
- Form fields mostly include labels/hints.

### Accessibility launch blockers (before production)
- No known catastrophic blocker from static inspection, but all high-risk screens need real keyboard + focus + color contrast checks.

## 10) Checkout / payment audit

- `topdraw_basket_v1` structure preserved and shared across routes.
- Discount code flow uses existing Edge function.
- Wallet toggle/amount logic exists.
- Checkout success polling and ticket allocation flow is implemented.
- Stale-line blocking logic exists but must be re-tested live.

### Required manual staging tests
1. Paid checkout end-to-end redirect and return handling.
2. Free order path.
3. Discount code invalid/valid.
4. Wallet cap + partial wallet usage.
5. Basket blocks stale/closed/coming-sell lines.
6. Post-success basket clear + ticket assignment state.

## 11) Account / auth audit

### Status
- All account routes and forms exist.
- Protected route behavior appears wired through `app/account/layout.tsx`.
- Profile updates, password change, verification upload, prize claim, and self-exclusion are implemented.
- Logout/account-state behavior is present.

### Risks
- Auth and account mutation flows remain unverified in staging.
- Mobile navigation usability and form edge cases must be tested with real users.
- Potential legal-compliant data handling and upload path verification pending (storage policies).

## 12) Admin audit

### Implemented and present
- Dashboard, competitions CRUD/ops, customers, entries, payments, draws, winners, postal, discounts, wallets, hero banners, reviews, FAQs, guides, content library, SEO centre.
- Route mapping and role checks are in-app.

### Missing/partial parity
- `/admin/verifications` route and review workflow are implemented.
- `/admin/emails` is a reduced implementation.
- `notifications`, `dynamic-content`, and `page-content` routes are compatibility-only and require operator decision.
- Admin light-mode final verification remains incomplete.

### Highest-risk admin actions
- `perform_competition_draw`, payment cancel/refund, postal allocation, wallet adjust/grant, winner proof handling, and payment disputes.

## 13) Supabase / RLS / storage / function audit

- No functional schema changes made in this audit pass.
- Public pages mostly use browser anon client with authenticated patterns expected.
- Admin flows use existing RPCs/functions and service-like calls where needed.

### Key risk checks required before production
1. Confirm `SUPABASE_SERVICE_ROLE_KEY` only used server-side in protected APIs.
2. Validate RLS and storage policies for uploads/downloads (account verification, proofs, competition images, content library).
3. Validate Edge Functions for checkout/create-session, discount, payment, draw allocation, postal allocation, wallet, and contest operations in staging.
4. Confirm admin-only endpoints do not expose sensitive details to unauthenticated contexts.

## 14) Content / legal audit

Current blockers:
- `components/StaticPages.tsx`: placeholders in public legal copy.
  - `[Insert date]` (multiple files)
  - `[insert full postal address]`
  - `[Insert postal address]`
- `components/Footer.tsx`: “Promoter details to be confirmed before launch.”
- No obvious forbidden claims were found in inspected content, but wording relies on Vite source parity and should be legal-reviewed after placeholder resolution.

## 15) Launch readiness verdict

- Ready for local QA? **YES**
- Ready for staging? **CONDITIONAL** (manual test scripts must pass)
- Ready for production? **NO**
- Ready for SEO indexing? **CONDITIONAL** (blocked by unresolved legal placeholders)
- Ready for paid traffic? **NO**
- Ready for admin operations? **CONDITIONAL** (read-only safe, but mutations require staging verification)

## 16) Exact recommended next 10 tasks

1. Replace all legal/address/date placeholders in `components/StaticPages.tsx` and footer.
2. Decide policy for `/help` route (keep/remove/noindex) and align with Vite parity.
3. Execute full visual/interaction QA on 1440/1280/430/390 with checklist from `NEXTJS_MANUAL_QA_SCRIPT.md`.
4. Execute staging checkout matrix (paid, free, stale, discount, wallet, success polling).
5. Execute staging account matrix (register/login/profile/verification/prize claim/self-exclusion).
6. Execute staging admin matrix (competitions/payments/draw/winners/entries/postal/wallet).
7. Validate `competition detail` coming-soon CTA behavior and either wire handler or remove.
8. Resolve light-mode and admin-mode contrast gaps discovered during QA, prioritizing tables, forms, dialogs, and modals.
9. Validate index/metadata/infrastructure: robots/sitemap canonical correctness, sitemap freshness policy, IndexNow key + env in Netlify.
10. Triage and close any remaining image optimization warnings (optional pre-launch performance debt item).

## 17) What can wait until post-launch

- Micro-interaction polish (optional).
- Non-essential admin route parity tooling for profit calculator/notifications if not actively used.
- Advanced newsletter popup parity or optional marketing enhancements.
- Comprehensive image optimization cleanup (`next/image` migration) across all pages can be staged after proving core revenue flows.

## 18) Go-live checklist

### Mandatory pre-go-live (hard)
- [ ] Resolve legal/content placeholders.
- [ ] Complete staged checkout + account + admin mutation tests.
- [ ] Complete accessibility checks in real browsers.
- [ ] Confirm SEO blockers are addressed (robots/noindex/metadata/indexnow key).
- [ ] Confirm RLS/storage/function safety in staging.
- [ ] Confirm Netlify env matrix is complete.

### Pre-go-live (soft)
- [ ] Remove dead CTA handler gap on coming-soon state.
- [ ] Fix route decision for `/help` and any non-Vite extras.
- [ ] Finalize light-mode contrast/visual polish pass.

## 19) Rollback plan

If launch begins and regressions occur, immediately:
1. Revert Next deployment to previous commit on Netlify.
2. Put checkout success and payment routes to maintenance message if needed.
3. Force dark mode as default visual state (already default) if light-mode issues spike.
4. Disable admin heavy write paths pending investigation.
5. Continue serving traffic via Vite until critical items pass.

## 20) Confirmation of scope constraints

- No files under `~/Desktop/draw-well-done` were modified.
- The original Vite app remained untouched.
- This pass made **documentation-only** updates under `~/Desktop/draw-well-done-next`.
- No checkout/ basket/account/admin/business logic was implemented.

## Build and lint run (this pass)

- `npm run build`: ✅ PASS (warnings only)
- `npm run lint`: ✅ PASS (warnings only)

---
