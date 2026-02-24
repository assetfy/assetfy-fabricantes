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
const argentineRegions = require('../data/argentine-regions'); // Importa los datos de regiones argentinas
const { Parser } = require('json2csv');
const { sendGarantiaResponseEmail } = require('../utils/emailService');

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
const calculateWarrantyExpiration = (fechaVenta, plazoNumero, plazoUnidad) => {
    if (!fechaVenta || !plazoNumero || !plazoUnidad) {
        return null;
    }
    
    const fecha = new Date(fechaVenta);
    
    switch (plazoUnidad) {
        case 'dias':
            fecha.setDate(fecha.getDate() + plazoNumero);
            break;
        case 'meses':
            fecha.setMonth(fecha.getMonth() + plazoNumero);
            break;
        case 'años':
            fecha.setFullYear(fecha.getFullYear() + plazoNumero);
            break;
        default:
            return null;
    }
    
    return fecha;
};

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

        producto.modelo = modelo;
        producto.descripcion = descripcion;
        producto.precio = precio;
        producto.fabricante = fabricante;
        producto.marca = marca;
        producto.atributos = atributos || [];
        producto.garantia = garantia || null;

        await producto.save();
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

        await producto.deleteOne();
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
            
        res.json(productos);
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

        await marca.deleteOne();
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

        marca.nombre = req.body.nombre;
        marca.fabricante = req.body.fabricante;
        marca.estado = req.body.estado;

        await marca.save();
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

        ubicacion.nombre = nombre;
        ubicacion.direccion = direccion;
        ubicacion.telefono = telefono;
        ubicacion.fabricante = fabricante || null;

        await ubicacion.save();
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

        await Ubicacion.findByIdAndDelete(req.params.id);
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
    const { search, estado } = req.query; // Obtener los parámetros de búsqueda y filtro
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

        const inventario = await Inventario.find(query)
            .populate({
                path: 'producto',
                populate: { path: 'fabricante' }
            })
            .populate('pieza')
            .populate('ubicacion');

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
            const productoAsociado = await Producto.findOne({ _id: producto, usuarioApoderado });
            if (!productoAsociado) {
                return res.status(403).json('No tienes permiso para agregar inventario a este producto.');
            }
        }

        if (pieza) {
            const piezaAsociada = await Pieza.findOne({ _id: pieza, usuarioApoderado });
            if (!piezaAsociada) {
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
        res.status(201).json('Artículo de inventario creado con éxito!');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   PUT /api/apoderado/inventario/:id
// @desc    Actualizar un artículo de inventario
// @access  Privado (Apoderado)
router.put('/inventario/:id', auth, async (req, res) => {

    const { numeroSerie, estado, producto, pieza, comprador, atributos, fechaVenta, ubicacion } = req.body;

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

        item.numeroSerie = numeroSerie;
        item.estado = estado;
        item.producto = producto || undefined;
        item.pieza = pieza || undefined;
        item.comprador = comprador;
        item.atributos = atributos || [];
        item.ubicacion = ubicacion || undefined;
        
        // Handle fechaVenta logic
        if (fechaVenta) {
            item.fechaVenta = fechaVenta;
        } else if (estado === 'vendido' && !item.fechaVenta) {
            // Will be set by pre-save middleware
            item.fechaVenta = undefined;
        } else if (estado !== 'vendido') {
            // Clear fechaVenta if not vendido
            item.fechaVenta = undefined;
        }

        await item.save();
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

        await item.deleteOne();
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
        });
        const fabricanteIds = fabricantes.map(fab => fab._id);

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

        res.json({
            fabricantes: fabricantes.length,
            productos: productosCount,
            marcas: marcasCount,
            inventario: inventarioCount,
            piezas: piezasCount,
            representantes: representantesCount,
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
        marcasRepresentadas
    } = req.body;
    const usuarioApoderado = req.usuario.id;

    try {
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
            marcasRepresentadas: marcasRepresentadas || []
        });

        await nuevoRepresentante.save();
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
            marcasRepresentadas
        } = req.body;

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

        await representante.save();
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

        await representante.deleteOne();
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
                    if (row.estado && !['stock', 'vendido', 'alquilado'].includes(row.estado)) {
                        errors.push({ row: rowNumber, message: 'El estado debe ser "stock", "vendido" o "alquilado"' });
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

        await Garantia.findByIdAndDelete(req.params.id);
        res.json('Garantía eliminada!');
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

        res.json(piezas);
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

        pieza.nombre = nombre;
        pieza.fabricante = fabricante || null;
        pieza.marca = marca || null;
        pieza.productos = productos || [];
        pieza.atributos = atributos || [];
        pieza.garantia = garantia || null;

        await pieza.save();
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

        await pieza.deleteOne();
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

        if (portalColor) {
            // Validate hex color format
            if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(portalColor)) {
                return res.status(400).json({ msg: 'Color inválido. Use formato hexadecimal (ej: #1a73e8).' });
            }
            fabricante.portalColor = portalColor;
        }

        await fabricante.save();
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

// @route   GET /api/apoderado/pedidos-garantia
// @desc    Get all warranty claims for fabricantes managed by this user
// @access  Private (Apoderado)
router.get('/pedidos-garantia', auth, async (req, res) => {
    try {
        const fabricantes = await Fabricante.find(getFabricantesQuery(req.usuario.id));
        const fabricanteIds = fabricantes.map(f => f._id);

        const pedidos = await PedidoGarantia.find({ fabricante: { $in: fabricanteIds } })
            .populate('bien', 'nombre datosProducto fechaRegistro')
            .populate('usuario', 'nombreCompleto correoElectronico')
            .populate('fabricante', 'razonSocial')
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
            .populate('bien', 'nombre datosProducto fechaRegistro')
            .populate('usuario', 'nombreCompleto correoElectronico')
            .populate('fabricante', 'razonSocial');

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

        res.json({ msg: 'Respuesta enviada', pedido });
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

        res.json({ msg: 'Estado actualizado', pedido });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

module.exports = router;


