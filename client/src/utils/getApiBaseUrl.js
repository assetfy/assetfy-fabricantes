// Shared utility to determine the API base URL based on environment
const getApiBaseUrl = () => {
  // If REACT_APP_API_URL is explicitly set, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // In production (not localhost/127.0.0.1), use relative URL (same domain)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('localhost')) {
      return window.location.origin;
    }
  }
  
  // In development, use localhost
  return 'http://localhost:5000';
};

export default getApiBaseUrl;
