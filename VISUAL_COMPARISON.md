# Comparación Visual de Cambios

## 🔧 Cambios Principales

### 1️⃣ Helper Function - hasAccessToGarantia

**NUEVO** - Se agregó esta función siguiendo el patrón existente:

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

---

### 2️⃣ Inventario - GET /api/apoderado/inventario

#### ❌ ANTES (Solo propietario directo)
```javascript
router.get('/inventario', auth, async (req, res) => {
    const { search, estado } = req.query;
    const usuarioApoderado = req.usuario.id;
    
    try {
        let query = { usuarioApoderado };  // ❌ Solo items propios
        
        // ... resto del código
    }
});
```

#### ✅ DESPUÉS (Propietario + Administradores)
```javascript
router.get('/inventario', auth, async (req, res) => {
    const { search, estado } = req.query;
    const usuarioApoderado = req.usuario.id;
    
    try {
        // ✅ Get fabricantes accesibles (apoderado OR administrador)
        const fabricantes = await Fabricante.find(getFabricantesQuery(usuarioApoderado));
        const fabricanteIds = fabricantes.map(fab => fab._id);

        // ✅ Get productos de fabricantes accesibles
        const productosAccesibles = await Producto.find({
            fabricante: { $in: fabricanteIds }
        }).select('_id');

        // ✅ Get piezas de fabricantes accesibles
        const piezasAccesibles = await Pieza.find({
            $or: [
                { usuarioApoderado },
                { fabricante: { $in: fabricanteIds } }
            ]
        }).select('_id');

        // ✅ Query ampliada: items propios O de fabricantes accesibles
        let query = {
            $or: [
                { usuarioApoderado },
                { producto: { $in: productoIdsAccesibles } },
                { pieza: { $in: piezaIdsAccesibles } }
            ]
        };
        
        // ... resto del código
    }
});
```

---

### 3️⃣ Garantías - GET /api/apoderado/garantias

#### ❌ ANTES (Solo propietario directo)
```javascript
router.get('/garantias', auth, async (req, res) => {
    try {
        const garantias = await Garantia.find({ 
            usuarioApoderado: req.usuario.id  // ❌ Solo garantías propias
        })
            .populate('fabricante')
            .populate('marca');
        res.json(garantias);
    }
});
```

#### ✅ DESPUÉS (Propietario + Administradores)
```javascript
router.get('/garantias', auth, async (req, res) => {
    try {
        const usuarioApoderado = req.usuario.id;
        
        // ✅ Get fabricantes accesibles (apoderado OR administrador)
        const fabricantes = await Fabricante.find(getFabricantesQuery(usuarioApoderado));
        const fabricanteIds = fabricantes.map(fab => fab._id);

        // ✅ Query ampliada: garantías propias O de fabricantes accesibles
        const query = {
            $or: [
                { usuarioApoderado },
                { fabricante: { $in: fabricanteIds } }
            ]
        };

        const garantias = await Garantia.find(query)
            .populate('fabricante')
            .populate('marca');
        res.json(garantias);
    }
});
```

---

### 4️⃣ Garantías - Rutas Individuales (GET/:id, PUT/:id, DELETE/:id)

#### ❌ ANTES (Verificación directa)
```javascript
router.get('/garantias/:id', auth, async (req, res) => {
    try {
        const garantia = await Garantia.findById(req.params.id)
            .populate('fabricante')
            .populate('marca');

        if (!garantia) {
            return res.status(404).json('Garantía no encontrada.');
        }

        // ❌ Solo verifica propietario directo
        if (garantia.usuarioApoderado.toString() !== req.usuario.id) {
            return res.status(401).json('No autorizado para ver esta garantía.');
        }

        res.json(garantia);
    }
});
```

#### ✅ DESPUÉS (Usa helper function)
```javascript
router.get('/garantias/:id', auth, async (req, res) => {
    try {
        const garantia = await Garantia.findById(req.params.id)
            .populate('fabricante')
            .populate('marca');

        if (!garantia) {
            return res.status(404).json('Garantía no encontrada.');
        }

        // ✅ Verifica propietario directo O acceso por fabricante
        if (!(await hasAccessToGarantia(req.usuario.id, garantia))) {
            return res.status(401).json('No autorizado para ver esta garantía.');
        }

        res.json(garantia);
    }
});
```

---

## 📊 Impacto de los Cambios

### Acceso de Usuarios ANTES de la Corrección

| Recurso | Apoderado | Admin del Fabricante |
|---------|-----------|---------------------|
| Productos | ✅ | ✅ |
| Piezas | ✅ | ✅ |
| Representantes | ✅ | ✅ |
| Marcas | ✅ | ✅ |
| Ubicaciones | ✅ | ✅ |
| **Inventario** | ✅ | ❌ **NO TENÍA ACCESO** |
| **Garantías** | ✅ | ❌ **NO TENÍA ACCESO** |

### Acceso de Usuarios DESPUÉS de la Corrección

| Recurso | Apoderado | Admin del Fabricante |
|---------|-----------|---------------------|
| Productos | ✅ | ✅ |
| Piezas | ✅ | ✅ |
| Representantes | ✅ | ✅ |
| Marcas | ✅ | ✅ |
| Ubicaciones | ✅ | ✅ |
| **Inventario** | ✅ | ✅ **AHORA SÍ TIENE ACCESO** |
| **Garantías** | ✅ | ✅ **AHORA SÍ TIENE ACCESO** |

---

## 🎯 Patrón de Diseño Aplicado

Este fix sigue el mismo patrón establecido para otros recursos:

```javascript
// Patrón consistente usado en todo el sistema:

const hasAccessToProduct = async (userId, producto) => {
    if (producto.usuarioApoderado.toString() === userId) return true;
    return await hasAccessToFabricante(userId, producto.fabricante);
};

const hasAccessToMarca = async (userId, marca) => {
    if (marca.usuarioApoderado.toString() === userId) return true;
    return await hasAccessToFabricante(userId, marca.fabricante);
};

const hasAccessToPieza = async (userId, pieza) => {
    if (pieza.usuarioApoderado.toString() === userId) return true;
    if (pieza.fabricante) return await hasAccessToFabricante(userId, pieza.fabricante);
    return false;
};

// ✅ AHORA TAMBIÉN:
const hasAccessToGarantia = async (userId, garantia) => {
    if (garantia.usuarioApoderado.toString() === userId) return true;
    if (garantia.fabricante) return await hasAccessToFabricante(userId, garantia.fabricante);
    return false;
};
```

Todos usan la función base `hasAccessToFabricante`:
```javascript
const hasAccessToFabricante = async (userId, fabricanteId) => {
    const fabricante = await Fabricante.findById(fabricanteId);
    if (!fabricante) return false;
    
    return fabricante.usuarioApoderado.toString() === userId || 
           fabricante.administradores.some(adminId => adminId.toString() === userId);
};
```
