import React, { useState } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';

const BienRegisterForm = ({ onBienRegistered }) => {
    const { showSuccess, showError, showInfo } = useNotification();
    const [step, setStep] = useState('verificar'); // 'verificar' or 'registrar'
    const [idInventario, setIdInventario] = useState('');
    const [nombreBien, setNombreBien] = useState('');
    const [verificacionData, setVerificacionData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerificar = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/usuario/bienes/verificar', { idInventario });
            
            if (!res.data.encontrado) {
                setError('Artículo no encontrado. Verifica el ID de inventario o contacta con el fabricante.');
                showError('Artículo no encontrado');
                setVerificacionData(null);
            } else if (res.data.registradoPorOtro) {
                setError(`Este artículo ya está registrado por ${res.data.otroUsuario}. Contacta con el fabricante si crees que esto es un error.`);
                showError('Artículo ya registrado por otro usuario');
                setVerificacionData(null);
            } else {
                setVerificacionData(res.data);
                setStep('registrar');
                if (res.data.yaRegistrado) {
                    showInfo('Este artículo ya está registrado en tu cuenta. Puedes actualizar el nombre si lo deseas.');
                } else {
                    showSuccess('Artículo encontrado y disponible para registro');
                }
            }
        } catch (err) {
            console.error('Error al verificar artículo:', err);
            const errorMsg = err.response?.data?.msg || 'Error al verificar el artículo';
            setError(errorMsg);
            showError(errorMsg);
            setVerificacionData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleRegistrar = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/usuario/bienes/registrar', {
                inventarioId: verificacionData.inventarioId,
                nombreBien
            });

            showSuccess(verificacionData.yaRegistrado ? 'Bien actualizado exitosamente' : 'Bien registrado exitosamente');
            
            if (onBienRegistered) {
                onBienRegistered(res.data);
            }
        } catch (err) {
            console.error('Error al registrar bien:', err);
            const errorMsg = err.response?.data?.msg || 'Error al registrar el bien';
            setError(errorMsg);
            showError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleVolver = () => {
        setStep('verificar');
        setVerificacionData(null);
        setNombreBien('');
        setError('');
    };

    if (step === 'verificar') {
        return (
            <div className="form-container">
                <form onSubmit={handleVerificar}>
                    <div className="form-group">
                        <label>ID Assetfy del Producto *</label>
                        <input 
                            type="text" 
                            value={idInventario} 
                            onChange={(e) => setIdInventario(e.target.value)} 
                            placeholder="Ingresa el ID de inventario"
                            required 
                        />
                        <small className="form-help">
                            Este es el ID de inventario del artículo del fabricante
                        </small>
                    </div>

                    {error && <p className="error-message">{error}</p>}
                    
                    <div className="button-group">
                        <button type="submit" disabled={loading}>
                            {loading ? 'Verificando...' : 'Verificar'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="form-container">
            <div className="verification-result">
                <h4>Información del Producto</h4>
                <div className="product-details">
                    <p><strong>Modelo:</strong> {verificacionData.producto.modelo}</p>
                    <p><strong>Número de Serie:</strong> {verificacionData.producto.numeroSerie}</p>
                    <p><strong>Descripción:</strong> {verificacionData.producto.descripcion}</p>
                    {verificacionData.producto.fabricante && (
                        <p><strong>Fabricante:</strong> {verificacionData.producto.fabricante.razonSocial}</p>
                    )}
                    {verificacionData.producto.marca && (
                        <p><strong>Marca:</strong> {verificacionData.producto.marca.nombre}</p>
                    )}
                    {verificacionData.producto.garantia && (
                        <p><strong>Garantía:</strong> {verificacionData.producto.garantia.nombre} ({verificacionData.producto.garantia.duracion} {verificacionData.producto.garantia.unidad})</p>
                    )}
                </div>
            </div>

            <form onSubmit={handleRegistrar}>
                <div className="form-group">
                    <label>Nombre del Bien *</label>
                    <input 
                        type="text" 
                        value={nombreBien} 
                        onChange={(e) => setNombreBien(e.target.value)} 
                        placeholder="Asigna un nombre a este bien"
                        required 
                    />
                    <small className="form-help">
                        Puedes personalizar el nombre para identificar fácilmente este bien
                    </small>
                </div>

                {error && <p className="error-message">{error}</p>}
                
                <div className="button-group">
                    <button type="button" onClick={handleVolver} className="secondary-button">
                        Volver
                    </button>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Registrando...' : (verificacionData.yaRegistrado ? 'Actualizar' : 'Registrar Bien')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BienRegisterForm;
