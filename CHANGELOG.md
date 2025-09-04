# Changelog

All notable changes to PteroDash will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Premium badge system for users with active plans
- Custom branding endpoint (`/api/branding`)
- Beautiful gradient feather logo design
- Plan-based access control for eggs and locations
- PayPal payment integration with webhooks
- Comprehensive audit logging system
- Rate limiting and security middleware
- Real-time server monitoring
- Advanced user management features

### Changed
- Updated API endpoint from `/api/settings` to `/api/branding`
- Improved badge styling consistency
- Enhanced sidebar with premium user recognition
- Optimized plan checking and user status updates

### Fixed
- Audit log validation errors
- Server edit form validation issues
- Plan purchase billing cycle validation
- Resource allocation calculation errors
- Pterodactyl panel integration issues

## [1.0.0] - 2024-01-XX

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

- **1.0.0** - Initial release with core functionality
- **Unreleased** - Current development version with premium features

## Contributing

To add entries to this changelog, please follow the existing format and add your changes under the appropriate section and version.

