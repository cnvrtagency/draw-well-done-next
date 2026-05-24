# TopDraw Next.js Light/Dark Mode Audit

Date: 2026-05-24  
Scope: documentation-only audit for adding a seamless light/dark mode system to the Next.js rebuild.

## 1. Executive Summary

TopDraw can support light and dark modes without a redesign, but it should not be implemented as a quick Tailwind `dark:` pass or color inversion. The current app is a dark-first visual system with some good foundations: global CSS variables exist, Tailwind colors are mapped to those variables, and shared primitives such as `Button`, `Input`, `Panel`, `StatusBadge`, `MiniCart`, and account/admin helpers already centralise part of the styling.

The blocker is that the app is hard-pinned to `.theme-dark` in `app/layout.tsx`, while many visible components bypass semantic tokens with hard-coded `text-white`, `bg-white/[...]`, `border-white/...`, dark HSL gradients, black overlays, and blue glow effects. A safe implementation should therefore keep dark mode as the default, add theme plumbing first, and convert UI surfaces component by component.

Recommended approach:

1. Add a theme provider and token strategy with dark as the exact default.
2. Add light-mode variable overrides behind `data-theme="light"`.
3. Convert shared primitives first.
4. Convert public, account, and admin screens in controlled phases.
5. Add a visible toggle only after the major surfaces pass contrast and visual QA.

Light mode is realistic, but only if it remains TopDraw-branded: light graphite/silver backgrounds, strong dark text, restrained cyan accents, subtle glass panels, and fewer glows. It should feel premium and trustworthy, closer to fintech/editorial than a generic white SaaS UI.

Phase 1 implementation status:

- Added a lightweight custom `ThemeProvider` in `hooks/useTheme.tsx`.
- Added `html[data-theme]` and `html[data-theme-preference]` scaffolding in `app/layout.tsx`, defaulting to dark.
- Added a pre-paint theme initialisation script so a stored preference is applied before hydration.
- Added dark and light token scaffolding in `app/globals.css`.
- Kept the existing `.theme-dark` app wrapper and current dark visual system intact.
- No visible theme toggle has been added yet.
- Component-level light-mode conversion is intentionally deferred to the next phases.

Phase 2 implementation status:

- Converted shared primitive surfaces to semantic utility classes without adding a visible toggle.
- `Panel` now uses `td-ui-panel`, `td-ui-panel-surface`, `td-ui-panel-raised` and `td-ui-panel-outline`.
- `Button`, `Input` and `Dialog` now expose theme-aware primitive classes while preserving their existing variants and `asChild` behavior.
- `StatusBadge` neutral/muted states now use semantic badge classes instead of white-border dark-only classes.
- `EmptyState`, `WalletPill` and `MiniCart` now use theme-aware surface, border, text and overlay variables.
- MiniCart still uses `pointer-events-none` while closed and keeps the drawer translated off-screen to avoid click blocking or right-edge glow bleed.
- Header/Footer were audited but not converted in this pass because they are higher-risk public-shell components.

## 2. Current Theme Architecture

Audited files:

- `app/globals.css`
- `tailwind.config.ts`
- `app/layout.tsx`
- `components/AppProviders.tsx`
- `package.json`
- `next.config.mjs`
- `components/Header.tsx`
- `components/Footer.tsx`
- `components/Panel.tsx`
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/dialog.tsx`
- `components/StatusBadge.tsx`
- `components/EmptyState.tsx`
- `components/MiniCart.tsx`
- `components/WalletPill.tsx`
- `components/HeroCarousel.tsx`
- `components/CompetitionCard.tsx`
- `components/CompetitionDetailClient.tsx`
- `components/EntryQuantitySelector.tsx`
- `components/WinnerCard.tsx`
- `components/home/BundleBuilder.tsx`
- `components/home/BundleFAQSection.tsx`
- `components/home/PrizeDrops.tsx`
- `components/ReviewsMarquee.tsx`
- `components/StaticPages.tsx`
- `components/InfoPage.tsx`
- `app/account/AccountPages.tsx`
- `app/account/layout.tsx`
- `components/account/VerifiedBadge.tsx`
- `app/admin/AdminPages.tsx`
- `components/admin/AdminShell.tsx`
- `components/admin/AdminKit.tsx`
- `components/admin/AdminImageUploader.tsx`

Findings:

- `app/globals.css` defines a `:root` light-ish theme, a `.dark` theme, and a much more complete `.theme-dark` TopDraw public/admin/account theme.
- `tailwind.config.ts` maps standard colors such as `background`, `foreground`, `card`, `primary`, `muted`, `accent`, `success`, `warning`, `destructive`, `info`, and `gold` to CSS variables.
- `tailwind.config.ts` has `darkMode: ["class"]`, but no component currently uses `dark:` utilities.
- `app/layout.tsx` wraps the whole app in:

  ```tsx
  <div className="theme-dark min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
  ```

  This means the TopDraw dark theme is global and always active.

- `components/AppProviders.tsx` currently provides auth, basket, and MiniCart only. There is no theme provider.
- `package.json` does not include `next-themes`.
- `next.config.mjs` has no theme-specific handling.
- There is no persisted user theme preference today.
- There is no system preference support today.
- The strongest reusable design primitives are `.glass-panel`, `.glass-panel-strong`, `.surface-card`, `.btn-primary-glow`, `.btn-free-glow`, `.btn-ghost-rim`, `.admin-panel`, `.account-panel`, and `Panel`.
- Several account/admin utility classes in `globals.css` are dark-only and use hard-coded white text, dark HSL backgrounds, and dark date/select/table overrides.

Architecture issue:

The theme variables exist, but the app treats `.theme-dark` as both the brand scope and the dark color mode. For light mode, `.theme-dark` should either be replaced by a neutral app scope, or kept temporarily while `html[data-theme="light"] .theme-dark` overrides its variables and primitives.

## 3. Hard-Coded Dark Class Audit

Approximate scan results across `app` and `components`:

- `text-white...`: 708 matches
- `bg-white/...`: 152 matches
- `border-white/...`: 196 matches
- Gradients, arbitrary shadows, HSL/RGBA, radial/linear backgrounds: 538 matches
- `dark:` utilities: 0 matches

High-density files:

- `app/globals.css`: 152 dark/gradient matches
- `app/admin/AdminPages.tsx`: 94 matches
- `components/CompetitionDetailClient.tsx`: 60 matches
- `components/home/BundleBuilder.tsx`: 58 matches
- `app/account/AccountPages.tsx`: 56 matches
- `app/checkout/CheckoutClient.tsx`: 46 matches
- `app/checkout/success/CheckoutSuccessClient.tsx`: 43 matches
- `components/MiniCart.tsx`: 37 matches
- `components/StaticPages.tsx`: 32 matches
- `components/Header.tsx`: 23 matches
- `components/EntryQuantitySelector.tsx`: 22 matches
- `components/home/BundleFAQSection.tsx`: 18 matches
- `components/CompetitionCard.tsx`: 16 matches
- `components/HeroCarousel.tsx`: 13 matches

Categories found:

- Hard-coded text:
  - `text-white`
  - `text-white/85`
  - `text-white/70`
  - `text-white/55`
  - `text-silver`

- Hard-coded translucent dark surfaces:
  - `bg-white/[0.03]`
  - `bg-white/5`
  - `bg-black/20`
  - `bg-black/60`
  - `!bg-[hsl(222_45%_6%/0.96)]`

- Hard-coded borders:
  - `border-white/10`
  - `border-white/[0.06]`
  - `border-white/20`
  - `ring-white/5`

- Dark-only gradients:
  - `bg-hero-mesh`
  - `bg-aurora`
  - `bg-radial-glow`
  - arbitrary `radial-gradient(...)`
  - arbitrary `linear-gradient(...)`
  - `from-black/...`
  - `to-[hsl(222_50%_2%)]`

- Glow and shadow assumptions:
  - `shadow-glow`
  - `shadow-glow-soft`
  - `shadow-deep`
  - `shadow-[...hsl(var(--primary)...)]`
  - global blue/cyan glow utilities

- Dark-only native controls:
  - `.theme-dark select:not([data-styled])`
  - `.theme-dark input[type="date"]`
  - `.account-input`
  - `.account-table`

This density means light mode must be a migration, not a single provider package install.

## 4. Component Risk Matrix

| Area | Risk | Reason |
| --- | --- | --- |
| `HeroCarousel` | High | Uses image overlays, dark HSL gradients, white hero text, floating timer glass, trust chips, and strong blue glow assumptions. Light mode needs separate overlay opacity and probably some hero sections should remain dark. |
| `CompetitionCard` | High | Core launch surface. Uses glass panels, white text, dark image overlays, black status panels, silver/gold chips, progress, countdowns, and hover glow. Needs careful card tokenisation. |
| `CompetitionDetailClient` | High | Largest public interactive surface. Uses many dark panels, white text, radial glows, accordions, discount tiers, entry selectors, and basket CTAs. |
| `BundleBuilder` | High | Many nested dark cards and summary panels, quantity controls, discount chips, image tiles, sticky summary, and basket action states. |
| `MiniCart` | High | Fixed drawer with dark-only background, black overlay, white text, item cards, quantity controls, and z-index/overlay safety requirements. |
| `Header` | High | Sticky glass header, mobile drawer, nav active state, wallet pill, MiniCart trigger, promo marquee, auth/admin states. Needs no flash/mismatch. |
| `Footer` | Medium | Mostly static, but dark gradient, logo area, trust strip, and legal link contrast depend on dark mode. |
| `Account pages` | High | `AccountPages.tsx` and `globals.css` account utilities are heavily dark-coded. Includes forms, verification upload, prize claim dialog, tables, wallet, and responsible play. |
| `Admin pages` | High | Operational tables/forms/drawers use dark-only primitives and generic table overrides. Light admin has the largest contrast and data-density risk. |
| `AdminShell` | High | Sidebar, active nav, guard states, shell background mesh, and top-level admin layout are all dark-only. |
| `Dialogs/forms` | Medium | `Button` and `Input` are token-friendly, but dialog close button and many per-dialog content classes are dark-only. |
| `StatusBadge` | Medium | Several statuses use semantic tokens, but closed/draft/archived states include white borders or muted tokens that may not be strong enough in light mode. |
| `Panel` | Medium | Wrapper is good, but variants resolve to dark CSS classes. `outline` uses `border-white/10`. |
| `EntryQuantitySelector` | High | Dark quantity tiles, range slider, savings labels, summary totals, disabled controls. Needs full tokenisation. |
| `WinnerCard` | Medium | Dark glass card and image badge overlays. Less complex than competition detail but visually prominent. |
| `StaticPages` / `InfoPage` | Medium | Legal/static content is mostly text, but currently all text and section rules are white-on-dark. Easy to convert after shell tokens. |
| `PrizeDrops` / `ReviewsMarquee` | Medium | Marketing surfaces with dark glass, marquees, fades, and glow effects. |
| `CountdownPill` / countdown strips | Medium | Uses primary-tinted backgrounds and white default text. Needs light-safe default tone. |
| `WalletPill` | Medium | Small surface, but visible in header and uses `border-white`, `bg-white/5`, `text-white`. |
| `SafePrizeImage` | Low | Mostly image fallback; `bg-white/[0.04]` needs token replacement. |

## 5. Contrast Risk Areas

Likely failures if a light theme is switched on before migration:

- White text on light surfaces:
  - Header links
  - Card titles
  - Legal/static page text
  - Account/admin labels
  - MiniCart rows
  - Dialog titles/descriptions

- Translucent white panels disappearing:
  - `bg-white/[0.03]`
  - `bg-white/5`
  - `border-white/10`
  - `ring-white/5`

- Glows looking too loud or cheap:
  - Hero mesh
  - Card hover glows
  - `.bg-aurora`
  - `.home-bg-layer`
  - `.shadow-glow-soft`
  - MiniCart drawer shadow

- Disabled states:
  - Quantity buttons
  - Form submit buttons
  - Upload buttons
  - Admin destructive actions

- Status colors:
  - Warning chips can remain legible, but low-opacity yellow/orange fills need contrast checks.
  - Success chips using full green backgrounds likely pass; `success/10` panels may be too faint.
  - `closed`, `draft`, `archived`, and `pending` badges need stronger light-mode borders.

- Forms:
  - `Input` is token-friendly.
  - Account inputs and native date/select controls are hard-coded dark with `!important`.
  - File inputs in verification upload use dark classes.

- Tables:
  - Admin generic table polish is dark-only.
  - Account table utilities are dark-only.
  - Hover states use translucent white and may vanish.

- Image overlays:
  - Hero text overlays are intentionally near-black.
  - Competition drawn/closed overlays use black gradients.
  - Winner image badges use `bg-black/65`.
  - Light mode needs these overlays to remain dark on top of imagery, not converted blindly.

## 6. Image and Background Risk

Images should mostly stay the same in both themes. The risk is not the assets; it is the overlays and surrounding ambience.

Recommendations:

- Keep hero image overlays dark enough for white headline text, even in light mode, unless the hero copy is moved to a non-image text panel.
- Allow selected media-heavy sections to remain dark in light mode:
  - Hero carousel
  - Competition image gallery panels
  - Some prize-card image overlays
  - MiniCart overlay backdrop

- Lighten global backgrounds instead of making all sections white:
  - Replace page background with a silver/graphite token.
  - Keep panels and cards slightly elevated.
  - Use much softer blue/cyan glow.

- Edge fades in marquees must become tokenised:
  - Current fades use hard-coded dark HSL or `from-background`.
  - Light mode should fade to the light background token.

- Background auroras should become mode-aware:
  - Dark: current blue/cyan glows.
  - Light: lower opacity, tighter size, more central/contained, more shadow than glow.

## 7. Recommended Light Theme Direction

Light mode should still be recognisably TopDraw:

- Base: light graphite/silver, not pure white.
- Text: deep navy/graphite.
- Accent: electric blue/cyan retained, but glows reduced.
- Cards: clean glass panels with subtle borders and soft shadows.
- CTAs: strong blue gradient or solid electric blue.
- Status chips: high-contrast fills and borders.
- Admin/account: dense, readable, operational, with strong row boundaries.
- Hero/media sections: allowed to stay dark if that protects visual quality and contrast.

Suggested token values, as a starting point:

```css
html[data-theme="light"] {
  --background: 214 36% 96%;
  --foreground: 222 40% 10%;

  --card: 0 0% 100%;
  --card-foreground: 222 40% 10%;
  --card-2: 215 36% 94%;
  --surface-1: 0 0% 100%;
  --surface-2: 214 36% 97%;
  --surface-3: 215 28% 91%;

  --panel: 0 0% 100%;
  --panel-foreground: 222 40% 10%;
  --glass: 0 0% 100% / 0.72;
  --glass-strong: 0 0% 100% / 0.88;

  --muted: 214 26% 91%;
  --muted-foreground: 218 16% 38%;

  --border: 216 24% 84%;
  --hairline: 218 28% 22%;
  --input: 216 24% 84%;

  --primary: 204 100% 42%;
  --primary-foreground: 0 0% 100%;
  --info: 190 92% 38%;
  --info-foreground: 0 0% 100%;
  --accent: 230 72% 52%;
  --accent-foreground: 0 0% 100%;

  --success: 152 58% 34%;
  --success-foreground: 0 0% 100%;
  --warning: 31 92% 44%;
  --warning-foreground: 222 40% 8%;
  --destructive: 0 72% 48%;
  --destructive-foreground: 0 0% 100%;

  --glow-blue: 0 0 0 1px hsl(204 100% 42% / 0.16), 0 14px 40px -28px hsl(204 100% 42% / 0.34);
  --shadow-elev-1: 0 1px 0 hsl(0 0% 100% / 0.8) inset, 0 8px 24px -18px hsl(218 40% 18% / 0.28);
  --shadow-elev-2: 0 1px 0 hsl(0 0% 100% / 0.85) inset, 0 18px 44px -28px hsl(218 40% 18% / 0.34);
}
```

These are not final design tokens; they are a safe direction for first implementation.

## 8. Token Strategy

Use semantic tokens instead of adding hundreds of `dark:` utilities.

Recommended token groups:

- Core:
  - `--background`
  - `--foreground`
  - `--card`
  - `--card-foreground`
  - `--popover`
  - `--popover-foreground`
  - `--border`
  - `--input`
  - `--ring`

- Brand:
  - `--primary`
  - `--primary-foreground`
  - `--info`
  - `--info-foreground`
  - `--accent`
  - `--accent-foreground`
  - `--gold`
  - `--gold-foreground`

- Surfaces:
  - `--surface-1`
  - `--surface-2`
  - `--surface-3`
  - `--panel`
  - `--panel-foreground`
  - `--glass`
  - `--glass-strong`
  - `--hairline`

- State:
  - `--success`
  - `--success-foreground`
  - `--warning`
  - `--warning-foreground`
  - `--destructive`
  - `--destructive-foreground`

- Effects:
  - `--grad-electric`
  - `--grad-graphite`
  - `--grad-glass-top`
  - `--grad-page`
  - `--grad-hero-mesh`
  - `--glow-blue`
  - `--shadow-elev-1`
  - `--shadow-elev-2`
  - `--shadow-deep`

Short-term migration:

- Keep the existing `.theme-dark` class on the app root to avoid touching every component immediately.
- Add `data-theme` to `<html>`.
- Define:

  ```css
  html[data-theme="dark"] .theme-dark { ...current TopDraw dark variables... }
  html[data-theme="light"] .theme-dark { ...TopDraw light variables and primitive overrides... }
  ```

- Convert `.theme-dark .glass-panel`, `.glass-panel-strong`, `.surface-card`, `.btn-primary-glow`, `.btn-ghost-rim`, `.admin-*`, and `.account-*` to variable-driven styles.
- Over time, rename `.theme-dark` to a neutral `.theme-app` or `.topdraw-theme` scope once all assumptions are removed.

Avoid depending on Tailwind `dark:` for most color work. It will create duplicated class strings and make parity harder to maintain.

## 9. Toggle and Provider Strategy

Recommended implementation: custom `ThemeProvider`, not `next-themes` initially.

Reason:

- `next-themes` is not installed.
- The app already has a custom CSS-variable system.
- The first implementation needs tight control over cookies, `data-theme`, system preference, and flash prevention.

Provider responsibilities:

- Supported modes:
  - `dark`
  - `light`
  - `system`

- Store user preference in:
  - Cookie: `topdraw_theme=dark|light|system`, used for SSR/default render.
  - `localStorage`: same value, used for client updates and cross-tab sync.

- Resolve system preference with:
  - `window.matchMedia("(prefers-color-scheme: dark)")`

- Apply resolved theme to:
  - `document.documentElement.dataset.theme = "dark" | "light"`

- Avoid flash of wrong theme:
  - Add a tiny inline script in `app/layout.tsx` before paint to read cookie/localStorage/system and set `data-theme`.
  - Add `suppressHydrationWarning` only on `<html>` if needed, not broadly across components.

- Avoid localStorage loops:
  - Read once on mount.
  - Write only when the user explicitly changes preference.
  - Listen to `storage` events, but do not re-write inside the listener.

Toggle placement:

- Header desktop: compact icon button or small segmented menu near account/basket controls.
- Header mobile drawer: a labelled row under auth actions.
- Account profile/security settings: optional persistent preference control.
- Admin shell: optional compact toggle in sidebar footer, because admins spend long sessions in tables.

Do not show the toggle until light mode passes the high-risk component QA. During early implementation, keep it behind a development-only flag or omit the visible toggle.

## 10. Migration Phases

### Phase 1: Theme Plumbing and Tokens

- Add `ThemeProvider`.
- Add `data-theme` support on `<html>`.
- Add cookie/localStorage/system preference handling.
- Keep dark as default.
- Add light token overrides.
- Do not add visible toggle yet.
- Verify current dark mode is visually unchanged.

### Phase 2: Shared Components

Convert shared primitives first:

- `Button`
- `Input`
- `Dialog`
- `Panel`
- `StatusBadge`
- `EmptyState`
- `WalletPill`
- `MiniCart`
- `.glass-panel`
- `.surface-card`
- `.btn-primary-glow`
- `.btn-ghost-rim`
- `.admin-*`
- `.account-*`

Goal: major surfaces inherit readable color in both themes before page-level work.

### Phase 3: Public Pages

Convert:

- `Header`
- `Footer`
- `HeroCarousel`
- `CompetitionCard`
- `CompetitionDetailClient`
- `EntryQuantitySelector`
- `BundleBuilder`
- `WinnerCard`
- `PrizeDrops`
- `ReviewsMarquee`
- `BundleFAQSection`
- `StaticPages`
- `InfoPage`

Keep selected image-heavy panels dark where needed.

### Phase 4: Account and Admin

Convert:

- `app/account/layout.tsx`
- `app/account/AccountPages.tsx`
- account table/input/panel utilities
- `components/admin/AdminShell.tsx`
- `components/admin/AdminKit.tsx`
- `app/admin/AdminPages.tsx`
- `components/admin/AdminImageUploader.tsx`

Admin should be treated as a dense operations UI, not a marketing surface.

### Phase 5: Visible Toggle

- Add desktop and mobile header controls.
- Add optional account preference control.
- Add optional admin sidebar toggle.
- Confirm no auth/header hydration mismatch.
- Confirm no layout shift.

### Phase 6: Contrast and Accessibility Pass

- Check WCAG contrast for text, buttons, disabled states, form labels, badges, table rows, links, and focus states.
- Verify keyboard focus rings in both modes.
- Verify hover/active/disabled states.
- Verify modals and MiniCart overlay safety.

## 11. What To Avoid

- Do not use global CSS `filter: invert(...)`.
- Do not blindly replace every `text-white` with `text-foreground`.
- Do not make every page pure white.
- Do not remove all background ambience.
- Do not make admin look like a generic white SaaS table.
- Do not change brand colors randomly.
- Do not add a visible toggle before light mode is credible.
- Do not rely on `suppressHydrationWarning` everywhere.
- Do not introduce localStorage event loops.
- Do not alter checkout, basket, auth, account, admin business logic, Supabase, RLS, pricing, draw, allocation, or payment behavior while theming.
- Do not force image overlays to become light; many should remain dark for legibility.

## 12. QA Checklist

Run every check in dark mode, light mode, and system mode.

Viewport matrix:

- Desktop 1440px
- Laptop 1280px
- Mobile 430px
- Mobile 390px

Global:

- Header logged out
- Header logged in customer
- Header logged in admin
- Wallet pill
- MiniCart open/close
- Mobile menu open/close
- Footer links
- No horizontal overflow
- No invisible overlays blocking clicks
- No hydration errors
- No flash of wrong theme on reload

Public:

- `/`
- `/competitions`
- `/competitions/[slug]`
- `/build-a-bundle`
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

Checkout:

- Add from competition detail
- Add from Bundle Builder
- MiniCart update/remove
- Basket page
- Checkout validation
- Discount code field
- Wallet use section
- Checkout success polling view

Auth/account:

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/account`
- `/account/entries`
- `/account/orders`
- `/account/transactions`
- `/account/wallet`
- `/account/profile`
- `/account/security`
- `/account/wins`
- Prize claim dialog
- Verification upload panel
- Account mobile nav

Admin:

- Guard loading state
- Non-admin denied state
- Admin dashboard
- Competitions list
- Competition create/edit
- Image upload/regenerate controls
- Hero banners
- Customers
- Entries
- Orders/payments
- Draws/winners
- Postal entries
- Discount codes
- Reviews
- Wallet settings
- FAQs/guides/content/SEO/email pages
- Admin tables with long content
- Admin dialogs/drawers

Accessibility:

- Keyboard navigation
- Focus rings
- Button contrast
- Link contrast
- Badge contrast
- Input placeholder contrast
- Error/success/warning contrast
- Disabled state clarity

## 13. Recommended First Implementation Prompt

Use this as the first implementation pass:

> Implement Phase 1 of the TopDraw light/dark mode system only. Work only in `~/Desktop/draw-well-done-next`. Do not change business logic, checkout, basket, auth, admin operations, Supabase, schema, RLS, payment, ticket allocation, draw logic, or pricing. Add a custom theme provider with dark/light/system preference, persisted via cookie and localStorage, and set `html[data-theme]` before paint to avoid theme flash. Keep dark mode as the exact default and do not add a visible toggle yet. Add light-mode CSS variable overrides and mode-aware primitive variables, but do not attempt broad component conversion. Verify current dark visuals remain unchanged. Run `npm run build` and `npm run lint`.

After that pass, proceed component-by-component, starting with `Panel`, `Button`, `Input`, `Dialog`, `StatusBadge`, `Header`, `MiniCart`, and `CompetitionCard`.
