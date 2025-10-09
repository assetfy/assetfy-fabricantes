# Diagrama de Flujo: Navegación Multi-Rol

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    USUARIO INICIA SESIÓN                                │
│                    (Login.js o ActivateAccount.js)                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              Backend retorna: { token, roles[], rol }                   │
│              Ejemplo: { token: "xyz", roles: ["admin",                  │
│              "apoderado", "usuario_bienes"], rol: "admin" }             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   Guardar en localStorage:                              │
│                   • token                                               │
│                   • roles (array JSON)                                  │
│                   • rol (string, backward compatibility)                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              LÓGICA DE PRIORIDAD DE NAVEGACIÓN                          │
│                                                                         │
│  if (roles.includes('admin'))           → navigate('/admin')           │
│  else if (roles.includes('apoderado'))  → navigate('/apoderado')       │
│  else if (roles.includes('usuario_bienes')) → navigate('/usuario')     │
│  else                                   → navigate('/apoderado')       │
│                                                                         │
│  Prioridad: admin (1) > apoderado (2) > usuario_bienes (3)             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
          ┌─────────────┐  ┌──────────────┐  ┌─────────────┐
          │   /admin    │  │  /apoderado  │  │  /usuario   │
          └─────────────┘  └──────────────┘  └─────────────┘
                 │                │                  │
                 ▼                ▼                  ▼
          ┌─────────────┐  ┌──────────────┐  ┌─────────────┐
          │ AdminPanel  │  │ApoderadoPanel│  │UsuarioPanel │
          └─────────────┘  └──────────────┘  └─────────────┘
                 │                │                  │
                 └────────────────┼──────────────────┘
                                  ▼
          ┌────────────────────────────────────────┐
          │  UserHeader con PanelMenu (☰)         │
          │                                        │
          │  PanelMenu lee localStorage['roles']  │
          │  y muestra paneles disponibles:       │
          └────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      PANELES MOSTRADOS EN MENÚ                          │
│                                                                         │
│  Si roles = ['admin']:                                                 │
│    ☰ → Assetfy Admin                                                   │
│                                                                         │
│  Si roles = ['admin', 'apoderado']:                                    │
│    ☰ → Assetfy Admin                                                   │
│    ☰ → Assetfy Fabricantes                                             │
│                                                                         │
│  Si roles = ['admin', 'apoderado', 'usuario_bienes']:                  │
│    ☰ → Assetfy Admin                                                   │
│    ☰ → Assetfy Fabricantes                                             │
│    ☰ → Assetfy Bienes                                                  │
│                                                                         │
│  Si roles = ['apoderado', 'usuario_bienes']:                           │
│    ☰ → Assetfy Fabricantes                                             │
│    ☰ → Assetfy Bienes                                                  │
│                                                                         │
│  Si roles = ['usuario_bienes']:                                        │
│    ☰ → Assetfy Bienes                                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Rutas Consistentes

### ANTES del Fix:
```
Login.js:          navigate('/apoderado/productos')  ❌
App.js:            navigate('/apoderado/productos')  ❌
ActivateAccount:   navigate('/apoderado/productos')  ❌
PanelMenu.js:      navigate('/apoderado')            ✅
```
**Problema:** Inconsistencia en las rutas

### DESPUÉS del Fix:
```
Login.js:          navigate('/apoderado')  ✅
App.js:            navigate('/apoderado')  ✅
ActivateAccount:   navigate('/apoderado')  ✅
PanelMenu.js:      navigate('/apoderado')  ✅
```
**Solución:** Todas las rutas son consistentes

### ¿Por qué `/apoderado` funciona?

ApoderadoPanel.js tiene esta configuración:
```javascript
<Routes>
    <Route index element={<Navigate to="productos" replace />} />
    <Route path="productos" element={...} />
    <Route path="piezas" element={...} />
    // ... otras rutas
</Routes>
```

Cuando navegas a `/apoderado`:
1. Se activa el `<Route index>` de ApoderadoPanel
2. Este automáticamente redirige a `productos`
3. El resultado final es `/apoderado/productos`
4. ✅ Ruta canónica: `/apoderado` (auto-redirige a `/apoderado/productos`)

## Ejemplos de Usuarios Reales

### Caso 1: elpineda@gmail.com (Admin Principal)
```
Roles en DB: ['admin', 'apoderado', 'usuario_bienes']

1. Login → Navega a /admin (prioridad más alta)
2. Menú ☰ muestra:
   • Assetfy Admin → /admin
   • Assetfy Fabricantes → /apoderado
   • Assetfy Bienes → /usuario

3. Puede cambiar entre los 3 paneles libremente
```

### Caso 2: Usuario Fabricante con Bienes
```
Roles en DB: ['apoderado', 'usuario_bienes']

1. Login → Navega a /apoderado (prioridad apoderado)
2. Menú ☰ muestra:
   • Assetfy Fabricantes → /apoderado
   • Assetfy Bienes → /usuario

3. NO ve panel Admin (no tiene ese rol)
```

### Caso 3: Usuario Solo Bienes
```
Roles en DB: ['usuario_bienes']

1. Login → Navega a /usuario
2. Menú ☰ muestra:
   • Assetfy Bienes → /usuario

3. Solo ve su panel de bienes
```

### Caso 4: Administrador con Bienes
```
Roles en DB: ['admin', 'usuario_bienes']

1. Login → Navega a /admin (prioridad admin)
2. Menú ☰ muestra:
   • Assetfy Admin → /admin
   • Assetfy Bienes → /usuario

3. NO ve panel Fabricantes (no tiene rol 'apoderado')
```

## Flujo de PanelMenu (Menú Hamburguesa)

```javascript
// PanelMenu.js - Lógica de mostrar paneles

1. Leer roles de localStorage:
   const rolesStr = localStorage.getItem('roles');
   const userRoles = JSON.parse(rolesStr);

2. Determinar paneles a mostrar:
   const panels = [];
   
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

3. Renderizar menú con todos los paneles disponibles
```

## Prioridad de Roles en Detalle

```
┌─────────────┬──────────┬─────────────────────────────────────┐
│    Roles    │ Navega a │ Paneles en Menú ☰                   │
├─────────────┼──────────┼─────────────────────────────────────┤
│ [A,P,U]     │ /admin   │ Admin, Fabricantes, Bienes          │
│ [A,P]       │ /admin   │ Admin, Fabricantes                  │
│ [A,U]       │ /admin   │ Admin, Bienes                       │
│ [P,U]       │ /apoderado│ Fabricantes, Bienes                │
│ [A]         │ /admin   │ Admin                               │
│ [P]         │ /apoderado│ Fabricantes                        │
│ [U]         │ /usuario │ Bienes                              │
└─────────────┴──────────┴─────────────────────────────────────┘

A = admin
P = apoderado
U = usuario_bienes

Prioridad: A > P > U
```

## Compatibilidad con Código Legacy

### Campo `rol` vs Array `roles`

```javascript
// ANTES (legacy) - Solo un rol
localStorage.setItem('rol', 'admin');

// AHORA - Ambos para compatibilidad
localStorage.setItem('rol', 'admin');                    // Backward compatibility
localStorage.setItem('roles', JSON.stringify(['admin', 'apoderado'])); // New way

// Lógica en código usa ambos
const roles = JSON.parse(localStorage.getItem('roles')) || [];
const rol = localStorage.getItem('rol');

// Fallback si no hay array
if (roles.length === 0 && rol) {
    roles = [rol];
}

// Chequeo funciona con ambos
if (roles.includes('admin') || rol === 'admin') {
    // Usuario es admin
}
```

## Verificación Rápida

### ¿Cómo saber si el fix funciona?

1. **Revisar localStorage en el navegador:**
   ```javascript
   // Abrir DevTools > Console
   console.log('Token:', localStorage.getItem('token'));
   console.log('Roles:', JSON.parse(localStorage.getItem('roles')));
   console.log('Rol:', localStorage.getItem('rol'));
   
   // Debería mostrar algo como:
   // Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   // Roles: ["admin", "apoderado", "usuario_bienes"]
   // Rol: "admin"
   ```

2. **Verificar URL actual:**
   ```javascript
   console.log('Current path:', window.location.pathname);
   
   // Si roles = ['admin', ...] debería mostrar:
   // Current path: "/admin"
   
   // Si roles = ['apoderado', ...] y no admin, debería mostrar:
   // Current path: "/apoderado" o "/apoderado/productos"
   ```

3. **Contar paneles en menú:**
   ```javascript
   // Abrir menú hamburguesa
   // Contar opciones visibles
   
   // Con roles = ['admin', 'apoderado', 'usuario_bienes']
   // Debe haber 3 opciones:
   // ☰ Assetfy Admin
   // ☰ Assetfy Fabricantes  
   // ☰ Assetfy Bienes
   ```

## Resumen Visual

```
┌──────────────────────────────────────────────────────────────┐
│                    ANTES DEL FIX                             │
├──────────────────────────────────────────────────────────────┤
│ ❌ Rutas inconsistentes (/apoderado vs /apoderado/productos)│
│ ❌ Prioridad no clara en comentarios                         │
│ ❌ ActivateAccount no soportaba multi-rol completo           │
│ ❌ Documentación fragmentada                                 │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    DESPUÉS DEL FIX                           │
├──────────────────────────────────────────────────────────────┤
│ ✅ Rutas consistentes (/apoderado en todos lados)            │
│ ✅ Prioridad clara: admin (1) > apoderado (2) > usuario (3)  │
│ ✅ ActivateAccount soporta multi-rol completamente           │
│ ✅ Documentación completa y ejemplos                         │
│ ✅ Sin breaking changes - 100% compatible                    │
└──────────────────────────────────────────────────────────────┘
```
