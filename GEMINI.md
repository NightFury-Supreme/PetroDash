# PetroDash — Project-Specific AI Rules

> This file extends the global rules at `~/.gemini/config/GEMINI.md`.
> Global rules always apply. This file adds project-specific context.

## Project Identity

- **Name**: PetroDash
- **Type**: Pterodactyl game server hosting & billing SaaS panel
- **Live URL**: https://dashboard.petrodash.tech
- **Stack**: Next.js 15 · TypeScript · Tailwind CSS · Node.js · Express · MongoDB · Redis · next-intl

## Repository Structure

```
project/
├── frontend/              # Next.js 15 App (src/)
│   ├── src/
│   │   ├── app/[locale]/  # All pages (admin/, dashboard/, profile/, etc.)
│   │   ├── components/    # UI components (admin/, ui/, skeletons/, etc.)
│   │   ├── hooks/         # Custom hooks (admin/, useXxx.ts pattern)
│   │   └── utils/         # API utils, fetchWithRetry, etc.
│   └── messages/          # i18n JSON files (en, de, fr, ar, es, hi)
└── backend/               # Express API
    └── src/
        ├── modules/       # Feature modules (admin/users/, admin/eggs/, etc.)
        ├── routes/        # Route files — delegate only to modules
        ├── middleware/     # auth, rateLimit, audit, sanitize, etc.
        ├── models/        # Mongoose models
        └── utils/         # AppError, security, etc.
```

## Key Conventions

### Error Handling Pattern (Frontend)
```typescript
} catch (e: any) {
  showError(tErrorBackend.has(e.message) ? tErrorBackend(e.message) : (e.message || tCommon('error')));
}
```

### Error Response Pattern (Backend)
```javascript
throw AppError.badRequest('ERR_SOME_CODE');   // 400
throw AppError.notFound('ERR_NOT_FOUND');     // 404
throw AppError.internal('ERR_SOME_CODE');     // 500
```

### Audit Logging Pattern (Backend)
```javascript
await writeAudit({ userId, action: 'admin.user.ban', target: targetId, changes: payload });
await logUserActivity(userId, 'BAN_USER', req);
```

### Cache Invalidation Pattern (Backend)
```javascript
await deleteCache(`admin:users:${userId}`);
await deleteCachePattern('admin:users:list:*');
```

## Admin Domain Structure
All admin modules follow this pattern:
- `*.admin.controller.js` — Zod validation, delegates to service
- `*.admin.service.js` — Redis caching, read queries
- `*.admin.mutation.service.js` — Write operations, audit logging, cache invalidation
- `*.admin.schema.js` — Zod schemas
- `index.js` — Barrel exports

## MCP Tool Reminders for This Project

- Use `context7` to look up Next.js App Router and next-intl APIs before writing any page or translation code
- Use `git` to check history before any large refactor
- Use `memory` to store recurring patterns (e.g., new error codes added, architectural decisions)
- Use `sequential-thinking` for any task touching more than 3 files
- Use `filesystem/search_files` before renaming or moving any component to find all imports
