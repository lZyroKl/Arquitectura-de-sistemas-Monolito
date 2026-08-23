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
            const catParam = hashParams.get("category");
            const matchedCat = categories.find(c => c.toLowerCase() === catParam.toLowerCase());
            activeFilters.category = matchedCat || catParam;
        }
        if (hashParams.get("brand")) {
            const brandParam = hashParams.get("brand");
            const matchedBrand = brands.find(b => b.toLowerCase() === brandParam.toLowerCase());
            activeFilters.brand = matchedBrand || brandParam;
        }
        filteredProducts = products.filter(p => {
            if (activeFilters.brand && p.brand.toLowerCase() !== activeFilters.brand.toLowerCase()) return false;
            if (activeFilters.category && p.category.toLowerCase() !== activeFilters.category.toLowerCase()) return false;
            return true;
        });

        function renderPage() {
            const hasActiveFilters = Boolean(activeFilters.brand || activeFilters.category || activeFilters.search);

            container.innerHTML = `
                <div class="container">
                    <div style="padding-top:28px; margin-bottom: 20px;">
                        <h1 class="section-title">Catálogo <span>Completo</span></h1>
                        <p class="section-subtitle">Explora los modelos más exclusivos y originales de nuestra tienda</p>
                    </div>

                    ${hasActiveFilters ? `
                        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:20px; padding:12px 18px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius-md);">
                            <span style="font-size:0.82rem; font-weight:700; text-transform:uppercase; color:var(--text-muted);">Filtros activos:</span>
                            ${activeFilters.brand ? `
                                <span class="badge badge-red" style="padding:5px 10px; cursor:pointer;" id="remove-brand-filter">
                                    Marca: ${activeFilters.brand} ✕
                                </span>
                            ` : ""}
                            ${activeFilters.category ? `
                                <span class="badge badge-category" style="padding:5px 10px; cursor:pointer;" id="remove-cat-filter">
                                    Categoría: ${activeFilters.category} ✕
                                </span>
                            ` : ""}
                            ${activeFilters.search ? `
                                <span class="badge badge-brand" style="padding:5px 10px; cursor:pointer;" id="remove-search-filter">
                                    Búsqueda: "${activeFilters.search}" ✕
                                </span>
                            ` : ""}
                            <button class="btn btn-sm btn-danger-outline" id="clear-filters-top" style="margin-left:auto; padding:4px 12px; font-size:0.75rem;">
                                Limpiar todo
                            </button>
                        </div>
                    ` : ""}

                    <div class="catalog-layout">
                        <aside class="filters-panel glass-card">
                            <div class="filter-group">
                                <div class="filter-group-title">Buscar</div>
                                <div class="catalog-search">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                                    <input type="text" class="input-field" placeholder="Buscar modelo o marca..." id="search-input" value="${activeFilters.search}" />
                                </div>
                            </div>
                            <div class="filter-group">
                                <div class="filter-group-title">Marca</div>
                                ${brands.map(brand => `
                                    <div class="filter-option ${activeFilters.brand && activeFilters.brand.toLowerCase() === brand.toLowerCase() ? "active" : ""}" data-filter-brand="${brand}">
                                        <div class="filter-checkbox"></div>
                                        <span>${brand}</span>
                                    </div>
                                `).join("")}
                            </div>
                            <div class="filter-group">
                                <div class="filter-group-title">Categoría</div>
                                ${categories.map(cat => `
                                    <div class="filter-option ${activeFilters.category && activeFilters.category.toLowerCase() === cat.toLowerCase() ? "active" : ""}" data-filter-category="${cat}">
                                        <div class="filter-checkbox"></div>
                                        <span>${cat}</span>
                                    </div>
                                `).join("")}
                            </div>
                            ${hasActiveFilters ? `
                                <button class="btn btn-danger-outline btn-sm" id="clear-filters" style="width:100%">Limpiar filtros</button>
                            ` : ""}
                        </aside>
                        <div>
                            <div class="catalog-toolbar">
                                <span class="catalog-count">Mostrando <strong style="color:var(--accent);">${filteredProducts.length}</strong> zapatillas</span>
                            </div>
                            <div class="products-grid">
                                ${filteredProducts.length > 0
                                    ? filteredProducts.map(p => renderProductCard(p)).join("")
                                    : `<div style="grid-column:1/-1;text-align:center;padding:80px 20px;background:var(--bg-card);border:1px dashed var(--border-color);border-radius:var(--radius-lg);">
                                        <div style="font-size:3rem;margin-bottom:12px;">👟</div>
                                        <h3 style="font-size:1.2rem;font-weight:800;text-transform:uppercase;color:var(--text-primary);margin-bottom:6px;">No se encontraron resultados</h3>
                                        <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:16px;">Prueba cambiando los filtros de marca o categoría.</p>
                                        <button class="btn btn-primary btn-sm" id="empty-clear-btn">Restablecer filtros</button>
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
                    const brandVal = el.dataset.filterBrand;
                    activeFilters.brand = (activeFilters.brand && activeFilters.brand.toLowerCase() === brandVal.toLowerCase()) ? null : brandVal;
                    applyFilters();
                });
            });

            document.querySelectorAll("[data-filter-category]").forEach((el) => {
                el.addEventListener("click", () => {
                    const catVal = el.dataset.filterCategory;
                    activeFilters.category = (activeFilters.category && activeFilters.category.toLowerCase() === catVal.toLowerCase()) ? null : catVal;
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
                    }, 250);
                });
            }

            const clearFilterAction = () => {
                activeFilters = { brand: null, category: null, search: "" };
                applyFilters();
            };

            document.getElementById("clear-filters")?.addEventListener("click", clearFilterAction);
            document.getElementById("clear-filters-top")?.addEventListener("click", clearFilterAction);
            document.getElementById("empty-clear-btn")?.addEventListener("click", clearFilterAction);

            document.getElementById("remove-brand-filter")?.addEventListener("click", () => {
                activeFilters.brand = null;
                applyFilters();
            });
            document.getElementById("remove-cat-filter")?.addEventListener("click", () => {
                activeFilters.category = null;
                applyFilters();
            });
            document.getElementById("remove-search-filter")?.addEventListener("click", () => {
                activeFilters.search = "";
                applyFilters();
            });
        }

        function applyFilters() {
            filteredProducts = products.filter((p) => {
                if (activeFilters.brand && p.brand.toLowerCase() !== activeFilters.brand.toLowerCase()) return false;
                if (activeFilters.category && p.category.toLowerCase() !== activeFilters.category.toLowerCase()) return false;
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
