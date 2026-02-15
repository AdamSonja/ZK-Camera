import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:4000",
});

export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append("photo", file);

  return api.post("/upload", formData);
};

export const proveQuery = (payload) =>
  api.post("/prove/query", payload);

export const verifyProof = (payload) =>
  api.post("/verify/query", payload);

export default api;