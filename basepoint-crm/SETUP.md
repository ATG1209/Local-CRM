# Basepoint CRM - Setup & Deployment Guide

## 🚀 Quick Start (Corporate Laptop Setup)

### Prerequisites
- Node.js v18 or higher
- Git

### Step 1: Clone the Repository
```bash
git clone <your-github-repo-url>
cd basepoint-crm
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start the Application
```bash
# Start both frontend and backend (recommended)
npm run dev

# OR start them separately:
npm run dev:client    # Frontend only (port 5173)
npm run server        # Backend only (port 3001)
```

### Step 4: Access the Application
- Open browser: http://localhost:5173
- The database will be automatically created on first run
- An automatic backup is created every time the server starts

---

## 📦 Database Backup & Restore

### Automatic Backups
- **Every server start**: Automatic backup created
- **Location**: `backups/` folder
- **Retention**: Last 30 backups kept automatically
- **Naming**: `crm-backup-auto-YYYY-MM-DDTHH-MM-SS.db`

### Manual Backup (CLI)
```bash
# Create manual backup
cd server
node backup.js backup

# List all backups
node backup.js list

# Restore from backup
node backup.js restore crm-backup-manual-2026-01-16T10-30-00.db
```

### Manual Backup (API)
```bash
# Create backup via API
curl -X POST http://localhost:3001/api/backup

# List backups via API
curl http://localhost:3001/api/backups

# Restore from backup via API
curl -X POST http://localhost:3001/api/restore \
  -H "Content-Type: application/json" \
  -d '{"backupFile": "crm-backup-manual-2026-01-16T10-30-00.db"}'
```

---

## 🛡️ Data Safety Features

### 1. Database Protection
- ✅ Database file **excluded from Git** (via .gitignore)
- ✅ Automatic backups on every server start
- ✅ SQL injection protection with table whitelisting
- ✅ Error handling for all database operations

### 2. Best Practices
- **Before major changes**: Create manual backup (`node backup.js backup`)
- **After migrations**: Check backups folder to ensure backup exists
- **Weekly**: Download important backups to external storage
- **Production**: Consider automated cloud backups (see Advanced section)

### 3. Recovery Procedures
If database becomes corrupted:
```bash
cd server
node backup.js list                           # Find recent backup
node backup.js restore <backup-filename>      # Restore it
```

---

## ⚙️ Environment Configuration

### Create `.env` file
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3001

# Database Path (optional - defaults to server/crm.db)
# DB_PATH=/absolute/path/to/database.db

# API URL for production (optional)
# VITE_API_URL=https://your-production-api.com/api
```

### Production Deployment
For production deployment to a cloud service:

1. **Set environment variables**:
   - `PORT` - Server port (default: 3001)
   - `DB_PATH` - Absolute path to database file
   - `VITE_API_URL` - Production API endpoint

2. **Build frontend**:
   ```bash
   npm run build
   ```

3. **Serve built files**:
   - Frontend dist files in `dist/` folder
   - Deploy to Vercel, Netlify, or static hosting
   - Point API calls to production server

---

## 🔧 Troubleshooting

### Database Issues

**Problem**: Database file not found
```bash
# The database will be created automatically on first run
# Just start the server: npm run server
```

**Problem**: Permission denied accessing database
```bash
# Ensure proper file permissions
chmod 644 server/crm.db
```

**Problem**: Database locked
```bash
# Close all connections, restart server
# Or restore from latest backup
```

### Migration Issues

**Problem**: Lost data after moving to new computer
```bash
# Your backups are in the backups/ folder
# Copy the entire backups/ folder to new computer
# Then restore latest backup
cd server
node backup.js restore <latest-backup>
```

### Port Conflicts

**Problem**: Port 3001 or 5173 already in use
```bash
# Change port in .env file:
# PORT=3002

# Or in package.json for frontend:
# "dev:client": "vite --port 5174"
```

---

## 📋 Available Scripts

```bash
npm run dev          # Start frontend + backend concurrently
npm run dev:client   # Start frontend only (Vite dev server)
npm run server       # Start backend only (Express + SQLite)
npm run build        # Build frontend for production
npm run preview      # Preview production build locally
```

---

## 🗂️ Project Structure

```
basepoint-crm/
├── components/          # React components
├── server/
│   ├── index.js        # Express server
│   ├── backup.js       # Backup utility
│   └── crm.db          # SQLite database (auto-created, gitignored)
├── backups/            # Database backups (gitignored)
├── utils/              # Utility functions
├── types.ts            # TypeScript types
├── .env                # Environment config (gitignored)
├── .gitignore          # Git ignore rules
└── package.json        # Dependencies & scripts
```

---

## 🚨 IMPORTANT NOTES

### What's Committed to Git
✅ Source code
✅ Configuration files
✅ Documentation

### What's NOT Committed (Gitignored)
❌ Database files (`*.db`)
❌ Backup files (`backups/`)
❌ Environment variables (`.env`)
❌ Dependencies (`node_modules/`)
❌ Build output (`dist/`)

### Data Migration Between Computers
When moving to a new computer:
1. **Push code** to GitHub (database excluded automatically)
2. **On new computer**: Clone and run `npm install`
3. **To transfer data**: Manually copy the `backups/` folder
4. **Restore**: Use `node backup.js restore <backup-file>`

---

## 📞 Support

For issues or questions:
- Check this guide first
- Review error messages in terminal
- Verify backups folder exists and has recent backups
- Try restoring from a known good backup

---

## 🔐 Security Checklist

- [x] Database excluded from version control
- [x] SQL injection protection enabled
- [x] API error handling implemented
- [x] XSS vulnerability patched
- [x] Automatic backups on server start
- [x] Environment variables for sensitive config
- [ ] Consider encryption for backups (if storing sensitive data)
- [ ] Consider external cloud backup strategy
- [ ] Review and rotate any API keys regularly
