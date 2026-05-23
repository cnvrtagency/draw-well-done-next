# Next.js Parity Checklist

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
- [ ] Pixel review at mobile 390px
- [ ] Pixel review at desktop 1440px
- [ ] Newsletter popup parity

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
- [x] Header/footer routes preserved
- [x] Static/legal routes present
- [x] Free Entry and Contact page shells now match Vite layout more closely
- [x] Supabase browser auth/session provider
- [x] Vite-compatible basket provider and MiniCart drawer
- [x] Fixed basket provider localStorage/custom-event feedback loop that could stall global clicks
- [x] Header auth state switches from login to account/admin controls after session/role load
- [x] Header wallet balance pill matches Vite `wallets.balance` query and links to `/account/wallet`
- [x] Next sitemap route for public pages and public competition/guide records
- [x] Next robots route with private/auth/checkout/admin disallows and Sitemap line
- [x] Closed MiniCart drawer no longer receives pointer events
- [x] Hero decorative image/overlay layers marked `pointer-events-none`
- [x] `/basket` redirect/open-drawer behaviour
- [x] Checkout page calls existing Supabase Edge Functions
- [x] Login/register/forgot/reset auth screens use Supabase auth
- [ ] Full legal text parity
- [x] Checkout success full polling/allocation UI parity
- [x] Klaviyo checkout-success confirmed subscribe parity
- [ ] Account route parity
- [ ] Admin/account route parity

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
- [ ] Competition duplicate/reconcile/archive/delete RPC actions
- [ ] Competition discount tiers/dynamic content editors
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
