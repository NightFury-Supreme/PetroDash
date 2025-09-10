#!/bin/bash

# PteroDash Docker Management Scripts

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Setup environment file
setup_env() {
    if [ ! -f .env ]; then
        print_status "Creating .env file from template..."
        cp docker-compose.env .env
        print_warning "Please edit .env file with your configuration before running the application."
        print_warning "Important: Change the default passwords and secrets!"
        exit 0
    fi
}

# Build and start all services (production)
start() {
    print_header "Starting PteroDash (Production)"
    check_docker
    setup_env
    
    print_status "Building and starting all services..."
    if docker-compose up -d --build; then
        print_status "Build completed successfully!"
        
        print_status "Waiting for services to be ready..."
        sleep 10
        
        print_status "Checking service health..."
        docker-compose ps
        
        # Check if all services are running
        if docker-compose ps | grep -q "Exit"; then
            print_error "Some services failed to start. Check logs with: docker-compose logs"
            docker-compose ps
            exit 1
        fi
        
        print_header "PteroDash is now running!"
        echo -e "${GREEN}Frontend:${NC} http://localhost:3000"
        echo -e "${GREEN}Backend API:${NC} http://localhost:4000"
        echo -e "${GREEN}MongoDB:${NC} localhost:27017"
        echo ""
        echo -e "${YELLOW}Default Admin Credentials:${NC}"
        echo -e "Email: ${BLUE}admin@example.com${NC}"
        echo -e "Password: ${BLUE}admin123${NC}"
        echo ""
        echo -e "${YELLOW}To view logs:${NC} docker-compose logs -f"
        echo -e "${YELLOW}To stop:${NC} docker-compose down"
    else
        print_error "Build failed! Check the logs above for details."
        print_status "To view detailed logs: docker-compose logs"
        exit 1
    fi
}

# Start development environment
dev() {
    print_header "Starting PteroDash (Development)"
    check_docker
    
    print_status "Building and starting development services..."
    if docker-compose -f docker-compose.dev.yml up -d --build; then
        print_status "Build completed successfully!"
        
        print_status "Waiting for services to be ready..."
        sleep 10
        
        print_status "Checking service health..."
        docker-compose -f docker-compose.dev.yml ps
        
        # Check if all services are running
        if docker-compose -f docker-compose.dev.yml ps | grep -q "Exit"; then
            print_error "Some services failed to start. Check logs with: docker-compose -f docker-compose.dev.yml logs"
            docker-compose -f docker-compose.dev.yml ps
            exit 1
        fi
        
        print_header "PteroDash Development is now running!"
        echo -e "${GREEN}Frontend:${NC} http://localhost:3000 (with hot reload)"
        echo -e "${GREEN}Backend API:${NC} http://localhost:4000 (with hot reload)"
        echo -e "${GREEN}MongoDB:${NC} localhost:27017"
        echo ""
        echo -e "${YELLOW}Development Features:${NC}"
        echo -e "• Hot reload enabled for both frontend and backend"
        echo -e "• Source code is mounted as volumes"
        echo -e "• All dependencies installed (including dev dependencies)"
        echo ""
        echo -e "${YELLOW}To view logs:${NC} docker-compose -f docker-compose.dev.yml logs -f"
        echo -e "${YELLOW}To stop:${NC} docker-compose -f docker-compose.dev.yml down"
    else
        print_error "Build failed! Check the logs above for details."
        print_status "To view detailed logs: docker-compose -f docker-compose.dev.yml logs"
        exit 1
    fi
}

# Stop all services
stop() {
    print_header "Stopping PteroDash"
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
    print_status "All services stopped."
}

# Restart all services
restart() {
    print_header "Restarting PteroDash"
    docker-compose restart
    print_status "All services restarted."
}

# View logs
logs() {
    docker-compose logs -f
}

# Clean up everything
clean() {
    print_header "Cleaning up PteroDash"
    print_warning "This will remove all containers, volumes, and images. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        docker-compose down -v --rmi all
        docker system prune -f
        print_status "Cleanup completed."
    else
        print_status "Cleanup cancelled."
    fi
}

# Show status
status() {
    print_header "PteroDash Status"
    docker-compose ps
    echo ""
    print_status "Service Health:"
    echo -e "Frontend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ || echo "DOWN")"
    echo -e "Backend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/health || echo "DOWN")"
    echo -e "MongoDB: $(docker-compose exec -T mongodb mongosh --eval "db.runCommand('ping').ok" --quiet 2>/dev/null || echo "DOWN")"
}

# Update services
update() {
    print_header "Updating PteroDash"
    docker-compose pull
    docker-compose up -d --build
    print_status "Update completed."
}

# Show help
help() {
    print_header "PteroDash Docker Management"
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start all services (production)"
    echo "  dev       Start development environment with hot reload"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  logs      View logs from all services"
    echo "  status    Show service status"
    echo "  clean     Remove all containers and volumes"
    echo "  update    Update and restart services"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start    # Start PteroDash (production)"
    echo "  $0 dev      # Start PteroDash (development with hot reload)"
    echo "  $0 logs     # View logs"
    echo "  $0 stop     # Stop PteroDash"
    echo ""
    echo "Development vs Production:"
    echo "  • Production: Optimized builds, no source mounting"
    echo "  • Development: Hot reload, source code mounted, dev dependencies"
}

# Main script logic
case "$1" in
    start)
        start
        ;;
    dev)
        dev
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs
        ;;
    status)
        status
        ;;
    clean)
        clean
        ;;
    update)
        update
        ;;
    help|--help|-h)
        help
        ;;
    *)
        print_error "Unknown command: $1"
        help
        exit 1
        ;;
esac
