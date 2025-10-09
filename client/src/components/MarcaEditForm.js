import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';
import getAuthenticatedUrl from '../utils/getAuthenticatedUrl';

const MarcaEditForm = ({ marca, fabricantes, onEditFinished, onCancelEdit }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        fabricante: '',
        estado: 'Activa'
    });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [currentLogo, setCurrentLogo] = useState(null);
    const [uploading, setUploading] = useState(false);
    const { showSuccess, showError } = useNotification();

    useEffect(() => {
        if (marca) {
            setFormData({
                nombre: marca.nombre,
                fabricante: marca.fabricante._id,
                estado: marca.estado || 'Activa'
            });
            
            // Set current logo if exists
            if (marca.logo && marca.logo.url) {
                setCurrentLogo(marca.logo);
            } else {
                setCurrentLogo(null);
            }
            
            // Clear any file selection when marca changes
            setLogoFile(null);
            setLogoPreview(null);
        }
    }, [marca]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                showError('Solo se permiten archivos JPG, JPEG, PNG y GIF para el logo');
                return;
            }

            // Validate file size (2MB)
            const maxSize = 2 * 1024 * 1024; // 2MB in bytes
            if (file.size > maxSize) {
                showError('El archivo es demasiado grande. Máximo 2MB permitido.');
                return;
            }

            setLogoFile(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setLogoPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearLogo = () => {
        setLogoFile(null);
        setLogoPreview(null);
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
    };

    const deleteCurrentLogo = async () => {
        if (!currentLogo || !marca) return;
        
        try {
            await api.delete(`/apoderado/marcas/${marca._id}/logo`);
            setCurrentLogo(null);
            showSuccess('Logo eliminado exitosamente');
        } catch (error) {
            console.error('Error al eliminar logo:', error);
            showError('Error al eliminar logo: ' + (error.response?.data || 'Error desconocido'));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        
        try {
            // First update the marca basic info
            await api.put(`/apoderado/marcas/${marca._id}`, formData);
            showSuccess('Marca actualizada con éxito!');
            
            // Upload new logo if file is selected
            if (logoFile) {
                try {
                    const logoFormData = new FormData();
                    logoFormData.append('logo', logoFile);
                    
                    await api.post(`/apoderado/marcas/${marca._id}/logo`, logoFormData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    showSuccess('Logo actualizado exitosamente!');
                } catch (logoError) {
                    console.error('Error al subir logo:', logoError);
                    showError('Marca actualizada pero error al subir logo: ' + (logoError.response?.data || 'Error desconocido'));
                }
            }
            
            if (onEditFinished) {
                onEditFinished();
            }
        } catch (err) {
            console.error('Error al actualizar la marca:', err.response?.data);
            showError('Error: ' + (err.response?.data || 'No se pudo actualizar la marca.'));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="form-container">
            <h3>Editar Marca</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Nombre de la Marca</label>
                    <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Fabricante</label>
                    <select name="fabricante" value={formData.fabricante} onChange={handleChange} required>
                        <option value="">Selecciona un fabricante</option>
                        {fabricantes.map(fab => (
                            <option key={fab._id} value={fab._id}>{fab.razonSocial}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Estado</label>
                    <select name="estado" value={formData.estado} onChange={handleChange} required>
                        <option value="Activa">Activa</option>
                        <option value="Desactivada">Desactivada</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Logo de la Marca</label>
                    
                    {/* Current logo display */}
                    {currentLogo && currentLogo.url && (
                        <div style={{ marginBottom: '10px' }}>
                            <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>Logo actual:</p>
                            <img 
                                src={getAuthenticatedUrl(currentLogo.url)} 
                                alt="Logo actual" 
                                style={{ 
                                    maxWidth: '200px', 
                                    maxHeight: '150px', 
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    marginRight: '10px'
                                }} 
                                onError={(e) => {
                                    console.error('Error loading current logo');
                                    e.target.style.display = 'none';
                                }}
                            />
                            <button 
                                type="button" 
                                onClick={deleteCurrentLogo}
                                style={{ 
                                    padding: '5px 10px',
                                    background: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                                disabled={uploading}
                            >
                                Eliminar logo actual
                            </button>
                        </div>
                    )}
                    
                    {/* New logo upload */}
                    <input 
                        type="file" 
                        accept="image/jpeg,image/jpg,image/png,image/gif"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                    <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                        {currentLogo ? 'Selecciona un archivo para reemplazar el logo actual' : 'Selecciona un archivo para agregar logo'}. 
                        Formatos: JPG, JPEG, PNG, GIF. Máximo: 2MB
                    </small>
                    
                    {/* New logo preview */}
                    {logoPreview && (
                        <div style={{ marginTop: '10px' }}>
                            <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>Vista previa del nuevo logo:</p>
                            <img 
                                src={logoPreview} 
                                alt="Vista previa del nuevo logo" 
                                style={{ 
                                    maxWidth: '200px', 
                                    maxHeight: '150px', 
                                    border: '1px solid #ddd',
                                    borderRadius: '4px'
                                }} 
                            />
                            <button 
                                type="button" 
                                onClick={clearLogo}
                                style={{ 
                                    marginLeft: '10px', 
                                    padding: '5px 10px',
                                    background: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                                disabled={uploading}
                            >
                                Cancelar selección
                            </button>
                        </div>
                    )}
                </div>
                <button type="submit" disabled={uploading}>
                    {uploading ? 'Actualizando...' : 'Actualizar Marca'}
                </button>
                <button type="button" onClick={onCancelEdit}>Cancelar</button>
            </form>
        </div>
    );
};

export default MarcaEditForm;