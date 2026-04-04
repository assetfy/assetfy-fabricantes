const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const { uploadFotoPerfil, deleteFromS3, checkS3Connection, s3 } = require('../middleware/upload');
const { sendInvitationEmail } = require('../utils/emailService');
const { hasRole, getPrimaryRole } = require('../utils/roleHelper');
const Usuario = require('../models/usuario.model');
const Fabricante = require('../models/fabricante.model');
const Marca = require('../models/marca.model');
const Producto = require('../models/producto.model');
const { geocodeAddress } = require('../utils/geocoding');

// @route   POST /api/admin/login
// @desc    Autenticar un usuario y obtener un token
// @access  Público
router.route('/login').post(async (req, res) => {
  const { correoElectronico } = req.body;
  const contrasena = req.body.contrasena ?? req.body['contraseña'];

  if (!correoElectronico || !contrasena) {
    return res.status(400).json('Credenciales inválidas.');
  }

  try {
    const usuario = await Usuario.findOne({ correoElectronico });
    if (!usuario) {
      return res.status(400).json('El correo electrónico no está registrado.');
    }

    const isMatch = await bcrypt.compare(contrasena, usuario['contraseña']);
    if (!isMatch) {
      return res.status(400).json('Contraseña incorrecta.');
    }

    const payload = {
      usuario: {
        id: usuario.id,
        roles: usuario.roles || [],
        permisosFabricantes: usuario.permisosFabricantes
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token, 
          roles: usuario.roles || [],
          // Send primary role for backward compatibility
          rol: getPrimaryRole(usuario.roles)
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// @route   GET /api/admin/perfil
// @desc    Obtener el perfil del usuario administrador
// @access  Privado (Admin)
router.get('/perfil', auth, async (req, res) => {
  try {
    // req.usuario.id es añadido por el middleware 'auth'
    const usuario = await Usuario.findById(req.usuario.id).select('-contraseña');
    
    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    // Verificar que el usuario sea admin
    if (!hasRole(usuario.roles, 'admin')) {
      return res.status(403).json({ msg: 'Acceso denegado' });
    }
    
    // Obtener los fabricantes donde el admin tiene permisos como administrador
    const fabricantes = await Fabricante.find({ 
      administradores: req.usuario.id 
    });
    
    res.json({ 
      nombreCompleto: usuario.nombreCompleto, 
      roles: usuario.roles || [],
      rol: getPrimaryRole(usuario.roles), // For backward compatibility
      imagenPerfil: usuario.imagenPerfil,
      fabricantes: fabricantes
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// @route   PUT /api/admin/perfil
// @desc    Actualizar el perfil del usuario administrador
// @access  Privado (Admin)
router.put('/perfil', auth, async (req, res) => {
  try {
    const { nombreCompleto, imagenPerfil } = req.body;
    
    // req.usuario.id es añadido por el middleware 'auth'
    const usuario = await Usuario.findById(req.usuario.id);
    
    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    // Verificar que el usuario sea admin
    if (!hasRole(usuario.roles, 'admin')) {
      return res.status(403).json({ msg: 'Acceso denegado' });
    }

    // Actualizar campos si se proporcionan
    if (nombreCompleto) usuario.nombreCompleto = nombreCompleto;
    if (imagenPerfil !== undefined) usuario.imagenPerfil = imagenPerfil;

    await usuario.save();
    
    res.json({ 
      nombreCompleto: usuario.nombreCompleto, 
      roles: usuario.roles || [],
      rol: getPrimaryRole(usuario.roles), // For backward compatibility
      imagenPerfil: usuario.imagenPerfil 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// @route   POST /api/admin/perfil/foto
// @desc    Subir foto de perfil para el usuario administrador
// @access  Privado (Admin)
router.post('/perfil/foto', auth, checkS3Connection, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id);

        if (!usuario) {
            return res.status(404).json('Usuario no encontrado.');
        }

        // Verificar que el usuario sea admin
        if (!hasRole(usuario.roles, 'admin')) {
            return res.status(403).json('Acceso denegado.');
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
                    url: `/api/admin/files/${Buffer.from(req.file.key).toString('base64')}`
                };

                await usuario.save();

                console.log(`✅ Admin profile photo updated successfully`);

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
        console.error('❌ Server error in admin profile photo upload:', err.message);
        res.status(500).json('Error del servidor');
    }
});

// @route   DELETE /api/admin/perfil/foto
// @desc    Eliminar foto de perfil del usuario administrador
// @access  Privado (Admin)
router.delete('/perfil/foto', auth, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id);

        if (!usuario) {
            return res.status(404).json('Usuario no encontrado.');
        }

        // Verificar que el usuario sea admin
        if (!hasRole(usuario.roles, 'admin')) {
            return res.status(403).json('Acceso denegado.');
        }

        // Delete from S3 if exists
        if (usuario.imagenPerfil && typeof usuario.imagenPerfil === 'object' && usuario.imagenPerfil.s3Key) {
            try {
                await deleteFromS3(usuario.imagenPerfil.s3Key);
            } catch (deleteErr) {
                console.error('Error deleting profile photo from S3:', deleteErr);
            }
        }

        // Clear the profile photo from the user
        usuario.imagenPerfil = null;
        await usuario.save();

        console.log('✅ Admin profile photo deleted successfully');

        res.json('Foto de perfil eliminada con éxito!');
    } catch (err) {
        console.error('❌ Server error in admin profile photo deletion:', err.message);
        res.status(500).json('Error del servidor');
    }
});

// @route   POST /api/admin/perfil/cambiar-contrasena
// @desc    Cambiar contraseña del usuario administrador
// @access  Privado (Admin)
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
    
    if (!hasRole(usuario.roles, 'admin')) {
      return res.status(403).json({ msg: 'Acceso denegado' });
    }
    
    const salt = await bcrypt.genSalt(10);
    usuario.contraseña = await bcrypt.hash(nuevaContraseña, salt);
    
    await usuario.save();
    
    res.json({ msg: 'Contraseña actualizada exitosamente' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// @route   GET /api/admin/usuarios
// @desc    Obtener todos los usuarios
// @access  Privado (Admin)
router.route('/usuarios').get(auth, async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

// @route   GET /api/admin/usuarios/apoderados
// @desc    Obtener usuarios para selector de apoderados (solo Invitado y Activo, con rol apoderado)
// @access  Privado (Admin)
router.route('/usuarios/apoderados').get(auth, async (req, res) => {
  try {
    const usuarios = await Usuario.find({ 
      estado: { $in: ['Invitado', 'Activo'] },
      roles: 'apoderado'
    });
    res.json(usuarios);
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

// @route   POST /api/admin/usuarios/add
// @desc    Crear un nuevo usuario
// @access  Privado (Admin)
router.route('/usuarios/add').post(auth, async (req, res) => {
  const { nombreCompleto, cuil, correoElectronico, contraseña, telefono, rol, roles, enviarInvitacion, permisosFabricantes } = req.body;
  
  // Support both old 'rol' (single) and new 'roles' (array) for backward compatibility
  let userRoles;
  if (roles && Array.isArray(roles) && roles.length > 0) {
    userRoles = roles;
  } else if (rol) {
    userRoles = [rol];
  } else {
    userRoles = ['apoderado'];
  }
  
  const estadoApoderado = 'Invitado';

  if (!nombreCompleto || !cuil || !correoElectronico || !contraseña) {
   return res.status(400).json({ msg: 'Faltan campos obligatorios.', fields: { nombreCompleto, cuil, correoElectronico, contraseña } });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const contraseñaEncriptada = await bcrypt.hash(contraseña, salt);

    // Generate activation token if sending invitation
    let activationToken = null;
    let activationTokenExpires = null;
    
    if (enviarInvitacion) {
      activationToken = crypto.randomBytes(32).toString('hex');
      activationTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    }

    const nuevoUsuario = new Usuario({
      nombreCompleto,
      cuil,
      correoElectronico,
      contraseña: contraseñaEncriptada,
      telefono: telefono || '',
      roles: userRoles,
      estadoApoderado,
      permisosFabricantes: permisosFabricantes || [],
      activationToken,
      activationTokenExpires
    });

    await nuevoUsuario.save();
    
    // Update Fabricante.administradores for each permisosFabricantes
    if (permisosFabricantes && permisosFabricantes.length > 0) {
      await Fabricante.updateMany(
        { _id: { $in: permisosFabricantes } },
        { $addToSet: { administradores: nuevoUsuario._id } }
      );
    }
    
    // Send invitation email if requested
    if (enviarInvitacion) {
      try {
        // Get fabricante names for the email
        let fabricantesInfo = [];
        if (permisosFabricantes && permisosFabricantes.length > 0) {
          const fabricantes = await Fabricante.find({ _id: { $in: permisosFabricantes } });
          fabricantesInfo = fabricantes.map(f => ({ nombre: f.razonSocial }));
        }
        
        const emailResult = await sendInvitationEmail(
          nombreCompleto,
          correoElectronico,
          contraseña,
          activationToken,
          fabricantesInfo,
          getPrimaryRole(userRoles)  // Pass the user role to determine which email template to use
        );
        
        if (emailResult.success) {
          res.status(201).json({ 
            msg: 'Usuario creado y correo de invitación enviado!',
            emailSent: true
          });
        } else {
          res.status(201).json({ 
            msg: 'Usuario creado, pero hubo un error al enviar el correo de invitación.',
            emailSent: false,
            emailError: emailResult.error
          });
        }
      } catch (emailErr) {
        console.error('Error sending invitation email:', emailErr);
        res.status(201).json({ 
          msg: 'Usuario creado, pero hubo un error al enviar el correo de invitación.',
          emailSent: false
        });
      }
    } else {
      res.status(201).json('Usuario creado!');
    }
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];
      return res.status(400).json(`El ${field} '${value}' ya está registrado.`);
    }
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// @route   GET /api/admin/fabricantes
// @desc    Obtener todos los fabricantes
// @access  Privado (Admin)
router.route('/fabricantes').get(auth, async (req, res) => {
  try {
    const fabricantes = await Fabricante.find()
      .populate('usuarioApoderado', 'nombreCompleto')
      .populate('administradores', 'nombreCompleto correoElectronico');
    res.json(fabricantes);
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

// @route   POST /api/admin/fabricantes/add
// @desc    Crear un nuevo fabricante
// @access  Privado (Admin)
router.route('/fabricantes/add').post(auth, async (req, res) => {
  const { razonSocial, cuit, usuarioApoderado, administradores, direccion } = req.body;

  if (!razonSocial || !cuit || !usuarioApoderado) {
    return res.status(400).json('Faltan campos obligatorios.');
  }

  try {
    let coordenadas = null;
    if (direccion) {
      coordenadas = await geocodeAddress(direccion);
    }

    const nuevoFabricante = new Fabricante({
      razonSocial,
      cuit,
      usuarioApoderado,
      administradores: administradores || [],
      direccion: direccion || '',
      coordenadas: coordenadas || { lat: null, lng: null },
    });

    await nuevoFabricante.save();
    res.status(201).json('Fabricante creado!');
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];
      return res.status(400).json(`El ${field} '${value}' ya está registrado.`);
    }
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// @route   PUT /api/admin/usuarios/:id
// @desc    Actualizar un usuario
// @access  Privado (Admin)
router.route('/usuarios/:id').put(auth, async (req, res) => {
  const { nombreCompleto, cuil, correoElectronico, telefono, estadoApoderado, rol, roles, estado, permisosFabricantes } = req.body;
  
  if (!nombreCompleto || !cuil || !correoElectronico) {
    return res.status(400).json({ msg: 'Faltan campos obligatorios.' });
  }

  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado.' });
    }

    usuario.nombreCompleto = nombreCompleto;
    usuario.cuil = cuil;
    usuario.correoElectronico = correoElectronico;
    usuario.telefono = telefono || '';
    if (estadoApoderado) {
      usuario.estadoApoderado = estadoApoderado;
    }
    // Support both old 'rol' (single) and new 'roles' (array)
    if (roles && Array.isArray(roles)) {
      usuario.roles = roles;
    } else if (rol) {
      usuario.roles = [rol];
    }
    if (estado) {
      usuario.estado = estado;
    }
    if (permisosFabricantes !== undefined) {
      usuario.permisosFabricantes = permisosFabricantes;
    }

    await usuario.save();
    res.json('Usuario actualizado!');
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];
      return res.status(400).json(`El ${field} '${value}' ya está registrado.`);
    }
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// @route   DELETE /api/admin/usuarios/:id
// @desc    Eliminar un usuario
// @access  Privado (Admin)
router.route('/usuarios/:id').delete(auth, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado.' });
    }

    // Check if there are fabricantes referencing this usuario as apoderado
    const fabricantes = await Fabricante.find({ usuarioApoderado: req.params.id });
    if (fabricantes.length > 0) {
      return res.status(400).json('No se puede eliminar por referencias');
    }

    // Check if there are fabricantes referencing this usuario as administrador
    const fabricantesAdmin = await Fabricante.find({ administradores: req.params.id });
    if (fabricantesAdmin.length > 0) {
      return res.status(400).json('No se puede eliminar por referencias');
    }

    await usuario.deleteOne();
    res.json('Usuario eliminado!');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// @route   PUT /api/admin/fabricantes/:id
// @desc    Actualizar un fabricante
// @access  Privado (Admin)
router.route('/fabricantes/:id').put(auth, async (req, res) => {
  const { razonSocial, cuit, usuarioApoderado, administradores, logo, estado, direccion } = req.body;

  if (!razonSocial || !cuit || !usuarioApoderado) {
    return res.status(400).json({ msg: 'Faltan campos obligatorios.' });
  }

  try {
    const fabricante = await Fabricante.findById(req.params.id);
    if (!fabricante) {
      return res.status(404).json({ msg: 'Fabricante no encontrado.' });
    }

    fabricante.razonSocial = razonSocial;
    fabricante.cuit = cuit;
    fabricante.usuarioApoderado = usuarioApoderado;
    fabricante.administradores = administradores || [];
    fabricante.logo = logo || '';
    if (estado) {
      fabricante.estado = estado;
    }

    // Update address and re-geocode if changed
    if (direccion !== undefined && direccion !== fabricante.direccion) {
      fabricante.direccion = direccion;
      if (direccion) {
        const coordenadas = await geocodeAddress(direccion);
        fabricante.coordenadas = coordenadas || { lat: null, lng: null };
      } else {
        fabricante.coordenadas = { lat: null, lng: null };
      }
    }

    await fabricante.save();
    res.json('Fabricante actualizado!');
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];
      return res.status(400).json(`El ${field} '${value}' ya está registrado.`);
    }
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// @route   DELETE /api/admin/fabricantes/:id
// @desc    Eliminar un fabricante
// @access  Privado (Admin)
router.route('/fabricantes/:id').delete(auth, async (req, res) => {
  try {
    const fabricante = await Fabricante.findById(req.params.id);
    if (!fabricante) {
      return res.status(404).json({ msg: 'Fabricante no encontrado.' });
    }

    // Check if there are marcas referencing this fabricante
    const marcas = await Marca.find({ fabricante: req.params.id });
    if (marcas.length > 0) {
      return res.status(400).json('No se puede eliminar por referencias');
    }

    // Check if there are productos referencing this fabricante
    const productos = await Producto.find({ fabricante: req.params.id });
    if (productos.length > 0) {
      return res.status(400).json('No se puede eliminar por referencias');
    }

    await fabricante.deleteOne();
    res.json('Fabricante eliminado!');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// @route   POST /api/admin/fabricantes/migrate-slugs
// @desc    Generate slugs for fabricantes that do not have one (retroactive migration)
// @access  Privado (Admin)
router.post('/fabricantes/migrate-slugs', auth, async (req, res) => {
  try {
    const fabricantes = await Fabricante.find({ $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }] });
    let updated = 0;
    for (const fabricante of fabricantes) {
      // Trigger pre-save hook by resetting slug to undefined
      fabricante.slug = undefined;
      await fabricante.save();
      updated++;
    }
    res.json({ message: `Slugs generados para ${updated} fabricante(s).`, updated });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});


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

// @route   GET /api/admin/files/:s3Key
// @desc    Serve files from S3 through backend proxy
// @access  Privado (Admin) - accepts token from header or query
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
                    res.status(500).json('Error al descargar el archivo');
                }
            });
            
        } catch (headError) {
            if (headError.code === 'NotFound') {
                console.error('❌ File not found in S3:', s3Key);
                return res.status(404).json('Archivo no encontrado');
            } else {
                console.error('❌ Error accessing S3:', headError);
                return res.status(500).json('Error al acceder al archivo');
            }
        }
        
    } catch (err) {
        console.error('❌ Server error in file serving:', err.message);
        res.status(500).json('Error del servidor');
    }
});

module.exports = router;