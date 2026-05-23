# Next.js Launch Readiness

## Current Status

The Next.js rebuild is closer to customer-facing launch parity, but it is not ready to replace the Vite app yet.

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

- `/admin` and all admin subroutes are still placeholders.
- `/build-a-bundle` remains placeholder-level.

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
- Competition create/edit/status form with Vite field names, reserved-entry capacity validation, reserved-entry audit log insert, main/gallery image upload and image variant regeneration against the existing `competition-images` bucket.
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
- SEO centre URL selection/copy helpers copied from Vite, with IndexNow submission disabled because the matching Next API route is absent.
- Read-only email template list. Email editor/preview/send flows remain blocked because Vite calls `/api/send-email` and no matching Next route exists.

Exact gaps:
- Competition duplicate/archive/delete/reconcile RPC actions, discount tiers and dynamic content editing are incomplete.
- Hero banner browser tests against the public homepage active-banner query are still required.
- Draw execution, winner publishing/proof and postal processing require real admin/RLS/RPC/storage testing before launch.
- Customer verification-review workflow is still incomplete; wallet grant/adjust and entry void/refund/archive/delete actions are wired but require staging function/RLS tests.
- Payment cancel/refund functions are wired but require staging provider/RLS testing; no refund should be considered verified until the existing Edge Functions return success in staging.
- Email editor/preview/send/test is blocked by missing Next `/api/send-email` compatibility route.
- SEO IndexNow submission is blocked by missing Next `/api/indexnow-submit` compatibility route. Public SEO metadata/routes were not changed.

High-risk actions:
- Draw execution and winner publishing must keep using the Vite RPC/function path and must not introduce client-side winner selection.
- Payment/refund, wallet and ticket allocation flows must only call the existing Edge Functions/RPCs.
- Competition pricing, max entry, free entry and reserved entry changes must match Vite validation and audit logging.
- Storage uploads must respect existing bucket/RLS policies; blocked uploads must surface the Supabase error instead of bypassing policy.
- Email and SEO submits must remain disabled until the matching server routes exist; the UI must not fake successful sends/submissions.

Required manual tests:
- Admin login/guard, non-admin access denial and no data render before role eligibility is known.
- Competition create/edit/status, image upload and regenerate variant attempts against a real admin account.
- Hero banner create/edit/activate and homepage active banner compatibility.
- Draw execution/winner publishing only against a safe staging/test competition.
- Postal entry process/reject, customer/wallet/payment/entry actions and all content mutation flows.
- Discount code create/edit/delete, review create/edit/toggle/delete, FAQ archive/delete and guide publish/upload flows.
- Content library upload/delete against `competition-images`, with storage policy errors surfaced.
- Email send/test remains disabled unless a compatible `/api/send-email` route is added.
- SEO IndexNow submit remains disabled unless a compatible `/api/indexnow-submit` route is added.
- Browser console check for hydration errors, invisible overlays, global click blocking and double submits.

Implemented in Next:
- Vite-compatible admin guard through `useAuth`/`user_roles` admin role. Logged-out users are redirected to `/login`; non-admin users see the same admin-only block.
- Admin layout/nav/sidebar, active states and public/sign-out controls.
- Admin `robots: noindex,nofollow` metadata.
- Dashboard stat cards for live competitions, entries, revenue, postal entries, awaiting draws and unpublished winners.
- Required route map for `/admin`, competitions, hero banners, customers, entries, orders, payments, draws, winners, reviews, discount codes, wallet settings, postal entries, emails, FAQs, guides, content library and SEO centre.
- Competition list plus real create/edit/status, reserved-entry audit, main/gallery upload and original/card/detail/thumb image variant regeneration.
- Hero banners create/edit/delete/activate/scheduling/upload/preview.
- Draw execution through `perform_competition_draw`.
- Winners publish/proof/claim status and delivery fields.
- Postal entries create/process/reject/reset through `allocate_postal_entry`.
- Payment cancel/refund Edge Function calls and wallet settings save.
- Customer detail plus wallet grant/adjust through existing Edge Functions.
- Entry void/refund/archive/delete through existing Edge Functions.
- Discount code create/edit/delete/activate through `admin-discount-codes`.
- Review create/edit/delete/toggle, FAQ create/edit/archive/delete, guide create/edit/publish/archive/delete/duplicate/upload and content library storage list/upload/delete.
- SEO URL selection/copy helpers with IndexNow submission safely blocked.
- Read-only email template list with send/editor blocker documented.

Still incomplete:
- Competition duplicate/archive/delete/reconcile RPC actions, discount tiers and dynamic content editors.
- Customer verification review workflow.
- Email editor/preview/send/test flows.
- SEO IndexNow submission until the missing Next API route is added.
- Real staging verification for discount, review, FAQ, guide, content, wallet, entry, payment, postal, draw and winner actions.

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
- SEO centre URL copy works; IndexNow submission remains disabled until `/api/indexnow-submit` exists.
- Email templates load; send/test remains disabled until `/api/send-email` exists.
- No console errors, hydration errors, or global click issues.

### Admin Route/Function Matrix

| Route | Status | Actions implemented | Blocker | Launch blocker |
| --- | --- | --- | --- | --- |
| `/admin` | Partial | Guarded dashboard stats | Activity widgets/actions still read-only | Yes |
| `/admin/competitions` | Partial | Real list/search plus edit links | Duplicate/reconcile/archive/delete RPC buttons not ported | Yes |
| `/admin/competitions/new` | Partial | Create via `competitions`, upload main/gallery images, generate variants | Discount tiers/dynamic content editors not ported; requires admin RLS/storage test | Yes |
| `/admin/competitions/[id]` | Partial | Edit via `competitions`, status update, reserved-entry audit log, upload/regenerate variants | Duplicate/archive/delete/reconcile RPC actions and discount/content editors not ported | Yes |
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
| `/admin/postal-entries` | Partial | Create, process through `allocate_postal_entry`, reject, reset broken processed rows | Requires RPC/RLS/email side-effect test; Next does not add missing email route | Yes |
| `/admin/emails` | Read-only | Template list only | Vite calls `/api/send-email`; no matching Next API route exists for editor/preview/send/test | Yes |
| `/admin/faqs` | Partial | List/create/edit/archive/unarchive/delete via `faq_items` | Requires RLS/public FAQ compatibility test | Yes |
| `/admin/guides` | Partial | List/create/edit/publish/unpublish/archive/delete/duplicate/featured upload via `guides` | Requires RLS/storage/public guide compatibility test | Yes |
| `/admin/content-library` | Partial | Storage list/upload/delete/copy URL in `competition-images` | Requires storage policy test; no service-role bypass | Yes |
| `/admin/seo-centre` | Partial | Static/competition URL selection and copy helpers | IndexNow submit blocked: Vite calls `/api/indexnow-submit`, no matching Next API route exists | Yes |

## Data Mutation Status

- No Supabase schema changes.
- No RLS changes.
- No Edge Function changes.
- No Stripe logic changes.
- No ticket allocation changes.
- No service role keys added.

Latest verification:
- `npm run build` passed on 2026-05-23. Existing Google Fonts fetch warning remains, plus existing `<img>` lint warnings and new admin preview/list `<img>` warnings.
- `npm run lint` passed on 2026-05-23 with the same `<img>`/font warnings.
- Original Vite app worktree checked clean after this pass.

## Required Env Vars

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

Server-side Netlify functions still require their existing Vite/Netlify env vars for Klaviyo, Stripe, Resend and any private Supabase operations. These are not exposed in the Next client.

## Manual Testing Checklist

Public:
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
- Logout.
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
- Email admin send/editor flows and SEO IndexNow submission are intentionally blocked until matching Next API routes exist.
- Competition duplicate/archive/delete/reconcile actions, discount tier editing, dynamic content editing and customer verification review remain incomplete.
- Browser screenshot parity has not been run in this environment.
- `<img>` warnings remain intentionally where Vite-like remote image behavior is preserved.
- Google font optimization warning appears during offline builds.
