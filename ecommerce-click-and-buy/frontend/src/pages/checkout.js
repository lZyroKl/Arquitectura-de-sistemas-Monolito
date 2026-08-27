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

    const renderPaymentForm = () => {
        const formContainer = document.getElementById("dynamic-payment-form");
        if (!formContainer) return;

        if (selectedPayment === "webpay") {
            formContainer.innerHTML = `
                <div style="background:var(--bg-secondary);padding:20px;border-radius:12px;margin-top:16px;text-align:center;border:1px solid rgba(235, 17, 43, 0.2);">
                    <img src="https://public.transbank.cl/public/img/webpayPlus.png" alt="Webpay Plus" style="height:40px;margin-bottom:12px;" onerror="this.style.display='none'" />
                    <p style="font-size:0.9rem;color:var(--text-secondary);line-height:1.5;">Serás redirigido al entorno <strong>seguro y oficial de Transbank (Webpay)</strong> para ingresar los datos de tu tarjeta.</p>
                </div>
            `;
        } else if (selectedPayment === "transfer") {
            formContainer.innerHTML = `
                <div style="background:var(--bg-secondary);padding:20px;border-radius:12px;margin-top:16px;text-align:center;">
                    <p style="font-size:0.9rem;color:var(--text-secondary);line-height:1.5;">Al finalizar tu pedido, recibirás un correo con los datos de nuestra cuenta bancaria. <strong>(Simulación: El pago se aprobará automáticamente)</strong>.</p>
                </div>
            `;
        } else if (selectedPayment === "mercadopago") {
            formContainer.innerHTML = `
                <div style="background:var(--bg-secondary);padding:20px;border-radius:12px;margin-top:16px;text-align:center;">
                    <p style="font-size:0.9rem;color:var(--text-secondary);line-height:1.5;">Serás redirigido a la plataforma de MercadoPago para completar la transacción. <strong>(Simulación: El pago se procesará automáticamente)</strong>.</p>
                </div>
            `;
        }
    };

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
                                        <option value="Otra Región">Otra Región</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label" for="cust-city">Ciudad / Comuna *</label>
                                    <input type="text" class="input-field" id="cust-city" placeholder="Ej: Santiago" required />
                                </div>
                            </div>
                        </div>

                        <!-- Paso 2: Método de Pago -->
                        <div class="glass-card checkout-section-card" style="margin-top:24px;">
                            <div class="checkout-step-header">
                                <div class="step-badge">2</div>
                                <div>
                                    <h3 class="checkout-step-title">Método de Pago Seguro</h3>
                                    <p class="checkout-step-desc">Transacciones encriptadas y 100% protegidas por Transbank</p>
                                </div>
                            </div>

                            <div class="payment-options-grid">
                                <label class="payment-option-card active" data-payment="webpay">
                                    <input type="radio" name="payment_method" value="webpay" checked />
                                    <div class="payment-option-body">
                                        <div class="payment-option-header">
                                            <span class="payment-option-title">Webpay Plus</span>
                                            <span class="badge badge-red">Oficial</span>
                                        </div>
                                    </div>
                                </label>

                                <label class="payment-option-card" data-payment="transfer">
                                    <input type="radio" name="payment_method" value="transfer" />
                                    <div class="payment-option-body">
                                        <div class="payment-option-header">
                                            <span class="payment-option-title">Transferencia</span>
                                        </div>
                                    </div>
                                </label>

                                <label class="payment-option-card" data-payment="mercadopago">
                                    <input type="radio" name="payment_method" value="mercadopago" />
                                    <div class="payment-option-body">
                                        <div class="payment-option-header">
                                            <span class="payment-option-title">Mercado Pago</span>
                                        </div>
                                    </div>
                                </label>
                            </div>
                            
                            <!-- Dynamic Payment Form Container -->
                            <div id="dynamic-payment-form"></div>
                        </div>
                    </form>

                    <!-- Resumen Lateral del Pedido -->
                    <aside class="glass-card checkout-summary">
                        <h3 class="checkout-summary-title">Resumen de tu Pedido</h3>
                        
                        <div class="checkout-summary-items">
                            ${cart.map(item => `
                                <div class="checkout-summary-item">
                                    <div class="checkout-summary-item-info">
                                        <div class="checkout-summary-item-name">${item.quantity}x ${item.name}</div>
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
                                <span>${isFreeShipping ? 'GRATIS' : formatPrice(shippingCost)}</span>
                            </div>
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

    renderPaymentForm();

    document.getElementById("checkout-back-btn")?.addEventListener("click", () => navigate("/catalog"));
    document.getElementById("checkout-login-link")?.addEventListener("click", () => navigate("/login"));

    // Payment Option selection handlers
    document.querySelectorAll("input[name='payment_method']").forEach((radio) => {
        radio.addEventListener("change", (e) => {
            selectedPayment = e.target.value;
            document.querySelectorAll(".payment-option-card").forEach(c => c.classList.remove("active"));
            e.target.closest('.payment-option-card').classList.add("active");
            renderPaymentForm();
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
                submitBtn.innerHTML = `<span class="spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;margin-right:8px;"></span> Redirigiendo a Webpay...`;
            }

            // Auth Logic...
            if (!store.user) {
                const customerName = document.getElementById("cust-name").value;
                const customerEmail = document.getElementById("cust-email").value;
                try {
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
                    showToast("Por favor inicia sesión para continuar", "error");
                    isSubmitting = false;
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = `Pagar ${formatPrice(totalOrder)}`;
                    }
                    return;
                }
            }

            try {
                // 1. CREATE ORDER (PENDING)
                const items = cart.map(item => ({
                    product_id: item.product_id,
                    size: item.size,
                    quantity: item.quantity,
                    price: item.price,
                }));
                const order = await api.createOrder(items);

                // 2. PROCESS PAYMENT
                if (selectedPayment === "webpay") {
                    // LLamada a Webpay Init
                    const wpResponse = await api.initWebpay(order.id);
                    
                    if (wpResponse.url && wpResponse.token) {
                        // Limpiar carrito antes de ir a webpay, o podríamos hacerlo a la vuelta
                        clearCart();
                        
                        // Enviar form oculto o redirigir (Form POST requerido por transbank si se usa de forma clásica, 
                        // pero la nueva doc (v6) dice que puede enviarse a url + ?token_ws=token. 
                        // O bien, podemos crear y enviar un form POST de manera segura:
                        const form = document.createElement('form');
                        form.action = wpResponse.url;
                        form.method = 'POST';
                        
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = 'token_ws';
                        input.value = wpResponse.token;
                        
                        form.appendChild(input);
                        document.body.appendChild(form);
                        form.submit();
                        return; // Detener ejecución aquí porque nos vamos de la página
                    } else {
                        throw new Error("Transbank no respondió con URL");
                    }
                } else {
                    // Mock payments (Transferencia, Mercadopago)
                    await api.processMockPayment(order.id, selectedPayment);
                    
                    clearCart();
                    showToast("¡Pago procesado y pedido confirmado!");

                    const orderNumber = `CB-${String(order.id).padStart(6, "0")}`;
                    
                    // Render Confirmation
                    container.innerHTML = `
                        <section class="checkout-page">
                            <div class="container" style="max-width:800px;">
                                <div class="glass-card" style="padding:40px;text-align:center;">
                                    <div style="width:72px;height:72px;border-radius:50%;background:rgba(22,163,74,0.12);border:2px solid var(--success);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="var(--success)" width="36" height="36"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                    </div>
                                    <h1 class="section-title">¡Compra Exitosa!</h1>
                                    <p style="color:var(--text-secondary);margin-bottom:24px;">Tu pedido <strong>#${orderNumber}</strong> ha sido pagado y está en preparación.</p>
                                    <button class="btn btn-primary btn-lg" id="confirm-go-home">Volver al Inicio</button>
                                </div>
                            </div>
                        </section>
                    `;
                    document.getElementById("confirm-go-home")?.addEventListener("click", () => navigate("/"));
                }
            } catch (err) {
                showToast(err.message || "Pago rechazado. Verifica tus datos.", "error");
                isSubmitting = false;
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = `Pagar ${formatPrice(totalOrder)}`;
                }
            }
        });
    }
}
