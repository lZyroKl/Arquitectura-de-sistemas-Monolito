import { navigate } from "../router.js";
import { getCart } from "./cart.js";
import { store } from "../main.js";
import { getTheme, toggleTheme } from "../theme.js";

export function renderNavbar() {
    const cartItems = getCart();
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const user = store.user;
    const isDark = getTheme() === "dark";

    return `
    <div class="top-bar">
        <div class="container top-bar-inner">
            <div class="top-bar-items">
                <div class="top-bar-item">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V3.75a1.125 1.125 0 00-1.125-1.125h-9A1.125 1.125 0 003 3.75v10.5m11.25-6.75H18" /></svg>
                    <span>LLEGASTE AL SITIO OFICIAL DE CLICK&BUY</span>
                </div>
                <div class="top-bar-item">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>100% ORIGINALES GARANTIZADOS</span>
                </div>
            </div>
            <div>
                <span class="top-bar-highlight">DESPACHO GRATIS SOBRE $69.990</span>
            </div>
        </div>
    </div>
    <header id="main-header">
        <div class="container header-inner">
            <a class="logo" data-link="/">Click<span class="logo-dot">&</span>Buy</a>
            <nav class="nav-links">
                <a class="nav-link" data-link="/">Inicio</a>
                <a class="nav-link" data-link="/catalog">Catálogo</a>
            </nav>
            <div class="nav-actions">
                <button class="nav-icon-btn theme-toggle-btn" id="theme-toggle" title="${isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}">
                    ${isDark ? `
                        <!-- Sun icon -->
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
                    ` : `
                        <!-- Moon icon -->
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
                    `}
                </button>
                ${user ? `
                    <span style="font-size:0.85rem;color:var(--text-secondary);font-weight:600;">Hola, ${user.name.split(" ")[0]}</span>
                    <button class="nav-icon-btn" id="logout-btn" title="Cerrar sesión">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                    </button>
                ` : `
                    <a class="nav-icon-btn" data-link="/login" title="Iniciar sesión">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                    </a>
                `}
                <button class="nav-icon-btn" id="cart-toggle-btn" title="Carrito">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                    ${cartCount > 0 ? `<span class="cart-count">${cartCount}</span>` : ""}
                </button>
                <button class="mobile-menu-btn" id="mobile-menu-toggle">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
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

    const themeToggleBtn = document.getElementById("theme-toggle");
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            const next = toggleTheme();
            themeToggleBtn.title = next === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
            themeToggleBtn.innerHTML = next === "dark"
                ? `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>`;
        });
    }

    const updateActiveNav = () => {
        const path = (window.location.hash.slice(1) || "/").split("?")[0];
        document.querySelectorAll(".nav-link").forEach((link) => {
            if (link.dataset.link === path) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });
    };

    window.addEventListener("hashchange", updateActiveNav);
    updateActiveNav();
}
