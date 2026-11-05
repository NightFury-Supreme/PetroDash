#!/usr/bin/env bash

# ==============================================================================
# PteroDash Interactive Installation & Management Suite
# ==============================================================================

set -e

REPO_URL="https://github.com/NightFury-Supreme/PetroDash.git"
DEFAULT_INSTALL_DIR="/var/www/pterodash"

if [ -f "docker-compose.yml" ] && [ -f "pterodash.sh" ]; then
    INSTALL_DIR="$(pwd)"
elif [ -n "${BASH_SOURCE[0]}" ] && [ -f "${BASH_SOURCE[0]}" ] && [ -f "$(dirname "${BASH_SOURCE[0]}")/docker-compose.yml" ]; then
    INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
elif [ -d "$DEFAULT_INSTALL_DIR" ] && [ -f "$DEFAULT_INSTALL_DIR/docker-compose.yml" ]; then
    INSTALL_DIR="$DEFAULT_INSTALL_DIR"
else
    INSTALL_DIR="$DEFAULT_INSTALL_DIR"
fi

cd "$INSTALL_DIR" 2>/dev/null || true

ensure_installation_directory() {
    if [ ! -f "$INSTALL_DIR/docker-compose.yml" ]; then
        echo -e "${YELLOW}[INFO] PteroDash project files not found in $(pwd).${NC}"
        echo -e "${CYAN}[INFO] Cloning PteroDash repository to ${INSTALL_DIR}...${NC}"

        if ! command -v git &>/dev/null; then
            echo -e "${YELLOW}[INFO] Installing git...${NC}"
            apt-get update && apt-get install -y git 2>/dev/null || yum install -y git 2>/dev/null || true
        fi

        mkdir -p "$(dirname "$INSTALL_DIR")"
        git clone --depth=1 "$REPO_URL" "$INSTALL_DIR"
        cd "$INSTALL_DIR"
    else
        cd "$INSTALL_DIR"
    fi

    if [ -f "$INSTALL_DIR/pterodash.sh" ] && [ ! -L "/usr/local/bin/pterodash" ]; then
        chmod +x "$INSTALL_DIR/pterodash.sh"
        ln -sf "$INSTALL_DIR/pterodash.sh" /usr/local/bin/pterodash 2>/dev/null || true
    fi
}

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

COMPOSE_CMD=""
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
fi

print_banner() {
    clear 2>/dev/null || true
    echo -e "${CYAN}${BOLD}"
    cat << "EOF"
==================================================================
   ____  _                  ____            _     
  |  _ \| |_ ___ _ __ ___  |  _ \  __ _ ___| |__  
  | |_) | __/ _ \ '__/ _ \ | | | |/ _` / __| '_ \ 
  |  __/| ||  __/ | | (_) || |_| | (_| \__ \ | | |
  |_|    \__\___|_|  \___/ |____/ \__,_|___/_| |_|
==================================================================
EOF
    echo -e "            ${GREEN}PteroDash Installation & Management Suite${CYAN}"
    echo -e "==================================================================${NC}\n"
}

read_masked_password() {
    local prompt="$1"
    local password=""
    local char=""
    while [ -z "$password" ]; do
        password=""
        printf "%b" "$prompt"
        while IFS= read -r -s -n 1 char; do
            if [[ -z "$char" || "$char" == $'\n' || "$char" == $'\r' ]]; then
                break
            elif [[ "$char" == $'\177' || "$char" == $'\b' ]]; then
                if [ ${#password} -gt 0 ]; then
                    password="${password%?}"
                    printf "\b \b"
                fi
            else
                password+="$char"
                printf "*"
            fi
        done
        echo ""
        if [ -z "$password" ]; then
            echo -e "${RED}[ERROR] Password cannot be empty. Please enter a password.${NC}"
        fi
    done
    ADMIN_PASSWORD="$password"
}

check_root() {
    if [ "$(id -u)" -ne 0 ]; then
        echo -e "${RED}[ERROR] This script must be run as root (use sudo).${NC}"
        exit 1
    fi
}

install_docker_if_missing() {
    if ! command -v docker &>/dev/null; then
        echo -e "${YELLOW}[INFO] Installing Docker...${NC}"
        apt-get update && apt-get install -y docker.io 2>/dev/null || {
            curl -fsSL https://get.docker.com -o /tmp/get-docker.sh && sh /tmp/get-docker.sh
            rm -f /tmp/get-docker.sh
        }
        systemctl enable --now docker
    fi

    if ! docker compose version &>/dev/null && ! command -v docker-compose &>/dev/null; then
        echo -e "${YELLOW}[INFO] Installing Docker Compose plugin...${NC}"
        apt-get update && apt-get install -y docker-compose-plugin 2>/dev/null || true
    fi

    if docker compose version >/dev/null 2>&1; then
        COMPOSE_CMD="docker compose"
    elif command -v docker-compose >/dev/null 2>&1; then
        COMPOSE_CMD="docker-compose"
    else
        echo -e "${RED}[ERROR] Docker Compose installation failed.${NC}"
        exit 1
    fi
    echo -e "${GREEN}[OK] Docker & Docker Compose ready.${NC}"
}

reload_nginx() {
    nginx -t 2>/dev/null || { echo -e "${RED}[ERROR] Nginx syntax test failed.${NC}"; return 1; }
    systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || nginx -s reload 2>/dev/null || systemctl restart nginx 2>/dev/null || service nginx restart 2>/dev/null || true
}

setup_nginx_and_ssl() {
    local DOMAIN="$1"
    local SSL_MODE="$2"
    local SSL_EMAIL="$3"

    echo -e "\n${CYAN}--- Configuring Host Nginx for ${DOMAIN} ---${NC}"
    if ! command -v nginx &>/dev/null; then
        echo -e "${YELLOW}[INFO] Installing Nginx on host...${NC}"
        apt-get update && apt-get install -y nginx
    fi

    systemctl start nginx 2>/dev/null || service nginx start 2>/dev/null || true
    mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

    if [ "$SSL_MODE" = "selfsigned" ]; then
        echo -e "${YELLOW}[INFO] Generating self-signed SSL certificate for ${DOMAIN}...${NC}"
        mkdir -p /etc/ssl/pterodash
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout /etc/ssl/pterodash/selfsigned.key \
            -out /etc/ssl/pterodash/selfsigned.crt \
            -subj "/CN=${DOMAIN}" >/dev/null 2>&1

        cat > /etc/nginx/sites-available/pterodash.conf << NGINX_EOF
upstream pterodash_frontend {
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream pterodash_backend {
    server 127.0.0.1:4000;
    keepalive 32;
}

server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name ${DOMAIN};

    ssl_certificate /etc/ssl/pterodash/selfsigned.crt;
    ssl_certificate_key /etc/ssl/pterodash/selfsigned.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 10M;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    location ~* ^/api/.*/stream$ {
        proxy_pass http://pterodash_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;

        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    location /cdn/ {
        proxy_pass http://pterodash_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;

        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;

        expires 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Content-Type-Options "nosniff" always;
        add_header Cross-Origin-Resource-Policy "cross-origin" always;
    }

    location /api/ {
        proxy_pass http://pterodash_backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /_next/static/ {
        proxy_pass http://pterodash_frontend/_next/static/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;

        expires 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://pterodash_frontend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINX_EOF
        ln -sf /etc/nginx/sites-available/pterodash.conf /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
        reload_nginx
        echo -e "${GREEN}[OK] Self-signed SSL configured on port 443 with HTTP redirect.${NC}"
    else
        cat > /etc/nginx/sites-available/pterodash.conf << NGINX_EOF
upstream pterodash_frontend {
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream pterodash_backend {
    server 127.0.0.1:4000;
    keepalive 32;
}

server {
    listen 80;
    server_name ${DOMAIN};

    client_max_body_size 10M;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    location ~* ^/api/.*/stream$ {
        proxy_pass http://pterodash_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    location /cdn/ {
        proxy_pass http://pterodash_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;

        expires 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Content-Type-Options "nosniff" always;
        add_header Cross-Origin-Resource-Policy "cross-origin" always;
    }

    location /api/ {
        proxy_pass http://pterodash_backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /_next/static/ {
        proxy_pass http://pterodash_frontend/_next/static/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;

        expires 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://pterodash_frontend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINX_EOF
        ln -sf /etc/nginx/sites-available/pterodash.conf /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
        reload_nginx
        echo -e "${GREEN}[OK] Nginx reverse proxy enabled.${NC}"

        if [ "$SSL_MODE" = "letsencrypt" ]; then
            echo -e "${YELLOW}[INFO] Configuring SSL with Let's Encrypt (Certbot)...${NC}"
            apt-get install -y certbot python3-certbot-nginx 2>/dev/null || true
            certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$SSL_EMAIL" --redirect || {
                echo -e "${YELLOW}[WARN] Certbot setup encountered an issue (is your domain pointing to this IP?).${NC}"
                echo -e "${YELLOW}[INFO] You can re-run Certbot manually with: sudo certbot --nginx -d ${DOMAIN}${NC}"
            }
            reload_nginx
        fi
    fi
}

install_pterodash() {
    check_root
    ensure_installation_directory
    print_banner
    echo -e "${BOLD}${CYAN}>>> Step 1/6: Prerequisites & Environment Setup${NC}\n"
    install_docker_if_missing

    echo -e "\n${BOLD}${CYAN}>>> Step 2/6: Domain & Pterodactyl Configuration${NC}\n"
    read -rp "Enter your Dashboard Domain (e.g., dashboard.yourdomain.com): " DOMAIN
    DOMAIN=$(echo "$DOMAIN" | tr -d ' ' | sed -e 's|^https\?://||' -e 's|/$||')
    if [ -z "$DOMAIN" ]; then
        echo -e "${RED}[ERROR] Domain cannot be empty.${NC}"
        return 1
    fi

    read -rp "Enter your Pterodactyl Panel URL (e.g., https://panel.yourdomain.com): " PTERO_URL
    PTERO_URL=$(echo "$PTERO_URL" | tr -d ' ' | sed -e 's|/$||')
    if [[ ! "$PTERO_URL" =~ ^https?:// ]]; then
        if [[ "$PTERO_URL" =~ ^(localhost|127\.0\.0\.1) ]]; then
            PTERO_URL="http://${PTERO_URL}"
        else
            PTERO_URL="https://${PTERO_URL}"
        fi
    fi

    read -rp "Enter your Pterodactyl Application API Key (ptla_...): " PTERO_KEY
    PTERO_KEY=$(echo "$PTERO_KEY" | tr -d ' ')

    echo -e "\n${BOLD}${CYAN}>>> Step 3/6: Initial Administrator Account${NC}\n"
    read -rp "Admin Email (e.g., admin@${DOMAIN}): " ADMIN_EMAIL
    ADMIN_EMAIL=$(echo "$ADMIN_EMAIL" | tr -d ' ')
    read -rp "Admin Username (e.g., admin): " ADMIN_USERNAME
    ADMIN_USERNAME=$(echo "$ADMIN_USERNAME" | tr -d ' ')
    read_masked_password "Admin Password: " 

    echo -e "\n${BOLD}${CYAN}>>> Step 4/6: SSL Certificate Setup${NC}\n"
    echo -e "Choose an SSL option:"
    echo -e "  [1] Let's Encrypt SSL (Free, auto-renewing - requires public domain pointing to server)"
    echo -e "  [2] Self-Signed SSL (Instant HTTPS - ideal for local testing, WSL, or IP access)"
    echo -e "  [3] None / HTTP only (Port 80 - ideal for localhost or behind an external proxy)"
    read -rp "Select option [1-3] (Default 1): " SSL_OPT
    SSL_OPT=${SSL_OPT:-1}

    SSL_MODE="none"
    PROTOCOL="http"
    SSL_EMAIL=""

    case "$SSL_OPT" in
        1)
            SSL_MODE="letsencrypt"
            PROTOCOL="https"
            read -rp "Enter Email for Let's Encrypt renewal notices: " SSL_EMAIL
            SSL_EMAIL=${SSL_EMAIL:-$ADMIN_EMAIL}
            ;;
        2)
            SSL_MODE="selfsigned"
            PROTOCOL="https"
            ;;
        *)
            SSL_MODE="none"
            PROTOCOL="http"
            ;;
    esac

    echo -e "\n${BOLD}${CYAN}>>> Step 5/6: Writing Environment & Launching Containers${NC}\n"
    MONGO_PASS=$(openssl rand -base64 18 | tr -dc 'a-zA-Z0-9' | head -c 18)
    JWT_SECRET=$(openssl rand -hex 32)

    cat > .env << ENVEOF
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASS}
MONGO_INITDB_DATABASE=pterodash
MONGODB_URI=mongodb://admin:${MONGO_PASS}@mongodb:27017/pterodash?authSource=admin
JWT_SECRET=${JWT_SECRET}
PTERO_BASE_URL=${PTERO_URL}
PTERO_APP_API_KEY=${PTERO_KEY}
FRONTEND_URL=${PROTOCOL}://${DOMAIN}
NEXT_PUBLIC_API_BASE=
NODE_ENV=production
PORT=4000
REDIS_URL=redis://redis:6379
ENVEOF

    echo -e "${GREEN}[OK] .env configuration generated.${NC}"
    echo -e "${YELLOW}[INFO] Pulling pre-built PteroDash Docker images from GitHub Container Registry...${NC}"
    $COMPOSE_CMD pull
    $COMPOSE_CMD up -d --force-recreate

    echo -e "${YELLOW}[INFO] Waiting for backend service to become ready...${NC}"
    for i in {1..30}; do
        if curl -s http://127.0.0.1:4000/api/health | grep -q "ok"; then
            echo -e "${GREEN}[OK] Backend and database are ready.${NC}"
            break
        fi
        sleep 2
    done

    echo -e "\n${BOLD}${CYAN}>>> Step 6/6: Creating Administrator Account${NC}\n"
    $COMPOSE_CMD exec -e ADMIN_EMAIL="$ADMIN_EMAIL" \
                      -e ADMIN_USERNAME="$ADMIN_USERNAME" \
                      -e ADMIN_PASSWORD="$ADMIN_PASSWORD" \
                      backend node src/utils/createAdmin.js || {
        echo -e "${YELLOW}[WARN] Admin user creation script will retry...${NC}"
        sleep 3
        $COMPOSE_CMD exec -e ADMIN_EMAIL="$ADMIN_EMAIL" \
                          -e ADMIN_USERNAME="$ADMIN_USERNAME" \
                          -e ADMIN_PASSWORD="$ADMIN_PASSWORD" \
                          backend node src/utils/createAdmin.js
    }

    setup_nginx_and_ssl "$DOMAIN" "$SSL_MODE" "$SSL_EMAIL"

    if command -v ufw &>/dev/null && ufw status | grep -q "active"; then
        ufw allow 80/tcp >/dev/null 2>&1 || true
        ufw allow 443/tcp >/dev/null 2>&1 || true
    fi

    echo -e "\n=================================================================="
    echo -e "${GREEN}${BOLD}🎉 PteroDash Successfully Installed!${NC}"
    echo -e "=================================================================="
    echo -e "  🌐 Dashboard URL : ${CYAN}${PROTOCOL}://${DOMAIN}${NC}"
    echo -e "  👤 Admin Username: ${BOLD}${ADMIN_USERNAME}${NC}"
    echo -e "  📧 Admin Email   : ${BOLD}${ADMIN_EMAIL}${NC}"
    echo -e "  🔑 Admin Password: ${YELLOW}${BOLD}${ADMIN_PASSWORD}${NC}"
    echo -e "=================================================================="
    echo -e "  💡 Tip: You can manage PteroDash anytime simply by running:"
    echo -e "          ${CYAN}${BOLD}pterodash${NC}"
    echo -e "==================================================================\n"
}

update_pterodash() {
    check_root
    ensure_installation_directory
    print_banner
    echo -e "${CYAN}${BOLD}>>> Updating PteroDash to Latest Release...${NC}\n"

    if [ -d ".git" ]; then
        echo -e "${YELLOW}[INFO] Pulling latest repository files from GitHub...${NC}"
        git pull origin main || echo -e "${YELLOW}[WARN] Git pull skipped or encountered conflicts.${NC}"
    fi

    echo -e "${YELLOW}[INFO] Pulling latest pre-built PteroDash Docker images from GitHub Container Registry...${NC}"
    $COMPOSE_CMD pull
    $COMPOSE_CMD up -d --force-recreate

    echo -e "${YELLOW}[INFO] Cleaning dangling Docker images...${NC}"
    docker image prune -f >/dev/null 2>&1 || true

    echo -e "\n${GREEN}[OK] PteroDash updated successfully!${NC}"
}

manage_admin() {
    check_root
    ensure_installation_directory
    print_banner
    echo -e "${CYAN}${BOLD}>>> Create or Promote Administrator Account${NC}\n"
    read -rp "Admin Email (e.g., admin@example.com): " ADMIN_EMAIL
    read -rp "Admin Username (e.g., admin): " ADMIN_USERNAME
    if [ -z "$ADMIN_EMAIL" ] && [ -z "$ADMIN_USERNAME" ]; then
        echo -e "${RED}[ERROR] Email or Username is required.${NC}"
        return 1
    fi
    read_masked_password "Admin Password: " 

    echo -e "${YELLOW}[INFO] Provisioning administrator in database...${NC}"
    $COMPOSE_CMD exec -e ADMIN_EMAIL="$ADMIN_EMAIL" \
                      -e ADMIN_USERNAME="$ADMIN_USERNAME" \
                      -e ADMIN_PASSWORD="$ADMIN_PASSWORD" \
                      backend node src/utils/createAdmin.js

    echo -e "${GREEN}[OK] Administrator account updated successfully.${NC}"
}

reconfigure_nginx() {
    check_root
    ensure_installation_directory
    print_banner
    echo -e "${CYAN}${BOLD}>>> Reconfigure Nginx & SSL${NC}\n"
    read -rp "Enter Domain Name (e.g., dashboard.yourdomain.com): " DOMAIN
    DOMAIN=$(echo "$DOMAIN" | tr -d ' ' | sed -e 's|^https\?://||' -e 's|/$||')
    if [ -z "$DOMAIN" ]; then
        echo -e "${RED}[ERROR] Domain cannot be empty.${NC}"
        return 1
    fi

    echo -e "Choose an SSL option:"
    echo -e "  [1] Let's Encrypt SSL (Requires domain pointed to server)"
    echo -e "  [2] Self-Signed SSL (Local testing / WSL / IP)"
    echo -e "  [3] None / HTTP only"
    read -rp "Select option [1-3] (Default 1): " SSL_OPT
    SSL_OPT=${SSL_OPT:-1}

    SSL_MODE="none"
    PROTOCOL="http"
    SSL_EMAIL=""
    case "$SSL_OPT" in
        1)
            SSL_MODE="letsencrypt"
            PROTOCOL="https"
            read -rp "Enter Email for Let's Encrypt: " SSL_EMAIL
            ;;
        2)
            SSL_MODE="selfsigned"
            PROTOCOL="https"
            ;;
        *)
            SSL_MODE="none"
            PROTOCOL="http"
            ;;
    esac

    setup_nginx_and_ssl "$DOMAIN" "$SSL_MODE" "$SSL_EMAIL"

    read -rp "Do you want to update .env with this domain and restart containers? (y/n) [y]: " RESTART
    RESTART=${RESTART:-y}
    if [[ "$RESTART" =~ ^[Yy]$ ]] && [ -f ".env" ]; then
        sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=${PROTOCOL}://${DOMAIN}|g" .env
        sed -i "s|NEXT_PUBLIC_API_BASE=.*|NEXT_PUBLIC_API_BASE=|g" .env
        echo -e "${YELLOW}[INFO] Restarting containers with updated domain (${PROTOCOL}://${DOMAIN})...${NC}"
        $COMPOSE_CMD up -d --force-recreate
        echo -e "${GREEN}[OK] Containers updated successfully.${NC}"
    fi
}

manage_services() {
    ensure_installation_directory
    print_banner
    echo -e "${CYAN}${BOLD}Service Management${NC}"
    echo -e "  [1] Start all services"
    echo -e "  [2] Stop all services"
    echo -e "  [3] Restart all services"
    echo -e "  [4] View live logs"
    echo -e "  [5] Check status & health"
    echo -e "  [0] Back to main menu"
    echo ""
    read -rp "Select an option [0-5]: " SVC_OPT
    case "$SVC_OPT" in
        1) $COMPOSE_CMD up -d ;;
        2) $COMPOSE_CMD stop ;;
        3) $COMPOSE_CMD restart ;;
        4) $COMPOSE_CMD logs -f ;;
        5)
            $COMPOSE_CMD ps
            echo -e "\n${YELLOW}Testing Backend Health Check:${NC}"
            curl -s http://127.0.0.1:4000/api/health || echo -e "${RED}Failed to reach backend${NC}"
            echo ""
            ;;
        *) return 0 ;;
    esac
}

uninstall_pterodash() {
    check_root
    ensure_installation_directory
    print_banner
    echo -e "${RED}${BOLD}WARNING: This will completely uninstall PteroDash!${NC}\n"
    read -rp "Are you sure you want to proceed? Type 'yes' to confirm: " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo -e "${GREEN}[INFO] Uninstall canceled.${NC}"
        return 0
    fi

    read -rp "Do you want to permanently delete database volumes (MongoDB & Redis data)? (y/n) [n]: " DEL_DATA
    if [[ "$DEL_DATA" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}[INFO] Stopping containers and removing volumes...${NC}"
        $COMPOSE_CMD down -v --rmi all 2>/dev/null || true
    else
        echo -e "${YELLOW}[INFO] Stopping containers...${NC}"
        $COMPOSE_CMD down 2>/dev/null || true
    fi

    read -rp "Do you want to remove Nginx configuration for PteroDash? (y/n) [y]: " DEL_NGINX
    DEL_NGINX=${DEL_NGINX:-y}
    if [[ "$DEL_NGINX" =~ ^[Yy]$ ]]; then
        rm -f /etc/nginx/sites-available/pterodash.conf
        rm -f /etc/nginx/sites-enabled/pterodash.conf
        systemctl reload nginx 2>/dev/null || true
        echo -e "${GREEN}[OK] Nginx configuration removed.${NC}"
    fi

    rm -f /usr/local/bin/pterodash
    echo -e "\n${GREEN}[OK] PteroDash uninstalled.${NC}"
}

ensure_installation_directory

# Interactive CLI Loop
while true; do
    print_banner
    echo -e "${BOLD}Select an action:${NC}"
    echo -e "  ${CYAN}[1]${NC} Install PteroDash (Full stack: Docker, Nginx, SSL, .env, Auto-Admin)"
    echo -e "  ${CYAN}[2]${NC} Update PteroDash (Pull latest images & restart containers)"
    echo -e "  ${CYAN}[3]${NC} Create or Reset Admin Account"
    echo -e "  ${CYAN}[4]${NC} Configure / Reconfigure Nginx & SSL"
    echo -e "  ${CYAN}[5]${NC} Service Management (Start, Stop, Restart, Status, Logs)"
    echo -e "  ${CYAN}[6]${NC} Uninstall PteroDash"
    echo -e "  ${CYAN}[0]${NC} Exit"
    echo ""
    read -rp "Enter choice [0-6]: " CHOICE

    case "$CHOICE" in
        1) install_pterodash; read -rp "Press Enter to return to menu..." ;;
        2) update_pterodash; read -rp "Press Enter to return to menu..." ;;
        3) manage_admin; read -rp "Press Enter to return to menu..." ;;
        4) reconfigure_nginx; read -rp "Press Enter to return to menu..." ;;
        5) manage_services; read -rp "Press Enter to return to menu..." ;;
        6) uninstall_pterodash; read -rp "Press Enter to return to menu..." ;;
        0) echo -e "\nGoodbye!"; exit 0 ;;
        *) echo -e "${RED}Invalid option.${NC}"; sleep 1 ;;
    esac
done

