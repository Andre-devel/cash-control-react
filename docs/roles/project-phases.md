# Implementation Roadmap — Roles Feature

**Stack:** TypeScript · React 19 · Vite · React Router · Tailwind CSS · Shadcn/ui · Zustand · TanStack Query · Axios · Zod · React Hook Form · Sonner  
**Architecture:** Stateless JWT · Feature-based · RBAC · Permission-guarded routes · Mobile-first  
**Generated:** 2026-05-23  
**Status legend:** `[x]` = implemented · `[ ]` = pending

---

## Codebase Inspection Summary

| Area | Status |
|---|---|
| Build & tooling | `[x]` Vite + TypeScript + ESLint + Prettier + Husky — fully configured |
| Design system | `[x]` Tailwind CSS + Shadcn/ui + design tokens + dark mode — fully configured |
| Router | `[x]` React Router v6 with `createBrowserRouter`, lazy loading, layouts configured |
| State — client | `[x]` Zustand auth store with `token`, `user`, `roles`, `permissions`, `theme` |
| State — server | `[x]` TanStack Query `QueryClient` and `QueryClientProvider` configured |
| HTTP client | `[x]` Axios instance with auth interceptor, 401 handler, error normalization |
| Auth feature | `[x]` Login, register, logout, session restoration, route guards implemented |
| Toast system | `[x]` Sonner + `src/lib/toast.ts` wrapper — ready for use |
| Logger | `[x]` `src/lib/logger.ts` — structured JSON logging, no PII/token leakage |
| Test infrastructure | `[x]` Vitest + Testing Library + MSW — configured and baseline tests passing |
| Roles feature | `[x]` Phase 1 complete — types, query keys, placeholder pages, routes registered |
| Roles routes | `[x]` `/admin/roles` and `/admin/roles/:roleId` registered under `ProtectedLayout` |
| Roles API layer | `[x]` All API functions, TanStack Query hooks, and MSW handlers implemented |
| Roles UI | `[x]` Phase 3 complete — list page, detail page, permissions panel |
| Roles CRUD UI | `[x]` Phase 4 complete — create/update/delete forms, confirmation dialogs, schemas |
| Roles permission UI | `[x]` Phase 5 complete — assign/revoke permissions in RolePermissionsPanel, usePermissions hook, GET /permissions |
| Roles user UI | `[x]` Phase 6 complete — UserRolesPanel component, assign/revoke roles on a user, exported from feature index |
| Roles authorization | `[x]` Phase 7 complete — PermissionGuard, useRolePermissions, permission-aware UI rendering |

**Overall status:** Phase 7 complete. Full coverage testing (Phase 8) is next.

---

## Implementation Strategy

Phases are ordered to respect hard dependencies within the Roles feature: the
type layer and query keys must exist before any hook or API function is written;
hooks must exist before pages are built; pages must exist before routes are
registered; permission guards are applied last, once the UI is stable.

Testing infrastructure (MSW, Vitest) is already in place — MSW handlers for roles
endpoints are written at Phase 2 alongside the API layer, so every subsequent
phase can be tested as it lands.

The feature is implemented in isolation under `src/features/roles/` and integrates
with existing shared infrastructure (Axios instance, auth store, toast wrapper,
logger, router) without modifying any other feature's code.

---

## Phase 1 — Feature Scaffolding

**Objective:** Create the canonical folder structure for the Roles feature, define all TypeScript types, establish query key constants, and register lazy-loaded routes. This phase produces no visible UI but is the structural prerequisite for all subsequent phases.  
**Dependencies:** Foundation (Phases 1–8 of the base template).  
**Complexity:** Low

### Phase 1.1 — Folder Structure & Types

**Implementation Tasks:**
- [x] Create `src/features/roles/` with subdirectories: `api/`, `components/`, `hooks/`, `pages/`, `schemas/`, `types/`
- [x] Add barrel `index.ts` to each subdirectory
- [x] Create `src/features/roles/types/role.types.ts` with:
  - `Role` — `{ id, name, description, system, permissions }`
  - `Permission` — `{ id, name, description }`
  - `PaginatedRoles` — `{ content: Role[], page, size, totalElements, totalPages }`
  - `CreateRolePayload` — `{ name, description? }`
  - `UpdateRolePayload` — `{ description? }`
  - `AssignPermissionPayload` — `{ permissionId }`
  - `AssignRolePayload` — `{ roleId }`
- [x] Create `src/features/roles/api/role-keys.ts` with the `roleKeys` factory:
  ```ts
  roleKeys.all → ['roles']
  roleKeys.lists() → ['roles', 'list']
  roleKeys.list(params) → ['roles', 'list', params]
  roleKeys.details() → ['roles', 'detail']
  roleKeys.detail(id) → ['roles', 'detail', id]
  ```
- [x] Export all types through `src/features/roles/types/index.ts`
- [x] Export query keys through `src/features/roles/api/index.ts`

**Acceptance Criteria:**
- [x] TypeScript compilation resolves all types with no errors
- [x] `roleKeys` constants are type-safe and produce consistent arrays
- [x] No circular imports between `types/` and `api/`

**Automated Tests:**
- [x] TypeScript compilation (`tsc --noEmit`) exits 0

---

### Phase 1.2 — Route Registration

**Implementation Tasks:**
- [x] Add route constants to `src/app/router/routes.ts`:
  ```ts
  ROLES: '/admin/roles'
  ROLE_DETAIL: '/admin/roles/:roleId'
  ```
- [x] Register lazy-loaded routes in the router configuration under the protected layout:
  ```tsx
  const RolesPage = lazy(() => import('@/features/roles/pages/roles-page'))
  const RoleDetailPage = lazy(() => import('@/features/roles/pages/role-detail-page'))
  ```
- [x] Create placeholder page components (`roles-page.tsx`, `role-detail-page.tsx`) that render a loading skeleton — routes must resolve before feature UI is built
- [x] Wrap both routes with the existing `AuthGuard`; permission guard is added in Phase 7

**Acceptance Criteria:**
- [x] Navigating to `/admin/roles` renders without a router error
- [x] Navigating to `/admin/roles/any-id` renders without a router error
- [x] Both routes appear as separate chunks in the build output (`pnpm build`)
- [x] No existing routes are broken by the addition

**Automated Tests:**
- [x] Route rendering test: `/admin/roles` and `/admin/roles/:roleId` render placeholder without crashing

---

## Phase 2 — API Layer

**Objective:** Implement all API functions for the nine roles endpoints and write the corresponding TanStack Query hooks (queries and mutations). Write MSW handlers in parallel so tests can cover subsequent phases without a live backend.  
**Dependencies:** Phase 1.  
**Complexity:** Medium

### Phase 2.1 — API Functions & MSW Handlers

**Implementation Tasks:**
- [x] Create `src/features/roles/api/roles.api.ts` using the centralized Axios instance; implement:
  - `getRoles(params: PaginationParams): Promise<PaginatedRoles>` → `GET /api/v1/roles`
  - `getRoleById(roleId: string): Promise<Role>` → `GET /api/v1/roles/:roleId`
  - `createRole(payload: CreateRolePayload): Promise<Role>` → `POST /api/v1/roles`
  - `updateRole(roleId: string, payload: UpdateRolePayload): Promise<void>` → `PUT /api/v1/roles/:roleId`
  - `deleteRole(roleId: string): Promise<void>` → `DELETE /api/v1/roles/:roleId`
  - `assignPermissionToRole(roleId: string, permissionId: string): Promise<void>` → `POST /api/v1/roles/:roleId/permissions`
  - `revokePermissionFromRole(roleId: string, permissionId: string): Promise<void>` → `DELETE /api/v1/roles/:roleId/permissions/:permissionId`
  - `assignRoleToUser(userId: string, roleId: string): Promise<void>` → `POST /api/v1/users/:userId/roles`
  - `revokeRoleFromUser(userId: string, roleId: string): Promise<void>` → `DELETE /api/v1/users/:userId/roles/:roleId`
- [x] Add MSW handlers in `src/test/handlers/` for all nine endpoints:
  - Happy-path responses (200, 201, 204)
  - Error responses (403, 404, 409) as named overrides for test scenarios

**Acceptance Criteria:**
- [x] Each API function calls the correct HTTP method and URL
- [x] All functions pass the `Authorization` header via the Axios interceptor (no manual header injection)
- [x] MSW handlers intercept requests correctly in test environment

**Automated Tests:**
- [x] Unit: `getRoles` calls `GET /api/v1/roles` with pagination params
- [x] Unit: `createRole` calls `POST /api/v1/roles` with correct payload
- [x] Unit: `deleteRole` calls `DELETE /api/v1/roles/:roleId`
- [x] Unit: `assignPermissionToRole` calls `POST /api/v1/roles/:roleId/permissions`
- [x] Unit: `assignRoleToUser` calls `POST /api/v1/users/:userId/roles`

---

### Phase 2.2 — TanStack Query Hooks

**Implementation Tasks:**
- [x] Create `src/features/roles/hooks/use-roles.ts` — `useQuery` wrapping `getRoles`; uses `roleKeys.list(params)`; applies `keepPreviousData` for pagination
- [x] Create `src/features/roles/hooks/use-role.ts` — `useQuery` wrapping `getRoleById`; uses `roleKeys.detail(roleId)`
- [x] Create `src/features/roles/hooks/use-create-role.ts` — `useMutation` wrapping `createRole`; on success: invalidate `roleKeys.lists()`, show success toast, call optional `onSuccess` callback
- [x] Create `src/features/roles/hooks/use-update-role.ts` — `useMutation` wrapping `updateRole`; on success: invalidate `roleKeys.detail(roleId)`, show success toast
- [x] Create `src/features/roles/hooks/use-delete-role.ts` — `useMutation` wrapping `deleteRole`; on success: invalidate `roleKeys.lists()`, show success toast; on 409: show conflict toast without rethrowing
- [x] Create `src/features/roles/hooks/use-assign-permission-to-role.ts` — `useMutation`; on success: invalidate `roleKeys.detail(roleId)`, show success toast
- [x] Create `src/features/roles/hooks/use-revoke-permission-from-role.ts` — `useMutation`; on success: invalidate `roleKeys.detail(roleId)`, show success toast
- [x] Create `src/features/roles/hooks/use-assign-role-to-user.ts` — `useMutation`; on success: invalidate user query keys, show success toast
- [x] Create `src/features/roles/hooks/use-revoke-role-from-user.ts` — `useMutation`; on success: invalidate user query keys, show success toast
- [x] Export all hooks through `src/features/roles/hooks/index.ts`

**Acceptance Criteria:**
- [x] `useRoles` returns paginated data and exposes `isLoading`, `isError`, and `data`
- [x] All mutation hooks expose `mutate`, `isPending`, and `isError`
- [x] Cache invalidation fires for the correct query keys on every mutation success
- [x] Toast calls go through `src/lib/toast.ts` — no direct Sonner imports in hooks

**Automated Tests:**
- [x] Unit: `useRoles` fetches and returns paginated data (MSW mock)
- [x] Unit: `useCreateRole` invalidates `roleKeys.lists()` on success
- [x] Unit: `useDeleteRole` shows conflict toast on 409 without throwing
- [x] Unit: `useAssignPermissionToRole` invalidates `roleKeys.detail(roleId)` on success

---

## Phase 3 — Role Management Pages

**Objective:** Build the paginated roles list page and the role detail page. Both pages integrate the hooks from Phase 2 and establish the full data-fetching and navigation skeleton for the Roles feature.  
**Dependencies:** Phase 2.  
**Complexity:** Medium

### Phase 3.1 — Roles List Page

**Implementation Tasks:**
- [x] Create `src/features/roles/components/role-card.tsx` — renders role name, description, and system badge; links to `/admin/roles/:roleId`
- [x] Create `src/features/roles/components/role-list.tsx` — renders a list of `RoleCard` components; accepts `roles`, `isLoading`, and `isEmpty` props
- [x] Implement `src/features/roles/pages/roles-page.tsx`:
  - Local `useState` for `page` and `size` pagination
  - `useRoles({ page, size })` for data fetching
  - Pagination controls (previous/next) wired to local state
  - Empty state: "No roles found" — with a "New Role" button when user has `role:create` (permission check stubbed, wired in Phase 7)
  - Loading skeleton during initial fetch
  - Error state with a retry option

**Acceptance Criteria:**
- [x] Roles list renders all roles returned by the API
- [x] Pagination controls navigate between pages; previous page data stays visible during fetch
- [x] Empty state renders with correct message and conditional create action
- [x] Loading state renders skeleton without layout shift
- [x] Clicking a role card navigates to `/admin/roles/:roleId`

**Automated Tests:**
- [x] Integration: `RolesPage` renders role list from MSW data
- [x] Integration: pagination controls trigger refetch with updated `page` param
- [x] Integration: empty state renders when API returns zero items
- [x] Integration: error state renders when API returns 500

---

### Phase 3.2 — Role Detail Page

**Implementation Tasks:**
- [x] Create `src/features/roles/components/role-permissions-panel.tsx` — renders the list of permissions assigned to the role; each item shows permission name and description; "Remove" action stubbed (wired in Phase 5); "Assign Permission" button stubbed (wired in Phase 5)
- [x] Implement `src/features/roles/pages/role-detail-page.tsx`:
  - Reads `:roleId` from route params
  - `useRole(roleId)` for data fetching
  - Renders: role name, description, system badge, `RolePermissionsPanel`
  - Stubbed action buttons: "Edit Role", "Delete Role" (wired in Phase 4)
  - Not-found state when API returns 404
  - Loading skeleton during fetch
  - Back-navigation link to `/admin/roles`

**Acceptance Criteria:**
- [x] Detail page renders role name, description, system badge, and permission list
- [x] Not-found state renders and offers navigation back to the list
- [x] Loading skeleton renders without layout shift
- [x] System role badge is visible when `system: true`

**Automated Tests:**
- [x] Integration: `RoleDetailPage` renders role data from MSW
- [x] Integration: not-found state renders on 404 response
- [x] Integration: permissions panel renders all assigned permissions

---

## Phase 4 — Role CRUD UI

**Objective:** Implement the create, update, and delete role interactions — validated forms, confirmation dialogs, mutation dispatch, and feedback. Covers US-1.2, US-1.4, and US-1.5.  
**Dependencies:** Phase 3.  
**Complexity:** Medium

### Phase 4.1 — Create Role Form

**Implementation Tasks:**
- [x] Create `src/features/roles/schemas/create-role.schema.ts`:
  ```ts
  z.object({
    name: z.string().min(2).max(50).toUpperCase(),
    description: z.string().max(255).optional(),
  })
  ```
- [x] Create `src/features/roles/components/role-form.tsx` — shared form component used for both create and update; accepts `defaultValues`, `onSubmit`, `isPending`, and `mode` (`'create' | 'update'`) props; `name` field is read-only in `'update'` mode
- [x] Wire create flow in `RolesPage`:
  - "New Role" button opens a modal containing `RoleForm` in create mode
  - On submit: call `useCreateRole`, close modal on success, show success toast
  - On 409: map to inline `name` field error

**Acceptance Criteria:**
- [x] Form blocks submission when `name` is empty or under 2 characters
- [x] `name` value is normalized to uppercase before submission
- [x] Submit button is disabled and shows a loading indicator during mutation
- [x] Success closes the modal and refreshes the list
- [x] 409 Conflict renders as an inline error on the `name` field

**Automated Tests:**
- [x] Unit: Zod schema rejects empty name and names under 2 characters
- [x] Unit: Zod schema normalizes name to uppercase
- [x] Integration: create form → success → modal closes and list refetches
- [x] Integration: create form → 409 → inline error rendered on name field

---

### Phase 4.2 — Update & Delete Role

**Implementation Tasks:**
- [x] Create `src/features/roles/schemas/update-role.schema.ts`:
  ```ts
  z.object({
    description: z.string().max(255).optional(),
  })
  ```
- [x] Wire update flow in `RoleDetailPage`:
  - "Edit Role" button opens a modal containing `RoleForm` in update mode, pre-populated with current `description`
  - On submit: call `useUpdateRole`, close modal on success, show success toast
- [x] Wire delete flow in `RoleDetailPage`:
  - "Delete Role" button is disabled (with tooltip) when `role.system === true`
  - "Delete Role" button opens a confirmation dialog displaying the role name
  - On confirm: call `useDeleteRole`, on success navigate to `/admin/roles`, show success toast
  - On 409: show conflict toast ("Role is still assigned to users — remove all assignments first"); do not navigate
  - On cancel: close dialog, no API call dispatched

**Acceptance Criteria:**
- [x] Update form pre-populates `description`; `name` field is read-only
- [x] Successful update shows success toast and reflects new description without full page reload
- [x] Delete confirmation dialog displays the role name
- [x] Confirming delete on an unused role navigates to the list
- [x] 409 on delete shows a descriptive error toast and keeps the user on the detail page
- [x] Delete button is visually disabled and non-interactive for system roles

**Automated Tests:**
- [x] Unit: `update-role.schema.ts` rejects description over 255 characters
- [x] Integration: update form → success → detail page reflects updated description
- [x] Integration: delete → confirmation → success → navigates to list
- [x] Integration: delete → 409 → error toast rendered, no navigation
- [x] Integration: system role → delete button is disabled

---

## Phase 5 — Permission Assignment UI

**Objective:** Implement the permission assignment and revocation interactions in the `RolePermissionsPanel`. Covers US-2.1 and US-2.2.  
**Dependencies:** Phase 4.  
**Complexity:** Medium

### Phase 5.1 — Assign & Revoke Permission on Role

**Implementation Tasks:**
- [x] Extend `src/features/roles/components/role-permissions-panel.tsx`:
  - "Assign Permission" button (permission-check stubbed; wired in Phase 7) opens a modal with a permission selector
  - Permission selector fetches available permissions from `/api/v1/permissions` (reuse or create `usePermissions` hook)
  - On selection: call `useAssignPermissionToRole(roleId, permissionId)`
  - On success (204): close modal, invalidate `roleKeys.detail(roleId)`, show success toast
  - On 409: show toast "Permission already assigned to this role"
  - Each assigned permission item has a "Remove" icon button (permission-check stubbed; wired in Phase 7)
  - Clicking "Remove" opens a confirmation dialog: "Remove [permission name] from [role name]?"
  - On confirm: call `useRevokePermissionFromRole(roleId, permissionId)`
  - On success (204): invalidate `roleKeys.detail(roleId)`, show success toast
  - On cancel: no API call dispatched
- [x] Empty state: "No permissions assigned" message with "Assign Permission" button

**Acceptance Criteria:**
- [x] Assign permission modal lists available permissions and submits the selected one
- [x] Successful assignment adds the permission to the panel without full page reload
- [x] 409 on assign shows error toast without closing the modal
- [x] Revoke confirmation dialog displays permission name and role name
- [x] Successful revocation removes the permission from the panel without full page reload
- [x] Empty state renders with the assign action

**Automated Tests:**
- [x] Integration: assign flow → success → permission appears in panel
- [x] Integration: assign → 409 → error toast, permission not duplicated in panel
- [x] Integration: revoke → confirm → success → permission removed from panel
- [x] Integration: revoke → cancel → no mutation dispatched

---

## Phase 6 — User Role Assignment UI

**Objective:** Implement the role assignment and revocation interactions in the user management context. These mutations use user-scoped endpoints and invalidate user query keys. Covers US-3.1 and US-3.2.  
**Dependencies:** Phase 5.  
**Complexity:** Low

### Phase 6.1 — Assign & Revoke Role on User

**Implementation Tasks:**
- [x] Create `src/features/roles/components/user-roles-panel.tsx` — renders the list of roles assigned to a user; designed for embedding in the user detail page
- [x] "Assign Role" button opens a modal with a role selector (reuses `useRoles` to populate options)
- [x] On selection: call `useAssignRoleToUser(userId, roleId)`
- [x] On success (204): invalidate user query keys, show success toast, close modal
- [x] On 409: show toast "Role already assigned to this user"
- [x] Each assigned role item has a "Remove" icon button
- [x] Clicking "Remove" opens a confirmation dialog: "Remove [role name] from [user name]?"
- [x] On confirm: call `useRevokeRoleFromUser(userId, roleId)`
- [x] On success (204): invalidate user query keys, show success toast
- [x] Export `UserRolesPanel` through `src/features/roles/index.ts` for use by the Users feature

**Acceptance Criteria:**
- [x] Assign role modal lists available roles and submits the selected one
- [x] Successful assignment adds the role to the panel without full page reload
- [x] 409 on assign shows error toast without duplicating the role in the panel
- [x] Revoke confirmation dialog displays role name
- [x] Successful revocation removes the role from the panel without full page reload
- [x] User query cache is invalidated (not roles cache) on both success paths

**Automated Tests:**
- [x] Integration: assign role to user → success → role appears in panel
- [x] Integration: assign → 409 → error toast, panel unchanged
- [x] Integration: revoke → confirm → success → role removed from panel
- [x] Integration: revoke → cancel → no mutation dispatched

---

## Phase 7 — Authorization & Permission Guards

**Objective:** Apply permission-guarded route access to the roles routes and wire all permission-aware UI rendering using the authenticated user's permissions from the auth store. Covers US-4.1 and US-4.2.  
**Dependencies:** Phase 6.  
**Complexity:** Low

### Phase 7.1 — Permission-Guarded Routes

**Implementation Tasks:**
- [x] Create or extend `src/app/router/guards/permission-guard.tsx`: accepts `requiredPermissions: string[]` and `requireAll?: boolean` props; redirects to the 403 page if the user lacks the required permissions
- [x] Apply `PermissionGuard` to `/admin/roles` and `/admin/roles/:roleId`:
  - Required: at least one of `role:create`, `role:update`, `role:delete`
- [x] Log `FORBIDDEN_ROUTE_ACCESS_ATTEMPT` via `src/lib/logger.ts` on redirect

**Acceptance Criteria:**
- [x] Users without any of `role:create`, `role:update`, `role:delete` are redirected to the 403 page when accessing any roles route
- [x] Users with at least one qualifying permission reach the roles pages
- [x] `FORBIDDEN_ROUTE_ACCESS_ATTEMPT` is logged with user ID and attempted path (no token)

**Automated Tests:**
- [x] Unit: `PermissionGuard` redirects to 403 when no qualifying permission is present
- [x] Unit: `PermissionGuard` renders children when at least one qualifying permission is present

---

### Phase 7.2 — Permission-Aware UI Rendering

**Implementation Tasks:**
- [x] Create `src/features/roles/hooks/use-role-permissions.ts` — derives the following boolean flags from the auth store:
  - `canCreateRole` → `role:create`
  - `canUpdateRole` → `role:update`
  - `canDeleteRole` → `role:delete`
  - `canGrantPermission` → `permission:grant`
  - `canRevokePermission` → `permission:revoke`
- [x] Wire flags into all components:
  - `RolesPage` — "New Role" button: visible only when `canCreateRole`
  - `RoleDetailPage` — "Edit Role": visible only when `canUpdateRole`
  - `RoleDetailPage` — "Delete Role": visible only when `canDeleteRole`
  - `RolePermissionsPanel` — "Assign Permission": visible only when `canGrantPermission`
  - `RolePermissionsPanel` — "Remove" per item: visible only when `canRevokePermission`
  - `UserRolesPanel` — "Assign Role": visible only when user has `role:update`
  - `UserRolesPanel` — "Remove" per item: visible only when user has `role:update`
- [x] Disabled actions (e.g., delete on system roles) must use `aria-disabled` and include a visible tooltip

**Acceptance Criteria:**
- [x] A user with only `role:update` sees "Edit Role" but not "New Role" or "Delete Role"
- [x] A user with only `permission:revoke` sees "Remove" on permission items but not "Assign Permission"
- [x] All permission checks derive exclusively from the auth store — no additional API calls per component
- [x] `aria-disabled` and tooltip are present on the delete button for system roles

**Automated Tests:**
- [x] Unit: `useRolePermissions` returns `canCreateRole: true` when `role:create` is in auth store
- [x] Unit: `useRolePermissions` returns `canDeleteRole: false` when `role:delete` is absent
- [x] Integration: "New Role" button absent when user lacks `role:create`
- [x] Integration: "Delete Role" disabled with aria-disabled on system role

---

## Phase 8 — Testing

**Objective:** Achieve ≥ 80% line coverage on `src/features/roles/` through unit and integration tests. All happy paths and error paths defined in the user stories must have a corresponding test.  
**Dependencies:** Phase 7.  
**Complexity:** Medium

### Phase 8.1 — Unit Tests

**Implementation Tasks:**
- [x] Unit tests for all Zod schemas (`create-role.schema.ts`, `update-role.schema.ts`): valid payloads, boundary values, rejection cases
- [x] Unit tests for all hooks: verify correct query keys, mutation callbacks, cache invalidation targets, and toast calls using MSW
- [x] Unit tests for `useRolePermissions`: all six flags for different permission combinations
- [x] Unit tests for `PermissionGuard`: redirect and pass-through scenarios
- [x] Unit tests for `RoleCard`: renders name, description, system badge, and correct link

**Acceptance Criteria:**
- [x] All schema edge cases (empty name, name under 2 chars, description over 255 chars) have dedicated tests
- [x] All mutation hooks have tests for both success and error (403, 409, 404) paths
- [x] `useRolePermissions` is tested for at least 6 permission state combinations

**Automated Tests:**
- [x] `pnpm test src/features/roles/` passes with no failures

---

### Phase 8.2 — Integration Tests

**Implementation Tasks:**
- [x] Integration test: roles list — fetches and renders roles, paginates, shows empty state
- [x] Integration test: create role — form validation, success flow, 409 conflict mapping
- [x] Integration test: update role — pre-populated form, success flow
- [x] Integration test: delete role — confirmation dialog, success navigation, 409 conflict toast, system role disabled state
- [x] Integration test: assign permission to role — selector, success, 409 toast
- [x] Integration test: revoke permission from role — confirmation, success, cancel (no-op)
- [x] Integration test: assign role to user — selector, success, 409 toast
- [x] Integration test: revoke role from user — confirmation, success, cancel (no-op)
- [x] Integration test: permission guard — redirect on insufficient permissions, pass-through on qualifying permissions
- [x] Integration test: permission-aware rendering — correct buttons shown/hidden per permission set

**Acceptance Criteria:**
- [x] All happy-path and error-path flows have a corresponding integration test
- [x] Tests use MSW for API mocking — no real network calls
- [x] Coverage ≥ 80% on `src/features/roles/`

**Automated Tests:**
- [x] `pnpm test --coverage src/features/roles/` passes and meets coverage threshold

---

## Phase 9 — Performance & Accessibility

**Objective:** Validate that the Roles feature does not regress bundle size, confirm responsive layouts across all breakpoints, and verify WCAG AA accessibility compliance for all admin surfaces. Covers US-7.1, US-7.2.  
**Dependencies:** Phase 8.  
**Complexity:** Low

### Phase 9.1 — Performance

**Implementation Tasks:**
- [x] Run `pnpm build` and confirm `roles-page` and `role-detail-page` appear as separate chunks in the build output
- [x] Verify `useRoles` uses `keepPreviousData` — confirm in integration tests that previous page data remains visible during refetch
- [x] Confirm no roles query key is invalidated globally — only targeted keys (`roleKeys.lists()`, `roleKeys.detail(id)`) are invalidated on mutations
- [x] Review bundle for accidental inclusion of all permissions data in the roles chunk

**Acceptance Criteria:**
- [x] Both roles pages appear as separate code-split chunks
- [x] Main bundle size does not increase by more than 5 KB gzipped after the roles feature is added
- [x] No unnecessary full-cache invalidations exist in any roles mutation

---

### Phase 9.2 — Accessibility & Responsive

**Implementation Tasks:**
- [x] Test keyboard navigation: tab through roles list, open detail, open create modal, submit form, open confirmation dialog — all operable via keyboard
- [x] Verify confirmation dialogs trap focus and dismiss on Escape
- [x] Verify all form fields have associated `<label>` elements and ARIA error attributes
- [x] Verify `aria-disabled` and tooltip are present on the system-role delete button
- [x] Test at viewports: 375px, 768px, 1280px, 1920px — no horizontal overflow in list or detail view
- [x] Verify touch targets ≥ 44×44 px for all action buttons on mobile breakpoint
- [x] Verify WCAG AA contrast ratios in light and dark modes for all roles UI elements

**Acceptance Criteria:**
- [x] Full roles admin flow is operable via keyboard only (no mouse required)
- [x] Confirmation dialogs are keyboard-dismissible and focus-trapped
- [x] No WCAG AA contrast failures in either theme
- [x] No horizontal scrollbar at 375px viewport
- [x] All action buttons meet 44×44 px minimum touch target size

---

## Phase Summary

| Phase | Description | Complexity | Dependencies |
|---|---|---|---|
| **1** | Folder structure, TypeScript types, query keys, route registration | Low | Base template |
| **2** | API functions (`roles.api.ts`), TanStack Query hooks, MSW handlers | Medium | Phase 1 |
| **3** | Roles list page, role detail page, base components | Medium | Phase 2 |
| **4** | Create role form, update role form, delete confirmation | Medium | Phase 3 |
| **5** | Permission assignment and revocation on roles | Medium | Phase 4 |
| **6** | Role assignment and revocation on users | Low | Phase 5 |
| **7** | Permission-guarded routes, permission-aware UI rendering | Low | Phase 6 |
| **8** | Unit tests, integration tests, coverage gate | Medium | Phase 7 |
| **9** | Bundle analysis, accessibility audit, responsive validation | Low | Phase 8 |

---

## Critical Invariants

| Invariant | Enforced By |
|---|---|
| All roles API calls inject `Authorization` via Axios interceptor | No manual header injection in `roles.api.ts`; interceptor owns token injection |
| Toast calls go through `src/lib/toast.ts` only | No direct Sonner imports in hooks or feature components |
| Permission checks source exclusively from the auth store | `useRolePermissions` hook reads auth store; no per-component API calls for permissions |
| Backend is the authoritative authorization layer | Frontend guards are UX only; every API endpoint enforces authorization independently |
| Cache invalidation is targeted, never global | Only `roleKeys.lists()` or `roleKeys.detail(id)` are invalidated — never `queryClient.clear()` |
| Destructive operations require confirmation | Delete role, revoke permission from role, and revoke role from user all require a confirmation dialog |
| System roles are immutable from the UI | `role.system === true` disables the delete button; backend rejects the request if bypassed |
| No roles data persists in Zustand | All roles server state lives in TanStack Query; Zustand stores only auth session metadata |
| Logger strips token and PII from all role event log entries | `src/lib/logger.ts` is the only logging interface used in feature code |

---

## Testing Checklist

- [x] `src/features/roles/` ≥ 80% line coverage via unit and integration tests
- [x] All Zod schema edge cases covered (empty, boundary, invalid inputs)
- [x] All mutation hooks tested for success and error (403, 404, 409) paths
- [x] Roles list — fetch, pagination, empty state, error state tested
- [x] Create role — validation, success, 409 conflict tested
- [x] Update role — pre-population, success tested
- [x] Delete role — confirmation, success, 409 blocked, system role disabled tested
- [x] Assign permission to role — success, 409 tested
- [x] Revoke permission from role — confirmation, success, cancel (no-op) tested
- [x] Assign role to user — success, 409 tested
- [x] Revoke role from user — confirmation, success, cancel (no-op) tested
- [x] Permission guard — redirect on insufficient permissions, pass-through tested
- [x] Permission-aware rendering — all six flags tested for correct show/hide behavior

---

## Risks & Technical Notes

| Risk | Mitigation |
|---|---|
| Permission state in auth store is stale after backend role changes | On any roles mutation, consider invalidating the current user's session data or prompting a re-fetch; backend enforces authorization on every request regardless |
| Assign permission selector loads all permissions at once (no pagination) | If the permission catalog is large, implement search/filter in the selector modal; defer to post-MVP if catalog is small |
| Concurrent admin actions (two admins editing the same role) | 409 and 404 responses are handled gracefully; advise the user to refresh; optimistic updates are not used to avoid conflicts |
| `useRolePermissions` reading from auth store could be stale if permissions change mid-session | Permissions in auth store are set at login; for security-sensitive operations, the backend enforces authorization — stale frontend flags only affect visibility, not access |
| `keepPreviousData` may show outdated list after a delete | Ensure `useDeleteRole` invalidates `roleKeys.lists()` synchronously before the user sees the stale list; React Query re-renders after invalidation resolves |
| User detail page does not belong to the Roles feature | `UserRolesPanel` is exported from `src/features/roles/index.ts` for embedding; the Users feature imports it — this is the intended cross-feature contract |
| Growing role catalog degrades list performance | Pagination is already implemented; add server-side name filtering in a future phase if catalog exceeds 100 entries |