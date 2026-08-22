import { navigate } from "../router.js";
import { getCart } from "./cart.js";
import { store } from "../main.js";

export function renderNavbar() {
    const cartItems = getCart();
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const user = store.user;

    return `
    <header id="main-header">
        <div class="container header-inner">
            <a class="logo" data-link="/">Click&Buy</a>
            <nav class="nav-links">
                <a class="nav-link" data-link="/">Inicio</a>
                <a class="nav-link" data-link="/catalog">Catálogo</a>
            </nav>
            <div class="nav-actions">
                ${user ? `
                    <span style="font-size:0.85rem;color:var(--text-secondary)">Hola, ${user.name.split(" ")[0]}</span>
                    <button class="nav-icon-btn" id="logout-btn" title="Cerrar sesión">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                    </button>
                ` : `
                    <a class="nav-icon-btn" data-link="/login" title="Iniciar sesión">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                    </a>
                `}
                <button class="nav-icon-btn" id="cart-toggle-btn" title="Carrito">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                    ${cartCount > 0 ? `<span class="cart-count">${cartCount}</span>` : ""}
                </button>
                <button class="mobile-menu-btn" id="mobile-menu-toggle">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                </button>
            </div>
        </div>
    </header>`;
}

export function initNavbar() {
    const header = document.getElementById("main-header");

    window.addEventListener("scroll", () => {
        if (window.scrollY > 20) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    });

    document.querySelectorAll("[data-link]").forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            navigate(link.dataset.link);
        });
    });

    const hash = window.location.hash.slice(1) || "/";
    document.querySelectorAll(".nav-link").forEach((link) => {
        if (link.dataset.link === hash) {
            link.classList.add("active");
        }
    });
}
