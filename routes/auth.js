const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario.model');
const Fabricante = require('../models/fabricante.model');
const { hasRole, getPrimaryRole } = require('../utils/roleHelper');

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', async (req, res) => {
    // Soporta campos alternativos para mayor robustez
    const correoElectronico = req.body.correoElectronico ?? req.body.usuario ?? req.body.email;
    const contrasena = req.body.contrasena ?? req.body['contraseña'] ?? req.body.password;

    if (!correoElectronico || !contrasena) {
        return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    try {
        let usuario = await Usuario.findOne({ correoElectronico });

        if (!usuario) {
            return res.status(400).json({ error: 'Credenciales inválidas' });
        }

        const isMatch = await bcrypt.compare(contrasena, usuario['contraseña']);

        if (!isMatch) {
            return res.status(400).json({ error: 'Credenciales inválidas' });
        }

        // Activación automática si corresponde
        if (usuario.activationToken && usuario.estadoApoderado === 'Invitado') {
            usuario.estadoApoderado = 'Activo';
            usuario.activationToken = null;
            usuario.activationTokenExpires = null;
            await usuario.save();
        }

        // Chequeo de fabricantes habilitados para apoderado
        if (hasRole(usuario.roles, 'apoderado')) {
            const fabricantesHabilitados = await Fabricante.countDocuments({
                $or: [
                    { usuarioApoderado: usuario.id, estado: 'Habilitado' },
                    { administradores: usuario.id, estado: 'Habilitado' }
                ]
            });

            if (fabricantesHabilitados === 0) {
                return res.status(403).json({ error: 'No tiene fabricantes habilitados' });
            }
        }

        const payload = {
            usuario: {
                id: usuario.id,
                roles: usuario.roles || []
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Error al generar el token' });
                }
                res.json({ 
                    token, 
                    roles: usuario.roles || [],
                    rol: getPrimaryRole(usuario.roles)
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// @route   GET /api/auth/activate/:token
// @desc    Activate user account via token
// @access  Public
router.get('/activate/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        const usuario = await Usuario.findOne({ 
            activationToken: token,
            activationTokenExpires: { $gt: Date.now() }
        });
        
        if (!usuario) {
            return res.status(400).json({ msg: 'Token de activación inválido o expirado.' });
        }
        
        res.json({ 
            msg: 'Token válido. Por favor, inicia sesión para activar tu cuenta.',
            correoElectronico: usuario.correoElectronico
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

module.exports = router;