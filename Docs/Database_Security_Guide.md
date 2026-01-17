# Database Security Guide

To prevent AI agents from accessing sensitive data when moving to your corporate laptop, store the database file outside the project folder.

## 1. Move the Database
Move `crm.db` from `basepoint-crm/server/` to a secure location outside the project.
*Example: `~/Documents/Secure/crm.db`*

## 2. Configure the Path
Tell the server where the file is by setting the `DB_PATH` environment variable.

### Option A: .env File (Recommended)
Create `basepoint-crm/server/.env` and add:
```env
DB_PATH=/Users/yourname/Documents/Secure/crm.db
```

### Option B: Command Line
Start the server with:
```bash
DB_PATH="/Users/yourname/Documents/Secure/crm.db" npm start
```

## 3. Verify
The server will now use the file at the new path. If not found, it will create a new empty database at that location.
