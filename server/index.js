// ==================== DEBUG COMPLETO ====================
console.log('========================================');
console.log('🚀 INICIANDO SERVIDOR RIFAS APP');
console.log('========================================');
console.log('Node version:', process.version);
console.log('Directorio actual:', __dirname);
console.log('Variables de entorno:');
console.log('  - PORT:', process.env.PORT || 'NO DEFINIDO');
console.log('  - MONGODB_URI:', process.env.MONGODB_URI ? 'CONFIGURADA' : 'NO DEFINIDA');
console.log('  - JWT_SECRET:', process.env.JWT_SECRET ? 'CONFIGURADO' : 'NO DEFINIDO');
console.log('========================================');

// ==================== CARGAR MÓDULOS ====================
let express, cors, mongoose, path;

try {
    express = require('express');
    console.log('✅ Express cargado');
} catch (e) {
    console.error('❌ Error cargando Express:', e.message);
}

try {
    cors = require('cors');
    console.log('✅ CORS cargado');
} catch (e) {
    console.error('❌ Error cargando CORS:', e.message);
}

try {
    mongoose = require('mongoose');
    console.log('✅ Mongoose cargado');
} catch (e) {
    console.error('❌ Error cargando Mongoose:', e.message);
}

try {
    path = require('path');
    console.log('✅ Path cargado');
} catch (e) {
    console.error('❌ Error cargando Path:', e.message);
}

// ==================== VERIFICAR ARCHIVOS ====================
const fs = require('fs');

console.log('\n📁 Verificando estructura de archivos:');

const archivosRequeridos = [
    'server/config/db.js',
    'server/models/User.js',
    'server/models/Raffle.js',
    'server/models/Ticket.js',
    'server/models/Buyer.js',
    'server/routes/auth.js',
    'server/routes/raffles.js',
    'server/routes/public.js',
    'server/middleware/auth.js',
    'public/index.html'
];

const raiz = path ? path.join(__dirname, '..') : '..';

archivosRequeridos.forEach(archivo => {
    const rutaCompleta = path ? path.join(raiz, archivo) : archivo;
    try {
        if (fs.existsSync(rutaCompleta)) {
            console.log(`  ✅ ${archivo}`);
        } else {
            console.log(`  ❌ ${archivo} - NO ENCONTRADO`);
        }
    } catch (e) {
        console.log(`  ❌ ${archivo} - Error: ${e.message}`);
    }
});

// ==================== CREAR APP EXPRESS ====================
console.log('\n🔄 Creando aplicación Express...');

const app = express();

// Middleware básico
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// ==================== RUTA DE TEST ====================
app.get('/api/test', (req, res) => {
    res.json({
        exito: true,
        mensaje: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
        env: {
            PORT: process.env.PORT || 'NO DEFINIDO',
            MONGODB_URI: process.env.MONGODB_URI ? 'CONFIGURADA' : 'NO DEFINIDA',
            JWT_SECRET: process.env.JWT_SECRET ? 'CONFIGURADO' : 'NO DEFINIDO'
        }
    });
});

// ==================== CARGAR RUTAS ====================
console.log('\n🔄 Cargando rutas...');

try {
    const authRoutes = require('./routes/auth');
    app.use('/api/auth', authRoutes);
    console.log('✅ Rutas de auth cargadas');
} catch (e) {
    console.error('❌ Error cargando auth routes:', e.message);
    console.error(e.stack);
}

try {
    const raffleRoutes = require('./routes/raffles');
    app.use('/api/raffles', raffleRoutes);
    console.log('✅ Rutas de raffles cargadas');
} catch (e) {
    console.error('❌ Error cargando raffle routes:', e.message);
    console.error(e.stack);
}

try {
    const publicRoutes = require('./routes/public');
    app.use('/api/public', publicRoutes);
    console.log('✅ Rutas públicas cargadas');
} catch (e) {
    console.error('❌ Error cargando public routes:', e.message);
    console.error(e.stack);
}

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

// ==================== CONECTAR MONGODB ====================
console.log('\n🔄 Conectando a MongoDB...');

if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => {
            console.log('✅ MongoDB conectado exitosamente');
            iniciarServidor();
        })
        .catch((err) => {
            console.error('❌ Error conectando MongoDB:', err.message);
            console.error('Detalles:', err);
            console.log('⚠️ Iniciando servidor sin MongoDB...');
            iniciarServidor();
        });
} else {
    console.warn('⚠️ MONGODB_URI no configurada');
    console.log('⚠️ Iniciando servidor sin MongoDB...');
    iniciarServidor();
}

// ==================== INICIAR SERVIDOR ====================
function iniciarServidor() {
    const PORT = process.env.PORT || 10000;
    
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log('\n========================================');
        console.log('✅ SERVIDOR CORRIENDO EXITOSAMENTE');
        console.log(`🌐 Puerto: ${PORT}`);
        console.log(`📊 Entorno: ${process.env.NODE_ENV || 'production'}`);
        console.log('========================================\n');
    });
    
    server.on('error', (error) => {
        console.error('❌ Error del servidor:', error);
    });
}

// ==================== MANEJO DE ERRORES ====================
process.on('uncaughtException', (error) => {
    console.error('\n❌ EXCEPCIÓN NO CAPTURADA:');
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('\n❌ PROMESA RECHAZADA:');
    console.error('Razón:', reason);
});

console.log('\n✅ Script de inicio completado. Esperando conexiones...\n');
