# Implementation Roadmap — Payment Method Feature (Frontend)

**Stack:** TypeScript · React 19 · Vite · React Router · TanStack Query · Axios · Zod · React Hook Form  
**Architecture:** Feature-based · Stateless JWT · Mobile-first  
**Backend API spec:** `docs/payment-method/` (backend repo)  
**Generated:** 2026-06-06  
**Status legend:** `[x]` = implemented · `[ ]` = pending

---

## Codebase Inspection Summary

| Area                                              | Status |
|---------------------------------------------------|--------|
| `PaymentMethod` type                              | `[x]` Implemented |
| `payment-methods.api.ts`                          | `[x]` Implemented |
| `use-payment-methods` hook                        | `[x]` Implemented |
| `PaymentMethodSelect` component                   | `[x]` Implemented |
| `CreditCardSelect` component                      | `[x]` Implemented |
| `create-transaction.schema.ts` updated            | `[x]` Implemented |
| `update-transaction.schema.ts` updated            | `[x]` Implemented |
| `create-installment.schema.ts` updated            | `[x]` Implemented |
| `CreateTransactionDialog` updated                 | `[x]` Implemented |
| `EditTransactionDialog` updated                   | `[x]` Implemented |
| `CreateInstallmentDialog` updated                 | `[x]` Implemented |
| Transaction list — payment method display         | `[ ]` Pending |
| Transaction filter — payment method               | `[ ]` Pending |
| MSW handlers updated                              | `[x]` Implemented (Phase 1 dependency) |
| Tests updated                                     | `[x]` Implemented (Phase 1 tests) |

**Overall status:** Phase 5 complete.

---

## Implementation Strategy

Phases ordered by dependency: types and API layer → query hook → reusable components →
schema updates → form integration → list display → filter integration → tests.
Reusable components (`PaymentMethodSelect`, `CreditCardSelect`) are built first so they
can be dropped into all three forms without duplication. Schema refinements for the
conditional `creditCardId` rule are added once to each schema file and automatically
enforced across all consumers.

---

## Phase 1 — Types & API Layer

**Objective:** Define TypeScript types for payment methods and create the API function
that fetches the list from the backend.

**Dependencies:** Backend Phase 5 (`GET /api/v1/payment-methods`) must be available.

**Complexity:** Low

### Phase 1.1 — Types

**Implementation Tasks:**

- [x] In `src/features/transactions/types/index.ts`, add:
  ```typescript
  export const PAYMENT_METHOD_SLUGS = [
    'CASH', 'PIX', 'DEBIT_CARD', 'CREDIT_CARD',
    'BANK_TRANSFER', 'BOLETO', 'OTHER',
  ] as const
  export type PaymentMethodSlug = typeof PAYMENT_METHOD_SLUGS[number]

  export interface PaymentMethod {
    id: string
    slug: PaymentMethodSlug
    name: string
  }
  ```
- [x] Extend `TransactionSummary` interface with `paymentMethod: PaymentMethod`
- [x] Extend `TransactionDetail` interface with `paymentMethod: PaymentMethod`
  and `creditCard: { id: string; name: string; brand: string } | null`

### Phase 1.2 — API Function

**Implementation Tasks:**

- [x] Create `src/features/transactions/api/payment-methods.api.ts`
- [x] Export `async function listPaymentMethods(): Promise<PaymentMethod[]>`
- [x] Use `axiosInstance.get<PaymentMethod[]>('/payment-methods')`

---

## Phase 2 — TanStack Query Hook

**Objective:** Wrap the payment methods API call in a TanStack Query hook with permanent caching.

**Dependencies:** Phase 1.

**Complexity:** Low

### Phase 2.1 — usePaymentMethods Hook

**Implementation Tasks:**

- [x] Create `src/features/transactions/hooks/use-payment-methods.ts`
- [x] Query key: `['payment-methods']`
- [x] `staleTime: Infinity` — lookup data never changes at runtime
- [x] Export `usePaymentMethods` returning `UseQueryResult<PaymentMethod[]>`

---

## Phase 3 — Reusable Components

**Objective:** Build `PaymentMethodSelect` and `CreditCardSelect` as isolated, testable
components before integrating them into forms.

**Dependencies:** Phase 2 (for `PaymentMethodSelect`). `useCreditCards` hook (assumed existing or to be created alongside).

**Complexity:** Low

### Phase 3.1 — PaymentMethodSelect

**Implementation Tasks:**

- [x] Create `src/features/transactions/components/payment-method-select.tsx`
- [x] Props: `value: string`, `onChange: (value: string) => void`, `name?: string`, `aria-label?: string`
- [x] Internally calls `usePaymentMethods()` to populate options
- [x] Renders a `<Select>` with one `<option>` per payment method
- [x] While loading, renders a disabled select with placeholder text

### Phase 3.2 — CreditCardSelect

**Implementation Tasks:**

- [x] Create `src/features/transactions/components/credit-card-select.tsx`
- [x] Props: `value: string`, `onChange: (value: string) => void`, `cards: CreditCard[]`, `name?: string`, `aria-label?: string`
- [x] Renders a `<Select>` with a default empty option and one `<option>` per card (name + brand)
- [x] If `cards` is empty, renders a single disabled option: "Nenhum cartão cadastrado"

---

## Phase 4 — Schema Updates

**Objective:** Add `paymentMethod` and `creditCardId` to all relevant Zod schemas with
the conditional refinement that enforces the credit card requirement.

**Dependencies:** Phase 1 (for `PaymentMethodSlug` type).

**Complexity:** Low

### Phase 4.1 — create-transaction.schema.ts

**Implementation Tasks:**

- [x] Add `paymentMethod: z.enum(PAYMENT_METHOD_SLUGS).default('OTHER')` to schema
- [x] Add `creditCardId: z.string().uuid().optional()` to schema
- [x] Add `.refine()` for `CREDIT_CARD` requires `creditCardId`
- [x] Add `.refine()` for non-`CREDIT_CARD` must not have `creditCardId`
- [x] Update `CreateTransactionFormValues` type

### Phase 4.2 — update-transaction.schema.ts

**Implementation Tasks:**

- [x] Same additions as Phase 4.1, with all fields as optional patches
- [x] Update `UpdateTransactionFormValues` type

### Phase 4.3 — create-installment.schema.ts

**Implementation Tasks:**

- [x] Same additions as Phase 4.1
- [x] Update `CreateInstallmentFormValues` type

---

## Phase 5 — Form Integration

**Objective:** Integrate the new fields and conditional logic into the three dialogs.

**Dependencies:** Phases 3 and 4.

**Complexity:** Medium

### Phase 5.1 — CreateTransactionDialog

**Implementation Tasks:**

- [x] Add `paymentMethod: 'OTHER'` and `creditCardId: ''` to `DEFAULT_VALUES`
- [x] Add `const paymentMethod = form.watch('paymentMethod')` to track selection
- [x] Add `<Field label="Forma de pagamento">` with `<PaymentMethodSelect>` via `Controller`
- [x] Add conditional block: `{paymentMethod === 'CREDIT_CARD' && <Field label="Cartão de crédito"><CreditCardSelect /></Field>}`
- [x] On `paymentMethod` change away from `CREDIT_CARD`, call `form.setValue('creditCardId', '')`
- [x] Pass `creditCardId: data.creditCardId || undefined` in submit payload

### Phase 5.2 — EditTransactionDialog

**Implementation Tasks:**

- [x] Pre-populate `paymentMethod` from `transaction.paymentMethod.slug`
- [x] Pre-populate `creditCardId` from `transaction.creditCard?.id ?? ''`
- [x] Same field additions as Phase 5.1
- [x] Ensure form reset on dialog close preserves correct defaults

### Phase 5.3 — CreateInstallmentDialog

**Implementation Tasks:**

- [x] Same additions as Phase 5.1 (using installment schema and hook)

---

## Phase 6 — Transaction List Display

**Objective:** Show the payment method label on each transaction row.

**Dependencies:** Backend returning `paymentMethod` in `TransactionSummaryResponse`.

**Complexity:** Low

### Phase 6.1 — Transaction Row / Card Component

**Implementation Tasks:**

- [ ] Locate the component rendering individual transaction rows
- [ ] Add a label or badge displaying `transaction.paymentMethod.name`
- [ ] For `slug = OTHER`, display "Outro"
- [ ] Ensure the layout adapts on mobile (no overflow)

---

## Phase 7 — Transaction Filter

**Objective:** Add a payment method filter to the transaction list filter panel.

**Dependencies:** Phase 2 (`usePaymentMethods`). Backend filter support (Phase 5.2 of backend roadmap).

**Complexity:** Low

### Phase 7.1 — Filter Panel

**Implementation Tasks:**

- [ ] Add a `paymentMethod` state to the transaction filter state (alongside existing filters)
- [ ] Add a `<PaymentMethodSelect>` to the filter panel with an empty "Todas as formas" default option
- [ ] Pass `paymentMethod` as a query param to `GET /api/v1/transactions` when non-empty
- [ ] Add a "clear" action for this filter
- [ ] Display an active filter chip when a payment method is selected

---

## Phase 8 — MSW Handlers & Tests

**Objective:** Update mock service worker handlers and add component tests for the
new payment method fields.

**Dependencies:** Phase 7.

**Complexity:** Low

### Phase 8.1 — MSW Handlers

**Implementation Tasks:**

- [ ] Add `GET /api/v1/payment-methods` handler in `src/test/handlers/payment-methods.handlers.ts`
  returning the seven canonical payment method objects
- [ ] Update existing transaction handlers to include `paymentMethod` and `creditCard` in responses
- [ ] Add handler variant for transaction create with `CREDIT_CARD` + `creditCardId`

### Phase 8.2 — Component Tests

**Implementation Tasks:**

- [ ] `CreateTransactionDialog.test.tsx`: credit card picker hidden by default; appears when
      `CREDIT_CARD` selected; submit blocked without card selection
- [ ] `CreateTransactionDialog.test.tsx`: switching from `CREDIT_CARD` to `PIX` hides picker
      and clears selection
- [ ] `PaymentMethodSelect.test.tsx`: renders all seven options from mocked API
- [ ] `CreditCardSelect.test.tsx`: shows disabled option when card list is empty