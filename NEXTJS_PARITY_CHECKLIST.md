# Next.js Parity Checklist

## Final Parity Audit

- [x] Created `NEXTJS_FINAL_PARITY_AUDIT.md` with complete route, visual, public, checkout, account, admin, SEO/infrastructure and staging-test matrices
- [ ] Replace final legal/static placeholder address and date content with approved business values
- [ ] Complete real-browser visual QA at 1440px, 1280px, 390px and 430px
- [ ] Complete checkout, account and high-risk admin staging mutation tests
- [ ] Resolve secondary admin parity gaps: verifications, richer emails, settings, notifications, dynamic content, page content and profit calculator
- [ ] Decide whether Next-only `/help` and Vite-only `/footers-preview` need redirect/noindex/removal

## Homepage

- [x] Header visual structure
- [x] Header logged-out controls now match Vite more closely: no wallet pill, Vite-style basket icon/button
- [x] Hero fallback PlayStation imagery
- [x] Hero overlay, crop, headline, accent, CTA and ticket badge
- [x] Dynamic homepage `hero_banners` table support added
- [x] Featured competitions section/card layout
- [x] Embla carousel structure, autoplay timing, dots and mobile thumbnails now match Vite
- [x] Reviews marquee
- [x] PrizeDrops / Play to win section
- [x] BundleFAQ two-panel section
- [x] Footer
- [x] Homepage Bundle Builder CTA links to real `/build-a-bundle` route
- [ ] Pixel review at mobile 390px
- [ ] Pixel review at desktop 1440px
- [ ] Newsletter popup parity

## Bundle Builder

- [x] `/build-a-bundle` real route parity
- [x] Port Vite `src/pages/public/BuildBundle.tsx`
- [x] Port Vite `src/components/home/BundleBuilder.tsx`
- [x] Homepage `BundleFAQSection` teaser/CTA exists
- [x] Live competition query, remaining-ticket cap and per-user cap handling
- [x] Discount tier fetch from `competition_discount_tiers`
- [x] Vite `computePricing` pricing display in bundle rows
- [x] Quantity stepper and manual quantity input
- [x] Expanded prize row details
- [x] Sticky bundle summary on desktop
- [x] Mobile bundle summary/layout parity
- [x] Add selected competitions to shared basket and open MiniCart
- [x] Empty/loading states
- [x] Bundle page SEO/JSON-LD parity
- [ ] Bundle Builder manual test at mobile 390px
- [ ] Bundle Builder manual add-to-basket/MiniCart/checkout handoff test

## Competitions

- [x] Listing route
- [x] Live, Ending Soon, Coming Soon, Ended tabs
- [x] Competition card production styling port
- [x] Effective remaining filtering for live/ending
- [x] Server tab route output matches Vite tab visual state
- [ ] Full client-side tab transition parity
- [ ] Pixel review mobile
- [ ] Pixel review desktop

## Competition Detail

- [x] Route and public Supabase fetch
- [x] Detail image field priority
- [x] Title, short description, facts strip
- [x] Ticket cap/progress panel
- [x] Status/CTA visual state
- [x] Accordion information panels
- [x] Vite-style image gallery and two-column purchase layout
- [x] Real quantity selector with quick tiers, range control and order summary
- [x] Discount tier UI and pricing calculation copied from Vite logic
- [x] Vite-compatible localStorage basket bridge (`topdraw_basket_v1`)
- [x] Dynamic content marquee/trust strip
- [x] Free entry notice placement and copy
- [x] Winner detail panel for drawn competitions
- [ ] Pixel review mobile
- [ ] Pixel review desktop

## Global

- [x] Tailwind config copied
- [x] Global CSS/theme copied
- [x] Designer font copied
- [x] Colours/glows/gradients copied
- [x] Button/card utility classes copied
- [x] Phase 1 theme-mode infrastructure added: `html[data-theme]`, dark default, pre-paint init script, custom `ThemeProvider`, persisted preference support and light token scaffold
- [x] Phase 2 shared theme primitives converted: `Panel`, `Button`, `Input`, `Dialog`, `StatusBadge`, `EmptyState`, `WalletPill` and `MiniCart`
- [x] Phase 3 public shell/theme conversion for Header, Footer, competition cards, detail, Bundle Builder and winners
- [x] Light-mode logo asset wired for Header/Footer via CSS `data-theme` switching; dark logo remains unchanged
- [x] First visible public/static/marketing light-mode cleanup pass for static/legal/help pages, FAQs, guides, PrizeDrops, Bundle FAQ, reviews/marquees and featured carousel controls
- [x] Checkout/auth light-mode cleanup pass for checkout, checkout success, login, register, forgot password and reset password
- [x] Global light-mode page background cleanup for `bg-hero-mesh`, home background helpers, `.bg-card` and native date/select controls
- [x] Account light-mode cleanup pass for account layout, overview, entries, orders, wallet, profile, security, wins, prize claim, verification upload and responsible play
- [x] Account light-mode background glow cleanup: `/account/*` now uses account-specific mesh/glow utilities instead of the generic strong `bg-hero-mesh` layer
- [x] Visible theme toggle added to desktop header controls and mobile menu using the existing `ThemeProvider` persistence path
- [x] Admin shared-surface light-mode cleanup for `AdminShell`, `AdminKit`, `AdminImageUploader`, common admin labels/textareas/selects/dialog shells and table wrappers
- [ ] Checkout/auth browser contrast QA
- [ ] Account browser contrast QA
- [ ] Admin route-level light-mode conversion and contrast QA
- [ ] Full route browser contrast QA after exposing the toggle, especially admin
- [x] Header/footer routes preserved
- [x] Static/legal routes present
- [x] Free Entry and Contact page content parity with Vite source
- [x] Supabase browser auth/session provider
- [x] Vite-compatible basket provider and MiniCart drawer
- [x] Fixed basket provider localStorage/custom-event feedback loop that could stall global clicks
- [x] Header auth state switches from login to account/admin controls after session/role load
- [x] Header wallet balance pill matches Vite `wallets.balance` query and links to `/account/wallet`
- [x] Next sitemap route for public pages and public competition/guide records
- [x] `/build-a-bundle` included in sitemap now that the route is real
- [x] Next robots route with private/auth/checkout/admin disallows and Sitemap line
- [x] Closed MiniCart drawer no longer receives pointer events
- [x] Hero decorative image/overlay layers marked `pointer-events-none`
- [x] `/basket` redirect/open-drawer behaviour
- [x] Checkout page calls existing Supabase Edge Functions
- [x] Login/register/forgot/reset auth screens use Supabase auth
- [x] Full legal text parity with Vite source
- [x] Static page content parity for `/terms-and-conditions`, `/privacy-policy`, `/cookie-policy`, `/responsible-play`, `/free-entry`, `/contact`
- [ ] Real promoter postal address/date content remains a launch content blocker because Vite source still contains placeholders
- [x] Checkout success full polling/allocation UI parity
- [x] Klaviyo checkout-success confirmed subscribe parity
- [ ] Account route parity
- [ ] Admin/account route parity

## Winners

- [x] Winners page published-only Supabase query
- [x] Winner cards match Vite square image treatment, winner chip, ticket badge, proof link and hover lift
- [x] Winner card image fallback priority matches Vite
- [ ] Winners page browser visual test mobile
- [ ] Winners page browser visual test desktop

## Basket And Checkout

- [x] `topdraw_basket_v1` localStorage key and item shape
- [x] Add/update/remove/clear basket behaviour
- [x] Quantity merging from competition detail
- [x] Authenticated basket DB merge/persist pattern
- [x] MiniCart drawer layout, item rows, quantity controls and savings display
- [x] Basket route redirects to checkout or competitions
- [x] Checkout line item display
- [x] Competition discount tier calculations
- [x] Discount code validation via `validate-discount-code`
- [x] Wallet credit toggle/amount cap display
- [x] Stale/closed/coming-soon basket blocking
- [x] `create-checkout-session` invocation with existing payload shape
- [x] MiniCart closed state does not block page clicks
- [ ] Stripe redirect manual test
- [ ] Free-order success path manual test
- [x] Checkout success full Vite UI parity

## Interactivity Regression Checks

- [x] Header remains a client component
- [x] AppProviders no longer creates a basket event feedback loop
- [x] Hero CTA overlays are decorative only and cannot intercept clicks
- [x] MiniCart backdrop only exists while open
- [x] MiniCart drawer is `pointer-events-none` while closed
- [x] Competition card countdown strips restored to Vite-style 1s ticking with seconds
- [ ] Header logo/nav manual click test
- [ ] Hero CTA manual click test
- [ ] Competition card manual click test
- [ ] Add-to-basket and MiniCart manual click test
- [ ] Mobile menu manual click test
- [ ] Footer links manual click test

## Auth

- [x] Login
- [x] Register fields: full name, DOB, email, password, mobile, marketing consent, terms, 18+
- [x] Register Supabase metadata/profile fallback writes
- [x] Forgot password
- [x] Reset password
- [x] Session persistence through Supabase browser client
- [x] Protected account route implementation
- [x] Logout control parity through account security page
- [ ] Auth visual pixel review mobile
- [ ] Auth visual pixel review desktop

## Account

- [x] AccountLayout/sidebar/mobile nav
- [x] Logged-out redirect to `/login`
- [x] Overview
- [x] Entries
- [x] Orders
- [x] Transactions
- [x] Wallet
- [x] Profile
- [x] Security/password update/logout
- [x] Wins display
- [x] Responsible play/self-exclusion RPC flow
- [x] ClaimPrizeDialog parity
- [x] AccountVerificationPanel/document upload parity
- [x] Profile DOB lock and verified-profile reset warning parity
- [ ] Account pixel review mobile
- [ ] Account pixel review desktop

## Admin

- [x] AdminLayout/nav/role guard
- [x] Admin noindex/nofollow metadata
- [x] Dashboard read-only stats
- [x] Required admin route map
- [x] Competitions list view
- [x] Competition form/create/edit mutations
- [x] Competition image upload/regenerate
- [x] Competition duplicate/reconcile/archive/delete RPC actions
- [x] Competition discount tiers/dynamic content editors
- [x] Hero banners list/create/edit/delete/activate/upload/preview
- [x] Customers/users list, detail and wallet grant/adjust actions
- [x] Entries list plus void/refund/archive/delete function actions
- [x] Orders/payments cancel/refund function actions
- [x] Draw route execution RPC flow
- [x] Winners publish/proof/claim status actions
- [x] Reviews create/edit/delete/toggle
- [x] Discount code mutations/function UI
- [x] Wallet settings mutation
- [x] Wallet customer grant/adjust mutations
- [x] Postal entries create/process/reject/reset actions
- [x] Emails read-only template view plus `/api/send-email` compatibility route
- [x] FAQs create/edit/archive/delete
- [x] Guides create/edit/publish/archive/delete/duplicate/image upload
- [x] Content library storage list/upload/delete/copy URL
- [x] SEO centre URL review/copy/IndexNow submit through `/api/indexnow-submit`
