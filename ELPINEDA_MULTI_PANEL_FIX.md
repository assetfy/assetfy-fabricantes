# Fix: Acceso Multi-Panel para Usuario Principal (elpineda@gmail.com)

## Problema
El usuario `elpineda@gmail.com` necesita acceso a los 3 paneles del sistema:
1. Panel de Admin (`/admin`)
2. Panel de Fabricantes (`/apoderado`)
3. Panel de Bienes (`/usuario`)

Anteriormente, aunque el usuario tuviera roles múltiples, el PanelMenu solo mostraba el panel de Fabricantes si el usuario admin tenía `hasFabricantePermissions` (basado en datos de fabricantes), no basado en el rol 'apoderado'.

## Solución Implementada

### 1. Script de Actualización de Usuario (`update-elpineda-roles.js`)

Se creó un script que:
- Busca el usuario con email `elpineda@gmail.com`
- Si no existe, lo crea con los 3 roles
- Si existe, actualiza sus roles para incluir los 3 roles: `['admin', 'apoderado', 'usuario_bienes']`
- Activa el usuario (estado: 'Activo', estadoApoderado: 'Activo')

**Cómo usar:**
```bash
node update-elpineda-roles.js
```

Si el usuario no existía, se crea con:
- Email: `elpineda@gmail.com`
- Password: `Admin123!`
- Roles: `['admin', 'apoderado', 'usuario_bienes']`

### 2. Corrección de PanelMenu.js

**Antes:**
```javascript
if (userRoles.includes('admin')) {
    // Admin panel
    panels.push({ name: 'Assetfy Admin', path: '/admin', ... });
    
    // If admin also has fabricante permissions, show fabricantes panel
    if (hasFabricantePermissions) {
        panels.push({ name: 'Assetfy Fabricantes', path: '/apoderado', ... });
    }
}
```

**Después:**
```javascript
if (userRoles.includes('admin')) {
    // Admin panel
    panels.push({ name: 'Assetfy Admin', path: '/admin', ... });
    
    // If admin also has apoderado role, show fabricantes panel
    if (userRoles.includes('apoderado')) {
        panels.push({ name: 'Assetfy Fabricantes', path: '/apoderado', ... });
    }
}
```

**Cambio clave:** Ahora verifica el rol 'apoderado' en el array de roles, no la propiedad `hasFabricantePermissions`.

### 3. Actualización de UsuarioPanel.js

Se actualizó UsuarioPanel para soportar autenticación multi-rol, siguiendo el mismo patrón que ApoderadoPanel:

```javascript
// Parse roles array from localStorage
const rolesStr = localStorage.getItem('roles');
let roles = [];
try {
    roles = rolesStr ? JSON.parse(rolesStr) : [];
} catch (e) {
    roles = [];
}

// If no roles array, fallback to single rol
if (roles.length === 0 && rol) {
    roles = [rol];
}

// Helper to check if user has any of the specified roles
const hasAnyRole = (requiredRoles) => {
    return requiredRoles.some(r => roles.includes(r));
};

// Check if user is authenticated and has usuario_bienes role
const isAuthenticated = token && (hasAnyRole(['usuario_bienes']) || rol === 'usuario_bienes');

// Determine userType based on roles array (admin takes priority)
const getUserType = () => {
    if (hasAnyRole(['admin'])) return 'admin';
    if (hasAnyRole(['apoderado'])) return 'apoderado';
    if (hasAnyRole(['usuario_bienes'])) return 'usuario_bienes';
    return rol || "usuario_bienes";
};
```

Esto asegura que:
- Usuarios con múltiples roles pueden acceder al panel de Bienes
- El `userType` correcto se pasa a `UserHeader` para mostrar todos los paneles disponibles

### 4. Tests Actualizados

Se actualizaron los tests de PanelMenu para:
- Limpiar localStorage antes de cada test
- Configurar el array de roles correctamente en localStorage
- Agregar un nuevo test para usuarios con los 3 roles

```javascript
test('shows all three panels for user with all three roles', () => {
    localStorage.setItem('roles', JSON.stringify(['admin', 'apoderado', 'usuario_bienes']));
    
    const { container } = render(
        <PanelMenu userType="admin" hasFabricantePermissions={true} />
    );

    const hamburgerButton = container.querySelector('.hamburger-button');
    fireEvent.click(hamburgerButton);

    expect(screen.getByText('Assetfy Admin')).toBeInTheDocument();
    expect(screen.getByText('Assetfy Fabricantes')).toBeInTheDocument();
    expect(screen.getByText('Assetfy Bienes')).toBeInTheDocument();
});
```

## Flujo Completo

### Cuando el usuario elpineda@gmail.com inicia sesión:

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

3. **Login.js** navega al panel principal:
   - Como tiene rol 'admin', navega a `/admin`

4. **AdminPanel** muestra:
   - UserHeader con `userType="admin"`
   - PanelMenu dentro de UserHeader

5. **PanelMenu** lee roles de localStorage:
   - Encuentra `roles = ["admin", "apoderado", "usuario_bienes"]`
   - Muestra los 3 paneles en el menú hamburguesa:
     - ✅ Assetfy Admin → `/admin`
     - ✅ Assetfy Fabricantes → `/apoderado`
     - ✅ Assetfy Bienes → `/usuario`

6. **Usuario puede cambiar de panel:**
   - Hace clic en el menú hamburguesa
   - Selecciona "Assetfy Fabricantes" → navega a `/apoderado`
   - ApoderadoPanel muestra con `userType="admin"` (porque admin tiene prioridad)
   - PanelMenu sigue mostrando los 3 paneles

## Archivos Modificados

1. **update-elpineda-roles.js** (NUEVO)
   - Script para actualizar/crear el usuario con los 3 roles

2. **client/src/components/PanelMenu.js**
   - Línea 62: Cambió `if (hasFabricantePermissions)` a `if (userRoles.includes('apoderado'))`

3. **client/src/components/UsuarioPanel.js**
   - Líneas 24-48: Agregado soporte para multi-rol (parse roles array, hasAnyRole helper)
   - Líneas 122-130: Agregada función `getUserType()` para determinar userType basado en roles

4. **client/src/components/PanelMenu.test.js**
   - Actualizado para limpiar localStorage antes de cada test
   - Actualizado para configurar roles correctamente en localStorage
   - Agregado nuevo test para usuario con 3 roles

## Verificación

### Tests
✅ Todos los tests de PanelMenu pasan (10/10)
✅ Build de producción exitoso

### Para verificar manualmente:
1. Ejecutar el script de actualización:
   ```bash
   node update-elpineda-roles.js
   ```

2. Iniciar sesión con:
   - Email: `elpineda@gmail.com`
   - Password: `Admin123!` (si fue creado por el script)

3. Verificar que el menú hamburguesa muestre los 3 paneles:
   - Assetfy Admin
   - Assetfy Fabricantes
   - Assetfy Bienes

4. Verificar que se puede navegar a cada panel y regresar

## Compatibilidad

✅ **Totalmente compatible con usuarios existentes:**
- Usuarios con un solo rol siguen funcionando igual
- Usuarios sin el array de roles en localStorage usan el campo `rol` como fallback
- La lógica de fallback (líneas 90-122 en PanelMenu.js) sigue funcionando para usuarios legacy

✅ **No hay cambios que rompan funcionalidad:**
- ApoderadoPanel ya tenía soporte multi-rol (implementado previamente)
- AdminPanel no requiere cambios (siempre usa userType="admin")
- UsuarioPanel ahora tiene el mismo patrón que ApoderadoPanel

## Notas Importantes

- El usuario `elpineda@gmail.com` es el usuario principal del sistema
- Debe tener acceso a los 3 paneles para administrar todo el sistema
- Los roles se almacenan en el modelo Usuario en el campo `roles` (array)
- El backend (`routes/auth.js`) ya retorna el array de roles correctamente
- La prioridad de userType es: admin > apoderado > usuario_bienes
