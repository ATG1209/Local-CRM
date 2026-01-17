# 🤖 AI Agent Setup Guide - Basepoint CRM

**For AI Assistants**: This is a local-first CRM with automatic database backups. Follow these steps to help the user get running.

---

## ✅ Quick Setup (5 minutes)

### Step 1: Verify Location
```bash
pwd  # Should be in basepoint-crm directory
```

### Step 2: Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Step 3: Start the Application
```bash
# Start backend (Terminal 1)
cd server
npm start

# Start frontend (Terminal 2 - open new terminal)
npm run dev
```

### Step 4: Open Browser
Navigate to: http://localhost:5173

**That's it!** The database will be created automatically with sample data.

---

## 🎯 What Happens on First Run

1. Server starts and detects no database exists
2. Creates `server/crm.db` automatically
3. Initializes all tables (companies, people, tasks, activities, etc.)
4. Seeds sample data (5 companies, 6 people, 4 tasks)
5. Creates first automatic backup in `backups/` folder
6. User can start working immediately

---

## 🛡️ Important: Database & Backups

### Database Location
- **File**: `server/crm.db`
- **Created automatically** on first run
- **NOT in Git** (gitignored - will never be committed)
- **Local only** - data stays on this machine

### Automatic Backups
- **Created**: Every time server starts
- **Location**: `backups/` folder
- **Retention**: Last 30 backups kept
- **Format**: `crm-backup-auto-YYYY-MM-DDTHH-MM-SS.db`

### Manual Backups
```bash
cd server
npm run backup              # Create backup now
npm run backup:list         # List all backups
npm run backup:restore      # Restore (requires filename)
```

---

## 🚨 Common Issues & Solutions

### Issue 1: Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3001
```
**Solution**:
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill

# Or change port in .env file
echo "PORT=3002" > .env
```

### Issue 2: Dependencies Missing
```
Error: Cannot find module 'express'
```
**Solution**:
```bash
cd server
npm install
cd ..
npm install
```

### Issue 3: Database Locked
```
Error: SQLITE_BUSY: database is locked
```
**Solution**:
```bash
# Restart server
# If persists, restore from backup:
cd server
npm run backup:list
npm run backup:restore <recent-backup-file>
```

### Issue 4: Build/TypeScript Errors
```bash
# Run build to check for errors
npm run build

# If TypeScript errors, they're likely non-blocking
# App will still run in dev mode
```

---

## 📋 Verification Checklist

After setup, verify:
- [ ] Frontend loads at http://localhost:5173
- [ ] Backend responds at http://localhost:3001/api/companies
- [ ] Sample data visible (Vercel, GitHub, Stripe, etc.)
- [ ] Database file exists: `ls -lh server/crm.db`
- [ ] Backup created: `ls -lh backups/`

---

## 🔧 Available Commands

### Frontend
```bash
npm run dev        # Start development server (port 5173)
npm run build      # Build for production
npm run preview    # Preview production build
```

### Backend
```bash
cd server
npm start          # Start server (port 3001)
npm run dev        # Start with auto-reload
npm run backup     # Create manual backup
npm run backup:list # List all backups
```

---

## 📁 Project Structure

```
basepoint-crm/
├── components/          # React components
├── server/
│   ├── index.js        # Express API server
│   ├── backup.js       # Backup utility
│   ├── crm.db          # SQLite database (auto-created)
│   └── package.json
├── backups/            # Auto-created backup files
├── utils/              # Helper functions
├── types.ts            # TypeScript definitions
└── package.json
```

---

## 🎯 User's Goals

The user wants to:
1. **Manage contacts**: Companies and people
2. **Track activities**: Tasks, calls, meetings
3. **Keep data local**: No cloud, all SQLite
4. **Never lose data**: Automatic backups

---

## 💡 Pro Tips for AI Agents

### When User Asks About Data Safety
- Reassure them: Database is gitignored, never commits to Git
- Show them: `git status` won't show `server/crm.db`
- Backups: Created automatically every server start

### When User Wants to Add Real Data
- They can just start using the app
- Data persists in `server/crm.db`
- Automatic backups protect their data

### When User Asks About Moving Computers Later
- They can copy the `backups/` folder
- Restore on new machine with `npm run backup:restore`
- Or start fresh - database auto-creates with sample data

### When User Reports Errors
1. Check if both terminals are running (frontend + backend)
2. Check ports 3001 and 5173 are free
3. Verify dependencies installed: `ls node_modules` (should have many folders)
4. Try restarting both servers

---

## 🚀 Expected Behavior

### First Startup
```
Terminal 1 (Backend):
  ✅ Database backed up successfully!
  Connected to the SQLite database.
  Seeding companies...
  Seeding people...
  Seeding tasks...
  Server running on http://localhost:3001

Terminal 2 (Frontend):
  VITE v6.x.x ready in 500 ms
  ➜ Local: http://localhost:5173/
```

### Browser Opens
- Should see sidebar with: Companies, People, Activities, Deals
- Click "Companies" → See 5 sample companies
- Click "People" → See 6 sample contacts
- Can create new records, edit, delete

---

## 🔐 Security Features Already Implemented

- ✅ SQL injection protection (table whitelist)
- ✅ XSS vulnerability patches
- ✅ API error handling
- ✅ Database excluded from Git
- ✅ Automatic backups on server start

---

## 📖 Additional Documentation

If user needs more details, refer them to:
- **SETUP.md** - Comprehensive setup guide
- **DEPLOYMENT-SUMMARY.md** - Full production deployment info
- **README.md** - Project overview

---

## ⚡ TL;DR for AI Agents

1. Run: `npm install && cd server && npm install && cd ..`
2. Start backend: `cd server && npm start`
3. Start frontend: `npm run dev` (new terminal)
4. Open: http://localhost:5173
5. Done! Database auto-creates with sample data.

**User can start working immediately. Backups are automatic. Data is safe.**

---

**Last Updated**: 2026-01-16
**Version**: 1.0.0-production-ready
