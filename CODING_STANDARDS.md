# Enterprise Coding Standards & File Structure (Internal)

This document outlines the **internal default structure** for how code inside individual files must be organized. Following these conventions ensures compliance with ISO/IEC 25010 (Maintainability) and OWASP secure coding practices.

---

## 1. Frontend: React Component Structure
Every UI component must follow a strict top-to-bottom flow to separate state from presentation and ensure WCAG accessibility.

```tsx
/* ==========================================================================
   ComponentName — Brief description of what this does
   WCAG 2.2: Mention any specific accessibility implementations here
========================================================================== */

"use client"; // Only if using hooks/state in Next.js App Router

// 1. External Imports (React, Next, Lucide, third-party)
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

// 2. Internal Imports (Hooks, Utils, other components)
import { useFeatureHook } from "./hooks/useFeatureHook";
import { formatCurrency } from "@/utils/format";

// 3. Type Definitions
interface ComponentNameProps {
  id: string;
  className?: string;
}

// 4. Component Definition
export function ComponentName({ id, className = "" }: ComponentNameProps) {
  // 4a. Hooks & State (Always first)
  const t = useTranslations("Namespace");
  const { data, loading, performAction } = useFeatureHook(id);
  const [localState, setLocalState] = useState(false);

  // 4b. Event Handlers & Callbacks
  const handleAction = async () => {
    setLocalState(true);
    await performAction();
    setLocalState(false);
  };

  // 4c. Early Returns / Loading States
  if (loading) return <div aria-busy="true">{t("loading")}</div>;

  // 4d. Main Render (Semantic HTML & ARIA compliance)
  return (
    <section aria-labelledby={`heading-${id}`} className={`flex flex-col ${className}`}>
      <h2 id={`heading-${id}`} className="text-xl font-bold">
        {t("title")}
      </h2>
      <button 
        onClick={handleAction}
        disabled={localState}
        aria-disabled={localState}
        className="mt-4 focus-visible:ring-2" // Always handle focus states
      >
        {localState ? t("processing") : t("submit")}
      </button>
    </section>
  );
}
```

---

## 2. Frontend: Custom Hook Structure
Hooks extract all API and complex state logic away from the UI.

```tsx
/* ==========================================================================
   useFeatureName — Manages state and API transactions for the feature
   Security: Sanitizes input before API requests
========================================================================== */

"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

export interface UseFeatureNameResult {
  data: any;
  loading: boolean;
  execute: (payload: string) => Promise<void>;
}

export function useFeatureName(initialId: string): UseFeatureNameResult {
  const { showError, showSuccess } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async (payload: string) => {
    // 1. Sanitize & Validate Input Locally
    const sanitized = payload.trim();
    if (!sanitized) return;

    // 2. Execute Network Request
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      
      const res = await fetchWithRetry(`/api/feature/${initialId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ payload: sanitized }),
      });

      if (!res.ok) throw new Error("API_ERROR");
      
      const responseData = await res.json();
      setData(responseData);
      showSuccess("Success!");
    } catch (err) {
      // 3. Graceful Error Handling (Never expose raw stack traces to UI)
      showError("An error occurred during processing.");
    } finally {
      setLoading(false);
    }
  }, [initialId, showError, showSuccess]);

  // Return strictly typed interface
  return { data, loading, execute };
}
```

---

## 3. Backend: Controller Structure
Controllers orchestrate the request but contain NO database logic.

```javascript
/**
 * Feature Controller
 * Handles HTTP parsing, validation mapping, and audit logging.
 */

const featureService = require('./feature.service');
const { createSchema } = require('./feature.schema');
const { writeAudit } = require('../../middleware/audit');

class FeatureController {
  async createRecord(req, res, next) {
    try {
      // 1. Validate Input (OWASP Injection Prevention)
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
      }

      // 2. Extract Data
      const { name, amount } = parsed.data;
      const userId = req.user.sub;

      // 3. Delegate to Service (Business Logic)
      const result = await featureService.processCreation(userId, name, amount);

      // 4. Audit Logging (ISO 27001 / SOC 2 Compliance)
      await writeAudit(req, 'feature.create', 'feature', result._id.toString(), { amount });

      // 5. HTTP Response
      return res.status(201).json({ ok: true, data: result });
    } catch (error) {
      // 6. Domain Error Mapping
      if (error.message === 'INSUFFICIENT_FUNDS') {
        return res.status(400).json({ error: 'You do not have enough funds.' });
      }
      // Send unknown errors to global error handler
      next(error);
    }
  }
}

module.exports = new FeatureController();
```

---

## 4. Backend: Service Structure
Services manage the database, transactions, and caching. No `req` or `res` objects allowed here.

```javascript
/**
 * Feature Service
 * Business logic, atomic transactions, and cache management.
 */

const FeatureModel = require('../../models/Feature');
const User = require('../../models/User');
const { deleteCache } = require('../../lib/redis');

class FeatureService {
  
  async processCreation(userId, name, amount) {
    // 1. Database validation (Data integrity)
    if (amount <= 0) throw new Error('INVALID_AMOUNT');

    // 2. Atomic Operations (TOCTOU & Race Condition prevention)
    // We check the condition (coins >= amount) and deduct in the same operation.
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, coins: { $gte: amount } },
      { $inc: { coins: -amount } },
      { new: true }
    );

    if (!updatedUser) {
      throw new Error('INSUFFICIENT_FUNDS');
    }

    // 3. State Mutations
    const newRecord = await FeatureModel.create({
      userId,
      name,
      amountPaid: amount,
      status: 'active'
    });

    // 4. Cache Invalidation
    await deleteCache(`user:${userId}:profile`);
    await deleteCache('api:features:list');

    // 5. Return standardized output
    return newRecord;
  }
}

module.exports = new FeatureService();
```

## 5. Security & Consistency Rules

1. **Imports:** Always group imports. External libraries first, internal utilities/hooks second, types last.
2. **Naming Conventions:**
   * Files: `camelCase` for backend services (`shop.controller.js`), `PascalCase` for React components (`StoreHeader.tsx`).
   * Variables: Descriptive `camelCase` (`maxRedemptions`).
3. **No Magic Strings:** Abstract reused strings into localization files (`t("errorKey")`) or constants (`const MAX_QUANTITY = 100`).
4. **Error Masking (OWASP):** Never pass raw backend errors directly to the frontend. Always map them to generic, user-friendly messages to prevent information leakage.
