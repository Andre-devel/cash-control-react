# cash-control-react

A production-ready React authentication template with JWT support, protected routing, and a clean feature-based architecture.

## Tech Stack

| Layer | Library |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite 6 |
| Routing | React Router v7 |
| Server state | TanStack Query v5 |
| Client state | Zustand v5 |
| HTTP | Axios (with JWT interceptor) |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS v3 + Radix UI |
| Toasts | Sonner |
| Testing | Vitest + Testing Library + MSW |
| Linting | ESLint + Prettier + Husky |

## Getting Started

**Prerequisites:** Node.js 20+, [pnpm](https://pnpm.io/)

```bash
pnpm install
```

Copy the environment file and set your backend URL:

```bash
cp .env.example .env.local
```

```env
# .env.local
VITE_API_BASE_URL=http://localhost:8080/api
```

Start the dev server:

```bash
pnpm dev
```

The app runs at `http://localhost:5173`. API requests to `/api/*` are proxied to `http://localhost:8080` automatically (no CORS issues in development).

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server |
| `pnpm build` | Type-check + production build |
| `pnpm build:analyze` | Build with bundle size report (`stats.html`) |
| `pnpm preview` | Preview production build locally |
| `pnpm test` | Run tests in watch mode |
| `pnpm test:run` | Run tests once (CI) |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm lint` | Lint source files (zero warnings allowed) |
| `pnpm lint:fix` | Lint and auto-fix |
| `pnpm format` | Format source files with Prettier |
| `pnpm format:check` | Check formatting without writing |

## Project Structure

```
src/
├── app/
│   ├── layouts/          # Protected and public layout wrappers
│   ├── providers/        # React context providers (auth, query)
│   ├── router/           # Route definitions and auth guards
│   └── store/            # Global store setup
├── components/
│   └── feedback/         # Error boundary, forbidden page
├── features/
│   └── auth/
│       ├── api/          # Login / register API calls
│       ├── hooks/        # Auth-related hooks
│       ├── pages/        # Login and register pages
│       ├── schemas/      # Zod validation schemas
│       ├── store/        # Auth Zustand store (token, user)
│       └── types/        # Auth domain types
├── lib/                  # jwt, logger, toast utilities
├── services/
│   └── http/             # Axios instance with JWT + 401 interceptors
└── test/                 # Test utilities and MSW handlers
```

## Authentication Flow

1. User submits credentials → `POST /api/auth/login`
2. JWT token stored in Zustand (`useAuthStore`)
3. Axios request interceptor attaches `Authorization: Bearer <token>` to every request
4. On 401 response, the interceptor clears the session and redirects to `/login`
5. Protected routes check auth state via the router guard before rendering

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Base URL of the backend REST API (e.g. `http://localhost:8080/api`) |
