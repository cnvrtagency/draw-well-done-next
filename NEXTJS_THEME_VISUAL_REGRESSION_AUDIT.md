# TopDraw Next.js Theme Visual Regression Audit

Date: 2026-05-24  
Scope: light/dark visual-theme audit of `~/Desktop/draw-well-done-next`, updated after the strict light-mode colour/contrast rules pass.

Strict colour pass implemented after the original audit:

- Light-mode tokens now follow the fixed palette supplied for page backgrounds, panels, text, borders, blue/cyan accents and semantic states.
- Light mode disables `.glow-text`, dampens `shadow-glow`/`shadow-glow-soft`, and stops `animate-glow-pulse` from scaling/glowing.
- Dark aurora/page mesh utilities now have light-mode-specific silver/cyan ambience instead of dark blue blobs.
- Admin light-mode compatibility was strengthened for route-level white/dark classes inside `.admin-shell`, including readable text, borders, panels and action buttons while preserving white text on destructive/primary/status chips and the admin brand mark.
- Competition gallery frames and account verification glow are now theme-aware.

Browser limitation: the in-app browser control surface was not available in this session, so this report is based on route/source inspection, build output, and targeted hard-coded class searches. Every visual finding below should be verified in a real browser at desktop and mobile widths before implementation is signed off.

## 1. Executive Verdict

Dark mode is probably still close to the original TopDraw visual baseline because most of the original dark-first utilities are still present. The risk is that recent theme work layered light-mode compatibility on top of dark-first components, rather than moving each component to clean semantic styling.

Light mode is improved and remains staging-testable, but it is not production-signed-off until browser screenshot QA confirms the strict palette pass across public, checkout, account and admin routes. The visible toggle can remain available for staging/testing as requested.

Primary causes:

- `app/globals.css` contains broad global theme utilities, dark-first legacy utilities, light overrides, admin overrides, account overrides, animation fallbacks, and compatibility patches in one file. This makes cascade order hard to reason about.
- `app/admin/AdminPages.tsx` still has route-level `text-white`, `bg-white/[...]`, `border-white/...`, `bg-black`, and dark helper panels across many admin routes.
- `components/CompetitionDetailClient.tsx` uses `.glow-text` on countdown numbers. In light mode this is likely the clearest source of glowing/dirty text.
- Public marketing components still use dark hero/card shadows and radial glows that are acceptable over imagery but questionable on light backgrounds.
- Some “light-mode fixes” rely on broad descendant selectors such as `.admin-table .text-white/50`, which is fragile and has already failed to produce visible improvements in at least one admin route.

Recommendation: keep the visible theme toggle for staging/testing, but treat browser visual QA as required before production sign-off.

## 2. Top 20 Visual Bugs

| Rank | Severity | Area | Issue | Likely source | Recommended fix |
| ---: | --- | --- | --- | --- | --- |
| 1 | Blocker | Admin | Route-specific admin content remains dark-only despite shared admin tokens. | `app/admin/AdminPages.tsx` | Convert route groups directly, starting competitions, hero banners, draws/winners, content library and SEO centre. |
| 2 | High | Theme toggle | Light mode is exposed for staging while admin still needs screenshot QA. | `components/Header.tsx`, `hooks/useTheme.tsx` | Keep visible for staging/testing; do not production-sign-off until QA. |
| 3 | Fixed, needs QA | Text glow | Countdown/detail numbers previously glowed in light mode. | `.glow-text` in `app/globals.css`; usage in `CompetitionDetailClient.tsx` | Light mode now disables text-shadow; verify in browser. |
| 4 | High | Admin tables | Some admin tables still use white/pale route cell text. | `AdminPages.tsx` competitions, customers, winners, reviews, discounts, postal, guides | Apply direct `admin-table-primary/secondary/date/action` classes per table, not broad overrides. |
| 5 | High | Admin panels | Route-specific helper panels use `bg-white/[0.03]`, `border-white/10`, `bg-black/20`. | `AdminPages.tsx` guide editor, content library, SEO centre, customer detail | Replace with `admin-panel`, `admin-card`, `admin-surface` utilities. |
| 6 | High | Hero | Dark-only hero overlay/card shadows may look like black blocks in light mode. | `HeroCarousel.tsx` dark HSL gradients and blackish container | Keep hero image-led but add explicit light-mode wrapper tokens and reduce ambient glows around hero shell. |
| 7 | High | Competition detail | Gallery/frame and timer panels mix glow/shadow and dark assumptions. | `CompetitionImageGallery.tsx`, `CompetitionDetailClient.tsx` | Convert gallery/timer surfaces; remove light-mode text glow. |
| 8 | High | Competition cards | Closed/drawn state bars use `from-black/50 to-black/30` and white text. | `CompetitionCard.tsx` | Keep image overlays dark only if inside image; otherwise use theme tokens. |
| 9 | High | Admin buttons | Outline actions can still be weak when not explicitly classed. | Admin route buttons in `AdminPages.tsx` | Add `admin-action-button` directly to route-level action buttons. |
| 10 | Medium | Marketing glows | Blue icon/card glows can look cheap or dirty on light backgrounds. | `BundleFAQSection`, `BundleBuilder`, `PrizeDrops`, `CompetitionMarquee` | Use lower light-mode shadow tokens or dark-scope glow utilities. |
| 11 | Medium | Checkout success | Success icon uses glow pulse and strong ring. | `CheckoutSuccessClient.tsx` | Scope pulse/glow to dark or soften in light. |
| 12 | Medium | Account verification | Verification panel has a radial blue glow and strong shadow. | `AccountPages.tsx` document panel | Tokenize/reroute to subtle light surface. |
| 13 | Medium | Account dialogs | Prize claim dialog uses `shadow-[var(--shadow-deep)]`; light shadow may be too heavy. | `AccountPages.tsx` | Check and tune dialog shadow/token for light mode. |
| 14 | Medium | Auth register | Primary CTA has a large dark-mode blue glow. | `RegisterClient.tsx` | Use theme CTA utility instead of inline shadow. |
| 15 | Medium | Progress bars | Bar shadows glow in light mode. | `ProgressBar.tsx` | Reduce glow under light mode or use flat accent fill. |
| 16 | Medium | Empty states | Empty icon glow may be visually noisy in light mode. | `EmptyState.tsx` | Use theme-specific icon elevation. |
| 17 | Medium | Header/footer | Logo swap is present, but header/footer still need screenshot QA for scrolled state and mobile menu. | `Header.tsx`, `Footer.tsx` | Browser QA; tune only if actual screenshots show mismatch. |
| 18 | Medium | Static/legal | Static pages appear tokenized but need long-form mobile contrast QA. | `StaticPages.tsx`, `InfoPage.tsx` | Browser QA for copy, links, panels and headings. |
| 19 | Low | Not-found | Still dark-only and references rebuild phase. | `app/not-found.tsx` | Tokenize copy and remove migration wording later. |
| 20 | Low | Motion | Glow pulse is globally disabled only under `prefers-reduced-motion`, not light mode. | `app/globals.css` | Add light-mode motion/glow dampening. |

## 3. Route-By-Route Audit

Rating key:

- Dark status: `preserved`, `likely preserved`, `needs QA`.
- Light status: `usable`, `partial`, `poor`, `blocked`.

| Route | Dark mode status | Light mode status | Issues | Severity | Recommended fix |
| --- | --- | --- | --- | --- | --- |
| `/` | Likely preserved | Partial | Hero remains dark-image-led; marketing glows and carousel dots need visual QA. | Medium | Tune hero/marketing glows after screenshot pass. |
| `/competitions` | Likely preserved | Partial | Cards have improved tokens but closed/drawn states and progress shadows remain dark/glow-heavy. | Medium | Convert card state overlays and progress shadows. |
| `/competitions/[slug]` | Likely preserved | Poor | Detail countdown numbers use `glow-text`; gallery/detail panels still have strong glow/shadow. | High | Fix glow text, gallery frame, detail timer surfaces. |
| `/build-a-bundle` | Likely preserved | Partial | Row active glow and summary hierarchy may look too blue/soft. | Medium | Reduce light-mode row glow, strengthen summary text. |
| `/winners` | Likely preserved | Usable | Winner cards appear mostly tokenized; badge/card contrast still needs QA. | Low | Browser contrast QA. |
| `/past-competitions` | Needs QA | Needs QA | Route exists but appears minimal/redirect-like in route map; theme details need browser check. | Medium | Verify actual rendering and token usage. |
| `/faqs` | Likely preserved | Usable | Accordions/search likely readable; category chips need contrast QA. | Low | Browser QA. |
| `/guides` | Likely preserved | Partial | Guide cards include images and tokenized panels but image/card dark assumptions remain possible. | Medium | Browser QA and guide card cleanup if needed. |
| `/guides/[slug]` | Likely preserved | Partial | Long-form text likely okay; featured image and generated cover need contrast QA. | Low | Browser QA. |
| `/free-entry` | Likely preserved | Usable | Static content tokenized; legal/content placeholder blockers are separate from theme. | Low | Browser QA. |
| `/contact` | Likely preserved | Usable | Static content tokenized; postal placeholder blocker is separate from theme. | Low | Browser QA. |
| `/terms-and-conditions` | Likely preserved | Usable | Long legal copy needs mobile contrast/line-height QA. | Low | Browser QA. |
| `/privacy-policy` | Likely preserved | Usable | Long legal copy needs mobile contrast/line-height QA. | Low | Browser QA. |
| `/cookie-policy` | Likely preserved | Usable | Long legal copy needs mobile contrast/line-height QA. | Low | Browser QA. |
| `/responsible-play` | Likely preserved | Usable | Static page likely tokenized; support link contrast needs QA. | Low | Browser QA. |
| `/login` | Likely preserved | Usable | Auth surfaces are mostly converted; CTA/glow needs screenshot check. | Medium | Browser QA. |
| `/register` | Likely preserved | Partial | Register CTA has inline blue gradient + strong shadow. | Medium | Replace with theme CTA utility. |
| `/forgot-password` | Likely preserved | Usable | Mostly shared auth styles. | Low | Browser QA. |
| `/reset-password` | Likely preserved | Usable | Mostly shared auth styles. | Low | Browser QA. |
| `/checkout` | Likely preserved | Partial | Line items and summary are tokenized but stateful warning/error/wallet states need QA. | Medium | Browser/state QA before edits. |
| `/checkout/success` | Likely preserved | Partial | Success ring/glow pulse and ticket pills need contrast checks. | Medium | Soften light-mode glow/pulse. |
| `/account` | Likely preserved | Partial | Account shell improved; logged-in cards and active nav need browser QA. | Medium | QA authenticated account. |
| `/account/entries` | Likely preserved | Partial | Account glow fixed; ticket rows/tabs need authenticated visual QA. | Medium | QA rows, tabs, ticket details. |
| `/account/orders` | Likely preserved | Partial | Order rows and amounts need logged-in QA. | Medium | QA dense rows. |
| `/account/transactions` | Likely preserved | Partial | Ledger row hierarchy needs contrast QA. | Medium | QA ledger states. |
| `/account/wallet` | Likely preserved | Partial | Positive/negative amounts and ledger rows need contrast QA. | Medium | QA wallet-specific states. |
| `/account/profile` | Likely preserved | Partial | Verification upload panel has radial glow and file input complexity. | Medium | Tone down panel glow if screenshots confirm. |
| `/account/security` | Likely preserved | Usable | Shared forms likely okay; error/success states need QA. | Low | Browser QA. |
| `/account/wins` | Likely preserved | Partial | Prize claim dialog uses deep shadow and image/status cards; needs QA. | Medium | QA prize claim modal in light. |
| `/account/responsible-play` | Likely preserved | Partial | Option tiles use `shadow-glow-soft` when active. | Medium | Light-mode shadow tuning. |
| `/admin` | Likely preserved | Poor | Shell improved but dashboard/content still requires browser QA. | High | Route-level admin cleanup. |
| `/admin/competitions` | Likely preserved | Poor | Table rows still include route-level `text-white`, `text-white/45`; action buttons not all direct-classed. | High | Convert competition list cells/buttons directly. |
| `/admin/competitions/new` | Likely preserved | Poor | Form helper panels, image preview, variant details and checks contain dark-only classes. | High | Convert competition form route group. |
| `/admin/competitions/[id]` | Likely preserved | Poor | Same as create plus existing image/variant panels. | High | Convert competition form route group. |
| `/admin/hero-banners` | Likely preserved | Poor | Table banner copy, helper panels and preview cards still dark-only. | High | Convert hero route group. |
| `/admin/customers` | Likely preserved | Poor | Customer table and customer detail dialog still contain dark-only row/list classes. | High | Convert customers route group. |
| `/admin/entries` | Likely preserved | Partial | Direct entries table classes added, but needs actual browser confirmation. | High | Screenshot-check and adjust if still weak. |
| `/admin/orders` | Likely preserved | Partial | Reuses payment/table route; likely improved by shared table but not direct-classed everywhere. | Medium | QA and direct-class cells if needed. |
| `/admin/payments` | Likely preserved | Partial | Shared table helps; refund dialog still has `text-white/50` helper. | Medium | Convert refund dialog helper text. |
| `/admin/draws` | Likely preserved | Poor | Draw panels use `text-white`, `text-white/50/60/70`, result panel white text. | High | Convert draws route group. |
| `/admin/winners` | Likely preserved | Poor | Winner table/detail panels have route-level white text. | High | Convert winners route group. |
| `/admin/reviews` | Likely preserved | Partial | Table location text still `text-white/50`; needs direct-class pass. | Medium | Convert reviews table. |
| `/admin/discount-codes` | Likely preserved | Poor | Limits/validity/status button still dark-only. | High | Convert discount table and active pill. |
| `/admin/wallet-settings` | Likely preserved | Poor | Checkbox label uses `text-white`; route needs form contrast QA. | Medium | Convert wallet route labels/forms. |
| `/admin/postal-entries` | Likely preserved | Poor | Entrant email and linked text remain white/faint. | High | Convert postal table. |
| `/admin/emails` | Likely preserved | Needs QA | Unknown extent from route map; likely generic shell/table surfaces. | Medium | Browser/source-specific audit. |
| `/admin/faqs` | Likely preserved | Partial | FAQ table mostly generic but route buttons need QA. | Medium | Convert table/actions if weak. |
| `/admin/guides` | Likely preserved | Poor | Guide table and editor feature image panel have dark-only classes. | High | Convert guides list/editor. |
| `/admin/content-library` | Likely preserved | Poor | File cards use `bg-black`, `bg-white/[0.03]`, `text-white/*`, `border-white/10`. | High | Convert file cards directly. |
| `/admin/seo-centre` | Likely preserved | Poor | URL checklist and textareas use `bg-black/20`, `border-white/10`, `text-white/*`. | High | Convert SEO panels and readonly textarea. |

## 4. Component-By-Component Audit

| Component/file | Issues found | Hard-coded risk | Glow/shadow risk | Recommended fix |
| --- | --- | --- | --- | --- |
| `app/globals.css` | Too many overlapping layers and compatibility selectors. | High | High | Split semantic theme utilities from legacy dark utilities; add explicit light-mode dampening for glow classes. |
| `app/layout.tsx` | Theme pre-paint script is reasonable; root still uses `.theme-dark` wrapper. | Medium | Low | Keep for now; avoid more global suppressions. |
| `hooks/useTheme.tsx` | Persistence is reasonable. System mode exists but no UI appears to expose system. | Low | None | No immediate fix except toggle strategy. |
| `Header.tsx` | Logo swap and toggle present; needs scrolled/mobile visual QA. | Medium | Low | Browser QA. |
| `Footer.tsx` | Logo swap present; gradients/trust links need light QA. | Low | Low | Browser QA. |
| `HeroCarousel.tsx` | Dark HSL overlays, black shell, primary blur, white text. | High | High | Keep hero dark-image-led but scope glows and shell shadows by theme. |
| `CompetitionCard.tsx` | Closed/drawn overlays use black gradients and white text; stat/card shadows. | High | Medium | Tokenize status bars and stat panels. |
| `CompetitionDetailClient.tsx` | `.glow-text`, animate glow dots, glow panels. | High | Blocker | Remove/scope text glow; tune detail panels. |
| `EntryQuantitySelector.tsx` | Primary CTA uses `shadow-glow-soft`; discount tiles need QA. | Medium | Medium | Theme-aware CTA shadow. |
| `BundleBuilder.tsx` | Active row glow, icon glow. | Medium | Medium | Lower light-mode glow opacity. |
| `BundleFAQSection.tsx` | Decorative blur orb, glowing chips/cards. | Medium | High | Use light-mode restrained shadow token. |
| `PrizeDrops.tsx` | Active count chip is `text-white`; icon shadow. | Medium | Medium | Tokenize active chip foreground and icon shadow. |
| `FeaturedCompetitionsCarousel.tsx` | Progress/dot glow. | Low | Medium | Reduce glow in light. |
| `ReviewsMarquee.tsx` | Mostly tokenized, edge fades need screenshot QA. | Low | Low | Browser QA. |
| `CompetitionMarquee.tsx` | Uses heavy primary box shadows and glowing dot. | Medium | High | Scope glow to dark or soften in light. |
| `WinnerCard.tsx` | Mostly tokenized; overlay chip remains image-safe. | Low | Low | Browser QA. |
| `StaticPages.tsx` / `InfoPage.tsx` | Mostly tokenized. | Low | Low | Browser QA only. |
| `FAQClient.tsx` | Mostly tokenized; tab/search states need QA. | Low | Low | Browser QA. |
| `CheckoutClient.tsx` | Summary is tokenized; line item images and warnings need state QA. | Medium | Low | Browser state QA. |
| `CheckoutSuccessClient.tsx` | Success icon glow/pulse and CTA shadow. | Medium | High | Soften light-mode success glow. |
| Auth clients | Register CTA is the main glow risk. | Medium | Medium | Tokenize auth primary CTA. |
| `AccountPages.tsx` | Verification panel radial glow, prize claim deep shadow, active tabs. | Medium | Medium | Tune account-specific panels after screenshot QA. |
| `AdminShell.tsx` | Shared shell improved; active/sidebar state still needs browser QA. | Medium | Low | QA before more edits. |
| `AdminKit.tsx` | Shared table classes now explicit; still depends on route cells for hierarchy. | Medium | Low | Continue direct route-group table classing. |
| `AdminImageUploader.tsx` | Tokenized, but preview/upload states need browser QA. | Medium | Low | QA. |
| `AdminPages.tsx` | Largest remaining hotspot: 120 problematic pattern hits in search summary. | Blocker | Medium | Route-by-route conversion. |
| `Panel.tsx`, `button.tsx`, `input.tsx`, `dialog.tsx` | Converted primitives; risk is caller overrides. | Medium | Low | Audit caller overrides before primitive changes. |
| `ProgressBar.tsx`, `CountdownPill.tsx`, `CountdownStrip.tsx` | Shadows/glows likely too strong in light mode. | Medium | Medium | Tokenize light-mode glow levels. |
| `StatusBadge.tsx` | Mostly okay but badge contrast must be checked in admin tables. | Medium | Low | Browser contrast QA. |
| `MiniCart.tsx`, `WalletPill.tsx`, `EmptyState.tsx` | Mostly converted; empty icon and MiniCart shadow need QA. | Low | Medium | Browser QA. |

## 5. Text Glow/Shadow Audit

Likely sources of text glow or dirty text in light mode:

- `app/globals.css:347` defines `.glow-text { text-shadow: 0 0 24px hsl(204 100% 55% / 0.6); }`.
- `components/CompetitionDetailClient.tsx:353` applies `glow-text` to countdown numbers.
- `components/CompetitionDetailClient.tsx:101` defines `animate-glow-pulse` dots for status pills.
- `app/checkout/success/CheckoutSuccessClient.tsx:435` uses `animate-glow-pulse` on the success icon.
- `components/ui/ProgressBar.tsx` uses primary/warning `shadow-[0_0_10px...]`.
- `components/CompetitionMarquee.tsx` uses primary box shadow and glowing dot.
- `HeroCarousel.tsx` uses text-adjacent underline glow and glowing badge dot.
- `PrizeDrops.tsx`, `BundleBuilder.tsx`, `BundleFAQSection.tsx`, `FeaturedCompetitionsCarousel.tsx` use `shadow-glow-soft` or arbitrary primary glows around icons/chips.

Recommendation: make a single `td-glow-*` family with light-mode overrides, then replace direct `glow-text`, `shadow-glow-soft`, and arbitrary glow shadows in high-traffic components.

## 6. Admin Contrast Audit

| Admin route/component | Current issue | Exact source examples | Severity | Fix |
| --- | --- | --- | --- | --- |
| Competitions list | Title/slug and reserved text still route-level white/faint. | `AdminPages.tsx` competition row uses `text-white`, `text-white/45`. | High | Apply direct admin table classes. |
| Competition form | Image preview, URL keys, checklist rows, helper bullets use dark classes. | `border-white/10`, `text-white/55`, `bg-white/[0.03]`. | High | Convert form panels with admin utilities. |
| Hero banners | Banner table title/subtitle and image placeholder still dark-only. | `text-white`, `text-white/50`, `border-white/10 bg-white/5`. | High | Convert hero table and helper panels. |
| Customers | Customer table and detail dialog lists use dark-only nested rows. | `text-white`, `text-white/50`, `bg-white/[0.03]`. | High | Convert customer table and detail lists. |
| Entries | Direct class pass has been applied, but needs browser confirmation. | `admin-table-primary`, `admin-table-secondary`, `admin-action-button`. | Medium | Browser QA; adjust values if still weak. |
| Payments/orders | Shared table helps; refund dialog still has `text-white/50`. | Refund helper copy. | Medium | Convert refund dialog text. |
| Draws | Draw table/detail/result panels still use white text. | `text-white`, `text-white/50/60/70/80`. | High | Convert draws route group. |
| Winners | Winner table/detail panels use white/faint text. | `text-white`, `text-white/55/70/75`. | High | Convert winner table/detail. |
| Reviews | Location text is faint; actions generic. | `text-white/50`. | Medium | Convert review table cells. |
| Discount codes | Limit/validity cells, inactive status button are dark-only. | `text-white/70`, `bg-white/10 text-white/60`. | High | Convert discount table and status toggle. |
| Wallet settings | Labels use white text. | `font-bold text-white`. | Medium | Convert form labels. |
| Postal entries | Entrant email and linked text remain faint. | `text-white/50`, `text-white/55`. | High | Convert postal table. |
| Guides | Guide table and editor featured image panels are dark-only. | `text-white`, `border-white/10 bg-white/5`. | High | Convert guide route group. |
| Content library | File cards are explicitly black/dark. | `bg-black`, `bg-white/[0.03]`, `text-white/*`. | High | Convert file cards with admin-card utilities. |
| SEO centre | URL checklist and readonly textarea are dark-only. | `bg-black/20`, `border-white/10`, `text-white/*`. | High | Convert SEO panels/textarea. |

## 7. Hard-Coded Class Hotspot Report

Search summary for major problematic patterns:

| File | Approx. pattern hits | Risk |
| --- | ---: | --- |
| `app/globals.css` | 448 | Highest cascade/legacy utility risk. |
| `app/admin/AdminPages.tsx` | 120 | Highest route-level admin light-mode risk. |
| `components/HeroCarousel.tsx` | 51 | Dark hero overlays/glows; probably intentional but needs scoping. |
| `components/CompetitionCard.tsx` | 20 | Dark status overlays and card shadows. |
| `components/CompetitionDetailClient.tsx` | 18 | Text glow and glow panels. |
| `components/MiniCart.tsx` | 13 | Mostly converted; overlay/drawer QA required. |
| `components/EntryQuantitySelector.tsx` | 12 | CTA and selected state shadows. |
| `app/account/AccountPages.tsx` | 12 | Verification/prize claim/active states. |
| `components/home/BundleFAQSection.tsx` | 10 | Decorative glows/cards. |
| `app/register/RegisterClient.tsx` | 10 | CTA and auth card glow. |
| `components/CompetitionImageGallery.tsx` | 8 | Detail gallery frame/thumb risk. |
| `FeaturedCompetitionsCarousel`, `BundleBuilder`, `Header`, `CompetitionMarquee`, `CheckoutSuccessClient` | 6 each | Medium glow/control risks. |

Keep/convert guidance:

- Keep dark image overlays on hero and image cards only when white text is intentionally over media.
- Scope text glows and arbitrary blue shadows to dark mode unless proven acceptable in light mode.
- Convert `bg-white/[0.03]`, `border-white/10`, `text-white/*` outside media overlays to semantic tokens.
- Convert `bg-black` and `bg-black/20` in admin/content surfaces; keep only for image matte backgrounds if needed.

## 8. Fix Strategy

### Emergency fixes

1. Hide the visible theme toggle for production, or gate it to staging/internal QA.
2. Remove or dark-scope `.glow-text`; replace competition detail countdown text emphasis with normal weight/color in light mode.
3. Add light-mode overrides for `shadow-glow-soft`, `animate-glow-pulse`, and the most-used arbitrary glow utilities.

### Shared token fixes

4. Introduce explicit light-safe shadow tokens: `--td-glow-subtle`, `--td-glow-strong`, `--td-glow-text`, with dark and light values.
5. Replace broad admin compatibility selectors with direct classes in route JSX.
6. Split `app/globals.css` sections clearly: tokens, primitives, public, account, admin, legacy compatibility.

### Route-specific fixes

7. Convert admin route groups in this order:
   - Competitions list/form
   - Hero banners
   - Draws/winners
   - Customers/payments/postal
   - Discounts/wallet/reviews
   - Guides/content library/SEO centre
8. Convert competition detail/gallery.
9. Tune public marketing glows and competition card state overlays.
10. Tune account verification/prize-claim and checkout-success states.

### Polish

11. Browser-test desktop 1440, laptop 1280, mobile 390 and 430 in both modes.
12. Check contrast on primary/muted/destructive/success/warning text and disabled states.
13. Verify no MiniCart/dialog overlay click blockers and no right-edge glow bleed.

## 9. Proposed Next Codex Prompt

```text
Fix the highest-severity TopDraw light-mode visual regressions only.

Work only in ~/Desktop/draw-well-done-next. Do not modify ~/Desktop/draw-well-done. Do not change functionality, Supabase, schema/RLS, checkout, payment, ticket allocation, draw logic, pricing, Edge Functions, Klaviyo or Resend.

Use NEXTJS_THEME_VISUAL_REGRESSION_AUDIT.md as the source of truth.

Scope this pass to:
1. Keep the visible theme toggle.
2. Convert admin route-level tables and panels in competitions, hero banners, draws/winners, customers, discounts, postal entries, guides, content library and SEO centre to direct admin semantic classes.
3. Convert competition card closed/drawn bars and remaining public detail glow panels to theme-aware classes.
4. Do not change business logic or Supabase calls.

Preserve dark mode. Run npm run build and npm run lint. Update NEXTJS_THEME_VISUAL_REGRESSION_AUDIT.md with what changed.
```

## 10. Confirmation

- Original Vite app was not modified.
- Strict light-mode code changes were made after the original audit: fixed light tokens, light-mode glow dampening, admin route-level compatibility, competition gallery frame classes and account verification glow classes.
- Existing uncommitted theme/admin changes from previous implementation passes were present before this audit and remain part of the current working tree.
