# Solución al Error de Estados de Fabricantes

## Problema Identificado

El sistema presentaba inconsistencia en los estados de fabricantes:
- **Frontend (FabricanteEditForm.js)**: Usaba `'Habilitado'` y `'Deshabilitado'`
- **Backend (modelo)**: Usaba `'Activado'` y `'Desactivado'`
- **Resultado**: Error al guardar cambios desde el panel admin

## Solución Implementada

### 1. Actualización del Modelo de Datos

**Archivo**: `models/fabricante.model.js`

```javascript
// Antes:
estado: { type: String, enum: ['Activado', 'Desactivado'], default: 'Activado' }

// Después:
estado: { type: String, enum: ['Habilitado', 'Deshabilitado'], default: 'Habilitado' }
```

### 2. Actualización de Componentes Frontend

**Archivos actualizados**:
- `client/src/components/FabricanteList.js`: Filtro de estados actualizado
- `client/src/components/DemoAdminPanel.js`: Datos de prueba y filtros actualizados

Ambos ahora usan `'Habilitado'` y `'Deshabilitado'` en lugar de `'Activado'` y `'Desactivado'`.

### 3. Actualización de Rutas Backend

**Archivo**: `routes/apoderado.js`

Actualizado el filtro de fabricantes activos para usar `'Habilitado'` en lugar de `'Activado'`.

### 4. Validación de Login para Apoderados

**Archivo**: `routes/auth.js`

Se agregó validación para verificar que los apoderados tengan al menos un fabricante habilitado:

```javascript
// Check if apoderado has at least one enabled fabricante
if (usuario.rol === 'apoderado') {
    const fabricantesHabilitados = await Fabricante.countDocuments({
        $or: [
            { usuarioApoderado: usuario.id, estado: 'Habilitado' },
            { administradores: usuario.id, estado: 'Habilitado' }
        ]
    });

    if (fabricantesHabilitados === 0) {
        return res.status(403).json('No tiene fabricantes habilitados');
    }
}
```

**Comportamiento**:
- Si un apoderado intenta hacer login sin fabricantes habilitados, recibirá el mensaje: **"No tiene fabricantes habilitados"**
- Si tiene al menos un fabricante habilitado (ya sea como apoderado o administrador), podrá acceder normalmente

### 5. Script de Migración

**Archivo**: `migrate-fabricante-estado.js`

Script para actualizar datos existentes en la base de datos:
- Convierte `'Activado'` → `'Habilitado'`
- Convierte `'Desactivado'` → `'Deshabilitado'`

Ver `MIGRATION_README.md` para instrucciones de uso.

## Archivos Modificados

1. ✅ `models/fabricante.model.js` - Esquema actualizado
2. ✅ `client/src/components/FabricanteList.js` - Filtros actualizados
3. ✅ `client/src/components/DemoAdminPanel.js` - Datos de prueba actualizados
4. ✅ `routes/apoderado.js` - Lógica de filtros actualizada
5. ✅ `routes/auth.js` - Validación de login agregada
6. ✅ `migrate-fabricante-estado.js` - Script de migración (nuevo)
7. ✅ `MIGRATION_README.md` - Documentación de migración (nuevo)

## Pasos para Implementar

### En Desarrollo

1. Actualizar el código (ya hecho en este PR)
2. Ejecutar el script de migración:
   ```bash
   node migrate-fabricante-estado.js
   ```
3. Reiniciar el servidor

### En Producción

1. **IMPORTANTE**: Hacer backup de la base de datos
2. Desplegar el código actualizado
3. Ejecutar el script de migración:
   ```bash
   node migrate-fabricante-estado.js
   ```
4. Verificar que todos los fabricantes tengan estados correctos
5. Reiniciar el servidor de producción

## Verificación de la Solución

### Pruebas a realizar:

1. **Editar un fabricante desde el panel admin**
   - ✅ Debería poder guardar cambios sin errores
   - ✅ El selector de estado debe mostrar "Habilitado" y "Deshabilitado"

2. **Filtrar fabricantes por estado**
   - ✅ El filtro debe mostrar "Habilitado" y "Deshabilitado"
   - ✅ El filtrado debe funcionar correctamente

3. **Login de apoderado**
   - ✅ Apoderado con fabricante habilitado: login exitoso
   - ✅ Apoderado sin fabricantes habilitados: mensaje de error "No tiene fabricantes habilitados"

4. **Acceso al panel de apoderado**
   - ✅ Solo ver fabricantes donde es apoderado o administrador
   - ✅ Solo ver fabricantes con estado "Habilitado" cuando se aplica ese filtro

## Beneficios de la Solución

1. **Consistencia**: Todos los componentes usan la misma nomenclatura
2. **Sin errores de guardado**: El formulario y el modelo están sincronizados
3. **Seguridad mejorada**: Validación en el login previene acceso no autorizado
4. **Migración segura**: Script documentado para actualizar datos existentes
5. **Nomenclatura clara**: "Habilitado/Deshabilitado" es más descriptivo que "Activado/Desactivado"

## Notas Adicionales

- El script de migración es idempotente (puede ejecutarse múltiples veces sin problemas)
- La validación de login solo aplica a usuarios con rol 'apoderado'
- Los administradores del sistema no se ven afectados por esta validación
