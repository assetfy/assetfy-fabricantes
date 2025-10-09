import React from 'react';

const Pagination = ({ 
    currentPage, 
    totalItems, 
    itemsPerPage, 
    onPageChange, 
    onItemsPerPageChange,
    pageSizeOptions = [25, 50, 100]
}) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };
    
    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };
    
    if (totalItems === 0) {
        return null;
    }
    
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    return (
        <div className="pagination-container">
            <div className="pagination-info">
                Mostrando {startItem}-{endItem} de {totalItems} resultados
            </div>
            
            <div className="pagination-controls">
                <div className="page-size-selector">
                    <label>Mostrar:</label>
                    <select 
                        value={itemsPerPage} 
                        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                    >
                        {pageSizeOptions.map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                    <span>por página</span>
                </div>
                
                {totalPages > 1 && (
                    <div className="page-navigation">
                        <button 
                            onClick={handlePrevious} 
                            disabled={currentPage === 1}
                            className="pagination-button"
                        >
                            ←
                        </button>
                        
                        <span className="page-info">
                            Página {currentPage} de {totalPages}
                        </span>
                        
                        <button 
                            onClick={handleNext} 
                            disabled={currentPage === totalPages}
                            className="pagination-button"
                        >
                            →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Pagination;