# Enterprise Architecture & Folder Structure Guidelines

This document outlines the strict, professional, industrial-standard file and folder structure for both the Frontend and Backend of the application. This structure ensures full compliance with Clean Architecture, Domain-Driven Design (DDD), ISO/IEC 25010 (Maintainability), and OWASP Secure SDLC standards.

---

## 1. Frontend Architecture (Next.js App Router)

The frontend follows a **Feature-Sliced Design** to separate routing, business logic, and UI rendering.

```text
frontend/
├── src/
│   ├── app/                    # Routing Layer (Thin Orchestrators)
│   │   └── [locale]/           # Internationalization routing
│   │       ├── layout.tsx      # Global layouts and providers
│   │       └── feature/
│   │           └── page.tsx    # THIN Component: Only imports hooks & UI from /components
│   │
│   ├── components/             # UI and Feature Modules
│   │   ├── ui/                 # Generic, reusable UI (Buttons, Modals, Inputs) - WCAG 2.2 Compliant
│   │   └── feature_name/       # Domain-specific feature modules (e.g., /shop, /gift)
│   │       ├── index.ts        # Barrel file (exports only what is needed externally)
│   │       ├── types.ts        # Strict TypeScript interfaces & types (Data Integrity)
│   │       ├── hooks/          # Business logic, API calls, and state management
│   │       │   └── useFeature.ts 
│   │       └── components/     # Pure, presentational UI components (No direct API calls)
│   │           └── FeatureCard.tsx
│   │
│   ├── hooks/                  # Global shared hooks (e.g., useAuth, useTheme)
│   ├── utils/                  # Pure utility functions (e.g., formatting, math)
│   ├── i18n/                   # Translation configurations and routing wrappers
│   └── messages/               # JSON language files (en.json, hi.json, etc.)
```

### Frontend Strict Rules:
1. **Pages are Thin:** `page.tsx` must NEVER contain inline `fetch` calls or complex state. It should only call a custom hook and pass data to presentational components.
2. **Presentational Components:** UI components must focus solely on rendering and WCAG 2.2 accessibility (ARIA labels, focus management).
3. **API Isolation:** All network requests must occur inside `hooks/` to allow for easy testing and error boundary handling.

---

## 2. Backend Architecture (Express.js / Node.js)

The backend strictly follows **Domain-Driven Design (DDD)** and **Clean Architecture** to ensure ACID compliance, prevent OWASP Top 10 vulnerabilities, and facilitate SOC 2 / ISO 27001 auditability.

```text
backend/
├── src/
│   ├── modules/                # Domain-Driven Feature Modules (e.g., /shop, /users)
│   │   └── feature_name/
│   │       ├── feature.routes.js     # Wires endpoints to the controller & applies middleware
│   │       ├── feature.controller.js # Handles HTTP req/res, audit logging, and error mapping
│   │       ├── feature.service.js    # Core business logic, DB transactions, caching (ACID)
│   │       └── feature.schema.js     # Zod validation schemas (OWASP Input Validation)
│   │
│   ├── models/                 # Mongoose Database Schemas (Data Layer)
│   │   └── User.js
│   │
│   ├── middleware/             # Cross-cutting security & operational concerns
│   │   ├── auth.js             # JWT / RBAC / Zero Trust enforcement
│   │   ├── rateLimit.js        # DDoS protection (Availability)
│   │   └── audit.js            # SOC 2 / ISO 27001 compliance logging
│   │
│   ├── lib/                    # Infrastructure & 3rd Party Integrations
│   │   ├── redis.js            # Caching layer setup
│   │   └── paypal.js           # External API configurations
│   │
│   ├── utils/                  # Pure helper functions (Crypto, Hashers)
│   └── index.js                # Application entry point, server instantiation
```

### Backend Strict Rules:
1. **Schema Validation First:** Every route must validate incoming payloads using `zod` in `feature.schema.js` before processing to prevent CWE-20 (Improper Input Validation) and NoSQL Injections.
2. **Fat Services, Thin Controllers:** `feature.controller.js` only parses requests and returns HTTP responses. All actual database manipulation, cache invalidation, and transactional logic must live in `feature.service.js`.
3. **Atomic Operations:** Services must use atomic operators (e.g., `$inc`, `$set` with conditionals) or `session.withTransaction()` to prevent TOCTOU (Time-of-Check to Time-of-Use) race conditions.
4. **Mandatory Auditing:** Controllers must trigger `logUserActivity` and `writeAudit` for any mutating actions to comply with ISO 27001 (Information Security Management).
