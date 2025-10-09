# Garantías y Piezas - Corrección de Campos y Permisos

## Resumen
Este documento describe las correcciones realizadas para resolver dos problemas principales:

1. **Garantías**: Agregar campos de fabricante y marca como primer y segundo campo
2. **Piezas**: Corregir el acceso de usuarios con permisos de administrador a piezas

## Problema 1: Campos Faltantes en Garantías

### Descripción del Problema
Las garantías no tenían campos para fabricante y marca, lo que impedía que los usuarios con permisos pudieran acceder a toda la información relevante.

### Solución Implementada

#### Backend

**1. Modelo de Garantía (`models/garantia.model.js`)**
- Se agregaron dos nuevos campos después del `idGarantia`:
  - `fabricante`: Referencia al modelo Fabricante (opcional)
  - `marca`: Referencia al modelo Marca (opcional)

```javascript
fabricante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fabricante',
    required: false
},
marca: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Marca',
    required: false
}
```

**2. Rutas de Garantías (`routes/apoderado.js`)**

- **GET `/api/apoderado/garantias`**: Ahora popula `fabricante` y `marca`
- **GET `/api/apoderado/garantias/:id`**: Ahora popula `fabricante` y `marca`
- **POST `/api/apoderado/garantias/add`**: Acepta `fabricante` y `marca` en el body
- **PUT `/api/apoderado/garantias/:id`**: Acepta y actualiza `fabricante` y `marca`

#### Frontend

**3. Formulario de Garantía (`client/src/components/WarrantyManagerForm.js`)**
- Agregados selectores de fabricante y marca como los primeros dos campos del formulario
- El selector de marca se deshabilita si no hay un fabricante seleccionado
- El selector de marca filtra automáticamente las marcas según el fabricante seleccionado

**4. Detalles de Garantía (`client/src/components/WarrantyDetails.js`)**
- Muestra fabricante y marca cuando están disponibles
- Los campos se ocultan si no tienen valor

**5. Panel de Apoderado (`client/src/components/ApoderadoPanel.js`)**
- Se pasan las props `fabricantes` y `allMarcas` al componente `WarrantyManagerForm`
- Esto permite que los usuarios seleccionen de sus fabricantes y marcas disponibles

## Problema 2: Acceso de Usuarios con Permisos a Piezas

### Descripción del Problema
Los usuarios con permisos de administrador en un fabricante no podían ver las piezas asociadas a ese fabricante. Solo el propietario directo podía verlas.

### Causa Raíz
La función `hasAccessToPieza` solo verificaba si el usuario era el propietario directo (`usuarioApoderado`), sin considerar el acceso a través de permisos de administrador en el fabricante.

### Solución Implementada

**1. Función de Acceso (`routes/apoderado.js`)**

Actualizada la función `hasAccessToPieza` para verificar también el acceso a través del fabricante:

```javascript
const hasAccessToPieza = async (userId, pieza) => {
    // Direct access as pieza owner
    if (pieza.usuarioApoderado.toString() === userId) {
        return true;
    }
    
    // Access through fabricante (as apoderado or administrador)
    if (pieza.fabricante) {
        return await hasAccessToFabricante(userId, pieza.fabricante);
    }
    
    return false;
};
```

**2. Ruta de Listado de Piezas (`routes/apoderado.js`)**

Modificada la consulta para incluir piezas accesibles a través de fabricante:

```javascript
// Base query: piezas owned by user OR piezas where fabricante is accessible
let query = {
    $or: [
        { usuarioApoderado },
        { fabricante: { $in: fabricanteIds } }
    ]
};
```

**3. Rutas Individuales de Piezas**

Todas las rutas que llaman a `hasAccessToPieza` ahora populan el campo `fabricante`:
- PUT `/api/apoderado/piezas/:id` - Actualizar pieza
- DELETE `/api/apoderado/piezas/:id` - Eliminar pieza
- POST `/api/apoderado/piezas/:id/imagen` - Subir imagen
- DELETE `/api/apoderado/piezas/:id/imagen` - Eliminar imagen

Esto asegura que la función `hasAccessToPieza` pueda verificar correctamente el acceso a través del fabricante.

## Patrones de Diseño Aplicados

### Consistencia con Otros Modelos
La solución de piezas sigue el mismo patrón que otros modelos en el sistema:
- `hasAccessToProduct` - Verifica acceso a productos
- `hasAccessToMarca` - Verifica acceso a marcas
- `hasAccessToInventario` - Verifica acceso a inventario

Todos estos utilizan la función `hasAccessToFabricante` para verificar permisos de administrador.

### Campos Opcionales
Los campos `fabricante` y `marca` en garantías son opcionales (`required: false`) para mantener compatibilidad con datos existentes y permitir garantías genéricas.

## Impacto en el Sistema

### Cambios en la Base de Datos
- Las garantías existentes no se verán afectadas (campos opcionales)
- Las nuevas garantías pueden incluir fabricante y marca
- Las piezas existentes funcionarán correctamente con los nuevos controles de acceso

### Seguridad
- Los usuarios solo pueden ver piezas de fabricantes donde tienen permisos
- Se mantiene la seguridad de acceso directo (propietario)
- Se agrega acceso delegado a través de administradores de fabricante

### Experiencia de Usuario
- Los usuarios con permisos de administrador ahora pueden ver y editar piezas
- Las garantías ahora pueden organizarse por fabricante y marca
- Mejor organización y trazabilidad de la información

## Pruebas Recomendadas

1. **Garantías**
   - Crear una garantía sin fabricante/marca (debe funcionar)
   - Crear una garantía con fabricante y marca
   - Editar una garantía existente agregando fabricante/marca
   - Verificar que la marca se filtra según el fabricante seleccionado

2. **Piezas**
   - Usuario A crea una pieza con fabricante X
   - Usuario B es administrador de fabricante X
   - Usuario B debe poder ver, editar y eliminar la pieza
   - Usuario C sin permisos no debe ver la pieza

3. **Búsqueda de Piezas**
   - Verificar que la búsqueda funciona con piezas accesibles por permisos
   - Verificar filtrado correcto por productos asociados

## Archivos Modificados

### Backend
- `models/garantia.model.js` - Modelo actualizado
- `routes/apoderado.js` - Rutas de garantías y piezas actualizadas

### Frontend
- `client/src/components/WarrantyManagerForm.js` - Formulario con nuevos campos
- `client/src/components/WarrantyDetails.js` - Vista con nuevos campos
- `client/src/components/ApoderadoPanel.js` - Props agregadas

## Commits
1. `Add fabricante and marca fields to garantias, fix piezas access control`
2. `Populate fabricante in pieza queries for access control checks`
3. `Add fabricante and marca fields to garantias UI`
