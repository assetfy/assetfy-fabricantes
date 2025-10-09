# Testing Checklist - Fabricante Estado Fix

## Pre-requisitos
- [ ] Código actualizado del branch `copilot/fix-fabricantes-status-issue`
- [ ] Base de datos de desarrollo disponible
- [ ] Servidor backend corriendo
- [ ] Cliente frontend corriendo

## 1. Ejecutar Migración de Datos

```bash
node migrate-fabricante-estado.js
```

**Resultado esperado:**
```
✅ Connected to MongoDB
✅ Updated X fabricantes from 'Activado' to 'Habilitado'
✅ Updated Y fabricantes from 'Desactivado' to 'Deshabilitado'

📊 Final state:
   - Habilitado: X
   - Deshabilitado: Y

✅ Migration completed successfully!
```

## 2. Pruebas del Panel Admin - Gestión de Fabricantes

### 2.1 Crear Nuevo Fabricante
- [ ] Acceder al panel admin
- [ ] Navegar a la sección de Fabricantes
- [ ] Crear un nuevo fabricante
- [ ] Verificar que el campo "Estado" muestre:
  - [ ] Opción "Habilitado"
  - [ ] Opción "Deshabilitado"
- [ ] Crear fabricante con estado "Habilitado"
- [ ] Verificar que se guarda correctamente

### 2.2 Editar Fabricante Existente
- [ ] Seleccionar un fabricante de la lista
- [ ] Hacer clic en "Editar"
- [ ] Verificar que el formulario de edición muestre correctamente el estado actual
- [ ] Cambiar algunos campos (razón social, etc.)
- [ ] Guardar cambios
- [ ] **IMPORTANTE**: No debe mostrar error de "incongruencia de estados"
- [ ] Verificar que los cambios se guardaron correctamente

### 2.3 Cambiar Estado de Fabricante
- [ ] Editar un fabricante con estado "Habilitado"
- [ ] Cambiar estado a "Deshabilitado"
- [ ] Guardar
- [ ] Verificar que se guardó correctamente
- [ ] Cambiar de vuelta a "Habilitado"
- [ ] Guardar
- [ ] Verificar que se guardó correctamente

### 2.4 Filtrar Fabricantes por Estado
- [ ] Ir a la lista de fabricantes
- [ ] Verificar que el filtro de estado muestre:
  - [ ] "Todos los estados"
  - [ ] "Habilitado"
  - [ ] "Deshabilitado"
- [ ] Seleccionar filtro "Habilitado"
- [ ] Verificar que solo se muestran fabricantes habilitados
- [ ] Seleccionar filtro "Deshabilitado"
- [ ] Verificar que solo se muestran fabricantes deshabilitados

## 3. Pruebas de Login - Apoderados

### 3.1 Apoderado con Fabricante Habilitado
- [ ] Tener un usuario apoderado asignado a un fabricante con estado "Habilitado"
- [ ] Intentar hacer login con ese usuario
- [ ] **Resultado esperado**: Login exitoso
- [ ] Verificar acceso al panel de apoderado
- [ ] Verificar que puede ver los datos del fabricante

### 3.2 Apoderado sin Fabricantes Habilitados
**Setup previo:**
- [ ] Tener un usuario apoderado
- [ ] Deshabilitar todos los fabricantes asociados a ese apoderado
  - Como usuarioApoderado
  - Como administrador

**Prueba:**
- [ ] Intentar hacer login con ese usuario
- [ ] **Resultado esperado**: Login rechazado
- [ ] **Mensaje esperado**: "No tiene fabricantes habilitados"
- [ ] Verificar que no se genera token de autenticación
- [ ] Verificar que no puede acceder al panel

### 3.3 Apoderado como Administrador de Fabricante
- [ ] Tener un usuario apoderado que NO es usuarioApoderado de ningún fabricante
- [ ] Agregar ese usuario como administrador de un fabricante habilitado
- [ ] Intentar hacer login
- [ ] **Resultado esperado**: Login exitoso
- [ ] Verificar que puede ver el fabricante donde es administrador

### 3.4 Admin del Sistema
- [ ] Login como administrador del sistema (rol 'admin')
- [ ] **Resultado esperado**: Login exitoso sin restricciones
- [ ] Verificar que no se aplica la validación de fabricantes habilitados

## 4. Pruebas de Integración

### 4.1 Vista de Apoderado - Listado de Fabricantes
- [ ] Login como apoderado con múltiples fabricantes
- [ ] Algunos habilitados, algunos deshabilitados
- [ ] Verificar que puede ver todos sus fabricantes
- [ ] Aplicar filtro "solo activos"
- [ ] Verificar que solo ve fabricantes habilitados

### 4.2 Productos y Marcas
- [ ] Verificar que el filtro por fabricantes activos funciona
- [ ] Al buscar productos, verificar que se usan fabricantes habilitados correctamente
- [ ] Al buscar marcas, verificar que se usan fabricantes habilitados correctamente

## 5. Verificación de Base de Datos

### 5.1 Consulta Directa
```javascript
// En MongoDB shell o Compass
db.fabricantes.find({}, { razonSocial: 1, estado: 1 })
```

**Verificar:**
- [ ] No existen registros con estado "Activado"
- [ ] No existen registros con estado "Desactivado"
- [ ] Todos los estados son "Habilitado" o "Deshabilitado"

### 5.2 Conteo de Estados
```javascript
db.fabricantes.countDocuments({ estado: "Habilitado" })
db.fabricantes.countDocuments({ estado: "Deshabilitado" })
db.fabricantes.countDocuments({ estado: "Activado" })  // Debe ser 0
db.fabricantes.countDocuments({ estado: "Desactivado" })  // Debe ser 0
```

## 6. Pruebas de Regresión

### 6.1 Funcionalidad Existente
- [ ] Crear usuarios apoderados (no debe verse afectado)
- [ ] Asignar apoderados a fabricantes (no debe verse afectado)
- [ ] Agregar/quitar administradores de fabricantes (no debe verse afectado)
- [ ] Ver reportes y estadísticas (no debe verse afectado)

## 7. Casos Edge

### 7.1 Usuario con Rol Diferente
- [ ] Crear usuario con rol custom/diferente
- [ ] Verificar que no se aplica validación de fabricantes

### 7.2 Fabricante Recién Creado
- [ ] Crear nuevo fabricante sin especificar estado
- [ ] Verificar que el estado por defecto es "Habilitado"

### 7.3 Cambio Rápido de Estado
- [ ] Habilitar un fabricante
- [ ] Inmediatamente intentar login como su apoderado
- [ ] Verificar que funciona
- [ ] Deshabilitar el fabricante
- [ ] Intentar login nuevamente
- [ ] Verificar que falla con mensaje correcto

## Resultado Final

### Todos los tests pasaron: ✅
- [ ] Sí, todo funciona correctamente
- [ ] No, hay problemas (detallar abajo)

### Problemas encontrados:
```
[Describir cualquier problema aquí]
```

### Observaciones adicionales:
```
[Cualquier observación relevante]
```
