const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const raffleRoutes = require('./routes/raffles');
const publicRoutes = require('./routes/public');

const app = express();

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// ==================== RUTAS API ====================
app.use('/api/auth', authRoutes);
app.use('/api/raffles', raffleRoutes);
app.use('/api/public', publicRoutes);

// ==================== RUTAS HTML ====================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/registro', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/register.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/crear-rifa', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/crear-rifa.html'));
});

app.get('/administrar/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/administrar.html'));
});

app.get('/rifa/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/rifa.html'));
});

// ==================== MANEJO DE ERRORES ====================
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// ==================== INICIAR SERVIDOR ====================
const PORT = process.env.PORT || 10000;

const startServer = async () => {
    try {
        console.log('🔄 Conectando a MongoDB...');
        console.log('📦 MONGODB_URI:', process.env.MONGODB_URI ? 'Configurada' : 'NO CONFIGURADA');
        
        await connectDB();
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ Servidor corriendo en puerto ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
        });
    } catch (error) {
        console.error('❌ Error fatal al iniciar:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Excepción no capturada:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
    process.exit(1);
});

startServer();
