# PteroDash - Premium Control Panel

A modern, feature-rich control panel for Pterodactyl servers with advanced user management, plan-based access control, and integrated payment systems.

![PteroDash Logo](frontend/public/logo.svg)

## ✨ Features

### 🚀 **Core Functionality**
- **Server Management**: Create, edit, and manage Pterodactyl servers
- **User Management**: Advanced user roles and permissions
- **Plan System**: Subscription-based access control with lifetime plans
- **Resource Management**: CPU, RAM, Disk, and allocation limits
- **Payment Integration**: PayPal payment processing with webhooks

### 🎨 **User Experience**
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Real-time Updates**: Live server status and resource monitoring
- **Custom Branding**: Configurable dashboard name and logo
- **Client-side Navigation**: Smooth, fast page transitions

### 🔒 **Security & Performance**
- **JWT Authentication**: Secure user authentication
- **Rate Limiting**: Protection against abuse
- **Audit Logging**: Comprehensive action tracking
- **Input Validation**: Zod schema validation
- **CORS Protection**: Secure cross-origin requests

### 🛠 **Admin Features**
- **Egg Management**: Plan-based egg access control
- **Location Management**: Geographic server distribution
- **User Analytics**: Detailed user statistics and monitoring
- **Shop Management**: Resource and plan sales
- **Coupon System**: Discount codes and promotions

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
- **Auto-Configuration**: MongoDB initialization with default admin user
- **Health Checks**: Automatic service health monitoring
- **Nginx Reverse Proxy**: Production-ready load balancing and SSL termination
- **Volume Persistence**: Data survives container restarts
- **Development Mode**: Hot reload for development with `docker-compose.override.yml`

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
- **Admin Login**: configurable; see Admin user management below

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

### Custom Domains / URLs (Production)

Set these values to use your own domains instead of localhost:

- **Backend** (`backend/.env` or Docker `.env`)
  - `FRONTEND_URL=https://dashboard.yourdomain.com`
  - `PTERO_BASE_URL=https://panel.yourdomain.com`

- **Frontend** (`frontend/.env.local`)
  - `NEXT_PUBLIC_API_BASE=https://api.yourdomain.com`

- **Docker** (`.env` at project root; used by docker-compose)
  - `NEXT_PUBLIC_API_BASE=https://api.yourdomain.com`
  - `FRONTEND_URL=https://dashboard.yourdomain.com`

## 🏗️ Project Structure

```
pterodash/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth, validation, etc.
│   │   ├── services/       # Pterodactyl, PayPal integration
│   │   └── lib/           # Utilities and helpers
│   └── package.json
├── frontend/               # Next.js 15 frontend
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
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

- **Documentation**: [Wiki](https://github.com/NightFury-Supreme/PetroDash/wiki)
- **Issues**: [GitHub Issues](https://github.com/NightFury-Supreme/PetroDash/issues)
- **Email**: support@auto-manager.tk

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

---

**Made with ❤️ by the PteroDash Team**

*Star this repository if you find it helpful!*

---

## Admin user management

Create or promote an admin by email or username:

```bash
cd backend
# Option 1: Non-interactive (CI/CD safe)
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD="StrongPass123" npm run create-admin

# Option 2: Identify by username instead
ADMIN_USERNAME=admin ADMIN_PASSWORD="StrongPass123" npm run create-admin
```

Notes:
- If the user does not exist, it will be created and promoted to admin.
- If `ADMIN_PASSWORD` is provided, the password will be set/updated.
- The Docker Mongo init no longer creates a default admin by itself.