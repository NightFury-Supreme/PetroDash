# PteroDash - Premium Control Panel

A modern, feature-rich control panel for Pterodactyl servers with advanced user management, plan-based access control, integrated payment systems, resources shop, comprehensive advertising monetization and more.

![PteroDash Logo](images/logo.svg)

# 🌟 All Features

* **Resource Management** – Create servers, manage CPU, RAM, Disk, and allocations
* **Servers** – Create, view, and edit servers with ease
* **User System** – Authentication, password reset, OAuth login, and permissions
* **Email Verification** – Secure email verification system
* **Password Reset** – forgot password functionality with email codes
* **Email Notifications** – Comprehensive email system for account events, security alerts, and notifications
* **Support Tickets** – Complete ticketing system with categories, priority assignment, and admin management
* **Coupons** – Discount codes for plans and promotions
* **Store** – Buy resources and plans using coins
* **Dashboard** – View resources, plans, and live server status
* **Plans** – Lifetime plan support
* **Payment Integration** – PayPal with automatic webhook handling
* **Advertising System** – Google AdSense integration with ad blocker detection
* **Admin Tools** – User banning, egg and location management, analytics, and shop control
* **Security** – JWT auth, OAuth, rate limiting, audit logs, validation, and enhanced security measures
* **UI/UX** – Modern Tailwind CSS dashboard with smooth client-side navigation
* **System Updates**: One-click updates with GitHub integration
* **Gift Coupons** – Share coins and rewards with redeemable codes

![Dashboard Screenshot](images/dashboard.png)
## 🚀 Setup & Deployment

Quick links:
- [Docker installation (recommended)](INSTALL.md)
- [Manual installation (not recommended)](INSTALL.md)

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```env
# Server Configuration
PORT=4000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Pterodactyl Panel
PTERO_BASE_URL=http://your-panel-ip
PTERO_APP_API_KEY=your-pterodactyl-api-key

# Frontend URL (for CORS)
FRONTEND_URL=https://your-dashboard-domain.com
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE=https://your-api-domain.com
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
4. Configure reverse proxy (Nginx/Apache)
5. Set up PM2 or similar process manager

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

#### Quick Setup (Recommended)
```bash
# Clone the repository
git clone https://github.com/NightFury-Supreme/PetroDash.git
cd PetroDash

# Run the setup script
./setup-dev.sh
```

#### Manual Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/PetroDash.git`
3. Install dependencies:
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd ../frontend && npm install
   ```
4. Configure git hooks: `git config core.hooksPath .githooks`
5. Copy environment files and configure:
   ```bash
   cp backend/env.example backend/.env
   cp frontend/env.example frontend/.env.local
   ```
6. Set up your MongoDB database
7. Start development servers:
   ```bash
   # Backend (in backend directory)
   npm run dev
   
   # Frontend (in frontend directory) 
   npm run dev
   ```

### Development Commands

#### Backend
- `npm run dev` - Start development server with hot reload
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm test` - Run tests

#### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically  
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

### Code Quality

This project uses:
- **ESLint** for code linting with security rules
- **Prettier** for consistent code formatting
- **Pre-commit hooks** for automated quality checks
- **TypeScript** for type safety (frontend)
- **Security scanning** in CI/CD pipeline

Make sure to run `npm run lint` and `npm run format` before committing changes.

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
- **Email**: support@auto-manager.tk

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

---

**Made with ❤️ by the PteroDash Team**

*Star this repository if you find it helpful!*
