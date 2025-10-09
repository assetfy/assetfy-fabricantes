import React, { useState } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';

const MarcaForm = ({ onMarcaAdded, fabricantes }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        fabricante: '',
        estado: 'Activa'
    });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const { showSuccess, showError } = useNotification();

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        
        try {
            // First create the marca
            await api.post('/apoderado/marcas/add', formData);
            showSuccess('Marca creada con éxito!');
            
            // Get the created marca ID from response headers or make another API call
            // Since the current API doesn't return the created marca, we'll need to get it
            const marcasResponse = await api.get('/apoderado/marcas');
            const createdMarca = marcasResponse.data.find(m => 
                m.nombre === formData.nombre && 
                m.fabricante._id === formData.fabricante
            );
            
            if (createdMarca && logoFile) {
                // Upload logo if file is selected
                try {
                    const logoFormData = new FormData();
                    logoFormData.append('logo', logoFile);
                    
                    await api.post(`/apoderado/marcas/${createdMarca._id}/logo`, logoFormData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    showSuccess('Logo subido exitosamente!');
                } catch (logoError) {
                    console.error('Error al subir logo:', logoError);
                    showError('Marca creada pero error al subir logo: ' + (logoError.response?.data || 'Error desconocido'));
                }
            }
            
            // Reset form
            setFormData({ nombre: '', fabricante: '', estado: 'Activa' });
            clearLogo();
            
            if (onMarcaAdded) {
                onMarcaAdded();
            }
        } catch (err) {
            console.error('Error al crear la marca:', err.response?.data);
            showError('Error: ' + (err.response?.data || 'Error al crear la marca.'));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="form-container">
            <h3>Crear Nueva Marca</h3>
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
                    <label>Logo de la Marca (opcional)</label>
                    <input 
                        type="file" 
                        accept="image/jpeg,image/jpg,image/png,image/gif"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                    <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                        Formatos permitidos: JPG, JPEG, PNG, GIF. Tamaño máximo: 2MB
                    </small>
                    {logoPreview && (
                        <div style={{ marginTop: '10px' }}>
                            <img 
                                src={logoPreview} 
                                alt="Vista previa del logo" 
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
                                    background: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                                disabled={uploading}
                            >
                                Eliminar
                            </button>
                        </div>
                    )}
                </div>
                <button type="submit" disabled={uploading}>
                    {uploading ? 'Creando marca...' : 'Crear Marca'}
                </button>
            </form>
        </div>
    );
};

export default MarcaForm;