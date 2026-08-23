import { api } from "../api.js";
import { getCart, getCartTotal, clearCart, showToast, FREE_SHIPPING_THRESHOLD } from "../components/cart.js";
import { formatPrice } from "../components/product-card.js";
import { store, refreshApp } from "../main.js";
import { navigate } from "../router.js";

const SHIPPING_COST_FLAT = 4990;

export async function renderCheckout(container) {
    const cart = getCart();
    const subtotal = getCartTotal();

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="container" style="text-align:center;padding:100px 0;">
                <div style="font-size:3.5rem;margin-bottom:16px;">🛒</div>
                <h2 class="section-title">Tu carrito está vacío</h2>
                <p class="section-subtitle" style="margin:8px auto 24px;">Agrega tus zapatillas favoritas antes de proceder al pago.</p>
                <button class="btn btn-primary btn-lg" id="go-catalog">Explorar Catálogo</button>
            </div>
        `;
        document.getElementById("go-catalog")?.addEventListener("click", () => navigate("/catalog"));
        return;
    }

    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
    const shippingCost = isFreeShipping ? 0 : SHIPPING_COST_FLAT;
    const totalOrder = subtotal + shippingCost;

    let selectedPayment = "webpay";
    let isSubmitting = false;

    const user = store.user;

    container.innerHTML = `
        <section class="checkout-page">
            <div class="container">
                <div style="margin-bottom:28px;">
                    <button class="btn btn-secondary btn-sm" id="checkout-back-btn" style="margin-bottom:14px;">
                        ← Volver al catálogo
                    </button>
                    <h1 class="section-title">Finalizar <span>Compra</span></h1>
                    <p class="section-subtitle">Completa tus datos de envío y selecciona tu método de pago</p>
                </div>

                <div class="checkout-grid">
                    <!-- Formulario de Checkout -->
                    <form id="checkout-form" class="checkout-main-form">
                        
                        <!-- Paso 1: Datos de Contacto y Envío -->
                        <div class="glass-card checkout-section-card">
                            <div class="checkout-step-header">
                                <div class="step-badge">1</div>
                                <div>
                                    <h3 class="checkout-step-title">Datos de Contacto y Despacho</h3>
                                    <p class="checkout-step-desc">Ingresa dónde deseas recibir tus zapatillas</p>
                                </div>
                            </div>

                            ${!user ? `
                                <div class="checkout-auth-alert">
                                    <span>¿Ya tienes cuenta en Click&Buy?</span>
                                    <a id="checkout-login-link" style="color:var(--accent);font-weight:700;cursor:pointer;text-decoration:underline;margin-left:6px;">Inicia sesión aquí</a>
                                </div>
                            ` : `
                                <div class="checkout-auth-alert success">
                                    <span>Comprando como <strong>${user.name}</strong> (${user.email})</span>
                                </div>
                            `}

                            <div class="form-row-2">
                                <div class="form-group">
                                    <label class="form-label" for="cust-name">Nombre y Apellidos *</label>
                                    <input type="text" class="input-field" id="cust-name" placeholder="Ej: Juan Pérez" value="${user?.name || ''}" required />
                                </div>
                                <div class="form-group">
                                    <label class="form-label" for="cust-rut">RUT / Identificación *</label>
                                    <input type="text" class="input-field" id="cust-rut" placeholder="Ej: 19.876.543-2" required />
                                </div>
                            </div>

                            <div class="form-row-2">
                                <div class="form-group">
                                    <label class="form-label" for="cust-email">Correo Electrónico *</label>
                                    <input type="email" class="input-field" id="cust-email" placeholder="tu@email.com" value="${user?.email || ''}" required />
                                </div>
                                <div class="form-group">
                                    <label class="form-label" for="cust-phone">Teléfono de Contacto *</label>
                                    <input type="tel" class="input-field" id="cust-phone" placeholder="+56 9 1234 5678" required />
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="cust-address">Dirección de Entrega (Calle, Número, Depto) *</label>
                                <input type="text" class="input-field" id="cust-address" placeholder="Ej: Av. Providencia 1234, Depto 402" required />
                            </div>

                            <div class="form-row-2">
                                <div class="form-group">
                                    <label class="form-label" for="cust-region">Región *</label>
                                    <select class="input-field" id="cust-region" required>
                                        <option value="Región Metropolitana">Región Metropolitana</option>
                                        <option value="Región de Valparaíso">Región de Valparaíso</option>
                                        <option value="Región del Biobío">Región del Biobío</option>
                                        <option value="Región de Coquimbo">Región de Coquimbo</option>
                                        <option value="Región de Antofagasta">Región de Antofagasta</option>
                                        <option value="Región de Los Lagos">Región de Los Lagos</option>
                                        <option value="Otra Región">Otra Región</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label" for="cust-city">Ciudad / Comuna *</label>
                                    <input type="text" class="input-field" id="cust-city" placeholder="Ej: Santiago, Providencia, Viña del Mar" required />
                                </div>
                            </div>

                            <div class="form-group" style="margin-bottom:0;">
                                <label class="form-label" for="cust-notes">Notas o Indicaciones de entrega (Opcional)</label>
                                <input type="text" class="input-field" id="cust-notes" placeholder="Ej: Dejar en conserjería si no contesto el timbre" />
                            </div>
                        </div>

                        <!-- Paso 2: Método de Pago -->
                        <div class="glass-card checkout-section-card" style="margin-top:24px;">
                            <div class="checkout-step-header">
                                <div class="step-badge">2</div>
                                <div>
                                    <h3 class="checkout-step-title">Método de Pago Seguro</h3>
                                    <p class="checkout-step-desc">Transacciones encriptadas y 100% protegidas</p>
                                </div>
                            </div>

                            <div class="payment-options-grid">
                                <label class="payment-option-card active" data-payment="webpay">
                                    <input type="radio" name="payment_method" value="webpay" checked />
                                    <div class="payment-option-body">
                                        <div class="payment-option-header">
                                            <span class="payment-option-title">Webpay Plus / Tarjetas</span>
                                            <span class="badge badge-red">Más rápido</span>
                                        </div>
                                        <p class="payment-option-desc">Tarjetas de Débito (Redcompra), Crédito (Visa, Mastercard, AMEX) y Prepago.</p>
                                    </div>
                                </label>

                                <label class="payment-option-card" data-payment="transfer">
                                    <input type="radio" name="payment_method" value="transfer" />
                                    <div class="payment-option-body">
                                        <div class="payment-option-header">
                                            <span class="payment-option-title">Transferencia Bancaria</span>
                                        </div>
                                        <p class="payment-option-desc">Transfiere directamente desde tu banco. Envío de comprobante automático.</p>
                                    </div>
                                </label>

                                <label class="payment-option-card" data-payment="mercadopago">
                                    <input type="radio" name="payment_method" value="mercadopago" />
                                    <div class="payment-option-body">
                                        <div class="payment-option-header">
                                            <span class="payment-option-title">Mercado Pago / MACH</span>
                                        </div>
                                        <p class="payment-option-desc">Paga con saldo en tu cuenta o cuotas sin interés con Mercado Pago.</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </form>

                    <!-- Resumen Lateral del Pedido -->
                    <aside class="glass-card checkout-summary">
                        <h3 class="checkout-summary-title">Resumen de tu Pedido</h3>
                        
                        <div class="checkout-summary-items">
                            ${cart.map(item => `
                                <div class="checkout-summary-item">
                                    <div class="checkout-summary-item-img">
                                        <img src="${item.image_url}" alt="${item.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 80 80%22><rect fill=%22%2318182a%22 width=%2280%22 height=%2280%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%234a4a6a%22 font-size=%2220%22 text-anchor=%22middle%22 dy=%22.3em%22>👟</text></svg>'" />
                                        <span class="item-qty-badge">${item.quantity}</span>
                                    </div>
                                    <div class="checkout-summary-item-info">
                                        <div class="checkout-summary-item-name">${item.name}</div>
                                        <div class="checkout-summary-item-meta">${item.brand} · Talla ${item.size}</div>
                                        <div class="checkout-summary-item-price">${formatPrice(item.price * item.quantity)}</div>
                                    </div>
                                </div>
                            `).join("")}
                        </div>

                        <div class="checkout-breakdown">
                            <div class="checkout-summary-row">
                                <span>Subtotal</span>
                                <span>${formatPrice(subtotal)}</span>
                            </div>
                            <div class="checkout-summary-row">
                                <span>Costo de Envío</span>
                                <span style="${isFreeShipping ? 'color:var(--success);font-weight:700;' : ''}">
                                    ${isFreeShipping ? 'GRATIS' : formatPrice(shippingCost)}
                                </span>
                            </div>
                            ${!isFreeShipping ? `
                                <div style="font-size:0.75rem;color:var(--accent);margin-top:-4px;margin-bottom:8px;">
                                    ¡Agrega ${formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} más para envío gratis!
                                </div>
                            ` : ""}
                            <div class="checkout-summary-total">
                                <span>Total a Pagar</span>
                                <span>${formatPrice(totalOrder)}</span>
                            </div>
                        </div>

                        <button type="submit" form="checkout-form" class="btn btn-primary btn-lg" style="width:100%;margin-top:20px;" id="submit-order-btn">
                            Pagar ${formatPrice(totalOrder)}
                        </button>

                        <div class="checkout-guarantee">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                            <span>Garantía de originalidad y compra 100% protegida</span>
                        </div>
                    </aside>
                </div>
            </div>
        </section>
    `;

    document.getElementById("checkout-back-btn")?.addEventListener("click", () => navigate("/catalog"));

    document.getElementById("checkout-login-link")?.addEventListener("click", () => {
        navigate("/login");
    });

    // Payment Option selection handlers
    document.querySelectorAll(".payment-option-card").forEach((card) => {
        card.addEventListener("click", () => {
            document.querySelectorAll(".payment-option-card").forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            const radio = card.querySelector("input[type='radio']");
            if (radio) {
                radio.checked = true;
                selectedPayment = radio.value;
            }
        });
    });

    // Form Submit Handler
    const form = document.getElementById("checkout-form");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (isSubmitting) return;

            const submitBtn = document.getElementById("submit-order-btn");
            isSubmitting = true;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<span class="spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;margin-right:8px;"></span> Procesando pedido...`;
            }

            const customerName = document.getElementById("cust-name").value;
            const customerEmail = document.getElementById("cust-email").value;
            const customerAddress = document.getElementById("cust-address").value;
            const customerCity = document.getElementById("cust-city").value;
            const customerRegion = document.getElementById("cust-region").value;

            // If not logged in, auto-authenticate or login with a guest account so backend creates order
            if (!store.user) {
                try {
                    // Try auto login or register guest account
                    const guestPassword = "guestPassword2026!";
                    let authUser;
                    try {
                        authUser = await api.login(customerEmail, guestPassword);
                    } catch {
                        authUser = await api.register(customerName, customerEmail, guestPassword);
                    }
                    store.user = authUser;
                    refreshApp();
                } catch (authErr) {
                    // If credentials error, tell user to login
                    showToast("Por favor inicia sesión para continuar tu compra", "error");
                    isSubmitting = false;
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = `Pagar ${formatPrice(totalOrder)}`;
                    }
                    navigate("/login");
                    return;
                }
            }

            try {
                const items = cart.map(item => ({
                    product_id: item.product_id,
                    size: item.size,
                    quantity: item.quantity,
                    price: item.price,
                }));

                const order = await api.createOrder(items);
                const orderNumber = `CB-${order.id ? String(order.id).padStart(6, "0") : Math.floor(100000 + Math.random() * 900000)}`;

                clearCart();
                showToast("¡Pedido realizado con éxito!");

                // Render Confirmation View
                container.innerHTML = `
                    <section class="checkout-page">
                        <div class="container" style="max-width:800px;">
                            <div class="glass-card" style="padding:40px;text-align:center;">
                                <div style="width:72px;height:72px;border-radius:50%;background:rgba(22,163,74,0.12);border:2px solid var(--success);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="var(--success)" width="36" height="36"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                </div>
                                <span class="badge badge-red" style="font-size:0.8rem;padding:4px 14px;margin-bottom:12px;">Pedido Confirmado</span>
                                <h1 class="section-title" style="margin-bottom:8px;">¡Muchas gracias por tu compra!</h1>
                                <p style="color:var(--text-secondary);font-size:1rem;margin-bottom:24px;">Hemos recibido tu pedido correctamente y ya estamos preparando tus zapatillas.</p>

                                <div class="confirmation-order-box">
                                    <div class="confirmation-detail-row">
                                        <span class="detail-label">Número de Pedido</span>
                                        <strong class="detail-val" style="color:var(--accent);font-size:1.1rem;">#${orderNumber}</strong>
                                    </div>
                                    <div class="confirmation-detail-row">
                                        <span class="detail-label">Cliente</span>
                                        <span class="detail-val">${customerName} (${customerEmail})</span>
                                    </div>
                                    <div class="confirmation-detail-row">
                                        <span class="detail-label">Dirección de Despacho</span>
                                        <span class="detail-val">${customerAddress}, ${customerCity}, ${customerRegion}</span>
                                    </div>
                                    <div class="confirmation-detail-row">
                                        <span class="detail-label">Método de Pago</span>
                                        <span class="detail-val" style="text-transform:capitalize;">${selectedPayment}</span>
                                    </div>
                                    <div class="confirmation-detail-row">
                                        <span class="detail-label">Tiempo Estimado de Entrega</span>
                                        <span class="detail-val" style="color:var(--success);font-weight:700;">24 a 48 horas hábiles 🚚</span>
                                    </div>
                                    <div class="confirmation-detail-row" style="border-top:1px solid var(--border-color);padding-top:14px;margin-top:10px;">
                                        <span class="detail-label" style="font-size:1rem;font-weight:700;">Total Pagado</span>
                                        <strong class="detail-val" style="font-size:1.3rem;color:var(--accent);">${formatPrice(totalOrder)}</strong>
                                    </div>
                                </div>

                                <div style="display:flex;gap:14px;justify-content:center;margin-top:32px;flex-wrap:wrap;">
                                    <button class="btn btn-primary btn-lg" id="confirm-go-home">
                                        Volver al Inicio
                                    </button>
                                    <button class="btn btn-secondary btn-lg" id="confirm-go-catalog">
                                        Seguir Comprando
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                `;

                document.getElementById("confirm-go-home")?.addEventListener("click", () => navigate("/"));
                document.getElementById("confirm-go-catalog")?.addEventListener("click", () => navigate("/catalog"));

            } catch (err) {
                showToast(err.message || "Error al procesar el pedido", "error");
                isSubmitting = false;
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = `Pagar ${formatPrice(totalOrder)}`;
                }
            }
        });
    }
}
