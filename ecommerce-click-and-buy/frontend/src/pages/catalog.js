import { api } from "../api.js";
import { renderProductCard, initProductCards } from "../components/product-card.js";

export async function renderCatalog(container) {
    container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

    try {
        const [products, brands, categories] = await Promise.all([
            api.getProducts(),
            api.getBrands(),
            api.getCategories(),
        ]);

        let filteredProducts = [...products];
        let activeFilters = { brand: null, category: null, search: "" };

        const hashParams = new URLSearchParams(window.location.hash.split("?")[1] || "");
        if (hashParams.get("category")) {
            activeFilters.category = hashParams.get("category");
        }
        if (hashParams.get("brand")) {
            activeFilters.brand = hashParams.get("brand");
        }
        filteredProducts = products.filter(p => {
            if (activeFilters.brand && p.brand !== activeFilters.brand) return false;
            if (activeFilters.category && p.category !== activeFilters.category) return false;
            return true;
        });

        function renderPage() {
            container.innerHTML = `
                <div class="container">
                    <div style="padding-top:24px;">
                        <h1 class="section-title">Catálogo</h1>
                        <p class="section-subtitle">Explora nuestra colección completa</p>
                    </div>
                    <div class="catalog-layout">
                        <aside class="filters-panel glass-card" style="padding:24px;">
                            <div class="filter-group">
                                <div class="filter-group-title">Buscar</div>
                                <div class="catalog-search">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                                    <input type="text" class="input-field" placeholder="Buscar zapatillas..." id="search-input" value="${activeFilters.search}" />
                                </div>
                            </div>
                            <div class="filter-group">
                                <div class="filter-group-title">Marca</div>
                                ${brands.map(brand => `
                                    <div class="filter-option ${activeFilters.brand === brand ? "active" : ""}" data-filter-brand="${brand}">
                                        <div class="filter-checkbox"></div>
                                        <span>${brand}</span>
                                    </div>
                                `).join("")}
                            </div>
                            <div class="filter-group">
                                <div class="filter-group-title">Categoría</div>
                                ${categories.map(cat => `
                                    <div class="filter-option ${activeFilters.category === cat ? "active" : ""}" data-filter-category="${cat}">
                                        <div class="filter-checkbox"></div>
                                        <span>${cat}</span>
                                    </div>
                                `).join("")}
                            </div>
                            ${activeFilters.brand || activeFilters.category || activeFilters.search ? `
                                <button class="btn btn-secondary btn-sm" id="clear-filters" style="width:100%">Limpiar filtros</button>
                            ` : ""}
                        </aside>
                        <div>
                            <div class="catalog-toolbar">
                                <span class="catalog-count">${filteredProducts.length} producto${filteredProducts.length !== 1 ? "s" : ""}</span>
                            </div>
                            <div class="products-grid">
                                ${filteredProducts.length > 0
                                    ? filteredProducts.map(p => renderProductCard(p)).join("")
                                    : `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted);">
                                        <p style="font-size:1.1rem;">No se encontraron productos</p>
                                       </div>`
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;

            initProductCards();

            document.querySelectorAll("[data-filter-brand]").forEach((el) => {
                el.addEventListener("click", () => {
                    activeFilters.brand = activeFilters.brand === el.dataset.filterBrand ? null : el.dataset.filterBrand;
                    applyFilters();
                });
            });

            document.querySelectorAll("[data-filter-category]").forEach((el) => {
                el.addEventListener("click", () => {
                    activeFilters.category = activeFilters.category === el.dataset.filterCategory ? null : el.dataset.filterCategory;
                    applyFilters();
                });
            });

            const searchInput = document.getElementById("search-input");
            let searchTimeout;
            if (searchInput) {
                searchInput.addEventListener("input", () => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        activeFilters.search = searchInput.value;
                        applyFilters();
                    }, 300);
                });
            }

            const clearBtn = document.getElementById("clear-filters");
            if (clearBtn) {
                clearBtn.addEventListener("click", () => {
                    activeFilters = { brand: null, category: null, search: "" };
                    applyFilters();
                });
            }
        }

        function applyFilters() {
            filteredProducts = products.filter((p) => {
                if (activeFilters.brand && p.brand !== activeFilters.brand) return false;
                if (activeFilters.category && p.category !== activeFilters.category) return false;
                if (activeFilters.search) {
                    const s = activeFilters.search.toLowerCase();
                    if (!p.name.toLowerCase().includes(s) && !p.brand.toLowerCase().includes(s)) return false;
                }
                return true;
            });
            renderPage();
        }

        renderPage();

    } catch (err) {
        container.innerHTML = `
            <div class="container" style="text-align:center;padding:100px 0;">
                <h2 class="section-title">Error</h2>
                <p class="section-subtitle" style="margin:0 auto;">No se pudieron cargar los productos.</p>
            </div>
        `;
    }
}
