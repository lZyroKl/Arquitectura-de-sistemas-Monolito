import { api } from "../api.js";
import { store, refreshApp } from "../main.js";
import { navigate } from "../router.js";
import { showToast } from "../components/cart.js";

export async function renderLogin(container) {
    let isLogin = true;
    let error = "";

    function render() {
        container.innerHTML = `
            <section class="auth-page">
                <div class="glass-card auth-card">
                    <h1 class="auth-title">${isLogin ? "Bienvenido" : "Crear cuenta"}</h1>
                    <p class="auth-subtitle">${isLogin ? "Inicia sesión en tu cuenta" : "Regístrate para empezar a comprar"}</p>

                    ${error ? `<div class="alert-msg error">${error}</div>` : ""}

                    <form id="auth-form">
                        ${!isLogin ? `
                            <div class="form-group">
                                <label class="form-label" for="name-input">Nombre completo</label>
                                <input type="text" class="input-field" id="name-input" placeholder="Tu nombre" required />
                            </div>
                        ` : ""}
                        <div class="form-group">
                            <label class="form-label" for="email-input">Email</label>
                            <input type="email" class="input-field" id="email-input" placeholder="tu@email.com" required />
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="password-input">Contraseña</label>
                            <input type="password" class="input-field" id="password-input" placeholder="••••••••" required minlength="4" />
                        </div>
                        <button type="submit" class="btn btn-primary btn-lg" style="width:100%;" id="auth-submit-btn">
                            ${isLogin ? "Iniciar sesión" : "Crear cuenta"}
                        </button>
                    </form>

                    <div class="auth-toggle">
                        ${isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
                        <a id="toggle-auth">${isLogin ? "Regístrate" : "Inicia sesión"}</a>
                    </div>
                </div>
            </section>
        `;

        document.getElementById("toggle-auth").addEventListener("click", () => {
            isLogin = !isLogin;
            error = "";
            render();
        });

        document.getElementById("auth-form").addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("email-input").value;
            const password = document.getElementById("password-input").value;

            try {
                let user;
                if (isLogin) {
                    user = await api.login(email, password);
                } else {
                    const name = document.getElementById("name-input").value;
                    user = await api.register(name, email, password);
                }

                store.user = user;
                showToast(`Bienvenido, ${user.name}!`);
                refreshApp();
                navigate("/");
            } catch (err) {
                error = err.message;
                render();
            }
        });
    }

    render();
}
