# Pre-Push Checklist

## ✅ Before Pushing to GitHub

Run these checks to ensure you're not committing sensitive data:

### 1. Verify Database is Excluded
```bash
git status | grep "\.db"
```
**Expected output**: Should NOT show any `.db` files in "Changes to be committed"
- If you see `server/crm.db` or any `.db` files, STOP and run:
  ```bash
  git rm --cached server/crm.db
  git rm --cached **/*.db
  ```

### 2. Check Backups Folder is Excluded
```bash
git status | grep backups
```
**Expected output**: Should NOT show `backups/` folder
- Backups folder should be gitignored automatically

### 3. Verify Environment Files Excluded
```bash
git status | grep "\.env"
```
**Expected output**: Should NOT show `.env` or `.env.local` files
- If you see any `.env` files, STOP and run:
  ```bash
  git rm --cached .env
  git rm --cached .env.local
  ```

### 4. Create a Backup Before Push
```bash
cd server
npm run backup
```
**Why**: Safety measure in case something goes wrong

### 5. Review What Will Be Committed
```bash
git status
git diff --cached
```
**Check for**:
- ❌ No database files
- ❌ No backup files
- ❌ No `.env` files
- ❌ No sensitive API keys or credentials
- ✅ Only source code and configs

---

## 🚀 Safe to Push

Once all checks pass:
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

---

## 🚨 If You Accidentally Committed the Database

If you already committed the database file:

### Before Pushing (Easy Fix)
```bash
# Undo the commit but keep changes
git reset --soft HEAD~1

# Remove database from staging
git rm --cached server/crm.db

# Commit again without database
git add .
git commit -m "Your commit message"
```

### After Pushing (Harder Fix - Requires Force Push)
```bash
# CAUTION: This rewrites history
git reset --soft HEAD~1
git rm --cached server/crm.db
git commit -m "Remove accidentally committed database"
git push --force origin main
```

⚠️ **Warning**: Force push can cause issues if others are using the repo. Use with caution.

---

## 📋 Quick Reference

### What SHOULD be in Git
- ✅ Source code (`.tsx`, `.ts`, `.jsx`, `.js`)
- ✅ Configuration files (`package.json`, `tsconfig.json`, `vite.config.ts`)
- ✅ Documentation (`.md` files)
- ✅ `.gitignore`
- ✅ `.env.example` (template, no real values)

### What should NEVER be in Git
- ❌ Database files (`*.db`, `*.db-shm`, `*.db-wal`)
- ❌ Backups folder (`backups/`)
- ❌ Environment variables (`.env`, `.env.local`)
- ❌ Dependencies (`node_modules/`)
- ❌ Build output (`dist/`)
- ❌ Sensitive credentials or API keys

---

## 🔒 Security Best Practices

1. **Never commit real credentials**: Use `.env` files (which are gitignored)
2. **Always use `.env.example`**: Provide templates without real values
3. **Review changes before commit**: Use `git diff` to check what's being added
4. **Create backups regularly**: Especially before major changes
5. **Keep database local**: Your data stays on your machine only

---

**Remember**: Once something is pushed to GitHub, it's in the history forever (even if you delete it later). Better to be safe than sorry!
