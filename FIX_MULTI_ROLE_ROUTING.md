# Fix: Multi-Role Routing and Access Issues

## Problema Identificado

El sistema tenía inconsistencias en el enrutamiento cuando un usuario tenía múltiples roles:

1. **Rutas inconsistentes**: `Login.js` y `App.js` navegaban a `/apoderado/productos` mientras que `PanelMenu.js` usaba `/apoderado`
2. **Prioridad de roles**: Aunque el código ya implementaba la prioridad correcta (admin > apoderado > usuario_bienes), la documentación no era clara

## Solución Implementada

### 1. Estandarización de Rutas

**Archivos modificados:**
- `client/src/components/Login.js` (líneas 42-55)
- `client/src/App.js` (líneas 65-75)

**Cambio:**
```javascript
// ANTES
navigate('/apoderado/productos');

// DESPUÉS  
navigate('/apoderado');
```

**Razón:** El componente `ApoderadoPanel` tiene una ruta índice que automáticamente redirige `/apoderado` a `/apoderado/productos`. Por lo tanto, usar `/apoderado` como ruta canónica es más consistente con `PanelMenu.js`.

### 2. Prioridad de Roles (Ya Implementada Correctamente)

El sistema navega al panel con más permisos por defecto:

```javascript
// Prioridad: admin (1) > apoderado (2) > usuario_bienes (3)
if (roles.includes('admin') || primaryRole === 'admin') {
    navigate('/admin');           // Panel con más permisos
} else if (roles.includes('apoderado') || primaryRole === 'apoderado') {
    navigate('/apoderado');       // Panel intermedio
} else if (roles.includes('usuario_bienes') || primaryRole === 'usuario_bienes') {
    navigate('/usuario');         // Panel básico
}
```

**Ejemplos:**
- Usuario con roles `['admin', 'usuario_bienes']` → Va a `/admin`
- Usuario con roles `['apoderado', 'usuario_bienes']` → Va a `/apoderado`
- Usuario con roles `['admin', 'apoderado', 'usuario_bienes']` → Va a `/admin`

## Asegurar que el Usuario Tenga los 3 Roles

Para el usuario principal `elpineda@gmail.com`, ejecutar el script de actualización:

```bash
node update-elpineda-roles.js
```

Este script:
1. Busca el usuario con email `elpineda@gmail.com`
2. Si no existe, lo crea con los 3 roles: `['admin', 'apoderado', 'usuario_bienes']`
3. Si existe, actualiza sus roles para incluir los 3 roles
4. Activa el usuario (estado: 'Activo', estadoApoderado: 'Activo')

**Credenciales predeterminadas si el usuario es creado:**
- Email: `elpineda@gmail.com`
- Password: `Admin123!`

## Flujo Completo de Navegación Multi-Rol

### Cuando elpineda@gmail.com inicia sesión:

1. **Backend** (`routes/auth.js`) retorna:
   ```json
   {
       "token": "...",
       "roles": ["admin", "apoderado", "usuario_bienes"],
       "rol": "admin"
   }
   ```

2. **Login.js** guarda en localStorage:
   - `token`: JWT token
   - `roles`: `["admin", "apoderado", "usuario_bienes"]`
   - `rol`: `"admin"`

3. **Login.js** navega según prioridad:
   - Como tiene rol 'admin', navega a `/admin`

4. **AdminPanel** muestra:
   - UserHeader con `userType="admin"`
   - PanelMenu (menú hamburguesa)

5. **PanelMenu** lee roles de localStorage:
   - Encuentra `roles = ["admin", "apoderado", "usuario_bienes"]`
   - Muestra los 3 paneles disponibles:
     - ✅ Assetfy Admin → `/admin`
     - ✅ Assetfy Fabricantes → `/apoderado`
     - ✅ Assetfy Bienes → `/usuario`

6. **Usuario puede cambiar de panel:**
   - Clic en menú hamburguesa
   - Selecciona cualquier panel
   - Navega al panel seleccionado
   - El `userType` se mantiene como "admin" porque tiene prioridad

## Verificación

### 1. Verificar que el usuario tiene los 3 roles en la base de datos:

```bash
# Conectarse a MongoDB y ejecutar:
db.usuarios.findOne({ correoElectronico: 'elpineda@gmail.com' }, { roles: 1, estado: 1, estadoApoderado: 1 })

# Debería retornar:
{
  "_id": ObjectId("..."),
  "roles": ["admin", "apoderado", "usuario_bienes"],
  "estado": "Activo",
  "estadoApoderado": "Activo"
}
```

### 2. Verificar navegación en el navegador:

1. Iniciar sesión con `elpineda@gmail.com`
2. Verificar que navega a `/admin` (panel con más permisos)
3. Abrir el menú hamburguesa (botón con 3 líneas horizontales)
4. Verificar que muestra 3 paneles:
   - Assetfy Admin
   - Assetfy Fabricantes
   - Assetfy Bienes
5. Hacer clic en "Assetfy Fabricantes"
6. Verificar que navega a `/apoderado` (que automáticamente redirige a `/apoderado/productos`)
7. Verificar que el menú hamburguesa sigue mostrando los 3 paneles

### 3. Verificar prioridad con diferentes combinaciones:

Para probar, puedes crear usuarios de prueba con diferentes combinaciones de roles:

```javascript
// Usuario solo admin
roles: ['admin']
// Debe navegar a: /admin
// Debe ver en menú: Assetfy Admin

// Usuario admin + usuario_bienes
roles: ['admin', 'usuario_bienes']
// Debe navegar a: /admin (prioridad admin)
// Debe ver en menú: Assetfy Admin, Assetfy Bienes

// Usuario apoderado + usuario_bienes
roles: ['apoderado', 'usuario_bienes']
// Debe navegar a: /apoderado (prioridad apoderado)
// Debe ver en menú: Assetfy Fabricantes, Assetfy Bienes

// Usuario solo usuario_bienes
roles: ['usuario_bienes']
// Debe navegar a: /usuario
// Debe ver en menú: Assetfy Bienes
```

## Compatibilidad

✅ **Totalmente compatible con usuarios existentes:**
- Usuarios con un solo rol siguen funcionando igual
- Usuarios sin el array de roles en localStorage usan el campo `rol` como fallback
- ApoderadoPanel redirige automáticamente de `/apoderado` a `/apoderado/productos`

## Archivos Relacionados

- `client/src/components/Login.js` - Lógica de navegación post-login
- `client/src/App.js` - Rutas protegidas y navegación raíz
- `client/src/components/PanelMenu.js` - Menú de selección de paneles
- `client/src/components/ApoderadoPanel.js` - Panel de fabricantes con ruta índice
- `update-elpineda-roles.js` - Script para actualizar roles del usuario principal
- `ELPINEDA_MULTI_PANEL_FIX.md` - Documentación previa del fix multi-panel
