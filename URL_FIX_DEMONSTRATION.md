# Fix: Double /api/api/ URL Generation

## Problem
URLs were being generated with a double `/api/api/` prefix, causing 404 errors:

```
❌ BEFORE: https://fabricantes.asset-fy.com/api/api/apoderado/files/SW1hZ2VuUHJpbmNpcGFsL1N0aWhsL1JFXzkvMTc1ODgxNTg4MDAwNC1SRV85MC5qcGc=?token=...
```

## Root Cause
In `client/src/utils/getAuthenticatedUrl.js`:
- The `DEFAULT_API_BASE` was set to `'https://fabricantes.asset-fy.com/api'` (WITH `/api` at the end)
- Backend generates URLs starting with `/api/apoderado/files/...`
- When concatenating: `baseUrl + url` resulted in duplicate `/api`

## Solution
Changed `DEFAULT_API_BASE` to remove the `/api` suffix:

```javascript
// BEFORE
const DEFAULT_API_BASE = 'https://fabricantes.asset-fy.com/api';

// AFTER
const DEFAULT_API_BASE = 'https://fabricantes.asset-fy.com';
```

## Result
URLs are now correctly generated:

```
✅ AFTER: https://fabricantes.asset-fy.com/api/apoderado/files/SW1hZ2VuUHJpbmNpcGFsL1N0aWhsL1JFXzkvMTc1ODgxNTg4MDAwNC1SRV85MC5qcGc=?token=...
```

## Files Modified
- `client/src/utils/getAuthenticatedUrl.js` - Updated DEFAULT_API_BASE constant

## Testing
All existing tests pass:
- ✅ 9/9 tests in `UserHeader.utils.test.js` passing
- ✅ URL generation correctly handles relative API paths
- ✅ Token authentication still works properly
- ✅ External URLs are not affected

## Example URLs Fixed
The following URL patterns now work correctly:
- `/api/apoderado/files/[base64-encoded-path]` → `https://fabricantes.asset-fy.com/api/apoderado/files/...`
- `/api/auth/login` → `https://fabricantes.asset-fy.com/api/auth/login`
- `/api/admin/fabricantes` → `https://fabricantes.asset-fy.com/api/admin/fabricantes`

## Environment Variable Support
If you need to override the API URL, set `REACT_APP_API_URL` environment variable:
- **Correct**: `REACT_APP_API_URL=https://fabricantes.asset-fy.com` (without `/api`)
- **Incorrect**: `REACT_APP_API_URL=https://fabricantes.asset-fy.com/api` (with `/api` - will cause double prefix)

## Compatibility
This change is fully backward compatible with the existing codebase:
- ✅ Works with current backend API routes
- ✅ Works with proxy setup in development
- ✅ Works with production deployment
- ✅ No changes needed to other components
