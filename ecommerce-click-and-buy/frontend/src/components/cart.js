import { formatPrice } from "./product-card.js";
import { navigate } from "../router.js";
import { refreshApp } from "../main.js";

const CART_KEY = "click&buy_cart";
export const FREE_SHIPPING_THRESHOLD = 69990;

export function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function openCart() {
    const overlay = document.getElementById("cart-overlay");
    const drawer = document.getElementById("cart-drawer");
    if (overlay && drawer) {
        overlay.classList.add("open");
        drawer.classList.add("open");
        document.body.style.overflow = "hidden";
    }
}

export function closeCart() {
    const overlay = document.getElementById("cart-overlay");
    const drawer = document.getElementById("cart-drawer");
    if (overlay && drawer) {
        overlay.classList.remove("open");
        drawer.classList.remove("open");
        document.body.style.overflow = "";
    }
}

export function addToCart(product, size, quantity = 1, shouldOpenDrawer = true) {
    const cart = getCart();
    const existing = cart.find(
        (item) => item.product_id === product.id && item.size === size
    );

    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({
            product_id: product.id,
            name: product.name,
            brand: product.brand,
            price: product.price,
            image_url: product.image_url,
            size,
            quantity,
        });
    }

    saveCart(cart);
    refreshApp();
    showToast(`${product.name} agregado al carrito`);

    if (shouldOpenDrawer) {
        setTimeout(openCart, 50);
    }
}

export function updateCartQty(productId, size, delta) {
    const cart = getCart();
    const item = cart.find(
        (i) => i.product_id === parseInt(productId) && i.size === size
    );

    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            const idx = cart.indexOf(item);
            cart.splice(idx, 1);
        }
    }

    saveCart(cart);
    refreshApp();
    openCart();
}

export function removeFromCart(productId, size) {
    let cart = getCart();
    cart = cart.filter(
        (i) => !(i.product_id === parseInt(productId) && i.size === size)
    );
    saveCart(cart);
    refreshApp();
    openCart();
    showToast("Producto eliminado del carrito", "error");
}

export function clearCart() {
    localStorage.removeItem(CART_KEY);
    refreshApp();
    openCart();
    showToast("Carrito vaciado");
}

export function getCartTotal() {
    return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function renderCartDrawer() {
    const cart = getCart();
    const total = getCartTotal();
    const totalCount = cart.reduce((sum, i) => sum + i.quantity, 0);

    const hasFreeShipping = total >= FREE_SHIPPING_THRESHOLD;
    const remainingForFree = FREE_SHIPPING_THRESHOLD - total;
    const progressPercent = Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100));

    const shippingBarHtml = `
        <div class="cart-shipping-bar ${hasFreeShipping ? 'qualified' : ''}">
            <div class="cart-shipping-text">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V3.75a1.125 1.125 0 00-1.125-1.125h-9A1.125 1.125 0 003 3.75v10.5m11.25-6.75H18" /></svg>
                ${hasFreeShipping
                    ? `<span>🎉 ¡Felicidades! Tienes <strong>DESPACHO GRATIS</strong></span>`
                    : `<span>¡Agrega <strong>${formatPrice(remainingForFree)}</strong> más para <strong>DESPACHO GRATIS</strong>!</span>`
                }
            </div>
            <div class="shipping-progress-track">
                <div class="shipping-progress-fill" style="width: ${progressPercent}%;"></div>
            </div>
        </div>
    `;

    const itemsHtml = cart.length === 0
        ? `<div class="cart-empty">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
            <p style="font-weight:700;font-size:1.1rem;color:var(--text-primary);">Tu carrito está vacío</p>
            <p style="font-size:0.85rem;text-align:center;max-width:240px;color:var(--text-muted);">Descubre las mejores zapatillas y agrégalas a tu pedido.</p>
            <button class="btn btn-primary btn-sm" id="cart-explore-btn" style="margin-top:8px;">Explorar catálogo</button>
           </div>`
        : cart.map((item) => `
            <div class="cart-item">
                <div class="cart-item-img">
                    <img src="${item.image_url}" alt="${item.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 80 80%22><rect fill=%22%2318182a%22 width=%2280%22 height=%2280%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%234a4a6a%22 font-size=%2220%22 text-anchor=%22middle%22 dy=%22.3em%22>👟</text></svg>'" />
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-header">
                        <div class="cart-item-name" title="${item.name}">${item.name}</div>
                        <button class="cart-item-remove" data-remove-item="${item.product_id}" data-size="${item.size}" title="Eliminar producto">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                    </div>
                    <div class="cart-item-meta">${item.brand} · Talla ${item.size}</div>
                    <div class="cart-item-bottom">
                        <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
                        <div class="cart-item-qty">
                            <button data-qty-change="${item.product_id}" data-size="${item.size}" data-delta="-1" title="Disminuir">−</button>
                            <span>${item.quantity}</span>
                            <button data-qty-change="${item.product_id}" data-size="${item.size}" data-delta="1" title="Aumentar">+</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join("");

    return `
    <div class="cart-overlay" id="cart-overlay"></div>
    <div class="cart-drawer" id="cart-drawer">
        <div class="cart-header">
            <div class="cart-title">
                Carrito <span class="cart-title-count">(${totalCount})</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                ${cart.length > 0 ? `
                    <button class="cart-clear-btn" id="cart-clear-all" title="Vaciar carrito">Vaciar</button>
                ` : ""}
                <button class="cart-close" id="cart-close-btn" title="Cerrar">✕</button>
            </div>
        </div>
        ${cart.length > 0 ? shippingBarHtml : ""}
        <div class="cart-items">${itemsHtml}</div>
        ${cart.length > 0 ? `
            <div class="cart-footer">
                <div class="cart-total">
                    <span class="cart-total-label">Subtotal</span>
                    <span class="cart-total-value">${formatPrice(total)}</span>
                </div>
                <p style="font-size:0.75rem;color:var(--text-muted);margin-bottom:14px;text-align:center;">Impuestos y descuentos calculados en el checkout</p>
                <button class="btn btn-primary btn-lg" style="width:100%" id="checkout-btn">
                    Ir a Pagar · ${formatPrice(total)}
                </button>
            </div>
        ` : ""}
    </div>`;
}

export function initCartDrawer() {
    const overlay = document.getElementById("cart-overlay");
    const toggleBtn = document.getElementById("cart-toggle-btn");
    const closeBtn = document.getElementById("cart-close-btn");
    const checkoutBtn = document.getElementById("checkout-btn");
    const exploreBtn = document.getElementById("cart-explore-btn");
    const clearAllBtn = document.getElementById("cart-clear-all");

    if (toggleBtn) toggleBtn.addEventListener("click", openCart);
    if (closeBtn) closeBtn.addEventListener("click", closeCart);
    if (overlay) overlay.addEventListener("click", closeCart);

    if (exploreBtn) {
        exploreBtn.addEventListener("click", () => {
            closeCart();
            navigate("/catalog");
        });
    }

    if (clearAllBtn) {
        clearAllBtn.addEventListener("click", () => {
            if (confirm("¿Seguro que deseas vaciar tu carrito?")) {
                clearCart();
            }
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", () => {
            closeCart();
            navigate("/checkout");
        });
    }

    document.querySelectorAll("[data-qty-change]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const productId = btn.dataset.qtyChange;
            const size = btn.dataset.size;
            const delta = parseInt(btn.dataset.delta);
            updateCartQty(productId, size, delta);
        });
    });

    document.querySelectorAll("[data-remove-item]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const productId = btn.dataset.removeItem;
            const size = btn.dataset.size;
            removeFromCart(productId, size);
        });
    });
}

function showToast(message, type = "success") {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 400);
    }, 2500);
}

export { showToast };
