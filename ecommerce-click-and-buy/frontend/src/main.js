import "./style.css";
import { route, startRouter, navigate } from "./router.js";
import { renderNavbar, initNavbar } from "./components/navbar.js";
import { renderFooter } from "./components/footer.js";
import { renderCartDrawer, initCartDrawer } from "./components/cart.js";
import { renderHome } from "./pages/home.js";
import { renderCatalog } from "./pages/catalog.js";
import { renderProduct } from "./pages/product.js";
import { renderLogin } from "./pages/login.js";
import { renderCheckout } from "./pages/checkout.js";
import { api } from "./api.js";
import { initTheme } from "./theme.js";

export const store = {
    user: null,
};

export function refreshApp() {
    const app = document.getElementById("app");
    const mainContent = document.querySelector("main")?.innerHTML || "";

    app.innerHTML = `
        ${renderNavbar()}
        <main>${mainContent}</main>
        ${renderCartDrawer()}
        ${renderFooter()}
    `;

    initNavbar();
    initCartDrawer();

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                await api.logout();
            } catch {}
            store.user = null;
            refreshApp();
            navigate("/");
        });
    }

    document.querySelectorAll("footer [data-link]").forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            navigate(link.dataset.link);
        });
    });
}

async function init() {
    initTheme();
    try {
        const user = await api.getMe();
        store.user = user;
    } catch {}

    route("/", renderHome);
    route("/catalog", renderCatalog);
    route("/product/:id", renderProduct);
    route("/login", renderLogin);
    route("/checkout", renderCheckout);

    const app = document.getElementById("app");
    app.innerHTML = `
        ${renderNavbar()}
        <main></main>
        ${renderCartDrawer()}
        ${renderFooter()}
    `;

    initNavbar();
    initCartDrawer();

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                await api.logout();
            } catch {}
            store.user = null;
            refreshApp();
            navigate("/");
        });
    }

    document.querySelectorAll("footer [data-link]").forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            navigate(link.dataset.link);
        });
    });

    startRouter();
}

init();
