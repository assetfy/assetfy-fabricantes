import React, { useState } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';
import getAuthenticatedUrl from '../utils/getAuthenticatedUrl';

const ProfileEditModal = ({ user, isOpen, onClose, onProfileUpdated, userType = 'admin' }) => {
    const [formData, setFormData] = useState({
        nombreCompleto: user?.nombreCompleto || '',
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        nuevaContraseña: '',
        confirmarContraseña: ''
    });
    
    const [previewUrl, setPreviewUrl] = useState(() => {
        if (user?.imagenPerfil && typeof user.imagenPerfil === 'object' && user.imagenPerfil.url) {
            return getAuthenticatedUrl(user.imagenPerfil.url);
        } else if (typeof user?.imagenPerfil === 'string') {
            return getAuthenticatedUrl(user.imagenPerfil);
        }
        return null;
    });
    const [isLoading, setIsLoading] = useState(false);
    const { showSuccess, showError } = useNotification();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleChangePassword = async () => {
        try {
            setIsLoading(true);
            
            if (window.location.pathname.includes('/demo/')) {
                // Demo mode
                await new Promise(resolve => setTimeout(resolve, 1000));
                showSuccess('Contraseña actualizada exitosamente (modo demo)');
                setShowChangePassword(false);
                setPasswordData({ nuevaContraseña: '', confirmarContraseña: '' });
            } else {
                // Real API call
                const endpoint = userType === 'admin' ? '/admin/perfil/cambiar-contrasena' : '/apoderado/perfil/cambiar-contrasena';
                await api.post(endpoint, passwordData);
                showSuccess('Contraseña actualizada exitosamente');
                setShowChangePassword(false);
                setPasswordData({ nuevaContraseña: '', confirmarContraseña: '' });
            }
        } catch (error) {
            console.error('Error al cambiar la contraseña:', error);
            
            let errorMessage = 'Error al cambiar la contraseña';
            if (error.response?.data?.msg) {
                errorMessage = error.response.data.msg;
            } else if (typeof error.response?.data === 'string') {
                errorMessage = error.response.data;
            }
            
            showError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                showError('Solo se permiten archivos JPG, JPEG, PNG y GIF');
                e.target.value = '';
                return;
            }

            // Validate file size (5MB max)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (file.size > maxSize) {
                showError('El archivo es demasiado grande. Tamaño máximo: 5MB');
                e.target.value = '';
                return;
            }

            setSelectedFile(file);
            
            // Create preview URL
            const reader = new FileReader();
            reader.onload = (e) => setPreviewUrl(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const removePhoto = async () => {
        try {
            setIsLoading(true);
            
            if (window.location.pathname.includes('/demo/')) {
                // Demo mode - simulate photo removal
                await new Promise(resolve => setTimeout(resolve, 1000));
                setPreviewUrl(null);
                setSelectedFile(null);
                showSuccess('Foto de perfil eliminada exitosamente (modo demo)');
            } else {
                // Real API call
                const endpoint = userType === 'admin' ? '/admin/perfil/foto' : '/apoderado/perfil/foto';
                await api.delete(endpoint);
                setPreviewUrl(null);
                setSelectedFile(null);
                showSuccess('Foto de perfil eliminada exitosamente');
            }
        } catch (error) {
            console.error('Error al eliminar la foto:', error);
            showError('Error al eliminar la foto de perfil');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Check if this is a demo environment (no actual API call)
            if (window.location.pathname.includes('/demo/')) {
                // Demo mode - simulate profile update
                await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
                showSuccess('Perfil actualizado exitosamente (modo demo)');
                onProfileUpdated({ ...formData, imagenPerfil: previewUrl });
                onClose();
            } else {
                // Upload photo first if a new file is selected
                let updatedImagenPerfil = user?.imagenPerfil;
                
                if (selectedFile) {
                    const photoFormData = new FormData();
                    photoFormData.append('fotoPerfil', selectedFile);
                    
                    const endpoint = userType === 'admin' ? '/admin/perfil/foto' : '/apoderado/perfil/foto';
                    const photoResponse = await api.post(endpoint, photoFormData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });
                    
                    updatedImagenPerfil = photoResponse.data.archivo;
                }

                // Update profile data
                const endpoint = userType === 'admin' ? '/admin/perfil' : '/apoderado/perfil';
                const response = await api.put(endpoint, {
                    ...formData,
                    imagenPerfil: updatedImagenPerfil
                });
                
                showSuccess('Perfil actualizado exitosamente');
                onProfileUpdated(response.data);
                onClose();
            }
        } catch (error) {
            console.error('Error al actualizar el perfil:', error);
            
            // Handle specific error types from our improved server responses
            let errorMessage = 'Error al actualizar el perfil';
            
            if (error.response?.data) {
                const errorData = error.response.data;
                
                // Handle structured error responses
                if (errorData.code === 'S3_NOT_AVAILABLE') {
                    errorMessage = 'Servicio de archivos temporalmente no disponible. Intente más tarde.';
                } else if (errorData.code === 'S3_CONNECTIVITY_ISSUE') {
                    errorMessage = 'Problema de conectividad con el servicio de archivos. Intente más tarde.';
                } else if (errorData.error && typeof errorData.error === 'string') {
                    errorMessage = errorData.error;
                } else if (errorData.msg) {
                    errorMessage = errorData.msg;
                } else if (typeof errorData === 'string') {
                    errorMessage = errorData;
                }
                
                // Add status code context for debugging
                if (error.response.status === 503) {
                    errorMessage += ' (Servicio temporalmente no disponible)';
                } else if (error.response.status === 500) {
                    errorMessage += ' (Error del servidor)';
                }
            }
            
            showError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            nombreCompleto: user?.nombreCompleto || '',
        });
        setSelectedFile(null);
        setShowChangePassword(false);
        setPasswordData({ nuevaContraseña: '', confirmarContraseña: '' });
        setPreviewUrl(() => {
            if (user?.imagenPerfil && typeof user.imagenPerfil === 'object' && user.imagenPerfil.url) {
                return getAuthenticatedUrl(user.imagenPerfil.url);
            } else if (typeof user?.imagenPerfil === 'string') {
                return getAuthenticatedUrl(user.imagenPerfil);
            }
            return null;
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={handleClose}>
            <div className="modal-content profile-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Editar Perfil</h3>
                    <button className="close-button" onClick={handleClose}>×</button>
                </div>
                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="nombreCompleto">Nombre Completo</label>
                            <input
                                type="text"
                                id="nombreCompleto"
                                name="nombreCompleto"
                                value={formData.nombreCompleto}
                                onChange={handleChange}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="fotoPerfil">Foto de Perfil</label>
                            <input
                                type="file"
                                id="fotoPerfil"
                                name="fotoPerfil"
                                accept="image/jpeg,image/jpg,image/png,image/gif"
                                onChange={handleFileChange}
                                disabled={isLoading}
                            />
                            <small className="form-help">
                                Selecciona una imagen para tu perfil. Formatos permitidos: JPG, JPEG, PNG, GIF. Tamaño máximo: 5MB.
                            </small>
                        </div>

                        {previewUrl && (
                            <div className="form-group">
                                <label>Vista Previa</label>
                                <div className="profile-preview">
                                    <img 
                                        src={previewUrl} 
                                        alt="Vista previa del perfil"
                                        onError={(e) => {
                                            console.error('Error loading profile image:', previewUrl);
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                    <button 
                                        type="button" 
                                        className="remove-photo-btn"
                                        onClick={removePhoto}
                                        disabled={isLoading}
                                    >
                                        Eliminar foto
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <button 
                                type="button"
                                onClick={() => setShowChangePassword(!showChangePassword)}
                                disabled={isLoading}
                                className="secondary-button"
                                style={{ width: '100%', marginTop: '10px' }}
                            >
                                {showChangePassword ? 'Cancelar Cambio de Contraseña' : 'Cambiar Contraseña'}
                            </button>
                        </div>

                        {showChangePassword && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="nuevaContraseña">Nueva Contraseña</label>
                                    <input
                                        type="password"
                                        id="nuevaContraseña"
                                        name="nuevaContraseña"
                                        value={passwordData.nuevaContraseña}
                                        onChange={handlePasswordChange}
                                        required
                                        disabled={isLoading}
                                        minLength="6"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="confirmarContraseña">Confirmar Nueva Contraseña</label>
                                    <input
                                        type="password"
                                        id="confirmarContraseña"
                                        name="confirmarContraseña"
                                        value={passwordData.confirmarContraseña}
                                        onChange={handlePasswordChange}
                                        required
                                        disabled={isLoading}
                                        minLength="6"
                                    />
                                </div>

                                <div className="form-group">
                                    <button 
                                        type="button"
                                        onClick={handleChangePassword}
                                        disabled={isLoading || !passwordData.nuevaContraseña || !passwordData.confirmarContraseña}
                                        className="save-button"
                                        style={{ width: '100%' }}
                                    >
                                        {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                                    </button>
                                </div>
                            </>
                        )}

                        <div className="modal-actions">
                            <button 
                                type="button" 
                                onClick={handleClose}
                                disabled={isLoading}
                                className="cancel-button"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="save-button"
                            >
                                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfileEditModal;