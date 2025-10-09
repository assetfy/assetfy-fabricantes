const DEFAULT_API_BASE = 'http://localhost:5000';

const normaliseBaseUrl = (url) => {
    if (!url) return DEFAULT_API_BASE;
    return url.endsWith('/') ? url.slice(0, -1) : url;
};

export const getAuthenticatedUrl = (url) => {
    if (!url || typeof url !== 'string') return null;

    const baseUrl = normaliseBaseUrl(process.env.REACT_APP_API_URL || DEFAULT_API_BASE);

    let fullUrl = url;
    if (url.startsWith('/api/')) {
        fullUrl = `${baseUrl}${url}`;
    } else if (url.startsWith('/') && !url.startsWith('//')) {
        fullUrl = `${baseUrl}${url}`;
    }

    const token = typeof window !== 'undefined' ? window.localStorage?.getItem('token') : null;
    if (!token) {
        return fullUrl;
    }

    try {
        const parsedUrl = new URL(fullUrl);
        const apiOrigin = new URL(baseUrl).origin;

        if (parsedUrl.origin !== apiOrigin) {
            return fullUrl;
        }

        parsedUrl.searchParams.set('token', token);
        return parsedUrl.toString();
    } catch (error) {
        console.warn('No se pudo procesar la URL para autenticación:', fullUrl, error);
        return fullUrl;
    }
};

export default getAuthenticatedUrl;
