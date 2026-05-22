# TopDraw Next.js Migration Audit

## Source

- Current Vite app: `/Users/danny/Desktop/draw-well-done`
- Parallel Next.js app: `/Users/danny/Desktop/draw-well-done-next`
- Source app was audited read-only before implementation.

## Current Vite Route Map

Public:

- `/`
- `/competitions`
- `/competitions/:slug`
- `/winners`
- `/past-competitions` -> `/competitions?tab=ended`
- `/how-it-works` -> `/faqs`
- `/free-entry`
- `/footers-preview`
- `/faqs`
- `/guides`
- `/guides/:slug`
- `/contact`
- `/terms-and-conditions`
- `/terms` -> `/terms-and-conditions`
- `/privacy-policy`
- `/cookie-policy`
- `/responsible-play`
- `/basket`
- `/checkout`
- `/checkout/success`
- `/build-a-bundle`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`

Account:

- `/account`
- `/account/entries`
- `/account/orders`
- `/account/transactions`
- `/account/wins`
- `/account/wallet`
- `/account/profile`
- `/account/security`
- `/account/responsible-play`

Admin:

- `/admin`
- `/admin/profit-calculator`
- `/admin/competitions`
- `/admin/competitions/new`
- `/admin/competitions/:id`
- `/admin/entries`
- `/admin/postal-entries`
- `/admin/draws`
- `/admin/winners`
- `/admin/payments-dev`
- `/admin/users`
- `/admin/payments`
- `/admin/customers`
- `/admin/verifications`
- `/admin/discount-codes`
- `/admin/wallet-settings`
- `/admin/faqs`
- `/admin/reviews`
- `/admin/notifications`
- `/admin/hero-banners`
- `/admin/content`
- `/admin/dynamic-content`
- `/admin/page-content`
- `/admin/seo`
- `/admin/emails`
- `/admin/guides`
- `/admin/guides/new`
- `/admin/guides/:id`
- `/admin/settings`

## Public Route Priority

Phase 1 exact/close port:

- `/`
- `/competitions`
- `/competitions/[slug]`
- `/winners`
- `/faqs`
- `/help` redirects to `/faqs`
- `/guides`
- `/guides/[slug]`
- `/free-entry`
- `/contact`
- `/terms-and-conditions`
- `/privacy-policy`
- `/cookie-policy`
- `/responsible-play`
- `/terms` redirect
- `/past-competitions` redirect
- `/how-it-works` redirect

Phase 1 placeholder:

- `/basket`
- `/checkout`
- `/checkout/success`
- `/build-a-bundle`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/account`
- `/account/*`
- `/admin`
- `/admin/*`

Phase 2:

- checkout, basket persistence, auth, account, wallet, admin, notification capture, Klaviyo/Resend/Stripe workflows.

## Component Reuse Plan

Copied/adapted directly:

- Public layout styling, `Header`, `Footer`, `HeroCarousel`, `FeaturedCompetitionsCarousel`, `CompetitionCard`, `ReviewsMarquee`, `PrizeDrops`, `BundleFAQSection`, `CategoryTabs`, `WinnerCard`, countdown/progress UI, format/image helpers.

Changed for Next:

- `react-router-dom` links became `next/link`.
- Vite `SEO`/`Helmet` became Next metadata and JSON-LD script tags.
- Interactive pieces use `"use client"`.
- Account/basket/admin controls preserve visual route compatibility but do not implement business logic.

## Client/Server Boundary Plan

Server components:

- `app/layout.tsx`
- homepage data shell
- competitions listing data shell
- competition detail data shell and metadata
- winners data shell
- guides data shell
- static/legal pages

Client components:

- header/mobile menu/scroll state
- hero countdown
- featured carousel strip
- competition card countdown/notify placeholder
- PrizeDrops tabs
- FAQ search/category/accordion
- Bundle FAQ accordion

Mixed:

- competition detail fetches public data server-side and renders client countdown/accordion primitives.

## Styling Parity Plan

- Copied `tailwind.config.ts`.
- Copied Vite `src/index.css` to `app/globals.css`.
- Preserved `.theme-dark`, CSS variables, Designer font-face, utility classes, gradients, glows, shadows, glass panels, button classes, home background layers, marquee animation and responsive breakpoints.
- Copied `Designer.otf`.
- Preserved Google font family usage via layout stylesheet link.
- Kept `img`/`picture` for image crop parity and Supabase remote URL stability.

## Data Parity Plan

Public Supabase reads use anon env only:

- `competitions`: public listing/detail/hero/card fields.
- `hero_banners`: audited; Phase 1 fallback hero is implemented, dynamic banner fetch remains a follow-up.
- `reviews`: public marquee.
- `winners`: public winners page.
- `faq_items`: help centre.
- `guides`: guides index/detail.
- `competition_discount_tiers`: audited for detail pricing; full quantity selector is Phase 2.
- `dynamic_content_sections`: audited for detail marquee; not fully ported in Phase 1.

## Image Parity Plan

- Local hero assets copied to `/public/media`.
- Logo copied to `/public/assets/topdraw-logo.png`.
- Guide covers copied to `/public/guide-covers`.
- Cards use `image_card_url`, then `main_image_url`, then `image_original_url`.
- Detail uses `image_detail_url`, then `main_image_url`, then `image_original_url`, then `image_card_url`.
- Thumbnails use `image_thumb_url`, then card/main/original.
- Remote Supabase images are rendered as direct `<img>` URLs to avoid transformation or Netlify image differences.

## Risks

- Hero dynamic `hero_banners` table is audited but not fully wired in this first pass; fallback PlayStation hero matches the source fallback.
- Featured carousel is visually close but implemented as a horizontal scroll strip rather than full Embla autoplay.
- Account, basket, checkout, admin and auth are placeholders.
- Detail page keeps visual/detail parity but does not implement real basket quantity or checkout actions.
- Legal/static text is abbreviated versus the full source legal content.
- Build emits warnings for deliberate `<img>` usage and Google font optimization.
- Netlify requires installing `@netlify/plugin-nextjs` or using the platform's current Next support.
