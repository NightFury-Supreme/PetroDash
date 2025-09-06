# PteroDash - Premium Control Panel

A modern, feature-rich control panel for Pterodactyl servers with advanced user management, plan-based access control, integrated payment systems, and comprehensive advertising monetization.

![PteroDash Logo](images/logo.svg)

## ✨ Features

### 🚀 **Core Functionality**
- **Server Management**: Create, edit, and manage Pterodactyl servers
- **User Management**: Advanced user roles and permissions with banning system
- **Plan System**: Subscription-based access control with lifetime plans
- **Resource Management**: CPU, RAM, Disk, and allocation limits
- **Payment Integration**: PayPal payment processing with webhooks
- **Advertising System**: Google AdSense integration with ad blocker detection

![Dashboard Screenshot](images/dashboard.png)

### 💰 **Monetization & Advertising**
- **Google AdSense Integration**: Complete advertising system with admin configuration
  - Publisher ID and Ad Slot management
  - Multiple ad types (Display, Text, Link, In-Feed, In-Article, Matched Content)
  - Global ad placement (Header, Sidebar, Footer, Content, Mobile)
  - Real-time ad blocker detection and prevention
  - Unbypassable ad blocker modal with security measures
  - Lazy loading support for optimal performance
  - Responsive design for desktop and mobile devices

### 🛡️ **Advanced Security & Moderation**
- **User Banning System**: Comprehensive user management and moderation tools
  - Admin ability to ban users with custom reasons and duration
  - Temporary or permanent ban options
  - Automatic server unsuspension when users are unbanned
  - Full-screen ban notice page with clean URL structure
  - Self-healing ban state detection
- **Ad Blocker Detection**: Advanced anti-ad-blocker system
  - Real-time script loading detection (catches ERR_BLOCKED_BY_CLIENT errors)
  - Multiple detection methods for comprehensive coverage
  - Secure modal that prevents bypassing (disables dev tools, right-click, keyboard shortcuts)
  - No persistent tracking or cookies for privacy compliance
  - Automatic modal dismissal after successful ad load

### 🎨 **User Experience**
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Real-time Updates**: Live server status and resource monitoring
- **Custom Branding**: Configurable dashboard name and logo
- **Client-side Navigation**: Smooth, fast page transitions
- **Clean Ad Display**: Direct ad rendering without placeholder content

### 🔒 **Security & Performance**
- **JWT Authentication**: Secure user authentication
- **OAuth Integration**: Discord and Google login support
- **Email Login**: Email authentication
- **Rate Limiting**: Protection against abuse
- **Audit Logging**: Comprehensive action tracking
- **Input Validation**: Zod schema validation
- **CORS Protection**: Secure cross-origin requests
- **Global Authentication Guard**: Enhanced security with automatic redirects

### 🛠 **Admin Features**
- **Egg Management**: Plan-based egg access control
- **Location Management**: Geographic server distribution
- **User Analytics**: Detailed user statistics and monitoring
- **Shop Management**: Resource and plan sales
- **Coupon System**: Discount codes and promotions
- **AdSense Configuration**: Complete advertising settings management
- **User Banning**: Advanced moderation tools with visual indicators

## 🚀 Setup & Deployment

### Prerequisites
- Node.js 18+ 
- MongoDB 5+
- Pterodactyl Panel 1.x

### Method A — Local (Node.js)

1. **Clone the repository**
```bash
git clone https://github.com/NightFury-Supreme/PetroDash.git
cd pterodash
```

2. **Backend Setup**
```bash
cd backend
npm install
cp ../env.example .env
# Edit .env with your configuration
npm start
```

3. **Frontend Setup (Dev)**
```bash
cd frontend
npm install
cp ../env.example .env.local
# Edit .env.local with your API URL
npm run dev
```

4. **Frontend + Backend (Production, Local)**
```bash
# Backend (already started above)
# Or run in production environment:
cd backend
NODE_ENV=production npm start

# Frontend
cd ../frontend
npm run build
npm start
```

### Method B — Docker (Single Command Deployment)
```bash
# Linux/macOS
chmod +x docker-scripts.sh
./docker-scripts.sh start

# Windows
docker-scripts.bat start

# Or manually
docker-compose up -d --build
```

#### Docker Features:
- **Single Command Setup**: Complete PteroDash deployment in one command
- **Auto-Configuration**: MongoDB initialization with default settings
- **Health Checks**: Automatic service health monitoring
- **Nginx Reverse Proxy**: Production-ready load balancing and SSL termination
- **Volume Persistence**: Data survives container restarts
- **Development Mode**: Hot reload for development with `docker-compose.override.yml`

> Note: Docker no longer creates a default admin automatically. Use the admin promotion script below.

#### Docker Commands:
```bash
# Start PteroDash
./docker-scripts.sh start

# View logs
./docker-scripts.sh logs

# Check status
./docker-scripts.sh status

# Stop PteroDash
./docker-scripts.sh stop

# Update services
./docker-scripts.sh update

# Clean everything
./docker-scripts.sh clean
```

#### Default Access:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000

## 🔐 Admin user management

Promote an existing user to admin. Script location: `backend/scripts/createAdmin.js`. Run from `backend/`:

```bash
# By email (using npm script)
ADMIN_EMAIL=user@example.com npm run create-admin

# By username (using npm script)
ADMIN_USERNAME=username npm run create-admin

# Optional: update password at the same time
ADMIN_EMAIL=user@example.com ADMIN_PASSWORD="NewStrongPass" npm run create-admin

# Direct invocation (equivalent)
node scripts/createAdmin.js
# With variables (Windows PowerShell example)
$env:ADMIN_EMAIL="user@example.com"; $env:ADMIN_PASSWORD="NewStrongPass"; node scripts/createAdmin.js
```

Notes:
- If the user is not found, the script exits with an error (no creation).
- Password is only updated when `ADMIN_PASSWORD` is provided.

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
- **Email**: support@auto-manager.tk

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

---

**Made with ❤️ by the PteroDash Team**

*Star this repository if you find it helpful!*
