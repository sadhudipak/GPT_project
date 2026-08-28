export const API_BASE_URL = import.meta.env.VITE_API_URL||"http://localhost:5173";

// Wrapper around fetch that:
// - prefixes the backend base URL
// - attaches the stored JWT as a Bearer token (if present)
// - throws on non-2xx responses so callers can use try/catch consistently
export async function apiFetch(path, options = {}) {
    const token = localStorage.getItem("token");

    const headers = {
        ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers
    });

    if (response.status === 401) {
        // token missing/expired/invalid - force back to login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (window.location.pathname !== "/login") {
            window.location.href = "/login";
        }
    }

    return response;
}
