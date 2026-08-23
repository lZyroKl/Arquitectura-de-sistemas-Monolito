import { api } from "../api.js";
import { renderProductCard, initProductCards } from "../components/product-card.js";
import { navigate } from "../router.js";

export async function renderHome(container) {
    container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

    try {
        const [products, brands] = await Promise.all([
            api.getProducts(),
            api.getBrands(),
        ]);
        const featured = products.slice(0, 8);

        const categories = [
            { name: "Running", icon: "🏃", count: products.filter(p => p.category === "Running").length },
            { name: "Casual", icon: "👟", count: products.filter(p => p.category === "Casual").length },
            { name: "Basketball", icon: "🏀", count: products.filter(p => p.category === "Basketball").length },
            { name: "Skate", icon: "🛹", count: products.filter(p => p.category === "Skate").length },
            { name: "Lifestyle", icon: "✨", count: products.filter(p => p.category === "Lifestyle").length },
        ].filter(c => c.count > 0);

        container.innerHTML = `
            <section class="hero">
                <div class="container hero-content">
                    <div class="hero-badge">🔥 Nueva Colección 2026</div>
                    <h1>Tu próximo paso<br>empieza <span>aquí</span></h1>
                    <p>Descubre las zapatillas más exclusivas de las mejores marcas del mundo. Estilo, confort y rendimiento en cada paso.</p>
                    <div class="hero-buttons">
                        <button class="btn btn-primary btn-lg" id="hero-shop-btn">Explorar catálogo</button>
                        <button class="btn btn-secondary btn-lg" id="hero-brands-btn">Ver marcas</button>
                    </div>
                    <div class="hero-stats">
                        <div class="hero-stat">
                            <div class="hero-stat-value">${products.length}+</div>
                            <div class="hero-stat-label">Productos</div>
                        </div>
                        <div class="hero-stat">
                            <div class="hero-stat-value">${brands.length}</div>
                            <div class="hero-stat-label">Marcas</div>
                        </div>
                        <div class="hero-stat">
                            <div class="hero-stat-value">100%</div>
                            <div class="hero-stat-label">Originales</div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="brands-section">
                <div class="container">
                    <div class="section-header">
                        <div>
                            <h2 class="section-title">Marcas</h2>
                            <p class="section-subtitle">Las mejores marcas del mundo en un solo lugar</p>
                        </div>
                    </div>
                    <div class="brands-grid">
                        ${brands.map(brand => `
                            <div class="glass-card brand-card" data-brand="${brand}">
                                <div class="brand-name">${brand}</div>
                                <div class="brand-count">${products.filter(p => p.brand === brand).length} modelos</div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            </section>

            <section class="categories-section">
                <div class="container">
                    <div class="section-header">
                        <div>
                            <h2 class="section-title">Categorías</h2>
                            <p class="section-subtitle">Encuentra tu estilo perfecto</p>
                        </div>
                    </div>
                    <div class="categories-grid">
                        ${categories.map(cat => `
                            <div class="glass-card category-card" data-category="${cat.name}">
                                <div class="category-icon">${cat.icon}</div>
                                <div class="category-name">${cat.name}</div>
                                <div class="category-count">${cat.count} productos</div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            </section>

            <section class="products-section">
                <div class="container">
                    <div class="section-header">
                        <div>
                            <h2 class="section-title">Productos destacados</h2>
                            <p class="section-subtitle">Los más populares de nuestra tienda</p>
                        </div>
                        <button class="btn btn-secondary" id="see-all-btn">Ver todos</button>
                    </div>
                    <div class="products-grid">
                        ${featured.map(p => renderProductCard(p)).join("")}
                    </div>
                </div>
            </section>
        `;

        initProductCards();

        document.getElementById("hero-shop-btn").addEventListener("click", () => navigate("/catalog"));
        document.getElementById("hero-brands-btn").addEventListener("click", () => {
            document.querySelector(".brands-section")?.scrollIntoView({ behavior: "smooth" });
        });
        document.getElementById("see-all-btn").addEventListener("click", () => navigate("/catalog"));

        document.querySelectorAll("[data-category]").forEach((card) => {
            card.addEventListener("click", () => {
                navigate(`/catalog?category=${card.dataset.category}`);
            });
        });

        document.querySelectorAll("[data-brand]").forEach((card) => {
            card.addEventListener("click", () => {
                navigate(`/catalog?brand=${card.dataset.brand}`);
            });
        });

    } catch (err) {
        container.innerHTML = `
            <div class="container" style="text-align:center;padding:100px 0;">
                <h2 class="section-title">Error</h2>
                <p class="section-subtitle" style="margin:0 auto;">No se pudieron cargar los productos. Asegúrate de que el backend esté corriendo.</p>
            </div>
        `;
    }
}
