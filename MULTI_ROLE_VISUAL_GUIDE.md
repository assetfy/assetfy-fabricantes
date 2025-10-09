# Multi-Role Feature - Visual Guide

## Before vs After

### Before: Single Role System

**User Model:**
```javascript
{
  nombreCompleto: "Juan Pérez",
  correoElectronico: "juan@example.com",
  rol: "admin"  // ❌ Single role only
}
```

**Hamburger Menu:**
```
User: Admin
┌────────────────────────────┐
│  Assetfy Admin             │
└────────────────────────────┘
```

### After: Multi-Role System

**User Model:**
```javascript
{
  nombreCompleto: "Juan Pérez",
  correoElectronico: "juan@example.com",
  roles: ["admin", "usuario_bienes"]  // ✅ Multiple roles
}
```

**Hamburger Menu:**
```
User: Admin + Usuario de Bienes
┌────────────────────────────┐
│  Assetfy Admin             │
│  Assetfy Bienes            │
└────────────────────────────┘
```

## Role Combinations & Panel Access

### Single Role Users

#### 1. Admin Only
```javascript
roles: ["admin"]
```
**Panels Available:**
- ✅ Assetfy Admin

---

#### 2. Apoderado Only
```javascript
roles: ["apoderado"]
```
**Panels Available:**
- ✅ Assetfy Fabricantes

---

#### 3. Usuario de Bienes Only
```javascript
roles: ["usuario_bienes"]
```
**Panels Available:**
- ✅ Assetfy Bienes

---

### Multi-Role Users

#### 4. Admin + Apoderado
```javascript
roles: ["admin", "apoderado"]
```
**Panels Available:**
- ✅ Assetfy Admin
- ✅ Assetfy Fabricantes

**Use Case:** Company owner who manages both admin tasks and fabricante operations

---

#### 5. Admin + Usuario de Bienes
```javascript
roles: ["admin", "usuario_bienes"]
```
**Panels Available:**
- ✅ Assetfy Admin
- ✅ Assetfy Bienes

**Use Case:** Company admin who also manages their personal assets

---

#### 6. Apoderado + Usuario de Bienes
```javascript
roles: ["apoderado", "usuario_bienes"]
```
**Panels Available:**
- ✅ Assetfy Fabricantes
- ✅ Assetfy Bienes

**Use Case:** Manufacturer representative who also registers their own assets

---

#### 7. All Three Roles (Power User)
```javascript
roles: ["admin", "apoderado", "usuario_bienes"]
```
**Panels Available:**
- ✅ Assetfy Admin
- ✅ Assetfy Fabricantes
- ✅ Assetfy Bienes

**Use Case:** Super admin with full access to all features

---

## User Interface Changes

### 1. User Creation Form

**Before:**
```
┌─────────────────────────────┐
│ Rol: [Dropdown ▼]          │
│      ┌──────────────────┐   │
│      │ Apoderado        │   │
│      │ Admin            │   │
│      │ Usuario de Bienes│   │
│      └──────────────────┘   │
└─────────────────────────────┘
```

**After:**
```
┌─────────────────────────────┐
│ Roles: [Multi-Select ▼]    │
│      ┌──────────────────┐   │
│      │ ☑ Admin          │   │
│      │ ☐ Apoderado      │   │
│      │ ☑ Usuario Bienes │   │
│      └──────────────────┘   │
│ ⓘ Hold Ctrl/Cmd to select  │
│   multiple roles            │
└─────────────────────────────┘
```

### 2. User List

**Before:**
```
┌──────────────┬──────────────┬─────────┐
│ Name         │ Email        │ Rol     │
├──────────────┼──────────────┼─────────┤
│ Juan Pérez   │ juan@...     │ admin   │
│ María García │ maria@...    │ apod... │
└──────────────┴──────────────┴─────────┘
```

**After:**
```
┌──────────────┬──────────────┬──────────────────────┐
│ Name         │ Email        │ Roles                │
├──────────────┼──────────────┼──────────────────────┤
│ Juan Pérez   │ juan@...     │ admin, usuario_bienes│
│ María García │ maria@...    │ apoderado            │
└──────────────┴──────────────┴──────────────────────┘
```

### 3. Hamburger Menu

**Before (Admin):**
```
┌───────────────────────────┐
│ ☰                         │
├───────────────────────────┤
│ Paneles Disponibles       │
├───────────────────────────┤
│ Assetfy Admin             │
│ Panel de administración   │
└───────────────────────────┘
```

**After (Admin + Usuario Bienes):**
```
┌───────────────────────────┐
│ ☰                         │
├───────────────────────────┤
│ Paneles Disponibles       │
├───────────────────────────┤
│ Assetfy Admin             │
│ Panel de administración   │
├───────────────────────────┤
│ Assetfy Bienes            │
│ Panel de gestión de bienes│
└───────────────────────────┘
```

## Data Flow Diagram

### Login Flow with Multi-Role

```
User Login
    │
    ├─► POST /api/auth/login
    │       │
    │       ├─► Verify credentials
    │       │
    │       └─► Return JWT with roles array
    │
    └─► Store in localStorage
            │
            ├─► roles: ["admin", "usuario_bienes"]
            │
            └─► rol: "admin" (primary, for backward compatibility)
                    │
                    └─► Navigate to primary panel
```

### Panel Access Check

```
User navigates to /admin
    │
    ├─► App.js ProtectedRoutes
    │       │
    │       ├─► Get roles from localStorage
    │       │   roles = ["admin", "usuario_bienes"]
    │       │
    │       └─► hasAnyRole(roles, ["admin"])
    │               │
    │               ├─► TRUE ✅
    │               │
    │               └─► Render AdminPanel
    │
    └─► SUCCESS - User sees Admin Panel
```

### Usuario Bienes Access Control

```
GET /api/usuario/bienes
    │
    ├─► auth middleware
    │       │
    │       └─► req.usuario = { id: "123", roles: ["usuario_bienes"] }
    │
    ├─► hasRole(usuario.roles, "usuario_bienes")
    │       │
    │       └─► TRUE ✅
    │
    ├─► Bien.find({ usuario: req.usuario.id })
    │       │
    │       └─► Returns ONLY user's own bienes
    │
    └─► Response: [bien1, bien2, bien3]
```

## Code Examples

### Creating a Multi-Role User

**Backend API:**
```javascript
POST /api/admin/usuarios/add
{
  "nombreCompleto": "Carlos López",
  "cuil": "20-12345678-9",
  "correoElectronico": "carlos@example.com",
  "contraseña": "securePassword123",
  "roles": ["apoderado", "usuario_bienes"]
}
```

**Response:**
```javascript
{
  "msg": "Usuario creado con éxito!",
  "emailSent": true
}
```

### Checking Roles in Frontend

**JavaScript:**
```javascript
// Get roles from localStorage
const rolesStr = localStorage.getItem('roles');
const roles = JSON.parse(rolesStr); // ["admin", "usuario_bienes"]

// Check if user has specific role
if (roles.includes('admin')) {
  console.log('User is an admin!');
}

// Check if user has any of multiple roles
if (roles.some(r => ['admin', 'apoderado'].includes(r))) {
  console.log('User can manage fabricantes!');
}
```

### Checking Roles in Backend

**Node.js:**
```javascript
const { hasRole, hasAnyRole } = require('../utils/roleHelper');

// Check single role
if (hasRole(usuario.roles, 'admin')) {
  // User is admin
}

// Check multiple roles
if (hasAnyRole(usuario.roles, ['admin', 'apoderado'])) {
  // User has at least one of these roles
}
```

## Migration Process Visualization

### Step 1: Before Migration
```
Database:
┌─────────────────────────────────┐
│ usuarios                        │
├─────────────────────────────────┤
│ { name: "User1", rol: "admin" } │
│ { name: "User2", rol: "apod" }  │
└─────────────────────────────────┘
```

### Step 2: Running Migration
```
Terminal:
$ node migrate-roles-to-array.js

🔄 Connecting to MongoDB...
✅ Connected
📊 Found 2 users

🔄 Migrating: User1
   Old: rol: "admin"
   New: roles: ["admin"]

🔄 Migrating: User2
   Old: rol: "apod"
   New: roles: ["apoderado"]

✅ Migration complete!
```

### Step 3: After Migration
```
Database:
┌──────────────────────────────────────┐
│ usuarios                             │
├──────────────────────────────────────┤
│ { name: "User1", roles: ["admin"] } │
│ { name: "User2", roles: ["apod"] }  │
└──────────────────────────────────────┘
```

## Security Model

### Access Control Matrix

```
┌──────────────────┬───────┬───────────┬───────────────┐
│ Panel/Feature    │ Admin │ Apoderado │ Usuario Bienes│
├──────────────────┼───────┼───────────┼───────────────┤
│ Admin Panel      │   ✅  │     ❌    │      ❌       │
│ User Management  │   ✅  │     ❌    │      ❌       │
│ Fabricantes      │  ✅*  │     ✅    │      ❌       │
│ Productos        │  ✅*  │     ✅    │      ❌       │
│ Inventario       │  ✅*  │     ✅    │      ❌       │
│ Bienes (Own)     │   ❌  │     ❌    │      ✅       │
│ Bienes (All)     │   ❌  │     ❌    │      ❌       │
└──────────────────┴───────┴───────────┴───────────────┘

* Admin can access if they are also assigned as fabricante administrator
```

### Multi-Role Access

```
User with roles: ["admin", "usuario_bienes"]

┌──────────────────┬────────────┐
│ Panel/Feature    │ Access     │
├──────────────────┼────────────┤
│ Admin Panel      │ ✅ (admin) │
│ User Management  │ ✅ (admin) │
│ Bienes (Own)     │ ✅ (u_b)   │
│ Fabricantes      │ ❌         │
└──────────────────┴────────────┘
```

## Best Practices

### ✅ DO

1. **Assign minimum required roles**
   ```javascript
   // Good: User only needs bienes access
   roles: ["usuario_bienes"]
   ```

2. **Use multi-roles for hybrid users**
   ```javascript
   // Good: User manages both admin and their assets
   roles: ["admin", "usuario_bienes"]
   ```

3. **Always check permissions in backend**
   ```javascript
   if (!hasRole(usuario.roles, 'admin')) {
     return res.status(403).json({ msg: 'Access denied' });
   }
   ```

### ❌ DON'T

1. **Don't assign all roles by default**
   ```javascript
   // Bad: Security risk
   roles: ["admin", "apoderado", "usuario_bienes"]
   ```

2. **Don't skip role checks**
   ```javascript
   // Bad: No permission check
   const bienes = await Bien.find({});
   
   // Good: Filter by user
   const bienes = await Bien.find({ usuario: req.usuario.id });
   ```

3. **Don't trust client-side checks only**
   ```javascript
   // Bad: Client can be manipulated
   if (localStorage.getItem('roles').includes('admin')) {
     // Show admin features
   }
   
   // Good: Always verify on backend too
   ```

---

## Quick Reference

### Role Names
- `admin` - System administrator
- `apoderado` - Manufacturer representative
- `usuario_bienes` - Asset user

### Panel Paths
- `/admin` - Admin panel
- `/apoderado` - Fabricantes panel
- `/usuario` - Bienes panel

### Helper Functions
- `hasRole(roles, role)` - Check single role
- `hasAnyRole(roles, [role1, role2])` - Check multiple roles
- `getPrimaryRole(roles)` - Get main role

---

**For more details, see:**
- `MULTI_ROLE_FEATURE.md` - Complete feature documentation
- `MIGRATION_INSTRUCTIONS.md` - Migration guide
- `TESTING_MULTI_ROLE.md` - Testing checklist
