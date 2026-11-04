# PteroDash Installation & Management Guide

## ⚡ Install

To install PteroDash, run this command as `root` (or with `sudo`):

```bash
bash <(curl -s https://raw.githubusercontent.com/NightFury-Supreme/PetroDash/main/pterodash.sh)
```

Choose **Option `[1] Install PteroDash`** from the interactive menu.

---

## 💡 Life-Long Management (`pterodash` command)

To control and manage PteroDash anytime, run:

```bash
pterodash
```

Or if you are inside the project directory:
```bash
sudo ./pterodash.sh
```

---

## 📋 System Requirements

| Requirement | Minimum | Recommended |
| :--- | :--- | :--- |
| **Operating System** | Ubuntu 20.04 / 22.04 / 24.04 LTS, Debian 11 / 12, or WSL2 | Ubuntu 22.04 LTS |
| **CPU** | 1 vCPU / Core | 2+ vCPU Cores |
| **RAM** | 2 GB | 4 GB |
| **Disk Space** | 10 GB SSD | 20+ GB SSD |
| **Network** | Ports `80` (HTTP) and `443` (HTTPS) open | Domain with DNS `A` record pointing to server IP |

---

## 🛠️ Installer Step-by-Step Overview

When running Option `[1]`, the installer automatically guides you through 6 steps:

1. **Prerequisites & Environment Setup**:
   - Detects if Docker and Docker Compose are installed; automatically installs and enables them if missing.
2. **Domain & Pterodactyl Configuration**:
   - **Dashboard Domain**: Your public domain (e.g. `dashboard.yourdomain.com`) or local domain (e.g. `dashboard.local`).
   - **Pterodactyl Panel URL**: Your panel URL (e.g. `https://panel.yourdomain.com` or `http://localhost:8080`). Slashes and protocols are automatically formatted.
   - **Pterodactyl Application API Key**: Your Application API token starting with `ptla_`.
3. **Initial Administrator Account**:
   - Enter your Admin Email, Username, and secure password (password input is securely masked with `*`).
4. **SSL Certificate Setup**:
   - Select your desired SSL mode:
     - `[1] Let's Encrypt SSL`: Free, auto-renewing certificate (requires a public domain pointing to your server IP).
     - `[2] Self-Signed SSL`: Instant HTTPS certificate (ideal for local testing, WSL, or IP access).
     - `[3] None / HTTP only`: Standard port 80 HTTP (ideal for local development or external reverse proxies).
5. **Writing Environment & Launching Containers**:
   - Generates cryptographically secure 256-bit secrets for MongoDB and JWT.
   - Creates the production [`.env`](file:///var/www/pterodash/.env) file.
   - Builds and launches MongoDB, Redis, Backend API, and Next.js Frontend containers.
6. **Admin Provisioning & Host Nginx Setup**:
   - Automatically provisions your Administrator account with full admin privileges in the database.
   - Installs and configures host Nginx as a reverse proxy, linking port 80/443 to the Docker services.
   - Automatically opens firewall ports (UFW) if enabled.

---

## 🎛️ Management Suite

You can re-run `pterodash` (or `sudo ./pterodash.sh`) at any time to access the full suite of management tools:

```bash
pterodash
```

| Option | Action | Description |
| :--- | :--- | :--- |
| **`[1]`** | **Install PteroDash** | Full interactive installation from scratch. |
| **`[2]`** | **Update PteroDash** | Pulls latest release from GitHub, rebuilds containers, and prunes unused Docker images. |
| **`[3]`** | **Create or Reset Admin Account** | Prompts for email/username/password to instantly promote an existing user or create a new admin. |
| **`[4]`** | **Configure / Reconfigure Nginx & SSL** | Switch domains or change SSL modes (Let's Encrypt, Self-Signed, or HTTP only) with zero downtime. |
| **`[5]`** | **Service Management** | Start, stop, restart, view live container logs, or run health checks. |
| **`[6]`** | **Uninstall PteroDash** | Safely stops containers, deletes Docker volumes, and removes Nginx configurations. |

---

## 🔒 How to Add and Manage SSL

### Option A: Let's Encrypt SSL (Public Domain)

If your domain (e.g. `dashboard.example.com`) has a DNS `A` record pointing to your server's public IP:

1. In the installer, select **`[1] Let's Encrypt SSL`**.
2. Enter your email address for certificate renewal notices.
3. Certbot will obtain and configure the certificate automatically.

**Renewal**: Certbot installs a systemd timer that renews your certificate automatically. To test renewal manually:
```bash
sudo certbot renew --dry-run
```

---

### Option B: Self-Signed SSL (Local Testing / WSL / IP)

If you are running on a local testing environment, WSL, or an internal network:

1. In the installer, select **`[2] Self-Signed SSL`**.
2. The installer generates an RSA-2048 certificate at `/etc/ssl/pterodash/selfsigned.crt`.
3. When you open `https://your-domain` in your browser:
   - Click **Advanced**.
   - Click **Proceed to ... (unsafe)** to accept the local certificate.

---

### Option C: Reconfiguring SSL Anytime

To switch between HTTP and HTTPS or update your SSL certificate:
```bash
pterodash
# Select Option [4] Configure / Reconfigure Nginx & SSL
```

---

## 🌐 How to Edit Nginx Configuration

PteroDash manages its host reverse proxy configuration at:
`/etc/nginx/sites-available/pterodash.conf`

To open and edit the configuration:
```bash
sudo nano /etc/nginx/sites-available/pterodash.conf
```

### Key Settings to Customize:

1. **Change Domain Name (`server_name`)**:
   ```nginx
   server_name dashboard.yourdomain.com;
   ```

2. **Adjust File Upload Limits (`client_max_body_size`)**:
   Default is `10M` (allows uploads up to 10MB for avatars and egg icons). To allow larger files:
   ```nginx
   client_max_body_size 50M;
   ```

3. **Custom SSL Certificate Paths**:
   If you have custom SSL certificates from your registrar or Cloudflare:
   ```nginx
   ssl_certificate /path/to/fullchain.pem;
   ssl_certificate_key /path/to/privkey.pem;
   ```

4. **Test and Apply Configuration**:
   Always test your Nginx configuration syntax before reloading:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```
   *(On WSL: `sudo service nginx reload`)*

---

## 💻 Manual Container & Service Commands

All containers can also be managed directly using Docker Compose:

```bash
# View running containers and health status
sudo docker compose ps

# View live consolidated logs
sudo docker compose logs -f

# View logs for a specific service
sudo docker compose logs -f backend
sudo docker compose logs -f frontend

# Restart all containers
sudo docker compose restart

# Rebuild containers after code modifications
sudo docker compose up --build -d --force-recreate
```

---

## ❓ Troubleshooting & FAQ

### 1. `ERR_CONNECTION_REFUSED` when signing in
- **Cause**: Nginx is not running or the frontend is requesting `https` when Nginx is only listening on `http` (port 80).
- **Fix**: Run `pterodash` (or `sudo ./pterodash.sh`), select **`[4] Configure / Reconfigure Nginx & SSL`**, and match your SSL setting with your domain.

### 2. Pterodactyl Panel Connection Errors
- Ensure your Pterodactyl Panel URL in `.env` includes the protocol (`http://` or `https://`).
- Verify that your API key is an **Application API Key** created under Pterodactyl Admin (`/admin/api`), not an Account API key.

### 3. Check Service Health
```bash
curl -I http://127.0.0.1:4000/api/health
curl -I http://127.0.0.1:3000/
```
Both endpoints should return `HTTP 200 OK`.
