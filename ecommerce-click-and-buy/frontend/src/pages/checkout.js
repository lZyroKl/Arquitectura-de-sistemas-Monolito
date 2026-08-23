import { api } from "../api.js";
import { getCart, getCartTotal, clearCart, showToast } from "../components/cart.js";
import { formatPrice } from "../components/product-card.js";
import { store, refreshApp } from "../main.js";
import { navigate } from "../router.js";

export async function renderCheckout(container) {
    const cart = getCart();
    const total = getCartTotal();

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="container" style="text-align:center;padding:100px 0;">
                <h2 class="section-title">Carrito vacío</h2>
                <p class="section-subtitle" style="margin:0 auto;">Agrega productos antes de continuar.</p>
                <button class="btn btn-primary" id="go-catalog" style="margin-top:24px;">Ver catálogo</button>
            </div>
        `;
        document.getElementById("go-catalog").addEventListener("click", () => navigate("/catalog"));
        return;
    }

    container.innerHTML = `
        <section class="checkout-page">
            <div class="container">
                <h1 class="section-title" style="margin-bottom:32px;">Checkout</h1>
                <div class="checkout-grid">
                    <div class="checkout-items">
                        ${cart.map(item => `
                            <div class="glass-card checkout-item">
                                <div class="checkout-item-img">
                                    <img src="${item.image_url}" alt="${item.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%2318182a%22 width=%22100%22 height=%22100%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%234a4a6a%22 font-size=%2225%22 text-anchor=%22middle%22 dy=%22.3em%22>👟</text></svg>'" />
                                </div>
                                <div class="checkout-item-info">
                                    <div class="checkout-item-name">${item.name}</div>
                                    <div class="checkout-item-meta">${item.brand} · Talla ${item.size} · Cant: ${item.quantity}</div>
                                    <div class="checkout-item-price">${formatPrice(item.price * item.quantity)}</div>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                    <div class="glass-card checkout-summary">
                        <div class="checkout-summary-title">Resumen del pedido</div>
                        <div class="checkout-summary-row">
                            <span>Subtotal</span>
                            <span>${formatPrice(total)}</span>
                        </div>
                        <div class="checkout-summary-row">
                            <span>Envío</span>
                            <span style="color:var(--success);">Gratis</span>
                        </div>
                        <div class="checkout-summary-total">
                            <span>Total</span>
                            <span>${formatPrice(total)}</span>
                        </div>
                        <button class="btn btn-primary btn-lg" style="width:100%;margin-top:24px;" id="place-order-btn">
                            Confirmar pedido
                        </button>
                    </div>
                </div>
            </div>
        </section>
    `;

    document.getElementById("place-order-btn").addEventListener("click", async () => {
        if (!store.user) {
            showToast("Debes iniciar sesión para comprar", "error");
            navigate("/login");
            return;
        }

        try {
            const items = cart.map(item => ({
                product_id: item.product_id,
                size: item.size,
                quantity: item.quantity,
                price: item.price,
            }));

            await api.createOrder(items);
            clearCart();
            showToast("Pedido realizado con éxito!");

            container.innerHTML = `
                <div class="container" style="text-align:center;padding:100px 0;">
                    <div style="font-size:4rem;margin-bottom:24px;">🎉</div>
                    <h2 class="section-title">¡Pedido confirmado!</h2>
                    <p class="section-subtitle" style="margin:12px auto 36px;">Tu pedido ha sido procesado exitosamente.</p>
                    <button class="btn btn-primary btn-lg" id="continue-shopping">Seguir comprando</button>
                </div>
            `;
            document.getElementById("continue-shopping").addEventListener("click", () => navigate("/"));

        } catch (err) {
            showToast(err.message || "Error al procesar el pedido", "error");
        }
    });
}
