const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    rifa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Raffle',
        required: true
    },
    numero: {
        type: Number,
        required: true
    },
    comprador: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Buyer'
    },
    estado: {
        type: String,
        enum: ['disponible', 'reservado', 'pagado'],
        default: 'disponible'
    },
    comprobantePago: {
        type: String
    },
    fechaReserva: {
        type: Date
    },
    fechaPago: {
        type: Date
    }
});

// Índice compuesto para evitar duplicados
ticketSchema.index({ rifa: 1, numero: 1 }, { unique: true });

module.exports = mongoose.model('Ticket', ticketSchema);
