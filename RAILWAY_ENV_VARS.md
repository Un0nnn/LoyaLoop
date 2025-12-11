# Railway Environment Variables Required

## Backend Service

### Required Variables:

```bash
# JWT Secret for authentication
JWT_SECRET=your-secret-key-here

# Frontend URL for CORS
FRONTEND_URL=https://loyaloop-production.up.railway.app

# Database URL for SQLite
DATABASE_URL=file:/app/data/prod.db

# PORT is automatically set by Railway
# PORT=3001  (set automatically, don't override)
```

### How to Set in Railway:

1. Go to Railway dashboard
2. Click on backend service
3. Go to "Variables" tab
4. Click "New Variable"
5. Add each variable above

### Important Notes:

- **JWT_SECRET**: Use a strong random string in production
- **DATABASE_URL**: For SQLite, use an absolute path like `file:/app/data/prod.db`
- **PORT**: Railway sets this automatically, don't override it
- **FRONTEND_URL**: Must match your frontend Railway URL exactly

### For SQLite on Railway:

SQLite on Railway has limitations:
- Files are ephemeral (lost on redeploy)
- Not recommended for production
- Better to use Railway's PostgreSQL addon

### To Use PostgreSQL Instead (Recommended):

1. In Railway dashboard, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically create DATABASE_URL
4. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
5. Run migrations

### Current Setup (SQLite):

The app is configured to use SQLite. Set this in Railway:

```bash
DATABASE_URL=file:/app/prisma/dev.db
```

⚠️ **Warning**: SQLite data will be lost on each deployment. Consider PostgreSQL for production.

