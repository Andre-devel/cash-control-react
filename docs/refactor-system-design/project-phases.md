Reference files:
    docs/system-design/styles.css        ← all CSS tokens, utilities, and component styles
    docs/system-design/components.jsx    ← Button, Input, Field, Badge, Modal, IconBubble, etc.
    docs/system-design/screens-auth.jsx  ← Sidebar, Topbar, LoginScreen
    docs/system-design/screens-dashboard.jsx ← Dashboard, KPI, BarChart
    docs/system-design/screens-transactions.jsx ← TransactionsScreen, NewTransactionModal
    docs/system-design/screens-money.jsx ← AccountsScreen, CardsScreen
    docs/system-design/data.jsx          ← shape of mock data (use as type reference only)

  Current stack:
    - React + TypeScript + Vite
    - Tailwind CSS v3 + shadcn/ui
    - CSS custom properties currently use shadcn's HSL format
    - Dark mode currently uses the `.dark` class on <html>

  Target state after all phases:
    - CSS tokens match exactly the Cash Control design system (hex values, NOT HSL)
    - Dark mode uses data-theme="dark" | "light" on <html>
    - Font: Geist + Geist Mono from Google Fonts
    - Tailwind is still present but only used for layout helpers (flex, grid, gap)
      — color/typography/radius utilities are replaced by CSS vars
    - All UI primitives match the design system shapes, spacing, and interaction states
    - Every screen matches its corresponding design screen pixel-for-pixel in structure

  ─────────────────────────────────────────────
  PHASE 1 — Design Tokens & Global CSS
  ─────────────────────────────────────────────
  Goal: Replace the generic shadcn/HSL token set with the Cash Control token set.

  Tasks:
  - [x] Add Geist + Geist Mono to index.html via Google Fonts:
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist
  +Mono:wght@400;500;600&display=swap" rel="stylesheet"/>

  - [x] Replace the entire content of src/styles/globals.css:
        - Remove all Tailwind base/component/utilities @layer blocks that define HSL vars.
        - Add a @layer base block that injects ALL tokens from docs/system-design/styles.css
          into :root and [data-theme="dark"] / [data-theme="light"].
        - Copy verbatim the Base, App shell, Sidebar, Topbar, Buttons, Inputs, Toggle,
          Cards, Badges, Tables, Icon Bubble, Modal, Grid helpers, Page header, Filter bar,
          KPI, Auth, Charts, and all other utility CSS sections from styles.css.
        - Keep @tailwind base/components/utilities at the top so Tailwind utilities still work.

  - [x] Update src/styles/theme/colors.ts to export the Cash Control hex palette
        (--accent #ff6b35, --bg #0a0a0b, --surface-1 #101012 … etc.) so that any
        TypeScript code that references theme tokens still compiles.

  - [x] Replace all remaining files under src/styles/theme/ (typography, spacing, radius,
        shadows) with constants that mirror the design system values:
        - Font: "Geist", "Geist Mono"
        - Spacing: 4pt scale (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)
        - Radius: 4, 6, 8, 10, 12, 16, 9999
        - Shadows: --shadow-1, --shadow-2, --shadow-3, --shadow-pop

  - [x] Update tailwind.config.* to extend colors using the CSS var references
        (e.g. accent: 'var(--accent)') so Tailwind utility classes like text-accent work.

  - [x] Update src/app/providers/ or wherever the theme is toggled so that it sets
        document.documentElement.setAttribute("data-theme", "dark" | "light")
        instead of classList.add/remove("dark").

  Deliverable: The app compiles, runs, and the base background/text/border
  colors already reflect the Cash Control dark theme.

  ─────────────────────────────────────────────
  PHASE 2 — Base Component Library
  ─────────────────────────────────────────────
  Goal: Replace shadcn/ui primitives with the Cash Control design system components.
  Do NOT delete shadcn files yet — create wrappers/replacements alongside them.

  Components to build (all under src/components/ui/):

  - [x] Button (src/components/ui/button.tsx)
        Variants: default | primary | ghost | danger
        Sizes: sm | md | lg | icon
        Props: variant, size, icon, leading, trailing, onClick, disabled, type
        → Match .btn, .btn-primary, .btn-ghost, .btn-danger, .btn-sm, .btn-lg, .btn-icon.

  - [x] Input (src/components/ui/input.tsx)
        Support leading/trailing slots (position: absolute overlays).
        Error state adds .error class.
        → Match .input, .input-group, .leading, .trailing, .with-leading, .with-trailing.

  - [x] PasswordInput (src/components/ui/password-input.tsx)
        Extends Input with eye toggle button.

  - [x] MoneyInput (src/components/ui/money-input.tsx)
        Leading slot shows currency symbol in .currency style, input uses font-mono.

  - [x] Select (src/components/ui/select.tsx)
        Native <select> with .select class + custom chevron background-image.

  - [x] Textarea (src/components/ui/textarea.tsx)
        Native <textarea> with .textarea class, min-height 78px.

  - [x] Field (src/components/ui/field.tsx)
        Wrapper: label, children, hint, error (with alert icon), required asterisk.
        → Match .field, .lbl, .hint, .err.

  - [x] Toggle (src/components/ui/toggle.tsx)
        CSS-only pill toggle. Props: on (boolean), onChange.

  - [x] Badge (src/components/ui/badge.tsx)
        Variants: paid | pending | cancelled | income | expense | info | muted
        dot (boolean, default true), square (boolean).

  - [x] StatusBadge (src/components/ui/status-badge.tsx)
        Renders Badge with kind/label derived from status: PAID | PENDING | CANCELLED.

  - [x] TypeBadge (src/components/ui/type-badge.tsx)
        Renders Badge for: INCOME | EXPENSE | TRANSFER | REFUND | ADJUSTMENT.

  - [x] IconBubble (src/components/ui/icon-bubble.tsx)
        Props: color (hex), icon (ReactNode), size (sm | md | lg | xl), glyph (string).
        Sets --icon-bg and --icon-fg CSS vars inline.

  - [x] Avatar (src/components/ui/avatar.tsx)
        Props: name (initials string), color (optional hex).

  - [x] Modal (src/components/ui/modal.tsx)
        Props: title, subtitle, onClose, children, footer, wide.
        Renders .modal-back > .modal with header, body, footer structure.
        Closes on Escape key and backdrop click.

  - [x] EmptyState (src/components/ui/empty-state.tsx)
        Props: icon, title, desc, action.

  - [x] Money (src/components/ui/money.tsx)
        Renders <span className="mono"> with sym, sign, int (grouped), dec (,XX).
        Props: value (number), currency ("BRL"|"USD"), signed (boolean), muted (boolean).

  - [x] Update src/components/ui/index.ts to export all new components.
  - [x] Update all existing feature components to import from the new primitives
        instead of shadcn.

  Deliverable: shadcn components are no longer imported anywhere in src/features/.
  All UI primitives visually match the design system.

  ─────────────────────────────────────────────
  PHASE 3 — App Shell (Layout, Sidebar, Topbar)
  ─────────────────────────────────────────────
  Goal: Rebuild the main authenticated layout to match the Cash Control shell.

  Tasks:
  - [ ] Create src/app/layouts/authenticated-layout.tsx:
        - Outer <div className="app"> (CSS grid: var(--sidebar-w) 1fr)
        - Left: <Sidebar> component
        - Right: <div className="shell"> containing <Topbar> + <main className="content">

  - [ ] Create src/components/layout/sidebar.tsx:
        - Sections: Geral (Dashboard, Transações, Contas, Cartões),
                    Gestão (Categorias, Parcelamentos, Recorrências),
                    Sistema (Configurações)
        - Each nav item: .nav-item with icon, label, optional badge
        - Active item has .active class + left accent bar via ::before
        - Footer: Avatar + name/email + theme toggle button
        - Read active route from React Router's useLocation()
        - Navigate using useNavigate() (or Link)

  - [ ] Create src/components/layout/topbar.tsx:
        - .topbar with breadcrumb (array of strings, last one is <b>)
        - Right slot: children (notification bell, logout button)

  - [ ] Update src/app/router/ to use AuthenticatedLayout as the parent route wrapper.

  - [ ] Theme toggle must call document.documentElement.setAttribute("data-theme", ...)
        and persist choice in localStorage.

  Deliverable: Every authenticated page renders inside the Cash Control shell.
  Sidebar navigation works. Theme toggle switches between dark and light.

  ─────────────────────────────────────────────
  PHASE 4 — Auth Screens (Login & Register)
  ─────────────────────────────────────────────
  Goal: Rebuild login and register pages to match the two-column auth layout.

  Tasks:
  - [ ] Apply two-column .auth-shell layout to both pages.

  - [ ] Left panel (.auth-aside):
        - Brand logo (gradient square "C" + "Cash Control" name)
        - Radial gradient background (accent orange glow)
        - Pitch text: h2 "Controle total das suas finanças" + subtitle

  - [ ] Right panel (.auth-main):
        - .auth-card with tab switcher (Login / Criar conta) or split pages
        - Email + password Fields using the new Field/Input components
        - Primary Button "Entrar" / "Criar conta"
        - .auth-divider "ou"
        - Ghost button "Continuar com Google" (Google SVG icon)
        - .auth-foot link to the other auth page

  - [ ] Apply to src/features/auth/pages/login-page.tsx
  - [ ] Apply to src/features/auth/pages/register-page.tsx

  Deliverable: Auth pages match the design system layout exactly. All form states
  (error, loading, disabled) use the new Field/Input/Button components.

  ─────────────────────────────────────────────
  PHASE 5 — Dashboard Page
  ─────────────────────────────────────────────
  Goal: Rebuild the dashboard to match screens-dashboard.jsx.

  Tasks:
  - [ ] Page header (.page-h): title "Olá, {name}", subtitle with month,
        period tabs (7d / 30d / Mês / Ano), Export button, "Nova transação" primary button.

  - [ ] KPI row (.grid.grid-4): four .kpi cards:
        - Patrimônio total (wallet icon, total balance, delta)
        - Receitas do mês (arrowDown icon, green toned)
        - Despesas do mês (arrowUp icon, red toned)
        - Saldo do mês (chart icon, signed, green if positive)

  - [ ] Main row (grid 1.65fr 1fr):
        - Left: Bar chart card "Receitas vs Despesas"
          (SVG, last 6 months, income=green bars, expense=red bars, gridlines, axis labels, legend)
        - Right: "Próximos lançamentos" card
          (upcoming bills list: IconBubble + title/date + amount + StatusBadge)

  - [ ] Bottom row (grid 1fr 1.4fr):
        - Left: "Faturas em aberto" card (credit card invoices)
        - Right: "Transações recentes" card (last 5 transactions)

  - [ ] Wire to real data via existing hooks.
  - [ ] Show loading skeleton (pulse animation) while data is fetching.

  Deliverable: Dashboard renders with real data in the Cash Control visual style.

  ─────────────────────────────────────────────
  PHASE 6 — Transactions Page & Modal
  ─────────────────────────────────────────────
  Goal: Rebuild transactions screen to match screens-transactions.jsx.

  Tasks:
  - [ ] Page header (.page-h): title "Transações", count + date range subtitle,
        Export button, "Nova transação" primary button.

  - [ ] Filter bar (.filterbar):
        - Search input with magnifier icon (flex: 1, min-width 220px)
        - Period chip (calendar icon + date range)
        - Type chip (all | income | expense | transfer)
        - Status chip (all | paid | pending | cancelled)
        - Account chip and Category chip (dropdowns)
        - Clear filters ghost button

  - [ ] Transactions table (.tbl):
        Columns: Description | Account | Category | Date | Amount | Status | Actions
        - Description cell: IconBubble (category color) + title + subtitle
        - Amount: Money component, colored by type (income=green, expense=red)
        - Status: StatusBadge | Type: TypeBadge
        - Actions: edit + delete ghost icon buttons (show on row hover)
        - Group rows by date with sticky date headers

  - [ ] NewTransactionModal (.modal):
        - Fields: Description, Amount (MoneyInput), Type (Select), Account (Select),
          Category (Select), Date (DateInput), Due date, Status, Notes (Textarea)
        - .grid.grid-2 two-column layout for fields
        - Footer: Cancel button + Save primary button

  Deliverable: Transactions page with working filters and create/edit/delete flows.

  ─────────────────────────────────────────────
  PHASE 7 — Accounts Page
  ─────────────────────────────────────────────
  Goal: Rebuild accounts page to match AccountsScreen in screens-money.jsx.

  Tasks:
  - [ ] Page header: title "Contas", count + total balance subtitle,
        "Transferir" button (arrowLR icon), "Nova conta" primary button.

  - [ ] Account cards grid (.grid.grid-3):
        - Each card: IconBubble colored + account name + type badge
        - Body: large Geist Mono balance
        - Footer: last transaction date + "Ver detalhes" link
        - Last card: "+" new account placeholder

  - [ ] Bottom row (grid 1.4fr 1fr):
        - Left card: "Distribuição por tipo" — SVG donut chart + legend list
          (type label, percentage, amount)
        - Right card: "Transferências recentes" — list of transfers

  Deliverable: Accounts page matches design system structure.

  ─────────────────────────────────────────────
  PHASE 8 — Credit Cards Page
  ─────────────────────────────────────────────
  Goal: Rebuild cards page to match CardsScreen in screens-money.jsx.

  Tasks:
  - [ ] Page header: title "Cartões de crédito", count subtitle,
        "Nova fatura" + "Novo cartão" buttons.

  - [ ] Cards grid (.grid.grid-3):
        - Gradient background using card color
        - Card name, last 4 digits, network logo area
        - Current invoice amount (large mono)
        - Limit bar (used/total)
        - Due date badge
        - "Pagar fatura" + "Ver detalhes" actions

  - [ ] Bottom: invoices table — card name, due date, amount, status, pay action.

  Deliverable: Cards page matches design system.

  ─────────────────────────────────────────────
  PHASE 9 — Remaining Feature Screens
  ─────────────────────────────────────────────
  Goal: Apply the design system to Categories, Installments, and Recurrences pages.
  These pages already have logic — only restyle them.

  For each page:
  - [ ] Replace page wrapper with .page-h header pattern (title, desc, action buttons).
  - [ ] Replace list/table containers with .card + .tbl or .card + .card-b patterns.
  - [ ] Replace all modal dialogs with the new Modal component.
  - [ ] Replace all form fields with Field / Input / Select / Textarea components.
  - [ ] Apply IconBubble to category/recurrence icons.
  - [ ] Apply StatusBadge / TypeBadge wherever applicable.

  Pages:
  - [ ] src/features/categories/pages/   → tree of categories with color + icon + rule count
  - [ ] src/features/installments/pages/ → installment series cards (.grid.grid-3) + detail modal
  - [ ] src/features/recurrences/pages/  → recurrence cards (.grid.grid-3) + detail modal

  Deliverable: All pages share a visually consistent look matching the design system.

  ─────────────────────────────────────────────
  PHASE 10 — Cleanup & Consistency Pass
  ─────────────────────────────────────────────
  Goal: Remove dead code and enforce consistency.

  Tasks:
  - [ ] Delete all shadcn component files that are no longer imported.
  - [ ] Remove any remaining hardcoded hex colors or Tailwind color utilities
        (bg-blue-500, text-gray-400, etc.) — replace with CSS var equivalents.
  - [ ] Audit every page for:
        - [ ] Consistent use of .page-h for page headers
        - [ ] Consistent .card / .card-h / .card-b structure for surfaces
        - [ ] Consistent .tbl for all tabular data
        - [ ] All monetary values using the Money component
        - [ ] All status values using StatusBadge
  - [ ] Verify dark/light theme toggle works on every page without layout breaks.
  - [ ] Run the full test suite and fix any snapshot or style regressions.

  Deliverable: Clean, consistent codebase. No shadcn remnants. All screens pass
  the design review against docs/system-design/.

  ─────────────────────────────────────────────
  GENERAL RULES (apply to all phases)
  ─────────────────────────────────────────────
  - [ ] Read the relevant docs/system-design/*.jsx and styles.css sections before
        implementing each phase — do not rely on memory.
  - [ ] Copy class names and token names verbatim from the design system.
  - [ ] Never invent new CSS classes; use what is in styles.css.
  - [ ] Do not add Tailwind color classes where a CSS var is available.
  - [ ] Preserve all existing TypeScript types, API hooks, and business logic.
  - [ ] Only restyle — do not change data fetching, routing, or state management
        unless the phase explicitly requires it.
  - [ ] After each phase, start the dev server and visually verify the affected
        screens before marking the phase complete.