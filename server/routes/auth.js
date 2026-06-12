const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// ==================== REGISTRO ====================
router.post('/registro', async (req, res) => {
    try {
        const { nombre, telefono, email, password } = req.body;

        // Verificar si el usuario ya existe
        const usuarioExistente = await User.findOne({ email });
        if (usuarioExistente) {
            return res.status(400).json({
                exito: false,
                mensaje: 'El correo electrónico ya está registrado'
            });
        }

        // Crear nuevo usuario
        const nuevoUsuario = new User({
            nombre,
            telefono,
            email,
            password
        });

        await nuevoUsuario.save();

        // Generar token
        const token = jwt.sign(
            { userId: nuevoUsuario._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            exito: true,
            mensaje: 'Usuario registrado exitosamente',
            token,
            usuario: {
                id: nuevoUsuario._id,
                nombre: nuevoUsuario.nombre,
                telefono: nuevoUsuario.telefono,
                email: nuevoUsuario.email
            }
        });
    } catch (error) {
        res.status(500).json({
            exito: false,
            mensaje: 'Error al registrar usuario',
            error: error.message
        });
    }
});

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario
        const usuario = await User.findOne({ email });
        if (!usuario) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Credenciales inválidas'
            });
        }

        // Verificar password
        const passwordCorrecto = await usuario.compararPassword(password);
        if (!passwordCorrecto) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Credenciales inválidas'
            });
        }

        // Generar token
        const token = jwt.sign(
            { userId: usuario._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            exito: true,
            mensaje: 'Inicio de sesión exitoso',
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                telefono: usuario.telefono,
                email: usuario.email
            }
        });
    } catch (error) {
        res.status(500).json({
            exito: false,
            mensaje: 'Error al iniciar sesión',
            error: error.message
        });
    }
});

// ==================== OBTENER PERFIL ====================
router.get('/perfil', auth, async (req, res) => {
    try {
        const usuario = await User.findById(req.userId).select('-password');
        res.json({
            exito: true,
            usuario
        });
    } catch (error) {
        res.status(500).json({
            exito: false,
            mensaje: 'Error al obtener perfil',
            error: error.message
        });
    }
});

module.exports = router;