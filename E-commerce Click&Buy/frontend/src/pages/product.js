import { api } from "../api.js";
import { formatPrice } from "../components/product-card.js";
import { addToCart, showToast } from "../components/cart.js";
import { navigate } from "../router.js";

export async function renderProduct(container, params) {
    container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

    try {
        // Get variants first (includes the requested product)
        const variants = await api.getProductVariants(params.id);
        
        // Find the initially requested product in the variants list
        let initialProduct = variants.find(v => v.id == params.id) || variants[0];
        
        if (!initialProduct) throw new Error("Producto no encontrado");

        let activeProduct = initialProduct;
        let selectedSize = null;

        function render() {
            const resellLinks = activeProduct.resell_links || {};
            const hasResellLinks = resellLinks.stockX || resellLinks.goat || resellLinks.flightClub;

            container.innerHTML = `
                <section class="product-detail">
                    <div class="container">
                        <button class="btn btn-secondary btn-sm" id="back-btn" style="margin-bottom:24px;">← Volver</button>
                        <div class="product-detail-grid">
                            <div class="product-detail-image glass-card" style="padding:0;overflow:hidden; display:flex; align-items:center; justify-content:center; background: #fff;">
                                <img src="${activeProduct.image_url}" alt="${activeProduct.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 600 600%22><rect fill=%22%2318182a%22 width=%22600%22 height=%22600%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%234a4a6a%22 font-size=%2260%22 text-anchor=%22middle%22 dy=%22.3em%22>👟</text></svg>'" style="width:100%; height:auto; mix-blend-mode: multiply;" />
                            </div>
                            <div class="product-detail-info">
                                <div class="product-detail-brand">${activeProduct.brand}</div>
                                <h1 class="product-detail-name">${activeProduct.name}</h1>
                                
                                <div class="product-detail-price">${formatPrice(activeProduct.price)}</div>
                                ${activeProduct.price_usd ? `<div class="product-detail-price-usd">USD $${activeProduct.price_usd}</div>` : ""}
                                
                                ${variants.length > 1 ? `
                                    <div class="product-detail-section-title" style="margin-top:20px;">Colorway: <span style="font-weight:400; color:var(--text-secondary);">${activeProduct.colorway}</span></div>
                                    <div class="colorway-selector" style="display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap;">
                                        ${variants.map(v => `
                                            <button class="colorway-btn ${v.id === activeProduct.id ? 'active' : ''}" data-vid="${v.id}" style="
                                                border: 2px solid ${v.id === activeProduct.id ? 'var(--primary)' : 'var(--border)'};
                                                background: var(--bg-card);
                                                border-radius: 8px;
                                                padding: 4px;
                                                cursor: pointer;
                                                width: 60px;
                                                height: 60px;
                                                overflow: hidden;
                                                display: flex;
                                                align-items: center;
                                                justify-content: center;
                                                transition: all 0.2s ease;
                                            ">
                                                <img src="${v.image_url}" style="width:150%; height:auto; mix-blend-mode: multiply; filter: contrast(1.1); pointer-events:none;" />
                                            </button>
                                        `).join('')}
                                    </div>
                                ` : (activeProduct.colorway ? `<div class="product-detail-colorway" style="margin-top:10px;">${activeProduct.colorway}</div>` : "")}
                                
                                ${activeProduct.style_id ? `<div class="product-detail-styleid" style="margin-bottom:20px;">SKU: ${activeProduct.style_id}</div>` : ""}
                                <p class="product-detail-desc">${activeProduct.description}</p>

                                <div class="product-detail-section-title">Selecciona tu talla</div>
                                <div class="sizes-grid">
                                    ${activeProduct.sizes.map(size => `
                                        <button class="size-btn ${selectedSize === size ? "selected" : ""}" data-size="${size}">${size}</button>
                                    `).join("")}
                                </div>

                                <div class="product-detail-actions">
                                    <button class="btn btn-primary btn-lg" id="add-to-cart-btn" style="flex:1;">Agregar al carrito</button>
                                </div>

                                <div class="product-detail-stock">
                                    <span class="stock-dot ${activeProduct.stock < 10 ? "low" : ""}"></span>
                                    <span>${activeProduct.stock > 10 ? "En stock" : `Quedan ${activeProduct.stock} unidades`}</span>
                                </div>

                                ${hasResellLinks ? `
                                    <div class="product-detail-resell">
                                        <div class="product-detail-section-title">Comparar precios</div>
                                        <div class="resell-links">
                                            ${resellLinks.stockX ? `<a href="${resellLinks.stockX}" target="_blank" rel="noopener" class="resell-link">
                                                <span class="resell-link-name">StockX</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                                            </a>` : ""}
                                            ${resellLinks.goat ? `<a href="${resellLinks.goat}" target="_blank" rel="noopener" class="resell-link">
                                                <span class="resell-link-name">GOAT</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                                            </a>` : ""}
                                            ${resellLinks.flightClub ? `<a href="${resellLinks.flightClub}" target="_blank" rel="noopener" class="resell-link">
                                                <span class="resell-link-name">Flight Club</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                                            </a>` : ""}
                                        </div>
                                    </div>
                                ` : ""}
                            </div>
                        </div>
                    </div>
                </section>
            `;

            document.getElementById("back-btn").addEventListener("click", () => {
                window.history.back();
            });

            // Handle colorway change
            document.querySelectorAll(".colorway-btn").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    const vid = parseInt(btn.dataset.vid);
                    if (vid !== activeProduct.id) {
                        activeProduct = variants.find(v => v.id === vid);
                        selectedSize = null; // Reset size selection for new variant
                        
                        // Optionally update URL to reflect specific variant without reloading
                        window.history.replaceState({}, "", `/product?id=${activeProduct.id}`);
                        render();
                    }
                });
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
                addToCart(activeProduct, selectedSize);
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
