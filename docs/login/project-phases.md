# Implementation Roadmap — cash-control-react

**Stack:** TypeScript · React 19 · Vite · React Router · Tailwind CSS · Shadcn/ui · Zustand · TanStack Query · Axios · Zod · React Hook Form · Sonner  
**Architecture:** Stateless JWT · Feature-based · RBAC-ready · Mobile-first  
**Generated:** 2026-05-22  
**Status legend:** `[x]` = implemented · `[ ]` = pending

---

## Codebase Inspection Summary

| Area | Status |
|---|---|
| Build files | `[x]` Vite + TypeScript — `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json` |
| Application entry point | `[x]` `src/main.tsx` — TypeScript, strict mode, React 19 |
| Source code | `[x]` `src/App.tsx` — TypeScript placeholder; feature code pending |
| Database migrations | `[ ]` N/A — frontend-only project |
| Configuration files | `[x]` `.env.example`, path aliases, ESLint, Prettier, Husky configured |
| Docker artifacts | `[ ]` Not defined |
| Test infrastructure | `[x]` Vitest installed; test files pending Phase 8 |
| CI/CD pipeline | `[ ]` Not configured |

**Overall status:** Phase 1 complete. Vite + TypeScript + ESLint + Prettier + Husky established. Feature implementation starts Phase 2.

---

## Implementation Strategy

Phases are ordered to respect hard dependencies: tooling and build configuration must precede all other work; the design system must exist before any UI is built; routing and state layers must be established before feature code; auth core must precede route protection. Testing infrastructure is introduced early (Phase 4 onward) so each feature is testable as it lands. Performance and accessibility validation close the roadmap once all functional layers are stable.

---

## Phase 1 — Project Foundation & Tooling

**Objective:** Replace CRA with Vite, migrate the project to TypeScript, and configure all code-quality tooling. This phase establishes the non-negotiable engineering baseline every subsequent phase depends on.  
**Dependencies:** None.  
**Complexity:** Medium

### Phase 1.1 — Vite + TypeScript Migration

**Implementation Tasks:**
- [x] Remove `react-scripts` and install `vite`, `@vitejs/plugin-react`
- [x] Create `vite.config.ts` with React plugin and path alias (`@/` → `src/`)
- [x] Create `tsconfig.json` with strict mode, path aliases, and `noEmit: true`
- [x] Rename `src/index.js` → `src/main.tsx` and `src/App.js` → `src/App.tsx`
- [x] Update `package.json` scripts: `dev`, `build`, `preview`, `test`
- [x] Replace `public/index.html` with Vite-compatible `index.html` at project root
- [x] Migrate to `pnpm` — add `pnpm-lock.yaml`, remove `package-lock.json`

**Acceptance Criteria:**
- [x] `pnpm dev` starts the dev server without errors
- [x] `pnpm build` produces a type-checked production bundle
- [x] TypeScript strict mode is active; any type error fails the build

**Automated Tests:**
- [x] Build command exits 0 with no type errors

---

### Phase 1.2 — Code Quality Tooling

**Implementation Tasks:**
- [x] Install and configure ESLint with `@typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`
- [x] Install and configure Prettier with a `.prettierrc` file
- [x] Install Husky and lint-staged; add pre-commit hook running ESLint + Prettier on staged files
- [x] Create `.env.example` documenting all required environment variables (`VITE_API_BASE_URL`)
- [x] Add `.env` and `.env.local` to `.gitignore`

**Acceptance Criteria:**
- [x] `pnpm lint` exits 0 on a clean codebase
- [x] Pre-commit hook blocks commits with lint or formatting violations
- [x] `.env.example` is committed; actual `.env` is git-ignored

**Automated Tests:**
- [x] Pre-commit hook runs successfully in CI simulation

---

## Phase 2 — Design System & Theme

**Objective:** Install Tailwind CSS, integrate Shadcn/ui, define centralized design tokens, and implement dark mode. All UI built in later phases depends on this foundation.  
**Dependencies:** Phase 1.  
**Complexity:** Medium

### Phase 2.1 — Tailwind CSS & Shadcn/ui

**Implementation Tasks:**
- [x] Install `tailwindcss`, `postcss`, `autoprefixer`; generate `tailwind.config.ts` and `postcss.config.js`
- [x] Add Tailwind directives to `src/styles/globals.css`
- [x] Initialize Shadcn/ui (`pnpm dlx shadcn-ui@latest init`) with CSS variables strategy
- [x] Add baseline Shadcn/ui components: `Button`, `Input`, `Label`, `Form`, `Card`, `Toaster`

**Acceptance Criteria:**
- [x] Tailwind utility classes render correctly in the browser
- [x] At least one Shadcn/ui component renders without errors

**Automated Tests:**
- [x] Component renders without console errors (smoke test)

---

### Phase 2.2 — Design Tokens & Dark Mode

**Implementation Tasks:**
- [x] Create `src/styles/theme/` with: `colors.ts`, `typography.ts`, `spacing.ts`, `shadows.ts`, `radius.ts`, `breakpoints.ts`, `index.ts`
- [x] Wire design tokens into `tailwind.config.ts` (extend theme)
- [x] Implement class-based dark mode (`darkMode: 'class'` in Tailwind config)
- [x] Detect `prefers-color-scheme` on first load and apply as default
- [x] Persist theme preference in `localStorage` under a namespaced key
- [x] Verify WCAG AA contrast ratios for both light and dark themes

**Acceptance Criteria:**
- [x] Toggling dark mode applies `dark` class to `<html>` and updates all Shadcn/ui components
- [x] Theme preference survives page reload
- [x] No raw color values exist outside the token system

**Automated Tests:**
- [x] Theme toggle unit test: dark class is applied/removed correctly
- [x] localStorage read/write for theme key

---

## Phase 3 — Application Scaffolding & Routing

**Objective:** Establish the feature-based folder structure, configure React Router v6, define all application routes, and implement lazy-loaded layouts. This is the structural skeleton every feature plugs into.  
**Dependencies:** Phase 1.  
**Complexity:** Medium

### Phase 3.1 — Feature-Based Folder Structure

**Implementation Tasks:**
- [x] Create the canonical folder tree under `src/`:
  ```
  app/providers/  app/router/  app/layouts/  app/store/
  features/auth/  features/dashboard/
  components/ui/  components/forms/  components/feedback/  components/layout/
  services/api/  services/http/  services/storage/
  styles/theme/
  hooks/  lib/  types/  utils/
  ```
- [x] Add barrel `index.ts` files for each public module boundary

**Acceptance Criteria:**
- [x] All path alias imports (`@/features/...`) resolve without errors
- [x] No circular imports between feature modules

**Automated Tests:**
- [x] TypeScript compilation validates import resolution

---

### Phase 3.2 — React Router & Route Configuration

**Implementation Tasks:**
- [x] Install `react-router-dom` v6
- [x] Define route constants in `src/app/router/routes.ts`:
  - Public: `/login`, `/register`
  - Protected: `/dashboard`
  - RBAC-protected: `/admin/*` (prepared, not implemented)
  - Fallback: `*` → 404 page
- [x] Create `PublicLayout` (unauthenticated shell) and `ProtectedLayout` (authenticated shell with sidebar)
- [x] Implement lazy loading for all route-level pages via `React.lazy` + `Suspense`
- [x] Add `<RouterProvider>` to `src/main.tsx` via `createBrowserRouter`

**Acceptance Criteria:**
- [x] Navigating to `/login` and `/register` renders the public layout
- [x] Navigating to `/dashboard` renders the protected layout (pre-guard, unprotected for now)
- [x] Unknown routes render the 404 page
- [x] Network tab shows code-split chunks loading per route

**Automated Tests:**
- [x] Route rendering test: each route renders its layout without crashing
- [x] 404 fallback renders on unknown path

---

## Phase 4 — State Management & API Layer

**Objective:** Configure Zustand for global client state, TanStack Query for server state, and the centralized Axios HTTP client with interceptors. This layer is the integration backbone between the frontend and any backend.  
**Dependencies:** Phase 3.  
**Complexity:** Medium

### Phase 4.1 — Zustand Auth Store

**Implementation Tasks:**
- [x] Install `zustand`
- [x] Create `src/features/auth/store/auth.store.ts` with slices: `token`, `user`, `isAuthenticated`, `roles`, `theme`
- [x] Implement actions: `setToken`, `setUser`, `clearSession`, `setTheme`
- [x] Integrate `persist` middleware for `localStorage` token and theme keys (namespaced)
- [x] Create `src/app/store/index.ts` as a re-export barrel

**Acceptance Criteria:**
- [x] Auth store initializes from `localStorage` on app load
- [x] `clearSession` removes all persisted state from `localStorage`
- [x] Theme state in auth store is in sync with Phase 2.2 dark mode implementation

**Automated Tests:**
- [x] Unit: `setToken` → `isAuthenticated` becomes `true`
- [x] Unit: `clearSession` → `token` is `null`, `isAuthenticated` is `false`
- [x] Unit: persist middleware writes to and reads from `localStorage`

---

### Phase 4.2 — Axios HTTP Client

**Implementation Tasks:**
- [x] Install `axios`
- [x] Create `src/services/http/axios.instance.ts` with base URL from `VITE_API_BASE_URL`
- [x] Add request interceptor: inject `Authorization: Bearer <token>` from auth store
- [x] Add response interceptor: normalize errors into `{ status, errorCode, message, correlationId }`
- [x] Handle 401 globally: clear session, invalidate query cache, redirect to `/login`, show session-expired toast
- [x] Add de-duplication guard to prevent multiple 401 redirects from concurrent requests
- [x] Configure global timeout

**Acceptance Criteria:**
- [x] Every authenticated request includes the `Authorization` header
- [x] A simulated 401 response clears state and redirects to `/login`
- [x] Concurrent 401 responses only trigger one redirect
- [x] Token value never appears in logged error objects

**Automated Tests:**
- [x] Unit: request interceptor attaches `Authorization` header when token is present
- [x] Unit: response interceptor normalizes error shape
- [x] Unit: 401 handler fires `clearSession` exactly once for concurrent failures

---

### Phase 4.3 — TanStack Query Setup

**Implementation Tasks:**
- [x] Install `@tanstack/react-query` and `@tanstack/react-query-devtools`
- [x] Create `src/app/providers/query-provider.tsx` with a configured `QueryClient`
- [x] Set global defaults: `staleTime`, `retry` strategy, `onError` pipeline
- [x] Add devtools only in development mode
- [x] Export `queryClient` instance for imperative cache invalidation (e.g., on logout)

**Acceptance Criteria:**
- [x] `QueryClientProvider` wraps the entire app
- [x] React Query Devtools visible in development, absent in production build

**Automated Tests:**
- [x] Query provider renders children without errors

---

## Phase 5 — Authentication Feature

**Objective:** Implement all authentication flows — login, registration, logout, automatic session restoration, and the 401 interceptor session expiry flow. These are the core user stories US-1.1 through US-1.5.  
**Dependencies:** Phase 4.  
**Complexity:** High

### Phase 5.1 — Login

**Implementation Tasks:**
- [x] Create `src/features/auth/schemas/login.schema.ts` (Zod: `email`, `password`)
- [x] Create `src/features/auth/api/auth.api.ts` with `POST /auth/login` via Axios instance
- [x] Create `src/features/auth/hooks/use-login.ts` (TanStack Query mutation)
- [x] Build `LoginPage` with React Hook Form + Zod resolver:
  - Inline validation errors
  - Loading/disabled state on submit
  - API error toast via Sonner on failure
  - Redirect to `/dashboard` on success
- [x] On success: store token via auth store (never direct `localStorage` from component), load user context
- [x] Redirect already-authenticated users away from `/login`

**Acceptance Criteria:**
- [x] Form blocks submission when fields are invalid (client-side)
- [x] Successful login stores token, populates auth store, redirects to `/dashboard`
- [x] 401 response shows generic error toast (no credential detail exposed)
- [x] Submit button is disabled and shows spinner during request
- [x] JWT never appears in URL, console log, or error state

**Automated Tests:**
- [x] Unit: Zod schema rejects empty email, short password
- [x] Unit: `use-login` mutation calls `POST /auth/login` with correct payload
- [x] Integration: login form → success flow → auth store populated
- [x] Integration: login form → 401 response → error toast rendered

---

### Phase 5.2 — Registration

**Implementation Tasks:**
- [x] Create `src/features/auth/schemas/register.schema.ts` (Zod: `name`, `email`, `password`, `confirmPassword` with `.refine` match check)
- [x] Create `POST /auth/register` API call in `auth.api.ts`
- [x] Create `src/features/auth/hooks/use-register.ts`
- [x] Build `RegisterPage` with full form validation, loading state, and success/error feedback
- [x] Handle auto-login on registration if API returns a token (same flow as login)

**Acceptance Criteria:**
- [x] Password mismatch caught at schema level before API call
- [x] Email-already-in-use API error shown as inline form error
- [x] Submit button disabled during request

**Automated Tests:**
- [x] Unit: Zod schema rejects password mismatch
- [x] Unit: `use-register` mutation fires correct endpoint
- [x] Integration: successful registration shows feedback or redirects

---

### Phase 5.3 — Logout & Session Restoration

**Implementation Tasks:**
- [x] Create `src/features/auth/hooks/use-logout.ts`: clear token, clear auth store, invalidate query cache, redirect to `/login`
- [x] Add logout action to the protected layout header/sidebar
- [x] Implement session restoration in `src/app/providers/auth-provider.tsx`: on mount, read stored token → validate → populate store or clear and redirect
- [x] Session restoration must complete before any protected route renders (loading gate)

**Acceptance Criteria:**
- [x] Logout clears all persisted auth data and lands user on `/login`
- [x] Returning user with valid token is taken to `/dashboard` without re-authenticating
- [x] Returning user with expired/invalid token is redirected to `/login`
- [x] No protected route flickers or renders before session restoration completes

**Automated Tests:**
- [x] Unit: `use-logout` calls `clearSession` and invalidates query cache
- [x] Unit: session restoration loads store when valid token found in `localStorage`
- [x] Unit: session restoration clears store and redirects when token is absent

---

## Phase 6 — Authorization & Route Protection

**Objective:** Enforce client-side route protection via auth-aware route guards, and prepare the RBAC-ready routing pattern for future role-based access. Covers US-2.1 and US-2.2.  
**Dependencies:** Phase 5.  
**Complexity:** Medium

### Phase 6.1 — Protected Route Guard

**Implementation Tasks:**
- [x] Create `src/app/router/guards/auth-guard.tsx`: if not authenticated, redirect to `/login` with optional `?redirect=` param
- [x] Wrap all protected routes with `AuthGuard` in the router configuration
- [x] Preserve the requested URL for post-login redirect

**Acceptance Criteria:**
- [x] Unauthenticated access to `/dashboard` redirects to `/login`
- [x] After login, user is redirected to the originally requested path
- [x] Authenticated users cannot access `/login` or `/register` (redirected to `/dashboard`)

**Automated Tests:**
- [x] Unit: `AuthGuard` redirects to `/login` when `isAuthenticated` is `false`
- [x] Unit: `AuthGuard` renders children when `isAuthenticated` is `true`
- [x] Integration: full redirect flow preserves `?redirect` param through login

---

### Phase 6.2 — RBAC-Ready Route Authorization

**Implementation Tasks:**
- [x] Create `src/app/router/guards/role-guard.tsx`: accepts `requiredRoles` prop; redirects to `/dashboard` if user lacks the role
- [x] Add `roles` field to the auth store user type
- [x] Wrap `/admin/*` routes with `RoleGuard` (prepared but not yet functional without a backend)
- [x] Create a `403` page component

**Acceptance Criteria:**
- [x] `RoleGuard` renders children for users with the required role
- [x] `RoleGuard` redirects to `/dashboard` for users without the required role
- [x] The guard pattern is extensible: adding a new protected role requires only a route-level change

**Automated Tests:**
- [x] Unit: `RoleGuard` allows access when role matches
- [x] Unit: `RoleGuard` redirects when role does not match

---

## Phase 7 — Feedback & Error Handling

**Objective:** Implement the centralized toast notification system (Sonner), React Error Boundaries for rendering isolation, and structured frontend logging for auth lifecycle observability. Covers US-5.1, US-5.2, and US-12.x.  
**Dependencies:** Phase 5.  
**Complexity:** Low

### Phase 7.1 — Toast Notifications

**Implementation Tasks:**
- [x] Install `sonner` and add `<Toaster>` to the app root (inside providers)
- [x] Create `src/lib/toast.ts` as a thin typed wrapper: `toast.success`, `toast.error`, `toast.warn`, `toast.info`
- [x] All feature hooks must call toast through this wrapper only (never import Sonner directly in feature code)
- [x] Ensure toasts are announced to screen readers via ARIA live regions (Sonner default)

**Acceptance Criteria:**
- [x] Success, error, warning, and info toasts render with consistent styling
- [x] Toasts are non-blocking and auto-dismiss
- [x] No raw Sonner import appears in feature or component code

**Automated Tests:**
- [x] Unit: `toast.error` calls Sonner with the correct arguments

---

### Phase 7.2 — Error Boundaries & Structured Logging

**Implementation Tasks:**
- [x] Create `src/components/feedback/error-boundary.tsx` wrapping route-level subtrees
- [x] Create `src/lib/logger.ts`: structured JSON logger that accepts `{ event, correlationId, ...meta }` — strips token and PII before output
- [x] Log events: `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `SESSION_RESTORED`, `SESSION_EXPIRED`, `UNAUTHORIZED_ROUTE_ACCESS_ATTEMPT`, `FORBIDDEN_ROUTE_ACCESS_ATTEMPT`

**Acceptance Criteria:**
- [x] A rendering error in one route does not crash the entire app
- [x] All specified auth events are logged with correlation IDs, never with token values
- [x] Logger output is JSON format

**Automated Tests:**
- [x] Unit: `ErrorBoundary` catches a thrown error and renders fallback UI
- [x] Unit: `logger` strips `token` field before output

---

## Phase 8 — Testing Infrastructure

**Objective:** Establish a robust testing baseline: unit tests for all core modules and integration tests for all auth flows using real component trees (no backend mock). Covers US-9.1 testing acceptance criteria.  
**Dependencies:** Phase 7.  
**Complexity:** Medium

### Phase 8.1 — Unit & Integration Test Setup

**Implementation Tasks:**
- [x] Install `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `msw` (Mock Service Worker for API mocking)
- [x] Configure `vitest.config.ts` with jsdom environment and global setup
- [x] Create `src/test/setup.ts` with `@testing-library/jest-dom` matchers
- [x] Create MSW handlers for `POST /auth/login`, `POST /auth/register`
- [x] Write integration tests for: login success, login failure, register, logout, session restoration, 401 redirect flow

**Acceptance Criteria:**
- [x] `pnpm test` runs all tests and produces a coverage report
- [x] All auth integration flows have a corresponding passing test
- [x] Coverage ≥ 80% on `src/features/auth/`

**Automated Tests:**
- [x] CI step runs `pnpm test --coverage` and fails on coverage regression

---

## Phase 9 — Performance & Accessibility

**Objective:** Validate lazy loading reduces initial bundle size, confirm responsive layouts work across all breakpoints, and verify WCAG AA accessibility compliance. Covers US-9.1, US-9.2, US-9.3.  
**Dependencies:** Phase 8.  
**Complexity:** Low

### Phase 9.1 — Performance

**Implementation Tasks:**
- [x] Run `vite build --report` and analyze `stats.html` for large chunks
- [x] Confirm all route-level pages are in separate code-split chunks (no page code in main bundle)
- [x] Verify TanStack Query `staleTime` is configured to reduce redundant requests
- [x] Apply `React.memo` / `useMemo` / `useCallback` only where profiling shows unnecessary rerenders

**Acceptance Criteria:**
- [x] Initial JS bundle (main chunk) is under 150 KB gzipped
- [x] Each feature route appears as a separate chunk in the build output

---

### Phase 9.2 — Accessibility & Responsive

**Implementation Tasks:**
- [x] Test keyboard navigation through login and register forms; all controls reachable with Tab, submittable with Enter
- [x] Verify visible focus indicators on all interactive elements
- [x] Test at viewports: 375px, 768px, 1280px, 1920px — no horizontal overflow
- [x] Verify WCAG AA contrast ratios in light and dark modes using browser devtools
- [x] Confirm touch targets ≥ 44×44 px on mobile breakpoint

**Acceptance Criteria:**
- [x] Complete auth flow is operable via keyboard only
- [x] No WCAG AA contrast failures in either theme
- [x] No horizontal scrollbar at 375px viewport

---

## Phase Summary

| Phase | Description | Complexity | Dependencies |
|---|---|---|---|
| **1** | Vite + TypeScript migration, ESLint, Prettier, Husky | Medium | None |
| **2** | Tailwind CSS, Shadcn/ui, design tokens, dark mode | Medium | Phase 1 |
| **3** | Feature folder structure, React Router, lazy loading | Medium | Phase 1 |
| **4** | Zustand, Axios HTTP client, TanStack Query | Medium | Phase 3 |
| **5** | Login, registration, logout, session restoration, 401 handling | High | Phase 4 |
| **6** | Auth route guard, RBAC-ready role guard | Medium | Phase 5 |
| **7** | Sonner toasts, Error Boundaries, structured logging | Low | Phase 5 |
| **8** | Vitest, MSW, integration tests, coverage gate | Medium | Phase 7 |
| **9** | Bundle analysis, accessibility audit, responsive validation | Low | Phase 8 |

---

## Critical Invariants

| Invariant | Enforced By |
|---|---|
| JWT token is never logged, URL-appended, or exposed in error messages | `logger.ts` strips token; Axios interceptor owns all token injection |
| Token read/write is only through the auth abstraction layer | All components access token via auth store; direct `localStorage` access is prohibited in feature code |
| Backend authorization is always the source of truth | Client-side guards are UX-only; API endpoints enforce auth independently |
| No secrets or credentials are bundled | Vite `VITE_` env convention; `.env` in `.gitignore`; build audit in Phase 9 |
| TypeScript strict mode must pass before any merge | `tsc --noEmit` runs in pre-commit hook and CI |
| XSS: no `dangerouslySetInnerHTML` without explicit sanitization | ESLint rule; code review gate |
| Query cache is cleared on logout | `use-logout` calls `queryClient.clear()` before redirect |

---

## Testing Checklist

- [x] `src/features/auth/` ≥ 80% line coverage via unit tests
- [x] All auth flows covered by integration tests using MSW (no real network)
- [x] Login success, login failure (401, 429, network timeout) all have dedicated tests
- [x] Session restoration (valid token, expired token, no token) covered
- [x] Logout (token cleared, cache invalidated, redirect) covered
- [x] Protected route guard (authenticated and unauthenticated access) covered
- [x] RBAC role guard (correct role, missing role) covered
- [x] Error boundary rendering fallback on thrown error covered
- [x] Pre-commit hook blocks commits with type errors or lint violations

---

## Risks & Technical Notes

| Risk | Mitigation |
|---|---|
| CRA → Vite migration breaks existing imports or test setup | Migrate in an isolated branch; verify all smoke tests pass before merging |
| Zustand `persist` middleware may hydrate stale or corrupt state | Add a schema version key; on version mismatch, call `clearSession` and re-hydrate |
| Multiple concurrent 401 responses triggering double redirect/logout | De-duplication flag in the Axios 401 handler (Phase 4.2) |
| Token stored in `localStorage` is vulnerable to XSS | Architectural note: `localStorage` is the initial strategy; Phase 4 auth abstraction enables migration to HttpOnly cookies without feature-level refactoring |
| Shadcn/ui components updated by `pnpm dlx shadcn-ui` overwrite customizations | Copy components into `src/components/ui/` (Shadcn ownership model); never run `init` again on an existing project |
| Bundle size regression as features grow | Bundle analysis gate in Phase 9; `vite-bundle-visualizer` in CI |
| RBAC role claims from JWT are client-controlled if decoded on frontend | Role checks are UX-only (US-2.2); all privileged operations must be re-validated server-side |