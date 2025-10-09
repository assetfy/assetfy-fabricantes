# Inventario y Garantías - Corrección de Acceso para Usuarios con Permisos

## Resumen
Este documento describe las correcciones realizadas para permitir que usuarios con permisos de administrador en un fabricante puedan acceder a los artículos de inventario y garantías asociadas a ese fabricante.

## Problema

Los usuarios con permisos de administrador en un fabricante podían ver:
- ✅ Productos
- ✅ Piezas
- ✅ Representantes
- ✅ Marcas
- ✅ Ubicaciones

Pero **NO** podían ver:
- ❌ Artículos de inventario
- ❌ Garantías

Solo el usuario apoderado (propietario directo) podía ver estos recursos.

## Causa Raíz

### Inventario
La ruta `GET /api/apoderado/inventario` solo consultaba artículos donde `usuarioApoderado` era el usuario actual:
```javascript
let query = { usuarioApoderado };
```

### Garantías
Las rutas de garantías solo verificaban el propietario directo:
- `GET /api/apoderado/garantias` - Solo consultaba `{ usuarioApoderado: req.usuario.id }`
- `GET /api/apoderado/garantias/:id` - Validaba `garantia.usuarioApoderado.toString() !== req.usuario.id`
- `PUT /api/apoderado/garantias/:id` - Validaba `garantia.usuarioApoderado.toString() !== req.usuario.id`
- `DELETE /api/apoderado/garantias/:id` - Validaba `garantia.usuarioApoderado.toString() !== req.usuario.id`

## Solución Implementada

### 1. Nueva Función Helper: `hasAccessToGarantia`

Se agregó una nueva función helper siguiendo el mismo patrón que `hasAccessToPieza`, `hasAccessToProduct`, etc:

```javascript
const hasAccessToGarantia = async (userId, garantia) => {
    // Direct access as garantia owner
    if (garantia.usuarioApoderado.toString() === userId) {
        return true;
    }
    
    // Access through fabricante (as apoderado or administrador)
    if (garantia.fabricante) {
        return await hasAccessToFabricante(userId, garantia.fabricante);
    }
    
    return false;
};
```

### 2. Actualización de Ruta GET de Inventario

La ruta `GET /api/apoderado/inventario` ahora:

1. Obtiene los fabricantes accesibles al usuario (como apoderado o administrador)
2. Obtiene todos los productos de esos fabricantes
3. Obtiene todas las piezas de esos fabricantes
4. Consulta artículos de inventario que:
   - Pertenecen directamente al usuario, O
   - Tienen un producto de un fabricante accesible, O
   - Tienen una pieza de un fabricante accesible

```javascript
// Get fabricantes for this user (as apoderado or administrador)
const fabricantes = await Fabricante.find(getFabricantesQuery(usuarioApoderado));
const fabricanteIds = fabricantes.map(fab => fab._id);

// Get all productos from accessible fabricantes
const productosAccesibles = await Producto.find({
    fabricante: { $in: fabricanteIds }
}).select('_id');
const productoIdsAccesibles = productosAccesibles.map(p => p._id);

// Get all piezas from accessible fabricantes or owned by user
const piezasAccesibles = await Pieza.find({
    $or: [
        { usuarioApoderado },
        { fabricante: { $in: fabricanteIds } }
    ]
}).select('_id');
const piezaIdsAccesibles = piezasAccesibles.map(p => p._id);

// Base query: inventario owned by user OR inventario with producto/pieza from accessible fabricantes
let query = {
    $or: [
        { usuarioApoderado },
        { producto: { $in: productoIdsAccesibles } },
        { pieza: { $in: piezaIdsAccesibles } }
    ]
};
```

### 3. Actualización de Rutas de Garantías

**GET `/api/apoderado/garantias`**
```javascript
// Get fabricantes for this user (as apoderado or administrador)
const fabricantes = await Fabricante.find(getFabricantesQuery(usuarioApoderado));
const fabricanteIds = fabricantes.map(fab => fab._id);

// Base query: garantias owned by user OR garantias from accessible fabricantes
const query = {
    $or: [
        { usuarioApoderado },
        { fabricante: { $in: fabricanteIds } }
    ]
};
```

**GET `/api/apoderado/garantias/:id`**
```javascript
if (!(await hasAccessToGarantia(req.usuario.id, garantia))) {
    return res.status(401).json('No autorizado para ver esta garantía.');
}
```

**PUT `/api/apoderado/garantias/:id`**
```javascript
const garantia = await Garantia.findById(req.params.id)
    .populate('fabricante');

if (!(await hasAccessToGarantia(req.usuario.id, garantia))) {
    return res.status(401).json('No autorizado para actualizar esta garantía.');
}
```

**DELETE `/api/apoderado/garantias/:id`**
```javascript
const garantia = await Garantia.findById(req.params.id)
    .populate('fabricante');

if (!(await hasAccessToGarantia(req.usuario.id, garantia))) {
    return res.status(401).json('No autorizado para eliminar esta garantía.');
}
```

## Patrones de Diseño Aplicados

### Consistencia con Otros Modelos
La solución sigue el mismo patrón que otros modelos en el sistema:
- `hasAccessToProduct` - Verifica acceso a productos
- `hasAccessToMarca` - Verifica acceso a marcas
- `hasAccessToPieza` - Verifica acceso a piezas
- `hasAccessToInventario` - Verifica acceso a inventario (ya existía)
- `hasAccessToGarantia` - Verifica acceso a garantías (NUEVO)

Todos estos utilizan la función `hasAccessToFabricante` para verificar permisos de administrador.

### Función Base `hasAccessToFabricante`
```javascript
const hasAccessToFabricante = async (userId, fabricanteId) => {
    const fabricante = await Fabricante.findById(fabricanteId);
    if (!fabricante) return false;
    
    return fabricante.usuarioApoderado.toString() === userId || 
           fabricante.administradores.some(adminId => adminId.toString() === userId);
};
```

## Impacto en el Sistema

### Seguridad
- Los usuarios solo pueden ver inventario y garantías de fabricantes donde tienen permisos
- Se mantiene la seguridad de acceso directo (propietario)
- Se agrega acceso delegado a través de administradores de fabricante

### Experiencia de Usuario
- Los usuarios con permisos de administrador ahora pueden:
  - Ver artículos de inventario de productos/piezas del fabricante
  - Ver garantías asociadas al fabricante
  - Editar y eliminar garantías del fabricante
  - Acceso completo y consistente con otros recursos (productos, piezas, marcas, etc.)

### Compatibilidad
- No se requieren cambios en la base de datos
- No afecta garantías o inventario existentes
- Totalmente compatible con versiones anteriores

## Archivos Modificados

### Backend
- `routes/apoderado.js` - Rutas de inventario y garantías actualizadas

## Pruebas Recomendadas

1. **Inventario**
   - Usuario A crea un producto con fabricante X
   - Usuario A crea un artículo de inventario para ese producto
   - Usuario B es administrador de fabricante X
   - Usuario B debe poder ver el artículo de inventario
   - Usuario C sin permisos no debe ver el artículo

2. **Garantías**
   - Usuario A crea una garantía con fabricante X
   - Usuario B es administrador de fabricante X
   - Usuario B debe poder ver, editar y eliminar la garantía
   - Usuario C sin permisos no debe ver la garantía

3. **Búsqueda de Inventario**
   - Verificar que la búsqueda funciona con inventario accesible por permisos
   - Verificar filtrado correcto por productos y piezas asociadas

4. **Acceso Consistente**
   - Verificar que usuarios con permisos admin ahora tienen acceso completo a:
     - Productos ✓
     - Piezas ✓
     - Representantes ✓
     - Marcas ✓
     - Ubicaciones ✓
     - **Inventario ✓** (CORREGIDO)
     - **Garantías ✓** (CORREGIDO)
