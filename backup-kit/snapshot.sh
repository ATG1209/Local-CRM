#!/bin/bash

# snapshot.sh
# Creates a timestamped .tar.gz snapshot of the project.

PROJECT_NAME="LocalCRM"
BACKUP_DIR="$HOME/Backups/$PROJECT_NAME/snapshots"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
FILENAME="${PROJECT_NAME}_snapshot_${TIMESTAMP}.tar.gz"

mkdir -p "$BACKUP_DIR"

echo "📦 Creating snapshot: $FILENAME"

# Navigate to project root
cd "$(dirname "$0")/.."

# Create archive, excluding node_modules and .git
tar --exclude='node_modules' --exclude='.git' -czf "$BACKUP_DIR/$FILENAME" .

echo "✅ Snapshot saved to: $BACKUP_DIR/$FILENAME"
