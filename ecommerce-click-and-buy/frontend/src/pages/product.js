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
                            <div class="product-detail-image glass-card" style="padding:16px;overflow:hidden; display:flex; align-items:center; justify-content:center; background: #ffffff;">
                                <img src="${activeProduct.image_url}" alt="${activeProduct.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 600 600%22><rect fill=%22%2318182a%22 width=%22600%22 height=%22600%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%234a4a6a%22 font-size=%2260%22 text-anchor=%22middle%22 dy=%22.3em%22>👟</text></svg>'" style="width:100%; height:100%; object-fit:contain;" />
                            </div>
                            <div class="product-detail-info">
                                <div class="product-detail-brand">${activeProduct.brand}</div>
                                <h1 class="product-detail-name">${activeProduct.name}</h1>
                                
                                <div class="product-detail-price">${formatPrice(activeProduct.price)}</div>
                                ${activeProduct.price_usd ? `<div class="product-detail-price-usd" style="color:var(--text-muted);font-size:0.95rem;margin-top:-10px;margin-bottom:16px;">USD $${activeProduct.price_usd}</div>` : ""}
                                
                                ${variants.length > 1 ? `
                                    <div class="product-detail-section-title" style="margin-top:16px;">
                                        Colorway: <span style="font-weight:600; color:var(--text-primary);">${activeProduct.colorway || 'Original'}</span>
                                    </div>
                                    <div class="colorway-selector" style="display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap;">
                                        ${variants.map(v => `
                                            <button class="colorway-btn ${v.id === activeProduct.id ? 'active' : ''}" data-vid="${v.id}" title="${v.colorway || v.name}" style="
                                                border: 2px solid ${v.id === activeProduct.id ? 'var(--accent)' : 'var(--border-color)'};
                                                background: #ffffff;
                                                border-radius: var(--radius-md);
                                                padding: 4px;
                                                cursor: pointer;
                                                width: 64px;
                                                height: 64px;
                                                overflow: hidden;
                                                display: flex;
                                                align-items: center;
                                                justify-content: center;
                                                transition: all var(--transition-fast);
                                                box-shadow: ${v.id === activeProduct.id ? '0 0 0 2px var(--accent-light)' : 'none'};
                                            ">
                                                <img src="${v.image_url}" alt="${v.name}" style="width:100%; height:100%; object-fit:contain; pointer-events:none;" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 60%22><rect fill=%22%23fff%22 width=%2260%22 height=%2260%22/><text x=%2250%25%22 y=%2250%25%22 font-size=%2220%22 text-anchor=%22middle%22 dy=%22.3em%22>👟</text></svg>'" />
                                            </button>
                                        `).join('')}
                                    </div>
                                ` : (activeProduct.colorway ? `<div class="product-detail-colorway" style="margin-top:10px;color:var(--text-muted);font-size:0.9rem;">Colorway: <strong>${activeProduct.colorway}</strong></div>` : "")}
                                
                                ${activeProduct.style_id ? `<div class="product-detail-styleid" style="margin-bottom:16px;color:var(--text-muted);font-size:0.85rem;font-weight:700;">SKU: ${activeProduct.style_id}</div>` : ""}
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
                                    <div class="product-detail-resell" style="margin-top:24px;">
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
                btn.addEventListener("click", () => {
                    const vid = parseInt(btn.dataset.vid);
                    if (vid !== activeProduct.id) {
                        activeProduct = variants.find(v => v.id === vid);
                        selectedSize = null; // Reset size selection for new variant
                        window.location.hash = `/product/${activeProduct.id}`;
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
                <h2 class="section-title">Error</h2>
                <p class="section-subtitle" style="margin:0 auto 20px;">${err.message}</p>
                <button class="btn btn-primary" id="err-catalog-btn">Ir al catálogo</button>
            </div>
        `;
        document.getElementById("err-catalog-btn")?.addEventListener("click", () => navigate("/catalog"));
    }
}
