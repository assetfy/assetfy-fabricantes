// routes/public.js
const express = require('express');
const router = express.Router();
const Inventario = require('../models/inventario.model');
const Usuario = require('../models/usuario.model');
const Bien = require('../models/bien.model');
const Fabricante = require('../models/fabricante.model');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendInvitationEmail } = require('../utils/emailService');
const { s3 } = require('../middleware/upload');

// @route   GET /api/public/fabricante/:slug
// @desc    Get fabricante branding info for the branded registration portal
// @access  Public
router.get('/fabricante/:slug', async (req, res) => {
    try {
        const fabricante = await Fabricante.findOne({ slug: req.params.slug.toLowerCase() })
            .select('razonSocial slug portalLogo portalColor estado');

        if (!fabricante) {
            return res.status(404).json({ success: false, message: 'Portal no encontrado.' });
        }

        if (fabricante.estado === 'Deshabilitado') {
            return res.status(403).json({ success: false, message: 'Este portal está deshabilitado.' });
        }

        return res.json({
            success: true,
            fabricante: {
                razonSocial: fabricante.razonSocial,
                slug: fabricante.slug,
                portalLogo: fabricante.portalLogo || null,
                portalColor: fabricante.portalColor || '#1a73e8'
            }
        });
    } catch (err) {
        console.error('Error al obtener datos del fabricante:', err);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

// @route   POST /api/public/registro
// @desc    Register a product with user information
// @access  Public
router.post('/registro', async (req, res) => {
    const { idInventario, nombreCompleto, correoElectronico, cuil, telefono } = req.body;

    // Validate required fields
    if (!idInventario || !nombreCompleto || !correoElectronico || !telefono) {
        return res.status(400).json({ 
            success: false,
            message: 'Todos los campos son obligatorios: ID de inventario, nombre completo, correo electrónico y teléfono.' 
        });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correoElectronico)) {
        return res.status(400).json({ 
            success: false,
            message: 'El formato del correo electrónico no es válido.' 
        });
    }

    try {
        // Find the product by idInventario
        const inventario = await Inventario.findOne({ idInventario: idInventario.trim() });

        if (!inventario) {
            return res.status(404).json({ 
                success: false,
                message: 'El producto no existe. Por favor, revise el número de inventario o contacte al fabricante.' 
            });
        }

        // Check if the product is already registered
        if (inventario.registrado === 'Si') {
            return res.status(400).json({ 
                success: false,
                message: 'Este producto ya está registrado a otro usuario.' 
            });
        }

        // Update the inventory item with user data, mark as registered and set as sold
        inventario.comprador.nombreCompleto = nombreCompleto.trim();
        inventario.comprador.correoElectronico = correoElectronico.trim().toLowerCase();
        inventario.comprador.telefono = telefono.trim();
        if (cuil) {
            inventario.comprador.cuil = cuil.trim();
        }
        inventario.registrado = 'Si';
        inventario.estado = 'vendido';
        inventario.fechaRegistro = new Date(); // Set registration date
        // fechaVenta will be set automatically by the pre-save middleware

        await inventario.save();

        return res.status(200).json({ 
            success: true,
            message: 'Producto registrado exitosamente. ¡Gracias por registrar su producto!',
            data: {
                idInventario: inventario.idInventario,
                numeroSerie: inventario.numeroSerie,
                fechaRegistro: new Date().toISOString()
            }
        });

    } catch (err) {
        console.error('Error al registrar producto:', err);
        return res.status(500).json({ 
            success: false,
            message: 'Error interno del servidor. Por favor, inténtelo de nuevo más tarde.' 
        });
    }
});

// @route   POST /api/public/registro-con-usuario
// @desc    Register a product and create a usuario_bienes user
// @access  Public
router.post('/registro-con-usuario', async (req, res) => {
    const { idInventario, nombreCompleto, correoElectronico, cuil, telefono } = req.body;

    // Validate required fields (CUIL is required for user creation)
    if (!idInventario || !nombreCompleto || !correoElectronico || !cuil || !telefono) {
        return res.status(400).json({ 
            success: false,
            message: 'Todos los campos son obligatorios: ID de inventario, nombre completo, correo electrónico, CUIL y teléfono.' 
        });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correoElectronico)) {
        return res.status(400).json({ 
            success: false,
            message: 'El formato del correo electrónico no es válido.' 
        });
    }

    // Validate CUIL format (basic validation - should be 11 digits)
    const cuilClean = cuil.replace(/[-\s]/g, '');
    if (!/^\d{11}$/.test(cuilClean)) {
        return res.status(400).json({ 
            success: false,
            message: 'El CUIL debe contener 11 dígitos.' 
        });
    }

    try {
        // Find the product by idInventario
        const inventario = await Inventario.findOne({ idInventario: idInventario.trim() })
            .populate({
                path: 'producto',
                populate: [
                    { path: 'fabricante' },
                    { path: 'marca' },
                    { path: 'garantia' }
                ]
            });

        if (!inventario) {
            return res.status(404).json({ 
                success: false,
                message: 'El producto no existe. Por favor, revise el número de inventario o contacte al fabricante.' 
            });
        }

        // Check if the product is already registered
        if (inventario.registrado === 'Si') {
            return res.status(400).json({ 
                success: false,
                message: 'Este producto ya está registrado a otro usuario.' 
            });
        }

        // Check if user already exists with this email or CUIL
        const existingUser = await Usuario.findOne({
            $or: [
                { correoElectronico: correoElectronico.trim().toLowerCase() },
                { cuil: cuilClean }
            ]
        });

        if (existingUser) {
            // User exists, check if they have usuario_bienes role
            if (!existingUser.roles.includes('usuario_bienes')) {
                // Add usuario_bienes role to existing user
                existingUser.roles.push('usuario_bienes');
                await existingUser.save();
            }

            // Create the bien for existing user
            const nombreBien = inventario.producto.modelo || 'Mi Producto';
            
            const nuevoBien = new Bien({
                nombre: nombreBien,
                tipo: 'registrado',
                usuario: existingUser._id,
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
                fechaRegistro: new Date()
            });

            await nuevoBien.save();

            // Update inventory
            inventario.comprador.nombreCompleto = nombreCompleto.trim();
            inventario.comprador.correoElectronico = correoElectronico.trim().toLowerCase();
            inventario.comprador.telefono = telefono.trim();
            inventario.comprador.cuil = cuilClean;
            inventario.registrado = 'Si';
            inventario.estado = 'vendido';
            inventario.fechaRegistro = new Date();

            await inventario.save();

            return res.status(200).json({ 
                success: true,
                message: 'Producto registrado exitosamente. El usuario ya existe y el bien ha sido agregado a su cuenta.',
                data: {
                    idInventario: inventario.idInventario,
                    numeroSerie: inventario.numeroSerie,
                    fechaRegistro: new Date().toISOString(),
                    userExists: true
                }
            });
        }

        // User doesn't exist, create new usuario_bienes user
        
        // Generate temporary password
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPassword, salt);

        // Generate activation token
        const activationToken = crypto.randomBytes(32).toString('hex');
        const activationTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Create new user
        const nuevoUsuario = new Usuario({
            nombreCompleto: nombreCompleto.trim(),
            cuil: cuilClean,
            correoElectronico: correoElectronico.trim().toLowerCase(),
            contraseña: hashedPassword,
            telefono: telefono.trim(),
            roles: ['usuario_bienes'],
            estadoApoderado: 'Invitado',
            estado: 'Activo',
            activationToken,
            activationTokenExpires,
            permisosFabricantes: []
        });

        await nuevoUsuario.save();

        // Create the bien for the new user
        const nombreBien = inventario.producto.modelo || 'Mi Producto';
        
        const nuevoBien = new Bien({
            nombre: nombreBien,
            tipo: 'registrado',
            usuario: nuevoUsuario._id,
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
            fechaRegistro: new Date()
        });

        await nuevoBien.save();

        // Update inventory with user data
        inventario.comprador.nombreCompleto = nombreCompleto.trim();
        inventario.comprador.correoElectronico = correoElectronico.trim().toLowerCase();
        inventario.comprador.telefono = telefono.trim();
        inventario.comprador.cuil = cuilClean;
        inventario.registrado = 'Si';
        inventario.estado = 'vendido';
        inventario.fechaRegistro = new Date();

        await inventario.save();

        // Send invitation email
        let emailSent = false;
        try {
            const emailResult = await sendInvitationEmail(
                nombreCompleto.trim(),
                correoElectronico.trim().toLowerCase(),
                tempPassword,
                activationToken,
                [],
                'usuario_bienes'
            );
            emailSent = emailResult.success;
        } catch (emailErr) {
            console.error('Error sending invitation email:', emailErr);
        }

        return res.status(200).json({ 
            success: true,
            message: emailSent 
                ? 'Producto registrado exitosamente. Se ha creado su usuario de bienes y le hemos enviado un correo con las instrucciones de activación.'
                : 'Producto registrado exitosamente. Se ha creado su usuario de bienes, pero hubo un problema al enviar el correo. Por favor, contacte al administrador.',
            data: {
                idInventario: inventario.idInventario,
                numeroSerie: inventario.numeroSerie,
                fechaRegistro: new Date().toISOString(),
                emailSent
            }
        });

    } catch (err) {
        console.error('Error al registrar producto con usuario:', err);
        
        // Check for duplicate key errors
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(400).json({ 
                success: false,
                message: `El ${field === 'correoElectronico' ? 'correo electrónico' : 'CUIL'} ya está registrado en el sistema.`
            });
        }
        
        return res.status(500).json({ 
            success: false,
            message: 'Error interno del servidor. Por favor, inténtelo de nuevo más tarde.' 
        });
    }
});

// @route   GET /api/public/logo/:s3Key
// @desc    Serve portal logo files from S3 without authentication (restricted to logoFabricante/ prefix)
// @access  Public
router.get('/logo/:s3Key', async (req, res) => {
    try {
        let s3Key;
        try {
            s3Key = Buffer.from(req.params.s3Key, 'base64').toString('utf8');
        } catch (decodeError) {
            return res.status(400).json({ message: 'Clave de archivo inválida' });
        }

        // Security: only allow serving files from the logoFabricante/ prefix
        if (!s3Key || s3Key.includes('..') || s3Key.startsWith('/') || !s3Key.startsWith('logoFabricante/')) {
            return res.status(403).json({ message: 'Acceso denegado' });
        }

        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: s3Key
        };

        const headData = await s3.headObject(params).promise();

        res.set({
            'Content-Type': headData.ContentType || 'image/png',
            'Content-Length': headData.ContentLength,
            'Cache-Control': 'public, max-age=86400',
            'ETag': headData.ETag
        });

        s3.getObject(params).createReadStream()
            .on('error', (streamErr) => {
                console.error('S3 stream error:', streamErr);
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Error al servir el logo' });
                }
            })
            .pipe(res);
    } catch (err) {
        if (err.code === 'NoSuchKey' || err.code === 'NotFound') {
            return res.status(404).json({ message: 'Logo no encontrado' });
        }
        console.error('Error serving public logo:', err.message);
        res.status(500).json({ message: 'Error al servir el logo' });
    }
});

module.exports = router;