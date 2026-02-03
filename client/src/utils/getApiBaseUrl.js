// Shared utility to determine the API base URL based on environment
const getApiBaseUrl = () => {
  // If REACT_APP_API_URL is explicitly set, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Check if we're in development environment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Development hostnames: localhost, 127.0.0.1, localhost.localdomain, etc.
    const isDevelopment = 
      hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      hostname.startsWith('localhost.');
    
    if (!isDevelopment) {
      // In production, use the same domain as the frontend
      return window.location.origin;
    }
  }
  
  // In development, use localhost
  return 'http://localhost:5000';
};

export default getApiBaseUrl;
