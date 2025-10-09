// models/pieza.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Función simple para generar un ID alfanumérico
const generateRandomId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const piezaSchema = new Schema({
    idPieza: {
        type: String,
        unique: true,
        required: true
    },
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    imagen: {
        originalName: String,
        fileName: String,
        s3Key: String,
        url: String,
        uploadDate: {
            type: Date,
            default: Date.now
        }
    },
    productos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producto'
    }],
    fabricante: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Fabricante',
        required: false
    },
    marca: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Marca',
        required: false
    },
    usuarioApoderado: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    atributos: [{
        nombre: {
            type: String,
            required: true,
            trim: true
        },
        tipo: {
            type: String,
            enum: ['lista', 'predefinido', 'input'],
            required: true
        },
        valores: [{
            type: String,
            trim: true
        }],
        valor: {
            type: String,
            trim: true
        }
    }],
    garantia: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Garantia',
        default: null
    }
}, {
    timestamps: true
});

const Pieza = mongoose.model('Pieza', piezaSchema);

module.exports = Pieza;
