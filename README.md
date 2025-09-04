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

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 5+
- Pterodactyl Panel 1.x

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/pterodash.git
cd pterodash
```

2. **Backend Setup**
```bash
cd backend
npm install
cp /backend/env.example .env
# Edit .env with your configuration
npm start
```

3. **Frontend Setup**
```bash
cd frontend-v2
npm install
cp /frontend/env.example .env.local
# Edit .env.local with your API URL
npm run dev
```

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
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth, validation, etc.
│   │   ├── services/       # Pterodactyl, PayPal integration
│   │   └── lib/           # Utilities and helpers
│   └── package.json
├── frontend-v2/            # Next.js 15 frontend
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   └── types/         # TypeScript definitions
│   └── package.json
└── README.md
```



## 🎯 Key Features Explained

### Plan-Based Access Control
Users can only access certain eggs and locations based on their active plans. This creates a tiered system where premium users get access to better resources.

### Premium Badge System
Users with active plans automatically receive a golden "PREMIUM" badge in the sidebar, providing visual recognition of their status.

### Integrated Payment Processing
Full PayPal integration with webhook support, automatic plan activation, and resource allocation upon successful payment.

### Real-time Server Monitoring
Live updates of server status, resource usage, and performance metrics directly from the Pterodactyl panel.

## 🚀 Deployment

### Production Build
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run build
npm start
```

### Docker (Coming Soon)
```bash
docker-compose up -d
```

### Environment Setup
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

- **Documentation**: [Wiki](/NightFury-Supreme/PetroDash/wiki)
- **Issues**: [GitHub Issues](/NightFury-Supreme/PetroDash/issues)
- **Email**: support@auto-manager.tk

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

---

**Made with ❤️ by the PteroDash Team**

*Star this repository if you find it helpful!*
