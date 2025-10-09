# Multi-Role User Support Feature

## Overview

This feature enables users to have multiple roles simultaneously. A user can now be assigned any combination of roles (admin, apoderado, usuario_bienes) and will see all the panels they have access to through the hamburger menu.

## Key Changes

### Backend Changes

#### 1. Model Update: `models/usuario.model.js`
- Changed `rol` field from a single String to `roles` Array
- Old: `rol: { type: String, enum: ['admin', 'apoderado', 'usuario_bienes'], default: 'apoderado' }`
- New: `roles: [{ type: String, enum: ['admin', 'apoderado', 'usuario_bienes'] }]`

#### 2. Helper Functions: `utils/roleHelper.js`
Created reusable helper functions for role checking:
- `hasRole(userRoles, requiredRole)` - Check if user has a specific role
- `hasAnyRole(userRoles, requiredRoles)` - Check if user has any of the specified roles
- `hasAllRoles(userRoles, requiredRoles)` - Check if user has all of the specified roles
- `getPrimaryRole(userRoles)` - Get primary role for backward compatibility (priority: admin > apoderado > usuario_bienes)

#### 3. Updated Routes
All role checks in backend routes have been updated to use the new helper functions:

**routes/auth.js:**
- Login endpoint now returns both `roles` array and `rol` (primary) for backward compatibility
- JWT payload includes `roles` array instead of single `rol`

**routes/admin.js:**
- All admin role checks updated to use `hasRole(usuario.roles, 'admin')`
- User creation/update endpoints support both `roles` (array) and `rol` (single) for backward compatibility
- Profile endpoints return both `roles` array and primary `rol`

**routes/usuario.js:**
- All usuario_bienes role checks updated to use `hasRole(usuario.roles, 'usuario_bienes')`
- Middleware updated to check roles array
- All endpoints continue to filter by `usuario: req.usuario.id`, ensuring users only see their own assets

#### 4. Migration Script: `migrate-roles-to-array.js`
- Converts existing single `rol` values to `roles` arrays
- Safe to run multiple times (checks for already migrated users)
- Run with: `node migrate-roles-to-array.js`

### Frontend Changes

#### 1. Login Component: `client/src/components/Login.js`
- Stores both `roles` array and primary `rol` in localStorage
- Navigation logic updated to check roles array

#### 2. App Routing: `client/src/App.js`
- `ProtectedRoutes` component parses `roles` array from localStorage
- Falls back to single `rol` if `roles` array not available
- Uses `hasAnyRole()` helper to check permissions

#### 3. Private Routes: `client/src/components/PrivateRoute.js`
- Updated to check if user has any of the allowed roles
- Parses `roles` array from localStorage with fallback to single `rol`

#### 4. Panel Menu: `client/src/components/PanelMenu.js`
- Reads `roles` array from localStorage
- Shows all panels user has access to based on their roles
- Priority order: Admin panel first, then Fabricantes, then Bienes
- Example: A user with `['admin', 'usuario_bienes']` will see both Admin and Bienes panels

#### 5. User Forms
**UserForm.js (Create User):**
- Changed from single-select dropdown to multi-select for roles
- Defaults to `['apoderado']` if no role selected
- Help text explains multi-selection (Ctrl/Cmd + Click)

**UserEditForm.js (Edit User):**
- Updated to support multi-select for roles
- Preserves existing roles when editing
- Backward compatible with old single `rol` field

#### 6. User List: `client/src/components/UserList.js`
- Displays roles as comma-separated string
- Filter updated to check if user has the selected role (works with both single and array)
- Example display: "admin, usuario_bienes"

## Backward Compatibility

The implementation maintains full backward compatibility:

1. **Database**: Old users with `rol` field will be migrated to `roles` array
2. **API Responses**: Include both `roles` array and primary `rol`
3. **Client Storage**: Stores both formats in localStorage
4. **Forms**: Accept both `rol` (single) and `roles` (array) from API

## Security Verification

### Usuario Bienes Access Control
All usuario_bienes endpoints correctly filter by user ID:

- `GET /api/usuario/bienes` - Line 145: `Bien.find({ usuario: req.usuario.id })`
- `GET /api/usuario/bienes/:id` - Line 402: `Bien.findOne({ _id: req.params.id, usuario: req.usuario.id })`
- `PUT /api/usuario/bienes/:id` - Line 439: `Bien.findOne({ _id: req.params.id, usuario: req.usuario.id })`
- `DELETE /api/usuario/bienes/:id` - Line 514: `Bien.findOne({ _id: req.params.id, usuario: req.usuario.id })`

✅ **Verification**: Usuario_bienes users can only view, edit, and delete their own bienes.

## Migration Steps

1. **Run migration script** to convert existing users:
   ```bash
   node migrate-roles-to-array.js
   ```

2. **No code changes needed** - The system handles both old and new formats

3. **Existing users**: Will continue to work with their current role converted to array

## Usage Examples

### Creating a User with Multiple Roles

**Via API:**
```json
POST /api/admin/usuarios/add
{
  "nombreCompleto": "Juan Pérez",
  "cuil": "20-12345678-9",
  "correoElectronico": "juan@example.com",
  "contraseña": "password123",
  "roles": ["admin", "usuario_bienes"]
}
```

**Via UI:**
- Select multiple roles using Ctrl/Cmd + Click in the Roles multi-select field

### What the User Will See

A user with roles `['admin', 'usuario_bienes']` will see in the hamburger menu:
- ✅ Assetfy Admin (Panel de administración)
- ✅ Assetfy Bienes (Panel de gestión de bienes)

A user with roles `['apoderado', 'usuario_bienes']` will see:
- ✅ Assetfy Fabricantes (Panel de gestión de fabricantes)
- ✅ Assetfy Bienes (Panel de gestión de bienes)

## Testing

### Build Status
✅ Frontend build successful with no errors

### Test Results
```
Test Suites: 3 passed, 4 total (1 pre-existing failure)
Tests: 24 passed, 25 total
```

### Manual Testing Checklist
- [ ] Run migration script to convert existing users
- [ ] Create new user with single role - verify panel access
- [ ] Create new user with multiple roles - verify panel access
- [ ] Edit existing user to add roles - verify panel access changes
- [ ] Login with multi-role user - verify hamburger menu shows all panels
- [ ] Switch between panels - verify each panel works correctly
- [ ] Usuario_bienes user - verify can only see their own bienes
- [ ] Admin with usuario_bienes role - verify can access both panels

## Files Modified

### Backend
- `models/usuario.model.js`
- `routes/auth.js`
- `routes/admin.js`
- `routes/usuario.js`
- `utils/roleHelper.js` (new)
- `migrate-roles-to-array.js` (new)

### Frontend
- `client/src/App.js`
- `client/src/components/Login.js`
- `client/src/components/PrivateRoute.js`
- `client/src/components/PanelMenu.js`
- `client/src/components/UserForm.js`
- `client/src/components/UserEditForm.js`
- `client/src/components/UserList.js`

## Future Enhancements

Potential improvements for future versions:
- Role-based permissions for specific features within panels
- Custom role creation
- Time-limited role assignments
- Role delegation system
- Audit log for role changes
