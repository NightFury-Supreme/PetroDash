# Changelog

All notable changes to PteroDash will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Future features and improvements will be listed here

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

