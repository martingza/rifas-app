const mongoose = require('mongoose');

const raffleSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: [true, 'El título es obligatorio'],
        trim: true
    },
    descripcion: {
        type: String,
        trim: true
    },
    premio: {
        type: String,
        required: [true, 'El premio es obligatorio']
    },
    cantidadBoletos: {
        type: Number,
        required: [true, 'La cantidad de boletos es obligatoria'],
        min: [1, 'Debe haber al menos 1 boleto']
    },
    precioBoleto: {
        type: Number,
        required: [true, 'El precio del boleto es obligatorio'],
        min: [1, 'El precio debe ser mayor a 0']
    },
    fotos: [{
        type: String // URLs de las imágenes
    }],
    creadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    estado: {
        type: String,
        enum: ['activa', 'sorteada', 'cancelada'],
        default: 'activa'
    },
    numeroLoteria: {
        type: String // Número ganador de la lotería nacional
    },
    ganador: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Buyer'
    },
    fechaSorteo: {
        type: Date
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Raffle', raffleSchema);