#!/bin/bash

echo "🔍 Basepoint CRM - Setup Verification"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Database excluded from git
echo "1️⃣  Checking database gitignore..."
if git check-ignore server/crm.db > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Database is properly gitignored${NC}"
else
    echo -e "   ${RED}❌ WARNING: Database may not be gitignored!${NC}"
fi

# Check 2: Backups folder excluded
echo "2️⃣  Checking backups folder gitignore..."
if git check-ignore backups/ > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Backups folder is properly gitignored${NC}"
else
    echo -e "   ${YELLOW}⚠️  Backups folder may not be gitignored${NC}"
fi

# Check 3: Node modules installed
echo "3️⃣  Checking dependencies..."
if [ -d "node_modules" ]; then
    echo -e "   ${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "   ${RED}❌ Frontend dependencies missing - run: npm install${NC}"
fi

if [ -d "server/node_modules" ]; then
    echo -e "   ${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "   ${RED}❌ Backend dependencies missing - run: cd server && npm install${NC}"
fi

# Check 4: Backup script exists
echo "4️⃣  Checking backup system..."
if [ -f "server/backup.js" ]; then
    echo -e "   ${GREEN}✅ Backup utility installed${NC}"
else
    echo -e "   ${RED}❌ Backup utility missing${NC}"
fi

# Check 5: Documentation exists
echo "5️⃣  Checking documentation..."
if [ -f "SETUP.md" ]; then
    echo -e "   ${GREEN}✅ Setup guide exists${NC}"
else
    echo -e "   ${YELLOW}⚠️  Setup guide missing${NC}"
fi

# Check 6: .env.example exists
echo "6️⃣  Checking environment template..."
if [ -f ".env.example" ]; then
    echo -e "   ${GREEN}✅ Environment template exists${NC}"
else
    echo -e "   ${YELLOW}⚠️  .env.example missing${NC}"
fi

echo ""
echo "======================================"
echo "✨ Verification complete!"
echo ""
echo "📝 Next Steps:"
echo "   1. Review any warnings above"
echo "   2. Create a backup: cd server && npm run backup"
echo "   3. Commit changes: git add . && git commit -m 'Setup complete'"
echo "   4. Push to GitHub: git push origin main"
echo ""
