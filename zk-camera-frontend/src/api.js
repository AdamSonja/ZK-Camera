import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  timeout: 1000 * 60,
});

export const extractMetadata = (file) => {
  const formData = new FormData();
  formData.append('image', file);

  return api.post('/extract-metadata', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const generateProof = (payload) => api.post('/generate-proof', payload);

export const verifyProof = (payload) => api.post('/verify', payload);

export default api;
