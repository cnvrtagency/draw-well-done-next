# TopDraw Next.js Manual QA Script

Prepared: 2026-05-24  
Target app: TopDraw Next.js staging  
Source of truth: original Vite app  
Required viewports: desktop `1440px`, laptop `1280px`, mobile `390px`, mobile `430px`

## QA Rules

- Do not run real live payments unless using staging/test Stripe credentials.
- Do not execute draw, refund, wallet, postal, winner or destructive admin actions on production data.
- Use staging-safe competitions, users and test payment methods only.
- Legal/static placeholders are known production blockers and are intentionally deferred in this pass.
- For every page, open DevTools Console and confirm there are no red runtime errors or hydration errors.
- For every viewport, run:

```js
document.documentElement.scrollWidth > window.innerWidth
```

Expected result: `false`.

## Test Users Needed

| Role | Required | Notes |
| --- | --- | --- |
| Logged-out visitor | Yes | Use private/incognito or sign out. |
| Customer | Yes | Must have verified login and preferably some historical entries/orders/wallet data. |
| Admin | Yes | Must have `user_roles.role = admin`. |
| Staging-safe draw/admin data | Yes | Use a test competition that can be safely edited/drawn/refunded. |

## Public Tests

| ID | URL | State | Risk | Actions | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PUB-01 | `/` | Logged out | Medium | Load at 1440, 1280, 390, 430. Scroll top to bottom. | Hero, reviews, PrizeDrops and Bundle section render; no right-edge glow; no horizontal scroll; no console/hydration errors. |  |  |
| PUB-02 | `/` | Logged out | Low | Click header logo, Competitions, Bundle Builder, Winners, Help Centre. | Links navigate correctly and active nav state updates. |  |  |
| PUB-03 | `/` | Logged out | Medium | Click hero primary CTA. | Navigates to the intended competition/detail/list route and click is not blocked by overlays. |  |  |
| PUB-04 | `/` | Logged out | Low | Inspect hero image crop and headline line breaks on all viewports. | Image remains framed, text does not overlap, CTA remains visible. |  |  |
| PUB-05 | `/competitions` | Logged out | Medium | Load default tab, then click Live, Ending Soon, Coming Soon, Ended. | Correct tab selected, data or empty state appears, card grid remains stable. |  |  |
| PUB-06 | `/competitions?tab=ended` | Logged out | Low | Load direct URL. | Ended/drawn competitions or correct empty state appears. |  |  |
| PUB-07 | `/competitions` | Logged out | Medium | Click a competition card image/title/CTA. | Navigates to `/competitions/[slug]`. |  |  |
| PUB-08 | `/competitions/[slug]` | Logged out | High | Open a live competition. Test gallery thumbnails, accordions, quantity controls and Add to Basket. | Gallery works, quantity cannot exceed cap, Add to Basket opens MiniCart. |  | Slug: |
| PUB-09 | `/competitions/[slug]` | Logged out | Medium | Open coming soon, closed, sold out and drawn/published examples if data exists. | CTA/status states match Vite behavior and block invalid entries. |  | Slugs: |
| PUB-10 | `/competitions/[slug]` | Logged out | Medium | Inspect free entry notice, dynamic marquee, ticket cap, discount tiers and countdown. | All sections render without overlap or hydration errors. |  |  |
| PUB-11 | `/build-a-bundle` | Logged out | High | Load at all viewports. | Real builder appears, not placeholder; no horizontal scroll; no console errors. |  |  |
| PUB-12 | `/build-a-bundle` | Logged out | High | Select one competition, increase/decrease quantity, expand details. | Row total, details and summary update correctly. |  |  |
| PUB-13 | `/build-a-bundle` | Logged out | High | Select multiple competitions and trigger discount tiers where available. | Per-row discount and summary total match displayed tier rules. |  |  |
| PUB-14 | `/build-a-bundle` | Logged out | High | Try quantity above remaining/per-user cap. | Quantity clamps safely; invalid quantity is not added. |  |  |
| PUB-15 | `/build-a-bundle` | Logged out | High | Click Add bundle. | MiniCart opens and contains correct competition IDs/quantities. |  |  |
| PUB-16 | `/winners` | Logged out | Low | Load page with published winners. | Winner cards show image, winner chip, ticket badge, proof link where present, grid stacks on mobile. |  |  |
| PUB-17 | `/winners` | Logged out | Low | Test empty state if no winners in staging. | Empty state is clean and matches expected copy. |  |  |
| PUB-18 | `/faqs` | Logged out | Low | Search, change categories, open accordion items. | Search filters correctly; accordions open/close; no overlap on mobile. |  |  |
| PUB-19 | `/guides` | Logged out | Low | Open guide list and a published guide. | Cards render; guide detail body readable; breadcrumb links work. |  | Guide slug: |
| PUB-20 | `/free-entry` | Logged out | High | Load and scan content. | Page renders full Vite content. Known legal address placeholders remain and are production blockers. |  |  |
| PUB-21 | `/contact` | Logged out | High | Load and scan contact content. | Page renders full Vite content. Known postal placeholders remain and are production blockers. |  |  |
| PUB-22 | `/terms-and-conditions` | Logged out | High | Load full page and scroll. | Full legal text renders. Known address/date placeholders remain and are production blockers. |  |  |
| PUB-23 | `/privacy-policy` | Logged out | High | Load full page and scroll. | Full policy renders. Known address/date placeholders remain and are production blockers. |  |  |
| PUB-24 | `/cookie-policy` | Logged out | Medium | Load full page and scroll. | Full policy renders. Known date placeholder remains. |  |  |
| PUB-25 | `/responsible-play` | Logged out | Medium | Load full page and scroll. | Full responsible-play content renders. Known date placeholder remains. |  |  |
| PUB-26 | `/past-competitions` | Logged out | Low | Open direct URL. | Redirects to `/competitions?tab=ended`. |  |  |
| PUB-27 | `/how-it-works` | Logged out | Low | Open direct URL. | Redirects to `/faqs`. |  |  |
| PUB-28 | `/terms` | Logged out | Low | Open direct URL. | Redirects to `/terms-and-conditions`. |  |  |

## Header, Footer And Global UI Tests

| ID | URL | State | Risk | Actions | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GLB-01 | `/` | Logged out | Medium | Inspect desktop header. | Shows Login, basket trigger, public nav; no Account/Admin/wallet. |  |  |
| GLB-02 | `/` | Customer | Medium | Log in and return to homepage. | Login button disappears; Account and wallet pill appear; Admin hidden. |  |  |
| GLB-03 | `/` | Admin | Medium | Log in as admin. | Account, wallet pill and Admin button appear after role load. |  |  |
| GLB-04 | `/` | Logged out/customer/admin | Medium | Open mobile menu at 390 and 430. | Correct auth-specific buttons appear; close button and backdrop work. |  |  |
| GLB-05 | Any public page | Logged out | Medium | Click MiniCart trigger, then close via X and backdrop. | Drawer opens/closes cleanly; no invisible overlay blocks page clicks after close. |  |  |
| GLB-06 | Any public page | Logged out | Medium | With MiniCart closed, click page links/buttons near right side. | Clicks work; no offscreen drawer intercepts; no right-edge glow bleed. |  |  |
| GLB-07 | `/` | Logged out | Low | Footer: click Play, Help and Legal links. | All links navigate to existing routes; legal placeholder blockers remain documented. |  |  |
| GLB-08 | Any page | Any | Medium | Run scroll-width console check at all viewports. | `false`. |  |  |
| GLB-09 | Any page | Any | Medium | Watch console during navigation. | No hydration errors, no localStorage loop, no uncaught runtime errors. |  |  |

## Basket And Checkout Tests

| ID | URL | State | Risk | Actions | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CHK-01 | `/competitions/[slug]` | Logged out | High | Add 1 ticket from competition detail. | MiniCart opens; item appears with correct title, quantity, price. |  | Slug: |
| CHK-02 | `/competitions/[slug]` | Logged out | High | Increase/decrease quantity in MiniCart. | Quantity and totals update; caps enforced. |  |  |
| CHK-03 | MiniCart | Logged out | Medium | Remove item. | Item removed; empty MiniCart state appears; drawer still closes cleanly. |  |  |
| CHK-04 | `/build-a-bundle` | Logged out | High | Add multiple bundle rows. | Basket contains all selected competitions with correct quantities. |  |  |
| CHK-05 | `/basket` | Empty basket | Low | Open direct URL with empty basket. | Redirects to `/competitions`. |  |  |
| CHK-06 | `/basket` | Basket has items | Low | Open direct URL with basket items. | Redirects to `/checkout`. |  |  |
| CHK-07 | `/checkout` | Logged out with basket | High | Open checkout. | Login/create account prompt appears; no checkout session is created. |  |  |
| CHK-08 | `/checkout` | Customer with basket | High | Open checkout. | Line items, subtotal, discount, wallet and order summary render. |  |  |
| CHK-09 | `/checkout` | Customer | High | Apply invalid discount code. | Clear error; no fake discount applied. |  | Code: |
| CHK-10 | `/checkout` | Customer | High | Apply valid staging discount code. | Discount amount appears and total updates correctly. |  | Code: |
| CHK-11 | `/checkout` | Customer with wallet | High | Toggle wallet credit and edit amount. | Wallet cap is enforced; total updates; invalid amount cannot exceed available/cap. |  |  |
| CHK-12 | `/checkout` | Customer | High | Add stale/closed/coming-soon competition to basket via setup, then load checkout. | Checkout blocks invalid line and does not proceed. |  | Setup details: |
| CHK-13 | `/checkout` | Customer | High | Submit paid order with Stripe test card. | Redirects to Stripe/test checkout; no duplicate submit. |  | Payment ref: |
| CHK-14 | `/checkout` | Customer | High | Submit free order if staging data allows. | No Stripe redirect; success path begins safely. |  |  |
| CHK-15 | `/checkout/success?payment_id=...` | Customer | High | Return from test payment. | Polling status resolves; entries/ticket numbers display or clear pending state appears. |  | Payment id: |
| CHK-16 | `/checkout/success?payment_id=...` | Customer | High | Wait for allocation or refresh. | Basket clears after confirmed allocation; no Klaviyo duplicate subscribe. |  |  |

## Auth And Account Tests

| ID | URL | State | Risk | Actions | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-01 | `/login` | Logged out | Medium | Log in with customer. | Redirects to `/account`; header updates without full refresh. |  |  |
| ACC-02 | `/register` | Logged out | Medium | Submit empty form. | Required validation blocks submission. |  |  |
| ACC-03 | `/register` | Logged out | High | Register staging test user. | Supabase auth/profile created; redirects as Vite expects. |  | Email: |
| ACC-04 | `/forgot-password` | Logged out | Medium | Request reset for staging email. | Safe success/error state; no secret leaked. |  |  |
| ACC-05 | `/reset-password` | Reset session | Medium | Set new password. | Password updates and redirects to account. |  |  |
| ACC-06 | `/account` | Logged out | Medium | Open direct URL. | Redirects to `/login`; no account data flashes. |  |  |
| ACC-07 | `/account` | Customer | Medium | Load overview. | Stats, profile panel, latest entry/next draw render. |  |  |
| ACC-08 | `/account/entries` | Customer | Medium | Load and inspect entries. | Entries group by competition; links and statuses work. |  |  |
| ACC-09 | `/account/orders` | Customer | Medium | Load orders. | Orders and multiline details render; links work. |  |  |
| ACC-10 | `/account/transactions` | Customer | Medium | Load transactions. | Wallet transactions and payments render in date order. |  |  |
| ACC-11 | `/account/wallet` | Customer | Medium | Load wallet page. | Balance matches header wallet pill; recent transactions appear. |  |  |
| ACC-12 | `/account/profile` | Customer | High | Update allowed profile fields. | Save succeeds or clear RLS error; header/account unaffected. |  |  |
| ACC-13 | `/account/security` | Customer | High | Update password with valid inputs. | Password updates; success state appears. |  |  |
| ACC-14 | `/account/security` | Customer | Medium | Click logout. | Session ends; header returns to logged-out; protected routes redirect. |  |  |
| ACC-15 | `/account/wins` | Customer with win | High | Open claim dialog. | Dialog opens, fields match Vite, close button removes overlay. |  | Winner id: |
| ACC-16 | `/account/wins` | Customer with win | High | Submit prize claim with required data. | Existing `submit_prize_claim` RPC succeeds or returns exact backend/RLS error. |  |  |
| ACC-17 | `/account/profile` | Customer | High | Select verification documents and submit. | Upload uses `account-verification`; succeeds or shows exact RLS/storage limitation. |  |  |
| ACC-18 | `/account/responsible-play` | Customer | High | Start self-exclusion on staging-safe user. | `create_self_exclusion` RPC succeeds; account reflects active exclusion. |  |  |
| ACC-19 | Account pages | Customer | Medium | Use mobile account nav at 390/430. | Nav is reachable, active states correct, no layout overlap. |  |  |

## Admin Tests

| ID | URL | State | Risk | Actions | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ADM-01 | `/admin` | Logged out | High | Open direct URL. | Redirects to `/login`; admin data does not flash. |  |  |
| ADM-02 | `/admin` | Customer non-admin | High | Open direct URL. | Access denied/admin-only state; no admin data shown. |  |  |
| ADM-03 | `/admin` | Admin | High | Load dashboard. | Dashboard stats load or clear RLS error; nav visible. |  |  |
| ADM-04 | `/admin/competitions` | Admin | High | Load list; search/filter if available. | Competitions render; action buttons visible only where appropriate. |  |  |
| ADM-05 | `/admin/competitions/new` | Admin | High | Create staging draft competition. | Draft saves with existing schema fields only; no fake success. |  | Comp id: |
| ADM-06 | `/admin/competitions/[id]` | Admin | High | Edit title/status/date/pricing/cap on staging comp. | Save succeeds or clear RLS error; public page still renders. |  | Comp id: |
| ADM-07 | `/admin/competitions/[id]` | Admin | High | Upload image and regenerate variants. | Uses `competition-images`; URLs/variants update or clear storage/RLS error. |  |  |
| ADM-08 | `/admin/competitions` | Admin | High | Duplicate staging competition. | RPC creates draft/copy according to Vite behavior; no live accidental publish. |  |  |
| ADM-09 | `/admin/competitions` | Admin | High | Reconcile counts on staging comp. | Existing function/RPC returns success or exact blocker; counts not client-faked. |  |  |
| ADM-10 | `/admin/competitions` | Admin | High | Archive/unarchive/delete-if-safe staging comp. | Confirmation required; action matches RPC behavior. |  |  |
| ADM-11 | `/admin/hero-banners` | Admin | High | Create/edit staging banner. | Save succeeds; preview updates; public homepage still reads active banner. |  | Banner id: |
| ADM-12 | `/admin/hero-banners` | Admin | High | Activate banner for a page/location. | Other active banners for same location deactivate if configured. |  |  |
| ADM-13 | `/admin/hero-banners` | Admin | Medium | Upload desktop/mobile images. | Storage upload succeeds or clear storage/RLS error. |  |  |
| ADM-14 | `/admin/draws` | Admin | High | Load eligible competitions. | Staging-safe eligible comp appears with correct status/valid entry count. |  | Comp id: |
| ADM-15 | `/admin/draws` | Admin | High | Execute draw on staging-safe comp only. | Confirmation required; calls `perform_competition_draw`; no client-side fake result. |  |  |
| ADM-16 | `/admin/winners` | Admin | High | Manage staging winner. | Winner displays; publish/unpublish/status updates work or exact RLS error. |  | Winner id: |
| ADM-17 | `/admin/winners` | Admin | High | Upload/open proof file. | Uses `draw-proofs`; signed URL opens or storage policy blocker is clear. |  |  |
| ADM-18 | `/admin/postal-entries` | Admin | High | Create staging postal entry. | Entry saved as received with existing table fields. |  | Postal id: |
| ADM-19 | `/admin/postal-entries` | Admin | High | Process staging postal entry. | Calls `allocate_postal_entry`; linked entry appears or exact RPC blocker. |  |  |
| ADM-20 | `/admin/postal-entries` | Admin | High | Reject staging postal entry. | Reason required; status becomes rejected. |  |  |
| ADM-21 | `/admin/payments` | Admin | High | Load payments list. | Rows render; refund/cancel buttons only where allowed. |  |  |
| ADM-22 | `/admin/payments` | Admin | High | Cancel/refund staging-safe payment only. | Confirmation/input required; calls existing Edge Function; no fake refund state. |  | Payment id: |
| ADM-23 | `/admin/customers` | Admin | High | Open customer detail. | Profile, wallet, entries, payments and wallet activity render. |  | Customer id: |
| ADM-24 | `/admin/customers` | Admin | High | Grant/adjust wallet on staging-safe customer. | Existing Edge Function succeeds or clear blocker; ledger updates. |  |  |
| ADM-25 | `/admin/entries` | Admin | High | Void/archive/delete staging-safe entry. | Confirmation/reason required; existing Edge Function used. |  | Entry id: |
| ADM-26 | `/admin/discount-codes` | Admin | High | Create/edit/toggle/delete staging code. | Existing admin-discount-codes function succeeds or clear blocker. |  | Code: |
| ADM-27 | `/admin/reviews` | Admin | Medium | Create/edit/toggle/delete review. | Public homepage reviews remain compatible. |  |  |
| ADM-28 | `/admin/faqs` | Admin | Medium | Create/edit/archive/delete FAQ. | Public FAQ page reflects published entries. |  |  |
| ADM-29 | `/admin/guides` | Admin | Medium | Create/edit/publish/archive/duplicate guide. | Public guide route works for published guide; editor saves. |  | Guide id: |
| ADM-30 | `/admin/content-library` | Admin | Medium | List/upload/delete/copy URL. | Uses `competition-images`; clear storage policy errors if blocked. |  |  |
| ADM-31 | `/admin/seo-centre` | Admin | Medium | Review URLs and submit IndexNow with invalid/private URL. | Invalid/private URLs are rejected safely. |  |  |
| ADM-32 | `/admin/seo-centre` | Admin | Medium | Submit allowed public URL if key configured. | Calls `/api/indexnow-submit`; success or clear key/env blocker. |  |  |
| ADM-33 | `/admin/emails` | Admin | Medium | Load email template list. | Rows render. Note: richer Vite editor/preview remains incomplete. |  |  |
| ADM-34 | `/api/send-email` | Admin/server test | High | Send invalid payload. | Route rejects safely; no fake send. |  |  |
| ADM-35 | `/admin/verifications` | Admin | Medium | Open direct URL. | Known gap: no dedicated Vite verification review parity. Record current behavior. |  |  |
| ADM-36 | `/admin/settings` | Admin | Low | Open direct URL. | Known incomplete/blocked state; no fake functional settings. |  |  |
| ADM-37 | `/admin/notifications` | Admin | Low | Open direct URL. | Known incomplete/blocked state; no fake sends. |  |  |
| ADM-38 | `/admin/dynamic-content` | Admin | Low | Open direct URL. | Known incomplete/redirected scope; competition marquee is managed in competition edit. |  |  |
| ADM-39 | `/admin/page-content` | Admin | Low | Open direct URL. | Known incomplete/blocked state. |  |  |
| ADM-40 | `/admin/profit-calculator` | Admin | Low | Open direct URL. | Advisory tool not ported; no fake calculation. |  |  |

## SEO And Infrastructure Tests

| ID | URL | State | Risk | Actions | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SEO-01 | `/sitemap.xml` | Any | Medium | Open sitemap. | Public routes included; `/build-a-bundle` included; private/admin/account/checkout/auth excluded. |  |  |
| SEO-02 | `/robots.txt` | Any | Medium | Open robots. | Allows public pages, disallows admin/account/checkout/auth, includes Sitemap line. |  |  |
| SEO-03 | Public routes | Any | Medium | Inspect canonical and metadata. | Canonicals use staging/prod `NEXT_PUBLIC_SITE_URL` appropriately. |  |  |
| SEO-04 | `/admin` and `/account` | Any | Medium | Inspect robots/meta/noindex behavior. | Private/admin pages are not indexable. |  |  |
| SEO-05 | `/api/indexnow-submit` | Admin/server test | Medium | Submit private URL. | Rejected safely. |  |  |
| SEO-06 | Netlify env | N/A | High | Verify env vars in staging dashboard. | Supabase, Stripe, Resend, IndexNow and site URL env vars are set correctly. |  |  |

## Known Deferred Production Blockers

- Legal/static placeholders remain intentionally unchanged in this pass:
  - `[Insert date]`
  - `[Insert postal address]`
  - `[insert full postal address]`
  - `[insert postal address]`
  - Footer text: “Promoter details to be confirmed before launch.”
- These must be replaced with approved legal/business copy before production.
- Do not treat these as QA failures during this manual pass unless the goal is production sign-off.

## Final QA Sign-Off

| Area | Pass/Fail | Sign-off notes |
| --- | --- | --- |
| Public visual/interactivity |  |  |
| Header/footer/global |  |  |
| Basket/checkout |  |  |
| Auth/account |  |  |
| Admin read routes |  |  |
| Admin mutations |  |  |
| SEO/infrastructure |  |  |
| Mobile 390px |  |  |
| Mobile 430px |  |  |
| Laptop 1280px |  |  |
| Desktop 1440px |  |  |
