import axios from "axios";

const configuredBaseUrl = import.meta.env.VITE_BASEURL?.trim();
const fallbackBaseUrl = import.meta.env.PROD
  ? window.location.origin
  : "http://localhost:5000";

const api = axios.create({
  baseURL: configuredBaseUrl || fallbackBaseUrl,
});

export default api;
