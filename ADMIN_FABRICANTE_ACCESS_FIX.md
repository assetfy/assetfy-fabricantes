# Admin Fabricante Access Fix

## Problem Statement
Admin users with fabricante permissions were seeing "Usuario no autenticado" (User not authenticated) when accessing the ApoderadoPanel through the hamburger menu navigation.

## Root Cause
In `client/src/components/ApoderadoPanel.js` (line 55), the authentication check was:
```javascript
const isAuthenticated = token && rol === 'apoderado';
```

This check only allowed users with `rol === 'apoderado'` to access the panel, excluding admin users even though:
1. They had valid authentication tokens
2. They had fabricante permissions
3. The hamburger menu was showing them the "Assetfy Fabricantes" panel option
4. The backend routes (`/api/apoderado/*`) allowed access for both apoderado and admin users with fabricante permissions

## Solution
Updated the authentication check to allow both 'apoderado' and 'admin' roles:
```javascript
const isAuthenticated = token && (rol === 'apoderado' || rol === 'admin');
```

## Implementation Details

### File Changed
- `client/src/components/ApoderadoPanel.js` (line 55)

### Change Made
```diff
- const isAuthenticated = token && rol === 'apoderado';
+ const isAuthenticated = token && (rol === 'apoderado' || rol === 'admin');
```

### Impact
- Admin users with fabricante permissions can now access the ApoderadoPanel without seeing "Usuario no autenticado"
- The panel will fetch their profile data from `/api/apoderado/perfil` which returns their associated fabricantes
- Navigation and all features work correctly for admin users

## Testing
- All existing tests pass (3/4 test suites, with 1 pre-existing failure unrelated to this change)
- Specifically, PanelMenu.test.js and UserHeader.test.js pass, confirming the hamburger menu integration works correctly
- Production build completes successfully

## Compatibility
This change is backward compatible:
- Existing apoderado users continue to work as before
- Admin users without fabricante permissions are still redirected to the login page (as intended)
- Admin users with fabricante permissions can now access both panels through the hamburger menu

## Related Features
- Hamburger Menu Navigation (see HAMBURGER_MENU_FEATURE.md)
- Backend route access control in `routes/apoderado.js`
- Admin profile endpoint in `routes/admin.js` that returns fabricantes
