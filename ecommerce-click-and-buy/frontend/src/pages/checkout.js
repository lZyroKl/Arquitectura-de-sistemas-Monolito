import { api } from "../api.js";
import { getCart, getCartTotal, showToast, FREE_SHIPPING_THRESHOLD } from "../components/cart.js";
import { formatPrice } from "../components/product-card.js";
import { store } from "../main.js";
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
                                    <span>Para pagar necesitas una cuenta en Click&Buy.</span>
                                    <a id="checkout-login-link" style="color:var(--accent);font-weight:700;cursor:pointer;text-decoration:underline;margin-left:6px;">Inicia sesión o regístrate</a>
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
                                            <span class="badge badge-red">Transbank</span>
                                        </div>
                                        <p class="payment-option-desc">Tarjetas de Débito (Redcompra), Crédito (Visa, Mastercard, AMEX) y Prepago. Serás redirigido a Webpay para completar el pago de forma segura.</p>
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

                        <button type="${user ? "submit" : "button"}" form="checkout-form" class="btn btn-primary btn-lg" style="width:100%;margin-top:20px;" id="submit-order-btn">
                            ${user ? `Pagar ${formatPrice(totalOrder)} con Webpay` : "Inicia sesión para pagar"}
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

    const goToLogin = () => navigate("/login?next=/checkout");
    document.getElementById("checkout-login-link")?.addEventListener("click", goToLogin);
    if (!user) {
        document.getElementById("submit-order-btn")?.addEventListener("click", goToLogin);
    }

    const form = document.getElementById("checkout-form");
    form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!store.user) {
            showToast("Inicia sesión o crea una cuenta para pagar", "error");
            goToLogin();
            return;
        }

        const submitBtn = document.getElementById("submit-order-btn");
        const resetButton = () => {
            isSubmitting = false;
            submitBtn.disabled = false;
            submitBtn.textContent = `Pagar ${formatPrice(totalOrder)} con Webpay`;
        };

        isSubmitting = true;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;margin-right:8px;"></span> Conectando con Webpay...`;

        const shipping = {
            name: document.getElementById("cust-name").value,
            rut: document.getElementById("cust-rut").value,
            email: document.getElementById("cust-email").value,
            phone: document.getElementById("cust-phone").value,
            address: document.getElementById("cust-address").value,
            region: document.getElementById("cust-region").value,
            city: document.getElementById("cust-city").value,
            notes: document.getElementById("cust-notes").value,
        };

        // El backend recalcula precios y envío; solo enviamos qué se compra
        const items = cart.map(item => ({
            product_id: item.product_id,
            size: item.size,
            quantity: item.quantity,
        }));

        try {
            const { url, token } = await api.createWebpayTransaction(items, shipping);
            redirectToWebpay(url, token);
        } catch (err) {
            showToast(err.message || "No fue posible iniciar el pago", "error");
            resetButton();
        }
    });
}

// Webpay exige que el token se envíe con un formulario POST a su URL
function redirectToWebpay(url, token) {
    const webpayForm = document.createElement("form");
    webpayForm.method = "POST";
    webpayForm.action = url;

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "token_ws";
    input.value = token;

    webpayForm.appendChild(input);
    document.body.appendChild(webpayForm);
    webpayForm.submit();
}
