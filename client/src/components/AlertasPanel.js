import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useNotification } from './NotificationProvider';
import Pagination from './Pagination';

const TIPO_LABELS = {
    'producto_registrado': 'Producto Registrado',
    'garantia_por_vencer': 'Garantía por Vencer',
    'pedido_garantia': 'Pedido de Garantía',
    'solicitud_representacion': 'Solicitud de Representación'
};

const TIPO_COLORS = {
    'producto_registrado': '#22c55e',
    'garantia_por_vencer': '#f59e0b',
    'pedido_garantia': '#3b82f6',
    'solicitud_representacion': '#8b5cf6'
};

const AlertasPanel = () => {
    const [contadores, setContadores] = useState(null);
    const [notificaciones, setNotificaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingNotificaciones, setLoadingNotificaciones] = useState(true);
    const [filtroTipo, setFiltroTipo] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [noLeidas, setNoLeidas] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const { showSuccess, showError } = useNotification();
    const navigate = useNavigate();

    const fetchContadores = async () => {
        try {
            const res = await api.get('/apoderado/alertas/contadores');
            setContadores(res.data);
        } catch (err) {
            console.error('Error al obtener contadores:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchNotificaciones = async (page = 1, tipo = '', limit = itemsPerPage) => {
        setLoadingNotificaciones(true);
        try {
            const params = { page, limit };
            if (tipo) params.tipo = tipo;
            const res = await api.get('/apoderado/alertas', { params });
            setNotificaciones(res.data.notificaciones);
            setTotalPages(res.data.totalPages);
            setTotal(res.data.total);
            setNoLeidas(res.data.noLeidas);
            setCurrentPage(res.data.page);
        } catch (err) {
            console.error('Error al obtener notificaciones:', err);
        } finally {
            setLoadingNotificaciones(false);
        }
    };

    useEffect(() => {
        fetchContadores();
        fetchNotificaciones();
    }, []);

    useEffect(() => {
        fetchNotificaciones(1, filtroTipo, itemsPerPage);
    }, [filtroTipo]);

    const handleMarcarLeida = async (id) => {
        try {
            await api.put(`/apoderado/alertas/${id}/leer`);
            setNotificaciones(prev => prev.map(n => n._id === id ? { ...n, leida: true } : n));
            setNoLeidas(prev => Math.max(0, prev - 1));
            fetchContadores();
        } catch (err) {
            showError('Error al marcar como leída');
        }
    };

    const handleMarcarNoLeida = async (id) => {
        try {
            await api.put(`/apoderado/alertas/${id}/no-leer`);
            setNotificaciones(prev => prev.map(n => n._id === id ? { ...n, leida: false } : n));
            setNoLeidas(prev => prev + 1);
            fetchContadores();
        } catch (err) {
            showError('Error al marcar como no leída');
        }
    };

    const handleMarcarTodasLeidas = async () => {
        try {
            await api.put('/apoderado/alertas/leer-todas');
            setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
            setNoLeidas(0);
            showSuccess('Todas las notificaciones marcadas como leídas');
        } catch (err) {
            showError('Error al marcar todas como leídas');
        }
    };

    const handlePageChange = (page) => {
        fetchNotificaciones(page, filtroTipo, itemsPerPage);
    };

    const handleItemsPerPageChange = (newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
        fetchNotificaciones(1, filtroTipo, newItemsPerPage);
    };

    const formatFecha = (fecha) => {
        const d = new Date(fecha);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;
        return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div className="metricas-panel">
            <div className="section-header">
                <h3>Alertas & Notificaciones</h3>
            </div>

            {/* 4 Counters */}
            <div className="dashboard-boxes-grid">
                <div className="dashboard-box">
                    <div className="dashboard-box-title">Pedidos de Garantía</div>
                    <div className="dashboard-box-number" style={{ color: '#3b82f6' }}>
                        {loading ? '...' : (contadores?.pedidosGarantia || 0)}
                    </div>
                    <div className="dashboard-box-subtitle">Nuevos sin revisar</div>
                </div>

                <div className="dashboard-box">
                    <div className="dashboard-box-title">Garantías por Vencer</div>
                    <div className="dashboard-box-number" style={{ color: '#f59e0b' }}>
                        {loading ? '...' : (contadores?.garantiasPorVencer || 0)}
                    </div>
                    <div className="dashboard-box-subtitle">Dentro del umbral configurado</div>
                </div>

                <div className="dashboard-box">
                    <div className="dashboard-box-title">Solicitudes de Representación</div>
                    <div className="dashboard-box-number" style={{ color: '#8b5cf6' }}>
                        {loading ? '...' : (contadores?.solicitudesRepresentacion || 0)}
                    </div>
                    <div className="dashboard-box-subtitle">Pendientes de revisión</div>
                </div>

                <div className="dashboard-box">
                    <div className="dashboard-box-title">Productos Registrados</div>
                    <div className="dashboard-box-number" style={{ color: '#22c55e' }}>
                        {loading ? '...' : (contadores?.productosRegistrados || 0)}
                    </div>
                    <div className="dashboard-box-subtitle">Total registrados</div>
                </div>
            </div>

            {/* Notifications Panel */}
            <div className="list-container" style={{ marginTop: '24px' }}>
                <div className="section-header" style={{ marginBottom: '16px' }}>
                    <h3 style={{ margin: 0 }}>Notificaciones</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                            value={filtroTipo}
                            onChange={e => setFiltroTipo(e.target.value)}
                            style={{ fontSize: '13px' }}
                        >
                            <option value="">Todos los tipos</option>
                            <option value="producto_registrado">Productos Registrados</option>
                            <option value="garantia_por_vencer">Garantías por Vencer</option>
                            <option value="pedido_garantia">Pedidos de Garantía</option>
                            <option value="solicitud_representacion">Solicitudes de Representación</option>
                        </select>
                        {noLeidas > 0 && (
                            <button
                                className="create-button"
                                onClick={handleMarcarTodasLeidas}
                                style={{ fontSize: '12px', padding: '6px 12px', width: 'auto' }}
                            >
                                Marcar todas como leídas
                            </button>
                        )}
                    </div>
                </div>

                {loadingNotificaciones ? (
                    <p>Cargando notificaciones...</p>
                ) : notificaciones.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                        <p>No hay notificaciones{filtroTipo ? ' de este tipo' : ''}.</p>
                    </div>
                ) : (
                    <>
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: '30px' }}></th>
                                    <th>Tipo</th>
                                    <th>Título</th>
                                    <th>Mensaje</th>
                                    <th>Fecha</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {notificaciones.map(notif => (
                                    <tr
                                        key={notif._id}
                                        style={{
                                            backgroundColor: notif.leida ? 'transparent' : '#f0f4ff',
                                            cursor: notif.tipo === 'solicitud_representacion' && notif.referencia?.id ? 'pointer' : 'default'
                                        }}
                                        onClick={() => {
                                            if (notif.tipo === 'solicitud_representacion' && notif.referencia?.id) {
                                                if (!notif.leida) handleMarcarLeida(notif._id);
                                                navigate(`/apoderado/representantes?view=solicitudes&solicitudId=${notif.referencia.id}`);
                                            }
                                        }}
                                    >
                                        <td>
                                            <span style={{
                                                display: 'inline-block',
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                backgroundColor: notif.leida ? '#d1d5db' : TIPO_COLORS[notif.tipo] || '#6b7280'
                                            }} />
                                        </td>
                                        <td style={{ fontSize: '0.82rem', color: TIPO_COLORS[notif.tipo] || '#6b7280', fontWeight: '500' }}>
                                            {TIPO_LABELS[notif.tipo] || notif.tipo}
                                        </td>
                                        <td style={{ fontWeight: notif.leida ? '400' : '600' }}>
                                            {notif.titulo}
                                        </td>
                                        <td style={{ color: '#6b7280', fontSize: '0.83rem' }}>
                                            {notif.mensaje}
                                        </td>
                                        <td style={{ fontSize: '0.82rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                                            {formatFecha(notif.createdAt)}
                                        </td>
                                        <td>
                                            {!notif.leida ? (
                                                <button
                                                    className="action-btn view-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarcarLeida(notif._id);
                                                    }}
                                                    title="Marcar como leída"
                                                >
                                                    ✓
                                                </button>
                                            ) : (
                                                <button
                                                    className="action-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarcarNoLeida(notif._id);
                                                    }}
                                                    title="Marcar como no leída"
                                                    style={{ opacity: 0.5, fontSize: '14px', padding: '2px 6px' }}
                                                >
                                                    ✉
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <Pagination
                            currentPage={currentPage}
                            totalItems={total}
                            itemsPerPage={itemsPerPage}
                            onPageChange={handlePageChange}
                            onItemsPerPageChange={handleItemsPerPageChange}
                            pageSizeOptions={[15, 25, 50]}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default AlertasPanel;
