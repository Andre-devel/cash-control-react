# Roles Feature — Technical & Architectural Specification

## Document Purpose

This document defines the technical and architectural specification of the Roles
feature within the React authentication template.

The Roles feature covers role management (CRUD), permission assignment to roles,
and role assignment to users — fully integrated with the backend RBAC system
exposed at `/api/v1/roles` and `/api/v1/users/:id/roles`.

This document defines architectural standards, technical decisions, frontend
patterns, and engineering conventions specific to the Roles feature. It does not
define implementation tasks, UI mockups, or delivery phases.

---

# 1. Feature Overview

## 1.1 Purpose

The Roles feature provides the administrative interface for managing roles in a
Role-Based Access Control (RBAC) system.

It allows authorized users to:

* Create and manage roles
* Assign or revoke permissions on a role
* Assign or revoke roles on a user

All operations are protected by backend permission enforcement. The frontend
applies permission-based guards to prevent rendering of unauthorized actions.

---

## 1.2 Core Capabilities

| Capability                     | Description                                           |
| ------------------------------ | ----------------------------------------------------- |
| Role CRUD                      | Create, read, update, and delete roles                |
| Paginated role listing         | List roles with page and size controls                |
| Role detail view               | Inspect role name, description, and assigned permissions |
| Permission assignment to role  | Grant a permission to a role                          |
| Permission revocation from role| Remove a permission from a role                       |
| Role assignment to user        | Grant a role to a specific user                       |
| Role revocation from user      | Remove a role from a specific user                    |
| Permission-aware UI            | UI actions rendered conditionally based on permissions |
| System role protection         | Prevent deletion of system roles or roles in use      |
| Optimistic pagination          | Paginated list with TanStack Query cache              |

---

## 1.3 Architectural Posture

* **Feature-isolated architecture** — all roles logic lives under `features/roles/`.
* **Permission-guarded rendering** — UI actions are conditionally shown based on the authenticated user's permissions.
* **Server-state-first** — all role data is owned by TanStack Query; no manual local state.
* **Type-safe contracts** — all API payloads, responses, and form schemas are typed with Zod and TypeScript.
* **Mutation-driven updates** — create, update, delete, assign, and revoke operations use TanStack Query mutations with query invalidation.
* **Separation of admin and self-service** — role management is an admin-only surface; user role assignment is scoped to authorized admin flows.

---

# 2. API Contract

## 2.1 Base URL

```txt
http://localhost:8080/api/v1
```

All requests require the Authorization header:

```http
Authorization: Bearer <access_token>
```

---

## 2.2 Role Endpoints

| Method | Endpoint                                        | Permission Required              | Description                          |
| ------ | ----------------------------------------------- | -------------------------------- | ------------------------------------ |
| POST   | `/roles`                                        | `role:create`                    | Create a new role                    |
| GET    | `/roles`                                        | `role:create` or `role:update`   | List roles (paginated)               |
| GET    | `/roles/:roleId`                                | `role:create` or `role:update`   | Get role by ID                       |
| PUT    | `/roles/:roleId`                                | `role:update`                    | Update role description              |
| DELETE | `/roles/:roleId`                                | `role:delete`                    | Delete role (fails if in use)        |
| POST   | `/roles/:roleId/permissions`                    | `permission:grant`               | Assign permission to role            |
| DELETE | `/roles/:roleId/permissions/:permissionId`      | `permission:revoke`              | Revoke permission from role          |

---

## 2.3 User → Role Endpoints

| Method | Endpoint                                        | Permission Required | Description               |
| ------ | ----------------------------------------------- | ------------------- | ------------------------- |
| POST   | `/users/:userId/roles`                          | `role:update`       | Assign role to user       |
| DELETE | `/users/:userId/roles/:roleId`                  | `role:update`       | Revoke role from user     |

---

## 2.4 Request and Response Shapes

### Create Role

```json
POST /roles
{
  "name": "MODERATOR",
  "description": "Papel de moderação de conteúdo"
}
```

### Update Role

```json
PUT /roles/:roleId
{
  "description": "Descrição atualizada do papel"
}
```

### List Roles (query params)

```txt
GET /roles?page=0&size=20
```

### Assign Permission to Role

```json
POST /roles/:roleId/permissions
{
  "permissionId": "<uuid>"
}
```

### Assign Role to User

```json
POST /users/:userId/roles
{
  "roleId": "<uuid>"
}
```

All mutation responses that return `204 No Content` produce no body.

---

# 3. Feature Architecture

## 3.1 Folder Structure

The Roles feature is fully encapsulated within its own feature module:

```txt
src/features/roles/
├── api/
│   ├── roles.api.ts
│   └── index.ts
├── components/
│   ├── role-form.tsx
│   ├── role-list.tsx
│   ├── role-card.tsx
│   ├── role-permissions-panel.tsx
│   └── index.ts
├── hooks/
│   ├── use-roles.ts
│   ├── use-role.ts
│   ├── use-create-role.ts
│   ├── use-update-role.ts
│   ├── use-delete-role.ts
│   ├── use-assign-permission-to-role.ts
│   ├── use-revoke-permission-from-role.ts
│   ├── use-assign-role-to-user.ts
│   ├── use-revoke-role-from-user.ts
│   └── index.ts
├── pages/
│   ├── roles-page.tsx
│   ├── role-detail-page.tsx
│   └── index.ts
├── schemas/
│   ├── create-role.schema.ts
│   ├── update-role.schema.ts
│   └── index.ts
├── types/
│   ├── role.types.ts
│   └── index.ts
└── index.ts
```

---

## 3.2 Design Principles

### Isolation

The Roles feature exposes only its public interface through `index.ts`. Internal
modules are not imported directly by other features.

### Colocation

Schemas, hooks, and API functions are colocated within the feature. No roles
logic exists outside `features/roles/`.

### Query Ownership

TanStack Query owns all server state. Hooks encapsulate query keys, fetchers,
and mutation side effects.

### Permission Awareness

Components receive permission context from the authenticated user to conditionally
render admin-only actions (create, update, delete, assign, revoke).

---

# 4. API Layer

## 4.1 API Functions

All API calls are defined in `features/roles/api/roles.api.ts` using the
centralized Axios instance.

```txt
getRoles(params: PaginationParams): Promise<PaginatedResponse<Role>>
getRoleById(roleId: string): Promise<Role>
createRole(payload: CreateRolePayload): Promise<Role>
updateRole(roleId: string, payload: UpdateRolePayload): Promise<void>
deleteRole(roleId: string): Promise<void>
assignPermissionToRole(roleId: string, permissionId: string): Promise<void>
revokePermissionFromRole(roleId: string, permissionId: string): Promise<void>
assignRoleToUser(userId: string, roleId: string): Promise<void>
revokeRoleFromUser(userId: string, roleId: string): Promise<void>
```

---

## 4.2 Query Keys

Query keys are centralized to ensure consistent invalidation:

```ts
const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  list: (params: PaginationParams) => [...roleKeys.lists(), params] as const,
  details: () => [...roleKeys.all, 'detail'] as const,
  detail: (id: string) => [...roleKeys.details(), id] as const,
}
```

---

## 4.3 Error Handling

All API errors are normalized by the Axios interceptor before reaching the
feature layer.

The feature layer must handle:

* `403 Forbidden` — permission denied; render access denied state
* `404 Not Found` — role not found; redirect or show empty state
* `409 Conflict` — delete blocked (role in use or system role); show descriptive toast
* `422 Unprocessable Entity` — validation failure; map to form errors

---

# 5. State Management

## 5.1 Server State

TanStack Query manages all roles server state.

| Query / Mutation              | Hook                           | Invalidates                  |
| ----------------------------- | ------------------------------ | ---------------------------- |
| List roles                    | `useRoles`                     | —                            |
| Get role by ID                | `useRole`                      | —                            |
| Create role                   | `useCreateRole`                | `roleKeys.lists()`           |
| Update role                   | `useUpdateRole`                | `roleKeys.detail(id)`        |
| Delete role                   | `useDeleteRole`                | `roleKeys.lists()`           |
| Assign permission to role     | `useAssignPermissionToRole`    | `roleKeys.detail(roleId)`    |
| Revoke permission from role   | `useRevokePermissionFromRole`  | `roleKeys.detail(roleId)`    |
| Assign role to user           | `useAssignRoleToUser`          | User query keys              |
| Revoke role from user         | `useRevokeRoleFromUser`        | User query keys              |

---

## 5.2 Client State

No Zustand store is required for the Roles feature.

UI state (modals open, selected items, pagination) is managed locally using
React `useState` within the relevant page or component.

---

# 6. Form Architecture

## 6.1 Forms

Two forms exist in the Roles feature:

| Form         | Schema                  | Fields                      |
| ------------ | ----------------------- | --------------------------- |
| Create Role  | `create-role.schema.ts` | `name`, `description`       |
| Update Role  | `update-role.schema.ts` | `description`               |

Both use React Hook Form with Zod resolver.

---

## 6.2 Validation Rules

### Create Role

```ts
z.object({
  name: z.string().min(2).max(50).toUpperCase(),
  description: z.string().max(255).optional(),
})
```

### Update Role

```ts
z.object({
  description: z.string().max(255).optional(),
})
```

---

## 6.3 Form Behavior

Forms must:

* Show inline validation errors before submission
* Disable the submit button during pending mutations
* Display a loading state during submission
* Show a success toast on completion
* Show an error toast on API failure
* Close modals or navigate away on success

---

# 7. Component Architecture

## 7.1 Component Responsibilities

| Component                  | Responsibility                                          |
| -------------------------- | ------------------------------------------------------- |
| `RoleList`                 | Paginated table or card list of roles                   |
| `RoleCard`                 | Single role summary with action controls                |
| `RoleForm`                 | Shared form for create and update operations            |
| `RolePermissionsPanel`     | Display and manage permissions assigned to a role       |

---

## 7.2 Permission-Aware Rendering

Components receive the authenticated user's permissions and conditionally render
admin actions.

```txt
canCreateRole    → render "New Role" button
canUpdateRole    → render "Edit" action
canDeleteRole    → render "Delete" action
canGrantPerm     → render "Assign Permission" action
canRevokePerm    → render "Remove" on permission items
canAssignRole    → render "Assign Role" in user context
```

The backend enforces authorization. Frontend guards only prevent accidental
rendering of unauthorized UI elements — they are not a security boundary.

---

## 7.3 System Role Protection

The `Delete` action must be disabled or hidden for roles flagged as system roles.

A system role indicator is derived from the role payload and used to disable
irreversible destructive actions in the UI.

---

# 8. Routing

## 8.1 Route Structure

Roles routes are registered under the protected layout:

```txt
/admin/roles              → RolesPage (list)
/admin/roles/:roleId      → RoleDetailPage (detail + permissions)
```

Both routes are lazy loaded:

```tsx
const RolesPage = lazy(() => import('@/features/roles/pages/roles-page'))
const RoleDetailPage = lazy(() => import('@/features/roles/pages/role-detail-page'))
```

---

## 8.2 Route Guards

Both routes are wrapped in a permission guard that checks for at least one of:

```txt
role:create | role:update | role:delete
```

Users without any of these permissions are redirected to the forbidden page.

---

# 9. Pagination

## 9.1 Strategy

The roles list uses cursor-free offset pagination:

```txt
page: number (0-indexed)
size: number (default 20)
```

Pagination state is managed locally in `RolesPage` via `useState`.

TanStack Query re-fetches on page or size changes using the page parameters as
part of the query key.

---

## 9.2 Constraints

* The list does not use infinite scroll.
* Previous page data is kept visible during refetch (`placeholderData: keepPreviousData`).
* Empty state is shown when the list returns zero items.

---

# 10. Feedback & Notifications

## 10.1 Toast Events

| Event                          | Toast Type |
| ------------------------------ | ---------- |
| Role created                   | success    |
| Role updated                   | success    |
| Role deleted                   | success    |
| Delete blocked (role in use)   | error      |
| Permission assigned to role    | success    |
| Permission revoked from role   | success    |
| Role assigned to user          | success    |
| Role revoked from user         | success    |
| Any unexpected API error       | error      |

---

## 10.2 Notification Principles

* Toasts are triggered in mutation `onSuccess` and `onError` callbacks.
* Error messages surface the API error message when available.
* Success toasts are brief and non-blocking.

---

# 11. Error Handling

## 11.1 API Error Strategy

| HTTP Status | Frontend Behavior                                         |
| ----------- | --------------------------------------------------------- |
| 401         | Interceptor clears session and redirects to login         |
| 403         | Toast error; hide or disable the unauthorized action      |
| 404         | Redirect to roles list or show "not found" inline state   |
| 409         | Toast error explaining the conflict (role in use)         |
| 422         | Map server validation errors to form field errors         |
| 5xx         | Generic error toast; do not expose internal details       |

---

## 11.2 Empty States

Each list view must provide a meaningful empty state:

* No roles exist → show "No roles found" with a create action (if permitted)
* No permissions assigned → show "No permissions assigned" with an assign action

---

# 12. Security Considerations

## 12.1 Frontend Security Principles

* Permission checks in the UI are UX optimizations, not security boundaries.
* The backend enforces authorization on every request.
* Role IDs and permission IDs are never derived from user input.
* No sensitive role metadata is stored in client state beyond what is needed for rendering.

---

## 12.2 Destructive Operations

Delete operations must:

* Require explicit user confirmation before dispatching the mutation
* Be disabled for system roles
* Surface a clear conflict error if the role is still assigned to users

---

# 13. Non-Functional Requirements

| Requirement       | Target                                              |
| ----------------- | --------------------------------------------------- |
| Scalability       | Feature-isolated; grows independently               |
| Maintainability   | Predictable folder structure and naming             |
| Accessibility     | Accessible tables, modals, and form controls        |
| Performance       | Paginated queries; lazy-loaded routes               |
| Reliability       | Stable error handling across all mutation paths     |
| Type Safety       | Full TypeScript coverage; Zod-validated forms       |
| Consistency       | Reuses shared UI primitives from `components/`      |

---

# 14. Extensibility Points

| Extension Point           | Future Capability                              |
| ------------------------- | ---------------------------------------------- |
| Role hierarchy            | Parent/child role inheritance                  |
| Bulk permission assignment| Assign multiple permissions in one operation   |
| Role templates            | Predefined role presets for common use cases   |
| Audit trail integration   | Surface audit log events per role in detail view |
| Search and filtering      | Name-based search and status filtering on list  |

---

# 15. Feature Summary

The Roles feature provides a complete admin interface for RBAC role management
within the frontend authentication template.

It integrates:

* A paginated, permission-guarded role list
* Role creation and update forms with Zod validation
* Permission assignment and revocation on individual roles
* Role assignment and revocation on individual users
* Consistent error handling, toast feedback, and empty states

The feature follows the same architectural conventions as all other features in
the template — isolated, typed, server-state-first, and permission-aware.
