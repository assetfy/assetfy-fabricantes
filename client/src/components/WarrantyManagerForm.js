import React, { useState } from 'react';
import Tabs from './Tabs';

const WarrantyManagerForm = ({ 
    garantia, 
    onGarantiaChange, 
    onSubmit, 
    onCancel, 
    isEditing = false,
    fabricantes = [],
    marcas = []
}) => {
    const [formData, setFormData] = useState({
        fabricante: garantia?.fabricante?._id || garantia?.fabricante || '',
        marca: garantia?.marca?._id || garantia?.marca || '',
        nombre: garantia?.nombre || '',
        duracionNumero: garantia?.duracionNumero || '',
        duracionUnidad: garantia?.duracionUnidad || 'meses',
        fechaInicio: garantia?.fechaInicio || 'Compra',
        costoGarantia: garantia?.costoGarantia || 'Incluido',
        tipoCobertura: garantia?.tipoCobertura || [],
        partesCubiertas: garantia?.partesCubiertas || 'Producto completo',
        exclusiones: garantia?.exclusiones || [],
        limitacionesGeograficas: garantia?.limitacionesGeograficas || 'Cobertura local',
        serviciosIncluidos: garantia?.serviciosIncluidos || [],
        requiereRegistro: garantia?.requiereRegistro || false,
        comprobanteObligatorio: garantia?.comprobanteObligatorio !== false,
        usoAutorizado: garantia?.usoAutorizado || [],
        instalacionCertificada: garantia?.instalacionCertificada || false,
        mantenimientoDocumentado: garantia?.mantenimientoDocumentado || false,
        canalesReclamo: garantia?.canalesReclamo || [],
        tiempoRespuesta: garantia?.tiempoRespuesta || 'NA',
        opcionesLogistica: garantia?.opcionesLogistica || 'envío a service center',
        maximoReclamos: garantia?.maximoReclamos || 0,
        responsabilidadesCliente: garantia?.responsabilidadesCliente || [],
        pagoTraslado: garantia?.pagoTraslado || 'A cargo del cliente',
        estado: garantia?.estado || 'Activa'
    });

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        if (onGarantiaChange) {
            onGarantiaChange({ ...formData, [field]: value });
        }
    };

    const handleMultiSelectChange = (field, value, checked) => {
        const currentValues = formData[field] || [];
        let newValues;
        
        if (checked) {
            newValues = [...currentValues, value];
        } else {
            newValues = currentValues.filter(item => item !== value);
        }
        
        handleChange(field, newValues);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit(formData);
        }
    };

    // Tab 1: Datos generales
    const datosGeneralesTab = (
        <div className="warranty-tab-content">
            <div className="form-group">
                <label>Fabricante</label>
                <select
                    value={formData.fabricante}
                    onChange={(e) => handleChange('fabricante', e.target.value)}
                >
                    <option value="">Selecciona un fabricante (opcional)</option>
                    {fabricantes && fabricantes.map(fab => (
                        <option key={fab._id} value={fab._id}>{fab.razonSocial}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>Marca</label>
                <select
                    value={formData.marca}
                    onChange={(e) => handleChange('marca', e.target.value)}
                    disabled={!formData.fabricante}
                >
                    <option value="">Selecciona una marca (opcional)</option>
                    {marcas && marcas
                        .filter(marca => !formData.fabricante || marca.fabricante?._id === formData.fabricante || marca.fabricante === formData.fabricante)
                        .map(marca => (
                            <option key={marca._id} value={marca._id}>{marca.nombre}</option>
                        ))}
                </select>
            </div>

            <div className="form-group">
                <label>Nombre del plan de garantía *</label>
                <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => handleChange('nombre', e.target.value)}
                    placeholder="Ej: Garantía estándar, Garantía extendida, Garantía premium"
                    required
                />
            </div>

            <div className="form-group warranty-duration">
                <label>Duración de la cobertura *</label>
                <div className="duration-inputs">
                    <input
                        type="number"
                        min="1"
                        value={formData.duracionNumero}
                        onChange={(e) => handleChange('duracionNumero', parseInt(e.target.value) || '')}
                        placeholder="Cantidad"
                        required
                    />
                    <select
                        value={formData.duracionUnidad}
                        onChange={(e) => handleChange('duracionUnidad', e.target.value)}
                        required
                    >
                        <option value="dias">Días</option>
                        <option value="meses">Meses</option>
                        <option value="años">Años</option>
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label>Fecha de inicio</label>
                <select
                    value={formData.fechaInicio}
                    onChange={(e) => handleChange('fechaInicio', e.target.value)}
                >
                    <option value="Compra">Compra</option>
                    <option value="Registro">Registro</option>
                    <option value="Instalación">Instalación</option>
                </select>
            </div>

            <div className="form-group">
                <label>Costo de la garantía</label>
                <select
                    value={formData.costoGarantia}
                    onChange={(e) => handleChange('costoGarantia', e.target.value)}
                >
                    <option value="Incluido">Incluido</option>
                    <option value="Adicional">Adicional</option>
                </select>
            </div>
        </div>
    );

    // Tab 2: Alcance de la cobertura
    const coberturaTab = (
        <div className="warranty-tab-content">
            <div className="form-group">
                <label>Tipo de cobertura</label>
                <div className="checkbox-group">
                    {['defectos de fabricación', 'fallas eléctricas', 'desgaste normal', 'accidentes', 'robo'].map(tipo => (
                        <label key={tipo} className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.tipoCobertura.includes(tipo)}
                                onChange={(e) => handleMultiSelectChange('tipoCobertura', tipo, e.target.checked)}
                            />
                            {tipo}
                        </label>
                    ))}
                </div>
            </div>

            <div className="form-group">
                <label>Partes cubiertas</label>
                <select
                    value={formData.partesCubiertas}
                    onChange={(e) => handleChange('partesCubiertas', e.target.value)}
                >
                    <option value="Producto completo">Producto completo</option>
                    <option value="solo componentes electrónicos">Solo componentes electrónicos</option>
                    <option value="batería">Batería</option>
                    <option value="motor">Motor</option>
                    <option value="accesorios">Accesorios</option>
                </select>
            </div>

            <div className="form-group">
                <label>Exclusiones</label>
                <div className="checkbox-group">
                    {['Daños por mal uso', 'humedad', 'modificaciones no autorizadas', 'consumibles (ej. tóner, lámparas)'].map(exclusion => (
                        <label key={exclusion} className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.exclusiones.includes(exclusion)}
                                onChange={(e) => handleMultiSelectChange('exclusiones', exclusion, e.target.checked)}
                            />
                            {exclusion}
                        </label>
                    ))}
                </div>
            </div>

            <div className="form-group">
                <label>Limitaciones geográficas</label>
                <select
                    value={formData.limitacionesGeograficas}
                    onChange={(e) => handleChange('limitacionesGeograficas', e.target.value)}
                >
                    <option value="Cobertura local">Cobertura local</option>
                    <option value="regional">Regional</option>
                    <option value="internacional">Internacional</option>
                </select>
            </div>

            <div className="form-group">
                <label>Servicios incluidos</label>
                <div className="checkbox-group">
                    {['Reparación', 'reemplazo', 'reembolso', 'soporte técnico'].map(servicio => (
                        <label key={servicio} className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.serviciosIncluidos.includes(servicio)}
                                onChange={(e) => handleMultiSelectChange('serviciosIncluidos', servicio, e.target.checked)}
                            />
                            {servicio}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );

    // Tab 3: Condiciones de validez
    const condicionesTab = (
        <div className="warranty-tab-content">
            <div className="form-group form-group-checkbox">
                <label>
                    <input
                        type="checkbox"
                        checked={formData.requiereRegistro}
                        onChange={(e) => handleChange('requiereRegistro', e.target.checked)}
                    />
                    Requiere registro del producto
                </label>
            </div>

            <div className="form-group form-group-checkbox">
                <label>
                    <input
                        type="checkbox"
                        checked={formData.comprobanteObligatorio}
                        onChange={(e) => handleChange('comprobanteObligatorio', e.target.checked)}
                    />
                    Comprobante de compra obligatorio
                </label>
            </div>

            <div className="form-group">
                <label>Uso autorizado</label>
                <div className="checkbox-group">
                    {['doméstico', 'profesional', 'industrial'].map(uso => (
                        <label key={uso} className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.usoAutorizado.includes(uso)}
                                onChange={(e) => handleMultiSelectChange('usoAutorizado', uso, e.target.checked)}
                            />
                            {uso}
                        </label>
                    ))}
                </div>
            </div>

            <div className="form-group form-group-checkbox">
                <label>
                    <input
                        type="checkbox"
                        checked={formData.instalacionCertificada}
                        onChange={(e) => handleChange('instalacionCertificada', e.target.checked)}
                    />
                    Instalación certificada requerida
                </label>
            </div>

            <div className="form-group form-group-checkbox">
                <label>
                    <input
                        type="checkbox"
                        checked={formData.mantenimientoDocumentado}
                        onChange={(e) => handleChange('mantenimientoDocumentado', e.target.checked)}
                    />
                    Mantenimiento regular documentado
                </label>
            </div>
        </div>
    );

    // Tab 4: Procesos de reclamo
    const reclamosTab = (
        <div className="warranty-tab-content">
            <div className="form-group">
                <label>Canales de reclamo</label>
                <div className="checkbox-group">
                    {['Web', 'app', 'call center', 'tienda'].map(canal => (
                        <label key={canal} className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.canalesReclamo.includes(canal)}
                                onChange={(e) => handleMultiSelectChange('canalesReclamo', canal, e.target.checked)}
                            />
                            {canal}
                        </label>
                    ))}
                </div>
            </div>

            <div className="form-group">
                <label>Tiempo de respuesta garantizado</label>
                <select
                    value={formData.tiempoRespuesta}
                    onChange={(e) => handleChange('tiempoRespuesta', e.target.value)}
                >
                    <option value="NA">NA</option>
                    <option value="48 horas">48 horas</option>
                    <option value="7 días">7 días</option>
                    <option value="15 dias">15 días</option>
                    <option value="1 mes">1 mes</option>
                </select>
            </div>

            <div className="form-group">
                <label>Opciones de logística</label>
                <select
                    value={formData.opcionesLogistica}
                    onChange={(e) => handleChange('opcionesLogistica', e.target.value)}
                >
                    <option value="Retiro en domicilio">Retiro en domicilio</option>
                    <option value="envío a service center">Envío a service center</option>
                    <option value="visita técnica">Visita técnica</option>
                </select>
            </div>

            <div className="form-group">
                <label>Número máximo de reclamos</label>
                <input
                    type="number"
                    min="0"
                    value={formData.maximoReclamos}
                    onChange={(e) => handleChange('maximoReclamos', parseInt(e.target.value) || 0)}
                    placeholder="0 = ilimitado"
                />
                <small>0 = ilimitado</small>
            </div>

            <div className="form-group">
                <label>Responsabilidades del cliente</label>
                <div className="checkbox-group">
                    {['Empaque adecuado en devoluciones', 'Uso de repuestos originales'].map(resp => (
                        <label key={resp} className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.responsabilidadesCliente.includes(resp)}
                                onChange={(e) => handleMultiSelectChange('responsabilidadesCliente', resp, e.target.checked)}
                            />
                            {resp}
                        </label>
                    ))}
                </div>
            </div>

            <div className="form-group">
                <label>Pago de traslado/envío</label>
                <select
                    value={formData.pagoTraslado}
                    onChange={(e) => handleChange('pagoTraslado', e.target.value)}
                >
                    <option value="A cargo del cliente">A cargo del cliente</option>
                    <option value="Cubierto">Cubierto</option>
                </select>
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="warranty-manager-form">
            <Tabs
                tabs={[
                    {
                        label: "Datos Generales",
                        content: datosGeneralesTab
                    },
                    {
                        label: "Alcance de Cobertura", 
                        content: coberturaTab
                    },
                    {
                        label: "Condiciones de Validez",
                        content: condicionesTab
                    },
                    {
                        label: "Procesos de Reclamo",
                        content: reclamosTab
                    }
                ]}
            />
            
            <div className="form-actions">
                <button type="submit" className="submit-btn">
                    {isEditing ? 'Actualizar Garantía' : 'Crear Garantía'}
                </button>
                <button type="button" onClick={onCancel} className="cancel-btn">
                    Cancelar
                </button>
            </div>
        </form>
    );
};

export default WarrantyManagerForm;