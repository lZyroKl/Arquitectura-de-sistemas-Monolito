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

        // Find representative sneaker images for slides
        const jordanSneaker = products.find(p => p.brand === "Air Jordan") || products[0];
        const nikeSneaker = products.find(p => p.brand === "Nike" && p.image_url) || products[1];
        const adidasSneaker = products.find(p => p.brand === "adidas" && p.image_url) || products[2];
        const nbSneaker = products.find(p => p.brand === "New Balance" && p.image_url) || products[3];
        const converseSneaker = products.find(p => p.brand === "Converse" && p.image_url) || products[4];

        const slides = [
            {
                tag: "🔥 Colección Limitada 2026",
                title: "Air Jordan <span>Retro Series</span>",
                subtitle: "Los modelos más codiciados de la cultura urbana y streetwear mundial.",
                brand: "Air Jordan",
                link: "/catalog?brand=Air%20Jordan",
                btnText: "Explorar Air Jordan",
                image: jordanSneaker?.image_url,
                name: jordanSneaker?.name || "Air Jordan High"
            },
            {
                tag: "⚡ Top en Tendencia",
                title: "Nike Dunk & <span>Air Force</span>",
                subtitle: "Siluetas legendarias, máxima durabilidad y estilo sin límites.",
                brand: "Nike",
                link: "/catalog?brand=Nike",
                btnText: "Ver Colección Nike",
                image: nikeSneaker?.image_url,
                name: nikeSneaker?.name || "Nike Dunk Low"
            },
            {
                tag: "👟 Herencia Urbana",
                title: "Adidas <span>Originals</span>",
                subtitle: "Los clásicos atemporales que dominan las calles en todo el mundo.",
                brand: "adidas",
                link: "/catalog?brand=adidas",
                btnText: "Descubrir Adidas",
                image: adidasSneaker?.image_url,
                name: adidasSneaker?.name || "Adidas Samba OG"
            },
            {
                tag: "✨ Confort Premium",
                title: "New Balance <span>Heritage</span>",
                subtitle: "La perfecta combinación entre estética retro y amortiguación superior.",
                brand: "New Balance",
                link: "/catalog?brand=New%20Balance",
                btnText: "Ver New Balance",
                image: nbSneaker?.image_url,
                name: nbSneaker?.name || "New Balance 550"
            },
            {
                tag: "🌟 Iconos del Estilo",
                title: "Converse <span>Special Drops</span>",
                subtitle: "Siluetas legendarias con colaboraciones y colores exclusivos.",
                brand: "Converse",
                link: "/catalog?brand=Converse",
                btnText: "Ver Converse",
                image: converseSneaker?.image_url,
                name: converseSneaker?.name || "Converse Chuck Taylor"
            },
        ];

        const categories = [
            { name: "Running", icon: "🏃", count: products.filter(p => p.category === "Running").length },
            { name: "Casual", icon: "👟", count: products.filter(p => p.category === "Casual").length },
            { name: "Basketball", icon: "🏀", count: products.filter(p => p.category === "Basketball").length },
            { name: "Skate", icon: "🛹", count: products.filter(p => p.category === "Skate").length },
            { name: "Lifestyle", icon: "✨", count: products.filter(p => p.category === "Lifestyle").length },
        ].filter(c => c.count > 0);

        container.innerHTML = `
            <!-- Block Store Style Hero Carousel -->
            <section class="hero-carousel" id="hero-carousel">
                <div class="carousel-track-container">
                    ${slides.map((slide, index) => `
                        <div class="carousel-slide ${index === 0 ? 'active' : ''}" data-slide-index="${index}">
                            <div class="container carousel-slide-inner">
                                <div class="slide-content">
                                    <div class="slide-tag">${slide.tag}</div>
                                    <h1 class="slide-title">${slide.title}</h1>
                                    <p class="slide-subtitle">${slide.subtitle}</p>
                                    <div class="slide-btn-group">
                                        <button class="btn btn-primary btn-lg carousel-cta-btn" data-link="${slide.link}">
                                            ${slide.btnText}
                                        </button>
                                        <button class="btn btn-secondary btn-lg" data-link="/catalog">
                                            Ver Todo
                                        </button>
                                    </div>
                                </div>
                                <div class="slide-image-wrapper">
                                    <div class="slide-image-backdrop"></div>
                                    <img src="${slide.image}" alt="${slide.name}" class="slide-image" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 500 500%22><rect fill=%22%231e293b%22 width=%22500%22 height=%22500%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%2394a3b8%22 font-size=%2260%22 text-anchor=%22middle%22 dy=%22.3em%22>👟</text></svg>'" />
                                </div>
                            </div>
                        </div>
                    `).join("")}
                </div>

                <button class="carousel-arrow prev" id="carousel-prev" title="Anterior">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                </button>
                <button class="carousel-arrow next" id="carousel-next" title="Siguiente">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </button>

                <div class="carousel-dots">
                    ${slides.map((_, index) => `
                        <button class="carousel-dot ${index === 0 ? 'active' : ''}" data-dot-index="${index}" title="Slide ${index + 1}"></button>
                    `).join("")}
                </div>
            </section>

            <!-- Brand Ribbon / Ticker (Block Store Style) -->
            <section class="brands-ribbon">
                <div class="container">
                    <div class="brands-ribbon-inner">
                        ${brands.map(brand => `
                            <div class="ribbon-brand-item" data-brand="${brand}">
                                <span>${brand}</span>
                            </div>
                        `).join("")}
                    </div>
                </div>
            </section>

            <!-- Section Marcas -->
            <section class="brands-section">
                <div class="container">
                    <div class="section-header">
                        <div>
                            <h2 class="section-title">Nuestras <span>Marcas</span></h2>
                            <p class="section-subtitle">Las mejores marcas oficiales y más codiciadas en un solo lugar</p>
                        </div>
                        <button class="btn btn-secondary btn-sm" id="see-brands-catalog-btn">Ver Catálogo Completo</button>
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

            <!-- Section Categorías -->
            <section class="categories-section">
                <div class="container">
                    <div class="section-header">
                        <div>
                            <h2 class="section-title">Comprar por <span>Categoría</span></h2>
                            <p class="section-subtitle">Encuentra el par ideal para tu estilo y rendimiento</p>
                        </div>
                    </div>
                    <div class="categories-grid">
                        ${categories.map(cat => `
                            <div class="glass-card category-card" data-category="${cat.name}">
                                <div class="category-icon">${cat.icon}</div>
                                <div class="category-name">${cat.name}</div>
                                <div class="category-count">${cat.count} productos disponibles</div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            </section>

            <!-- Section Productos Destacados -->
            <section class="products-section">
                <div class="container">
                    <div class="section-header">
                        <div>
                            <h2 class="section-title">Lo último en <span>Click&Buy</span></h2>
                            <p class="section-subtitle">Novedades y zapatillas más destacadas del momento</p>
                        </div>
                        <button class="btn btn-primary" id="see-all-btn">Ver todos los productos</button>
                    </div>
                    <div class="products-grid">
                        ${featured.map(p => renderProductCard(p)).join("")}
                    </div>
                </div>
            </section>
        `;

        initProductCards();

        // Carousel Slider Logic (Looping Auto-Play)
        let currentSlide = 0;
        const totalSlides = slides.length;
        const slideElements = container.querySelectorAll(".carousel-slide");
        const dotElements = container.querySelectorAll(".carousel-dot");
        let autoPlayTimer = null;

        function goToSlide(index) {
            currentSlide = (index + totalSlides) % totalSlides;
            slideElements.forEach((s, idx) => {
                s.classList.toggle("active", idx === currentSlide);
            });
            dotElements.forEach((d, idx) => {
                d.classList.toggle("active", idx === currentSlide);
            });
        }

        function nextSlide() {
            goToSlide(currentSlide + 1);
        }

        function prevSlide() {
            goToSlide(currentSlide - 1);
        }

        function startAutoPlay() {
            stopAutoPlay();
            autoPlayTimer = setInterval(nextSlide, 4500);
        }

        function stopAutoPlay() {
            if (autoPlayTimer) {
                clearInterval(autoPlayTimer);
                autoPlayTimer = null;
            }
        }

        const prevBtn = document.getElementById("carousel-prev");
        const nextBtn = document.getElementById("carousel-next");
        const carouselContainer = document.getElementById("hero-carousel");

        if (prevBtn) {
            prevBtn.addEventListener("click", () => {
                prevSlide();
                startAutoPlay();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener("click", () => {
                nextSlide();
                startAutoPlay();
            });
        }

        dotElements.forEach((dot) => {
            dot.addEventListener("click", () => {
                const idx = parseInt(dot.dataset.dotIndex);
                goToSlide(idx);
                startAutoPlay();
            });
        });

        if (carouselContainer) {
            carouselContainer.addEventListener("mouseenter", stopAutoPlay);
            carouselContainer.addEventListener("mouseleave", startAutoPlay);
        }

        startAutoPlay();

        // CTA Links in Carousel
        container.querySelectorAll(".carousel-cta-btn, [data-link]").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const link = btn.dataset.link;
                if (link) {
                    e.preventDefault();
                    navigate(link);
                }
            });
        });

        document.getElementById("see-all-btn")?.addEventListener("click", () => navigate("/catalog"));
        document.getElementById("see-brands-catalog-btn")?.addEventListener("click", () => navigate("/catalog"));

        document.querySelectorAll("[data-category]").forEach((card) => {
            card.addEventListener("click", () => {
                navigate(`/catalog?category=${encodeURIComponent(card.dataset.category)}`);
            });
        });

        document.querySelectorAll("[data-brand]").forEach((card) => {
            card.addEventListener("click", () => {
                navigate(`/catalog?brand=${encodeURIComponent(card.dataset.brand)}`);
            });
        });

        return () => {
            stopAutoPlay();
        };

    } catch (err) {
        container.innerHTML = `
            <div class="container" style="text-align:center;padding:100px 0;">
                <h2 class="section-title">Error</h2>
                <p class="section-subtitle" style="margin:0 auto;">No se pudieron cargar los productos. Asegúrate de que el backend esté corriendo.</p>
            </div>
        `;
    }
}
