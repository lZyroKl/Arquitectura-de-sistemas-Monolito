import { api } from "../api.js";
import { formatPrice } from "../components/product-card.js";
import { addToCart, showToast } from "../components/cart.js";
import { navigate } from "../router.js";

export async function renderProduct(container, params) {
    container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

    try {
        const product = await api.getProduct(params.id);
        let selectedSize = null;

        function render() {
            container.innerHTML = `
                <section class="product-detail">
                    <div class="container">
                        <button class="btn btn-secondary btn-sm" id="back-btn" style="margin-bottom:24px;">← Volver</button>
                        <div class="product-detail-grid">
                            <div class="product-detail-image glass-card" style="padding:0;overflow:hidden;">
                                <img src="${product.image_url}" alt="${product.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 600 600%22><rect fill=%22%2318182a%22 width=%22600%22 height=%22600%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%234a4a6a%22 font-size=%2260%22 text-anchor=%22middle%22 dy=%22.3em%22>👟</text></svg>'" />
                            </div>
                            <div class="product-detail-info">
                                <div class="product-detail-brand">${product.brand}</div>
                                <h1 class="product-detail-name">${product.name}</h1>
                                <div class="product-detail-price">${formatPrice(product.price)}</div>
                                <p class="product-detail-desc">${product.description}</p>

                                <div class="product-detail-section-title">Selecciona tu talla</div>
                                <div class="sizes-grid">
                                    ${product.sizes.map(size => `
                                        <button class="size-btn ${selectedSize === size ? "selected" : ""}" data-size="${size}">${size}</button>
                                    `).join("")}
                                </div>

                                <div class="product-detail-actions">
                                    <button class="btn btn-primary btn-lg" id="add-to-cart-btn" style="flex:1;">Agregar al carrito</button>
                                </div>

                                <div class="product-detail-stock">
                                    <span class="stock-dot ${product.stock < 10 ? "low" : ""}"></span>
                                    <span>${product.stock > 10 ? "En stock" : `Quedan ${product.stock} unidades`}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            `;

            document.getElementById("back-btn").addEventListener("click", () => {
                window.history.back();
            });

            document.querySelectorAll("[data-size]").forEach((btn) => {
                btn.addEventListener("click", () => {
                    selectedSize = btn.dataset.size;
                    render();
                });
            });

            document.getElementById("add-to-cart-btn").addEventListener("click", () => {
                if (!selectedSize) {
                    showToast("Selecciona una talla primero", "error");
                    return;
                }
                addToCart(product, selectedSize);
            });
        }

        render();

    } catch (err) {
        container.innerHTML = `
            <div class="container" style="text-align:center;padding:100px 0;">
                <h2 class="section-title">Producto no encontrado</h2>
                <p class="section-subtitle" style="margin:0 auto;">El producto que buscas no existe.</p>
                <button class="btn btn-primary" id="go-catalog" style="margin-top:24px;">Ver catálogo</button>
            </div>
        `;
        document.getElementById("go-catalog")?.addEventListener("click", () => navigate("/catalog"));
    }
}
