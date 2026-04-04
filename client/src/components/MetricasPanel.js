import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import MapaGeolocalizacion from './MapaGeolocalizacion';
import DistribucionProvincias from './DistribucionProvincias';

const RANGO_LABELS = {
    'ultima_semana': 'Última semana',
    'ultimas_2_semanas': 'Últimas 2 semanas',
    'ultimo_mes': 'Último mes',
    'ultimos_2_meses': 'Últimos 2 meses',
    'ultimos_3_meses': 'Últimos 3 meses',
    'ultimos_6_meses': 'Últimos 6 meses'
};

const MetricasPanel = () => {
    const [metricas, setMetricas] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMetricas = async () => {
            try {
                const response = await api.get('/apoderado/metricas');
                setMetricas(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error al obtener métricas:', err);
                setError('Error al cargar las métricas');
                setLoading(false);
            }
        };

        fetchMetricas();
    }, []);

    if (loading) {
        return (
            <div className="metricas-panel">
                <p>Cargando métricas...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="metricas-panel">
                <div className="error-message">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    const rangoLabel = RANGO_LABELS[metricas.rangoNuevos] || 'Último mes';

    return (
        <div className="metricas-panel">
            <div className="section-header">
                <h3>Resumen General</h3>
            </div>

            {/* New 4 Dashboard Boxes */}
            <div className="dashboard-boxes-grid">
                {/* Box 1: Clientes */}
                <div className="dashboard-box">
                    <div className="dashboard-box-title">Clientes</div>
                    <div className="dashboard-box-number">{metricas.clientes?.total || 0}</div>
                    <div className="dashboard-box-subtitle">Registrados</div>
                    <div className="dashboard-box-detail-label">Con Garantías Activas</div>
                    <div className="dashboard-box-details">
                        <div className="dashboard-box-detail-row">
                            <span className="detail-dot" style={{ backgroundColor: '#22c55e' }}></span>
                            <span className="detail-label">Nuevos Clientes</span>
                            <span className="detail-value">{metricas.clientes?.nuevos || 0}</span>
                        </div>
                        <div className="dashboard-box-detail-row">
                            <span className="detail-dot" style={{ backgroundColor: '#22c55e' }}></span>
                            <span className="detail-label">Nuevos Productos Registrados</span>
                            <span className="detail-value">{metricas.clientes?.nuevosProductosRegistrados || 0}</span>
                        </div>
                        <div className="dashboard-box-detail-row detail-row-sin-stock">
                            <span className="detail-dot" style={{ backgroundColor: '#ef4444' }}></span>
                            <span className="detail-label">Requieren Atención</span>
                            <span className="detail-value">{metricas.clientes?.requierenAtencion || 0}</span>
                        </div>
                    </div>
                    <Link to="/apoderado/garantias" className="dashboard-box-link">
                        Ver todos los productos →
                    </Link>
                </div>

                {/* Box 2: Alertas & Notificaciones */}
                <div className="dashboard-box">
                    <div className="dashboard-box-title">Alertas &amp; Notificaciones</div>
                    <div className="dashboard-box-placeholder">
                        <div className="dashboard-box-notif-links">
                            <span className="notif-link placeholder-text">Mensajes Nuevos</span>
                            <span className="notif-link placeholder-text">Mensajes Pendientes</span>
                            <span className="notif-link placeholder-text">Reclamos por Garantías</span>
                            <span className="notif-link placeholder-text">Garantías por Vencer</span>
                        </div>
                        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '12px', fontStyle: 'italic' }}>
                            Próximamente
                        </div>
                    </div>
                </div>

                {/* Box 3: Productos */}
                <div className="dashboard-box">
                    <div className="dashboard-box-title">Productos</div>
                    <div className="dashboard-box-number">{metricas.productos || 0}</div>
                    <div className="dashboard-box-subtitle">Total de productos</div>
                    <div className="dashboard-box-details">
                        <div className="dashboard-box-detail-row">
                            <span className="detail-dot" style={{ backgroundColor: '#22c55e' }}></span>
                            <span className="detail-label">Discontinuados</span>
                            <span className="detail-value">{metricas.productosDescontinuados || 0}</span>
                        </div>
                        <div className="dashboard-box-detail-row">
                            <span className="detail-dot" style={{ backgroundColor: '#f59e0b' }}></span>
                            <span className="detail-label">Bajo Stock</span>
                            <span className="detail-value">{metricas.stockBajo?.productos || 0}</span>
                        </div>
                        <div className="dashboard-box-detail-row detail-row-sin-stock">
                            <span className="detail-dot" style={{ backgroundColor: '#ef4444' }}></span>
                            <span className="detail-label">Sin Stock</span>
                            <span className="detail-value">{metricas.sinStock?.productos || 0}</span>
                        </div>
                    </div>
                    <Link to="/apoderado/productos" className="dashboard-box-link">
                        Ver todos los productos →
                    </Link>
                </div>

                {/* Box 4: Repuestos */}
                <div className="dashboard-box">
                    <div className="dashboard-box-title">Repuestos</div>
                    <div className="dashboard-box-number">{metricas.piezas || 0}</div>
                    <div className="dashboard-box-subtitle">Total de productos</div>
                    <div className="dashboard-box-details">
                        <div className="dashboard-box-detail-row">
                            <span className="detail-dot" style={{ backgroundColor: '#22c55e' }}></span>
                            <span className="detail-label">Activos</span>
                            <span className="detail-value">{metricas.piezasActivas || 0}</span>
                        </div>
                        <div className="dashboard-box-detail-row">
                            <span className="detail-dot" style={{ backgroundColor: '#f59e0b' }}></span>
                            <span className="detail-label">Stock bajo</span>
                            <span className="detail-value">{metricas.stockBajo?.piezas || 0}</span>
                        </div>
                        <div className="dashboard-box-detail-row detail-row-sin-stock">
                            <span className="detail-dot" style={{ backgroundColor: '#ef4444' }}></span>
                            <span className="detail-label">Sin stock</span>
                            <span className="detail-value">{metricas.sinStock?.piezas || 0}</span>
                        </div>
                    </div>
                    <Link to="/apoderado/piezas" className="dashboard-box-link">
                        Ver todos los productos →
                    </Link>
                </div>
            </div>

            {/* Geolocation Map Section */}
            <div className="section-header" style={{ marginTop: '2rem' }}>
                <h3>Representantes, sucursales y productos registrados</h3>
            </div>
            <div className="dashboard-map-charts-row">
                <div className="dashboard-map-column">
                    <MapaGeolocalizacion />
                </div>
                <div className="dashboard-charts-column">
                    <DistribucionProvincias />
                </div>
            </div>

            {/* Gestión de Garantías Section */}
            <div className="section-header" style={{ marginTop: '2rem' }}>
                <h3>Gestión de Garantías</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                {/* Garantías Counter Card */}
                <div className="inventory-card">
                    <div className="inventory-card-header">
                        <div className="inventory-card-title">
                            <span className="inventory-card-icon">🛡️</span>
                            Garantías Gestionadas
                        </div>
                        <button
                            className="inventory-create-btn"
                            onClick={() => navigate('/apoderado/garantias')}
                        >
                            Ver todas
                        </button>
                    </div>
                    <div className="inventory-chart-container">
                        <div style={{ textAlign: 'center', fontSize: '3rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>
                            {metricas.garantias?.total || 0}
                        </div>
                        <div style={{ textAlign: 'center', color: 'var(--text-gray)', marginTop: '0.5rem' }}>
                            Total de garantías gestionadas
                        </div>
                    </div>
                    <div className="inventory-legend">
                        <div className="legend-item">
                            <div className="legend-color active"></div>
                            <span className="legend-label">En curso</span>
                            <span className="legend-value">{metricas.garantias?.enCurso || 0}</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-color no-stock"></div>
                            <span className="legend-label">Cerradas</span>
                            <span className="legend-value">{metricas.garantias?.cerradas || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Top 5 Bienes Card */}
                <div className="inventory-card">
                    <div className="inventory-card-header">
                        <div className="inventory-card-title">
                            <span className="inventory-card-icon">🏆</span>
                            Top 5 Bienes con más Garantías
                        </div>
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                        {metricas.garantias?.top5Bienes?.length > 0 ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', color: 'var(--text-gray)', fontWeight: 600 }}>#</th>
                                        <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', color: 'var(--text-gray)', fontWeight: 600 }}>Bien</th>
                                        <th style={{ textAlign: 'right', padding: '0.4rem 0.5rem', color: 'var(--text-gray)', fontWeight: 600 }}>Garantías</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {metricas.garantias.top5Bienes.map((item, index) => (
                                        <tr key={item._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '0.5rem', color: 'var(--text-gray)' }}>{index + 1}</td>
                                            <td style={{ padding: '0.5rem', color: 'var(--text-dark)', fontWeight: 500 }}>{item.nombre}</td>
                                            <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary-color)' }}>{item.count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--text-gray)', padding: '2rem 0' }}>
                                No hay garantías registradas
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Section */}
            <div className="metricas-resumen">
                <h4>Resumen de Estado</h4>
                <div className="resumen-grid">
                    <div className="resumen-item">
                        <span className="resumen-label">Productos Activos:</span>
                        <span className="resumen-valor">{metricas.estadisticas.productosActivos} de {metricas.productos}</span>
                        <div className="resumen-barra">
                            <div
                                className="resumen-progreso productos"
                                style={{
                                    width: `${metricas.productos > 0 ? (metricas.estadisticas.productosActivos / metricas.productos) * 100 : 0}%`
                                }}
                            ></div>
                        </div>
                    </div>

                    <div className="resumen-item">
                        <span className="resumen-label">Marcas Activas:</span>
                        <span className="resumen-valor">{metricas.estadisticas.marcasActivas} de {metricas.marcas}</span>
                        <div className="resumen-barra">
                            <div
                                className="resumen-progreso marcas"
                                style={{
                                    width: `${metricas.marcas > 0 ? (metricas.estadisticas.marcasActivas / metricas.marcas) * 100 : 0}%`
                                }}
                            ></div>
                        </div>
                    </div>

                    <div className="resumen-item">
                        <span className="resumen-label">Inventario Disponible:</span>
                        <span className="resumen-valor">{metricas.estadisticas.inventarioDisponible} de {metricas.inventario}</span>
                        <div className="resumen-barra">
                            <div
                                className="resumen-progreso inventario"
                                style={{
                                    width: `${metricas.inventario > 0 ? (metricas.estadisticas.inventarioDisponible / metricas.inventario) * 100 : 0}%`
                                }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MetricasPanel;
