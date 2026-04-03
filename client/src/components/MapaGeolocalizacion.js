import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

// Helper component to fly to a location and open popup
const FlyToMarker = ({ target, onDone }) => {
    const map = useMap();
    useEffect(() => {
        if (target) {
            map.flyTo([target.lat, target.lng], 15, { duration: 1.2 });
            // After fly animation, open the popup
            const timeout = setTimeout(() => {
                if (target.markerRef && target.markerRef.current) {
                    target.markerRef.current.openPopup();
                }
                onDone();
            }, 1300);
            return () => clearTimeout(timeout);
        }
    }, [target, map, onDone]);
    return null;
};

const MapaGeolocalizacion = () => {
    const [mapData, setMapData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [flyTarget, setFlyTarget] = useState(null);
    const searchRef = useRef(null);
    const markerRefs = useRef({});

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

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Get or create a marker ref by key
    const getMarkerRef = useCallback((key) => {
        if (!markerRefs.current[key]) {
            markerRefs.current[key] = React.createRef();
        }
        return markerRefs.current[key];
    }, []);

    // Build searchable index from map data
    const searchIndex = useMemo(() => {
        if (!mapData) return [];
        const items = [];

        (mapData.representantes || []).forEach(rep => {
            items.push({
                id: `rep-${rep._id}`,
                type: 'central',
                typeLabel: 'Sede Central',
                title: rep.razonSocial,
                subtitle: rep.nombre,
                address: rep.direccion,
                lat: rep.coordenadas.lat,
                lng: rep.coordenadas.lng,
                markerKey: `rep-${rep._id}`
            });

            (rep.sucursales || []).forEach((suc, idx) => {
                items.push({
                    id: `suc-${rep._id}-${idx}`,
                    type: 'sucursal',
                    typeLabel: 'Sucursal',
                    title: suc.nombre,
                    subtitle: rep.razonSocial,
                    address: suc.direccion,
                    lat: suc.coordenadas.lat,
                    lng: suc.coordenadas.lng,
                    markerKey: `suc-${rep._id}-${idx}`
                });
            });
        });

        (mapData.productosRegistrados || []).forEach(prod => {
            items.push({
                id: `prod-${prod._id}`,
                type: 'producto',
                typeLabel: 'Producto Registrado',
                title: prod.nombreProducto,
                subtitle: prod.comprador,
                address: prod.direccion + (prod.provincia ? `, ${prod.provincia}` : ''),
                lat: prod.coordenadas.lat,
                lng: prod.coordenadas.lng,
                markerKey: `prod-${prod._id}`
            });
        });

        return items;
    }, [mapData]);

    // Filter results based on query
    const filteredResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase().trim();
        return searchIndex.filter(item =>
            (item.title && item.title.toLowerCase().includes(q)) ||
            (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
            (item.address && item.address.toLowerCase().includes(q))
        ).slice(0, 8);
    }, [searchQuery, searchIndex]);

    const handleSelectResult = useCallback((item) => {
        setSearchQuery(item.title);
        setShowResults(false);
        setFlyTarget({
            lat: item.lat,
            lng: item.lng,
            markerRef: markerRefs.current[item.markerKey]
        });
    }, []);

    const handleClearFlyTarget = useCallback(() => {
        setFlyTarget(null);
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
            {/* Search bar */}
            <div className="mapa-search-wrapper" ref={searchRef}>
                <div className="mapa-search-input-container">
                    <svg className="mapa-search-icon" viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    <input
                        type="text"
                        className="mapa-search-input"
                        placeholder="Buscar representante, sucursal, dirección o usuario..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowResults(true);
                        }}
                        onFocus={() => { if (searchQuery.trim()) setShowResults(true); }}
                    />
                    {searchQuery && (
                        <button
                            className="mapa-search-clear"
                            onClick={() => { setSearchQuery(''); setShowResults(false); }}
                            title="Limpiar búsqueda"
                        >
                            &times;
                        </button>
                    )}
                </div>
                {showResults && filteredResults.length > 0 && (
                    <ul className="mapa-search-results">
                        {filteredResults.map(item => (
                            <li
                                key={item.id}
                                className="mapa-search-result-item"
                                onMouseDown={() => handleSelectResult(item)}
                            >
                                <div className="mapa-search-result-info">
                                    <span className="mapa-search-result-title">{item.title}</span>
                                    <span className="mapa-search-result-subtitle">{item.subtitle}</span>
                                    {item.address && (
                                        <span className="mapa-search-result-address">{item.address}</span>
                                    )}
                                </div>
                                <span className={`mapa-search-result-badge ${item.type}`}>{item.typeLabel}</span>
                            </li>
                        ))}
                    </ul>
                )}
                {showResults && searchQuery.trim() && filteredResults.length === 0 && (
                    <ul className="mapa-search-results">
                        <li className="mapa-search-no-results">No se encontraron resultados</li>
                    </ul>
                )}
            </div>

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

                <FlyToMarker target={flyTarget} onDone={handleClearFlyTarget} />

                {/* Representantes - Central pins (red with star) */}
                {mapData.representantes.map(rep => (
                    <React.Fragment key={rep._id}>
                        <Marker
                            ref={getMarkerRef(`rep-${rep._id}`)}
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
                                ref={getMarkerRef(`suc-${rep._id}-${idx}`)}
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
                        ref={getMarkerRef(`prod-${prod._id}`)}
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
