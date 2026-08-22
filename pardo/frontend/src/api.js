const API_URL = "http://localhost:5000/api";

async function request(endpoint, options = {}) {
    const config = {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        ...options,
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Error en la solicitud");
    }

    return data;
}

export const api = {
    getProducts(params = {}) {
        const query = new URLSearchParams(params).toString();
        return request(`/products${query ? `?${query}` : ""}`);
    },

    getProduct(id) {
        return request(`/products/${id}`);
    },

    getBrands() {
        return request("/products/brands");
    },

    getCategories() {
        return request("/products/categories");
    },

    register(name, email, password) {
        return request("/auth/register", {
            method: "POST",
            body: JSON.stringify({ name, email, password }),
        });
    },

    login(email, password) {
        return request("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
    },

    getMe() {
        return request("/auth/me");
    },

    logout() {
        return request("/auth/logout", { method: "POST" });
    },

    getOrders() {
        return request("/orders");
    },

    createOrder(items) {
        return request("/orders", {
            method: "POST",
            body: JSON.stringify({ items }),
        });
    },
};
