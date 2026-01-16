// routes/auth.js
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
    const { correoElectronico } = req.body;
    const contrasena = req.body.contrasena ?? req.body['contraseña'];

    if (!correoElectronico || !contrasena) {
        return res.status(400).json('Invalid credentials');
    }

    try {
        let usuario = await Usuario.findOne({ correoElectronico });

        if (!usuario) {
            return res.status(400).json('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(contrasena, usuario['contraseña']);

        if (!isMatch) {
            return res.status(400).json('Invalid credentials');
        }

        // If user has an activation token and is logging in for the first time, activate the account
        if (usuario.activationToken && usuario.estadoApoderado === 'Invitado') {
            usuario.estadoApoderado = 'Activo';
            usuario.activationToken = null;
            usuario.activationTokenExpires = null;
            await usuario.save();
        }

        // Check if apoderado has at least one enabled fabricante
        if (hasRole(usuario.roles, 'apoderado')) {
            const fabricantesHabilitados = await Fabricante.countDocuments({
                $or: [
                    { usuarioApoderado: usuario.id, estado: 'Habilitado' },
                    { administradores: usuario.id, estado: 'Habilitado' }
                ]
            });

            if (fabricantesHabilitados === 0) {
                return res.status(403).json('No tiene fabricantes habilitados');
            }
        }

        // usuario_bienes doesn't need fabricante validation

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
        res.status(500).send('Server error');
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
        
        // Return user email for login form to pre-fill
        res.json({ 
            msg: 'Token válido. Por favor, inicia sesión para activar tu cuenta.',
            correoElectronico: usuario.correoElectronico
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;