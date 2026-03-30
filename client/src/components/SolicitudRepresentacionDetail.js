import React, { useState } from 'react';
import api from '../api';

const ESTADO_COLORS = {
    'En Evaluación': '#3b82f6',
    'Aceptada': '#22c55e',
    'Rechazada': '#ef4444'
};

const SolicitudRepresentacionDetail = ({ solicitud, onClose, onUpdated, onAccepted }) => {
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [nuevoEstado, setNuevoEstado] = useState(solicitud.estado);
    const [comentarioRechazo, setComentarioRechazo] = useState(solicitud.comentarioRechazo || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleEnviarMensaje = async () => {
        if (!nuevoMensaje.trim()) {
            setError('El mensaje no puede estar vacío');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await api.post(`/apoderado/solicitudes-representacion/${solicitud._id}/mensaje`, {
                contenido: nuevoMensaje
            });
            setNuevoMensaje('');
            if (onUpdated) onUpdated(res.data.solicitud);
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al enviar el mensaje');
        } finally {
            setLoading(false);
        }
    };

    const handleCambiarEstado = async () => {
        if (nuevoEstado === solicitud.estado) return;
        if (nuevoEstado === 'Rechazada' && !comentarioRechazo.trim()) {
            setError('Debe ingresar un comentario al rechazar la solicitud');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await api.put(`/apoderado/solicitudes-representacion/${solicitud._id}`, {
                estado: nuevoEstado,
                comentarioRechazo: nuevoEstado === 'Rechazada' ? comentarioRechazo : undefined
            });
            if (nuevoEstado === 'Aceptada' && onAccepted) {
                onAccepted(res.data.solicitud);
            } else {
                if (onUpdated) onUpdated(res.data.solicitud);
            }
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al cambiar el estado');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('es-AR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const estadoColor = ESTADO_COLORS[solicitud.estado] || '#6c757d';

    return (
        <div className="pedido-garantia-detail">
            <div className="pedido-header" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        backgroundColor: estadoColor,
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '13px'
                    }}>
                        {solicitud.estado}
                    </span>
                    <span style={{ color: '#666', fontSize: '13px' }}>
                        Creado: {formatDate(solicitud.createdAt)}
                    </span>
                    <span style={{ color: '#666', fontSize: '13px' }}>
                        ID: {solicitud._id.toString().slice(-6).toUpperCase()}
                    </span>
                </div>

                {/* Applicant Information */}
                <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0'
                }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Datos del Solicitante</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div><strong>Razón Social:</strong> {solicitud.razonSocial}</div>
                        <div><strong>Nombre:</strong> {solicitud.nombre}</div>
                        <div><strong>CUIT:</strong> {solicitud.cuit}</div>
                        <div><strong>Correo:</strong> {solicitud.correo}</div>
                        <div><strong>Teléfono:</strong> {solicitud.telefono}</div>
                        {solicitud.provincia && <div><strong>Provincia:</strong> {solicitud.provincia}</div>}
                        {solicitud.direccion && (
                            <div style={{ gridColumn: '1 / -1' }}><strong>Dirección:</strong> {solicitud.direccion}</div>
                        )}
                    </div>
                    {solicitud.mensaje && (
                        <div style={{ marginTop: '12px' }}>
                            <strong>Mensaje inicial:</strong>
                            <p style={{ margin: '4px 0', color: '#444' }}>{solicitud.mensaje}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Message Thread */}
            <div className="pedido-mensajes" style={{
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '16px',
                maxHeight: '300px',
                overflowY: 'auto',
                backgroundColor: '#f9f9f9',
                marginBottom: '16px'
            }}>
                <h4 style={{ margin: '0 0 12px 0' }}>Historial de mensajes</h4>
                {(!solicitud.mensajes || solicitud.mensajes.length === 0) ? (
                    <p style={{ color: '#888', fontSize: '14px' }}>Sin mensajes aún.</p>
                ) : (
                    solicitud.mensajes.map((msg, idx) => (
                        <div key={idx} style={{
                            marginBottom: '12px',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            backgroundColor: msg.autor === 'fabricante' ? '#e3f2fd' : '#fff',
                            border: '1px solid',
                            borderColor: msg.autor === 'fabricante' ? '#90caf9' : '#e0e0e0'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <strong style={{ fontSize: '13px', color: msg.autor === 'fabricante' ? '#1565c0' : '#6d28d9' }}>
                                    {msg.autor === 'fabricante' ? `🏭 ${msg.autorNombre || 'Fabricante'}` : `👤 ${msg.autorNombre || 'Solicitante'}`}
                                </strong>
                                <span style={{ fontSize: '12px', color: '#888' }}>{formatDate(msg.fecha)}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>{msg.contenido}</p>
                        </div>
                    ))
                )}
            </div>

            {/* Message Input */}
            {solicitud.estado !== 'Rechazada' && (
                <div className="pedido-respuesta" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                        Enviar mensaje al solicitante
                    </label>
                    <textarea
                        value={nuevoMensaje}
                        onChange={(e) => setNuevoMensaje(e.target.value)}
                        placeholder="Escriba su mensaje..."
                        rows={3}
                        style={{ width: '100%', boxSizing: 'border-box', marginBottom: '8px' }}
                    />
                    {error && <p style={{ color: 'red', margin: '4px 0' }}>{error}</p>}
                    <button
                        className="create-button"
                        onClick={handleEnviarMensaje}
                        disabled={loading || !nuevoMensaje.trim()}
                    >
                        {loading ? 'Enviando...' : 'Enviar mensaje'}
                    </button>
                </div>
            )}

            {/* Status Management */}
            <div className="pedido-estado" style={{ borderTop: '1px solid #e0e0e0', paddingTop: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                    Cambiar estado
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                        value={nuevoEstado}
                        onChange={(e) => {
                            setNuevoEstado(e.target.value);
                            setError('');
                        }}
                    >
                        <option value="En Evaluación">En Evaluación</option>
                        <option value="Aceptada">Aceptada</option>
                        <option value="Rechazada">Rechazada</option>
                    </select>
                    <button
                        className="create-button"
                        onClick={handleCambiarEstado}
                        disabled={loading || nuevoEstado === solicitud.estado}
                    >
                        {loading ? 'Guardando...' : 'Guardar estado'}
                    </button>
                </div>

                {nuevoEstado === 'Rechazada' && (
                    <div style={{ marginTop: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '13px' }}>
                            Comentarios de rechazo (obligatorio)
                        </label>
                        <textarea
                            value={comentarioRechazo}
                            onChange={(e) => setComentarioRechazo(e.target.value)}
                            placeholder="Indique los motivos del rechazo..."
                            rows={3}
                            style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
                )}

                {solicitud.estado === 'Rechazada' && solicitud.comentarioRechazo && (
                    <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px'
                    }}>
                        <strong style={{ fontSize: '13px', color: '#dc2626' }}>Motivo del rechazo:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#333' }}>{solicitud.comentarioRechazo}</p>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <button className="cancel-button" onClick={onClose}>
                    Cerrar
                </button>
            </div>
        </div>
    );
};

export default SolicitudRepresentacionDetail;
