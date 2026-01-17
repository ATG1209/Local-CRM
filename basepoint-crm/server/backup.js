/**
 * Database Backup Utility
 *
 * Creates timestamped backups of the SQLite database.
 * Run manually or automatically on server start.
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'crm.db');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const MAX_BACKUPS = 30; // Keep last 30 backups

/**
 * Create a backup of the database
 * @param {string} type - Type of backup ('manual', 'auto', 'pre-migration')
 * @returns {string} Path to the backup file
 */
function createBackup(type = 'manual') {
  try {
    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Check if database exists
    if (!fs.existsSync(DB_PATH)) {
      console.warn('⚠️  No database file found to backup');
      return null;
    }

    // Create timestamped backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFilename = `crm-backup-${type}-${timestamp}.db`;
    const backupPath = path.join(BACKUP_DIR, backupFilename);

    // Copy database file
    fs.copyFileSync(DB_PATH, backupPath);

    // Get file size for confirmation
    const stats = fs.statSync(backupPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Database backed up successfully!`);
    console.log(`   File: ${backupFilename}`);
    console.log(`   Size: ${sizeMB} MB`);
    console.log(`   Path: ${backupPath}`);

    // Clean up old backups
    cleanupOldBackups();

    return backupPath;
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    throw error;
  }
}

/**
 * Remove old backups, keeping only the most recent MAX_BACKUPS
 */
function cleanupOldBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return;

    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('crm-backup-') && f.endsWith('.db'))
      .map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
      }))
      .sort((a, b) => b.mtime - a.mtime);

    // Remove old backups beyond MAX_BACKUPS
    const toDelete = files.slice(MAX_BACKUPS);
    toDelete.forEach(file => {
      fs.unlinkSync(file.path);
      console.log(`🗑️  Removed old backup: ${file.name}`);
    });

    if (toDelete.length > 0) {
      console.log(`📦 Keeping ${files.length - toDelete.length} most recent backups`);
    }
  } catch (error) {
    console.error('⚠️  Cleanup warning:', error.message);
  }
}

/**
 * List all available backups
 */
function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('No backups directory found');
    return [];
  }

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('crm-backup-') && f.endsWith('.db'))
    .map(f => {
      const stats = fs.statSync(path.join(BACKUP_DIR, f));
      return {
        name: f,
        path: path.join(BACKUP_DIR, f),
        size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
        created: stats.mtime
      };
    })
    .sort((a, b) => b.created.getTime() - a.created.getTime());

  console.log(`\n📦 Available backups (${files.length}):\n`);
  files.forEach((file, i) => {
    console.log(`${i + 1}. ${file.name}`);
    console.log(`   Created: ${file.created.toLocaleString()}`);
    console.log(`   Size: ${file.size}\n`);
  });

  return files;
}

/**
 * Restore database from a backup file
 * @param {string} backupFile - Name or path of backup file
 */
function restoreBackup(backupFile) {
  try {
    let backupPath;

    // Check if it's a full path or just filename
    if (path.isAbsolute(backupFile)) {
      backupPath = backupFile;
    } else {
      backupPath = path.join(BACKUP_DIR, backupFile);
    }

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    // Create a safety backup of current database before restoring
    if (fs.existsSync(DB_PATH)) {
      console.log('📸 Creating safety backup of current database...');
      createBackup('pre-restore');
    }

    // Restore the backup
    fs.copyFileSync(backupPath, DB_PATH);

    console.log(`✅ Database restored successfully from: ${backupFile}`);
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    throw error;
  }
}

// Export functions
module.exports = {
  createBackup,
  listBackups,
  restoreBackup,
  cleanupOldBackups
};

// CLI support
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'backup':
      createBackup('manual');
      break;
    case 'list':
      listBackups();
      break;
    case 'restore':
      const backupFile = process.argv[3];
      if (!backupFile) {
        console.error('❌ Please specify a backup file to restore');
        console.log('Usage: node backup.js restore <backup-filename>');
        listBackups();
        process.exit(1);
      }
      restoreBackup(backupFile);
      break;
    default:
      console.log('Database Backup Utility\n');
      console.log('Usage:');
      console.log('  node backup.js backup          - Create a manual backup');
      console.log('  node backup.js list            - List all backups');
      console.log('  node backup.js restore <file>  - Restore from backup');
  }
}
