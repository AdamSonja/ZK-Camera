import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:4000',
  timeout: 1000 * 60,
});

export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('photo', file); // MUST match backend

  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const generateProof = (payload) => api.post('/generate-proof', payload);
export const verifyProof = (payload) => api.post('/verify', payload);

export default api;
