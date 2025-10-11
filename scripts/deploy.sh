#!/bin/bash

# Skill Probe LMS Deployment Script
# This script handles the deployment process for production environments

set -e  # Exit on any error

echo "🚀 Starting Skill Probe LMS Deployment..."

# Configuration
NODE_ENV=${NODE_ENV:-production}
BUILD_DIR=${BUILD_DIR:-".next"}
BACKUP_DIR=${BACKUP_DIR:-"./backups"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if required environment variables are set
check_env_vars() {
    print_status "Checking environment variables..."
    
    required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
        "REDIS_URL"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    print_status "All required environment variables are set ✓"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm ci --only=production
    print_status "Dependencies installed ✓"
}

# Run type checking
type_check() {
    print_status "Running TypeScript type checking..."
    npm run type-check
    print_status "Type checking passed ✓"
}

# Run linting
lint_check() {
    print_status "Running ESLint..."
    npm run lint
    print_status "Linting passed ✓"
}

# Run tests
run_tests() {
    print_status "Running test suite..."
    npm test -- --passWithNoTests --coverage
    print_status "Tests passed ✓"
}

# Build the application
build_app() {
    print_status "Building application..."
    
    # Clean previous build
    if [ -d "$BUILD_DIR" ]; then
        rm -rf "$BUILD_DIR"
    fi
    
    # Build the app
    npm run build
    
    if [ ! -d "$BUILD_DIR" ]; then
        print_error "Build failed - no build directory found"
        exit 1
    fi
    
    print_status "Application built successfully ✓"
}

# Create backup of current deployment
create_backup() {
    if [ -d "$BUILD_DIR" ] && [ "$NODE_ENV" = "production" ]; then
        print_status "Creating backup of current deployment..."
        
        mkdir -p "$BACKUP_DIR"
        timestamp=$(date +"%Y%m%d_%H%M%S")
        backup_name="backup_$timestamp"
        
        cp -r "$BUILD_DIR" "$BACKUP_DIR/$backup_name"
        print_status "Backup created: $BACKUP_DIR/$backup_name ✓"
    fi
}

# Database migration check
check_database() {
    print_status "Checking database connection..."
    npm run db:test
    print_status "Database connection verified ✓"
}

# Health check after deployment
health_check() {
    print_status "Running post-deployment health check..."
    
    # Wait for the application to start
    sleep 5
    
    # Check if the health endpoint responds
    if command -v curl &> /dev/null; then
        response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")
        if [ "$response" = "200" ]; then
            print_status "Health check passed ✓"
        else
            print_warning "Health check failed with status: $response"
        fi
    else
        print_warning "curl not available, skipping health check"
    fi
}

# Cleanup old backups (keep last 5)
cleanup_backups() {
    if [ -d "$BACKUP_DIR" ]; then
        print_status "Cleaning up old backups..."
        cd "$BACKUP_DIR"
        ls -t | tail -n +6 | xargs -r rm -rf
        cd - > /dev/null
        print_status "Backup cleanup completed ✓"
    fi
}

# Main deployment process
main() {
    print_status "Starting deployment process..."
    
    # Pre-deployment checks
    check_env_vars
    
    # Install dependencies
    install_dependencies
    
    # Code quality checks
    type_check
    lint_check
    
    # Run tests
    run_tests
    
    # Database checks
    check_database
    
    # Create backup before deployment
    create_backup
    
    # Build application
    build_app
    
    # Post-deployment checks
    health_check
    
    # Cleanup
    cleanup_backups
    
    print_status "🎉 Deployment completed successfully!"
    print_status "Application is ready to start with: npm start"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "build-only")
        check_env_vars
        install_dependencies
        type_check
        lint_check
        build_app
        ;;
    "test-only")
        install_dependencies
        type_check
        lint_check
        run_tests
        ;;
    "health-check")
        health_check
        ;;
    *)
        echo "Usage: $0 [deploy|build-only|test-only|health-check]"
        echo "  deploy      - Full deployment process (default)"
        echo "  build-only  - Only build the application"
        echo "  test-only   - Only run tests and checks"
        echo "  health-check - Only run health check"
        exit 1
        ;;
esac