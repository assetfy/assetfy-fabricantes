import React from 'react';
import Modal from './Modal';
import Tabs from './Tabs';

const ESTADO_COLORS = {
    'Pendiente': '#f59e0b',
    'Validada': '#22c55e',
    'Rechazada': '#ef4444'
};

const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-AR', {
        year: 'numeric', month: '2-digit', day: '2-digit'
    });
};

const GarantiaAsignadaDetailModal = ({ garantia, isOpen, onClose }) => {
    if (!garantia) return null;

    const datos = garantia.datosGarantia || {};

    const datosTab = (
        <div style={{ padding: '16px 0' }}>
            {/* Info general */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                    <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>ID Garantía</label>
                    <p style={{ margin: '4px 0' }}>{garantia.idGarantia}</p>
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Estado</label>
                    <p style={{ margin: '4px 0' }}>
                        <span style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            backgroundColor: ESTADO_COLORS[garantia.estado] || '#6c757d',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 600
                        }}>
                            {garantia.estado}
                        </span>
                    </p>
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Cliente</label>
                    <p style={{ margin: '4px 0' }}>{garantia.clienteFinal?.nombreCompleto || 'N/A'}</p>
                    <p style={{ margin: '0', fontSize: '12px', color: '#888' }}>{garantia.clienteFinal?.correoElectronico || ''}</p>
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Producto / Repuesto</label>
                    <p style={{ margin: '4px 0' }}>{garantia.productoRepuesto?.modelo || 'N/A'}</p>
                    <p style={{ margin: '0', fontSize: '12px', color: '#888' }}>{garantia.productoRepuesto?.tipo} · {garantia.productoRepuesto?.sku || ''}</p>
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Número de Serie</label>
                    <p style={{ margin: '4px 0' }}>{garantia.numeroSerie || 'N/A'}</p>
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Canal</label>
                    <p style={{ margin: '4px 0' }}>{garantia.canal}</p>
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Fecha de Registro</label>
                    <p style={{ margin: '4px 0' }}>{formatDate(garantia.fechaRegistro)}</p>
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Fecha de Expiración</label>
                    <p style={{ margin: '4px 0' }}>{formatDate(garantia.fechaExpiracion)}</p>
                </div>
            </div>

            {/* Datos de la garantía */}
            <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '16px' }}>Datos de la Garantía</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                    <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Nombre</label>
                    <p style={{ margin: '4px 0' }}>{datos.nombre}</p>
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Duración</label>
                    <p style={{ margin: '4px 0' }}>{datos.duracionNumero} {datos.duracionUnidad}</p>
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Inicio</label>
                    <p style={{ margin: '4px 0' }}>{datos.fechaInicio}</p>
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Costo</label>
                    <p style={{ margin: '4px 0' }}>{datos.costoGarantia}</p>
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Cobertura</label>
                    <p style={{ margin: '4px 0' }}>{(datos.tipoCobertura || []).join(', ') || 'N/A'}</p>
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Partes cubiertas</label>
                    <p style={{ margin: '4px 0' }}>{datos.partesCubiertas || 'N/A'}</p>
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Exclusiones</label>
                    <p style={{ margin: '4px 0' }}>{(datos.exclusiones || []).join(', ') || 'N/A'}</p>
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Limitaciones geográficas</label>
                    <p style={{ margin: '4px 0' }}>{datos.limitacionesGeograficas || 'N/A'}</p>
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Servicios incluidos</label>
                    <p style={{ margin: '4px 0' }}>{(datos.serviciosIncluidos || []).join(', ') || 'N/A'}</p>
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Canales de reclamo</label>
                    <p style={{ margin: '4px 0' }}>{(datos.canalesReclamo || []).join(', ') || 'N/A'}</p>
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Tiempo de respuesta</label>
                    <p style={{ margin: '4px 0' }}>{datos.tiempoRespuesta || 'N/A'}</p>
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Logística</label>
                    <p style={{ margin: '4px 0' }}>{datos.opcionesLogistica || 'N/A'}</p>
                </div>
            </div>
        </div>
    );

    const extensiones = garantia.extensiones || [];
    const extensionesTab = (
        <div style={{ padding: '16px 0' }}>
            <div style={{
                backgroundColor: '#f0f4ff',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <span style={{ fontSize: '20px' }}>&#128196;</span>
                <span style={{ fontWeight: 600 }}>Total de extensiones: {extensiones.length}</span>
            </div>

            {extensiones.length === 0 ? (
                <p style={{ color: '#888', textAlign: 'center', padding: '24px 0' }}>
                    Esta garantía no tiene extensiones registradas.
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {extensiones.map((ext, index) => (
                        <div key={ext._id || index} style={{
                            borderLeft: '4px solid #8b5cf6',
                            backgroundColor: '#fafafa',
                            padding: '12px 16px',
                            borderRadius: '0 8px 8px 0'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontWeight: 600, color: '#333' }}>Extensión #{index + 1}</span>
                                <span style={{ fontSize: '12px', color: '#888' }}>
                                    {formatDate(ext.fechaExtension)}
                                </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                                <div>
                                    <span style={{ color: '#666' }}>Fecha anterior: </span>
                                    <span style={{ fontWeight: 500 }}>{formatDate(ext.fechaAnterior)}</span>
                                </div>
                                <div>
                                    <span style={{ color: '#666' }}>Nueva fecha: </span>
                                    <span style={{ fontWeight: 500, color: '#22c55e' }}>{formatDate(ext.nuevaFechaExpiracion)}</span>
                                </div>
                            </div>
                            {ext.comentarios && (
                                <p style={{ margin: '8px 0 0 0', color: '#555', fontSize: '13px', fontStyle: 'italic' }}>
                                    "{ext.comentarios}"
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Garantía ${garantia.idGarantia}`} size="large">
            <Tabs tabs={[
                { label: 'Datos de Garantía', content: datosTab },
                { label: `Extensiones (${extensiones.length})`, content: extensionesTab }
            ]} />
        </Modal>
    );
};

export default GarantiaAsignadaDetailModal;
