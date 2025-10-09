# Migración de Estados de Fabricantes

## Descripción
Este script migra los estados de los fabricantes de la nomenclatura antigua a la nueva:
- `'Activado'` → `'Habilitado'`
- `'Desactivado'` → `'Deshabilitado'`

## Cuándo ejecutar
Este script debe ejecutarse **una sola vez** después de actualizar el código para sincronizar los datos existentes en la base de datos con el nuevo esquema.

## Requisitos previos
1. Asegúrate de que el archivo `.env` esté configurado con la conexión correcta a MongoDB
2. Asegúrate de que las dependencias estén instaladas: `npm install`

## Cómo ejecutar

```bash
node migrate-fabricante-estado.js
```

## Qué hace el script
1. Conecta a la base de datos MongoDB
2. Busca todos los fabricantes con estado `'Activado'` y los actualiza a `'Habilitado'`
3. Busca todos los fabricantes con estado `'Desactivado'` y los actualiza a `'Deshabilitado'`
4. Muestra un resumen de los cambios realizados
5. Cierra la conexión a la base de datos

## Resultado esperado
```
✅ Connected to MongoDB
✅ Updated X fabricantes from 'Activado' to 'Habilitado'
✅ Updated Y fabricantes from 'Desactivado' to 'Deshabilitado'

📊 Final state:
   - Habilitado: X
   - Deshabilitado: Y

✅ Migration completed successfully!
```

## Notas importantes
- Este script es **idempotente**: puede ejecutarse múltiples veces sin causar problemas
- Si ya se ejecutó antes y no hay fabricantes con los estados antiguos, mostrará `0` cambios
- Haz un backup de la base de datos antes de ejecutar cualquier script de migración en producción
