# TopDraw Next.js Final Parity Audit

Audit date: 2026-05-23  
Vite source: `~/Desktop/draw-well-done`  
Next target: `~/Desktop/draw-well-done-next`

## 1. Executive Verdict

The Next.js rebuild is ready for staging deployment and structured manual testing, but it is not ready for production replacement of the Vite app.

The customer-facing happy path is broadly present: homepage, competitions, competition detail, Bundle Builder, MiniCart, checkout, checkout success, auth, account, and most admin routes exist. The largest remaining risks are not missing route shells; they are legal content placeholders inherited from Vite, high-risk mutation tests against Supabase/RLS/Edge Functions/storage, admin parity gaps for some secondary operations, and unverified visual parity across desktop/mobile breakpoints.

### Ready For Staging?

Yes, with explicit caveats:
- Staging should be treated as a verification environment, not a launch candidate sign-off.
- Payment, draw, wallet/refund, postal, document upload, prize claim, and admin mutation flows must be tested with real staging credentials and policies.
- Visual QA must be run at 1440px, 1280px, 390px, and 430px in real browsers.

### Ready For Production?

No.

### Top 10 Blockers

1. Legal/static content still contains Vite-source placeholders: `[Insert date]`, `[Insert postal address]`, `[insert full postal address]`, and footer “Promoter details to be confirmed before launch.”
2. No real-browser pixel/interactivity pass has been completed across required breakpoints; this sandbox has no browser runtime available.
3. Checkout needs real staging tests for Stripe redirect, free-order path, wallet use, discount code validation, stale basket blocking, and checkout-success ticket allocation polling.
4. Account prize claim and verification upload flows need staging tests against existing RPCs, RLS, and storage policies.
5. Admin draw execution, winner publish/proof, postal processing, payment cancel/refund, wallet grant/adjust, and entry actions need staging mutation tests.
6. Vite `/admin/verifications` has a dedicated account verification review workflow; Next does not have a dedicated verification review page and only shows verification status in customer lists/details.
7. Vite `/admin/emails` has richer branding/template/preview/log tooling; Next has a much lighter email template table plus `/api/send-email`.
8. Vite `/admin/settings`, `/admin/profit-calculator`, `/admin/notifications`, `/admin/dynamic-content`, and `/admin/page-content` are not fully ported as operational screens in Next.
9. Guide/public content rendering is simplified in Next compared with Vite’s markdown/body rendering components and needs content QA.
10. Build/lint pass, but existing warnings remain for Google font optimization and multiple raw `<img>` usages.

## 2. Route Matrix

| Route | Vite status | Next status | Parity rating | Noindex/private | Blocker | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | Full public route | Exists | Close | Indexable | No | P2 visual QA |
| `/competitions` | Full public route, client tabs/loading skeleton | Exists | Close | Indexable | No | P2 visual QA |
| `/competitions/[slug]` | Full public route | Exists | Close | Indexable | Yes until checkout/detail tests | P1 |
| `/build-a-bundle` | Full interactive route | Exists | Close | Indexable | Yes until manual basket/checkout test | P1 |
| `/winners` | Full public route | Exists | Close | Indexable | No | P2 visual QA |
| `/past-competitions` | Redirect to `/competitions?tab=ended` | Redirect/alias exists | Exact route behavior | Indexable shell/redirect | No | P3 |
| `/faqs` | DB-backed FAQ route | Exists | Close | Indexable | No | P2 content QA |
| `/guides` | Published guides route | Exists | Partial-close | Indexable | No | P2 |
| `/guides/[slug]` | Guide detail with markdown body | Exists | Partial | Indexable | No | P2 |
| `/free-entry` | Static legal route | Exists | Content parity with Vite source | Indexable | Yes, placeholders | P0 |
| `/contact` | Static route | Exists | Content parity with Vite source | Indexable | Yes, placeholders | P0 |
| `/terms-and-conditions` | Static legal route | Exists | Content parity with Vite source | Indexable | Yes, placeholders | P0 |
| `/terms` | Redirect to terms and conditions | Exists | Exact route behavior | Indexable redirect | No | P3 |
| `/privacy-policy` | Static legal route | Exists | Content parity with Vite source | Indexable | Yes, placeholders | P0 |
| `/cookie-policy` | Static legal route | Exists | Content parity with Vite source | Indexable | Date placeholder | P1 |
| `/responsible-play` | Static route | Exists | Content parity with Vite source | Indexable | Date placeholder | P1 |
| `/how-it-works` | Redirect to `/faqs` | Exists | Exact route behavior | Indexable redirect | No | P3 |
| `/footers-preview` | Vite dev/preview public route | Missing | Missing | N/A | No, likely dev-only | P4 |
| `/help` | Not a Vite route | Exists as simple helper/not-found style route | Extra | Indexable unless metadata says otherwise | No | P3 decide keep/remove |
| `/login` | Auth route | Exists | Close | Private/noindex via robots | No | P2 visual/auth QA |
| `/register` | Auth route | Exists | Close | Private/noindex via robots | No | P2 visual/auth QA |
| `/forgot-password` | Auth route | Exists | Close | Private/noindex via robots | No | P2 |
| `/reset-password` | Auth route | Exists | Close | Private/noindex via robots | No | P2 |
| `/basket` | Redirect based on basket contents | Exists | Close | Public route, not sitemap | No | P2 |
| `/checkout` | Full checkout route | Exists | Close | Disallowed/noindex by robots | Yes until payment tests | P1 |
| `/checkout/success` | Full success/polling route | Exists | Close | Disallowed/noindex by robots | Yes until allocation tests | P1 |
| `/account` | Protected account route | Exists | Close | Private/disallowed | No | P2 staging QA |
| `/account/entries` | Protected account route | Exists | Close | Private/disallowed | No | P2 |
| `/account/orders` | Protected account route | Exists | Close | Private/disallowed | No | P2 |
| `/account/transactions` | Protected account route | Exists | Close | Private/disallowed | No | P2 |
| `/account/wallet` | Protected account route | Exists | Close | Private/disallowed | No | P2 |
| `/account/profile` | Protected account route | Exists | Close | Private/disallowed | No | P2 |
| `/account/security` | Protected account route | Exists | Close | Private/disallowed | No | P2 |
| `/account/wins` | Protected account route | Exists | Close | Private/disallowed | Yes until claim test | P1 |
| `/account/responsible-play` | Protected account route | Exists | Close | Private/disallowed | Yes until RPC test | P1 |
| `/admin` | Protected admin route | Exists | Close | Noindex | Yes until admin guard/staging tests | P1 |

## 3. Visual Parity Findings

### Global Layout And Design System

Findings:
- Fonts and global theme are close: Designer font, Inter/Space Grotesk/JetBrains imports, dark TopDraw tokens, glass panels, glow buttons, cards and badges are present.
- Next still loads Google fonts via `<head>` in `app/layout.tsx`, causing a build warning. Vite does not have that Next-specific warning.
- Far-right blue glow bleed was traced to the globally mounted closed MiniCart drawer retaining a right-edge blue shadow while translated offscreen. That has been fixed before this audit.
- `html/body` now guard against horizontal overflow with `overflow-x: clip`; root wrapper also has `overflow-x-hidden`.
- Many decorative layers correctly use `pointer-events-none`.
- Visual fidelity still needs browser QA; source inspection cannot prove pixel parity at 1440/1280/390/430.

Desktop risks:
- Homepage Vite lazy-loads lower sections via `DeferredHomepageSection`; Next server-renders sections immediately. This is likely acceptable but creates different loading/perceived layout behavior.
- Vite competitions route has client skeletons while loading; Next server-renders data and empty states, so loading parity differs.
- Admin shell label “Phase 2” is visible in normal admin nav. It is not a blocker, but it is not Vite-identical wording and may read like migration language.

Mobile risks:
- Header/menu structure is close, but real 390px/430px click and layout tests are still required.
- Bundle Builder uses row/list layout with sticky summary on desktop only; mobile source is reasonable but unverified visually.
- Competition detail mobile ordering must be verified with live/closed/sold-out/drawn data.

## 4. Header, Footer And Nav Findings

Header:
- Nav labels match core Vite public nav: Competitions, Bundle Builder, Winners, Help Centre.
- Logged-out, logged-in customer, and logged-in admin state logic exists through `useAuth`, `WalletPill`, Account/Admin buttons, and mobile menu equivalents.
- Wallet pill uses the same `wallets.balance` source as Vite.
- MiniCart trigger and drawer are global and fixed; closed-state click and glow issues have been addressed.
- Manual tests still required: login transition without refresh, admin button only after role confirmed, mobile menu states.

Footer:
- Footer columns and legal links exist.
- Footer still says “Promoter details to be confirmed before launch.” This is a production content blocker.
- Vite has `/footers-preview`; Next does not. Treat as dev-only unless the business confirms it is used.

## 5. Homepage Findings

Close:
- Hero carousel, dynamic `hero_banners` support, reviews marquee, PrizeDrops, BundleFAQ, and Bundle CTA exist.
- Homepage Bundle CTA now lands on the real `/build-a-bundle`.

Differences/risks:
- Vite homepage lazily reveals reviews/PrizeDrops/BundleFAQ using intersection observer and suspense. Next renders them directly from the server/client tree.
- Vite queries live competitions client-side; Next fetches featured competitions server-side through `getFeaturedCompetitions`.
- Newsletter popup parity is not present in Next.
- Browser visual QA still required for hero crop, CTA line breaks, ticket badge, countdown, carousel dots/thumbs, section spacing, and mobile stacking.

## 6. Competition Listing And Card Findings

Close:
- Tabs, public query filtering, card grid, status tones, effective remaining filtering, and supporting trust panels exist.

Differences:
- Vite `CategoryTabs` updates search params client-side with skeleton loading. Next uses link-based server route transitions.
- Vite empty live state includes a button to view ended competitions; Next live empty state is simpler text.
- Vite below-grid content is extracted to `CompetitionsBelowGrid`; Next uses a simplified three-panel trust grid.
- Pixel parity for card spacing, image crop, progress bars, free-to-play styling and mobile grid remains unverified.

## 7. Competition Detail Findings

Close:
- Detail route, gallery, quantity selector, discount tiers, pricing calculation, free entry notice, dynamic marquee, drawn/winner panel and basket handoff are implemented.

Risks:
- Needs real state QA for live, coming soon, closed, sold out, drawn/published, and free-to-play competitions.
- Basket handoff must be tested with MiniCart and checkout.
- Dynamic metadata exists, but OG image/canonical parity should be checked against source data on staging.
- Hydration-safe countdown components are used, but browser console must be checked.

## 8. Bundle Builder Findings

Close:
- Real route exists and uses Vite-style live competition filtering.
- Quantity controls, cap enforcement, discount tiers, row totals, expanders, summary, add-to-basket and MiniCart opening exist.
- Bundle route is included in sitemap.

Risks:
- Manual tests still required for single/multi selection, max remaining constraints, tier math, basket item IDs/quantities, MiniCart opening, checkout handoff, and mobile layout.
- Because Next fetches from the browser after hydration, empty/loading state behavior should be reviewed on slow network.

## 9. Winners Page Findings

Close:
- Published-only query exists.
- WinnerCard now matches Vite square image treatment, winner chip, ticket badge, proof link and hover lift.

Risks:
- Empty state and grid need real browser validation.
- Query selects `competition:competitions(main_image_url)` only; Vite winner card image fallback also used `image_url` and competition image fields. Next includes `image_url` but not all competition variants.

## 10. Static, Legal And Content Findings

Content blockers found in normal UI:
- `components/StaticPages.tsx`: `Last updated: [Insert date]`
- `components/StaticPages.tsx`: `[insert full postal address]`
- `components/StaticPages.tsx`: `[Insert postal address]`
- `components/StaticPages.tsx`: `[insert postal address]`
- `components/Footer.tsx`: “Promoter details to be confirmed before launch.”

These placeholders are inherited from the Vite source, but they remain production blockers because public legal/contact pages are indexable and visible.

Non-content placeholders:
- Normal input placeholders such as “Search”, “Amount”, “Reason”, “https://...” are legitimate UI placeholders.
- `components/SafePrizeImage.tsx` references `/placeholder.svg` as an image fallback; not a content blocker.

Other static/content findings:
- `/guides` and `/guides/[slug]` exist but simplified markdown rendering needs content QA.
- `/help` exists in Next but not Vite route map; decide whether to keep noindex/remove/redirect.

## 11. Basket, Checkout And Payment Findings

Close:
- `topdraw_basket_v1` key and item shape match Vite.
- Basket provider supports local storage and authenticated DB merge/persist.
- MiniCart layout, quantity controls, savings display and drawer behavior are close.
- `/basket` redirects to checkout or competitions.
- Checkout reads competitions, discount tiers, wallet balance, wallet settings and profile completeness.
- Checkout calls existing `validate-discount-code` and `create-checkout-session` Edge Functions.
- Checkout success polls `payments`, `payment_lines`, `entries` and competition data.
- Klaviyo checkout-success one-shot behavior exists in the Next success client.

Risks:
- Do not run real payments in audit. Required staging tests: Stripe redirect, free order, stale basket blocking, closed/coming-soon blocking, discount code, wallet amount cap, checkout success allocation, cancellation/failure display, basket clearing.
- Vite checkout empty-basket source contains a link typo to `/build-bundle`; Next should keep the corrected `/build-a-bundle` route rather than copy that bug.

## 12. Auth And Account Findings

Close:
- Login, register, forgot/reset, session handling and protected account redirects exist.
- Account overview, entries, orders, transactions, wallet, profile, security, wins, responsible play, prize claim and verification upload are implemented.
- Header state now reacts to session and role, and wallet balance appears.

Risks:
- Register visual and validation parity needs browser QA.
- Profile update, password update, logout, self-exclusion RPC, prize claim RPC, account verification storage upload and document insert all require staging tests.
- Account verification upload must be tested with existing storage/RLS policies; no service role is used in browser.

## 13. Admin Route Matrix

| Admin route | Vite status | Next status | Read | Create/Edit | Actions | Blocker | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/admin` | Dashboard | Exists | Yes | N/A | N/A | Staging test | Stats are close; manual RLS/admin check required. |
| `/admin/competitions` | Full operations | Exists | Yes | Yes | Duplicate/reconcile/archive/delete | Staging test | High-risk RPC/function actions need testing. |
| `/admin/competitions/new` | Full form | Exists | Yes | Yes | Image/tier/content after save | Staging test | Form layout not pixel-verified. |
| `/admin/competitions/[id]` | Full edit | Exists | Yes | Yes | Status/image/tier/content | Staging test | Needs image variant regeneration test. |
| `/admin/hero-banners` | Full CRUD | Exists | Yes | Yes | Activate/delete/upload | Staging test | Active-banner deactivation logic exists. |
| `/admin/customers` | Full customer tooling | Exists | Yes | Detail modal | Wallet grant/adjust | Staging test | Verification review less complete than Vite. |
| `/admin/users` | Vite alias/screen | Alias to Customers | Yes | Partial | Wallet actions | No | Alias exists, not separate Vite UI. |
| `/admin/verifications` | Dedicated review workflow | Missing/different | No dedicated screen | No | No review action page | Yes | Major admin parity gap. |
| `/admin/entries` | Full entry admin | Exists | Yes | N/A | Void/refund/archive/delete | Staging test | Edge Functions need testing. |
| `/admin/orders` | Payments/order list | Exists via PaymentsPage title | Yes | N/A | Cancel/refund where applicable | Staging test | Not a distinct Vite route, but required by Next parity request. |
| `/admin/payments` | Payment admin | Exists | Yes | N/A | Cancel/refund | Staging test | Stripe/wallet safety critical. |
| `/admin/payments-dev` | Vite dev route | Missing | No | No | No | No production blocker | Dev-only unless staging needs it. |
| `/admin/draws` | Draw execution | Exists | Yes | N/A | `perform_competition_draw` | Staging test | Do not test casually on production data. |
| `/admin/winners` | Winner management | Exists | Yes | Partial | Publish/proof/claim/delivery | Staging test | Proof storage bucket policy test needed. |
| `/admin/postal-entries` | Postal workflow | Exists | Yes | Create received | Process/reject/reset | Staging test | `allocate_postal_entry` RPC test required. |
| `/admin/reviews` | Review CRUD | Exists | Yes | Yes | Delete/toggle | Staging test | Homepage compatibility test needed. |
| `/admin/discount-codes` | Discount code admin | Exists | Yes | Yes | Activate/delete via function | Staging test | Pricing logic unchanged; function test needed. |
| `/admin/wallet-settings` | Wallet config | Exists | Yes | Edit | Save settings | Staging test | RLS/admin policy test needed. |
| `/admin/faqs` | FAQ CRUD | Exists | Yes | Yes | Archive/delete | Staging test | Public FAQ compatibility test needed. |
| `/admin/guides` | Guide list | Exists | Yes | Yes | Duplicate/delete | Staging test | Editor simplified. |
| `/admin/guides/new` | Guide form | Exists | Yes | Yes | Publish/draft | Staging test | Rich editor parity gap. |
| `/admin/guides/[id]` | Guide edit | Exists | Yes | Yes | Publish/archive | Staging test | Rich editor parity gap. |
| `/admin/content-library` | Content library | Exists | Yes | Upload/delete | Copy URL | Staging test | Storage policy test required. |
| `/admin/content` | Vite route | Alias to content library | Yes | Same | Same | No | Alias supported but not in nav. |
| `/admin/seo-centre` | SEO centre | Exists | Yes | URL review/copy | IndexNow submit | Staging test | Advanced SEO controls are lighter than Vite. |
| `/admin/seo` | Vite route | Alias to SEO centre | Yes | Same | Same | No | Alias supported but not in nav. |
| `/admin/emails` | Rich email admin | Exists, simplified | Yes | No full editor | Server route send support | Yes for full parity | Vite editor/branding/preview/log UI not fully ported. |
| `/admin/notifications` | Notification admin | Safe unavailable page | No | No | No | Maybe | Vite has route; Next says handled outside staging operations. |
| `/admin/dynamic-content` | Dynamic content route | Safe unavailable page | No | No | No | Maybe | Competition marquee handled in competition edit only. |
| `/admin/page-content` | Page content route | Safe unavailable page | No | No | No | Maybe | Vite route exists; Next has generic message. |
| `/admin/settings` | Settings route | Generic unavailable fallback | No | No | No | Maybe | Vite has route; Next not ported. |
| `/admin/profit-calculator` | Advisory tool | Safe unavailable page | No | No | No | No/P3 | Not launch-critical unless ops need it. |

Visible admin placeholder/migration wording:
- `components/admin/AdminShell.tsx` displays section label “Phase 2”.
- `app/admin/AdminPages.tsx` returns unavailable pages for profit calculator, dynamic content, page content, notifications and generic unknown admin paths.
- These are normal UI-visible and should be cleaned or fully ported before a polished production admin launch.

## 14. SEO And Infrastructure Findings

Close:
- `app/sitemap.ts` exists and includes `/build-a-bundle`.
- Dynamic competition and guide sitemap entries use anon Supabase only.
- `app/robots.ts` disallows admin/account/checkout/auth routes and includes a Sitemap line.
- Admin metadata is `noindex,nofollow`.
- API routes exist for `/api/send-email` and `/api/indexnow-submit`.
- `SITE_URL`/`NEXT_PUBLIC_SITE_URL` base URL logic exists.

Risks:
- Sitemap `lastModified` uses `new Date()` for static pages, so it changes on every generation rather than using content dates.
- Staging vs production URL must be verified in Netlify env vars.
- IndexNow requires a deployed key file/key availability; verify on staging.
- Static/legal pages with placeholders are indexable, so they must be fixed before production.
- OG image parity should be checked, especially homepage logo path differs from Vite source JSON-LD (`/assets/topdraw-logo.png` vs Vite `/og-image.png` in the earlier source).

## 15. Performance And SSR Findings

Build output shows the public app renders many routes statically/server-side, which is an improvement over Vite for crawlability.

Risks:
- Next build warns that Google fonts in `app/layout.tsx` are not optimized in the recommended Next way.
- Many raw `<img>` warnings remain. This is not automatically a launch blocker but is a PageSpeed/LCP risk.
- Some public data is still fetched client-side: reviews marquee, PrizeDrops, Bundle Builder, MiniCart, wallet pill and account/admin clients.
- Countdown components use mounted/tick patterns, but real hydration console checks are still required.
- JS-disabled public content should be checked: homepage/competitions have server HTML, but interactive Bundle Builder and account/admin require JS.

## 16. Staging Test Checklist

### Required Viewports

- Desktop 1440px
- Laptop 1280px
- Mobile 390px
- Mobile 430px

### Global

- Confirm no far-right glow bleed.
- Run `document.documentElement.scrollWidth > window.innerWidth`; expected `false`.
- Confirm no invisible overlays block clicks.
- Confirm MiniCart closed state does not intercept clicks.
- Confirm no hydration errors in console.
- Confirm header/footer links work.

### Public

- `/` hero, carousel, reviews, PrizeDrops, BundleFAQ.
- `/competitions` tabs, cards, empty states.
- `/competitions/[slug]` for live, coming soon, closed, sold out, drawn/published, free-to-play.
- `/build-a-bundle` select one/multiple competitions, quantity caps, tier math, add to basket, MiniCart opens, checkout receives lines.
- `/winners` populated and empty states.
- Static/legal pages at mobile and desktop.

### Checkout

- Empty basket redirect.
- Stale basket blocking.
- Closed/coming soon blocking.
- Discount code valid/invalid.
- Wallet credit toggle and amount cap.
- Stripe redirect.
- Free order success.
- Checkout success polling until entries appear.
- Failed/cancelled/timeout states.

### Auth/Account

- Logged-out account redirects to login.
- Register required fields and profile write.
- Login updates header without full refresh.
- Customer sees wallet/account, not admin.
- Admin sees admin button after role check.
- Profile update.
- Password update/logout.
- Wallet/transactions/orders/entries pages.
- Verification document upload.
- Prize claim submission.
- Responsible play self-exclusion.

### Admin

- Logged-out admin redirects to login.
- Non-admin blocked before admin data renders.
- Admin dashboard loads.
- Competition create/edit/save/status/image upload/regenerate/tier/marquee.
- Hero banner create/edit/activate/upload.
- Draw execution in staging-only data.
- Winner publish/proof/claim/delivery.
- Postal create/process/reject/reset.
- Payment cancel/refund.
- Wallet grant/adjust/settings.
- Entry void/refund/archive/delete.
- Discount code create/edit/toggle/delete.
- Review create/edit/delete/toggle.
- FAQ create/edit/archive/delete.
- Guide create/edit/publish/archive/duplicate/image upload.
- Content library list/upload/delete/copy URL.
- SEO Centre URL review and IndexNow rejection/submit.
- Email route rejects invalid payload and sends only with required env/provider config.

## 17. Recommended Fix Order

1. Replace final legal/static placeholders and footer promoter text with approved business/legal values.
2. Run the required browser visual/interactivity pass at 1440, 1280, 390, and 430.
3. Complete staging checkout test matrix.
4. Complete account verification, prize claim, and self-exclusion staging tests.
5. Complete high-risk admin mutation staging tests.
6. Port or intentionally remove production-visible admin unavailable routes: verifications, emails, settings, notifications, dynamic content, page content, profit calculator.
7. Clean visible admin “Phase 2” section label.
8. Decide whether `/help` and `/footers-preview` should be removed, redirected, noindexed, or documented.
9. Improve guide rich/content rendering parity.
10. Address Next font and raw `<img>` warnings if PageSpeed/LCP is a launch criterion.

## 18. Confirmation

- Original Vite app was audited read-only.
- Original Vite app was not modified.
- No schema, RLS, Stripe, Edge Function, ticket allocation, draw logic, pricing, Klaviyo or Resend changes were made by this audit.
- No functional code changes were made as part of this audit; documentation was updated only.
