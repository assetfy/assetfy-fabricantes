import getAuthenticatedUrl from '../utils/getAuthenticatedUrl';

describe('getAuthenticatedUrl utility function', () => {
    const originalEnv = process.env.REACT_APP_API_URL;

    beforeEach(() => {
        process.env.REACT_APP_API_URL = 'http://test-api.local';
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn(() => 'mock-token'),
                setItem: jest.fn(),
                removeItem: jest.fn(),
            },
            writable: true,
        });
    });

    afterEach(() => {
        process.env.REACT_APP_API_URL = originalEnv;
    });

    test('returns null for null input instead of empty string', () => {
        const result = getAuthenticatedUrl(null);
        expect(result).toBeNull();
    });

    test('returns null for undefined input instead of empty string', () => {
        const result = getAuthenticatedUrl(undefined);
        expect(result).toBeNull();
    });

    test('returns null for empty string input instead of empty string', () => {
        const result = getAuthenticatedUrl('');
        expect(result).toBeNull();
    });

    test('returns null for non-string input instead of empty string', () => {
        const result = getAuthenticatedUrl(123);
        expect(result).toBeNull();
    });

    test('returns authenticated absolute URL for relative api path', () => {
        const validUrl = '/api/apoderado/files/test.jpg';
        const result = getAuthenticatedUrl(validUrl);
        expect(result).toBe('http://test-api.local/api/apoderado/files/test.jpg?token=mock-token');
    });

    test('appends token with & if URL already has query parameters', () => {
        const urlWithQuery = '/api/files/test.jpg?existing=param';
        const result = getAuthenticatedUrl(urlWithQuery);
        expect(result).toBe('http://test-api.local/api/files/test.jpg?existing=param&token=mock-token');
    });

    test('returns original URL if no token is available', () => {
        window.localStorage.getItem.mockReturnValue(null);
        const validUrl = '/api/files/test.jpg';
        const result = getAuthenticatedUrl(validUrl);
        expect(result).toBe('http://test-api.local/api/files/test.jpg');
    });

    test('does not append token for external origins', () => {
        const externalUrl = 'https://example-bucket.s3.amazonaws.com/image.jpg?signature=abc';
        const result = getAuthenticatedUrl(externalUrl);
        expect(result).toBe(externalUrl);
    });

    test('handles marca logo proxy URLs correctly', () => {
        const logoProxyUrl = '/api/apoderado/files/bG9nb21hcmNhL01hcmNhVGVzdC9sb2dvLmpwZw==';
        const result = getAuthenticatedUrl(logoProxyUrl);
        expect(result).toBe('http://test-api.local/api/apoderado/files/bG9nb21hcmNhL01hcmNhVGVzdC9sb2dvLmpwZw==?token=mock-token');
    });
});