# PteroDash Installation Guide

This guide will help you install and set up PteroDash using Docker for production use.

## 📋 Prerequisites

Before installing PteroDash, ensure you have the following installed on your system:

- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)
- **Git** (for cloning the repository)
- **At least 2GB RAM** and **10GB free disk space**

### Installing Prerequisites

#### Ubuntu/Debian
```bash
# Update package list
sudo apt update

# Install Docker
sudo apt install docker.io docker-compose git -y

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (optional, for running without sudo)
sudo usermod -aG docker $USER
# Log out and back in for group changes to take effect
```

#### CentOS/RHEL/Fedora
```bash
# Install Docker
sudo dnf install docker docker-compose git -y
# OR for older versions: sudo yum install docker docker-compose git -y

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group
sudo usermod -aG docker $USER
```

#### Windows
1. Download and install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
2. Download and install [Git for Windows](https://git-scm.com/download/win)
3. Restart your computer after installation

#### macOS
1. Download and install [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)
2. Install Git using Homebrew: `brew install git`

## 🚀 Installation

### Step 1: Clone the Repository
```bash
git clone https://github.com/NightFury-Supreme/PetroDash.git
cd PetroDash
```

### Step 2: Make Script Executable (Linux/macOS only)
```bash
chmod +x docker-scripts.sh
```

**Note**: Windows users can use `docker-scripts.bat` instead of `docker-scripts.sh`

### Step 3: Configure Environment
```bash
# Copy environment template
cp docker-compose.env .env

# Edit the environment file
nano .env
```

### Step 4: Update Configuration
Edit the `.env` file with your production values:

```env
# MongoDB Configuration
MONGO_INITDB_ROOT_USERNAME=your_admin_username
MONGO_INITDB_ROOT_PASSWORD=your_secure_password_here
MONGO_INITDB_DATABASE=pterodash

# JWT Secret (Generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Pterodactyl Panel Configuration
PTERO_BASE_URL=http://your-pterodactyl-panel:8080
PTERO_APP_API_KEY=your-pterodactyl-api-key

# Frontend URL
FRONTEND_URL=http://your-domain.com

# Backend Configuration
NODE_ENV=production
PORT=4000
```

### Step 5: Start PteroDash
```bash
./docker-scripts.sh start
```

### Step 6: Access PteroDash
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000


## 🎯 First-Time Setup

### 1. Access the Dashboard
- Open your browser and go to http://localhost:3000
- You should see the PteroDash login page

### 2. Create Admin Account
- Click "Register" or "Sign Up"
- Create your first admin account

See also: [Promote a user to admin](#promote-a-user-to-admin)

## 🛠️ Management Commands

### Using the Management Script

#### Linux/macOS
```bash
# Start development environment
./docker-scripts.sh dev

# Start production environment
./docker-scripts.sh start

# Stop all services
./docker-scripts.sh stop

# Restart services
./docker-scripts.sh restart

# View logs
./docker-scripts.sh logs

# Check status
./docker-scripts.sh status

# Clean up everything
./docker-scripts.sh clean

# Show help
./docker-scripts.sh help
```

#### Windows
```cmd
# Start development environment
docker-scripts.bat dev

# Start production environment
docker-scripts.bat start

# Stop all services
docker-scripts.bat stop

# Restart services
docker-scripts.bat restart

# View logs
docker-scripts.bat logs

# Check status
docker-scripts.bat status

# Clean up everything
docker-scripts.bat clean

# Show help
docker-scripts.bat help
```

### Manual Docker Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild services
docker-compose up -d --build
```

## 🔍 Verification

### Check if Services are Running
```bash
# Using management script (Linux/macOS)
./docker-scripts.sh status

# Using management script (Windows)
docker-scripts.bat status

# Manual check
docker-compose ps
```

### Test Endpoints
```bash
# Test backend health
curl http://localhost:4000/health

# Test frontend
curl http://localhost:3000
```

### Check Logs
```bash
# All services
./docker-scripts.sh logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the ports
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :4000
sudo netstat -tulpn | grep :27017

# Kill processes using the ports
sudo kill -9 <PID>
```

#### 2. Permission Denied
```bash
# Fix script permissions
chmod +x docker-scripts.sh

# Fix Docker permissions (Linux)
sudo chown -R $USER:$USER .
sudo chmod -R 755 .
```

#### 3. Docker Not Running
```bash
# Start Docker service
sudo systemctl start docker

# Check Docker status
sudo systemctl status docker
```

#### 4. Build Failures
```bash
# Clean everything and rebuild
./docker-scripts.sh clean
docker system prune -f
./docker-scripts.sh dev
```

#### 5. MongoDB Connection Issues
```bash
# Check MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb

# Reset MongoDB data (WARNING: This will delete all data)
docker-compose down -v
docker volume rm pterodash_mongodb_data
./docker-scripts.sh start
```

#### 6. Frontend Not Loading
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up -d --build frontend
```

#### 7. Backend API Errors
```bash
# Check backend logs
docker-compose logs backend

# Test backend health
curl http://localhost:4000/health

# Restart backend
docker-compose restart backend
```

### Getting Help

If you encounter issues not covered in this guide:

1. **Check the logs**: `./docker-scripts.sh logs`
2. **Verify Docker is running**: `docker --version`
3. **Check system resources**: `docker system df`
4. **Review the documentation**: See `DOCKER.md` for detailed Docker information
5. **Create an issue**: [GitHub Issues](https://github.com/NightFury-Supreme/PetroDash/issues)

## 🔄 Updates

### Updating PteroDash
```bash
# Stop services
./docker-scripts.sh stop

# Pull latest changes
git pull origin main

# Rebuild and start
./docker-scripts.sh start
```

### Backup and Restore

#### Backup
```bash
# Backup MongoDB data
docker-compose exec mongodb mongodump --out /data/backup

# Copy backup from container
docker cp pterodash-mongodb:/data/backup ./mongodb-backup
```

#### Restore
```bash
# Copy backup to container
docker cp ./mongodb-backup pterodash-mongodb:/data/

# Restore data
docker-compose exec mongodb mongorestore /data/mongodb-backup
```

## 🔒 Security Considerations

### Production Security Checklist

- [ ] Change default MongoDB passwords
- [ ] Use strong JWT secrets
- [ ] Configure firewall rules
- [ ] Use HTTPS with SSL certificates
- [ ] Regularly update Docker images
- [ ] Monitor logs for suspicious activity
- [ ] Backup data regularly
- [ ] Use environment variables for secrets
- [ ] Enable Docker security features

### SSL/HTTPS Setup

For production deployments, consider using a reverse proxy like Nginx with SSL certificates:

```bash
# Install Certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## 📊 Monitoring

### Health Checks
- Backend: http://localhost:4000/health
- Frontend: http://localhost:3000
- MongoDB: Built-in health checks

### Resource Monitoring
```bash
# Check container resource usage
docker stats

# Check disk usage
docker system df

# Check logs size
docker system events
```

## 🎉 Success!

If everything is working correctly, you should see:

- ✅ PteroDash frontend accessible at http://localhost:3000
- ✅ Backend API responding at http://localhost:4000
- ✅ MongoDB running and accessible
- ✅ All services showing as healthy in `docker-compose ps`

You're now ready to start using PteroDash! 🚀

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PteroDash GitHub Repository](https://github.com/NightFury-Supreme/PetroDash)


## ⚠️ Alternative: Manual installation (without Docker)

Not recommended for production. Use only if you cannot use Docker.

### Prerequisites

- Node.js 18.x (LTS) and npm
- MongoDB 6.x running locally or accessible remotely
- Git

Ensure MongoDB is running and you have a database and credentials ready.

### 1) Clone repository
```bash
git clone https://github.com/NightFury-Supreme/PetroDash.git
cd PetroDash
```

### 2) Backend setup
```bash
cd backend

# Create environment file
cp env.example .env 

# Install dependencies
npm install

# Run in development (auto-reload if nodemon configured)
npm run dev
# Or run in production
# npm run start
```

Windows (PowerShell):
```powershell
cd backend
Copy-Item env.example .env -ErrorAction SilentlyContinue
npm install
npm start
```

Backend will listen on http://localhost:4000 by default.

### 3) Frontend setup
Open a new terminal:
```bash
cd frontend

# Create environment file
cp .env.example .env.local 2>/dev/null || true

# If .env.example is missing, create .env.local with at least:
# NEXT_PUBLIC_API_BASE=http://localhost:4000

# Install dependencies (dev deps required to build Next.js)
npm install

# Development
npm run dev

# Production
npm run build
npm start
```

Windows (PowerShell):
```powershell
cd frontend
Copy-Item .env.example .env.local -ErrorAction SilentlyContinue
npm install
npm run build
npm start
```

Frontend will listen on http://localhost:3000 by default.

### 4) Reverse proxy and SSL (optional but recommended)
- Use Nginx/Apache/Caddy to proxy 80/443 to frontend 3000
- Set `NEXT_PUBLIC_API_BASE` to your public backend URL

### 5) Running as a service (production)

See also: [Promote a user to admin](#promote-a-user-to-admin)

Use a process manager like PM2 or systemd to keep apps running:
```bash
# Install PM2 globally
npm install -g pm2

# Backend
cd backend
pm2 start npm --name pterodash-backend -- start

# Frontend
cd ../frontend
pm2 start npm --name pterodash-frontend -- start

# Save and enable startup
pm2 save
pm2 startup
```

### Common pitfalls (manual install)
- Ensure `NEXT_PUBLIC_API_BASE` is reachable from the browser
- CORS must be configured on the backend if you serve frontend from a different domain
- Use strong secrets in `.env` files; never commit them
- Keep Node.js version consistent (use nvm on Linux/macOS)

- If needed later, see [Promote a user to admin](#promote-a-user-to-admin)

## Promote a user to admin
If your first user is not admin or you need to grant admin later, run from `backend/`:

```bash
# By email (using npm script)
ADMIN_EMAIL=user@example.com npm run create-admin

# By username (using npm script)
ADMIN_USERNAME=username npm run create-admin

# Optional: update password at the same time
ADMIN_EMAIL=user@example.com ADMIN_PASSWORD="NewStrongPass" npm run create-admin

# Direct invocation (equivalent)
node scripts/createAdmin.js
```

Windows (PowerShell):
```powershell
$env:ADMIN_EMAIL="user@example.com"; $env:ADMIN_PASSWORD="NewStrongPass"; node scripts/createAdmin.js
```

Notes:
- If the user is not found, the script exits with an error (no creation).
- Password is only updated when `ADMIN_PASSWORD` is provided.