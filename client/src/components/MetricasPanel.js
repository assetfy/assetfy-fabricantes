import React, { useState, useEffect } from 'react';
import api from '../api';

const MetricasPanel = () => {
    const [metricas, setMetricas] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                <h3>Métricas</h3>
                <p>Cargando métricas...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="metricas-panel">
                <h3>Métricas</h3>
                <div className="error-message">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="metricas-panel">
            <div className="section-header">
                <h3>Métricas del Sistema</h3>
                <p>Resumen de la información disponible para el usuario logueado</p>
            </div>
            
            <div className="metricas-grid">
                <div className="metrica-card fabricantes">
                    <div className="metrica-icon">🏭</div>
                    <div className="metrica-content">
                        <h4>Fabricantes</h4>
                        <div className="metrica-numero">{metricas.fabricantes}</div>
                        <p>Total de fabricantes asociados</p>
                    </div>
                </div>

                <div className="metrica-card productos">
                    <div className="metrica-icon">📦</div>
                    <div className="metrica-content">
                        <h4>Productos</h4>
                        <div className="metrica-numero">{metricas.productos}</div>
                        <p>Total de productos registrados</p>
                        <div className="metrica-detalle">
                            <small>Activos: {metricas.estadisticas.productosActivos}</small>
                        </div>
                    </div>
                </div>

                <div className="metrica-card marcas">
                    <div className="metrica-icon">🏷️</div>
                    <div className="metrica-content">
                        <h4>Marcas</h4>
                        <div className="metrica-numero">{metricas.marcas}</div>
                        <p>Total de marcas registradas</p>
                        <div className="metrica-detalle">
                            <small>Activas: {metricas.estadisticas.marcasActivas}</small>
                        </div>
                    </div>
                </div>

                <div className="metrica-card inventario">
                    <div className="metrica-icon">📋</div>
                    <div className="metrica-content">
                        <h4>Inventario</h4>
                        <div className="metrica-numero">{metricas.inventario}</div>
                        <p>Total de artículos en inventario</p>
                        <div className="metrica-detalle">
                            <small>Disponibles: {metricas.estadisticas.inventarioDisponible}</small>
                            <small>Vendidos: {metricas.estadisticas.inventarioVendido}</small>
                        </div>
                    </div>
                </div>

                <div className="metrica-card vendidos">
                    <div className="metrica-icon">💰</div>
                    <div className="metrica-content">
                        <h4>Artículos Vendidos</h4>
                        <div className="metrica-numero">{metricas.estadisticas.inventarioVendido}</div>
                        <p>Total de artículos vendidos</p>
                        <div className="metrica-detalle">
                            <small>Vendidos: {metricas.estadisticas.inventarioVendido} de {metricas.inventario}</small>
                        </div>
                    </div>
                </div>

                <div className="metrica-card registrados">
                    <div className="metrica-icon">✅</div>
                    <div className="metrica-content">
                        <h4>Artículos Registrados</h4>
                        <div className="metrica-numero">{metricas.estadisticas.inventarioRegistrado}</div>
                        <p>{metricas.estadisticas.inventarioRegistrado} de {metricas.inventario}</p>
                        <div className="metrica-detalle">
                            <small>Vendidos: {metricas.estadisticas.inventarioVendido}, Registrados: {metricas.estadisticas.inventarioRegistrado}</small>
                        </div>
                    </div>
                </div>
            </div>

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
                    
                    <div className="resumen-item">
                        <span className="resumen-label">Artículos Vendidos:</span>
                        <span className="resumen-valor">{metricas.estadisticas.inventarioVendido} de {metricas.inventario}</span>
                        <div className="resumen-barra">
                            <div 
                                className="resumen-progreso vendidos" 
                                style={{
                                    width: `${metricas.inventario > 0 ? (metricas.estadisticas.inventarioVendido / metricas.inventario) * 100 : 0}%`
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