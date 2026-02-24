// models/pedidoGarantia.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mensajeSchema = new Schema({
    autor: {
        type: String,
        enum: ['usuario', 'fabricante'],
        required: true
    },
    autorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    contenido: {
        type: String,
        required: true,
        trim: true
    },
    fecha: {
        type: Date,
        default: Date.now
    }
});

const pedidoGarantiaSchema = new Schema({
    bien: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bien',
        required: true
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    fabricante: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Fabricante',
        required: true
    },
    descripcion: {
        type: String,
        required: true,
        trim: true
    },
    estado: {
        type: String,
        enum: ['Nuevo', 'En Análisis', 'Cerrado'],
        default: 'Nuevo'
    },
    mensajes: [mensajeSchema],
    archivo: {
        originalName: String,
        fileName: String,
        s3Key: String,
        url: String,
        uploadDate: {
            type: Date,
            default: Date.now
        }
    }
}, {
    timestamps: true
});

const PedidoGarantia = mongoose.model('PedidoGarantia', pedidoGarantiaSchema);

module.exports = PedidoGarantia;
