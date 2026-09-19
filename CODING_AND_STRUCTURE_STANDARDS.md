# File & Folder Structural Guidelines
**Standard Operating Procedure (SOP) for Project Organization**

This document defines the strict *rules, conventions, and principles* for how files and folders must be organized, formatted, and structured across the entire stack. This goes beyond the directory tree and enforces **how** we write and place our code to maintain ISO/IEC 25010 (Maintainability) and OWASP compliance.

---

## 1. Naming Conventions

Consistent naming is critical for codebase navigation and automated static analysis (SAST).

*   **Directories/Folders:** Must use `kebab-case` (e.g., `user-profile`, `payment-gateway`) except for Next.js specific dynamic routes (e.g., `[locale]`).
*   **React Components (Frontend):** Must use `PascalCase.tsx` (e.g., `StoreHeader.tsx`, `GiftCreateDrawer.tsx`).
*   **Custom Hooks (Frontend):** Must use `camelCase.ts` and prefix with `use` (e.g., `useShopPurchase.ts`).
*   **Backend Modules/Files:** Must use `camelCase` with dot notation for the layer (e.g., `shop.controller.js`, `user.service.js`, `payment.schema.js`).
*   **Constants/Enums:** Must use `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_COUNT`, `DEFAULT_CURRENCY`).
*   **Types/Interfaces:** Must use `PascalCase` and preferably not prefix with `I` (e.g., `UserProfile`, not `IUserProfile`).

---

## 2. The Principle of Co-location

Related files must live together. Do not split highly cohesive logic across distant global folders unless it is truly shared across multiple domains.

**Correct Structure (Co-located):**
```text
src/components/shop/
├── ShopCard.tsx           # Main component
├── ShopCard.types.ts      # Component-specific types
├── ShopCard.test.tsx      # Unit tests (ISTQB compliant)
└── ShopCard.module.css    # Scoped styles (if applicable)
```
*Why?* When deleting or refactoring a feature, all related code is in one place. This prevents "orphan" files and satisfies ISO/IEC/IEEE 12207 (Software life-cycle processes).

---

## 3. Module Encapsulation (The "Barrel" Pattern)

Every distinct feature or domain must be treated as a self-contained module. 

*   **Rule:** A module must have an `index.ts` (or `index.js`) at its root.
*   **Rule:** Other parts of the application **must only import from the `index.ts` file**. They are forbidden from reaching deep into a module's internal folders.
*   **Security Benefit:** This acts as an API boundary (Facade pattern), allowing the module to hide internal utility functions or raw data schemas, reducing the attack surface and tight coupling (OWASP Secure SDLC).

**Example:**
```typescript
// ✅ DO THIS
import { useShopPurchase, ShopItemsView } from "@/components/shop";

// ❌ NEVER DO THIS
import { useShopPurchase } from "@/components/shop/hooks/useShopPurchase";
```

---

## 4. Single Responsibility Principle (SRP) per File

Files must be small, focused, and do exactly one thing. If a file exceeds **300 lines**, it must be reviewed for refactoring.

*   **Components:** One React component per file. (Tiny sub-components only used locally can stay in the same file, but must not be exported).
*   **Hooks:** One custom hook per file. Do not bundle `useShop`, `useCart`, and `useCheckout` into a single `hooks.ts` file.
*   **Services:** One service class/object per file.

---

## 5. Anatomy of a Standard File

Every file must follow a strict vertical order to ensure readability and standard peer review practices (ISO/IEC/IEEE 1028 - Software reviews).

1.  **Docstring / File Header:** Brief explanation of what the file does and any relevant security/compliance notes (e.g., "ISO 27001: Contains PII handling").
2.  **External Imports:** Libraries from `node_modules` (e.g., `react`, `zod`, `mongoose`).
3.  **Internal Imports:** Absolute paths using aliases (e.g., `@/components/...`). No deep relative paths like `../../../utils`.
4.  **Type/Schema Definitions:** Local interfaces or Zod schemas.
5.  **Constants:** File-scoped constants.
6.  **Main Logic:** The class, function, or component.
7.  **Exports:** Default or named exports at the bottom (or exported directly at the definition).

**Example:**
```typescript
/* ==========================================================================
   Payment Processor
   Compliance: PCI-DSS (Handles payment tokens, NO PAN data stored)
========================================================================== */

// 1. External Imports
import { z } from "zod";
import axios from "axios";

// 2. Internal Imports
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { type PaymentToken } from "./types";

// 3. Constants
const MAX_RETRIES = 3;

// 4. Main Logic
export async function processPayment(token: PaymentToken) { ... }
```

---

## 6. Separation of Concerns (SoC) Rules

### Frontend (Next.js)
*   **No API calls in UI Components:** UI components (`.tsx`) must NEVER use `fetch` or `axios` directly. All network requests must be abstracted into a hook (`hooks/useFeature.ts`).
*   **No Hardcoded Text:** All strings must use translation keys (e.g., `next-intl`) to comply with accessibility and internationalization standards.
*   **No Inline Styles for Layout:** Use Tailwind CSS or modular CSS.

### Backend (Node.js/Express)
*   **No DB Queries in Routes:** `router.get(...)` must NEVER contain `Model.find()`. Routes only wire endpoints to Controllers.
*   **No Business Logic in Controllers:** Controllers extract `req.body`, validate it using Zod schemas, pass it to a Service, and return `res.json()`. 
*   **Services handle ACID:** Database queries, transactions (`session.withTransaction`), caching, and API calls to third parties happen strictly in Services.

---

## 7. Security & Environment Structure (OWASP)
*   **No Secrets in Code:** Passwords, API keys, and JWT secrets must NEVER be hardcoded. Use `process.env`.
*   **Schema Locality:** Zod validation schemas must sit in the same folder as the controller that uses them. (e.g., `shop.schema.js` next to `shop.controller.js`).
*   **Audit Logging:** Every mutating function (POST, PUT, DELETE) in a backend controller must explicitly call `writeAudit` and `logUserActivity`.
