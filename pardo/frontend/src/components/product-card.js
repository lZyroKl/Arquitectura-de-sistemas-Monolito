import { navigate } from "../router.js";

export function formatPrice(price) {
    return `$${(price).toLocaleString("es-CL")}`;
}

export function renderProductCard(product) {
    const sizesText = product.sizes.length > 4
        ? `${product.sizes.slice(0, 4).join(", ")}...`
        : product.sizes.join(", ");

    const colorwayHtml = product.colorway
        ? `<div class="product-card-colorway">${product.colorway}</div>`
        : "";

    return `
    <div class="glass-card product-card" data-product-id="${product.id}">
        <div class="product-card-img">
            <img src="${product.image_url}" alt="${product.name}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22><rect fill=%22%2318182a%22 width=%22400%22 height=%22400%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%234a4a6a%22 font-size=%2240%22 text-anchor=%22middle%22 dy=%22.3em%22>👟</text></svg>'" />
            <div class="product-card-badges">
                <span class="badge badge-brand">${product.brand}</span>
                ${product.style_id ? `<span class="badge badge-style">${product.style_id}</span>` : ""}
            </div>
        </div>
        <div class="product-card-body">
            <div class="product-card-brand">${product.brand}</div>
            <div class="product-card-name">${product.name}</div>
            ${colorwayHtml}
            <div class="product-card-price">${formatPrice(product.price)}</div>
            <div class="product-card-footer">
                <div class="product-card-sizes">Tallas: ${sizesText}</div>
                <button class="product-card-add" data-add-cart="${product.id}" title="Ver producto">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </button>
            </div>
        </div>
    </div>`;
}

export function initProductCards() {
    document.querySelectorAll(".product-card").forEach((card) => {
        card.addEventListener("click", (e) => {
            if (e.target.closest("[data-add-cart]")) return;
            const id = card.dataset.productId;
            navigate(`/product/${id}`);
        });
    });

    document.querySelectorAll("[data-add-cart]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const id = btn.dataset.addCart;
            navigate(`/product/${id}`);
        });
    });
}
