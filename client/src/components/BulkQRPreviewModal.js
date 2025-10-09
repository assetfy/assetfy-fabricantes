import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import Modal from './Modal';

const BulkQRPreviewModal = ({ isOpen, onClose, items }) => {
    const [qrSize, setQrSize] = useState(128); // Default size in pixels
    const [qrDataURLs, setQrDataURLs] = useState([]);
    const [loading, setLoading] = useState(false);

    // Convert pixels to mm for A4 page simulation (1px ≈ 0.264583mm at 96 DPI)
    const pixelsToMm = (pixels) => Math.round(pixels * 0.264583);
    
    // A4 dimensions in mm
    const A4_WIDTH_MM = 210;
    const A4_HEIGHT_MM = 297;
    const MARGIN_MM = 10; // Margins on each side
    
    // Calculate QR size in mm
    const qrSizeMm = pixelsToMm(qrSize);
    
    // Calculate how many QR codes fit per page
    // Each QR item includes the QR code + text information (product name, IDs)
    // We need to account for text height (approximately 30mm for 3 lines of text)
    const TEXT_HEIGHT_MM = 30;
    
    const calculateLayout = () => {
        const usableWidth = A4_WIDTH_MM - (2 * MARGIN_MM);
        const usableHeight = A4_HEIGHT_MM - (2 * MARGIN_MM);
        
        // Total height needed per QR item = QR size + text height
        const itemHeightMm = qrSizeMm + TEXT_HEIGHT_MM;
        
        const qrsPerRow = Math.floor(usableWidth / qrSizeMm);
        const qrsPerColumn = Math.floor(usableHeight / itemHeightMm);
        const qrsPerPage = qrsPerRow * qrsPerColumn;
        
        const totalPages = Math.ceil(items.length / qrsPerPage);
        
        return {
            qrsPerRow,
            qrsPerColumn,
            qrsPerPage,
            totalPages
        };
    };

    const layout = calculateLayout();

    useEffect(() => {
        const generateQRCodes = async () => {
            if (!items || items.length === 0) return;
            
            setLoading(true);
            try {
                const baseUrl = window.location.origin;
                const qrPromises = items.map(async (item) => {
                    const qrContent = `${baseUrl}/registro?idInventario=${item.idInventario}`;
                    const dataURL = await QRCode.toDataURL(qrContent, {
                        width: qrSize,
                        margin: 1
                    });
                    return {
                        dataURL,
                        item
                    };
                });
                
                const qrResults = await Promise.all(qrPromises);
                setQrDataURLs(qrResults);
            } catch (error) {
                console.error('Error generating QR codes:', error);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && items && items.length > 0) {
            generateQRCodes();
        }
    }, [isOpen, items, qrSize]);

    const handlePrint = () => {
        if (qrDataURLs.length === 0 || !items) return;

        const printWindow = window.open('', '_blank');
        const TEXT_HEIGHT_MM = 30; // Height for product info text
        
        // Create pages with QR codes
        let htmlContent = `
            <html>
            <head>
                <title>Códigos QR - Impresión Masiva</title>
                <style>
                    @page {
                        size: A4;
                        margin: ${MARGIN_MM}mm;
                    }
                    body {
                        font-family: sans-serif;
                        margin: 0;
                        padding: 0;
                    }
                    .page {
                        page-break-after: always;
                        width: ${A4_WIDTH_MM}mm;
                        height: ${A4_HEIGHT_MM}mm;
                        box-sizing: border-box;
                        padding: ${MARGIN_MM}mm;
                        display: flex;
                        flex-wrap: wrap;
                        align-content: flex-start;
                    }
                    .page:last-child {
                        page-break-after: auto;
                    }
                    .qr-item {
                        width: ${qrSizeMm}mm;
                        height: ${qrSizeMm + TEXT_HEIGHT_MM}mm;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: flex-start;
                        box-sizing: border-box;
                        padding: 2mm;
                    }
                    .qr-item .qr-code {
                        width: ${qrSizeMm}mm;
                        height: ${qrSizeMm}mm;
                        object-fit: contain;
                    }
                    .qr-item .product-info {
                        margin-top: 2mm;
                        text-align: center;
                        font-size: 8pt;
                        line-height: 1.2;
                    }
                    .qr-item .product-info h3 {
                        margin: 0 0 2mm 0;
                        font-size: 9pt;
                        font-weight: bold;
                    }
                    .qr-item .product-info p {
                        margin: 1mm 0;
                        font-size: 7pt;
                    }
                    @media print {
                        body { margin: 0; padding: 0; }
                        .page { margin: 0; }
                    }
                </style>
            </head>
            <body>
        `;

        // Split QR codes into pages
        let currentPageQRs = [];
        
        qrDataURLs.forEach((qrData, index) => {
            currentPageQRs.push(qrData);
            
            if (currentPageQRs.length === layout.qrsPerPage || index === qrDataURLs.length - 1) {
                htmlContent += `<div class="page">`;
                currentPageQRs.forEach(qr => {
                    const productName = qr.item.producto.modelo;
                    const productId = qr.item.producto.idProducto || qr.item.producto._id;
                    const inventoryId = qr.item.idInventario;
                    
                    htmlContent += `
                        <div class="qr-item">
                            <img src="${qr.dataURL}" alt="QR ${inventoryId}" class="qr-code" />
                            <div class="product-info">
                                <h3>${productName}</h3>
                                <p><strong>ID Producto:</strong> ${productId}</p>
                                <p><strong>ID Inventario:</strong> ${inventoryId}</p>
                            </div>
                        </div>
                    `;
                });
                htmlContent += `</div>`;
                
                currentPageQRs = [];
            }
        });

        htmlContent += `
                <script>
                    window.onload = () => {
                        setTimeout(() => window.print(), 500);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        onClose(); // Close modal after printing
    };

    if (!isOpen || !items || items.length === 0) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Impresión Masiva de Códigos QR">
            <div className="bulk-qr-preview-container">
                {/* Size Controls */}
                <div className="qr-size-controls">
                    <h4>Tamaño del Código QR</h4>
                    
                    <div className="size-control-group">
                        <label>Tamaño:</label>
                        <select
                            value={qrSize}
                            onChange={(e) => setQrSize(parseInt(e.target.value))}
                            className="size-select"
                        >
                            <option value="64">Muy pequeño (64px - {pixelsToMm(64)}mm)</option>
                            <option value="96">Pequeño (96px - {pixelsToMm(96)}mm)</option>
                            <option value="128">Mediano (128px - {pixelsToMm(128)}mm)</option>
                            <option value="192">Grande (192px - {pixelsToMm(192)}mm)</option>
                            <option value="256">Muy grande (256px - {pixelsToMm(256)}mm)</option>
                        </select>
                    </div>
                </div>

                {/* Layout Information */}
                <div className="layout-info">
                    <h4>Información de Impresión</h4>
                    <div className="info-grid">
                        <div className="info-item">
                            <strong>Artículos seleccionados:</strong> {items.length}
                        </div>
                        <div className="info-item">
                            <strong>Tamaño de QR:</strong> {qrSizeMm}mm × {qrSizeMm}mm
                        </div>
                        <div className="info-item">
                            <strong>QR por fila:</strong> {layout.qrsPerRow}
                        </div>
                        <div className="info-item">
                            <strong>QR por columna:</strong> {layout.qrsPerColumn}
                        </div>
                        <div className="info-item">
                            <strong>QR por página:</strong> {layout.qrsPerPage}
                        </div>
                        <div className="info-item highlight">
                            <strong>Hojas A4 necesarias:</strong> {layout.totalPages}
                        </div>
                    </div>
                </div>

                {/* A4 Page Preview */}
                <div className="a4-preview">
                    <h4>Vista previa en página A4</h4>
                    <div className="a4-page">
                        <div className="a4-grid-preview">
                            {Array.from({ length: Math.min(layout.qrsPerPage, items.length) }).map((_, index) => (
                                <div 
                                    key={index}
                                    className="a4-qr-preview-box"
                                    style={{
                                        width: `${(qrSizeMm / (A4_WIDTH_MM - 2 * MARGIN_MM)) * 100}%`,
                                        height: `${((qrSizeMm + 30) / (A4_HEIGHT_MM - 2 * MARGIN_MM)) * 100}%`
                                    }}
                                >
                                    {index < qrDataURLs.length && qrDataURLs[index] && (
                                        <>
                                            <img 
                                                src={qrDataURLs[index].dataURL} 
                                                alt={`QR preview ${index}`}
                                                className="a4-qr-image"
                                            />
                                            <div className="a4-qr-text">Info</div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="size-info">
                        Vista previa de cómo quedarán los QR codes en la primera página A4
                    </p>
                </div>

                {/* Preview */}
                <div className="bulk-qr-preview">
                    <h4>Vista Previa Detallada (primeros códigos)</h4>
                    <div className="qr-preview-grid">
                        {qrDataURLs.slice(0, Math.min(6, qrDataURLs.length)).map((qr, index) => (
                            <div key={index} className="preview-qr-item">
                                {loading ? (
                                    <div className="loading-indicator">...</div>
                                ) : (
                                    <>
                                        <img src={qr.dataURL} alt={`QR ${qr.item.idInventario}`} />
                                        <div className="preview-qr-label">
                                            <strong>{qr.item.producto.modelo}</strong><br />
                                            ID Prod: {qr.item.producto.idProducto || qr.item.producto._id}<br />
                                            ID Inv: {qr.item.idInventario}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                    {items.length > 6 && (
                        <p className="preview-note">
                            ...y {items.length - 6} código{items.length - 6 > 1 ? 's' : ''} más
                        </p>
                    )}
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
                        disabled={loading || qrDataURLs.length === 0}
                    >
                        {loading ? 'Generando...' : 'Imprimir'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default BulkQRPreviewModal;
