# Securing Database Access

To prevent AI agents or unauthorized access to sensitive customer data, you should move the database file outside of the project directory when running on your corporate laptop.

## Steps

### 1. Move the Database File

Locate the `crm.db` file in `basepoint-crm/server/`. Move it to a secure location on your machine that is **outside** of the Local CRM project folder.

**Example:**
Move `crm.db` from:
`/Users/yourname/Downloads/Local CRM/basepoint-crm/server/crm.db`
To:
`/Users/yourname/Documents/Secure/crm.db`

### 2. Configure the Server

You need to tell the server where the database is now located. You can do this by setting the `DB_PATH` environment variable.

#### Option A: Using a `.env` file (Recommended)
1. Create a file named `.env` inside the `basepoint-crm/server/` directory.
2. Add the following line to the file:
   ```env
   DB_PATH=/Users/yourname/Documents/Secure/crm.db
   ```
   *(Replace the path with the actual location where you moved the file)*

#### Option B: Passing it via command line
When starting the server, you can pass the variable directly:
```bash
DB_PATH="/Users/yourname/Documents/Secure/crm.db" npm start
```

### 3. Verify
Start the application normally. The server should connect to the database at the new secure location. If the file is not found at the specified `DB_PATH`, or if `DB_PATH` is not set and the default file is missing, the server will create a new empty database.
