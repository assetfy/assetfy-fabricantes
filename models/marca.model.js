const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const marcaSchema = new Schema({
    nombre: {
        type: String,
        required: true,
        trim: true,
        minlength: 3
    },
    fabricante: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Fabricante',
        required: true
    },
    usuarioApoderado: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    estado: {
        type: String,
        enum: ['Activa', 'Desactivada'],
        default: 'Activa'
    },
    logo: {
        url: { type: String },
        key: { type: String },
        originalName: { type: String }
    }
}, {
    timestamps: true,
});

// Create compound unique index for nombre + fabricante combination
marcaSchema.index({ nombre: 1, fabricante: 1 }, { unique: true });

const Marca = mongoose.model('Marca', marcaSchema);

module.exports = Marca;