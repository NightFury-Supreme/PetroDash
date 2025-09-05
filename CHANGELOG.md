# Changelog

All notable changes to PteroDash will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Future features and improvements will be listed here

## [1.0.2] - 2025-09-05

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

## [1.0.1] - 2025-09-05

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

## [1.0.0] - 2025-09-04

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

- **1.0.1** - Referral system, premium badges, Docker support, and major UI improvements
- **1.0.0** - Initial release with core functionality

## Contributing

To add entries to this changelog, please follow the existing format and add your changes under the appropriate section and version.

