// utils/warrantyUtils.js

/**
 * Calculate warranty expiration date based on a start date and duration
 * @param {Date|string} fechaInicio - Start date (purchase, registration, etc.)
 * @param {number} plazoNumero - Duration number
 * @param {string} plazoUnidad - Duration unit: 'dias', 'meses', 'años'
 * @returns {Date|null} Expiration date or null if invalid
 */
const calculateWarrantyExpiration = (fechaInicio, plazoNumero, plazoUnidad) => {
    if (!fechaInicio || !plazoNumero || !plazoUnidad) {
        return null;
    }

    const fecha = new Date(fechaInicio);

    switch (plazoUnidad) {
        case 'dias':
            fecha.setDate(fecha.getDate() + plazoNumero);
            break;
        case 'meses':
            fecha.setMonth(fecha.getMonth() + plazoNumero);
            break;
        case 'años':
            fecha.setFullYear(fecha.getFullYear() + plazoNumero);
            break;
        default:
            return null;
    }

    return fecha;
};

module.exports = { calculateWarrantyExpiration };
