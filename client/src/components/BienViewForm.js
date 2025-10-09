import React from 'react';
import getAuthenticatedUrl from '../utils/getAuthenticatedUrl';

const BienViewForm = ({ bien, onClose }) => {
    const getImageUrl = () => {
        if (bien.tipo === 'creado' && bien.imagen && bien.imagen.url) {
            return getAuthenticatedUrl(bien.imagen.url);
        } else if (bien.tipo === 'registrado' && bien.datosProducto?.imagenPrincipal?.url) {
            return getAuthenticatedUrl(bien.datosProducto.imagenPrincipal.url);
        }
        return null;
    };

    return (
        <div className="view-form-container">
            <div className="form-section">
                <h3>Información del Bien</h3>
                
                <div className="form-group read-only">
                    <label>Nombre</label>
                    <p>{bien.nombre}</p>
                </div>

                <div className="form-group read-only">
                    <label>Tipo</label>
                    <p>
                        <span className={`badge badge-${bien.tipo}`}>
                            {bien.tipo === 'creado' ? 'Creado por Usuario' : 'Registrado de Fabricante'}
                        </span>
                    </p>
                </div>

                {getImageUrl() && (
                    <div className="form-group read-only">
                        <label>Imagen</label>
                        <img 
                            src={getImageUrl()} 
                            alt={bien.nombre}
                            style={{ maxWidth: '300px', height: 'auto' }}
                        />
                    </div>
                )}

                {bien.tipo === 'creado' && (
                    <>
                        {bien.comentarios && (
                            <div className="form-group read-only">
                                <label>Comentarios</label>
                                <p>{bien.comentarios}</p>
                            </div>
                        )}

                        {bien.atributos && bien.atributos.length > 0 && (
                            <div className="form-group read-only">
                                <label>Atributos</label>
                                <table className="attributes-table">
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bien.atributos.map((attr, index) => (
                                            <tr key={index}>
                                                <td>{attr.nombre}</td>
                                                <td>{attr.valor}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {bien.tipo === 'registrado' && bien.datosProducto && (
                    <>
                        <div className="form-group read-only">
                            <label>Modelo</label>
                            <p>{bien.datosProducto.modelo || 'N/A'}</p>
                        </div>

                        <div className="form-group read-only">
                            <label>Descripción</label>
                            <p>{bien.datosProducto.descripcion || 'N/A'}</p>
                        </div>

                        <div className="form-group read-only">
                            <label>Número de Serie</label>
                            <p>{bien.datosProducto.numeroSerie || 'N/A'}</p>
                        </div>

                        {bien.datosProducto.fabricante && (
                            <div className="form-group read-only">
                                <label>Fabricante</label>
                                <p>{bien.datosProducto.fabricante.razonSocial}</p>
                            </div>
                        )}

                        {bien.datosProducto.marca && (
                            <div className="form-group read-only">
                                <label>Marca</label>
                                <p>{bien.datosProducto.marca.nombre}</p>
                            </div>
                        )}

                        {bien.datosProducto.garantia && (
                            <div className="form-group read-only">
                                <label>Garantía</label>
                                <p>{bien.datosProducto.garantia.nombre} - {bien.datosProducto.garantia.duracion} {bien.datosProducto.garantia.unidad}</p>
                            </div>
                        )}

                        {bien.datosProducto.atributos && bien.datosProducto.atributos.length > 0 && (
                            <div className="form-group read-only">
                                <label>Atributos del Producto</label>
                                <table className="attributes-table">
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bien.datosProducto.atributos.map((attr, index) => (
                                            <tr key={index}>
                                                <td>{attr.nombre}</td>
                                                <td>{attr.valor || attr.valores?.join(', ') || 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {bien.fechaRegistro && (
                            <div className="form-group read-only">
                                <label>Fecha de Registro</label>
                                <p>{new Date(bien.fechaRegistro).toLocaleDateString()}</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="button-group">
                <button type="button" onClick={onClose} className="secondary-button">
                    Cerrar
                </button>
            </div>
        </div>
    );
};

export default BienViewForm;
