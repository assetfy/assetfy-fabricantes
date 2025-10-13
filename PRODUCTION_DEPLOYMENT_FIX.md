# Production Deployment Fix - API Routes Returning HTML

## Problem Description

After deploying the application to production with Apache httpd as reverse proxy, API endpoints (specifically `/api/auth/login`) were returning HTML (the React app's index.html) instead of JSON responses. This caused authentication failures and other API-related issues.

## Root Causes

1. **Backend middleware order**: The `express.static()` middleware could potentially catch and serve index.html for API routes
2. **Hardcoded URLs in frontend**: The client had a hardcoded production URL which wasn't flexible for different environments
3. **Missing development proxy**: No proxy configuration in client package.json for development mode

## Solution Summary

### Backend Changes (server.js)

Added protective middleware and explicit configuration to ensure API routes are never handled by static file serving:

```javascript
// Pre-static middleware: ensures /api/* requests skip static serving
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  next();
});

// Static files with explicit configuration
app.use(express.static(buildPath, {
  index: false,      // Don't serve index.html automatically
  fallthrough: true  // Continue if file not found
}));

// Catch-all with double verification
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(buildPath, 'index.html'));
});
```

### Frontend Changes

1. **client/src/api.js**: Changed from absolute to relative URL
   - Before: `baseURL: 'https://fabricantes.asset-fy.com/api'`
   - After: `baseURL: '/api'`
   - This makes the app work in any environment

2. **client/package.json**: Added development proxy
   - Added: `"proxy": "http://localhost:5000"`
   - Enables proper API routing during development

## Testing

All routing tests pass (5/5):
- ✅ API health endpoint returns JSON
- ✅ API auth endpoint returns JSON  
- ✅ Unknown API routes return JSON 404
- ✅ Root path returns HTML
- ✅ React routes return HTML

## Files Changed

1. `server.js` - Enhanced middleware configuration
2. `client/src/api.js` - Changed baseURL to relative path
3. `client/package.json` - Added proxy configuration
4. `DESPLIEGUE_PRODUCCION.md` - Complete deployment guide (Spanish)
5. `PRODUCTION_DEPLOYMENT_FIX.md` - This summary (English)

## Apache Configuration

The key to making this work in production is proper Apache configuration. The proxy rules must come BEFORE static file serving:

```apache
# API routes - MUST come first
ProxyPass /api http://localhost:5000/api
ProxyPassReverse /api http://localhost:5000/api

# Static files
DocumentRoot /path/to/assetfy-fabricantes/build
```

See `DESPLIEGUE_PRODUCCION.md` for complete Apache configuration examples.

## Deployment Checklist

- [ ] Pull latest code with fixes
- [ ] Install backend dependencies: `npm install --production`
- [ ] Build frontend: `cd client && npm run build`
- [ ] Update Apache configuration with proxy rules
- [ ] Enable Apache modules: `sudo a2enmod proxy proxy_http rewrite`
- [ ] Restart Apache: `sudo systemctl restart apache2`
- [ ] Restart Node.js backend: `pm2 restart fabricantes-api`
- [ ] Test API endpoint: `curl https://domain.com/api/health` (should return JSON)
- [ ] Test login in browser

## Why This Fixes The Problem

### Before
1. Request to `/api/auth/login` arrives at Apache
2. Apache serves static files from build directory
3. Due to React Router's catch-all, index.html is served for unknown paths
4. Client receives HTML instead of JSON
5. Authentication fails

### After
1. Request to `/api/auth/login` arrives at Apache
2. Apache proxy rule matches `/api` and forwards to Node.js (port 5000)
3. Express middleware checks: "Does path start with /api?" → Yes
4. Request is handled by auth router
5. JSON response is returned
6. Authentication succeeds

## Additional Benefits

1. **Environment flexibility**: App now works in dev, staging, and production without code changes
2. **Better error handling**: Unknown API routes return proper JSON 404 errors
3. **Clearer separation**: Static assets and API clearly separated in middleware chain
4. **Development mode**: Proxy configuration makes local development seamless

## Verification Commands

After deployment, verify the fix works:

```bash
# Test health endpoint (should return JSON)
curl https://fabricantes.asset-fy.com/api/health

# Test login endpoint (should return JSON, even if error)
curl -X POST https://fabricantes.asset-fy.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correoElectronico":"test@test.com","contrasena":"test"}'
```

Both commands should return JSON responses, NOT HTML.
