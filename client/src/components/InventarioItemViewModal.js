import React from 'react';

const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const InventarioItemViewModal = ({ isOpen, onClose, item }) => {
    if (!isOpen || !item) return null;

    const isVendido = item.estado === 'vendido';
    const isAlquilado = item.estado === 'alquilado';
    const productoNombre = item.producto?.modelo || item.pieza?.nombre || '—';

    return (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal-content inventario-view-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Detalle del Item</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <div className="inventario-view-grid">
                        <div className="inventario-view-field">
                            <span className="inventario-view-label">ID Inventario</span>
                            <span className="inventario-view-value">{item.idInventario || '—'}</span>
                        </div>
                        <div className="inventario-view-field">
                            <span className="inventario-view-label">Número de Serie</span>
                            <span className="inventario-view-value">{item.numeroSerie || '—'}</span>
                        </div>
                        <div className="inventario-view-field">
                            <span className="inventario-view-label">Estado</span>
                            <span className={`inventario-view-value estado-badge estado-${item.estado}`}>
                                {isVendido ? 'Vendido' : isAlquilado ? 'Alquilado' : item.estado}
                            </span>
                        </div>
                        <div className="inventario-view-field">
                            <span className="inventario-view-label">Producto / Pieza</span>
                            <span className="inventario-view-value">{productoNombre}</span>
                        </div>
                        {item.ubicacion && (
                            <div className="inventario-view-field">
                                <span className="inventario-view-label">Ubicación / Depósito</span>
                                <span className="inventario-view-value">{item.ubicacion.nombre}</span>
                            </div>
                        )}
                        {isVendido && (
                            <div className="inventario-view-field">
                                <span className="inventario-view-label">Fecha de Venta</span>
                                <span className="inventario-view-value">{formatDate(item.fechaVenta)}</span>
                            </div>
                        )}
                        {isAlquilado && (
                            <>
                                <div className="inventario-view-field">
                                    <span className="inventario-view-label">Inicio del Alquiler</span>
                                    <span className="inventario-view-value">{formatDate(item.fechaInicioAlquiler)}</span>
                                </div>
                                <div className="inventario-view-field">
                                    <span className="inventario-view-label">Fin del Alquiler</span>
                                    <span className="inventario-view-value">{formatDate(item.fechaFinAlquiler)}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {(isVendido || isAlquilado) && item.comprador && (item.comprador.nombreCompleto || item.comprador.correoElectronico || item.comprador.telefono) && (
                        <div className="inventario-view-section">
                            <h4 className="inventario-view-section-title">
                                {isVendido ? 'Datos del Comprador' : 'Datos del Inquilino'}
                            </h4>
                            <div className="inventario-view-grid">
                                {item.comprador.nombreCompleto && (
                                    <div className="inventario-view-field">
                                        <span className="inventario-view-label">Nombre</span>
                                        <span className="inventario-view-value">{item.comprador.nombreCompleto}</span>
                                    </div>
                                )}
                                {item.comprador.correoElectronico && (
                                    <div className="inventario-view-field">
                                        <span className="inventario-view-label">Email</span>
                                        <span className="inventario-view-value">{item.comprador.correoElectronico}</span>
                                    </div>
                                )}
                                {item.comprador.telefono && (
                                    <div className="inventario-view-field">
                                        <span className="inventario-view-label">Teléfono</span>
                                        <span className="inventario-view-value">{item.comprador.telefono}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {item.atributos && item.atributos.length > 0 && (
                        <div className="inventario-view-section">
                            <h4 className="inventario-view-section-title">Atributos</h4>
                            <div className="inventario-view-grid">
                                {item.atributos.map((attr, i) => (
                                    <div key={i} className="inventario-view-field">
                                        <span className="inventario-view-label">{attr.nombre}</span>
                                        <span className="inventario-view-value">{attr.valor || '—'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="inventario-view-actions">
                        <button className="cancel-button" onClick={onClose}>Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventarioItemViewModal;
