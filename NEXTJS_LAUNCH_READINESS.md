# Next.js Launch Readiness

## Current Status

The Next.js rebuild is closer to customer-facing launch parity, but it is not ready to replace the Vite app yet.

## Final Parity Audit - 2026-05-23

See `NEXTJS_FINAL_PARITY_AUDIT.md` for the complete final parity audit against the Vite app.

Current verdict: ready for staging deployment and structured manual testing, but not production-ready as a Vite replacement. The top blockers are legal/static placeholders, real-browser visual/interactivity QA, checkout/account/admin staging mutation tests, and incomplete secondary admin parity for verifications, richer email tooling, settings, notifications, page content, dynamic content and profit calculator.

Audit-only note: this pass made documentation changes only. No business logic, routing, checkout, basket, auth, admin mutations, Supabase schema/RLS, Edge Functions, payment, draw, allocation, Klaviyo or Resend logic was changed.

## Theme Mode Infrastructure - 2026-05-24

Phase 1 of the light/dark mode system is implemented as infrastructure only:

- `app/layout.tsx` now renders `html[data-theme="dark"]` by default and runs a small pre-paint script to apply any stored theme preference before hydration.
- `hooks/useTheme.tsx` provides `ThemeProvider`, `useTheme`, `setTheme`, `theme` and `resolvedTheme`.
- Theme preference is stored in `localStorage` and mirrored to a `topdraw_theme` cookie.
- Supported preferences are `dark`, `light` and `system`; dark remains the default when no preference exists.
- `app/globals.css` now contains light token scaffolding under `html[data-theme="light"] .theme-dark`.
- The existing `.theme-dark` wrapper remains in place, and no visible toggle or component-wide light-mode conversion has been added yet.

Launch note: dark-mode staging behavior should remain visually unchanged. Light mode is not launch-ready until shared components, public pages, account pages and admin pages are converted and contrast-tested.

## Theme Shared Primitives - 2026-05-24

Phase 2 of the light/dark mode system is implemented for shared primitives only:

- `Panel`, `Button`, `Input`, `Dialog`, `StatusBadge`, `EmptyState`, `WalletPill` and `MiniCart` now use semantic theme-aware classes or CSS variables where safe.
- The MiniCart closed state remains non-interactive with `pointer-events-none` and no open-state shadow while closed.
- Dialog overlays remain Radix-mounted only while open and use a theme-aware backdrop variable.
- Header and Footer were audited but intentionally not converted in this pass; they remain part of the next public-shell theme phase.

Launch note: dark remains the default and should remain visually equivalent. Light mode is still not production-ready until page-level surfaces and high-risk account/admin components are converted and manually contrast-tested.

## Theme Public Shell And High-Traffic Components - 2026-05-24

Phase 3 of the light/dark mode system is implemented for the public shell and the highest-traffic public components:

- `Header` and `Footer` now use semantic theme-aware navigation, surface, border and text utilities while preserving the existing auth/account/admin/wallet/MiniCart behavior.
- `CompetitionCard`, `WinnerCard`, `CompetitionDetailClient`, `EntryQuantitySelector`, `BundleBuilder`, `CountdownPill`, `CountdownStrip` and `ProgressBar` now use token-backed public-card, quantity, countdown, progress and text utilities where safe.
- Image overlays, gold chips, primary CTA treatments and winner/closed-state overlays intentionally keep white text where they sit on dark imagery or brand gradients.
- No visible theme toggle was added, and no checkout, basket, auth, account, admin, Supabase, schema/RLS, payment, draw, allocation or pricing logic was changed.

Launch note: dark mode should remain visually equivalent. Light mode is more readable across public commerce surfaces, but it is still not production-ready until the lower-priority public sections plus account/admin pages are converted and manually contrast-tested.

## Theme Public Static And Marketing Cleanup - 2026-05-24

First visible light-mode cleanup pass for public/marketing surfaces is implemented:

- `Header` and `Footer` now swap the logo with CSS under `html[data-theme="light"]`: dark mode keeps `/assets/topdraw-logo.png`, light mode uses `/assets/topdraw-logo-light-mode.png`.
- `StaticPages`, `InfoPage`, `FAQClient`, `FreeEntryNotice`, public route headers, guide list/detail pages, competition/winner route panels, `PrizeDrops`, `BundleFAQSection`, `ReviewsMarquee`, `CompetitionMarquee`, `FeaturedCompetitionsCarousel` and category/tab controls now use theme-aware text, panel, border, edge-fade and tab utilities where safe.
- Image-backed hero copy and selected primary/gold/brand badges intentionally keep white text on dark image or brand-gradient backgrounds for contrast.
- No visible theme toggle was added, and no checkout, basket, auth, account, admin, Supabase, schema/RLS, payment, draw, allocation or pricing logic was changed.

Launch note: hidden light mode is now substantially more readable on public/static/marketing pages. It is still not launch-ready until checkout/auth/account/admin surfaces are converted and browser contrast-tested at mobile and desktop widths.

## Theme Checkout And Auth Cleanup - 2026-05-24

Next light-mode cleanup pass is implemented for checkout and auth surfaces:

- `CheckoutClient` now uses theme-aware text, panel, row, total, notice, wallet, discount and empty-state styling while preserving the existing basket, pricing, discount-code, wallet and `create-checkout-session` behavior.
- `CheckoutSuccessClient` now uses tokenized confirmation panels, status panels, ticket pills, refresh buttons, recommendation blocks and success/failure/pending copy while preserving allocation polling and Klaviyo one-shot behavior.
- `LoginClient`, `RegisterClient`, `ForgotPasswordClient` and `ResetPasswordClient` now use theme-aware auth input, label, hint, panel and checkbox-row styles while preserving existing Supabase auth calls and validation.
- No visible theme toggle was added, and no checkout, basket, auth, Supabase, schema/RLS, Stripe/payment, ticket allocation, draw, pricing, Klaviyo or Resend logic was changed.

Launch note: this phase kept light mode hidden. Checkout/auth surfaces still require browser contrast QA now that the header toggle is visible.

## Theme Account And Light Background Cleanup - 2026-05-24

Next light-mode cleanup pass is implemented for customer account surfaces and the global light-mode page shell:

- Global `bg-hero-mesh`, `home-bg`, `home-bg-layer`, native date/select controls and `.bg-card` now resolve through theme variables so light mode uses a premium light/silver page background instead of a hard-coded dark navy shell.
- `app/account/layout.tsx` now uses the tokenized account panel/navigation treatment while preserving the existing logged-out redirect and mobile scroll behavior.
- `AccountPages` overview, entries, orders, wallet, transactions, profile, security, verification upload, prize claim dialog, wins and responsible-play surfaces now use theme-aware account/text/panel/input/table utilities where safe.
- Shared `StatTile` now uses theme-aware text, icon and surface tokens for account dashboards and other summary tiles.
- No visible theme toggle was added, and no account, auth, checkout, basket, Supabase, schema/RLS, Stripe/payment, ticket allocation, draw, pricing, Klaviyo or Resend logic was changed.

Launch note: light mode is now substantially more readable across customer-facing public, checkout, auth and account surfaces. Admin remains the main known light-mode QA/follow-up area now that the header toggle is visible.

Account background follow-up:

- `/account/*` no longer uses the generic high-opacity `bg-hero-mesh` account backdrop.
- `app/account/layout.tsx` now uses account-specific `account-bg-mesh` and `account-bg-glow` layers.
- Dark mode keeps the existing premium blue mesh atmosphere; light mode uses much softer silver/cyan gradients to avoid the dark blue glow behind account content.
- Decorative account background layers remain `pointer-events-none` and do not affect account logic or routing.

## Theme Toggle - 2026-05-24

The light/dark mode toggle is now visible for staging QA:

- `Header` includes a compact icon toggle in the desktop control group near the wallet, MiniCart, Account/Admin and login controls.
- The mobile menu includes a labeled theme toggle row.
- The toggle uses the existing `useTheme`/`setTheme` provider only; it does not add a second theme state system.
- Preference persistence remains the existing `topdraw_theme` localStorage value mirrored to the `topdraw_theme` cookie.
- Dark remains the default for new users, and stored preferences continue to be respected before hydration by the existing pre-paint script.
- Toggle buttons use real `<button>` elements with `aria-label`, `aria-pressed`, focus rings and touch-sized mobile controls.

Launch note: public, checkout, auth and account light-mode surfaces are partially converted and exposed for staging review. Admin light mode is still a known QA/follow-up area and needs dedicated contrast testing; admin access is not blocked or forced back to dark mode.

## Theme Admin Shared Surfaces - 2026-05-24

The first admin light-mode cleanup pass is implemented for shared surfaces only:

- `AdminShell` now uses theme-aware admin shell, sidebar, navigation, loading and access-denied styling.
- `AdminKit` shared page headers, panels, table wrappers and table rows now use admin theme tokens.
- `AdminImageUploader` dropzone, drag-over state, title and helper text now use admin theme tokens.
- Shared admin helper labels, textareas, loading messages and empty states in `AdminPages.tsx` now use admin theme classes.
- Repeated admin table headers, native selects and dialog shells were moved away from hard-coded dark HSL/white utility styling.
- Admin business logic, role guard behavior, queries, mutations, RPC/Edge Function calls, uploads and validation were not changed.

Launch note: admin light mode is more readable at the shared-surface level, but route-level admin content still needs conversion and browser QA before production sign-off.

## Full Parity Audit - 2026-05-23

Overall verdict: not ready for staging sign-off as a Vite replacement. The main customer journey and admin shell are substantially ported, `/build-a-bundle` has now been replaced with the real Vite-style Bundle Builder, and public static/legal pages now use the full Vite source content. The Vite source still contains placeholder promoter postal address/date strings, so final legal address/date content remains a launch content blocker. High-risk checkout/account/admin mutations still need real staging tests against existing Supabase RLS, storage policies, RPCs and Edge Functions.

### Public Route Matrix

| Route | Next status | Main parity gap | Launch blocker |
| --- | --- | --- | --- |
| `/` | Partial | Homepage sections exist and Bundle CTA now lands on the real builder; newsletter popup parity not present; browser pixel review still required. | No |
| `/competitions` | Partial | Data and tabs exist; tab changes are server route transitions rather than Vite client transition; pixel review required. | No |
| `/competitions/[slug]` | Partial | Core entry, gallery, tiers, marquee and basket flow exist; requires browser/manual parity and checkout integration tests. | Yes |
| `/build-a-bundle` | Partial | Real Vite-style builder is implemented; manual mobile, basket, MiniCart and checkout handoff tests still required. | Yes |
| `/winners` | Near complete | Data query and Vite-style winner cards exist; Vite loading skeleton is not visible on server render; browser visual test required. | No |
| `/past-competitions` | Redirect parity | Redirects to `/competitions?tab=ended`, matching Vite route behavior. | No |
| `/faqs` | Partial | DB-backed FAQ list exists; static FAQ content in homepage bundle panel exists; visual/content review required. | No |
| `/guides` | Partial | Published guide list exists; markdown rendering is simplified compared with Vite guide body component. | No |
| `/guides/[slug]` | Partial | Guide detail exists, but rich markdown/body rendering is simplified. | No |
| `/free-entry` | Partial | Full Vite content is ported; Vite source still contains `[Insert postal address]`. | Yes |
| `/contact` | Partial | Full Vite content is ported; Vite source still contains placeholder postal address. | Yes |
| `/terms-and-conditions` | Partial | Full Vite legal text is ported; Vite source still contains placeholder promoter address/date. | Yes |
| `/privacy-policy` | Partial | Full Vite privacy text is ported; Vite source still contains placeholder postal address/date. | Yes |
| `/cookie-policy` | Near complete | Full Vite cookie policy is ported; final date content still follows Vite placeholder date. | No |
| `/responsible-play` | Near complete | Full Vite responsible-play copy is ported; final date content still follows Vite placeholder date. | No |
| `/how-it-works` | Complete | Redirects to `/faqs`, matching Vite. | No |
| `/terms` | Complete | Redirects to `/terms-and-conditions`, matching Vite. | No |
| `/footers-preview` | Missing | Vite has a public preview route; likely non-production/dev-only. | No |

### Bundle Builder Audit

Vite source files:
- `src/pages/public/BuildBundle.tsx`
- `src/components/home/BundleBuilder.tsx`
- `src/components/home/BundleFAQSection.tsx`
- `src/components/home/PrizeDrops.tsx` bundle strip/link references
- `src/hooks/useBasket.tsx`
- `src/components/EntryQuantitySelector.tsx` for `computePricing`
- `src/pages/public/Checkout.tsx` for discount-tier checkout compatibility

Next current state:
- `app/build-a-bundle/page.tsx` renders real metadata, JSON-LD, page header and the interactive Bundle Builder.
- `components/home/BundleBuilder.tsx` ports the Vite live competition query, discount tier grouping, quantity controls, pricing rows, sticky summary and basket/MiniCart handoff.
- `components/home/BundleFAQSection.tsx` exists and links to `/build-a-bundle`.
- `hooks/useBasket.tsx`, `components/EntryQuantitySelector.tsx`, MiniCart and checkout tier calculations already provide the shared primitives needed for the port.

Exact Bundle Builder behavior now implemented:
- Live competition query with `status = live`, `archived_at is null`, `opens_at` open/null, `closes_at` future/null, sorted by closing date and filtered for remaining capacity.
- Discount tier fetch from `competition_discount_tiers` grouped by competition.
- Quantity steppers, manual quantity input and cap enforcement against remaining tickets and `per_user_entry_limit`.
- Per-row pricing with Vite `computePricing`, next-tier nudges, expanded details, mobile tier hints and image/title links.
- Sticky summary with selected competitions, subtotal, tier savings, final total and selected prize list.
- Add selected bundle rows to the shared basket and open MiniCart.
- Loading and empty states.
- Bundle page SEO and JSON-LD.

Manual tests still required:
- `/build-a-bundle` loads with live competitions.
- Single and multi-competition selection works.
- Quantity caps prevent exceeding effective remaining and per-user limits.
- Discount tiers display and calculate correctly.
- Add bundle writes correct `topdraw_basket_v1` item IDs/quantities and opens MiniCart.
- Checkout receives the selected bundle items.
- Mobile layout works at 390px with no hydration or click issues.

### Public UI Gaps

- Header is close to Vite: same nav items, auth/account/admin state, wallet pill and MiniCart. Manual logged-out/customer/admin/mobile tests still required.
- Footer is close to Vite, but still shows “Promoter details to be confirmed before launch”; legal/contact pages now match Vite and therefore still contain Vite placeholder postal-address text.
- Homepage visually includes hero, reviews, PrizeDrops and BundleFAQ, and the destination bundle route is now operational pending manual QA.
- Competition detail has key Vite features, but requires browser QA for gallery, quantity selector, discount tiers, free entry notice, dynamic marquee, winner/drawn state and basket integration.
- Static/legal pages now use literal content parity from Vite `src/pages/public/Static.tsx`; final real promoter address/date values are still needed.

### Basket And Checkout Gaps

- Basket provider and MiniCart use the Vite `topdraw_basket_v1` shape and DB merge/persist pattern.
- Checkout uses existing `validate-discount-code` and `create-checkout-session` Edge Functions and wallet settings queries.
- Manual staging tests are still required for Stripe redirect, free-order handling, stale basket blocking, wallet credit use, discount codes and checkout success allocation polling.
- Bundle Builder is now implemented and still requires basket/MiniCart/checkout handoff testing.

### Auth And Account Gaps

- Login, register, forgot/reset, account overview, entries, orders, transactions, wallet, profile, security, wins, prize claim, verification upload and responsible-play routes are implemented.
- Account verification and prize claim still depend on existing RPC/storage policy behavior in staging.
- Manual tests are required for logged-out redirects, profile updates, document upload, claim submission and self-exclusion RPC flow.

### Admin Gaps

- Required admin areas are routed and most operational actions are wired to existing tables, RPCs or Edge Functions.
- Vite admin routes still not represented in normal Next nav or fully ported: `/admin/profit-calculator`, `/admin/users`, `/admin/verifications`, `/admin/notifications`, `/admin/dynamic-content`, `/admin/page-content`, `/admin/settings`, plus Vite route aliases `/admin/content` and `/admin/seo`.
- Customer verification review workflow remains incomplete.
- Email admin is limited to template listing plus `/api/send-email`; Vite editor/preview/preset/fallback-template UI is not ported.
- Guide editor uses a textarea/markdown flow and may not match Vite rich/body rendering polish.
- Every admin mutation still needs real staging tests for RLS/function/storage/provider behavior.

### SEO And Infrastructure Gaps

- `app/sitemap.ts` and `app/robots.ts` exist; sitemap now includes `/build-a-bundle`.
- Private/auth/checkout/admin routes are disallowed in robots and admin metadata is noindex/nofollow.
- Core public metadata and JSON-LD exist for homepage, competition detail and guides; static/legal metadata has been expanded to match Vite intent.
- `/api/send-email` and `/api/indexnow-submit` exist and are server-only/admin guarded where required.
- IndexNow key file must exist at the deployed public origin.
- `netlify.toml` uses `@netlify/plugin-nextjs`; environment variables must be set in Netlify, not just `.env.local`.

### Data, Function And RLS Risks

- No browser-side service role exposure was found. `SUPABASE_SERVICE_ROLE_KEY` is only referenced in server admin/API files.
- Browser clients call existing Supabase tables, storage, RPCs and Edge Functions with anon/authenticated clients; staging RLS/storage policy tests remain mandatory.
- High-risk functions/RPCs needing staging verification: `create-checkout-session`, `validate-discount-code`, `submit_prize_claim`, `submit_account_verification`, `create_self_exclusion`, `perform_competition_draw`, `allocate_postal_entry`, `duplicate_competition`, `archive_competition`, `unarchive_competition`, `delete_competition_if_safe`, `admin-reconcile-counts`, `admin-discount-codes`, `admin-cancel-payment`, `admin-refund-payment`, wallet grant/adjust and entry action Edge Functions.

### Ranked Launch Blockers

1. Real promoter postal address/date values remain missing in the Vite source and therefore in the ported static/legal pages.
2. Bundle Builder is implemented but still needs manual mobile, basket, MiniCart and checkout handoff tests.
3. Stripe/free checkout and checkout-success allocation flows require real staging tests.
4. Account prize claim and verification upload require real staging tests against RPCs/storage policies.
5. Admin operational mutations require real staging tests; customer verification review remains incomplete.
6. Email editor/preview and IndexNow key-file availability remain incomplete for full admin parity.
7. Browser/pixel/interactivity QA is still outstanding across public, account and admin routes.

### Recommended Next Implementation Order

1. Confirm and replace final legal promoter address/date placeholders once the business provides approved values.
2. Run Bundle Builder manual tests for mobile, pricing, basket, MiniCart and checkout handoff.
3. Run browser QA on homepage, competitions, detail, basket, checkout, auth, account and admin guard.
4. Run staging transaction tests for Stripe/free checkout and checkout success.
5. Run staging account verification/prize claim tests.
6. Run staging admin mutation tests by risk: draw/winners, payments/refunds/wallet, postal, competitions, hero banners, discounts, reviews/content.
7. Port remaining lower-priority admin parity: verifications review, email editor/preview, profit calculator, notifications/settings/page-content aliases if required for launch operations.

## Urgent Interactivity Fix

Fixed the global click/link/button regression introduced by the basket provider layer.

Root causes addressed:
- `BasketProvider` wrote `topdraw_basket_v1` on every basket state change and dispatched `topdraw:basket-updated`.
- The same provider listened for `topdraw:basket-updated`, re-read localStorage into a new array, and could continuously update itself after hydration.
- The closed MiniCart drawer remained mounted as a fixed `z-50` element. It now has `pointer-events-none` while closed.
- Hero decorative image and overlay layers are now explicitly `pointer-events-none`.

Countdown follow-up:
- Competition card countdown strips now use the shared Vite-style 1-second tick hook and display days/hours/minutes/seconds.

Manual click tests still required in a real browser:
- Header logo and nav links.
- Hero Enter Now CTA.
- Competition card navigation and CTA.
- Entry quantity buttons.
- Add to basket.
- MiniCart open/close.
- Checkout CTA.
- Mobile menu.
- Footer links.

## Routes Complete Or Near Complete

- `/`
- `/competitions`
- `/competitions/[slug]`
- `/winners`
- `/faqs`
- `/guides`
- `/guides/[slug]`
- `/free-entry`
- `/contact`
- `/terms-and-conditions`
- `/privacy-policy`
- `/cookie-policy`
- `/responsible-play`
- `/basket`
- `/checkout`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/checkout/success`
- `/account`
- `/account/entries`
- `/account/orders`
- `/account/transactions`
- `/account/wallet`
- `/account/profile`
- `/account/security`
- `/account/wins`
- `/account/responsible-play`

## Routes Still Incomplete

- `/build-a-bundle` remains outside the current launch route set.
- Admin routes are operationally wired but still require staging tests against real admin RLS/storage/function policies before launch.

## Basket Status

- Uses the Vite localStorage key `topdraw_basket_v1`.
- Uses the same basket item shape: `competition_id`, `quantity`, `added_at`.
- Supports add, update, remove, clear and quantity merging.
- Authenticated users merge and persist basket rows through `baskets` and `basket_items`.
- MiniCart now matches the Vite drawer structure closely and enforces public quantity caps client-side.

Manual tests required:
- Add from competition detail.
- Reopen drawer from header.
- Increase/decrease quantity.
- Remove item.
- Login and confirm DB basket merge/persist.

## Checkout Status

- Checkout reads the shared basket provider.
- Fetches competitions, discount tiers, wallet balance, wallet public settings and profile completeness.
- Blocks non-live, not-open, closed, stale and over-remaining basket lines.
- Applies discount codes through the existing `validate-discount-code` Supabase Edge Function.
- Calls the existing `create-checkout-session` Supabase Edge Function with the Vite payload shape.
- Preserves wallet amount and marketing opt-in session storage.
- Checkout success now polls the existing `payments`, `payment_lines` and `entries` tables using the Vite flow.
- Checkout success displays pending, allocation, failed, cancelled, timeout and confirmed ticket states.
- Checkout success preserves the Vite one-shot Klaviyo confirmed-subscribe behavior from `topdraw_marketing_opt_in`.

Manual tests required:
- Discount code success/failure.
- Wallet credit cap.
- Stale competition blocked.
- Coming soon blocked.
- Stripe redirect.
- Free-order success redirect.
- Checkout success with valid Stripe redirect.
- Checkout success loading/pending allocation.
- Checkout success missing/invalid payment ID.
- Free competition order success.

## Auth Status

- Supabase browser auth client persists and refreshes sessions.
- Login, register, forgot password and reset password are implemented.
- Register uses the Vite fields and passes profile fields via auth metadata.
- Register performs the same best-effort profile update when a session is returned.
- Marketing consent calls the Netlify Klaviyo subscribe function without exposing private keys.

Manual tests required:
- Register with email confirmation enabled.
- Register with email confirmation disabled.
- Login/logout.
- Forgot/reset password callback.
- Profile trigger writes all required fields.

## Account Status

Account pages are now implemented, using the same authenticated Supabase/RLS client pattern as Vite.

Implemented:
- Protected AccountLayout with Vite-style sidebar/mobile nav and active states.
- Overview dashboard with profile, stats, latest entry, next draw, self-exclusion and unclaimed-prize notices.
- Entries grouped by competition with current/past tabs and ticket chips.
- Orders with payment totals, statuses, discounts, wallet/refund chips and competition links.
- Transactions and wallet ledger views.
- Wallet balance, lifetime earned/spent and recent activity.
- Profile edit form writing to `profiles` with the same public fields.
- Profile DOB lock, 18+ validation, phone/postcode validation and verified-profile reset warning.
- Account verification panel with current status states, document file validation, `account-verification` storage upload, `account_verification_documents` insert and `submit_account_verification` RPC submission.
- Security password update and logout.
- Wins display with fallback lookup by winning entries.
- Prize claim dialog with profile-prefilled delivery fields, cash alternative choice and `submit_prize_claim` RPC submission.
- Responsible play self-exclusion status and `create_self_exclusion` RPC flow.

Still differs:
- Account mobile/desktop pixel review is still required.
- Account verification and prize claim submission still depend on the existing Supabase RPCs/storage policies being present and allowing the authenticated customer action; no schema/RLS bypass was added.

Manual tests required:
- Logged out `/account` redirects to `/login`.
- Login then `/account` loads.
- Entries, orders, transactions, wallet, profile, security, wins and responsible play load under the test user.
- Profile update writes through RLS.
- Verification panel displays the correct status.
- Document upload either submits through storage/RLS or reports the exact Supabase policy/RPC error.
- Prize claim dialog opens for `unclaimed`/`claim_started` wins.
- Prize claim submission either succeeds through `submit_prize_claim` or reports the exact backend error.
- Password update works.
- Self-exclusion RPC works for an eligible account.
- Modal close buttons remove the overlay and return page clicks.
- No hydration error on account pages.
- Mobile account nav scroll behavior.

## Admin Status

Not launch-ready. The guarded admin shell, dashboard, competition operations, hero banners, draw/winner tooling, postal entries, payments, wallet settings and the main CRUD/content areas are now wired to the same Supabase tables, storage buckets, RPCs and Edge Functions used by Vite. Launch still depends on real admin-account staging tests against RLS/storage/function policies, plus the remaining email and SEO API blockers.

### Full Admin Audit Snapshot

Vite admin features found:
- Admin guard uses the authenticated Supabase client plus `user_roles`/admin role checks; no service role is exposed in the browser.
- Competition admin supports list/search, create/edit, status changes, manual reserved entry audit logging, main/gallery image upload, generated original/card/detail/thumb variants in the `competition-images` bucket, variant regeneration from an existing source URL, discount tiers and dynamic content sections.
- Hero banner admin supports list/create/edit/delete, active banner deactivation for the same `page_key`, schedule fields, CTA/trust chip fields, desktop/mobile image upload and preview.
- Draw and winner admin use existing database/RPC/function contracts including `perform_competition_draw`, winner record mutations, draw proof upload and winner publishing/status controls.
- Postal entry admin uses existing `postal_entries` mutations and `allocate_postal_entry` flow.
- Customer, entry, payment and wallet admin actions use existing Edge Functions/RPCs such as wallet grant/adjust, entry void/refund/archive/delete and payment cancel/refund.
- Reviews, discount codes, wallet settings, FAQs, guides, email templates, content library and SEO pages use existing table mutations, storage access or Edge Function calls rather than local fake state.

Next admin features currently implemented:
- Guarded admin shell, mobile/desktop nav, route map, dashboard stat cards, noindex/nofollow metadata and safe read-only views for every required admin route.
- Competition create/edit/status form with Vite field names, reserved-entry capacity validation, reserved-entry audit log insert, main/gallery image upload, image variant regeneration, duplicate/reconcile/archive/unarchive/delete actions, discount tiers and competition marquee content against the existing tables, RPCs, Edge Function and `competition-images` bucket.
- Hero banner list/create/edit/delete/activate, active-banner deactivation for the same `page_key`, schedule/copy/CTA/trust-chip fields, desktop/mobile upload and preview.
- Draw execution through the existing `perform_competition_draw` RPC, with valid-entry counts and proof JSON download.
- Winner publish/unpublish, display fields, proof JSON upload/signed open/download and claim status/delivery field edits.
- Postal entry create/process/reject/reset using the existing `postal_entries` table and `allocate_postal_entry` RPC.
- Payment cancel/refund actions using the existing `admin-cancel-payment` and `admin-refund-payment` Edge Functions.
- Wallet settings edit/save through the existing `wallet_settings` row.
- Customer list/detail, linked entries/orders/payments/winners, wallet ledger preview and wallet grant/adjust actions through existing Edge Functions.
- Entry list plus void, wallet/manual refund, archive/unarchive and delete actions through existing Edge Functions.
- Discount code list/create/edit/delete/activate through the existing `admin-discount-codes` Edge Function.
- Reviews create/edit/delete/toggle against the existing `reviews` table.
- FAQs create/edit/archive/unarchive/delete against the existing `faq_items` table.
- Guides list/create/edit/publish/unpublish/archive/delete/duplicate plus featured-image upload against the existing `guides` table and `competition-images` bucket.
- Content library storage list/upload/delete/copy URL for the existing `competition-images` bucket.
- SEO centre URL selection/copy helpers copied from Vite, with admin-only IndexNow submission through `/api/indexnow-submit`.
- Read-only email template list plus a server-only `/api/send-email` compatibility route for DB-backed templates, admin JWTs and internal webhook-secret calls.

Exact gaps:
- Hero banner browser tests against the public homepage active-banner query are still required.
- Draw execution, winner publishing/proof and postal processing require real admin/RLS/RPC/storage testing before launch.
- Customer verification-review workflow is still incomplete; wallet grant/adjust and entry void/refund/archive/delete actions are wired but require staging function/RLS tests.
- Payment cancel/refund functions are wired but require staging provider/RLS testing; no refund should be considered verified until the existing Edge Functions return success in staging.
- Competition duplicate/reconcile/archive/unarchive/delete RPC actions, discount tier editing and dynamic content editing are wired but require staging RPC/function/RLS tests before launch.
- Email editor/preview UI is still not ported, but `/api/send-email` exists for DB-backed template sends. Hardcoded Vite fallback template rendering was not copied into Next.
- SEO IndexNow submission route now exists. The IndexNow key file at the public site root still needs to be present for production indexing.

High-risk actions:
- Draw execution and winner publishing must keep using the Vite RPC/function path and must not introduce client-side winner selection.
- Payment/refund, wallet and ticket allocation flows must only call the existing Edge Functions/RPCs.
- Competition pricing, max entry, free entry and reserved entry changes must match Vite validation and audit logging.
- Storage uploads must respect existing bucket/RLS policies; blocked uploads must surface the Supabase error instead of bypassing policy.
- Email and SEO submits must return real provider/API responses or clear configuration errors; the UI must not fake successful sends/submissions.

Required manual tests:
- Admin login/guard, non-admin access denial and no data render before role eligibility is known.
- Competition create/edit/status, image upload and regenerate variant attempts against a real admin account.
- Hero banner create/edit/activate and homepage active banner compatibility.
- Draw execution/winner publishing only against a safe staging/test competition.
- Postal entry process/reject, customer/wallet/payment/entry actions and all content mutation flows.
- Discount code create/edit/delete, review create/edit/toggle/delete, FAQ archive/delete and guide publish/upload flows.
- Content library upload/delete against `competition-images`, with storage policy errors surfaced.
- Email send/test route rejects invalid/missing payloads safely and requires admin JWT or internal secret.
- SEO IndexNow route rejects invalid/private URLs safely and requires admin JWT.
- Browser console check for hydration errors, invisible overlays, global click blocking and double submits.

Implemented in Next:
- Vite-compatible admin guard through `useAuth`/`user_roles` admin role. Logged-out users are redirected to `/login`; non-admin users see the same admin-only block.
- Admin layout/nav/sidebar, active states and public/sign-out controls.
- Admin `robots: noindex,nofollow` metadata.
- Public `sitemap.xml` route and `robots.txt` route with private/admin/auth disallows and a Sitemap line.
- Dashboard stat cards for live competitions, entries, revenue, postal entries, awaiting draws and unpublished winners.
- Required route map for `/admin`, competitions, hero banners, customers, entries, orders, payments, draws, winners, reviews, discount codes, wallet settings, postal entries, emails, FAQs, guides, content library and SEO centre.
- Competition list plus real create/edit/status, reserved-entry audit, main/gallery upload, original/card/detail/thumb image variant regeneration, duplicate/reconcile/archive/unarchive/delete actions, discount tiers and competition marquee content editing.
- Hero banners create/edit/delete/activate/scheduling/upload/preview.
- Draw execution through `perform_competition_draw`.
- Winners publish/proof/claim status and delivery fields.
- Postal entries create/process/reject/reset through `allocate_postal_entry`.
- Payment cancel/refund Edge Function calls and wallet settings save.
- Customer detail plus wallet grant/adjust through existing Edge Functions.
- Entry void/refund/archive/delete through existing Edge Functions.
- Discount code create/edit/delete/activate through `admin-discount-codes`.
- Review create/edit/delete/toggle, FAQ create/edit/archive/delete, guide create/edit/publish/archive/delete/duplicate/upload and content library storage list/upload/delete.
- SEO URL selection/copy helpers with admin-only IndexNow submission.
- Read-only email template list with server-only send route available for DB-backed templates.

Still incomplete:
- Customer verification review workflow.
- Full email editor/preview UI and hardcoded Vite fallback template rendering.
- IndexNow key file availability on the deployed public origin.
- Real staging verification for discount, review, FAQ, guide, content, wallet, entry, payment, postal, draw and winner actions.
- Staging verification for competition duplicate/reconcile/archive/unarchive/delete RPC actions, discount tier editing and dynamic content editing against existing RLS/function policies.

Do not launch admin until all mutations are ported and tested against RLS and existing Edge Functions.

Manual admin tests required:
- Logged out `/admin` redirects to `/login` in a browser.
- Non-admin user is blocked from `/admin`.
- Admin user can load `/admin`.
- Admin nav works on desktop/mobile.
- Competitions list loads.
- Create competition form loads and saves through existing `competitions` RLS for an admin user.
- Edit competition form loads and updates through existing `competitions` RLS for an admin user.
- Image upload/regenerate either writes to `competition-images` through existing storage policy or reports the exact Supabase/RLS/CORS error.
- Hero banner create/edit/delete/activate works or reports exact RLS/storage error.
- Hero desktop/mobile image upload writes to `competition-images` or reports exact storage policy error.
- Public homepage uses the intended active banner after activation.
- Draw eligible competitions list valid-entry counts match `entries`.
- Draw execution works through `perform_competition_draw` or reports exact RPC/RLS error.
- Winner publishing/proof/claim status actions work or report exact table/storage error.
- Postal create/process/reject/reset works through `allocate_postal_entry` or reports exact RPC/RLS error.
- Payment cancel/refund works through existing Edge Functions or reports exact function/provider error.
- Wallet settings save through RLS.
- Customer detail loads; wallet grant/adjust works through existing functions or reports exact function/RLS error.
- Entry void/refund/archive/delete works through existing functions or reports exact function/RLS error.
- Customers/entries/orders/payments load.
- Draws/winners routes load.
- Discount code create/edit/delete/toggle works through `admin-discount-codes` or reports exact function/RLS error.
- Review create/edit/delete/toggle works through `reviews` RLS.
- FAQ create/edit/archive/unarchive/delete works through `faq_items` RLS.
- Guide create/edit/publish/archive/delete/duplicate and featured-image upload work through `guides` RLS and `competition-images` storage.
- Content library list/upload/delete/copy URL works through `competition-images` storage or reports exact storage policy error.
- SEO centre URL copy works; IndexNow submission works through `/api/indexnow-submit` or reports exact auth/config/provider error.
- Email templates load; `/api/send-email` rejects invalid payloads safely and sends DB-backed templates only when Resend/Supabase server env vars are configured.
- No console errors, hydration errors, or global click issues.

### Admin Route/Function Matrix

| Route | Status | Actions implemented | Blocker | Launch blocker |
| --- | --- | --- | --- | --- |
| `/admin` | Partial | Guarded dashboard stats | Activity widgets/actions still read-only | Yes |
| `/admin/competitions` | Partial | Real list/search, edit links, duplicate, reconcile counts, archive/unarchive and safe delete through existing RPC/Edge Function paths | Requires admin RPC/function/RLS staging tests | Yes |
| `/admin/competitions/new` | Partial | Create via `competitions`, upload main/gallery images, generate variants; post-save discount tiers and dynamic content editors | Requires admin RLS/storage test | Yes |
| `/admin/competitions/[id]` | Partial | Edit via `competitions`, status update, reserved-entry audit log, upload/regenerate variants, discount tiers, dynamic content editor and lifecycle RPC actions | Requires admin RPC/function/RLS/storage staging tests | Yes |
| `/admin/hero-banners` | Partial | List/create/edit/delete/activate/scheduling/copy/CTA/trust chips/desktop+mobile upload/preview | Requires RLS/storage/homepage active-banner browser tests | Yes |
| `/admin/customers` | Partial | List, detail, linked records, wallet grant and adjust via existing Edge Functions | Verification review workflow still not ported; requires function/RLS tests | Yes |
| `/admin/entries` | Partial | List, void, void with wallet/manual refund, archive/unarchive and delete via existing Edge Functions | Requires function/RLS tests; paid delete remains server-guarded | Yes |
| `/admin/orders` | Partial | Payment/order list, cancel pending, refund succeeded via existing Edge Functions | Requires staging provider/function testing | Yes |
| `/admin/payments` | Partial | Payment/order list, cancel pending, refund succeeded via existing Edge Functions | Requires staging provider/function testing | Yes |
| `/admin/draws` | Partial | Eligible draw review, valid-entry counts, `perform_competition_draw`, proof JSON download | Requires safe staging draw test | Yes |
| `/admin/winners` | Partial | Winner list, publish/unpublish, display edits, proof upload/open/download, claim/delivery edits | Requires RLS/storage/public winners test | Yes |
| `/admin/reviews` | Partial | List/create/edit/delete/toggle via `reviews` | Requires RLS/homepage review compatibility test | Yes |
| `/admin/discount-codes` | Partial | List/create/edit/delete/activate via `admin-discount-codes` | Requires Edge Function/RLS/checkout compatibility test | Yes |
| `/admin/wallet-settings` | Partial | Settings edit/save; customer grant/adjust available on customers page | Requires wallet/RLS/function staging test | Yes |
| `/admin/postal-entries` | Partial | Create, process through `allocate_postal_entry`, reject, reset broken processed rows | Requires RPC/RLS/email side-effect test | Yes |
| `/admin/emails` | Partial | Template list; `/api/send-email` compatibility route for DB-backed sends | Full Vite editor/preview UI and hardcoded fallback templates not ported | Yes |
| `/admin/faqs` | Partial | List/create/edit/archive/unarchive/delete via `faq_items` | Requires RLS/public FAQ compatibility test | Yes |
| `/admin/guides` | Partial | List/create/edit/publish/unpublish/archive/delete/duplicate/featured upload via `guides` | Requires RLS/storage/public guide compatibility test | Yes |
| `/admin/content-library` | Partial | Storage list/upload/delete/copy URL in `competition-images` | Requires storage policy test; no service-role bypass | Yes |
| `/admin/seo-centre` | Partial | Static/competition URL selection, copy helpers and admin-only IndexNow submit | Requires admin/provider/key-file staging test | Yes |

## Data Mutation Status

- No Supabase schema changes.
- No RLS changes.
- No Edge Function changes.
- No Stripe logic changes.
- No ticket allocation changes.
- No service role keys added.
- Service role key is only referenced in server-only API route helpers and is not exposed to the browser.

Latest verification:
- `npm run build` passed on 2026-05-23. Existing Google Fonts fetch warning remains, plus existing `<img>` lint warnings and new admin preview/list `<img>` warnings.
- `npm run lint` passed on 2026-05-23 with the same `<img>`/font warnings.
- Original Vite app worktree checked clean after this pass.

## Required Env Vars

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_REPLY_TO`
- `EMAIL_WEBHOOK_SECRET`
- `INDEXNOW_KEY`

Server-side Netlify functions still require their existing Vite/Netlify env vars for Klaviyo, Stripe, Resend and any private Supabase operations. Server-only values must remain in Netlify/server environments and must not be exposed with `NEXT_PUBLIC_`.

## Manual Testing Checklist

Public:
- `/robots.txt` includes private route disallows and the staging/production sitemap URL.
- `/sitemap.xml` includes public static pages, public competitions and published guides, and excludes account/admin/checkout/auth routes.
- Homepage at 390px and 1440px.
- Direct refresh homepage without hydration errors.
- Competitions tabs.
- Direct refresh `/competitions` without hydration errors.
- Competition detail add-to-basket.
- Direct refresh `/competitions/[slug]` without hydration errors.
- Winners.
- FAQs.
- Guides.
- Contact.
- Free entry.
- Legal pages.

Basket/checkout:
- Add to basket from detail.
- Update quantity.
- Remove item.
- Apply discount.
- Stale/closed competition blocked.
- Coming soon blocked.
- Checkout session created.
- Redirect to Stripe works.
- Checkout success displays tickets.
- Checkout success shows pending allocation and timeout states correctly.
- Checkout success fires Klaviyo confirmed subscribe once per payment.

Auth:
- Register.
- Login.
- Header switches from Log in to Account after login without full refresh.
- Header wallet pill appears for signed-in users at the same breakpoint as Vite, reads `wallets.balance` through RLS and links to `/account/wallet`.
- Admin user sees the Admin header button only after role check completes.
- Non-admin user never sees the Admin header button.
- Mobile menu shows the same logged-out/logged-in/admin states.
- Logout.
- Header returns to Log in/Create account state after logout without full refresh.
- Forgot/reset password.
- Protected route redirects.
- Profile update.

Account:
- Overview.
- Entries.
- Orders.
- Wallet.
- Profile.
- Security.
- Wins.
- Responsible play.

Admin:
- Login as admin.
- Admin guard blocks non-admin.
- Create competition.
- Edit competition.
- Upload/regenerate images.
- Hero banner edit.
- Review admin.
- Discount code admin.
- Draw flow.
- Winner publishing.
- Email admin.
- Wallet settings/refund.

## Deployment Notes

- Build command: `npm run build`.
- Runtime: Next.js App Router on Netlify/OpenNext.
- Keep public Supabase env vars only in the browser.
- Keep private keys in Netlify functions or server-only environment.

## Rollback Plan

- Keep the Vite app untouched and deployable.
- Do not switch production DNS until checkout success, account and admin parity pass manual tests.
- If launch issues appear, route traffic back to the Vite deployment and preserve the shared Supabase project.

## Known Risks

- Checkout success has not been manually tested against a real Stripe redirect in this environment.
- Account routes and most admin routes are ported, but admin operational mutations still need staging tests with a real admin account and existing RLS/storage/function policies.
- Email admin editor/preview flows are not fully ported; `/api/send-email` exists for DB-backed sends and still needs staging provider tests.
- Competition duplicate/reconcile/archive/unarchive/delete actions, discount tier editing and dynamic content editing are wired but still need staging RPC/function/RLS tests.
- Customer verification review remains incomplete.
- SEO IndexNow submission route exists but still needs deployed key-file/provider testing.
- Browser screenshot parity has not been run in this environment.
- `<img>` warnings remain intentionally where Vite-like remote image behavior is preserved.
- Google font optimization warning appears during offline builds.
