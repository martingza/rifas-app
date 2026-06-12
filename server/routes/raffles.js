const express = require('express');
const multer = require('multer');
const path = require('path');
const Raffle = require('../models/Raffle');
const Ticket = require('../models/Ticket');
const Buyer = require('../models/Buyer');
const auth = require('../middleware/auth');

const router = express.Router();

// ==================== CONFIGURAR MULTER ====================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes'));
        }
    }
});

// ==================== CREAR RIFA ====================
router.post('/crear', auth, upload.array('fotos', 5), async (req, res) => {
    try {
        const { titulo, descripcion, premio, cantidadBoletos, precioBoleto } = req.body;
        
        const fotos = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

        const nuevaRifa = new Raffle({
            titulo,
            descripcion,
            premio,
            cantidadBoletos: parseInt(cantidadBoletos),
            precioBoleto: parseFloat(precioBoleto),
            fotos,
            creadoPor: req.userId
        });

        await nuevaRifa.save();

        const boletos = [];
        for (let i = 1; i <= cantidadBoletos; i++) {
            boletos.push({
                rifa: nuevaRifa._id,
                numero: i,
                estado: 'disponible'
            });
        }

        await Ticket.insertMany(boletos);

        res.status(201).json({
            exito: true,
            mensaje: 'Rifa creada exitosamente',
            rifa: nuevaRifa
        });
    } catch (error) {
        res.status(500).json({
            exito: false,
            mensaje: 'Error al crear rifa',
            error: error.message
        });
    }
});

// ==================== OBTENER MIS RIFAS ====================
router.get('/mis-rifas', auth, async (req, res) => {
    try {
        const rifas = await Raffle.find({ creadoPor: req.userId })
            .sort({ fechaCreacion: -1 });
        
        const rifasConInfo = await Promise.all(rifas.map(async (rifa) => {
            const boletosVendidos = await Ticket.countDocuments({
                rifa: rifa._id,
                estado: { $in: ['reservado', 'pagado'] }
            });
            const boletosPagados = await Ticket.countDocuments({
                rifa: rifa._id,
                estado: 'pagado'
            });
            
            return {
                ...rifa.toObject(),
                boletosVendidos,
                boletosPagados,
                recaudado: boletosPagados * rifa.precioBoleto
            };
        }));

        res.json({
            exito: true,
            rifas: rifasConInfo
        });
    } catch (error) {
        res.status(500).json({
            exito: false,
            mensaje: 'Error al obtener rifas',
            error: error.message
        });
    }
});

// ==================== OBTENER UNA RIFA ====================
router.get('/:id', auth, async (req, res) => {
    try {
        const rifa = await Raffle.findById(req.params.id);
        
        if (!rifa) {
            return res.status(404).json({
                exito: false,
                mensaje: 'Rifa no encontrada'
            });
        }

        if (rifa.creadoPor.toString() !== req.userId) {
            return res.status(403).json({
                exito: false,
                mensaje: 'No tienes permiso para ver esta rifa'
            });
        }

        const boletos = await Ticket.find({ rifa: rifa._id })
            .populate('comprador', 'nombre telefono')
            .sort({ numero: 1 });

        res.json({
            exito: true,
            rifa,
            boletos
        });
    } catch (error) {
        res.status(500).json({
            exito: false,
            mensaje: 'Error al obtener rifa',
            error: error.message
        });
    }
});

// ==================== VALIDAR PAGO ====================
router.put('/validar-pago/:boletoId', auth, async
