# Guía Visual de Cambios - Formularios de Usuario y Fabricante

## 1. UserForm.js - Creación de Usuario

### ANTES
```
┌─────────────────────────────────────────────┐
│ Crear Nuevo Usuario                         │
├─────────────────────────────────────────────┤
│ Nombre Completo: [________________]         │
│ CUIL: [________________]                    │
│ Correo: [________________]                  │
│ Contraseña: [________________]              │
│ Teléfono: [________________]                │
│                                             │
│ Roles:                                      │
│ ┌─────────────────────────┐                │
│ │ ☑ Admin                 │                │
│ │ ☑ Apoderado            │                │
│ │ ☐ Usuario de Bienes     │                │
│ └─────────────────────────┘                │
│                                             │
│ Fabricantes Permitidos:                     │
│ ┌─────────────────────────┐                │
│ │ Fabricante A            │                │
│ │ Fabricante B            │                │
│ │ Fabricante C            │                │
│ └─────────────────────────┘                │
│ (SIEMPRE VISIBLE)                           │
│                                             │
│ ☐ Enviar invitación                        │
│                                             │
│ [Crear Usuario]                            │
└─────────────────────────────────────────────┘
```

### DESPUÉS
```
┌─────────────────────────────────────────────┐
│ Crear Nuevo Usuario                         │
├─────────────────────────────────────────────┤
│ Nombre Completo: [________________]         │
│ CUIL: [________________]                    │
│ Correo: [________________]                  │
│ Contraseña: [________________]              │
│ Teléfono: [________________]                │
│                                             │
│ Roles:                                      │
│ ┌─────────────────────────┐                │
│ │ ☑ Admin                 │                │
│ │ ☑ Apoderado            │ ← SI SELECCIONADO│
│ │ ☐ Usuario de Bienes     │                │
│ └─────────────────────────┘                │
│                                             │
│ Fabricantes Permitidos:                     │
│ ┌─────────────────────────┐                │
│ │ Fabricante A            │                │
│ │ Fabricante B            │                │
│ │ Fabricante C            │                │
│ └─────────────────────────┘                │
│ (SOLO VISIBLE SI ROL APODERADO)            │
│                                             │
│ ☐ Enviar invitación                        │
│                                             │
│ [Crear Usuario]                            │
└─────────────────────────────────────────────┘
```

**Cambio:** El campo "Fabricantes Permitidos" solo se muestra cuando el rol "apoderado" está seleccionado.

---

## 2. UserEditForm.js - Edición de Usuario

### ANTES
```
┌─────────────────────────────────────────────┐
│ Editar Usuario                              │
├─────────────────────────────────────────────┤
│ Nombre Completo: [________________]         │
│ CUIL: [________________]                    │
│ Correo: [________________]                  │
│ Teléfono: [________________]                │
│ Estado Apoderado: [Activo ▼]               │
│                                             │
│ Roles:                                      │
│ ┌─────────────────────────┐                │
│ │ ☐ Admin                 │                │
│ │ ☑ Apoderado            │                │
│ │ ☐ Usuario de Bienes     │                │
│ └─────────────────────────┘                │
│                                             │
│ Estado: [Activo ▼]                         │
│                                             │
│ [Actualizar] [Cancelar]                    │
└─────────────────────────────────────────────┘
```

### DESPUÉS
```
┌─────────────────────────────────────────────┐
│ Editar Usuario                              │
├─────────────────────────────────────────────┤
│ Nombre Completo: [________________]         │
│ CUIL: [________________]                    │
│ Correo: [________________]                  │
│ Teléfono: [________________]                │
│ Estado Apoderado: [Activo ▼]               │
│                                             │
│ Roles:                                      │
│ ┌─────────────────────────┐                │
│ │ ☐ Admin                 │                │
│ │ ☑ Apoderado            │ ← SI SELECCIONADO│
│ │ ☐ Usuario de Bienes     │                │
│ └─────────────────────────┘                │
│                                             │
│ Fabricantes Permitidos:      ← NUEVO CAMPO │
│ ┌─────────────────────────┐                │
│ │ Fabricante A            │                │
│ │ Fabricante B            │                │
│ │ Fabricante C            │                │
│ └─────────────────────────┘                │
│ (SOLO VISIBLE SI ROL APODERADO)            │
│                                             │
│ Estado: [Activo ▼]                         │
│                                             │
│ [Actualizar] [Cancelar]                    │
└─────────────────────────────────────────────┘
```

**Cambios:**
1. Añadido campo "Fabricantes Permitidos" que se muestra solo si el rol apoderado está seleccionado
2. Backend ahora soporta actualizar permisosFabricantes

---

## 3. FabricanteForm.js - Creación de Fabricante

### ANTES
```
┌─────────────────────────────────────────────┐
│ Crear Nuevo Fabricante                      │
├─────────────────────────────────────────────┤
│ Razón Social: [________________]            │
│ CUIT: [________________]                    │
│                                             │
│ Usuario Apoderado: [Seleccionar ▼]         │ ← LABEL ANTERIOR
│ ┌─────────────────────────┐                │
│ │ Juan Pérez (apoderado)  │                │
│ │ Ana García (admin)      │                │
│ └─────────────────────────┘                │
│                                             │
│ Administradores (opcional):                 │ ← LABEL ANTERIOR
│ ┌─────────────────────────┐                │
│ │ María López (apoderado) │                │
│ │ Carlos Ruiz (admin)     │                │
│ └─────────────────────────┘                │
│                                             │
│ [Crear Fabricante]                         │
└─────────────────────────────────────────────┘
```

### DESPUÉS
```
┌─────────────────────────────────────────────┐
│ Crear Nuevo Fabricante                      │
├─────────────────────────────────────────────┤
│ Razón Social: [________________]            │
│ CUIT: [________________]                    │
│                                             │
│ Apoderado Principal: [Seleccionar ▼]       │ ← NUEVO LABEL
│ ┌─────────────────────────┐                │
│ │ Juan Pérez              │ (solo apoderados)
│ │ María López             │                │
│ │ Pedro Martínez (admin+apo)│              │
│ └─────────────────────────┘                │
│                                             │
│ Apoderados Adicionales (opcional):          │ ← NUEVO LABEL
│ ┌─────────────────────────┐                │
│ │ Juan Pérez              │ (solo apoderados)
│ │ María López             │                │
│ │ Pedro Martínez (admin+apo)│              │
│ └─────────────────────────┘                │
│                                             │
│ [Crear Fabricante]                         │
└─────────────────────────────────────────────┘
```

**Cambios:**
1. "Usuario Apoderado" → "Apoderado Principal"
2. "Administradores" → "Apoderados Adicionales"
3. Solo se muestran usuarios con rol apoderado (tengan o no otros roles)
4. Ya NO se muestran admins que no tengan rol apoderado

---

## 4. FabricanteEditForm.js - Edición de Fabricante

### ANTES
```
┌─────────────────────────────────────────────┐
│ Editar Fabricante                           │
├─────────────────────────────────────────────┤
│ Razón Social: [Aceros XYZ SA]              │
│ CUIT: [30-12345678-9]                      │
│                                             │
│ Usuario Apoderado: [Juan Pérez ▼]         │ ← LABEL ANTERIOR
│ ┌─────────────────────────┐                │
│ │ Juan Pérez (apoderado)  │                │
│ │ Ana García (admin)      │                │
│ └─────────────────────────┘                │
│                                             │
│ Administradores (opcional):                 │ ← LABEL ANTERIOR
│ ┌─────────────────────────┐                │
│ │ María López (apoderado) │                │
│ │ Carlos Ruiz (admin)     │                │
│ └─────────────────────────┘                │
│                                             │
│ Estado: [Habilitado ▼]                     │
│                                             │
│ [Actualizar] [Cancelar]                    │
└─────────────────────────────────────────────┘
```

### DESPUÉS
```
┌─────────────────────────────────────────────┐
│ Editar Fabricante                           │
├─────────────────────────────────────────────┤
│ Razón Social: [Aceros XYZ SA]              │
│ CUIT: [30-12345678-9]                      │
│                                             │
│ Apoderado Principal: [Juan Pérez ▼]       │ ← NUEVO LABEL
│ ┌─────────────────────────┐                │
│ │ Juan Pérez              │ (solo apoderados)
│ │ María López             │                │
│ │ Pedro Martínez (admin+apo)│              │
│ └─────────────────────────┘                │
│                                             │
│ Apoderados Adicionales (opcional):          │ ← NUEVO LABEL
│ ┌─────────────────────────┐                │
│ │ María López             │ (solo apoderados)
│ │ Pedro Martínez (admin+apo)│              │
│ └─────────────────────────┘                │
│                                             │
│ Estado: [Habilitado ▼]                     │
│                                             │
│ [Actualizar] [Cancelar]                    │
└─────────────────────────────────────────────┘
```

**Cambios:**
1. "Usuario Apoderado" → "Apoderado Principal"
2. "Administradores" → "Apoderados Adicionales"
3. Solo se muestran usuarios con rol apoderado (tengan o no otros roles)
4. Ya NO se muestran admins que no tengan rol apoderado

---

## 5. Backend - Endpoint /api/admin/usuarios/apoderados

### ANTES
```javascript
// Query MongoDB
{
  estado: { $in: ['Invitado', 'Activo'] },
  roles: { $in: ['apoderado', 'admin'] }  // Devuelve apoderados Y admins
}

// Resultados:
[
  { nombre: "Juan Pérez", roles: ["apoderado"] },
  { nombre: "Ana García", roles: ["admin"] },        // ← Admin sin apoderado
  { nombre: "María López", roles: ["apoderado"] },
  { nombre: "Pedro Martínez", roles: ["admin", "apoderado"] }
]
```

### DESPUÉS
```javascript
// Query MongoDB
{
  estado: { $in: ['Invitado', 'Activo'] },
  roles: 'apoderado'  // Devuelve SOLO usuarios con rol apoderado
}

// Resultados:
[
  { nombre: "Juan Pérez", roles: ["apoderado"] },
  // Ana García NO aparece (admin sin apoderado)
  { nombre: "María López", roles: ["apoderado"] },
  { nombre: "Pedro Martínez", roles: ["admin", "apoderado"] }  // ← Tiene apoderado
]
```

**Cambio:** El endpoint ahora filtra por usuarios que tengan el rol 'apoderado', independientemente de si tienen otros roles adicionales.

---

## Resumen de Beneficios

### Experiencia de Usuario
✅ **Interfaz más limpia:** Los campos solo aparecen cuando son relevantes
✅ **Nomenclatura clara:** "Apoderado Principal" y "Apoderados Adicionales" son más descriptivos que "Usuario Apoderado" y "Administradores"
✅ **Coherencia:** El sistema multi-rol funciona de manera consistente

### Lógica de Negocio
✅ **Flexibilidad:** Un usuario puede ser admin + apoderado y aparecer en los selectores de fabricantes
✅ **Simplicidad:** Ya no es necesario que los admins aparezcan automáticamente en los fabricantes
✅ **Control:** El campo de fabricantes permitidos aparece/desaparece según el rol seleccionado

### Mantenibilidad
✅ **Código más limpio:** Condicionales claros para mostrar/ocultar campos
✅ **Backend consistente:** Un solo endpoint para obtener usuarios apoderados
✅ **Compatible:** Funciona con el sistema multi-rol existente sin cambios en la base de datos
