# Resumen de Cambios - Corrección de Acceso a Inventario y Garantías

## Problema Reportado
Los artículos de inventario y las garantías solo eran visibles para el usuario apoderado (propietario directo), y no para otros usuarios con permisos de administrador en el fabricante. Otros recursos (productos, piezas, representantes, marcas, ubicaciones) sí eran visibles correctamente para administradores.

## Solución

### 1. Nueva Función Helper - hasAccessToGarantia
Se agregó una función helper para verificar el acceso a garantías, siguiendo el mismo patrón que las funciones existentes:

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

### 2. Ruta de Inventario - GET /api/apoderado/inventario

**ANTES:**
```javascript
let query = { usuarioApoderado };
```

**DESPUÉS:**
```javascript
// Get fabricantes for this user (as apoderado or administrador)
const fabricantes = await Fabricante.find(getFabricantesQuery(usuarioApoderado));
const fabricanteIds = fabricantes.map(fab => fab._id);

// Get all productos from accessible fabricantes
const productosAccesibles = await Producto.find({
    fabricante: { $in: fabricanteIds }
}).select('_id');

// Get all piezas from accessible fabricantes or owned by user
const piezasAccesibles = await Pieza.find({
    $or: [
        { usuarioApoderado },
        { fabricante: { $in: fabricanteIds } }
    ]
}).select('_id');

// Base query: inventario owned by user OR with producto/pieza from accessible fabricantes
let query = {
    $or: [
        { usuarioApoderado },
        { producto: { $in: productoIdsAccesibles } },
        { pieza: { $in: piezaIdsAccesibles } }
    ]
};
```

### 3. Ruta de Garantías - GET /api/apoderado/garantias

**ANTES:**
```javascript
const garantias = await Garantia.find({ usuarioApoderado: req.usuario.id })
    .populate('fabricante')
    .populate('marca');
```

**DESPUÉS:**
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

const garantias = await Garantia.find(query)
    .populate('fabricante')
    .populate('marca');
```

### 4. Rutas Individuales de Garantías

Todas las rutas (GET/:id, PUT/:id, DELETE/:id) ahora usan la función helper:

**ANTES:**
```javascript
if (garantia.usuarioApoderado.toString() !== req.usuario.id) {
    return res.status(401).json('No autorizado...');
}
```

**DESPUÉS:**
```javascript
const garantia = await Garantia.findById(req.params.id)
    .populate('fabricante');

if (!(await hasAccessToGarantia(req.usuario.id, garantia))) {
    return res.status(401).json('No autorizado...');
}
```

## Resultado

Ahora los usuarios con permisos de administrador en un fabricante tienen acceso completo y consistente a:
- ✅ Productos
- ✅ Piezas
- ✅ Representantes
- ✅ Marcas
- ✅ Ubicaciones
- ✅ **Inventario** (CORREGIDO)
- ✅ **Garantías** (CORREGIDO)

## Archivos Modificados
- `routes/apoderado.js` - Actualización de rutas de inventario y garantías

## Compatibilidad
- ✅ No requiere cambios en la base de datos
- ✅ No afecta datos existentes
- ✅ Totalmente compatible con versiones anteriores
- ✅ Sigue los mismos patrones establecidos en el código existente
