
import { formatPrice } from "./product-card.js";
import { navigate } from "../router.js";
import { refreshApp } from "../main.js";

const CART_KEY = "click&buy_cart";

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

export function addToCart(product, size, quantity = 1) {
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
}

export function clearCart() {
    localStorage.removeItem(CART_KEY);
    refreshApp();
}

export function getCartTotal() {
    return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function renderCartDrawer() {
    const cart = getCart();
    const total = getCartTotal();

    const itemsHtml = cart.length === 0
        ? `<div class="cart-empty">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
            <p>Tu carrito está vacío</p>
           </div>`
        : cart.map((item) => `
            <div class="cart-item">
                <div class="cart-item-img">
                    <img src="${item.image_url}" alt="${item.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 80 80%22><rect fill=%22%2318182a%22 width=%2280%22 height=%2280%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%234a4a6a%22 font-size=%2220%22 text-anchor=%22middle%22 dy=%22.3em%22>👟</text></svg>'" />
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-meta">${item.brand} · Talla ${item.size}</div>
                    <div class="cart-item-bottom">
                        <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
                        <div class="cart-item-qty">
                            <button data-qty-change="${item.product_id}" data-size="${item.size}" data-delta="-1">−</button>
                            <span>${item.quantity}</span>
                            <button data-qty-change="${item.product_id}" data-size="${item.size}" data-delta="1">+</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join("");

    return `
    <div class="cart-overlay" id="cart-overlay"></div>
    <div class="cart-drawer" id="cart-drawer">
        <div class="cart-header">
            <div class="cart-title">Carrito (${cart.length})</div>
            <button class="cart-close" id="cart-close-btn">✕</button>
        </div>
        <div class="cart-items">${itemsHtml}</div>
        ${cart.length > 0 ? `
            <div class="cart-footer">
                <div class="cart-total">
                    <span class="cart-total-label">Total</span>
                    <span class="cart-total-value">${formatPrice(total)}</span>
                </div>
                <button class="btn btn-primary btn-lg" style="width:100%" id="checkout-btn">Finalizar compra</button>
            </div>
        ` : ""}
    </div>`;
}

export function initCartDrawer() {
    const overlay = document.getElementById("cart-overlay");
    const drawer = document.getElementById("cart-drawer");
    const toggleBtn = document.getElementById("cart-toggle-btn");
    const closeBtn = document.getElementById("cart-close-btn");
    const checkoutBtn = document.getElementById("checkout-btn");

    function openCart() {
        overlay.classList.add("open");
        drawer.classList.add("open");
        document.body.style.overflow = "hidden";
    }

    function closeCart() {
        overlay.classList.remove("open");
        drawer.classList.remove("open");
        document.body.style.overflow = "";
    }

    if (toggleBtn) toggleBtn.addEventListener("click", openCart);
    if (closeBtn) closeBtn.addEventListener("click", closeCart);
    if (overlay) overlay.addEventListener("click", closeCart);

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
