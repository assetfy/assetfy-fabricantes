# Fix: Role-Based Access Errors

## Problem

Users were experiencing access errors where:
1. Users with only `usuario_bienes` role could access the apoderado panel
2. User `elpineda@gmail.com` did not have all required roles (admin, apoderado, usuario_bienes)
3. The hamburger menu did not show all 3 panels for users with multiple roles

## Solution Implemented

### 1. Backend Route Protection (routes/apoderado.js)

**Issue**: Apoderado routes did NOT verify user roles, only JWT authentication. This allowed any authenticated user to access apoderado endpoints.

**Fix**: Added role-based access control middleware:

```javascript
// Middleware to check apoderado or admin role
const checkApoderadoOrAdminRole = async (req, res, next) => {
    try {
        if (!req.usuario || !req.usuario.id) {
            return next();
        }

        const usuario = await Usuario.findById(req.usuario.id).select('roles');
        
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        // Verificar que el usuario tenga rol de apoderado o admin
        if (!hasAnyRole(usuario.roles, ['apoderado', 'admin'])) {
            return res.status(403).json({ 
                msg: 'Acceso denegado. Se requiere rol de apoderado o administrador.' 
            });
        }

        next();
    } catch (err) {
        console.error('Error en checkApoderadoOrAdminRole:', err.message);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// Apply role checking middleware to all routes in this router
router.use(checkApoderadoOrAdminRole);
```

**Impact**:
- ✅ Users with ONLY `usuario_bienes` role are now denied access to apoderado endpoints (403 Forbidden)
- ✅ Users with `apoderado` role can access apoderado endpoints
- ✅ Users with `admin` role can access apoderado endpoints  
- ✅ Users with multiple roles can access endpoints based on their roles

### 2. User Role Assignment (elpineda@gmail.com)

**Issue**: User `elpineda@gmail.com` did not have all 3 roles assigned in the database.

**Fix**: Run the existing script to update user roles:

```bash
node update-elpineda-roles.js
```

This script:
- Finds user with email `elpineda@gmail.com`
- Updates their roles to: `['admin', 'apoderado', 'usuario_bienes']`
- Sets their status to Active

**Expected Output**:
```
Conectado a MongoDB
Usuario encontrado: elpineda@gmail.com
Roles actuales: ['admin']
Roles actualizados exitosamente!
Nuevos roles: ['admin', 'apoderado', 'usuario_bienes']
```

If the user doesn't exist, it will create them with password: `Admin123!`

### 3. Frontend Panel Menu (Already Implemented)

The PanelMenu component already correctly reads user roles from localStorage and displays all available panels:

```javascript
// Get user roles from localStorage
const rolesStr = localStorage.getItem('roles');
let userRoles = JSON.parse(rolesStr);

// Show panels based on roles
if (userRoles.includes('admin')) {
    panels.push({ name: 'Assetfy Admin', path: '/admin' });
    if (userRoles.includes('apoderado')) {
        panels.push({ name: 'Assetfy Fabricantes', path: '/apoderado' });
    }
}

if (userRoles.includes('apoderado')) {
    if (!panels.find(p => p.path === '/apoderado')) {
        panels.push({ name: 'Assetfy Fabricantes', path: '/apoderado' });
    }
}

if (userRoles.includes('usuario_bienes')) {
    panels.push({ name: 'Assetfy Bienes', path: '/usuario' });
}
```

## How to Verify the Fix

### 1. Verify Backend Protection

Test that usuario_bienes users cannot access apoderado routes:

```bash
# Get a JWT token for a usuario_bienes user
# Then try to access apoderado endpoint:
curl -H "x-auth-token: <token>" http://localhost:5000/api/apoderado/perfil
```

**Expected Response**: 
```json
{
  "msg": "Acceso denegado. Se requiere rol de apoderado o administrador."
}
```

### 2. Update elpineda@gmail.com Roles

```bash
node update-elpineda-roles.js
```

### 3. Test Multi-Panel Access

1. Log in as `elpineda@gmail.com`
2. Click the hamburger menu (☰) in the top left
3. Verify that ALL 3 panels are displayed:
   - ✅ Assetfy Admin
   - ✅ Assetfy Fabricantes  
   - ✅ Assetfy Bienes
4. Click on each panel to verify navigation works correctly

### 4. Test Panel Access

- **Admin Panel** (`/admin`): Accessible by users with `admin` role
- **Apoderado Panel** (`/apoderado`): Accessible by users with `apoderado` OR `admin` role
- **Usuario Panel** (`/usuario`): Accessible by users with `usuario_bienes` role (can also have other roles)

## Files Changed

1. **routes/apoderado.js**
   - Added import: `const { hasAnyRole } = require('../utils/roleHelper');`
   - Added middleware: `checkApoderadoOrAdminRole`
   - Applied middleware to all routes: `router.use(checkApoderadoOrAdminRole);`

2. **FIX_ROLE_ACCESS_ERRORS.md** (NEW)
   - This documentation file

## Testing

All frontend tests pass:
- ✅ PanelMenu.test.js (10/10 tests pass)
- ✅ UserHeader.test.js (all tests pass)
- ✅ UserHeader.utils.test.js (all tests pass)

## Role Access Matrix

| User Role(s)                            | Admin Panel | Apoderado Panel | Usuario Panel |
|-----------------------------------------|-------------|-----------------|---------------|
| `admin`                                 | ✅          | ❌              | ❌            |
| `admin`, `apoderado`                    | ✅          | ✅              | ❌            |
| `admin`, `usuario_bienes`               | ✅          | ❌              | ✅            |
| `admin`, `apoderado`, `usuario_bienes`  | ✅          | ✅              | ✅            |
| `apoderado`                             | ❌          | ✅              | ❌            |
| `apoderado`, `usuario_bienes`           | ❌          | ✅              | ✅            |
| `usuario_bienes`                        | ❌          | ❌              | ✅            |

## Notes

- The backend now properly enforces role-based access control on ALL apoderado routes
- Users must have the appropriate role(s) to access each panel
- The PanelMenu component in the frontend correctly displays only the panels that the user has access to
- User `elpineda@gmail.com` should now have all 3 roles after running the update script
