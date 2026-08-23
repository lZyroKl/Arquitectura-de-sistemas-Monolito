import { api } from "../api.js";
import { store, refreshApp } from "../main.js";
import { navigate } from "../router.js";
import { showToast } from "../components/cart.js";

export async function renderLogin(container) {
    if (store.user) {
        navigate("/account");
        return;
    }

    let isLogin = true;
    let error = "";
    let isLoading = false;

    function render() {
        container.innerHTML = `
            <section class="auth-page">
                <div class="container" style="max-width:480px;">
                    <div class="glass-card auth-card">
                        
                        <!-- Tabs -->
                        <div class="auth-tabs">
                            <button class="auth-tab ${isLogin ? 'active' : ''}" id="tab-login">
                                Iniciar Sesión
                            </button>
                            <button class="auth-tab ${!isLogin ? 'active' : ''}" id="tab-register">
                                Crear Cuenta
                            </button>
                        </div>

                        <div class="auth-header">
                            <h1 class="auth-title">${isLogin ? "Bienvenido de vuelta" : "Crear Nueva Cuenta"}</h1>
                            <p class="auth-subtitle">
                                ${isLogin 
                                    ? "Ingresa a tu cuenta para gestionar tus compras y pedidos" 
                                    : "Regístrate para comprar y acceder a lanzamientos exclusivos"}
                            </p>
                        </div>

                        <!-- Botón de Acceso Rápido / Demo Destacado Arriba -->
                        <div class="auth-demo-banner">
                            <div class="auth-demo-banner-content">
                                <div class="auth-demo-badge">Cuenta de Prueba</div>
                                <div class="auth-demo-email">demo@clickandbuy.cl</div>
                            </div>
                            <button type="button" class="btn btn-secondary btn-sm" id="quick-demo-btn">
                                ⚡ Iniciar con Demo
                            </button>
                        </div>

                        ${error ? `<div class="alert-msg error">${error}</div>` : ""}

                        <form id="auth-form">
                            ${!isLogin ? `
                                <div class="form-group">
                                    <label class="form-label" for="name-input">Nombre Completo *</label>
                                    <input type="text" class="input-field" id="name-input" placeholder="Ej: Daniel Silva" required />
                                </div>
                            ` : ""}

                            <div class="form-group">
                                <label class="form-label" for="email-input">Correo Electrónico *</label>
                                <input type="email" class="input-field" id="email-input" placeholder="tu@email.com" required />
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="password-input">Contraseña *</label>
                                <input type="password" class="input-field" id="password-input" placeholder="••••••••" required minlength="4" />
                            </div>

                            ${!isLogin ? `
                                <div class="form-group">
                                    <label class="form-label" for="password-confirm-input">Confirmar Contraseña *</label>
                                    <input type="password" class="input-field" id="password-confirm-input" placeholder="••••••••" required minlength="4" />
                                </div>
                            ` : ""}

                            <button type="submit" class="btn btn-primary btn-lg" style="width:100%;" id="auth-submit-btn" ${isLoading ? 'disabled' : ''}>
                                ${isLoading 
                                    ? `<span class="spinner" style="width:18px;height:18px;border-width:2px;display:inline-block;margin-right:8px;"></span> ${isLogin ? 'Iniciando sesión...' : 'Creando cuenta...'}` 
                                    : (isLogin ? "Iniciar Sesión" : "Crear mi Cuenta")}
                            </button>
                        </form>

                        <div class="auth-toggle">
                            ${isLogin ? "¿Aún no tienes cuenta?" : "¿Ya tienes una cuenta?"}
                            <a id="toggle-auth-link">${isLogin ? "Regístrate aquí" : "Inicia sesión aquí"}</a>
                        </div>
                    </div>
                </div>
            </section>
        `;

        document.getElementById("tab-login")?.addEventListener("click", () => {
            if (!isLogin) {
                isLogin = true;
                error = "";
                render();
            }
        });

        document.getElementById("tab-register")?.addEventListener("click", () => {
            if (isLogin) {
                isLogin = false;
                error = "";
                render();
            }
        });

        document.getElementById("toggle-auth-link")?.addEventListener("click", () => {
            isLogin = !isLogin;
            error = "";
            render();
        });

        // 1-Click Fast Login with Demo Account
        document.getElementById("quick-demo-btn")?.addEventListener("click", async () => {
            isLoading = true;
            render();

            try {
                const user = await api.login("demo@clickandbuy.cl", "demo1234");
                store.user = user;
                showToast(`¡Bienvenido de vuelta, ${user.name}! (Demo)`);
                refreshApp();
                navigate("/account");
            } catch (err) {
                isLoading = false;
                error = "Error al iniciar con cuenta demo: " + err.message;
                render();
            }
        });

        document.getElementById("auth-form")?.addEventListener("submit", async (e) => {
            e.preventDefault();
            error = "";

            const email = document.getElementById("email-input").value.trim();
            const password = document.getElementById("password-input").value;

            if (!isLogin) {
                const name = document.getElementById("name-input").value.trim();
                const confirmPassword = document.getElementById("password-confirm-input").value;

                if (password !== confirmPassword) {
                    error = "Las contraseñas no coinciden";
                    render();
                    return;
                }

                if (name.length < 2) {
                    error = "Por favor ingresa un nombre válido";
                    render();
                    return;
                }

                isLoading = true;
                render();

                try {
                    const user = await api.register(name, email, password);
                    store.user = user;
                    showToast(`¡Cuenta creada con éxito! Bienvenido, ${user.name}!`);
                    refreshApp();
                    navigate("/account");
                } catch (err) {
                    isLoading = false;
                    error = err.message || "Error al crear la cuenta";
                    render();
                }
            } else {
                isLoading = true;
                render();

                try {
                    const user = await api.login(email, password);
                    store.user = user;
                    showToast(`¡Bienvenido de vuelta, ${user.name}!`);
                    refreshApp();
                    navigate("/account");
                } catch (err) {
                    isLoading = false;
                    error = err.message || "Credenciales incorrectas";
                    render();
                }
            }
        });
    }

    render();
}
