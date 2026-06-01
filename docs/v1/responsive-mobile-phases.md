# Responsive / Mobile Roadmap — Cash Control Frontend (v1)

**Stack:** TypeScript · React 19 · Vite · Tailwind CSS · CSS custom properties · Lucide icons  
**Target viewport:** 375 px (iPhone SE baseline) → 768 px (tablet) → 1024 px+ (desktop)  
**Breakpoint boundary:** `768px` (`md`) — below this value the mobile shell applies  
**Reference files:** `src/styles/globals.css` · `src/components/layout/sidebar.tsx` · `src/components/layout/topbar.tsx` · `src/app/layouts/authenticated-layout.tsx`  
**Generated:** 2026-06-01  
**Status legend:** `[x]` = implemented · `[ ]` = pending

---

## Current State Audit

| Area | Desktop | Mobile (375 px) |
|---|---|---|
| App shell | Sidebar 232 px fixed + content grid | Sidebar overflows — content invisible |
| Auth layout | Two-column aside + form | Form hidden behind aside |
| Modal / Dialog | Centered overlay with 40 px padding | Truncated at screen edges |
| `.grid-3` / `.grid-4` | 3–4 columns | Overflows horizontally |
| Transaction filter panel | Always-visible filterbar | Overflows, unusable |
| Transaction table (`.tbl`) | Horizontal scroll implicit | No scroll container, clips |
| Credit card visual | 280 px fixed width | Clips at 375 px |
| `min-h-[44px]` targets | Applied on most CTAs | Already compliant |
| `public/manifest.json` | Boilerplate (CRA sample) | Missing app name/icons |

---

## Implementation Strategy

Each phase is isolated: phases M1–M2 lay the CSS and shell foundations that all subsequent phases depend on. Phases M3–M6 audit individual surfaces in dependency order. Phases M7–M9 harden the result with touch polish, PWA, and QA.

No phase introduces new features — every task is a UI adaptation of already-implemented functionality.

---

## Phase M1 — CSS & Design Token Foundation

**Objective:** Add a single authoritative `768 px` breakpoint to `globals.css`. Establish the mobile layout grid, bottom-nav height token, and responsive overrides for the grid utilities, modal, auth shell, and table wrapper. All other phases depend on this.  
**Dependencies:** None.  
**Complexity:** Low

### Implementation Tasks

**`src/styles/globals.css`**

- [x] Add CSS custom property at the `:root` block:
  ```css
  --mobile-topbar-h: 52px;
  --bottom-nav-h:    56px;
  ```
- [x] Add `@media (max-width: 767px)` block with the following rules:

  **App shell**
  ```css
  .app {
    grid-template-columns: 1fr;
  }
  .content {
    padding: var(--s-4) var(--s-4) calc(var(--s-12) + var(--bottom-nav-h));
  }
  ```

  **Sidebar — off-canvas drawer**
  ```css
  .sidebar {
    position: fixed;
    top: 0; left: 0; bottom: 0;
    width: 280px;
    z-index: 90;
    transform: translateX(-100%);
    transition: transform 220ms cubic-bezier(.4,0,.2,1);
    box-shadow: none;
  }
  .sidebar.open {
    transform: translateX(0);
    box-shadow: var(--shadow-3);
  }
  .sidebar-overlay {
    display: block;
    position: fixed; inset: 0;
    background: var(--overlay);
    z-index: 89;
    animation: fadeIn 160ms ease;
  }
  ```

  **Topbar — hamburger slot**
  ```css
  .topbar {
    padding: 0 var(--s-4);
    height: var(--mobile-topbar-h);
  }
  ```

  **Auth layout**
  ```css
  .auth-shell { grid-template-columns: 1fr; }
  .auth-aside { display: none; }
  .auth-main { padding: 24px 16px; align-items: flex-start; }
  .auth-card { max-width: 100%; }
  ```

  **Modal → bottom sheet**
  ```css
  .modal-back {
    padding: 0;
    align-items: flex-end;
  }
  .modal {
    max-width: 100%;
    max-height: 90svh;
    border-radius: var(--r-6) var(--r-6) 0 0;
    animation: slideUp 200ms cubic-bezier(.4,0,.2,1);
  }
  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  .modal-b { overscroll-behavior: contain; }
  ```

  **Grid utilities — collapse to single column**
  ```css
  .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
  ```

  **Table wrapper — horizontal scroll**
  ```css
  .tbl-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  ```

  **Filterbar — pill row wraps cleanly**
  ```css
  .filterbar { gap: 6px; }
  .filterbar .search { min-width: 0; flex: 1 1 100%; }
  ```

  **Prevent iOS input zoom (font-size < 16 px triggers zoom)**
  ```css
  .input, .select, .textarea { font-size: 16px; }
  ```

  **Global overflow guard**
  ```css
  body { overflow-x: hidden; }
  ```

- [x] Add `@keyframes slideUp` only inside the media query (it is only used for mobile modals).

**`tailwind.config.ts` (or `vite.config.ts` if Tailwind is configured inline)**

- [x] Confirm `theme.screens` mirrors `src/styles/theme/breakpoints.ts`:
  ```ts
  screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' }
  ```
  If not present, add to prevent Tailwind responsive utilities (e.g., `md:grid-cols-3`) from diverging from the custom CSS breakpoint.

### Acceptance Criteria

- [x] At 375 px no horizontal scrollbar appears on any page that contains only the shell (no content yet).
- [x] `.modal` renders as a bottom sheet at 375 px (slides up from bottom, rounded top corners).
- [x] `.auth-shell` renders single-column; `.auth-aside` is hidden.
- [x] `.grid-3` collapses to a single column.
- [x] iOS Safari does not zoom on input focus.

---

## Phase M2 — App Shell: Sidebar Drawer & Mobile Topbar

**Objective:** Convert the always-visible `Sidebar` into an off-canvas drawer triggered by a hamburger button in the `Topbar`. Add a transparent overlay that closes the drawer on tap. The desktop layout is unchanged.  
**Dependencies:** Phase M1.  
**Complexity:** Medium

### Implementation Tasks

**`src/components/layout/sidebar.tsx`**

- [ ] Add `open` and `onClose` props:
  ```tsx
  interface SidebarProps { open: boolean; onClose: () => void }
  export function Sidebar({ open, onClose }: SidebarProps) { … }
  ```
- [ ] Apply `open` to the `<aside>` class: `className={`sidebar${open ? ' open' : ''}`}`.
- [ ] Render the overlay only when `open` is true and only at mobile widths. Use a `useMobileBreakpoint()` hook (see below) to avoid rendering the element on desktop:
  ```tsx
  {isMobile && open && (
    <div className="sidebar-overlay" aria-hidden="true" onClick={onClose} />
  )}
  ```
- [ ] Close the sidebar on nav item click when on mobile:
  ```tsx
  <NavLink … onClick={() => isMobile && onClose()}>
  ```
- [ ] Trap focus inside the sidebar when open (use `useEffect` + `focusTrap` pattern — tab cycles within sidebar, Escape calls `onClose`).

**`src/hooks/use-mobile-breakpoint.ts`** *(new file)*

- [ ] Create a hook that returns `true` when `window.innerWidth < 768`:
  ```ts
  export function useMobileBreakpoint() {
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
    useEffect(() => {
      const mq = window.matchMedia('(max-width: 767px)')
      const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }, [])
    return isMobile
  }
  ```

**`src/components/layout/topbar.tsx`**

- [ ] Add `onMenuClick?: () => void` prop.
- [ ] Render a hamburger `<button>` as the first child inside `.topbar` when the prop is provided:
  ```tsx
  {onMenuClick && (
    <button
      className="btn btn-ghost btn-icon btn-sm"
      onClick={onMenuClick}
      aria-label="Abrir menu"
      aria-expanded={…} // pass boolean from parent
    >
      <Menu size={18} aria-hidden="true" />
    </button>
  )}
  ```
- [ ] The hamburger button is hidden on desktop via CSS:
  ```css
  /* globals.css — inside @media (min-width: 768px) */
  .topbar-menu-btn { display: none; }
  ```

**`src/app/layouts/authenticated-layout.tsx`**

- [ ] Add `sidebarOpen` state (default `false`).
- [ ] Pass `open={sidebarOpen}` and `onClose={() => setSidebarOpen(false)}` to `<Sidebar>`.
- [ ] Pass `onMenuClick={() => setSidebarOpen(true)}` to `<Topbar>`.
- [ ] Close sidebar on route change:
  ```tsx
  const location = useLocation()
  useEffect(() => setSidebarOpen(false), [location.pathname])
  ```
- [ ] Prevent body scroll when sidebar is open on mobile:
  ```tsx
  useEffect(() => {
    if (isMobile && sidebarOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isMobile, sidebarOpen])
  ```

### Acceptance Criteria

- [ ] On desktop (≥ 768 px): sidebar is always visible; hamburger button is not rendered.
- [ ] On mobile (< 768 px): sidebar is hidden; hamburger button appears in topbar.
- [ ] Tapping hamburger opens the sidebar over the content with an overlay.
- [ ] Tapping the overlay or any nav item closes the sidebar.
- [ ] Pressing Escape closes the sidebar and returns focus to the hamburger button.
- [ ] Body scroll is locked while the drawer is open.
- [ ] No layout shift occurs at the 768 px boundary.

---

## Phase M3 — Auth Layout: Single-Column Mobile

**Objective:** The auth pages (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`) must be fully usable at 375 px with the aside hidden. The CSS change in Phase M1 already hides `.auth-aside`; this phase audits and fixes the form card itself.  
**Dependencies:** Phase M1.  
**Complexity:** Low

### Implementation Tasks

**`src/features/auth/pages/login-page.tsx` and `register-page.tsx`**

- [ ] Replace `className="auth-shell"` wrapper with the existing class (no change needed — CSS handles it).
- [ ] Verify the Google OAuth button (`Continuar com Google`) does not overflow at 320 px. The button uses `size="lg"` which is `height: 38px` — check label truncation at minimum width.
- [ ] Add `inputMode="email"` to all email inputs (triggers correct mobile keyboard).
- [ ] Add `inputMode="decimal"` to password length hint if any numeric input is present.

**`src/features/auth/pages/forgot-password-page.tsx` and `reset-password-page.tsx`**

- [ ] Same `inputMode` audit as above.
- [ ] Verify form card does not exceed `100vw - 32px` at 375 px.

**`src/features/auth/pages/verify-email-page.tsx`**

- [ ] Confirm any OTP / code input uses `inputMode="numeric"` and `autocomplete="one-time-code"`.

**`src/features/auth/components/auth-aside.tsx`** *(if it exists as a separate component)*

- [ ] No changes required — hidden via CSS.

### Acceptance Criteria

- [ ] All auth forms are fully visible and scrollable at 375 px with no horizontal overflow.
- [ ] Correct virtual keyboards appear: email keyboard for email fields, numeric for OTP.
- [ ] The Google sign-in button renders without text truncation at 375 px.
- [ ] No auth flow requires horizontal scrolling.

---

## Phase M4 — Modal System: Bottom Sheet Behavior

**Objective:** All modals (`src/components/ui/modal.tsx`) automatically behave as bottom sheets on mobile. The CSS in Phase M1 handles the visual transition; this phase audits scroll behavior and ensures the modal body scrolls independently without moving the page behind it.  
**Dependencies:** Phase M1.  
**Complexity:** Low

### Implementation Tasks

**`src/components/ui/modal.tsx`**

- [ ] Add `data-mobile-sheet` attribute to `.modal-back` to allow targeted CSS without adding class logic.
- [ ] Ensure the `modal-b` div does not set a fixed `overflow: auto` that fights the `max-height: 90svh` clamp. Current code has no explicit overflow on `.modal-b` — confirm and add if needed:
  ```css
  .modal-b { overflow-y: auto; overscroll-behavior: contain; }
  ```
- [ ] Prevent the Escape-key listener from conflicting with mobile back-gesture (no change needed — Escape does not fire on mobile swipe).
- [ ] Lock body scroll when any modal is open (already done via `aria-hidden` on siblings; body lock not needed separately since the overlay covers the page).

**Audit all modal usages for content that will overflow at `90svh`:**

- [ ] `CreateTransactionDialog` — long form (8+ fields): ensure fields are inside `.modal-b` (scrollable) not `.modal-h`.
- [ ] `CreateInstallmentDialog` — same.
- [ ] `AdvanceInstallmentsDialog` — dynamic list of installments: confirm the list is inside `.modal-b`.
- [ ] `CreateRecurrenceDialog` — same audit.
- [ ] Any `wide` modal: on mobile `wide` has no effect (already `max-width: 100%`); confirm no layout breakage.

**`src/styles/globals.css`**

- [ ] Add a drag-handle indicator on mobile modals (visual-only, no JS drag required):
  ```css
  @media (max-width: 767px) {
    .modal::before {
      content: '';
      display: block;
      width: 36px; height: 4px;
      background: var(--border-strong);
      border-radius: 99px;
      margin: 12px auto 0;
      flex-shrink: 0;
    }
    .modal-h { padding-top: 8px; }
  }
  ```

### Acceptance Criteria

- [ ] All modals open as bottom sheets at 375 px — they slide up from the bottom.
- [ ] Long-form modals (create transaction, create installment) are fully scrollable inside the sheet without moving the page.
- [ ] Tapping the overlay closes the sheet (existing behavior).
- [ ] Drag handle is visible at the top of every bottom sheet.
- [ ] No modal content is clipped or inaccessible at 375 px.

---

## Phase M5 — Financial Pages: Responsive Audit

**Objective:** Audit and fix each financial page for mobile usability at 375 px. The focus is on overflow, grid collapse, filter panels, and table views. No feature logic changes.  
**Dependencies:** Phases M1, M2.  
**Complexity:** Medium

---

### Phase M5.1 — Accounts Page

**File:** `src/features/accounts/pages/accounts-page.tsx`

- [ ] Replace `className="grid grid-3 mb-6"` skeleton with `className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"` using Tailwind responsive utilities (removes the custom `.grid-3` dependency on mobile).
- [ ] Apply the same responsive grid class to the live account cards render loop.
- [ ] `DistributionCard` and `RecentTransfersCard` — confirm they use `w-full` and do not set a fixed pixel width.
- [ ] `CreateTransferDialog` — `fromAccountId` and `toAccountId` selects must not overflow at 375 px; verify `width: 100%` on both selects.

**File:** `src/features/accounts/pages/account-detail-page.tsx`

- [ ] The details grid `grid-cols-2 sm:grid-cols-3` already uses Tailwind responsive utilities — no change needed.
- [ ] Verify the action button row (`Editar` / `Ajustar saldo`) wraps correctly at narrow widths using existing `flex-wrap` class.

---

### Phase M5.2 — Transactions Page

**File:** `src/features/transactions/pages/transactions-page.tsx`  
**File:** `src/features/transactions/components/transaction-filter-panel.tsx`

- [ ] Wrap the transaction table in a scroll container:
  ```tsx
  <div className="tbl-wrap">
    <table className="tbl">…</table>
  </div>
  ```
- [ ] Add a `Filtros` toggle button that is visible only on mobile (hidden via `md:hidden`). Tapping it expands/collapses the `TransactionFilterPanel`:
  ```tsx
  const [filtersOpen, setFiltersOpen] = useState(false)
  // On mobile: conditionally render the filter panel
  {(filtersOpen || !isMobile) && <TransactionFilterPanel … />}
  ```
- [ ] Add `md:hidden` class to the mobile filter toggle button and `hidden md:flex` to the inline filter panel so desktop behavior is unchanged.
- [ ] Verify the pagination row (Anterior / Próxima / Página X de Y) wraps on mobile using `flex-wrap`.
- [ ] KPI summary cards above the table (if any) — apply responsive grid class.

**File:** `src/features/transactions/pages/transaction-detail-page.tsx`

- [ ] The details grid already uses `grid-cols-2 sm:grid-cols-3` — confirm no overflow at 375 px.
- [ ] The action button row (`Editar` / `Cancelar` / `Excluir`) must wrap on mobile — add `flex-wrap` if not present.

---

### Phase M5.3 — Credit Cards Page

**File:** `src/features/cards/pages/cards-page.tsx`

- [ ] The card visual carousel uses fixed-width `CreditCardVisual` components (280 px each). Wrap the carousel in a horizontal scroll container with `snap` behavior:
  ```tsx
  <div
    className="flex gap-4 overflow-x-auto pb-2"
    style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
  >
    {cards.map((card) => (
      <div key={card.id} style={{ scrollSnapAlign: 'start', flexShrink: 0 }}>
        <CreditCardVisual … />
      </div>
    ))}
  </div>
  ```
- [ ] On mobile, each `CreditCardVisual` should take `min(280px, calc(100vw - 32px))` width. Add to CSS:
  ```css
  @media (max-width: 767px) {
    .credit-card-visual { width: min(280px, calc(100vw - 32px)); }
  }
  ```
  Apply `credit-card-visual` class to the `<button>` in `CreditCardVisual`.

**File:** `src/features/cards/pages/card-detail-page.tsx`

- [ ] Month navigation row (`‹ 2025-06 ›`) is inside `card-h` which uses `flex` — verify it doesn't overflow at 375 px. If it does, wrap the month selector in `flex-wrap` or reduce label width.
- [ ] Invoice items grid `grid-cols-2 sm:grid-cols-3` — confirm responsive collapse is correct.
- [ ] Spending breakdown rows are flex rows — no change needed.

**File:** `src/features/cards/components/invoice-card.tsx`

- [ ] The summary row uses `row gap-6 flex-wrap` — verify `Valor total` and progress bar stack vertically on mobile.
- [ ] `Lançamentos` list uses `.list-row` — these are flex rows; confirm no overflow at 375 px.

---

### Phase M5.4 — Dashboard Page

**File:** `src/features/dashboard/pages/dashboard-page.tsx`  
**Files:** All components in `src/features/dashboard/components/`

**Overview section**

- [ ] Already uses `sm:grid-cols-2 lg:grid-cols-3` — no change needed.

**Chart sections** (`MonthlyChartSection`, `NetWorthChartSection`, `CategoriesChartSection`, `MonthComparisonSection`)

- [ ] Each `<ResponsiveContainer width="100%" height={280}>` is already responsive in width. Reduce height on mobile:
  ```tsx
  const chartHeight = isMobile ? 200 : 280
  <ResponsiveContainer width="100%" height={chartHeight}>
  ```
- [ ] Date range inputs in `CategoriesChartSection` and `NetWorthChartSection` use inline flex — on mobile they may push each other off-screen. Wrap with `flex-wrap` if not present.
- [ ] Month comparison month pickers — same flex-wrap audit.
- [ ] `LegendFormatter` labels in pie chart may be truncated at 375 px — this is acceptable; the legend below the chart is the primary label.

**Widget sections** (`UpcomingBillsWidget`, `UpcomingInvoicesWidget`, `LargestExpensesWidget`, `RecentTransactionsWidget`)

- [ ] All use `divide-y` list rows — these are block-stacked and already mobile-friendly. No change needed.

**`MonthComparisonSection` summary grid**

- [ ] The per-month summary at the bottom uses a `grid grid-cols-2` layout. At 375 px this is tight (each card ~155 px). Confirm readability; if not readable, switch to `grid-cols-1` on mobile.

---

### Phase M5.5 — Remaining Pages

**Categories (`src/features/categories/`)**

- [ ] `CategoryNode` — each node uses flex row with action buttons. Buttons may overflow on deeply nested nodes. Add `flex-wrap` to the actions container or move buttons to a `…` overflow menu on mobile.
- [ ] `CategoriesPage` header (title + buttons) — add `flex-wrap`.

**Installments (`src/features/installments/`)**

- [ ] `InstallmentsPage` — series list rows; confirm no overflow at 375 px.
- [ ] `AdvanceInstallmentsDialog` — the table of installments to advance should use `.tbl-wrap` for horizontal scroll.

**Recurrences (`src/features/recurrences/`)**

- [ ] `RecurrencesPage` — rule cards are vertical stack; no overflow expected. Audit the pause/resume and delete button row on each card.

**Profile (`src/features/profile/`)**

- [ ] `ProfilePage` uses `max-w-lg space-y-6` — this constrains width correctly. No change needed.
- [ ] `ChangePasswordSection` — confirm form inputs are `w-full`.
- [ ] `ConsentHistorySection` — each consent row is a flex row; the three spans (type / date / status) may be tight at 375 px. Add `flex-wrap` or reduce font-size.

**Roles (`src/features/roles/`)**

- [ ] `RolesPage` pagination — same `flex-wrap` audit as transactions.
- [ ] `RoleDetailPage` — role card header with Edit/Delete buttons: add `flex-wrap`.
- [ ] `RolePermissionsPanel` — assigned permissions list rows have `Remove` button; add `shrink-0` to button (already present) and confirm label truncates gracefully.

---

## Phase M6 — Bottom Navigation Bar

**Objective:** Add a persistent bottom navigation bar visible only on mobile (< 768 px) with the five most-used routes. This replaces tapping the hamburger to navigate and improves one-thumb reachability.  
**Dependencies:** Phase M2.  
**Complexity:** Medium

### Implementation Tasks

**`src/components/layout/bottom-nav.tsx`** *(new file)*

- [ ] Create a `BottomNav` component with the five primary routes:
  ```
  Dashboard · Transações · Contas · Cartões · Configurações
  ```
  Using icons: `Home · List · Wallet · CreditCard · Settings`.
- [ ] Mark the active route with an accent underline (same visual logic as `.nav-item.active`).
- [ ] Add `aria-label="Navegação inferior"` and `role="navigation"` to the container.
- [ ] Use `position: fixed; bottom: 0; left: 0; right: 0; z-index: 80` so it stays above page content.
- [ ] Height = `var(--bottom-nav-h)` (56 px) with `padding-bottom: env(safe-area-inset-bottom)` for iPhone home bar.

**CSS (`globals.css`)**

- [ ] Add `.bottom-nav` base styles (desktop: `display: none`):
  ```css
  .bottom-nav { display: none; }
  @media (max-width: 767px) {
    .bottom-nav {
      display: flex;
      align-items: center;
      justify-content: space-around;
      height: var(--bottom-nav-h);
      background: var(--surface-1);
      border-top: 1px solid var(--border);
      position: fixed;
      bottom: 0; left: 0; right: 0;
      z-index: 80;
      padding-bottom: env(safe-area-inset-bottom);
    }
    .bottom-nav-item {
      display: flex; flex-direction: column; align-items: center;
      gap: 2px; flex: 1;
      padding: 6px 0;
      font-size: 10px; font-weight: 500;
      color: var(--text-dim);
      text-decoration: none;
      border: 0; background: transparent; cursor: pointer;
    }
    .bottom-nav-item.active { color: var(--accent); }
    .bottom-nav-item .ico { width: 20px; height: 20px; }
  }
  ```

**`src/app/layouts/authenticated-layout.tsx`**

- [ ] Import and render `<BottomNav />` after `<main>`:
  ```tsx
  {isMobile && <BottomNav />}
  ```
- [ ] The `.content` padding-bottom already accounts for the bottom nav height (added in Phase M1).

### Acceptance Criteria

- [ ] Bottom nav is visible on mobile and hidden on desktop (≥ 768 px).
- [ ] Active route is highlighted in the bottom nav.
- [ ] Bottom nav does not overlap page content (content area has matching bottom padding).
- [ ] On iPhone with a home bar, the bottom nav is above the system UI (safe-area inset applied).
- [ ] All five links are keyboard/screen-reader accessible.

---

## Phase M7 — Touch Polish & Input Behavior

**Objective:** Remove the 300 ms tap delay, prevent iOS text selection on buttons, add `inputMode` to monetary inputs, and ensure all interactive elements meet the 44×44 px touch target minimum.  
**Dependencies:** Phases M1–M5.  
**Complexity:** Low

### Implementation Tasks

**`src/styles/globals.css`**

- [ ] Add `touch-action: manipulation` to all interactive elements to eliminate the 300 ms delay without requiring a viewport tag change:
  ```css
  button, a, [role="button"] { touch-action: manipulation; }
  ```
- [ ] Prevent iOS text-selection highlight on buttons (it appears as a grey flash on long-press):
  ```css
  button { -webkit-tap-highlight-color: transparent; }
  ```

**Monetary input fields** — audit all `<Input>` usages in forms that accept decimal amounts:

- [ ] Add `inputMode="decimal"` to: `AdjustBalanceDialog`, `CreateAccountDialog` (initial balance), `CreateTransferDialog` (amount), `CreateTransactionDialog` (amount), `CreateInstallmentDialog` (total amount), `CreateRecurrenceDialog` (amount), `PayInvoiceDialog` (amount), `RecordChargeDialog` (amount).
- [ ] These fields already use `type="text"` (to preserve decimal string format) — `inputMode="decimal"` opens the numeric keyboard without changing the input type.

**Touch target audit** — 44×44 px minimum:

- [ ] All `Button` components with `size="sm"` already have `min-h-[44px]` via className. Confirm this is applied in all dialog footers.
- [ ] `CategoryNode` hide/show/archive buttons — confirm `min-h-[44px]` is applied or add it.
- [ ] `BottomNav` items — each item covers `flex: 1` of a 375 px bar → ~75 px wide. Height is 56 px. Both dimensions meet the target.
- [ ] Hamburger button in `Topbar` — `btn-icon` is 32×32 px by default. Add `style={{ width: 44, height: 44 }}` on mobile or increase to `btn-icon-lg` variant.

**Overscroll behavior** — prevent pull-to-refresh on Chrome Android from accidentally triggering on the app's own scroll areas:

- [ ] Add to `globals.css`:
  ```css
  @media (max-width: 767px) {
    .content { overscroll-behavior-y: contain; }
    .sidebar-nav { overscroll-behavior: contain; }
  }
  ```

### Acceptance Criteria

- [ ] No 300 ms tap delay on any interactive element (measured via DevTools touch simulation).
- [ ] Monetary inputs open a decimal keyboard on iOS and Android.
- [ ] All tappable elements have a touch target of at least 44×44 px.
- [ ] Pull-to-refresh does not trigger inside `.content` scroll area.

---

## Phase M8 — PWA Manifest & Viewport Meta Tags

**Objective:** Replace the CRA boilerplate in `public/manifest.json` with correct app metadata so Cash Control can be installed as a PWA on iOS and Android home screens.  
**Dependencies:** None (can run in parallel with M1).  
**Complexity:** Low

### Implementation Tasks

**`public/manifest.json`**

- [ ] Replace entire file with:
  ```json
  {
    "name": "Cash Control",
    "short_name": "Cash",
    "description": "Controle financeiro pessoal",
    "start_url": "/",
    "display": "standalone",
    "orientation": "portrait",
    "theme_color": "#ff6b35",
    "background_color": "#0a0a0b",
    "icons": [
      { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
      { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
    ]
  }
  ```
- [ ] Create placeholder icon files in `public/icons/` (even 1×1 px stubs) to prevent 404s. Replace with final assets before shipping.

**`index.html`**

- [ ] Confirm `<meta name="viewport" content="width=device-width, initial-scale=1">` is present.
- [ ] Add iOS-specific meta tags after the viewport tag:
  ```html
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Cash Control">
  <link rel="apple-touch-icon" href="/icons/icon-192.png">
  ```
- [ ] Set `<meta name="theme-color" content="#ff6b35">` to match the manifest.

### Acceptance Criteria

- [ ] Chrome on Android shows an "Add to Home Screen" banner after two visits.
- [ ] iOS Safari shows the correct app name and icon when added to the home screen.
- [ ] Installed PWA launches in standalone mode (no browser chrome).
- [ ] `theme-color` is applied in the Android status bar.
- [ ] No 404s for icon files.

---

## Phase M9 — Cross-Device QA

**Objective:** Validate every financial flow at three viewport widths with no horizontal overflow, no broken layouts, and no inaccessible interactions. Gate merge to `main`.  
**Dependencies:** Phases M1–M8.  
**Complexity:** Low

### Test Matrix

| Viewport | Device simulation |
|---|---|
| 375 × 667 px | iPhone SE (baseline) |
| 390 × 844 px | iPhone 14 Pro |
| 768 × 1024 px | iPad (breakpoint boundary) |
| 1280 × 800 px | Desktop baseline |

### Implementation Tasks

**Browser DevTools (Chrome)**

- [ ] Open each route at 375 px and confirm:
  - No horizontal scrollbar
  - No content hidden behind bottom nav or topbar
  - All buttons are tappable (visual touch target inspection)
  - All forms are submittable (fill and submit each dialog)

**Flows to validate at 375 px:**

- [ ] Login → Dashboard
- [ ] Create account → account appears in list
- [ ] Create transaction → transaction appears in list
- [ ] Open transaction filter panel → select filters → apply
- [ ] Open transaction detail → view attachments
- [ ] Create installment series
- [ ] Create recurrence rule → pause → resume
- [ ] Create credit card → record charge → view invoice → pay invoice
- [ ] View dashboard — all charts render, all widgets visible
- [ ] Open profile → change display name

**Keyboard navigation at 768 px (tablet):**

- [ ] Tab through all primary flows without mouse
- [ ] All modals/bottom sheets trap focus correctly
- [ ] Escape closes all modals

**Screen reader smoke test (VoiceOver / TalkBack):**

- [ ] Sidebar drawer announced as `navigation` with label "Navegação principal"
- [ ] Bottom nav announced as `navigation` with label "Navegação inferior"
- [ ] All modals announce title via `aria-labelledby`
- [ ] Loading skeletons announce `aria-busy="true"`

### Acceptance Criteria

- [ ] Zero horizontal overflow at 375 px on all financial routes.
- [ ] All dialogs/bottom sheets are fully scrollable and submittable at 375 px.
- [ ] Tablet breakpoint (768 px) shows desktop sidebar correctly.
- [ ] All primary flows completable via keyboard only.
- [ ] No new Lighthouse accessibility regressions vs Phase 11 baseline.

---

## Phase Summary

| Phase | Description | Complexity | Dependencies |
|---|---|---|---|
| **M1** | CSS breakpoints, mobile grid, bottom-sheet modal, auth single-column | Low | — |
| **M2** | Sidebar off-canvas drawer, hamburger in topbar, body scroll lock | Medium | M1 |
| **M3** | Auth pages single-column audit, inputMode, keyboard types | Low | M1 |
| **M4** | Modal bottom-sheet audit, scroll behavior, drag handle | Low | M1 |
| **M5** | Financial pages responsive audit (accounts, transactions, cards, dashboard, rest) | Medium | M1, M2 |
| **M6** | Bottom navigation bar | Medium | M2 |
| **M7** | Touch delay, inputMode on monetary fields, 44 px targets, overscroll | Low | M1–M5 |
| **M8** | PWA manifest, iOS meta tags, theme-color | Low | — |
| **M9** | Cross-device QA, flow validation, screen reader smoke test | Low | M1–M8 |

---

## Critical Invariants

| Invariant | Enforced By |
|---|---|
| Desktop layout is unchanged | All mobile styles are inside `@media (max-width: 767px)` only |
| No feature logic changes | All modifications are CSS + prop-threading only |
| Monetary inputs remain `type="text"` | `inputMode="decimal"` added separately — does not change form submission value |
| Bottom nav does not duplicate sidebar nav logic | `BottomNav` uses `NavLink` with same `ROUTES` constants — single source of truth |
| Safe-area insets applied on bottom nav | `env(safe-area-inset-bottom)` in CSS — no JS required |
| Modal focus trap works on both desktop (centered) and mobile (bottom sheet) | Focus trap logic is position-independent — same `useEffect` handles both |
