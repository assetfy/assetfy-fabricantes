import React from 'react';

const WarrantyInfoReadOnly = ({ 
    producto,
    fechaVenta 
}) => {
    const formatDate = (date) => {
        if (!date) return 'No establecida';
        return new Date(date).toLocaleDateString('es-ES');
    };

    const formatDuration = (numero, unidad) => {
        if (!numero || !unidad) return 'No definido';
        return `${numero} ${unidad}`;
    };

    const formatArrayToString = (array) => {
        if (!array || array.length === 0) return 'Ninguno';
        return array.join(', ');
    };

    // Calculate warranty expiration if warranty exists and has appropriate settings
    const calculateExpirationDate = () => {
        if (!producto?.garantia || !fechaVenta) return null;
        
        const warranty = producto.garantia;
        if (warranty.fechaInicio !== 'Compra') return null;
        
        const startDate = new Date(fechaVenta);
        let expiration = new Date(startDate);
        
        switch (warranty.duracionUnidad) {
            case 'dias':
                expiration.setDate(expiration.getDate() + warranty.duracionNumero);
                break;
            case 'meses':
                expiration.setMonth(expiration.getMonth() + warranty.duracionNumero);
                break;
            case 'años':
                expiration.setFullYear(expiration.getFullYear() + warranty.duracionNumero);
                break;
            default:
                return null;
        }
        
        return expiration;
    };

    const expirationDate = calculateExpirationDate();
    const isExpired = expirationDate && expirationDate < new Date();

    return (
        <div className="warranty-info-readonly">
            {!producto?.garantia ? (
                <div className="no-warranty">
                    <p><strong>Este producto no tiene garantía asignada.</strong></p>
                </div>
            ) : (
                <div className="warranty-details">
                    <h4>Información de la Garantía</h4>
                    
                    <div className="form-group">
                        <label>Nombre del Plan:</label>
                        <div className="readonly-field">{producto.garantia.nombre}</div>
                    </div>

                    <div className="form-group">
                        <label>Duración de la Cobertura:</label>
                        <div className="readonly-field">
                            {formatDuration(producto.garantia.duracionNumero, producto.garantia.duracionUnidad)}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Fecha de Inicio:</label>
                        <div className="readonly-field">{producto.garantia.fechaInicio}</div>
                    </div>

                    <div className="form-group">
                        <label>Costo de la Garantía:</label>
                        <div className={`readonly-field cost-badge ${producto.garantia.costoGarantia === 'Incluido' ? 'included' : 'additional'}`}>
                            {producto.garantia.costoGarantia}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Partes Cubiertas:</label>
                        <div className="readonly-field">{producto.garantia.partesCubiertas}</div>
                    </div>

                    {producto.garantia.tipoCobertura && producto.garantia.tipoCobertura.length > 0 && (
                        <div className="form-group">
                            <label>Tipo de Cobertura:</label>
                            <div className="readonly-field">{formatArrayToString(producto.garantia.tipoCobertura)}</div>
                        </div>
                    )}

                    {producto.garantia.exclusiones && producto.garantia.exclusiones.length > 0 && (
                        <div className="form-group">
                            <label>Exclusiones:</label>
                            <div className="readonly-field">{formatArrayToString(producto.garantia.exclusiones)}</div>
                        </div>
                    )}

                    {fechaVenta && (
                        <>
                            <div className="form-group">
                                <label>Fecha de Venta:</label>
                                <div className="readonly-field">{formatDate(fechaVenta)}</div>
                            </div>

                            {expirationDate && (
                                <div className="form-group">
                                    <label>Expiración de Garantía:</label>
                                    <div className={`readonly-field ${isExpired ? 'warranty-expired' : 'warranty-active'}`}>
                                        {formatDate(expirationDate)}
                                        {isExpired && <span className="expired-label"> (Expirada)</span>}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <div className="form-group">
                        <label>Estado:</label>
                        <div className={`readonly-field status-badge ${producto.garantia.estado?.toLowerCase() || 'activa'}`}>
                            {producto.garantia.estado || 'Activa'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WarrantyInfoReadOnly;