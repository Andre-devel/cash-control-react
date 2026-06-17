# User Stories — Payment Method (Frontend)

## Overview

This document captures frontend user stories for the payment method feature. The feature
adds a payment method selector to the transaction and installment forms, with a
conditional credit card picker that appears when "Cartão de Crédito" is selected.

---

## US-FE-PM-1: Select Payment Method When Creating a Transaction

**As an** authenticated user  
**I want to** select the payment method when recording a new transaction  
**So that** my financial history accurately reflects how each payment was made

**Acceptance Criteria:**
- [ ] The create transaction form contains a "Forma de pagamento" select field.
- [ ] Options are loaded from `GET /api/v1/payment-methods` and displayed in Portuguese.
- [ ] The field defaults to "Outro" on form open.
- [ ] All seven payment method options are available: Dinheiro, PIX, Cartão de Débito,
      Cartão de Crédito, Transferência Bancária, Boleto Bancário, Outro.
- [ ] The selected value is sent as `paymentMethod` in the create transaction request.
- [ ] If the API returns a field-level error for `paymentMethod`, it is displayed below the field.

**Expected Result:** The user can select their payment method. The value is submitted with
the transaction and reflected in the success response.

---

## US-FE-PM-2: Credit Card Picker Appears When "Cartão de Crédito" Is Selected

**As an** authenticated user  
**I want to** select which credit card I used when choosing "Cartão de Crédito"  
**So that** the charge is attributed to the correct card

**Acceptance Criteria:**
- [ ] A "Cartão de crédito" select field appears immediately below "Forma de pagamento"
      only when "Cartão de Crédito" is selected.
- [ ] The credit card picker is hidden when any other payment method is selected.
- [ ] When the user switches away from "Cartão de Crédito", the credit card selection is cleared automatically.
- [ ] The credit card picker is populated from the user's registered credit cards.
- [ ] If the user has no registered credit cards, the picker shows a disabled option:
      "Nenhum cartão cadastrado".
- [ ] Submitting the form with "Cartão de Crédito" selected but no card chosen shows the
      error: "Selecione um cartão de crédito" below the credit card picker.
- [ ] `creditCardId` is included in the create transaction request only when a card is selected.

**Expected Result:** The credit card field appears contextually. The user cannot submit
a credit card transaction without selecting a card.

---

## US-FE-PM-3: Payment Method Pre-populated When Editing a Transaction

**As an** authenticated user  
**I want to** see the payment method I previously recorded when editing a transaction  
**So that** I can review and correct it without re-entering all fields

**Acceptance Criteria:**
- [ ] The edit transaction form pre-populates "Forma de pagamento" from the transaction's
      `paymentMethod.slug` value.
- [ ] If the transaction has `paymentMethod = CREDIT_CARD`, the credit card picker is shown
      and pre-selected with the transaction's `creditCard.id`.
- [ ] The user can change the payment method; switching away from `CREDIT_CARD` hides
      the credit card picker and clears the selection.
- [ ] Switching to `CREDIT_CARD` shows the credit card picker, requiring a selection before submission.
- [ ] The updated values are sent in the edit request and reflected in the response.

**Expected Result:** Editing preserves the prior payment method selection. Changes work
identically to the create flow.

---

## US-FE-PM-4: Payment Method Displayed in Transaction List

**As an** authenticated user  
**I want to** see the payment method on each transaction in my list  
**So that** I can quickly identify how each payment was made without opening the detail view

**Acceptance Criteria:**
- [ ] The transaction list row (or card) displays the payment method label in Portuguese
      (e.g., "PIX", "Cartão de Débito", "Dinheiro").
- [ ] If `paymentMethod.slug = OTHER`, the label "Outro" is shown.
- [ ] Transactions created before this feature (which default to `OTHER`) display "Outro"
      without any error or missing-data indicator.

**Expected Result:** Every transaction row shows its payment method clearly. Legacy
transactions default gracefully to "Outro".

---

## US-FE-PM-5: Filter Transactions by Payment Method

**As an** authenticated user  
**I want to** filter my transaction list by payment method  
**So that** I can see all credit card charges, PIX payments, or cash transactions separately

**Acceptance Criteria:**
- [ ] The transaction filter panel includes a "Forma de pagamento" selector.
- [ ] Options are the same seven slugs from US-FE-PM-1.
- [ ] Selecting a payment method filter sends `paymentMethod=<slug>` as a query parameter to
      `GET /api/v1/transactions`.
- [ ] The active filter is visually indicated (e.g., chip or highlighted dropdown).
- [ ] Clearing the filter removes the query parameter and returns the unfiltered list.

**Expected Result:** The transaction list is narrowed to the selected payment channel.
Clearing the filter restores the full list.

---

## US-FE-PM-6: Select Payment Method When Creating an Installment Series

**As an** authenticated user  
**I want to** select the payment method when creating a new installment series  
**So that** all generated installments carry the correct payment classification

**Acceptance Criteria:**
- [ ] The create installment form contains a "Forma de pagamento" select field.
- [ ] The field defaults to "Outro".
- [ ] Selecting "Cartão de Crédito" reveals a credit card picker, identical in behavior to US-FE-PM-2.
- [ ] `paymentMethod` and (conditionally) `creditCardId` are included in the create installment series request.

**Expected Result:** The installment series and all generated transactions carry the
selected payment method and, for credit card, the selected card reference.