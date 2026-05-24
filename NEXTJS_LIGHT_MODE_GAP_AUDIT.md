# TopDraw Next.js Light Mode Gap Audit

Date: 2026-05-24  
Scope: audit-only pass for the current hidden light-mode implementation in `~/Desktop/draw-well-done-next`.

## 1. Executive Verdict

Dark mode remains the only launch-ready visual mode. The Phase 1-3 theme work created a good foundation and made the main public commerce components more light-aware, but hidden light mode is not ready for customer, account or admin QA yet.

Light mode is currently a mixed state:

- Better: `Header`, `Footer`, shared primitives, MiniCart, `CompetitionCard`, `CompetitionDetailClient`, `EntryQuantitySelector`, `BundleBuilder`, `WinnerCard`, countdowns, progress bars, public/static/marketing surfaces, checkout, auth and account screens now have semantic token coverage in important areas.
- Still weak: admin pages still contain dense dark-only styling.
- Highest risk: admin data-dense screens use white text, translucent white surfaces, dark hard-coded selects/tables/dialogs and dark mesh backgrounds. These will not be reliable in light mode until converted as a group.
- Browser visual QA is still required after implementation. This audit is based on source inspection, route/component mapping, and build/lint validation. The in-app browser control tool was unavailable in this session, so no screenshot-based contrast checks were performed.

Public cleanup update:

- Static/legal/help surfaces, guide list/detail cards, competition/winner route stat panels, homepage prize tabs, review/marquee fades, Bundle FAQ panels, and featured carousel controls have now been converted to theme-aware utilities.
- Header and footer now swap to `/assets/topdraw-logo-light-mode.png` only under `html[data-theme="light"]`; dark mode continues using `/assets/topdraw-logo.png`.
- The homepage hero remains intentionally dark-image led in light mode for premium contrast. Its headline/badge white text is deliberate and should be judged in browser QA rather than replaced blindly.

Checkout/auth cleanup update:

- `/checkout`, `/checkout/success`, `/login`, `/register`, `/forgot-password` and `/reset-password` now use theme-aware checkout/auth utilities where safe.
- Checkout basket validation, discount code, wallet credit, Stripe/free-order payloads, checkout-success polling and Klaviyo one-shot behavior were not changed.
- Auth validation and Supabase auth calls were not changed.

Account/background cleanup update:

- Global mesh/home/page background helpers now use theme variables, so hidden light mode no longer keeps the full page shell on hard-coded dark navy.
- `/account`, `/account/entries`, `/account/orders`, `/account/transactions`, `/account/wallet`, `/account/profile`, `/account/security`, `/account/wins` and `/account/responsible-play` now use theme-aware account utilities where safe.
- Prize claim dialog and verification upload panel are tokenized for hidden light mode. Account data queries, updates, password change, verification upload, claim submission and responsible-play RPC calls were not changed.

Production verdict:

- Dark mode: staging-testable.
- Light mode visible toggle: now available in the desktop header controls and mobile menu for staging QA.
- Light mode production sign-off: not ready until admin receives dedicated conversion/contrast QA and all routes pass browser testing.

Visible toggle update:

- The header toggle uses the existing `ThemeProvider`/`setTheme` persistence path and does not add a second localStorage loop.
- Public, checkout, auth and account surfaces are ready for structured staging review in both modes.
- Admin light mode remains the highest-risk follow-up area because it is still dense and operational.

## 2. Route-By-Route Gap List

| Route | Current light-mode status | Main issues | Severity | Safe to fix now |
| --- | --- | --- | --- | --- |
| `/` | Partial | Header/Footer logo swap and most marketing sections are now tokenized; `HeroCarousel` remains intentionally dark-image led and needs browser QA. | Medium | Yes, hero polish only |
| `/competitions` | Improved | Cards, route tabs, empty state and trust panels are now tokenized; browser QA still required. | Medium | Yes |
| `/competitions/[real slug]` | Partial | Detail core is improved, but gallery, marquee, free-entry notice, some gradients and status overlays remain dark-only. | High | Yes |
| `/build-a-bundle` | Mostly improved | Builder rows/summary are better, but page-level intro/FAQ/home linking sections may still be dark-only depending on wrapper usage. | Medium | Yes |
| `/winners` | Improved | Winner route stat panels and empty state are tokenized; browser QA still required. | Low | Yes |
| `/checkout` | Improved | Order review, line cards, summary, wallet, discount, notices and empty/login states now use theme-aware utilities; browser QA still required. | Medium | Browser QA |
| `/checkout/success` | Improved | Confirmation shell, status panels, ticket pills, refresh controls and recommendation copy now use theme-aware utilities; browser QA still required for all payment states. | Medium | Browser QA |
| `/account` | Improved | Account overview, stat tiles, profile summary and nav shell now use theme-aware account utilities; browser QA still required. | Medium | Browser QA |
| `/account/profile` | Improved | Profile forms, verification upload, labels, messages and account panels now use theme-aware utilities; browser QA still required. | Medium | Browser QA |
| `/account/wallet` | Improved | Wallet balance, activity rows and transaction surfaces now use theme-aware utilities; browser QA still required. | Medium | Browser QA |
| `/admin` | Not light-ready | Admin shell/sidebar, admin panels, tables, dialogs and route content are dark-only. | Blocker for production sign-off | Yes, dedicated admin pass |
| `/admin/competitions` | Not light-ready | Tables, create/edit forms, image uploader, dialogs, selects and badges need tokenized admin utilities. | Blocker for production sign-off | Yes |
| `/admin/hero-banners` | Not light-ready | Preview/forms/dialogs inherit admin dark-only shell and table utilities. | High | Yes |
| `/free-entry` | Improved | Static page text, panels and legal instructions are now tokenized; placeholder legal address remains a content blocker. | Medium | Browser QA |
| `/contact` | Improved | Contact text/panel are now tokenized; placeholder legal address remains a content blocker. | Medium | Browser QA |
| Legal/static pages | Improved | Static/legal headings, body text, panels and pre blocks are now tokenized; browser QA still required. | Medium | Browser QA |

## 3. Component-By-Component Gap List

### Public Shell

| Component | Gap | Severity | Recommended fix | Dark risk |
| --- | --- | --- | --- | --- |
| `Header` | Mostly converted. Remaining `text-white` is logo monogram on electric badge and safe. Promo strip uses token border but still gradient heavy. | Low | Leave logo white; later tune promo strip glow for light. | Low |
| `Footer` | Mostly converted. Logo image remains `<img>` warning only; trust dot glow may be slightly bright in light. | Low | Keep for now; tune trust strip after marketing sections. | Low |
| `MiniCart` | Phase 2 converted. Remaining `text-white` count is one image/brand-safe class. | Low | Browser QA open/close and light contrast later. | Low |

### Public Commerce

| Component | Gap | Severity | Recommended fix | Dark risk |
| --- | --- | --- | --- | --- |
| `CompetitionCard` | Core card converted; remaining `text-white` is image overlay winner/closed labels and intended on dark overlay. | Low | Keep overlay labels white; test in light visually. | Low |
| `CompetitionDetailClient` | Main detail text/panels improved; `FreeEntryNotice`, `CompetitionImageGallery`, `CompetitionMarquee` and some gradient separators remain dark-only. | Medium | Convert supporting components next before retouching detail. | Medium |
| `EntryQuantitySelector` | Mostly converted; range slider uses inline gradient with `hsl(var(--muted))`, which should be acceptable but needs browser contrast test. | Medium | Tune slider track/focus states after visual QA. | Low |
| `BundleBuilder` | Main builder improved. Summary and row states are readable via tokens; dark image tiles/primary badges are acceptable. | Low | Browser QA only unless issues appear. | Low |
| `WinnerCard` | Main card converted. Ticket overlay remains dark by design over images. | Low | Keep. | Low |
| `CountdownPill` / `CountdownStrip` | Converted to token classes. Warning tones still depend on semantic colors and need contrast QA. | Low | Test warning/urgent states. | Low |
| `ProgressBar` | Track converted; fill stays brand primary. | Low | Keep. | Low |

### Homepage / Marketing

| Component | Gap | Severity | Recommended fix | Dark risk |
| --- | --- | --- | --- | --- |
| `HeroCarousel` | Partially improved. Timer/shell pieces use marketing tokens, but image-backed hero text and overlays remain intentionally dark for contrast. | Medium | Browser QA first; tune only the non-image shell if contrast issues remain. | Medium |
| `FeaturedCompetitionsCarousel` | Improved. Headings, empty/loading cards, controls and progress track now use theme-aware utilities. | Low | Browser QA and small control contrast tuning if needed. | Low |
| `PrizeDrops` | Improved. Section heading, tabs, counts, empty state and loading cards now use theme-aware utilities. | Low | Browser QA active/inactive tab contrast. | Low |
| `BundleFAQSection` | Improved. FAQ cards, visual stack, marketing panels and support copy now use theme-aware utilities while preserving dark premium accents. | Medium | Browser QA inline illustration contrast; avoid flattening visual. | Medium |
| `ReviewsMarquee` | Improved. Edge fades, cards and copy now use theme-aware utilities. | Low | Browser QA marquee fades in light. | Low |
| `CompetitionMarquee` | Improved. Background, text and edge fades now use theme-aware marketing utilities. | Low | Browser QA scrolling text contrast. | Low |

### Static / Legal / Help

| Component | Gap | Severity | Recommended fix | Dark risk |
| --- | --- | --- | --- | --- |
| `StaticPages.tsx` | Improved. Static/legal page body, headings, panels, dividers and links now use static-page utilities. | Low | Browser QA legal pages at mobile and desktop widths. | Low |
| `InfoPage.tsx` | Improved. Container/body text now uses static-page utilities. | Low | Browser QA. | Low |
| `FAQClient.tsx` | Improved. Search, category tabs, FAQ cards, help panel and copy now use help/static utilities. | Low | Browser QA accordions and empty state. | Low |
| `FreeEntryNotice` | Improved. Compact and full notice copy, borders and links are tokenized. | Low | Browser QA info tone in both themes. | Low |
| `not-found.tsx` | White text and migration-era copy. | Low | Convert text tokens; copy cleanup can be separate. | Low |

### Checkout

| Component | Gap | Severity | Recommended fix | Dark risk |
| --- | --- | --- | --- | --- |
| `CheckoutClient` | Improved. Line cards, wallet panels, notices, summary, stale basket warnings and outline buttons now use theme-aware utilities. | Medium | Browser QA checkout totals, wallet, discount, stale basket and empty/login states. | Low |
| `CheckoutSuccessClient` | Improved. Confirmation shell, status panels, ticket pills, recommendation cards and warning states now use theme-aware utilities. | Medium | Browser QA success, pending, failed, cancelled and allocation states. | Low |

### Auth

| Component | Gap | Severity | Recommended fix | Dark risk |
| --- | --- | --- | --- | --- |
| `LoginClient` | Improved. Auth inputs, labels, links and copy now use theme-aware auth utilities. | Low | Browser QA submit/error states. | Low |
| `RegisterClient` | Improved. Auth glow, form card, phone input, checkbox rows, helper copy and links now use theme-aware auth utilities while keeping CTA gradient. | Medium | Browser QA mobile form density, date input and checkbox rows. | Low |
| `ForgotPasswordClient` / `ResetPasswordClient` | Improved. Headings, inputs and messages now use theme-aware auth utilities. | Low | Browser QA message/error states. | Low |

### Account

| Component | Gap | Severity | Recommended fix | Dark risk |
| --- | --- | --- | --- | --- |
| `app/account/layout.tsx` | Account shell still uses dark background mesh, white nav and dark panels. | Blocker | Convert account shell utilities before route pages. | Medium |
| `AccountPages.tsx` | Highest customer-side hotspot: welcome panel, profile cards, entries/orders/wallet/wins/security/responsible-play all dark-coded. | Blocker | Dedicated account conversion with route-by-route QA. | Medium |
| `VerifiedBadge` | Check badge contrast in light. | Low | Audit after account shell conversion. | Low |
| Account dialogs | Prize claim, verification/upload and security dialogs inherit dark per-dialog classes. | High | Convert dialog content/labels and test overlay unmount. | Medium |

### Admin

| Component | Gap | Severity | Recommended fix | Dark risk |
| --- | --- | --- | --- | --- |
| `AdminShell` | Sidebar, active nav, section dividers, guard/loading states and mesh background are all dark-only. | Blocker | Convert admin shell first; preserve dense operational look. | Medium |
| `AdminKit` | Page headers, panel titles/descriptions and table row hover are dark-coded. | Blocker | Create admin semantic utilities: `td-admin-shell`, `td-admin-panel`, `td-admin-table`, `td-admin-row`, `td-admin-muted`. | Medium |
| `AdminPages.tsx` | 90 white-text and 57 dark surface/border matches; many inline dialogs/selects/textareas use `bg-[#111827]` or dark HSL. | Blocker | Convert route groups after `AdminKit`; prioritize competitions, hero banners, payments/orders, draws/winners. | High |
| `AdminImageUploader` | Upload panel uses white text/border/dark preview. | High | Convert with admin forms. | Medium |
| Admin dialogs | Dialog contents often override primitive with `border-white/10 bg-[hsl(222_45%_5%)] text-white`. | Blocker | Remove dark overrides; use `DialogContent` primitive tokens. | Medium |
| Admin tables/forms | Table heads use `bg-white/5 text-white/60`; selects hard-code dark bg; dense data may become unreadable. | Blocker | Dedicated table/form token pass. | High |

## 4. Hard-Coded Class Hotspots

Current source scan after Phase 3:

### Text hotspots

- `app/admin/AdminPages.tsx`: 90 `text-white...` matches
- `app/account/AccountPages.tsx`: 52
- `app/checkout/success/CheckoutSuccessClient.tsx`: 39
- `app/checkout/CheckoutClient.tsx`: 38
- `components/StaticPages.tsx`: 31
- `app/register/RegisterClient.tsx`: 9
- `app/faqs/FAQClient.tsx`: 8
- `components/home/BundleFAQSection.tsx`: 8
- `components/admin/AdminShell.tsx`: 6
- `components/home/PrizeDrops.tsx`: 6

### Surface/border hotspots

- `app/admin/AdminPages.tsx`: 57 `bg-white/`, `border-white/`, `bg-black`, slate/zinc/neutral matches
- `app/account/AccountPages.tsx`: 23
- `app/checkout/CheckoutClient.tsx`: 13
- `app/checkout/success/CheckoutSuccessClient.tsx`: 7
- `components/StaticPages.tsx`: 7
- `components/home/BundleFAQSection.tsx`: 7
- `components/admin/AdminShell.tsx`: 6

### Gradient/glow/HSL hotspots

- `app/globals.css`: 243 dark/gradient/HSL utility definitions. Many are expected because tokens live there, but `.bg-hero-mesh`, `.bg-aurora`, `.home-bg-layer`, `.account-*` and `.admin-*` remain dark-biased.
- `app/admin/AdminPages.tsx`: 17
- `components/home/BundleFAQSection.tsx`: 10
- `components/HeroCarousel.tsx`: 9
- `app/account/AccountPages.tsx`: 7
- `components/CompetitionDetailClient.tsx`: 7
- `components/CompetitionCard.tsx`: 5
- `components/CompetitionMarquee.tsx`: 5

## 5. Contrast Risks

Blocker-level likely failures in hidden light mode:

- White text on light token surfaces after Phase 3 components render inside light `.theme-dark`.
- `border-white/10` becoming near-invisible on light backgrounds.
- `bg-white/[0.03]` and `bg-white/5` looking like no card at all in light mode.
- Admin table header text and row hover states losing hierarchy.
- Auth input placeholders and labels becoming low contrast if their dark input background is converted indirectly.
- Legal/static paragraphs remaining white on light backgrounds.
- Checkout success panel mixing light `Panel` tokens with hard-coded white text.
- Dark edge fades in reviews/marquee visibly muddy on light background.
- Blue glows that looked premium on graphite looking cheap/washed out on light silver.
- Dialog contents that override tokenized primitives with dark HSL backgrounds.

Medium risks:

- Image overlays should often remain dark, but surrounding chips and timer panels need light-aware surfaces.
- Gold/success/warning/destructive badges need contrast checks in both themes.
- Range slider `hsl(var(--muted))` track could be too low contrast in light mode.
- `bg-hero-mesh` and `bg-aurora` may be too saturated on light pages and should become mode-aware.

## 6. Admin / Account Specific Risks

### Account

Account is not simply a public page variant. It includes profile data, verification upload, prize claim, wallet ledger, responsible-play controls and security forms. It should be converted as a controlled subsystem.

Risks:

- Account route shell uses dark mesh and dark nav.
- `AccountPages.tsx` uses dense inline classes rather than reusable account primitives.
- Verification/prize claim dialogs need tokenized status panels and disabled/loading states.
- Wallet ledger amount colors and transaction types need contrast in light mode.
- Responsible play warning panels must remain readable and serious.

Recommended account approach:

1. Convert `app/account/layout.tsx` and account nav.
2. Add account semantic utilities in `globals.css`.
3. Convert `PageTitle`, stat cards, account panels, tabs and empty states.
4. Convert forms/dialogs/upload panels.
5. Test logged-out redirect, logged-in customer, prize claim and verification upload in both themes.

### Admin

Admin is the highest-risk light-mode area because it is dense, operational and mutation-heavy.

Risks:

- Admin shell sidebar/nav active states are dark-only.
- `AdminKit` table/panel primitives are dark-only.
- `AdminPages.tsx` has route-specific dark overrides for dialogs, selects, previews and tables.
- Admin dialogs override the tokenized `DialogContent`, so primitive conversion is not enough.
- Some admin areas use inline one-line JSX with many dark classes, making random edits risky.

Recommended admin approach:

1. Convert `AdminShell` and `AdminKit` only.
2. Convert route table heads/rows/selects/dialogs via shared admin primitives.
3. Convert competitions and hero banners first.
4. Convert payments/orders/customers/draws/winners second.
5. Convert content/admin secondary routes last.

## 7. Recommended Implementation Order

1. **Static/legal/help pass**  
   Convert `StaticPages.tsx`, `InfoPage.tsx`, `FAQClient.tsx`, `FreeEntryNotice`, `not-found.tsx`. Low business risk, high visible readability gain.

2. **Homepage marketing pass**  
   Convert `HeroCarousel`, `PrizeDrops`, `BundleFAQSection`, `ReviewsMarquee`, `CompetitionMarquee`, `FeaturedCompetitionsCarousel`, `CategoryTabs`. Keep image overlays intentionally dark where needed.

3. **Checkout browser QA**  
   Verify `CheckoutClient` and `CheckoutSuccessClient` in hidden light mode, including wallet, discount, stale basket, success, pending, failed, cancelled and allocation states.

4. **Auth browser QA**  
   Verify login/register/forgot/reset in hidden light mode, including error and success messages.

5. **Account browser QA**  
   Verify account layout, wallet/profile/wins/security/responsible-play and prize claim/verification dialogs in hidden light mode.

6. **Admin shell/kit pass**  
   Convert `AdminShell`, `AdminKit`, `AdminImageUploader`, admin form/table/dialog primitives.

7. **Admin route pass**  
   Convert `AdminPages.tsx` route groups, starting with competitions/hero banners and then operational routes.

8. **Global polish pass**  
   Mode-aware `bg-hero-mesh`, `bg-aurora`, `bg-radial-glow`, `home-bg-layer`, shadows/glows and static page background tuning.

9. **Browser contrast QA**  
   Inspect dark/light at 1440, 1280, 430 and 390px. Verify no hidden overlays, no click blockers and no hydration issues.

10. **Visible toggle pass**  
   Add toggle only after public, checkout, auth, account and admin are all readable and manually tested.

## 8. First Fix Prompt Recommendation

Recommended next prompt:

> Implement the next light-mode phase for TopDraw static/legal/help and homepage marketing surfaces only. Work only in `~/Desktop/draw-well-done-next`. Do not expose a theme toggle. Do not change business logic, checkout, basket, auth, account/admin logic, Supabase, schema/RLS, payment, draw, allocation or pricing. Convert `StaticPages.tsx`, `InfoPage.tsx`, `FAQClient.tsx`, `FreeEntryNotice`, `not-found.tsx`, `HeroCarousel`, `PrizeDrops`, `BundleFAQSection`, `ReviewsMarquee`, `CompetitionMarquee`, `FeaturedCompetitionsCarousel` and `CategoryTabs` to use existing theme tokens/semantic utilities. Preserve dark mode visually; keep image-backed hero overlays dark where needed for readability. Run `npm run build` and `npm run lint`; update docs.

## 9. Notes On Dark Mode

No source findings indicate a dark-mode break from Phase 3 tokenization. The intentionally remaining `text-white` uses in already-converted target components are mostly:

- Logo/brand monogram text on blue badge.
- Winner/closed/sold-out labels on dark image overlays.
- Primary CTA text on blue/glow backgrounds.

These should remain white unless a visual test shows a specific contrast issue.

## 10. Manual QA Checklist For Later

When the next implementation pass is complete:

- Set `localStorage.topdraw_theme = "light"` and reload.
- Check `/`, `/competitions`, a real `/competitions/[slug]`, `/build-a-bundle`, `/winners`, `/checkout`, `/checkout/success`, `/account`, `/account/profile`, `/account/wallet`, `/admin`, `/admin/competitions`, `/admin/hero-banners`, `/free-entry`, `/contact`, and legal pages.
- Repeat at 1440px, 1280px, 430px and 390px.
- Check no white text appears on light surfaces.
- Check borders remain visible.
- Check cards feel premium light graphite/silver, not flat white.
- Check image overlays preserve readability.
- Check CTAs, badges, disabled buttons, forms, selects, tables, dialogs and drawers.
- Toggle back to `localStorage.topdraw_theme = "dark"` and verify dark mode remains visually unchanged.
