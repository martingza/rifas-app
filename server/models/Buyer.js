const mongoose = require('mongoose');

const buyerSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true
    },
    telefono: {
        type: String,
        required: [true, 'El teléfono es obligatorio'],
        trim: true
    },
    rifa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Raffle',
        required: true
    },
    boletos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    }],
    fechaRegistro: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Buyer', buyerSchema);