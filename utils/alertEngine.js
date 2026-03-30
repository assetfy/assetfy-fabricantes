// utils/alertEngine.js

const Notificacion = require('../models/notificacion.model');
const Inventario = require('../models/inventario.model');
const PedidoGarantia = require('../models/pedidoGarantia.model');
const SolicitudRepresentacion = require('../models/solicitudRepresentacion.model');
const Fabricante = require('../models/fabricante.model');

// Map umbral setting to days
const UMBRAL_DIAS = {
    '2_semanas': 14,
    '3_semanas': 21,
    '1_mes': 30,
    '2_meses': 60,
    '3_meses': 90
};

// Calculate warranty expiration date
const calculateWarrantyExpiration = (fechaVenta, plazoNumero, plazoUnidad) => {
    if (!fechaVenta || !plazoNumero || !plazoUnidad) return null;
    const fecha = new Date(fechaVenta);
    switch (plazoUnidad) {
        case 'dias':
            fecha.setDate(fecha.getDate() + plazoNumero);
            break;
        case 'meses':
            fecha.setMonth(fecha.getMonth() + plazoNumero);
            break;
        case 'años':
            fecha.setFullYear(fecha.getFullYear() + plazoNumero);
            break;
        default:
            return null;
    }
    return fecha;
};

/**
 * Generate notification when a product is registered
 */
const generarAlertaProductoRegistrado = async (inventario, fabricanteId) => {
    try {
        const notificacion = new Notificacion({
            fabricante: fabricanteId,
            tipo: 'producto_registrado',
            titulo: 'Nuevo producto registrado',
            mensaje: `${inventario.comprador.nombreCompleto} registró el producto ${inventario.idInventario} (S/N: ${inventario.numeroSerie})`,
            datos: {
                idInventario: inventario.idInventario,
                numeroSerie: inventario.numeroSerie,
                cliente: {
                    nombre: inventario.comprador.nombreCompleto,
                    correo: inventario.comprador.correoElectronico,
                    telefono: inventario.comprador.telefono,
                    direccion: inventario.comprador.direccion,
                    provincia: inventario.comprador.provincia
                }
            },
            referencia: {
                modelo: 'Inventario',
                id: inventario._id
            }
        });
        await notificacion.save();
        return notificacion;
    } catch (err) {
        console.error('Error al generar alerta de producto registrado:', err);
    }
};

/**
 * Generate notification when a representation request is created
 */
const generarAlertaSolicitudRepresentacion = async (solicitud, fabricanteId) => {
    try {
        const notificacion = new Notificacion({
            fabricante: fabricanteId,
            tipo: 'solicitud_representacion',
            titulo: 'Nueva solicitud de representación',
            mensaje: `${solicitud.razonSocial} (${solicitud.nombre}) ha solicitado ser representante`,
            datos: {
                razonSocial: solicitud.razonSocial,
                nombre: solicitud.nombre,
                cuit: solicitud.cuit,
                correo: solicitud.correo,
                telefono: solicitud.telefono
            },
            referencia: {
                modelo: 'SolicitudRepresentacion',
                id: solicitud._id
            }
        });
        await notificacion.save();
        return notificacion;
    } catch (err) {
        console.error('Error al generar alerta de solicitud de representación:', err);
    }
};

/**
 * Check and generate notifications for warranties about to expire.
 * Called when loading the alertas page or counters.
 */
const verificarGarantiasPorVencer = async (fabricanteId) => {
    try {
        const fabricante = await Fabricante.findById(fabricanteId);
        if (!fabricante) return 0;

        const umbralDias = UMBRAL_DIAS[fabricante.umbralGarantiaPorVencer] || 30;
        const ahora = new Date();
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() + umbralDias);

        // Find registered inventarios with product+warranty info
        const inventarios = await Inventario.find({
            registrado: 'Si',
            estado: 'vendido',
            fechaVenta: { $ne: null },
            producto: { $ne: null }
        }).populate({
            path: 'producto',
            populate: { path: 'garantia' }
        });

        let count = 0;
        for (const inv of inventarios) {
            if (!inv.producto?.garantia) continue;
            const garantia = inv.producto.garantia;
            const expiration = calculateWarrantyExpiration(
                inv.fechaVenta,
                garantia.duracionNumero,
                garantia.duracionUnidad
            );
            if (!expiration) continue;

            // Check if warranty expires within the threshold and hasn't expired yet
            if (expiration > ahora && expiration <= fechaLimite) {
                count++;

                // Check if we already generated a notification for this inventario
                const existing = await Notificacion.findOne({
                    fabricante: fabricanteId,
                    tipo: 'garantia_por_vencer',
                    'referencia.id': inv._id
                });

                if (!existing) {
                    const notificacion = new Notificacion({
                        fabricante: fabricanteId,
                        tipo: 'garantia_por_vencer',
                        titulo: 'Garantía próxima a vencer',
                        mensaje: `La garantía del producto ${inv.idInventario} (S/N: ${inv.numeroSerie}) vence el ${expiration.toLocaleDateString('es-AR')}`,
                        datos: {
                            idInventario: inv.idInventario,
                            numeroSerie: inv.numeroSerie,
                            fechaVencimiento: expiration,
                            cliente: inv.comprador?.nombreCompleto || '',
                            producto: inv.producto?.modelo || ''
                        },
                        referencia: {
                            modelo: 'Inventario',
                            id: inv._id
                        }
                    });
                    await notificacion.save();
                }
            }
        }
        return count;
    } catch (err) {
        console.error('Error al verificar garantías por vencer:', err);
        return 0;
    }
};

/**
 * Get counters for the 4 alert categories for a set of fabricante IDs
 */
const obtenerContadores = async (fabricanteIds) => {
    try {
        const [pedidosGarantia, solicitudesRepresentacion, productosRegistrados] = await Promise.all([
            // Pedidos de Garantía con estado 'Nuevo'
            PedidoGarantia.countDocuments({
                fabricante: { $in: fabricanteIds },
                estado: 'Nuevo'
            }),
            // Solicitudes de Representación pendientes
            SolicitudRepresentacion.countDocuments({
                fabricante: { $in: fabricanteIds },
                estado: 'En Evaluación'
            }),
            // Productos registrados
            Inventario.countDocuments({
                registrado: 'Si'
            })
        ]);

        // Check warranties about to expire for each fabricante
        let garantiasPorVencer = 0;
        for (const fabId of fabricanteIds) {
            garantiasPorVencer += await verificarGarantiasPorVencer(fabId);
        }

        return {
            pedidosGarantia,
            garantiasPorVencer,
            solicitudesRepresentacion,
            productosRegistrados
        };
    } catch (err) {
        console.error('Error al obtener contadores de alertas:', err);
        return {
            pedidosGarantia: 0,
            garantiasPorVencer: 0,
            solicitudesRepresentacion: 0,
            productosRegistrados: 0
        };
    }
};

module.exports = {
    generarAlertaProductoRegistrado,
    generarAlertaSolicitudRepresentacion,
    verificarGarantiasPorVencer,
    obtenerContadores
};
