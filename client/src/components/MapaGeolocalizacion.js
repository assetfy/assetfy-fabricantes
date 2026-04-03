import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../api';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue with webpack/react
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons using SVG data URIs
const createSvgIcon = (color, hasStarOrLabel) => {
    const svg = hasStarOrLabel
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42">
            <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.7 23.3 0 15 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
            <polygon points="15,6 17.4,11.8 23.5,12.2 18.8,16.2 20.3,22 15,18.8 9.7,22 11.2,16.2 6.5,12.2 12.6,11.8" fill="#FFD700" stroke="#fff" stroke-width="0.5"/>
           </svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="35" viewBox="0 0 25 35">
            <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.8 12.5 22.5 12.5 22.5S25 21.3 25 12.5C25 5.6 19.4 0 12.5 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
            <circle cx="12.5" cy="12.5" r="5" fill="#fff"/>
           </svg>`;

    return L.divIcon({
        html: svg,
        className: 'custom-map-marker',
        iconSize: hasStarOrLabel ? [30, 42] : [25, 35],
        iconAnchor: hasStarOrLabel ? [15, 42] : [12.5, 35],
        popupAnchor: [0, hasStarOrLabel ? -42 : -35]
    });
};

const iconRepresentanteCentral = createSvgIcon('#DC2626', true);  // Red with star
const iconSucursal = createSvgIcon('#DC2626', false);              // Red normal (sucursal)
const iconProducto = createSvgIcon('#2563EB', false);              // Blue

const MapaGeolocalizacion = () => {
    const [mapData, setMapData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMapData = async () => {
            try {
                const response = await api.get('/apoderado/mapa');
                setMapData(response.data);
            } catch (err) {
                console.error('Error al obtener datos del mapa:', err);
                setError('Error al cargar datos del mapa');
            } finally {
                setLoading(false);
            }
        };
        fetchMapData();
    }, []);

    if (loading) {
        return (
            <div className="mapa-container">
                <p>Cargando mapa...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mapa-container">
                <p className="error-message">{error}</p>
            </div>
        );
    }

    const hasData = mapData &&
        ((mapData.representantes && mapData.representantes.length > 0) ||
         (mapData.productosRegistrados && mapData.productosRegistrados.length > 0));

    if (!hasData) {
        return (
            <div className="mapa-container">
                <div style={{ textAlign: 'center', color: 'var(--text-gray)', padding: '3rem 0' }}>
                    No hay datos de geolocalización disponibles.
                    <br />
                    <small>Los datos aparecerán cuando se registren productos con dirección o se creen representantes.</small>
                </div>
            </div>
        );
    }

    return (
        <div className="mapa-container">
            <MapContainer
                center={[-38.4, -63.6]}
                zoom={4}
                style={{ height: '500px', width: '100%', borderRadius: '8px' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Representantes - Central pins (red with star) */}
                {mapData.representantes.map(rep => (
                    <React.Fragment key={rep._id}>
                        <Marker
                            position={[rep.coordenadas.lat, rep.coordenadas.lng]}
                            icon={iconRepresentanteCentral}
                        >
                            <Popup>
                                <div className="mapa-popup">
                                    <strong>{rep.razonSocial}</strong>
                                    <br />
                                    <span style={{ color: '#666' }}>{rep.nombre}</span>
                                    <br />
                                    <small>{rep.direccion}</small>
                                    <br />
                                    <span className="mapa-popup-badge central">Sede Central</span>
                                    {rep.cobertura && rep.cobertura.length > 0 && (
                                        <div style={{ marginTop: '6px', fontSize: '12px' }}>
                                            <strong>Áreas de Cobertura:</strong>
                                            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                                {rep.cobertura.map((prov, idx) => (
                                                    <li key={idx}>{prov}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>

                        {/* Sucursal pins (red normal) */}
                        {(rep.sucursales || []).map((suc, idx) => (
                            <Marker
                                key={`${rep._id}-suc-${idx}`}
                                position={[suc.coordenadas.lat, suc.coordenadas.lng]}
                                icon={iconSucursal}
                            >
                                <Popup>
                                    <div className="mapa-popup">
                                        <strong>{rep.razonSocial}</strong>
                                        <br />
                                        <span style={{ color: '#666' }}>{suc.nombre}</span>
                                        <br />
                                        <small>{suc.direccion}</small>
                                        <br />
                                        <span className="mapa-popup-badge sucursal">Sucursal</span>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </React.Fragment>
                ))}

                {/* Productos registrados - Blue pins */}
                {mapData.productosRegistrados.map(prod => (
                    <Marker
                        key={prod._id}
                        position={[prod.coordenadas.lat, prod.coordenadas.lng]}
                        icon={iconProducto}
                    >
                        <Popup>
                            <div className="mapa-popup">
                                <strong>{prod.nombreProducto}</strong>
                                <br />
                                <span style={{ color: '#666' }}>{prod.comprador}</span>
                                <br />
                                <small>{prod.direccion}{prod.provincia ? `, ${prod.provincia}` : ''}</small>
                                <br />
                                <span className="mapa-popup-badge producto">Producto Registrado</span>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Legend */}
            <div className="mapa-leyenda">
                <div className="mapa-leyenda-item">
                    <span className="mapa-leyenda-dot central-star"></span>
                    Sede Central
                </div>
                <div className="mapa-leyenda-item">
                    <span className="mapa-leyenda-dot sucursal"></span>
                    Sucursal
                </div>
                <div className="mapa-leyenda-item">
                    <span className="mapa-leyenda-dot producto"></span>
                    Producto Registrado
                </div>
            </div>
        </div>
    );
};

export default MapaGeolocalizacion;
