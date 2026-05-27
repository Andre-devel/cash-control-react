# User Stories — Cash Control Frontend (v1)

## Overview

This document captures production-grade user stories for the **Cash Control Frontend** — a personal finance management application built with React 19, TypeScript, and Vite, integrated with the Cash Control REST API v1.

Authentication and authorization stories are covered in the separate **Frontend Authentication Template** module (`docs/login/user-stories.md`). This document covers the financial feature domains built on top of that foundation.

The module serves the following actor categories:

* **Authenticated Users**: Users who have successfully logged in and hold a valid JWT token; can access all protected financial routes and API endpoints.
* **Administrators / Operators**: Users with elevated roles (RBAC-ready); can access admin panels and perform privileged operations.
* **External Systems / Integrations**: Backend REST APIs that issue financial data; services integrated via the isolated API layer.

---

# 1. User Profile

## US-1.1: View Profile

**As an** authenticated user
**I want to** view my profile information
**So that** I can see my current account details and preferences

### Acceptance Criteria

* [ ] A `GET /api/v1/users/me` request is made and the result is displayed.
* [ ] Name, email, and preferences are shown in the profile page.
* [ ] A loading skeleton is shown while the request is in flight.
* [ ] An error state is shown if the request fails, with a retry option.

### Technical Notes

* **Authentication:** Required (JWT Bearer token)
* **External Dependencies:** `GET /api/v1/users/me`, TanStack Query

### Expected Result

The user's profile data is displayed accurately from the backend.

---

## US-1.2: Update Profile

**As an** authenticated user
**I want to** update my name and preferences
**So that** my account reflects my current information

### Acceptance Criteria

* [ ] The form is pre-populated with current profile values via TanStack Query.
* [ ] On submit, a `PUT /api/v1/users/me` request is sent with the updated data.
* [ ] On success, the query cache for `users/me` is invalidated and the form reflects updated values.
* [ ] Validation errors are shown inline.
* [ ] A success toast is shown on update.

### API Contract

#### Request — `PUT /api/v1/users/me`

```json
{
  "name": "string",
  "preferences": {}
}
```

### Expected Result

Profile updates are persisted and reflected immediately across the UI.

---

## US-1.3: View Consent History

**As an** authenticated user
**I want to** see my data consent history
**So that** I can review what I have agreed to

### Acceptance Criteria

* [ ] A `GET /api/v1/users/me/consents` request is made and results are displayed in a list.
* [ ] Each consent entry shows type, date, and status.
* [ ] An empty state is shown when there are no consent records.

### Expected Result

The user can inspect their full consent history.

---

# 2. Accounts

## US-2.1: Create Account

**As an** authenticated user
**I want to** create a new financial account
**So that** I can track balances and transactions for that account

### Acceptance Criteria

* [ ] The form validates all fields (name, type, currency, initial balance, color, icon) using a Zod schema (`features/accounts/schemas/create-account.schema.ts`).
* [ ] Account type is selected from: `CHECKING`, `SAVINGS`, `CASH`, `INVESTMENT`, `CREDIT`, `OTHER`.
* [ ] `balance` is validated as a valid decimal string (e.g. `"1500.00"`) — never as a float.
* [ ] On submit, a `POST /api/v1/accounts` request is sent.
* [ ] On success, the accounts query cache is invalidated and the new account appears in the list.
* [ ] A success toast is shown.
* [ ] The submit button enters a loading state during submission.

### API Contract

#### Request — `POST /api/v1/accounts`

```json
{
  "name": "Nubank",
  "type": "CHECKING",
  "currency": "BRL",
  "balance": "1500.00",
  "color": "#4CAF50",
  "icon": "wallet"
}
```

#### Response (201 Created)

```json
{
  "id": "uuid",
  "name": "Nubank",
  "type": "CHECKING",
  "balance": "1500.00",
  "currency": "BRL",
  "color": "#4CAF50",
  "icon": "wallet",
  "archived": false,
  "createdAt": "2026-05-27T10:00:00Z"
}
```

### Expected Result

The new account is created, listed on the accounts page, and its balance is reflected in the dashboard overview.

---

## US-2.2: List Accounts

**As an** authenticated user
**I want to** see all my financial accounts
**So that** I can get an overview of my balances and account statuses

### Acceptance Criteria

* [ ] A `GET /api/v1/accounts` request is made and results are displayed.
* [ ] By default, archived accounts are hidden; a toggle shows them via `?includeArchived=true`.
* [ ] Each account card shows: name, type, balance, currency, color, and icon.
* [ ] A loading skeleton is shown while fetching.
* [ ] An empty state is shown when there are no accounts, with a call-to-action to create one.

### Expected Result

The user sees all active accounts with accurate balances and can optionally reveal archived ones.

---

## US-2.3: Edit Account

**As an** authenticated user
**I want to** edit an existing account's details
**So that** I can keep account information accurate

### Acceptance Criteria

* [ ] The edit form is pre-populated with current account values via TanStack Query.
* [ ] On submit, a `PUT /api/v1/accounts/{id}` request is sent.
* [ ] On success, the account detail and list query caches are invalidated.
* [ ] A success toast is shown.

### Expected Result

The account details are updated and reflected immediately in all views.

---

## US-2.4: Delete Account

**As an** authenticated user
**I want to** permanently delete an account
**So that** I can remove accounts that are no longer relevant

### Acceptance Criteria

* [ ] A confirmation dialog is shown before deletion.
* [ ] On confirmation, a `DELETE /api/v1/accounts/{id}` request is sent.
* [ ] On success, the account is removed from the list and the query cache is invalidated.
* [ ] On `409 CONFLICT` (account has linked transactions), an explanatory error message is shown instead of a generic toast.

### Edge Cases

* Attempting to delete an account with transactions must surface a clear explanation and suggest archiving as an alternative.

### Expected Result

The account is permanently deleted after user confirmation. Accounts with linked data surface an appropriate error.

---

## US-2.5: Archive / Unarchive Account

**As an** authenticated user
**I want to** archive accounts that are inactive without deleting them
**So that** I can keep my active account list clean while preserving historical data

### Acceptance Criteria

* [ ] Archive sends `POST /api/v1/accounts/{id}/archive`; unarchive sends `POST /api/v1/accounts/{id}/unarchive`.
* [ ] Archived accounts are hidden from the default list view.
* [ ] On success, the account list cache is invalidated and the account status updates immediately.

### Expected Result

Archived accounts disappear from the default view and can be restored via the archive toggle.

---

## US-2.6: Manual Balance Adjustment

**As an** authenticated user
**I want to** manually adjust an account's balance
**So that** I can correct discrepancies between the app and my actual balance

### Acceptance Criteria

* [ ] The adjustment form accepts a target balance (decimal string) and optional note.
* [ ] `targetBalance` is validated as a decimal string.
* [ ] On submit, a `POST /api/v1/accounts/{id}/adjust` request is sent.
* [ ] On success, the account balance and transaction list caches are invalidated.
* [ ] A success toast is shown.

### API Contract

#### Request — `POST /api/v1/accounts/{id}/adjust`

```json
{
  "targetBalance": "2500.00",
  "note": "Reconciliation with bank statement"
}
```

### Expected Result

The account balance is corrected and an adjustment transaction is recorded automatically by the backend.

---

## US-2.7: Transfer Between Accounts

**As an** authenticated user
**I want to** transfer funds between two of my accounts
**So that** I can move money while keeping both balances accurate

### Acceptance Criteria

* [ ] The transfer form validates: source account, destination account, amount (decimal string), and date.
* [ ] Source and destination accounts cannot be the same (schema-level validation).
* [ ] On submit, a `POST /api/v1/accounts/transfers` request is sent.
* [ ] On success, both account balance and transaction list caches are invalidated.

### API Contract

#### Request — `POST /api/v1/accounts/transfers`

```json
{
  "fromAccountId": "uuid",
  "toAccountId": "uuid",
  "amount": "500.00",
  "date": "2026-05-27",
  "description": "Savings contribution"
}
```

### Expected Result

Both account balances are updated and a linked transfer transaction pair is visible in the transaction list.

---

## US-2.8: Undo Transfer

**As an** authenticated user
**I want to** undo a previously created transfer
**So that** I can reverse accidental or incorrect transfers

### Acceptance Criteria

* [ ] A confirmation dialog is shown before undoing.
* [ ] On confirmation, a `DELETE /api/v1/accounts/transfers/{groupId}` request is sent.
* [ ] On success, both affected account balances and the transaction list caches are invalidated.

### Expected Result

The transfer is reversed and both accounts reflect their pre-transfer balances.

---

# 3. Transactions

## US-3.1: Create Transaction

**As an** authenticated user
**I want to** record a new financial transaction
**So that** my account history reflects all my income and expenses

### Acceptance Criteria

* [ ] The form validates all required fields using a Zod schema (`features/transactions/schemas/create-transaction.schema.ts`): description, amount, type, accountId, categoryId, competenceDate, status.
* [ ] Transaction type is selected from: `INCOME`, `EXPENSE`, `REFUND`, `ADJUSTMENT`.
* [ ] `amount` is validated as a valid decimal string — never as a float.
* [ ] On submit, a `POST /api/v1/transactions` request is sent.
* [ ] On success, transaction list and account balance caches are invalidated.
* [ ] A success toast is shown.

### API Contract

#### Request — `POST /api/v1/transactions`

```json
{
  "description": "Supermarket",
  "amount": "150.75",
  "type": "EXPENSE",
  "accountId": "uuid",
  "categoryId": "uuid",
  "competenceDate": "2026-05-27",
  "status": "PAID"
}
```

### Expected Result

The transaction is recorded, the account balance is updated, and it appears in the transaction list.

---

## US-3.2: List Transactions with Filters

**As an** authenticated user
**I want to** view and filter my transactions
**So that** I can find specific movements and analyze my financial history

### Acceptance Criteria

* [ ] A `GET /api/v1/transactions` request is made with filter parameters built from the active filter state.
* [ ] Supported filters: `accountId`, `type`, `status`, `categoryId`, `competenceDateFrom`, `competenceDateTo`, `paymentDateFrom`, `paymentDateTo`, `amountMin`, `amountMax`, `searchText`.
* [ ] The response is paginated (`page`, `size`, `sort`); pagination controls allow navigation.
* [ ] Cancelled transactions are hidden by default; a toggle shows them via `includeCancelled=true`.
* [ ] A loading skeleton is shown while fetching.
* [ ] An empty state is shown when no transactions match the active filters.

### Technical Notes

* Paginated response shape: `{ content: [], totalElements, totalPages, number, size }`
* Default sort: `sort=competenceDate,desc`

### Expected Result

The user can browse all transactions with intuitive filters and accurate paginated results.

---

## US-3.3: Edit Transaction

**As an** authenticated user
**I want to** edit an existing transaction
**So that** I can correct errors in recorded financial data

### Acceptance Criteria

* [ ] The edit form is pre-populated with current transaction values via TanStack Query.
* [ ] On submit, a `PUT /api/v1/transactions/{id}` request is sent.
* [ ] On success, transaction list and account balance caches are invalidated.

### Expected Result

The transaction is updated and all affected views (list, account balance, dashboard) reflect the change.

---

## US-3.4: Delete Transaction

**As an** authenticated user
**I want to** delete a transaction
**So that** I can remove incorrectly entered records

### Acceptance Criteria

* [ ] A confirmation dialog is shown before deletion.
* [ ] On confirmation, a `DELETE /api/v1/transactions/{id}` request is sent.
* [ ] On success, transaction list and account balance caches are invalidated.
* [ ] A success toast is shown.

### Expected Result

The transaction is permanently removed and the account balance is recalculated.

---

## US-3.5: Mark Transaction as Paid

**As an** authenticated user
**I want to** mark a pending transaction as paid
**So that** my account balance and payment history are accurate

### Acceptance Criteria

* [ ] On button click, a `POST /api/v1/transactions/{id}/pay` request is sent.
* [ ] On success, the transaction status changes to `PAID` and the account balance cache is invalidated.
* [ ] A success toast is shown.
* [ ] The action button enters a loading state during the request.

### Expected Result

The transaction status transitions to `PAID` and the account balance is updated accordingly.

---

## US-3.6: Cancel Transaction

**As an** authenticated user
**I want to** cancel a transaction without deleting it
**So that** I preserve the record while removing it from balance calculations

### Acceptance Criteria

* [ ] A confirmation dialog is shown before cancellation.
* [ ] On confirmation, a `POST /api/v1/transactions/{id}/cancel` request is sent.
* [ ] On success, the transaction status changes to `CANCELLED` and affected caches are invalidated.

### Expected Result

The transaction is cancelled, removed from balance calculations, and optionally visible via the `includeCancelled` toggle.

---

## US-3.7: Manage Transaction Attachments

**As an** authenticated user
**I want to** upload, view, and delete file attachments on a transaction
**So that** I can store receipts and supporting documents alongside my records

### Acceptance Criteria

* [ ] Upload sends `POST /api/v1/transactions/{id}/attachments` as `multipart/form-data`.
* [ ] List sends `GET /api/v1/transactions/{id}/attachments`.
* [ ] Delete sends `DELETE /api/v1/transactions/{id}/attachments/{attachmentId}` with a confirmation dialog.
* [ ] Accepted file types and size limits are validated on the client before upload.
* [ ] An upload progress indicator is shown during file transfer.
* [ ] On success, the attachment list cache is invalidated.

### Expected Result

Receipts and documents can be attached, listed, and removed from any transaction.

---

# 4. Installments

## US-4.1: Create Installment Series

**As an** authenticated user
**I want to** create a purchase installment series
**So that** a linked set of recurring transactions is generated automatically

### Acceptance Criteria

* [ ] The form validates all required fields using a Zod schema: `description`, `totalAmount`, `installmentCount`, `accountId`, `categoryId`, `firstDueDate`, `type`.
* [ ] `totalAmount` is validated as a valid decimal string.
* [ ] `installmentCount` must be a positive integer greater than 1.
* [ ] On submit, a `POST /api/v1/installments` request is sent.
* [ ] On success, the transaction list cache is invalidated and the series appears in the installments view.
* [ ] A success toast shows the number of installments created.

### API Contract

#### Request — `POST /api/v1/installments`

```json
{
  "description": "New laptop",
  "totalAmount": "3600.00",
  "installmentCount": 12,
  "accountId": "uuid",
  "categoryId": "uuid",
  "firstDueDate": "2026-06-01",
  "type": "EXPENSE"
}
```

### Expected Result

An installment series is created with the correct number of linked transactions spread across the billing periods.

---

## US-4.2: Edit Installment Series

**As an** authenticated user
**I want to** edit the details of an entire installment series
**So that** I can correct information that applies to all remaining installments

### Acceptance Criteria

* [ ] On submit, a `PUT /api/v1/installments/series/{seriesId}` request is sent.
* [ ] On success, the installment series and transaction list caches are invalidated.
* [ ] A success toast is shown.

### Expected Result

All installments in the series are updated according to the new values.

---

## US-4.3: Edit Individual Installment

**As an** authenticated user
**I want to** edit a single installment without affecting the rest of the series
**So that** I can adjust one-off exceptions in the payment schedule

### Acceptance Criteria

* [ ] On submit, a `PUT /api/v1/installments/{transactionId}` request is sent.
* [ ] On success, only the affected installment's cache entry is invalidated.
* [ ] A visual indicator distinguishes individually edited installments from the series default.

### Expected Result

Only the targeted installment is modified; the rest of the series remains unchanged.

---

## US-4.4: Early Settlement

**As an** authenticated user
**I want to** settle the remaining installments of a series early
**So that** I can close the debt before the scheduled end date

### Acceptance Criteria

* [ ] A confirmation dialog summarizes the settlement amount and number of remaining installments.
* [ ] On confirmation, a `POST /api/v1/installments/series/{seriesId}/settle` request is sent.
* [ ] On success, the series status is updated and affected caches are invalidated.

### Expected Result

The remaining installments are cancelled and a single settlement transaction is recorded.

---

## US-4.5: Advance Installments

**As an** authenticated user
**I want to** advance upcoming installments to the current period
**So that** I can pay ahead of schedule

### Acceptance Criteria

* [ ] On submit, a `POST /api/v1/installments/advance` request is sent.
* [ ] On success, affected transactions and account balance caches are invalidated.
* [ ] A success toast summarizes the number of installments advanced.

### Expected Result

The selected installments are moved to the current period and their due dates updated accordingly.

---

# 5. Recurrences

## US-5.1: Create Recurrence Rule

**As an** authenticated user
**I want to** create an automatic recurring transaction rule
**So that** regular income or expenses are recorded automatically on a defined schedule

### Acceptance Criteria

* [ ] The form validates all required fields using a Zod schema.
* [ ] Frequency is selected from: `DAILY`, `WEEKLY`, `BIWEEKLY`, `MONTHLY`, `QUARTERLY`, `YEARLY`.
* [ ] `amount` is validated as a decimal string.
* [ ] On submit, a `POST /api/v1/recurrences` request is sent.
* [ ] On success, the recurrence list cache is invalidated.
* [ ] A success toast is shown.

### Expected Result

The recurrence rule is created and transactions will be generated automatically by the backend on the defined schedule.

---

## US-5.2: List Recurrence Rules

**As an** authenticated user
**I want to** see all my active recurrence rules
**So that** I can review and manage my scheduled financial automations

### Acceptance Criteria

* [ ] A `GET /api/v1/recurrences` request is made and results are displayed.
* [ ] Each rule shows: description, amount, frequency, next execution date, and status (active/paused).
* [ ] A loading skeleton is shown while fetching.
* [ ] An empty state is shown when no rules exist, with a call-to-action to create one.

### Expected Result

All active recurrence rules are listed with their schedule and current status.

---

## US-5.3: Edit Recurrence Series

**As an** authenticated user
**I want to** edit the details of a recurrence rule
**So that** I can update amount, category, or frequency for future transactions

### Acceptance Criteria

* [ ] The edit form is pre-populated with current rule values.
* [ ] On submit, a `PUT /api/v1/recurrences/{id}` request is sent.
* [ ] On success, the recurrence list cache is invalidated.

### Expected Result

Future transactions generated by the rule reflect the updated configuration.

---

## US-5.4: Pause / Resume Recurrence

**As an** authenticated user
**I want to** temporarily pause a recurrence rule
**So that** no transactions are generated during an inactive period without deleting the rule

### Acceptance Criteria

* [ ] Pause sends `POST /api/v1/recurrences/{id}/pause`; resume sends `POST /api/v1/recurrences/{id}/resume`.
* [ ] The rule's status badge updates immediately after success.
* [ ] On success, the recurrence list cache is invalidated.

### Expected Result

The recurrence rule is paused/resumed and the status indicator reflects the current state.

---

## US-5.5: Delete Recurrence Rule

**As an** authenticated user
**I want to** delete a recurrence rule
**So that** no further transactions are generated for it

### Acceptance Criteria

* [ ] A confirmation dialog lets the user choose the deletion strategy: `FUTURE_ONLY` or `ALL`.
* [ ] The dialog clearly explains the impact of each strategy before the user confirms.
* [ ] On confirmation, a `DELETE /api/v1/recurrences/{id}?strategy={strategy}` request is sent.
* [ ] On success, the recurrence list and transaction list caches are invalidated.

### Expected Result

The rule and its transactions are removed per the chosen strategy.

---

# 6. Categories

## US-6.1: Create Category

**As an** authenticated user
**I want to** create a new transaction category
**So that** I can organize my financial records by custom groups

### Acceptance Criteria

* [ ] The form validates all required fields (name, color, icon, type, optional parentId) using a Zod schema.
* [ ] On submit, a `POST /api/v1/categories` request is sent.
* [ ] On success, the categories list cache is invalidated.
* [ ] A success toast is shown.

### Expected Result

The new category appears in the category list and is immediately available for selection in transaction and installment forms.

---

## US-6.2: List Categories

**As an** authenticated user
**I want to** see all my categories organized hierarchically
**So that** I can manage my category structure

### Acceptance Criteria

* [ ] A `GET /api/v1/categories` request is made and results are rendered in a tree structure respecting `parentId`.
* [ ] Hidden categories are excluded by default; a toggle reveals them via `?includeHidden=true`.
* [ ] Archived categories are excluded by default; a toggle reveals them via `?includeArchived=true`.
* [ ] An empty state is shown when no categories exist.

### Expected Result

Categories are displayed in a clear parent/child hierarchy with filtering options.

---

## US-6.3: Edit Category

**As an** authenticated user
**I want to** edit a category's name, color, or icon
**So that** my category organization stays accurate and visually meaningful

### Acceptance Criteria

* [ ] The edit form is pre-populated with current category values.
* [ ] On submit, a `PUT /api/v1/categories/{id}` request is sent.
* [ ] On success, the categories list cache is invalidated.

### Expected Result

The category is updated and all views that display it reflect the change immediately.

---

## US-6.4: Hide / Show Category

**As an** authenticated user
**I want to** hide categories I rarely use without archiving them
**So that** my category picker stays uncluttered

### Acceptance Criteria

* [ ] Hide sends `POST /api/v1/categories/{id}/hide`; show sends `POST /api/v1/categories/{id}/show`.
* [ ] On success, the categories list cache is invalidated.
* [ ] Hidden categories disappear from the category picker in transaction forms.

### Expected Result

Hidden categories are removed from the default category picker while remaining accessible via the toggle.

---

## US-6.5: Archive / Unarchive Category

**As an** authenticated user
**I want to** archive categories that are no longer in use
**So that** I preserve historical categorization while keeping the active list clean

### Acceptance Criteria

* [ ] Archive sends `POST /api/v1/categories/{id}/archive`; unarchive sends `POST /api/v1/categories/{id}/unarchive`.
* [ ] On success, the categories list cache is invalidated.

### Expected Result

Archived categories are removed from the default view and can be restored when needed.

---

## US-6.6: Auto-Suggest Category

**As an** authenticated user creating a transaction
**I want to** receive a category suggestion based on the transaction description
**So that** I can categorize transactions faster without manual lookup

### Acceptance Criteria

* [ ] As the user types the transaction description, a debounced `GET /api/v1/categories/suggest?description=...` request is sent.
* [ ] The suggested category is pre-filled in the category picker with a visual indicator that it was auto-suggested.
* [ ] The user can override the suggestion by selecting a different category.
* [ ] The debounce delay prevents excessive API requests while typing.

### Expected Result

Category selection is accelerated through intelligent suggestions based on transaction descriptions.

---

## US-6.7: Manage Auto-Categorization Rules

**As an** authenticated user
**I want to** define rules that automatically assign categories to transactions
**So that** recurring transactions are categorized without manual intervention

### Acceptance Criteria

* [ ] Create sends `POST /api/v1/categories/rules` with a pattern and target category.
* [ ] List sends `GET /api/v1/categories/rules`.
* [ ] Delete sends `DELETE /api/v1/categories/rules/{id}` with a confirmation dialog.
* [ ] On success, the rules list cache is invalidated.

### Expected Result

Auto-categorization rules are managed from a dedicated settings view and applied automatically when transactions are created.

---

# 7. Credit Cards

## US-7.1: Create Credit Card

**As an** authenticated user
**I want to** register a credit card
**So that** I can track charges, invoices, and spending for that card

### Acceptance Criteria

* [ ] The form validates all required fields using a Zod schema: name, brand, lastFourDigits, creditLimit, billingCycleDay, dueDay, color.
* [ ] `creditLimit` is validated as a decimal string.
* [ ] `billingCycleDay` and `dueDay` are validated as integers between 1 and 31.
* [ ] On submit, a `POST /api/v1/cards` request is sent.
* [ ] On success, the cards list cache is invalidated.
* [ ] A success toast is shown.

### API Contract

#### Request — `POST /api/v1/cards`

```json
{
  "name": "Nubank",
  "brand": "VISA",
  "lastFourDigits": "1234",
  "creditLimit": "5000.00",
  "billingCycleDay": 1,
  "dueDay": 10,
  "color": "#820AD1"
}
```

### Expected Result

The credit card is registered and visible in the cards list with its limit and billing configuration.

---

## US-7.2: List Credit Cards

**As an** authenticated user
**I want to** see all my registered credit cards
**So that** I can manage cards and navigate to their invoices

### Acceptance Criteria

* [ ] A `GET /api/v1/cards` request is made and results are displayed.
* [ ] Each card shows: name, brand, last four digits, credit limit, billing cycle day, due day, and archive status.
* [ ] Archived cards are hidden by default.
* [ ] An empty state is shown when there are no cards.

### Expected Result

All active credit cards are listed with their key configuration details.

---

## US-7.3: Edit Credit Card

**As an** authenticated user
**I want to** edit a credit card's details
**So that** I can keep card information accurate

### Acceptance Criteria

* [ ] The edit form is pre-populated with current card values.
* [ ] On submit, a `PUT /api/v1/cards/{id}` request is sent.
* [ ] On success, the cards list and card detail caches are invalidated.

### Expected Result

The card details are updated and reflected immediately in all views.

---

## US-7.4: Archive Credit Card

**As an** authenticated user
**I want to** archive a credit card that is no longer in use
**So that** I preserve its invoices and charge history while removing it from the active list

### Acceptance Criteria

* [ ] A confirmation dialog is shown before archiving.
* [ ] On confirmation, a `POST /api/v1/cards/{id}/archive` request is sent.
* [ ] On success, the cards list cache is invalidated and the card disappears from the active list.

### Expected Result

The card is removed from the active list while its historical invoices remain accessible.

---

## US-7.5: Record Charge on Card

**As an** authenticated user
**I want to** record a charge on a credit card
**So that** it is included on the card's invoice for the correct billing period

### Acceptance Criteria

* [ ] The form validates all required fields using a Zod schema: description, amount, categoryId, date.
* [ ] `amount` is validated as a decimal string.
* [ ] On submit, a `POST /api/v1/cards/{id}/charges` request is sent.
* [ ] On success, the card invoice and transaction list caches are invalidated.

### Expected Result

The charge appears on the correct monthly invoice and is reflected in the card's spending analytics.

---

## US-7.6: View Monthly Invoice

**As an** authenticated user
**I want to** view my credit card invoice for a given month
**So that** I can review all charges and the amount due

### Acceptance Criteria

* [ ] A `GET /api/v1/cards/{id}/invoices/{referenceMonth}` request is made using the `YYYY-MM` format.
* [ ] The invoice displays: total amount, paid amount, remaining amount, status, and a list of all items.
* [ ] Month navigation controls allow browsing past and future invoices.
* [ ] Invoice amounts are displayed as formatted decimal strings.

### Expected Result

The user can review the complete invoice for any month, including all charges and current payment status.

---

## US-7.7: Pay Invoice

**As an** authenticated user
**I want to** record a payment for my credit card invoice
**So that** my invoice balance and source account balance are updated

### Acceptance Criteria

* [ ] The payment form accepts a payment amount (full or partial) and source account.
* [ ] `amount` is validated as a decimal string; partial payment must not exceed the remaining amount.
* [ ] On submit, a `POST /api/v1/cards/invoices/{invoiceId}/pay` request is sent.
* [ ] On success, the invoice, account balance, and dashboard caches are invalidated.

### Edge Cases

* Paying more than the remaining amount is blocked at the schema level with a clear validation message.

### Expected Result

The invoice payment is recorded, the invoice status is updated, and the source account balance is reduced.

---

## US-7.8: View Limit Usage

**As an** authenticated user
**I want to** see my credit card's current limit usage
**So that** I can monitor available credit at a glance

### Acceptance Criteria

* [ ] A `GET /api/v1/cards/{id}/limit` request is made and results are displayed.
* [ ] Limit used and available credit are shown with a visual progress bar.
* [ ] Values are displayed as formatted decimal strings.

### Expected Result

The user can see how much of their credit limit is in use and how much remains available.

---

## US-7.9: View Spending Breakdown by Category

**As an** authenticated user
**I want to** see my credit card spending grouped by category for a date range
**So that** I can understand where I'm spending on my card

### Acceptance Criteria

* [ ] A `GET /api/v1/cards/{id}/spending?from=...&to=...` request is made with date range parameters.
* [ ] Results are rendered as a categorized breakdown (chart or table).
* [ ] Date range controls allow the user to adjust the analysis window.
* [ ] An empty state is shown when there are no charges for the selected period.

### Expected Result

The card spending breakdown provides a clear picture of expense distribution by category for the selected period.

---

# 8. Dashboard & Analytics

## US-8.1: View Financial Overview

**As an** authenticated user
**I want to** see a summary of my total balance, monthly income, and monthly expenses
**So that** I can quickly assess my current financial situation

### Acceptance Criteria

* [ ] A `GET /api/v1/dashboard/overview` request is made on dashboard load.
* [ ] Displays: total balance across all accounts, monthly income, monthly expenses, and number of active accounts.
* [ ] Monetary values are formatted from decimal strings.
* [ ] A loading skeleton is shown while fetching.
* [ ] An error boundary handles API failure gracefully without crashing the full dashboard.

### Expected Result

The dashboard opens with an accurate, real-time summary of the user's financial position.

---

## US-8.2: View Spending by Category Chart

**As an** authenticated user
**I want to** see a pie chart of my spending broken down by category
**So that** I can identify my largest expense categories

### Acceptance Criteria

* [ ] A `GET /api/v1/dashboard/charts/categories` request is made with `from` and `to` date parameters.
* [ ] Results are rendered as a pie or donut chart with category labels and amounts.
* [ ] Date range controls allow adjusting the analysis period.
* [ ] An empty state is shown when there are no expense transactions for the period.

### Expected Result

The chart accurately represents spending distribution for the selected period.

---

## US-8.3: View Monthly Income vs Expense Chart

**As an** authenticated user
**I want to** see a bar chart comparing income and expenses per month
**So that** I can identify financial trends over time

### Acceptance Criteria

* [ ] A `GET /api/v1/dashboard/charts/monthly` request is made (default `?months=6`).
* [ ] Results are rendered as a grouped bar chart with income and expense bars per month.
* [ ] The number of months displayed is configurable by the user.

### Expected Result

Monthly income and expense trends are clearly visualized for the configured period.

---

## US-8.4: View Net Worth Evolution

**As an** authenticated user
**I want to** see how my net worth has changed over time
**So that** I can track my overall financial progress

### Acceptance Criteria

* [ ] A `GET /api/v1/dashboard/charts/net-worth` request is made with `from` and `to` date parameters.
* [ ] Results are rendered as a line chart showing net worth over time.
* [ ] Date range controls allow adjusting the analysis window.

### Expected Result

The net worth chart shows a clear timeline of financial growth or decline over the selected period.

---

## US-8.5: View Month Comparison

**As an** authenticated user
**I want to** compare my financial performance between two months
**So that** I can evaluate progress and changes in spending behavior

### Acceptance Criteria

* [ ] A `GET /api/v1/dashboard/charts/comparison` request is made with `month1` and `month2` parameters (`YYYY-MM`).
* [ ] Results are rendered as a side-by-side comparison (chart or table).
* [ ] Month selectors allow choosing any two months for comparison.

### Expected Result

The user can compare income, expenses, and balance between any two selected months.

---

## US-8.6: View Upcoming Bills Widget

**As an** authenticated user
**I want to** see bills due in the near future
**So that** I can prepare payments before they are overdue

### Acceptance Criteria

* [ ] A `GET /api/v1/dashboard/widgets/upcoming-bills` request is made (default `?daysAhead=7`).
* [ ] Each bill shows: description, amount, due date, and account.
* [ ] The `daysAhead` window is configurable.
* [ ] Bills past due are visually distinguished (e.g., red indicator).

### Expected Result

Upcoming bills are surfaced prominently so the user can act before missing a payment.

---

## US-8.7: View Upcoming Invoices Widget

**As an** authenticated user
**I want to** see credit card invoices due soon
**So that** I can plan my card payments in advance

### Acceptance Criteria

* [ ] A `GET /api/v1/dashboard/widgets/upcoming-invoices` request is made.
* [ ] Each invoice shows: card name, reference month, total amount, and due date.
* [ ] Clicking an invoice navigates to the full invoice detail view.

### Expected Result

Upcoming card invoices are visible on the dashboard to prevent missed payments.

---

## US-8.8: View Largest Expenses Widget

**As an** authenticated user
**I want to** see my largest expenses in the current period
**So that** I can quickly identify my highest-impact transactions

### Acceptance Criteria

* [ ] A `GET /api/v1/dashboard/widgets/largest-expenses` request is made (default `?limit=5`).
* [ ] Each entry shows: description, category, amount, and date.
* [ ] Clicking an entry navigates to the full transaction detail view.

### Expected Result

The top expenses are surfaced without requiring the user to manually browse transactions.

---

## US-8.9: View Recent Transactions Widget

**As an** authenticated user
**I want to** see my most recent transactions on the dashboard
**So that** I have immediate visibility into my latest financial activity

### Acceptance Criteria

* [ ] A `GET /api/v1/dashboard/widgets/recent-transactions` request is made (default `?limit=10`).
* [ ] Each transaction shows: description, type, amount, account, and date.
* [ ] Clicking a transaction navigates to its full detail view.
* [ ] Transaction type and status are visually distinguished.

### Expected Result

The most recent transactions are visible at a glance from the dashboard.

---

# 9. Non-Functional Requirements

## US-9.1: Application Performance

**As a** user on any device
**I want to** experience fast load times and fluid interactions
**So that** the application feels responsive regardless of network conditions

### Acceptance Criteria

* [ ] Feature routes are lazy-loaded via `React.lazy` + `Suspense` to minimize the initial JS bundle.
* [ ] TanStack Query caching reduces redundant API calls across all financial features.
* [ ] Components use `React.memo`, `useMemo`, and `useCallback` where profiling demonstrates unnecessary re-renders.
* [ ] Monetary values are handled as decimal strings throughout — no float conversion at any layer.
* [ ] Debouncing is applied to search inputs and auto-suggest requests.

### Expected Result

The application loads quickly, navigates smoothly, and avoids unnecessary computation or network overhead.

---

## US-9.2: Responsive Mobile-First UI

**As a** user on mobile, tablet, or desktop
**I want to** use the application comfortably on any screen size
**So that** financial management is accessible without a desktop browser

### Acceptance Criteria

* [ ] All layouts follow a mobile-first responsive strategy using Tailwind CSS breakpoints.
* [ ] Touch targets meet minimum size requirements (44×44 px) for mobile usability.
* [ ] Navigation patterns adapt to screen size (sidebar collapses on mobile).
* [ ] Charts and data tables adapt gracefully to narrow viewports.
* [ ] The application is tested on at least: 375px (mobile), 768px (tablet), 1280px (desktop), 1920px (large desktop).

### Expected Result

The application is fully usable on mobile devices without horizontal scrolling or broken layouts.

---

## US-9.3: Accessibility Compliance

**As a** user relying on assistive technology
**I want to** navigate and use the application with a keyboard or screen reader
**So that** financial management is accessible regardless of disability

### Acceptance Criteria

* [ ] All interactive elements are keyboard-navigable with visible focus indicators.
* [ ] Form fields have associated labels and accessible error messages (ARIA).
* [ ] Color contrast meets WCAG AA standards in both light and dark modes.
* [ ] Shadcn/ui components provide accessibility primitives by default (Radix UI foundation).
* [ ] Toast notifications are announced to screen readers via ARIA live regions.

### Expected Result

The application meets WCAG 2.1 AA accessibility standards across all financial flows.

---

## US-9.4: Application Extensibility

**As a** developer extending this application
**I want to** add new financial features without modifying the core architecture
**So that** the codebase can grow without architectural rewrites

### Acceptance Criteria

* [ ] New features are added as isolated modules under `features/{feature-name}/` following the established structure.
* [ ] New API endpoints follow the same service isolation pattern (`features/{feature}/api/`).
* [ ] The theme system supports white-label branding through centralized design token replacement.
* [ ] The RBAC-ready routing architecture supports permission-based route guards by extending the existing guard pattern.

### Expected Result

Developers can scaffold new financial features without touching the architectural foundation.

---

# Global Standards

## Naming Conventions

* User Stories: `US-{DOMAIN}.{NUMBER}`
* Permissions: `resource:action`
* Audit Events: `UPPER_SNAKE_CASE`
* Roles: `UPPER_SNAKE_CASE`
* APIs: RESTful naming conventions
* Feature modules: `kebab-case`
* TypeScript types/interfaces: `PascalCase`
* Zod schemas: `camelCase.schema.ts`
* React components: `PascalCase`
* Hooks: `useCamelCase`

---

## Standard Error Response

```json
{
  "errorCode": "RESOURCE_NOT_FOUND",
  "message": "Account not found.",
  "correlationId": "uuid",
  "timestamp": "2026-05-27T10:00:00Z"
}
```

---

## Monetary Value Convention

All monetary values are transmitted as decimal `string` (e.g. `"1500.75"`) between the frontend and the API. Never use `float` or `int` for monetary fields at any layer. Validate all monetary inputs with a Zod decimal string pattern before form submission.

---

## Architecture Standards

* Feature-based modular architecture (`features/{feature}/`)
* DTO-based API contracts (Zod-typed request/response schemas)
* Centralized Axios HTTP client with interceptors
* Stateless JWT authentication via Authorization header
* Paginated list responses: `{ content, totalElements, totalPages, number, size }`
* All IDs are UUIDs; all dates are ISO 8601 (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ssZ`)
* Externalized configuration via Vite `.env` files
* Mobile-first responsive layouts (Tailwind CSS)
* Accessible component foundation (Shadcn/ui + Radix UI)

---

## Documentation Checklist

Before marking a story as complete, validate:

* [ ] Business objective is explicit
* [ ] Acceptance criteria are testable
* [ ] Validation rules are documented
* [ ] Error handling is defined
* [ ] Edge cases are covered
* [ ] API contracts are documented
* [ ] Performance considerations are documented
* [ ] Accessibility requirements are documented
* [ ] Dark mode behavior is validated
* [ ] Mobile responsiveness is validated
* [ ] Monetary values use decimal string convention
