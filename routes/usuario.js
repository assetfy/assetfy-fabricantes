// routes/usuario.js - Routes for usuario_bienes role

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { hasRole } = require('../utils/roleHelper');
const Bien = require('../models/bien.model');
const Usuario = require('../models/usuario.model');
const Inventario = require('../models/inventario.model');
const Producto = require('../models/producto.model');
const Fabricante = require('../models/fabricante.model');
const Marca = require('../models/marca.model');
const Garantia = require('../models/garantia.model');
const PedidoGarantia = require('../models/pedidoGarantia.model');
const { sendGarantiaUserReplyEmail } = require('../utils/emailService');
const { deleteFromS3, checkS3Connection } = require('../middleware/upload');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

// Get S3 instance from middleware
let s3;
try {
    const uploadModule = require('../middleware/upload');
    s3 = uploadModule.s3;
} catch (err) {
    console.error('Error loading S3:', err);
}

// Create upload middleware for bienes
const uploadBienImage = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.S3_BUCKET_NAME,
        key: function (req, file, cb) {
            const extension = path.extname(file.originalname);
            const fileName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const s3Key = `bienes/${fileName}`;
            cb(null, s3Key);
        },
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        contentType: multerS3.AUTO_CONTENT_TYPE
    }),
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpg|jpeg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos JPG, JPEG, PNG y GIF'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Create upload middleware for warranty claim attachments
const uploadGarantiaFile = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.S3_BUCKET_NAME,
        key: function (req, file, cb) {
            const fileName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const s3Key = `pedidos-garantia/${fileName}`;
            cb(null, s3Key);
        },
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        contentType: multerS3.AUTO_CONTENT_TYPE
    }),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Middleware to check usuario_bienes role
const checkUsuarioBienesRole = (req, res, next) => {
    if (!hasRole(req.usuario.roles, 'usuario_bienes')) {
        return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de usuario de bienes.' });
    }
    next();
};

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

// @route   GET /api/usuario/perfil
// @desc    Get usuario_bienes profile
// @access  Private (usuario_bienes)
router.get('/perfil', auth, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id).select('-contraseña');
        
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        if (!hasRole(usuario.roles, 'usuario_bienes')) {
            return res.status(403).json({ msg: 'Acceso denegado' });
        }

        res.json({ 
            usuario: {
                _id: usuario._id,
                nombreCompleto: usuario.nombreCompleto,
                cuil: usuario.cuil,
                correoElectronico: usuario.correoElectronico,
                telefono: usuario.telefono,
                imagenPerfil: usuario.imagenPerfil,
                roles: usuario.roles || [],
                estado: usuario.estado
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   PUT /api/usuario/perfil
// @desc    Update usuario_bienes profile
// @access  Private (usuario_bienes)
router.put('/perfil', auth, async (req, res) => {
    try {
        const { nombreCompleto, imagenPerfil } = req.body;
        
        const usuario = await Usuario.findById(req.usuario.id);
        
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        if (!hasRole(usuario.roles, 'usuario_bienes')) {
            return res.status(403).json({ msg: 'Acceso denegado' });
        }

        if (nombreCompleto) usuario.nombreCompleto = nombreCompleto;
        if (imagenPerfil !== undefined) usuario.imagenPerfil = imagenPerfil;

        await usuario.save();
        
        res.json({ 
            nombreCompleto: usuario.nombreCompleto, 
            roles: usuario.roles || [],
            imagenPerfil: usuario.imagenPerfil 
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/usuario/bienes
// @desc    Get all bienes for the authenticated usuario_bienes
// @access  Private (usuario_bienes)
router.get('/bienes', auth, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id);
        
        if (!usuario || !hasRole(usuario.roles, 'usuario_bienes')) {
            return res.status(403).json({ msg: 'Acceso denegado' });
        }

        const bienes = await Bien.find({ usuario: req.usuario.id })
            .populate('inventario')
            .populate({
                path: 'datosProducto.fabricante',
                select: 'razonSocial'
            })
            .populate({
                path: 'datosProducto.marca',
                select: 'nombre'
            })
            .populate({
                path: 'datosProducto.garantia',
                select: 'nombre duracionNumero duracionUnidad fechaInicio'
            })
            .sort({ createdAt: -1 });

        res.json(bienes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   POST /api/usuario/bienes/crear
// @desc    Create a new bien (user-created asset)
// @access  Private (usuario_bienes)
router.post('/bienes/crear', auth, checkS3Connection, uploadBienImage.single('imagen'), async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id);
        
        if (!usuario || !hasRole(usuario.roles, 'usuario_bienes')) {
            return res.status(403).json({ msg: 'Acceso denegado' });
        }

        const { nombre, comentarios, atributos } = req.body;

        if (!nombre) {
            return res.status(400).json({ msg: 'El nombre del bien es requerido' });
        }

        const nuevoBien = {
            nombre,
            tipo: 'creado',
            usuario: req.usuario.id,
            comentarios: comentarios || '',
            atributos: atributos ? JSON.parse(atributos) : []
        };

        // Image uploaded via multer-s3
        if (req.file) {
            nuevoBien.imagen = {
                originalName: req.file.originalname,
                fileName: req.file.key.split('/').pop(),
                s3Key: req.file.key,
                url: `/api/usuario/files/${Buffer.from(req.file.key).toString('base64')}`,
                uploadDate: new Date()
            };
        }

        const bien = new Bien(nuevoBien);
        await bien.save();

        res.json(bien);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   POST /api/usuario/bienes/verificar
// @desc    Verify if an inventory item exists and can be registered
// @access  Private (usuario_bienes)
router.post('/bienes/verificar', auth, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id);
        
        if (!usuario || !hasRole(usuario.roles, 'usuario_bienes')) {
            return res.status(403).json({ msg: 'Acceso denegado' });
        }

        const { idInventario } = req.body;

        if (!idInventario) {
            return res.status(400).json({ msg: 'ID de inventario es requerido' });
        }

        // Find inventory item by idInventario
        const inventario = await Inventario.findOne({ idInventario })
            .populate({
                path: 'producto',
                populate: [
                    { path: 'fabricante', select: 'razonSocial' },
                    { path: 'marca', select: 'nombre' },
                    { path: 'garantia', select: 'nombre duracionNumero duracionUnidad fechaInicio' }
                ]
            })
            .populate('comprador');

        if (!inventario) {
            return res.status(404).json({ 
                msg: 'Artículo no encontrado',
                encontrado: false 
            });
        }

        // Check if already registered by another user
        const existingBien = await Bien.findOne({ 
            inventario: inventario._id,
            tipo: 'registrado'
        }).populate('usuario', 'nombreCompleto correoElectronico');

        if (existingBien && existingBien.usuario._id.toString() !== req.usuario.id) {
            return res.status(400).json({ 
                msg: 'Este artículo ya está registrado por otro usuario',
                encontrado: true,
                registradoPorOtro: true,
                otroUsuario: existingBien.usuario.nombreCompleto
            });
        }

        // Check if current user already registered this item
        const yaRegistrado = existingBien && existingBien.usuario._id.toString() === req.usuario.id;

        res.json({
            encontrado: true,
            yaRegistrado,
            producto: {
                modelo: inventario.producto.modelo,
                numeroSerie: inventario.numeroSerie,
                descripcion: inventario.producto.descripcion,
                fabricante: inventario.producto.fabricante,
                marca: inventario.producto.marca,
                garantia: inventario.producto.garantia,
                atributos: inventario.producto.atributos,
                imagenPrincipal: inventario.producto.imagenPrincipal
            },
            inventarioId: inventario._id,
            bienId: yaRegistrado ? existingBien._id : null
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   POST /api/usuario/bienes/registrar
// @desc    Register an inventory item as a bien
// @access  Private (usuario_bienes)
router.post('/bienes/registrar', auth, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id);
        
        if (!usuario || !hasRole(usuario.roles, 'usuario_bienes')) {
            return res.status(403).json({ msg: 'Acceso denegado' });
        }

        const { inventarioId, nombreBien } = req.body;

        if (!inventarioId || !nombreBien) {
            return res.status(400).json({ msg: 'ID de inventario y nombre del bien son requeridos' });
        }

        // Get inventory item with product details
        const inventario = await Inventario.findById(inventarioId)
            .populate({
                path: 'producto',
                populate: [
                    { path: 'fabricante' },
                    { path: 'marca' },
                    { path: 'garantia' }
                ]
            });

        if (!inventario) {
            return res.status(404).json({ msg: 'Artículo de inventario no encontrado' });
        }

        // Check if already registered by this user
        let bien = await Bien.findOne({ 
            inventario: inventario._id,
            usuario: req.usuario.id,
            tipo: 'registrado'
        });

        if (bien) {
            // Update existing bien
            bien.nombre = nombreBien;
            await bien.save();
        } else {
            // Create new registered bien
            bien = new Bien({
                nombre: nombreBien,
                tipo: 'registrado',
                usuario: req.usuario.id,
                inventario: inventario._id,
                datosProducto: {
                    modelo: inventario.producto.modelo,
                    descripcion: inventario.producto.descripcion,
                    numeroSerie: inventario.numeroSerie,
                    garantia: inventario.producto.garantia?._id,
                    atributos: inventario.producto.atributos || [],
                    imagenPrincipal: inventario.producto.imagenPrincipal,
                    fabricante: inventario.producto.fabricante?._id,
                    marca: inventario.producto.marca?._id
                },
                fechaRegistro: inventario.fechaRegistro || new Date()
            });
            await bien.save();

            // Update inventario to mark as registered and add user info
            inventario.registrado = 'Si';
            if (!inventario.fechaRegistro) {
                inventario.fechaRegistro = new Date();
            }
            // Update comprador info
            inventario.comprador = {
                nombreCompleto: usuario.nombreCompleto,
                correoElectronico: usuario.correoElectronico,
                telefono: usuario.telefono || ''
            };
            await inventario.save();
        }

        // Populate references before sending response
        await bien.populate([
            {
                path: 'datosProducto.fabricante',
                select: 'razonSocial'
            },
            {
                path: 'datosProducto.marca',
                select: 'nombre'
            },
            {
                path: 'datosProducto.garantia',
                select: 'nombre duracionNumero duracionUnidad fechaInicio'
            }
        ]);

        res.json(bien);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/usuario/bienes/:id
// @desc    Get a specific bien
// @access  Private (usuario_bienes)
router.get('/bienes/:id', auth, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id);
        
        if (!usuario || !hasRole(usuario.roles, 'usuario_bienes')) {
            return res.status(403).json({ msg: 'Acceso denegado' });
        }

        const bien = await Bien.findOne({ _id: req.params.id, usuario: req.usuario.id })
            .populate('inventario')
            .populate({
                path: 'datosProducto.fabricante',
                select: 'razonSocial'
            })
            .populate({
                path: 'datosProducto.marca',
                select: 'nombre'
            })
            .populate({
                path: 'datosProducto.garantia',
                select: 'nombre duracionNumero duracionUnidad fechaInicio'
            });

        if (!bien) {
            return res.status(404).json({ msg: 'Bien no encontrado' });
        }

        res.json(bien);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   PUT /api/usuario/bienes/:id
// @desc    Update a bien
// @access  Private (usuario_bienes)
router.put('/bienes/:id', auth, checkS3Connection, uploadBienImage.single('imagen'), async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id);
        
        if (!usuario || !hasRole(usuario.roles, 'usuario_bienes')) {
            return res.status(403).json({ msg: 'Acceso denegado' });
        }

        const bien = await Bien.findOne({ _id: req.params.id, usuario: req.usuario.id });

        if (!bien) {
            return res.status(404).json({ msg: 'Bien no encontrado' });
        }

        const { nombre, comentarios, atributos } = req.body;

        // Update common fields
        if (nombre) bien.nombre = nombre;

        // For created bienes, allow full edit
        if (bien.tipo === 'creado') {
            if (comentarios !== undefined) bien.comentarios = comentarios;
            if (atributos) bien.atributos = JSON.parse(atributos);

            // Update image if provided
            if (req.file) {
                // Delete old image from S3 if exists
                if (bien.imagen && bien.imagen.s3Key) {
                    try {
                        await deleteFromS3(bien.imagen.s3Key);
                    } catch (delErr) {
                        console.error('Error deleting old image:', delErr);
                    }
                }

                // New image uploaded via multer-s3
                bien.imagen = {
                    originalName: req.file.originalname,
                    fileName: req.file.key.split('/').pop(),
                    s3Key: req.file.key,
                    url: `/api/usuario/files/${Buffer.from(req.file.key).toString('base64')}`,
                    uploadDate: new Date()
                };
            }
        }
        // For registered bienes, only allow name edit

        await bien.save();

        // Populate references
        await bien.populate([
            {
                path: 'datosProducto.fabricante',
                select: 'razonSocial'
            },
            {
                path: 'datosProducto.marca',
                select: 'nombre'
            },
            {
                path: 'datosProducto.garantia',
                select: 'nombre duracionNumero duracionUnidad fechaInicio'
            }
        ]);

        res.json(bien);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   DELETE /api/usuario/bienes/:id
// @desc    Delete a bien (does not affect manufacturer inventory for registered bienes)
// @access  Private (usuario_bienes)
router.delete('/bienes/:id', auth, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id);
        
        if (!usuario || !hasRole(usuario.roles, 'usuario_bienes')) {
            return res.status(403).json({ msg: 'Acceso denegado' });
        }

        const bien = await Bien.findOne({ _id: req.params.id, usuario: req.usuario.id });

        if (!bien) {
            return res.status(404).json({ msg: 'Bien no encontrado' });
        }

        // Delete image from S3 if it's a created bien
        if (bien.tipo === 'creado' && bien.imagen && bien.imagen.s3Key) {
            try {
                await deleteFromS3(bien.imagen.s3Key);
            } catch (delErr) {
                console.error('Error deleting image from S3:', delErr);
            }
        }

        // Note: We don't modify the inventory item for registered bienes
        // The user can re-register the same item later, and fechaRegistro will be maintained

        await Bien.deleteOne({ _id: bien._id });

        res.json({ msg: 'Bien eliminado exitosamente' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/usuario/files/:s3Key
// @desc    Serve files from S3 through backend proxy
// @access  Private - accepts token from header or query
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
            } else {
                return res.status(500).json('Error al acceder al archivo');
            }
        }
    } catch (err) {
        console.error('❌ Error serving file:', err);
        if (!res.headersSent) {
            res.status(500).json('Error del servidor');
        }
    }
});

// =============================================================================
// RUTAS DE PEDIDOS DE GARANTÍA (usuario)
// =============================================================================

// Utility: check if warranty is still active for a bien
const isWarrantyActive = (bien) => {
    if (!bien || bien.tipo !== 'registrado') return false;
    const garantia = bien.datosProducto?.garantia;
    if (!garantia || !garantia.duracionNumero || !garantia.duracionUnidad) return false;
    const fechaBase = bien.fechaRegistro;
    if (!fechaBase) return false;
    const inicio = new Date(fechaBase);
    switch (garantia.duracionUnidad) {
        case 'dias':
            inicio.setDate(inicio.getDate() + garantia.duracionNumero);
            break;
        case 'meses':
            inicio.setMonth(inicio.getMonth() + garantia.duracionNumero);
            break;
        case 'años':
            inicio.setFullYear(inicio.getFullYear() + garantia.duracionNumero);
            break;
        default:
            return false;
    }
    return inicio >= new Date();
};

// @route   GET /api/usuario/pedidos-garantia
// @desc    Get all warranty claims for the authenticated user
// @access  Private (usuario_bienes)
router.get('/pedidos-garantia', auth, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id);
        if (!usuario || !hasRole(usuario.roles, 'usuario_bienes')) {
            return res.status(403).json({ msg: 'Acceso denegado' });
        }

        const pedidos = await PedidoGarantia.find({ usuario: req.usuario.id })
            .populate('bien', 'nombre datosProducto fechaRegistro')
            .populate('fabricante', 'razonSocial')
            .sort({ createdAt: -1 });

        res.json(pedidos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   POST /api/usuario/pedidos-garantia
// @desc    Create a new warranty claim
// @access  Private (usuario_bienes)
router.post('/pedidos-garantia', auth, (req, res, next) => {
    // Only process file upload if S3 is configured
    uploadGarantiaFile.single('archivo')(req, res, (err) => {
        if (err) {
            console.warn('⚠️ File upload failed (continuing without file):', err.message);
        }
        next();
    });
}, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id);
        if (!usuario || !hasRole(usuario.roles, 'usuario_bienes')) {
            return res.status(403).json({ msg: 'Acceso denegado' });
        }

        const { bienId, descripcion, comentario } = req.body;

        if (!bienId || !descripcion) {
            return res.status(400).json({ msg: 'Se requiere el bien y la descripción' });
        }

        // Verify bien belongs to user and warranty is active
        const bien = await Bien.findOne({ _id: bienId, usuario: req.usuario.id })
            .populate({ path: 'datosProducto.garantia', select: 'duracionNumero duracionUnidad' })
            .populate({ path: 'datosProducto.fabricante', select: '_id razonSocial' });

        if (!bien) {
            return res.status(404).json({ msg: 'Bien no encontrado' });
        }

        if (!isWarrantyActive(bien)) {
            return res.status(400).json({ msg: 'La garantía del bien no está vigente' });
        }

        const fabricanteId = bien.datosProducto?.fabricante?._id;
        if (!fabricanteId) {
            return res.status(400).json({ msg: 'No se encontró el fabricante del bien' });
        }

        const pedidoData = {
            bien: bienId,
            usuario: req.usuario.id,
            fabricante: fabricanteId,
            descripcion,
            estado: 'Nuevo',
            mensajes: []
        };

        if (comentario) {
            pedidoData.mensajes.push({
                autor: 'usuario',
                autorId: req.usuario.id,
                contenido: comentario
            });
        }

        if (req.file) {
            pedidoData.archivo = {
                originalName: req.file.originalname,
                fileName: req.file.key.split('/').pop(),
                s3Key: req.file.key,
                url: `/api/usuario/files/${Buffer.from(req.file.key).toString('base64')}`,
                uploadDate: new Date()
            };
        }

        const pedido = new PedidoGarantia(pedidoData);
        await pedido.save();

        res.json({ msg: 'Pedido de garantía creado', pedido });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   POST /api/usuario/pedidos-garantia/:id/mensaje
// @desc    Add a message to a warranty claim (user reply)
// @access  Private (usuario_bienes)
router.post('/pedidos-garantia/:id/mensaje', auth, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id);
        if (!usuario || !hasRole(usuario.roles, 'usuario_bienes')) {
            return res.status(403).json({ msg: 'Acceso denegado' });
        }

        const { contenido } = req.body;
        if (!contenido) {
            return res.status(400).json({ msg: 'El contenido del mensaje es requerido' });
        }

        const pedido = await PedidoGarantia.findOne({ _id: req.params.id, usuario: req.usuario.id })
            .populate('fabricante', 'razonSocial usuarioApoderado');

        if (!pedido) {
            return res.status(404).json({ msg: 'Pedido no encontrado' });
        }

        if (pedido.estado === 'Cerrado') {
            return res.status(400).json({ msg: 'No se puede responder a un pedido cerrado' });
        }

        pedido.mensajes.push({
            autor: 'usuario',
            autorId: req.usuario.id,
            contenido
        });

        await pedido.save();

        // Send email notification to fabricante's apoderado
        const fabricante = await Fabricante.findById(pedido.fabricante._id).populate('usuarioApoderado', 'correoElectronico nombreCompleto');
        if (fabricante && fabricante.usuarioApoderado && fabricante.usuarioApoderado.correoElectronico) {
            await sendGarantiaUserReplyEmail(
                fabricante.usuarioApoderado.correoElectronico,
                fabricante.razonSocial,
                usuario.nombreCompleto,
                pedido._id.toString().slice(-6).toUpperCase(),
                contenido
            );
        }

        res.json({ msg: 'Mensaje agregado', pedido });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

module.exports = router;
