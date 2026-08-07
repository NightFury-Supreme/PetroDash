# PteroDash - Premium Control Panel

[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/13986/badge)](https://www.bestpractices.dev/projects/13986)

A modern, feature-rich control panel for Pterodactyl servers with advanced user management, plan-based access control, integrated payment systems, resources shop, comprehensive advertising monetization and more.

![PteroDash Logo](images/logo.svg)

# 🌟 All Features

* **Resource Management** – Create servers, manage CPU, RAM, Disk, and allocations
* **Servers** – Create, view, and edit servers with ease
* **User System** – Authentication, password reset, OAuth login (Discord & Google), and permissions
* **Email Verification** – Configurable email verification (can be enabled/disabled by admin)
* **Password Reset** – Forgot password functionality with email codes
* **Email Notifications** – Comprehensive email system for account events, security alerts, and notifications
* **Coin Earning System** – Users can earn coins via Ads (Ayet Studios) and Linkvertise integrations
* **Support Tickets** – Complete ticketing system with categories, priority assignment, and admin management
* **Coupons** – Discount codes for plans and promotions
* **Gift Codes** – Share coins and rewards with redeemable codes
* **Store** – Buy resources and plans using coins
* **Dashboard** – View resources, plans, and live server status
* **Plans** – Monthly and lifetime plan support with automatic resource grants
* **Payment Integration** – PayPal with automatic webhook handling
* **Advertising System** – Google AdSense integration with ad blocker detection
* **Admin Tools** – User banning, egg and location management, analytics, paginated admin lists
* **Security** – JWT auth, OAuth, CSRF protection, rate limiting, audit logs, magic-byte upload validation
* **UI/UX** – Modern Tailwind CSS dashboard with smooth client-side navigation
* **System Updates** – One-click updates with GitHub integration

![Dashboard Screenshot](images/dashboard.png)
## 🚀 Setup & Deployment

Quick links:
- [Docker installation (recommended)](INSTALL.md)
- [Manual installation (not recommended)](INSTALL.md)

## ⚙️ Configuration

### Environment Variables

#### Backend (`backend/.env`)
```env
PORT=4000
MONGODB_URI=mongodb://username:password@host:port/database
JWT_SECRET=your_jwt_secret_here
PTERO_BASE_URL=http://localhost
PTERO_APP_API_KEY=ptla_your_pterodactyl_api_key_here
FRONTEND_URL=http://localhost:3000
REDIS_URL=redis://default:password@host:port
```

#### Frontend (`frontend/.env`)
```env
NEXT_PUBLIC_API_BASE=http://localhost:4000
ALLOWED_DEV_ORIGINS=localhost:3000
```

## 🏗️ Project Structure

```
pterodash/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── models/         # Mongoose models (Settings, Users, etc.)
│   │   ├── routes/         # API endpoints (ads, admin, auth, etc.)
│   │   ├── middleware/     # Auth, validation, rate limiting
│   │   ├── services/       # Pterodactyl, PayPal integration
│   │   └── lib/           # Utilities and helpers
│   └── package.json
├── frontend/               # Next.js 15 frontend
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   │   └── admin/      # Admin components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── styles/        # CSS files (adblocker-modal.css)
│   │   └── types/         # TypeScript definitions
│   └── package.json
└── README.md
```

### Environment Setup (Production)
1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set up SSL certificates
4. Configure reverse proxy (Nginx/Apache). *Note: Nginx is not bundled with this project to avoid port conflicts with existing panels like Pterodactyl. You must configure your own web server.*
5. Remove `docker-compose.override.yml` if it exists, as it is only for local development and breaks production builds.
6. Build and start using: `docker compose up --build -d --force-recreate`

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Pterodactyl Panel** - For the excellent server management platform
- **Next.js** - For the amazing React framework
- **Tailwind CSS** - For the beautiful utility-first CSS framework
- **MongoDB** - For the flexible NoSQL database

## 📞 Support

- **Discord**: https://discord.gg/vQzbuQD7Xp
- **Documentation**: [Wiki](https://github.com/NightFury-Supreme/PetroDash/wiki)
- **Issues**: [GitHub Issues](https://github.com/NightFury-Supreme/PetroDash/issues)

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

---

**Made with ❤️ by the PteroDash Team**

*Star this repository if you find it helpful!*
