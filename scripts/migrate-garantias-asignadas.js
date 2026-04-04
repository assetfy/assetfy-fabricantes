/**
 * Script de migración: Crear GarantiaAsignada para items registrados existentes
 *
 * Busca todos los items de inventario registrados (registrado='Si') que tengan
 * un producto o pieza con garantía asignada, y crea un registro de GarantiaAsignada
 * para cada uno en estado 'Validada' (aprobación retroactiva).
 *
 * Es idempotente: no crea duplicados si ya existe una garantía para el inventario.
 *
 * Uso: node scripts/migrate-garantias-asignadas.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Inventario = require('../models/inventario.model');
const Producto = require('../models/producto.model');
const Pieza = require('../models/pieza.model');
const Garantia = require('../models/garantia.model');
const GarantiaAsignada = require('../models/garantiaAsignada.model');
const { calculateWarrantyExpiration } = require('../utils/warrantyUtils');

async function migrate() {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado.');

    // Buscar todos los inventarios registrados
    const inventarios = await Inventario.find({ registrado: 'Si' })
        .populate({
            path: 'producto',
            populate: [
                { path: 'garantia' },
                { path: 'fabricante', select: '_id' },
                { path: 'marca', select: '_id' }
            ]
        })
        .populate({
            path: 'pieza',
            populate: [
                { path: 'garantia' },
                { path: 'fabricante', select: '_id' },
                { path: 'marca', select: '_id' }
            ]
        });

    console.log(`Encontrados ${inventarios.length} items registrados.`);

    let created = 0;
    let skippedNoWarranty = 0;
    let skippedExists = 0;
    let errors = 0;

    for (const inv of inventarios) {
        const item = inv.producto || inv.pieza;
        const tipo = inv.producto ? 'Producto' : 'Pieza';

        if (!item || !item.garantia) {
            skippedNoWarranty++;
            continue;
        }

        // Verificar si ya existe
        const existing = await GarantiaAsignada.findOne({ inventario: inv._id });
        if (existing) {
            skippedExists++;
            continue;
        }

        const garantia = item.garantia;
        const fechaRegistro = inv.fechaRegistro || inv.fechaVenta || inv.createdAt;
        const fechaExpiracion = calculateWarrantyExpiration(
            fechaRegistro,
            garantia.duracionNumero,
            garantia.duracionUnidad
        );

        if (!fechaExpiracion) {
            console.error(`  Error calculando expiración para inventario ${inv.idInventario}`);
            errors++;
            continue;
        }

        try {
            const nueva = new GarantiaAsignada({
                inventario: inv._id,
                garantiaOrigen: garantia._id,
                clienteFinal: {
                    nombreCompleto: inv.comprador?.nombreCompleto || '',
                    correoElectronico: inv.comprador?.correoElectronico || ''
                },
                productoRepuesto: {
                    modelo: item.modelo || item.nombre || '',
                    tipo,
                    sku: item.idProducto || item.idPieza || ''
                },
                numeroSerie: inv.numeroSerie,
                fechaRegistro,
                canal: 'Web fabricante',
                estado: 'Validada', // Retroactivo: aprobadas automáticamente
                fechaExpiracion,
                datosGarantia: {
                    nombre: garantia.nombre,
                    duracionNumero: garantia.duracionNumero,
                    duracionUnidad: garantia.duracionUnidad,
                    fechaInicio: garantia.fechaInicio,
                    costoGarantia: garantia.costoGarantia,
                    tipoCobertura: garantia.tipoCobertura || [],
                    partesCubiertas: garantia.partesCubiertas,
                    exclusiones: garantia.exclusiones || [],
                    limitacionesGeograficas: garantia.limitacionesGeograficas,
                    serviciosIncluidos: garantia.serviciosIncluidos || [],
                    requiereRegistro: garantia.requiereRegistro,
                    comprobanteObligatorio: garantia.comprobanteObligatorio,
                    usoAutorizado: garantia.usoAutorizado || [],
                    instalacionCertificada: garantia.instalacionCertificada,
                    mantenimientoDocumentado: garantia.mantenimientoDocumentado,
                    canalesReclamo: garantia.canalesReclamo || [],
                    tiempoRespuesta: garantia.tiempoRespuesta,
                    opcionesLogistica: garantia.opcionesLogistica,
                    maximoReclamos: garantia.maximoReclamos,
                    responsabilidadesCliente: garantia.responsabilidadesCliente || [],
                    pagoTraslado: garantia.pagoTraslado
                },
                fabricante: item.fabricante?._id || item.fabricante,
                marca: item.marca?._id || item.marca,
                usuarioApoderado: inv.usuarioApoderado
            });

            await nueva.save();
            created++;

            if (created % 50 === 0) {
                console.log(`  Progreso: ${created} creadas...`);
            }
        } catch (err) {
            console.error(`  Error creando garantía para inventario ${inv.idInventario}:`, err.message);
            errors++;
        }
    }

    console.log('\n=== Resumen de migración ===');
    console.log(`Creadas: ${created}`);
    console.log(`Sin garantía (omitidas): ${skippedNoWarranty}`);
    console.log(`Ya existentes (omitidas): ${skippedExists}`);
    console.log(`Errores: ${errors}`);

    await mongoose.connection.close();
    console.log('Conexión cerrada. Migración completada.');
}

migrate().catch(err => {
    console.error('Error fatal en migración:', err);
    process.exit(1);
});
