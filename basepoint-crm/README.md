# Basepoint CRM

A local-first CRM application built with React, TypeScript, and SQLite. Designed for fast, offline-capable customer relationship management with automatic database backups.

## ✨ Features

- **Local-First**: All data stored locally in SQLite - no cloud dependency
- **Automatic Backups**: Database backed up every time server starts
- **Flexible Schema**: Custom objects, attributes, and relations
- **Activity Tracking**: Tasks, calls, meetings with timeline view
- **Companies & People**: Full contact management
- **Command Palette**: Quick navigation with ⌘K
- **Saved Views**: Custom filters, sorts, and layouts
- **Type-Safe**: Built with TypeScript

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd basepoint-crm

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Start the Application
```bash
# Terminal 1: Start backend
cd server
npm start

# Terminal 2: Start frontend
npm run dev
```

### 3. Open in Browser
Navigate to http://localhost:5173

## 📦 Database Backups

### Automatic Backups
- Created automatically on every server start
- Stored in `backups/` folder
- Last 30 backups kept automatically
- Named with timestamp: `crm-backup-auto-2026-01-16T10-30-00.db`

### Manual Backup
```bash
cd server
npm run backup              # Create backup
npm run backup:list         # List all backups
npm run backup:restore      # Restore from backup (requires filename)
```

## 🛡️ Data Safety

Your data is protected with:
- ✅ **Automatic backups** on server start
- ✅ **Database excluded from Git** (never committed)
- ✅ **SQL injection protection**
- ✅ **XSS vulnerability patches**
- ✅ **Backup retention** (30 most recent backups kept)

## 📋 Available Scripts

### Frontend
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

### Backend
```bash
cd server
npm start          # Start server
npm run dev        # Start with auto-reload
npm run backup     # Create manual backup
npm run backup:list # List all backups
```

## 🗂️ Project Structure

```
basepoint-crm/
├── components/          # React components
├── server/
│   ├── index.js        # Express API server
│   ├── backup.js       # Backup utility
│   ├── crm.db          # SQLite database (gitignored)
│   └── package.json    # Server dependencies
├── backups/            # Database backups (gitignored)
├── utils/              # Helper functions
├── types.ts            # TypeScript definitions
├── package.json        # Frontend dependencies
├── .gitignore          # Excludes database and backups
├── SETUP.md            # Detailed setup guide
└── README.md           # This file
```

## 🔄 Moving to a New Computer

### Method 1: Fresh Start (No Data Transfer)
```bash
git clone <repo-url>
cd basepoint-crm
npm install
cd server && npm install
npm start  # Database created automatically
```

### Method 2: Transfer Your Data
```bash
# On old computer - copy backups folder
cp -r backups /path/to/external/storage

# On new computer - after clone and install
cp -r /path/to/external/storage/backups ./
cd server
npm run backup:list  # Find your latest backup
npm run backup:restore crm-backup-auto-YYYY-MM-DD.db
```

## ⚙️ Configuration

Create `.env` file in root directory:
```env
PORT=3001                           # Server port
# DB_PATH=/custom/path/to/db.db    # Optional: Custom database location
# VITE_API_URL=http://api.domain   # Optional: Production API URL
```

## 🚨 Important Notes

### What's in Git
✅ Source code, configs, documentation

### What's NOT in Git (Protected)
❌ Database files (`*.db`)
❌ Backups folder (`backups/`)
❌ Environment variables (`.env`)
❌ Dependencies (`node_modules/`)

### Before Major Changes
Always create a manual backup:
```bash
cd server
npm run backup
```

## 🔧 Troubleshooting

**Database not found?**
- The database is created automatically on first run
- Just start the server: `cd server && npm start`

**Lost data?**
- Check `backups/` folder
- Use `npm run backup:restore <filename>` to restore

**Port already in use?**
- Change `PORT` in `.env` file
- Or kill process: `lsof -ti:3001 | xargs kill`

## 📖 Documentation

- **[SETUP.md](SETUP.md)** - Comprehensive setup and deployment guide
- **[Database_Security_Guide.md](Docs/Database_Security_Guide.md)** - Security best practices

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, SQLite3
- **UI**: Lucide Icons, DnD Kit, Recharts
- **Utils**: Chrono-node (natural language dates), date-fns

## 📄 License

Private project - Not for distribution

---

**Need Help?** Check [SETUP.md](SETUP.md) for detailed instructions and troubleshooting.
