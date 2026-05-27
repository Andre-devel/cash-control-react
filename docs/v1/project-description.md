# Cash Control — Frontend Technical & Architectural Specification (v1)

## Document Purpose

This document defines the technical and architectural specification of the Cash
Control frontend application, a personal finance management system built with
React, TypeScript, and Vite.

The purpose of this project is to deliver a production-ready, scalable, and
maintainable frontend for managing accounts, transactions, installments,
recurrences, categories, and credit cards — integrated with the Cash Control
REST API v1.

This document defines architectural standards, technical decisions, frontend
patterns, scalability considerations, and engineering conventions. It does not
define implementation tasks, UI mockups, or delivery phases.

---

# 1. System Overview

## 1.1 Purpose

A personal finance management frontend application providing full control over
financial accounts, transactions, and analytical dashboards — backed by a JWT
stateless REST API.

The architecture prioritizes:

* Reusability
* Scalability
* Maintainability
* Componentization
* Mobile-first responsiveness
* Developer experience
* Performance
* Consistency across features

---

## 1.2 Core Capabilities

| Capability                 | Description                                                       |
| -------------------------- | ----------------------------------------------------------------- |
| JWT Authentication         | Stateless authentication using Bearer token                       |
| Account management         | Wallets, bank accounts, savings, investments, credit, and other   |
| Transaction management     | Income, expense, transfer, refund, and adjustment flows           |
| Installment series         | Linked transaction series with settlement and advance controls    |
| Recurrence rules           | Auto-repeating transactions with pause/resume lifecycle           |
| Category management        | Hierarchical categories with auto-suggestion and rules            |
| Credit card management     | Cards, charges, invoices, and payment flows                       |
| Dashboard & analytics      | Overview, charts, net worth, and financial widgets                |
| Role-ready architecture    | Prepared for RBAC integration                                     |
| Responsive UI              | Mobile-first responsive design                                    |
| Dark mode                  | Theme switching support                                           |
| Feature-based architecture | Modular and scalable frontend organization                        |
| Centralized theme system   | Shared colors, typography, spacing, and tokens                    |
| Form validation            | Zod-powered schema validation                                     |
| Reusable component system  | Shared UI primitives and layout patterns                          |
| Lazy loading               | Route and feature-based code splitting                            |
| Toast notifications        | Centralized feedback system                                       |
| API abstraction            | Reusable HTTP and query layers                                     |
| Type-safe frontend         | Full TypeScript-first architecture                                |

---

## 1.3 Architectural Posture

* **Feature-oriented architecture** for scalability and modularity.
* **Component-driven development** with reusable UI primitives.
* **Mobile-first responsive strategy** across all layouts.
* **Centralized design tokens** for visual consistency.
* **Stateless frontend authentication** using JWT Bearer tokens.
* **Type-safe architecture** enforced through TypeScript and Zod.
* **Performance-oriented rendering strategy** with lazy loading and route splitting.
* **Framework-agnostic backend integration** via isolated API layer.
* **Future-ready extensibility** for dashboards, SaaS products, and enterprise systems.

---

# 2. Technology Stack

| Layer           | Technology          |
| --------------- | ------------------- |
| Framework       | React 19            |
| Build Tool      | Vite                |
| Language        | TypeScript          |
| Routing         | React Router        |
| Styling         | Tailwind CSS        |
| UI Components   | Shadcn/ui           |
| Validation      | Zod                 |
| Form Handling   | React Hook Form     |
| HTTP Client     | Axios               |
| Server State    | TanStack Query      |
| Global State    | Zustand             |
| Notifications   | Sonner              |
| Authentication  | JWT Bearer Token    |
| Package Manager | pnpm (recommended)  |
| Linting         | ESLint              |
| Formatting      | Prettier            |
| Git Hooks       | Husky + lint-staged |

---

# 3. Frontend Architecture

## 3.1 Architectural Model

The application follows a **Feature-Based Architecture**.

Features encapsulate:

* Pages
* Components
* Hooks
* API services
* Validation schemas
* Types
* State management
* Business logic

Each feature remains isolated and independently maintainable.

---

## 3.2 Folder Structure

Recommended structure:

```txt
src/
├── app/
│   ├── providers/
│   ├── router/
│   ├── layouts/
│   └── store/
│
├── features/
│   ├── auth/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── schemas/
│   │   ├── store/
│   │   ├── types/
│   │   └── services/
│   │
│   ├── accounts/
│   ├── transactions/
│   ├── installments/
│   ├── recurrences/
│   ├── categories/
│   ├── cards/
│   ├── dashboard/
│   └── profile/
│
├── components/
│   ├── ui/
│   ├── forms/
│   ├── feedback/
│   └── layout/
│
├── services/
│   ├── api/
│   ├── http/
│   └── storage/
│
├── styles/
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   ├── shadows.ts
│   │   ├── radius.ts
│   │   ├── breakpoints.ts
│   │   └── index.ts
│   │
│   └── globals.css
│
├── hooks/
├── lib/
├── types/
├── utils/
└── main.tsx
```

---

## 3.3 Design Principles

### Separation of Concerns

Business logic, UI rendering, API access, and state management remain isolated.

### Reusability

Reusable components and hooks are prioritized over duplicated implementations.

### Scalability

Features are designed to grow independently without coupling unrelated modules.

### Predictability

Consistent naming, folder structure, and architectural conventions are enforced.

### Type Safety

All API contracts, forms, and states are strongly typed.

---

# 4. Authentication Architecture

## 4.1 Authentication Strategy

The frontend uses a stateless JWT authentication model.

After successful login the API returns:

```json
{
  "accessToken": "<jwt>",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

The JWT token is stored locally and sent through the Authorization header:

```http
Authorization: Bearer <token>
```

Tokens expire in 15 minutes by default. On receiving `401`, the session is
cleared and the user is redirected to login. There is no refresh token mechanism.

---

## 4.2 Token Storage

The authentication token is initially stored in:

```txt
localStorage
```

through a dedicated authentication abstraction layer.

The architecture must support future migration toward:

* HttpOnly cookies
* Refresh token flows
* Secure session storage
* Token rotation

without major architectural refactoring.

---

## 4.3 Authentication Lifecycle

### Registration

```txt
User submits credentials
→ POST /api/v1/auth/register
→ Account created with PENDING_VERIFICATION status
→ User clicks e-mail verification link
→ GET /api/v1/auth/email/verify?token=...
→ Status changes to ACTIVE
→ User can log in
```

### Login

```txt
User submits credentials
→ POST /api/v1/auth/login
→ JWT received
→ Token persisted locally
→ User context loaded via GET /api/v1/auth/me
→ Protected routes enabled
```

### Authenticated Request

```txt
Request interceptor injects Bearer token
→ API validates token
→ Protected resource returned
```

### Logout

```txt
POST /api/v1/auth/logout
→ Remove local token
→ Clear auth store
→ Clear query cache
→ Redirect to login
```

### Unauthorized Flow

```txt
API returns 401
→ Interceptor handles invalid token
→ Local session cleared
→ Redirect to login
```

---

## 4.4 Route Protection

Protected routes are enforced client-side using:

* Route guards
* Authentication-aware layouts
* Redirect handling
* Role-ready authorization checks

Frontend authorization never replaces backend security enforcement.

---

# 5. State Management

## 5.1 Global State

Global client state uses Zustand.

Recommended responsibilities:

* Authentication state
* Theme state
* UI preferences
* Sidebar state
* Session metadata

Zustand is chosen due to:

* Minimal boilerplate
* Simplicity
* Scalability
* Excellent TypeScript support
* Low runtime overhead

---

## 5.2 Server State

Server state management uses TanStack Query.

Responsibilities:

* API caching
* Request deduplication
* Background refetching
* Mutation handling
* Retry strategies
* Query invalidation
* Loading/error state orchestration

The backend remains the source of truth for all persistent business data.

---

# 6. API Layer Architecture

## 6.1 HTTP Client

Axios is used as the centralized HTTP abstraction layer.

The HTTP client includes:

* Base URL configuration from `VITE_API_URL`
* Authorization interceptor (Bearer token injection)
* Request/response interceptors
* Error normalization (standard error envelope)
* Timeout handling
* Global unauthorized (401) handling

---

## 6.2 API Version

All endpoints are prefixed with `/api/v1`.

Feature APIs remain isolated:

```txt
features/auth/api/
features/accounts/api/
features/transactions/api/
features/installments/api/
features/recurrences/api/
features/categories/api/
features/cards/api/
features/dashboard/api/
features/profile/api/
```

This prevents service coupling and improves maintainability.

---

## 6.3 API Conventions

| Convention       | Rule                                                           |
| ---------------- | -------------------------------------------------------------- |
| IDs              | UUID strings (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)         |
| Dates            | ISO 8601 — `YYYY-MM-DD` for dates, `YYYY-MM-DDTHH:mm:ssZ` for timestamps |
| Monetary values  | Decimal `string` (e.g. `"1500.00"`) — never `float` or `int` |
| Pagination       | `page` (0-based), `size`, `sort` (e.g. `sort=createdAt,desc`) |
| Enums            | `UPPER_SNAKE_CASE` strings                                     |
| Absent fields    | Returned as `null`, never omitted                              |

Paginated responses follow the shape:

```ts
{
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
```

---

## 6.4 Error Handling

Every API error uses a standard envelope:

```json
{
  "errorCode": "RESOURCE_NOT_FOUND",
  "message": "Account not found.",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-05-27T10:00:00Z"
}
```

The HTTP client normalizes all errors into a typed structure before they reach
feature code.

---

## 6.5 Environment Configuration

Environment variables are managed through Vite environment configuration.

```env
VITE_API_URL=
```

No environment-specific logic is hardcoded.

---

# 7. Feature Modules

## 7.1 Auth

Manages registration, login, logout, password reset, e-mail verification, and
profile retrieval.

Endpoints: `/api/v1/auth/**`, `/api/v1/users/me`

---

## 7.2 Accounts

Manages financial accounts (checking, savings, cash, investment, credit, other).

Key operations: create, list, edit, delete, archive/unarchive, manual balance
adjustment, and inter-account transfers.

Endpoints: `/api/v1/accounts/**`

---

## 7.3 Transactions

Manages financial movements of types: `INCOME`, `EXPENSE`, `TRANSFER`,
`REFUND`, `ADJUSTMENT`.

Supports rich filtering (account, type, status, category, date range, amount
range, full-text search), pay/cancel state transitions, and file attachments.

Endpoints: `/api/v1/transactions/**`

---

## 7.4 Installments

Manages linked transaction series for installment purchases.

Supports creating series, editing entire series or individual installments,
early settlement, and advancement.

Endpoints: `/api/v1/installments/**`

---

## 7.5 Recurrences

Manages auto-repeating transaction rules.

Frequencies: `DAILY`, `WEEKLY`, `BIWEEKLY`, `MONTHLY`, `QUARTERLY`, `YEARLY`.

Supports pause/resume lifecycle and deletion strategies (`FUTURE_ONLY` or `ALL`).

Endpoints: `/api/v1/recurrences/**`

---

## 7.6 Categories

Manages transaction categories with parent/child hierarchy.

Supports hide/show/archive/unarchive, auto-suggestion by description, and
auto-categorization rules.

Endpoints: `/api/v1/categories/**`

---

## 7.7 Credit Cards

Manages credit cards, monthly invoices, charges, and payments.

Provides limit usage and spending breakdown by category.

Endpoints: `/api/v1/cards/**`

---

## 7.8 Dashboard

Aggregated financial analytics for the main screen.

| Widget/Chart         | Endpoint                                  |
| -------------------- | ----------------------------------------- |
| Overview summary     | `GET /dashboard/overview`                 |
| Category pie chart   | `GET /dashboard/charts/categories`        |
| Monthly bar chart    | `GET /dashboard/charts/monthly`           |
| Net worth evolution  | `GET /dashboard/charts/net-worth`         |
| Month comparison     | `GET /dashboard/charts/comparison`        |
| Upcoming bills       | `GET /dashboard/widgets/upcoming-bills`   |
| Upcoming invoices    | `GET /dashboard/widgets/upcoming-invoices`|
| Largest expenses     | `GET /dashboard/widgets/largest-expenses` |
| Recent transactions  | `GET /dashboard/widgets/recent-transactions` |

Endpoints: `/api/v1/dashboard/**`

---

# 8. Form Architecture

## 8.1 Form Strategy

Forms use:

* React Hook Form
* Zod validation schemas

This combination provides:

* Type inference
* Runtime validation
* Minimal rerenders
* Excellent performance
* Strong developer experience

---

## 8.2 Validation Rules

Validation schemas remain colocated with their features.

Example:

```txt
features/auth/schemas/login.schema.ts
features/transactions/schemas/create-transaction.schema.ts
features/accounts/schemas/create-account.schema.ts
```

Monetary values in forms are handled as `string` inputs and validated against
decimal patterns to match the API contract.

---

## 8.3 Error Handling

Forms must support:

* Inline validation feedback
* API error feedback
* Async submission states
* Disabled/loading states
* Accessible error messaging

---

# 9. Component Architecture

## 9.1 Component Strategy

The project follows a reusable component-driven architecture.

Component hierarchy:

| Layer              | Responsibility                    |
| ------------------ | --------------------------------- |
| UI Components      | Generic primitives                |
| Shared Components  | Cross-feature reusable components |
| Feature Components | Business-specific components      |
| Layout Components  | Structural page composition       |

---

## 9.2 Shadcn/ui Integration

Shadcn/ui serves as the primary component foundation.

Benefits:

* Accessibility-first
* Tailwind-native
* Full customization
* No runtime-heavy UI framework
* Reusable component ownership

---

## 9.3 Component Design Constraints

Components must:

* Be composable
* Be strongly typed
* Avoid business coupling
* Support responsive behavior
* Minimize prop complexity
* Avoid unnecessary rerenders

---

# 10. Theme System

## 10.1 Centralized Design Tokens

All visual tokens are centralized.

Recommended structure:

```txt
styles/theme/
```

Includes:

* Colors
* Typography
* Spacing
* Radius
* Shadows
* Breakpoints
* Z-index layers

---

## 10.2 Tailwind Integration

Tailwind configuration consumes centralized design tokens.

This ensures:

* Visual consistency
* Easier branding
* Faster maintenance
* Theme scalability

---

## 10.3 Dark Mode

Dark mode support is mandatory.

Requirements:

* Theme persistence
* System preference detection
* Class-based theme switching
* Accessible contrast ratios

---

# 11. Responsive Strategy

## 11.1 Mobile-First Design

The application uses a mobile-first responsive architecture.

Layouts are designed for:

1. Mobile
2. Tablet
3. Desktop
4. Large desktop

---

## 11.2 Responsive Constraints

UI must support:

* Flexible layouts
* Adaptive spacing
* Responsive typography
* Touch-friendly interactions
* Responsive navigation patterns

---

# 12. Routing Architecture

## 12.1 Router Structure

React Router manages application navigation.

Routes are separated into:

* Public routes (login, register, password reset, e-mail verification)
* Protected routes (accounts, transactions, installments, recurrences, categories, cards, dashboard, profile)
* Auth routes
* Layout-based route groups

---

## 12.2 Lazy Loading

Feature routes are lazy loaded.

Example:

```tsx
const DashboardPage = lazy(() => import('@/features/dashboard/pages/dashboard-page'))
const TransactionsPage = lazy(() => import('@/features/transactions/pages/transactions-page'))
```

Benefits:

* Smaller initial bundle
* Faster application startup
* Better scalability

---

# 13. Feedback & Notification System

## 13.1 Toast Notifications

The application includes a centralized toast notification system.

Responsibilities:

* Success feedback
* Error feedback
* Warning states
* Informational messages

---

## 13.2 Notification Principles

Notifications must:

* Be non-blocking
* Avoid excessive repetition
* Provide meaningful feedback
* Maintain consistent positioning and styling

---

# 14. Error Handling Strategy

## 14.1 Global Error Handling

The application includes:

* API error normalization (standard error envelope)
* Route-level error boundaries
* Async error handling
* Query error handling

---

## 14.2 Error Boundaries

React Error Boundaries isolate rendering failures and prevent total application
crashes.

---

# 15. Performance Strategy

## 15.1 Performance Goals

The architecture prioritizes:

* Fast initial load
* Minimal rerenders
* Reduced bundle size
* Efficient caching
* Route-level splitting

---

## 15.2 Optimization Techniques

| Technique           | Purpose                        |
| ------------------- | ------------------------------ |
| Lazy loading        | Reduce initial bundle          |
| Dynamic imports     | Split large modules            |
| Memoization         | Prevent unnecessary rerenders  |
| Query caching       | Reduce repeated requests       |
| Component isolation | Improve rendering efficiency   |
| Debouncing          | Prevent excessive API requests |

---

# 16. Security Considerations

## 16.1 Frontend Security Principles

The frontend must:

* Never trust client-side authorization
* Never expose secrets
* Never hardcode credentials
* Sanitize dynamic rendering
* Handle tokens securely

---

## 16.2 JWT Constraints

JWT tokens must:

* Never be logged
* Never appear in URLs
* Never be exposed in error messages

---

## 16.3 XSS Mitigation

The project avoids unsafe rendering patterns such as:

```tsx
dangerouslySetInnerHTML
```

unless explicitly sanitized.

---

# 17. Developer Experience

## 17.1 Code Quality

The project enforces:

* ESLint
* Prettier
* Strict TypeScript
* Path aliases
* Consistent naming conventions

---

## 17.2 Git Hooks

Husky + lint-staged enforce:

* Lint validation
* Formatting validation
* Pre-commit quality checks

---

# 18. Non-Functional Requirements

| Requirement          | Target                          |
| -------------------- | ------------------------------- |
| Scalability          | Feature-based modular growth    |
| Reusability          | Shared reusable architecture    |
| Maintainability      | Predictable organization        |
| Responsiveness       | Mobile-first support            |
| Accessibility        | Accessible component foundation |
| Performance          | Lazy loading and caching        |
| Reliability          | Stable error handling           |
| Extensibility        | Future SaaS/dashboard expansion |
| Consistency          | Centralized design system       |
| Developer Experience | Strong typing and tooling       |

---

# 19. Extensibility Points

| Extension Point     | Future Capability                  |
| ------------------- | ---------------------------------- |
| Auth abstraction    | Refresh tokens / cookies           |
| Theme system        | White-label branding               |
| RBAC-ready routing  | Permission-based UI                |
| API layer           | Multi-backend support              |
| Notification system | Realtime notifications             |
| Layout system       | Multiple dashboards                |
| Query layer         | Offline-first support              |
| Design tokens       | Multi-theme applications           |
| Category system     | Budget rules and spending limits   |
| Dashboard widgets   | Custom widget composition          |

---

# 20. Architectural Summary

The Cash Control frontend is designed as a production-ready personal finance
management application built on a scalable, feature-based React architecture.

The architecture prioritizes:

* Scalability
* Reusability
* Type safety
* Responsive UX
* Maintainability
* Performance
* Modern frontend engineering practices

The project intentionally separates concerns between:

* UI
* Features
* State
* API access
* Validation
* Routing
* Theme management

allowing the codebase to evolve into larger SaaS and enterprise financial
platforms without requiring architectural rewrites.
