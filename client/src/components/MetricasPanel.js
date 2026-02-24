import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

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

    // Calculate representantes metrics
    const totalRepresentantes = metricas.representantes || 0;
    const representantesActivos = metricas.estadisticas?.representantesActivos || 0;
    const representantesInactivos = metricas.estadisticas?.representantesInactivos || 0;
    const nuevosEsteMes = metricas.estadisticas?.representantesNuevosEsteMes || 0;

    return (
        <div className="metricas-panel">
            <div className="section-header">
                <h3>Resumen General</h3>
            </div>
            
            {/* Representantes Stats Row */}
            <div className="metricas-grid">
                <div className="metrica-card">
                    <div className="metrica-card-header">
                        <div className="metrica-content">
                            <h4>Total Representantes</h4>
                            <div className="metrica-numero">{totalRepresentantes}</div>
                            <Link to="/apoderado/representantes" className="metrica-link">Ver detalle →</Link>
                        </div>
                        <div className="metrica-icon">👥</div>
                    </div>
                </div>

                <div className="metrica-card">
                    <div className="metrica-card-header">
                        <div className="metrica-content">
                            <h4>Representantes Activos</h4>
                            <div className="metrica-numero">{representantesActivos}</div>
                            <Link to="/apoderado/representantes" className="metrica-link">Ver detalle →</Link>
                        </div>
                        <div className="metrica-icon">✅</div>
                    </div>
                </div>

                <div className="metrica-card">
                    <div className="metrica-card-header">
                        <div className="metrica-content">
                            <h4>Representantes Inactivos</h4>
                            <div className="metrica-numero">{representantesInactivos}</div>
                            <Link to="/apoderado/representantes" className="metrica-link">Ver detalle →</Link>
                        </div>
                        <div className="metrica-icon">❌</div>
                    </div>
                </div>

                <div className="metrica-card">
                    <div className="metrica-card-header">
                        <div className="metrica-content">
                            <h4>Nuevos Este Mes</h4>
                            <div className="metrica-numero">{nuevosEsteMes}</div>
                            <Link to="/apoderado/representantes" className="metrica-link">Ver detalle →</Link>
                        </div>
                        <div className="metrica-icon">🆕</div>
                    </div>
                </div>
            </div>

            {/* Inventory Status Section */}
            <div className="section-header" style={{ marginTop: '2rem' }}>
                <h3>Estado de Inventario</h3>
            </div>

            <div className="inventory-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
                gap: '1.5rem',
                marginTop: '1.5rem'
            }}>
                {/* Products Inventory Card */}
                <div className="inventory-card">
                    <div className="inventory-card-header">
                        <div className="inventory-card-title">
                            <span className="inventory-card-icon">📦</span>
                            Estado de inventario - Productos
                        </div>
                        <button 
                            className="inventory-create-btn"
                            onClick={() => navigate('/apoderado/productos')}
                        >
                            + Crear
                        </button>
                    </div>
                    <div className="inventory-chart-container">
                        <div style={{ textAlign: 'center', fontSize: '3rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>
                            {metricas.productos || 0}
                        </div>
                        <div style={{ textAlign: 'center', color: 'var(--text-gray)', marginTop: '0.5rem' }}>
                            Total de productos
                        </div>
                    </div>
                    <div className="inventory-legend">
                        <div className="legend-item">
                            <div className="legend-color active"></div>
                            <span className="legend-label">Activos</span>
                            <span className="legend-value">{metricas.estadisticas?.productosActivos || 0}</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-color low-stock"></div>
                            <span className="legend-label">Stock bajo</span>
                            <span className="legend-value">0</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-color no-stock"></div>
                            <span className="legend-label">Sin stock</span>
                            <span className="legend-value">{(metricas.productos || 0) - (metricas.estadisticas?.productosActivos || 0)}</span>
                        </div>
                    </div>
                    <Link to="/apoderado/productos" className="inventory-link">
                        Ver todos los productos →
                    </Link>
                </div>

                {/* Parts Inventory Card */}
                <div className="inventory-card">
                    <div className="inventory-card-header">
                        <div className="inventory-card-title">
                            <span className="inventory-card-icon">🔧</span>
                            Estado de inventario - Repuestos
                        </div>
                        <button 
                            className="inventory-create-btn"
                            onClick={() => navigate('/apoderado/piezas')}
                        >
                            + Crear
                        </button>
                    </div>
                    <div className="inventory-chart-container">
                        <div style={{ textAlign: 'center', fontSize: '3rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>
                            {metricas.piezas || 0}
                        </div>
                        <div style={{ textAlign: 'center', color: 'var(--text-gray)', marginTop: '0.5rem' }}>
                            Total de repuestos
                        </div>
                    </div>
                    <div className="inventory-legend">
                        <div className="legend-item">
                            <div className="legend-color active"></div>
                            <span className="legend-label">Activos</span>
                            <span className="legend-value">{metricas.piezas || 0}</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-color low-stock"></div>
                            <span className="legend-label">Stock bajo</span>
                            <span className="legend-value">0</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-color no-stock"></div>
                            <span className="legend-label">Sin stock</span>
                            <span className="legend-value">0</span>
                        </div>
                    </div>
                    <Link to="/apoderado/piezas" className="inventory-link">
                        Ver todos los repuestos →
                    </Link>
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