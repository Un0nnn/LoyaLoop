import axios from "axios";

const API_BASE_URL = process.env.VITE_BACKEND_URL || "https://innovative-emotion-production-ec97.up.railway.app";
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
});

const inMemoryCache = new Map();
let authToken = null;

export function clearCache() {
    try { inMemoryCache.clear(); } catch (e) { /* ignore */ }
}

export function setAuthToken(token) {
    authToken = token;
    try {
        // Use sessionStorage instead of localStorage so tokens are not persisted across browser sessions
        if (token) sessionStorage.setItem('authToken', token);
        else sessionStorage.removeItem('authToken');
    } catch (e) { }
}

// Attach auth token from memory or sessionStorage to every request if present
apiClient.interceptors.request.use((config) => {
    try {
        const token = authToken || sessionStorage.getItem('authToken');
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (e) {
        // ignore storage errors
    }

    // Use the full request URL (including params) as cache key for GET
    if (config.method === 'get') {
        const key = config.url + (config.params ? JSON.stringify(config.params) : '');
        const cached = inMemoryCache.get(key);
        if (cached && Date.now() - cached.timestamp < 60000) {
            return Promise.reject({ __fromCache: true, data: cached.data, config });
        }
        // store the key back on config for response interceptor
        config.__cacheKey = key;
    }
    return config;
});

apiClient.interceptors.response.use((response) => {
    if (response.config?.method === 'get') {
        const key = response.config.__cacheKey || response.config.url;
        inMemoryCache.set(key, { data: response.data, timestamp: Date.now() });
    }
    return response.data;
}, async (error) => {
    if (error.__fromCache) {
        return error.data;
    }
    const config = error.config;
    if (!config || config.__retry) {
        return Promise.reject(error);
    }
    config.__retry = true;
    config.timeout = 20000;
    return apiClient(config);
});

export default apiClient;