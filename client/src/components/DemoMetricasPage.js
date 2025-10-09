import React from 'react';
import { NotificationProvider } from './NotificationProvider';
import logo from '../logo.png';

// Mock metrics data for demonstration
const mockMetricas = {
    fabricantes: 5,
    productos: 87,
    marcas: 23,
    inventario: 156,
    estadisticas: {
        productosActivos: 74,
        marcasActivas: 20,
        inventarioDisponible: 89,
        inventarioVendido: 67,
        inventarioRegistrado: 44
    }
};

// Demo Metrics Panel component with mock data
const DemoMetricasPanel = () => {
    const [metricas] = React.useState(mockMetricas);
    const [loading] = React.useState(false);
    const [error] = React.useState(null);

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
                </div>
            </div>
        </div>
    );
};

const DemoMetricasPage = () => {
    return (
        <NotificationProvider>
            <div style={{ 
                maxWidth: '1200px', 
                margin: '0 auto', 
                padding: '2rem',
                backgroundColor: '#f5f5f5',
                minHeight: '100vh'
            }}>
                <div style={{ 
                    textAlign: 'center', 
                    marginBottom: '2rem',
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                    <img src={logo} alt="Logo" style={{ height: '80px', marginBottom: '1rem' }} />
                    <h1 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>
                        Demo - Nueva Pestaña MÉTRICAS
                    </h1>
                    <p style={{ color: '#666', margin: 0 }}>
                        Vista previa de la nueva pestaña MÉTRICAS que se agregó antes de ADMINISTRACIÓN en el Panel de Apoderado
                    </p>
                </div>
                
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    overflow: 'hidden'
                }}>
                    <DemoMetricasPanel />
                </div>
            </div>
        </NotificationProvider>
    );
};

export default DemoMetricasPage;