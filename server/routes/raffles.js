const express = require('express');
const multer = require('multer');
const path = require('path');
const Raffle = require('../models/Raffle');
const Ticket = require('../models/Ticket');
const Buyer = require('../models/Buyer');
const auth = require('../middleware/auth');

const router = express.Router();

// ==================== CONFIGURAR MULTER (SUBIDA DE ARCHIVOS) ====================
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
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
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
        const { titulo, descripcion, premio, cantidadBoletos,