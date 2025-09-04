# 🪶 PteroDash

> **Premium Control Panel for Pterodactyl Servers**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5+-green.svg)](https://www.mongodb.com/)

A modern, feature-rich control panel that extends Pterodactyl with advanced user management, plan-based access control, and integrated payment systems.

## ✨ Key Features

- 🚀 **Server Management** - Create, edit, and manage Pterodactyl servers
- 👥 **User Management** - Advanced roles, permissions, and premium badges
- 💳 **Payment Integration** - PayPal processing with automatic plan activation
- 🎯 **Plan System** - Subscription-based access control for eggs and locations
- 🔒 **Security** - JWT authentication, rate limiting, and audit logging
- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/pterodash.git
cd pterodash

# Backend setup
cd backend && npm install
cp .env.example .env
# Edit .env with your configuration
npm start

# Frontend setup (in another terminal)
cd frontend-v2 && npm install
cp .env.local.example .env.local
npm run dev
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Authentication**: JWT, bcrypt
- **Payments**: PayPal API
- **Integration**: Pterodactyl Panel API
- **Validation**: Zod schemas
- **Security**: Helmet, CORS, rate limiting

## 📚 Documentation

- [📖 Full Documentation](https://github.com/yourusername/pterodash/wiki)
- [🚀 Quick Start Guide](https://github.com/yourusername/pterodash#quick-start)
- [🔌 API Reference](https://github.com/yourusername/pterodash#api-endpoints)
- [🤝 Contributing Guide](https://github.com/yourusername/pterodash/blob/main/CONTRIBUTING.md)

## 🌟 What Makes PteroDash Special?

- **Plan-Based Access**: Users can only access resources based on their subscription tier
- **Premium Recognition**: Automatic golden badges for premium users
- **Real-time Monitoring**: Live server status and resource usage
- **Custom Branding**: Configurable dashboard name and logo
- **Integrated Payments**: Seamless PayPal integration with webhooks
- **Audit Trail**: Comprehensive logging of all user actions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](https://github.com/yourusername/pterodash/blob/main/CONTRIBUTING.md) for details.

### Areas for Contribution
- 🐛 Bug fixes
- ✨ New features
- 📚 Documentation improvements
- 🧪 Testing and coverage
- 🎨 UI/UX enhancements

## 📞 Support & Community

- **Issues**: [GitHub Issues](https://github.com/yourusername/pterodash/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/pterodash/discussions)
- **Discord**: [Join our community](https://discord.gg/your-invite)
- **Email**: support@yourdomain.com

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/yourusername/pterodash?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/pterodash?style=social)
![GitHub issues](https://img.shields.io/github/issues/yourusername/pterodash)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/pterodash)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/yourusername/pterodash/blob/main/LICENSE) file for details.

---

**Made with ❤️ by the PteroDash Team**

*Star this repository if you find it helpful! ⭐*
