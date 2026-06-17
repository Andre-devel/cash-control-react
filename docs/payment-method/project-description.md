# Payment Method — Frontend Technical & Architectural Specification

## Document Purpose

This document defines the technical and architectural specification for the payment
method feature on the Cash Control frontend. It covers the UI components, form
integration, conditional logic, API layer, and validation strategy for allowing users
to select how a transaction or installment series was paid.

This document defines architectural standards and technical decisions. It does not
define implementation tasks or delivery phases.

---

## 1. Feature Overview

### 1.1 Purpose

Add a payment method selector to the create and edit transaction forms. When the user
selects "Cartão de Crédito", a credit card picker appears. The selection is sent to the
backend, stored on the transaction, and displayed in the transaction list and detail views.

### 1.2 Core Capabilities

| Capability                           | Description                                                                 |
|--------------------------------------|-----------------------------------------------------------------------------|
| Payment method selector              | Dropdown populated from `GET /api/v1/payment-methods`                       |
| Conditional credit card picker       | Appears only when `paymentMethod = CREDIT_CARD`                             |
| Form validation                      | Zod schema enforces conditional `creditCardId` requirement                  |
| Create transaction integration       | `CreateTransactionDialog` extended with payment method fields               |
| Edit transaction integration         | `EditTransactionDialog` extended with payment method fields                 |
| Installment series integration       | `CreateInstallmentDialog` extended with payment method fields               |
| Transaction list display             | Payment method label shown on each transaction row                          |
| Filter by payment method             | Transaction list filter includes payment method selector                    |

---

## 2. Component Architecture

### 2.1 New Shared Component — `PaymentMethodSelect`

A reusable controlled select component that:
- Fetches the list of payment methods from `GET /api/v1/payment-methods` via TanStack Query.
- Renders a `<Select>` with one `<option>` per payment method, labelled in Portuguese.
- Accepts `value`, `onChange`, `name`, and `aria-label` props.
- Falls back to an empty state while data loads.

Location: `src/features/transactions/components/payment-method-select.tsx`

### 2.2 New Shared Component — `CreditCardSelect`

A reusable controlled select component that:
- Receives the list of credit cards from the parent (already fetched via `useAccounts`
  or a dedicated `useCreditCards` hook).
- Renders a `<Select>` with one `<option>` per card, including brand and name.
- Accepts `value`, `onChange`, `name`, and `aria-label` props.

Location: `src/features/transactions/components/credit-card-select.tsx`

### 2.3 Conditional Field Block — `CreditCardField`

A wrapper that renders the credit card picker only when the current `paymentMethod`
value is `CREDIT_CARD`. Implemented as a controlled component driven by the parent
form's `watch('paymentMethod')` value.

This is not extracted as a standalone component — it lives inline in the form using a
conditional `{paymentMethod === 'CREDIT_CARD' && <Field>…</Field>}` block.

---

## 3. Form Integration

### 3.1 CreateTransactionDialog

New fields added to the form:

| Field            | Type                  | Required                              |
|------------------|-----------------------|---------------------------------------|
| `paymentMethod`  | `PaymentMethodSlug`   | Yes (defaults to `OTHER`)             |
| `creditCardId`   | `string` (UUID)       | Only when `paymentMethod = CREDIT_CARD` |

Field order in the form:
1. Descrição
2. Valor
3. Tipo
4. Conta
5. **Forma de pagamento** ← new
6. **Cartão de crédito** ← conditional, appears below when CREDIT_CARD selected
7. Categoria
8. Data de competência
9. Status

### 3.2 EditTransactionDialog

Same two fields added. Pre-populated from `TransactionDetailResponse.paymentMethod.slug`
and `TransactionDetailResponse.creditCard.id` (if present).

### 3.3 CreateInstallmentDialog

Same two fields added. Pre-populated to defaults (`OTHER`, no card).

---

## 4. Zod Schema Changes

### 4.1 create-transaction.schema.ts

```typescript
const PAYMENT_METHOD_SLUGS = [
  'CASH', 'PIX', 'DEBIT_CARD', 'CREDIT_CARD',
  'BANK_TRANSFER', 'BOLETO', 'OTHER',
] as const

type PaymentMethodSlug = typeof PAYMENT_METHOD_SLUGS[number]

// Added to createTransactionSchema:
paymentMethod: z.enum(PAYMENT_METHOD_SLUGS).default('OTHER'),
creditCardId:  z.string().uuid().optional(),
```

Refinement added to the schema to enforce the conditional rule:

```typescript
.refine(
  (data) => data.paymentMethod !== 'CREDIT_CARD' || !!data.creditCardId,
  { message: 'Selecione um cartão de crédito', path: ['creditCardId'] }
)
.refine(
  (data) => data.paymentMethod === 'CREDIT_CARD' || !data.creditCardId,
  { message: 'Forma de pagamento inválida para cartão', path: ['creditCardId'] }
)
```

### 4.2 update-transaction.schema.ts

Same fields added as optional patches; same refinement applied.

### 4.3 create-installment.schema.ts

Same fields and refinement added.

---

## 5. API Layer

### 5.1 New API function — paymentMethods.api.ts

```typescript
// src/features/transactions/api/payment-methods.api.ts
export async function listPaymentMethods(): Promise<PaymentMethod[]>
```

### 5.2 New TanStack Query hook — usePaymentMethods

```typescript
// src/features/transactions/hooks/use-payment-methods.ts
export function usePaymentMethods(): UseQueryResult<PaymentMethod[]>
```

Query key: `['payment-methods']`. Stale time: infinity (lookup data never changes at runtime).

### 5.3 Existing hooks updated

`useCreateTransaction`, `useCreateInstallment`, and their edit counterparts pass
`paymentMethod` and `creditCardId` through to the API payload unchanged.

---

## 6. Types

### 6.1 PaymentMethod

```typescript
// src/features/transactions/types/index.ts (added)
export interface PaymentMethod {
  id: string
  slug: PaymentMethodSlug
  name: string
}
```

### 6.2 Transaction type extended

```typescript
export interface TransactionSummary {
  // ... existing fields
  paymentMethod: PaymentMethod
}

export interface TransactionDetail {
  // ... existing fields
  paymentMethod: PaymentMethod
  creditCard: { id: string; name: string; brand: string } | null
}
```

---

## 7. State Management

No new global state is introduced. Payment method selection is local form state managed
by React Hook Form. The TanStack Query cache holds the payment methods list globally
(keyed by `['payment-methods']`) and is shared across all form instances.

---

## 8. UX Behavior

- `paymentMethod` defaults to `OTHER` on all new forms.
- When the user changes from `CREDIT_CARD` to any other method, `creditCardId` is
  automatically cleared (`form.setValue('creditCardId', '')`).
- The credit card picker is rendered with a smooth conditional show/hide (no animation
  required — CSS `display` toggle or conditional render is sufficient).
- If the credit cards list is empty, the picker shows a disabled option:
  "Nenhum cartão cadastrado". The user must navigate to the credit cards page to add one.

---

## 9. Non-Functional Requirements

| Requirement          | Target                                                                       |
|----------------------|------------------------------------------------------------------------------|
| **Type safety**      | `PaymentMethodSlug` is a TypeScript union; no bare strings                   |
| **Query efficiency** | `payment-methods` query fetched once, cached indefinitely (lookup data)      |
| **Accessibility**    | Payment method select has `aria-label="Forma de pagamento"`; credit card select has `aria-label="Cartão de crédito"` |
| **Validation**       | Conditional Zod refinement prevents invalid form submission; backend is the authoritative guard |
| **Backwards compat** | Existing transactions without `paymentMethod` display as "Outro" in the UI   |