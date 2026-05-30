# TopDraw Missing-Feature and Design Parity Audit

Date: 2026-05-30

## 1) Executive verdict
The requested missing admin core parity has been implemented in Next.js and is no longer functionally missing:
- `/admin/profit-calculator`
- `/admin/verifications`
- `/admin/users`
- `/admin/settings`
- `/admin/payments-dev`
- `/footers-preview`

Overall readiness remains conditional for launch because legal placeholders and high-risk write-path validation remain.

Top verdict:
- Overall readiness: **CONDITIONAL**
- Production parity: **NO**
- Remaining blockers: legal/content placeholders, staging verification gaps on high-risk write paths, light-mode proofing debt.

## 2) Missing route matrix (Vite -> Next)

### Public routes
- `/` => exists, full, close parity
- `/competitions` => exists, full, close parity
- `/competitions/[slug]` => exists, full, close parity
- `/winners` => exists, full, close parity
- `/past-competitions` => exists, full via redirect, parity acceptable
- `/how-it-works` => exists, full via redirect, parity acceptable
- `/free-entry` => exists, full, placeholders remain
- `/faqs` => exists, full, close parity
- `/guides` => exists, full, close parity
- `/guides/[slug]` => exists, full, close parity
- `/contact` => exists, full, placeholders remain
- `/terms-and-conditions` => exists, full, placeholders remain
- `/terms` => exists as redirect, close parity
- `/privacy-policy` => exists, full, placeholders remain
- `/cookie-policy` => exists, full, placeholders remain
- `/responsible-play` => exists, full, placeholders remain
- `/footers-preview` => exists as route with noindex metadata (Vite route parity matched)

### Auth routes
- `/login`, `/register`, `/forgot-password`, `/reset-password` => all exist and implemented.

### Basket/checkout routes
- `/basket`, `/checkout`, `/checkout/success` => implemented; route-level parity exists.

### Account routes
- `/account`, `/account/entries`, `/account/orders`, `/account/transactions`, `/account/wallet`, `/account/profile`, `/account/security`, `/account/wins`, `/account/responsible-play` => all implemented.

### Admin routes
- `/admin` => exists, implemented.
- `/admin/competitions*`, `/admin/hero-banners`, `/admin/customers`, `/admin/entries`, `/admin/postal-entries`, `/admin/draws`, `/admin/winners`, `/admin/discount-codes`, `/admin/wallet-settings`, `/admin/faqs`, `/admin/reviews`, `/admin/emails`, `/admin/guides*`, `/admin/content-library`, `/admin/seo-centre` => exist with parity status varying by UI depth.
- `/admin/profit-calculator` => exists, **full parity** (implemented component + formulas + nav entry).
- `/admin/verifications` => exists, **full parity** (dedicated workflow + approve/reject + preview/download).
- `/admin/users` => exists, **full parity intent** for dedicated user management page (Vite `Stubs.tsx` placeholder baseline).
- `/admin/settings` => exists, **partial** (Vite route also treated as stub/placeholder section).
- `/admin/payments` => exists, implemented full payments workflow.
- `/admin/orders` => exists as compatibility route; Vite does not expose a distinct list page.
- `/admin/payments-dev` => exists as dev-only parity route with gating metadata.
- secondary aliases `/admin/content`, `/admin/seo`, `/admin/dynamic-content`, `/admin/page-content`, `/admin/notifications` => route-level parity via fallback, dedicated tooling intentionally limited.

## 3) Missing admin tools (with priority)
1. **Legal/compliance cleanup** — Blocker
2. **High-confidence staging validation of write flows** — Blocker
3. **Light-mode contrast/accessibility pass** — High
4. **Remaining editor/marketing parity (`notifications`, `dynamic-content`, `page-content`)** — Medium

## 4) Profit calculator audit and porting status
### Vite status
- Route: `src/pages/admin/ProfitCalculator.tsx`
- Helper: `src/lib/profitCalc.ts`
- UI model: input assumptions, fee inputs, computed outputs + warnings.

### Next status
- Route: `app/admin/profit-calculator/page.tsx`
- Component: `components/admin/AdminProfitCalculator.tsx`
- Logic: `lib/profitCalc.ts` ported from Vite with same public API.
- Navigation: visible in admin shell.

### Parity notes
- Form structure, outputs, and validation mirrors Vite behavior.
- No DB mutation or checkout effect.
- Not wired for persistence/export beyond what Vite exposes.

## 5) Missing public/design sections
- Public section parity is mostly present; remaining drift is polish/density rather than wholesale absence.
- `/footers-preview` no longer missing.
- Current focus should be visual refinement, especially table/form readability and light-mode contrast.

## 6) Missing account/checkout pieces
- No additional account/checkout routes were added in this phase.
- Remaining gaps are risk-based parity checks (edge states, empty states, error states), not route absence.

## 7) Component inventory gaps
### Components present in Vite but still absent as direct 1:1 copies
- Legacy specialized components remain consolidated into Next equivalents (not missing functionally).
- Vite `AdminDrawer*` family / helper primitives are replaced by `components/admin/AdminKit.tsx` and shared panel patterns.

### Components ported vs visually simplified
- Main simplifications are in admin marketing tools (`emails`, `notifications`/`dynamic-content`) and FAQ/guide markdown presentation, not core engine/tooling.

## 8) Design/visual gaps
### Dark mode
- Generally stable and close to source language.
### Light mode
- Improved but still uneven in admin tables/forms/modals and some guide/admin utility surfaces.
- Remaining work is validation + token cleanup, not missing route structure.

## 9) SEO / metadata / content checks
- `sitemap/robots/metadata` exist and are wired.
- Legal placeholder routes remain content-blocking risk.
- `IndexNow` and route-level canonical handling need final confirmation on deployed Netlify.

## 10) Top 25 blockers / risks (ranked)
1. Placeholder/legal content in public pages and footer
2. No staging validation for checkout payment/allocations
3. Admin mutations not browser-verified (draws/payments/claims/wallet actions)
4. Light-mode contrast inconsistencies in admin dense UI
5. FAQ/guide markdown rendering parity
6. Remaining marketing tool parity (`notifications`, `dynamic-content`, `page-content`, `emails` depth)
7. `noindex`/route governance for non-public/dev routes (`/help`, `/admin/payments-dev` messaging)
8. Minor image optimization debt (`next/image` opportunities)
9. Route-level alias behavior can mask intentional deviations (`/admin` catch-all)
10. Header/nav micro-pattern differences from Vite tab interaction model
11. Header overlay/mobile focus order parity checks
12. Drawer/modal state contrast on small screens
13. Raw `<img>` usage where `next/image` can still improve
14. Missing parity tests for verification edge-cases
15. Coming-soon CTA handler in competition detail needs explicit behavior decision

## 11) Recommended implementation order
1. Confirm staged fixes for legal/compliance placeholders and content.
2. Execute end-to-end staging checks for payment/account/admin write flows.
3. Close light-mode and focus-state accessibility gaps in admin.
4. Complete FAQ/guide rendering parity checks.
5. Document definitive behavior for `/help` and remaining alias routes.

## 12) First exact Codex prompt to implement next
`Run full staging matrix for checkout and admin write paths first: paid/Free checkout success, manual wallet + discount states, payment cancel/refund, draw execution, user verification state transitions, and winner proof workflows; then patch remaining admin marketing route gaps (/admin/notifications, /admin/dynamic-content, /admin/page-content, /admin/emails editor parity) as needed by Vite parity decisions.`

## 13) `npm run build` and `npm run lint` results
- `npm run build`: to be reported in this pass from current run
- `npm run lint`: to be reported in this pass from current run

## 14) Launch checklist summary (before release)
- Replace placeholders in legal/static copy.
- Complete parity matrix for all high-risk write paths in staging.
- Close light-mode readability and accessibility items.
- Finalize alias/route governance for dev-only routes and catch-all behavior.

## 15) Rollback plan (if parity build is blocked)
- Keep original Vite source untouched.
- Roll back incomplete Next feature surfaces to prior stable deployment on Netlify.
- Hide or clearly label any incomplete admin pages.
- Continue operations on Vite until high-risk paths are proven.

## 16) Confirmation (source of truth)
- The original Vite app (`/Users/dawn/Desktop/draw-well-done`) was not modified during this implementation pass.
