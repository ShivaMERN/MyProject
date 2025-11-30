import axios from 'axios';

const instance = axios.create({
  // Use an environment variable for the base URL for better flexibility
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
  withCredentials: true,
});

// Add request logging for debugging
instance.interceptors.request.use((config) => {
  console.log('API Request:', config.method?.toUpperCase(), config.url);
  return config;
});

// Add response logging for debugging
instance.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // If we get a 401, remove the token and redirect to login.
      // We also check if we're already on the login page to prevent redirect loops.
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('userToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
