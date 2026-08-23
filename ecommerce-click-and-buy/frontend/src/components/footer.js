export function renderFooter() {
    return `
    <footer>
        <div class="container">
            <div class="footer-grid">
                <div>
                    <div class="footer-brand">Click<span class="logo-dot" style="color:var(--accent);">&</span>Buy</div>
                    <p class="footer-desc">Tu destino premium para las zapatillas más exclusivas. Las mejores marcas, los mejores precios.</p>
                </div>
                <div>
                    <div class="footer-col-title">Tienda</div>
                    <a class="footer-link" data-link="/catalog">Catálogo</a>
                    <a class="footer-link">Novedades</a>
                    <a class="footer-link">Ofertas</a>
                </div>
                <div>
                    <div class="footer-col-title">Marcas</div>
                    <a class="footer-link" data-link="/catalog?brand=Nike">Nike</a>
                    <a class="footer-link" data-link="/catalog?brand=adidas">Adidas</a>
                    <a class="footer-link" data-link="/catalog?brand=Puma">Puma</a>
                    <a class="footer-link" data-link="/catalog?brand=New Balance">New Balance</a>
                </div>
                <div>
                    <div class="footer-col-title">Soporte</div>
                    <a class="footer-link">Contacto</a>
                    <a class="footer-link">Envíos</a>
                    <a class="footer-link">Devoluciones</a>
                    <a class="footer-link">FAQ</a>
                </div>
            </div>
            <div class="footer-bottom">
                © 2026 Click&Buy. Todos los derechos reservados.
            </div>
        </div>
    </footer>`;
}
