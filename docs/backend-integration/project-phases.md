# Backend Integration Roadmap — cash-control-react

**Stack:** TypeScript · React 19 · TanStack Query · Axios · Zod · React Hook Form  
**Backend:** Spring Boot · JWT stateless · `/api/v1` base path · `ErrorResponse { errorCode, message, correlationId }`  
**Generated:** 2026-05-28  
**Status legend:** `[x]` = implemented · `[ ]` = pending

---

## Codebase Inspection Summary

| Feature | API file | Types file | Integration status | Critical issues |
|---|---|---|---|---|
| Auth | `features/auth/api/auth.api.ts` | `features/auth/types/index.ts` | Partial | `RegisterResponse` wrong; missing email-verification, password-reset, change-password flows |
| Dashboard | `features/dashboard/api/dashboard.api.ts` | `features/dashboard/types/index.ts` | Broken | Widget endpoints return plain arrays; frontend wraps in objects; chart shapes unverified |
| Accounts | `features/accounts/api/accounts.api.ts` | `features/accounts/types/index.ts` | Partial | `adjustBalance` uses `targetBalance` (wrong); `listTransfers()` calls non-existent GET endpoint; archive/unarchive return `void` not `Account` |
| Transactions | `features/transactions/api/transactions.api.ts` | `features/transactions/types/index.ts` | Partial | `TransactionType` includes `ADJUSTMENT` (not a backend enum value); attachment upload uses field `file` (backend expects `files`); `Transaction` type missing richness |
| Categories | `features/categories/api/categories.api.ts` | `features/categories/types/index.ts` | Partial | `Category` is a flat interface; backend returns nested tree via `subcategories`; `CategorizationRule` shape unverified |
| Installments | `features/installments/api/installments.api.ts` | `features/installments/types/index.ts` | Partial | `AdvanceInstallmentsRequest` shape wrong (uses `{ seriesId, count }`, backend expects `{ transactionIds[], newDate, newAmount? }`); GET list endpoint missing |
| Recurrences | `features/recurrences/api/recurrences.api.ts` | `features/recurrences/types/index.ts` | Partial | `RecurrenceType` includes `ADJUSTMENT`; `Recurrence` shape unverified against `RecurrenceRuleResponse` |
| Credit Cards | `features/cards/api/cards.api.ts` | `features/cards/types/index.ts` | Partial | `SpendingBreakdown` wrapper shape unverified; `Card` type may be missing `issuer` field |
| Profile | `features/profile/api/profile.api.ts` | `features/profile/types/index.ts` | Partial | `UpdateProfileRequest` only allows `displayName` — verify shape matches backend |
| Error handling | `services/http/axios.instance.ts` | — | Partial | 409 CONFLICT and 422 UNPROCESSABLE_ENTITY not surfaced to form layers; `correlationId` not propagated to toasts |

---

## Implementation Strategy

Phases are ordered by blast radius: broken API contracts that crash data renders (Dashboard, Auth) are fixed first. Features where the API file exists but has wrong shapes are corrected feature-by-feature in dependency order (Accounts → Transactions → Categories → Installments/Recurrences → Cards). Error handling and test updates come last because they depend on all shapes being stable.

Each phase fixes **types first**, then **API call corrections**, then **UI/hook adjustments**. No new UI is built unless a missing backend flow (e.g., email verification) requires a corresponding page.

---

## Phase 1 — Auth Contract & Missing Flows

**Objective:** Align auth API types with the real backend responses and implement the three missing auth flows: email verification, password reset, and change-password. These are blocking because a `RegisterResponse` that returns `{ token? }` against a backend that returns `{ message }` causes a silent post-register failure.  
**Dependencies:** None.  
**Complexity:** High

### Phase 1.1 — Fix Register & Login Response Types

**Backend contract:**
- `POST /api/v1/auth/login` → `AuthResponse { accessToken, tokenType, expiresInSeconds }` (✓ frontend already matches)
- `POST /api/v1/auth/register` → `MessageResponse { message }` (201, no token — account requires email verification before login)
- `POST /api/v1/auth/logout` → 204 No Content
- `GET /api/v1/auth/me` → `UserProfileResponse` (identical to `GET /api/v1/users/me`)

**Implementation Tasks:**
- [x] Update `LoginResponse` → keep as-is but verify `expiresInSeconds` field name matches `AuthResponse`
- [x] Replace `RegisterResponse = { token?: string }` with `MessageResponse = { message: string }` in `auth.api.ts`
- [x] Update `use-register.ts` mutation `onSuccess` handler: do **not** attempt auto-login; show success toast with the message and redirect to a "check your email" page
- [x] Remove auto-login path in `RegisterPage` (currently calls `setToken` on success)
- [x] Update `auth.api.ts` → add `logoutApi(): Promise<void>` that calls `POST /auth/logout` (204)
- [x] Add `getMeApi(): Promise<UserProfileResponse>` calling `GET /auth/me`
- [x] Create `UserProfileResponse` type in `auth/types`: `{ id, email, displayName, status, roles, permissions, linkedProviders[], createdAt }`
- [x] Wire session restoration (`auth-provider.tsx`) to call `getMeApi()` to populate `AuthUser` in store after token load

**Acceptance Criteria:**
- [x] Registering with a valid email shows "check your email" feedback — no attempt to log in automatically
- [x] Logged-in user's `AuthUser` in store reflects the `UserProfileResponse` fields (roles, permissions, display name)
- [x] Logout calls `POST /auth/logout` before clearing local state

**Automated Tests:**
- [x] Unit: `registerApi` mock returns `{ message }` → `onSuccess` shows toast, no `setToken` called
- [x] Unit: `getMeApi` populates auth store `user` field from response

---

### Phase 1.2 — Email Verification Page

**Backend contract:**
- `GET /api/v1/auth/email/verify?token=<token>` → `MessageResponse { message }` (200) or 400 `TOKEN_EXPIRED`
- `POST /api/v1/auth/email/verify/resend` body `{ email }` → `MessageResponse` (200, anti-enumeration)

**Implementation Tasks:**
- [x] Add route `/verify-email` to router (public, no auth guard)
- [x] Create `src/features/auth/pages/VerifyEmailPage.tsx`:
  - On mount, read `?token=` query param and call `GET /auth/email/verify?token=`
  - Success state: show "email verified" message + link to `/login`
  - Error state: show "link expired or invalid" message + resend form
- [x] Create `verifyEmailApi(token: string): Promise<MessageResponse>` in `auth.api.ts`
- [x] Create `resendVerificationApi(email: string): Promise<MessageResponse>` in `auth.api.ts`
- [x] Create `use-verify-email.ts` (TanStack Query mutation)
- [x] Create `use-resend-verification.ts` (TanStack Query mutation with email field)
- [x] After successful registration: `RegisterPage` redirects to `/verify-email?pending=true` (skipping the `?token=` auto-trigger)
- [x] Add Zod schema for resend form: `email` required

**Acceptance Criteria:**
- [x] Opening the verification link from email activates the account and shows success message
- [x] Expired/invalid token shows the resend form
- [x] Resend form always shows a generic confirmation (anti-enumeration)

---

### Phase 1.3 — Password Reset Flow

**Backend contract:**
- `POST /api/v1/auth/password-reset/request` body `{ email }` → `MessageResponse` (200, anti-enumeration)
- `POST /api/v1/auth/password-reset/confirm` body `{ token, newPassword }` → `MessageResponse` (200) or 400 `TOKEN_EXPIRED`

**Implementation Tasks:**
- [x] Add routes: `/forgot-password` and `/reset-password` (both public)
- [x] Create `ForgotPasswordPage.tsx`: email form → `POST /auth/password-reset/request` → always show "if registered, link sent" feedback
- [x] Create `ResetPasswordPage.tsx`: reads `?token=` from URL → new-password + confirm fields → `POST /auth/password-reset/confirm` → success redirects to `/login`
- [x] Add `forgotPasswordApi(email: string): Promise<MessageResponse>` and `resetPasswordApi(token: string, newPassword: string): Promise<MessageResponse>` to `auth.api.ts`
- [x] Create Zod schemas: `forgot-password.schema.ts` (email), `reset-password.schema.ts` (newPassword ≥ 8 chars, confirmPassword refine)
- [x] Create hooks: `use-forgot-password.ts`, `use-reset-password.ts`
- [x] Add "Forgot password?" link on `LoginPage`

**Acceptance Criteria:**
- [x] Submitting `ForgotPasswordPage` always shows success feedback regardless of email existence
- [x] Opening the reset link shows the new-password form
- [x] Expired token shows a clear error with a link back to `/forgot-password`
- [x] Successful reset redirects to `/login` with a success toast

---

### Phase 1.4 — Change Password

**Backend contract:**
- `POST /api/v1/auth/password/change` body `{ currentPassword, newPassword }` → 204 No Content or 400 `WRONG_CURRENT_PASSWORD`

**Implementation Tasks:**
- [x] Create `ChangePasswordModal.tsx` or `ChangePasswordPage.tsx` inside `features/profile/`
- [x] Add `changePasswordApi(currentPassword: string, newPassword: string): Promise<void>` to `auth.api.ts`
- [x] Create Zod schema `change-password.schema.ts`: `{ currentPassword, newPassword min-8, confirmPassword refine }`
- [x] Create `use-change-password.ts` mutation; on success clear session and redirect to `/login` (backend invalidates all JWTs)
- [x] Wire to profile settings page / settings modal trigger

**Acceptance Criteria:**
- [x] Wrong current password shows inline form error (not generic toast)
- [x] Successful change clears session and lands user on `/login` with "password updated" toast

---

## Phase 2 — Dashboard Response Shape Alignment

**Objective:** The dashboard widgets and charts are the most visibly broken integration issue. All four widget endpoints return a plain JSON array from the backend, but the frontend type layer wraps each in a named object (`{ bills: [] }`, `{ invoices: [] }`, etc.). Every widget that renders will fail silently on real data.  
**Dependencies:** None (independent from Phase 1).  
**Complexity:** Medium

### Phase 2.1 — Widget Response Types

**Backend contract (all return plain arrays):**
- `GET /api/v1/dashboard/widgets/upcoming-bills` → `UpcomingBillResponse[]`
- `GET /api/v1/dashboard/widgets/upcoming-invoices` → `UpcomingInvoiceResponse[]`
- `GET /api/v1/dashboard/widgets/largest-expenses` → `LargestExpenseResponse[]`
- `GET /api/v1/dashboard/widgets/recent-transactions` → `RecentTransactionResponse[]`

**Implementation Tasks:**
- [ ] In `dashboard/types/index.ts`: change `UpcomingBillsResponse = { bills: UpcomingBill[] }` → `UpcomingBill[]` (remove wrapper type, rename to `UpcomingBillItem`)
- [ ] Same pattern for: `UpcomingInvoicesResponse` → `UpcomingInvoiceItem[]`; `LargestExpensesResponse` → `LargestExpenseItem[]`; `RecentTransactionsResponse` → `RecentTransactionItem[]`
- [ ] Update `dashboard.api.ts`: change return types of all four widget functions to plain arrays
- [ ] Update all four dashboard widget hooks (`use-upcoming-bills`, `use-upcoming-invoices`, `use-largest-expenses`, `use-recent-transactions`) return signatures
- [ ] Update all four dashboard widget UI components to read the array directly instead of `data?.bills`, `data?.invoices`, etc.
- [ ] Add the field `status` to `UpcomingBillItem` (backend returns `PENDING | OVERDUE`)
- [ ] Add `daysUntilDue` or keep computing it client-side from `dueDate`

**Acceptance Criteria:**
- [ ] `UpcomingBillsCard` renders real bill data without runtime errors
- [ ] `UpcomingInvoicesCard`, `LargestExpensesCard`, `RecentTransactionsCard` render without runtime errors
- [ ] TypeScript strict mode passes with no `as` casts on widget data

---

### Phase 2.2 — Chart Response Types

**Backend contract (shapes must be confirmed against actual `OverviewMetricsResponse`, `CategoryPieChartResponse`, `MonthlyBarChartResponse`, `NetWorthEvolutionResponse`, `MonthlyComparisonResponse`):**
- `GET /api/v1/dashboard/overview` → `OverviewMetricsResponse`
- `GET /api/v1/dashboard/charts/categories` → `CategoryPieChartResponse`
- `GET /api/v1/dashboard/charts/monthly` → `MonthlyBarChartResponse`
- `GET /api/v1/dashboard/charts/net-worth` → `NetWorthEvolutionResponse`
- `GET /api/v1/dashboard/charts/comparison` → `MonthlyComparisonResponse`

**Implementation Tasks:**
- [ ] Obtain the actual DTO field names from the backend (run the API once against a live instance or read the backend DTO source). Until confirmed, document each as `TODO: verify against backend DTO`
- [ ] Update `DashboardOverview` — expected additional fields: `netWorth`, `monthlySavings`, `cashFlow`, `activeAccountsCount`; verify all field names
- [ ] Update `CategoriesChart` to match `CategoryPieChartResponse` shape
- [ ] Update `MonthlyChart` to match `MonthlyBarChartResponse` shape (likely `{ data: [{ month, income, expenses }] }`)
- [ ] Update `NetWorthChart` to match `NetWorthEvolutionResponse` shape
- [ ] Update `MonthComparison` to match `MonthlyComparisonResponse` shape
- [ ] Update `CategoriesChartParams` to include optional `accountId` and `type` fields (backend supports them)
- [ ] Update `NetWorthChartParams` to include optional `granularity: 'DAILY' | 'WEEKLY' | 'MONTHLY'`

**Acceptance Criteria:**
- [ ] Dashboard overview card renders all metric fields with no `undefined` values
- [ ] All four chart components render without runtime type errors on real API data
- [ ] TypeScript compilation passes with no unchecked casts

---

## Phase 3 — Accounts API Correction

**Objective:** Fix three concrete bugs in the accounts API layer: a non-existent GET endpoint for transfers, a wrong field name in the balance adjustment request, and silent void returns where the backend returns the updated `AccountResponse`.  
**Dependencies:** None.  
**Complexity:** Low

### Phase 3.1 — Remove Non-Existent Transfer Listing

**Backend contract:**
- `AccountController` exposes `POST /accounts/transfers` (create) and `DELETE /accounts/transfers/{groupId}` (delete)
- **There is no `GET /accounts/transfers` endpoint**

**Implementation Tasks:**
- [ ] Remove `listTransfers(): Promise<Transfer[]>` from `accounts.api.ts` entirely
- [ ] Remove `Transfer` type from `accounts/types/index.ts` if unused by components (or move to a `_deprecated` comment)
- [ ] Find all call sites of `listTransfers()` in hooks/components and remove or replace with transaction list filtered by `type=TRANSFER`
- [ ] Add `deleteTransfer(groupId: string): Promise<void>` if not already present (it is, verify path is `/accounts/transfers/{groupId}`)

**Acceptance Criteria:**
- [ ] No component calls `GET /accounts/transfers` at runtime
- [ ] Transfer creation and deletion still work via `POST /accounts/transfers` and `DELETE /accounts/transfers/{groupId}`

---

### Phase 3.2 — Fix `adjustBalance` Request Shape

**Backend contract:**
- `POST /api/v1/accounts/{id}/adjust` with `ManualAdjustmentRequest` — creates a delta transaction (positive = income, negative = expense). The field is a **delta amount**, not a target balance.

**Implementation Tasks:**
- [ ] Rename `AdjustBalanceRequest.targetBalance` → `amount` (signed decimal delta, e.g., `"-50.00"`)
- [ ] Add optional `note?: string` field (kept as-is)
- [ ] Update `adjustBalance()` in `accounts.api.ts` to match new shape
- [ ] Update any UI components/hooks that build the `AdjustBalanceRequest`
- [ ] Update the balance adjustment modal/form label from "Target balance" to "Adjustment amount"

**Acceptance Criteria:**
- [ ] Submitting a +100 adjustment creates an income transaction that increases the account balance by 100
- [ ] Submitting a -50 adjustment creates an expense transaction that decreases the balance by 50

---

### Phase 3.3 — Fix Archive/Unarchive Return Types

**Backend contract:**
- `POST /api/v1/accounts/{id}/archive` → `AccountResponse` (200, updated account)
- `POST /api/v1/accounts/{id}/unarchive` → `AccountResponse` (200, updated account)

**Implementation Tasks:**
- [ ] Change `archiveAccount(id: string): Promise<void>` → `Promise<Account>` in `accounts.api.ts`
- [ ] Change `unarchiveAccount(id: string): Promise<void>` → `Promise<Account>` in `accounts.api.ts`
- [ ] Update TanStack Query mutations for archive/unarchive to use returned `Account` for optimistic cache update (instead of full `invalidateQueries`)

**Acceptance Criteria:**
- [ ] Archiving an account immediately reflects in the UI without a separate refetch round-trip

---

### Phase 3.4 — Align `Account` and `CreateAccountRequest` Types

**Backend contract:**
- `AccountResponse` likely includes: `id`, `name`, `type`, `balance`, `currency`, `color`, `icon`, `archived`, `description`, `displayOrder`, `createdAt`
- `CreateAccountRequest` likely includes: `name`, `type`, `currency`, `initialBalance`, `color`, `icon`, `description`

**Implementation Tasks:**
- [ ] Add `description?: string` and `displayOrder?: number` to `Account` type
- [ ] Rename `balance` field in `CreateAccountRequest` to `initialBalance` if backend uses that name (verify)
- [ ] Add `description?: string` to `CreateAccountRequest`
- [ ] Verify `color` and `icon` fields are accepted by backend (check if they are in `CreateAccountRequest` DTO)

**Acceptance Criteria:**
- [ ] Account creation form successfully sends `initialBalance` and all fields accepted by backend
- [ ] Account list renders `description` if provided

---

## Phase 4 — Transactions API Correction

**Objective:** Fix the `TransactionType` enum, the multipart upload field name, and enrich the `Transaction` type with fields that the backend actually returns (used for display in transaction lists and detail views).  
**Dependencies:** Phase 3 (Account type must be stable before Transaction references accountName).  
**Complexity:** Medium

### Phase 4.1 — Fix `TransactionType` Enum

**Backend contract:**
- `TransactionType` enum values: `INCOME | EXPENSE | REFUND`
- `ADJUSTMENT` does not exist as a `TransactionType` — balance adjustments are `INCOME`/`EXPENSE` transactions with a flag, or use the `/accounts/{id}/adjust` endpoint
- `TRANSFER` is a transaction type that appears in the transaction list (from the transfer creation endpoint)

**Implementation Tasks:**
- [ ] Remove `'ADJUSTMENT'` from `TransactionType` in `transactions/types/index.ts`
- [ ] Add `'TRANSFER'` to `TransactionType` (backend generates TRANSFER transactions)
- [ ] Same fix in `recurrences/types/index.ts` — `RecurrenceType` should not include `ADJUSTMENT`
- [ ] Update any UI components that render `ADJUSTMENT` type badges

**Acceptance Criteria:**
- [ ] TypeScript compilation rejects any code that passes `'ADJUSTMENT'` as a `TransactionType`
- [ ] `TRANSFER` type transactions render correctly in the transaction list

---

### Phase 4.2 — Fix Attachment Upload Field Name

**Backend contract:**
- `POST /api/v1/transactions/{id}/attachments` → multipart, `@RequestPart("files") MultipartFile[] files`
- The field name in the form is `files` (plural), not `file`

**Implementation Tasks:**
- [ ] In `transactions.api.ts`, change `formData.append('file', file)` → `formData.append('files', file)` in `uploadAttachment()`
- [ ] Verify the upload returns `List<AttachmentResponse>` (array) — update return type from `Attachment` to `Attachment[]`
- [ ] Update any components receiving the upload response to handle the array

**Acceptance Criteria:**
- [ ] Uploading a single file returns HTTP 201 with an array containing one `AttachmentResponse`
- [ ] No `400 Bad Request` on attachment upload due to wrong field name

---

### Phase 4.3 — Enrich `Transaction` and Request Types

**Backend contract:**
- `TransactionDetailResponse` (from `GET /transactions/{id}`) likely includes: `id`, `description`, `amount`, `type`, `status`, `accountId`, `accountName`, `categoryId`, `categoryName`, `competenceDate`, `paymentDate`, `notes`, `isInstallment`, `installmentNumber`, `installmentCount`, `installmentGroupId`, `recurrenceId`, `createdAt`, `updatedAt`
- `TransactionSummaryResponse` (from paginated list) is a subset
- `CreateTransactionRequest` likely accepts `notes?: string`
- `MarkAsPaidRequest` accepts optional `{ paymentDate?: string }`

**Implementation Tasks:**
- [ ] Expand `Transaction` interface with: `notes?: string`, `accountName?: string`, `categoryName?: string`, `isInstallment?: boolean`, `installmentNumber?: number`, `installmentCount?: number`, `installmentGroupId?: string`, `recurrenceId?: string`, `updatedAt?: string`
- [ ] Add `notes?: string` to `CreateTransactionRequest`
- [ ] Update `payTransaction` to accept an optional `paymentDate?: string` body
- [ ] Verify `EditTransactionRequest` (PUT) fields — backend likely accepts `description`, `amount`, `categoryId`, `competenceDate`, `notes`; update `UpdateTransactionRequest` accordingly
- [ ] Create a separate `TransactionSummary` interface for paginated list items (subset of `Transaction`)

**Acceptance Criteria:**
- [ ] Transaction detail modal renders `notes` when present
- [ ] Transaction list renders `accountName` and `categoryName` without extra API calls
- [ ] Mark-as-paid supports setting `paymentDate`

---

## Phase 5 — Categories API Alignment

**Objective:** The backend returns categories as a nested tree (root categories with `subcategories` arrays) while the frontend models them as a flat list. This mismatch breaks any tree-rendered UI and category filtering.  
**Dependencies:** None.  
**Complexity:** Medium

### Phase 5.1 — Category Tree Type Model

**Backend contract:**
- `GET /api/v1/categories` → `CategoryResponse[]` where each root category includes `subcategories: CategoryResponse[]`
- System categories cannot be edited/archived; user-defined categories can be
- `CategoryResponse` likely has: `id`, `name`, `color`, `icon`, `type`, `parentId`, `hidden`, `archived`, `isSystem`, `subcategories`

**Implementation Tasks:**
- [ ] Add `subcategories?: Category[]` to `Category` interface (recursive or separate `CategoryWithChildren`)
- [ ] Add `isSystem: boolean` to `Category`
- [ ] Create a flat utility `flattenCategories(categories: Category[]): Category[]` for select/combo pickers that need a flat list
- [ ] Update `listCategories` API function to return `Category[]` (root-level with nested subcategories)
- [ ] Update any `select` components rendering categories to handle the tree structure

**Acceptance Criteria:**
- [ ] Category selector renders root categories with indented subcategories
- [ ] System categories show a visual indicator and have edit/archive buttons disabled
- [ ] Flat utility correctly produces all leaf and root nodes in a single array

---

### Phase 5.2 — Category Rule Type Alignment

**Backend contract:**
- `CategoryRuleResponse` likely includes: `id`, `pattern`, `categoryId`, `subcategoryId`, `accountId`, `priority`, `createdAt`
- `CreateCategoryRuleRequest` includes: `pattern`, `categoryId`, `subcategoryId?`, `accountId?`

**Implementation Tasks:**
- [ ] Add `subcategoryId?: string`, `accountId?: string`, `priority?: number` to `CategorizationRule` type
- [ ] Update `CreateCategorizationRuleRequest` with `subcategoryId?` and `accountId?` fields
- [ ] Verify `GET /categories/rules` returns a flat array and update API function return type

**Acceptance Criteria:**
- [ ] Category rules list renders priority order
- [ ] Create rule form allows selecting a subcategory and optionally scoping to an account

---

## Phase 6 — Installments & Recurrences API Correction

**Objective:** Fix the incorrectly shaped `AdvanceInstallmentsRequest` and align the installment series and recurrence types with their backend response DTOs.  
**Dependencies:** Phase 4 (Transaction type must be stable).  
**Complexity:** Medium

### Phase 6.1 — Fix Advance Installments Request

**Backend contract:**
- `POST /api/v1/installments/advance` with `AdvanceInstallmentRequest`:
  - `transactionIds: string[]` — specific installment transaction UUIDs to advance
  - `newDate: string` — new payment date (ISO 8601)
  - `newAmount?: string` — optional new amount per installment

**Implementation Tasks:**
- [ ] Replace `AdvanceInstallmentsRequest = { seriesId, count }` with `{ transactionIds: string[], newDate: string, newAmount?: string }` in `installments/types/index.ts`
- [ ] Update `advanceInstallments()` call in `installments.api.ts`
- [ ] Update the advance installment UI to select individual installments (checkboxes) and pick a new date, instead of a count input

**Acceptance Criteria:**
- [ ] Advancing 2 specific installments sends `{ transactionIds: [uuid1, uuid2], newDate: "2026-06-01" }`
- [ ] The backend returns the updated `TransactionDetailResponse[]` for each advanced installment

---

### Phase 6.2 — Align Installment Series Type

**Backend contract:**
- `InstallmentSeriesDetailResponse` likely includes: `id`, `description`, `amount` (per installment), `totalAmount`, `installmentCount`, `paidCount`, `remainingCount`, `accountId`, `categoryId`, `firstDueDate`, `status`, `transactions: TransactionDetailResponse[]`

**Implementation Tasks:**
- [ ] Add `GET /api/v1/installments/series/{seriesId}` to `installments.api.ts` if not present
- [ ] Add list endpoint: `GET /api/v1/installments` (list all active series for the user) to `installments.api.ts`
- [ ] Align `InstallmentSeries` type fields — verify `amount` is per-installment vs. total; add `remainingCount`
- [ ] Update `UpdateSeriesRequest` → `EditSeriesRequest` (rename to match backend); include `description`, `notes`, `categoryId`, `accountId`

**Acceptance Criteria:**
- [ ] Installment series page lists all active series
- [ ] Series detail shows per-installment amount, total, and remaining count

---

### Phase 6.3 — Align Recurrence Types

**Backend contract:**
- `RecurrenceRuleResponse` likely includes: `id`, `description`, `amount`, `type`, `frequency`, `accountId`, `categoryId`, `startDate`, `nextExecutionDate`, `status`, `pausedUntil`, `endDate`, `createdAt`

**Implementation Tasks:**
- [ ] Remove `'ADJUSTMENT'` from `RecurrenceType`
- [ ] Add `pausedUntil?: string` and `endDate?: string` to `Recurrence` type
- [ ] Update `CreateRecurrenceRequest` to include optional `endDate?: string`
- [ ] Update `UpdateRecurrenceRequest` to be a partial of the editable fields (not a full copy of create)
- [ ] Verify `pauseRecurrence` API function sends `{ pausedUntil?: string }` in body (backend `PauseRecurrenceRequest` is optional)

**Acceptance Criteria:**
- [ ] Recurrence list renders `pausedUntil` date when rule is paused
- [ ] TypeScript rejects `type: 'ADJUSTMENT'` on `CreateRecurrenceRequest`

---

## Phase 7 — Credit Cards API Alignment

**Objective:** Verify and align credit card and invoice type shapes. The core concern is `SpendingBreakdown` structure and missing `issuer` field.  
**Dependencies:** None.  
**Complexity:** Low

### Phase 7.1 — Align Card and Invoice Types

**Backend contract:**
- `CreditCardResponse` likely includes: `id`, `name`, `brand`, `lastFourDigits`, `issuer?`, `creditLimit`, `closingDay`, `dueDay`, `color`, `archived`, `currentInvoiceTotal`, `createdAt`
- `InvoiceResponse` likely includes: `id`, `cardId`, `referenceMonth`, `closingDate`, `dueDate`, `totalAmount`, `paidAmount`, `remainingAmount`, `status`, `items: InvoiceItemResponse[]`
- `LimitUsageResponse`: `{ creditLimit, usedAmount, availableAmount, usagePercentage }`
- `SpendingByCategoryResponse`: plain array `[{ categoryId, categoryName, amount, percentage }]`

**Implementation Tasks:**
- [ ] Add `issuer?: string` and `currentInvoiceTotal?: string` to `Card` type
- [ ] Rename `billingCycleDay` → `closingDay` in `Card` type and `CreateCardRequest` if backend uses `closingDay`
- [ ] Add `closingDate` to `Invoice` type
- [ ] Add `usagePercentage?: string` to `LimitUsage` type
- [ ] Verify `SpendingBreakdown` — if backend returns a plain array `SpendingByCategoryResponse[]`, remove the wrapper `SpendingBreakdown = { items, totalAmount }` and return array directly from `getSpendingByCategory()`
- [ ] Update `createCard` to use `closingDay` if renamed
- [ ] Add `DELETE /api/v1/cards/{id}` endpoint function (backend supports soft-delete via archive, no hard delete — remove any delete button UI that calls a missing delete endpoint)

**Acceptance Criteria:**
- [ ] Credit card list renders `issuer` when present
- [ ] Limit usage card shows `usagePercentage`
- [ ] Invoice close date renders correctly when `closingDate` is present

---

## Phase 8 — Global Error Handling Refinement

**Objective:** Surface 409 CONFLICT and 422 UNPROCESSABLE_ENTITY errors as inline form errors rather than generic toasts, and propagate `correlationId` to error toasts for support traceability.  
**Dependencies:** Phases 1–7 (type stability required before refining error paths).  
**Complexity:** Low

### Phase 8.1 — Map Domain Error Codes to Form Fields

**Backend contract:**
- 400 `VALIDATION_ERROR` includes `fieldErrors: { [field]: message }` — already handled by Axios interceptor
- 409 `CONFLICT` is returned for duplicate names (accounts, categories, cards)
- 422 `BUSINESS_RULE_VIOLATION` is returned for invalid state transitions (e.g., archiving an already-archived account)

**Implementation Tasks:**
- [ ] In `axios.instance.ts`, extract `fieldErrors` map from 400 responses and include in `NormalizedError`
- [ ] Add `fieldErrors?: Record<string, string>` to `NormalizedError` type
- [ ] Create a utility `setFormErrors(error: NormalizedError, setError: UseFormSetError): void` in `lib/form-errors.ts` that calls `setError(field, { message })` for each field
- [ ] Apply `setFormErrors` in `onError` handlers for: account creation (409), category creation (409), card creation (409), transaction creation (422), installment creation (422)
- [ ] For 422 errors without field errors: show the `message` from the response as a form-level error (not toast)

**Acceptance Criteria:**
- [ ] Creating an account with a duplicate name shows "name already exists" inline on the name field
- [ ] Trying to archive an already-archived account shows the business rule message as a form or dialog error
- [ ] No 409/422 surfaces as a generic "An error occurred" toast

---

### Phase 8.2 — CorrelationId in Error Toasts

**Backend contract:**
- All error responses include `correlationId: string` (UUID)

**Implementation Tasks:**
- [ ] Update `NormalizedError` to always populate `correlationId` (already typed, verify it's never `undefined` in the interceptor)
- [ ] Update `lib/toast.ts` `toast.error()` wrapper to accept an optional `correlationId` and append it as small text: `"Erro interno. Ref: <correlationId>"`
- [ ] Update the Axios 401 session-expiry toast to include the correlationId
- [ ] Update all mutation `onError` handlers in feature hooks that show toast.error to pass `error.correlationId`

**Acceptance Criteria:**
- [ ] Every error toast for 5xx errors shows a `Ref: <uuid>` line for support traceability
- [ ] 4xx user-facing errors (validation, not-found) do NOT show correlationId (it clutters UX for expected errors)

---

## Phase 9 — Integration Test Updates

**Objective:** Update all MSW handlers and integration tests to match the corrected API shapes. A passing test suite that uses old wrong shapes provides false confidence.  
**Dependencies:** Phases 1–8.  
**Complexity:** Medium

### Phase 9.1 — MSW Handler Updates

**Implementation Tasks:**
- [ ] Update `POST /auth/register` handler to return `{ message: "..." }` (201) instead of `{ token }`
- [ ] Update all four dashboard widget handlers to return plain arrays instead of wrapped objects
- [ ] Update `POST /accounts/{id}/adjust` handler to accept `{ amount }` not `{ targetBalance }`
- [ ] Update `POST /transactions/{id}/attachments` handler to expect `files` field
- [ ] Add handlers for new endpoints: `GET /auth/email/verify`, `POST /auth/email/verify/resend`, `POST /auth/password-reset/request`, `POST /auth/password-reset/confirm`, `POST /auth/password/change`

**Acceptance Criteria:**
- [ ] `pnpm test` passes with 0 failures on the updated handler set

---

### Phase 9.2 — Integration Test Coverage for New Flows

**Implementation Tasks:**
- [ ] Add integration test: register → expect success toast + redirect to `/verify-email?pending=true` (no token in store)
- [ ] Add integration test: email verification success path
- [ ] Add integration test: forgot password → always shows success feedback
- [ ] Add integration test: reset password success + redirect to `/login`
- [ ] Add integration test: dashboard widget renders when API returns an array (regression guard)
- [ ] Add integration test: attachment upload with `files` field (regression guard)
- [ ] Update existing account creation test to verify 409 conflict shows inline field error

**Acceptance Criteria:**
- [ ] `pnpm test --coverage` shows ≥ 80% on modified feature files
- [ ] All new flows (email verification, password reset) have at least one happy-path integration test

---

## Phase Summary

| Phase | Description | Complexity | Dependencies |
|---|---|---|---|
| **1** | Auth contract fix + email verification, password reset, change password | High | None |
| **2** | Dashboard widget array unwrap + chart shape alignment | Medium | None |
| **3** | Accounts: remove non-existent transfer list, fix adjust body, archive return types | Low | None |
| **4** | Transactions: fix enum, attachment field, enrich Transaction type | Medium | Phase 3 |
| **5** | Categories: tree model, subcategories, rules alignment | Medium | None |
| **6** | Installments advance fix, series type alignment, recurrence type fix | Medium | Phase 4 |
| **7** | Credit cards: issuer field, closingDay rename, spending array unwrap | Low | None |
| **8** | Error handling: 409/422 inline form errors, correlationId in toasts | Low | Phases 1–7 |
| **9** | MSW handler updates + integration test coverage for new flows | Medium | Phase 8 |

---

## Critical Invariants

| Invariant | Enforced By |
|---|---|
| Backend returns plain arrays for all widget and list endpoints — never wrap in an object unless the DTO explicitly has a named key | Read backend controller return type before writing frontend type |
| `RegisterResponse` never contains a token — registration requires email verification before login | Phase 1.1; `use-register` onSuccess must not call `setToken` |
| `TransactionType` enum is `INCOME \| EXPENSE \| REFUND \| TRANSFER` only — `ADJUSTMENT` is not a valid type | Phase 4.1; TypeScript strict enum enforces this |
| Attachment upload field name is `files` (plural, multipart array) | Phase 4.2; verified against `@RequestPart("files")` in controller |
| `adjustBalance` sends a signed delta amount, not a target balance | Phase 3.2; positive = credit, negative = debit |
| `GET /accounts/transfers` does not exist — transfer history is queried via `GET /transactions?type=TRANSFER` | Phase 3.1 |
| All error toasts for 5xx include `correlationId` for traceability | Phase 8.2; 4xx user errors do not |
| Session restoration calls `GET /auth/me` to populate roles/permissions after reading stored token | Phase 1.1 |

---

## Testing Checklist

- [x] Register flow: no token stored, redirects to "check email" page
- [x] Email verification: valid token activates account; invalid token shows resend form
- [x] Password reset: request always shows generic feedback; confirm success redirects to login
- [x] Change password: wrong current password → inline error; success → session cleared
- [ ] Dashboard widgets: all four render from plain arrays without `.bills`, `.invoices`, etc. accessors
- [ ] Dashboard overview: all metric fields render without `undefined`
- [ ] Account balance adjust: sends `{ amount: "-50.00" }` (delta), not `{ targetBalance }`
- [ ] Archive account: response is the updated Account object, no extra refetch needed
- [ ] Transaction type: `ADJUSTMENT` value rejected by TypeScript; `TRANSFER` renders correctly
- [ ] Attachment upload: `files` field name; returns array; single file upload handled
- [ ] Category picker: renders root + subcategory tree; system categories not editable
- [ ] Advance installments: sends `{ transactionIds[], newDate }` not `{ seriesId, count }`
- [ ] 409 conflict on duplicate name: inline form error, not generic toast
- [ ] 422 business rule violation: form-level error, not toast
- [ ] Error toast for 5xx: shows `Ref: <correlationId>`

---

## Risks & Technical Notes

| Risk | Mitigation |
|---|---|
| Backend DTO field names differ from what the controllers imply (e.g., `closingDay` vs `billingCycleDay`) | Run the backend locally and capture one real response per endpoint before finalizing types; don't guess |
| Auth flow change (no auto-login after register) is a visible UX regression | Confirm with team before Phase 1.1 merge; add "check your email" page before removing auto-login code |
| Removing `listTransfers()` may break components that call it | Grep for all call sites before removal; replace with `listTransactions({ type: 'TRANSFER' })` |
| `adjustBalance` semantics change (target → delta) requires UI relabeling | Update form labels and placeholder text in the same PR as the type change to avoid user confusion |
| Phase 2 chart shapes may require backend DTO source access | Add `TODO: verify shape` comments in type files until confirmed; do not ship guessed types to production |
| MSW handlers updated in Phase 9 will break tests that relied on old wrong shapes | Run `pnpm test` after each Phase 1–8 merge; fix test breakage immediately, do not batch |
