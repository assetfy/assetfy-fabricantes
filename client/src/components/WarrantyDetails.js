import React from 'react';
import Tabs from './Tabs';

const WarrantyDetails = ({ garantia, onClose }) => {
    if (!garantia) return null;

    const formatDuration = (numero, unidad) => {
        if (!numero || !unidad) return 'No definido';
        return `${numero} ${unidad}`;
    };

    const formatArrayToString = (array) => {
        if (!array || array.length === 0) return 'Ninguno';
        return array.join(', ');
    };

    const formatBoolean = (value) => {
        return value ? 'Sí' : 'No';
    };

    // Tab 1: Datos generales
    const datosGeneralesTab = (
        <div className="warranty-details-content">
            <div className="detail-item">
                <label>ID de Garantía:</label>
                <span>{garantia.idGarantia}</span>
            </div>
            {garantia.fabricante && (
                <div className="detail-item">
                    <label>Fabricante:</label>
                    <span>{garantia.fabricante.razonSocial || garantia.fabricante}</span>
                </div>
            )}
            {garantia.marca && (
                <div className="detail-item">
                    <label>Marca:</label>
                    <span>{garantia.marca.nombre || garantia.marca}</span>
                </div>
            )}
            <div className="detail-item">
                <label>Nombre del plan:</label>
                <span>{garantia.nombre}</span>
            </div>
            <div className="detail-item">
                <label>Duración de la cobertura:</label>
                <span>{formatDuration(garantia.duracionNumero, garantia.duracionUnidad)}</span>
            </div>
            <div className="detail-item">
                <label>Fecha de inicio:</label>
                <span>{garantia.fechaInicio}</span>
            </div>
            <div className="detail-item">
                <label>Costo de la garantía:</label>
                <span className={`cost-badge ${garantia.costoGarantia === 'Incluido' ? 'included' : 'additional'}`}>
                    {garantia.costoGarantia}
                </span>
            </div>
            <div className="detail-item">
                <label>Estado:</label>
                <span className={`status-badge ${garantia.estado.toLowerCase()}`}>
                    {garantia.estado}
                </span>
            </div>
        </div>
    );

    // Tab 2: Alcance de la cobertura
    const coberturaTab = (
        <div className="warranty-details-content">
            <div className="detail-item">
                <label>Tipo de cobertura:</label>
                <span>{formatArrayToString(garantia.tipoCobertura)}</span>
            </div>
            <div className="detail-item">
                <label>Partes cubiertas:</label>
                <span>{garantia.partesCubiertas}</span>
            </div>
            <div className="detail-item">
                <label>Exclusiones:</label>
                <span>{formatArrayToString(garantia.exclusiones)}</span>
            </div>
            <div className="detail-item">
                <label>Limitaciones geográficas:</label>
                <span>{garantia.limitacionesGeograficas}</span>
            </div>
            <div className="detail-item">
                <label>Servicios incluidos:</label>
                <span>{formatArrayToString(garantia.serviciosIncluidos)}</span>
            </div>
        </div>
    );

    // Tab 3: Condiciones de validez
    const condicionesTab = (
        <div className="warranty-details-content">
            <div className="detail-item">
                <label>Requiere registro del producto:</label>
                <span className={`boolean-badge ${garantia.requiereRegistro ? 'yes' : 'no'}`}>
                    {formatBoolean(garantia.requiereRegistro)}
                </span>
            </div>
            <div className="detail-item">
                <label>Comprobante de compra obligatorio:</label>
                <span className={`boolean-badge ${garantia.comprobanteObligatorio ? 'yes' : 'no'}`}>
                    {formatBoolean(garantia.comprobanteObligatorio)}
                </span>
            </div>
            <div className="detail-item">
                <label>Uso autorizado:</label>
                <span>{formatArrayToString(garantia.usoAutorizado)}</span>
            </div>
            <div className="detail-item">
                <label>Instalación certificada requerida:</label>
                <span className={`boolean-badge ${garantia.instalacionCertificada ? 'yes' : 'no'}`}>
                    {formatBoolean(garantia.instalacionCertificada)}
                </span>
            </div>
            <div className="detail-item">
                <label>Mantenimiento regular documentado:</label>
                <span className={`boolean-badge ${garantia.mantenimientoDocumentado ? 'yes' : 'no'}`}>
                    {formatBoolean(garantia.mantenimientoDocumentado)}
                </span>
            </div>
        </div>
    );

    // Tab 4: Procesos de reclamo
    const reclamosTab = (
        <div className="warranty-details-content">
            <div className="detail-item">
                <label>Canales de reclamo:</label>
                <span>{formatArrayToString(garantia.canalesReclamo)}</span>
            </div>
            <div className="detail-item">
                <label>Tiempo de respuesta garantizado:</label>
                <span>{garantia.tiempoRespuesta}</span>
            </div>
            <div className="detail-item">
                <label>Opciones de logística:</label>
                <span>{garantia.opcionesLogistica}</span>
            </div>
            <div className="detail-item">
                <label>Número máximo de reclamos:</label>
                <span>{garantia.maximoReclamos === 0 ? 'Ilimitado' : garantia.maximoReclamos}</span>
            </div>
            <div className="detail-item">
                <label>Responsabilidades del cliente:</label>
                <span>{formatArrayToString(garantia.responsabilidadesCliente)}</span>
            </div>
            <div className="detail-item">
                <label>Pago de traslado/envío:</label>
                <span className={`payment-badge ${garantia.pagoTraslado === 'Cubierto' ? 'covered' : 'client'}`}>
                    {garantia.pagoTraslado}
                </span>
            </div>
        </div>
    );

    return (
        <div className="warranty-details">
            <Tabs
                tabs={[
                    {
                        label: "Datos Generales",
                        content: datosGeneralesTab
                    },
                    {
                        label: "Alcance de Cobertura", 
                        content: coberturaTab
                    },
                    {
                        label: "Condiciones de Validez",
                        content: condicionesTab
                    },
                    {
                        label: "Procesos de Reclamo",
                        content: reclamosTab
                    }
                ]}
            />

            <div className="warranty-details-footer">
                <button onClick={onClose} className="close-button">
                    Cerrar
                </button>
            </div>
        </div>
    );
};

export default WarrantyDetails;