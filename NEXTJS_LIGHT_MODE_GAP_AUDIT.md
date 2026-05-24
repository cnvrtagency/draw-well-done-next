# TopDraw Next.js Light Mode Gap Audit

Date: 2026-05-24  
Scope: audit/update after the admin shared-surface cleanup pass in `~/Desktop/draw-well-done-next`.

## 1. Executive Verdict

Dark mode remains the visual baseline. Light mode is now exposed through the header/mobile toggle and is staging-testable across public, checkout, auth and account surfaces. Admin light mode is improved, but not production-signed-off.

This pass converted shared admin surfaces only:

- `AdminShell` sidebar, loading state, access-denied state, nav active/inactive states and shell background now use admin theme tokens.
- `AdminKit` headers, panels, table wrappers and rows now use admin theme tokens.
- `AdminImageUploader` dropzone, drag-over state, title and hint text now use admin theme tokens.
- Shared admin helper `FieldLabel`, `Textarea`, `LoadingOrError` and `EmptyRows` in `AdminPages.tsx` now use admin theme classes.
- Repeated admin table header, select and `DialogContent` dark classes were moved to shared admin token classes.

Source search after this pass:

- `app/admin/AdminPages.tsx`: 80 `text-white...` matches and 32 dark surface/border matches.
- `components/admin/AdminShell.tsx`: 1 `text-white...` match and 1 dark surface/border match, both intentional brand-mark styling.
- `components/admin/AdminKit.tsx`: no direct `text-white...` or dark surface/border matches.
- `components/admin/AdminImageUploader.tsx`: no direct `text-white...` or dark surface/border matches.

Audit limitation: browser automation was not exposed in this session. This is a source/build audit, not screenshot-based contrast QA.

Current production verdict:

- Dark mode: staging-testable.
- Light mode public/checkout/auth/account: staging-testable with browser QA required.
- Light mode admin: shared surfaces improved; route-level conversion and browser QA still required before production sign-off.
- Visible toggle: implemented and should remain enabled for staging QA.

## 2. Route-By-Route Gap List

| Route | Current light-mode status | Main issues | Severity | Safe to fix now |
| --- | --- | --- | --- | --- |
| `/` | Mostly improved | Hero remains intentionally dark-image-led; needs screenshot QA for light surroundings. | Medium | Yes |
| `/competitions` | Improved | Listing/card hierarchy needs browser QA. | Medium | Yes |
| `/competitions/[real slug]` | Partial | `CompetitionImageGallery` still uses dark frame/thumb borders. | High | Yes |
| `/build-a-bundle` | Mostly improved | Needs browser QA for active row glow and summary hierarchy. | Medium | Yes |
| `/winners` | Improved | Needs badge/card contrast QA. | Low | Browser QA |
| `/checkout` | Improved | Needs stateful QA for validation, stale basket, wallet and discount. | Medium | Browser QA |
| `/checkout/success` | Improved | Needs QA for success, pending, failed, cancelled and allocation states. | Medium | Browser QA |
| `/account` | Improved | Account-specific light background layers now replace the previous strong generic `bg-hero-mesh` glow; needs logged-in browser QA for nav, dense cards and mobile layout. | Medium | Browser QA |
| `/account/profile` | Improved | File input, verification panel and form messages need browser QA. | Medium | Browser QA |
| `/account/wallet` | Improved | Wallet rows and positive/negative amounts need browser QA. | Medium | Browser QA |
| `/admin` | Improved, not signed off | Shared shell/kit are tokenized; route/dashboard content still needs browser QA and route-level cleanup. | High | Browser QA + route cleanup |
| `/admin/competitions` | Partial | Shared table/dialog/select surfaces are improved; image panels, helper panels and inline table copy still have route-level dark classes. | High | Yes |
| `/admin/hero-banners` | Partial | Dialog shell/selects are improved; preview/helper panels and image cards still need route-level cleanup. | High | Yes |
| `/free-entry` | Improved | Light mode is tokenized; legal placeholder content remains a separate production content blocker. | Low | Browser QA |
| `/contact` | Improved | Light mode is tokenized; postal placeholder remains a separate production content blocker. | Low | Browser QA |
| Legal/static pages | Improved | Needs long-form text readability QA on mobile and desktop. | Low | Browser QA |

## 3. Component-By-Component Gap List

| Component | File | Issue | Severity | Recommended fix | Dark mode impact |
| --- | --- | --- | --- | --- | --- |
| `Header` | `components/Header.tsx` | Toggle works; avatar white icon is intentional on electric badge. | Low | Browser QA. | Low |
| `Footer` | `components/Footer.tsx` | Trust dot glow may be bright on light background. | Low | Tune only if screenshots show noise. | Low |
| `HeroCarousel` | `components/HeroCarousel.tsx` | Dark image overlays are intentional but may feel heavy in light mode. | Medium | Screenshot QA before changes. | Medium |
| `CompetitionImageGallery` | `components/CompetitionImageGallery.tsx` | Main public detail hotspot: dark frame and white thumbnail borders. | High | Convert to tokenized gallery frame/thumbs. | Low |
| `CompetitionDetailClient` | `components/CompetitionDetailClient.tsx` | Mostly improved; gallery and some radial panels need QA. | Medium | Fix gallery first. | Low |
| `BundleBuilder` | `components/home/BundleBuilder.tsx` | Mostly readable; active states need QA. | Low | Browser QA. | Low |
| `MiniCart` | `components/MiniCart.tsx` | Mostly converted; must verify no overlay/click/glow regressions. | Low | Browser QA. | Low |
| `CheckoutClient` | `app/checkout/CheckoutClient.tsx` | Improved; needs stateful browser QA. | Medium | QA before edits. | Low |
| `CheckoutSuccessClient` | `app/checkout/success/CheckoutSuccessClient.tsx` | Improved; needs multi-state QA. | Medium | QA before edits. | Low |
| `AccountPages` | `app/account/AccountPages.tsx` | Improved; remaining white text is mostly active/CTA states. | Medium | Browser QA. | Low |
| `AdminShell` | `components/admin/AdminShell.tsx` | Shared shell now tokenized. | Medium | Browser QA active nav, guard, loading and buttons. | Low |
| `AdminKit` | `components/admin/AdminKit.tsx` | Shared headers, panels and tables now tokenized. | Medium | Browser QA dense table hierarchy. | Low |
| `AdminImageUploader` | `components/admin/AdminImageUploader.tsx` | Shared dropzone now tokenized. | Medium | Browser QA idle, drag-over and busy states. | Low |
| `AdminPages` | `app/admin/AdminPages.tsx` | Largest remaining hotspot: route-level previews, helper cards, content panels, file cards and inline table cell text. | High | Convert by route group. | High |
| Forms/selects/textareas | Admin shared + route-specific | Repeated selects and shared textarea are tokenized; route-specific wrappers remain. | Medium | Convert per admin route group. | Medium |
| Dialogs/modals | `app/admin/AdminPages.tsx` | Repeated dialog shells are tokenized; nested dark body content remains in places. | High | Convert nested dialog content per route group. | Medium |
| Tables | `AdminKit` + `AdminPages` | Shared wrappers/heads/rows are improved; route cell copy remains mixed. | High | Convert route table cell content by domain. | Medium |

## 4. Hard-Coded Class Hotspots

### `text-white...` hotspots

| File | Count | Assessment |
| --- | ---: | --- |
| `app/admin/AdminPages.tsx` | 80 | High. Route-level admin content still has dark-only text. |
| `components/HeroCarousel.tsx` | 4 | Intentional over image overlays. |
| `app/account/AccountPages.tsx` | 3 | QA active tabs/CTA states. |
| `components/CompetitionCard.tsx` | 2 | Intentional dark image overlays. |
| `app/not-found.tsx` | 2 | Low. Easy cleanup. |
| `components/admin/AdminShell.tsx` | 1 | Intentional brand mark on gradient. |
| `components/home/PrizeDrops.tsx` | 1 | Active count chip. |
| `components/MiniCart.tsx` | 1 | Basket count badge. |
| `components/Header.tsx` | 1 | Avatar icon on electric badge. |
| `components/CompetitionImageGallery.tsx` | 1 | Gallery overlay count. |
| `app/register/RegisterClient.tsx` | 1 | Primary CTA gradient text. |

### Dark surface/border hotspots

| File | Count | Assessment |
| --- | ---: | --- |
| `app/admin/AdminPages.tsx` | 32 | High. Route-level cards, previews and helper panels remain. |
| `components/CompetitionImageGallery.tsx` | 5 | High for public detail route. |
| `app/globals.css` | 5 direct matches | Mostly mode-aware utilities plus remaining legacy classes. |
| `components/admin/AdminShell.tsx` | 1 | Intentional brand mark glow. |
| Other public/account files | 1 each or fewer | Browser QA/tune only if visible. |

## 5. Contrast Risks

Blocker/high risks:

- Route-level admin white text on light surfaces outside tokenized table/dialog wrappers.
- Route-level admin `bg-white/[0.03]`, `bg-white/5` and `border-white/10` helper panels.
- Admin image/file cards in content library, guide editor, hero banner helper panels and SEO centre.
- Nested admin dialog body content that still uses dark utility classes.
- `CompetitionImageGallery` dark frame/borders on public detail pages.

Medium risks:

- Primary blue glows may feel too strong on light silver backgrounds.
- Semantic success/warning/destructive badges need browser contrast checks.
- Native file/date inputs need browser checks.
- Checkout success allocation/pending/failure states need stateful QA.
- Account prize claim and verification dialogs need open/close QA.

Low risks:

- White text on primary/gradient CTAs.
- White icons on electric/primary badges.
- White text on dark image overlays.

## 6. Admin / Account Specific Risks

### Account

Account is substantially improved. The light-mode background glow issue found on `/account/entries` was traced to `app/account/layout.tsx`, where a high-opacity generic `bg-hero-mesh` layer and an inline primary radial gradient sat behind all account content. Those layers now use account-specific `account-bg-mesh` and `account-bg-glow` utilities with softer light-mode gradients. Remaining work is browser QA for authenticated states, file inputs, wallet ledger rows, active tabs and prize claim/verification dialogs.

### Admin

Admin shared surfaces are improved. Remaining admin work should be route-group cleanup, not more shared primitive work.

Recommended admin approach:

1. Browser-test the shared admin surface pass in dark and light.
2. Convert competitions and hero banners route-level content first.
3. Convert customers/wallet, entries, payments/orders, draws/winners and postal entries second.
4. Convert discount codes, reviews, FAQs, guides, content library, SEO centre and emails last.
5. Browser-test admin at desktop and mobile sizes before production sign-off.

## 7. Recommended Implementation Order

1. **Admin shared surface browser QA**  
   Verify `AdminShell`, `AdminKit`, `AdminImageUploader`, common tables, common dialogs, common selects and shared textareas in dark and light.

2. **Admin competitions and hero banners pass**  
   Convert route-level image panels, helper callouts, inline table cell copy and nested dialog content for competitions and hero banners.

3. **Admin operational routes pass**  
   Convert customers/wallet, entries, orders/payments, draws/winners and postal entries.

4. **Admin secondary content pass**  
   Convert discount codes, reviews, FAQs, guides, content library, SEO centre and emails.

5. **Public detail polish pass**  
   Convert `CompetitionImageGallery`.

6. **Stateful browser QA pass**  
   Run dark/light QA on checkout, checkout success, account dialogs, MiniCart, mobile menu and admin dialogs.

## 8. First Fix Prompt Recommendation

Recommended next prompt:

> Implement the next light-mode cleanup pass for TopDraw admin competition and hero-banner route content only. Work only in `~/Desktop/draw-well-done-next`. Do not change admin business logic, Supabase calls, schema/RLS, Stripe/payment, ticket allocation, draw logic, pricing, Edge Functions, Klaviyo or Resend. Keep the shared admin classes from the prior pass and convert route-level dark utility classes in competition list/create/edit, competition image panels, hero banner list/edit dialogs and hero helper panels. Preserve intentional dark image previews. Run `npm run build` and `npm run lint`; update the light-mode docs.

## 9. Manual QA Checklist For Later

- Start with no stored `topdraw_theme`; confirm dark is default.
- Toggle to light; reload; confirm light persists.
- Toggle back to dark; reload; confirm dark persists.
- Check `/admin`, `/admin/competitions`, `/admin/competitions/new`, `/admin/hero-banners`, `/admin/customers`, `/admin/payments`, `/admin/draws`, `/admin/winners`.
- Check admin sidebar/nav active states.
- Check common admin tables, common dialogs, native selects, textareas and uploader dropzones.
- Check no white text appears on light non-image surfaces.
- Check borders remain visible and cards do not flatten.
- Check no invisible overlays block clicks after dialogs close.
- Repeat at 1440px, 1280px, 430px and 390px.

## 10. Notes On Dark Mode

No source findings indicate a dark-mode regression from the current theme implementation. Remaining direct white text outside admin route content is mostly deliberate for dark image overlays, primary CTAs or gradient badges.
