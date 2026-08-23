import { api } from "../api.js";
import { formatPrice } from "../components/product-card.js";
import { store, refreshApp } from "../main.js";
import { navigate } from "../router.js";
import { showToast } from "../components/cart.js";

export async function renderAccount(container) {
    if (!store.user) {
        navigate("/login");
        return;
    }

    container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

    try {
        const orders = await api.getOrders();
        const user = store.user;

        container.innerHTML = `
            <section class="account-page">
                <div class="container">
                    <div class="account-header">
                        <div>
                            <span class="badge badge-red" style="margin-bottom:8px;">Mi Perfil</span>
                            <h1 class="section-title">Hola, <span>${user.name}</span></h1>
                            <p class="section-subtitle">Gestiona tu cuenta y revisa el historial de tus pedidos</p>
                        </div>
                        <button class="btn btn-danger-outline btn-sm" id="account-logout-btn">
                            Cerrar Sesión
                        </button>
                    </div>

                    <div class="account-grid">
                        <!-- Perfil Lateral -->
                        <aside class="glass-card account-profile-card">
                            <div class="account-avatar">
                                ${user.name.charAt(0).toUpperCase()}
                            </div>
                            <h3 class="account-user-name">${user.name}</h3>
                            <p class="account-user-email">${user.email}</p>

                            <div class="account-stats">
                                <div class="account-stat">
                                    <span class="account-stat-val">${orders.length}</span>
                                    <span class="account-stat-label">Pedidos</span>
                                </div>
                                <div class="account-stat">
                                    <span class="account-stat-val">100%</span>
                                    <span class="account-stat-label">Original</span>
                                </div>
                            </div>

                            <button class="btn btn-primary" id="account-shop-btn" style="width:100%;margin-top:20px;">
                                Ir al Catálogo
                            </button>
                        </aside>

                        <!-- Historial de Pedidos -->
                        <div class="account-orders-section">
                            <h2 class="account-section-title">Historial de Pedidos (${orders.length})</h2>

                            ${orders.length === 0 ? `
                                <div class="glass-card" style="padding:48px 24px;text-align:center;">
                                    <div style="font-size:3rem;margin-bottom:12px;">📦</div>
                                    <h3 style="font-size:1.1rem;font-weight:800;color:var(--text-primary);margin-bottom:6px;">Aún no tienes pedidos registrados</h3>
                                    <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:20px;">Cuando compres tus primeras zapatillas, podrás seguir el estado de tus compras aquí.</p>
                                    <button class="btn btn-primary btn-sm" id="empty-shop-btn">Explorar Colección</button>
                                </div>
                            ` : `
                                <div class="orders-list">
                                    ${orders.map(order => {
                                        const orderDate = new Date(order.created_at).toLocaleDateString("es-CL", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        });

                                        return `
                                            <div class="glass-card order-card">
                                                <div class="order-card-header">
                                                    <div>
                                                        <div class="order-id">Orden #CB-${String(order.id).padStart(6, "0")}</div>
                                                        <div class="order-date">${orderDate}</div>
                                                    </div>
                                                    <div style="text-align:right;">
                                                        <span class="badge ${order.status === 'confirmed' || order.status === 'completed' ? 'badge-red' : 'badge-brand'}">
                                                            ${order.status === 'pending' ? 'Preparando Despacho' : order.status}
                                                        </span>
                                                        <div class="order-total">${formatPrice(order.total)}</div>
                                                    </div>
                                                </div>

                                                <div class="order-items-grid">
                                                    ${order.items.map(item => `
                                                        <div class="order-item-chip">
                                                            <img src="${item.image_url}" alt="${item.product_name}" class="order-item-chip-img" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 50 50%22><rect fill=%22%2318182a%22 width=%2250%22 height=%2250%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%234a4a6a%22 font-size=%2215%22 text-anchor=%22middle%22 dy=%22.3em%22>👟</text></svg>'" />
                                                            <div class="order-item-chip-info">
                                                                <div class="order-item-chip-name">${item.product_name}</div>
                                                                <div class="order-item-chip-meta">Talla ${item.size} · Cant: ${item.quantity} · ${formatPrice(item.price * item.quantity)}</div>
                                                            </div>
                                                        </div>
                                                    `).join("")}
                                                </div>
                                            </div>
                                        `;
                                    }).join("")}
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </section>
        `;

        document.getElementById("account-logout-btn")?.addEventListener("click", async () => {
            try {
                await api.logout();
            } catch {}
            store.user = null;
            refreshApp();
            showToast("Sesión cerrada correctamente");
            navigate("/");
        });

        document.getElementById("account-shop-btn")?.addEventListener("click", () => navigate("/catalog"));
        document.getElementById("empty-shop-btn")?.addEventListener("click", () => navigate("/catalog"));

    } catch (err) {
        container.innerHTML = `
            <div class="container" style="text-align:center;padding:100px 0;">
                <h2 class="section-title">Error</h2>
                <p class="section-subtitle" style="margin:0 auto;">No se pudo cargar la información de la cuenta.</p>
            </div>
        `;
    }
}
