# Local Backup Kit Documentation

This kit provides a private, offline way to manage your project's history and ensure regular backups without using the internet or GitHub.

## 1. Local Version Control (`back-kit/push-local.sh`)
This script acts like `git push` but to a local directory instead of GitHub.
- **What it does**: Stages all changes, commits them with a timestamp, and pushes them to your local "remote" repository at `~/Backups/LocalCRM_remote.git`.
- **How to use**:
  ```bash
  ./backup-kit/push-local.sh "My commit message"
  ```
  *If no message is provided, it uses a default timestamp.*

## 2. Full Snapshots (`backup-kit/snapshot.sh`)
This script creates a compressed archive of your entire project (excluding `node_modules` and `.git`).
- **What it does**: Creates a `.tar.gz` file in `~/Backups/LocalCRM/snapshots/`.
- **How to use**:
  ```bash
  ./backup-kit/snapshot.sh
  ```

## 3. Storage Locations
- **Local Remote Repo**: `~/Backups/LocalCRM_remote.git` (Use this to "clone" or recover history).
- **Snapshots**: `~/Backups/LocalCRM/snapshots/` (Point-in-time compressed backups).

## 4. How to Recover
- **From Remote**: `git clone ~/Backups/LocalCRM_remote.git RecoveredProject`
- **From Snapshot**: Unzip any file in the snapshots folder.

---
**Note**: Since this is purely local, your data never leaves your machine. Make sure to occasionally copy your `~/Backups` folder to an external drive for physical redundancy!
