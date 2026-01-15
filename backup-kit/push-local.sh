#!/bin/bash

# push-local.sh
# Adds all changes, commits with a timestamp, and pushes to the local remote.

MESSAGE=$1
if [ -z "$MESSAGE" ]; then
  MESSAGE="Backup at $(date '+%Y-%m-%d %H:%M:%S')"
fi

echo "🚀 Staging changes..."
git add .

echo "💾 Committing changes: $MESSAGE"
git commit -m "$MESSAGE"

echo "📡 Pushing to local remote..."
git push local main

echo "✅ Done!"
