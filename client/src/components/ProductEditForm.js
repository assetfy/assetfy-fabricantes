import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';
import Tabs from './Tabs';
import AttributesManager from './AttributesManager';
import WarrantySelector from './WarrantySelector';
import MultimediaForm from './MultimediaForm';
import getAuthenticatedUrl from '../utils/getAuthenticatedUrl';

const ProductEditForm = ({ product, fabricantes, marcas, onEditFinished, onCancelEdit, readOnly = false }) => {
    const { showSuccess, showError } = useNotification();
    const [formData, setFormData] = useState({
        modelo: '',
        descripcion: '',
        precio: '',
        fabricante: '',
        marca: '',
        estado: 'Activo'
    });
    const [existingFiles, setExistingFiles] = useState([]);
    const [multimedia, setMultimedia] = useState({
        imagenPrincipal: null,
        imagenesAdicionales: [],
        videos: []
    });
    const [atributos, setAtributos] = useState([]);
    const [garantia, setGarantia] = useState(null);
    const [piezasAsociadas, setPiezasAsociadas] = useState([]);

    const fetchPiezasAsociadas = useCallback(async () => {
        if (!product || !product._id) return;
        
        try {
            const response = await api.get(`/apoderado/piezas`);
            const allPiezas = response.data;
            // Filter piezas that have this product in their productos array
            const piezasConEsteProducto = allPiezas.filter(pieza => 
                pieza.productos && pieza.productos.some(p => p._id === product._id)
            );
            setPiezasAsociadas(piezasConEsteProducto);
        } catch (err) {
            console.error('Error fetching piezas asociadas:', err);
            setPiezasAsociadas([]);
        }
    }, [product]);

    useEffect(() => {
        if (product) {
            setFormData({
                modelo: product.modelo || '',
                descripcion: product.descripcion || '',
                precio: product.precio || 0,
                fabricante: product.fabricante ? product.fabricante._id : '',
                marca: product.marca ? product.marca._id : '',
                estado: product.estado || 'Activo'
            });
            setExistingFiles(product.manuales || []);
            setMultimedia({
                imagenPrincipal: product.imagenPrincipal || null,
                imagenesAdicionales: product.imagenesAdicionales || [],
                videos: product.videos || []
            });
            setAtributos(product.atributos || []);
            setGarantia(product.garantia || null);
            fetchPiezasAsociadas();
        }
    }, [product, fetchPiezasAsociadas]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const refreshMultimedia = async () => {
        try {
            const response = await api.get(`/apoderado/productos/${product._id}`);
            const updatedProduct = response.data;
            setMultimedia({
                imagenPrincipal: updatedProduct.imagenPrincipal || null,
                imagenesAdicionales: updatedProduct.imagenesAdicionales || [],
                videos: updatedProduct.videos || []
            });
        } catch (err) {
            console.error('Error refreshing multimedia:', err);
        }
    };

    const refreshManuales = async () => {
        try {
            const response = await api.get(`/apoderado/productos/${product._id}`);
            const updatedProduct = response.data;
            setExistingFiles(updatedProduct.manuales || []);
        } catch (err) {
            console.error('Error refreshing manuales:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Include attributes and warranty in the form data
            const dataToSend = {
                ...formData,
                atributos: atributos,
                garantia: garantia?._id || null
            };
            
            await api.put(`/apoderado/productos/${product._id}`, dataToSend);
            showSuccess('Producto actualizado con éxito!');
            
            if (onEditFinished) {
                onEditFinished();
            }
        } catch (err) {
            console.error('Error al actualizar el producto:', err.response.data);
            showError('Error: ' + (err.response?.data || 'No se pudo actualizar el producto.'));
        }
    };

    return (
        <div className="form-container">
            <h3>{readOnly ? 'Ver Producto' : 'Editar Producto'}</h3>
            <form onSubmit={handleSubmit}>
                <Tabs
                    tabs={[
                        {
                            label: "Información Básica",
                            content: (
                                <>
                                    <div className="form-group">
                                        <label>Modelo del Producto</label>
                                        <input type="text" name="modelo" value={formData.modelo} onChange={handleChange} required readOnly={readOnly} />
                                    </div>
                                    <div className="form-group">
                                        <label>Descripción</label>
                                        <input type="text" name="descripcion" value={formData.descripcion} onChange={handleChange} required readOnly={readOnly} />
                                    </div>
                                    <div className="form-group">
                                        <label>Precio</label>
                                        <input type="number" name="precio" value={formData.precio} onChange={handleChange} required readOnly={readOnly} />
                                    </div>
                                    <div className="form-group">
                                        <label>Fabricante</label>
                                        <select name="fabricante" value={formData.fabricante} onChange={handleChange} required disabled={readOnly}>
                                            <option value="">Selecciona un fabricante</option>
                                            {fabricantes.map(fab => (
                                                <option key={fab._id} value={fab._id}>{fab.razonSocial}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Marca</label>
                                        <select name="marca" value={formData.marca} onChange={handleChange} required disabled={readOnly}>
                                            <option value="">Selecciona una marca</option>
                                            {marcas.filter(m => m.fabricante._id === formData.fabricante).map(m => (
                                                <option key={m._id} value={m._id}>{m.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Estado</label>
                                        <select name="estado" value={formData.estado} onChange={handleChange} required disabled={readOnly}>
                                            <option value="Activo">Activo</option>
                                            <option value="Descontinuado">Descontinuado</option>
                                        </select>
                                    </div>
                                </>
                            )
                        },
                        {
                            label: "Multimedia",
                            content: (
                                <MultimediaForm 
                                    productId={product?._id}
                                    multimedia={multimedia}
                                    manuales={existingFiles}
                                    onMultimediaChange={refreshMultimedia}
                                    onManualesChange={refreshManuales}
                                    readOnly={readOnly}
                                />
                            )
                        },
                        {
                            label: "Atributos",
                            content: (
                                <AttributesManager 
                                    atributos={atributos}
                                    onAtributosChange={setAtributos}
                                    readOnly={readOnly}
                                />
                            )
                        },
                        {
                            label: "Garantía",
                            content: (
                                <WarrantySelector 
                                    selectedWarranty={garantia}
                                    onWarrantyChange={setGarantia}
                                    readOnly={readOnly}
                                />
                            )
                        },
                        {
                            label: "Piezas",
                            content: (
                                <div className="piezas-asociadas-container">
                                    {piezasAsociadas.length > 0 ? (
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>ID Pieza</th>
                                                    <th>Nombre</th>
                                                    <th>Imagen</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {piezasAsociadas.map(pieza => (
                                                    <tr key={pieza._id}>
                                                        <td>{pieza.idPieza || 'N/A'}</td>
                                                        <td>{pieza.nombre}</td>
                                                        <td>
                                                            {pieza.imagen && pieza.imagen.url ? (
                                                                <img 
                                                                    src={getAuthenticatedUrl(pieza.imagen.url)} 
                                                                    alt={pieza.nombre}
                                                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                                />
                                                            ) : (
                                                                'Sin imagen'
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                            No hay piezas asociadas a este producto.
                                        </p>
                                    )}
                                </div>
                            )
                        }
                    ]}
                />
                {!readOnly && <button type="submit">Actualizar Producto</button>}
                <button type="button" onClick={onCancelEdit}>{readOnly ? 'Cerrar' : 'Cancelar'}</button>
            </form>
        </div>
    );
};

export default ProductEditForm;