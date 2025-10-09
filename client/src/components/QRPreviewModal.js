import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import Modal from './Modal';

const QRPreviewModal = ({ isOpen, onClose, item }) => {
    const [qrDataURL, setQrDataURL] = useState('');
    const [qrSize, setQrSize] = useState(256); // Default size in pixels
    const [multiplier, setMultiplier] = useState(1); // Size multiplier
    const [loading, setLoading] = useState(false);

    // Convert pixels to mm for A4 page simulation (1px ≈ 0.264583mm at 96 DPI)
    const pixelsToMm = (pixels) => Math.round(pixels * 0.264583);
    
    // A4 dimensions in mm
    const A4_WIDTH_MM = 210;
    // const A4_HEIGHT_MM = 297; // Not used for now, kept for future reference
    
    // Calculate QR size in mm
    const qrSizeMm = pixelsToMm(qrSize);

    useEffect(() => {
        const generateQRCode = async () => {
            if (!item) return;
            
            setLoading(true);
            try {
                // Generate registration URL with pre-populated inventory ID
                const baseUrl = window.location.origin;
                const qrContent = `${baseUrl}/registro?idInventario=${item.idInventario}`;
                const dataURL = await QRCode.toDataURL(qrContent, {
                    width: qrSize,
                    margin: 2
                });
                setQrDataURL(dataURL);
            } catch (error) {
                console.error('Error generating QR code:', error);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && item) {
            generateQRCode();
        }
    }, [isOpen, item, qrSize]);

    const handleSizeChange = (newSize) => {
        setQrSize(newSize);
        setMultiplier(newSize / 256); // Update multiplier based on base size of 256
    };

    const handleMultiplierChange = (newMultiplier) => {
        setMultiplier(newMultiplier);
        setQrSize(Math.round(256 * newMultiplier)); // Update size based on base size of 256
    };

    const handlePrint = () => {
        if (!qrDataURL || !item) return;

        const productName = item.producto.modelo;
        const productId = item.producto.idProducto || item.producto._id;
        const inventoryId = item.idInventario;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Código QR</title>
                <style>
                    body { font-family: sans-serif; text-align: center; margin: 0; padding: 20px; }
                    .qr-container { display: inline-block; padding: 20px; border: 1px solid #ccc; border-radius: 8px; margin-top: 50px; }
                    .product-info { margin-top: 10px; }
                    .qr-code { width: ${qrSize}px; height: auto; }
                    @media print {
                        body { margin: 0; padding: 20px; }
                        .qr-container { margin-top: 20px; }
                    }
                </style>
            </head>
            <body>
                <div class="qr-container">
                    <div id="qrcode-container">
                        <img src="${qrDataURL}" alt="Código QR" class="qr-code" />
                    </div>
                    <div class="product-info">
                        <h3>${productName}</h3>
                        <p><strong>ID Producto:</strong> ${productId}</p>
                        <p><strong>ID Inventario:</strong> ${inventoryId}</p>
                    </div>
                </div>
                <script>
                    window.onload = () => {
                        setTimeout(() => window.print(), 500);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
        onClose(); // Close modal after printing
    };

    if (!isOpen || !item) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Vista Previa del Código QR">
            <div className="qr-preview-container">
                {/* Size Controls */}
                <div className="qr-size-controls">
                    <h4>Tamaño del Código QR</h4>
                    
                    {/* Slider Control */}
                    <div className="size-control-group">
                        <label>Deslizador de tamaño:</label>
                        <input
                            type="range"
                            min="128"
                            max="512"
                            step="32"
                            value={qrSize}
                            onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                            className="size-slider"
                        />
                        <span className="size-display">{qrSize}px</span>
                    </div>

                    {/* Multiplier Input */}
                    <div className="size-control-group">
                        <label>Multiplicador:</label>
                        <input
                            type="number"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={multiplier.toFixed(1)}
                            onChange={(e) => handleMultiplierChange(parseFloat(e.target.value))}
                            className="multiplier-input"
                        />
                        <span className="size-info">({qrSizeMm}mm × {qrSizeMm}mm)</span>
                    </div>
                </div>

                {/* A4 Page Preview */}
                <div className="a4-preview">
                    <h4>Vista previa en página A4</h4>
                    <div className="a4-page">
                        <div 
                            className="qr-preview-box"
                            style={{
                                width: `${(qrSizeMm / A4_WIDTH_MM) * 100}%`,
                                paddingBottom: `${(qrSizeMm / A4_WIDTH_MM) * 100}%`
                            }}
                        >
                            {loading ? (
                                <div className="loading-indicator">Generando...</div>
                            ) : (
                                qrDataURL && (
                                    <img 
                                        src={qrDataURL} 
                                        alt="Vista previa QR" 
                                        className="qr-preview-image"
                                    />
                                )
                            )}
                        </div>
                    </div>
                    <p className="size-info">
                        Tamaño aproximado: {qrSizeMm}mm × {qrSizeMm}mm en papel A4
                    </p>
                </div>

                {/* Product Information */}
                <div className="product-info-preview">
                    <h4>Información del Producto</h4>
                    <p><strong>Producto:</strong> {item.producto.modelo}</p>
                    <p><strong>ID Producto:</strong> {item.producto.idProducto || item.producto._id}</p>
                    <p><strong>ID Inventario:</strong> {item.idInventario}</p>
                </div>

                {/* Action Buttons */}
                <div className="qr-modal-actions">
                    <button 
                        className="btn-secondary" 
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                    <button 
                        className="btn-primary" 
                        onClick={handlePrint}
                        disabled={loading || !qrDataURL}
                    >
                        {loading ? 'Generando...' : 'Imprimir'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default QRPreviewModal;