#!/bin/bash

# Skill Probe LMS Backup Script
# This script creates backups of the database and important files

set -e

# Configuration
BACKUP_DIR=${BACKUP_DIR:-"./backups"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="skillprobe_backup_$TIMESTAMP"
RETENTION_DAYS=${RETENTION_DAYS:-7}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
create_backup_dir() {
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME"
    print_status "Created backup directory: $BACKUP_DIR/$BACKUP_NAME"
}

# Backup Supabase database
backup_database() {
    print_status "Starting database backup..."
    
    if [ -z "$SUPABASE_DB_URL" ]; then
        print_warning "SUPABASE_DB_URL not set, skipping database backup"
        return
    fi
    
    # Create database dump using pg_dump
    pg_dump "$SUPABASE_DB_URL" > "$BACKUP_DIR/$BACKUP_NAME/database.sql"
    
    if [ $? -eq 0 ]; then
        print_status "Database backup completed ✓"
    else
        print_error "Database backup failed"
        exit 1
    fi
}

# Backup Redis data
backup_redis() {
    print_status "Starting Redis backup..."
    
    if command -v redis-cli &> /dev/null; then
        redis-cli --rdb "$BACKUP_DIR/$BACKUP_NAME/redis_dump.rdb"
        print_status "Redis backup completed ✓"
    else
        print_warning "redis-cli not available, skipping Redis backup"
    fi
}

# Backup uploaded files (if using local storage)
backup_uploads() {
    print_status "Starting file uploads backup..."
    
    if [ -d "./uploads" ]; then
        cp -r "./uploads" "$BACKUP_DIR/$BACKUP_NAME/uploads"
        print_status "File uploads backup completed ✓"
    else
        print_status "No local uploads directory found, skipping file backup"
    fi
}

# Backup configuration files
backup_config() {
    print_status "Starting configuration backup..."
    
    # Backup environment files (without sensitive data)
    if [ -f ".env.example" ]; then
        cp ".env.example" "$BACKUP_DIR/$BACKUP_NAME/"
    fi
    
    # Backup package.json
    if [ -f "package.json" ]; then
        cp "package.json" "$BACKUP_DIR/$BACKUP_NAME/"
    fi
    
    # Backup docker-compose.yml
    if [ -f "docker-compose.yml" ]; then
        cp "docker-compose.yml" "$BACKUP_DIR/$BACKUP_NAME/"
    fi
    
    # Backup Dockerfile
    if [ -f "Dockerfile" ]; then
        cp "Dockerfile" "$BACKUP_DIR/$BACKUP_NAME/"
    fi
    
    print_status "Configuration backup completed ✓"
}

# Create backup metadata
create_metadata() {
    print_status "Creating backup metadata..."
    
    cat > "$BACKUP_DIR/$BACKUP_NAME/metadata.json" << EOF
{
  "backup_name": "$BACKUP_NAME",
  "timestamp": "$TIMESTAMP",
  "date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "$(node -p "require('./package.json').version" 2>/dev/null || echo 'unknown')",
  "node_env": "${NODE_ENV:-development}",
  "components": {
    "database": $([ -f "$BACKUP_DIR/$BACKUP_NAME/database.sql" ] && echo "true" || echo "false"),
    "redis": $([ -f "$BACKUP_DIR/$BACKUP_NAME/redis_dump.rdb" ] && echo "true" || echo "false"),
    "uploads": $([ -d "$BACKUP_DIR/$BACKUP_NAME/uploads" ] && echo "true" || echo "false"),
    "config": true
  }
}
EOF
    
    print_status "Backup metadata created ✓"
}

# Compress backup
compress_backup() {
    print_status "Compressing backup..."
    
    cd "$BACKUP_DIR"
    tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
    
    if [ $? -eq 0 ]; then
        rm -rf "$BACKUP_NAME"
        print_status "Backup compressed: $BACKUP_DIR/$BACKUP_NAME.tar.gz ✓"
    else
        print_error "Backup compression failed"
        exit 1
    fi
    
    cd - > /dev/null
}

# Clean old backups
cleanup_old_backups() {
    print_status "Cleaning up old backups (keeping last $RETENTION_DAYS days)..."
    
    find "$BACKUP_DIR" -name "skillprobe_backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    print_status "Old backups cleaned up ✓"
}

# Verify backup integrity
verify_backup() {
    print_status "Verifying backup integrity..."
    
    if [ -f "$BACKUP_DIR/$BACKUP_NAME.tar.gz" ]; then
        tar -tzf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" > /dev/null
        
        if [ $? -eq 0 ]; then
            print_status "Backup integrity verified ✓"
        else
            print_error "Backup integrity check failed"
            exit 1
        fi
    else
        print_error "Backup file not found"
        exit 1
    fi
}

# Upload to cloud storage (optional)
upload_to_cloud() {
    if [ -n "$AWS_S3_BACKUP_BUCKET" ] && command -v aws &> /dev/null; then
        print_status "Uploading backup to S3..."
        
        aws s3 cp "$BACKUP_DIR/$BACKUP_NAME.tar.gz" "s3://$AWS_S3_BACKUP_BUCKET/backups/"
        
        if [ $? -eq 0 ]; then
            print_status "Backup uploaded to S3 ✓"
        else
            print_warning "Failed to upload backup to S3"
        fi
    fi
}

# Main backup process
main() {
    print_status "🗄️  Starting Skill Probe LMS backup process..."
    
    create_backup_dir
    backup_database
    backup_redis
    backup_uploads
    backup_config
    create_metadata
    compress_backup
    verify_backup
    upload_to_cloud
    cleanup_old_backups
    
    print_status "🎉 Backup process completed successfully!"
    print_status "Backup location: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
}

# Handle script arguments
case "${1:-backup}" in
    "backup")
        main
        ;;
    "database-only")
        create_backup_dir
        backup_database
        create_metadata
        compress_backup
        ;;
    "config-only")
        create_backup_dir
        backup_config
        create_metadata
        compress_backup
        ;;
    "verify")
        if [ -n "$2" ]; then
            tar -tzf "$2" > /dev/null && echo "Backup is valid" || echo "Backup is corrupted"
        else
            echo "Usage: $0 verify <backup-file>"
        fi
        ;;
    *)
        echo "Usage: $0 [backup|database-only|config-only|verify <file>]"
        echo "  backup        - Full backup (default)"
        echo "  database-only - Only backup database"
        echo "  config-only   - Only backup configuration"
        echo "  verify        - Verify backup integrity"
        exit 1
        ;;
esac