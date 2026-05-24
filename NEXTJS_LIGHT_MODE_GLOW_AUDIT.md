# TopDraw Next.js Light-Mode Glow Audit

Date: 2026-05-24  
Scope: source-level glow/lighting audit and emergency shared light-mode glow reset for `~/Desktop/draw-well-done-next`. No business logic changes were made in this pass.

## 1. Executive Verdict

Light mode is not yet clean enough for production visual sign-off. It is usable for staging, but the source still contains many dark-mode lighting effects that are either visible in light mode or likely to become visible depending on route state, hover, active selections, dialog state, or available data.

Recommendation: keep dark mode as the brand baseline and globally strip or neutralise light-mode glows at the utility layer first. Light mode should keep only subtle neutral shadows for depth and non-glowing blue accents. The only light-mode exceptions should be image-led hero sections where dark overlays protect white text over real imagery.

Glows should remain in light mode only as restrained, non-blurry accents:

- Primary blue fills and borders on buttons, badges and active states.
- Very small neutral box shadows for card separation.
- Dark overlays only where text is actually sitting on dark imagery.

Glows should not remain in light mode for normal content panels, cards, tables, text, progress bars, form focus states, account/admin backgrounds or checkout/account/admin panels.

Emergency shared reset status:

- `app/globals.css` now includes a final `html[data-theme="light"] .theme-dark ...` override block that flattens the shared glow utilities identified in this audit.
- Light mode now removes `glow-text` text shadows, disables `animate-glow-pulse`, flattens `rim-glow::before`, neutralises `shadow-glow`, `shadow-glow-soft`, `td-glow-blue`, `td-empty-state-glow`, `td-auth-page-glow`, `admin-shell-glow`, `account-bg-glow` and `account-verification-glow`.
- Light-mode `btn-primary-glow` and `btn-free-glow` now remain crisp filled CTAs with restrained neutral shadow rather than blurry blue/red glow.
- MiniCart open/footer shadows, account panels, selected/progress arbitrary glow selectors and range thumbs now use non-blurry light-mode shadows.
- Dark mode definitions were left intact; this pass is scoped to light-mode overrides.
- Remaining work is route-specific cleanup for arbitrary `shadow-[...]` utilities that are not inside the shared selectors, especially hero exceptions, competition detail panels, selected quantity tiles and some admin preview areas.

## 2. Top 20 Glow Offenders

| # | File | Pattern | Route(s) affected | Light-mode issue | Classification | Recommended action |
|---|---|---|---|---|---|---|
| 1 | `app/globals.css` | `.glow-text { text-shadow: ... }` | Competition detail countdown, any future glow-text usage | Direct text glow. Already disabled in light mode, but class remains high risk. | A/C | Keep dark-only; strengthen audit tests for all text-shadow users. |
| 2 | `components/CompetitionDetailClient.tsx:353` | `glow-text` on countdown numbers | `/competitions/[slug]` | Countdown text can look blurry if override fails or specificity changes. | C | Replace with dark-only class or add explicit light clean class. |
| 3 | `components/HeroCarousel.tsx:86` | `shadow-[0_0_16px_hsl(var(--primary)/0.7)]` underline | `/` hero | Text-adjacent glow; acceptable only over dark hero imagery. | E | Scope to hero dark-image only; no global utility reuse. |
| 4 | `components/HeroCarousel.tsx:207` | `bg-primary/25 blur-3xl` blob | `/` hero | Large blue blur; okay only inside intentional image hero. | E | Keep route-specific; do not use on normal light surfaces. |
| 5 | `components/HeroCarousel.tsx:218` | ticket badge `shadow-[0_0...]`, inner dot `shadow-[0_0_14px...]`, `backdrop-blur-xl` | `/` hero | Heavy glow badge; acceptable only over dark media. | E | Keep only in hero; consider light-mode dark-hero exception class. |
| 6 | `app/globals.css` | `.btn-primary-glow`, `.btn-free-glow` | Header, auth, checkout, account, bundle, guides, FAQs, MiniCart | CTA glow appears throughout the app. Light override exists for primary, but free glow lacks equivalent light cleanup. | A/C | Make both utilities explicitly dark-glow/light-flat. |
| 7 | `components/MiniCart.tsx:269` | `btn-primary-glow` plus explicit `shadow-[0_10px_30px...]` | MiniCart | Extra shadow bypasses the light-mode `btn-primary-glow` override. | C | Remove/override the inline shadow in light mode. |
| 8 | `components/CompetitionCard.tsx:56` | `rim-glow`, hover `shadow-deep` | `/`, `/competitions`, related cards | Rim pseudo-glow and deep hover shadow can look like dark glow on light cards. | A/C | Disable rim pseudo-element and deep hover shadow in light mode. |
| 9 | `components/WinnerCard.tsx:20` | `rim-glow` | `/winners` | Same rim glow risk on winner cards. | A/C | Use light border/neutral shadow instead. |
| 10 | `components/home/PrizeDrops.tsx:99-100` | `rim-glow`, `shadow-glow-soft` icon | `/` PrizeDrops | Dark-mode glow on marketing panel/icon. | A/C | Disable rim glow and convert icon shadow to neutral in light. |
| 11 | `app/globals.css` | `.td-public-card::before` glass sheen | Public cards/site-wide | Pseudo-element can wash out content if layering regresses; fixed with z-index but still creates sheen in light. | B/C | Keep subtle or reduce opacity in light. |
| 12 | `app/globals.css` | `.bg-aurora::before`, `.bg-hero-mesh`, `.home-bg-layer` | Homepage/public shells | Light overrides exist but still use radial primary/info ambience. Can read as glow/bleed. | A/C | Further reduce light-mode opacity or disable outside hero. |
| 13 | `app/globals.css`, `components/admin/AdminShell.tsx:80` | `.admin-shell-glow` | All `/admin/*` routes | Admin has a full-page glow layer in light mode. | A/C | Disable or make neutral/silver in light. |
| 14 | `app/account/layout.tsx:47`, `app/globals.css` | `account-bg-glow` | `/account/*` | Light override is subtle, but still a radial blue glow behind normal account content. | C | Remove in light mode or make nearly transparent neutral. |
| 15 | `app/account/AccountPages.tsx:580` | `account-verification-glow` | `/account/profile`, verification panel | Blue radial glow behind normal panel; light override exists but should be verified. | C | Replace with neutral/silver depth in light. |
| 16 | `app/register/RegisterClient.tsx:114`, `app/checkout/success/CheckoutSuccessClient.tsx:320` | `td-auth-page-glow` | `/register`, `/checkout/success` | Auth/success page has radial page glow behind normal content. | C | Reduce or remove in light mode; keep dark ambience only. |
| 17 | `components/CompetitionDetailClient.tsx:118,140` | `shadow-[0_0_30px...]` info/primary panels | `/competitions/[slug]` | Normal detail panels use blue glow shadows. | C | Replace light-mode with neutral shadow/border. |
| 18 | `components/EntryQuantitySelector.tsx:105,227` | selected tile `shadow-[0_0...]`, submit `shadow-glow-soft` | `/competitions/[slug]` | Quantity selector glows on light panels. | C | Convert selected state to border/fill only in light. |
| 19 | `components/ui/ProgressBar.tsx:21` and carousel progress | Multiple public/account routes | Progress bars have `0_0_10px` glow. | C | Remove glow in light; keep solid bar. |
| 20 | `components/CompetitionMarquee.tsx:26,40` | panel and dot primary glows | Competition detail marquee | Decorative glows in normal content. | C | Light-mode neutral panel and non-glowing dot. |

## 3. Component-by-Component Findings

### Theme/Core

- `app/globals.css` is the primary hotspot. It defines dark and light values for `--glow-blue`, `--td-glow-soft`, `--shadow-deep`, aurora layers, public-card sheen, account/admin/auth glows and button glows.
- `tailwind.config.ts` maps `shadow-glow` and `shadow-glow-soft` to CSS variables, which is good. The risk is inline arbitrary `shadow-[...]` utilities that bypass token control.
- Existing light-mode overrides for `.glow-text`, `.shadow-glow`, `.shadow-glow-soft`, `.animate-glow-pulse`, `.bg-aurora`, `.bg-hero-mesh`, `home-bg-layer`, checkout, account and content-library reduce the problem but do not remove all route-level glow effects.

### Global Shell

- `Header.tsx` uses focus rings and primary accents. These are acceptable if not blurry.
- `Footer.tsx` uses a glowing primary dot for trust items. In light mode it should become a flat primary dot.
- `MiniCart.tsx` contains explicit extra button shadow and success-row glow. These bypass central `btn-primary-glow` cleanup.
- `WalletPill.tsx` did not show major glow-specific risk beyond standard token shadows.

### Public Components

- `HeroCarousel.tsx` intentionally uses dark-image overlays, blurred primary blob, glowing price underline and glowing ticket badge. These are acceptable as route-specific hero exceptions if contained inside the media hero.
- `CompetitionCard.tsx` is a major public card hotspot: `rim-glow`, `shadow-deep`, gold/silver inset glows, stat-panel glow and sold-out/info CTA glow.
- `CompetitionDetailClient.tsx` has the most public route-level glow risk outside the homepage hero: countdown text glow, info panels with `0_0_30px`, inset countdown shadows and glow CTA shadows.
- `EntryQuantitySelector.tsx` selected tiles and submit button still use glow shadows.
- `BundleBuilder.tsx` has selected card blue glow and CTA glow.
- `PrizeDrops.tsx` and `WinnerCard.tsx` use `rim-glow` on normal cards.
- `ReviewsMarquee.tsx` has a low-intensity primary outline shadow. This is probably acceptable only if made neutral in light.
- `CompetitionMarquee.tsx` has panel/dot glows that should be light-flattened.
- `StaticPages.tsx` and `InfoPage.tsx` are mostly clean except CTA button glow.
- `FAQClient.tsx` has `rim-glow` panel and glowing open-state left marker.

### Checkout/Auth

- `CheckoutClient.tsx` is improved after the checkout summary pass. Remaining glow risk is primarily CTA glow and image line-item shadows.
- `CheckoutSuccessClient.tsx` uses `td-auth-page-glow`, `shadow-glow-soft` CTA and stat tile inset shadow. The page glow is the main light-mode offender.
- `LoginClient.tsx`, `ForgotPasswordClient.tsx`, `ResetPasswordClient.tsx` rely on `btn-primary-glow` and focus rings.
- `RegisterClient.tsx` has `td-auth-page-glow`, card radial glow and explicit CTA shadow. These should be light-neutralised.

### Account

- `account-bg-glow` and `account-verification-glow` are still glow utilities. Light-mode values are much softer, but the desired rule says normal content should not have blue glow. These should be removed or flattened in light.
- Account verification upload slots use `focus-within:shadow-[0_0_0_3px...]`, which is a focus outline rather than ambient glow; acceptable if crisp.
- Account responsible-play selected duration uses `shadow-glow-soft` and should use border/fill only in light.
- Prize claim dialog uses `btn-primary-glow`.

### Admin

- `AdminShell.tsx` still renders `admin-shell-glow` over all admin routes. This is the biggest admin-wide light-mode background glow risk.
- `AdminShell.tsx` brand mark uses `shadow-glow-soft`; acceptable as dark-only branding, should be flat in light.
- `AdminPages.tsx` contains hero preview CTA `btn-primary-glow` and route-level image/preview shadows. This is lower priority than `admin-shell-glow`.
- `AdminKit.tsx` and `AdminImageUploader.tsx` are cleaner after recent admin content-library passes, but shared panel sheen still needs light-mode opacity QA.

### Primitives

- `Panel.tsx` routes to `.td-ui-panel`; `td-ui-panel::before` has now been layered behind children, but it still adds a glass sheen. In light mode this should be reduced further for dense admin/account/checkout areas.
- `Button` relies on class consumers; the main risk is `btn-primary-glow` class.
- `ProgressBar.tsx` uses glow shadows directly. Needs a light-mode non-glow version.
- `CountdownPill`/`CountdownStrip` use primary/info surfaces and may inherit text/box glow from parent contexts.
- `EmptyState.tsx` uses `td-empty-state-glow`, which should be dark-only or near-invisible in light.

## 4. Route-by-Route Findings

| Route | Dark mode | Light mode glow risk | Severity |
|---|---|---|---|
| `/` | Preserve hero/brand glow | Hero exception okay, but PrizeDrops, cards, reviews, footer dots and CTA glows remain. | High |
| `/competitions` | Preserve card glow | Competition cards still have rim/stat/CTA glows. | High |
| `/competitions/[slug]` | Preserve urgency glow | Detail panels, countdown glow, quantity selector and progress glows remain. | High |
| `/build-a-bundle` | Preserve subtle brand accents | Bundle selected rows and add CTA glow remain. | Medium |
| `/winners` | Preserve winner card energy | WinnerCard `rim-glow` remains on normal cards. | Medium |
| `/past-competitions` | Likely no major bespoke UI | Route should inherit card/page shell risks. | Low |
| `/faqs` | Preserve dark FAQ card glow | `rim-glow`, open-state marker glow and CTA glow remain. | Medium |
| `/guides` | Preserve CTA glow | Guide CTA buttons use `btn-primary-glow`; cards mostly okay. | Medium |
| `/guides/[slug]` | Mostly clean | Public card sheen only. | Low |
| `/free-entry` | Mostly clean | CTA/glass sheen only if present. | Low |
| `/contact` | Mostly clean | CTA/glass sheen only if present. | Low |
| legal/static pages | Mostly clean | `td-ui-panel` sheen and CTA glow only. | Low |
| `/login` | Preserve dark CTA glow | `btn-primary-glow` should be light-flat. | Medium |
| `/register` | Preserve dark auth ambience | `td-auth-page-glow`, auth card radial, explicit CTA shadow. | High |
| `/forgot-password` | Preserve dark CTA glow | `btn-primary-glow` only. | Medium |
| `/reset-password` | Preserve dark CTA glow | `btn-primary-glow` only. | Medium |
| `/checkout` | Improved | Remaining CTA glow and line-item/card shadows only. | Medium |
| `/checkout/success` | Preserve celebration | `td-auth-page-glow`, success CTA `shadow-glow-soft`. | High |
| `/account` | Preserve dark account depth | `account-bg-glow`, CTA glow. | Medium |
| `/account/entries` | Preserve dark ticket glow | Ticket pills okay; account background glow remains. | Medium |
| `/account/orders` | Preserve table depth | Account background glow. | Medium |
| `/account/transactions` | Preserve ledger depth | Account background glow and panel sheen. | Medium |
| `/account/wallet` | Preserve wallet emphasis | Account background glow. | Medium |
| `/account/profile` | Preserve verification emphasis | Account and verification glows. | Medium |
| `/account/security` | Preserve panels | Account background glow and CTA glow. | Medium |
| `/account/wins` | Preserve claim emphasis | CTA glow and dialog shadow. | Medium |
| `/account/responsible-play` | Preserve warning focus | selected-duration `shadow-glow-soft`. | Medium |
| `/admin` | Preserve dark console glow | `admin-shell-glow` visible on all admin pages. | High |
| `/admin/competitions` | Preserve admin focus | Admin shell glow plus route preview/icon glows. | High |
| `/admin/competitions/new` | Preserve upload UX | Admin shell glow, image previews and CTA glows. | High |
| `/admin/competitions/[id]` | Preserve upload UX | Same as new/edit. | High |
| `/admin/hero-banners` | Preserve hero preview dark exception | Admin shell glow; preview dark hero is route exception. | Medium |
| `/admin/customers` | Preserve table clarity | Admin shell glow only. | Medium |
| `/admin/entries` | Preserve table clarity | Admin shell glow only after table contrast fixes. | Medium |
| `/admin/orders` | Preserve table clarity | Admin shell glow only. | Medium |
| `/admin/payments` | Preserve table clarity | Admin shell glow only. | Medium |
| `/admin/draws` | Preserve caution UI | Admin shell glow and warning/control panels. | Medium |
| `/admin/winners` | Preserve image/proof previews | Admin shell glow; image preview glows possible. | Medium |
| `/admin/reviews` | Preserve table clarity | Admin shell glow and route dark utility remnants. | Medium |
| `/admin/discount-codes` | Preserve form clarity | Admin shell glow and dialog panels. | Medium |
| `/admin/wallet-settings` | Preserve dense forms | Admin shell glow. | Medium |
| `/admin/postal-entries` | Preserve operational table | Admin shell glow. | Medium |
| `/admin/emails` | Preserve table clarity | Admin shell glow. | Medium |
| `/admin/faqs` | Preserve editor clarity | Admin shell glow and dialog content. | Medium |
| `/admin/guides` | Preserve media previews | Admin shell glow, guide image preview panel. | Medium |
| `/admin/content-library` | Recently improved | Admin shell glow remains, but section/card washout was addressed. | Medium |
| `/admin/seo-centre` | Preserve utility panels | Admin shell glow and selected URL panels. | Medium |

## 5. CSS Utilities Needing Light-Mode Overrides

These should be explicitly light-neutralised rather than relying on current token values:

- `.btn-primary-glow`
- `.btn-free-glow`
- `.rim-glow::before`
- `.shadow-glow`
- `.shadow-glow-soft`
- `.td-empty-state-glow`
- `.td-auth-page-glow`
- `.admin-shell-glow`
- `.account-bg-glow`
- `.account-verification-glow`
- `.td-glow-blue`
- `.td-tab-active`
- `.td-nav-link-active::after`
- `.td-minicart-drawer.is-open`
- `.td-minicart-footer`
- `.td-public-card::before`
- `.td-ui-panel::before`
- `.td-marketing-panel-shadow`
- `.td-countdown-segment`
- `.td-progress-track` descendants using glow shadows

## 6. Utilities That Should Become Dark-Only

These are brand ambience tools and should effectively do nothing, or become neutral, in light mode:

- `glow-text`
- `glow-border`
- `rim-glow`
- `bg-aurora`
- `bg-hero-mesh` outside intentional dark sections
- `home-bg-layer` strong radial layers
- `account-bg-glow`
- `account-verification-glow`
- `admin-shell-glow`
- `td-auth-page-glow`
- `btn-free-glow`
- heavy `btn-primary-glow`

## 7. Pseudo-Elements / Overlays Needing Layer Fixes

- `.td-ui-panel::before`: now layered behind direct children, but still creates a sheen. Reduce opacity in light mode.
- `.td-public-card::before`: same risk on public cards; should be very subtle in light.
- `.rim-glow::before`: needs complete light-mode disable except image hero exceptions.
- `.bg-aurora::before`: already softened in light, but still uses blur and primary/info radial layers.
- `.shimmer::after`: should stay dark/hero-only. Disable in light for normal text if ever used outside hero.
- Home/admin/account full-page absolute layers: confirm `pointer-events-none` and lower intensity in light.

## 8. Safe Implementation Plan

### Emergency Pass

1. Add a light-mode glow reset block in `app/globals.css` for shared utilities: `glow-text`, `rim-glow::before`, `shadow-glow`, `shadow-glow-soft`, `td-empty-state-glow`, `td-auth-page-glow`, `admin-shell-glow`, `account-bg-glow`, `account-verification-glow`, `td-glow-blue`, `td-public-card::before`, `td-ui-panel::before`.
2. Keep dark-mode definitions unchanged.
3. Ensure hero image overlays remain untouched.

### Shared Utility Pass

1. Convert `btn-primary-glow` and `btn-free-glow` to dark-glow/light-flat button treatments.
2. Convert `ProgressBar` and carousel progress glow shadows to token classes.
3. Add light-mode neutral replacements for `td-tab-active`, `td-nav-link-active::after`, MiniCart open/footer shadows and marketing panel shadows.

### Route-Specific Pass

1. `CompetitionCard`, `CompetitionDetailClient`, `EntryQuantitySelector`.
2. `HeroCarousel` exceptions: keep only within dark media hero.
3. `RegisterClient`, `CheckoutSuccessClient`, account verification/profile/wins/responsible play.
4. Admin shell and route previews.

### Final QA Pass

1. Test light/dark at 1440, 1280, 430 and 390px.
2. Check no text glow in light mode.
3. Check no full-page blue glow behind account/admin/checkout.
4. Check dark mode still has brand ambience.
5. Check no overlay/pseudo-element blocks clicks.

## 9. Proposed Next Codex Prompt

Implement the emergency light-mode glow reset pass for TopDraw. Work only in `~/Desktop/draw-well-done-next`. Do not change functionality, routing, checkout, basket, auth/account/admin logic, Supabase, schema/RLS, payment, draw, allocation, pricing, Edge Functions, Klaviyo, Resend or the Vite app. In `app/globals.css`, add light-mode scoped overrides that remove text glow and heavy blue/dark glows from shared utilities only: `.glow-text`, `.glow-border`, `.shadow-glow`, `.shadow-glow-soft`, `.rim-glow::before`, `.td-empty-state-glow`, `.td-auth-page-glow`, `.admin-shell-glow`, `.account-bg-glow`, `.account-verification-glow`, `.td-glow-blue`, `.td-public-card::before`, `.td-ui-panel::before`, MiniCart open/footer shadows, progress bar glow shadows and `btn-free-glow`/`btn-primary-glow` light variants. Preserve dark mode exactly and keep intentional dark hero image overlays. Run `npm run build` and `npm run lint`; update the theme audit docs.

## 10. Confirmation

- Original Vite app at `~/Desktop/draw-well-done` was not modified.
- No functional code was changed in this audit pass.
- This document is source-level and route-matrix based; real-browser screenshot QA is still required to confirm visibility and severity.
