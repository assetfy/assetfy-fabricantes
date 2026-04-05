// routes/apoderado.js

const router = require('express').Router();
const auth = require('../middleware/auth'); // Importa el middleware de autenticación
const { upload, uploadImagenPrincipal, uploadImagenesAdicionales, uploadVideos, uploadFotoPerfil, uploadLogoMarca, uploadLogoFabricante, deleteFromS3, checkS3Connection, s3 } = require('../middleware/upload'); // Importa middleware de upload
const { hasAnyRole } = require('../utils/roleHelper'); // Importa helper para verificación de roles
const Usuario = require('../models/usuario.model');
const Fabricante = require('../models/fabricante.model');
const Producto = require('../models/producto.model'); // Importa el modelo de producto
const Marca = require('../models/marca.model');
const Inventario = require('../models/inventario.model'); // Importa el inventario
const Representante = require('../models/representante.model'); // Importa el modelo de representante
const Garantia = require('../models/garantia.model'); // Importa el modelo de garantía
const PedidoGarantia = require('../models/pedidoGarantia.model'); // Importa el modelo de pedido de garantía
const Pieza = require('../models/pieza.model'); // Importa el modelo de pieza
const Ubicacion = require('../models/ubicacion.model'); // Importa el modelo de ubicación
const Bien = require('../models/bien.model'); // Importa el modelo de bien
const argentineRegions = require('../data/argentine-regions'); // Importa los datos de regiones argentinas
const { Parser } = require('json2csv');
const { sendGarantiaResponseEmail, sendSolicitudMensajeEmail, sendSolicitudEstadoEmail } = require('../utils/emailService');
const { geocodeAddress, geocodeProvince, PROVINCE_COORDS } = require('../utils/geocoding');
const Notificacion = require('../models/notificacion.model');
const SolicitudRepresentacion = require('../models/solicitudRepresentacion.model');
const { obtenerContadores, verificarGarantiasPorVencer } = require('../utils/alertEngine');
const AuditLog = require('../models/auditLog.model');
const { logAuditEvent, sanitizeForAudit, getChangedFields, ENTITY_LABELS, ACCION_LABELS } = require('../utils/auditLogger');

// Helper function to transform legacy S3 URLs to proxy URLs
const transformMarcaLegacyUrls = (marca) => {
    if (marca && marca.logo && marca.logo.url && marca.logo.key) {
        // Check if URL is a direct S3 URL (not already a proxy URL)
        if (marca.logo.url.includes('amazonaws.com') && !marca.logo.url.includes('/api/apoderado/files/')) {
            // Convert to proxy URL using the base64-encoded S3 key
            marca.logo.url = `/api/apoderado/files/${Buffer.from(marca.logo.key).toString('base64')}`;
        }
    }
    return marca;
};
const XLSX = require('xlsx');

// Utility function to calculate warranty expiration date
const { calculateWarrantyExpiration } = require('../utils/warrantyUtils');
const GarantiaAsignada = require('../models/garantiaAsignada.model');

// Utility function to generate alphanumeric serial numbers
const generateSerialNumber = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Helper function to check if user has access to a fabricante (as apoderado or administrador)
const hasAccessToFabricante = async (userId, fabricanteId) => {
    const fabricante = await Fabricante.findById(fabricanteId);
    if (!fabricante) return false;
    
    return fabricante.usuarioApoderado.toString() === userId || 
           fabricante.administradores.some(adminId => adminId.toString() === userId);
};

// Helper function to get fabricantes query for user (as apoderado or administrador)
const getFabricantesQuery = (userId, additionalFilters = {}) => {
    return {
        $or: [
            { usuarioApoderado: userId },
            { administradores: userId }
        ],
        ...additionalFilters
    };
};

// Helper function to check if user has access to a product
const hasAccessToProduct = async (userId, producto) => {
    // Direct access as product owner
    if (producto.usuarioApoderado.toString() === userId) {
        return true;
    }
    
    // Access through fabricante (as apoderado or administrador)
    return await hasAccessToFabricante(userId, producto.fabricante);
};

// Helper function to check if user has access to a marca
const hasAccessToMarca = async (userId, marca) => {
    // Direct access as marca owner
    if (marca.usuarioApoderado.toString() === userId) {
        return true;
    }
    
    // Access through fabricante (as apoderado or administrador)
    return await hasAccessToFabricante(userId, marca.fabricante);
};

// Helper function to check if user has access to an inventario item
const hasAccessToInventario = async (userId, item) => {
    // Direct access as item owner
    if (item.usuarioApoderado.toString() === userId) {
        return true;
    }
    
    // Access through producto's fabricante (as apoderado or administrador)
    const producto = await Producto.findById(item.producto).populate('fabricante');
    if (producto && producto.fabricante) {
        return await hasAccessToFabricante(userId, producto.fabricante._id);
    }
    
    return false;
};

// Helper function to check if user has access to a representante
const hasAccessToRepresentante = async (userId, representante) => {
    // For representantes, they are tied to marcas, and marcas are tied to fabricantes
    // So we need to check if user has access to any of the marcas represented
    if (representante.usuarioApoderado.toString() === userId) {
        return true;
    }
    
    // Check access through marcas represented
    const marcas = await Marca.find({ _id: { $in: representante.marcasRepresentadas } }).populate('fabricante');
    for (const marca of marcas) {
        if (await hasAccessToFabricante(userId, marca.fabricante._id)) {
            return true;
        }
    }
    
    return false;
};

// Helper function to check if user has access to a pieza
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

// Helper function to check if user has access to a garantia
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

// Middleware to check apoderado or admin role
// This is applied to ALL routes in this router to ensure only users with
// apoderado or admin roles can access apoderado panel endpoints
const checkApoderadoOrAdminRole = async (req, res, next) => {
    try {
        // Skip role check if user info is not yet loaded (will be caught by auth middleware)
        if (!req.usuario || !req.usuario.id) {
            return next();
        }

        const usuario = await Usuario.findById(req.usuario.id).select('roles');
        
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        // Verificar que el usuario tenga rol de apoderado o admin
        if (!hasAnyRole(usuario.roles, ['apoderado', 'admin'])) {
            return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de apoderado o administrador.' });
        }

        next();
    } catch (err) {
        console.error('Error en checkApoderadoOrAdminRole:', err.message);
        res.status(500).json({ msg: 'Error del servidor' });
    }
};

// Apply role checking middleware to all routes in this router
// This ensures that only users with apoderado or admin roles can access these endpoints
router.use(checkApoderadoOrAdminRole);


// @route   GET /api/apoderado/perfil
// @desc    Obtener el perfil del usuario apoderado y sus fabricantes asociados
// @access  Privado (requiere token de apoderado o admin)
router.get('/perfil', auth, async (req, res) => {
  try {
    // req.usuario.id es añadido por el middleware 'auth'
    const usuario = await Usuario.findById(req.usuario.id).select('-contraseña');
    
    // Obtener los fabricantes asociados al apoderado o donde sea administrador
    const fabricantes = await Fabricante.find({ 
      $or: [
        { usuarioApoderado: req.usuario.id },
        { administradores: req.usuario.id }
      ]
    });

    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }
    

    res.json({ usuario, fabricantes });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// @route   PUT /api/apoderado/perfil
// @desc    Actualizar el perfil del usuario apoderado
// @access  Privado (Apoderado)
router.put('/perfil', auth, async (req, res) => {
  try {
    const { nombreCompleto, imagenPerfil } = req.body;
    
    // req.usuario.id es añadido por el middleware 'auth'
    const usuario = await Usuario.findById(req.usuario.id);
    
    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    // Actualizar campos si se proporcionan
    if (nombreCompleto) usuario.nombreCompleto = nombreCompleto;
    if (imagenPerfil !== undefined) usuario.imagenPerfil = imagenPerfil;

    await usuario.save();
    
    // Obtener los fabricantes asociados al apoderado o donde sea administrador para respuesta completa
    const fabricantes = await Fabricante.find({ 
      $or: [
        { usuarioApoderado: req.usuario.id },
        { administradores: req.usuario.id }
      ]
    });
    
    res.json({ 
      usuario: {
        ...usuario.toObject(),
        contraseña: undefined // Excluir contraseña de la respuesta
      }, 
      fabricantes 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json('Error del servidor');
  }
});

// @route   POST /api/apoderado/perfil/foto
// @desc    Subir foto de perfil para el usuario apoderado
// @access  Privado (Apoderado)
router.post('/perfil/foto', auth, checkS3Connection, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id);

        if (!usuario) {
            return res.status(404).json('Usuario no encontrado.');
        }

        // Set S3 path for the upload middleware
        req.s3Path = `usuario_${req.usuario.id}`;

        // Use upload middleware with a single file named 'fotoPerfil'
        uploadFotoPerfil.single('fotoPerfil')(req, res, async (err) => {
            if (err) {
                console.error('❌ Upload error:', err);
                console.error('❌ Upload error details:', {
                    code: err.code,
                    message: err.message,
                    stack: err.stack?.substring(0, 200)
                });
                
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json('El archivo es demasiado grande. Tamaño máximo permitido: 5MB');
                } else if (err.message && err.message.includes('S3 path not set')) {
                    return res.status(500).json('Error de configuración en la subida de archivos. Contacte al administrador.');
                } else if (err.message && err.message.includes('Inaccessible host')) {
                    return res.status(503).json('Servicio de almacenamiento temporalmente no disponible. Intente más tarde.');
                }
                return res.status(400).json(err.message || 'Error al subir el archivo');
            }

            if (!req.file) {
                return res.status(400).json('No se proporcionó ningún archivo');
            }

            try {
                // Delete previous profile photo if it exists
                if (usuario.imagenPerfil && typeof usuario.imagenPerfil === 'object' && usuario.imagenPerfil.s3Key) {
                    try {
                        await deleteFromS3(usuario.imagenPerfil.s3Key);
                    } catch (deleteErr) {
                        console.error('Error deleting previous profile photo from S3:', deleteErr);
                    }
                }

                // Set the uploaded file as the user's profile photo
                usuario.imagenPerfil = {
                    originalName: req.file.originalname,
                    fileName: req.file.key.split('/').pop(),
                    s3Key: req.file.key,
                    url: `/api/apoderado/files/${Buffer.from(req.file.key).toString('base64')}`
                };

                await usuario.save();

                console.log(`✅ User profile photo updated successfully`);

                res.json({ 
                    mensaje: 'Foto de perfil subida con éxito!', 
                    archivo: usuario.imagenPerfil 
                });
            } catch (saveErr) {
                console.error('❌ Error saving user:', saveErr);
                res.status(500).json('Error al guardar la información del archivo');
            }
        });
    } catch (err) {
        console.error('❌ Server error in profile photo upload:', err.message);
        res.status(500).json('Error del servidor');
    }
});

// @route   DELETE /api/apoderado/perfil/foto
// @desc    Eliminar foto de perfil del usuario apoderado
// @access  Privado (Apoderado)
router.delete('/perfil/foto', auth, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id);

        if (!usuario) {
            return res.status(404).json('Usuario no encontrado.');
        }

        if (!usuario.imagenPerfil || (typeof usuario.imagenPerfil === 'object' && !usuario.imagenPerfil.s3Key)) {
            return res.status(404).json('Foto de perfil no encontrada.');
        }

        // Delete from S3 if it's an uploaded file
        if (typeof usuario.imagenPerfil === 'object' && usuario.imagenPerfil.s3Key) {
            try {
                await deleteFromS3(usuario.imagenPerfil.s3Key);
            } catch (s3Error) {
                console.error('Error deleting profile photo from S3:', s3Error);
                // Continue anyway to remove from database
            }
        }

        // Remove from user
        usuario.imagenPerfil = undefined;
        await usuario.save();

        res.json('Foto de perfil eliminada con éxito!');
    } catch (err) {
        console.error(err.message);
        res.status(500).json('Error del servidor');
    }
});


// @route   POST /api/apoderado/perfil/cambiar-contrasena
// @desc    Cambiar contraseña del usuario apoderado
// @access  Privado (Apoderado)
router.post('/perfil/cambiar-contrasena', auth, async (req, res) => {
  try {
    const { nuevaContraseña, confirmarContraseña } = req.body;
    
    if (!nuevaContraseña || !confirmarContraseña) {
      return res.status(400).json({ msg: 'Todos los campos son requeridos.' });
    }
    
    if (nuevaContraseña !== confirmarContraseña) {
      return res.status(400).json({ msg: 'Las contraseñas no coinciden.' });
    }
    
    if (nuevaContraseña.length < 6) {
      return res.status(400).json({ msg: 'La contraseña debe tener al menos 6 caracteres.' });
    }
    
    const usuario = await Usuario.findById(req.usuario.id);
    
    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }
    
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    usuario.contraseña = await bcrypt.hash(nuevaContraseña, salt);
    
    await usuario.save();
    
    res.json({ msg: 'Contraseña actualizada exitosamente' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});


// @route   POST /api/apoderado/productos/add
// @desc    Crear un nuevo producto
// @access  Privado (Apoderado)
router.post('/productos/add', auth, async (req, res) => {
    const { modelo, descripcion, precio, fabricante, marca, atributos, garantia } = req.body;
    const usuarioApoderado = req.usuario.id;

    try {
        const fabricanteAsociado = await Fabricante.findOne(getFabricantesQuery(usuarioApoderado, { _id: fabricante }));
        if (!fabricanteAsociado) {
            return res.status(403).json('No tienes permiso para agregar productos a este fabricante.');
        }
        
        // Verifica que la marca pertenezca al fabricante
        const marcaAsociada = await Marca.findOne({ _id: marca, fabricante });
        if (!marcaAsociada) {
            return res.status(403).json('La marca no pertenece a este fabricante.');
        }

        const nuevoProducto = new Producto({
            modelo,
            descripcion,
            precio,
            fabricante,
            marca,
            usuarioApoderado,
            manuales: [],
            atributos: atributos || [],
            garantia: garantia || null
        });

        await nuevoProducto.save();
        logAuditEvent({
            usuarioId: usuarioApoderado, fabricanteId: fabricante, accion: 'creacion',
            tipoEntidad: 'producto', entidadId: nuevoProducto._id, descripcionEntidad: modelo,
            detalles: { modelo, descripcion, precio, marca, atributos, garantia }
        });
        res.status(201).json({ mensaje: 'Producto creado con éxito!', producto: nuevoProducto });
    } catch (err) {
        console.error(err.message);
        // Handle duplicate key error specifically
        if (err.code === 11000) {
            if (err.keyPattern && err.keyPattern.idProducto) {
                return res.status(400).json('Error al generar ID único del producto. Intente nuevamente.');
            }
        }
        res.status(500).json('Error del servidor');
    }
});

// @route   PUT /api/apoderado/productos/:id
// @desc    Actualizar un producto
// @access  Privado (Apoderado)
router.put('/productos/:id', auth, async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);

        if (!producto) {
            return res.status(404).json('Producto no encontrado.');
        }

        if (!(await hasAccessToProduct(req.usuario.id, producto))) {
            return res.status(401).json('No autorizado para actualizar este producto.');
        }
        
        const { modelo, descripcion, precio, fabricante, marca, atributos, garantia } = req.body;

        // Verifica si la marca es válida antes de guardar
        const marcaAsociada = await Marca.findOne({ _id: marca, fabricante });
        if (!marcaAsociada) {
            return res.status(403).json('La marca no pertenece a este fabricante.');
        }

        const anteriorProducto = { modelo: producto.modelo, descripcion: producto.descripcion, precio: producto.precio, fabricante: producto.fabricante, marca: producto.marca, atributos: producto.atributos, garantia: producto.garantia };

        producto.modelo = modelo;
        producto.descripcion = descripcion;
        producto.precio = precio;
        producto.fabricante = fabricante;
        producto.marca = marca;
        producto.atributos = atributos || [];
        producto.garantia = garantia || null;

        await producto.save();
        const { valorAnterior, valorNuevo } = getChangedFields(anteriorProducto, { modelo, descripcion, precio, fabricante, marca, atributos: atributos || [], garantia: garantia || null });
        if (Object.keys(valorAnterior).length > 0) {
            logAuditEvent({
                usuarioId: req.usuario.id, fabricanteId: fabricante, accion: 'actualizacion',
                tipoEntidad: 'producto', entidadId: producto._id, descripcionEntidad: modelo,
                valorAnterior, valorNuevo
            });
        }
        res.json('Producto actualizado!');
    } catch (err) {
        console.error(err.message);
        res.status(500).json('Error del servidor');
    }
});

// @route   DELETE /api/apoderado/productos/:id
// @desc    Eliminar un producto
// @access  Privado (Apoderado)
router.delete('/productos/:id', auth, async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);

        if (!producto) {
            return res.status(404).json('Producto no encontrado.');
        }

        if (!(await hasAccessToProduct(req.usuario.id, producto))) {
            return res.status(401).json('No autorizado para eliminar este producto.');
        }

        // Check if there are inventory items referencing this product
        const inventarioItems = await Inventario.find({ producto: req.params.id });
        if (inventarioItems.length > 0) {
            return res.status(400).json('No se puede eliminar por referencias');
        }

        const prodFabricanteId = producto.fabricante;
        const prodModelo = producto.modelo;
        await producto.deleteOne();
        logAuditEvent({
            usuarioId: req.usuario.id, fabricanteId: prodFabricanteId, accion: 'eliminacion',
            tipoEntidad: 'producto', entidadId: req.params.id, descripcionEntidad: prodModelo
        });
        res.json('Producto eliminado.');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/apoderado/productos
// @desc    Obtener los productos asociados a los fabricantes del apoderado, con opción de búsqueda
// @access  Privado (Apoderado)
router.get('/productos', auth, async (req, res) => {
    const { search, activos_solo, estado } = req.query; // Added estado parameter
    const usuarioApoderado = req.usuario.id;

    try {
        let additionalFilters = {};
        if (activos_solo === 'true') {
            additionalFilters.estado = 'Habilitado';
        }
        
        const fabricantes = await Fabricante.find(getFabricantesQuery(usuarioApoderado, additionalFilters));
        const fabricanteIds = fabricantes.map(fab => fab._id);

        // Base access filter: productos owned by user OR productos from accessible fabricantes
        const accessFilter = {
            $or: [
                { usuarioApoderado },
                { fabricante: { $in: fabricanteIds } }
            ]
        };

        // Build estado filter if specified
        let estadoFilter = null;
        if (activos_solo === 'true') {
            estadoFilter = { estado: 'Activo' };
        } else if (estado && estado !== '') {
            estadoFilter = { estado };
        }

        let query;
        
        if (search) {
            // Buscar marcas que coincidan con el término de búsqueda (user-owned OR from accessible fabricantes)
            const marcas = await Marca.find({
                nombre: { $regex: search, $options: 'i' },
                $or: [
                    { usuarioApoderado },
                    { fabricante: { $in: fabricanteIds } }
                ]
            });
            const marcaIds = marcas.map(marca => marca._id);

            // Build query with access filter, search criteria, and optional estado filter
            const filters = [
                accessFilter,
                {
                    $or: [
                        { idProducto: { $regex: search, $options: 'i' } },
                        { modelo: { $regex: search, $options: 'i' } },
                        { descripcion: { $regex: search, $options: 'i' } },
                        { marca: { $in: marcaIds } }
                    ]
                }
            ];
            
            if (estadoFilter) {
                filters.push(estadoFilter);
            }
            
            query = { $and: filters };
        } else {
            // No search - combine access filter with optional estado filter
            if (estadoFilter) {
                query = { $and: [accessFilter, estadoFilter] };
            } else {
                query = accessFilter;
            }
        }

        const productos = await Producto.find(query)
            .populate('fabricante')
            .populate('marca')
            .populate('garantia');

        // Agregar conteo de stock (estado='stock') para cada producto
        const productoIds = productos.map(p => p._id);
        const stockCounts = await Inventario.aggregate([
            { $match: { producto: { $in: productoIds }, estado: 'stock' } },
            { $group: { _id: '$producto', count: { $sum: 1 } } }
        ]);
        const stockCountMap = {};
        stockCounts.forEach(sc => { stockCountMap[sc._id.toString()] = sc.count; });

        const productosWithStock = productos.map(p => ({
            ...p.toObject(),
            stockCount: stockCountMap[p._id.toString()] || 0
        }));

        res.json(productosWithStock);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/apoderado/productos/:id
// @desc    Obtener un producto específico por ID
// @access  Privado (Apoderado)
router.get('/productos/:id', auth, async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id)
            .populate('fabricante')
            .populate('marca')
            .populate('garantia');

        if (!producto) {
            return res.status(404).json('Producto no encontrado.');
        }

        if (!(await hasAccessToProduct(req.usuario.id, producto))) {
            return res.status(401).json('No autorizado para acceder a este producto.');
        }

        res.json(producto);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   POST /api/apoderado/productos/:id/manuales
// @desc    Subir manuales para un producto
// @access  Privado (Apoderado)
router.post('/productos/:id/manuales', auth, async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id).populate('marca').populate('fabricante');

        if (!producto) {
            return res.status(404).json('Producto no encontrado.');
        }

        if (!(await hasAccessToProduct(req.usuario.id, producto))) {
            return res.status(401).json('No autorizado para subir archivos a este producto.');
        }

        // Validate that marca and modelo exist
        if (!producto.marca || !producto.marca.nombre) {
            return res.status(400).json('Producto no tiene marca asignada.');
        }
        
        if (!producto.modelo) {
            return res.status(400).json('Producto no tiene modelo asignado.');
        }

        // Set S3 path for the upload middleware
        const marcaNombre = producto.marca.nombre.replace(/[^a-zA-Z0-9]/g, '_');
        const modeloNombre = producto.modelo.replace(/[^a-zA-Z0-9]/g, '_');
        req.s3Path = `${marcaNombre}/${modeloNombre}`;

        console.log(`📁 Setting up upload for product: ${producto.modelo} (${producto.marca.nombre})`);
        console.log(`📁 S3 path will be: manuales/${req.s3Path}/`);

        // Handle the upload
        upload.array('manuales', 5)(req, res, async function (err) {
            if (err) {
                console.error('❌ Error uploading files:', err);
                
                // Provide more specific error messages
                let errorMessage = err.message;
                if (err.code === 'NoSuchBucket') {
                    errorMessage = 'Error de configuración: Bucket de S3 no encontrado. Contacte al administrador.';
                } else if (err.code === 'AccessDenied') {
                    errorMessage = 'Error de permisos: Sin acceso al storage. Contacte al administrador.';
                } else if (err.code === 'InvalidAccessKeyId') {
                    errorMessage = 'Error de configuración: Credenciales de AWS inválidas. Contacte al administrador.';
                } else if (err.code === 'SignatureDoesNotMatch') {
                    errorMessage = 'Error de configuración: Credenciales de AWS incorrectas. Contacte al administrador.';
                }
                
                return res.status(400).json({ error: errorMessage });
            }

            try {
                // Validate that files were actually uploaded
                if (!req.files || req.files.length === 0) {
                    return res.status(400).json('No se seleccionaron archivos para subir.');
                }

                console.log(`✅ Successfully uploaded ${req.files.length} files`);

                // Add the uploaded files to the product's manuales array
                const uploadedFiles = req.files.map(file => ({
                    originalName: file.originalname,
                    fileName: file.key.split('/').pop(),
                    s3Key: file.key,
                    url: `/api/apoderado/files/${Buffer.from(file.key).toString('base64')}`
                }));

                producto.manuales.push(...uploadedFiles);
                await producto.save();

                console.log(`✅ Product updated with ${uploadedFiles.length} new files`);

                res.json({ 
                    mensaje: 'Archivos subidos con éxito!', 
                    archivos: uploadedFiles 
                });
            } catch (saveErr) {
                console.error('❌ Error saving product:', saveErr);
                res.status(500).json('Error al guardar la información del archivo');
            }
        });
    } catch (err) {
        console.error('❌ Server error in file upload:', err.message);
        res.status(500).json('Error del servidor');
    }
});

// @route   DELETE /api/apoderado/productos/:id/manuales/:manualId
// @desc    Eliminar un manual de un producto
// @access  Privado (Apoderado)
router.delete('/productos/:id/manuales/:manualId', auth, async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);

        if (!producto) {
            return res.status(404).json('Producto no encontrado.');
        }

        if (!(await hasAccessToProduct(req.usuario.id, producto))) {
            return res.status(401).json('No autorizado para eliminar archivos de este producto.');
        }

        const manual = producto.manuales.id(req.params.manualId);
        if (!manual) {
            return res.status(404).json('Manual no encontrado.');
        }

        // Delete from S3
        try {
            await deleteFromS3(manual.s3Key);
        } catch (s3Error) {
            console.error('Error deleting from S3:', s3Error);
            // Continue anyway to remove from database
        }

        // Remove from product
        producto.manuales.pull(req.params.manualId);
        await producto.save();

        res.json('Manual eliminado con éxito!');
    } catch (err) {
        console.error(err.message);
        res.status(500).json('Error del servidor');
    }
});

// @route   POST /api/apoderado/productos/:id/imagen-principal
// @desc    Subir imagen principal para un producto
// @access  Privado (Apoderado)
router.post('/productos/:id/imagen-principal', auth, checkS3Connection, async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id).populate('marca').populate('fabricante');

        if (!producto) {
            return res.status(404).json('Producto no encontrado.');
        }

        if (!(await hasAccessToProduct(req.usuario.id, producto))) {
            return res.status(401).json('No autorizado para subir archivos a este producto.');
        }

        // Validate that marca and modelo exist
        if (!producto.marca || !producto.marca.nombre) {
            return res.status(400).json('Producto no tiene marca asignada.');
        }
        
        if (!producto.modelo) {
            return res.status(400).json('Producto no tiene modelo asignado.');
        }

        // Set S3 path for the upload middleware
        const marcaNombre = producto.marca.nombre.replace(/[^a-zA-Z0-9]/g, '_');
        const modeloNombre = producto.modelo.replace(/[^a-zA-Z0-9]/g, '_');
        req.s3Path = `${marcaNombre}/${modeloNombre}`;

        console.log(`📁 Setting up imagen principal upload for product: ${producto.modelo} (${producto.marca.nombre})`);

        // Handle the upload (single file only)
        uploadImagenPrincipal.single('imagenPrincipal')(req, res, async function (err) {
            if (err) {
                console.error('❌ Error uploading imagen principal:', err);
                console.error('❌ Upload error details:', {
                    code: err.code,
                    message: err.message,
                    stack: err.stack?.substring(0, 200)
                });
                
                if (err.message && err.message.includes('S3 path not set')) {
                    return res.status(500).json({ error: 'Error de configuración en la subida de archivos. Contacte al administrador.' });
                } else if (err.message && err.message.includes('Inaccessible host')) {
                    return res.status(503).json({ error: 'Servicio de almacenamiento temporalmente no disponible. Intente más tarde.' });
                }
                return res.status(400).json({ error: err.message });
            }

            try {
                if (!req.file) {
                    return res.status(400).json('No se seleccionó archivo para subir.');
                }

                console.log(`✅ Successfully uploaded imagen principal`);

                // Delete previous imagen principal from S3 if it exists
                if (producto.imagenPrincipal && producto.imagenPrincipal.s3Key) {
                    try {
                        await deleteFromS3(producto.imagenPrincipal.s3Key);
                    } catch (deleteErr) {
                        console.error('Error deleting previous imagen principal from S3:', deleteErr);
                    }
                }

                // Set the uploaded file as the product's imagen principal
                producto.imagenPrincipal = {
                    originalName: req.file.originalname,
                    fileName: req.file.key.split('/').pop(),
                    s3Key: req.file.key,
                    url: `/api/apoderado/files/${Buffer.from(req.file.key).toString('base64')}`
                };

                await producto.save();

                console.log(`✅ Product updated with new imagen principal`);

                res.json({ 
                    mensaje: 'Imagen principal subida con éxito!', 
                    archivo: producto.imagenPrincipal 
                });
            } catch (saveErr) {
                console.error('❌ Error saving product:', saveErr);
                res.status(500).json('Error al guardar la información del archivo');
            }
        });
    } catch (err) {
        console.error('❌ Server error in imagen principal upload:', err.message);
        res.status(500).json('Error del servidor');
    }
});

// @route   POST /api/apoderado/productos/:id/imagenes-adicionales
// @desc    Subir imágenes adicionales para un producto
// @access  Privado (Apoderado)
router.post('/productos/:id/imagenes-adicionales', auth, checkS3Connection, async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id).populate('marca').populate('fabricante');

        if (!producto) {
            return res.status(404).json('Producto no encontrado.');
        }

        if (!(await hasAccessToProduct(req.usuario.id, producto))) {
            return res.status(401).json('No autorizado para subir archivos a este producto.');
        }

        // Validate that marca and modelo exist
        if (!producto.marca || !producto.marca.nombre) {
            return res.status(400).json('Producto no tiene marca asignada.');
        }
        
        if (!producto.modelo) {
            return res.status(400).json('Producto no tiene modelo asignado.');
        }

        // Set S3 path for the upload middleware
        const marcaNombre = producto.marca.nombre.replace(/[^a-zA-Z0-9]/g, '_');
        const modeloNombre = producto.modelo.replace(/[^a-zA-Z0-9]/g, '_');
        req.s3Path = `${marcaNombre}/${modeloNombre}`;

        console.log(`📁 Setting up imagenes adicionales upload for product: ${producto.modelo} (${producto.marca.nombre})`);

        // Handle the upload (multiple files)
        uploadImagenesAdicionales.array('imagenesAdicionales', 10)(req, res, async function (err) {
            if (err) {
                console.error('❌ Error uploading imagenes adicionales:', err);
                console.error('❌ Upload error details:', {
                    code: err.code,
                    message: err.message,
                    stack: err.stack?.substring(0, 200)
                });
                
                if (err.message && err.message.includes('S3 path not set')) {
                    return res.status(500).json({ error: 'Error de configuración en la subida de archivos. Contacte al administrador.' });
                } else if (err.message && err.message.includes('Inaccessible host')) {
                    return res.status(503).json({ error: 'Servicio de almacenamiento temporalmente no disponible. Intente más tarde.' });
                }
                return res.status(400).json({ error: err.message });
            }

            try {
                if (!req.files || req.files.length === 0) {
                    return res.status(400).json('No se seleccionaron archivos para subir.');
                }

                console.log(`✅ Successfully uploaded ${req.files.length} imagenes adicionales`);

                // Add the uploaded files to the product's imagenesAdicionales array
                const uploadedFiles = req.files.map(file => ({
                    originalName: file.originalname,
                    fileName: file.key.split('/').pop(),
                    s3Key: file.key,
                    url: `/api/apoderado/files/${Buffer.from(file.key).toString('base64')}`
                }));

                producto.imagenesAdicionales.push(...uploadedFiles);
                await producto.save();

                console.log(`✅ Product updated with ${uploadedFiles.length} new imagenes adicionales`);

                res.json({ 
                    mensaje: 'Imágenes adicionales subidas con éxito!', 
                    archivos: uploadedFiles 
                });
            } catch (saveErr) {
                console.error('❌ Error saving product:', saveErr);
                res.status(500).json('Error al guardar la información del archivo');
            }
        });
    } catch (err) {
        console.error('❌ Server error in imagenes adicionales upload:', err.message);
        res.status(500).json('Error del servidor');
    }
});

// @route   POST /api/apoderado/productos/:id/videos
// @desc    Subir videos para un producto
// @access  Privado (Apoderado)
router.post('/productos/:id/videos', auth, async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id).populate('marca').populate('fabricante');

        if (!producto) {
            return res.status(404).json('Producto no encontrado.');
        }

        if (!(await hasAccessToProduct(req.usuario.id, producto))) {
            return res.status(401).json('No autorizado para subir archivos a este producto.');
        }

        // Validate that marca and modelo exist
        if (!producto.marca || !producto.marca.nombre) {
            return res.status(400).json('Producto no tiene marca asignada.');
        }
        
        if (!producto.modelo) {
            return res.status(400).json('Producto no tiene modelo asignado.');
        }

        // Set S3 path for the upload middleware
        const marcaNombre = producto.marca.nombre.replace(/[^a-zA-Z0-9]/g, '_');
        const modeloNombre = producto.modelo.replace(/[^a-zA-Z0-9]/g, '_');
        req.s3Path = `${marcaNombre}/${modeloNombre}`;

        console.log(`📁 Setting up videos upload for product: ${producto.modelo} (${producto.marca.nombre})`);

        // Handle the upload (multiple files)
        uploadVideos.array('videos', 5)(req, res, async function (err) {
            if (err) {
                console.error('❌ Error uploading videos:', err);
                return res.status(400).json({ error: err.message });
            }

            try {
                if (!req.files || req.files.length === 0) {
                    return res.status(400).json('No se seleccionaron archivos para subir.');
                }

                console.log(`✅ Successfully uploaded ${req.files.length} videos`);

                // Add the uploaded files to the product's videos array
                const uploadedFiles = req.files.map(file => ({
                    originalName: file.originalname,
                    fileName: file.key.split('/').pop(),
                    s3Key: file.key,
                    url: `/api/apoderado/files/${Buffer.from(file.key).toString('base64')}`
                }));

                producto.videos.push(...uploadedFiles);
                await producto.save();

                console.log(`✅ Product updated with ${uploadedFiles.length} new videos`);

                res.json({ 
                    mensaje: 'Videos subidos con éxito!', 
                    archivos: uploadedFiles 
                });
            } catch (saveErr) {
                console.error('❌ Error saving product:', saveErr);
                res.status(500).json('Error al guardar la información del archivo');
            }
        });
    } catch (err) {
        console.error('❌ Server error in videos upload:', err.message);
        res.status(500).json('Error del servidor');
    }
});

// @route   DELETE /api/apoderado/productos/:id/imagen-principal
// @desc    Eliminar imagen principal de un producto
// @access  Privado (Apoderado)
router.delete('/productos/:id/imagen-principal', auth, async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);

        if (!producto) {
            return res.status(404).json('Producto no encontrado.');
        }

        if (!(await hasAccessToProduct(req.usuario.id, producto))) {
            return res.status(401).json('No autorizado para eliminar archivos de este producto.');
        }

        if (!producto.imagenPrincipal || !producto.imagenPrincipal.s3Key) {
            return res.status(404).json('Imagen principal no encontrada.');
        }

        // Delete from S3
        try {
            await deleteFromS3(producto.imagenPrincipal.s3Key);
        } catch (s3Error) {
            console.error('Error deleting imagen principal from S3:', s3Error);
            // Continue anyway to remove from database
        }

        // Remove from product
        producto.imagenPrincipal = undefined;
        await producto.save();

        res.json('Imagen principal eliminada con éxito!');
    } catch (err) {
        console.error(err.message);
        res.status(500).json('Error del servidor');
    }
});

// @route   DELETE /api/apoderado/productos/:id/imagenes-adicionales/:imagenId
// @desc    Eliminar una imagen adicional de un producto
// @access  Privado (Apoderado)
router.delete('/productos/:id/imagenes-adicionales/:imagenId', auth, async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);

        if (!producto) {
            return res.status(404).json('Producto no encontrado.');
        }

        if (!(await hasAccessToProduct(req.usuario.id, producto))) {
            return res.status(401).json('No autorizado para eliminar archivos de este producto.');
        }

        const imagen = producto.imagenesAdicionales.id(req.params.imagenId);
        if (!imagen) {
            return res.status(404).json('Imagen adicional no encontrada.');
        }

        // Delete from S3
        try {
            await deleteFromS3(imagen.s3Key);
        } catch (s3Error) {
            console.error('Error deleting imagen adicional from S3:', s3Error);
            // Continue anyway to remove from database
        }

        // Remove from product
        producto.imagenesAdicionales.pull(req.params.imagenId);
        await producto.save();

        res.json('Imagen adicional eliminada con éxito!');
    } catch (err) {
        console.error(err.message);
        res.status(500).json('Error del servidor');
    }
});

// @route   DELETE /api/apoderado/productos/:id/videos/:videoId
// @desc    Eliminar un video de un producto
// @access  Privado (Apoderado)
router.delete('/productos/:id/videos/:videoId', auth, async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);

        if (!producto) {
            return res.status(404).json('Producto no encontrado.');
        }

        if (!(await hasAccessToProduct(req.usuario.id, producto))) {
            return res.status(401).json('No autorizado para eliminar archivos de este producto.');
        }

        const video = producto.videos.id(req.params.videoId);
        if (!video) {
            return res.status(404).json('Video no encontrado.');
        }

        // Delete from S3
        try {
            await deleteFromS3(video.s3Key);
        } catch (s3Error) {
            console.error('Error deleting video from S3:', s3Error);
            // Continue anyway to remove from database
        }

        // Remove from product
        producto.videos.pull(req.params.videoId);
        await producto.save();

        res.json('Video eliminado con éxito!');
    } catch (err) {
        console.error(err.message);
        res.status(500).json('Error del servidor');
    }
});

// @route   GET /api/apoderado/marcas
// @desc    Obtener todas las marcas asociadas a los fabricantes del apoderado
// @access  Privado (Apoderado)
router.get('/marcas', auth, async (req, res) => {
    try {
        const { activas_solo } = req.query;
        
        let additionalFilters = {};
        if (activas_solo === 'true') {
            additionalFilters.estado = 'Habilitado';
        }
        
        const fabricantes = await Fabricante.find(getFabricantesQuery(req.usuario.id, additionalFilters));
        const fabricanteIds = fabricantes.map(fab => fab._id);

        let marcasQuery = { fabricante: { $in: fabricanteIds } };
        if (activas_solo === 'true') {
            marcasQuery.estado = 'Activa';
        }

        const marcas = await Marca.find(marcasQuery).populate('fabricante');
        
        // Transform legacy S3 URLs to proxy URLs for backward compatibility
        const transformedMarcas = marcas.map(transformMarcaLegacyUrls);
        
        res.json(transformedMarcas);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   POST /api/apoderado/marcas/add
// @desc    Crear una nueva marca
// @access  Privado (Apoderado)
router.post('/marcas/add', auth, async (req, res) => {
    const { nombre, fabricante, estado } = req.body;
    const usuarioApoderado = req.usuario.id;

    try {
        const fabricanteAsociado = await Fabricante.findOne(getFabricantesQuery(usuarioApoderado, { _id: fabricante }));
        if (!fabricanteAsociado) {
            return res.status(403).json('No tienes permiso para agregar marcas a este fabricante.');
        }

        const nuevaMarca = new Marca({
            nombre,
            fabricante,
            usuarioApoderado,
            estado
        });

        await nuevaMarca.save();
        logAuditEvent({
            usuarioId: usuarioApoderado, fabricanteId: fabricante, accion: 'creacion',
            tipoEntidad: 'marca', entidadId: nuevaMarca._id, descripcionEntidad: nombre,
            detalles: { nombre, estado }
        });
        res.status(201).json('Marca creada con éxito!');
    } catch (err) {
        console.error(err.message);
        // Handle duplicate key error specifically
        if (err.code === 11000) {
            return res.status(400).json('Ya existe una marca con ese nombre para este fabricante.');
        }
        res.status(500).json('Error del servidor');
    }
});

// @route   DELETE /api/apoderado/marcas/:id
// @desc    Eliminar una marca
// @access  Privado (Apoderado)
router.delete('/marcas/:id', auth, async (req, res) => {
    try {
        const marca = await Marca.findById(req.params.id);

        if (!marca) {
            return res.status(404).json('Marca no encontrada.');
        }

        if (!(await hasAccessToMarca(req.usuario.id, marca))) {
            return res.status(401).json('No autorizado para eliminar esta marca.');
        }

        // Check if there are products referencing this marca
        const productos = await Producto.find({ marca: req.params.id });
        if (productos.length > 0) {
            return res.status(400).json('No se puede eliminar por referencias');
        }

        // Delete logo from S3 if exists
        if (marca.logo && marca.logo.key) {
            try {
                await deleteFromS3(marca.logo.key);
                console.log(`🗑️ Deleted logo for marca: ${marca.nombre}`);
            } catch (deleteError) {
                console.error('⚠️ Warning: Could not delete logo during marca deletion:', deleteError);
                // Continue with marca deletion even if logo deletion fails
            }
        }

        const marcaFabricanteId = marca.fabricante;
        const marcaNombre = marca.nombre;
        await marca.deleteOne();
        logAuditEvent({
            usuarioId: req.usuario.id, fabricanteId: marcaFabricanteId, accion: 'eliminacion',
            tipoEntidad: 'marca', entidadId: req.params.id, descripcionEntidad: marcaNombre
        });
        res.json('Marca eliminada.');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   PUT /api/apoderado/marcas/:id
// @desc    Actualizar una marca
// @access  Privado (Apoderado)
router.put('/marcas/:id', auth, async (req, res) => {
    try {
        const marca = await Marca.findById(req.params.id);

        if (!marca) {
            return res.status(404).json('Marca no encontrada.');
        }

        if (!(await hasAccessToMarca(req.usuario.id, marca))) {
            return res.status(401).json('No autorizado para actualizar esta marca.');
        }

        const anteriorMarca = { nombre: marca.nombre, estado: marca.estado };
        marca.nombre = req.body.nombre;
        marca.fabricante = req.body.fabricante;
        marca.estado = req.body.estado;

        await marca.save();
        const marcaChanges = getChangedFields(anteriorMarca, { nombre: req.body.nombre, estado: req.body.estado });
        if (Object.keys(marcaChanges.valorAnterior).length > 0) {
            logAuditEvent({
                usuarioId: req.usuario.id, fabricanteId: req.body.fabricante, accion: 'actualizacion',
                tipoEntidad: 'marca', entidadId: marca._id, descripcionEntidad: req.body.nombre,
                valorAnterior: marcaChanges.valorAnterior, valorNuevo: marcaChanges.valorNuevo
            });
        }
        res.json('Marca actualizada!');
    } catch (err) {
        console.error(err.message);
        // Handle duplicate key error specifically
        if (err.code === 11000) {
            return res.status(400).json('Ya existe una marca con ese nombre para este fabricante.');
        }
        res.status(500).json('Error del servidor');
    }
});

// @route   POST /api/apoderado/marcas/:id/logo
// @desc    Subir logo para una marca
// @access  Privado (Apoderado)
router.post('/marcas/:id/logo', auth, async (req, res) => {
    try {
        const marca = await Marca.findById(req.params.id);

        if (!marca) {
            return res.status(404).json('Marca no encontrada.');
        }

        if (!(await hasAccessToMarca(req.usuario.id, marca))) {
            return res.status(401).json('No autorizado para subir logo a esta marca.');
        }

        // Set S3 path for the upload middleware
        const marcaNombre = marca.nombre.replace(/[^a-zA-Z0-9]/g, '_');
        req.s3Path = `logomarca/${marcaNombre}`;

        console.log(`📁 Setting up logo upload for marca: ${marca.nombre}`);
        console.log(`📁 S3 path will be: ${req.s3Path}/`);

        // Handle the upload
        uploadLogoMarca.single('logo')(req, res, async function (err) {
            if (err) {
                console.error('❌ Error uploading logo:', err);
                
                // Provide more specific error messages
                let errorMessage = err.message;
                if (err.code === 'NoSuchBucket') {
                    errorMessage = 'Error de configuración: Bucket de S3 no encontrado. Contacte al administrador.';
                } else if (err.code === 'AccessDenied') {
                    errorMessage = 'Error de permisos: Sin acceso al storage. Contacte al administrador.';
                } else if (err.code === 'InvalidAccessKeyId') {
                    errorMessage = 'Error de configuración: Credenciales de AWS inválidas. Contacte al administrador.';
                } else if (err.code === 'LIMIT_FILE_SIZE') {
                    errorMessage = 'El archivo es demasiado grande. Máximo 2MB permitido.';
                } else if (err.message && err.message.includes('Solo se permiten archivos')) {
                    errorMessage = err.message;
                }
                
                return res.status(400).json(errorMessage);
            }

            if (!req.file) {
                return res.status(400).json('No se seleccionó ningún archivo.');
            }

            try {
                // Delete old logo if exists
                if (marca.logo && marca.logo.key) {
                    try {
                        await deleteFromS3(marca.logo.key);
                        console.log(`🗑️ Deleted old logo: ${marca.logo.key}`);
                    } catch (deleteError) {
                        console.error('⚠️ Warning: Could not delete old logo:', deleteError);
                        // Continue with upload even if old file deletion fails
                    }
                }

                // Update marca with new logo info
                marca.logo = {
                    url: `/api/apoderado/files/${Buffer.from(req.file.key).toString('base64')}`,
                    key: req.file.key,
                    originalName: req.file.originalname
                };

                await marca.save();

                console.log(`✅ Logo uploaded successfully for marca: ${marca.nombre}`);
                console.log(`📁 File location: ${req.file.location}`);

                res.json({
                    message: 'Logo subido exitosamente',
                    logo: marca.logo
                });

            } catch (saveError) {
                console.error('❌ Error saving marca with logo info:', saveError);
                
                // Try to cleanup uploaded file
                if (req.file && req.file.key) {
                    try {
                        await deleteFromS3(req.file.key);
                        console.log('🗑️ Cleaned up uploaded file after save error');
                    } catch (cleanupError) {
                        console.error('⚠️ Could not cleanup uploaded file:', cleanupError);
                    }
                }
                
                res.status(500).json('Error al guardar la información del logo');
            }
        });

    } catch (err) {
        console.error('❌ Error in logo upload route:', err);
        res.status(500).json('Error del servidor');
    }
});

// @route   DELETE /api/apoderado/marcas/:id/logo
// @desc    Eliminar logo de una marca
// @access  Privado (Apoderado)
router.delete('/marcas/:id/logo', auth, async (req, res) => {
    try {
        const marca = await Marca.findById(req.params.id);

        if (!marca) {
            return res.status(404).json('Marca no encontrada.');
        }

        if (!(await hasAccessToMarca(req.usuario.id, marca))) {
            return res.status(401).json('No autorizado para eliminar logo de esta marca.');
        }

        if (!marca.logo || !marca.logo.key) {
            return res.status(400).json('La marca no tiene logo para eliminar.');
        }

        try {
            // Delete file from S3
            await deleteFromS3(marca.logo.key);
            console.log(`🗑️ Deleted logo: ${marca.logo.key}`);

            // Remove logo info from marca
            marca.logo = undefined;
            await marca.save();

            res.json('Logo eliminado exitosamente');

        } catch (deleteError) {
            console.error('❌ Error deleting logo from S3:', deleteError);
            res.status(500).json('Error al eliminar el logo');
        }

    } catch (err) {
        console.error('❌ Error in logo delete route:', err);
        res.status(500).json('Error del servidor');
    }
});

// @route   GET /api/apoderado/ubicaciones
// @desc    Obtener todas las ubicaciones del apoderado
// @access  Privado (Apoderado)
router.get('/ubicaciones', auth, async (req, res) => {
    try {
        const ubicaciones = await Ubicacion.find({ usuarioApoderado: req.usuario.id })
            .populate('fabricante');
        res.json(ubicaciones);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   POST /api/apoderado/ubicaciones/add
// @desc    Crear una nueva ubicación
// @access  Privado (Apoderado)
router.post('/ubicaciones/add', auth, async (req, res) => {
    const { nombre, direccion, telefono, fabricante } = req.body;
    const usuarioApoderado = req.usuario.id;

    try {
        const nuevaUbicacion = new Ubicacion({
            nombre,
            direccion,
            telefono,
            fabricante: fabricante || null,
            usuarioApoderado
        });

        await nuevaUbicacion.save();
        if (fabricante) {
            logAuditEvent({
                usuarioId: usuarioApoderado, fabricanteId: fabricante, accion: 'creacion',
                tipoEntidad: 'ubicacion', entidadId: nuevaUbicacion._id, descripcionEntidad: nombre,
                detalles: { nombre, direccion, telefono }
            });
        }
        res.status(201).json('Ubicación creada con éxito!');
    } catch (err) {
        console.error(err.message);
        res.status(500).json('Error del servidor');
    }
});

// @route   PUT /api/apoderado/ubicaciones/:id
// @desc    Actualizar una ubicación
// @access  Privado (Apoderado)
router.put('/ubicaciones/:id', auth, async (req, res) => {
    const { nombre, direccion, telefono, fabricante } = req.body;

    try {
        const ubicacion = await Ubicacion.findById(req.params.id);

        if (!ubicacion) {
            return res.status(404).json('Ubicación no encontrada.');
        }

        if (ubicacion.usuarioApoderado.toString() !== req.usuario.id) {
            return res.status(401).json('No autorizado para actualizar esta ubicación.');
        }

        const anteriorUbicacion = { nombre: ubicacion.nombre, direccion: ubicacion.direccion, telefono: ubicacion.telefono };
        ubicacion.nombre = nombre;
        ubicacion.direccion = direccion;
        ubicacion.telefono = telefono;
        ubicacion.fabricante = fabricante || null;

        await ubicacion.save();
        const fabIdUbicacion = fabricante || ubicacion.fabricante;
        if (fabIdUbicacion) {
            const ubicChanges = getChangedFields(anteriorUbicacion, { nombre, direccion, telefono });
            if (Object.keys(ubicChanges.valorAnterior).length > 0) {
                logAuditEvent({
                    usuarioId: req.usuario.id, fabricanteId: fabIdUbicacion, accion: 'actualizacion',
                    tipoEntidad: 'ubicacion', entidadId: ubicacion._id, descripcionEntidad: nombre,
                    valorAnterior: ubicChanges.valorAnterior, valorNuevo: ubicChanges.valorNuevo
                });
            }
        }
        res.json('Ubicación actualizada con éxito!');
    } catch (err) {
        console.error(err.message);
        res.status(500).json('Error del servidor');
    }
});

// @route   DELETE /api/apoderado/ubicaciones/:id
// @desc    Eliminar una ubicación
// @access  Privado (Apoderado)
router.delete('/ubicaciones/:id', auth, async (req, res) => {
    try {
        const ubicacion = await Ubicacion.findById(req.params.id);

        if (!ubicacion) {
            return res.status(404).json('Ubicación no encontrada.');
        }

        if (ubicacion.usuarioApoderado.toString() !== req.usuario.id) {
            return res.status(401).json('No autorizado para eliminar esta ubicación.');
        }

        // Check if there are inventory items referencing this ubicacion
        const inventarioItems = await Inventario.find({ ubicacion: req.params.id });
        if (inventarioItems.length > 0) {
            return res.status(400).json('No se puede eliminar la ubicación porque tiene artículos de inventario asociados.');
        }

        const ubicFabricanteId = ubicacion.fabricante;
        const ubicNombre = ubicacion.nombre;
        await Ubicacion.findByIdAndDelete(req.params.id);
        if (ubicFabricanteId) {
            logAuditEvent({
                usuarioId: req.usuario.id, fabricanteId: ubicFabricanteId, accion: 'eliminacion',
                tipoEntidad: 'ubicacion', entidadId: req.params.id, descripcionEntidad: ubicNombre
            });
        }
        res.json('Ubicación eliminada con éxito!');
    } catch (err) {
        console.error(err.message);
        res.status(500).json('Error del servidor');
    }
});

// @route   GET /api/apoderado/inventario
// @desc    Obtener todos los artículos del inventario del apoderado, con opción de búsqueda y filtro
// @access  Privado (Apoderado)
router.get('/inventario', auth, async (req, res) => {
    const { search, estado, productoId, piezaId, ubicacion } = req.query; // Obtener los parámetros de búsqueda y filtro
    const usuarioApoderado = req.usuario.id;
    
    try {
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

        if (search) {
            // Buscar productos que coincidan con el término de búsqueda por ID
            const productos = await Producto.find({
                idProducto: { $regex: search, $options: 'i' },
                fabricante: { $in: fabricanteIds }
            }).select('_id');
            const productoIds = productos.map(producto => producto._id);

            // Buscar piezas que coincidan con el término de búsqueda por ID
            const piezas = await Pieza.find({
                $and: [
                    {
                        $or: [
                            { idPieza: { $regex: search, $options: 'i' } },
                            { nombre: { $regex: search, $options: 'i' } }
                        ]
                    },
                    {
                        $or: [
                            { usuarioApoderado },
                            { fabricante: { $in: fabricanteIds } }
                        ]
                    }
                ]
            }).select('_id');
            const piezaIds = piezas.map(pieza => pieza._id);

            // Combine base query with search criteria
            query.$and = [
                {
                    $or: [
                        { usuarioApoderado },
                        { producto: { $in: productoIdsAccesibles } },
                        { pieza: { $in: piezaIdsAccesibles } }
                    ]
                },
                {
                    $or: [
                        { idInventario: { $regex: search, $options: 'i' } },
                        { numeroSerie: { $regex: search, $options: 'i' } },
                        { producto: { $in: productoIds } },
                        { pieza: { $in: piezaIds } },
                        { 'comprador.nombreCompleto': { $regex: search, $options: 'i' } }
                    ]
                }
            ];
            // Remove the top-level $or since we're using $and
            delete query.$or;
        }

        if (estado && estado !== 'todos') {
            // Filtro por estado
            if (query.$and) {
                query.$and.push({ estado });
            } else {
                query.estado = estado;
            }
        }

        if (ubicacion) {
            // Filtro por ubicación/depósito
            if (query.$and) {
                query.$and.push({ ubicacion });
            } else {
                query.ubicacion = ubicacion;
            }
        }

        // Filtro por producto específico
        if (productoId) {
            if (query.$and) {
                query.$and.push({ producto: productoId });
            } else {
                query.$and = [
                    {
                        $or: [
                            { usuarioApoderado },
                            { producto: { $in: productoIdsAccesibles } },
                            { pieza: { $in: piezaIdsAccesibles } }
                        ]
                    },
                    { producto: productoId }
                ];
                delete query.$or;
            }
        }

        // Filtro por pieza específica
        if (piezaId) {
            if (query.$and) {
                query.$and.push({ pieza: piezaId });
            } else {
                query.$and = [
                    {
                        $or: [
                            { usuarioApoderado },
                            { producto: { $in: productoIdsAccesibles } },
                            { pieza: { $in: piezaIdsAccesibles } }
                        ]
                    },
                    { pieza: piezaId }
                ];
                delete query.$or;
            }
        }

        const inventario = await Inventario.find(query)
            .populate({
                path: 'producto',
                populate: { path: 'fabricante' }
            })
            .populate('pieza')
            .populate('ubicacion')
            .populate('representante');

        res.json(inventario);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   POST /api/apoderado/inventario/add
// @desc    Crear un nuevo artículo de inventario
// @access  Privado (Apoderado)
router.post('/inventario/add', auth, async (req, res) => {

    const { numeroSerie, estado, producto, pieza, comprador, atributos, fechaVenta, ubicacion } = req.body;

    const usuarioApoderado = req.usuario.id;

    try {
        // Validate that either producto or pieza is provided, but not both
        if (producto && pieza) {
            return res.status(400).json('Debe seleccionar un producto o una pieza, no ambos.');
        }
        if (!producto && !pieza) {
            return res.status(400).json('Debe seleccionar un producto o una pieza.');
        }

        // Verify access to the selected producto or pieza
        if (producto) {
            const productoAsociado = await Producto.findById(producto).populate('fabricante');
            if (!productoAsociado || !(await hasAccessToProduct(usuarioApoderado, productoAsociado))) {
                return res.status(403).json('No tienes permiso para agregar inventario a este producto.');
            }
        }

        if (pieza) {
            const piezaAsociada = await Pieza.findById(pieza).populate('fabricante');
            if (!piezaAsociada || !(await hasAccessToPieza(usuarioApoderado, piezaAsociada))) {
                return res.status(403).json('No tienes permiso para agregar inventario a esta pieza.');
            }
        }

        const nuevoItem = new Inventario({
            numeroSerie,
            estado,
            producto: producto || undefined,
            pieza: pieza || undefined,
            comprador,
            atributos: atributos || [],
            fechaVenta: fechaVenta || undefined, // Let the pre-save middleware handle it if not provided
            ubicacion: ubicacion || undefined,
            usuarioApoderado
        });

        await nuevoItem.save();
        // Determine fabricanteId for audit
        let invFabricanteId = null;
        if (producto) {
            const prodForAudit = await Producto.findById(producto).select('fabricante').lean();
            if (prodForAudit) invFabricanteId = prodForAudit.fabricante;
        } else if (pieza) {
            const piezaForAudit = await Pieza.findById(pieza).select('fabricante').lean();
            if (piezaForAudit) invFabricanteId = piezaForAudit.fabricante;
        }
        if (invFabricanteId) {
            logAuditEvent({
                usuarioId: usuarioApoderado, fabricanteId: invFabricanteId, accion: 'creacion',
                tipoEntidad: 'inventario', entidadId: nuevoItem._id, descripcionEntidad: numeroSerie,
                detalles: { numeroSerie, estado, producto, pieza, ubicacion }
            });
        }
        res.status(201).json('Artículo de inventario creado con éxito!');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/apoderado/inventario/:id
// @desc    Get a single inventory item by ID
// @access  Private (Apoderado)
router.get('/inventario/:id', auth, async (req, res) => {
    try {
        const item = await Inventario.findById(req.params.id)
            .populate('producto', 'modelo imagenPrincipal')
            .populate('pieza', 'nombre')
            .populate('ubicacion', 'nombre');
        if (!item) {
            return res.status(404).json({ msg: 'Item de inventario no encontrado' });
        }
        res.json(item);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   PUT /api/apoderado/inventario/:id
// @desc    Actualizar un artículo de inventario
// @access  Privado (Apoderado)
router.put('/inventario/:id', auth, async (req, res) => {

    const { numeroSerie, estado, producto, pieza, comprador, atributos, fechaVenta, ubicacion, representante, fechaInicioAlquiler, fechaFinAlquiler } = req.body;

    try {
        const item = await Inventario.findById(req.params.id);

        if (!item) {
            return res.status(404).json('Artículo de inventario no encontrado.');
        }

        if (!(await hasAccessToInventario(req.usuario.id, item))) {
            return res.status(401).json('No autorizado para actualizar este artículo.');
        }

        // Validate that either producto or pieza is provided, but not both
        if (producto && pieza) {
            return res.status(400).json('Debe seleccionar un producto o una pieza, no ambos.');
        }
        if (!producto && !pieza) {
            return res.status(400).json('Debe seleccionar un producto o una pieza.');
        }

        // Verify access to the selected producto or pieza
        if (producto) {
            const productoAsociado = await Producto.findById(producto);
            if (!productoAsociado) {
                return res.status(404).json('Producto asociado no encontrado.');
            }
        }

        if (pieza) {
            const piezaAsociada = await Pieza.findById(pieza);
            if (!piezaAsociada) {
                return res.status(404).json('Pieza asociada no encontrada.');
            }
        }

        const anteriorItem = { numeroSerie: item.numeroSerie, estado: item.estado, producto: item.producto, pieza: item.pieza, ubicacion: item.ubicacion, representante: item.representante };

        item.numeroSerie = numeroSerie;
        item.estado = estado;
        item.producto = producto || undefined;
        item.pieza = pieza || undefined;
        item.comprador = comprador;
        item.atributos = atributos || [];
        item.ubicacion = ubicacion || undefined;
        item.representante = representante || null;

        // Handle fechaVenta logic
        if (fechaVenta) {
            item.fechaVenta = fechaVenta;
        } else if (estado === 'vendido' && !item.fechaVenta) {
            item.fechaVenta = undefined;
        } else if (estado !== 'vendido') {
            item.fechaVenta = undefined;
        }

        // Handle rental dates
        if (estado === 'alquilado') {
            if (fechaInicioAlquiler) item.fechaInicioAlquiler = fechaInicioAlquiler;
            if (fechaFinAlquiler) item.fechaFinAlquiler = fechaFinAlquiler;
        }

        await item.save();
        // Audit log for inventory update
        let invUpdFabId = null;
        if (producto) {
            const pAudit = await Producto.findById(producto).select('fabricante').lean();
            if (pAudit) invUpdFabId = pAudit.fabricante;
        } else if (pieza) {
            const pzAudit = await Pieza.findById(pieza).select('fabricante').lean();
            if (pzAudit) invUpdFabId = pzAudit.fabricante;
        }
        if (invUpdFabId) {
            const invChanges = getChangedFields(anteriorItem, { numeroSerie, estado, producto, pieza, ubicacion, representante });
            if (Object.keys(invChanges.valorAnterior).length > 0) {
                logAuditEvent({
                    usuarioId: req.usuario.id, fabricanteId: invUpdFabId, accion: 'actualizacion',
                    tipoEntidad: 'inventario', entidadId: item._id, descripcionEntidad: numeroSerie,
                    valorAnterior: invChanges.valorAnterior, valorNuevo: invChanges.valorNuevo
                });
            }
        }
        res.json('Artículo de inventario actualizado!');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   DELETE /api/apoderado/inventario/:id
// @desc    Eliminar un artículo de inventario
// @access  Privado (Apoderado)
router.delete('/inventario/:id', auth, async (req, res) => {
    try {
        const item = await Inventario.findById(req.params.id);

        if (!item) {
            return res.status(404).json('Artículo de inventario no encontrado.');
        }

        if (!(await hasAccessToInventario(req.usuario.id, item))) {
            return res.status(401).json('No autorizado para eliminar este artículo.');
        }

        const invDelSerie = item.numeroSerie;
        let invDelFabId = null;
        if (item.producto) {
            const pDel = await Producto.findById(item.producto).select('fabricante').lean();
            if (pDel) invDelFabId = pDel.fabricante;
        } else if (item.pieza) {
            const pzDel = await Pieza.findById(item.pieza).select('fabricante').lean();
            if (pzDel) invDelFabId = pzDel.fabricante;
        }
        await item.deleteOne();
        if (invDelFabId) {
            logAuditEvent({
                usuarioId: req.usuario.id, fabricanteId: invDelFabId, accion: 'eliminacion',
                tipoEntidad: 'inventario', entidadId: req.params.id, descripcionEntidad: invDelSerie
            });
        }
        res.json('Artículo de inventario eliminado.');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   POST /api/apoderado/inventario/generate-serial
// @desc    Generate a unique serial number for inventory
// @access  Private (Apoderado)
router.post('/inventario/generate-serial', auth, async (req, res) => {
    try {
        let serialNumber;
        let attempts = 0;
        const maxAttempts = 10;

        // Generate unique serial number
        do {
            serialNumber = generateSerialNumber();
            attempts++;
            
            if (attempts >= maxAttempts) {
                return res.status(500).json('No se pudo generar un número de serie único después de varios intentos.');
            }
            
            // Check if serial number already exists
            const existingItem = await Inventario.findOne({ numeroSerie: serialNumber });
            if (!existingItem) {
                break;
            }
        } while (attempts < maxAttempts);

        res.json({ numeroSerie: serialNumber });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/apoderado/regions
// @desc    Obtener las provincias y localidades argentinas
// @access  Privado (Apoderado)
router.get('/regions', auth, async (req, res) => {
    try {
        res.json(argentineRegions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/apoderado/metricas
// @desc    Obtener métricas del usuario: contadores de fabricantes, productos, inventario y marcas
// @access  Privado (Apoderado)
router.get('/metricas', auth, async (req, res) => {
    try {
        const usuarioApoderado = req.usuario.id;

        // Obtener fabricantes asociados al apoderado o donde sea administrador
        const fabricantes = await Fabricante.find({
            $or: [
                { usuarioApoderado },
                { administradores: usuarioApoderado }
            ]
        }).select('_id stockBajoUmbral rangoNuevos');
        const fabricanteIds = fabricantes.map(fab => fab._id);

        // Determine rangoNuevos date threshold
        const rangoNuevos = fabricantes[0]?.rangoNuevos || 'ultimo_mes';
        const rangoMap = {
            'ultima_semana': 7,
            'ultimas_2_semanas': 14,
            'ultimo_mes': 30,
            'ultimos_2_meses': 60,
            'ultimos_3_meses': 90,
            'ultimos_6_meses': 180
        };
        const rangoDias = rangoMap[rangoNuevos] || 30;
        const rangoFecha = new Date();
        rangoFecha.setDate(rangoFecha.getDate() - rangoDias);

        // Contar productos
        const productosCount = await Producto.countDocuments({ 
            fabricante: { $in: fabricanteIds } 
        });

        // Contar marcas
        const marcasCount = await Marca.countDocuments({ 
            fabricante: { $in: fabricanteIds } 
        });

        // Contar inventario
        const inventarioCount = await Inventario.countDocuments({ 
            usuarioApoderado 
        });

        // Contar piezas
        const piezasCount = await Pieza.countDocuments({ 
            fabricante: { $in: fabricanteIds } 
        });

        // Contar representantes (same broader query as GET /representantes)
        const marcas = await Marca.find({
            $or: [
                { fabricante: { $in: fabricanteIds } },
                { usuarioApoderado: usuarioApoderado }
            ]
        });
        const marcaIds = marcas.map(m => m._id);

        const representantesQuery = {
            $or: [
                { usuarioApoderado: usuarioApoderado },
                { marcasRepresentadas: { $in: marcaIds } }
            ]
        };

        const representantesCount = await Representante.countDocuments(representantesQuery);

        // Estadísticas adicionales
        const productosActivos = await Producto.countDocuments({ 
            fabricante: { $in: fabricanteIds },
            estado: 'Activo'
        });

        const marcasActivas = await Marca.countDocuments({ 
            fabricante: { $in: fabricanteIds },
            estado: 'Activa'
        });

        const inventarioDisponible = await Inventario.countDocuments({ 
            usuarioApoderado,
            estado: 'stock'
        });

        const inventarioVendido = await Inventario.countDocuments({ 
            usuarioApoderado,
            estado: 'vendido'
        });

        const inventarioRegistrado = await Inventario.countDocuments({ 
            usuarioApoderado,
            registrado: 'Si'
        });

        const representantesActivos = await Representante.countDocuments({ 
            ...representantesQuery,
            estado: 'Activo'
        });

        const representantesInactivos = await Representante.countDocuments({ 
            ...representantesQuery,
            estado: 'Inactivo'
        });

        const inicioMes = new Date();
        inicioMes.setUTCDate(1);
        inicioMes.setUTCHours(0, 0, 0, 0);
        const representantesNuevosEsteMes = await Representante.countDocuments({
            ...representantesQuery,
            createdAt: { $gte: inicioMes }
        });

        // Contar pedidos de garantía
        const garantiasTotalCount = await PedidoGarantia.countDocuments({
            fabricante: { $in: fabricanteIds }
        });
        const garantiasEnCursoCount = await PedidoGarantia.countDocuments({
            fabricante: { $in: fabricanteIds },
            estado: { $in: ['Nuevo', 'En Análisis'] }
        });
        const garantiasCerradasCount = await PedidoGarantia.countDocuments({
            fabricante: { $in: fabricanteIds },
            estado: 'Cerrado'
        });

        // Stock bajo: productos y piezas con stock en inventario <= umbral por fabricante
        const inventarioPorProducto = await Inventario.aggregate([
            { $match: { producto: { $exists: true, $ne: null }, usuarioApoderado: new (require('mongoose').Types.ObjectId)(usuarioApoderado), estado: 'stock' } },
            { $group: { _id: '$producto', count: { $sum: 1 } } }
        ]);
        const productStockMap = {};
        inventarioPorProducto.forEach(item => { productStockMap[item._id.toString()] = item.count; });

        const inventarioPorPieza = await Inventario.aggregate([
            { $match: { pieza: { $exists: true, $ne: null }, usuarioApoderado: new (require('mongoose').Types.ObjectId)(usuarioApoderado), estado: 'stock' } },
            { $group: { _id: '$pieza', count: { $sum: 1 } } }
        ]);
        const piezaStockMap = {};
        inventarioPorPieza.forEach(item => { piezaStockMap[item._id.toString()] = item.count; });

        const allProductos = await Producto.find({
            fabricante: { $in: fabricanteIds },
            estado: 'Activo'
        }).select('_id fabricante');
        let productosStockBajo = 0;
        let productosSinStock = 0;
        for (const prod of allProductos) {
            const fab = fabricantes.find(f => f._id.equals(prod.fabricante));
            const umbral = fab && fab.stockBajoUmbral != null ? fab.stockBajoUmbral : 3;
            const stockCount = productStockMap[prod._id.toString()] || 0;
            if (stockCount > 0 && stockCount <= umbral) productosStockBajo++;
            if (stockCount === 0) productosSinStock++;
        }

        const allPiezas = await Pieza.find({ fabricante: { $in: fabricanteIds } }).select('_id fabricante');
        let piezasStockBajo = 0;
        let piezasSinStock = 0;
        for (const pieza of allPiezas) {
            const fab = fabricantes.find(f => f._id.equals(pieza.fabricante));
            const umbral = fab && fab.stockBajoUmbral != null ? fab.stockBajoUmbral : 3;
            const stockCount = piezaStockMap[pieza._id.toString()] || 0;
            if (stockCount > 0 && stockCount <= umbral) piezasStockBajo++;
            if (stockCount === 0) piezasSinStock++;
        }

        // Top 5 bienes con más pedidos de garantía
        const top5Bienes = await PedidoGarantia.aggregate([
            { $match: { fabricante: { $in: fabricanteIds } } },
            { $group: { _id: '$bien', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'biens',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'bienData'
                }
            },
            { $unwind: { path: '$bienData', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    count: 1,
                    nombre: { $ifNull: ['$bienData.nombre', 'Bien eliminado'] }
                }
            }
        ]);

        // --- Client metrics ---
        // Total clients: distinct usuarios with registered bienes for these fabricantes
        const clientesDistintos = await Bien.aggregate([
            { $match: { tipo: 'registrado', 'datosProducto.fabricante': { $in: fabricanteIds } } },
            { $group: { _id: '$usuario' } }
        ]);
        const clientesTotal = clientesDistintos.length;

        // Clients with active warranties (bienes that have a warranty assigned)
        const clientesConGarantia = await Bien.aggregate([
            { $match: { tipo: 'registrado', 'datosProducto.fabricante': { $in: fabricanteIds }, 'datosProducto.garantia': { $exists: true, $ne: null } } },
            { $group: { _id: '$usuario' } }
        ]);
        const clientesConGarantiasActivas = clientesConGarantia.length;

        // New clients: usuarios whose FIRST registered bien for these fabricantes was within rangoFecha
        const clientesPrimeros = await Bien.aggregate([
            { $match: { tipo: 'registrado', 'datosProducto.fabricante': { $in: fabricanteIds } } },
            { $group: { _id: '$usuario', primeraFecha: { $min: '$createdAt' } } },
            { $match: { primeraFecha: { $gte: rangoFecha } } }
        ]);
        const clientesNuevos = clientesPrimeros.length;

        // New registered products within range
        const nuevosProductosRegistrados = await Bien.countDocuments({
            tipo: 'registrado',
            'datosProducto.fabricante': { $in: fabricanteIds },
            createdAt: { $gte: rangoFecha }
        });

        // Clients that require attention: have open warranty claims
        const clientesConReclamosAbiertos = await PedidoGarantia.aggregate([
            { $match: { fabricante: { $in: fabricanteIds }, estado: { $in: ['Nuevo', 'En Análisis'] } } },
            { $lookup: { from: 'biens', localField: 'bien', foreignField: '_id', as: 'bienData' } },
            { $unwind: { path: '$bienData', preserveNullAndEmptyArrays: true } },
            { $group: { _id: '$bienData.usuario' } },
            { $match: { _id: { $ne: null } } }
        ]);
        const clientesRequierenAtencion = clientesConReclamosAbiertos.length;

        // Contar garantías asignadas
        const garantiasAsignadasQuery = { fabricante: { $in: fabricanteIds } };
        const garantiasAsignadasTotal = await GarantiaAsignada.countDocuments(garantiasAsignadasQuery);
        const garantiasAsignadasPendientes = await GarantiaAsignada.countDocuments({ ...garantiasAsignadasQuery, estado: 'Pendiente' });
        const garantiasAsignadasValidadas = await GarantiaAsignada.countDocuments({ ...garantiasAsignadasQuery, estado: 'Validada' });
        const garantiasAsignadasRechazadas = await GarantiaAsignada.countDocuments({ ...garantiasAsignadasQuery, estado: 'Rechazada' });

        // Products descontinuados count
        const productosDescontinuados = await Producto.countDocuments({
            fabricante: { $in: fabricanteIds },
            estado: 'Descontinuado'
        });

        // Piezas activas count (piezas have no estado field, all are considered active)
        const piezasActivas = await Pieza.countDocuments({
            fabricante: { $in: fabricanteIds }
        });

        res.json({
            fabricantes: fabricantes.length,
            productos: productosCount,
            marcas: marcasCount,
            inventario: inventarioCount,
            piezas: piezasCount,
            representantes: representantesCount,
            garantias: {
                total: garantiasTotalCount,
                enCurso: garantiasEnCursoCount,
                cerradas: garantiasCerradasCount,
                top5Bienes
            },
            stockBajo: {
                productos: productosStockBajo,
                piezas: piezasStockBajo
            },
            sinStock: {
                productos: productosSinStock,
                piezas: piezasSinStock
            },
            clientes: {
                total: clientesTotal,
                conGarantiasActivas: clientesConGarantiasActivas,
                nuevos: clientesNuevos,
                nuevosProductosRegistrados,
                requierenAtencion: clientesRequierenAtencion
            },
            garantiasAsignadas: {
                total: garantiasAsignadasTotal,
                pendientes: garantiasAsignadasPendientes,
                validadas: garantiasAsignadasValidadas,
                rechazadas: garantiasAsignadasRechazadas
            },
            productosDescontinuados,
            piezasActivas,
            rangoNuevos,
            estadisticas: {
                productosActivos,
                marcasActivas,
                inventarioDisponible,
                inventarioVendido,
                inventarioRegistrado,
                representantesActivos,
                representantesInactivos,
                representantesNuevosEsteMes
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/apoderado/mapa
// @desc    Obtener datos de geolocalización para el mapa del dashboard
// @access  Privado (Apoderado)
router.get('/mapa', auth, async (req, res) => {
    try {
        const usuarioApoderado = req.usuario.id;

        // Get fabricantes where user is apoderado or administrador
        const fabricantes = await Fabricante.find(getFabricantesQuery(usuarioApoderado));
        const fabricanteIds = fabricantes.map(fab => fab._id);

        // Get marcas for these fabricantes
        const marcas = await Marca.find({
            $or: [
                { fabricante: { $in: fabricanteIds } },
                { usuarioApoderado: usuarioApoderado }
            ]
        });
        const marcaIds = marcas.map(m => m._id);

        // Get representantes with coordinates
        const representantes = await Representante.find({
            $or: [
                { usuarioApoderado: usuarioApoderado },
                { marcasRepresentadas: { $in: marcaIds } }
            ],
            estado: 'Activo'
        }).select('razonSocial nombre direccion coordenadas cobertura sucursales tipoRepresentante');

        // Build representantes map data
        const representantesData = representantes
            .filter(rep => rep.coordenadas && rep.coordenadas.lat && rep.coordenadas.lng)
            .map(rep => {
                return {
                    _id: rep._id,
                    nombre: rep.nombre,
                    razonSocial: rep.razonSocial,
                    direccion: rep.direccion,
                    coordenadas: rep.coordenadas,
                    cobertura: rep.cobertura?.provincias || [],
                    tipoRepresentante: rep.tipoRepresentante || null,
                    sucursales: (rep.sucursales || [])
                        .filter(s => s.coordenadas && s.coordenadas.lat && s.coordenadas.lng)
                        .map(s => ({
                            nombre: s.nombre,
                            direccion: s.direccion,
                            coordenadas: s.coordenadas
                        }))
                };
            });

        // Get registered products with buyer coordinates
        const productosRegistrados = await Inventario.find({
            usuarioApoderado: usuarioApoderado,
            registrado: 'Si',
            'comprador.coordenadas.lat': { $ne: null },
            'comprador.coordenadas.lng': { $ne: null }
        })
        .populate('producto', 'modelo')
        .select('comprador producto numeroSerie idInventario');

        const productosData = productosRegistrados.map(inv => ({
            _id: inv._id,
            nombreProducto: inv.producto?.modelo || `Serie: ${inv.numeroSerie}`,
            comprador: inv.comprador?.nombreCompleto || '',
            direccion: inv.comprador?.direccion || '',
            provincia: inv.comprador?.provincia || '',
            coordenadas: inv.comprador?.coordenadas
        }));

        // Build fabricantes map data (only those with valid coordinates)
        const fabricantesData = fabricantes
            .filter(fab => fab.coordenadas && fab.coordenadas.lat && fab.coordenadas.lng)
            .map(fab => ({
                _id: fab._id,
                razonSocial: fab.razonSocial,
                direccion: fab.direccion || '',
                coordenadas: fab.coordenadas
            }));

        res.json({
            representantes: representantesData,
            productosRegistrados: productosData,
            fabricantes: fabricantesData
        });
    } catch (err) {
        console.error('Error al obtener datos del mapa:', err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/apoderado/distribucion-provincias
// @desc    Obtener distribución por provincia de representantes, clientes y garantías activas
// @access  Privado (Apoderado)
router.get('/distribucion-provincias', auth, async (req, res) => {
    try {
        const usuarioApoderado = req.usuario.id;

        const fabricantes = await Fabricante.find(getFabricantesQuery(usuarioApoderado));
        const fabricanteIds = fabricantes.map(fab => fab._id);

        const marcas = await Marca.find({
            $or: [
                { fabricante: { $in: fabricanteIds } },
                { usuarioApoderado: usuarioApoderado }
            ]
        });
        const marcaIds = marcas.map(m => m._id);

        // 1. Representantes por provincia (from cobertura.provincias)
        const representantes = await Representante.find({
            $or: [
                { usuarioApoderado: usuarioApoderado },
                { marcasRepresentadas: { $in: marcaIds } }
            ],
            estado: 'Activo'
        }).select('cobertura');

        const repsPorProvincia = {};
        representantes.forEach(rep => {
            const provs = rep.cobertura?.provincias || [];
            provs.forEach(prov => {
                if (prov) {
                    repsPorProvincia[prov] = (repsPorProvincia[prov] || 0) + 1;
                }
            });
        });

        // 2. Clientes por provincia (from inventario.comprador.provincia)
        const clientesProv = await Inventario.aggregate([
            {
                $match: {
                    usuarioApoderado: new (require('mongoose').Types.ObjectId)(usuarioApoderado),
                    registrado: 'Si',
                    'comprador.provincia': { $exists: true, $ne: '' }
                }
            },
            {
                $group: {
                    _id: { provincia: '$comprador.provincia', usuario: '$comprador.nombreCompleto' }
                }
            },
            {
                $group: {
                    _id: '$_id.provincia',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const clientesPorProvincia = {};
        clientesProv.forEach(item => {
            if (item._id) clientesPorProvincia[item._id] = item.count;
        });

        // 3. Garantías activas por provincia
        const garantiasProv = await PedidoGarantia.aggregate([
            {
                $match: {
                    fabricante: { $in: fabricanteIds },
                    estado: { $in: ['Nuevo', 'En Análisis'] }
                }
            },
            {
                $lookup: {
                    from: 'biens',
                    localField: 'bien',
                    foreignField: '_id',
                    as: 'bienData'
                }
            },
            { $unwind: { path: '$bienData', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'inventarios',
                    localField: 'bienData.inventario',
                    foreignField: '_id',
                    as: 'invData'
                }
            },
            { $unwind: { path: '$invData', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$invData.comprador.provincia',
                    count: { $sum: 1 }
                }
            },
            { $match: { _id: { $ne: null, $ne: '' } } },
            { $sort: { count: -1 } }
        ]);

        const garantiasPorProvincia = {};
        garantiasProv.forEach(item => {
            if (item._id) garantiasPorProvincia[item._id] = item.count;
        });

        res.json({
            representantes: repsPorProvincia,
            clientes: clientesPorProvincia,
            garantias: garantiasPorProvincia
        });
    } catch (err) {
        console.error('Error al obtener distribución por provincia:', err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/apoderado/representantes
// @desc    Obtener todos los representantes del apoderado
// @access  Privado (Apoderado)
router.get('/representantes', auth, async (req, res) => {
    const { search, estado } = req.query;
    const usuarioApoderado = req.usuario.id;

    try {
        // Get fabricantes where user is apoderado or administrador
        const fabricantes = await Fabricante.find(getFabricantesQuery(usuarioApoderado));
        const fabricanteIds = fabricantes.map(fab => fab._id);
        
        // Get marcas for these fabricantes
        const marcas = await Marca.find({ 
            $or: [
                { fabricante: { $in: fabricanteIds } },
                { usuarioApoderado: usuarioApoderado }
            ]
        });
        const marcaIds = marcas.map(m => m._id);
        
        // Build query to find representantes
        let query = {
            $or: [
                { usuarioApoderado: usuarioApoderado },
                { marcasRepresentadas: { $in: marcaIds } }
            ]
        };

        if (search) {
            query.$and = query.$and || [];
            query.$and.push({
                $or: [
                    { nombre: { $regex: search, $options: 'i' } },
                    { cuit: { $regex: search, $options: 'i' } },
                    { correo: { $regex: search, $options: 'i' } },
                    { telefono: { $regex: search, $options: 'i' } }
                ]
            });
        }

        if (estado && estado !== 'todos') {
            query.estado = estado;
        }

        const representantes = await Representante.find(query)
            .populate({
                path: 'marcasRepresentadas',
                populate: {
                    path: 'fabricante',
                    select: 'razonSocial'
                }
            });
        
        // Transform legacy S3 URLs to proxy URLs for backward compatibility in populated marcas
        const transformedRepresentantes = representantes.map(rep => {
            if (rep.marcasRepresentadas && Array.isArray(rep.marcasRepresentadas)) {
                rep.marcasRepresentadas = rep.marcasRepresentadas.map(transformMarcaLegacyUrls);
            }
            return rep;
        });
        
        res.json(transformedRepresentantes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   POST /api/apoderado/representantes/add
// @desc    Crear un nuevo representante
// @access  Privado (Apoderado)
router.post('/representantes/add', auth, async (req, res) => {
    const {
        razonSocial,
        nombre,
        cuit,
        cobertura,
        direccion,
        telefono,
        telefonoAdicional,
        correo,
        correoAdicional,
        sitioWeb,
        estado,
        marcasRepresentadas,
        sucursales,
        checklistData
    } = req.body;
    const usuarioApoderado = req.usuario.id;

    try {
        // Geocode the address
        const coordenadas = await geocodeAddress(direccion);

        // Geocode sucursales addresses
        const sucursalesConCoordenadas = [];
        if (sucursales && sucursales.length > 0) {
            for (const suc of sucursales) {
                const sucCoords = await geocodeAddress(suc.direccion);
                sucursalesConCoordenadas.push({
                    nombre: suc.nombre,
                    direccion: suc.direccion,
                    telefono: suc.telefono || '',
                    correo: suc.correo || '',
                    coordenadas: sucCoords || { lat: null, lng: null }
                });
            }
        }

        const nuevoRepresentante = new Representante({
            razonSocial,
            nombre,
            cuit,
            cobertura,
            direccion,
            telefono,
            telefonoAdicional,
            correo,
            correoAdicional,
            sitioWeb,
            estado,
            usuarioApoderado,
            marcasRepresentadas: marcasRepresentadas || [],
            coordenadas: coordenadas || { lat: null, lng: null },
            sucursales: sucursalesConCoordenadas,
            checklistData: checklistData || []
        });

        await nuevoRepresentante.save();
        // Get fabricante from marcasRepresentadas for audit
        if (marcasRepresentadas && marcasRepresentadas.length > 0) {
            const marcaForAudit = await Marca.findById(marcasRepresentadas[0]).select('fabricante').lean();
            if (marcaForAudit && marcaForAudit.fabricante) {
                logAuditEvent({
                    usuarioId: usuarioApoderado, fabricanteId: marcaForAudit.fabricante, accion: 'creacion',
                    tipoEntidad: 'representante', entidadId: nuevoRepresentante._id, descripcionEntidad: razonSocial || nombre,
                    detalles: { razonSocial, nombre, cuit, direccion, telefono, correo, estado }
                });
            }
        }
        res.status(201).json('Representante creado con éxito!');
    } catch (err) {
        console.error(err.message);
        if (err.code === 11000) {
            return res.status(400).json('Ya existe un representante con ese CUIT.');
        }
        res.status(500).json('Error del servidor');
    }
});

// @route   PUT /api/apoderado/representantes/:id
// @desc    Actualizar un representante
// @access  Privado (Apoderado)
router.put('/representantes/:id', auth, async (req, res) => {
    try {
        const representante = await Representante.findById(req.params.id);

        if (!representante) {
            return res.status(404).json('Representante no encontrado.');
        }

        if (!(await hasAccessToRepresentante(req.usuario.id, representante))) {
            return res.status(401).json('No autorizado para actualizar este representante.');
        }

        const {
            razonSocial,
            nombre,
            cuit,
            cobertura,
            direccion,
            telefono,
            telefonoAdicional,
            correo,
            correoAdicional,
            sitioWeb,
            estado,
            marcasRepresentadas,
            sucursales,
            checklistData
        } = req.body;

        // Re-geocode if address changed
        if (direccion && direccion !== representante.direccion) {
            const coordenadas = await geocodeAddress(direccion);
            if (coordenadas) {
                representante.coordenadas = coordenadas;
            }
        }

        // Process sucursales - geocode new/changed addresses
        const sucursalesConCoordenadas = [];
        if (sucursales && sucursales.length > 0) {
            for (const suc of sucursales) {
                const existingSuc = (representante.sucursales || []).find(
                    s => s._id && suc._id && s._id.toString() === suc._id.toString()
                );
                let sucCoords = suc.coordenadas || { lat: null, lng: null };
                if (!existingSuc || existingSuc.direccion !== suc.direccion) {
                    const geocoded = await geocodeAddress(suc.direccion);
                    if (geocoded) sucCoords = geocoded;
                }
                sucursalesConCoordenadas.push({
                    nombre: suc.nombre,
                    direccion: suc.direccion,
                    telefono: suc.telefono || '',
                    correo: suc.correo || '',
                    coordenadas: sucCoords
                });
            }
        }

        const anteriorRep = { razonSocial: representante.razonSocial, nombre: representante.nombre, cuit: representante.cuit, direccion: representante.direccion, telefono: representante.telefono, correo: representante.correo, estado: representante.estado };

        representante.razonSocial = razonSocial;
        representante.nombre = nombre;
        representante.cuit = cuit;
        representante.cobertura = cobertura;
        representante.direccion = direccion;
        representante.telefono = telefono;
        representante.telefonoAdicional = telefonoAdicional;
        representante.correo = correo;
        representante.correoAdicional = correoAdicional;
        representante.sitioWeb = sitioWeb;
        representante.estado = estado;
        representante.marcasRepresentadas = marcasRepresentadas || [];
        representante.sucursales = sucursalesConCoordenadas;
        if (checklistData !== undefined) {
            representante.checklistData = checklistData;
        }

        await representante.save();
        // Audit log for representante update
        const repMarcas = marcasRepresentadas && marcasRepresentadas.length > 0 ? marcasRepresentadas : representante.marcasRepresentadas;
        if (repMarcas && repMarcas.length > 0) {
            const repMarcaAudit = await Marca.findById(repMarcas[0]).select('fabricante').lean();
            if (repMarcaAudit && repMarcaAudit.fabricante) {
                const repChanges = getChangedFields(anteriorRep, { razonSocial, nombre, cuit, direccion, telefono, correo, estado });
                if (Object.keys(repChanges.valorAnterior).length > 0) {
                    logAuditEvent({
                        usuarioId: req.usuario.id, fabricanteId: repMarcaAudit.fabricante, accion: 'actualizacion',
                        tipoEntidad: 'representante', entidadId: representante._id, descripcionEntidad: razonSocial || nombre,
                        valorAnterior: repChanges.valorAnterior, valorNuevo: repChanges.valorNuevo
                    });
                }
            }
        }
        res.json('Representante actualizado!');
    } catch (err) {
        console.error(err.message);
        if (err.code === 11000) {
            return res.status(400).json('Ya existe un representante con ese CUIT.');
        }
        res.status(500).json('Error del servidor');
    }
});

// @route   DELETE /api/apoderado/representantes/:id
// @desc    Eliminar un representante
// @access  Privado (Apoderado)
router.delete('/representantes/:id', auth, async (req, res) => {
    try {
        const representante = await Representante.findById(req.params.id);

        if (!representante) {
            return res.status(404).json('Representante no encontrado.');
        }

        if (!(await hasAccessToRepresentante(req.usuario.id, representante))) {
            return res.status(401).json('No autorizado para eliminar este representante.');
        }

        const repNombre = representante.razonSocial || representante.nombre;
        let repDelFabId = null;
        if (representante.marcasRepresentadas && representante.marcasRepresentadas.length > 0) {
            const repDelMarca = await Marca.findById(representante.marcasRepresentadas[0]).select('fabricante').lean();
            if (repDelMarca) repDelFabId = repDelMarca.fabricante;
        }
        await representante.deleteOne();
        if (repDelFabId) {
            logAuditEvent({
                usuarioId: req.usuario.id, fabricanteId: repDelFabId, accion: 'eliminacion',
                tipoEntidad: 'representante', entidadId: req.params.id, descripcionEntidad: repNombre
            });
        }
        res.json('Representante eliminado.');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// Custom auth middleware for file serving that accepts token from query or header
const fileAuth = function(req, res, next) {
    // Get token from header or query parameter
    const token = req.header('x-auth-token') || req.query.token;
    
    // If no token, access is denied
    if (!token) {
        return res.status(401).json({ msg: 'No hay token, autorización denegada' });
    }
    
    // Verify token
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded.usuario;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'El token no es válido' });
    }
};

// @route   GET /api/apoderado/files/:s3Key
// @desc    Serve files from S3 through backend proxy
// @access  Privado (Apoderado) - accepts token from header or query
router.get('/files/:s3Key', fileAuth, async (req, res) => {
    try {
        // Decode the base64-encoded S3 key
        let s3Key;
        try {
            s3Key = Buffer.from(req.params.s3Key, 'base64').toString('utf8');
        } catch (decodeError) {
            console.error('❌ Invalid S3 key encoding:', decodeError);
            return res.status(400).json('Clave de archivo inválida');
        }
        
        console.log(`📁 Serving file from S3: ${s3Key}`);
        
        // Validate S3 key format (basic security check)
        if (!s3Key || s3Key.includes('..') || s3Key.startsWith('/')) {
            console.error('❌ Invalid S3 key format:', s3Key);
            return res.status(400).json('Clave de archivo inválida');
        }
        
        // Get the file from S3
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: s3Key
        };
        
        // Check if file exists and get metadata
        try {
            const headData = await s3.headObject(params).promise();
            
            // Set appropriate headers
            res.set({
                'Content-Type': headData.ContentType || 'application/octet-stream',
                'Content-Length': headData.ContentLength,
                'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
                'ETag': headData.ETag
            });
            
            // Stream the file
            const stream = s3.getObject(params).createReadStream();
            stream.pipe(res);
            
            stream.on('error', (err) => {
                console.error('❌ Error streaming file from S3:', err);
                if (!res.headersSent) {
                    res.status(500).json('Error al servir el archivo');
                }
            });
            
        } catch (s3Error) {
            console.error('❌ S3 error:', s3Error);
            
            if (s3Error.code === 'NoSuchKey') {
                return res.status(404).json('Archivo no encontrado');
            } else if (s3Error.code === 'AccessDenied') {
                return res.status(403).json('Sin permisos para acceder al archivo');
            } else if (s3Error.message && s3Error.message.includes('Inaccessible host')) {
                // Network connectivity issue - provide helpful error
                console.error('💡 S3 connectivity issue detected');
                return res.status(503).json({
                    error: 'Servicio de archivos temporalmente no disponible',
                    message: 'Los archivos están almacenados correctamente pero no se pueden mostrar debido a problemas de conectividad. Intente más tarde.',
                    code: 'S3_CONNECTIVITY_ISSUE'
                });
            } else {
                return res.status(500).json('Error al acceder al archivo en el almacenamiento');
            }
        }
        
    } catch (err) {
        console.error('❌ Error in file serving route:', err);
        res.status(500).json('Error del servidor');
    }
});

// @route   GET /api/apoderado/system/upload-status
// @desc    Check upload system status for debugging
// @access  Privado (Apoderado)
router.get('/system/upload-status', auth, async (req, res) => {
    try {
        const status = {
            s3: {
                configured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION && process.env.S3_BUCKET_NAME),
                bucket: process.env.S3_BUCKET_NAME,
                region: process.env.AWS_REGION,
                accessible: false
            },
            uploadTypes: ['fotoPerfil', 'imagenPrincipal', 'imagenesAdicionales', 'videos', 'manuales'],
            timestamp: new Date().toISOString()
        };

        // Test S3 connection
        try {
            await s3.headBucket({ Bucket: process.env.S3_BUCKET_NAME }).promise();
            status.s3.accessible = true;
            status.s3.status = 'available';
        } catch (error) {
            status.s3.accessible = false;
            status.s3.status = 'error';
            status.s3.error = error.message;
            status.s3.errorCode = error.code;
        }

        res.json(status);
    } catch (err) {
        console.error('❌ Error checking upload status:', err);
        res.status(500).json('Error al verificar el estado del sistema de subida');
    }
});

// @route   GET /api/apoderado/export/:type
// @desc    Exportar datos por tipo de colección
// @access  Privado (Apoderado)
router.get('/export/:type', auth, async (req, res) => {
    const { type } = req.params;
    const userId = req.usuario.id;
    
    try {
        let data = [];
        
        switch (type) {
            case 'productos':
                // Get fabricantes for this user (as apoderado or administrador)
                const fabricantes = await Fabricante.find(getFabricantesQuery(userId));
                const fabricanteIds = fabricantes.map(fab => fab._id);
                
                // Query productos owned by user OR from accessible fabricantes
                data = await Producto.find({
                    $or: [
                        { usuarioApoderado: userId },
                        { fabricante: { $in: fabricanteIds } }
                    ]
                })
                    .populate('fabricante', 'razonSocial')
                    .populate('marca', 'nombre')
                    .lean();
                
                // Flatten the data for export
                data = data.map(producto => ({
                    idProducto: producto.idProducto,
                    modelo: producto.modelo,
                    descripcion: producto.descripcion,
                    precio: producto.precio,
                    fabricante: producto.fabricante?.razonSocial || '',
                    marca: producto.marca?.nombre || '',
                    estado: producto.estado,
                    atributos: producto.atributos?.map(attr => `${attr.nombre}: ${attr.valor || attr.valores?.join(', ') || ''}`).join('; ') || '',
                    garantiaTipo: producto.garantia?.tipoGarantia || '',
                    garantiaPlazo: producto.garantia?.plazoNumero ? `${producto.garantia.plazoNumero} ${producto.garantia.plazoUnidad}` : '',
                    fechaCreacion: producto.createdAt,
                    fechaActualizacion: producto.updatedAt
                }));
                break;
                
            case 'marcas':
                // Get fabricantes for this user (as apoderado or administrador)
                const fabricantesMarcas = await Fabricante.find(getFabricantesQuery(userId));
                const fabricanteIdsMarcas = fabricantesMarcas.map(fab => fab._id);
                
                // Query marcas owned by user OR from accessible fabricantes
                data = await Marca.find({
                    $or: [
                        { usuarioApoderado: userId },
                        { fabricante: { $in: fabricanteIdsMarcas } }
                    ]
                })
                    .populate('fabricante', 'razonSocial')
                    .lean();
                
                data = data.map(marca => ({
                    nombre: marca.nombre,
                    fabricante: marca.fabricante?.razonSocial || '',
                    estado: marca.estado,
                    fechaCreacion: marca.createdAt,
                    fechaActualizacion: marca.updatedAt
                }));
                break;
                
            case 'inventario':
                data = await Inventario.find({ usuarioApoderado: userId })
                    .populate('producto', 'modelo descripcion')
                    .lean();
                
                data = data.map(item => ({
                    idInventario: item.idInventario,
                    numeroSerie: item.numeroSerie,
                    producto: item.producto ? `${item.producto.modelo} - ${item.producto.descripcion}` : '',
                    estado: item.estado,
                    compradorNombre: item.comprador?.nombreCompleto || '',
                    compradorEmail: item.comprador?.correoElectronico || '',
                    compradorTelefono: item.comprador?.telefono || '',
                    fechaVenta: item.fechaVenta || '',
                    registrado: item.registrado,
                    garantiaTipo: item.garantia?.tipoGarantia || '',
                    garantiaExpiracion: item.garantia?.fechaExpiracion || '',
                    atributos: item.atributos?.map(attr => `${attr.nombre}: ${attr.valor}`).join('; ') || '',
                    fechaCreacion: item.createdAt,
                    fechaActualizacion: item.updatedAt
                }));
                break;
                
            case 'representantes':
                data = await Representante.find({ usuarioApoderado: userId })
                    .populate('marcasRepresentadas', 'nombre')
                    .lean();
                
                data = data.map(rep => ({
                    razonSocial: rep.razonSocial,
                    nombre: rep.nombre,
                    cuit: rep.cuit,
                    direccion: rep.direccion,
                    telefono: rep.telefono,
                    telefonoAdicional: rep.telefonoAdicional || '',
                    correo: rep.correo,
                    correoAdicional: rep.correoAdicional || '',
                    sitioWeb: rep.sitioWeb || '',
                    estado: rep.estado,
                    provincias: rep.cobertura?.provincias?.join(', ') || '',
                    localidades: rep.cobertura?.localidades?.join(', ') || '',
                    marcas: rep.marcasRepresentadas?.map(marca => marca.nombre).join(', ') || '',
                    fechaCreacion: rep.createdAt,
                    fechaActualizacion: rep.updatedAt
                }));
                break;
                
            default:
                return res.status(400).json({ error: 'Tipo de dato no válido' });
        }
        
        res.json(data);
    } catch (error) {
        console.error('Error al exportar datos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// @route   GET /api/apoderado/template/:type
// @desc    Descargar plantilla de importación por tipo
// @access  Privado (Apoderado)
router.get('/template/:type', auth, async (req, res) => {
    const { type } = req.params;
    
    try {
        let headers = [];
        let sampleData = {};
        
        switch (type) {
            case 'productos':
                headers = ['modelo', 'descripcion', 'precio', 'fabricante', 'marca', 'estado'];
                sampleData = {
                    modelo: 'Ejemplo Modelo ABC123',
                    descripcion: 'Descripción del producto ejemplo',
                    precio: 1500.00,
                    fabricante: 'Nombre del Fabricante',
                    marca: 'Nombre de la Marca',
                    estado: 'Activo'
                };
                break;
                
            case 'marcas':
                headers = ['nombre', 'fabricante', 'estado'];
                sampleData = {
                    nombre: 'Marca Ejemplo',
                    fabricante: 'Nombre del Fabricante',
                    estado: 'Activa'
                };
                break;
                
            case 'inventario':
                headers = ['numeroSerie', 'producto', 'estado', 'compradorNombre', 'compradorEmail', 'compradorTelefono'];
                sampleData = {
                    numeroSerie: 'SN123456789',
                    producto: 'Modelo del Producto',
                    estado: 'stock',
                    compradorNombre: 'Juan Pérez (solo si vendido)',
                    compradorEmail: 'juan@example.com (solo si vendido)',
                    compradorTelefono: '+54911234567 (solo si vendido)'
                };
                break;
                
            case 'representantes':
                headers = ['razonSocial', 'nombre', 'cuit', 'direccion', 'telefono', 'correo', 'estado'];
                sampleData = {
                    razonSocial: 'Representante SA',
                    nombre: 'Juan Representante',
                    cuit: '20-12345678-9',
                    direccion: 'Calle Ejemplo 123',
                    telefono: '+54911234567',
                    correo: 'contacto@representante.com',
                    estado: 'Activo'
                };
                break;
                
            default:
                return res.status(400).json({ error: 'Tipo de plantilla no válido' });
        }
        
        // Create Excel workbook with sample data
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet([sampleData]);
        XLSX.utils.book_append_sheet(workbook, worksheet, type);
        
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=plantilla_${type}.xlsx`);
        res.send(buffer);
        
    } catch (error) {
        console.error('Error al generar plantilla:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// @route   POST /api/apoderado/validate/:type
// @desc    Validar datos para importación
// @access  Privado (Apoderado)
router.post('/validate/:type', auth, async (req, res) => {
    const { type } = req.params;
    const { data } = req.body;
    const userId = req.usuario.id;
    
    try {
        const errors = [];
        let validCount = 0;
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2; // +2 because Excel starts at 1 and we have headers
            
            switch (type) {
                case 'productos':
                    if (!row.modelo) errors.push({ row: rowNumber, message: 'El campo "modelo" es obligatorio' });
                    if (!row.descripcion) errors.push({ row: rowNumber, message: 'El campo "descripcion" es obligatorio' });
                    if (!row.precio || isNaN(row.precio)) errors.push({ row: rowNumber, message: 'El campo "precio" debe ser un número válido' });
                    if (!row.fabricante) errors.push({ row: rowNumber, message: 'El campo "fabricante" es obligatorio' });
                    if (!row.marca) errors.push({ row: rowNumber, message: 'El campo "marca" es obligatorio' });
                    if (row.estado && !['Activo', 'Descontinuado'].includes(row.estado)) {
                        errors.push({ row: rowNumber, message: 'El estado debe ser "Activo" o "Descontinuado"' });
                    }
                    break;
                    
                case 'marcas':
                    if (!row.nombre) errors.push({ row: rowNumber, message: 'El campo "nombre" es obligatorio' });
                    if (!row.fabricante) errors.push({ row: rowNumber, message: 'El campo "fabricante" es obligatorio' });
                    if (row.estado && !['Activa', 'Desactivada'].includes(row.estado)) {
                        errors.push({ row: rowNumber, message: 'El estado debe ser "Activa" o "Desactivada"' });
                    }
                    break;
                    
                case 'inventario':
                    if (!row.numeroSerie) errors.push({ row: rowNumber, message: 'El campo "numeroSerie" es obligatorio' });
                    if (!row.producto) errors.push({ row: rowNumber, message: 'El campo "producto" es obligatorio' });
                    if (row.estado && !['stock', 'vendido', 'alquilado', 'consignacion'].includes(row.estado)) {
                        errors.push({ row: rowNumber, message: 'El estado debe ser "stock", "vendido", "alquilado" o "consignacion"' });
                    }
                    break;
                    
                case 'representantes':
                    if (!row.razonSocial) errors.push({ row: rowNumber, message: 'El campo "razonSocial" es obligatorio' });
                    if (!row.nombre) errors.push({ row: rowNumber, message: 'El campo "nombre" es obligatorio' });
                    if (!row.cuit) errors.push({ row: rowNumber, message: 'El campo "cuit" es obligatorio' });
                    if (!row.direccion) errors.push({ row: rowNumber, message: 'El campo "direccion" es obligatorio' });
                    if (!row.telefono) errors.push({ row: rowNumber, message: 'El campo "telefono" es obligatorio' });
                    if (!row.correo) errors.push({ row: rowNumber, message: 'El campo "correo" es obligatorio' });
                    if (row.estado && !['Activo', 'Inactivo'].includes(row.estado)) {
                        errors.push({ row: rowNumber, message: 'El estado debe ser "Activo" o "Inactivo"' });
                    }
                    break;
            }
            
            if (errors.length === 0) validCount++;
        }
        
        res.json({
            isValid: errors.length === 0,
            errors: errors,
            validCount: validCount,
            totalCount: data.length
        });
        
    } catch (error) {
        console.error('Error al validar datos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// @route   POST /api/apoderado/import/:type
// @desc    Importar datos validados
// @access  Privado (Apoderado)
router.post('/import/:type', auth, async (req, res) => {
    const { type } = req.params;
    const { data } = req.body;
    const userId = req.usuario.id;
    
    try {
        let imported = 0;
        const errors = [];
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2;
            
            try {
                switch (type) {
                    case 'productos':
                        // Get accessible fabricantes
                        const fabricantesAccesibles = await Fabricante.find(getFabricantesQuery(userId));
                        const fabricanteIdsImport = fabricantesAccesibles.map(fab => fab._id);
                        
                        // Find fabricante and marca from accessible ones
                        const fabricante = await Fabricante.findOne({ 
                            razonSocial: row.fabricante,
                            $or: [
                                { usuarioApoderado: userId },
                                { administradores: userId }
                            ]
                        });
                        const marca = await Marca.findOne({ 
                            nombre: row.marca,
                            $or: [
                                { usuarioApoderado: userId },
                                { fabricante: { $in: fabricanteIdsImport } }
                            ]
                        });
                        
                        if (!fabricante) {
                            errors.push({ row: rowNumber, message: 'Fabricante no encontrado' });
                            continue;
                        }
                        if (!marca) {
                            errors.push({ row: rowNumber, message: 'Marca no encontrada' });
                            continue;
                        }
                        
                        const producto = new Producto({
                            modelo: row.modelo,
                            descripcion: row.descripcion,
                            precio: parseFloat(row.precio),
                            fabricante: fabricante._id,
                            marca: marca._id,
                            usuarioApoderado: userId,
                            estado: row.estado || 'Activo'
                        });
                        await producto.save();
                        imported++;
                        break;
                        
                    case 'marcas':
                        // Get accessible fabricantes for marcas
                        const fabricantesMarcasImport = await Fabricante.find(getFabricantesQuery(userId));
                        
                        const marcaFabricante = await Fabricante.findOne({ 
                            razonSocial: row.fabricante,
                            $or: [
                                { usuarioApoderado: userId },
                                { administradores: userId }
                            ]
                        });
                        
                        if (!marcaFabricante) {
                            errors.push({ row: rowNumber, message: 'Fabricante no encontrado' });
                            continue;
                        }
                        
                        const nuevaMarca = new Marca({
                            nombre: row.nombre,
                            fabricante: marcaFabricante._id,
                            usuarioApoderado: userId,
                            estado: row.estado || 'Activa'
                        });
                        await nuevaMarca.save();
                        imported++;
                        break;
                        
                    case 'inventario':
                        // Get accessible fabricantes and productos
                        const fabricantesInventario = await Fabricante.find(getFabricantesQuery(userId));
                        const fabricanteIdsInventario = fabricantesInventario.map(fab => fab._id);
                        
                        const producto_inv = await Producto.findOne({ 
                            modelo: row.producto,
                            $or: [
                                { usuarioApoderado: userId },
                                { fabricante: { $in: fabricanteIdsInventario } }
                            ]
                        });
                        
                        if (!producto_inv) {
                            errors.push({ row: rowNumber, message: 'Producto no encontrado' });
                            continue;
                        }
                        
                        const inventario = new Inventario({
                            numeroSerie: row.numeroSerie,
                            producto: producto_inv._id,
                            estado: row.estado || 'stock',
                            usuarioApoderado: userId
                        });
                        
                        if (row.estado === 'vendido' && row.compradorNombre) {
                            inventario.comprador = {
                                nombreCompleto: row.compradorNombre,
                                correoElectronico: row.compradorEmail || '',
                                telefono: row.compradorTelefono || ''
                            };
                            inventario.fechaVenta = new Date();
                        }
                        
                        await inventario.save();
                        imported++;
                        break;
                        
                    case 'representantes':
                        const representante = new Representante({
                            razonSocial: row.razonSocial,
                            nombre: row.nombre,
                            cuit: row.cuit,
                            direccion: row.direccion,
                            telefono: row.telefono,
                            correo: row.correo,
                            estado: row.estado || 'Activo',
                            usuarioApoderado: userId
                        });
                        await representante.save();
                        imported++;
                        break;
                }
            } catch (rowError) {
                errors.push({ row: rowNumber, message: `Error al procesar: ${rowError.message}` });
            }
        }
        
        res.json({
            imported: imported,
            errors: errors,
            total: data.length,
            success: errors.length === 0
        });
        
    } catch (error) {
        console.error('Error al importar datos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// =============================================================================
// RUTAS DE GARANTÍAS
// =============================================================================

// @route   GET /api/apoderado/garantias
// @desc    Obtener todas las garantías del apoderado
// @access  Privado (Apoderado)
router.get('/garantias', auth, async (req, res) => {
    try {
        const usuarioApoderado = req.usuario.id;
        
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
        res.json(garantias);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/apoderado/garantias/:id
// @desc    Obtener una garantía específica
// @access  Privado (Apoderado)
router.get('/garantias/:id', auth, async (req, res) => {
    try {
        const garantia = await Garantia.findById(req.params.id)
            .populate('fabricante')
            .populate('marca');

        if (!garantia) {
            return res.status(404).json('Garantía no encontrada.');
        }

        if (!(await hasAccessToGarantia(req.usuario.id, garantia))) {
            return res.status(401).json('No autorizado para ver esta garantía.');
        }

        res.json(garantia);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   POST /api/apoderado/garantias/add
// @desc    Crear una nueva garantía
// @access  Privado (Apoderado)
router.post('/garantias/add', auth, async (req, res) => {
    const {
        fabricante,
        marca,
        nombre,
        duracionNumero,
        duracionUnidad,
        fechaInicio,
        costoGarantia,
        tipoCobertura,
        partesCubiertas,
        exclusiones,
        limitacionesGeograficas,
        serviciosIncluidos,
        requiereRegistro,
        comprobanteObligatorio,
        usoAutorizado,
        instalacionCertificada,
        mantenimientoDocumentado,
        canalesReclamo,
        tiempoRespuesta,
        opcionesLogistica,
        maximoReclamos,
        responsabilidadesCliente,
        pagoTraslado,
        estado
    } = req.body;

    try {
        const nuevaGarantia = new Garantia({
            fabricante: fabricante || null,
            marca: marca || null,
            nombre,
            duracionNumero,
            duracionUnidad,
            fechaInicio,
            costoGarantia,
            tipoCobertura: tipoCobertura || [],
            partesCubiertas,
            exclusiones: exclusiones || [],
            limitacionesGeograficas,
            serviciosIncluidos: serviciosIncluidos || [],
            requiereRegistro: requiereRegistro || false,
            comprobanteObligatorio: comprobanteObligatorio !== false,
            usoAutorizado: usoAutorizado || [],
            instalacionCertificada: instalacionCertificada || false,
            mantenimientoDocumentado: mantenimientoDocumentado || false,
            canalesReclamo: canalesReclamo || [],
            tiempoRespuesta,
            opcionesLogistica,
            maximoReclamos: maximoReclamos || 0,
            responsabilidadesCliente: responsabilidadesCliente || [],
            pagoTraslado,
            estado: estado || 'Activa',
            usuarioApoderado: req.usuario.id
        });

        const garantia = await nuevaGarantia.save();
        // Determine fabricanteId for audit: from fabricante directly or via marca
        let garFabId = fabricante;
        if (!garFabId && marca) {
            const garMarca = await Marca.findById(marca).select('fabricante').lean();
            if (garMarca) garFabId = garMarca.fabricante;
        }
        if (garFabId) {
            logAuditEvent({
                usuarioId: req.usuario.id, fabricanteId: garFabId, accion: 'creacion',
                tipoEntidad: 'garantia', entidadId: garantia._id, descripcionEntidad: nombre,
                detalles: { nombre, duracionNumero, duracionUnidad, tipoCobertura, estado: estado || 'Activa' }
            });
        }
        res.json({
            message: 'Garantía creada con éxito!',
            garantia: garantia
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   PUT /api/apoderado/garantias/:id
// @desc    Actualizar una garantía
// @access  Privado (Apoderado)
router.put('/garantias/:id', auth, async (req, res) => {
    const {
        fabricante,
        marca,
        nombre,
        duracionNumero,
        duracionUnidad,
        fechaInicio,
        costoGarantia,
        tipoCobertura,
        partesCubiertas,
        exclusiones,
        limitacionesGeograficas,
        serviciosIncluidos,
        requiereRegistro,
        comprobanteObligatorio,
        usoAutorizado,
        instalacionCertificada,
        mantenimientoDocumentado,
        canalesReclamo,
        tiempoRespuesta,
        opcionesLogistica,
        maximoReclamos,
        responsabilidadesCliente,
        pagoTraslado,
        estado
    } = req.body;

    try {
        const garantia = await Garantia.findById(req.params.id)
            .populate('fabricante');

        if (!garantia) {
            return res.status(404).json('Garantía no encontrada.');
        }

        if (!(await hasAccessToGarantia(req.usuario.id, garantia))) {
            return res.status(401).json('No autorizado para actualizar esta garantía.');
        }

        const anteriorGarantia = { nombre: garantia.nombre, duracionNumero: garantia.duracionNumero, duracionUnidad: garantia.duracionUnidad, tipoCobertura: garantia.tipoCobertura, estado: garantia.estado };

        // Actualizar campos
        garantia.fabricante = fabricante || null;
        garantia.marca = marca || null;
        garantia.nombre = nombre;
        garantia.duracionNumero = duracionNumero;
        garantia.duracionUnidad = duracionUnidad;
        garantia.fechaInicio = fechaInicio;
        garantia.costoGarantia = costoGarantia;
        garantia.tipoCobertura = tipoCobertura || [];
        garantia.partesCubiertas = partesCubiertas;
        garantia.exclusiones = exclusiones || [];
        garantia.limitacionesGeograficas = limitacionesGeograficas;
        garantia.serviciosIncluidos = serviciosIncluidos || [];
        garantia.requiereRegistro = requiereRegistro || false;
        garantia.comprobanteObligatorio = comprobanteObligatorio !== false;
        garantia.usoAutorizado = usoAutorizado || [];
        garantia.instalacionCertificada = instalacionCertificada || false;
        garantia.mantenimientoDocumentado = mantenimientoDocumentado || false;
        garantia.canalesReclamo = canalesReclamo || [];
        garantia.tiempoRespuesta = tiempoRespuesta;
        garantia.opcionesLogistica = opcionesLogistica;
        garantia.maximoReclamos = maximoReclamos || 0;
        garantia.responsabilidadesCliente = responsabilidadesCliente || [];
        garantia.pagoTraslado = pagoTraslado;
        garantia.estado = estado || 'Activa';

        await garantia.save();
        let garUpdFabId = fabricante;
        if (!garUpdFabId && garantia.fabricante) garUpdFabId = garantia.fabricante._id || garantia.fabricante;
        if (!garUpdFabId && marca) {
            const garUpdMarca = await Marca.findById(marca).select('fabricante').lean();
            if (garUpdMarca) garUpdFabId = garUpdMarca.fabricante;
        }
        if (garUpdFabId) {
            const garChanges = getChangedFields(anteriorGarantia, { nombre, duracionNumero, duracionUnidad, tipoCobertura: tipoCobertura || [], estado: estado || 'Activa' });
            if (Object.keys(garChanges.valorAnterior).length > 0) {
                logAuditEvent({
                    usuarioId: req.usuario.id, fabricanteId: garUpdFabId, accion: 'actualizacion',
                    tipoEntidad: 'garantia', entidadId: garantia._id, descripcionEntidad: nombre,
                    valorAnterior: garChanges.valorAnterior, valorNuevo: garChanges.valorNuevo
                });
            }
        }
        res.json('Garantía actualizada!');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   DELETE /api/apoderado/garantias/:id
// @desc    Eliminar una garantía
// @access  Privado (Apoderado)
router.delete('/garantias/:id', auth, async (req, res) => {
    try {
        const garantia = await Garantia.findById(req.params.id)
            .populate('fabricante');

        if (!garantia) {
            return res.status(404).json('Garantía no encontrada.');
        }

        if (!(await hasAccessToGarantia(req.usuario.id, garantia))) {
            return res.status(401).json('No autorizado para eliminar esta garantía.');
        }

        const garDelNombre = garantia.nombre;
        let garDelFabId = garantia.fabricante ? (garantia.fabricante._id || garantia.fabricante) : null;
        if (!garDelFabId && garantia.marca) {
            const garDelMarca = await Marca.findById(garantia.marca).select('fabricante').lean();
            if (garDelMarca) garDelFabId = garDelMarca.fabricante;
        }
        await Garantia.findByIdAndDelete(req.params.id);
        if (garDelFabId) {
            logAuditEvent({
                usuarioId: req.usuario.id, fabricanteId: garDelFabId, accion: 'eliminacion',
                tipoEntidad: 'garantia', entidadId: req.params.id, descripcionEntidad: garDelNombre
            });
        }
        res.json('Garantía eliminada!');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// ================== GARANTÍAS ASIGNADAS ROUTES ==================

// @route   GET /api/apoderado/garantias-asignadas
// @desc    Listar garantías asignadas con filtros
// @access  Privado (Apoderado)
router.get('/garantias-asignadas', auth, async (req, res) => {
    try {
        const usuarioApoderado = req.usuario.id;
        const { search, estado } = req.query;

        const fabricantes = await Fabricante.find(getFabricantesQuery(usuarioApoderado));
        const fabricanteIds = fabricantes.map(fab => fab._id);

        let query = {
            $or: [
                { usuarioApoderado },
                { fabricante: { $in: fabricanteIds } }
            ]
        };

        if (estado) {
            query.estado = estado;
        }

        let garantias = await GarantiaAsignada.find(query)
            .sort({ createdAt: -1 })
            .lean();

        if (search) {
            const s = search.toLowerCase();
            garantias = garantias.filter(g =>
                (g.idGarantia && g.idGarantia.toLowerCase().includes(s)) ||
                (g.clienteFinal?.nombreCompleto && g.clienteFinal.nombreCompleto.toLowerCase().includes(s)) ||
                (g.clienteFinal?.correoElectronico && g.clienteFinal.correoElectronico.toLowerCase().includes(s)) ||
                (g.productoRepuesto?.modelo && g.productoRepuesto.modelo.toLowerCase().includes(s)) ||
                (g.numeroSerie && g.numeroSerie.toLowerCase().includes(s))
            );
        }

        res.json(garantias);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/apoderado/garantias-asignadas/:id
// @desc    Obtener detalle de una garantía asignada
// @access  Privado (Apoderado)
router.get('/garantias-asignadas/:id', auth, async (req, res) => {
    try {
        const garantia = await GarantiaAsignada.findById(req.params.id)
            .populate('inventario', 'idInventario numeroSerie')
            .populate('garantiaOrigen', 'nombre')
            .populate('extensiones.usuarioExtension', 'nombreCompleto');

        if (!garantia) {
            return res.status(404).json({ message: 'Garantía asignada no encontrada.' });
        }

        res.json(garantia);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   PUT /api/apoderado/garantias-asignadas/:id/estado
// @desc    Cambiar estado de garantía asignada (Pendiente -> Validada o Rechazada)
// @access  Privado (Apoderado)
router.put('/garantias-asignadas/:id/estado', auth, async (req, res) => {
    try {
        const { estado } = req.body;

        if (!['Validada', 'Rechazada'].includes(estado)) {
            return res.status(400).json({ message: 'Estado inválido. Debe ser Validada o Rechazada.' });
        }

        const garantia = await GarantiaAsignada.findById(req.params.id);

        if (!garantia) {
            return res.status(404).json({ message: 'Garantía asignada no encontrada.' });
        }

        if (garantia.estado !== 'Pendiente') {
            return res.status(400).json({ message: `No se puede cambiar el estado desde ${garantia.estado}.` });
        }

        garantia.estado = estado;
        await garantia.save();

        res.json(garantia);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   POST /api/apoderado/garantias-asignadas/:id/extender
// @desc    Extender una garantía asignada
// @access  Privado (Apoderado)
router.post('/garantias-asignadas/:id/extender', auth, async (req, res) => {
    try {
        const { nuevaFechaExpiracion, comentarios } = req.body;

        if (!nuevaFechaExpiracion) {
            return res.status(400).json({ message: 'La nueva fecha de expiración es obligatoria.' });
        }

        const garantia = await GarantiaAsignada.findById(req.params.id);

        if (!garantia) {
            return res.status(404).json({ message: 'Garantía asignada no encontrada.' });
        }

        const nuevaFecha = new Date(nuevaFechaExpiracion);
        if (nuevaFecha <= garantia.fechaExpiracion) {
            return res.status(400).json({ message: 'La nueva fecha debe ser posterior a la fecha de expiración actual.' });
        }

        garantia.extensiones.push({
            fechaAnterior: garantia.fechaExpiracion,
            nuevaFechaExpiracion: nuevaFecha,
            comentarios: comentarios || '',
            fechaExtension: new Date(),
            usuarioExtension: req.usuario.id
        });

        garantia.fechaExpiracion = nuevaFecha;
        await garantia.save();

        res.json(garantia);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// ================== PIEZAS ROUTES ==================

// @route   GET /api/apoderado/piezas
// @desc    Obtener las piezas del apoderado, con opción de búsqueda
// @access  Privado (Apoderado)
router.get('/piezas', auth, async (req, res) => {
    const { search } = req.query;
    const usuarioApoderado = req.usuario.id;

    try {
        // Get fabricantes for this user (as apoderado or administrador)
        const fabricantes = await Fabricante.find(getFabricantesQuery(usuarioApoderado));
        const fabricanteIds = fabricantes.map(fab => fab._id);

        // Base query: piezas owned by user OR piezas where fabricante is accessible
        let query = {
            $or: [
                { usuarioApoderado },
                { fabricante: { $in: fabricanteIds } }
            ]
        };

        if (search) {
            // Get productos that match search
            const productos = await Producto.find({
                fabricante: { $in: fabricanteIds },
                $or: [
                    { idProducto: { $regex: search, $options: 'i' } },
                    { modelo: { $regex: search, $options: 'i' } }
                ]
            });
            const productoIds = productos.map(p => p._id);

            // Combine base query with search criteria
            query.$and = [
                {
                    $or: [
                        { usuarioApoderado },
                        { fabricante: { $in: fabricanteIds } }
                    ]
                },
                {
                    $or: [
                        { idPieza: { $regex: search, $options: 'i' } },
                        { nombre: { $regex: search, $options: 'i' } },
                        { productos: { $in: productoIds } }
                    ]
                }
            ];
            // Remove the top-level $or since we're using $and
            delete query.$or;
        }

        const piezas = await Pieza.find(query)
            .populate('fabricante')
            .populate('marca')
            .populate({
                path: 'productos',
                populate: [
                    { path: 'fabricante' },
                    { path: 'marca' }
                ]
            })
            .populate('garantia');

        // Agregar conteo de stock (estado='stock') para cada pieza
        const piezaIds = piezas.map(p => p._id);
        const stockCountsPiezas = await Inventario.aggregate([
            { $match: { pieza: { $in: piezaIds }, estado: 'stock' } },
            { $group: { _id: '$pieza', count: { $sum: 1 } } }
        ]);
        const stockCountMapPiezas = {};
        stockCountsPiezas.forEach(sc => { stockCountMapPiezas[sc._id.toString()] = sc.count; });

        const piezasWithStock = piezas.map(p => ({
            ...p.toObject(),
            stockCount: stockCountMapPiezas[p._id.toString()] || 0
        }));

        res.json(piezasWithStock);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/apoderado/piezas/:id
// @desc    Obtener una pieza específica por ID
// @access  Privado (Apoderado)
router.get('/piezas/:id', auth, async (req, res) => {
    try {
        const pieza = await Pieza.findById(req.params.id)
            .populate('fabricante')
            .populate('marca')
            .populate({
                path: 'productos',
                populate: [
                    { path: 'fabricante' },
                    { path: 'marca' }
                ]
            })
            .populate('garantia');

        if (!pieza) {
            return res.status(404).json('Pieza no encontrada.');
        }

        if (!(await hasAccessToPieza(req.usuario.id, pieza))) {
            return res.status(401).json('No autorizado para acceder a esta pieza.');
        }

        res.json(pieza);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   POST /api/apoderado/piezas/add
// @desc    Crear una nueva pieza
// @access  Privado (Apoderado)
router.post('/piezas/add', auth, async (req, res) => {
    const { nombre, productos, atributos, garantia, idPieza, fabricante, marca } = req.body;
    const usuarioApoderado = req.usuario.id;

    try {
        // Verify that all productos belong to user's fabricantes
        if (productos && productos.length > 0) {
            const fabricantes = await Fabricante.find(getFabricantesQuery(usuarioApoderado));
            const fabricanteIds = fabricantes.map(fab => fab._id);

            const productosValidos = await Producto.find({
                _id: { $in: productos },
                fabricante: { $in: fabricanteIds }
            });

            if (productosValidos.length !== productos.length) {
                return res.status(403).json('Uno o más productos no son válidos.');
            }
        }

        // Handle idPieza: use provided value or generate a new one
        let finalIdPieza = idPieza;
        
        if (!finalIdPieza || finalIdPieza.trim() === '') {
            // Generate a unique ID if not provided
            let attempts = 0;
            const maxAttempts = 10;
            
            do {
                finalIdPieza = generateSerialNumber();
                attempts++;
                
                if (attempts >= maxAttempts) {
                    return res.status(500).json('No se pudo generar un ID único después de varios intentos.');
                }
                
                const existingPieza = await Pieza.findOne({ idPieza: finalIdPieza });
                if (!existingPieza) {
                    break;
                }
            } while (attempts < maxAttempts);
        } else {
            // Validate that manual ID is unique
            const existingPieza = await Pieza.findOne({ idPieza: finalIdPieza });
            if (existingPieza) {
                return res.status(400).json('El ID de pieza ya existe. Por favor, ingrese un ID único.');
            }
        }

        const nuevaPieza = new Pieza({
            idPieza: finalIdPieza,
            nombre,
            fabricante: fabricante || null,
            marca: marca || null,
            productos: productos || [],
            usuarioApoderado,
            atributos: atributos || [],
            garantia: garantia || null
        });

        await nuevaPieza.save();
        if (fabricante) {
            logAuditEvent({
                usuarioId: usuarioApoderado, fabricanteId: fabricante, accion: 'creacion',
                tipoEntidad: 'pieza', entidadId: nuevaPieza._id, descripcionEntidad: nombre,
                detalles: { nombre, idPieza: finalIdPieza, fabricante, marca }
            });
        }
        res.status(201).json({ mensaje: 'Pieza creada con éxito!', pieza: nuevaPieza });
    } catch (err) {
        console.error(err.message);
        // Handle duplicate key error specifically
        if (err.code === 11000) {
            if (err.keyPattern && err.keyPattern.idPieza) {
                return res.status(400).json('El ID de pieza ya existe. Por favor, ingrese un ID único.');
            }
        }
        res.status(500).json('Error del servidor');
    }
});

// @route   PUT /api/apoderado/piezas/:id
// @desc    Actualizar una pieza
// @access  Privado (Apoderado)
router.put('/piezas/:id', auth, async (req, res) => {
    try {
        const pieza = await Pieza.findById(req.params.id)
            .populate('fabricante');

        if (!pieza) {
            return res.status(404).json('Pieza no encontrada.');
        }

        if (!(await hasAccessToPieza(req.usuario.id, pieza))) {
            return res.status(401).json('No autorizado para actualizar esta pieza.');
        }

        const { nombre, productos, atributos, garantia, fabricante, marca } = req.body;

        // Verify that all productos belong to user's fabricantes
        if (productos && productos.length > 0) {
            const fabricantes = await Fabricante.find(getFabricantesQuery(req.usuario.id));
            const fabricanteIds = fabricantes.map(fab => fab._id);

            const productosValidos = await Producto.find({
                _id: { $in: productos },
                fabricante: { $in: fabricanteIds }
            });

            if (productosValidos.length !== productos.length) {
                return res.status(403).json('Uno o más productos no son válidos.');
            }
        }

        const anteriorPieza = { nombre: pieza.nombre, fabricante: pieza.fabricante, marca: pieza.marca };
        pieza.nombre = nombre;
        pieza.fabricante = fabricante || null;
        pieza.marca = marca || null;
        pieza.productos = productos || [];
        pieza.atributos = atributos || [];
        pieza.garantia = garantia || null;

        await pieza.save();
        const piezaFabId = fabricante || (pieza.fabricante ? (pieza.fabricante._id || pieza.fabricante) : null);
        if (piezaFabId) {
            const piezaChanges = getChangedFields(anteriorPieza, { nombre, fabricante: fabricante || null, marca: marca || null });
            if (Object.keys(piezaChanges.valorAnterior).length > 0) {
                logAuditEvent({
                    usuarioId: req.usuario.id, fabricanteId: piezaFabId, accion: 'actualizacion',
                    tipoEntidad: 'pieza', entidadId: pieza._id, descripcionEntidad: nombre,
                    valorAnterior: piezaChanges.valorAnterior, valorNuevo: piezaChanges.valorNuevo
                });
            }
        }
        res.json('Pieza actualizada!');
    } catch (err) {
        console.error(err.message);
        res.status(500).json('Error del servidor');
    }
});

// @route   DELETE /api/apoderado/piezas/:id
// @desc    Eliminar una pieza
// @access  Privado (Apoderado)
router.delete('/piezas/:id', auth, async (req, res) => {
    try {
        const pieza = await Pieza.findById(req.params.id)
            .populate('fabricante');

        if (!pieza) {
            return res.status(404).json('Pieza no encontrada.');
        }

        if (!(await hasAccessToPieza(req.usuario.id, pieza))) {
            return res.status(401).json('No autorizado para eliminar esta pieza.');
        }

        const piezaDelNombre = pieza.nombre;
        const piezaDelFabId = pieza.fabricante ? (pieza.fabricante._id || pieza.fabricante) : null;
        await pieza.deleteOne();
        if (piezaDelFabId) {
            logAuditEvent({
                usuarioId: req.usuario.id, fabricanteId: piezaDelFabId, accion: 'eliminacion',
                tipoEntidad: 'pieza', entidadId: req.params.id, descripcionEntidad: piezaDelNombre
            });
        }
        res.json('Pieza eliminada.');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   POST /api/apoderado/piezas/generate-id
// @desc    Generate a unique ID for a pieza
// @access  Private (Apoderado)
router.post('/piezas/generate-id', auth, async (req, res) => {
    try {
        let piezaId;
        let attempts = 0;
        const maxAttempts = 10;

        // Generate unique ID
        do {
            piezaId = generateSerialNumber();
            attempts++;

            if (attempts >= maxAttempts) {
                return res.status(500).json('No se pudo generar un ID único después de varios intentos.');
            }

            // Check if ID already exists
            const existingPieza = await Pieza.findOne({ idPieza: piezaId });
            if (!existingPieza) {
                break;
            }
        } while (attempts < maxAttempts);

        res.json({ idPieza: piezaId });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   POST /api/apoderado/piezas/:id/imagen
// @desc    Subir imagen para una pieza
// @access  Privado (Apoderado)
router.post('/piezas/:id/imagen', auth, async (req, res) => {
    try {
        const pieza = await Pieza.findById(req.params.id)
            .populate('fabricante');

        if (!pieza) {
            return res.status(404).json('Pieza no encontrada.');
        }

        if (!(await hasAccessToPieza(req.usuario.id, pieza))) {
            return res.status(401).json('No autorizado para subir archivos a esta pieza.');
        }

        // Validate that pieza has a nombre for S3 path creation
        if (!pieza.nombre || pieza.nombre.trim() === '') {
            return res.status(400).json({ error: 'La pieza debe tener un nombre antes de subir una imagen.' });
        }

        // Set S3 path for the upload middleware
        const piezaNombre = pieza.nombre.replace(/[^a-zA-Z0-9]/g, '_');
        req.s3Path = `piezas/${piezaNombre}`;

        console.log(`📁 Setting up upload for pieza: ${pieza.nombre}`);
        console.log(`📁 S3 path will be: ${req.s3Path}/`);

        // Handle the upload using imagen principal middleware
        uploadImagenPrincipal.single('imagen')(req, res, async function (err) {
            if (err) {
                console.error('❌ Error uploading file:', err);
                
                let errorMessage = err.message;
                if (err.code === 'NoSuchBucket') {
                    errorMessage = 'Error de configuración: Bucket de S3 no encontrado. Contacte al administrador.';
                } else if (err.code === 'AccessDenied') {
                    errorMessage = 'Error de permisos: Sin acceso al storage. Contacte al administrador.';
                } else if (err.code === 'InvalidAccessKeyId') {
                    errorMessage = 'Error de configuración: Credenciales de AWS inválidas. Contacte al administrador.';
                } else if (err.code === 'SignatureDoesNotMatch') {
                    errorMessage = 'Error de configuración: Credenciales de AWS incorrectas. Contacte al administrador.';
                }
                
                return res.status(400).json({ error: errorMessage });
            }

            try {
                if (!req.file) {
                    return res.status(400).json('No se seleccionó archivo para subir.');
                }

                console.log(`✅ Successfully uploaded file`);

                // Delete old image from S3 if it exists
                if (pieza.imagen && pieza.imagen.s3Key) {
                    try {
                        await deleteFromS3(pieza.imagen.s3Key);
                        console.log(`✅ Deleted old image from S3`);
                    } catch (deleteErr) {
                        console.error('⚠️ Error deleting old image:', deleteErr);
                        // Continue even if deletion fails
                    }
                }

                // Update pieza with new image
                pieza.imagen = {
                    originalName: req.file.originalname,
                    fileName: req.file.key.split('/').pop(),
                    s3Key: req.file.key,
                    url: `/api/apoderado/files/${Buffer.from(req.file.key).toString('base64')}`
                };

                await pieza.save();

                console.log(`✅ Pieza updated with new image`);

                res.json({ 
                    mensaje: 'Imagen subida con éxito!', 
                    imagen: pieza.imagen 
                });
            } catch (saveErr) {
                console.error('❌ Error saving pieza:', saveErr);
                res.status(500).json('Error al guardar la información del archivo');
            }
        });
    } catch (err) {
        console.error('❌ Server error in file upload:', err.message);
        res.status(500).json('Error del servidor');
    }
});

// @route   DELETE /api/apoderado/piezas/:id/imagen
// @desc    Eliminar la imagen de una pieza
// @access  Privado (Apoderado)
router.delete('/piezas/:id/imagen', auth, async (req, res) => {
    try {
        const pieza = await Pieza.findById(req.params.id)
            .populate('fabricante');

        if (!pieza) {
            return res.status(404).json('Pieza no encontrada.');
        }

        if (!(await hasAccessToPieza(req.usuario.id, pieza))) {
            return res.status(401).json('No autorizado para eliminar archivos de esta pieza.');
        }

        if (!pieza.imagen || !pieza.imagen.s3Key) {
            return res.status(404).json('La pieza no tiene imagen.');
        }

        try {
            await deleteFromS3(pieza.imagen.s3Key);
            console.log(`✅ Deleted image from S3`);
        } catch (deleteErr) {
            console.error('⚠️ Error deleting from S3:', deleteErr);
        }

        pieza.imagen = undefined;
        await pieza.save();

        res.json('Imagen eliminada.');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});


// @route   GET /api/apoderado/configuracion
// @desc    Get general settings for all fabricantes the apoderado has access to
// @access  Privado (Apoderado)
router.get('/configuracion', auth, async (req, res) => {
    try {
        const fabricantes = await Fabricante.find(getFabricantesQuery(req.usuario.id))
            .select('razonSocial stockBajoUmbral rangoNuevos umbralGarantiaPorVencer');

        if (!fabricantes || fabricantes.length === 0) {
            return res.status(404).json({ msg: 'Fabricante no encontrado' });
        }

        res.json({
            fabricantes: fabricantes.map(f => ({
                _id: f._id,
                razonSocial: f.razonSocial,
                stockBajoUmbral: f.stockBajoUmbral != null ? f.stockBajoUmbral : 3,
                rangoNuevos: f.rangoNuevos || 'ultimo_mes',
                umbralGarantiaPorVencer: f.umbralGarantiaPorVencer || '1_mes'
            }))
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   PUT /api/apoderado/configuracion
// @desc    Update general settings for a fabricante
// @access  Privado (Apoderado)
router.put('/configuracion', auth, async (req, res) => {
    try {
        const { fabricanteId, stockBajoUmbral, rangoNuevos, umbralGarantiaPorVencer } = req.body;

        const query = fabricanteId
            ? getFabricantesQuery(req.usuario.id, { _id: fabricanteId })
            : getFabricantesQuery(req.usuario.id);

        const fabricante = await Fabricante.findOne(query);

        if (!fabricante) {
            return res.status(404).json({ msg: 'Fabricante no encontrado' });
        }

        const anteriorConfig = { stockBajoUmbral: fabricante.stockBajoUmbral, rangoNuevos: fabricante.rangoNuevos, umbralGarantiaPorVencer: fabricante.umbralGarantiaPorVencer };

        if (stockBajoUmbral !== undefined) {
            const umbral = parseInt(stockBajoUmbral, 10);
            if (isNaN(umbral) || umbral < 0) {
                return res.status(400).json({ msg: 'El umbral de stock bajo debe ser un número entero positivo.' });
            }
            fabricante.stockBajoUmbral = umbral;
        }

        if (rangoNuevos !== undefined) {
            const rangosValidos = ['ultima_semana', 'ultimas_2_semanas', 'ultimo_mes', 'ultimos_2_meses', 'ultimos_3_meses', 'ultimos_6_meses'];
            if (!rangosValidos.includes(rangoNuevos)) {
                return res.status(400).json({ msg: 'Rango de nuevos inválido.' });
            }
            fabricante.rangoNuevos = rangoNuevos;
        }

        if (umbralGarantiaPorVencer !== undefined) {
            const umbralesValidos = ['2_semanas', '3_semanas', '1_mes', '2_meses', '3_meses'];
            if (!umbralesValidos.includes(umbralGarantiaPorVencer)) {
                return res.status(400).json({ msg: 'Umbral de garantía por vencer inválido.' });
            }
            fabricante.umbralGarantiaPorVencer = umbralGarantiaPorVencer;
        }

        await fabricante.save();
        const configChanges = getChangedFields(anteriorConfig, { stockBajoUmbral: fabricante.stockBajoUmbral, rangoNuevos: fabricante.rangoNuevos, umbralGarantiaPorVencer: fabricante.umbralGarantiaPorVencer });
        if (Object.keys(configChanges.valorAnterior).length > 0) {
            logAuditEvent({
                usuarioId: req.usuario.id, fabricanteId: fabricante._id, accion: 'actualizacion',
                tipoEntidad: 'configuracion', entidadId: fabricante._id, descripcionEntidad: 'Configuración general',
                valorAnterior: configChanges.valorAnterior, valorNuevo: configChanges.valorNuevo
            });
        }
        res.json({ msg: 'Configuración actualizada', stockBajoUmbral: fabricante.stockBajoUmbral, rangoNuevos: fabricante.rangoNuevos, umbralGarantiaPorVencer: fabricante.umbralGarantiaPorVencer });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/apoderado/branding
// @desc    Get branding info for all fabricantes the apoderado has access to
// @access  Privado (Apoderado)
router.get('/branding', auth, async (req, res) => {
    try {
        const fabricantes = await Fabricante.find(getFabricantesQuery(req.usuario.id))
            .select('razonSocial slug portalLogo portalColor');

        if (!fabricantes || fabricantes.length === 0) {
            return res.status(404).json({ msg: 'Fabricante no encontrado' });
        }

        res.json({
            fabricantes: fabricantes.map(f => ({
                _id: f._id,
                slug: f.slug,
                portalLogo: f.portalLogo || null,
                portalColor: f.portalColor || '#1a73e8',
                razonSocial: f.razonSocial
            }))
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   PUT /api/apoderado/branding
// @desc    Update branding portal color for the specified fabricante
// @access  Privado (Apoderado)
router.put('/branding', auth, async (req, res) => {
    try {
        const { portalColor, fabricanteId } = req.body;

        const query = fabricanteId
            ? getFabricantesQuery(req.usuario.id, { _id: fabricanteId })
            : getFabricantesQuery(req.usuario.id);

        const fabricante = await Fabricante.findOne(query);

        if (!fabricante) {
            return res.status(404).json({ msg: 'Fabricante no encontrado' });
        }

        const anteriorColor = fabricante.portalColor;
        if (portalColor) {
            // Validate hex color format
            if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(portalColor)) {
                return res.status(400).json({ msg: 'Color inválido. Use formato hexadecimal (ej: #1a73e8).' });
            }
            fabricante.portalColor = portalColor;
        }

        await fabricante.save();
        if (portalColor && anteriorColor !== portalColor) {
            logAuditEvent({
                usuarioId: req.usuario.id, fabricanteId: fabricante._id, accion: 'actualizacion',
                tipoEntidad: 'portal', entidadId: fabricante._id, descripcionEntidad: 'Color del portal',
                valorAnterior: { portalColor: anteriorColor }, valorNuevo: { portalColor }
            });
        }
        res.json({ msg: 'Branding actualizado', portalColor: fabricante.portalColor, slug: fabricante.slug });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   POST /api/apoderado/branding/logo
// @desc    Upload portal logo for the specified fabricante
// @access  Privado (Apoderado)
router.post('/branding/logo', auth, checkS3Connection, async (req, res) => {
    try {
        const fabricanteId = req.query.fabricanteId;

        const query = fabricanteId
            ? getFabricantesQuery(req.usuario.id, { _id: fabricanteId })
            : getFabricantesQuery(req.usuario.id);

        const fabricante = await Fabricante.findOne(query);

        if (!fabricante) {
            return res.status(404).json({ msg: 'Fabricante no encontrado' });
        }

        const fabricanteNombre = fabricante.razonSocial.replace(/[^a-zA-Z0-9]/g, '_');
        req.s3Path = `logofabricante/${fabricanteNombre}`;

        uploadLogoFabricante.single('logo')(req, res, async function (err) {
            if (err) {
                let errorMessage = err.message;
                if (err.code === 'LIMIT_FILE_SIZE') {
                    errorMessage = 'El archivo es demasiado grande. Máximo 2MB permitido.';
                }
                return res.status(400).json(errorMessage);
            }

            if (!req.file) {
                return res.status(400).json('No se seleccionó ningún archivo.');
            }

            try {
                if (fabricante.portalLogo && fabricante.portalLogo.key) {
                    try {
                        await deleteFromS3(fabricante.portalLogo.key);
                    } catch (deleteError) {
                        console.error('⚠️ Warning: Could not delete old portal logo:', deleteError);
                    }
                }

                fabricante.portalLogo = {
                    url: `/api/public/logo/${Buffer.from(req.file.key).toString('base64')}`,
                    key: req.file.key,
                    originalName: req.file.originalname
                };

                await fabricante.save();

                logAuditEvent({
                    usuarioId: req.usuario.id, fabricanteId: fabricante._id, accion: 'actualizacion',
                    tipoEntidad: 'portal', entidadId: fabricante._id, descripcionEntidad: 'Logo del portal',
                    detalles: { archivo: req.file.originalname }
                });
                res.json({
                    message: 'Logo del portal subido exitosamente',
                    portalLogo: fabricante.portalLogo
                });
            } catch (saveError) {
                console.error('❌ Error saving fabricante with portal logo:', saveError);
                if (req.file && req.file.key) {
                    try { await deleteFromS3(req.file.key); } catch (e) { /* ignore */ }
                }
                res.status(500).json('Error al guardar el logo del portal');
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   DELETE /api/apoderado/branding/logo
// @desc    Delete portal logo for the specified fabricante
// @access  Privado (Apoderado)
router.delete('/branding/logo', auth, async (req, res) => {
    try {
        const fabricanteId = req.query.fabricanteId;

        const query = fabricanteId
            ? getFabricantesQuery(req.usuario.id, { _id: fabricanteId })
            : getFabricantesQuery(req.usuario.id);

        const fabricante = await Fabricante.findOne(query);

        if (!fabricante) {
            return res.status(404).json({ msg: 'Fabricante no encontrado' });
        }

        if (!fabricante.portalLogo || !fabricante.portalLogo.key) {
            return res.status(404).json('El fabricante no tiene logo de portal.');
        }

        try {
            await deleteFromS3(fabricante.portalLogo.key);
        } catch (deleteError) {
            console.error('⚠️ Warning: Could not delete portal logo from S3:', deleteError);
        }

        fabricante.portalLogo = undefined;
        await fabricante.save();

        res.json('Logo del portal eliminado.');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// =============================================================================
// RUTAS DE PEDIDOS DE GARANTÍA (fabricante/apoderado)
// =============================================================================

const PEDIDO_GARANTIA_POPULATE = [
    { path: 'bien', select: 'nombre datosProducto fechaRegistro inventario', populate: { path: 'inventario', select: 'idInventario' } },
    { path: 'usuario', select: 'nombreCompleto correoElectronico' },
    { path: 'fabricante', select: 'razonSocial' }
];

// ========== CLIENTES ==========

// @route   GET /api/apoderado/clientes
// @desc    Get unique clients who registered products (from inventory comprador data)
// @access  Private (Apoderado)
router.get('/clientes', auth, async (req, res) => {
    try {
        const usuarioApoderado = req.usuario.id;
        const fabricantes = await Fabricante.find(getFabricantesQuery(usuarioApoderado));
        const fabricanteIds = fabricantes.map(f => f._id);

        // Get all products and piezas accessible by this user
        const productosAccesibles = await Producto.find({
            $or: [
                { usuarioApoderado },
                { fabricante: { $in: fabricanteIds } }
            ]
        }).select('_id');
        const productoIdsAccesibles = productosAccesibles.map(p => p._id);

        const piezasAccesibles = await Pieza.find({
            $or: [
                { usuarioApoderado },
                { fabricante: { $in: fabricanteIds } }
            ]
        }).select('_id');
        const piezaIdsAccesibles = piezasAccesibles.map(p => p._id);

        // Get all inventory items that have been registered (have comprador data)
        const inventarioItems = await Inventario.find({
            $or: [
                { usuarioApoderado },
                { producto: { $in: productoIdsAccesibles } },
                { pieza: { $in: piezaIdsAccesibles } }
            ],
            'comprador.correoElectronico': { $exists: true, $ne: '' }
        })
        .populate('producto', 'modelo imagenPrincipal garantia')
        .populate('pieza', 'nombre garantia')
        .populate({
            path: 'producto',
            populate: { path: 'garantia', select: 'nombre duracionNumero duracionUnidad fechaInicio' }
        })
        .populate({
            path: 'pieza',
            populate: { path: 'garantia', select: 'nombre duracionNumero duracionUnidad fechaInicio' }
        })
        .sort({ fechaRegistro: -1, createdAt: -1 });

        // Group by unique client (email as key)
        const clientesMap = {};
        for (const item of inventarioItems) {
            const email = item.comprador?.correoElectronico?.toLowerCase().trim();
            if (!email) continue;

            if (!clientesMap[email]) {
                clientesMap[email] = {
                    email: email,
                    nombreCompleto: item.comprador.nombreCompleto || '',
                    telefono: item.comprador.telefono || '',
                    cuil: item.comprador.cuil || '',
                    direccion: item.comprador.direccion || '',
                    provincia: item.comprador.provincia || '',
                    coordenadas: item.comprador.coordenadas || null,
                    productos: [],
                    primerRegistro: item.fechaRegistro || item.createdAt
                };
            }

            // Calculate warranty expiration
            let garantiaVencimiento = null;
            const garantia = item.producto?.garantia || item.pieza?.garantia;
            if (garantia) {
                let fechaBase = null;
                if (garantia.fechaInicio === 'Compra' && item.fechaVenta) {
                    fechaBase = new Date(item.fechaVenta);
                } else if (garantia.fechaInicio === 'Registro' && item.fechaRegistro) {
                    fechaBase = new Date(item.fechaRegistro);
                } else if (item.fechaVenta) {
                    fechaBase = new Date(item.fechaVenta);
                } else if (item.fechaRegistro) {
                    fechaBase = new Date(item.fechaRegistro);
                }

                if (fechaBase) {
                    const vencimiento = new Date(fechaBase);
                    if (garantia.duracionUnidad === 'dias') {
                        vencimiento.setDate(vencimiento.getDate() + garantia.duracionNumero);
                    } else if (garantia.duracionUnidad === 'meses') {
                        vencimiento.setMonth(vencimiento.getMonth() + garantia.duracionNumero);
                    } else if (garantia.duracionUnidad === 'años') {
                        vencimiento.setFullYear(vencimiento.getFullYear() + garantia.duracionNumero);
                    }
                    garantiaVencimiento = vencimiento;
                }
            }

            clientesMap[email].productos.push({
                inventarioId: item._id,
                idInventario: item.idInventario,
                numeroSerie: item.numeroSerie,
                productoNombre: item.producto?.modelo || item.pieza?.nombre || '—',
                estado: item.estado,
                fechaRegistro: item.fechaRegistro,
                fechaVenta: item.fechaVenta,
                garantiaNombre: garantia?.nombre || null,
                garantiaVencimiento,
                registrado: item.registrado
            });

            // Update client name if this record has a more complete one
            if (item.comprador.nombreCompleto && (!clientesMap[email].nombreCompleto || clientesMap[email].nombreCompleto.length < item.comprador.nombreCompleto.length)) {
                clientesMap[email].nombreCompleto = item.comprador.nombreCompleto;
            }
            if (item.comprador.telefono && !clientesMap[email].telefono) {
                clientesMap[email].telefono = item.comprador.telefono;
            }
            if (item.comprador.cuil && !clientesMap[email].cuil) {
                clientesMap[email].cuil = item.comprador.cuil;
            }
            if (item.comprador.direccion && !clientesMap[email].direccion) {
                clientesMap[email].direccion = item.comprador.direccion;
            }
            if (item.comprador.provincia && !clientesMap[email].provincia) {
                clientesMap[email].provincia = item.comprador.provincia;
            }
        }

        const clientes = Object.values(clientesMap).sort((a, b) => {
            return new Date(b.primerRegistro) - new Date(a.primerRegistro);
        });

        res.json(clientes);
    } catch (err) {
        console.error('Error al cargar clientes:', err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   PUT /api/apoderado/clientes/:email
// @desc    Update client data across all their inventory items
// @access  Private (Apoderado)
router.put('/clientes/:email', auth, async (req, res) => {
    try {
        const usuarioApoderado = req.usuario.id;
        const clientEmail = decodeURIComponent(req.params.email).toLowerCase().trim();
        const { nombreCompleto, telefono, cuil, direccion, provincia } = req.body;

        const fabricantes = await Fabricante.find(getFabricantesQuery(usuarioApoderado));
        const fabricanteIds = fabricantes.map(f => f._id);

        const productosAccesibles = await Producto.find({
            $or: [
                { usuarioApoderado },
                { fabricante: { $in: fabricanteIds } }
            ]
        }).select('_id');
        const productoIdsAccesibles = productosAccesibles.map(p => p._id);

        const piezasAccesibles = await Pieza.find({
            $or: [
                { usuarioApoderado },
                { fabricante: { $in: fabricanteIds } }
            ]
        }).select('_id');
        const piezaIdsAccesibles = piezasAccesibles.map(p => p._id);

        const updateFields = {};
        if (nombreCompleto !== undefined) updateFields['comprador.nombreCompleto'] = nombreCompleto;
        if (telefono !== undefined) updateFields['comprador.telefono'] = telefono;
        if (cuil !== undefined) updateFields['comprador.cuil'] = cuil;
        if (direccion !== undefined) updateFields['comprador.direccion'] = direccion;
        if (provincia !== undefined) updateFields['comprador.provincia'] = provincia;

        await Inventario.updateMany(
            {
                $or: [
                    { usuarioApoderado },
                    { producto: { $in: productoIdsAccesibles } },
                    { pieza: { $in: piezaIdsAccesibles } }
                ],
                'comprador.correoElectronico': { $regex: new RegExp('^' + clientEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
            },
            { $set: updateFields }
        );

        res.json({ message: 'Cliente actualizado correctamente' });
    } catch (err) {
        console.error('Error al actualizar cliente:', err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/apoderado/pedidos-garantia
// @desc    Get all warranty claims for fabricantes managed by this user
// @access  Private (Apoderado)
router.get('/pedidos-garantia', auth, async (req, res) => {
    try {
        const fabricantes = await Fabricante.find(getFabricantesQuery(req.usuario.id));
        const fabricanteIds = fabricantes.map(f => f._id);

        const pedidos = await PedidoGarantia.find({ fabricante: { $in: fabricanteIds } })
            .populate(PEDIDO_GARANTIA_POPULATE)
            .sort({ createdAt: -1 });

        res.json(pedidos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/apoderado/pedidos-garantia/:id
// @desc    Get a specific warranty claim
// @access  Private (Apoderado)
router.get('/pedidos-garantia/:id', auth, async (req, res) => {
    try {
        const fabricantes = await Fabricante.find(getFabricantesQuery(req.usuario.id));
        const fabricanteIds = fabricantes.map(f => f._id.toString());

        const pedido = await PedidoGarantia.findById(req.params.id)
            .populate(PEDIDO_GARANTIA_POPULATE);

        if (!pedido) {
            return res.status(404).json({ msg: 'Pedido no encontrado' });
        }

        if (!fabricanteIds.includes(pedido.fabricante._id.toString())) {
            return res.status(403).json({ msg: 'No autorizado' });
        }

        res.json(pedido);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   POST /api/apoderado/pedidos-garantia/:id/responder
// @desc    Respond to a warranty claim and notify user by email
// @access  Private (Apoderado)
router.post('/pedidos-garantia/:id/responder', auth, async (req, res) => {
    try {
        const fabricantes = await Fabricante.find(getFabricantesQuery(req.usuario.id));
        const fabricanteIds = fabricantes.map(f => f._id.toString());

        const pedido = await PedidoGarantia.findById(req.params.id)
            .populate('usuario', 'nombreCompleto correoElectronico')
            .populate('fabricante', 'razonSocial');

        if (!pedido) {
            return res.status(404).json({ msg: 'Pedido no encontrado' });
        }

        if (!fabricanteIds.includes(pedido.fabricante._id.toString())) {
            return res.status(403).json({ msg: 'No autorizado' });
        }

        const { contenido } = req.body;
        if (!contenido) {
            return res.status(400).json({ msg: 'El contenido del mensaje es requerido' });
        }

        pedido.mensajes.push({
            autor: 'fabricante',
            autorId: req.usuario.id,
            contenido
        });

        await pedido.save();

        // Send email notification to user
        const usuarioData = pedido.usuario;
        if (usuarioData && usuarioData.correoElectronico) {
            await sendGarantiaResponseEmail(
                usuarioData.correoElectronico,
                usuarioData.nombreCompleto,
                pedido.fabricante.razonSocial,
                pedido._id.toString().slice(-6).toUpperCase(),
                contenido
            );
        }

        const updatedPedido = await PedidoGarantia.findById(pedido._id)
            .populate(PEDIDO_GARANTIA_POPULATE);

        res.json({ msg: 'Respuesta enviada', pedido: updatedPedido });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   PUT /api/apoderado/pedidos-garantia/:id/estado
// @desc    Change the status of a warranty claim
// @access  Private (Apoderado)
router.put('/pedidos-garantia/:id/estado', auth, async (req, res) => {
    try {
        const fabricantes = await Fabricante.find(getFabricantesQuery(req.usuario.id));
        const fabricanteIds = fabricantes.map(f => f._id.toString());

        const pedido = await PedidoGarantia.findById(req.params.id);

        if (!pedido) {
            return res.status(404).json({ msg: 'Pedido no encontrado' });
        }

        if (!fabricanteIds.includes(pedido.fabricante.toString())) {
            return res.status(403).json({ msg: 'No autorizado' });
        }

        const { estado } = req.body;
        const estadosValidos = ['Nuevo', 'En Análisis', 'Cerrado'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ msg: 'Estado inválido' });
        }

        pedido.estado = estado;
        await pedido.save();

        const updatedPedido = await PedidoGarantia.findById(pedido._id)
            .populate(PEDIDO_GARANTIA_POPULATE);

        res.json({ msg: 'Estado actualizado', pedido: updatedPedido });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// =============================================
// ALERTAS & NOTIFICACIONES
// =============================================

// @route   GET /api/apoderado/alertas/contadores
// @desc    Get alert counters for all fabricantes the user has access to
// @access  Privado (Apoderado)
router.get('/alertas/contadores', auth, async (req, res) => {
    try {
        const fabricantes = await Fabricante.find(getFabricantesQuery(req.usuario.id)).select('_id');
        const fabricanteIds = fabricantes.map(f => f._id);
        const contadores = await obtenerContadores(fabricanteIds);
        res.json(contadores);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/apoderado/alertas
// @desc    Get paginated list of notifications
// @access  Privado (Apoderado)
router.get('/alertas', auth, async (req, res) => {
    try {
        const fabricantes = await Fabricante.find(getFabricantesQuery(req.usuario.id)).select('_id');
        const fabricanteIds = fabricantes.map(f => f._id);

        const { tipo, page = 1, limit = 20 } = req.query;
        const query = { fabricante: { $in: fabricanteIds } };
        if (tipo) query.tipo = tipo;

        const total = await Notificacion.countDocuments(query);
        const notificaciones = await Notificacion.find(query)
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        const noLeidas = await Notificacion.countDocuments({ ...query, leida: false });

        res.json({
            notificaciones,
            total,
            noLeidas,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   PUT /api/apoderado/alertas/:id/leer
// @desc    Mark a notification as read
// @access  Privado (Apoderado)
router.put('/alertas/:id/leer', auth, async (req, res) => {
    try {
        const fabricantes = await Fabricante.find(getFabricantesQuery(req.usuario.id)).select('_id');
        const fabricanteIds = fabricantes.map(f => f._id.toString());

        const notificacion = await Notificacion.findById(req.params.id);
        if (!notificacion || !fabricanteIds.includes(notificacion.fabricante.toString())) {
            return res.status(404).json({ msg: 'Notificación no encontrada' });
        }

        notificacion.leida = true;
        await notificacion.save();
        res.json({ msg: 'Notificación marcada como leída' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   PUT /api/apoderado/alertas/leer-todas
// @desc    Mark all notifications as read
// @access  Privado (Apoderado)
router.put('/alertas/leer-todas', auth, async (req, res) => {
    try {
        const fabricantes = await Fabricante.find(getFabricantesQuery(req.usuario.id)).select('_id');
        const fabricanteIds = fabricantes.map(f => f._id);

        await Notificacion.updateMany(
            { fabricante: { $in: fabricanteIds }, leida: false },
            { $set: { leida: true } }
        );

        res.json({ msg: 'Todas las notificaciones marcadas como leídas' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// =============================================
// SOLICITUDES DE REPRESENTACIÓN
// =============================================

// @route   GET /api/apoderado/solicitudes-representacion
// @desc    Get all representation requests for user's fabricantes
// @access  Privado (Apoderado)
router.get('/solicitudes-representacion', auth, async (req, res) => {
    try {
        const fabricantes = await Fabricante.find(getFabricantesQuery(req.usuario.id)).select('_id');
        const fabricanteIds = fabricantes.map(f => f._id);

        const { estado, page = 1, limit = 20 } = req.query;
        const query = { fabricante: { $in: fabricanteIds } };
        if (estado) query.estado = estado;

        const total = await SolicitudRepresentacion.countDocuments(query);
        const solicitudes = await SolicitudRepresentacion.find(query)
            .populate('fabricante', 'razonSocial')
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.json({
            solicitudes,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/apoderado/solicitudes-representacion/:id
// @desc    Get a single representation request by ID
// @access  Privado (Apoderado)
router.get('/solicitudes-representacion/:id', auth, async (req, res) => {
    try {
        const fabricantes = await Fabricante.find(getFabricantesQuery(req.usuario.id)).select('_id');
        const fabricanteIds = fabricantes.map(f => f._id.toString());

        const solicitud = await SolicitudRepresentacion.findById(req.params.id)
            .populate('fabricante', 'razonSocial');
        if (!solicitud || !fabricanteIds.includes(solicitud.fabricante._id.toString())) {
            return res.status(404).json({ msg: 'Solicitud no encontrada' });
        }

        res.json(solicitud);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   PUT /api/apoderado/solicitudes-representacion/:id
// @desc    Update representation request status (approve/reject)
// @access  Privado (Apoderado)
router.put('/solicitudes-representacion/:id', auth, async (req, res) => {
    try {
        const { estado, comentarioRechazo } = req.body;
        const estadosValidos = ['En Evaluación', 'Aceptada', 'Rechazada'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ msg: 'Estado inválido' });
        }

        const fabricantes = await Fabricante.find(getFabricantesQuery(req.usuario.id)).select('_id razonSocial');
        const fabricanteIds = fabricantes.map(f => f._id.toString());

        const solicitud = await SolicitudRepresentacion.findById(req.params.id)
            .populate('fabricante', 'razonSocial');
        if (!solicitud || !fabricanteIds.includes(solicitud.fabricante._id.toString())) {
            return res.status(404).json({ msg: 'Solicitud no encontrada' });
        }

        solicitud.estado = estado;
        if (estado === 'Rechazada' && comentarioRechazo) {
            solicitud.comentarioRechazo = comentarioRechazo;
        }
        await solicitud.save();

        // Send email notification to applicant on status change
        if (estado === 'Aceptada' || estado === 'Rechazada') {
            sendSolicitudEstadoEmail(
                solicitud.correo,
                solicitud.nombre,
                solicitud.fabricante.razonSocial,
                solicitud._id.toString().slice(-6).toUpperCase(),
                estado,
                estado === 'Rechazada' ? comentarioRechazo : ''
            ).catch(err => console.error('Error sending solicitud estado email:', err));
        }

        res.json({ msg: 'Estado actualizado', solicitud });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   POST /api/apoderado/solicitudes-representacion/:id/mensaje
// @desc    Send a message to the applicant
// @access  Privado (Apoderado)
router.post('/solicitudes-representacion/:id/mensaje', auth, async (req, res) => {
    try {
        const fabricantes = await Fabricante.find(getFabricantesQuery(req.usuario.id)).select('_id razonSocial');
        const fabricanteIds = fabricantes.map(f => f._id.toString());

        const solicitud = await SolicitudRepresentacion.findById(req.params.id)
            .populate('fabricante', 'razonSocial');
        if (!solicitud || !fabricanteIds.includes(solicitud.fabricante._id.toString())) {
            return res.status(404).json({ msg: 'Solicitud no encontrada' });
        }

        const { contenido } = req.body;
        if (!contenido) {
            return res.status(400).json({ msg: 'El contenido del mensaje es requerido' });
        }

        // Get the user's name for the message
        const usuario = await Usuario.findById(req.usuario.id).select('nombreCompleto');
        const autorNombre = usuario?.nombreCompleto || 'Fabricante';

        solicitud.mensajes.push({
            autor: 'fabricante',
            autorNombre,
            contenido
        });

        await solicitud.save();

        // Send email notification to applicant
        sendSolicitudMensajeEmail(
            solicitud.correo,
            solicitud.nombre,
            solicitud.fabricante.razonSocial,
            solicitud._id.toString().slice(-6).toUpperCase(),
            contenido
        ).catch(err => console.error('Error sending solicitud mensaje email:', err));

        res.json({ msg: 'Mensaje enviado', solicitud });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// ==========================================
// CHECKLIST CONFIG ROUTES
// ==========================================

// @route   GET /api/apoderado/checklist-config
// @desc    Get checklist items for all fabricantes the user has access to
// @access  Privado (Apoderado)
router.get('/checklist-config', auth, async (req, res) => {
    try {
        const fabricantes = await Fabricante.find(getFabricantesQuery(req.usuario.id))
            .select('razonSocial checklistItems');

        if (!fabricantes || fabricantes.length === 0) {
            return res.status(404).json({ msg: 'Fabricante no encontrado' });
        }

        res.json({
            fabricantes: fabricantes.map(f => ({
                _id: f._id,
                razonSocial: f.razonSocial,
                checklistItems: f.checklistItems || []
            }))
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   POST /api/apoderado/checklist-config/add
// @desc    Add a checklist item to a fabricante
// @access  Privado (Apoderado)
router.post('/checklist-config/add', auth, async (req, res) => {
    try {
        const { fabricanteId, nombre, requiereFecha } = req.body;

        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ msg: 'El nombre del item es requerido.' });
        }

        const query = fabricanteId
            ? getFabricantesQuery(req.usuario.id, { _id: fabricanteId })
            : getFabricantesQuery(req.usuario.id);

        const fabricante = await Fabricante.findOne(query);

        if (!fabricante) {
            return res.status(404).json({ msg: 'Fabricante no encontrado' });
        }

        fabricante.checklistItems.push({
            nombre: nombre.trim(),
            requiereFecha: !!requiereFecha
        });

        await fabricante.save();
        logAuditEvent({
            usuarioId: req.usuario.id, fabricanteId: fabricante._id, accion: 'creacion',
            tipoEntidad: 'checklist', entidadId: fabricante._id, descripcionEntidad: nombre.trim(),
            detalles: { nombre: nombre.trim(), requiereFecha: !!requiereFecha }
        });
        res.status(201).json({ msg: 'Item de checklist creado', checklistItems: fabricante.checklistItems });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   PUT /api/apoderado/checklist-config/:itemId
// @desc    Update a checklist item
// @access  Privado (Apoderado)
router.put('/checklist-config/:itemId', auth, async (req, res) => {
    try {
        const { fabricanteId, nombre, requiereFecha } = req.body;

        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ msg: 'El nombre del item es requerido.' });
        }

        const query = fabricanteId
            ? getFabricantesQuery(req.usuario.id, { _id: fabricanteId })
            : getFabricantesQuery(req.usuario.id);

        const fabricante = await Fabricante.findOne(query);

        if (!fabricante) {
            return res.status(404).json({ msg: 'Fabricante no encontrado' });
        }

        const item = fabricante.checklistItems.id(req.params.itemId);
        if (!item) {
            return res.status(404).json({ msg: 'Item de checklist no encontrado' });
        }

        const anteriorChecklist = { nombre: item.nombre, requiereFecha: item.requiereFecha };
        item.nombre = nombre.trim();
        item.requiereFecha = !!requiereFecha;

        await fabricante.save();
        const checkChanges = getChangedFields(anteriorChecklist, { nombre: nombre.trim(), requiereFecha: !!requiereFecha });
        if (Object.keys(checkChanges.valorAnterior).length > 0) {
            logAuditEvent({
                usuarioId: req.usuario.id, fabricanteId: fabricante._id, accion: 'actualizacion',
                tipoEntidad: 'checklist', entidadId: fabricante._id, descripcionEntidad: nombre.trim(),
                valorAnterior: checkChanges.valorAnterior, valorNuevo: checkChanges.valorNuevo
            });
        }
        res.json({ msg: 'Item de checklist actualizado', checklistItems: fabricante.checklistItems });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   DELETE /api/apoderado/checklist-config/:itemId
// @desc    Delete a checklist item
// @access  Privado (Apoderado)
router.delete('/checklist-config/:itemId', auth, async (req, res) => {
    try {
        const { fabricanteId } = req.query;

        const query = fabricanteId
            ? getFabricantesQuery(req.usuario.id, { _id: fabricanteId })
            : getFabricantesQuery(req.usuario.id);

        const fabricante = await Fabricante.findOne(query);

        if (!fabricante) {
            return res.status(404).json({ msg: 'Fabricante no encontrado' });
        }

        const item = fabricante.checklistItems.id(req.params.itemId);
        if (!item) {
            return res.status(404).json({ msg: 'Item de checklist no encontrado' });
        }

        const checkDelNombre = item.nombre;
        item.deleteOne();
        await fabricante.save();
        logAuditEvent({
            usuarioId: req.usuario.id, fabricanteId: fabricante._id, accion: 'eliminacion',
            tipoEntidad: 'checklist', entidadId: fabricante._id, descripcionEntidad: checkDelNombre
        });
        res.json({ msg: 'Item de checklist eliminado', checklistItems: fabricante.checklistItems });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// ================== AUDIT LOG ROUTES ==================

// @route   GET /api/apoderado/audit-log
// @desc    Obtener registros de auditoría paginados con filtros
// @access  Privado (Apoderado)
router.get('/audit-log', auth, async (req, res) => {
    try {
        const { search, periodo, fechaDesde, fechaHasta, page = 1, limit = 25 } = req.query;

        const fabricantes = await Fabricante.find(getFabricantesQuery(req.usuario.id));
        const fabricanteIds = fabricantes.map(fab => fab._id);

        if (fabricanteIds.length === 0) {
            return res.json({ logs: [], total: 0, page: 1, totalPages: 0 });
        }

        const query = { fabricante: { $in: fabricanteIds } };

        // Period filter
        if (periodo && periodo !== 'todos') {
            const now = new Date();
            let desde;
            if (periodo === 'ultimo_mes') {
                desde = new Date(now.setDate(now.getDate() - 30));
            } else if (periodo === 'ultimos_3_meses') {
                desde = new Date(now.setDate(now.getDate() - 90));
            } else if (periodo === 'ultimos_6_meses') {
                desde = new Date(now.setDate(now.getDate() - 180));
            } else if (periodo === 'custom' && fechaDesde) {
                query.createdAt = { $gte: new Date(fechaDesde) };
                if (fechaHasta) {
                    const hasta = new Date(fechaHasta);
                    hasta.setHours(23, 59, 59, 999);
                    query.createdAt.$lte = hasta;
                }
            }
            if (desde && periodo !== 'custom') {
                query.createdAt = { $gte: desde };
            }
        }

        // Text search
        if (search && search.trim()) {
            const searchRegex = { $regex: search.trim(), $options: 'i' };
            query.$or = [
                { nombreUsuario: searchRegex },
                { descripcionEntidad: searchRegex },
                { tipoEntidad: searchRegex }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await AuditLog.countDocuments(query);
        const logs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        res.json({
            logs,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/apoderado/audit-log/export
// @desc    Exportar registros de auditoría (sin paginación)
// @access  Privado (Apoderado)
router.get('/audit-log/export', auth, async (req, res) => {
    try {
        const { search, periodo, fechaDesde, fechaHasta } = req.query;

        const fabricantes = await Fabricante.find(getFabricantesQuery(req.usuario.id));
        const fabricanteIds = fabricantes.map(fab => fab._id);

        const query = { fabricante: { $in: fabricanteIds } };

        if (periodo && periodo !== 'todos') {
            const now = new Date();
            let desde;
            if (periodo === 'ultimo_mes') {
                desde = new Date(now.setDate(now.getDate() - 30));
            } else if (periodo === 'ultimos_3_meses') {
                desde = new Date(now.setDate(now.getDate() - 90));
            } else if (periodo === 'ultimos_6_meses') {
                desde = new Date(now.setDate(now.getDate() - 180));
            } else if (periodo === 'custom' && fechaDesde) {
                query.createdAt = { $gte: new Date(fechaDesde) };
                if (fechaHasta) {
                    const hasta = new Date(fechaHasta);
                    hasta.setHours(23, 59, 59, 999);
                    query.createdAt.$lte = hasta;
                }
            }
            if (desde && periodo !== 'custom') {
                query.createdAt = { $gte: desde };
            }
        }

        if (search && search.trim()) {
            const searchRegex = { $regex: search.trim(), $options: 'i' };
            query.$or = [
                { nombreUsuario: searchRegex },
                { descripcionEntidad: searchRegex },
                { tipoEntidad: searchRegex }
            ];
        }

        const logs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .lean();

        const exportData = logs.map(log => ({
            Fecha: new Date(log.createdAt).toLocaleString('es-AR'),
            Usuario: log.nombreUsuario,
            Accion: ACCION_LABELS[log.accion] || log.accion,
            Tipo: ENTITY_LABELS[log.tipoEntidad] || log.tipoEntidad,
            Descripcion: log.descripcionEntidad || ''
        }));

        res.json(exportData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/apoderado/audit-log/:id
// @desc    Obtener detalle de un registro de auditoría
// @access  Privado (Apoderado)
router.get('/audit-log/:id', auth, async (req, res) => {
    try {
        const log = await AuditLog.findById(req.params.id).lean();

        if (!log) {
            return res.status(404).json({ msg: 'Registro de auditoría no encontrado' });
        }

        // Verify access
        const fabricantes = await Fabricante.find(getFabricantesQuery(req.usuario.id));
        const fabricanteIds = fabricantes.map(fab => fab._id.toString());

        if (!fabricanteIds.includes(log.fabricante.toString())) {
            return res.status(403).json({ msg: 'No autorizado' });
        }

        res.json(log);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/apoderado/reportes/ventas
// @desc    Obtener datos de ventas agrupados por fabricante/provincia/ciudad/representante
// @access  Privado (Apoderado)
router.get('/reportes/ventas', auth, async (req, res) => {
    try {
        const usuarioApoderado = req.usuario.id;
        const { desde, hasta } = req.query;

        // Build date filter
        const dateFilter = {};
        if (desde) dateFilter.$gte = new Date(desde);
        if (hasta) {
            const hastaDate = new Date(hasta);
            hastaDate.setHours(23, 59, 59, 999);
            dateFilter.$lte = hastaDate;
        }

        // Base match: items sold by this apoderado
        const matchStage = {
            usuarioApoderado: new (require('mongoose').Types.ObjectId)(usuarioApoderado),
            estado: 'vendido'
        };
        if (desde || hasta) {
            matchStage.fechaVenta = dateFilter;
        }

        // Get fabricante IDs for this apoderado
        const fabricantes = await Fabricante.find({
            $or: [
                { usuarioApoderado },
                { administradores: usuarioApoderado }
            ]
        }).select('_id razonSocial');
        const fabricanteIds = fabricantes.map(f => f._id);
        const fabricanteMap = {};
        fabricantes.forEach(f => { fabricanteMap[f._id.toString()] = f.razonSocial; });

        // Get all sold items with populated references
        const ventas = await Inventario.find(matchStage)
            .populate({
                path: 'producto',
                select: 'fabricante modelo',
                populate: { path: 'fabricante', select: 'razonSocial' }
            })
            .populate({
                path: 'pieza',
                select: 'fabricante nombre',
                populate: { path: 'fabricante', select: 'razonSocial' }
            })
            .populate('representante', 'razonSocial nombre')
            .lean();

        // Filter only items belonging to this apoderado's fabricantes
        const ventasFiltradas = ventas.filter(v => {
            const fab = v.producto?.fabricante || v.pieza?.fabricante;
            return fab && fabricanteIds.some(id => id.toString() === fab._id.toString());
        });

        // --- Aggregate: ventas por fabricante por provincia ---
        const porProvincia = {};
        const porCiudad = {};
        const porRepresentante = {};

        ventasFiltradas.forEach(v => {
            const fab = v.producto?.fabricante || v.pieza?.fabricante;
            const fabNombre = fab?.razonSocial || 'Sin fabricante';
            const provincia = v.comprador?.provincia || 'Sin provincia';
            const ciudad = v.comprador?.direccion || 'Sin ciudad';
            const rep = v.representante;
            const repNombre = rep ? (rep.razonSocial || rep.nombre) : 'Venta directa (particular)';

            // Por provincia
            const keyProv = `${fabNombre}|||${provincia}`;
            porProvincia[keyProv] = (porProvincia[keyProv] || 0) + 1;

            // Por ciudad
            const keyCiudad = `${fabNombre}|||${ciudad}`;
            porCiudad[keyCiudad] = (porCiudad[keyCiudad] || 0) + 1;

            // Por representante
            const keyRep = `${fabNombre}|||${repNombre}`;
            porRepresentante[keyRep] = (porRepresentante[keyRep] || 0) + 1;
        });

        const toArray = (obj) => Object.entries(obj).map(([key, count]) => {
            const [fabricante, dimension] = key.split('|||');
            return { fabricante, dimension, count };
        }).sort((a, b) => b.count - a.count);

        res.json({
            porProvincia: toArray(porProvincia),
            porCiudad: toArray(porCiudad),
            porRepresentante: toArray(porRepresentante),
            totalVentas: ventasFiltradas.length
        });
    } catch (err) {
        console.error('Error en reportes de ventas:', err.message);
        res.status(500).send('Error del servidor');
    }
});

module.exports = router;

