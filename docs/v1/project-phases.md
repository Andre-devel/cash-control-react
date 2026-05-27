# Implementation Roadmap — Cash Control Frontend (v1)

**Stack:** TypeScript · React 19 · Vite · React Router · Tailwind CSS · Shadcn/ui · Zustand · TanStack Query · Axios · Zod · React Hook Form · Sonner  
**Architecture:** Stateless JWT · Feature-based · RBAC-ready · Mobile-first  
**Auth API spec:** `docs/swagger.json`  
**Financial API spec:** `docs/v1/frontend-api-guide.md`  
**Generated:** 2026-05-27  
**Status legend:** `[x]` = implemented · `[ ]` = pending

---

## Codebase Inspection Summary

| Area | Status |
|---|---|
| Build files | `[x]` Vite + TypeScript — `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json` |
| Application entry point | `[x]` `src/main.tsx` — TypeScript, strict mode, React 19 |
| Code quality tooling | `[x]` ESLint, Prettier, Husky + lint-staged, `.env.example` |
| Design system | `[x]` Tailwind CSS + Shadcn/ui + design tokens + dark mode |
| Routing scaffold | `[x]` React Router v6, lazy loading, public/protected layout split |
| State & API layer | `[x]` Zustand auth store, Axios HTTP client with interceptors, TanStack Query |
| Auth feature | `[x]` Login, register, logout, session restoration, 401 interceptor |
| Route protection | `[x]` `AuthGuard`, RBAC-ready `RoleGuard` |
| Notifications & errors | `[x]` Sonner toast wrapper, Error Boundaries, structured logger |
| Test infrastructure | `[x]` Vitest + MSW + React Testing Library — auth flows covered |
| Financial features | `[ ]` Accounts, transactions, installments, recurrences, categories, cards, dashboard |
| CI/CD pipeline | `[ ]` Not configured |

**Overall status:** Auth template foundation complete. Financial feature implementation starts Phase 1 of this roadmap.

---

## Implementation Strategy

The auth template foundation (tooling, design system, routing, state/API layer, auth flows, route protection, notifications, error handling, and test infrastructure) is already in place and fully tested.

This roadmap builds the financial product on top of that foundation. The ordering respects data dependencies: the folder structure and routes must be extended before any feature is built; categories must exist before transactions (transactions reference categories); accounts must exist before transactions (transactions reference accounts); all domain features must land before the dashboard aggregates them.

Each feature phase follows the same internal structure: API service layer → Zod schemas → TanStack Query hooks → pages and components → integration tests.

---

## Phase 1 — Feature Folder Expansion & Route Configuration

**Objective:** Extend the existing feature-based folder structure with all Cash Control financial feature modules and register their routes in the React Router configuration with lazy loading.  
**Dependencies:** Auth template (routing scaffold, auth guards).  
**Complexity:** Low

### Phase 1.1 — Folder Structure Expansion

**Implementation Tasks:**
- [x] Create feature directories under `src/features/`:
  ```
  features/accounts/     api/  components/  hooks/  pages/  schemas/  types/
  features/transactions/ api/  components/  hooks/  pages/  schemas/  types/
  features/installments/ api/  components/  hooks/  pages/  schemas/  types/
  features/recurrences/  api/  components/  hooks/  pages/  schemas/  types/
  features/categories/   api/  components/  hooks/  pages/  schemas/  types/
  features/cards/        api/  components/  hooks/  pages/  schemas/  types/
  features/dashboard/    api/  components/  hooks/  pages/  types/
  features/profile/      api/  components/  hooks/  pages/  schemas/  types/
  ```
- [x] Add barrel `index.ts` files at each public module boundary
- [x] Extend `src/app/router/routes.ts` with all new route constants:
  - `/dashboard` — Dashboard overview
  - `/accounts` — Account list
  - `/accounts/:id` — Account detail
  - `/transactions` — Transaction list
  - `/transactions/:id` — Transaction detail
  - `/installments` — Installment series list
  - `/recurrences` — Recurrence rules list
  - `/categories` — Category management
  - `/cards` — Credit card list
  - `/cards/:id` — Card detail + invoice view
  - `/profile` — User profile

**Acceptance Criteria:**
- [x] All path alias imports (`@/features/accounts/...`) resolve without errors
- [x] No circular imports between feature modules
- [x] TypeScript compilation passes with zero errors after folder addition

**Automated Tests:**
- [x] TypeScript compilation validates all new import paths

---

### Phase 1.2 — Route Registration & Lazy Loading

**Implementation Tasks:**
- [x] Register all new routes in `createBrowserRouter` wrapped in `AuthGuard`
- [x] Lazy-load all route-level pages via `React.lazy` + `Suspense`:
  ```tsx
  const AccountsPage = lazy(() => import('@/features/accounts/pages/accounts-page'))
  const TransactionsPage = lazy(() => import('@/features/transactions/pages/transactions-page'))
  // ...
  ```
- [x] Add `<Suspense fallback={<PageSkeleton />}>` at the protected layout level

**Acceptance Criteria:**
- [x] Network tab shows each feature route loading as a separate code-split chunk
- [x] Navigating to any new route renders a loading skeleton, then the page
- [x] Unauthenticated access to any new route redirects to `/login`

**Automated Tests:**
- [x] Route rendering smoke test: each new route renders its page component without crashing

---

## Phase 2 — User Profile Feature

**Objective:** Implement the profile view, update, and consent history flows. Covers US-1.1, US-1.2, US-1.3.  
**Dependencies:** Phase 1.  
**Complexity:** Low

### Phase 2.1 — Profile API & Hooks

**Implementation Tasks:**
- [x] Create `src/features/profile/api/profile.api.ts`:
  - `GET /api/v1/users/me` → `getProfile()`
  - `PUT /api/v1/users/me` → `updateProfile(data)`
  - `GET /api/v1/users/me/consents` → `getConsentHistory()`
- [x] Create `src/features/profile/schemas/update-profile.schema.ts` (Zod: `displayName`)
- [x] Create `src/features/profile/hooks/use-profile.ts` (TanStack Query — `useQuery`)
- [x] Create `src/features/profile/hooks/use-update-profile.ts` (TanStack Query — `useMutation`)

**Acceptance Criteria:**
- [x] `useProfile` returns the authenticated user's profile data
- [x] `useUpdateProfile` invalidates the profile query cache on success

---

### Phase 2.2 — Profile Pages & Components

**Implementation Tasks:**
- [x] Build `ProfilePage` with:
  - Pre-populated form (`displayName`) using React Hook Form + Zod resolver
  - Loading skeleton while fetching
  - Submit button loading/disabled state
  - Success toast on update
  - Inline validation errors
- [x] Build `ConsentHistorySection` listing consent records from `GET /api/v1/users/me/consents`
- [x] Add profile navigation entry to the protected layout sidebar/header

**Acceptance Criteria:**
- [x] Form pre-populates with current `displayName` on load
- [x] Successful update shows a toast and reflects the new name without page reload
- [x] Consent history renders a list or empty state

**Automated Tests:**
- [x] Unit: `update-profile.schema` rejects empty `displayName`
- [x] Integration: profile form → submit → toast rendered, cache invalidated

---

## Phase 3 — Accounts Feature

**Objective:** Implement full account management: create, list, edit, delete, archive/unarchive, manual balance adjustment, and inter-account transfers. Covers US-2.1 through US-2.8.  
**Dependencies:** Phase 1.  
**Complexity:** Medium

### Phase 3.1 — Accounts API & Hooks

**Implementation Tasks:**
- [ ] Create `src/features/accounts/api/accounts.api.ts`:
  - `POST /api/v1/accounts` → `createAccount(data)`
  - `GET /api/v1/accounts` → `listAccounts(params)`
  - `GET /api/v1/accounts/{id}` → `getAccount(id)`
  - `PUT /api/v1/accounts/{id}` → `updateAccount(id, data)`
  - `DELETE /api/v1/accounts/{id}` → `deleteAccount(id)`
  - `POST /api/v1/accounts/{id}/archive` → `archiveAccount(id)`
  - `POST /api/v1/accounts/{id}/unarchive` → `unarchiveAccount(id)`
  - `POST /api/v1/accounts/{id}/adjust` → `adjustBalance(id, data)`
  - `POST /api/v1/accounts/transfers` → `createTransfer(data)`
  - `DELETE /api/v1/accounts/transfers/{groupId}` → `deleteTransfer(groupId)`
- [ ] Create Zod schemas:
  - `create-account.schema.ts` — `name`, `type` (enum: `CHECKING | SAVINGS | CASH | INVESTMENT | CREDIT | OTHER`), `currency`, `balance` (decimal string), `color`, `icon`
  - `update-account.schema.ts`
  - `adjust-balance.schema.ts` — `targetBalance` (decimal string), optional `note`
  - `create-transfer.schema.ts` — `fromAccountId`, `toAccountId` (must differ), `amount` (decimal string), `date`, `description`
- [ ] Create hooks: `use-accounts.ts`, `use-account.ts`, `use-create-account.ts`, `use-update-account.ts`, `use-delete-account.ts`, `use-archive-account.ts`, `use-unarchive-account.ts`, `use-adjust-balance.ts`, `use-create-transfer.ts`, `use-delete-transfer.ts`

**Acceptance Criteria:**
- [ ] All hooks use the centralized Axios instance (never raw `fetch`)
- [ ] All mutation hooks invalidate `['accounts']` query key on success
- [ ] `create-transfer.schema` rejects when `fromAccountId === toAccountId`
- [ ] All balance/amount fields validated as decimal strings

---

### Phase 3.2 — Accounts Pages & Components

**Implementation Tasks:**
- [ ] Build `AccountsPage`:
  - Account card grid (name, type, balance, currency, color, icon)
  - Loading skeleton
  - Empty state with CTA to create first account
  - Toggle to show/hide archived accounts
- [ ] Build `AccountDetailPage` with account info and filtered transaction list
- [ ] Build `CreateAccountDialog` / `EditAccountDialog` (React Hook Form + Zod)
- [ ] Build `DeleteAccountDialog` with confirmation and `409 CONFLICT` error handling
- [ ] Build `ArchiveAccountDialog` with confirmation
- [ ] Build `AdjustBalanceDialog` (decimal string target balance input)
- [ ] Build `CreateTransferDialog` (source account, destination account, amount, date)

**Acceptance Criteria:**
- [ ] Creating an account updates the list without page reload
- [ ] Archiving removes it from the default view; unarchiving restores it
- [ ] Delete with linked transactions shows an explanatory error suggesting archive
- [ ] Transfer form disables selecting the same account as source and destination

**Automated Tests:**
- [ ] Unit: `create-account.schema` rejects non-decimal amount and invalid type enum
- [ ] Unit: `create-transfer.schema` rejects same-account transfer
- [ ] Integration: create account → appears in list → archive → disappears from default view

---

## Phase 4 — Categories Feature

**Objective:** Implement category management with hierarchy, hide/show, archive/unarchive, auto-suggestion, and auto-categorization rules. Must precede the Transactions phase. Covers US-6.1 through US-6.7.  
**Dependencies:** Phase 1.  
**Complexity:** Medium

### Phase 4.1 — Categories API & Hooks

**Implementation Tasks:**
- [ ] Create `src/features/categories/api/categories.api.ts`:
  - `POST /api/v1/categories` → `createCategory(data)`
  - `GET /api/v1/categories` → `listCategories(params)`
  - `PUT /api/v1/categories/{id}` → `updateCategory(id, data)`
  - `POST /api/v1/categories/{id}/hide` → `hideCategory(id)`
  - `POST /api/v1/categories/{id}/show` → `showCategory(id)`
  - `POST /api/v1/categories/{id}/archive` → `archiveCategory(id)`
  - `POST /api/v1/categories/{id}/unarchive` → `unarchiveCategory(id)`
  - `GET /api/v1/categories/suggest` → `suggestCategory(description)`
  - `POST /api/v1/categories/rules` → `createCategorizationRule(data)`
  - `GET /api/v1/categories/rules` → `listCategorizationRules()`
  - `DELETE /api/v1/categories/rules/{id}` → `deleteCategorizationRule(id)`
- [ ] Create Zod schemas:
  - `create-category.schema.ts` — `name`, `color`, `icon`, `type`, optional `parentId`
  - `create-categorization-rule.schema.ts` — `pattern`, `categoryId`
- [ ] Create hooks: `use-categories.ts`, `use-create-category.ts`, `use-update-category.ts`, `use-suggest-category.ts`, `use-categorization-rules.ts`

**Acceptance Criteria:**
- [ ] `listCategories` returns data that can be assembled into a tree via `parentId`
- [ ] `suggestCategory` is called with debounce to avoid excessive API requests
- [ ] All mutation hooks invalidate `['categories']` query key on success

---

### Phase 4.2 — Categories Pages & Components

**Implementation Tasks:**
- [ ] Build `CategoriesPage` with hierarchical tree view and toggles for hidden/archived
- [ ] Build `CreateCategoryDialog` / `EditCategoryDialog` with parent category selector
- [ ] Build `CategoryPickerCombobox` — reusable picker component with search and auto-suggest integration, used in transaction and installment forms
- [ ] Build `CategorizationRulesSection` listing rules with delete confirmation

**Acceptance Criteria:**
- [ ] Category tree renders parent/child hierarchy correctly
- [ ] `CategoryPickerCombobox` triggers debounced `suggestCategory` when a description prop changes
- [ ] Hidden categories are excluded from `CategoryPickerCombobox` by default

**Automated Tests:**
- [ ] Unit: `create-category.schema` rejects empty name
- [ ] Integration: create category → appears in tree → hide → hidden from picker

---

## Phase 5 — Transactions Feature

**Objective:** Implement full transaction management: create, list with rich filters, edit, delete, mark as paid, cancel, and attachment management. Covers US-3.1 through US-3.7.  
**Dependencies:** Phase 3 (accounts), Phase 4 (categories).  
**Complexity:** High

### Phase 5.1 — Transactions API & Hooks

**Implementation Tasks:**
- [ ] Create `src/features/transactions/api/transactions.api.ts`:
  - `POST /api/v1/transactions` → `createTransaction(data)`
  - `GET /api/v1/transactions` → `listTransactions(filters, pageable)`
  - `GET /api/v1/transactions/{id}` → `getTransaction(id)`
  - `PUT /api/v1/transactions/{id}` → `updateTransaction(id, data)`
  - `DELETE /api/v1/transactions/{id}` → `deleteTransaction(id)`
  - `POST /api/v1/transactions/{id}/pay` → `payTransaction(id)`
  - `POST /api/v1/transactions/{id}/cancel` → `cancelTransaction(id)`
  - `POST /api/v1/transactions/{id}/attachments` → `uploadAttachment(id, file)`
  - `GET /api/v1/transactions/{id}/attachments` → `listAttachments(id)`
  - `DELETE /api/v1/transactions/{id}/attachments/{attachmentId}` → `deleteAttachment(id, attachmentId)`
- [ ] Create Zod schemas:
  - `create-transaction.schema.ts` — `description`, `amount` (decimal string), `type` (enum: `INCOME | EXPENSE | REFUND | ADJUSTMENT`), `accountId`, `categoryId`, `competenceDate`, `status`
  - `update-transaction.schema.ts`
  - `transaction-filters.schema.ts` — all filter parameters typed and optional
- [ ] Create hooks: `use-transactions.ts` (paginated list), `use-transaction.ts`, `use-create-transaction.ts`, `use-update-transaction.ts`, `use-delete-transaction.ts`, `use-pay-transaction.ts`, `use-cancel-transaction.ts`, `use-attachments.ts`, `use-upload-attachment.ts`, `use-delete-attachment.ts`

**Acceptance Criteria:**
- [ ] Paginated response shape `{ content, totalElements, totalPages, number, size }` is typed
- [ ] `amount` is validated and submitted as decimal string at all times
- [ ] Mutations invalidate both `['transactions']` and `['accounts']` on success

---

### Phase 5.2 — Transactions Pages & Components

**Implementation Tasks:**
- [ ] Build `TransactionsPage`:
  - Transaction list (description, type, amount, category, account, date, status)
  - Filter panel: account, type, status, category, date range, amount range, search text
  - `includeCancelled` toggle
  - Pagination controls
  - Loading skeleton
  - Empty state per filter combination
  - Active filters reflected in URL query string for shareable links
- [ ] Build `TransactionDetailPage` with full info and attachments section
- [ ] Build `CreateTransactionDialog` / `EditTransactionDialog`:
  - React Hook Form + Zod
  - `CategoryPickerCombobox` auto-suggest wired to description field
  - Account selector
  - Decimal string amount input
- [ ] Build `DeleteTransactionDialog`, `PayTransactionButton`, `CancelTransactionDialog`
- [ ] Build `AttachmentSection` — upload with progress, list, and delete per attachment
- [ ] Visually distinguish transaction type (`INCOME` / `EXPENSE` / etc.) and status (`PENDING` / `PAID` / `CANCELLED`)

**Acceptance Criteria:**
- [ ] Filters update the URL query string; page refresh restores the same filter state
- [ ] Auto-suggest triggers on description change in the transaction form
- [ ] Upload shows progress; completion re-fetches the attachment list
- [ ] `CANCELLED` transactions hidden by default; shown via `includeCancelled` toggle

**Automated Tests:**
- [ ] Unit: `create-transaction.schema` rejects non-decimal amount and invalid type enum
- [ ] Unit: `transaction-filters.schema` accepts all combinations of optional filters
- [ ] Integration: create transaction → appears in list → pay → status updates to `PAID`

---

## Phase 6 — Installments Feature

**Objective:** Implement installment series: create, edit series, edit individual installment, early settlement, and advance. Covers US-4.1 through US-4.5.  
**Dependencies:** Phase 3 (accounts), Phase 4 (categories).  
**Complexity:** High

### Phase 6.1 — Installments API & Hooks

**Implementation Tasks:**
- [ ] Create `src/features/installments/api/installments.api.ts`:
  - `POST /api/v1/installments` → `createInstallmentSeries(data)`
  - `PUT /api/v1/installments/series/{seriesId}` → `updateSeries(seriesId, data)`
  - `PUT /api/v1/installments/{transactionId}` → `updateInstallment(transactionId, data)`
  - `POST /api/v1/installments/series/{seriesId}/settle` → `settleSeries(seriesId)`
  - `POST /api/v1/installments/advance` → `advanceInstallments(data)`
- [ ] Create Zod schemas:
  - `create-installment.schema.ts` — `description`, `totalAmount` (decimal string), `installmentCount` (integer ≥ 2), `accountId`, `categoryId`, `firstDueDate`, `type`
  - `update-series.schema.ts`, `update-installment.schema.ts`
- [ ] Create hooks: `use-create-installment.ts`, `use-update-series.ts`, `use-update-installment.ts`, `use-settle-series.ts`, `use-advance-installments.ts`

**Acceptance Criteria:**
- [ ] `installmentCount` validated as integer ≥ 2 at the schema level
- [ ] `totalAmount` and per-installment amounts typed as decimal strings throughout
- [ ] Mutations invalidate `['transactions']` and `['accounts']` on success

---

### Phase 6.2 — Installments Pages & Components

**Implementation Tasks:**
- [ ] Build `InstallmentsPage` listing active series with paid/total progress indicator
- [ ] Build `CreateInstallmentDialog` with full form validation
- [ ] Build `EditSeriesDialog` (applies to all remaining installments in the series)
- [ ] Build `EditInstallmentDialog` (single installment; visually marked as individually edited)
- [ ] Build `SettleSeriesDialog` — shows remaining count and total settlement amount
- [ ] Build `AdvanceInstallmentsDialog` — shows installments to be advanced and new due dates

**Acceptance Criteria:**
- [ ] Series creation shows a success toast with the number of installments created
- [ ] Settlement dialog summarizes the financial impact before confirmation
- [ ] Individually edited installments are visually distinguished from series defaults

**Automated Tests:**
- [ ] Unit: `create-installment.schema` rejects `installmentCount < 2` and non-decimal amount
- [ ] Integration: create series → installments appear in the transaction list

---

## Phase 7 — Recurrences Feature

**Objective:** Implement recurring transaction rules: create, list, edit, pause/resume, and delete with strategy selection. Covers US-5.1 through US-5.5.  
**Dependencies:** Phase 3 (accounts), Phase 4 (categories).  
**Complexity:** Medium

### Phase 7.1 — Recurrences API & Hooks

**Implementation Tasks:**
- [ ] Create `src/features/recurrences/api/recurrences.api.ts`:
  - `POST /api/v1/recurrences` → `createRecurrence(data)`
  - `GET /api/v1/recurrences` → `listRecurrences()`
  - `GET /api/v1/recurrences/{id}` → `getRecurrence(id)`
  - `PUT /api/v1/recurrences/{id}` → `updateRecurrence(id, data)`
  - `POST /api/v1/recurrences/{id}/pause` → `pauseRecurrence(id)`
  - `POST /api/v1/recurrences/{id}/resume` → `resumeRecurrence(id)`
  - `DELETE /api/v1/recurrences/{id}` → `deleteRecurrence(id, strategy)`
- [ ] Create Zod schemas:
  - `create-recurrence.schema.ts` — `description`, `amount` (decimal string), `frequency` (enum: `DAILY | WEEKLY | BIWEEKLY | MONTHLY | QUARTERLY | YEARLY`), `accountId`, `categoryId`, `startDate`, `type`
  - `delete-recurrence.schema.ts` — `strategy` (enum: `FUTURE_ONLY | ALL`)
- [ ] Create hooks: `use-recurrences.ts`, `use-create-recurrence.ts`, `use-update-recurrence.ts`, `use-pause-recurrence.ts`, `use-resume-recurrence.ts`, `use-delete-recurrence.ts`

**Acceptance Criteria:**
- [ ] `frequency` enum validated at the schema level
- [ ] Delete mutation passes `strategy` as a query parameter
- [ ] Pause/resume mutations invalidate `['recurrences']` on success

---

### Phase 7.2 — Recurrences Pages & Components

**Implementation Tasks:**
- [ ] Build `RecurrencesPage`:
  - Rule cards with description, amount, frequency, next execution date, status badge (active/paused)
  - Loading skeleton
  - Empty state with CTA
- [ ] Build `CreateRecurrenceDialog` / `EditRecurrenceDialog`
- [ ] Build `DeleteRecurrenceDialog` with strategy selector (`FUTURE_ONLY` / `ALL`) and clear impact explanation
- [ ] Pause/resume toggle button per rule card

**Acceptance Criteria:**
- [ ] Delete dialog clearly explains the difference between `FUTURE_ONLY` and `ALL`
- [ ] Paused rules are visually distinct from active rules
- [ ] Pause/resume updates the status badge without a page reload

**Automated Tests:**
- [ ] Unit: `create-recurrence.schema` rejects invalid frequency enum and non-decimal amount
- [ ] Integration: create rule → appears in list → pause → status badge updates

---

## Phase 8 — Credit Cards Feature

**Objective:** Implement credit card management: create, list, edit, archive, charges, invoices, invoice payment, limit usage, and spending breakdown. Covers US-7.1 through US-7.9.  
**Dependencies:** Phase 4 (categories for charge categorization).  
**Complexity:** High

### Phase 8.1 — Cards API & Hooks

**Implementation Tasks:**
- [ ] Create `src/features/cards/api/cards.api.ts`:
  - `POST /api/v1/cards` → `createCard(data)`
  - `GET /api/v1/cards` → `listCards()`
  - `PUT /api/v1/cards/{id}` → `updateCard(id, data)`
  - `POST /api/v1/cards/{id}/archive` → `archiveCard(id)`
  - `POST /api/v1/cards/{id}/charges` → `recordCharge(id, data)`
  - `GET /api/v1/cards/{id}/invoices/{referenceMonth}` → `getInvoice(id, referenceMonth)`
  - `POST /api/v1/cards/invoices/{invoiceId}/pay` → `payInvoice(invoiceId, data)`
  - `GET /api/v1/cards/{id}/limit` → `getLimitUsage(id)`
  - `GET /api/v1/cards/{id}/spending` → `getSpendingBreakdown(id, params)`
- [ ] Create Zod schemas:
  - `create-card.schema.ts` — `name`, `brand`, `lastFourDigits` (exactly 4 numeric chars), `creditLimit` (decimal string), `billingCycleDay` (1–31), `dueDay` (1–31), `color`
  - `record-charge.schema.ts` — `description`, `amount` (decimal string), `categoryId`, `date`
  - `pay-invoice.schema.ts` — `amount` (decimal string, must not exceed remaining), `accountId`
- [ ] Create hooks: `use-cards.ts`, `use-card.ts`, `use-create-card.ts`, `use-update-card.ts`, `use-archive-card.ts`, `use-record-charge.ts`, `use-invoice.ts`, `use-pay-invoice.ts`, `use-limit-usage.ts`, `use-spending-breakdown.ts`

**Acceptance Criteria:**
- [ ] `lastFourDigits` validated as exactly 4 numeric characters
- [ ] `billingCycleDay` and `dueDay` validated as integers 1–31
- [ ] `pay-invoice.schema` rejects payment amounts exceeding remaining balance
- [ ] `getInvoice` uses `YYYY-MM` format for `referenceMonth`

---

### Phase 8.2 — Cards Pages & Components

**Implementation Tasks:**
- [ ] Build `CardsPage`:
  - Card tiles showing name, brand, last four digits, credit limit, status
  - Archived cards hidden by default
  - Empty state with CTA
- [ ] Build `CardDetailPage`:
  - Invoice month navigator (previous/next month controls)
  - Invoice items list
  - Invoice payment status (total, paid, remaining)
  - Limit usage progress bar
  - Spending breakdown chart by category (date range selector)
- [ ] Build `CreateCardDialog` / `EditCardDialog`
- [ ] Build `RecordChargeDialog` with `CategoryPickerCombobox`
- [ ] Build `PayInvoiceDialog` — full or partial amount input with account selector
- [ ] Build `ArchiveCardDialog` with confirmation

**Acceptance Criteria:**
- [ ] Invoice month navigation requests the correct `referenceMonth` format (`YYYY-MM`)
- [ ] Limit usage bar reflects used vs available credit accurately
- [ ] Partial payment form validates against remaining amount before submission
- [ ] Spending breakdown shows an empty state when no charges exist for the period

**Automated Tests:**
- [ ] Unit: `create-card.schema` rejects `lastFourDigits` with non-numeric or wrong length
- [ ] Unit: `pay-invoice.schema` rejects amount exceeding remaining balance
- [ ] Integration: create card → record charge → charge appears in invoice

---

## Phase 9 — Dashboard & Analytics Feature

**Objective:** Implement the main dashboard with financial overview, five charts, and four widgets. Covers US-8.1 through US-8.9.  
**Dependencies:** Phases 3–8 (all financial features must exist before dashboard aggregates them).  
**Complexity:** High

### Phase 9.1 — Dashboard API & Hooks

**Implementation Tasks:**
- [ ] Create `src/features/dashboard/api/dashboard.api.ts`:
  - `GET /api/v1/dashboard/overview` → `getOverview()`
  - `GET /api/v1/dashboard/charts/categories` → `getCategoriesChart(from, to)`
  - `GET /api/v1/dashboard/charts/monthly` → `getMonthlyChart(months?)`
  - `GET /api/v1/dashboard/charts/net-worth` → `getNetWorthChart(from, to)`
  - `GET /api/v1/dashboard/charts/comparison` → `getComparisonChart(month1, month2)`
  - `GET /api/v1/dashboard/widgets/upcoming-bills` → `getUpcomingBills(daysAhead?)`
  - `GET /api/v1/dashboard/widgets/upcoming-invoices` → `getUpcomingInvoices()`
  - `GET /api/v1/dashboard/widgets/largest-expenses` → `getLargestExpenses(limit?)`
  - `GET /api/v1/dashboard/widgets/recent-transactions` → `getRecentTransactions(limit?)`
- [ ] Define TypeScript response types for all dashboard shapes in `features/dashboard/types/`
- [ ] Create one hook per endpoint with appropriate independent `staleTime` configuration

**Acceptance Criteria:**
- [ ] All dashboard queries use separate query keys to allow independent invalidation
- [ ] Date range params use ISO 8601 `YYYY-MM-DD`; month params use `YYYY-MM`
- [ ] All monetary values in response types are typed as `string` (decimal)

---

### Phase 9.2 — Dashboard Pages & Components

**Implementation Tasks:**
- [ ] Install and configure a chart library (e.g., Recharts) imported only within the dashboard feature chunk
- [ ] Build `DashboardPage` composed of independently fetched sections:
  - `OverviewSection` — total balance, monthly income/expenses, active accounts count
  - `CategoriesChartSection` — pie/donut chart with date range controls
  - `MonthlyChartSection` — grouped bar chart (income vs expense) with month count selector
  - `NetWorthChartSection` — line chart with date range controls
  - `MonthComparisonSection` — side-by-side comparison with two month selectors
  - `UpcomingBillsWidget` — bill list with `daysAhead` control; overdue items highlighted
  - `UpcomingInvoicesWidget` — invoice list linking to card detail page
  - `LargestExpensesWidget` — top expenses linking to transaction detail
  - `RecentTransactionsWidget` — transaction list linking to transaction detail
- [ ] Each section/widget must have: independent loading skeleton, Error Boundary isolation, empty state

**Acceptance Criteria:**
- [ ] A single failing API call does not crash the rest of the dashboard
- [ ] All charts render empty states when no data exists for the selected period
- [ ] Date/month controls update chart data without a page reload
- [ ] Overdue bills in `UpcomingBillsWidget` are visually highlighted
- [ ] Clicking entries in widgets navigates to the correct detail page

**Automated Tests:**
- [ ] Integration: overview section renders correctly with mocked API response
- [ ] Integration: a failing widget renders an error fallback; other widgets remain unaffected

---

## Phase 10 — Feature Testing

**Objective:** Write integration tests for all financial feature flows using MSW. Establish ≥ 80% line coverage on each feature module.  
**Dependencies:** Phases 2–9.  
**Complexity:** Medium

### Phase 10.1 — MSW Handlers & Test Fixtures

**Implementation Tasks:**
- [ ] Extend the MSW handler set in `src/test/` with handlers for all financial endpoints:
  - Accounts: list, create, edit, delete, archive, adjust, transfer
  - Transactions: list (paginated), create, edit, delete, pay, cancel, attachments
  - Installments: create series, edit series, settle
  - Recurrences: list, create, pause, resume, delete
  - Categories: list (tree), create, edit, hide, suggest
  - Cards: list, create, invoice, charge, pay invoice
  - Dashboard: overview, all charts, all widgets
- [ ] Create typed test fixture factories for each domain response shape
- [ ] All monetary fixtures must use decimal strings (never floats)

**Acceptance Criteria:**
- [ ] All MSW handlers return properly typed response fixtures
- [ ] No test makes a real network request

---

### Phase 10.2 — Feature Integration Tests

**Implementation Tasks:**
- [ ] Write integration tests per feature covering at minimum:
  - **Accounts:** create → list, archive → hidden from default view, delete with `409` → error message shown
  - **Transactions:** create → list, filter by type → filtered results, pay → status updates
  - **Installments:** create series → transactions appear in list, settle → cache invalidated
  - **Recurrences:** create → list, pause → status badge, delete `ALL` → removed
  - **Categories:** create → tree, hide → excluded from picker, suggest → pre-fills picker
  - **Cards:** create → list, charge → invoice updated, pay invoice → remaining balance updates
  - **Dashboard:** overview renders, chart renders with data, widget error boundary isolates failure
- [ ] All monetary assertions compare decimal strings (never parsed floats)

**Acceptance Criteria:**
- [ ] `pnpm test --coverage` passes with ≥ 80% line coverage per feature module
- [ ] Auth integration tests from Phase 8 (auth template) remain green

**Automated Tests:**
- [ ] CI step runs `pnpm test --coverage` and fails on coverage regression below 80%

---

## Phase 11 — Performance & Accessibility — Full App Audit

**Objective:** Validate the complete application meets bundle size targets, WCAG AA accessibility standards, and mobile-first responsive behavior across all financial flows.  
**Dependencies:** Phase 10.  
**Complexity:** Low

### Phase 11.1 — Bundle Analysis

**Implementation Tasks:**
- [ ] Run `vite build --report` and inspect `stats.html` for all feature chunks
- [ ] Confirm each financial feature route is a separate code-split chunk
- [ ] Verify the chart library is not included in the main bundle (lazy-loaded with the dashboard chunk only)
- [ ] Apply `React.memo` / `useMemo` / `useCallback` only where profiling shows unnecessary re-renders in list-heavy views (transactions list, category tree)

**Acceptance Criteria:**
- [ ] Main bundle (initial JS) remains under 150 KB gzipped
- [ ] Each financial feature route appears as a separate named chunk
- [ ] Dashboard chunk (chart library included) does not load until the dashboard route is visited

---

### Phase 11.2 — Accessibility & Responsive Audit

**Implementation Tasks:**
- [ ] Keyboard-navigate all primary flows: create account, create transaction, pay invoice, view dashboard
- [ ] Verify visible focus indicators on all interactive elements including chart controls and filter panels
- [ ] Test all filter panels, dialogs, and forms at 375px — no horizontal overflow
- [ ] Verify WCAG AA contrast ratios for all new components in both light and dark modes
- [ ] Confirm all confirmation dialogs and toast notifications are announced to screen readers
- [ ] Touch target size ≥ 44×44 px on all mobile-breakpoint interactive elements

**Acceptance Criteria:**
- [ ] All primary financial flows are fully operable via keyboard only
- [ ] No WCAG AA contrast failures in light or dark mode for any new component
- [ ] No horizontal scrollbar at 375px viewport on any financial page
- [ ] All monetary input fields have accessible labels and error messaging

---

## Phase Summary

| Phase | Description | Complexity | Dependencies |
|---|---|---|---|
| **1** | Folder expansion, route registration, lazy loading | Low | Auth template |
| **2** | User profile view, update, consent history | Low | Phase 1 |
| **3** | Accounts: CRUD, archive, adjust, transfers | Medium | Phase 1 |
| **4** | Categories: CRUD, hierarchy, hide, suggest, rules | Medium | Phase 1 |
| **5** | Transactions: CRUD, filters, pagination, pay, cancel, attachments | High | Phase 3, 4 |
| **6** | Installments: create series, edit, settle, advance | High | Phase 3, 4 |
| **7** | Recurrences: create, edit, pause/resume, delete with strategy | Medium | Phase 3, 4 |
| **8** | Credit cards: create, charges, invoices, payments, analytics | High | Phase 4 |
| **9** | Dashboard: overview, 5 charts, 4 widgets | High | Phase 3–8 |
| **10** | MSW handlers, integration tests, coverage gate ≥ 80% | Medium | Phase 2–9 |
| **11** | Bundle analysis, accessibility audit, responsive validation | Low | Phase 10 |

---

## Critical Invariants

| Invariant | Enforced By |
|---|---|
| JWT token never logged, URL-appended, or exposed in errors | `logger.ts` strips token; Axios interceptor owns all token injection |
| Token read/write only through auth abstraction layer | Components access token via auth store only; direct `localStorage` access prohibited |
| Backend authorization is always the source of truth | Client-side guards are UX-only; API endpoints enforce ownership independently |
| All monetary values are decimal strings — never float or int | Zod schemas use decimal string pattern on every monetary field; MSW fixtures use strings |
| No secrets or credentials in the client bundle | Vite `VITE_` env convention; `.env` in `.gitignore`; `.env.example` committed |
| TypeScript strict mode must pass before any merge | `tsc --noEmit` in pre-commit hook and CI |
| XSS: no `dangerouslySetInnerHTML` without explicit sanitization | ESLint rule; code review gate |
| Query cache cleared on logout | `use-logout` calls `queryClient.clear()` before redirect |
| Mutations must invalidate affected query keys on success | Code review gate; integration tests verify cache invalidation behavior |
| No feature imports from another feature's internals | Barrel `index.ts` files define the public API of each feature |

---

## Testing Checklist

- [ ] `src/features/` ≥ 80% line coverage per module
- [ ] All financial CRUD flows covered by integration tests using MSW (no real network)
- [ ] All create/edit schemas tested: required fields, type validation, decimal string format, enum values
- [ ] Pagination and filter persistence tested for the transaction list
- [ ] Cache invalidation verified: mutations trigger correct query re-fetches
- [ ] `409 CONFLICT` error handling tested for account deletion with linked data
- [ ] Same-account transfer validation tested
- [ ] Installment count ≥ 2 validation tested
- [ ] Invoice over-payment validation tested
- [ ] Dashboard widget error boundary isolation tested
- [ ] Auth flows from the auth template remain green after all new phases

---

## Risks & Technical Notes

| Risk | Mitigation |
|---|---|
| Decimal string handling: JS may silently coerce string to float in form state | Zod `.refine` with regex `/^\d+(\.\d{1,2})?$/` on every monetary schema field; MSW fixtures assert string equality |
| Transaction list with many simultaneous filters: URL query string complexity | Typed `transaction-filters.schema` encodes/decodes filter state; URL sync via React Router `useSearchParams` |
| Dashboard load time: 9 concurrent API calls on mount | Each section/widget fetches independently; `staleTime` prevents duplicate fetches; Error Boundaries isolate failures |
| Category tree rendering depth for deeply nested hierarchies | Client-side tree builder from flat `parentId` list; result memoized with `useMemo` |
| Chart library bundle size landing in the main bundle | Chart library imported only inside the dashboard feature chunk via dynamic import |
| RBAC: all financial data belongs to the authenticated user — no cross-user access | Backend enforces ownership on all financial endpoints; frontend never constructs requests with arbitrary user IDs |
| MSW handler coverage gaps causing false-positive tests | Phase 10.1 requires complete handler coverage before integration tests are written |
