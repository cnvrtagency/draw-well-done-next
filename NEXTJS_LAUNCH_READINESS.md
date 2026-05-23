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

Not launch-ready. This pass ports the guarded admin shell, noindex/nofollow metadata, dashboard counts and safe read-only route views. Mutation-heavy operational flows remain in Vite until they can be ported and tested against the existing RLS/RPC/Edge Function contracts.

Implemented in Next:
- Vite-compatible admin guard through `useAuth`/`user_roles` admin role. Logged-out users are redirected to `/login`; non-admin users see the same admin-only block.
- Admin layout/nav/sidebar, active states and public/sign-out controls.
- Admin `robots: noindex,nofollow` metadata.
- Dashboard stat cards for live competitions, entries, revenue, postal entries, awaiting draws and unpublished winners.
- Required route map for `/admin`, competitions, hero banners, customers, entries, orders, payments, draws, winners, reviews, discount codes, wallet settings, postal entries, emails, FAQs, guides, content library and SEO centre.
- Read-only list views for competitions, hero banners, customers/users, entries, payments/orders, draws, winners, reviews, wallet settings, postal entries, email templates, FAQs, guides and SEO source review.

Still incomplete:
- Competition create/edit form, status controls, duplicate/archive/delete, discount tiers, image upload and generated variant regeneration.
- Hero banner create/edit/toggle/scheduling/upload/preview.
- Customer detail drawer and wallet grant/adjust flows.
- Entry void/refund/archive/delete flows.
- Payment cancel/refund flows.
- Draw execution and winner publishing/proof upload/status editing.
- Review/FAQ/guide/email/content/SEO create/edit/delete flows.
- Discount code admin function UI.
- Content library storage list/upload/delete.

Do not launch admin until all mutations are ported and tested against RLS and existing Edge Functions.

Manual admin tests required:
- Logged out `/admin` redirects to `/login` in a browser.
- Non-admin user is blocked from `/admin`.
- Admin user can load `/admin`.
- Admin nav works on desktop/mobile.
- Competitions list loads.
- Create competition route loads and clearly reports incomplete form status.
- Edit competition route loads and clearly reports incomplete form status.
- Image upload/regenerate route state clearly reports incomplete status; no fake upload URL is produced.
- Hero banners admin loads.
- Customers/entries/orders/payments load.
- Draws/winners routes load.
- Reviews/discount codes/wallet/postal entries load.
- FAQs/guides/content/SEO routes load.
- No console errors, hydration errors, or global click issues.

## Data Mutation Status

- No Supabase schema changes.
- No RLS changes.
- No Edge Function changes.
- No Stripe logic changes.
- No ticket allocation changes.
- No service role keys added.

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
- Account/admin are not ported.
- Browser screenshot parity has not been run in this environment.
- `<img>` warnings remain intentionally where Vite-like remote image behavior is preserved.
- Google font optimization warning appears during offline builds.
