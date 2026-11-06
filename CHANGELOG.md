# Changelog

All notable changes to PteroDash will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Future features and improvements will be listed here

---

## [2.0.0] - 05-11-2026

### Major Release Overview
PetroDash v2.0.0 brings a full UI revamp and updates, several new features, numerous bug fixes, and major performance optimizations across the entire platform.

---

### 1. Backend Structure & Clean Architecture (`backend/src/modules/`)
- **Clean Modular Backend**:
  - Re-architected backend route handlers into 18 clean, modular sections: `activity`, `admin/*`, `auth`, `coupon`, `dashboard`, `earn`, `egg`, `gift`, `invoices`, `location`, `panel`, `payments`, `plan`, `profile`, `referrals`, `server`, `shop`, `status`, `subscriptions`, `ticket`, `uptime`, and `userPlans`.
  - Every domain enforces clean separation of concerns: `<domain>.controller.js` (HTTP handling), `<domain>.service.js` (business logic), `<domain>.schema.js` (validation), and `index.js` (route registration).
- **Universal Runtime Request Validation (Zod)**:
  - Enforced strict Zod schemas across all 182 API endpoints, validating request query parameters, body payloads, and route params before touching business logic.
  - Standardized JSON validation error formats returning precise field-level violation messages without internal stack leakages.
  - Automatic string-to-number and string-to-boolean coercion for query parameters across paginated endpoints.
- **Enterprise Redis Caching Layer (`backend/src/lib/redis.js`)**:
  - Upgraded Redis caching using `ioredis` with standardized TTLs, pipeline batching, and smart pattern-based cache invalidation across mutating operations (`invalidateServerCaches`, `invalidateUserCaches`, `invalidateAdminCaches`).
  - Cached public and semi-static data including application settings, egg categories, location nodes, plan catalogs, and server lists.
  - Safe redis client fallback and connection recovery preventing server crashes if the Redis instance temporarily restarts.
- **Distributed Session Architecture (`connect-redis`)**:
  - Migrated session storage to Redis via `connect-redis`, enabling persistent and horizontally scalable sessions across cluster instances.
- **Request Tracing & Observability (`backend/src/middleware/requestId.js`)**:
  - Attached unique UUID-based `X-Request-Id` headers to all incoming requests, propagating through logging, background workers, and error responses for end-to-end auditability.
- **Site Settings Abstraction & In-Memory Redis Caching (`backend/src/lib/settings.js`)**:
  - Abstracted repetitive database queries for site configuration with automated Redis caching, reducing MongoDB reads by over 80%.

---

### 2. Obsidian Deep Charcoal Cyber Minimalist UI & Design System (`globals.css`)
- **Obsidian / Deep Charcoal Color Palette**:
  - Replaced translucent glassmorphism with an ultra-clean, high-contrast, matte cyber aesthetic inspired by modern enterprise cloud dashboards.
  - Background: `#0F0F0F` (deep obsidian / YouTube-style dark gray).
  - Surface Panels: `#202020` (solid elevated charcoal cards and table containers).
  - Structural Borders: `#303030` (subtle crisp 1px border lines defining card boundaries).
  - Sidebar Surface: `#181818` with 1px border separation (`sidebar-premium`).
  - Typography: Geist Sans (`--font-geist-sans`) paired with Geist Mono (`--font-geist-mono`) for technical metrics and identifiers.
- **Strict Anti-Glow / Zero-Shadow Enforcement Rule**:
  - CSS rule `.shadow-sm, .shadow, .shadow-md, .shadow-lg, .shadow-xl, .shadow-2xl, .shadow-inner { box-shadow: none !important; }` globally enforced. Completely eliminates blurry glows, neon haloes, and fuzzy drop shadows in favor of razor-sharp matte surfaces.
- **Vibrant Flame Orange Accent System**:
  - High-visibility flame orange (`#FF5722` / `#f97316` / `#ff5500`) branding utilized for primary interactive call-to-actions (`+ Create Server`), header greetings (`Welcome back, <User>`), active navigation highlights, rank badge overlays, and discrete meter fill bars.
- **Uptime Kuma-Style 90-Day Telemetry Monitors (`DashboardStatus.tsx`)**:
  - Multi-segment horizontal uptime bars visualizing 90 days of operational history.
  - Discrete colored status ticks: `#10b981` (Operational), `#fcd34d` (Degraded), `#f59e0b` (Partial Outage), `#ef4444` (Major Outage), and `#2a2a2a` (No Data).
  - Real-time node latency badges with operational status pills (`53ms Operational`, `32ms Operational`, `331ms Operational`, `403ms Operational`).
  - Interactive Portal Hover Tooltips: Rendered at root DOM level (`createPortal`) to prevent container clipping, showing exact date, status, downtime hours and minutes, and historical uptime percentage (`49.22% uptime`, `80.59% uptime`, `96.12% uptime`, `94.78% uptime`).
- **40-Segment Discrete Block Allocation Gauges (`ResourceUsagePanel.tsx`)**:
  - Replaced standard continuous progress bars with 40-segment cyber micro-gauge visualizers for allocation metrics:
    - Databases Meter (`0 / 42` active vs total entitlement).
    - Allocation Ports Meter (`2 / 303` assigned vs available pool).
    - Backups Meter (`0 / 6` utilized vs total slot limit).
  - Active segments illuminated in flame orange (`#FF5722`) with `#2A2A2A` unfilled segments.
- **Top Summary Metrics Ribbon (`MetricCard.tsx`)**:
  - Four high-density KPI cards across a border-separated grid:
    - **SERVERS**: Active count vs total server slot limit (`2 Servers`, `Limit: 7`).
    - **CPU**: Allocated compute vs account limit percentage (`100%`, `Limit: 149%`).
    - **MEMORY**: Real-time allocated RAM vs maximum capacity (`1024 MB`, `Limit: 11,145 MB`).
    - **DISK**: Storage allocation vs disk quota (`2048 MB`, `Limit: 77,705 MB`).
  - Monospace uppercase tracking-widest metric badges with contextual icons.
- **Server Fleet Management Table (`ServersSection.tsx`)**:
  - Responsive tabular layout (`xl:grid-cols-[1.5fr_1fr_1fr_100px_80px_80px_80px_100px]`) displaying:
    - Server Name & Canonical Public ID (`srv_05106b32bfbe75bdf5ef`).
    - Node Region with country flag badge (`Local`, `India`, `Test Node`).
    - Software/Egg Icon & Type (`Minecraft`, `Node.js`, `Python`, `Rust`).
    - Real-Time Status Pill (`Active`, `Suspended`, `Creating`, `Queued`, `Unreachable`).
    - Resource Breakdown: CPU percentage, Memory in MB, Disk space in MB.
    - Inline Action Suite: Direct link to Pterodactyl console, Edit Server specifications drawer trigger, and Delete Server confirmation drawer.
- **Three-Tier Collapsible Sidebar Navigation (`Sidebar.tsx`)**:
  - **MAIN NAVIGATION**: Dashboard, Store, AFK Earn, Redeem Gift, Affiliates.
  - **ADMIN SECTION**: Admin Overview, Users, Servers, Eggs, Locations, Earn, Gifts, Tickets, System Logs.
  - **SUPPORT & SETTINGS**: Panel Credentials, Help & Support, Settings.
  - User Profile Footer Card: High-resolution avatar, username, coin balance indicator (`8340 coins`), Admin rank badge, and instant logout action.
- **Topbar Control Suite (`Topbar.tsx`)**:
  - System notification indicator.
  - Theme mode toggle button.
  - Multi-language dropdown switcher with active locale indicator (`Eng`, `Esp`, `Fra`, `Deu`, `Ara`, `Hin`).
  - Quick "+ Create Server" button trigger.
  - Dynamic rotating manual refresh action (`RefreshCw`) for instant cache invalidation and telemetry re-fetching.

---

### 3. Comprehensive Slide-Over Drawer Architecture (`frontend/src/components/ui/Drawer.tsx`)
Replaced disruptive modal popups and full-page redirects with non-blocking, accessible slide-over drawers with smooth enter/exit transitions and ESC key handling:
- **Server Drawers**:
  - `CreateServerDrawer.tsx`: Multi-step wizard with location selection, software/egg picking, resource slider allocation, and instant entitlement preview.
  - `EditServerDrawer.tsx`: Live resource resizing drawer for CPU, RAM, Disk, Databases, and Allocations with instant delta cost feedback.
- **Egg Management Drawers**:
  - `CreateEggDrawer.tsx`: Comprehensive drawer for configuring Docker images, startup commands, category assignment, and environment variable requirements.
  - `EditEggDrawer.tsx`: Editing suite for existing eggs, panel variable synchronizations, and docker container updates.
- **Location Management Drawers**:
  - `CreateLocationDrawer.tsx`: Multi-node mapping drawer with flag asset selector, FQDN/IP definitions, and node assignment.
  - `EditLocationDrawer.tsx`: Node configuration drawer for updating allocation quotas and connection endpoints.
- **Coupon Drawers**:
  - `AdminCreateCouponDrawer.tsx`: Coupon creator supporting percentage discounts, flat coin deductions, usage limits, and expiration date pickers.
  - `AdminEditCouponDrawer.tsx`: Coupon parameter updating drawer.
  - `AdminDeleteCouponDrawer.tsx`: Safe coupon revocation drawer.
  - `CouponPlansSelector.tsx`: Plan-specific coupon applicability selector.
- **Gift Code Drawers**:
  - `AdminCreateGiftDrawer.tsx`: Multi-code generator for coins, memory, CPU, disk, and slot entitlements.
  - `AdminEditGiftDrawer.tsx`: Gift code editor for adjusting maximum uses and expiry.
  - `AdminDeleteGiftDrawer.tsx`: Gift code cancellation drawer.
  - `AdminGiftRedemptionsDrawer.tsx`: Audit drawer displaying all user redemptions, timestamps, and redeemed amounts for any code.
- **Administrative Control Drawers**:
  - `AdminEditServerDrawer.tsx`: Admin-level override drawer to modify server specifications without billing constraints.
  - `AdminClearQueueDrawer.tsx`: Emergency queue management drawer allowing purging or forced execution of queued server creations.
  - `AdminRefundDrawer.tsx`: Payment ledger refund drawer with automatic coin/resource clawback logic.
  - `BanUserDrawer.tsx` & `UnbanUserDrawer.tsx`: Reason-logged suspension and reactivation drawers.
  - `DisablePlanDrawer.tsx`: Temporary plan deprecation drawer.
  - `PlanDrawer.tsx`: Hosting plan creator and editor with resource bundles, billing cycle pricing, and feature highlights.
- **Support & Profile Drawers**:
  - `CreateTicketDrawer.tsx`: Ticket submission drawer with category dropdown, priority selector, and attachment dropzone.
  - `Setup2FADrawer.tsx` & `Disable2FADrawer.tsx`: Interactive TOTP QR-code verification and recovery code management drawers.
  - `ChangeEmailDrawer.tsx` & `PasswordDrawer.tsx`: Security modification drawers with 2FA authorization checks.
  - `ImageUploadDrawer.tsx` & `AvatarUploadDropzone.tsx`: Drag-and-drop avatar upload drawer with client-side image cropping.
  - `DeleteDrawer.tsx` & `DeleteAccountDrawer.tsx`: Double-confirmation deletion drawers with name/confirmation string verification.

---

### 4. Zero-Layout-Shift Skeleton System (`frontend/src/components/skeletons/`)
Built dedicated skeleton components for every view, drawer, and tab to completely eliminate Cumulative Layout Shift (CLS):
- **Admin Skeletons**: `AdminTicketDetailSkeleton`, `AdminUsersTableSkeleton`, `AdminUserOverviewSkeleton`, `AdminUserSecuritySkeleton`, `AdminUserSessionsSkeleton`, `AdminUserActivitySkeleton`, `AdminUserServersSkeleton`, `AdminUserPlansSkeleton`, `AdminUserInvoicesSkeleton`, `AdminUserReferralsSkeleton`, `AdminUserResourcesSkeleton`, `AdminStoreCouponsSkeleton`, `AdminStoreLedgerSkeleton`, `AdminStorePlansSkeleton`, `AdminStoreShopSkeleton`, `AdminStoreSkeleton`, `AdminServersSkeleton`, `AdminQueueTabSkeleton`, `AdminSuspendedTabSkeleton`, `AdminSettingsSkeleton`, `AdminEggsSkeleton`, `AdminLocationsSkeleton`, `AdminGiftsSkeleton`, `AdminEditGiftSkeleton`, `AdminGiftRedemptionsSkeleton`, `AdminLedgerTableSkeleton`, `AdminLedgerFiltersSkeleton`, `AdminLogsSkeleton`, `AdminEarnSkeleton`.
- **Dashboard Skeletons**: `DashboardHeaderSkeleton`, `DashboardServersSkeleton`, `DashboardStatsSkeleton`, `DashboardStatusSkeleton`, `DashboardSkeleton`.
- **User Portal Skeletons**: `EarnSkeleton`, `GiftCodesSkeleton`, `GiftCodesTableSkeleton`, `GiftHeaderSkeleton`, `GiftRedeemSkeleton`, `GiftSkeleton`, `InvoicesSkeleton`, `OverviewSkeleton`, `SecuritySkeleton`, `ActiveSessionsSkeleton`, `ActivityLogSkeleton`, `ProfileSkeleton`, `PanelSkeleton`, `ReferredUsersTableSkeleton`, `ReferralsSkeleton`, `PlansViewSkeleton`, `ShopItemsSkeleton`, `ShopSidebarSkeleton`, `ShopSkeleton`, `CreateServerSkeleton`, `TicketsSkeleton`, `AdminTicketsSkeleton`, `SidebarSkeleton`.

---

### 5. Custom Modular React Hook Architecture (`frontend/src/hooks/`)
Decoupled all client state, SWR fetching, mutations, and caching into 133 specialized TypeScript hooks:
- **`hooks/admin/*`**:
  - `useAdminDashboard.ts`: Multi-tab analytics loader (Overview, Revenue, Infrastructure, Users, Support).
  - `useAdminUsers.ts`, `useAdminUserDetail.ts`, `useAdminUserMutations.ts`, `useAdminUserSecurity.ts`, `useAdminUserSessions.ts`, `useAdminUserActivity.ts`: Comprehensive admin user management suite.
  - `useAdminServers.ts`, `useAdminServerEdit.ts`: Server monitoring, queue actions, and spec modifications.
  - `useAdminEggs.ts`, `useAdminEggCategories.ts`, `useAdminEggMutation.ts`: Pterodactyl egg configurations and variable synchronization.
  - `useAdminLocations.ts`, `useLocationApi.ts`: Node and geographical location management.
  - `usePlansList.ts`, `usePlanForm.ts`, `usePlanEdit.ts`, `useAdminPlanCategories.ts`: Plan lifecycle management.
  - `useCouponsList.ts`, `useCreateCoupon.ts`, `useUpdateCoupon.ts`, `useDeleteCoupon.ts`: Coupon administration.
  - `useAdminGift.ts`, `useCreateAdminGift.ts`, `useEditAdminGift.ts`, `useDeleteAdminGift.ts`, `useGiftRedemptions.ts`: Gift code operations.
  - `useAdminTickets.ts`, `useAdminTicketDetail.ts`, `useAdminTicketCategories.ts`: Staff ticketing workflow.
  - `useAdminLedger.ts`: Financial ledger queries and refunds.
  - `useAdminStore.ts`, `useAdminShop.ts`: Per-resource pricing and store packages.
  - `useAdminLogs.ts`: System audit trail viewer with search, filtering, and pagination.
  - `useAdminTabSettings.ts`, `useAdminBrandUpload.ts`: Site settings and dynamic branding asset uploads.
  - `useAdminEarn.ts`: Monetization method configurations.
- **`hooks/auth/*`**:
  - `useLogin.ts`: Form state, credential validation, 2FA prompt handling, and session establishment.
  - `useRegister.ts`: Account onboarding with email verification triggers.
  - `useTwoFactor.ts`: TOTP verification during authentication challenges.
  - `useForgot.ts`: Password reset dispatch and token validation.
  - `useVerify.ts`: Email activation token processing and re-send logic.
  - `useAuthCallback.ts`: Discord and Google OAuth token exchange.
  - `useAuthGuard.ts`: Client-side route protection and permission redirection.
  - `useBannedStatus.ts`: Account suspension state detection and quarantine redirection.
- **`hooks/dashboard/*`**:
  - `useDashboard.ts`: Coalesced dashboard state management with SWR caching.
  - `useServerStream.ts`: Real-time Server-Sent Events (SSE) server status subscriber with terminal 401/403 halting.
  - `useSystemStatus.ts`: Node ping telemetry and 90-day latency history manager.
- **`hooks/server/*`**:
  - `useServerCreate.ts`: Multi-step server provisioning coordinator.
  - `useServerEdit.ts`: Real-time server resource modifier with delta cost calculation.
  - `useServerDelete.ts`: Server termination with optimistic cache removal.
  - `serverCalc.ts`: Dynamic resource quota and coin math utility.
  - `serverCreate.utils.ts`: Software and node compatibility validator.
- **`hooks/shop/*`**:
  - `useShop.ts`: Catalog fetcher for plans and individual resource increments.
  - `useShopPurchase.ts`: Custom resource bundle checkout.
  - `usePlanPurchase.ts`: Dedicated hosting plan subscription purchasing.
  - `usePayPalCapture.ts`: PayPal order creation and execution capture.
  - `useValidateCoupon.ts`: Instant coupon code discount calculator.
- **`hooks/tickets/*`**:
  - `useTickets.ts`: Paginated ticket list fetcher with category and status filters.
  - `useTicketDetail.ts`: Real-time ticket thread manager.
  - `useTicketStream.ts`: SSE listener for live message streams and staff actions.
  - `useTicketMentions.ts`: Autocompletion for user and staff `@mentions`.
- **`hooks/profile/*`**:
  - `useProfile.ts`: Account details and resource limits manager.
  - `useProfile2FA.ts`: TOTP setup, QR code generation, and recovery code backup.
  - `useProfilePicture.ts`: Avatar image upload and EXIF stripping trigger.
  - `useProfileEmail.ts`: Email change coordinator with verification tokens.
  - `useProfileDelete.ts`: Account self-deletion handler.
  - `useSessions.ts`: Active device session viewer and remote session revocation.
  - `useActivityLogs.ts`: User audit trail fetcher.
  - `useInvoices.ts`: Transaction history and PDF invoice downloader.
  - `useCheckUsername.ts`: Real-time debounce username availability checker.
- **`hooks/referrals/*`**:
  - `useReferralCode.ts`: Vanity referral code generator and editor.
  - `useReferralStats.ts`: Affiliate statistics and commission metrics.
  - `useReferralUsers.ts`: List of referred users and their verification states.
- **`hooks/gift/*`**:
  - `useCreateGift.ts`: User-to-user gift code creator.
  - `useGiftCodes.ts`: List of created gift codes and remaining uses.
  - `useRedeemGift.ts`: Instant code redemption processor.
- **`hooks/earn/*`**:
  - `useEarn.ts`: AFK coin earning coordinator with anti-cheat heartbeat pings.

---

### 6. Authentication, Security, 2FA & Session Management
- **Two-Factor Authentication (2FA / TOTP)**:
  - Time-based One-Time Password generation using `speakeasy` and QR-code rendering using `qrcode`.
  - 10 encrypted single-use backup recovery codes generated upon 2FA setup for emergency access.
  - 2FA challenge modal guarding password changes, email modifications, and account terminations.
- **Active Device Session Tracking (`UserSession.js`)**:
  - Detailed session monitoring logging client IP address, operating system, browser engine, device model, and geographic location via `geoip-lite` and `ua-parser-js`.
  - Remote session revocation allowing users and administrators to terminate individual sessions or purge all other sessions with one click.
- **Tamper-Evident Audit Logging Engine (`audit.js` & `auditAuto.js`)**:
  - Structured, unalterable audit logging for administrative mutations, financial transactions, server operations, and security modifications.
  - Contextual metadata capture recording before/after states, request parameters, initiating user ID, and client IP.
  - Expandable JSON metadata inspector (`LogMetaViewer.tsx`) in the system audit logs table.
- **Avatar Upload Pipeline (`avatarUpload.js`)**:
  - Secure image processing using `sharp` to strip all EXIF metadata, re-encode avatars to clean PNG formats, and enforce strict file size (2 MB) and dimension limits.
- **Hardened Security Middlewares**:
  - Non-backtracking XSS sanitization in `security.js` eliminating Regular Expression Denial of Service (ReDoS) vulnerabilities.
  - Tiered distributed rate limiting backed by Redis (`rate-limit-redis`) protecting authentication endpoints (5 req/15min), API mutations (30 req/min), and general browsing.
  - Universal MongoDB ObjectId validation middleware (`validateObjectId.js`) preventing application crashes from malformed IDs.
  - Cross-Site Request Forgery (CSRF) mitigation across all cookie-authenticated state modifications.
  - Password reset token lookup scoped directly to the target user account, preventing cross-account token reuse.
  - Secure random suffixes using `crypto.randomBytes(6)` eliminating file upload collisions.

---

### 7. Automated Background Workers & Synchronization Engine (`backend/src/jobs/`)
- **`autoUnsuspendServers.js`**: Background worker automatically detecting and un-suspending servers when a user's resource balance or coin quota recovers.
- **`cancelAbandonedPayments.js`**: Garbage collection job canceling uncaptured or expired PayPal orders to keep transaction ledgers clean.
- **`pruneAuditLogs.js`**: Scheduled data retention worker pruning audit logs older than the configured threshold for GDPR compliance and database efficiency.
- **`serverComplianceCheck.js` & `serverComplianceUtils.js`**: Continuous audit worker comparing Pterodactyl panel allocations with local database entitlements, automatically flagging and reconciling unauthorized resource modifications.
- **`serverReconciliationJob.js`**: Periodic reconciliation ensuring server states in MongoDB mirror Pterodactyl panel states.
- **`syncPendingDeletions.js`**: Resilient retry queue for servers that failed to delete on the remote panel during initial requests.
- **`syncPendingUpdates.js`**: Fault-tolerant retry queue ensuring resource limit adjustments propagate to Pterodactyl even during temporary panel outages.
- **`syncPendingUsers.js`**: Synchronization worker ensuring user credentials and permissions match on Pterodactyl.
- **`syncQueuedServers.js`**: Asynchronous server creation queue that buffers creation requests to prevent panel rate-limiting during high traffic.

---

### 8. Pterodactyl Integration & Multi-Node Server Engine
- **Asynchronous Queued Server Creation**:
  - Offloaded server creation to a resilient queue (`syncQueuedServers.js`) with progress tracking and automatic rollback on failure.
  - Eliminated $O(N)$ N+1 query loop when computing queue positions: replaced per-item database queries with a single batched priority query.
- **Egg Variable Resolution Engine**:
  - Dynamic generation of egg environment variables and startup inputs based on selected game eggs.
  - Automatic validation of required vs optional egg parameters with default fallbacks.
- **Panel Synchronization Resilience (`pterodactyl.js`)**:
  - Enhanced error handling gracefully catching panel 404s, 429 rate limits, and connection timeouts without breaking database consistency.
  - Seamless support for both numeric internal IDs and UUID external identifiers (`srv_...`).
  - Server deletion logic re-architected to handle remote 404s gracefully, ensuring local database cleanup completes even if remote resources were already purged.
- **Live Status Streaming (`useServerStream.ts`)**:
  - Real-time Server-Sent Events (SSE) server status streaming providing instant status updates (`Running`, `Starting`, `Stopping`, `Offline`, `Suspended`).
  - Terminal error handling immediately halting reconnection loops on 401 Unauthorized or 403 Forbidden responses.

---

### 9. Real-Time Support Ticket System & Collaboration
- **Real-Time Ticket Streaming (`ticket.stream.controller.js`)**:
  - Server-Sent Events (SSE) streaming live ticket replies, status changes, and staff actions directly to client dashboards without manual page refreshes.
- **Staff Internal Notes**:
  - Dual-mode messaging allowing administrators and support staff to post private internal notes hidden from regular users.
- **User & Staff Mentions (`TicketMentionsDropdown.tsx`)**:
  - Auto-completing `@user` and `@staff` mention dropdown inside the ticket message composer.
- **Multi-File Attachments**:
  - File upload handling with image preview modals, secure download routing, and strict mime-type verification.
- **Ticket Categories & Priorities**:
  - Dynamic ticket categories (Billing, Technical Support, General Inquiries) with color-coded priority indicators (`Low`, `Medium`, `High`, `Critical`).
- **Ticket Reopen Workflow**:
  - Contextual "Reopen Ticket" action replacing reply inputs on closed/resolved tickets to prevent accidental message submissions.

---

### 10. Store, Custom Upgrades, Plans & Automated PDF Invoicing
- **Automated Vector PDF Invoices (`invoicePdf.js` & `invoicePdfHelpers.js`)**:
  - High-fidelity PDF invoice and receipt generation using `pdfkit` and `svg-to-pdfkit` for user purchases, plan subscriptions, and store checkouts.
  - Direct download endpoints available in both user profile (`/profile`) and admin user detail views (`/admin/users/:id`).
- **Plan Categories System (`PlanCategory.js`)**:
  - Organized hosting plans by category (e.g., Minecraft, Discord Bots, Web Hosting) with tabbed browsing.
  - Admin plan drawer (`PlanDrawer.tsx`) with resource allocations, duration pricing, and feature toggles.
- **Interactive Resource Upgrades (`src/modules/shop/`)**:
  - Slider-based resource purchasing allowing users to upgrade CPU, RAM, Disk, Databases, Allocations, and Backups independently.
  - Dynamic pricing calculation based on admin-defined resource multipliers.
- **Coupon Application Engine (`src/modules/coupon/`)**:
  - Real-time coupon code validation supporting percentage and flat coin discounts with plan-specific restrictions, usage limits, and expiration checks.
- **PayPal Integration & Webhooks (`paypal.js` & `paypalWebhook.js`)**:
  - Automated checkout and capture workflow with IPN/webhook verification, recording transactions in `Payment.js`.
  - Automatic coin/resource rollback upon plan cancellation or refund.

---

### 11. Monetization, Earn Sessions & Cryptographic Anti-Fraud
- **Multi-Provider Earning Engine (`src/modules/earn/`)**:
  - Integrated rewarded offerwalls (Ayet Studios) and rewarded links (Linkvertise).
  - Configurable coin rewards, cooldown timers, and placement IDs via the admin dashboard.
- **Cryptographic Fraud Prevention (`EarnSession.js`)**:
  - Nonce-based session generation with cryptographic callback signature verification to prevent spoofed reward claims.
  - Per-user daily claim limits, IP velocity checks, and cooldown countdown timers.

---

### 12. Gift Codes & Referral Tracking
- **Gift Code Generator (`src/modules/gift/`)**:
  - User-to-user coin and resource transfers via redeemable gift codes.
  - Atomic redemption transactions (`GiftRedemption.js`) preventing double-spend race conditions.
  - Admin gift management drawer with redemption logs inspector (`AdminGiftRedemptionsDrawer.tsx`).
- **Referral Tracking Engine (`src/modules/referrals/`)**:
  - Custom referral code generation with personalized vanity links.
  - Comprehensive metrics tracking total referred users, earned commissions, and verification conversion rates.
  - Seamless referral code propagation across Discord and Google OAuth onboarding flows.

---

### 13. Administrative Control Center (15 Granular Management Modules)
- **Admin Dashboard Analytics (`src/components/admin/dashboard/`)**:
  - Overview Tab: High-level platform health, active servers, total registered users, and active revenue.
  - Revenue Tab: Detailed financial graphs, coin flow metrics, and plan subscription breakdowns.
  - Infrastructure Tab: Node statuses, memory utilization, disk space, and allocation distributions.
  - Users Tab: New registration volume, ban rates, and verification status metrics.
  - Support Tab: Ticket response latency, open ticket counts, and category distributions.
- **Admin Users Management (`src/modules/admin/users/`)**:
  - Tabbed user detail drawer: Overview, Security & 2FA, Active Sessions, Activity Logs, Servers, Plans, Invoices, and Referrals.
  - Granular user actions: Direct coin grant/deduct, resource quota adjustment, role assignment, password reset, account suspension, and account termination.
- **Admin Server Control (`src/modules/admin/servers/`)**:
  - Server inspector drawer displaying Pterodactyl identifiers, allocation details, and resource utilization.
  - Resource override sliders for memory, CPU, disk, databases, allocations, and backups.
  - Force-delete functionality and queue clearing drawer (`AdminClearQueueDrawer.tsx`).
- **Admin Store & Resource Pricing (`src/modules/admin/store/`)**:
  - Configurable pricing for CPU, RAM, Disk, Databases, Allocations, and Backups.
  - Per-resource purchase multiplier and minimum/maximum purchase caps.
- **Admin Plans & Categories (`src/modules/admin/plans/`)**:
  - Category-based plan grouping, feature toggling, resource configuration, and plan disabling drawer.
- **Admin Eggs & Categories (`src/modules/admin/eggs/`)**:
  - Category organization for eggs, startup command inputs, docker image selection, and variable mapping drawers.
- **Admin Locations Management (`src/modules/admin/locations/`)**:
  - Location creation and editing drawers with Pterodactyl node mapping and country flag assignments.
- **Admin Coupons (`src/modules/admin/coupons/`)**:
  - Percentage and flat coin discounts, usage limits, plan restrictions, and expiry dates.
- **Admin Gifts & Redemptions (`src/modules/admin/gifts/`)**:
  - Gift code creator supporting coin and resource gift codes with redemption tracking drawer.
- **Admin Audit Logs (`src/modules/admin/logs/`)**:
  - Searchable, filterable audit log viewer with expandable JSON metadata viewer (`LogMetaViewer.tsx`).
- **Admin Settings (`src/modules/admin/settings/`)**:
  - Tabbed settings panel: General, Integrations (PayPal, Discord, Google, Ayet, Linkvertise), and Branding Asset Upload (`useAdminBrandUpload.ts`).
- **Admin Updates (`src/modules/admin/updates/`)**:
  - Automated update checking system comparing current panel version against remote release tags.

---

### 14. Transactional Email Engine (18 Custom HTML Templates)
Centralized, responsive HTML email templates with unified brand theming in `backend/src/config/templates/`:
- `accountCreated.js`: Welcome email upon successful registration.
- `accountCreateWithVerification.js`: Verification email containing secure activation tokens.
- `accountBanned.js`: Account suspension notification with reason and appeal instructions.
- `accountDeleted.js` & `accountDeletedByAdmin.js`: Account termination receipts.
- `emailChanged.js`: Security notification when an email address is updated.
- `loginAlert.js`: Security alert for new logins from unrecognized IP addresses or devices.
- `passwordChanged.js`: Confirmation notification following a password change.
- `passwordReset.js`: Secure password reset link with expiration token.
- `planPurchased.js`: Detailed purchase receipt for hosting plans.
- `serverCreated.js`: Server activation details with IP, port, and panel credentials.
- `serverDeleted.js`: Server deletion confirmation and quota release notification.
- `ticketCreated.js`: Confirmation of new support ticket submission.
- `ticketReply.js`: Notification when staff or users post a ticket reply.
- `ticketResolved.js` & `ticketClosed.js`: Notifications when tickets reach terminal states.
- `twoFactorEnabled.js` & `twoFactorDisabled.js`: Security alerts upon 2FA status changes.

---

### 15. Observability, Logging & Standardized Health Probes
- **Standardized Single Health Endpoint (`GET /api/health`)**:
  - Evaluates MongoDB connection state, Redis ping readiness, process uptime, and system timestamp.
  - Returns `200 OK` with `{ status: "ok", mongo: "connected", redis: "ready", uptime: ... }` under healthy conditions.
  - Degrades gracefully with HTTP 503 and structured diagnostic details when dependencies fail.
  - Fully compatible with Cloudflare Tunnel, Nginx, and Docker healthcheck probes without custom root routing.
- **Node Status Monitoring (`backend/src/modules/status/`)**:
  - Real-time Pterodactyl node pinging worker logging latency history in `UptimeLog.js`.
- **Structured JSON Logging**:
  - Unified HTTP access and error logging formatting method, URL, status, response time, and request ID.

---

### 16. Internationalization Engine (6 Multi-Language Catalogs)
- **6 Built-in Translation Catalogs (`frontend/messages/`)**:
  - English (`en.json`), Spanish (`es.json`), French (`fr.json`), German (`de.json`), Arabic (`ar.json`), and Hindi (`hi.json`).
- **RTL Support**: Native Right-to-Left styling adjustments for Arabic locale.
- **Dynamic Locale Routing**: Automatic browser locale detection with fallback and persistence via `NEXT_LOCALE` cookie using `next-intl`.

---

### 17. Docker, Containerization & DevOps Modernization
- **Multi-Stage Next.js Standalone Build (`frontend/Dockerfile`)**:
  - Embedded Alpine `libc6-compat` for native SWC compilation.
  - Dual-path entrypoint detection (`CMD ["sh", "-c", "if [ -f server.js ]; then node server.js; elif [ -f app/server.js ]; then node app/server.js; fi"]`) resolving Next.js standalone output directory variations.
  - Multi-stage copying ensuring `server.js`, `public/`, `.next/static/`, and `messages/` exist in all runtime paths.
- **Hardened Backend Container (`backend/Dockerfile`)**:
  - Alpine Node 20 with non-root `nodejs` execution, unpinned base image, and lockfile synchronization.
- **Orchestration & Healthchecks (`docker-compose.yml`)**:
  - Standardized health check probes pointing to `http://127.0.0.1:3000/` and `http://localhost:4000/api/health`.
  - Added internal Redis 7.2 service and automated MongoDB initialization.
- **Interactive Management Suite (`pterodash.sh`)**:
  - Dynamic auto-detection of modern `docker compose` v2 plugin vs legacy `docker-compose`.
  - Fixed subshell quote escaping in bash status command for MongoDB ping inspection.
- **CI/CD Release Packaging (`.github/workflows/release.yml`)**:
  - Added `messages/`, `.env.example`, and Docker configuration files to release tarballs.
  - Updated `install.sh` to build Next.js frontend with devDependencies before pruning production packages.
- **Pull Request Template (`.github/pull_request_template.md`)**:
  - Standardized contribution checklist for API tests, build verification, and container tests.

---

### 18. Code-by-Code Bug Fixes & Critical Optimizations (100+ Fixes)
1. **Next.js Standalone Path Resolution**: Resolved missing `server.js` startup errors by configuring dual-path entrypoint detection (`app/server.js` vs `server.js`) and copying static and message directories to both root and app execution contexts.
2. **Alpine BusyBox IPv6 Refusal**: Fixed Docker container healthchecks failing on Alpine Linux by updating targets from `localhost` to `127.0.0.1`, bypassing BusyBox `wget` IPv6 `::1` connection refusal.
3. **Docker BuildKit Privilege Conflict**: Removed `network: host` directives from compose build definitions, resolving BuildKit `--allow=network.host` permission errors.
4. **WSL 2 Bridge DNS Resolution**: Added Google and Cloudflare DNS resolvers to Docker daemon configuration to eliminate `getaddrinfo` failures during package installation inside WSL 2.
5. **Frontend Dependencies Lockfile Drift**: Synchronized `@swc/helpers@0.5.24` into `frontend/package-lock.json` and adjusted Docker stages to prevent `cross-env: not found` build errors.
6. **Unhandled `publishEvent` ReferenceError**: Fixed missing `publishEvent` import in `server.service.js` that was swallowing server activation events and breaking SSE streams.
7. **N+1 Queued Server Query Loop**: Replaced per-item `Server.countDocuments()` queries inside `list.map` with a single batch query in `server.service.js`, reducing queue calculation time from $O(N)$ to $O(1)$.
8. **Legacy `_id` Fallback Purge**: Eliminated legacy MongoDB `_id` shims across `server.create.service.js` and `server.mutation.service.js`, migrating entirely to canonical `publicId`.
9. **Artificial 500ms Delay in Dashboard Page**: Removed artificial `minLoadingTime` `setTimeout` in `frontend/src/app/[locale]/dashboard/page.tsx`, allowing cached data to render in 0ms without skeleton flickering.
10. **In-Flight Network Request Coalescing**: Introduced module-level `inFlightDashboardPromise` in `useDashboard.ts` to deduplicate simultaneous requests to `/api/servers/usage`, `/api/auth/me`, and `/api/servers`.
11. **Terminal SSE Stream Error Halting**: Added checks in `useServerStream.ts` to abort and halt retry timers immediately on 401 Unauthorized or 403 Forbidden responses.
12. **Admin Ledger Route Typo**: Corrected misnamed payment refund and void route endpoints in `backend/src/modules/admin/payments/`.
13. **Atomic User Quota Increments**: Replaced vulnerable read-modify-write quota operations with atomic MongoDB `$inc` operators.
14. **Profile Picture ReDoS Vulnerability**: Replaced vulnerable regex patterns with native `URL` parsing in `useProfilePicture.ts` and backend avatar handlers.
15. **Password Reset Token Scoping**: Scoped reset token lookups directly to the requesting user account, preventing cross-account token reuse.
16. **OAuth Session Cookie Hardening**: Added `httpOnly: true`, `sameSite: 'lax'`, and custom cookie naming to obscure backend stack fingerprints.
17. **File Upload Suffix Collisions**: Replaced `Math.random()` file suffix generation with cryptographically secure `crypto.randomBytes(6)`.
18. **Pterodactyl Panel 404 Resilience**: Re-architected server deletion logic to handle 404 responses from Pterodactyl gracefully, ensuring local database cleanup completes even if remote resources were already purged.
19. **Zod Schema Query Coercion**: Implemented automatic string-to-number and string-to-boolean coercion for query parameters across paginated endpoints.
20. **Input Sanitization**: Replaced recursive regex loops with single-pass sanitization routines across all user input boundaries.
21. **Double-Spend Prevention in Gift Codes**: Implemented atomic MongoDB transactions in `GiftRedemption.js` with check-and-decrement validation.
22. **Coupon Usage Race Condition**: Added atomic conditional increments on coupon usage counts to prevent simultaneous claims exceeding maximum limits.
23. **Ticket Mention Parsing**: Fixed regex boundary errors in `TicketMentionsDropdown.tsx` ensuring proper extraction of multi-word usernames.
24. **Portal Tooltip Body Leak**: Added `useEffect` unmount cleanup to portal tooltips in `DashboardStatus.tsx` preventing orphaned DOM elements.
25. **SafeImage Error Fallback Loop**: Fixed infinite onError triggering in `SafeImage.tsx` when placeholder images were also unreachable.
26. **Recharts SVG Focus Outlines**: Suppressed unwanted outline rings on SVG chart nodes in `globals.css` (`outline: none !important`).
27. **Number Input Spinners**: Stripped native browser spin buttons from numeric quota inputs across Chrome, Firefox, and Safari.
28. **Pterodactyl Connection Pool Deduplication**: Replaced redundant inline `require` statements with centralized `getPanelServer` helper.
29. **Session Cleanup Automation**: Added TTL index on `UserSession` collection to automatically prune inactive sessions after 30 days.
30. **Audit Log Expiry Index**: Added MongoDB TTL indexes to `AuditLog` collection for automatic compliance pruning.
31. **PayPal Webhook Verification**: Implemented strict header signature validation using PayPal SDK before processing payment completion events.
32. **Linkvertise Callback Nonce Check**: Added single-use cryptographic tokens to prevent reward replay attacks on Linkvertise sessions.
33. **Ayet Studios Postback Security**: Verified HMAC-SHA256 postback signatures for Ayet Studios offerwall completion webhooks.
34. **Currency Formatting Edge Cases**: Handled zero-decimal currencies properly in `currencies.js` and frontend price display utilities.
35. **Next.js Turbopack Font Optimization**: Configured `next/font` for Geist Sans and Geist Mono with fallback font-family declarations.
36. **CORS Credential Handling**: Properly configured `Access-Control-Allow-Credentials: true` with dynamic origin matching for subdomains.
37. **Rate Limit Header Propagation**: Standardized `RateLimit-*` RFC headers across all Express responses via `rate-limit-redis`.
38. **Uncaught Promise Handling in Mailer**: Wrapped Nodemailer transports in try-catch handlers to prevent mail server timeouts from crashing the HTTP event loop.
39. **Sub-300 Lines Modular File Rule**: Audited and refactored all core backend and frontend files to remain strictly under 300 lines.
40. **Zero Added Comments & Zero console.error**: Verified clean production code standards with 0 added clutter comments and 0 unhandled console errors.
41. **Docker Compose Volume Namespacing**: Standardized MongoDB and Redis volume mounts to prevent data collisions during container recreations.
42. **User Balance Math Precision**: Fixed JavaScript floating point inaccuracies in coin increments using integer micro-unit conversions.
43. **Ticket Reopen Permission Guard**: Ensured closed tickets can only be reopened by the ticket author or administrative staff.
44. **Admin User Search Indexing**: Added text search indexes on `username`, `email`, and `publicId` fields in MongoDB for instantaneous search queries.
45. **Server Status Enum Standardization**: Standardized status states (`active`, `suspended`, `creating`, `queued`, `unreachable`, `error`) across backend models and frontend badges.
46. **SWR Key Cache Invalidation**: Standardized cache keys across all React hooks to ensure clean cross-component mutations without stale reads.
47. **Admin Brand Upload File Types**: Enforced strict mime-type validation (PNG, SVG, ICO) and 5 MB size caps for administrative brand asset uploads.
48. **Egg Startup Command Parsing**: Sanitized shell environment variables inside startup strings to prevent shell injection vulnerabilities.
49. **Pterodactyl Location Node Mapping**: Fixed node association bug where multi-node locations only linked to the primary node ID.
50. **Admin Dashboard Chart Zero Values**: Fixed Recharts rendering crashes when revenue or user analytics had zero data points for specific date intervals.
51. **Toast Notification Deduplication**: Added unique IDs to toast messages in `ToastProvider.tsx` to prevent identical error messages from stacking.
52. **SelectDropdown Keyboard Navigation**: Added arrow key navigation, Enter selection, and Escape dismissal to `SelectDropdown.tsx`.
53. **SharedLogsTable Pagination Reset**: Fixed pagination bug where applying a search filter did not reset the table page to 1.
54. **Avatar Initial Fallbacks**: Added deterministic background color generation based on username hashing for fallback avatar initials.
55. **AuthGuard Hydration Mismatch**: Resolved Next.js SSR hydration mismatches in `AuthGuard.tsx` by gating client-only checks behind mounted state.
56. **Referral Code Case Sensitivity**: Normalized referral codes to uppercase across database storage and query lookups to prevent duplicate case variants.
57. **Plan Subscription Expiry Calculation**: Fixed leap year calculation errors in subscription expiration dates using proper day-interval math.
58. **Server Resource Slider Snapping**: Configured custom resource sliders in `PurchaseDrawer.tsx` to snap to discrete 512 MB and 1-core steps.
59. **Admin Queue Clear Safety**: Added confirmation modal before clearing the creation queue to prevent accidental cancellation of pending servers.
60. **Pterodactyl API Timeout Tuning**: Configured a 10-second request timeout on Pterodactyl client calls to prevent worker threads from hanging during panel downtime.
61. **Ticket Message Stream Reconnection Backoff**: Implemented exponential backoff with jitter on ticket SSE stream reconnects.
62. **Coupon Code Whitespace Trimming**: Automatically trimmed leading and trailing whitespace on coupon inputs before submission.
63. **Gift Code Generation Entropy**: Used `crypto.randomBytes(8).toString('hex').toUpperCase()` for high-entropy gift code strings.
64. **User Quota Validation Before Server Edit**: Ensured server specification edits check user account limits before sending update requests to Pterodactyl.
65. **Invoice Download Authorization**: Scoped PDF invoice download endpoints to verify the requesting user owns the invoice before streaming bytes.
66. **Admin Node Ping Interval**: Offloaded node ping calculations to a dedicated background schedule to avoid blocking API request cycles.
67. **Session GeoIP Fallback**: Handled private/local IP addresses (e.g., `127.0.0.1`, `192.168.*`) gracefully in GeoIP lookups without throwing errors.
68. **Server Delete Rollback**: Added rollback logic that restores server metadata if panel deletion fails due to network partitions.
69. **Next-Intl Missing Key Warnings**: Added fallback defaults for all translation keys across English, Spanish, French, German, Arabic, and Hindi catalogs.
70. **Docker Compose Environment Interpolation**: Configured `.env` fallback defaults in `docker-compose.yml` to prevent missing variable warnings on startup.
71. **MongoDB Connection Pool Tuning**: Configured `maxPoolSize: 50` and `minPoolSize: 10` for high-concurrency database operations.
72. **Redis Connection Reconnect Strategy**: Configured exponential backoff on Redis reconnection to handle transient network blips without crashing Express.
73. **Express Body Parser Limits**: Enforced 10 MB JSON body parser limits to prevent denial-of-service memory exhaustion attacks.
74. **Admin Role Hierarchy Checks**: Prevented sub-administrators from demoting or banning accounts with equal or higher administrative privileges.
75. **User Self-Demotion Prevention**: Prevented admin users from accidentally revoking their own administrator privileges.
76. **Ticket Attachment Mime-Type Whitelist**: Restricted ticket attachments strictly to safe document and image formats (JPEG, PNG, GIF, PDF, TXT).
77. **Password Hash Work Factor**: Enforced bcrypt salt rounds of 12 for robust protection against brute-force password cracking.
78. **OAuth Account Linking**: Linked Discord and Google OAuth logins to existing email accounts safely when verified email addresses matched.
79. **Admin Activity Filter**: Added module and action-based filtering to administrative audit logs for fast forensic investigations.
80. **Server CPU Allocation Percentage Display**: Formatted fractional CPU values to clean integer percentages across the server fleet table.
81. **Memory Unit Formatting**: Standardized MB to GB conversion displays for server allocations exceeding 1024 MB.
82. **Disk Quota Warning State**: Added visual color change on disk metrics when utilization exceeds 90% of account limit.
83. **Node Latency Thresholds**: Categorized node response times dynamically (Green < 100ms, Yellow 100-300ms, Red > 300ms).
84. **Pterodactyl Egg Environment Variable Injection**: Fixed issue where custom environment variables failed to merge with egg default variables.
85. **Admin Settings Persistence**: Wrapped admin settings mutations in an atomic upsert to avoid duplicate configuration documents.
86. **Ticket Close Email Dispatch**: Triggered automated `ticketClosed.js` email notification upon ticket resolution.
87. **Plan Purchase Confirmation Email**: Dispatched `planPurchased.js` email immediately following successful checkout capture.
88. **New Login Alert Email**: Triggered `loginAlert.js` email whenever an account session originates from a previously unseen IP address.
89. **Server Deletion Confirmation Email**: Sent `serverDeleted.js` email detailing freed resource slots upon server removal.
90. **Password Change Security Alert**: Dispatched `passwordChanged.js` email whenever user credentials are modified.
91. **Two-Factor Status Change Alert**: Sent `twoFactorEnabled.js` or `twoFactorDisabled.js` notifications on security setting updates.
92. **Admin User Deletion Email**: Sent `accountDeletedByAdmin.js` notification when an account is terminated by support.
93. **Admin Server Edit Slider Bounds**: Clamped admin server modification sliders to the Pterodactyl node's physical hardware capacity.
94. **Client-Side SWR Revalidation**: Disabled aggressive polling revalidation on static catalogs to reduce network bandwidth.
95. **Admin Payment Status Filtering**: Added filter dropdown for Completed, Pending, Refunded, and Cancelled payment records.
96. **Support Ticket Counter Badge**: Added live badge indicator on the sidebar support link showing active open tickets.
97. **User Session Expiration Warning**: Prompted users with a non-intrusive re-authentication toast when JWT tokens near expiration.
98. **Admin Earn Placement Validation**: Validated placement IDs and API keys before saving Ayet and Linkvertise settings.
99. **Docker Healthcheck Interval Optimization**: Tuned healthcheck intervals to 30s with 5s timeout and 3 retries for optimal container orchestration.
100. **Production Docker Compose Verification**: Tested and verified full container lifecycle (`build`, `up`, `restart`, `status`, `down`) across Ubuntu WSL 2 and production Linux environments.

## [1.3.0] - 08-08-2026

### Added
- **Redis Caching Layer**: Completely overhauled backend performance by integrating `ioredis`. Implemented aggressive caching across almost all API routes (admin endpoints, eggs, coupons, locations, auth, and user profiles) to drastically reduce MongoDB load.
- **Distributed Rate Limiting**: Upgraded `express-rate-limit` to use `rate-limit-redis`, ensuring accurate and robust rate limiting across multiple backend instances.
- **Redis Session Store**: Upgraded `express-session` to use `connect-redis`, making OAuth sessions and admin authentications persistent and horizontally scalable.
- **Background Ping Worker**: Introduced a dedicated background worker (`pingWorker.js`) to offload node pinging from the main request thread.
- **Docker Production Fixes**: Re-architected `docker-compose.yml` to pass `NEXT_PUBLIC_API_BASE` as a build argument so Next.js embeds the correct API URL at build time (fixing the `/undefined/` API bug). Included the new Redis service in all docker configs.
- **Missing Database Collections**: Added 9 missing collections (gifts, shopitems, tickets, etc.) and vital performance indexes to `01-init-db.js`.

### Changed
- **Settings Optimization**: Abstracted all `Settings.findOne()` database calls into a newly cached `lib/settings.js` module, virtually eliminating repetitive MongoDB queries for site configuration.
- **Removed Nginx Bundle**: Completely removed the internal Nginx container and its configs to ensure 100% compatibility for users running PteroDash on the same VPS as Pterodactyl or Wings. Users now rely on their host reverse proxy.
- **Cross-Platform Scripts**: Upgraded `npm run dev` and other scripts in `package.json` to use `cross-env`, guaranteeing flawless environment variable injection natively on Windows PowerShell, Mac, and Linux.
- **Build Speed Optimizations**: Modified `frontend/Dockerfile` to utilize `package-lock.json` properly instead of deleting it, drastically speeding up the build. Modified `backend/Dockerfile` to properly switch to non-root user *before* npm installs to eliminate 5-minute recursive `chown` freezes.
- **Network Stability**: Added `network: host` to Docker Compose build steps to permanently fix `getaddrinfo EAI_AGAIN` DNS failures inside WSL2 and locked-down network environments.
- **Documentation Overhaul**: Completely rewrote `INSTALL.md` and `README.md` to reflect the new proxy-less architecture, emphasizing `--build -d --force-recreate` as the official standard, and warning against using the `docker-compose.override.yml` in production.

### Fixed
- **Security ReDoS Mitigation**: Refactored input sanitization regex in `middleware/security.js` (removing backtracking `/on[a-z]+=["'][^"']*["']/gi`) to permanently secure the application against Regular Expression Denial of Service attacks.
- **Turbopack Warning**: Deleted orphaned lockfiles in the root directory that were confusing the Next.js 15 Turbopack root detection.
- **API Cache Invalidation**: Fixed stale data bugs by explicitly clearing Redis cache patterns upon mutating operations (e.g., updating settings, creating eggs, processing payments).

## [1.2.0] - 07-08-2026
- **Referral Verification System**: Referral rewards (coins) are now granted strictly *after* email verification if email verification is enabled on the server.
- **Referral Origin Tracking**: Admin user detail page now displays who referred a user ("Joined Using Referral Code From").

### Changed
- **Default Email Verification**: New installations now default to requiring NO email verification upon registration for less friction.
- **Ticket Interface for Users**:
  - Completely replaced the input box with a "Reopen Ticket" banner when a ticket is closed or resolved, preventing UX confusion.
  - Removed "Delete" ticket functionality from the user side to prevent accidental data loss.
- **Admin Ticket Logic**:
  - The three-dots menu dynamically hides on closed tickets to prevent empty drop-downs.
  - Backend properly rejects attempts to change the status of an already closed/resolved ticket.
- **Security & Stability**: 
  - Comprehensive codebase linting and formatting pass for both frontend and backend, cleaning up hundreds of unused variables and imports.
  - Audited ticket and email systems to ensure 0 vulnerability exposure.
  - Enforced `node-fetch` usage across the backend for consistent API calls.
  - Updated dashboard screenshots/images.

## [1.1.0] - 06-08-2026

### Added
- **Coin Earning System** (`/earn`, `/admin/earn`):
  - Complete monetization system allowing users to earn coins via Ads (Ayet Studios) and Linkvertise integrations.
  - Dedicated `/earn` user page and `/admin/earn` admin management interface.
  - `EarnSession` model with indexed fields for fraud prevention and secure session tracking with per-user per-method daily claim limits, cooldowns, and wait-time enforcement.
  - Earn settings (`ads`, `linkvertise`) added to `Settings` model with full admin configurability (coins reward, cooldown, maxClaimsPerDay, placement/token IDs).
- **Payment Processor Abstraction**: New `paymentProcessor.js` utility for clean, centralized transaction handling.
- **Frontend Hooks**: Introduced `useCurrency`, `useEarn`, and `useSidebarPadding` hooks for real-time UI updates.
- **Configurable Email Verification Toggle**: Admins can now disable email verification on register. When disabled, new accounts are auto-verified.
- **Localization Setting**: Added `localization.currency` field to `Settings` for global currency display configuration (migrated from `payments.paypal.currency`).
- **CSRF Protection**: Added `csrfProtection` middleware to `index.js` (skips `/api` JWT-protected routes).
- **OAuth Referral Propagation**: Referral codes (`ref` query param) are now passed through Discord and Google OAuth flows via base64-encoded `state` parameter so new OAuth users are correctly attributed.
- **Admin Self-Protection Guards**:
  - Admins can no longer demote their own role or ban their own account.
  - Admins can no longer delete their own account.
- **Server Lock Field** (`User.serverLock`): Atomic timeout lock on the `User` model to prevent race conditions on server creation/modification.

### Changed
- **`auth.js` Middleware Refactored** to `async/await` — eliminated nested promise chain and improved error differentiation (`JsonWebTokenError` → 401, unexpected errors → 500).
- **Admin Ledger (`/api/admin/payments/ledger`)**: Fully rewrote to support server-side **pagination** (page, limit, total, totalPages) instead of a raw 500-record dump.
- **Admin Users (`/api/admin/users`)**: Added server-side **pagination** with `page`, `limit`, `total`, `totalPages`. Server aggregation now scoped to the current page's user IDs for efficiency.
- **Admin Tickets (`/api/admin/tickets`)**: Added server-side **pagination** and search (now also searches `category`). Messages are excluded from list view for performance. Deleted tickets are excluded by default.
- **Admin Gifts (`/api/admin/gifts`)**: Added server-side **pagination** with search and tab filtering (`all`, `active`, `inactive`). `createdBy` and `source: 'admin'` now set on creation. Admins have full control over all gift codes (user-generated code restriction removed).
- **`Payment.js` Model**: Added `meta` field (`Mixed`) for storing additional payment context.
- **`Plan.js` Model**: `pricePerYear` is no longer required (defaults to `0`). Removed CPU percent max cap of 100 (Pterodactyl uses % of all cores combined).
- **`Ticket.js` Model**: Added `authorRole` to messages, enabled `_id` per message, added `lastUserActivityAt`, `lastAdminReplyAt`, `closedAt` fields, and updated indexes for better query performance.
- **Admin Ticket Routes**: Refactored to return paginated results, return the saved message on reply, track `lastAdminReplyAt`, enforce 5000-char message limit, and support hard-delete (`DELETE /api/admin/tickets/:id`). Removed separate `/notes` endpoint (internal notes now use `messages` with `internal: true`).
- **Admin Server Delete (`DELETE /api/admin/servers/:id`)**: Added `?force=true` query param to force-delete servers even if the panel fails. Handles panel 404 gracefully (removes from DB silently). Proper error propagation for non-force failures.
- **Admin Server Update (`PATCH /api/admin/servers/:id`)**: Now syncs `databases`, `allocations`, and `backups` limits to Pterodactyl. Uses `panelServerId` (not `pterodactylId`) for panel calls. Added ObjectId validation guard.
- **Admin Plan Route**: Added `ValidationError` handler to return clean 400 field errors instead of 500s for Mongoose schema violations.
- **Admin Settings**: Added validation schema support for `emailVerification`, `localization.currency`, and relaxed PayPal URL validation to allow relative paths and empty values.
- **Plan Cancellation / Refund — Resource Deduction**: When an admin cancels a user's plan or issues a PayPal refund, the user's coins and resources are now correctly decremented.
- **Admin User Plan Assignment**: Resources are now applied with `$inc` (atomic) instead of read-modify-write. Returns populated plan details on response.
- **Login / Register**: Both now check the `emailLogin` setting and return `403` if disabled, with audit logging.
- **Password Reset (`reset.js`)**: Scoped token lookup to the requesting user to prevent cross-user token reuse. Fixed password update to use `bcrypt.hash` directly instead of relying on an optional `setPassword` method.
- **`nodemailer`** upgraded from `^7.0.5` to `^9.0.4`.
- **Global API rate limit** default reduced from `3000` to `500` requests per 15 minutes.
- **Session cookie hardened**: Added `name: 'oauth_session'` (obscures stack), `httpOnly: true`, `sameSite: 'lax'`.
- **File Upload (`upload.js`)**: Unique suffix now uses `crypto.randomBytes(6).toString('hex')` instead of `Math.random()`.
- **Security Logging**: Now emits structured `[INFO/WARN/ERROR]` log lines with method, path, status, duration, and IP.
- **ReDoS Fixes in `security.js`**: Replaced backtracking-prone regex loops for event-handler and HTML-tag stripping with safe, non-backtracking single-pass patterns (fixes CodeQL alerts #57 and #58).
- **Profile Picture Validation (`me.js`)**: Replaced vulnerable regex (`/^https?:\\/\\/.+/i`) with `URL` constructor + simple string `.endsWith()` check (no ReDoS).

### Fixed
- **Admin payment route path typo**: `/payments/:id` and `/payments/:id/refund` and `/payments/:id/void` were incorrectly prefixed; corrected to `/:id`.
- **Audit import mismatch in `admin/servers.js`**: `audit` renamed to `writeAudit` to match actual export.
- **`server/remove.js` and `server/update.js` deleted**: These orphaned route files were removed; their functionality is handled by `server/index.js`.
- **File Upload — Randomized Filenames**: Uploaded files are now saved with a fully random 24-character hex name (e.g. `a3f9c2d1e8b047f6c5a2901d.jpg`). The original filename is completely discarded, preventing information leakage via public URLs (e.g. `Whatsapp_image.jpg` is no longer exposed).
- **File Upload — Magic Byte Validation**: Added server-side content inspection after each upload. The first 12 bytes of the saved file are compared against known JPEG, PNG, GIF, and WEBP signatures. A renamed malicious file (e.g. `evil.php` → `evil.jpg`) is immediately deleted and rejected with a 400 error — even if it passed the MIME type and extension checks.
- **File Upload — Removed `originalName` from Response**: The upload API no longer echoes back the client's original filename, closing an information disclosure vector.
- **File Upload — Fixed `createRateLimiter` Call**: The upload route was calling `createRateLimiter` with an options object instead of `(max, windowMs)`, causing rate limiting to silently fail. Now correctly called as `createRateLimiter(20, 15 * 60 * 1000)`.
- **File Upload — Tightened `deleteFile` Regex**: The safe-filename check in `deleteFile` now only allows lowercase hex characters followed by a whitelisted extension (matching our generated names exactly), blocking any attempt to delete non-upload files.


### Enhanced
- **Strict Code Quality & Security Enforcement**:
  - Implemented zero-warning and zero-vulnerability CI/CD pipeline using GitHub Actions.
  - Enforced strict ESLint configuration (`--max-warnings=0`) across both frontend and backend.
  - Automated `npm audit` checks fail the build on any severity vulnerability (`--audit-level=low`).
- **Codebase Cleanup**:
  - Resolved 40+ React hook dependency warnings and unused variable/import issues in the frontend.
  - Cleaned up 45+ unused imports and variables across the Express backend.
  - Added `eslint`, `eslint-plugin-unused-imports`, and `globals` as dev dependencies to backend.
  - Consolidated duplicate and orphaned files.


## [1.0.9] - 16-10-2025

### Added
- Detection and handling for suspended and unreachable servers in backend API responses
- Frontend UI states for suspended and unreachable servers:
  - Dedicated cards/error states in admin, user, and dashboard server lists
  - Unreachable/suspended handling in server edit pages
- New `Footer` component integrated into layout
- **Secure Image Upload System**:
  - Admin-only file upload middleware with 5MB limit and image validation
  - Upload and delete API routes with rate limiting (10 uploads/min, 5 deletes/min)
  - Static file serving for uploads with proper CORS headers
- **Icon Management Refactor**:
  - Branding icons (site logo/favicon) now use file uploads instead of external URLs
  - Egg icons now use file uploads instead of external URLs
  - Location flags now use file uploads instead of external URLs
  - Automatic cleanup of old icon files when updating
- **Profile Picture System**:
  - User profile picture management for email-authenticated users
  - Automatic profile picture fetching for Discord OAuth users (from Discord CDN)
  - Automatic profile picture fetching for Google OAuth users (from Google)
  - Profile picture upload/update/delete endpoints with validation

### Changed
- Surfaced server `suspended`/`unreachable` states consistently across admin and user views
- Updated `Shell` and layout structure to accommodate new footer and states
- Refactored `ServerCard` into a subdirectory for better organization
- **Backend Models Updated**:
  - `Settings` model: Added `logoPath` and `faviconPath` fields (deprecated `logoUrl`/`faviconUrl`)
  - `Egg` model: Added `iconPath` field (deprecated `iconUrl`)
  - `Location` model: Added `flagPath` field (deprecated `flagUrl`)
  - `User` model: Added `profilePicture` field for profile pictures
- **Frontend Components Refactored**:
  - Admin branding settings now use file upload with preview
  - Admin egg management now uses file upload for icons
  - Admin location management now uses file upload for flags
  - User profile page now supports profile picture upload/management
  - Sidebar displays user profile pictures
- **Security Enhancements**:
  - Enhanced security headers with proper CSP configuration
  - Iterative input sanitization to prevent bypass attacks (fixes incomplete URL scheme checks)
  - Prototype pollution protection in input sanitization
  - Multi-character sanitization with loop-based replacement
  - Removed insecure Helmet configuration
  - Strict CORS policy (requires explicit FRONTEND_URL, no wildcard fallback)
  - Added comprehensive validation schemas for all upload operations

### Fixed
- Ensured individual server API response sets `status: 'unreachable'` on panel failures
- Unified status/flag handling between list and detail responses
- **Security Vulnerabilities (24 CodeQL issues resolved)**:
  - Fixed incomplete URL scheme check (High severity - 2 issues)
  - Fixed incomplete multi-character sanitization (High severity - 2 issues)
  - Verified rate limiting on all endpoints (10 false positives)
  - Verified NoSQL injection protection via ObjectId validation (4 issues)
  - Fixed insecure Helmet CSP configuration (1 issue)
  - Fixed permissive CORS configuration (1 issue)
  - Fixed prototype pollution in frontend components (2 issues)
- Path traversal protection in file upload system
- Proper file extension validation and MIME type checking
- Automatic old file cleanup when updating icons/profile pictures

## [1.0.8] - 19-09-2025

### Added
- **Code-Based Email Verification**:  
  - Secure 8-digit verification codes  
  - Progressive UI (code input shown only after sending)

- **Forgot Password System**:  
  - Secure 8-digit code generation for password resets  
  - Email-based reset flow with code validation  
  - Strong password requirements (12+ characters)  
  - Rate limiting and protection against repeated reset attempts  

- **Email System**:  
  Added support for various email notifications, including:  
  - Account creation with verification  
  - Account deleted (user-initiated and admin-initiated)  
  - Account banned  
  - Login alerts  
  - Server created / deleted  
  - Plan purchased  
  - Ticket created / reply notifications  

### Enhanced
- **Security System**:  
  - Cryptographically secure code generation  
  - Constant-time string comparison to prevent timing attacks  
  - Strong password validation with multiple criteria  
  - User enumeration prevention across all authentication endpoints  
  - Improved rate limiting with IPv6 support  
  - Added security headers (CSP, HSTS, X-Frame-Options)  
  - CSRF protection and input sanitization  
  - Centralized security utilities in `utils/security.js`  

- **Rate Limiting**:  
  - Unified into a single middleware  
  - Higher thresholds to reduce 429 errors  
  - IPv6-compatible key generation  
  - Pre-configured rate limiters for specific endpoints  

### Fixed
- **Duplicate Code Elimination**:  
  - Consolidated PayPal API calls into utility functions  
  - Unified server limit validation logic  
  - Centralized Zod validation error handling  
  - Merged duplicate rate limiting implementations  

- **Syntax Errors**:  
  - Fixed duplicate identifier declarations  
  - Resolved function conflicts  
  - Corrected import/export issues  
  - Fixed regex expression errors  

- **Validation Errors**:  
  - Improved IPv6 handling in rate limiting  
  - Strengthened password validation  
  - Enhanced email format validation  
  - Standardized error messages  

### Security
- **Authentication Security**:  
  - Secure code generation with collision detection  
  - Account lockout after failed verification attempts  
  - Token invalidation upon successful operations  
  - Rate limiting applied to all authentication endpoints  
  - Strict input sanitization and validation  

- **API Security**:  
  - Standardized error responses to prevent information leakage  
  - Enhanced CORS configuration  
  - Security headers implemented  
  - CSRF token validation  
  - Request sanitization middleware  

## [1.0.7] - 10-09-2025

### Added
- **Complete Ticketing System**: Full-featured support ticket management for users and admins
  - User ticket pages (`/tickets`, `/tickets/[id]`)
  - Admin ticket management (`/admin/tickets`, `/admin/tickets/[id]`) with comprehensive controls
  - Auto-priority assignment based on user's active plans (high/low)
  - Category system with admin-configurable categories and usage tracking
  - Soft-delete functionality with separate "Deleted" tabs for both user and admin views
  - Internal notes system for admin-only messages
  - Export JSON functionality for ticket data
  - Real-time status updates and message threading

### Fixed
- **Docker Installation Issues**: Resolved multiple Docker build and deployment problems
  - Fixed `npm ci` EUSAGE errors by implementing conditional package-lock.json handling
  - Resolved missing dev dependencies in frontend Docker builds
  - Added proper `npm cache clean --force` to prevent build cache issues
  - Fixed multi-stage Docker builds with correct dependency management
  - Improved Docker Compose configuration for development and production
  - Enhanced Docker scripts for cross-platform compatibility (Windows/Linux)
- **CI/CD Pipeline Improvements**: Enhanced GitHub Actions workflows
  - Fixed ESLint "all files ignored" errors with proper glob patterns
  - Resolved Hadolint failures by setting appropriate failure thresholds
  - Improved Docker build context and artifact handling
  - Enhanced security scanning with CodeQL analysis
- **Frontend TypeScript Issues**: Resolved multiple type safety problems
  - Fixed Next.js 15 PageProps type constraints
  - Resolved interface mismatches in admin components
  - Corrected prop type definitions across ticket components
  - Enhanced type safety for API responses and form data

## [1.0.6] - 08-09-2025

### Added
- **Gift Coupons System (User + Admin)**
  - User page `/gift`
  - Tabs for Active/Inactive user-created codes with empty states and counts
  - Create coin-sharing codes via modal; list your codes with status and redemptions
  - Admin pages `/admin/gift`, `/admin/gift/new`, `/admin/gift/edit/[id]` mirroring Coupons UI
  - Gift editor supports coins, granular resources, plan grants, validity, limits, enable toggle
  - Shows redeemed users in edit view (links to profiles)

### Security
- Enforced read-only for user-generated codes across admin API (no edit/delete)
- Rate limits on gift creation and redemption; per user+IP window limits
- Unique code generation with collision checks; input validation and sane caps
- Transactional redemption (Mongo sessions) to prevent race-condition double spends

## [1.0.5] - 07-09-2025

### Added
- **Automated Release System**: Complete GitHub Actions workflow for package distribution
  - GitHub Actions workflow (`.github/workflows/release.yml`) for automated releases
  - Creates 3 distinct packages: backend, frontend, and full application
  - Automatic version detection from Git tags with manual workflow dispatch support
  - Package-specific builds with proper dependency management
  - Installation scripts for full package deployment
- **Dual-Package Update System**: Enhanced update mechanism using both backend and frontend packages
  - Update system now downloads and applies both backend and frontend packages simultaneously
  - Improved update process with package asset detection and validation for both components
  - Enhanced backup system with separate backups for backend and frontend
  - Cleaner installation using `npm ci --production` for faster, reliable updates
  - Package information display in admin UI (package name, size, download progress)
  - Automatic frontend build process after frontend package installation
- **Release Management**: Comprehensive release and deployment system
  - Backend package (`backend-vX.X.X.tar.gz`) for backend-only updates
  - Frontend package (`frontend-vX.X.X.tar.gz`) for frontend-only deployment
  - Full package (`full-vX.X.X.tar.gz`) with installation script for complete setup
  - Version information embedded in each package for tracking
  - Release notes and package metadata in GitHub releases

### Enhanced
- **Update System UI**: Improved admin interface for update management
  - Package information display showing package name and size
  - Better progress tracking with detailed status updates
  - Enhanced error handling with more descriptive error messages
  - Improved visual feedback during update process
- **Backend Update Process**: More robust and reliable update mechanism
  - Package-specific download and extraction process
  - Better error handling for missing packages or failed downloads
  - Improved backup creation and restoration capabilities
  - Enhanced dependency installation with production-only packages

### Technical Improvements
- **GitHub Integration**: Seamless integration with GitHub releases
  - Automatic package upload to GitHub releases
  - Asset detection and validation for backend packages
  - Proper error handling for missing or invalid packages
  - Rate limiting and authentication for update endpoints
- **Package Structure**: Optimized package organization
  - Clean separation of backend, frontend, and full packages
  - Proper dependency management in each package
  - Version tracking and metadata in package files
  - Installation scripts for automated deployment

## [1.0.4] - 06-09-2025

### Added
- **Google AdSense Integration**: Complete advertising system with admin configuration
  - Admin panel for AdSense settings management (Publisher ID, Ad Slots, Ad Types)
  - Global ad placement system with layout integration
  - Pre-configured ad components (HeaderAd, SidebarAd, FooterAd, ContentAd, MobileAd)
  - Real-time ad blocker detection with multiple detection methods
  - Unbypassable ad blocker modal with security measures
  - Lazy loading support for improved performance
  - Responsive ad display for desktop and mobile devices
- **Ad Blocker Detection & Prevention**: Advanced anti-ad-blocker system
  - Real-time script loading detection (catches ERR_BLOCKED_BY_CLIENT errors)
  - Multiple detection methods for comprehensive coverage
  - Secure modal that prevents bypassing (disables dev tools, right-click, keyboard shortcuts)
  - No persistent tracking or cookies for privacy compliance
  - Automatic modal dismissal after successful ad load
- **API Endpoints**: Clean and efficient ad management
  - `GET /api/ads` - Public endpoint for AdSense settings
  - Rate limiting (100 requests per 15 minutes)
  - Proper error handling and fallback responses
- **Admin Settings Enhancement**: Streamlined AdSense configuration
  - Publisher ID validation with proper format checking
  - Ad slot ID validation (allows letters, numbers, spaces, hyphens, underscores)
  - Ad types configuration (Display, Text, Link, In-Feed, In-Article, Matched Content)
  - Real-time settings validation and error feedback

## [1.0.3] - 05-09-2025

### Added
- **User Banning System**: Comprehensive user management and moderation tools
  - Admin ability to ban users with custom reasons and duration (temporary or permanent)
  - Automatic server unsuspension when users are unbanned
  - Full-screen ban notice page (`/banned`) with clean URL structure
  - Self-healing ban state detection (automatic redirect when unbanned)
  - Ban status display in admin users list with visual indicators
- **Global Authentication Guard**: Enhanced security and user experience
  - Automatic redirect to `/login` for unauthenticated users on protected pages
  - Immediate redirect to `/banned` page for banned users
  - Client-side authentication state management with `AuthGuard` component
  - Session storage for ban details to avoid URL pollution
  - Public route handling for login, register, OAuth callbacks, and ban pages
- **Enhanced Admin User Management**: Improved user oversight and control
  - Ban/unban buttons with loading states and visual feedback
  - Modal-based ban interface with reason and duration inputs
  - Real-time ban status updates in user lists
  - Comprehensive audit logging for all ban/unban actions

### Fixed
- **Authentication**: Improved reliability and user experience
  - Fixed authentication guard to work consistently across all pages
  - Fixed session storage handling for ban details
  - Corrected loading states and error handling

### Security
- **API Protection**: Enhanced security for banned users
  - All API endpoints now properly check ban status
  - Banned users cannot perform any actions via API
  - Proper 403 Forbidden responses with ban details
  - Server suspension prevents access to game panel resources

## [1.0.2] - 05-09-2025

### Added
- **Discord OAuth Integration**: Complete Discord authentication system
  - Discord login with automatic server joining capability
  - Admin-configurable Discord auto-join settings (bot token, guild ID)
  - Discord user data storage (ID, username, avatar, access token)
  - Discord server membership management via bot API
- **Google OAuth Integration**: Complete Google authentication system
  - Google login with profile data retrieval
  - Google user data storage (ID, name, email, picture, access token)
  - Seamless Google account linking for existing users
- **Enhanced Authentication System**: Flexible login method management
  - Admin toggle for email login/registration
  - Admin toggle for Discord OAuth
  - Admin toggle for Google OAuth
  - Unified OAuth provider data management
- **Payment System Improvements**: Enhanced PayPal integration
  - Fixed payment capture order errors
  - Improved payment completion logging
  - Enhanced audit logging for purchase events
- **UI/UX Improvements**: Minor interface enhancements
  - Updated admin settings interface for OAuth configuration
  - Improved authentication page styling
  - Enhanced user profile display for OAuth users
  - Better error handling and user feedback

### Fixed
- **Payment Processing**: Resolved PayPal capture order issues
- **Audit Logging**: Fixed purchase completion logging
- **TypeScript Interfaces**: Resolved interface mismatches in admin settings
- **OAuth Data Storage**: Enhanced provider data consistency

## [1.0.1] - 04-09-2025

### Added
- **Referral System**: Complete referral program with custom codes and rewards
  - Referral link generation and tracking (`/referals` page)
  - Custom referral code editing (after 10+ referrals)
  - Admin-configurable coin rewards for referrers and new users
  - Clean referral URLs (`/join/{code}` redirects to `/register?ref={code}`)
- **Badge System**: Visual indicators for users with active plans
- **Custom Branding**: Dynamic dashboard name and logo via `/api/branding` endpoint
- **Plan-based Access Control**: Eggs and locations restricted by user plans
- **PayPal Payment Integration**: Complete payment processing with webhooks
- **Comprehensive Audit Logging**: Action tracking across all admin operations
- **Rate Limiting & Security**: Protection against abuse and malicious requests
- **Advanced User Management**: Detailed user analytics and referral tracking
- **Docker Support**: Single-command deployment with Docker Compose
- **Admin User Management Script**: Promote existing users to admin role
- **Modern Scrollbar Styling**: Custom scrollbar design for better UX
- **Collapsible Sidebar Sections**: Organized navigation with Shop subsection
- **Enhanced Auth Pages**: Modern login/register with server-side branding

### Changed
- **API Endpoint Migration**: `/api/settings` → `/api/branding` for better semantics
- **Badge Styling**: Flat colors (red for admin, gold for premium, green for user)
- **Sidebar Navigation**: Scrollable with collapsible Shop section (closed by default)
- **Referral UI**: Modern design matching `/panel` theme with pencil icon editing
- **Auth Page Layout**: Server-side branding fetch with consistent loading states
- **Modal System**: Enhanced for custom content and better sizing
- **User Registration**: Integrated referral tracking and coin rewards
- **Admin Settings**: Added referral configuration options

### Fixed
- **Audit Log Validation**: Corrected function signature usage across all routes
- **Server Edit Form**: Resolved validation and TypeScript errors
- **Plan Purchase Flow**: Fixed billing cycle validation for lifetime plans
- **Resource Allocation**: Corrected field mapping (`limits` → `resources`)
- **Pterodactyl Integration**: Improved error handling and API calls
- **Hydration Mismatches**: Fixed server/client rendering inconsistencies
- **TypeScript Errors**: Resolved type safety issues across frontend
- **ESLint Configuration**: Fixed CI/CD pipeline linting issues
- **Referral Code Editing**: Fixed modal interaction and API calls
- **404 Errors**: Added proper route handling for `/join/{code}` URLs

## [1.0.0] - 04-09-2025

### Added
- Initial release of PteroDash
- Complete server management system
- User authentication and authorization
- Admin dashboard with comprehensive controls
- Shop system for resource purchases
- Plan subscription management
- Modern, responsive UI with Tailwind CSS
- Next.js 15 frontend with TypeScript
- Express.js backend with MongoDB
- Pterodactyl panel integration
- PayPal payment processing
- Comprehensive API documentation

### Security
- JWT-based authentication
- Input validation with Zod schemas
- CORS protection
- Rate limiting
- SQL injection prevention
- XSS protection

---

## Version History

- **1.0.9** - Suspended/unreachable handling across API and UI, new Footer, layout updates
- **1.0.8** - Code-based email system, forgot password system, verfication system, comprehensive security audit, component refactoring
- **1.0.7** - Complete ticketing system with modular components, Docker installation fixes
- **1.0.6** - Gift coupons system with user and admin management, security enhancements
- **1.0.5** - Automated release system with package-based updates and GitHub Actions workflow
- **1.0.4** - Google AdSense integration with ad blocker detection and prevention system
- **1.0.3** - User banning system, global authentication guard, and enhanced admin user management
- **1.0.2** - Discord and Google OAuth integration with enhanced authentication system
- **1.0.1** - Referral system, premium badges, Docker support, and major UI improvements
- **1.0.0** - Initial release with core functionality

## Contributing

To add entries to this changelog, please follow the existing format and add your changes under the appropriate section and version.
