# Backend ES Module Conversion - Complete Guide

## Problem
Railway deployment was failing with error:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/app/src/routes/userRoutes'
SyntaxError: The requested module does not provide an export named 'default'
```

## Root Cause
The backend was mixing CommonJS (`require`/`module.exports`) and ES modules (`import`/`export`), which caused module loading failures.

## Solution: Complete Conversion to ES Modules

### 1. Updated package.json
Added `"type": "module"` to enable ES modules:

```json
{
  "name": "cssu-rewards",
  "type": "module",
  ...
}
```

### 2. Updated index.js
Added `.js` extensions to all imports:

```javascript
import userRoutes from "./src/routes/userRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import transactionRoutes from "./src/routes/transactionRoutes.js";
import eventRoutes from "./src/routes/eventRoutes.js";
import promotionRoutes from "./src/routes/promotionRoutes.js";
```

### 3. Converted Route Files
Updated all route files in `/src/routes/`:

**Before (CommonJS):**
```javascript
const express = require("express");
const AuthController = require("../controllers/authController");
module.exports = router;
```

**After (ES Modules):**
```javascript
import express from "express";
import AuthController from "../controllers/authController.js";
export default router;
```

**Files converted:**
- `authRoutes.js`
- `userRoutes.js`
- `transactionRoutes.js`
- `eventRoutes.js`
- `promotionRoutes.js`

### 4. Converted Controller Files
Updated all controller files in `/src/controllers/`:

**Before (CommonJS):**
```javascript
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
exports.createUser = async (req, res) => { ... };
```

**After (ES Modules):**
```javascript
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
export const createUser = async (req, res) => { ... };

export default {
  createUser,
  // ... other functions
};
```

**Files converted:**
- `authController.js` - Manual conversion with named + default exports
- `userController.js` - Automated conversion
- `eventController.js` - Automated conversion
- `promotionController.js` - Automated conversion
- `transactionController.js` - Automated conversion

### 5. Converted Middleware
Updated `/src/auth/userAuthentication.js`:

**Before:**
```javascript
const jwt = require("jsonwebtoken");
module.exports = authMiddleware;
```

**After:**
```javascript
import jwt from "jsonwebtoken";
export default authMiddleware;
```

### 6. Fixed authController nodemailer Import
Changed from top-level await (not allowed) to IIFE:

```javascript
let mailer = null;
(async () => {
    try {
        const { default: nodemailer } = await import('nodemailer');
        // ... setup mailer
    } catch (e) {
        // mailer remains null
    }
})();
```

## Key Rules for ES Modules

1. **Always include `.js` extensions** in imports
   ```javascript
   import something from "./path/to/file.js";  // ✅ Correct
   import something from "./path/to/file";      // ❌ Wrong
   ```

2. **Use `import` instead of `require`**
   ```javascript
   import express from "express";              // ✅ Correct
   const express = require("express");         // ❌ Wrong
   ```

3. **Use `export` instead of `module.exports`**
   ```javascript
   export default something;                   // ✅ Correct
   export const func = () => {};              // ✅ Correct
   module.exports = something;                 // ❌ Wrong
   ```

4. **Package.json must have `"type": "module"`**

5. **Top-level await** only works in:
   - Module scope (not script scope)
   - Inside async functions
   - Use IIFE for conditional imports

## Files Modified

### Backend Core
- `/backend/package.json` - Added `"type": "module"`
- `/backend/index.js` - Added `.js` extensions to imports, updated CORS

### Routes (5 files)
- `/backend/src/routes/authRoutes.js`
- `/backend/src/routes/userRoutes.js`
- `/backend/src/routes/transactionRoutes.js`
- `/backend/src/routes/eventRoutes.js`
- `/backend/src/routes/promotionRoutes.js`

### Controllers (5 files)
- `/backend/src/controllers/authController.js`
- `/backend/src/controllers/userController.js`
- `/backend/src/controllers/eventController.js`
- `/backend/src/controllers/promotionController.js`
- `/backend/src/controllers/transactionController.js`

### Middleware (1 file)
- `/backend/src/auth/userAuthentication.js`

## Testing

### Start Backend Locally
```bash
cd /home/ali-gill/Documents/LoyaLoop/backend
node index.js 3001
```

Expected output:
```
Server running on port 3001
```

### Test API Endpoint
```bash
curl http://localhost:3001/health
```

## Railway Deployment

### Environment Variables Required
- `JWT_SECRET` - Your JWT secret key
- `FRONTEND_URL` - `https://loyaloop-production.up.railway.app`
- `DATABASE_URL` - Database connection string
- `PORT` - Set automatically by Railway

### Deployment Steps
1. Commit all changes:
   ```bash
   git add .
   git commit -m "Convert backend to ES modules for Railway deployment"
   git push origin main
   ```

2. Railway will automatically:
   - Detect `"type": "module"` in package.json
   - Install dependencies
   - Start with: `node index.js $PORT`

3. Check Railway logs for successful start

## Common Errors and Fixes

### Error: Cannot find module 'X'
**Fix:** Add `.js` extension to the import statement

### Error: Does not provide export named 'default'
**Fix:** Add `export default { ... }` to the module

### Error: Top-level await
**Fix:** Wrap in async IIFE or move inside async function

### Error: require is not defined
**Fix:** Convert `require()` to `import` statements

## Verification Checklist

- [ ] Backend starts without errors locally
- [ ] All routes are accessible
- [ ] CORS allows frontend origin
- [ ] Railway deployment succeeds
- [ ] API endpoints respond correctly
- [ ] Frontend can connect to backend

## Rollback Plan

If ES modules cause issues, you can:

1. Remove `"type": "module"` from package.json
2. Change all `import` back to `require`
3. Change all `export` back to `module.exports`
4. Remove `.js` extensions from imports

However, Railway requires ES modules for modern Node.js deployments, so this conversion is necessary for production.

## Additional Notes

- ES modules are the future of Node.js
- Better tree-shaking and optimization
- Required for Railway's Nixpacks builder
- Enables modern JavaScript features
- Better IDE support and type checking

## Support

If backend still fails to start:
1. Check Railway logs for specific error
2. Verify all imports have `.js` extensions
3. Ensure package.json has `"type": "module"`
4. Test locally first before deploying

