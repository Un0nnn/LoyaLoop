# Railway Deployment Fix - CORS and 404 Issues

## Issues Fixed

### 1. CORS Policy Error
**Problem:** `Access to XMLHttpRequest has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present`

**Root Cause:**
- Backend was only allowing a single origin
- Frontend was using wrong environment variable (`VITE_BACKEND_URL` instead of `REACT_APP_API_URL`)

**Solution Applied:**

#### Backend (`/backend/index.js`)
Updated CORS configuration to support multiple origins:
```javascript
const allowedOrigins = [
    'https://loyaloop-production.up.railway.app',
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Handle preflight requests
app.options('*', cors());
```

#### Frontend (`/frontend/src/services/api.js`)
Fixed environment variable:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || "https://innovative-emotion-production-ec97.up.railway.app";
```

### 2. Frontend 404 Error
**Problem:** Frontend URL showing 404 Not Found

**Root Cause:**
- Railway didn't know how to serve the static React build
- No configuration for handling React Router client-side routing
- Missing proper start command

**Solution Applied:**

#### Created Configuration Files:

1. **`railway.json`** - Railway deployment configuration
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npx serve -s build -l $PORT -c serve.json",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

2. **`nixpacks.toml`** - Nixpacks build configuration
```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npx serve -s build -l $PORT -c serve.json"
```

3. **`serve.json`** - Serve configuration for React Router
```json
{
  "rewrites": [
    { "source": "/**", "destination": "/index.html" }
  ],
  "headers": [...]
}
```

4. **`Procfile`** - Process file for Railway
```
web: npx serve -s build -l $PORT -c serve.json
```

5. **`.env.production`** - Production environment variables
```
REACT_APP_API_URL=https://innovative-emotion-production-ec97.up.railway.app
```

#### Updated package.json
Added `serve` dependency:
```json
"dependencies": {
  ...
  "serve": "^14.2.1",
  ...
}
```

## Deployment Steps

### Backend Deployment on Railway

1. **Set Environment Variables:**
   - `JWT_SECRET`: Your JWT secret key
   - `FRONTEND_URL`: `https://loyaloop-production.up.railway.app`
   - `DATABASE_URL`: Your database connection string (if applicable)
   - `PORT`: Set by Railway automatically

2. **Deploy:**
   - Push your code to GitHub
   - Railway will auto-deploy from the backend directory
   - Start command: `node index.js $PORT`

### Frontend Deployment on Railway

1. **Set Environment Variables:**
   - `REACT_APP_API_URL`: `https://innovative-emotion-production-ec97.up.railway.app`
   - `PORT`: Set by Railway automatically

2. **Build & Deploy:**
   - Push your code to GitHub
   - Railway will:
     - Run `npm install`
     - Run `npm run build` (with CI=false)
     - Start with `npx serve -s build -l $PORT -c serve.json`

3. **Verify Deployment:**
   - Frontend: https://loyaloop-production.up.railway.app/
   - Backend: https://innovative-emotion-production-ec97.up.railway.app/
   - Test API: https://innovative-emotion-production-ec97.up.railway.app/health (if endpoint exists)

## Testing Checklist

- [ ] Backend is accessible at Railway URL
- [ ] Frontend loads without 404 error
- [ ] Login page appears correctly
- [ ] Can make API requests from frontend to backend
- [ ] No CORS errors in browser console
- [ ] React Router navigation works (no 404 on page refresh)
- [ ] API responses are received correctly

## Troubleshooting

### Still getting CORS errors?
1. Check Railway logs for the backend service
2. Verify `FRONTEND_URL` is set correctly in backend environment variables
3. Check browser console for the exact origin being blocked
4. Add the origin to `allowedOrigins` array in `backend/index.js`

### Frontend still showing 404?
1. Verify the build completed successfully in Railway logs
2. Check that `serve` package is installed (in `package.json` dependencies)
3. Ensure `serve.json` is present in the frontend directory
4. Check Railway start command is using the Procfile or nixpacks.toml

### API calls failing?
1. Check `.env.production` has correct `REACT_APP_API_URL`
2. Verify backend is running (check Railway dashboard)
3. Test backend directly with curl or Postman
4. Check browser Network tab for the actual API URL being called

## Files Modified

### Backend
- `/backend/index.js` - Updated CORS configuration

### Frontend
- `/frontend/src/services/api.js` - Fixed environment variable
- `/frontend/package.json` - Added serve dependency, updated build script
- `/frontend/.env.production` - Added production API URL
- `/frontend/railway.json` - Created
- `/frontend/nixpacks.toml` - Created
- `/frontend/serve.json` - Created
- `/frontend/Procfile` - Created

## Next Steps

1. **Commit and push all changes:**
```bash
git add .
git commit -m "Fix CORS and Railway deployment configuration"
git push origin main
```

2. **Redeploy on Railway:**
   - Railway will automatically detect the changes and redeploy
   - Watch the deployment logs to ensure build succeeds

3. **Test the application:**
   - Visit https://loyaloop-production.up.railway.app/
   - Try logging in
   - Verify all features work correctly

## Important Notes

- Railway automatically sets the `$PORT` environment variable
- The `serve` package handles SPA routing with the `serve.json` configuration
- CORS is configured to allow localhost for development and Railway URLs for production
- CSP (Content Security Policy) is disabled in helmet to allow cross-origin requests during development
- For production, consider enabling stricter CSP policies

## Support

If issues persist:
1. Check Railway deployment logs (both frontend and backend)
2. Review browser console for errors
3. Test API endpoints directly with curl/Postman
4. Verify all environment variables are set correctly in Railway dashboard

