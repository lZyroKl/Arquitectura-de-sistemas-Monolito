import { api } from "../api.js";
import { clearCart } from "../components/cart.js";
import { formatPrice } from "../components/product-card.js";
import { formatOrderNumber } from "../components/order-status.js";
import { navigate } from "../router.js";

function getOrderIdFromHash() {
    const query = window.location.hash.split("?")[1] || "";
    return new URLSearchParams(query).get("order");
}

const RESULT_VIEWS = {
    paid: {
        icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />`,
        color: "var(--success)",
        background: "rgba(22,163,74,0.12)",
        badge: "Pago Aprobado",
        title: "¡Muchas gracias por tu compra!",
        message: "Webpay confirmó tu pago y ya estamos preparando tus zapatillas.",
    },
    rejected: {
        icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />`,
        color: "var(--accent)",
        background: "rgba(220,38,38,0.12)",
        badge: "Pago Rechazado",
        title: "No pudimos procesar tu pago",
        message: "El banco rechazó la transacción. Tu carrito sigue intacto para que lo intentes de nuevo.",
    },
    cancelled: {
        icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />`,
        color: "var(--text-muted)",
        background: "rgba(120,120,140,0.12)",
        badge: "Pago Anulado",
        title: "Anulaste el pago",
        message: "No se realizó ningún cargo. Tu carrito sigue intacto.",
    },
};

export async function renderCheckoutResult(container) {
    const orderId = getOrderIdFromHash();
    container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

    let order = null;
    if (orderId) {
        try {
            order = await api.getOrder(orderId);
        } catch {
            order = null;
        }
    }

    const view = RESULT_VIEWS[order?.status] || RESULT_VIEWS.cancelled;
    const isPaid = order?.status === "paid";

    if (isPaid) {
        clearCart({ silent: true });
        // clearCart re-renderiza la app completa y reemplaza el <main>,
        // así que hay que volver a buscarlo para dibujar el resultado
        container = document.querySelector("main");
    }

    container.innerHTML = `
        <section class="checkout-page">
            <div class="container" style="max-width:800px;">
                <div class="glass-card" style="padding:40px;text-align:center;">
                    <div style="width:72px;height:72px;border-radius:50%;background:${view.background};border:2px solid ${view.color};display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="${view.color}" width="36" height="36">${view.icon}</svg>
                    </div>
                    <span class="badge badge-red" style="font-size:0.8rem;padding:4px 14px;margin-bottom:12px;">${view.badge}</span>
                    <h1 class="section-title" style="margin-bottom:8px;">${view.title}</h1>
                    <p style="color:var(--text-secondary);font-size:1rem;margin-bottom:24px;">${view.message}</p>

                    ${order ? `
                        <div class="confirmation-order-box">
                            <div class="confirmation-detail-row">
                                <span class="detail-label">Número de Pedido</span>
                                <strong class="detail-val" style="color:var(--accent);font-size:1.1rem;">#${formatOrderNumber(order.id)}</strong>
                            </div>
                            <div class="confirmation-detail-row">
                                <span class="detail-label">Cliente</span>
                                <span class="detail-val">${order.customer_name} (${order.customer_email})</span>
                            </div>
                            <div class="confirmation-detail-row">
                                <span class="detail-label">Dirección de Despacho</span>
                                <span class="detail-val">${order.shipping_address}, ${order.shipping_city}, ${order.shipping_region}</span>
                            </div>
                            ${isPaid ? `
                                <div class="confirmation-detail-row">
                                    <span class="detail-label">Método de Pago</span>
                                    <span class="detail-val">Webpay Plus · Tarjeta terminada en ${order.card_last4 || "****"}</span>
                                </div>
                                <div class="confirmation-detail-row">
                                    <span class="detail-label">Código de Autorización</span>
                                    <span class="detail-val">${order.authorization_code || "-"}</span>
                                </div>
                                <div class="confirmation-detail-row">
                                    <span class="detail-label">Tiempo Estimado de Entrega</span>
                                    <span class="detail-val" style="color:var(--success);font-weight:700;">24 a 48 horas hábiles 🚚</span>
                                </div>
                            ` : ""}
                            <div class="confirmation-detail-row">
                                <span class="detail-label">Envío</span>
                                <span class="detail-val">${order.shipping_cost ? formatPrice(order.shipping_cost) : "GRATIS"}</span>
                            </div>
                            <div class="confirmation-detail-row" style="border-top:1px solid var(--border-color);padding-top:14px;margin-top:10px;">
                                <span class="detail-label" style="font-size:1rem;font-weight:700;">${isPaid ? "Total Pagado" : "Total"}</span>
                                <strong class="detail-val" style="font-size:1.3rem;color:var(--accent);">${formatPrice(order.total)}</strong>
                            </div>
                        </div>
                    ` : ""}

                    <div style="display:flex;gap:14px;justify-content:center;margin-top:32px;flex-wrap:wrap;">
                        ${isPaid ? `
                            <button class="btn btn-primary btn-lg" id="result-go-account">Ver mis pedidos</button>
                            <button class="btn btn-secondary btn-lg" id="result-go-catalog">Seguir Comprando</button>
                        ` : `
                            <button class="btn btn-primary btn-lg" id="result-retry">Volver a intentar</button>
                            <button class="btn btn-secondary btn-lg" id="result-go-catalog">Seguir Comprando</button>
                        `}
                    </div>
                </div>
            </div>
        </section>
    `;

    document.getElementById("result-go-account")?.addEventListener("click", () => navigate("/account"));
    document.getElementById("result-go-catalog")?.addEventListener("click", () => navigate("/catalog"));
    document.getElementById("result-retry")?.addEventListener("click", () => navigate("/checkout"));
}
