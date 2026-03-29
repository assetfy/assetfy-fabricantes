const fetch = require('node-fetch');

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_EMAIL = process.env.NOMINATIM_EMAIL || 'assetfy@example.com';

// Default coordinates: CABA, Buenos Aires
const CABA_COORDS = { lat: -34.6037, lng: -58.3816 };

// Province center coordinates cache (hardcoded for Argentina)
const PROVINCE_COORDS = {
    'Buenos Aires': { lat: -36.6769, lng: -60.5588 },
    'Ciudad Autónoma de Buenos Aires': { lat: -34.6037, lng: -58.3816 },
    'Catamarca': { lat: -28.4696, lng: -65.7852 },
    'Chaco': { lat: -26.3864, lng: -60.7658 },
    'Chubut': { lat: -43.3002, lng: -65.1023 },
    'Córdoba': { lat: -31.4201, lng: -64.1888 },
    'Corrientes': { lat: -27.4693, lng: -58.8306 },
    'Entre Ríos': { lat: -31.7413, lng: -60.5115 },
    'Formosa': { lat: -26.1775, lng: -58.1781 },
    'Jujuy': { lat: -24.1858, lng: -65.2995 },
    'La Pampa': { lat: -36.6167, lng: -64.2833 },
    'La Rioja': { lat: -29.4131, lng: -66.8559 },
    'Mendoza': { lat: -32.8908, lng: -68.8272 },
    'Misiones': { lat: -27.3621, lng: -55.8997 },
    'Neuquén': { lat: -38.9516, lng: -68.0591 },
    'Río Negro': { lat: -40.8135, lng: -63.0000 },
    'Salta': { lat: -24.7829, lng: -65.4232 },
    'San Juan': { lat: -31.5375, lng: -68.5364 },
    'San Luis': { lat: -33.3017, lng: -66.3378 },
    'Santa Cruz': { lat: -51.6226, lng: -69.2181 },
    'Santa Fe': { lat: -31.6107, lng: -60.6973 },
    'Santiago del Estero': { lat: -27.7834, lng: -64.2642 },
    'Tierra del Fuego': { lat: -54.8019, lng: -68.3030 },
    'Tucumán': { lat: -26.8083, lng: -65.2176 }
};

// Simple rate limiter: 1 request per second
let lastRequestTime = 0;

async function rateLimitedFetch(url) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < 1100) {
        await new Promise(resolve => setTimeout(resolve, 1100 - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();
    return fetch(url, {
        headers: {
            'User-Agent': 'AssetfyFabricantes/1.0 (' + NOMINATIM_EMAIL + ')'
        }
    });
}

/**
 * Geocode an address using Nominatim API.
 * Prioritizes Buenos Aires (CABA) when there's ambiguity.
 * @param {string} direccion - The address text
 * @param {string} [provincia] - Optional province to help disambiguate
 * @returns {Promise<{lat: number, lng: number}|null>}
 */
async function geocodeAddress(direccion, provincia) {
    if (!direccion) return null;

    try {
        // Build query with province if available
        let query = direccion;
        if (provincia) {
            query = `${direccion}, ${provincia}, Argentina`;
        } else {
            query = `${direccion}, Argentina`;
        }

        const params = new URLSearchParams({
            q: query,
            format: 'json',
            countrycodes: 'ar',
            limit: '5',
            email: NOMINATIM_EMAIL
        });

        const response = await rateLimitedFetch(`${NOMINATIM_BASE}?${params}`);
        const results = await response.json();

        if (!results || results.length === 0) {
            // If province was specified, try with just province for a general location
            if (provincia && PROVINCE_COORDS[provincia]) {
                console.log(`Geocoding: No results for "${direccion}", using province center for ${provincia}`);
                return PROVINCE_COORDS[provincia];
            }
            console.log(`Geocoding: No results for "${direccion}", defaulting to CABA`);
            return CABA_COORDS;
        }

        // If multiple results and no province specified, prefer CABA area
        if (results.length > 1 && !provincia) {
            const cabaResult = results.find(r =>
                r.display_name &&
                (r.display_name.includes('Ciudad Autónoma de Buenos Aires') ||
                 r.display_name.includes('Capital Federal'))
            );
            if (cabaResult) {
                return { lat: parseFloat(cabaResult.lat), lng: parseFloat(cabaResult.lon) };
            }
        }

        // Return the first (best) result
        return {
            lat: parseFloat(results[0].lat),
            lng: parseFloat(results[0].lon)
        };
    } catch (error) {
        console.error(`Geocoding error for "${direccion}":`, error.message);
        return CABA_COORDS;
    }
}

/**
 * Get the center coordinates for an Argentine province.
 * Uses hardcoded values (no API call needed).
 * @param {string} provinciaNombre - Province name
 * @returns {{lat: number, lng: number}|null}
 */
function geocodeProvince(provinciaNombre) {
    return PROVINCE_COORDS[provinciaNombre] || null;
}

module.exports = {
    geocodeAddress,
    geocodeProvince,
    PROVINCE_COORDS,
    CABA_COORDS
};
