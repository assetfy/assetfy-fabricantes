import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';
import getAuthenticatedUrl from '../utils/getAuthenticatedUrl';

const MultimediaForm = ({ productId, multimedia, manuales, onMultimediaChange, onManualesChange, readOnly = false }) => {
    const { showSuccess, showError } = useNotification();
    const [selectedImagenPrincipal, setSelectedImagenPrincipal] = useState(null);
    const [autoUploadImagenPrincipal, setAutoUploadImagenPrincipal] = useState(false);
    const [selectedImagenesAdicionales, setSelectedImagenesAdicionales] = useState([]);
    const [selectedVideos, setSelectedVideos] = useState([]);
    const [selectedManuales, setSelectedManuales] = useState([]);
    const [showImagePreview, setShowImagePreview] = useState(false);

    const ensureProductReady = (showAlert = true) => {
        if (!productId) {
            if (showAlert) {
                showError('Primero completa la información básica (marca y modelo) y crea el producto antes de subir archivos.');
            }
            return false;
        }
        return true;
    };

    const handleImagenPrincipalChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImagenPrincipal(file);
            if (!productId) {
                setAutoUploadImagenPrincipal(true);
            } else {
                setAutoUploadImagenPrincipal(false);
            }
        }
    };

    const handleImagenesAdicionalesChange = (e) => {
        if (!ensureProductReady()) {
            e.target.value = '';
            return;
        }

        setSelectedImagenesAdicionales(Array.from(e.target.files));
    };

    const handleVideosChange = (e) => {
        if (!ensureProductReady()) {
            e.target.value = '';
            return;
        }

        setSelectedVideos(Array.from(e.target.files));
    };

    const handleManualesChange = (e) => {
        if (!ensureProductReady()) {
            e.target.value = '';
            return;
        }

        setSelectedManuales(Array.from(e.target.files));
    };

    const uploadImagenPrincipal = async () => {
        if (!selectedImagenPrincipal) return;
        if (!ensureProductReady()) return;

        try {
            const formData = new FormData();
            formData.append('imagenPrincipal', selectedImagenPrincipal);

            await api.post(`/apoderado/productos/${productId}/imagen-principal`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            showSuccess('Imagen principal subida con éxito!');
            setSelectedImagenPrincipal(null);
            setAutoUploadImagenPrincipal(false);
            document.getElementById('imagenPrincipalFile').value = '';

            if (onMultimediaChange) {
                onMultimediaChange();
            }
        } catch (error) {
            console.error('Error uploading imagen principal:', error);
            showError('Error al subir imagen principal: ' + (error.response?.data?.error || 'Error desconocido'));
        }
    };

    useEffect(() => {
        if (productId && autoUploadImagenPrincipal && selectedImagenPrincipal) {
            uploadImagenPrincipal();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId, autoUploadImagenPrincipal, selectedImagenPrincipal]);

    const uploadImagenesAdicionales = async () => {
        if (selectedImagenesAdicionales.length === 0) return;
        if (!ensureProductReady()) return;

        try {
            const formData = new FormData();
            selectedImagenesAdicionales.forEach(file => {
                formData.append('imagenesAdicionales', file);
            });

            await api.post(`/apoderado/productos/${productId}/imagenes-adicionales`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            showSuccess(`${selectedImagenesAdicionales.length} imágenes adicionales subidas con éxito!`);
            setSelectedImagenesAdicionales([]);
            document.getElementById('imagenesAdicionalesFile').value = '';
            
            if (onMultimediaChange) {
                onMultimediaChange();
            }
        } catch (error) {
            console.error('Error uploading imagenes adicionales:', error);
            showError('Error al subir imágenes adicionales: ' + (error.response?.data?.error || 'Error desconocido'));
        }
    };

    const uploadVideos = async () => {
        if (selectedVideos.length === 0) return;
        if (!ensureProductReady()) return;

        try {
            const formData = new FormData();
            selectedVideos.forEach(file => {
                formData.append('videos', file);
            });

            await api.post(`/apoderado/productos/${productId}/videos`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            showSuccess(`${selectedVideos.length} videos subidos con éxito!`);
            setSelectedVideos([]);
            document.getElementById('videosFile').value = '';
            
            if (onMultimediaChange) {
                onMultimediaChange();
            }
        } catch (error) {
            console.error('Error uploading videos:', error);
            showError('Error al subir videos: ' + (error.response?.data?.error || 'Error desconocido'));
        }
    };

    const uploadManuales = async () => {
        if (selectedManuales.length === 0) return;
        if (!ensureProductReady()) return;

        try {
            const formData = new FormData();
            selectedManuales.forEach(file => {
                formData.append('manuales', file);
            });

            await api.post(`/apoderado/productos/${productId}/manuales`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            showSuccess(`${selectedManuales.length} manuales subidos con éxito!`);
            setSelectedManuales([]);
            document.getElementById('manualesFile').value = '';
            
            if (onManualesChange) {
                onManualesChange();
            }
        } catch (error) {
            console.error('Error uploading manuales:', error);
            showError('Error al subir manuales: ' + (error.response?.data?.error || 'Error desconocido'));
        }
    };

    const deleteImagenPrincipal = async () => {
        if (!productId) return;

        try {
            await api.delete(`/apoderado/productos/${productId}/imagen-principal`);
            showSuccess('Imagen principal eliminada con éxito!');
            
            if (onMultimediaChange) {
                onMultimediaChange();
            }
        } catch (error) {
            console.error('Error deleting imagen principal:', error);
            showError('Error al eliminar imagen principal');
        }
    };

    const deleteImagenAdicional = async (imagenId) => {
        if (!productId) return;

        try {
            await api.delete(`/apoderado/productos/${productId}/imagenes-adicionales/${imagenId}`);
            showSuccess('Imagen adicional eliminada con éxito!');
            
            if (onMultimediaChange) {
                onMultimediaChange();
            }
        } catch (error) {
            console.error('Error deleting imagen adicional:', error);
            showError('Error al eliminar imagen adicional');
        }
    };

    const deleteVideo = async (videoId) => {
        if (!productId) return;

        try {
            await api.delete(`/apoderado/productos/${productId}/videos/${videoId}`);
            showSuccess('Video eliminado con éxito!');
            
            if (onMultimediaChange) {
                onMultimediaChange();
            }
        } catch (error) {
            console.error('Error deleting video:', error);
            showError('Error al eliminar video');
        }
    };

    const deleteManual = async (manualId) => {
        if (!productId) return;

        try {
            await api.delete(`/apoderado/productos/${productId}/manuales/${manualId}`);
            showSuccess('Manual eliminado con éxito!');
            
            if (onManualesChange) {
                onManualesChange();
            }
        } catch (error) {
            console.error('Error deleting manual:', error);
            showError('Error al eliminar manual');
        }
    };

    const openImagePreview = () => {
        setShowImagePreview(true);
    };

    const closeImagePreview = () => {
        setShowImagePreview(false);
    };

    return (
        <div className="multimedia-form">
            {/* Imagen Principal */}
            <div className="form-group">
                <label>Imagen Principal</label>
                <input 
                    type="file" 
                    id="imagenPrincipalFile"
                    accept=".jpg,.jpeg,.png,.gif"
                    onChange={handleImagenPrincipalChange}
                />
                {selectedImagenPrincipal && (
                    <div className="file-preview">
                        <p>Archivo seleccionado: {selectedImagenPrincipal.name}</p>
                        {productId ? (
                            <button type="button" onClick={uploadImagenPrincipal}>
                                Subir Imagen Principal
                            </button>
                        ) : (
                            <p style={{ marginTop: '8px' }}>
                                La imagen se subirá automáticamente al crear el producto.
                            </p>
                        )}
                    </div>
                )}
                
                {multimedia?.imagenPrincipal && (
                    <div className="current-media">
                        <p>Imagen principal actual:</p>
                        <div className="image-preview-container">
                            <img 
                                src={getAuthenticatedUrl(multimedia.imagenPrincipal.url)} 
                                alt="Imagen principal"
                                className="imagen-principal-thumb"
                                onClick={openImagePreview}
                                onError={(e) => {
                                    const authenticatedUrl = getAuthenticatedUrl(multimedia.imagenPrincipal.url);
                                    console.error('Error loading product image thumbnail:', {
                                        originalUrl: multimedia.imagenPrincipal.url,
                                        authenticatedUrl: authenticatedUrl,
                                        error: e
                                    });
                                    e.target.style.display = 'none';
                                }}
                                style={{ 
                                    width: '100px', 
                                    height: '100px', 
                                    objectFit: 'cover', 
                                    cursor: 'pointer',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px'
                                }}
                            />
                            <button 
                                type="button" 
                                onClick={deleteImagenPrincipal}
                                style={{ marginLeft: '10px' }}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal para previsualizar imagen */}
            {showImagePreview && multimedia?.imagenPrincipal && (
                <div className="modal-overlay" onClick={closeImagePreview}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <img 
                            src={getAuthenticatedUrl(multimedia.imagenPrincipal.url)} 
                            alt="Imagen principal"
                            style={{ 
                                maxWidth: '90%', 
                                maxHeight: '90%',
                                objectFit: 'contain'
                            }}
                        />
                        <button 
                            type="button" 
                            onClick={closeImagePreview}
                            style={{ 
                                position: 'absolute', 
                                top: '10px', 
                                right: '10px',
                                background: 'rgba(0,0,0,0.5)',
                                color: 'white',
                                border: 'none',
                                padding: '10px',
                                cursor: 'pointer'
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Imágenes Adicionales */}
            <div className="form-group">
                <label>Imágenes Adicionales</label>
                <input 
                    type="file" 
                    id="imagenesAdicionalesFile"
                    multiple 
                    accept=".jpg,.jpeg,.png,.gif"
                    onChange={handleImagenesAdicionalesChange}
                />
                {selectedImagenesAdicionales.length > 0 && (
                    <div className="file-preview">
                        <p>Archivos seleccionados: {selectedImagenesAdicionales.length}</p>
                        <ul>
                            {selectedImagenesAdicionales.map((file, index) => (
                                <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                            ))}
                        </ul>
                        <button type="button" onClick={uploadImagenesAdicionales}>
                            Subir Imágenes Adicionales
                        </button>
                    </div>
                )}
                
                {multimedia?.imagenesAdicionales && multimedia.imagenesAdicionales.length > 0 && (
                    <div className="current-media">
                        <p>Imágenes adicionales actuales:</p>
                        <div className="images-grid">
                            {multimedia.imagenesAdicionales.map((imagen, index) => (
                                <div key={imagen._id || index} className="image-item">
                                    <img 
                                        src={getAuthenticatedUrl(imagen.url)} 
                                        alt={imagen.originalName}
                                        onError={(e) => {
                                            const authenticatedUrl = getAuthenticatedUrl(imagen.url);
                                            console.error('Error loading additional image:', {
                                                originalUrl: imagen.url,
                                                authenticatedUrl: authenticatedUrl,
                                                imageName: imagen.originalName,
                                                error: e
                                            });
                                            e.target.style.display = 'none';
                                        }}
                                        style={{ 
                                            width: '80px', 
                                            height: '80px', 
                                            objectFit: 'cover',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px'
                                        }}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => deleteImagenAdicional(imagen._id)}
                                        style={{ display: 'block', marginTop: '5px' }}
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Videos */}
            <div className="form-group">
                <label>Videos (MP4, AVI, MOV, WMV - Máximo 50MB cada uno)</label>
                <input 
                    type="file" 
                    id="videosFile"
                    multiple 
                    accept=".mp4,.avi,.mov,.wmv"
                    onChange={handleVideosChange}
                />
                {selectedVideos.length > 0 && (
                    <div className="file-preview">
                        <p>Archivos seleccionados: {selectedVideos.length}</p>
                        <ul>
                            {selectedVideos.map((file, index) => (
                                <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                            ))}
                        </ul>
                        <button type="button" onClick={uploadVideos}>
                            Subir Videos
                        </button>
                    </div>
                )}
                
                {multimedia?.videos && multimedia.videos.length > 0 && (
                    <div className="current-media">
                        <p>Videos actuales:</p>
                        <div className="videos-list">
                            {multimedia.videos.map((video, index) => (
                                <div key={video._id || index} className="video-item">
                                    <div>
                                        <a href={getAuthenticatedUrl(video.url)} target="_blank" rel="noopener noreferrer">
                                            {video.originalName}
                                        </a>
                                        <button 
                                            type="button" 
                                            onClick={() => deleteVideo(video._id)}
                                            style={{ marginLeft: '10px' }}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Manuales */}
            <div className="form-group">
                <label>Manuales (PDF, DOC, DOCX, TXT, JPG, JPEG, PNG - Máximo 5 archivos, 10MB cada uno)</label>
                <input 
                    type="file" 
                    id="manualesFile"
                    multiple 
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                    onChange={handleManualesChange}
                />
                {selectedManuales.length > 0 && (
                    <div className="file-preview">
                        <p>Archivos seleccionados: {selectedManuales.length}</p>
                        <ul>
                            {selectedManuales.map((file, index) => (
                                <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                            ))}
                        </ul>
                        <button type="button" onClick={uploadManuales}>
                            Subir Manuales
                        </button>
                    </div>
                )}
                
                {manuales && manuales.length > 0 && (
                    <div className="current-media">
                        <p>Manuales actuales:</p>
                        <div className="manuales-list">
                            {manuales.map((manual, index) => (
                                <div key={manual._id || index} className="manual-item">
                                    <div>
                                        <a href={getAuthenticatedUrl(manual.url)} target="_blank" rel="noopener noreferrer">
                                            {manual.originalName}
                                        </a>
                                        <button 
                                            type="button" 
                                            onClick={() => deleteManual(manual._id)}
                                            style={{ marginLeft: '10px' }}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MultimediaForm;